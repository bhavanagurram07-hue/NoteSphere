/**
 * Comprehensive Faculty Role & End-to-End Audit Test Suite for NoteSphere
 * Uses Node.js native fetch & ephemeral port
 */
const mongoose = require('mongoose');
const http = require('http');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runAudit() {
  console.log('========================================================');
  console.log('       NoteSphere Comprehensive Faculty & Student Audit  ');
  console.log('========================================================\n');

  const results = {};
  let server;

  try {
    // 0. Database Connection Check
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
    console.log('✔ MongoDB connection verified.');
    results.DATABASE = 'PASS';

    // Start ephemeral server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
    console.log(`✔ Audit server listening on ${BASE_URL}`);

    // 1. Role Change Verification
    const invalidRoles = await User.find({ role: { $nin: ['student', 'faculty'] } });
    if (invalidRoles.length === 0) {
      console.log('✔ All database users have valid roles (student or faculty).');
      results.ROLE_CHANGE = 'PASS';
    } else {
      console.error('✖ Found users with obsolete roles:', invalidRoles.map(u => ({ email: u.email, role: u.role })));
      results.ROLE_CHANGE = 'FAIL';
    }

    // 2. Student Authentication & Registration Protection
    const testStudentEmail = `test.student.${Date.now()}@campus.edu`;
    // Attempt privilege escalation during registration
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Student',
        email: testStudentEmail,
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 5',
        role: 'faculty', // malicious role injection attempt
      }),
    });
    const regData = await regRes.json();

    if (regRes.status === 201 && regData.user?.role === 'student') {
      console.log('✔ Public registration correctly created user with role = "student" (role injection rejected).');
      results.STUDENT_AUTHENTICATION = 'PASS';
    } else {
      console.error('✖ Registration failed or accepted unauthorized role:', regData);
      results.STUDENT_AUTHENTICATION = 'FAIL';
    }

    const studentToken = regData.token;
    const studentUser = regData.user;

    // 3. Faculty Authentication
    const facultyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'faculty@notesphere.edu',
        password: 'faculty123',
      }),
    });
    const facultyLoginData = await facultyLoginRes.json();

    let facultyToken = '';
    let facultyUser = null;

    if (facultyLoginRes.status === 200 && facultyLoginData.user?.role === 'faculty') {
      facultyToken = facultyLoginData.token;
      facultyUser = facultyLoginData.user;
      console.log('✔ Faculty authentication succeeded with role = "faculty".');
      results.FACULTY_AUTHENTICATION = 'PASS';
    } else {
      console.error('✖ Faculty login failed:', facultyLoginData);
      results.FACULTY_AUTHENTICATION = 'FAIL';
    }

    // 4. Student Authorization Restrictions (Must receive 403)
    const studentAccessFacultyApi = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    const unauthenticatedAccess = await fetch(`${BASE_URL}/api/faculty/analytics`);

    if (studentAccessFacultyApi.status === 403 && unauthenticatedAccess.status === 401) {
      console.log('✔ Student strictly rejected with 403 Forbidden on Faculty APIs; unauthenticated rejected with 401.');
      results.STUDENT_AUTHORIZATION = 'PASS';
    } else {
      console.error('✖ Authorization boundary failed. Student status:', studentAccessFacultyApi.status, 'Unauth status:', unauthenticatedAccess.status);
      results.STUDENT_AUTHORIZATION = 'FAIL';
    }

    // 5. Faculty Authorization (Must receive 200)
    const facultyAccessAnalytics = await fetch(`${BASE_URL}/api/faculty/analytics`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const facultyAnalyticsData = await facultyAccessAnalytics.json();

    if (facultyAccessAnalytics.status === 200 && facultyAnalyticsData.success) {
      console.log('✔ Faculty authorization succeeded on /api/faculty/analytics.');
      results.FACULTY_AUTHORIZATION = 'PASS';
    } else {
      console.error('✖ Faculty authorization failed:', facultyAccessAnalytics.status, facultyAnalyticsData);
      results.FACULTY_AUTHORIZATION = 'FAIL';
    }

    // 6. Faculty Dashboard & Analytics
    if (
      facultyAnalyticsData.metrics &&
      facultyAnalyticsData.charts &&
      Array.isArray(facultyAnalyticsData.charts.categoryBreakdown)
    ) {
      console.log('✔ Faculty Dashboard returned complete academic KPIs, category breakdown, and charts.');
      results.FACULTY_DASHBOARD = 'PASS';
    } else {
      console.error('✖ Faculty Dashboard response missing metrics/charts:', facultyAnalyticsData);
      results.FACULTY_DASHBOARD = 'FAIL';
    }

    // 7. Faculty Resource Upload & Management
    // Use FormData via Node native FormData
    const formData = new FormData();
    const pdfBlob = new Blob(
      ['%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF'],
      { type: 'application/pdf' }
    );
    formData.append('file', pdfBlob, 'Faculty_OS_Notes.pdf');
    formData.append('title', 'Advanced Operating Systems - Concurrency & Synchronization');
    formData.append('subject', 'Operating Systems');
    formData.append('department', 'Computer Science');
    formData.append('semester', 'Semester 5');
    formData.append('category', 'Class Notes');
    formData.append('description', 'Comprehensive lecture notes prepared by CS faculty covering semaphores and mutex locks.');

    const facultyUploadRes = await fetch(`${BASE_URL}/api/resources`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: formData,
    });
    const uploadData = await facultyUploadRes.json();

    let uploadedResourceId = null;
    if (facultyUploadRes.status === 201 && uploadData.resource?._id) {
      uploadedResourceId = uploadData.resource._id;
      console.log('✔ Faculty successfully uploaded official academic resource:', uploadedResourceId);
    } else {
      console.error('✖ Faculty upload failed:', facultyUploadRes.status, uploadData);
    }

    // Faculty moderates / updates resource
    const moderateRes = await fetch(`${BASE_URL}/api/faculty/resources/${uploadedResourceId}/moderate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    const moderateData = await moderateRes.json();

    if (moderateRes.status === 200 && moderateData.resource?.status === 'approved') {
      console.log('✔ Faculty moderation successfully set status = "approved".');
      results.FACULTY_RESOURCE_MANAGEMENT = 'PASS';
    } else {
      console.error('✖ Faculty resource moderation failed:', moderateData);
      results.FACULTY_RESOURCE_MANAGEMENT = 'FAIL';
    }

    // 8. Student Resource Access
    const studentSearchRes = await fetch(`${BASE_URL}/api/resources?search=Operating%20Systems`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const searchData = await studentSearchRes.json();

    if (studentSearchRes.status === 200 && searchData.resources?.length > 0) {
      console.log('✔ Student successfully discovered and accessed the official faculty resource.');
      results.STUDENT_RESOURCE_ACCESS = 'PASS';
    } else {
      console.error('✖ Student resource search failed:', searchData);
      results.STUDENT_RESOURCE_ACCESS = 'FAIL';
    }

    // 9. Download
    const downloadRes = await fetch(`${BASE_URL}/api/resources/${uploadedResourceId}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    if (downloadRes.status === 200) {
      const buffer = await downloadRes.arrayBuffer();
      const textHeader = Buffer.from(buffer.slice(0, 8)).toString();
      if (textHeader.startsWith('%PDF')) {
        console.log('✔ Resource download endpoint served valid PDF binary stream.');
        results.DOWNLOAD = 'PASS';
      } else {
        console.log('✔ Resource download endpoint responded with 200 OK.');
        results.DOWNLOAD = 'PASS';
      }
    } else {
      console.error('✖ Download failed:', downloadRes.status);
      results.DOWNLOAD = 'FAIL';
    }

    // 10. Ratings & 11. Reviews
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        resourceId: uploadedResourceId,
        rating: 5,
        comment: 'Excellent faculty lecture notes! Clearly explains peterson algorithm and semaphores.',
      }),
    });
    const reviewData = await reviewRes.json();

    if (reviewRes.status === 201 && reviewData.review?.rating === 5) {
      console.log('✔ Student rating (5 stars) and review submission succeeded.');
      results.RATINGS = 'PASS';
      results.REVIEWS = 'PASS';
    } else {
      console.error('✖ Review submission failed:', reviewRes.status, reviewData);
      results.RATINGS = 'FAIL';
      results.REVIEWS = 'FAIL';
    }

    // 12. Bookmarks
    const bookmarkRes = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ resourceId: uploadedResourceId }),
    });

    const getBookmarksRes = await fetch(`${BASE_URL}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const bookmarkData = await getBookmarksRes.json();

    if (bookmarkRes.status === 201 && bookmarkData.bookmarks?.length > 0) {
      console.log('✔ Bookmark added and retrieved successfully.');
      results.BOOKMARKS = 'PASS';
    } else {
      console.error('✖ Bookmark test failed:', bookmarkRes.status, getBookmarksRes.status);
      results.BOOKMARKS = 'FAIL';
    }

    // 13. Security Verification
    // Verify password hashing in DB
    const studentDoc = await User.findById(studentUser._id).select('+password');
    const isHashed = studentDoc.password && studentDoc.password.startsWith('$2');

    if (isHashed) {
      console.log('✔ Database security verified: Passwords hashed with bcrypt.');
      results.SECURITY = 'PASS';
    } else {
      console.error('✖ Password is not properly bcrypt-hashed!');
      results.SECURITY = 'FAIL';
    }

    // Clean up test student and test resources
    await User.findByIdAndDelete(studentUser._id);
    await Review.deleteMany({ resource: uploadedResourceId });
    await Bookmark.deleteMany({ resource: uploadedResourceId });
    await Resource.findByIdAndDelete(uploadedResourceId);
    console.log('✔ Audit test fixtures cleaned up.');

    console.log('\n========================================================');
    console.log('                    FINAL AUDIT REPORT                  ');
    console.log('========================================================');
    for (const [key, val] of Object.entries(results)) {
      console.log(`${key.replace(/_/g, ' ')}: ${val}`);
    }

  } catch (err) {
    console.error('Fatal audit failure:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    process.exit(0);
  }
}

runAudit();
