const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  getDashboardStats,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Public routes with brute-force rate limiting protection
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Protected routes (Require valid JWT)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/dashboard-stats', protect, getDashboardStats);

module.exports = router;
