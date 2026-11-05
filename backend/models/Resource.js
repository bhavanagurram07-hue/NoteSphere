const mongoose = require('mongoose');

const resourceCategories = [
  'Class Notes',
  'Previous Question Papers',
  'Lab Manuals',
  'Assignments',
  'E-books',
  'Study Materials',
  'Other',
];

const departments = [
  'Computer Science',
  'Electronics & Comm.',
  'Mechanical Eng.',
  'Applied Mathematics',
  'Business & Mgmt',
  'Basic Sciences',
  'Other',
];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a resource title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a resource description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject or course name'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Please specify the academic department'],
      trim: true,
      index: true,
    },
    semester: {
      type: String,
      required: [true, 'Please specify the target semester'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a resource category'],
      enum: {
        values: resourceCategories,
        message: '{VALUE} is not a valid academic category',
      },
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resource must be associated with an authenticated user'],
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Storage public ID is required for resource management'],
    },
    fileType: {
      type: String,
      required: [true, 'File format type is required'],
      lowercase: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid moderation status',
      },
      default: 'approved',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast search queries
resourceSchema.index({
  title: 'text',
  description: 'text',
  subject: 'text',
});

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
