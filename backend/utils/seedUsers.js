const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB Connected for Seeding]');

    // 1. Seed or update Demo Student
    const studentEmail = 'alex.johnson@campus.edu';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        name: 'Alex Johnson',
        email: studentEmail,
        password: 'password123',
        department: 'Computer Science',
        semester: 'Semester 5',
        registrationNumber: 'CS-2024-042',
        role: 'student',
        profileImage:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isBlocked: false,
      });
      console.log('✓ Created Demo Student:', studentEmail, '(password: password123)');
    } else {
      console.log('• Demo Student already exists:', studentEmail);
    }

    // 2. Seed or update Demo Faculty
    const facultyEmail = (process.env.FACULTY_EMAIL || 'faculty@notesphere.com').toLowerCase();
    const facultyPassword = process.env.FACULTY_PASSWORD || 'faculty123';
    let faculty = await User.findOne({ email: facultyEmail });
    if (!faculty) {
      faculty = await User.create({
        name: process.env.FACULTY_NAME || 'Prof. Sarah Jenkins',
        email: facultyEmail,
        password: facultyPassword,
        department: 'Computer Science',
        semester: 'Faculty Member',
        registrationNumber: 'FAC-001',
        role: 'faculty',
        profileImage:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isBlocked: false,
      });
      console.log('✓ Created Authorized Faculty:', facultyEmail, '(role: faculty)');
    } else {
      if (faculty.role !== 'faculty') {
        faculty.role = 'faculty';
        await faculty.save();
      }
      console.log('• Faculty account verified/exists:', facultyEmail);
    }

    // 3. Migrate any legacy admin account to faculty
    await User.updateMany({ role: 'admin' }, { $set: { role: 'faculty' } });

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedUsers();
