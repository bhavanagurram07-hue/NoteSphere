const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}/api/auth`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log(' NoteSphere Authentication & Account Test Suite');
  console.log('====================================================');

  // Wait for MongoDB connection to establish
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 20) {
    await sleep(250);
    attempts++;
  }

  if (mongoose.connection.readyState !== 1) {
    console.error('Failed to establish MongoDB connection. Check your local mongod or MONGO_URI in backend/.env');
    process.exit(1);
  }

  console.log(`[MongoDB Ready]: Connected to database "${mongoose.connection.name}"`);

  // Start server on test port
  const server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => resolve(s));
  });

  const testResults = [];
  const recordResult = (testName, passed, details) => {
    testResults.push({ testName, status: passed ? 'PASSED' : 'FAILED', details });
    const mark = passed ? '✓' : '✗';
    console.log(`[${mark}] ${testName}: ${passed ? 'PASSED' : 'FAILED'} - ${details}`);
  };

  const testEmail = `student_${Date.now()}@university.edu`;
  const testPassword = 'Password123!';
  let authToken = '';

  try {
    // Clean up any previous test user with this email
    await User.deleteMany({ email: { $regex: /@university\.edu$/ } });

    // TEST 1: Successful Registration
    {
      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: testEmail,
          password: testPassword,
          department: 'Computer Science',
          semester: 'Semester 4',
          registrationNumber: 'CS-2026-99',
        }),
      });
      const data = await res.json();
      const passed = res.status === 201 && data.success && data.token && data.user?.role === 'student';
      authToken = data.token;
      recordResult(
        '1. Successful Registration',
        passed,
        `Status ${res.status}, Role=${data.user?.role}, Token received`
      );
    }

    // TEST 2: Duplicate Email Registration Prevention
    {
      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Imposter Connor',
          email: testEmail,
          password: 'OtherPassword456',
        }),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.success === false;
      recordResult(
        '2. Duplicate Email Prevention',
        passed,
        `Status ${res.status}, Message: "${data.message}"`
      );
    }

    // TEST 3: Successful Login
    {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.token;
      authToken = data.token;
      recordResult(
        '3. Successful Login',
        passed,
        `Status ${res.status}, Verified user=${data.user?.email}`
      );
    }

    // TEST 4: Incorrect Password Handling
    {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword999',
        }),
      });
      const data = await res.json();
      const passed = res.status === 401 && data.success === false;
      recordResult(
        '4. Incorrect Password Rejection',
        passed,
        `Status ${res.status}, Message: "${data.message}"`
      );
    }

    // TEST 5: Invalid Token Protection
    {
      const res = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: { Authorization: 'Bearer this_is_an_invalid_fake_jwt_token' },
      });
      const data = await res.json();
      const passed = res.status === 401 && data.success === false;
      recordResult(
        '5. Invalid Token Rejection',
        passed,
        `Status ${res.status}, Message: "${data.message}"`
      );
    }

    // TEST 6: Protected Route Access with Valid Token
    {
      const res = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success && data.user?.email === testEmail;
      recordResult(
        '6. Protected Route Access',
        passed,
        `Status ${res.status}, Retrieved user profile for ${data.user?.name}`
      );
    }

    // TEST 7: Profile Update (Self-Update Only)
    {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Sarah Connor Updated',
          department: 'Electronics & Comm.',
          semester: 'Semester 5',
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.user?.name === 'Sarah Connor Updated' &&
        data.user?.semester === 'Semester 5';
      recordResult(
        '7. Profile Update',
        passed,
        `Status ${res.status}, Name="${data.user?.name}", Semester="${data.user?.semester}"`
      );
    }

    // TEST 8: Public Role Escalation Prevention
    {
      // Attempt to register as admin via public endpoint
      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker Joe',
          email: `hacker_${Date.now()}@university.edu`,
          password: 'Password123!',
          role: 'admin', // Malicious attempt to escalate
        }),
      });
      const data = await res.json();
      const passed = res.status === 201 && data.user?.role === 'student';
      recordResult(
        '8. Role Escalation Prevention',
        passed,
        `Status ${res.status}, Enforced Role="${data.user?.role}"`
      );
    }

    // TEST 9: Logout & Session Invalidation
    {
      const res = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success;
      recordResult(
        '9. Logout & Session Termination',
        passed,
        `Status ${res.status}, Cookie cleared: ${data.message}`
      );
    }
  } catch (error) {
    console.error('Fatal Test Exception:', error);
  } finally {
    server.close();
    await mongoose.connection.close();
  }

  console.log('====================================================');
  console.log(` Test Summary: ${testResults.filter((t) => t.status === 'PASSED').length}/${testResults.length} Tests Passed`);
  console.log('====================================================');
}

runTests();
