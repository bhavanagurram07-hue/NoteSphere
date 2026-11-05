const mongoose = require('mongoose');
const http = require('http');
const { app } = require('../server');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
const TEST_PORT = 5059;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function verifyStrict() {
  let server;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
    server = http.createServer(app);
    await new Promise((r) => server.listen(TEST_PORT, '127.0.0.1', r));

    // Test 1: Fake faculty email
    const fakeRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fakefaculty@notesphere.com', password: 'randompassword' }),
    });
    const fakeData = await fakeRes.json();
    console.log('Test 1 - Fake Faculty Login:', fakeRes.status === 401 && fakeData.message === 'Invalid email or password' ? 'PASS' : 'FAIL');

    // Test 2: Real faculty email, wrong password
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@notesphere.com', password: 'wrongpassword' }),
    });
    const wrongPassData = await wrongPassRes.json();
    console.log('Test 2 - Wrong Password Login:', wrongPassRes.status === 401 && wrongPassData.message === 'Invalid email or password' ? 'PASS' : 'FAIL');

    // Test 3: Authorized Faculty login with correct credentials
    const realRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@notesphere.com', password: process.env.FACULTY_PASSWORD || 'FacultySecurePass2026!' }),
    });
    const realData = await realRes.json();
    console.log('Test 3 - Authorized Faculty Login:', realRes.status === 200 && realData.user.role === 'faculty' ? 'PASS' : 'FAIL');

    // Test 4: Student token rejected from Faculty API
    const studentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.johnson@campus.edu', password: 'password123' }),
    });
    const studentData = await studentRes.json();

    const studentTryFaculty = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${studentData.token}` },
    });
    console.log('Test 4 - Student Attempting Faculty Access:', studentTryFaculty.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

    // Test 5: Faculty token accessing Faculty API
    const facultyAccess = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${realData.token}` },
    });
    console.log('Test 5 - Authorized Faculty Access:', facultyAccess.status === 200 ? 'PASS (200 OK)' : 'FAIL');

  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyStrict();
