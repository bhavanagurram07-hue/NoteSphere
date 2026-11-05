const fs = require('fs');
const path = require('path');

function generateValidPdf(title, subject, department) {
  const sanitize = (str) => (str || '').replace(/[\\()]/g, '');

  const safeTitle = sanitize(title) || 'Academic Document';
  const safeSubject = sanitize(subject) || 'General Academic';
  const safeDept = sanitize(department) || 'College Department';

  // Content stream text
  const streamLines = [
    'BT',
    '/F1 22 Tf',
    '50 720 Td',
    '(NoteSphere Academic Repository) Tj',
    '0 -35 Td',
    '/F1 16 Tf',
    `(${safeTitle}) Tj`,
    '0 -28 Td',
    '/F2 12 Tf',
    `(Subject: ${safeSubject}) Tj`,
    '0 -20 Td',
    `(Department: ${safeDept}) Tj`,
    '0 -20 Td',
    '(Status: Verified & Approved Academic Resource) Tj',
    '0 -40 Td',
    '/F1 14 Tf',
    '(Course Overview & Key Concepts) Tj',
    '0 -22 Td',
    '/F2 11 Tf',
    '(1. Comprehensive Lecture Notes and Summary of Core Modules) Tj',
    '0 -18 Td',
    '(2. Mathematical Formulations, Key Lemmas, and Theoretical Proofs) Tj',
    '0 -18 Td',
    '(3. High-Yield University Exam Questions with Model Solutions) Tj',
    '0 -18 Td',
    '(4. Practical Laboratory Implementations, Code Snippets & Case Studies) Tj',
    '0 -40 Td',
    '(This verified academic material was downloaded from NoteSphere.) Tj',
    'ET'
  ];

  const streamContent = streamLines.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  function addObject(objNum, body) {
    offsets[objNum] = Buffer.byteLength(pdf, 'utf-8');
    pdf += `${objNum} 0 obj\n${body}\nendobj\n`;
  }

  // Obj 1: Catalog
  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');

  // Obj 2: Pages
  addObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

  // Obj 3: Page
  addObject(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>'
  );

  // Obj 4: Contents Stream
  addObject(4, `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`);

  // Obj 5: Font Bold
  addObject(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  // Obj 6: Font Regular
  addObject(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const startxref = Buffer.byteLength(pdf, 'utf-8');

  // xref table
  pdf += 'xref\n';
  pdf += `0 7\n`;
  pdf += '0000000000 65535 f \r\n';
  for (let i = 1; i <= 6; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \r\n`;
  }

  pdf += 'trailer\n';
  pdf += '<< /Size 7 /Root 1 0 R >>\n';
  pdf += 'startxref\n';
  pdf += `${startxref}\n`;
  pdf += '%%EOF\n';

  return Buffer.from(pdf, 'utf-8');
}

const testPdf = generateValidPdf(
  'Operating Systems End-Semester Solved Question Papers (2021-2025)',
  'Operating Systems',
  'Computer Science'
);

fs.writeFileSync(path.join(__dirname, 'test_output.pdf'), testPdf);
console.log('Generated test_output.pdf successfully. Total bytes:', testPdf.length);
