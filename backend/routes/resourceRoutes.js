const express = require('express');
const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  getMyUploads,
  downloadResource,
  getSearchSuggestions,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Public discovery
router.get('/', getResources);

// Autocomplete search suggestions (must be defined before /:id)
router.get('/suggestions', getSearchSuggestions);

// Protected my-uploads (must be defined before /:id)
router.get('/my-uploads', protect, getMyUploads);

// Upload resource (Protected with Multer file interception)
router.post('/', protect, upload.single('file'), createResource);

// Reviews sub-resource routing
router.use('/:id/reviews', reviewRouter);

// Resource details & Download
router.get('/:id', getResourceById);
router.get('/:id/download', downloadResource);

// Protected edits & deletions
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);

module.exports = router;
