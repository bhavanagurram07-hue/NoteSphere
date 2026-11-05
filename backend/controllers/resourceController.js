const mongoose = require('mongoose');
const axios = require('axios');

const Resource = require('../models/Resource');
const User = require('../models/User');
const { deleteDocument } = require('../middleware/uploadMiddleware');


// ======================================================
// GET ALL RESOURCES
// ======================================================
const getResources = async (req, res) => {
  try {
    const {
      search,
      subject,
      department,
      semester,
      category,
      status = 'approved',
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    if (semester) {
      query.semester = semester;
    }

    if (category) {
      query.category = category;
    }

    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    console.error('[Get Resources Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
    });
  }
};


// ======================================================
// GET SINGLE RESOURCE
// ======================================================
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'name email role');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('[Get Resource Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resource',
    });
  }
};


// ======================================================
// CREATE RESOURCE
// ======================================================
const createResource = async (req, res) => {
  try {
    console.log('[Create Resource] Uploaded file:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    const {
      title,
      description,
      subject,
      department,
      semester,
      category,
    } = req.body;

    if (!title || !description || !subject || !department || !semester || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const fileUrl = req.file.fileUrl;
    const publicId = req.file.publicId;
    const fileType = req.file.fileType;
    const fileSize = req.file.fileSize;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is missing',
      });
    }

    const resource = await Resource.create({
      title,
      description,
      subject,
      department,
      semester,
      category,
      fileUrl,
      publicId,
      fileType,
      fileSize,
      uploadedBy: req.user._id,
      status: 'approved',
    });

    console.log('[Create Resource] Resource created:', resource._id);

    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully',
      data: populatedResource,
    });
  } catch (error) {
    console.error('[Create Resource Error]:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create resource',
    });
  }
};


// ======================================================
// UPDATE RESOURCE
// ======================================================
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (
      req.user.role !== 'faculty' &&
      resource.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resource',
      });
    }

    const {
      title,
      description,
      subject,
      department,
      semester,
      category,
    } = req.body;

    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (subject !== undefined) resource.subject = subject;
    if (department !== undefined) resource.department = department;
    if (semester !== undefined) resource.semester = semester;
    if (category !== undefined) resource.category = category;

    // If a new file was uploaded
    if (req.file) {
      if (resource.publicId) {
        try {
          await deleteDocument(resource.publicId);
        } catch (deleteError) {
          console.error(
            '[Old Cloudinary File Delete Error]:',
            deleteError.message
          );
        }
      }

      resource.fileUrl = req.file.fileUrl;
      resource.publicId = req.file.publicId;
      resource.fileType = req.file.fileType;
      resource.fileSize = req.file.fileSize;
    }

    await resource.save();

    const updatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: updatedResource,
    });
  } catch (error) {
    console.error('[Update Resource Error]:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update resource',
    });
  }
};


// ======================================================
// DELETE RESOURCE
// ======================================================
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (
      req.user.role !== 'faculty' &&
      resource.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resource',
      });
    }

    if (resource.publicId) {
      try {
        await deleteDocument(resource.publicId);
      } catch (deleteError) {
        console.error(
          '[Cloudinary Delete Error]:',
          deleteError.message
        );
      }
    }

    await Resource.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Resource Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
    });
  }
};


// ======================================================
// DOWNLOAD / PREVIEW RESOURCE
// ======================================================
const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (!resource.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'File URL not found',
      });
    }

    console.log('===============================================');
    console.log('[Cloudinary Preview]');
    console.log('Resource ID:', resource._id);
    console.log('Original URL:', resource.fileUrl);
    console.log('===============================================');

    const response = await axios.get(resource.fileUrl, {
      responseType: 'arraybuffer',
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/pdf,application/octet-stream,*/*',
      },
    });

    console.log('[Cloudinary Preview] Status:', response.status);
    console.log(
      '[Cloudinary Preview] Content-Type:',
      response.headers['content-type']
    );

    // Cloudinary rejected the request
    if (response.status !== 200) {
      console.error(
        '[Cloudinary Preview Error] Cloudinary returned status:',
        response.status
      );

      return res.status(502).json({
        success: false,
        message: `Cloudinary returned status ${response.status}`,
      });
    }

    const contentType =
      response.headers['content-type'] || 'application/pdf';

    res.setHeader('Content-Type', contentType);

    res.setHeader(
      'Content-Length',
      response.data.length
    );

    // Display PDF inside browser
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${(resource.title || 'document').replace(
        /[^a-zA-Z0-9-_ ]/g,
        ''
      )}.pdf"`
    );

    res.setHeader(
      'Cache-Control',
      'public, max-age=3600'
    );

    return res.send(response.data);
  } catch (error) {
    console.error('===============================================');
    console.error('[Cloudinary Preview Error]');
    console.error('Message:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
    }

    console.error('===============================================');

    return res.status(500).json({
      success: false,
      message: 'Unable to preview file from Cloudinary',
    });
  }
};


// ======================================================
// GET MY UPLOADS
// ======================================================
const getMyUploads = async (req, res) => {
  try {
    const resources = await Resource.find({
      uploadedBy: req.user._id,
    })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    console.error('[Get My Uploads Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your uploads',
    });
  }
};


// ======================================================
// GET MY BOOKMARKS
// ======================================================
const getMyBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        populate: {
          path: 'uploadedBy',
          select: 'name email role',
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      count: user.bookmarks ? user.bookmarks.length : 0,
      data: user.bookmarks || [],
    });
  } catch (error) {
    console.error('[Get My Bookmarks Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks',
    });
  }
};


// ======================================================
// TOGGLE BOOKMARK
// ======================================================
const toggleBookmark = async (req, res) => {
  try {
    const resourceId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID',
      });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const bookmarkIndex = user.bookmarks.findIndex(
      (bookmark) => bookmark.toString() === resourceId
    );

    let bookmarked;

    if (bookmarkIndex === -1) {
      user.bookmarks.push(resourceId);
      bookmarked = true;
    } else {
      user.bookmarks.splice(bookmarkIndex, 1);
      bookmarked = false;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      bookmarked,
      message: bookmarked
        ? 'Resource bookmarked successfully'
        : 'Resource removed from bookmarks',
    });
  } catch (error) {
    console.error('[Toggle Bookmark Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update bookmark',
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  getMyUploads,
  getMyBookmarks,
  toggleBookmark,
};