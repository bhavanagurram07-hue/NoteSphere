const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must be associated with a user'],
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Review must reference a resource'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide an academic rating between 1 and 5 stars'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Please write a review comment to help peer students'],
      trim: true,
      minlength: [3, 'Review comment must be at least 3 characters long'],
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: prevents duplicate active reviews from the same user on the same resource
reviewSchema.index({ user: 1, resource: 1 }, { unique: true });

// Static method to calculate and persist average rating on the Resource
reviewSchema.statics.calculateAverageRating = async function (resourceId) {
  const stats = await this.aggregate([
    {
      $match: { resource: new mongoose.Types.ObjectId(resourceId) },
    },
    {
      $group: {
        _id: '$resource',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const Resource = mongoose.model('Resource');
  if (stats.length > 0) {
    await Resource.findByIdAndUpdate(resourceId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalRatings: stats[0].totalRatings,
    });
  } else {
    await Resource.findByIdAndUpdate(resourceId, {
      averageRating: 0,
      totalRatings: 0,
    });
  }
};

// Post-save hook to re-calculate average rating
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.resource);
});

// Post-deleteOne hook to re-calculate average rating
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calculateAverageRating(this.resource);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
