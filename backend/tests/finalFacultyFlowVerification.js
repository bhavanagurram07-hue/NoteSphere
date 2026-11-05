/**
 * NoteSphere Final Faculty Authorization and Flow Verification Test Suite
 * Tests TEST A (Student), TEST B (Faculty), TEST C (Security), and Existing Features
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const http = require('http');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
const TEST_PORT = 5057;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const facultyEmail = (process.env.FACULTY_EMAIL || 'faculty@notesphere.com').toLowerCase();
const facultyPassword = process.env.FACULTY_PASSWORD || 'FacultySecurePass2026!';

async function runCompleteFlow() {
  console.log('================================================================');
  console.log('       NoteSphere Final Faculty Authorization Verification       ');
  console.log('================================================================\n');

  let server;
  const results = {
    FACULTY_CREDENTIAL_SETUP: 'FAIL',
    FACULTY_LOGIN: 'FAIL',
    FACULTY_AUTHORIZATION: 'FAIL',
    STUDENT_REGISTRATION: 'FAIL',
    STUDENT_AUTHORIZATION: 'FAIL',
    ROLE_SECURITY: 'FAIL',
    FACULTY_DASHBOARD: 'FAIL',
    FACULTY_RESOURCE_MANAGEMENT: 'FAIL',
    DATABASE: 'FAIL',
    EXISTING_FEATURES: 'FAIL',
  };

  try {
    // 0. Database connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
    console.log('✔ MongoDB connected.');
    results.DATABASE = 'PASS';

    // Start ephemeral test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
    console.log(`✔ Verification test server online at ${BASE_URL}\n`);

    // ===================================================================
    // STEP 1: FACULTY CREDENTIAL SETUP VERIFICATION
    // ===================================================================
    console.log('--- Step 1: Checking Faculty Credential Setup ---');
    const facultyDoc = await User.findOne({ email: facultyEmail }).select('+password');
    if (!facultyDoc) {
      throw new Error(`Faculty account ${facultyEmail} not found. Run "npm run seed:faculty" first.`);
    }

    if (facultyDoc.role !== 'faculty') {
      throw new Error(`Faculty user does not have role "faculty". Current role: ${facultyDoc.role}`);
    }

    const isPasswordHashed = facultyDoc.password && facultyDoc.password.startsWith('$2');
    if (!isPasswordHashed) {
      throw new Error('Faculty password is NOT bcrypt-hashed in MongoDB!');
    }

    console.log(`✔ Faculty account exists for <${facultyEmail}> with role = "faculty".`);
    console.log('✔ Faculty password is confirmed bcrypt-hashed.');
    results.FACULTY_CREDENTIAL_SETUP = 'PASS';

    // ===================================================================
    // STEP 2: TEST A — STUDENT
    // ===================================================================
    console.log('\n--- Step 2: TEST A — Student Registration, Login & Authorization ---');
    const studentEmail = `student.audit.${Date.now()}@campus.edu`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: studentEmail,
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 4',
      }),
    });
    const regData = await regRes.json();

    if (regRes.status !== 201 || !regData.token) {
      throw new Error(`Student registration failed: ${JSON.stringify(regData)}`);
    }

    const studentInDb = await User.findOne({ email: studentEmail });
    if (studentInDb.role !== 'student') {
      throw new Error(`Student in MongoDB has wrong role: ${studentInDb.role}`);
    }
    console.log(`✔ Student registration passed. MongoDB role: "${studentInDb.role}".`);
    results.STUDENT_REGISTRATION = 'PASS';

    // Student Login
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'password123',
      }),
    });
    const studentLoginData = await studentLoginRes.json();
    if (studentLoginRes.status !== 200 || studentLoginData.user?.role !== 'student') {
      throw new Error('Student login failed');
    }
    const studentToken = studentLoginData.token;
    console.log('✔ Student login passed.');

    // Student attempts to call Faculty API -> MUST be 403 Forbidden
    const studentFacultyApiRes = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentFacultyApiRes.status === 403) {
      console.log('✔ Student accessing Faculty-only API strictly rejected with HTTP 403 Forbidden.');
      results.STUDENT_AUTHORIZATION = 'PASS';
    } else {
      throw new Error(`Expected HTTP 403 for student accessing faculty API, got ${studentFacultyApiRes.status}`);
    }

    // Student Logout
    const studentLogoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentLogoutRes.status === 200) {
      console.log('✔ Student logout passed.');
    }

    // ===================================================================
    // STEP 3: TEST B — FACULTY
    // ===================================================================
    console.log('\n--- Step 3: TEST B — Faculty Login, Dashboard & Resource Management ---');
    const facultyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: facultyEmail,
        password: facultyPassword,
      }),
    });
    const facultyLoginData = await facultyLoginRes.json();
    if (facultyLoginRes.status !== 200 || facultyLoginData.user?.role !== 'faculty') {
      throw new Error(`Faculty login failed: ${JSON.stringify(facultyLoginData)}`);
    }
    const facultyToken = facultyLoginData.token;
    console.log(`✔ Faculty login passed with role = "${facultyLoginData.user.role}".`);
    results.FACULTY_LOGIN = 'PASS';

    // Faculty Dashboard / Analytics
    const facultyDashboardRes = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const facultyDashboardData = await facultyDashboardRes.json();
    if (facultyDashboardRes.status !== 200 || !facultyDashboardData.metrics) {
      throw new Error(`Faculty dashboard failed: ${JSON.stringify(facultyDashboardData)}`);
    }
    console.log('✔ Faculty Dashboard accessed successfully with analytics metrics.');
    results.FACULTY_DASHBOARD = 'PASS';
    results.FACULTY_AUTHORIZATION = 'PASS';

    // Faculty Uploads Official Resource
    const uploadFormData = new FormData();
    const pdfBlob = new Blob(
      ['%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF'],
      { type: 'application/pdf' }
    );
    uploadFormData.append('file', pdfBlob, 'Faculty_Verified_Algorithms.pdf');
    uploadFormData.append('title', 'Official Faculty Notes - Design and Analysis of Algorithms');
    uploadFormData.append('subject', 'Algorithms');
    uploadFormData.append('department', 'Computer Science');
    uploadFormData.append('semester', 'Semester 5');
    uploadFormData.append('category', 'Class Notes');
    uploadFormData.append('description', 'Comprehensive faculty lecture notes on asymptotic notation and divide and conquer.');

    const uploadRes = await fetch(`${BASE_URL}/api/resources`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: uploadFormData,
    });
    const uploadData = await uploadRes.json();
    if (uploadRes.status !== 201 || !uploadData.resource?._id) {
      throw new Error(`Faculty resource upload failed: ${JSON.stringify(uploadData)}`);
    }
    const resourceId = uploadData.resource._id;
    console.log('✔ Faculty uploaded official academic resource:', resourceId);

    // Faculty Edits Resource
    const editRes = await fetch(`${BASE_URL}/api/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: 'Official Faculty Notes - Design and Analysis of Algorithms (Updated Edition)',
      }),
    });
    const editData = await editRes.json();
    if (editRes.status !== 200 || !editData.resource.title.includes('Updated Edition')) {
      throw new Error(`Faculty edit resource failed: ${JSON.stringify(editData)}`);
    }
    console.log('✔ Faculty edited own resource successfully.');

    // Faculty Moderation / Resource Management
    const modRes = await fetch(`${BASE_URL}/api/faculty/resources/${resourceId}/moderate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    if (modRes.status === 200) {
      console.log('✔ Faculty moderated resource status successfully.');
      results.FACULTY_RESOURCE_MANAGEMENT = 'PASS';
    }

    // ===================================================================
    // STEP 4: TEST C — SECURITY & PREVENT ROLE MANIPULATION
    // ===================================================================
    console.log('\n--- Step 4: TEST C — Security Checks & Role Tampering Resistance ---');

    // 1. Role injection attempt during registration
    const maliciousEmail = `hacker.${Date.now()}@campus.edu`;
    const maliciousReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious User',
        email: maliciousEmail,
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 1',
        role: 'faculty', // Malicious attempt to self-assign faculty role
      }),
    });
    const maliciousData = await maliciousReg.json();
    const maliciousUserDb = await User.findOne({ email: maliciousEmail });
    if (maliciousUserDb.role === 'faculty') {
      throw new Error('CRITICAL VULNERABILITY: Registration accepted role="faculty"!');
    }
    console.log('✔ Role injection rejected: User created with role = "student".');

    // 2. Privilege escalation attempt via updateProfile API
    const maliciousToken = maliciousData.token;
    const profileTamperRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${maliciousToken}`,
      },
      body: JSON.stringify({
        name: 'Hacker In Disguise',
        role: 'faculty', // Attempt to escalate role
      }),
    });
    const profileTamperData = await profileTamperRes.json();
    const userAfterTamper = await User.findOne({ email: maliciousEmail });
    if (userAfterTamper.role === 'faculty') {
      throw new Error('CRITICAL VULNERABILITY: User escalated role via profile update!');
    }
    console.log('✔ Profile update role escalation rejected: MongoDB role remains "student".');

    // 3. Unauthenticated access to Faculty API
    const unauthRes = await fetch(`${BASE_URL}/api/faculty/analytics`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected HTTP 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('✔ Unauthenticated access to Faculty API strictly rejected with HTTP 401.');

    // 4. Student token accessing Faculty API
    const studentTamperRes = await fetch(`${BASE_URL}/api/faculty/resources`, {
      headers: { Authorization: `Bearer ${maliciousToken}` },
    });
    if (studentTamperRes.status !== 403) {
      throw new Error(`Expected HTTP 403 for student accessing faculty resource list, got ${studentTamperRes.status}`);
    }
    console.log('✔ Student token accessing Faculty resource API strictly rejected with HTTP 403.');
    results.ROLE_SECURITY = 'PASS';

    // ===================================================================
    // STEP 5: EXISTING FEATURES VERIFICATION
    // ===================================================================
    console.log('\n--- Step 5: Verifying Existing Core Features ---');

    // 1. Search & Filter
    const searchRes = await fetch(`${BASE_URL}/api/resources?search=Algorithms&department=Computer%20Science`);
    const searchData = await searchRes.json();
    if (searchRes.status !== 200 || searchData.resources.length === 0) {
      throw new Error('Search & Filter failed');
    }
    console.log(`✔ Search & Filter passed: Found ${searchData.resources.length} matching resource(s).`);

    // 2. Download
    const downloadRes = await fetch(`${BASE_URL}/api/resources/${resourceId}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (downloadRes.status !== 200) {
      throw new Error(`Download failed with status ${downloadRes.status}`);
    }
    console.log('✔ Download passed: Received binary download stream.');

    // 3. Review & Rating
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        resourceId,
        rating: 5,
        comment: 'Very thorough and clear explanation of dynamic programming and greedy strategies!',
      }),
    });
    const reviewData = await reviewRes.json();
    if (reviewRes.status !== 201 || reviewData.review.rating !== 5) {
      throw new Error('Review/Rating failed');
    }
    console.log('✔ Rating & Review passed: 5-star rating registered.');

    // 4. Bookmark
    const bookmarkRes = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ resourceId }),
    });
    const getBookmarksRes = await fetch(`${BASE_URL}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const bookmarksData = await getBookmarksRes.json();
    if (bookmarkRes.status !== 201 || bookmarksData.count === 0) {
      throw new Error('Bookmarks failed');
    }
    console.log('✔ Bookmarking passed: Saved to study desk.');

    // 5. Faculty Deletes Resource
    const deleteRes = await fetch(`${BASE_URL}/api/resources/${resourceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    if (deleteRes.status !== 200) {
      throw new Error('Faculty delete resource failed');
    }
    console.log('✔ Faculty deleted resource passed.');

    // 6. Faculty Logout
    const facultyLogoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    if (facultyLogoutRes.status === 200) {
      console.log('✔ Faculty logout passed.');
    }

    results.EXISTING_FEATURES = 'PASS';

    // Cleanup test users
    await User.findByIdAndDelete(studentInDb._id);
    await User.findByIdAndDelete(maliciousUserDb._id);
    await Review.deleteMany({ resource: resourceId });
    await Bookmark.deleteMany({ resource: resourceId });
    console.log('✔ Test fixtures cleaned up successfully.');

    console.log('\n================================================================');
    console.log('                       FINAL REPORT SUMMARY                     ');
    console.log('================================================================');
    for (const [key, val] of Object.entries(results)) {
      console.log(`${key}: ${val}`);
    }

  } catch (err) {
    console.error('\n✖ TEST SUITE FAILURE:', err.message);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    process.exit(0);
  }
}

runCompleteFlow();
