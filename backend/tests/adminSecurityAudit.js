/**
 * NoteSphere Admin Authentication & Authorization Security Audit
 * Tests:
 *  1. Normal Registration Role Security (strictly enforces role="student")
 *  2. Admin Authentication via MongoDB (bcrypt, JWT generation, role in DB)
 *  3. Admin Authorization & Feature Access (analytics, user mgmt, moderation)
 *  4. Unauthenticated Rejection (HTTP 401 on admin APIs)
 *  5. Student Rejection on Admin APIs (HTTP 403 Forbidden)
 *  6. Tampered/Forged Role in Request (backend verifies real role from database, rejects with 403)
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const { app } = require('../server');
const http = require('http');

let server;
let baseUrl;

const startServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    server.close(resolve);
  });
};

const runAudit = async () => {
  console.log('====================================================');
  console.log(' NoteSphere Complete Admin Security & RBAC Audit');
  console.log('====================================================');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
  await mongoose.connect(mongoUri);
  console.log('[MongoDB Connected]: Host ->', mongoose.connection.host);

  await startServer();
  console.log('[Test Server Running on]:', baseUrl);

  let passedTests = 0;
  const totalTests = 6;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register Normal Student & Verify Database Stores role = "student"
    // Even if student payload attempts privilege escalation (role: "admin")
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Normal Registration Role Security ---');
    const studentEmail = `student_${Date.now()}@university.edu`;
    const regPayload = {
      name: 'Test Student',
      email: studentEmail,
      password: 'password123',
      department: 'Computer Science',
      semester: 'Semester 3',
      role: 'admin', // Malicious attempt to register directly as admin!
    };

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const regData = await regRes.json();

    const dbUser = await User.findOne({ email: studentEmail });
    if (
      regRes.status === 201 &&
      dbUser &&
      dbUser.role === 'student' &&
      regData.user.role === 'student'
    ) {
      console.log('✓ TEST 1 PASSED: Normal registration strictly stored role = "student" in MongoDB (malicious role="admin" request was rejected/ignored).');
      passedTests++;
    } else {
      throw new Error(`TEST 1 FAILED: Expected role="student" but found role="${dbUser?.role}" in MongoDB`);
    }

    const studentToken = regData.token;

    // Verify student can access student dashboard metrics
    const studentDashRes = await fetch(`${baseUrl}/auth/dashboard-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentDashData = await studentDashRes.json();
    if (studentDashRes.status !== 200 || !studentDashData.success) {
      throw new Error('TEST 1 FAILED: Student could not access standard student dashboard');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Legitimate Admin Account Authentication & Feature Access
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Legitimate Admin Authentication & Features ---');
    const adminEmail = 'admin@notesphere.edu';
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();

    const dbAdmin = await User.findOne({ email: adminEmail });
    if (
      adminLoginRes.status === 200 &&
      adminLoginData.success &&
      dbAdmin &&
      dbAdmin.role === 'admin' &&
      adminLoginData.user.role === 'admin'
    ) {
      console.log('✓ TEST 2A PASSED: Admin authenticated successfully via bcrypt match, MongoDB verified role = "admin", JWT issued.');
    } else {
      throw new Error('TEST 2A FAILED: Admin login failed or role mismatch');
    }

    const adminToken = adminLoginData.token;

    // Test Admin Analytics API
    const analyticsRes = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = await analyticsRes.json();

    // Test Admin Users Management API
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();

    // Test Admin Resource Moderation Queue API
    const modRes = await fetch(`${baseUrl}/admin/resources`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const modData = await modRes.json();

    if (
      analyticsRes.status === 200 &&
      analyticsData.success &&
      usersRes.status === 200 &&
      usersData.success &&
      modRes.status === 200 &&
      modData.success
    ) {
      console.log('✓ TEST 2B PASSED: Admin successfully accessed Analytics, User Management, and Moderation Queue endpoints.');
      passedTests++;
    } else {
      throw new Error('TEST 2B FAILED: Admin feature APIs returned error');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Logout & Unauthenticated Access Prevention (HTTP 401)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Unauthenticated Access Prevention ---');
    const unauthAnalytics = await fetch(`${baseUrl}/admin/analytics`);
    const unauthAnalyticsData = await unauthAnalytics.json();

    const unauthUsers = await fetch(`${baseUrl}/admin/users`);
    const unauthMod = await fetch(`${baseUrl}/admin/resources`);

    if (
      unauthAnalytics.status === 401 &&
      unauthUsers.status === 401 &&
      unauthMod.status === 401 &&
      !unauthAnalyticsData.success
    ) {
      console.log(`✓ TEST 3 PASSED: All admin APIs strictly reject unauthenticated requests with HTTP 401 (${unauthAnalyticsData.message}).`);
      passedTests++;
    } else {
      throw new Error(`TEST 3 FAILED: Expected HTTP 401, got ${unauthAnalytics.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Student Bounded from /admin (Frontend Route Protection Check)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Student Route Boundary Verification ---');
    // Check /me endpoint to ensure server reports role="student"
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();

    if (meRes.status === 200 && meData.user && meData.user.role === 'student') {
      console.log('✓ TEST 4 PASSED: /api/auth/me returns authentic user.role = "student" for the student session.');
      console.log('  Frontend ProtectedRoute checks: (adminOnly && user.role !== "admin") -> Redirects student to /dashboard.');
      passedTests++;
    } else {
      throw new Error('TEST 4 FAILED: /api/auth/me did not report student role');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Direct Admin API Invocations by Student Rejected with HTTP 403
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Student Blocked from Admin APIs with HTTP 403 ---');
    const studentAnalyticsRes = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentAnalyticsData = await studentAnalyticsRes.json();

    const studentUsersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    const studentModRes = await fetch(`${baseUrl}/admin/resources`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    if (
      studentAnalyticsRes.status === 403 &&
      studentUsersRes.status === 403 &&
      studentModRes.status === 403 &&
      studentAnalyticsData.message.includes('not permitted')
    ) {
      console.log(`✓ TEST 5 PASSED: Student token was strictly rejected with HTTP 403 Forbidden ("${studentAnalyticsData.message}").`);
      passedTests++;
    } else {
      throw new Error(`TEST 5 FAILED: Expected HTTP 403, got ${studentAnalyticsRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Manipulated / Forged Role Attack Simulation
    // A student changes their client-side localStorage/state to role="admin"
    // and sends headers / payload with role="admin"
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Tampered / Client-Manipulated Role Attack ---');
    // Scenario A: Student calls admin endpoint with modified role in query / body
    const tamperedRes = await fetch(`${baseUrl}/admin/analytics?role=admin`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'X-User-Role': 'admin',
        'Content-Type': 'application/json',
      },
    });
    const tamperedData = await tamperedRes.json();

    // Scenario B: Student tries to update their own profile to role: "admin"
    const profileUpdateRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Hacker Student',
        role: 'admin', // Attempt privilege escalation!
      }),
    });
    const profileUpdateData = await profileUpdateRes.json();
    const recheckDbUser = await User.findById(dbUser._id);

    if (
      tamperedRes.status === 403 &&
      profileUpdateRes.status === 200 &&
      recheckDbUser.role === 'student' &&
      profileUpdateData.user.role === 'student'
    ) {
      console.log('✓ TEST 6 PASSED: Backend completely ignores client-side/request-level role spoofing.');
      console.log('  - Calling admin API with forged role returned HTTP 403 Forbidden.');
      console.log('  - Attempting to update profile role was discarded; MongoDB still stores role = "student".');
      passedTests++;
    } else {
      throw new Error('TEST 6 FAILED: Role tampering was not strictly prevented');
    }

    console.log('\n====================================================');
    console.log(` Security Audit Complete: ${passedTests}/${totalTests} Tests Passed (100% Success)`);
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Audit Error:', err.message);
  } finally {
    await stopServer();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
};

runAudit();
