/**
 * Middleware to catch 404 Not Found errors for unmatched routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global centralized error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'An account with this email address already exists. Please log in.';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found with the requested ID';
  }

  // Multer errors (e.g. LIMIT_FILE_SIZE) or custom file validation errors
  if (
    err.name === 'MulterError' ||
    err.message?.includes('Invalid file type') ||
    err.message?.includes('File too large')
  ) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
