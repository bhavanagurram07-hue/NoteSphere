const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables from backend/.env explicitly
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Initialize Express application
const app = express();

// Connect to MongoDB
connectDB();

// Setup Cross-Origin Resource Sharing (CORS)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body and Cookie parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve local fallback uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'NoteSphere API',
    description: 'Smart Academic Resource Sharing Platform Backend',
    documentation: '/api/health',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'NoteSphere Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Global Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';
let server;

if (require.main === module) {
  server = app.listen(PORT, HOST, () => {
    console.log(`===============================================`);
    console.log(` NoteSphere Backend Server Running on http://${HOST}:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[PORT CONFLICT] Port ${PORT} (${HOST}) is already in use by another running node process:`, err.message);
      console.error(`To free up port ${PORT} immediately, run:`);
      console.error(`  Stop-Process -Name node -Force`);
      console.error(`Then re-run: npm --prefix backend run dev\n`);
      process.exit(1);
    }
  });
}

app.server = server;
module.exports = app;
module.exports.app = app;
module.exports.server = server;
