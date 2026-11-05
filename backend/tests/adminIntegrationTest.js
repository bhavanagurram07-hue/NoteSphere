const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Review = require('../models/Review');
const Report = require('../models/Report');

const TEST_PORT = 5007;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runFullSystemIntegrationTests() {
  console.log('====================================================');
  console.log(' NoteSphere Full-System Integration & QA Test Suite');
  console.log('====================================================');

  // Wait for MongoDB connection
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

  let studentToken = '';
  let studentId = '';
  let studentEmail = `fullflow_student_${Date.now()}@university.edu`;
  let adminToken = '';
  let adminId = '';
  let testDocId = '';
  let reportId = '';

  try {
    // PREPARATION: Ensure Admin account exists
    let adminUser = await User.findOne({ email: 'admin@notesphere.edu' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Campus Admin QA',
        email: 'admin@notesphere.edu',
        password: 'admin123',
        department: 'Academic Affairs',
        semester: 'Staff',
        role: 'admin',
        isBlocked: false,
      });
    }

    // ==========================================
    // SECTION 1: COMPLETE STUDENT WORKFLOW
    // ==========================================
    console.log('\n--- PART A: STUDENT WORKFLOW VERIFICATION ---');

    // 1. Student Registration
    {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Maya Lin',
          email: studentEmail,
          password: 'Password123!',
          department: 'Computer Science',
          semester: 'Semester 4',
          registrationNumber: 'CS-2026-QA1',
        }),
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.token && data.user?.role === 'student';
      studentToken = data.token;
      studentId = data.user?._id;
      recordResult('1. Student Registration', passed, `Status ${res.status}, ID=${studentId}`);
    }

    // 2. Student Login
    {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: 'Password123!',
        }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.token;
      studentToken = data.token; // Refresh token
      recordResult('2. Student Login', passed, `Status ${res.status}, JWT verified`);
    }

    // 3. View Student Dashboard
    {
      const res = await fetch(`${BASE_URL}/auth/dashboard-stats`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.stats !== undefined;
      recordResult('3. Student Dashboard Metrics', passed, `Status ${res.status}, Stats retrieved`);
    }

    // 4. Upload Academic Resource
    {
      const formData = new FormData();
      formData.append('title', 'Distributed Systems - Consensus Protocols & Raft');
      formData.append('description', 'Comprehensive lecture notes on Paxos, Raft leader election, and split-brain resolution.');
      formData.append('subject', 'Distributed Systems');
      formData.append('department', 'Computer Science');
      formData.append('semester', 'Semester 5');
      formData.append('category', 'Class Notes');

      const mockPdf = new Blob(['%PDF-1.4 Mock Distributed Systems PDF Content'], { type: 'application/pdf' });
      formData.append('file', mockPdf, 'raft_consensus_notes.pdf');

      const res = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: formData,
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.resource?._id;
      testDocId = data.resource?._id;
      recordResult('4. Resource Upload (Multipart/Form-Data)', passed, `Status ${res.status}, Doc ID=${testDocId}`);
    }

    // 5. View Uploaded Resources
    {
      const res = await fetch(`${BASE_URL}/resources/my-uploads`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.resources.some((r) => r._id === testDocId);
      recordResult('5. View My Uploads', passed, `Status ${res.status}, Count=${data.count}`);
    }

    // 6. Edit Resource
    {
      const res = await fetch(`${BASE_URL}/resources/${testDocId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: 'Distributed Systems - Consensus Protocols & Raft [Final Revision]',
        }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.resource?.title.includes('[Final Revision]');
      recordResult('6. Edit Own Resource', passed, `Status ${res.status}, Title updated`);
    }

    // 7. Explore Resources
    {
      const res = await fetch(`${BASE_URL}/resources?department=Computer%20Science`);
      const data = await res.json();
      const passed = res.status === 200 && data.success && Array.isArray(data.resources);
      recordResult('7. Explore Resources Library', passed, `Status ${res.status}, Items count=${data.count}`);
    }

    // 8. Search & Multi-Filter
    {
      const res = await fetch(`${BASE_URL}/resources?q=Paxos&department=Computer%20Science&sortBy=newest`);
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.resources.some((r) => r._id === testDocId);
      recordResult('8. Search & Multi-Filter Query', passed, `Status ${res.status}, Found matching document`);
    }

    // 9. Download Resource & Counter Increment
    {
      const initialDoc = await Resource.findById(testDocId);
      const res = await fetch(`${BASE_URL}/resources/${testDocId}/download`);
      const data = await res.json();
      const afterDoc = await Resource.findById(testDocId);
      const passed = res.status === 200 && data.success && afterDoc.downloads === initialDoc.downloads + 1;
      recordResult('9. Download Trigger & Increment', passed, `Downloads: ${initialDoc.downloads} -> ${afterDoc.downloads}`);
    }

    // 10. Bookmark Resource
    {
      const res = await fetch(`${BASE_URL}/bookmarks/${testDocId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.bookmarked === true;
      recordResult('10. Cloud Bookmark Toggle', passed, `Status ${res.status}, Bookmarked=true`);
    }

    // 11. Rate and Review
    {
      const res = await fetch(`${BASE_URL}/resources/${testDocId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Essential reading for distributed consensus. Diagrams on state machines are outstanding.',
        }),
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.averageRating === 5;
      recordResult('11. Star Rating & Review', passed, `Status ${res.status}, avgRating=${data.averageRating}`);
    }

    // 12. Submit Community Report
    {
      const res = await fetch(`${BASE_URL}/reports/${testDocId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          reason: 'Incorrect Syllabus / Wrong Subject',
          description: 'Document has extra chapter not covered in midterm exam.',
        }),
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.report?._id;
      if (data.report?._id) reportId = data.report._id;
      recordResult('12. Inappropriate Content Report Filing', passed, `Status ${res.status}, Report ID=${reportId}`);
    }

    // 13. Update Student Profile
    {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          name: 'Maya Lin Updated',
          semester: 'Semester 5',
        }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.user?.name === 'Maya Lin Updated';
      recordResult('13. Update Student Profile', passed, `Status ${res.status}, Name="${data.user?.name}"`);
    }

    // 14. Student Logout
    {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success;
      recordResult('14. Student Logout & Session Termination', passed, `Status ${res.status}`);
    }

    // ==========================================
    // SECTION 2: COMPLETE ADMIN WORKFLOW
    // ==========================================
    console.log('\n--- PART B: ADMIN WORKFLOW & SECURITY VERIFICATION ---');

    // 15. Admin Login
    {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@notesphere.edu',
          password: 'admin123',
        }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.user?.role === 'admin';
      adminToken = data.token;
      adminId = data.user?._id;
      recordResult('15. Admin Login & Role Verification', passed, `Status ${res.status}, Role=${data.user?.role}`);
    }

    // 16. View Admin Analytics & Aggregations
    {
      const res = await fetch(`${BASE_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        data.metrics?.totalStudents > 0 &&
        Array.isArray(data.charts?.categoryBreakdown) &&
        Array.isArray(data.charts?.departmentDistribution);
      recordResult(
        '16. Admin Real-Time Analytics & Aggregation',
        passed,
        `Status ${res.status}, Students=${data.metrics?.totalStudents}, Resources=${data.metrics?.totalResources}`
      );
    }

    // 17. View & Search Student Accounts
    {
      const res = await fetch(`${BASE_URL}/admin/users?q=Maya`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.users.some((u) => u._id === studentId);
      recordResult('17. Search & View Student Accounts', passed, `Status ${res.status}, Found user Maya`);
    }

    // 18. Block Student User
    {
      const res = await fetch(`${BASE_URL}/admin/users/${studentId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isBlocked: true }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.isBlocked === true;
      recordResult('18. Suspend/Block Student Account', passed, `Status ${res.status}, isBlocked=true`);
    }

    // 19. Blocked Student Security Check (Must be blocked from performing activities)
    {
      const res = await fetch(`${BASE_URL}/resources/my-uploads`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const passed = res.status === 403 && data.success === false && data.message.includes('suspended');
      recordResult('19. Blocked User Security Enforcement', passed, `Status ${res.status}, Correctly rejected with 403`);
    }

    // 20. Unblock Student User
    {
      const res = await fetch(`${BASE_URL}/admin/users/${studentId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isBlocked: false }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.isBlocked === false;
      recordResult('20. Reinstate/Unblock Student Account', passed, `Status ${res.status}, isBlocked=false`);
    }

    // 21. Review All Uploaded Resources (Moderation Queue)
    {
      const res = await fetch(`${BASE_URL}/admin/resources?status=all`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && Array.isArray(data.resources);
      recordResult('21. Resource Moderation Queue Retrieval', passed, `Status ${res.status}, Count=${data.count}`);
    }

    // 22. Moderate Resource Status (Approve / Reject)
    {
      const res = await fetch(`${BASE_URL}/admin/resources/${testDocId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.resource?.status === 'approved';
      recordResult('22. Moderate Resource Status (Approve)', passed, `Status ${res.status}, Moderated to approved`);
    }

    // 23. Review Community Reports Queue
    {
      const res = await fetch(`${BASE_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.reports.some((r) => r._id === reportId);
      recordResult('23. View Community Reports Queue', passed, `Status ${res.status}, Target report present`);
    }

    // 24. Delete Inappropriate Resource & Resolve Report (Admin Action)
    {
      const res = await fetch(`${BASE_URL}/admin/resources/${testDocId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const checkDoc = await Resource.findById(testDocId);
      const passed = res.status === 200 && data.success && checkDoc === null;
      recordResult('24. Admin Permanent Deletion & Cleanup', passed, `Status ${res.status}, Removed from MongoDB`);
    }

    // ==========================================
    // SECTION 3: SECURITY BOUNDARY TESTS
    // ==========================================
    console.log('\n--- PART C: SECURITY BOUNDARY & PRIVILEGE ENFORCEMENT ---');

    // 25. Student Access to Admin Analytics Blocked
    {
      const res = await fetch(`${BASE_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const passed = res.status === 403 && data.success === false;
      recordResult('25. Non-Admin Access To Admin APIs Blocked', passed, `Status ${res.status}, 403 Forbidden`);
    }

    // 26. Admin Self-Lockout Prevention
    {
      const res = await fetch(`${BASE_URL}/admin/users/${adminId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isBlocked: true }),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.success === false && data.message.includes('Security protection');
      recordResult('26. Admin Self-Suspension Prevention', passed, `Status ${res.status}, Blocked with: "${data.message}"`);
    }

  } catch (err) {
    console.error('Integration test exception:', err);
  } finally {
    // Cleanup test artifacts
    if (studentId) await User.findByIdAndDelete(studentId);
    if (testDocId) {
      await Resource.findByIdAndDelete(testDocId);
      await Bookmark.deleteMany({ resource: testDocId });
      await Review.deleteMany({ resource: testDocId });
      await Report.deleteMany({ resource: testDocId });
    }

    server.close();

    console.log('\n====================================================');
    const passedCount = testResults.filter((r) => r.status === 'PASSED').length;
    console.log(` Full System QA Summary: ${passedCount}/${testResults.length} tests passed.`);
    console.log('====================================================');

    if (passedCount === testResults.length) {
      console.log('✓ ALL NOTE SPHERE INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
      process.exit(0);
    } else {
      console.error('✗ Some tests failed.');
      process.exit(1);
    }
  }
}

runFullSystemIntegrationTests();
