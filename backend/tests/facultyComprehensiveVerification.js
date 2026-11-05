/**
 * Complete Faculty & Student Verification Test Suite
 * Validates all 9 test requirements specified by the user.
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


const facultyEmail = (process.env.FACULTY_EMAIL || 'faculty@notesphere.com').toLowerCase();
const facultyPassword = process.env.FACULTY_PASSWORD || 'FacultySecurePass2026!';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('    NoteSphere Complete Faculty & Student Verification Suite   ');
  console.log('===============================================================\n');

  let server;
  const testResults = {};

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const BASE_URL = `http://127.0.0.1:${port}`;
    console.log(`Server listening on ${BASE_URL}`);

    // Ensure student Alex exists
    let student = await User.findOne({ email: 'alex.johnson@campus.edu' });
    if (!student) {
      student = await User.create({
        name: 'Alex Johnson',
        email: 'alex.johnson@campus.edu',
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 5',
        role: 'student',
      });
    }

    // Ensure faculty exists with password
    let faculty = await User.findOne({ email: facultyEmail });
    if (!faculty) {
      faculty = await User.create({
        name: process.env.FACULTY_NAME || 'Prof. Sarah Jenkins',
        email: facultyEmail,
        password: facultyPassword,
        department: 'Computer Science',
        semester: 'Faculty Member',
        role: 'faculty',
      });
    }

    // 1. Valid student login -> SUCCESS
    const sLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.johnson@campus.edu', password: 'password123' }),
    });
    const sLoginData = await sLoginRes.json();
    if (sLoginRes.status === 200 && sLoginData.user?.role === 'student') {
      console.log('✔ Test 1: Valid student login → SUCCESS');
      testResults.VALID_STUDENT_LOGIN = 'SUCCESS';
    } else {
      console.error('✖ Test 1: Valid student login failed');
      testResults.VALID_STUDENT_LOGIN = 'FAIL';
    }
    const studentToken = sLoginData.token;

    // 2. Invalid student password -> LOGIN DENIED
    const sInvalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.johnson@campus.edu', password: 'wrongpassword' }),
    });
    const sInvalidData = await sInvalidRes.json();
    if (sInvalidRes.status === 401 && sInvalidData.message === 'Invalid email or password') {
      console.log('✔ Test 2: Invalid student password → LOGIN DENIED');
      testResults.INVALID_STUDENT_PASSWORD = 'LOGIN DENIED (HTTP 401)';
    } else {
      console.error('✖ Test 2: Invalid student password did not deny login properly');
      testResults.INVALID_STUDENT_PASSWORD = 'FAIL';
    }

    // 3. Valid authorized faculty login -> SUCCESS
    const fLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail, password: facultyPassword }),
    });
    const fLoginData = await fLoginRes.json();
    if (fLoginRes.status === 200 && fLoginData.user?.role === 'faculty') {
      console.log('✔ Test 3: Valid authorized faculty login → SUCCESS');
      testResults.VALID_FACULTY_LOGIN = 'SUCCESS';
    } else {
      console.error('✖ Test 3: Valid faculty login failed');
      testResults.VALID_FACULTY_LOGIN = 'FAIL';
    }
    const facultyToken = fLoginData.token;

    // 4. Invalid faculty password -> LOGIN DENIED
    const fInvalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail, password: 'incorrectPassword999' }),
    });
    const fInvalidData = await fInvalidRes.json();
    if (fInvalidRes.status === 401 && fInvalidData.message === 'Invalid email or password') {
      console.log('✔ Test 4: Invalid faculty password → LOGIN DENIED');
      testResults.INVALID_FACULTY_PASSWORD = 'LOGIN DENIED (HTTP 401)';
    } else {
      console.error('✖ Test 4: Invalid faculty password did not deny login properly');
      testResults.INVALID_FACULTY_PASSWORD = 'FAIL';
    }

    // 5. Student accessing Faculty Dashboard/API -> DENIED (403)
    const sTryFaculty = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const sTryFacultyData = await sTryFaculty.json();
    if (sTryFaculty.status === 403) {
      console.log('✔ Test 5: Student accessing Faculty Dashboard/API → DENIED (403)');
      testResults.STUDENT_ACCESS_FACULTY_API = 'DENIED (HTTP 403 Forbidden)';
    } else {
      console.error('✖ Test 5: Student access was not denied with 403:', sTryFaculty.status);
      testResults.STUDENT_ACCESS_FACULTY_API = 'FAIL';
    }

    // 6. Unauthenticated user accessing Faculty Dashboard/API -> DENIED (401)
    const unauthTryFaculty = await fetch(`${BASE_URL}/api/faculty/analytics`);
    if (unauthTryFaculty.status === 401) {
      console.log('✔ Test 6: Unauthenticated user accessing Faculty Dashboard/API → DENIED (401)');
      testResults.UNAUTHENTICATED_ACCESS_FACULTY_API = 'DENIED (HTTP 401 Unauthorized)';
    } else {
      console.error('✖ Test 6: Unauthenticated user was not rejected with 401:', unauthTryFaculty.status);
      testResults.UNAUTHENTICATED_ACCESS_FACULTY_API = 'FAIL';
    }

    // 7. Normal registration cannot create faculty
    const testRegEmail = `fresh.student.${Date.now()}@campus.edu`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audited Student',
        email: testRegEmail,
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 3',
        role: 'faculty', // malicious attempt to self-create faculty
      }),
    });
    const regData = await regRes.json();
    const createdInDb = await User.findOne({ email: testRegEmail });
    if (regRes.status === 201 && createdInDb.role === 'student') {
      console.log('✔ Test 7: Normal registration cannot create faculty (forces role="student")');
      testResults.REGISTRATION_CANNOT_CREATE_FACULTY = 'SUCCESS (Forced role="student")';
    } else {
      console.error('✖ Test 7: Public registration accepted unauthorized role');
      testResults.REGISTRATION_CANNOT_CREATE_FACULTY = 'FAIL';
    }
    await User.findByIdAndDelete(createdInDb._id);

    // 8. Faculty can access faculty-only features
    const fAnalyticsRes = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const fAnalyticsData = await fAnalyticsRes.json();
    if (fAnalyticsRes.status === 200 && fAnalyticsData.metrics) {
      console.log('✔ Test 8: Faculty can access faculty-only features (Analytics & Dashboard)');
      testResults.FACULTY_CAN_ACCESS_FEATURES = 'SUCCESS (HTTP 200 OK)';
    } else {
      console.error('✖ Test 8: Faculty could not access faculty API:', fAnalyticsRes.status);
      testResults.FACULTY_CAN_ACCESS_FEATURES = 'FAIL';
    }

    // 9. Existing student features still work
    // Test search
    const searchRes = await fetch(`${BASE_URL}/api/resources?search=Computer`);
    const searchData = await searchRes.json();

    // Test profile retrieval
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();

    if (searchRes.status === 200 && meRes.status === 200 && meData.user?.role === 'student') {
      console.log('✔ Test 9: Existing student features still work (Search, Profile, Resources)');
      testResults.EXISTING_STUDENT_FEATURES = 'SUCCESS (All Operational)';
    } else {
      console.error('✖ Test 9: Existing student features check failed');
      testResults.EXISTING_STUDENT_FEATURES = 'FAIL';
    }

    console.log('\n===============================================================');
    console.log('                     VERIFICATION RESULTS SUMMARY              ');
    console.log('===============================================================');
    for (const [k, v] of Object.entries(testResults)) {
      console.log(`${k}: ${v}`);
    }

  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTestSuite();
