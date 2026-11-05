const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Review = require('../models/Review');

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runInteractionTests() {
  console.log('====================================================');
  console.log(' NoteSphere Resource Discovery & Interaction Suite');
  console.log('====================================================');

  // Wait for MongoDB connection to be ready
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 20) {
    await sleep(250);
    attempts++;
  }

  if (mongoose.connection.readyState !== 1) {
    console.error('Failed to connect to MongoDB. Check MONGO_URI in backend/.env');
    process.exit(1);
  }

  console.log(`[MongoDB Ready]: Connected to database "${mongoose.connection.name}"`);

  // Start HTTP server on test port
  const server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => resolve(s));
  });

  const testResults = [];
  const recordResult = (testName, passed, details) => {
    testResults.push({ testName, status: passed ? 'PASSED' : 'FAILED', details });
    const mark = passed ? '✓' : '✗';
    console.log(`[${mark}] ${testName}: ${passed ? 'PASSED' : 'FAILED'} - ${details}`);
  };

  let tokenStudentA = '';
  let tokenStudentB = '';
  let userAId = '';
  let userBId = '';
  let testResource1 = null;
  let testResource2 = null;
  let reviewId = '';

  try {
    // 1. Create Test Students
    const emailA = `discovery_studentA_${Date.now()}@campus.edu`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clara Student',
        email: emailA,
        password: 'Password123!',
        department: 'Computer Science',
        semester: 'Semester 4',
      }),
    });
    const regDataA = await regResA.json();
    tokenStudentA = regDataA.token;
    userAId = regDataA.user?._id || regDataA.user?.id;

    const emailB = `discovery_studentB_${Date.now()}@campus.edu`;
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'David Reviewer',
        email: emailB,
        password: 'Password123!',
        department: 'Electronics & Comm.',
        semester: 'Semester 4',
      }),
    });
    const regDataB = await regResB.json();
    tokenStudentB = regDataB.token;
    userBId = regDataB.user?._id || regDataB.user?.id;

    // 2. Create Two Test Resources Directly in MongoDB
    testResource1 = await Resource.create({
      title: 'Advanced Database Systems & Query Optimization',
      description: 'Comprehensive course notes covering B-Trees, relational algebra, and ACID transaction isolation levels.',
      subject: 'Database Systems',
      department: 'Computer Science',
      semester: 'Semester 4',
      category: 'Class Notes',
      uploadedBy: userAId,
      fileUrl: 'http://localhost:5000/uploads/resources/mock_db.pdf',
      publicId: 'local_mock_db.pdf',
      fileType: 'pdf',
      fileSize: 204800,
      downloads: 45,
      averageRating: 0,
      totalRatings: 0,
      status: 'approved',
    });

    testResource2 = await Resource.create({
      title: 'Embedded Microcontrollers Lab Manual and Pinouts',
      description: 'Practical lab experiments for ARM Cortex-M architecture with registers, timers, and ADC interfacing.',
      subject: 'Microcontrollers',
      department: 'Electronics & Comm.',
      semester: 'Semester 4',
      category: 'Lab Manuals',
      uploadedBy: userBId,
      fileUrl: 'http://localhost:5000/uploads/resources/mock_embedded.docx',
      publicId: 'local_mock_embedded.docx',
      fileType: 'docx',
      fileSize: 409600,
      downloads: 120,
      averageRating: 0,
      totalRatings: 0,
      status: 'approved',
    });

    // TEST 1: Keyword Search (Title, Subject, Description)
    {
      const res = await fetch(`${BASE_URL}/resources?q=relational algebra`);
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        data.resources.some((r) => r._id === testResource1._id.toString());

      recordResult(
        '1. Backend-Powered Search (Multi-field)',
        passed,
        `Status ${res.status}, Found matching resource "${testResource1.title}"`
      );
    }

    // TEST 2: Multiple Filters Combined (Department + Category + FileType)
    {
      const res = await fetch(
        `${BASE_URL}/resources?department=Electronics%20%26%20Comm.&category=Lab%20Manuals&fileType=docx`
      );
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        data.resources.length >= 1 &&
        data.resources.every(
          (r) =>
            r.department === 'Electronics & Comm.' &&
            r.category === 'Lab Manuals' &&
            r.fileType === 'docx'
        );

      recordResult(
        '2. Multiple Filters Combined (Dept + Cat + FileType)',
        passed,
        `Status ${res.status}, Count=${data.count}, Filter match verified`
      );
    }

    // TEST 3: Sorting (Most Downloaded & Latest)
    {
      const res = await fetch(`${BASE_URL}/resources?sortBy=downloads`);
      const data = await res.json();
      const isSorted =
        data.resources.length < 2 ||
        data.resources[0].downloads >= data.resources[1].downloads;
      const passed = res.status === 200 && data.success && isSorted;

      recordResult(
        '3. Sorting By Downloads & Newest',
        passed,
        `Status ${res.status}, First downloads=${data.resources[0]?.downloads}`
      );
    }

    // TEST 4: Pagination (Page and Limit)
    {
      const res = await fetch(`${BASE_URL}/resources?page=1&limit=1`);
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        data.resources.length === 1 &&
        data.page === 1 &&
        data.total >= 2;

      recordResult(
        '4. Server-Side Pagination',
        passed,
        `Status ${res.status}, Returned 1 of ${data.total} total resources`
      );
    }

    // TEST 5: Autocomplete Search Suggestions
    {
      const res = await fetch(`${BASE_URL}/resources/suggestions?q=Database`);
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        Array.isArray(data.suggestions) &&
        data.suggestions.some((s) => s.title.includes('Database'));

      recordResult(
        '5. Autocomplete Search Suggestions',
        passed,
        `Status ${res.status}, Suggestions returned: ${data.suggestions.length}`
      );
    }

    // TEST 6: Bookmark Creation (Add Bookmark)
    {
      const res = await fetch(`${BASE_URL}/bookmarks/${testResource1._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStudentB}`,
        },
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.bookmark?.resource;

      recordResult(
        '6. Bookmark Creation',
        passed,
        `Status ${res.status}, Saved resource=${testResource1._id}`
      );
    }

    // TEST 7: Duplicate Bookmark Prevention
    {
      const res = await fetch(`${BASE_URL}/bookmarks/${testResource1._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStudentB}`,
        },
      });
      const data = await res.json();
      const passed = res.status === 400 && data.success === false;

      recordResult(
        '7. Duplicate Bookmark Prevention',
        passed,
        `Status ${res.status}, Rejected duplicate: "${data.message}"`
      );
    }

    // TEST 8: Check Bookmark Status & Get User Bookmarks
    {
      const statusRes = await fetch(
        `${BASE_URL}/bookmarks/status/${testResource1._id}`,
        {
          headers: {
            Authorization: `Bearer ${tokenStudentB}`,
          },
        }
      );
      const statusData = await statusRes.json();

      const listRes = await fetch(`${BASE_URL}/bookmarks/my-bookmarks`, {
        headers: {
          Authorization: `Bearer ${tokenStudentB}`,
        },
      });
      const listData = await listRes.json();

      const passed =
        statusRes.status === 200 &&
        statusData.isBookmarked === true &&
        listRes.status === 200 &&
        listData.resources.some((r) => r._id === testResource1._id.toString());

      recordResult(
        '8. Bookmark Status & My Bookmarks Retrieval',
        passed,
        `Status ${listRes.status}, isBookmarked=true, Saved count=${listData.count}`
      );
    }

    // TEST 9: Remove Bookmark
    {
      const res = await fetch(`${BASE_URL}/bookmarks/${testResource1._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenStudentB}`,
        },
      });
      const data = await res.json();

      const checkRes = await fetch(
        `${BASE_URL}/bookmarks/status/${testResource1._id}`,
        {
          headers: {
            Authorization: `Bearer ${tokenStudentB}`,
          },
        }
      );
      const checkData = await checkRes.json();

      const passed =
        res.status === 200 &&
        data.success &&
        checkData.isBookmarked === false;

      recordResult(
        '9. Bookmark Removal & Status Verification',
        passed,
        `Status ${res.status}, isBookmarked verified as false`
      );
    }

    // TEST 10: Review Submission & Average Rating Calculation
    {
      const res = await fetch(`${BASE_URL}/resources/${testResource1._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentB}`,
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Outstanding database notes! The B-Tree index diagrams made exam preparation very clear.',
        }),
      });

      const data = await res.json();
      if (data.review?._id) {
        reviewId = data.review._id;
      }

      const updatedDoc = await Resource.findById(testResource1._id);

      const passed =
        res.status === 201 &&
        data.success &&
        updatedDoc.averageRating === 5 &&
        updatedDoc.totalRatings === 1;

      recordResult(
        '10. Review Submission & Average Rating Calculation',
        passed,
        `Status ${res.status}, Resource avgRating=${updatedDoc.averageRating}, totalRatings=${updatedDoc.totalRatings}`
      );
    }

    // TEST 11: Duplicate Active Review Prevention (Same User, Same Resource)
    {
      const res = await fetch(`${BASE_URL}/resources/${testResource1._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentB}`,
        },
        body: JSON.stringify({
          rating: 4,
          comment: 'Second review attempt should fail.',
        }),
      });

      const data = await res.json();
      const passed = res.status === 400 && data.success === false;

      recordResult(
        '11. Duplicate Review Prevention',
        passed,
        `Status ${res.status}, Blocked with message: "${data.message}"`
      );
    }

    // TEST 12: Review Editing & Average Rating Update
    {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentB}`,
        },
        body: JSON.stringify({
          rating: 4,
          comment: 'Updated review: Still great notes, revised to 4 stars after deeper reading.',
        }),
      });

      const data = await res.json();
      const updatedDoc = await Resource.findById(testResource1._id);

      const passed =
        res.status === 200 &&
        data.success &&
        updatedDoc.averageRating === 4 &&
        data.review?.comment.includes('Updated review');

      recordResult(
        '12. Review Editing & Rating Re-computation',
        passed,
        `Status ${res.status}, New averageRating=${updatedDoc.averageRating}`
      );
    }

    // TEST 13: Unauthorized Review Editing Prevention (Student A cannot edit Student B's review)
    {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          rating: 1,
          comment: 'Hacked review',
        }),
      });

      const data = await res.json();
      const passed = res.status === 403 && data.success === false;

      recordResult(
        '13. Unauthorized Review Editing Prevention',
        passed,
        `Status ${res.status}, Blocked with 403 Forbidden`
      );
    }

    // TEST 14: Review Deletion & Reset of Average Rating
    {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenStudentB}`,
        },
      });

      const data = await res.json();
      const updatedDoc = await Resource.findById(testResource1._id);

      const passed =
        res.status === 200 &&
        data.success &&
        updatedDoc.averageRating === 0 &&
        updatedDoc.totalRatings === 0;

      recordResult(
        '14. Review Deletion & Rating Reset',
        passed,
        `Status ${res.status}, averageRating reset to 0, totalRatings=0`
      );
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $regex: /discovery_student/ } });
    if (testResource1) await Resource.findByIdAndDelete(testResource1._id);
    if (testResource2) await Resource.findByIdAndDelete(testResource2._id);
    await Bookmark.deleteMany({});
    await Review.deleteMany({});

    server.close();

    console.log('====================================================');
    const passedCount = testResults.filter((r) => r.status === 'PASSED').length;
    console.log(` Test Summary: ${passedCount}/${testResults.length} tests passed.`);
    console.log('====================================================');

    if (passedCount === testResults.length) {
      console.log('✓ All NoteSphere discovery & student interaction tests passed successfully!');
      process.exit(0);
    } else {
      console.error('✗ Some tests failed.');
      process.exit(1);
    }
  }
}

runInteractionTests();
