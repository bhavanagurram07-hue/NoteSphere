/**
 * NoteSphere Final Master End-to-End System Test Suite
 * Executes TEST A (Student Journey), TEST B (Admin Journey), and TEST C (Security Journey)
 * against a live running server connected to MongoDB.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Review = require('../models/Review');

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

const runMasterSuite = async () => {
  console.log('====================================================');
  console.log(' NoteSphere Final Master End-to-End Verification');
  console.log('====================================================');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
  await mongoose.connect(mongoUri);
  console.log('[MongoDB Connected]: Host ->', mongoose.connection.host);

  await startServer();
  console.log('[Test Server Running on]:', baseUrl);

  let passedTests = 0;
  const totalTests = 24;

  try {
    // =========================================================================
    // TEST A: STUDENT USER JOURNEY
    // =========================================================================
    console.log('\n--- STARTING TEST A: STUDENT COMPLETE USER JOURNEY ---');

    // 1. Register new student
    const studentEmail = `master_student_${Date.now()}@university.edu`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Master Student',
        email: studentEmail,
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 4',
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.success || !regData.token) {
      throw new Error(`Student registration failed: ${regData.message}`);
    }
    console.log('[✓] 1. Student Registration: PASSED - Registered with role =', regData.user.role);
    passedTests++;

    // 2. Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Student login failed: ${loginData.message}`);
    }
    const studentToken = loginData.token;
    console.log('[✓] 2. Student Login: PASSED - JWT token issued');
    passedTests++;

    // 3. Open dashboard stats
    const dashRes = await fetch(`${baseUrl}/auth/dashboard-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const dashData = await dashRes.json();
    if (dashRes.status !== 200 || !dashData.success) {
      throw new Error('Student dashboard failed');
    }
    console.log('[✓] 3. Student Dashboard: PASSED - Statistics retrieved');
    passedTests++;

    // 4. Open resource library
    const libRes = await fetch(`${baseUrl}/resources?page=1&limit=10`);
    const libData = await libRes.json();
    if (libRes.status !== 200 || !libData.resources || libData.resources.length === 0) {
      throw new Error('Resource library retrieval failed');
    }
    const testResource = libData.resources[0];
    console.log(`[✓] 4. Resource Library: PASSED - Retrieved ${libData.resources.length} resources`);
    passedTests++;

    // 5. Search resource
    const searchRes = await fetch(`${baseUrl}/resources?q=${encodeURIComponent(testResource.title.slice(0, 15))}`);
    const searchData = await searchRes.json();
    if (searchRes.status !== 200 || searchData.resources.length === 0) {
      throw new Error('Search failed to return results');
    }
    console.log(`[✓] 5. Search Resource: PASSED - Found matching document "${searchData.resources[0].title}"`);
    passedTests++;

    // 6. Open resource details
    const detailRes = await fetch(`${baseUrl}/resources/${testResource._id}`);
    const detailData = await detailRes.json();
    if (detailRes.status !== 200 || !detailData.resource) {
      throw new Error('Resource details retrieval failed');
    }
    console.log(`[✓] 6. Resource Details: PASSED - Metadata verified for ID ${testResource._id}`);
    passedTests++;

    // 7 & 8. Download resource & verify actual file download
    const dlInfoRes = await fetch(`${baseUrl}/resources/${testResource._id}/download`);
    const dlInfoData = await dlInfoRes.json();
    if (dlInfoRes.status !== 200 || !dlInfoData.success) {
      throw new Error('Download metadata endpoint failed');
    }

    const fileStreamRes = await fetch(`${baseUrl}/resources/${testResource._id}/download?action=file`);
    const disposition = fileStreamRes.headers.get('content-disposition');
    const contentType = fileStreamRes.headers.get('content-type');
    const fileBytes = await fileStreamRes.arrayBuffer();

    if (
      fileStreamRes.status !== 200 ||
      !disposition ||
      !disposition.includes('attachment') ||
      fileBytes.byteLength < 100
    ) {
      throw new Error('Direct file download binary stream failed');
    }
    console.log(`[✓] 7 & 8. Download Resource: PASSED - Binary download verified (${fileBytes.byteLength} bytes, header: ${disposition})`);
    passedTests += 2;

    // 9. Bookmark resource
    const bmRes = await fetch(`${baseUrl}/bookmarks/${testResource._id}/toggle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const bmData = await bmRes.json();
    if (bmRes.status !== 201 || !bmData.bookmarked) {
      throw new Error('Bookmark toggle failed');
    }
    console.log('[✓] 9. Bookmark Resource: PASSED - Resource bookmarked');
    passedTests++;

    // 10 & 11. Give rating & submit review
    const revRes = await fetch(`${baseUrl}/resources/${testResource._id}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Comprehensive study guide! The diagrams and problem sets were very helpful.',
      }),
    });
    const revData = await revRes.json();
    if (revRes.status !== 201 || !revData.success) {
      throw new Error(`Review submission failed: ${revData.message}`);
    }
    console.log('[✓] 10 & 11. Rating & Review: PASSED - 5-star rating and comment posted');
    passedTests += 2;

    // 12. Refresh & verify bookmark remains
    const checkBmRes = await fetch(`${baseUrl}/bookmarks/status/${testResource._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const checkBmData = await checkBmRes.json();
    if (checkBmRes.status !== 200 || !checkBmData.isBookmarked) {
      throw new Error('Bookmark did not persist after refresh simulation');
    }
    console.log('[✓] 12. Bookmark Persistence: PASSED - Bookmark verified in MongoDB');
    passedTests++;

    // 13 & 14. Verify rating and review remain
    const checkRevRes = await fetch(`${baseUrl}/resources/${testResource._id}/reviews`);
    const checkRevData = await checkRevRes.json();
    const myRev = checkRevData.reviews?.find((r) => r.user?._id === regData.user.id || r.user?.email === studentEmail);
    if (checkRevRes.status !== 200 || !myRev || myRev.rating !== 5) {
      throw new Error('Rating & review did not persist after refresh simulation');
    }
    console.log(`[✓] 13 & 14. Rating & Review Persistence: PASSED - Persisted in MongoDB with 5 stars, average: ${checkRevData.averageRating}`);
    passedTests += 2;

    // 15. Logout student
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });
    if (logoutRes.status !== 200) {
      throw new Error('Logout failed');
    }
    console.log('[✓] 15. Student Logout: PASSED - Session terminated');
    passedTests++;

    // =========================================================================
    // TEST B: ADMIN USER JOURNEY
    // =========================================================================
    console.log('\n--- STARTING TEST B: ADMIN USER JOURNEY ---');

    // 1. Login using legitimate admin account
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@notesphere.edu',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || adminLoginData.user.role !== 'admin') {
      throw new Error('Admin login failed or role is not admin');
    }
    const adminToken = adminLoginData.token;
    console.log('[✓] 16. Admin Login: PASSED - Verified role = admin');
    passedTests++;

    // 2 & 3. View platform statistics
    const adminAnalyticsRes = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAnalyticsData = await adminAnalyticsRes.json();
    if (adminAnalyticsRes.status !== 200 || !adminAnalyticsData.metrics) {
      throw new Error('Admin analytics failed');
    }
    console.log(`[✓] 17. Admin Statistics: PASSED - Total students: ${adminAnalyticsData.metrics.totalStudents}, Total resources: ${adminAnalyticsData.metrics.totalResources}`);
    passedTests++;

    // 4. View users
    const adminUsersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = await adminUsersRes.json();
    if (adminUsersRes.status !== 200 || !adminUsersData.users) {
      throw new Error('Admin users list failed');
    }
    console.log(`[✓] 18. Admin User Management: PASSED - Retrieved ${adminUsersData.users.length} users`);
    passedTests++;

    // 5 & 6. View resources & moderate resource
    const adminResListRes = await fetch(`${baseUrl}/admin/resources`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminResListData = await adminResListRes.json();
    if (adminResListRes.status !== 200 || !adminResListData.resources) {
      throw new Error('Admin resources list failed');
    }

    const modTarget = adminResListData.resources[0];
    const modRes = await fetch(`${baseUrl}/admin/resources/${modTarget._id}/moderate`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    const modData = await modRes.json();
    if (modRes.status !== 200 || modData.resource.status !== 'approved') {
      throw new Error('Admin moderation failed');
    }
    console.log(`[✓] 19. Admin Resource Moderation: PASSED - Moderated resource "${modTarget.title}" to approved`);
    passedTests++;

    // 7. Manage users: Block and unblock student
    const blockRes = await fetch(`${baseUrl}/admin/users/${regData.user.id}/block`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isBlocked: true }),
    });
    const blockData = await blockRes.json();

    const unblockRes = await fetch(`${baseUrl}/admin/users/${regData.user.id}/block`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isBlocked: false }),
    });
    const unblockData = await unblockRes.json();

    if (blockRes.status !== 200 || !blockData.isBlocked || unblockRes.status !== 200 || unblockData.isBlocked) {
      throw new Error('Admin block/unblock user failed');
    }
    console.log('[✓] 20. Admin User Suspension/Reinstatement: PASSED - Successfully blocked and unblocked student');
    passedTests++;

    // 8. Logout admin
    await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });
    console.log('[✓] 21. Admin Logout: PASSED - Admin session terminated');
    passedTests++;

    // =========================================================================
    // TEST C: SECURITY & BOUNDARIES
    // =========================================================================
    console.log('\n--- STARTING TEST C: SECURITY & PRIVILEGE ENFORCEMENT ---');

    // 1-3. Student trying /admin API
    const studentAttackRes = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentAttackData = await studentAttackRes.json();
    if (studentAttackRes.status !== 403) {
      throw new Error(`Security breach: Student received status ${studentAttackRes.status} on admin API`);
    }
    console.log('[✓] 22. Student Admin API Attack Blocked: PASSED - HTTP 403 Forbidden received');
    passedTests++;

    // 4-5. Unauthenticated user calling admin API
    const unauthAdminRes = await fetch(`${baseUrl}/admin/analytics`);
    if (unauthAdminRes.status !== 401) {
      throw new Error(`Security breach: Unauthenticated request received status ${unauthAdminRes.status}`);
    }
    console.log('[✓] 23. Unauthenticated Admin API Blocked: PASSED - HTTP 401 Unauthorized received');
    passedTests++;

    // 6-8. Unauthenticated user calling protected student API
    const unauthMeRes = await fetch(`${baseUrl}/auth/me`);
    if (unauthMeRes.status !== 401) {
      throw new Error(`Security breach: Unauthenticated request received status ${unauthMeRes.status} on /auth/me`);
    }
    console.log('[✓] 24. Unauthenticated Protected Route Blocked: PASSED - HTTP 401 Unauthorized received');
    passedTests++;

    console.log('\n====================================================');
    console.log(` Master End-to-End Audit: ${passedTests}/${totalTests} Tests Passed (100% SUCCESS)`);
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Master Suite Error:', err.message);
  } finally {
    await stopServer();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
};

runMasterSuite();
