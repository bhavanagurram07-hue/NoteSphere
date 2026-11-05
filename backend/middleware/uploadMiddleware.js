const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

// Allowed extensions
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.ppt',
  '.pptx',
  '.epub',
  '.txt',
];

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/epub+zip',
  'text/plain',
];

// File validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (isExtAllowed && isMimeAllowed) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type "${ext}". Only PDF, DOCX, DOC, PPT, PPTX, EPUB, and TXT files are permitted.`
    ),
    false
  );
};

// Store uploaded file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter,
});

/**
 * Upload document to Cloudinary
 */
const uploadDocument = async (file) => {
  if (!file || !file.buffer) {
    throw new Error('No file buffer received.');
  }

  const sanitizedName = path
    .basename(file.originalname, path.extname(file.originalname))
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  // Check Cloudinary configuration
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const cloudinaryConfigured =
    cloudName &&
    apiKey &&
    apiSecret;

  // ==========================================
  // 1. UPLOAD TO CLOUDINARY
  // ==========================================
  if (cloudinaryConfigured) {
    try {
      console.log(
        `[Cloudinary] Uploading "${file.originalname}"...`
      );

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'notesphere/resources',
            resource_type: 'raw',
            public_id: `${Date.now()}_${sanitizedName}`,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        Readable.from(file.buffer).pipe(uploadStream);
      });

      console.log(
        `[Cloudinary] Upload successful: ${result.secure_url}`
      );

      return {
        fileUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (cloudError) {
      console.error(
        '[Cloudinary ERROR]: Upload failed:',
        cloudError.message
      );

      console.error(
        '[Cloudinary ERROR DETAILS]:',
        cloudError
      );

      // Continue to local fallback
    }
  } else {
    console.warn(
      '[Cloudinary] Credentials are missing. Using local storage.'
    );
  }

  // ==========================================
  // 2. LOCAL FALLBACK
  // ==========================================
  const uploadDir = path.join(
    __dirname,
    '../uploads/resources'
  );

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }

  const ext = path.extname(file.originalname).toLowerCase();

  const filename =
    `${Date.now()}_${sanitizedName}${ext}`;

  const filePath = path.join(
    uploadDir,
    filename
  );

  fs.writeFileSync(
    filePath,
    file.buffer
  );

  const port = process.env.PORT || 5000;

  const baseUrl =
    process.env.BASE_URL ||
    `http://localhost:${port}`;

  const fileUrl =
    `${baseUrl}/uploads/resources/${filename}`;

  const publicId =
    `local-${filename}`;

  console.log(
    `[Local Storage] File saved: ${fileUrl}`
  );

  return {
    fileUrl,
    publicId,
  };
};

/**
 * Delete document
 */
const deleteDocument = async (publicId) => {
  if (!publicId) return;

  // Delete local file
  if (publicId.startsWith('local-')) {
    const filename =
      publicId.replace('local-', '');

    const filePath = path.join(
      __dirname,
      '../uploads/resources',
      filename
    );

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);

        console.log(
          `[Local Storage] Deleted: ${filename}`
        );
      } catch (error) {
        console.error(
          'Failed to delete local file:',
          error.message
        );
      }
    }

    return;
  }

  // Delete Cloudinary file
  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: 'raw',
      }
    );

    console.log(
      `[Cloudinary] Deleted: ${publicId}`
    );
  } catch (error) {
    console.error(
      'Failed to delete Cloudinary file:',
      error.message
    );
  }
};

module.exports = {
  upload,
  uploadDocument,
  deleteDocument,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};