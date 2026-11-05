const jwt = require('jsonwebtoken');

/**
 * Generate a signed JSON Web Token (JWT)
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'notesphere_jwt_secret_default_key',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

/**
 * Send JWT in HTTP-Only Cookie + JSON response payload
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);

  // Cookie options: HTTP-Only prevents client-side JS XSS access
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        semester: user.semester,
        registrationNumber: user.registrationNumber,
        profileImage: user.profileImage,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
    });
};

module.exports = {
  generateToken,
  sendTokenResponse,
};
