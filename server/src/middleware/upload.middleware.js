const multer = require("multer");
const FileType = require("file-type");
const AppError = require("../utils/appError");

// Whitelist of allowed MIME types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Store in RAM as Buffer for hashing and magic-byte inspection
const storage = multer.memoryStorage();

/**
 * TIER 1: Multer Header-Level Filter
 * Fast, zero-RAM circuit breaker. Rejects files that declare an invalid MIME type
 * before downloading the entire body into memory.
 */
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError(
          "File type not allowed. Allowed: PDF, ZIP, PNG, JPG, DOCX, TXT",
          400
        )
      );
    }
    cb(null, true);
  },
});

/**
 * TIER 2: Deep Magic Number (File Signature) Validator
 * Runs after Multer has assembled req.file.buffer. Inspects the true binary
 * header bytes to detect extension spoofing and forged Content-Type headers.
 */
const validateFileSignature = async (req, res, next) => {
  try {
    // If no file was uploaded, proceed to the controller (controller handles missing file)
    if (!req.file || !req.file.buffer) {
      return next();
    }

    // Inspect the first bytes of the buffer
    const realType = await FileType.fromBuffer(req.file.buffer);

    if (realType) {
      // Binary file recognized by magic bytes: verify against whitelist
      if (!ALLOWED_MIME_TYPES.includes(realType.mime)) {
        return next(
          new AppError(
            `File content mismatch detected. Claimed type: ${req.file.mimetype}, actual detected type: ${realType.mime}`,
            400
          )
        );
      }

      // CRITICAL: Overwrite the client's claimed MIME type with the verified MIME type
      // Ensures downstream services (Supabase, MongoDB) store genuine metadata
      req.file.mimetype = realType.mime;
    } else {
      // No magic bytes found (e.g. text/plain files)
      if (req.file.mimetype === "text/plain") {
        // Plain text should never contain null bytes (0x00)
        const hasNullByte = req.file.buffer.includes(0x00);
        if (hasNullByte) {
          return next(
            new AppError("Invalid file content: binary payload disguised as text/plain", 400)
          );
        }
      } else {
        return next(
          new AppError("Unable to verify file signature. File type rejected.", 400)
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, validateFileSignature };
