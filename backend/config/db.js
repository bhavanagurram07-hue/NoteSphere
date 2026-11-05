const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection string from environment variables.
 * Handles errors gracefully so the server can report health even if the DB is still provisioning.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('[MongoDB Warning]: MONGO_URI is not defined in your .env file.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected]: Host -> ${conn.connection.host}, Database -> ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn(`[MongoDB Notice]: If running locally, make sure MongoDB service is active. If using Atlas, verify IP whitelist and credentials in .env.`);
  }
};

module.exports = connectDB;
