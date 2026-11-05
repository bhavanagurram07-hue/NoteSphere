const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');

const TEST_PORT = 5008;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDownloadAudit() {
  console.log('====================================================');
  console.log(' NoteSphere Download Flow Audit & Verification');
  console.log('====================================================');

  // 1. Connect to MongoDB
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

  const auditResults = [];
  const recordResult = (checkName, passed, details) => {
    auditResults.push({ checkName, status: passed ? 'PASSED' : 'FAILED', details });
    const mark = passed ? '✓' : '✗';
    console.log(`[${mark}] ${checkName}: ${passed ? 'PASSED' : 'FAILED'} - ${details}`);
  };

  let studentToken = '';
  let studentId = '';
  let resourceId = '';
  let uploadedPdfContent = '%PDF-1.4\n%NoteSphere Actual PDF Test Document\n1 0 obj\n<< /Title (Operating Systems) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';

  try {
    // Step 1: Register test student
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Download Auditor',
        email: `auditor_${Date.now()}@university.edu`,
        password: 'Password123!',
        department: 'Computer Science',
        semester: 'Semester 5',
      }),
    });
    const regData = await regRes.json();
    studentToken = regData.token;
    studentId = regData.user?._id;

    // Step 2: Upload real PDF file
    const formData = new FormData();
    formData.append('title', 'Computer Networks - TCP/IP Protocol Suite & Subnetting Guide');
    formData.append('description', 'Detailed notes on IP addressing, CIDR, sliding window protocols, and congestion control.');
    formData.append('subject', 'Computer Networks');
    formData.append('department', 'Computer Science');
    formData.append('semester', 'Semester 5');
    formData.append('category', 'Class Notes');

    const pdfBlob = new Blob([uploadedPdfContent], { type: 'application/pdf' });
    formData.append('file', pdfBlob, 'tcp_ip_subnetting_guide.pdf');

    const uploadRes = await fetch(`${BASE_URL}/resources`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();

    const uploadPassed = uploadRes.status === 201 && uploadData.success && uploadData.resource?._id;
    resourceId = uploadData.resource?._id;

    recordResult(
      '1. Actual PDF File Upload',
      uploadPassed,
      `Status ${uploadRes.status}, Resource ID=${resourceId}, fileType=${uploadData.resource?.fileType}`
    );

    // Step 3: Audit MongoDB Record & Storage Location
    const docInDb = await Resource.findById(resourceId);
    const storageLocation = docInDb.publicId.startsWith('local-')
      ? `Local Disk (backend/uploads/resources/${docInDb.publicId.replace('local-', '')})`
      : `Cloudinary Cloud Storage (Public ID: ${docInDb.publicId})`;

    recordResult(
      '2. File Storage Location Audit',
      docInDb.fileUrl && docInDb.publicId,
      `Storage Type: ${storageLocation}, MongoDB fileUrl: ${docInDb.fileUrl}`
    );

    // Step 4: Test Download API JSON Response (Axios flow)
    const initialDownloads = docInDb.downloads;
    const jsonRes = await fetch(`${BASE_URL}/resources/${resourceId}/download`);
    const jsonData = await jsonRes.json();

    const jsonPassed =
      jsonRes.status === 200 &&
      jsonData.success &&
      jsonData.downloadUrl === docInDb.fileUrl &&
      jsonData.fileName.includes('Computer_Networks') &&
      jsonData.fileName.endsWith('.pdf') &&
      jsonData.downloads === initialDownloads + 1;

    recordResult(
      '3. Download API JSON Flow & Clean Filename',
      jsonPassed,
      `Downloads: ${initialDownloads} -> ${jsonData.downloads}, Filename="${jsonData.fileName}"`
    );

    // Step 5: Test Direct Browser Download Flow (?action=file)
    const directRes = await fetch(`${BASE_URL}/resources/${resourceId}/download?action=file`);
    const dispositionHeader = directRes.headers.get('content-disposition');
    const contentTypeHeader = directRes.headers.get('content-type');
    const downloadedText = await directRes.text();

    const isAttachment = dispositionHeader && dispositionHeader.includes('attachment');
    const hasProperFilename = dispositionHeader && dispositionHeader.includes('Computer_Networks');
    const isPdfContent = downloadedText.includes('%PDF-1.4');

    const directDownloadPassed =
      directRes.status === 200 &&
      isAttachment &&
      hasProperFilename &&
      isPdfContent;

    recordResult(
      '4. Direct File Download (Content-Disposition: attachment)',
      directDownloadPassed,
      `Header: "${dispositionHeader}", Content-Type: ${contentTypeHeader}, Bytes verified: ${downloadedText.length}`
    );

    // Step 6: Verify Atomic Counter in MongoDB
    const finalDoc = await Resource.findById(resourceId);
    const counterPassed = finalDoc.downloads === initialDownloads + 2;

    recordResult(
      '5. Atomic Download Counter Persistence in MongoDB',
      counterPassed,
      `Final downloads count in MongoDB: ${finalDoc.downloads}`
    );

  } catch (err) {
    console.error('Download flow audit exception:', err);
  } finally {
    // Cleanup
    if (studentId) await User.findByIdAndDelete(studentId);
    if (resourceId) {
      const res = await Resource.findById(resourceId);
      if (res && res.publicId && res.publicId.startsWith('local-')) {
        const localPath = path.join(__dirname, '../uploads/resources', res.publicId.replace('local-', ''));
        if (fs.existsSync(localPath)) {
          try { fs.unlinkSync(localPath); } catch (e) {}
        }
      }
      await Resource.findByIdAndDelete(resourceId);
    }

    server.close();

    console.log('====================================================');
    const passedCount = auditResults.filter((r) => r.status === 'PASSED').length;
    console.log(` Download Audit Summary: ${passedCount}/${auditResults.length} checks passed.`);
    console.log('====================================================');

    if (passedCount === auditResults.length) {
      console.log('✓ All download functionality checks passed completely!');
      process.exit(0);
    } else {
      console.error('✗ Some checks failed.');
      process.exit(1);
    }
  }
}

runDownloadAudit();
