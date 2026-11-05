const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runResourceTests() {
  console.log('====================================================');
  console.log(' NoteSphere Resource Management & Upload Test Suite');
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

  let tokenUserA = ''; // Owner
  let tokenUserB = ''; // Non-owner
  let uploadedResourceId = '';

  try {
    // Register User A (Author)
    const emailA = `author_${Date.now()}@campus.edu`;
    const resA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Author',
        email: emailA,
        password: 'Password123!',
        department: 'Computer Science & Engineering',
        semester: 'Semester 4',
      }),
    });
    const dataA = await resA.json();
    tokenUserA = dataA.token;

    // Register User B (Peer Student)
    const emailB = `peer_${Date.now()}@campus.edu`;
    const resB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Blake Peer',
        email: emailB,
        password: 'Password123!',
        department: 'Electrical Engineering',
        semester: 'Semester 4',
      }),
    });
    const dataB = await resB.json();
    tokenUserB = dataB.token;

    // TEST 1: Valid Resource Upload (PDF Document)
    {
      const formData = new FormData();
      formData.append('title', 'Operating Systems - Process Scheduling & Semaphores');
      formData.append('description', 'Comprehensive lecture notes covering process synchronization, mutexes, and deadlocks.');
      formData.append('subject', 'Operating Systems');
      formData.append('department', 'Computer Science & Engineering');
      formData.append('semester', 'Semester 4');
      formData.append('category', 'Class Notes');

      const mockPdfBlob = new Blob(['%PDF-1.4 Mock OS Notes PDF binary data'], { type: 'application/pdf' });
      formData.append('file', mockPdfBlob, 'process_scheduling_notes.pdf');

      const res = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenUserA}`,
        },
        body: formData,
      });

      const data = await res.json();
      const passed =
        res.status === 201 &&
        data.success &&
        data.resource?._id &&
        data.resource?.fileUrl &&
        data.resource?.status === 'approved';

      if (data.resource?._id) {
        uploadedResourceId = data.resource._id;
      }

      recordResult(
        '1. Valid Resource Upload',
        passed,
        `Status ${res.status}, ID=${data.resource?._id}, fileType=${data.resource?.fileType}`
      );
    }

    // TEST 2: Invalid File Type Rejection (.exe / malicious script)
    {
      const formData = new FormData();
      formData.append('title', 'Suspicious File');
      formData.append('description', 'Should be rejected by file filter');
      formData.append('subject', 'Security');
      formData.append('department', 'Computer Science & Engineering');
      formData.append('semester', 'Semester 4');
      formData.append('category', 'Study Materials');

      const mockExeBlob = new Blob(['MZ binary malicious code'], { type: 'application/octet-stream' });
      formData.append('file', mockExeBlob, 'malicious_virus.exe');

      const res = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenUserA}`,
        },
        body: formData,
      });

      const data = await res.json();
      const passed = res.status === 400 && data.success === false && data.message.includes('Invalid file type');

      recordResult(
        '2. Invalid File Type Rejection',
        passed,
        `Status ${res.status}, Error: "${data.message}"`
      );
    }

    // TEST 3: Missing Required Fields Rejection (e.g. no title/subject)
    {
      const formData = new FormData();
      formData.append('description', 'Missing title and subject');
      const mockTxtBlob = new Blob(['sample text'], { type: 'text/plain' });
      formData.append('file', mockTxtBlob, 'sample.txt');

      const res = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenUserA}`,
        },
        body: formData,
      });

      const data = await res.json();
      const passed = res.status === 400 && data.success === false && data.message.includes('required fields');

      recordResult(
        '3. Missing Required Fields Rejection',
        passed,
        `Status ${res.status}, Message: "${data.message}"`
      );
    }

    // TEST 4: Missing File Rejection
    {
      const formData = new FormData();
      formData.append('title', 'Empty upload');
      formData.append('description', 'No file attached');
      formData.append('subject', 'Math');
      formData.append('department', 'Computer Science & Engineering');
      formData.append('semester', 'Semester 4');
      formData.append('category', 'Assignments');

      const res = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenUserA}`,
        },
        body: formData,
      });

      const data = await res.json();
      const passed = res.status === 400 && data.success === false;

      recordResult(
        '4. Missing File Rejection',
        passed,
        `Status ${res.status}, Message: "${data.message}"`
      );
    }

    // TEST 5: GET All Resources (Public Library with Search & Filters)
    {
      const res = await fetch(`${BASE_URL}/resources?q=Scheduling`);
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        Array.isArray(data.resources) &&
        data.resources.length > 0 &&
        data.resources.some((r) => r._id === uploadedResourceId);

      recordResult(
        '5. GET All Resources (Filtered Search)',
        passed,
        `Status ${res.status}, Found count=${data.count}, Matching ID found`
      );
    }

    // TEST 6: GET Resource By ID
    {
      const res = await fetch(`${BASE_URL}/resources/${uploadedResourceId}`);
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        data.resource?._id === uploadedResourceId &&
        data.resource?.uploadedBy?.name === 'Alex Author';

      recordResult(
        '6. GET Resource By ID',
        passed,
        `Status ${res.status}, Author=${data.resource?.uploadedBy?.name}, Title="${data.resource?.title}"`
      );
    }

    // TEST 7: Resource Editing (Authorized Owner)
    {
      const res = await fetch(`${BASE_URL}/resources/${uploadedResourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUserA}`,
        },
        body: JSON.stringify({
          title: 'Operating Systems - Process Scheduling & CPU Synchronization [Updated Edition]',
          semester: 'Semester 4',
        }),
      });

      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        data.resource?.title.includes('[Updated Edition]');

      recordResult(
        '7. Resource Editing (Authorized Owner)',
        passed,
        `Status ${res.status}, Updated title="${data.resource?.title}"`
      );
    }

    // TEST 8: Unauthorized Editing Prevention (Non-Owner Student)
    {
      const res = await fetch(`${BASE_URL}/resources/${uploadedResourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUserB}`, // User B attempting to edit User A's document
        },
        body: JSON.stringify({
          title: 'Hacked Title by Unauthorized User',
        }),
      });

      const data = await res.json();
      const passed = res.status === 403 && data.success === false;

      recordResult(
        '8. Unauthorized Editing Prevention',
        passed,
        `Status ${res.status}, Blocked with 403 Forbidden`
      );
    }

    // TEST 9: Secure Download & Counter Increment
    {
      // First get current downloads count
      const initialDoc = await Resource.findById(uploadedResourceId);
      const initialDownloads = initialDoc.downloads;

      const res = await fetch(`${BASE_URL}/resources/${uploadedResourceId}/download`);
      const data = await res.json();

      const updatedDoc = await Resource.findById(uploadedResourceId);
      const incremented = updatedDoc.downloads === initialDownloads + 1;

      const passed =
        res.status === 200 &&
        data.success &&
        data.downloadUrl &&
        incremented;

      recordResult(
        '9. Download Initiation & Counter Increment',
        passed,
        `Status ${res.status}, Downloads: ${initialDownloads} -> ${updatedDoc.downloads}, URL=${data.downloadUrl}`
      );
    }

    // TEST 10: My Uploads Retrieval
    {
      const res = await fetch(`${BASE_URL}/resources/my-uploads`, {
        headers: {
          Authorization: `Bearer ${tokenUserA}`,
        },
      });

      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.success &&
        Array.isArray(data.resources) &&
        data.resources.some((r) => r._id === uploadedResourceId);

      recordResult(
        '10. My Uploads Retrieval',
        passed,
        `Status ${res.status}, Upload count=${data.count}`
      );
    }

    // TEST 11: Unauthorized Deletion Prevention (Non-Owner Student)
    {
      const res = await fetch(`${BASE_URL}/resources/${uploadedResourceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenUserB}`, // User B trying to delete User A's document
        },
      });

      const data = await res.json();
      const passed = res.status === 403 && data.success === false;

      recordResult(
        '11. Unauthorized Deletion Prevention',
        passed,
        `Status ${res.status}, Blocked with 403 Forbidden`
      );
    }

    // TEST 12: Authorized Resource Deletion & File Cleanup
    {
      const res = await fetch(`${BASE_URL}/resources/${uploadedResourceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenUserA}`, // Owner deletes
        },
      });

      const data = await res.json();
      const dbCheck = await Resource.findById(uploadedResourceId);
      const passed = res.status === 200 && data.success && dbCheck === null;

      recordResult(
        '12. Authorized Resource Deletion & Cleanup',
        passed,
        `Status ${res.status}, Removed from MongoDB (dbCheck=${dbCheck === null ? 'null' : 'exists'})`
      );
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup test users and test resources
    await User.deleteMany({ email: { $regex: /@(campus\.edu)$/ } });
    await Resource.deleteMany({ title: { $regex: /Operating Systems - Process/ } });

    server.close();

    console.log('====================================================');
    const passedCount = testResults.filter((r) => r.status === 'PASSED').length;
    console.log(` Test Summary: ${passedCount}/${testResults.length} tests passed.`);
    console.log('====================================================');

    if (passedCount === testResults.length) {
      console.log('✓ All NoteSphere resource management tests passed successfully!');
      process.exit(0);
    } else {
      console.error('✗ Some tests failed.');
      process.exit(1);
    }
  }
}

runResourceTests();
