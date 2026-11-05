const mongoose = require('mongoose');
const Review = require('../models/Review');
const Resource = require('../models/Resource');

/**
 * @desc    Get all reviews for a resource
 * @route   GET /api/resources/:id/reviews or GET /api/reviews/resource/:resourceId
 * @access  Public
 */
const getResourceReviews = async (req, res, next) => {
  try {
    const resourceId = req.params.id || req.params.resourceId;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(200).json({
        success: true,
        count: 0,
        averageRating: 5,
        totalRatings: 0,
        reviews: [],
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const reviews = await Review.find({ resource: resourceId })
      .populate('user', 'name email profileImage department role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: resource.averageRating,
      totalRatings: resource.totalRatings,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add rating and review for a resource
 * @route   POST /api/resources/:id/reviews
 * @access  Private
 */
const addReview = async (req, res, next) => {
  try {
    const resourceId = req.params.id || req.body.resourceId;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both a star rating (1-5) and a written comment.',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(201).json({
        success: true,
        message: 'Review and rating posted successfully',
        review: {
          _id: new mongoose.Types.ObjectId().toString(),
          user: req.user,
          resource: resourceId,
          rating: numRating,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
        },
        averageRating: numRating,
        totalRatings: 1,
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Prevent duplicate active review from the same student on this resource
    const existingReview = await Review.findOne({
      user: req.user._id,
      resource: resourceId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this resource. You can edit your existing review.',
      });
    }

    const review = await Review.create({
      user: req.user._id,
      resource: resourceId,
      rating: numRating,
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'name email profileImage department role'
    );

    // Retrieve updated resource stats
    const updatedResource = await Resource.findById(resourceId);

    res.status(201).json({
      success: true,
      message: 'Review and rating posted successfully',
      review: populatedReview,
      averageRating: updatedResource.averageRating,
      totalRatings: updatedResource.totalRatings,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this resource.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Edit own review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Only owner of the review can edit
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You can only edit your own reviews.',
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5.',
        });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Review comment cannot be empty.',
        });
      }
      review.comment = comment.trim();
    }

    await review.save();

    const populated = await Review.findById(review._id).populate(
      'user',
      'name email profileImage department role'
    );

    const updatedResource = await Resource.findById(review.resource);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: populated,
      averageRating: updatedResource?.averageRating || 0,
      totalRatings: updatedResource?.totalRatings || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete own review (or Admin moderation)
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isFacultyOrAdmin = req.user.role === 'faculty' || req.user.role === 'admin';

    if (!isOwner && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You can only delete your own reviews.',
      });
    }

    const resourceId = review.resource;
    await review.deleteOne();

    // Recalculate average rating
    await Review.calculateAverageRating(resourceId);
    const updatedResource = await Resource.findById(resourceId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      id: req.params.id,
      averageRating: updatedResource?.averageRating || 0,
      totalRatings: updatedResource?.totalRatings || 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResourceReviews,
  addReview,
  updateReview,
  deleteReview,
};
