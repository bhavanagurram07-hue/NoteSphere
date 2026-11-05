const express = require('express');
const {
  getDashboardAnalytics,
  getAllUsersAdmin,
  getUserProfileAdmin,
  toggleBlockUser,
  getAllResourcesAdmin,
  moderateResourceStatus,
  deleteResourceAdmin,
} = require('../controllers/adminController');
const {
  getAllReportsAdmin,
  updateReportStatusAdmin,
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Strict security: All admin routes require valid authentication AND role=admin
router.use(protect);
router.use(adminOnly);

// Analytics
router.get('/analytics', getDashboardAnalytics);

// User Management
router.get('/users', getAllUsersAdmin);
router.get('/users/:id', getUserProfileAdmin);
router.put('/users/:id/block', toggleBlockUser);

// Resource Moderation
router.get('/resources', getAllResourcesAdmin);
router.put('/resources/:id/moderate', moderateResourceStatus);
router.delete('/resources/:id', deleteResourceAdmin);

// Reports Queue
router.get('/reports', getAllReportsAdmin);
router.put('/reports/:id', updateReportStatusAdmin);

module.exports = router;
