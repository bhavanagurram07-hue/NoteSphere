/**
 * NoteSphere Authorized Faculty Provisioning Script
 * 
 * Safely provisions or updates a Faculty account in MongoDB using
 * environment variables (FACULTY_EMAIL, FACULTY_PASSWORD).
 * 
 * Usage:
 *   node backend/scripts/seedFaculty.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';

const facultyEmail = (process.env.FACULTY_EMAIL || 'faculty@notesphere.com').trim().toLowerCase();
const facultyPassword = process.env.FACULTY_PASSWORD;
const facultyName = process.env.FACULTY_NAME || 'Faculty Member';
const facultyDepartment = process.env.FACULTY_DEPARTMENT || 'Computer Science';

if (!facultyPassword) {
  console.error('✖ Error: FACULTY_PASSWORD environment variable is missing.');
  console.error('Please configure FACULTY_PASSWORD in backend/.env before running this script.');
  process.exit(1);
}

if (facultyPassword.length < 6) {
  console.error('✖ Error: FACULTY_PASSWORD must be at least 6 characters long.');
  process.exit(1);
}

async function seedFaculty() {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(MONGO_URI);
    console.log('✔ Connected to MongoDB successfully.');

    // 1. Safely migrate any remaining legacy 'admin' accounts to 'faculty'
    const legacyAdminMigrate = await User.updateMany(
      { role: 'admin' },
      { $set: { role: 'faculty' } }
    );
    if (legacyAdminMigrate.modifiedCount > 0) {
      console.log(`✔ Safely migrated ${legacyAdminMigrate.modifiedCount} legacy admin account(s) to role: "faculty".`);
    }

    // 2. Check if the target faculty account already exists
    let existingFaculty = await User.findOne({ email: facultyEmail });

    if (existingFaculty) {
      console.log(`ℹ Faculty account with email <${facultyEmail}> already exists.`);
      let updated = false;

      if (existingFaculty.role !== 'faculty') {
        existingFaculty.role = 'faculty';
        updated = true;
      }

      if (existingFaculty.isBlocked) {
        existingFaculty.isBlocked = false;
        updated = true;
      }

      // Update password securely through model pre-save hook
      existingFaculty.password = facultyPassword;
      await existingFaculty.save();
      console.log(`✔ Faculty credentials and role verified/updated for <${facultyEmail}>.`);
    } else {
      // 3. Create new Faculty account
      const newFaculty = await User.create({
        name: facultyName,
        email: facultyEmail,
        password: facultyPassword, // hashed automatically by User model pre-save hook using bcryptjs
        department: facultyDepartment,
        semester: 'Faculty Member',
        registrationNumber: 'FAC-001',
        role: 'faculty',
        isBlocked: false,
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });

      console.log(`✔ Successfully created new authorized Faculty account:`);
      console.log(`  - ID: ${newFaculty._id}`);
      console.log(`  - Name: ${newFaculty.name}`);
      console.log(`  - Email: ${newFaculty.email}`);
      console.log(`  - Role: ${newFaculty.role}`);
      console.log(`  - Password: [REDACTED / SECURELY BCRYPT-HASHED]`);
    }

    // 4. Verification Check
    const verifiedUser = await User.findOne({ email: facultyEmail }).select('+password');
    const isHashed = verifiedUser.password && verifiedUser.password.startsWith('$2');
    console.log(`✔ Security check: Password is stored as bcrypt hash: ${isHashed ? 'YES' : 'NO'}`);
    console.log(`✔ Database role verified: "${verifiedUser.role}"`);
    console.log('\nFaculty account setup complete and ready for login.');

  } catch (error) {
    console.error('✖ Faculty provisioning failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedFaculty();
