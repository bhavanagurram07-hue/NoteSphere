const express = require('express');
const { createReport, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { reportLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-reports', getMyReports);
router.post('/:resourceId', reportLimiter, createReport);

module.exports = router;
