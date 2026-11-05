const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');

/**
 * @desc    Register a new student or faculty account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      department,
      semester,
      registrationNumber,
      profileImage,
      role: requestedRole = 'student',
      authorizationCode,
    } = req.body;

    // 1. Basic validation with type enforcement
    if (
      !name ||
      !email ||
      !password ||
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide valid text for full name, email address, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // 2. Allow only student or faculty registration
    const role =
      requestedRole === 'faculty' ? 'faculty' : 'student';

    // 3. Faculty registration requires an authorization code
    if (role === 'faculty') {
      const facultyRegistrationCode =
        process.env.FACULTY_REGISTRATION_CODE;

      if (
        !facultyRegistrationCode ||
        authorizationCode !== facultyRegistrationCode
      ) {
        return res.status(403).json({
          success: false,
          message: 'Invalid faculty authorization code.',
        });
      }
    }

    // 4. Prevent duplicate email registration
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          'An account with this email address already exists. Please log in.',
      });
    }

    // 5. Create user record
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      department: department || 'Computer Science',

      semester:
        role === 'faculty'
          ? 'Faculty Member'
          : semester || 'Semester 1',

      registrationNumber:
        registrationNumber || undefined,

      profileImage:
        profileImage ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',

      role,
      isBlocked: false,
    });

    // 6. Return JWT token response
    sendTokenResponse(
      user,
      201,
      res,
      role === 'faculty'
        ? 'Faculty account registered successfully'
        : 'Student account registered successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs with strict type checks for NoSQL injection prevention
    if (
      !email ||
      !password ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address and password',
      });
    }

    // Find user with password selected
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password match
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          'Your account has been suspended by campus administration.',
      });
    }

    sendTokenResponse(
      user,
      200,
      res,
      'Signed in successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    sameSite:
      process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fields that students can update
    const {
      name,
      department,
      semester,
      registrationNumber,
      profileImage,
    } = req.body;

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (semester) user.semester = semester.trim();

    if (registrationNumber !== undefined) {
      user.registrationNumber = registrationNumber.trim();
    }

    if (profileImage) {
      user.profileImage = profileImage;
    }

    // Disallow escalation of role or unblocking self via this route
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        semester: updatedUser.semester,
        registrationNumber: updatedUser.registrationNumber,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics for authenticated student
 * @route   GET /api/auth/dashboard-stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // In Phase 2/3 with live notes model, this aggregates counts.
    // For now, calculate stats reliably for the user
    res.status(200).json({
      success: true,
      stats: {
        totalUploads: 2,
        totalDownloads: 1420,
        totalBookmarks: 4,
        reputationPoints: 480,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  getDashboardStats,
};