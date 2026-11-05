const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: verifies JWT from either Authorization header (Bearer token)
 * or HTTP-only cookie. Verifies user exists and is not blocked.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check Bearer token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Check HTTP-only cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'notesphere_jwt_secret_default_key'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by the administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed or expired.',
    });
  }
};

/**
 * Grant access only to specific user roles
 * Example usage: authorize('admin', 'faculty')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthorized'}' is not permitted to perform this action.`,
      });
    }
    next();
  };
};

/**
 * Role-based authorization middleware for Faculty access
 */
const facultyOnly = authorize('faculty');
const requireFaculty = facultyOnly;

// Backward-compatible alias
const adminOnly = authorize('faculty', 'admin');

module.exports = {
  protect,
  authorize,
  facultyOnly,
  requireFaculty,
  adminOnly,
};
