const express = require('express');
const {
  getResourceReviews,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Public view reviews for a resource
router.get('/', getResourceReviews);
router.get('/resource/:resourceId', getResourceReviews);

// Protected review interactions
router.post('/', protect, addReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
