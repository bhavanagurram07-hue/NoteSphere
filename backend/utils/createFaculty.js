/**
 * Secure Faculty Provisioning Script for NoteSphere
 *
 * Usage:
 *   node backend/utils/createFaculty.js [email] [password] [name] [department]
 * Default:
 *   node backend/utils/createFaculty.js
 *   Creates/verifies 'faculty@notesphere.edu' with role = 'faculty'
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const provisionFaculty = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB Connected for Faculty Provisioning]');

    const email = (process.argv[2] || process.env.FACULTY_EMAIL || 'faculty@notesphere.edu').toLowerCase().trim();
    const password = process.argv[3] || process.env.FACULTY_PASSWORD || 'faculty123';
    const name = process.argv[4] || 'Prof. Eleanor Vance';
    const department = process.argv[5] || 'Computer Science';

    let faculty = await User.findOne({ email });

    if (!faculty) {
      faculty = await User.create({
        name,
        email,
        password,
        department,
        semester: 'Faculty Member',
        registrationNumber: 'FAC-' + Date.now().toString().slice(-4),
        role: 'faculty',
        profileImage:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isBlocked: false,
      });
      console.log(`✓ Successfully provisioned NEW faculty: ${email} (role: faculty)`);
    } else {
      faculty.role = 'faculty';
      faculty.isBlocked = false;
      if (process.argv[3]) {
        faculty.password = password;
      }
      await faculty.save();
      console.log(`✓ Verified existing user: ${email} is confirmed with role = faculty`);
    }

    console.log('\n[Security Check]:');
    console.log(`- User ID: ${faculty._id}`);
    console.log(`- Name: ${faculty.name}`);
    console.log(`- Email: ${faculty.email}`);
    console.log(`- Role in Database: ${faculty.role}`);
    console.log(`- Department: ${faculty.department}`);
  } catch (err) {
    console.error('Faculty provisioning error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

provisionFaculty();
