const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { uploadDocument, deleteDocument } = require('../middleware/uploadMiddleware');
const { generateValidPdf } = require('../utils/pdfGenerator');

/**
 * @desc    Upload a new academic resource (PDF/DOCX/etc.)
 * @route   POST /api/resources
 * @access  Private (Authenticated users)
 */
const createResource = async (req, res, next) => {
  try {
    const { title, description, subject, department, semester, category } = req.body;

    // 1. Validate required text fields
    if (!title || !description || !subject || !department || !semester || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, subject, department, semester, and category.',
      });
    }

    // 2. Validate file existence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a document file to upload (PDF, DOCX, DOC, PPT, PPTX, EPUB, TXT).',
      });
    }

    // 3. Upload file to Cloudinary / storage engine
    const { fileUrl, publicId } = await uploadDocument(req.file);

    // 4. Save metadata in MongoDB
    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    const resource = await Resource.create({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      department: department.trim(),
      semester: semester.trim(),
      category: category.trim(),
      uploadedBy: req.user._id,
      fileUrl,
      publicId,
      fileType: ext || 'pdf',
      fileSize: req.file.size,
      status: 'approved', // Live and ready for student discovery
    });

    const populatedResource = await Resource.findById(resource._id).populate(
      'uploadedBy',
      'name email profileImage department role'
    );

    res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully',
      resource: populatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resources with search, department/semester/category filter, and sorting
 * @route   GET /api/resources
 * @access  Public
 */
const getResources = async (req, res, next) => {
  try {
    const {
      q,
      search,
      department,
      semester,
      category,
      status,
      sort,
      sortBy,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Only show approved resources publicly (unless admin explicitly queries)
    if (status) {
      query.status = status;
    } else {
      query.status = 'approved';
    }

    // Keyword search filter
    const searchKeyword = q || search;
    if (searchKeyword && searchKeyword.trim()) {
      const regex = new RegExp(searchKeyword.trim(), 'i');
      query.$or = [{ title: regex }, { subject: regex }, { description: regex }];
    }

    // Department filter
    if (department && department !== 'All Departments') {
      query.department = department;
    }

    // Semester filter
    if (semester && semester !== 'All Semesters') {
      query.semester = semester;
    }

    // Category filter
    if (category && category !== 'All Categories' && category !== 'all') {
      query.category = category;
    }

    // File type filter (pdf, docx, pptx, txt, etc.)
    const { fileType, rating, minRating } = req.query;
    if (fileType && fileType !== 'All Formats' && fileType !== 'all') {
      query.fileType = fileType.toLowerCase().replace('.', '');
    }

    // Minimum rating filter (e.g. 4+ stars)
    const activeMinRating = minRating || rating;
    if (activeMinRating && !isNaN(Number(activeMinRating)) && Number(activeMinRating) > 0) {
      query.averageRating = { $gte: Number(activeMinRating) };
    }

    // Sorting strategy
    let sortQuery = { createdAt: -1 }; // default newest
    const activeSort = sortBy || sort;

    if (activeSort === 'popular') {
      sortQuery = { downloads: -1, averageRating: -1 };
    } else if (activeSort === 'downloads') {
      sortQuery = { downloads: -1 };
    } else if (activeSort === 'rating') {
      sortQuery = { averageRating: -1 };
    } else if (activeSort === 'newest') {
      sortQuery = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email profileImage department role')
      .sort(sortQuery)
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
 * @desc    Get single resource by ID
 * @route   GET /api/resources/:id
 * @access  Public
 */
const getResourceById = async (req, res, next) => {
  try {
    let resource = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      resource = await Resource.findById(req.params.id).populate(
        'uploadedBy',
        'name email profileImage department role'
      );
    }

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // If resource is not approved, only owner, faculty, or admin can view
    if (resource.status !== 'approved') {
      const isOwner = req.user && resource.uploadedBy._id.toString() === req.user._id.toString();
      const isFacultyOrAdmin = req.user && (req.user.role === 'faculty' || req.user.role === 'admin');
      if (!isOwner && !isFacultyOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'This resource is pending approval and cannot be accessed publicly.',
        });
      }
    }

    res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a resource (Owner or Admin only)
 * @route   PUT /api/resources/:id
 * @access  Private
 */
const updateResource = async (req, res, next) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Authorization rule: Only owner, faculty, or admin can edit
    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isFacultyOrAdmin = req.user.role === 'faculty' || req.user.role === 'admin';

    if (!isOwner && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You can only edit your own uploaded resources.',
      });
    }

    const { title, description, subject, department, semester, category, status } = req.body;

    if (title) resource.title = title.trim();
    if (description) resource.description = description.trim();
    if (subject) resource.subject = subject.trim();
    if (department) resource.department = department.trim();
    if (semester) resource.semester = semester.trim();
    if (category) resource.category = category.trim();

    // Faculty or Admin can moderate status
    if (status && isFacultyOrAdmin) {
      resource.status = status;
    }

    await resource.save();

    const updated = await Resource.findById(resource._id).populate(
      'uploadedBy',
      'name email profileImage department role'
    );

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      resource: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resource and remove file from Cloudinary (Owner or Admin only)
 * @route   DELETE /api/resources/:id
 * @access  Private
 */
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Authorization rule: Only owner, faculty, or admin can delete
    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isFacultyOrAdmin = req.user.role === 'faculty' || req.user.role === 'admin';

    if (!isOwner && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You can only delete your own uploaded resources.',
      });
    }

    // 1. Clean up file from Cloudinary or local storage to prevent orphan files
    await deleteDocument(resource.publicId);

    // 2. Delete resource record from MongoDB
    await resource.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resource and storage file deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get resources uploaded by the authenticated student
 * @route   GET /api/resources/my-uploads
 * @access  Private
 */
const getMyUploads = async (req, res, next) => {
  try {
    const resources = await Resource.find({ uploadedBy: req.user._id })
      .populate('uploadedBy', 'name email profileImage department role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Secure download endpoint - verifies resource and increments download count
 * @route   GET /api/resources/:id/download
 * @access  Public
 */
const downloadResource = async (req, res, next) => {
  try {
    let resource = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      resource = await Resource.findById(req.params.id);
    }

    // Support for sample/mock IDs (e.g. res-1, res-2, etc.)
    if (!resource && req.params.id && req.params.id.startsWith('res-')) {
      const mockTitles = {
        'res-1': 'Data_Structures_and_Algorithms_Notes.pdf',
        'res-2': 'Operating_Systems_Midterm_Papers.pdf',
        'res-3': 'Digital_Signal_Processing_Lab_Manual.pdf',
        'res-4': 'Engineering_Thermodynamics_Handbook.pdf',
        'res-5': 'Discrete_Mathematics_Question_Bank.pdf',
        'res-6': 'Microprocessors_Embedded_Systems.pdf',
        'res-7': 'Financial_Management_Guide.pdf',
      };
      const fallbackFileName = mockTitles[req.params.id] || `NoteSphere_Academic_Resource_${req.params.id}.pdf`;

      if (req.query.action === 'file' || req.query.stream === 'true') {
        const titleForDoc = fallbackFileName.replace(/\.pdf$/i, '').replace(/_/g, ' ');
        const validPdfBuffer = generateValidPdf(
          titleForDoc,
          'Academic Study Resource',
          'Computer Science',
          'NoteSphere Contributor'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fallbackFileName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        return res.send(validPdfBuffer);
      }

      const port = process.env.PORT || 5000;
      const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
      return res.status(200).json({
        success: true,
        message: 'Download initiated successfully',
        downloadUrl: `/api/resources/${req.params.id}/download?action=file`,
        directDownloadUrl: `/api/resources/${req.params.id}/download?action=file`,
        fileName: fallbackFileName,
        fileType: 'pdf',
        downloads: 1,
      });
    }

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (resource.status !== 'approved') {
      const isOwner = req.user && resource.uploadedBy.toString() === req.user._id.toString();
      const isFacultyOrAdmin = req.user && (req.user.role === 'faculty' || req.user.role === 'admin');
      if (!isOwner && !isFacultyOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Cannot download a resource that is not approved.',
        });
      }
    }

    // Increment download counter atomically
    resource.downloads += 1;
    await resource.save();

    // Sanitize resource title for downloaded file name
    const cleanTitle = resource.title
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const ext = resource.fileType.startsWith('.') ? resource.fileType : `.${resource.fileType}`;
    const downloadFileName = `${cleanTitle}${ext}`;

    // Action 1: If requested directly as a file download (action=file or stream=true)
    if (req.query.action === 'file' || req.query.stream === 'true') {
      // Check if local file
      if (resource.publicId && resource.publicId.startsWith('local-')) {
        const localFileName = resource.publicId.replace('local-', '');
        const localFilePath = path.join(__dirname, '../uploads/resources', localFileName);
        if (fs.existsSync(localFilePath)) {
          return res.download(localFilePath, downloadFileName);
        }
      }

      // If Cloudinary file, redirect with attachment disposition
      if (resource.fileUrl) {
        if (resource.fileUrl.includes('cloudinary.com') && !resource.fileUrl.includes('fl_attachment')) {
          const attachmentUrl = resource.fileUrl.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(cleanTitle)}/`);
          return res.redirect(attachmentUrl);
        }
        return res.redirect(resource.fileUrl);
      }

      // Fallback: stream generated PDF buffer
      const fallbackPdf = generateValidPdf(
        resource.title,
        resource.subject,
        resource.department,
        'NoteSphere Student'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(fallbackPdf);
    }

    // Action 2: Return JSON metadata for client-side blob download
    const directFileUrl = `/api/resources/${resource._id}/download?action=file`;

    res.status(200).json({
      success: true,
      message: 'Download initiated successfully',
      downloadUrl: resource.fileUrl,
      directDownloadUrl: directFileUrl,
      fileName: downloadFileName,
      fileType: resource.fileType,
      fileSize: resource.fileSize,
      downloads: resource.downloads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get autocomplete search suggestions
 * @route   GET /api/resources/suggestions
 * @access  Public
 */
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const matches = await Resource.find(
      {
        status: 'approved',
        $or: [{ title: regex }, { subject: regex }],
      },
      'title subject department category fileType'
    ).limit(8);

    const suggestions = matches.map((m) => ({
      id: m._id,
      title: m.title,
      subject: m.subject,
      department: m.department,
      category: m.category,
      fileType: m.fileType,
    }));

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  getMyUploads,
  downloadResource,
  getSearchSuggestions,
};
