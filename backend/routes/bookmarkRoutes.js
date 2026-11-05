const express = require('express');
const {
  toggleBookmark,
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getMyBookmarkIds,
  getMyBookmarks,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All bookmark routes require authentication
router.use(protect);

router.get('/', getMyBookmarks);
router.post('/', addBookmark);

router.get('/ids', getMyBookmarkIds);
router.get('/my-bookmarks', getMyBookmarks);
router.get('/status/:resourceId', checkBookmarkStatus);

router.post('/:resourceId/toggle', toggleBookmark);
router.post('/:resourceId', addBookmark);
router.delete('/:resourceId', removeBookmark);

module.exports = router;
