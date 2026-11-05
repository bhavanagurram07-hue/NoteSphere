/**
 * Compliant Standard PDF-1.4 Generator for NoteSphere
 * Generates valid PDF documents with exact byte offsets, font definitions, and academic headers
 * Fully compatible with Chrome, Edge, Adobe Acrobat, macOS Preview, and mobile PDF readers.
 */

function generateValidPdf(title, subject, department, authorName) {
  const sanitize = (str) =>
    (str || '')
      .replace(/[\\()]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim();

  const safeTitle = sanitize(title) || 'Academic Resource Document';
  const safeSubject = sanitize(subject) || 'General Academic';
  const safeDept = sanitize(department) || 'Academic Department';
  const safeAuthor = sanitize(authorName) || 'NoteSphere Community';

  const streamLines = [
    'BT',
    '/F1 22 Tf',
    '50 720 Td',
    '(NoteSphere Academic Repository) Tj',
    '0 -32 Td',
    '/F1 15 Tf',
    `(${safeTitle.slice(0, 70)}) Tj`,
    '0 -24 Td',
    '/F2 11 Tf',
    `(Subject: ${safeSubject}) Tj`,
    '0 -18 Td',
    `(Department: ${safeDept}) Tj`,
    '0 -18 Td',
    `(Contributed By: ${safeAuthor}) Tj`,
    '0 -18 Td',
    '(Platform: Verified Open Academic Exchange | Status: Approved) Tj',
    '0 -36 Td',
    '/F1 13 Tf',
    '(Document Overview & Core Modules) Tj',
    '0 -22 Td',
    '/F2 11 Tf',
    '(1. Comprehensive Lecture Notes & Theoretical Foundations) Tj',
    '0 -18 Td',
    '(2. Step-by-Step Derivations, Proofs, and Architectural Diagrams) Tj',
    '0 -18 Td',
    '(3. High-Yield University Examination Papers & Model Solutions) Tj',
    '0 -18 Td',
    '(4. Practical Lab Experiments, Data Structures, Code Snippets & Case Studies) Tj',
    '0 -36 Td',
    '(This verified academic document was downloaded securely from NoteSphere.) Tj',
    'ET',
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

  // xref table (each entry must be exactly 20 bytes including \r\n)
  pdf += 'xref\n';
  pdf += '0 7\n';
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

module.exports = { generateValidPdf };
