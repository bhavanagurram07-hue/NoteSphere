/**
 * Compliant Standard PDF-1.4 Generator for Frontend NoteSphere Downloads
 * Generates well-formed binary PDF documents with valid font dictionaries and exact xref table offsets.
 * Opens flawlessly in Microsoft Edge, Google Chrome, Adobe Acrobat, and macOS Preview.
 */

export function generateAcademicPdfBlob(title, subject, department, authorName) {
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
  const encoder = new TextEncoder();
  const streamLength = encoder.encode(streamContent).length;

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  function addObject(objNum, body) {
    offsets[objNum] = encoder.encode(pdf).length;
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

  const startxref = encoder.encode(pdf).length;

  // xref table
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

  return new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
}
