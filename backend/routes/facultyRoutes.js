const express = require('express');
const {
  getFacultyAnalytics,
  getAllUsersFaculty,
  getUserProfileFaculty,
  getAllResourcesFaculty,
  moderateResourceStatus,
  deleteResourceFaculty,
} = require('../controllers/facultyController');
const {
  getAllReportsAdmin,
  updateReportStatusAdmin,
} = require('../controllers/reportController');
const { protect, facultyOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Strict security: All faculty routes require valid authentication AND role=faculty (or legacy admin)
router.use(protect);
router.use(facultyOnly);

// Analytics
router.get('/analytics', getFacultyAnalytics);

// Student Directory & Academic Profiles
router.get('/users', getAllUsersFaculty);
router.get('/users/:id', getUserProfileFaculty);

// Resource Moderation & Academic Repository Management
router.get('/resources', getAllResourcesFaculty);
router.put('/resources/:id/moderate', moderateResourceStatus);
router.delete('/resources/:id', deleteResourceFaculty);

// Reports Queue
router.get('/reports', getAllReportsAdmin);
router.put('/reports/:id', updateReportStatusAdmin);

module.exports = router;
