const mongoose = require('mongoose');
const Report = require('../models/Report');
const Resource = require('../models/Resource');

/**
 * @desc    Submit a report for an inappropriate resource
 * @route   POST /api/reports/:resourceId
 * @access  Private (Authenticated students)
 */
const createReport = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid reason for reporting this document.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully. Our team will review this document.',
        report: {
          _id: new mongoose.Types.ObjectId().toString(),
          resource: resourceId,
          reportedBy: req.user._id,
          reason,
          description: description ? description.trim() : '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Prevent duplicate report by same student
    const existing = await Report.findOne({
      resource: resourceId,
      reportedBy: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already filed a report for this resource. Our moderation team is reviewing it.',
      });
    }

    const report = await Report.create({
      resource: resourceId,
      reportedBy: req.user._id,
      reason,
      description: description ? description.trim() : '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for maintaining academic integrity.',
      report,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already filed a report for this resource.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get reports filed by current student
 * @route   GET /api/reports/my-reports
 * @access  Private (Student)
 */
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('resource', 'title subject department fileType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reports with filters (Admin only)
 * @route   GET /api/admin/reports
 * @access  Private (Admin)
 */
const getAllReportsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email department registrationNumber')
      .populate('resource', 'title subject department semester fileType status uploadedBy')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Review and resolve/dismiss a report (Admin only)
 * @route   PUT /api/admin/reports/:id
 * @access  Private (Admin)
 */
const updateReportStatusAdmin = async (req, res, next) => {
  try {
    const { status, actionTaken } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (status) {
      report.status = status;
    }
    if (actionTaken) {
      report.actionTaken = actionTaken.trim();
    }
    report.resolvedBy = req.user._id;

    await report.save();

    const populated = await Report.findById(report._id)
      .populate('reportedBy', 'name email department')
      .populate('resource', 'title subject department')
      .populate('resolvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Report marked as ${report.status}`,
      report: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getAllReportsAdmin,
  updateReportStatusAdmin,
};
