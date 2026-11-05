const mongoose = require('mongoose');

const reportReasons = [
  'Inappropriate Content',
  'Copyright Infringement',
  'Incorrect Syllabus / Wrong Subject',
  'Spam / Duplicate',
  'Malicious or Corrupted File',
  'Other',
];

const reportSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Report must be linked to a specific resource'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must be submitted by an authenticated user'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Please select a reason for reporting this document'],
      enum: {
        values: reportReasons,
        message: '{VALUE} is not a valid reporting reason',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Report description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    actionTaken: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active reports on the same resource by the same student
reportSchema.index({ resource: 1, reportedBy: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
