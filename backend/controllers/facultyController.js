const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Report = require('../models/Report');
const Review = require('../models/Review');
const { deleteDocument } = require('../middleware/uploadMiddleware');

/**
 * @desc    Get real-time academic analytics for Faculty Dashboard
 * @route   GET /api/faculty/analytics
 * @access  Private (Faculty only)
 */
const getFacultyAnalytics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalResources,
      totalBookmarks,
      pendingResources,
      reportedResources,
      downloadsAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Resource.countDocuments(),
      Bookmark.countDocuments(),
      Resource.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'pending' }),
      Resource.aggregate([
        {
          $group: {
            _id: null,
            totalDownloads: { $sum: '$downloads' },
          },
        },
      ]),
    ]);

    const totalDownloads = downloadsAgg[0]?.totalDownloads || 0;

    // Monthly uploads
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const uploadsOverTime = await Resource.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          downloads: { $sum: '$downloads' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const formattedUploadsOverTime = uploadsOverTime.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      resources: item.count,
      downloads: item.downloads,
    }));

    // Department Breakdown
    const departmentBreakdown = await Resource.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          downloads: { $sum: '$downloads' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const formattedDepartments = departmentBreakdown.map((item) => ({
      name: item._id || 'General',
      value: item.count,
      downloads: item.downloads,
    }));

    // Category Breakdown (Notes, Question Papers, Lab Manuals, Syllabus, Assignments, etc.)
    const categoryBreakdown = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          downloads: { $sum: '$downloads' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const formattedCategories = categoryBreakdown.map((item) => ({
      name: item._id || 'Other',
      value: item.count,
      downloads: item.downloads,
    }));

    // Top Downloaded Resources
    const topDownloadedResources = await Resource.find({ status: 'approved' })
      .sort({ downloads: -1 })
      .limit(5)
      .populate('uploadedBy', 'name email department')
      .select('title subject department downloads averageRating fileType createdAt');

    // Recent 10 Platform Activities
    const [recentUploads, recentReviews] = await Promise.all([
      Resource.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('uploadedBy', 'name profileImage')
        .select('title uploadedBy createdAt status category'),
      Review.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name profileImage')
        .populate('resource', 'title')
        .select('user resource rating comment createdAt'),
    ]);

    const recentActivity = [
      ...recentUploads.map((u) => ({
        id: `upload-${u._id}`,
        type: 'upload',
        title: `Resource ${u.status === 'approved' ? 'published' : 'submitted'}: "${u.title}"`,
        user: u.uploadedBy?.name || 'Anonymous',
        avatar: u.uploadedBy?.profileImage,
        time: u.createdAt,
        status: u.status,
        category: u.category,
      })),
      ...recentReviews.map((r) => ({
        id: `review-${r._id}`,
        type: 'review',
        title: `Rated "${r.resource?.title || 'Resource'}" with ${r.rating} stars`,
        user: r.user?.name || 'Anonymous',
        avatar: r.user?.profileImage,
        time: r.createdAt,
        comment: r.comment,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    // Faculty specific uploads count (if authenticated as faculty)
    const myUploadsCount = await Resource.countDocuments({ uploadedBy: req.user._id });

    res.status(200).json({
      success: true,
      metrics: {
        totalStudents,
        totalResources,
        totalDownloads,
        totalBookmarks,
        pendingResources,
        reportedResources,
        myUploadsCount,
      },
      charts: {
        uploadsOverTime: formattedUploadsOverTime,
        categoryBreakdown: formattedCategories,
        departmentDistribution: formattedDepartments,
        topDownloaded: topDownloadedResources,
      },
      analytics: {
        kpis: {
          totalStudents,
          totalResources,
          totalDownloads,
          totalBookmarks,
          pendingModeration: pendingResources,
          pendingReports: reportedResources,
          myUploadsCount,
        },
        uploadsOverTime: formattedUploadsOverTime,
        departmentBreakdown: formattedDepartments,
        categoryBreakdown: formattedCategories,
        topDownloaded: topDownloadedResources,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students with search & filters (Faculty view)
 * @route   GET /api/faculty/users
 * @access  Private (Faculty only)
 */
const getAllUsersFaculty = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', role = '', isBlocked = '' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { registrationNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (department && department !== 'All Departments') {
      query.department = department;
    }

    if (role && role !== 'All Roles') {
      query.role = role;
    }

    if (isBlocked !== '') {
      query.isBlocked = isBlocked === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    // Attach upload counts
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const uploadCount = await Resource.countDocuments({ uploadedBy: u._id });
        const userObj = u.toObject();
        userObj.uploadsCount = uploadCount;
        return userObj;
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithStats,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student profile & uploads (Faculty view)
 * @route   GET /api/faculty/users/:id
 * @access  Private (Faculty only)
 */
const getUserProfileFaculty = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const uploads = await Resource.find({ uploadedBy: user._id })
      .sort({ createdAt: -1 })
      .select('title subject department semester category downloads averageRating status createdAt fileType');

    const totalDownloads = uploads.reduce((acc, r) => acc + (r.downloads || 0), 0);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalUploads: uploads.length,
        totalDownloads,
      },
      uploads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resources for moderation & curriculum tracking (Faculty view)
 * @route   GET /api/faculty/resources
 * @access  Private (Faculty only)
 */
const getAllResourcesFaculty = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
      department = '',
      semester = '',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (semester && semester !== 'all') {
      query.semester = semester;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('uploadedBy', 'name email department role profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Resource.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      resources,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Moderate resource status (Approve or Reject) (Faculty view)
 * @route   PUT /api/faculty/resources/:id/moderate
 * @access  Private (Faculty only)
 */
const moderateResourceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation status. Must be approved, rejected, or pending.',
      });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    resource.status = status;
    await resource.save();

    const updated = await Resource.findById(resource._id).populate(
      'uploadedBy',
      'name email department role'
    );

    res.status(200).json({
      success: true,
      message: `Resource successfully ${status}`,
      resource: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete resource permanently (Faculty action)
 * @route   DELETE /api/faculty/resources/:id
 * @access  Private (Faculty only)
 */
const deleteResourceFaculty = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Clean up file storage
    await deleteDocument(resource.publicId);

    // Delete associated bookmarks and reviews
    await Promise.all([
      Bookmark.deleteMany({ resource: resource._id }),
      Review.deleteMany({ resource: resource._id }),
      Report.deleteMany({ resource: resource._id }),
    ]);

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resource deleted permanently by Faculty moderator.',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFacultyAnalytics,
  getAllUsersFaculty,
  getUserProfileFaculty,
  getAllResourcesFaculty,
  moderateResourceStatus,
  deleteResourceFaculty,
};
