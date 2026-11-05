/**
 * NoteSphere Database Migration: Admin -> Faculty
 * Safely converts any existing user records with role = 'admin' to role = 'faculty'
 * Ensures faculty@notesphere.edu and admin@notesphere.edu have role = 'faculty'
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB Connected for Migration]');

    // 1. Update any existing users with role 'admin' to 'faculty'
    const updateResult = await User.updateMany(
      { role: 'admin' },
      { $set: { role: 'faculty' } }
    );
    console.log(`✓ Migrated ${updateResult.modifiedCount} user(s) from role 'admin' to 'faculty'.`);

    // 2. Ensure faculty@notesphere.edu exists with password 'faculty123'
    const facultyEmail = 'faculty@notesphere.edu';
    let facultyUser = await User.findOne({ email: facultyEmail });
    if (!facultyUser) {
      facultyUser = await User.create({
        name: 'Prof. Eleanor Vance',
        email: facultyEmail,
        password: 'faculty123',
        department: 'Computer Science',
        semester: 'Faculty Member',
        registrationNumber: 'FAC-CS-001',
        role: 'faculty',
        profileImage:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isBlocked: false,
      });
      console.log('✓ Created dedicated demo Faculty account:', facultyEmail);
    } else {
      facultyUser.role = 'faculty';
      await facultyUser.save();
      console.log('✓ Verified existing Faculty account:', facultyEmail);
    }

    // 3. Verify admin@notesphere.edu is also role = 'faculty'
    const adminUser = await User.findOne({ email: 'admin@notesphere.edu' });
    if (adminUser) {
      adminUser.role = 'faculty';
      await adminUser.save();
      console.log('✓ Verified legacy admin@notesphere.edu migrated to role: faculty');
    }

    const allFaculty = await User.find({ role: 'faculty' }, 'name email role');
    console.log('\n[Current Faculty Users in Database]:', allFaculty);
    console.log('\nMigration to Faculty completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

migrate();
