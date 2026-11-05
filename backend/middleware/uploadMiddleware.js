const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// ======================================================
// MULTER MEMORY STORAGE
// ======================================================
const storage = multer.memoryStorage();

// ======================================================
// ALLOWED FILE TYPES
// ======================================================
const allowedExtensions = [
  '.pdf',
  '.docx',
  '.doc',
  '.ppt',
  '.pptx',
  '.epub',
  '.txt',
];

const allowedMimeTypes = [
  'application/pdf',

  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',

  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',

  'application/epub+zip',
  'text/plain',
];

// ======================================================
// FILE FILTER
// ======================================================
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedExtensions.includes(ext) &&
    allowedMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, EPUB, TXT'
      ),
      false
    );
  }
};

// ======================================================
// MULTER UPLOAD
// ======================================================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

// ======================================================
// UPLOAD FILE TO CLOUDINARY
// ======================================================
const uploadDocument = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file buffer received');
    }

    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname).toLowerCase();

    // Make filename Cloudinary-safe
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');

    console.log(
      `[Cloudinary] Uploading "${file.originalname}"...`
    );

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'notesphere/resources',
          resource_type: 'raw',
          public_id: `${Date.now()}_${sanitizedName}${extension}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(file.buffer);
    });

    console.log(
      `[Cloudinary] Upload successful: ${result.secure_url}`
    );

    // IMPORTANT:
    // Attach Cloudinary information to the Multer file object
    file.fileUrl = result.secure_url;
    file.publicId = result.public_id;
    file.fileType = extension.replace('.', '');
    file.fileSize = file.size;

    return file;

  } catch (error) {
    console.error(
      '[Cloudinary Upload Error]:',
      error.message
    );

    throw error;
  }
};


// ======================================================
// DELETE CLOUDINARY / LOCAL DOCUMENT
// ======================================================
const deleteDocument = async (publicId) => {
  try {
    if (!publicId) {
      return;
    }

    // Cloudinary public IDs for NoteSphere
    if (
      typeof publicId === 'string' &&
      publicId.startsWith('notesphere/')
    ) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
      });

      console.log(
        `[Cloudinary] Deleted: ${publicId}`
      );

      return;
    }

    // Local file fallback
    if (fs.existsSync(publicId)) {
      fs.unlinkSync(publicId);

      console.log(
        `[Local Storage] Deleted: ${publicId}`
      );
    }

  } catch (error) {
    console.error(
      '[Delete Document Error]:',
      error.message
    );
  }
};


// ======================================================
// MIDDLEWARE: UPLOAD + CLOUDINARY
// ======================================================
const processUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Upload to Cloudinary
    await uploadDocument(req.file);

    console.log(
      '[Upload Middleware] Cloudinary information attached to req.file'
    );

    next();

  } catch (error) {
    console.error(
      '[Upload Middleware Error]:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  upload,
  uploadDocument,
  deleteDocument,
  processUpload,
};