const express = require('express');

const router = express.Router();

const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  getMyUploads,
  getMyBookmarks,
  toggleBookmark,
} = require('../controllers/resourceController');

const {
  protect,
} = require('../middleware/authMiddleware');

const {
  upload,
  processUpload,
} = require('../middleware/uploadMiddleware');


// ======================================================
// GET ALL RESOURCES
// ======================================================
router.get(
  '/',
  getResources
);


// ======================================================
// GET MY UPLOADS
// ======================================================
router.get(
  '/my-uploads',
  protect,
  getMyUploads
);


// ======================================================
// GET MY BOOKMARKS
// ======================================================
router.get(
  '/my-bookmarks',
  protect,
  getMyBookmarks
);


// ======================================================
// GET SINGLE RESOURCE
// ======================================================
router.get(
  '/:id',
  getResourceById
);


// ======================================================
// PREVIEW / DOWNLOAD PDF
// ======================================================
router.get(
  '/:id/download',
  downloadResource
);


// ======================================================
// CREATE RESOURCE
// ======================================================
router.post(
  '/',
  protect,
  upload.single('file'),
  processUpload,
  createResource
);


// ======================================================
// UPDATE RESOURCE
// ======================================================
router.put(
  '/:id',
  protect,
  upload.single('file'),
  processUpload,
  updateResource
);


// ======================================================
// DELETE RESOURCE
// ======================================================
router.delete(
  '/:id',
  protect,
  deleteResource
);


// ======================================================
// TOGGLE BOOKMARK
// ======================================================
router.post(
  '/:id/bookmark',
  protect,
  toggleBookmark
);


module.exports = router;