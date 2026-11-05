const User = require('../models/User');
const Resource = require('../models/Resource');
const Bookmark = require('../models/Bookmark');
const Report = require('../models/Report');
const Review = require('../models/Review');
const { deleteDocument } = require('../middleware/uploadMiddleware');

/**
 * @desc    Get comprehensive real-time MongoDB analytics for Admin Dashboard
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. KPI Metric Counts
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

    // 2. Resource Uploads Over Time (Monthly aggregation for the last 6 months)
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
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    // Format monthly chart data with readable names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedUploadsChart = uploadsOverTime.map((item) => ({
      label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      uploads: item.count,
      downloads: item.downloads,
    }));

    // 3. Most Popular Categories Breakdown
    const popularCategories = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          downloads: { $sum: '$downloads' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const formattedCategoryChart = popularCategories.map((c) => ({
      category: c._id || 'Other',
      count: c.count,
      downloads: c.downloads,
    }));

    // 4. Department-Wise Distribution
    const departmentWise = await Resource.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          downloads: { $sum: '$downloads' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const formattedDepartmentChart = departmentWise.map((d) => ({
      department: d._id || 'General',
      count: d.count,
      downloads: d.downloads,
    }));

    // 5. Top Downloaded Resources
    const topDownloaded = await Resource.find({ status: 'approved' })
      .select('title subject department downloads averageRating fileType')
      .sort({ downloads: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      metrics: {
        totalStudents,
        totalResources,
        totalDownloads,
        totalBookmarks,
        pendingResources,
        reportedResources,
      },
      charts: {
        uploadsOverTime: formattedUploadsChart,
        categoryBreakdown: formattedCategoryChart,
        departmentDistribution: formattedDepartmentChart,
        topDownloaded,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students with search and filters (Admin only)
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { q, role, department, isBlocked, page = 1, limit = 20 } = req.query;

    const query = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { registrationNumber: regex }];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (department && department !== 'All Departments') {
      query.department = department;
    }

    if (isBlocked !== undefined && isBlocked !== 'all') {
      query.isBlocked = isBlocked === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get contribution counts for returned users
    const userIds = users.map((u) => u._id);
    const resourceCounts = await Resource.aggregate([
      { $match: { uploadedBy: { $in: userIds } } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 }, totalDownloads: { $sum: '$downloads' } } },
    ]);

    const countMap = {};
    resourceCounts.forEach((rc) => {
      countMap[rc._id.toString()] = {
        uploadsCount: rc.count,
        downloadsCount: rc.totalDownloads,
      };
    });

    const enrichedUsers = users.map((u) => {
      const stats = countMap[u._id.toString()] || { uploadsCount: 0, downloadsCount: 0 };
      return {
        ...u.toObject(),
        uploadsCount: stats.uploadsCount,
        downloadsCount: stats.downloadsCount,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      users: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed student profile and contributions (Admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserProfileAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found',
      });
    }

    const [resources, bookmarksCount, reviewsCount] = await Promise.all([
      Resource.find({ uploadedBy: user._id }).sort({ createdAt: -1 }),
      Bookmark.countDocuments({ user: user._id }),
      Review.countDocuments({ user: user._id }),
    ]);

    const totalDownloads = resources.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalUploads: resources.length,
        totalDownloads,
        totalBookmarks: bookmarksCount,
        totalReviews: reviewsCount,
      },
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Block or unblock a user (Admin only)
 * @route   PUT /api/admin/users/:id/block
 * @access  Private (Admin only)
 */
const toggleBlockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Safety: Admin cannot block their own account
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot suspend your own account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Toggle block status or accept explicit boolean
    const nextBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : !user.isBlocked;
    user.isBlocked = nextBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBlocked
        ? `Student account for ${user.name} has been suspended.`
        : `Student account for ${user.name} has been reinstated.`,
      isBlocked: user.isBlocked,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resources for moderation (all statuses) (Admin only)
 * @route   GET /api/admin/resources
 * @access  Private (Admin only)
 */
const getAllResourcesAdmin = async (req, res, next) => {
  try {
    const { q, status, department, category, page = 1, limit = 20 } = req.query;

    const query = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [{ title: regex }, { subject: regex }];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (department && department !== 'All Departments') {
      query.department = department;
    }

    if (category && category !== 'All Categories') {
      query.category = category;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email department registrationNumber profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Moderate resource status (Approve or Reject) (Admin only)
 * @route   PUT /api/admin/resources/:id/moderate
 * @access  Private (Admin only)
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

    const populated = await Resource.findById(resource._id).populate(
      'uploadedBy',
      'name email department'
    );

    res.status(200).json({
      success: true,
      message: `Resource marked as ${status}`,
      resource: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete inappropriate resource permanently (Admin only)
 * @route   DELETE /api/admin/resources/:id
 * @access  Private (Admin only)
 */
const deleteResourceAdmin = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // 1. Delete associated storage file
    await deleteDocument(resource.publicId);

    // 2. Delete related bookmarks and reviews
    await Promise.all([
      Bookmark.deleteMany({ resource: resource._id }),
      Review.deleteMany({ resource: resource._id }),
      Report.deleteMany({ resource: resource._id }),
      resource.deleteOne(),
    ]);

    res.status(200).json({
      success: true,
      message: 'Resource and all associated student data permanently removed.',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getAllUsersAdmin,
  getUserProfileAdmin,
  toggleBlockUser,
  getAllResourcesAdmin,
  moderateResourceStatus,
  deleteResourceAdmin,
};
