/**
 * Secure One-Time Administrator Creation / Provisioning Script for NoteSphere
 *
 * Usage:
 *   node backend/utils/createAdmin.js [email] [password] [name]
 * Default:
 *   node backend/utils/createAdmin.js
 *   Creates/verifies 'admin@notesphere.edu' with role = 'admin'
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const provisionAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesphere';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB Connected for Admin Provisioning]');

    const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@notesphere.edu').toLowerCase().trim();
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.argv[4] || 'Campus Administrator';

    let admin = await User.findOne({ email });

    if (!admin) {
      admin = await User.create({
        name,
        email,
        password,
        department: 'Academic Affairs',
        semester: 'Staff',
        registrationNumber: 'ADMIN-ROOT',
        role: 'admin',
        profileImage:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isBlocked: false,
      });
      console.log(`✓ Successfully provisioned NEW administrator: ${email} (role: admin)`);
    } else {
      admin.role = 'admin';
      admin.isBlocked = false;
      if (process.argv[3]) {
        admin.password = password; // Trigger pre-save hash if custom password passed
      }
      await admin.save();
      console.log(`✓ Verified existing user: ${email} is confirmed with role = admin`);
    }

    console.log('\n[Security Check]:');
    console.log(`- User ID: ${admin._id}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Role in Database: ${admin.role}`);
    console.log(`- Account Blocked: ${admin.isBlocked}`);
  } catch (err) {
    console.error('Admin provisioning error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

provisionAdmin();
