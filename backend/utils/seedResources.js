const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { generateValidPdf } = require('./pdfGenerator');

const createAcademicPdf = (title, subject, department, authorName) => {
  return generateValidPdf(title, subject, department, authorName);
};

const sampleResources = [
  {
    title: 'Data Structures & Algorithms Comprehensive Notes',
    description:
      'Complete handwritten and typed lecture notes covering Trees, Graphs, Dynamic Programming, Sorting algorithms, and Time Complexity proofs with diagrams.',
    subject: 'Data Structures and Algorithms',
    department: 'Computer Science',
    semester: 'Semester 3',
    category: 'Class Notes',
    fileName: 'DSA_Comprehensive_Lecture_Notes.pdf',
    downloads: 142,
    averageRating: 4.8,
    totalRatings: 28,
  },
  {
    title: 'Operating Systems Midterm & Endsem Solved Papers',
    description:
      'Past 5 years solved university examination papers including CPU Scheduling, Memory Management paging questions, and Deadlock resolution algorithms.',
    subject: 'Operating Systems',
    department: 'Computer Science',
    semester: 'Semester 4',
    category: 'Previous Question Papers',
    fileName: 'OS_Solved_Past_Papers.pdf',
    downloads: 98,
    averageRating: 4.6,
    totalRatings: 19,
  },
  {
    title: 'Digital Signal Processing Lab Manual & MATLAB Code',
    description:
      'Lab experiments manual with verified MATLAB codes, FFT implementations, FIR/IIR filter design, and sample viva voce questions.',
    subject: 'Digital Signal Processing',
    department: 'Electronics & Comm.',
    semester: 'Semester 5',
    category: 'Lab Manuals',
    fileName: 'DSP_Lab_Manual_MATLAB.pdf',
    downloads: 75,
    averageRating: 4.5,
    totalRatings: 14,
  },
  {
    title: 'Thermodynamics & Heat Transfer Formula Handbook',
    description:
      'Formula sheets, steam tables guide, and solved problem sets for First and Second Law of Thermodynamics, Otto and Diesel cycles.',
    subject: 'Applied Thermodynamics',
    department: 'Mechanical Eng.',
    semester: 'Semester 3',
    category: 'Study Materials',
    fileName: 'Thermodynamics_Formula_Handbook.pdf',
    downloads: 62,
    averageRating: 4.7,
    totalRatings: 11,
  },
  {
    title: 'Discrete Mathematics Proofs and Practice Problems',
    description:
      'Comprehensive guide to Graph Theory, Set Theory, Relations, Predicate Logic, and Combinatorics with step-by-step mathematical inductions.',
    subject: 'Discrete Mathematics',
    department: 'Applied Mathematics',
    semester: 'Semester 3',
    category: 'Assignments',
    fileName: 'Discrete_Math_Proofs_Practice.pdf',
    downloads: 88,
    averageRating: 4.9,
    totalRatings: 22,
  },
  {
    title: 'Microprocessors & 8086 Assembly Programming Guide',
    description:
      'Architecture breakdown, pin diagrams, memory segmentation explanation, and complete collection of 8086 assembly language programs.',
    subject: 'Microprocessors & Microcontrollers',
    department: 'Electronics & Comm.',
    semester: 'Semester 5',
    category: 'E-books',
    fileName: 'Microprocessors_8086_Assembly_Guide.pdf',
    downloads: 54,
    averageRating: 4.4,
    totalRatings: 9,
  },
  {
    title: 'Financial Management & Corporate Accounting Primer',
    description:
      'Financial ratio analysis cheat sheet, cash flow statements, working capital management, and capital budgeting problem walk-throughs.',
    subject: 'Financial Management',
    department: 'Business & Mgmt',
    semester: 'Semester 4',
    category: 'Study Materials',
    fileName: 'Financial_Management_Accounting_Primer.pdf',
    downloads: 41,
    averageRating: 4.6,
    totalRatings: 7,
  },
];

const seedResources = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB Connected for Resource Seeding]');

    // Find demo student
    let student = await User.findOne({ email: 'alex.johnson@campus.edu' });
    if (!student) {
      student = await User.findOne({ role: 'student' });
    }
    if (!student) {
      student = await User.create({
        name: 'Alex Johnson',
        email: 'alex.johnson@campus.edu',
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 5',
        registrationNumber: 'CS-2024-042',
        role: 'student',
        isBlocked: false,
      });
      console.log('✓ Created Demo Student:', student.email);
    }

    const uploadsDir = path.join(__dirname, '../uploads/resources');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clear existing mock/old resources if wanted, or ensure these exist
    for (const item of sampleResources) {
      const existing = await Resource.findOne({ title: item.title });
      const diskFileName = `${Date.now()}-${item.fileName}`;
      const filePath = path.join(uploadsDir, diskFileName);

      // Create physical PDF file on disk
      const pdfBuffer = createAcademicPdf(
        item.title,
        item.subject,
        item.department,
        student.name
      );
      fs.writeFileSync(filePath, pdfBuffer);

      if (!existing) {
        await Resource.create({
          title: item.title,
          description: item.description,
          subject: item.subject,
          department: item.department,
          semester: item.semester,
          category: item.category,
          uploadedBy: student._id,
          fileUrl: `/uploads/resources/${diskFileName}`,
          publicId: `local-${diskFileName}`,
          fileType: 'pdf',
          fileSize: pdfBuffer.length,
          downloads: item.downloads,
          averageRating: item.averageRating,
          totalRatings: item.totalRatings,
          status: 'approved',
        });
        console.log(`✓ Seeded resource: "${item.title}"`);
      } else {
        // Update file path to ensure physical file exists
        existing.fileUrl = `/uploads/resources/${diskFileName}`;
        existing.publicId = `local-${diskFileName}`;
        existing.status = 'approved';
        await existing.save();
        console.log(`• Updated physical file for existing resource: "${item.title}"`);
      }
    }

    const totalInDb = await Resource.countDocuments();
    console.log(`\nAll resources seeded successfully! Total in MongoDB: ${totalInDb}`);
  } catch (err) {
    console.error('Resource seeding error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedResources();
