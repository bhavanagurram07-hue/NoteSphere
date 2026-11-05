const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bookmark must belong to a user'],
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Bookmark must reference a resource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate bookmarks by the same student
bookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
