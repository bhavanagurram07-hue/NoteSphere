const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Resource = require('../models/Resource');

/**
 * @desc    Toggle a bookmark (Add if not bookmarked, remove if already bookmarked)
 * @route   POST /api/bookmarks/:resourceId/toggle
 * @access  Private
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(200).json({
        success: true,
        bookmarked: true,
        message: 'Resource bookmarked',
      });
    }

    // Verify resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      resource: resourceId,
    });

    if (existingBookmark) {
      await existingBookmark.deleteOne();
      return res.status(200).json({
        success: true,
        bookmarked: false,
        message: 'Resource removed from bookmarks',
      });
    }

    await Bookmark.create({
      user: req.user._id,
      resource: resourceId,
    });

    res.status(201).json({
      success: true,
      bookmarked: true,
      message: 'Resource added to bookmarks',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a bookmark (explicit add with duplicate prevention)
 * @route   POST /api/bookmarks/:resourceId
 * @access  Private
 */
const addBookmark = async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId || req.body.resourceId || req.body.resource;

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid resourceId',
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      resource: resourceId,
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'Resource is already in your bookmarks',
      });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      resource: resourceId,
    });

    res.status(201).json({
      success: true,
      message: 'Resource bookmarked successfully',
      bookmark,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Resource is already in your bookmarks',
      });
    }
    next(error);
  }
};

/**
 * @desc    Remove a bookmark
 * @route   DELETE /api/bookmarks/:resourceId
 * @access  Private
 */
const removeBookmark = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user._id,
      resource: resourceId,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found in your saved list',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully',
      resourceId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check bookmark status for a resource
 * @route   GET /api/bookmarks/status/:resourceId
 * @access  Private
 */
const checkBookmarkStatus = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(200).json({
        success: true,
        isBookmarked: false,
      });
    }
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      resource: resourceId,
    });

    res.status(200).json({
      success: true,
      isBookmarked: !!bookmark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookmarked resource IDs for logged-in user
 * @route   GET /api/bookmarks/ids
 * @access  Private
 */
const getMyBookmarkIds = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id }).select('resource');
    const ids = bookmarks.map((b) => b.resource.toString());

    res.status(200).json({
      success: true,
      bookmarkIds: ids,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's saved bookmarks with populated resource data
 * @route   GET /api/bookmarks/my-bookmarks
 * @access  Private
 */
const getMyBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'resource',
        populate: {
          path: 'uploadedBy',
          select: 'name email profileImage department role',
        },
      })
      .sort({ createdAt: -1 });

    // Filter out any bookmarks whose underlying resource was deleted
    const validBookmarks = bookmarks
      .filter((b) => b.resource !== null)
      .map((b) => ({
        bookmarkId: b._id,
        savedAt: b.createdAt,
        ...b.resource.toObject(),
      }));

    res.status(200).json({
      success: true,
      count: validBookmarks.length,
      resources: validBookmarks,
      bookmarks: validBookmarks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleBookmark,
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getMyBookmarkIds,
  getMyBookmarks,
};
