const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const mongoose = require("mongoose");
const File = require("./file.model");
const User = require("../auth/auth.model");
const ShareLink = require("../share/share.model");
const Activity = require("../activity/activity.model");
const supabase = require("../../utils/supabase");
const config = require("../../config");
const AppError = require("../../utils/appError");
const { MAX_STORAGE } = require("../auth/auth.service");

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Calculate SHA-256 hash of file buffer for duplicate detection.
 * Same file content always produces the same hash.
 */
function calculateHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Upload file — the most complex flow in the project.
 *
 * Steps:
 * 1. Validate file (size, type — already done by Multer)
 * 2. Calculate SHA-256 hash
 * 3. Check for duplicate (same hash + same owner)
 * 4. Check user quota (atomic, prevents race condition)
 * 5. Upload to Supabase private bucket
 * 6. Mongo transaction: create File + update usedStorage
 * 7. If transaction fails: delete from Supabase (compensating rollback)
 */
async function uploadFile({ file, userId, forceUpload }) {
  if (!file) {
    throw new AppError("No file provided", 400);
  }

  // Calculate SHA-256 hash
  const fileHash = calculateHash(file.buffer);

  // Check for duplicate (if not force upload)
  if (!forceUpload) {
    const existing = await File.findOne({ ownerId: userId, fileHash });
    if (existing) {
      return {
        duplicate: true,
        existingFile: {
          id: existing._id,
          name: existing.originalFileName,
          createdAt: existing.createdAt,
        },
      };
    }
  }

  // Generate unique storage key: files/userId/uuid.ext
  const ext = path.extname(file.originalname);
  const storageKey = `files/${userId}/${uuidv4()}${ext}`;

  // Upload to Supabase private bucket
  const { error: uploadError } = await supabase.storage
    .from(config.supabaseBucket)
    .upload(storageKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new AppError("Failed to upload file to storage", 500);
  }

  // Mongo transaction: create File + atomic quota update
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic quota check — prevents race condition where
    // two simultaneous uploads exceed the 100MB limit.
    // Only increments usedStorage IF there's enough space.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        usedStorage: { $lte: MAX_STORAGE - file.size },
      },
      {
        $inc: { usedStorage: file.size },
      },
      { new: true, session }
    );

    if (!updatedUser) {
      throw new AppError("Storage quota exceeded. Max 100 MB.", 400);
    }

    // Create File document
    const [newFile] = await File.create(
      [
        {
          ownerId: userId,
          originalFileName: file.originalname,
          storageKey,
          mimeType: file.mimetype,
          fileSize: file.size,
          fileHash,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      duplicate: false,
      file: {
        id: newFile._id,
        name: newFile.originalFileName,
        size: newFile.fileSize,
        mimeType: newFile.mimeType,
        createdAt: newFile.createdAt,
      },
    };
  } catch (err) {
    await session.abortTransaction();

    // Compensating rollback: delete the uploaded file from Supabase
    await supabase.storage.from(config.supabaseBucket).remove([storageKey]);

    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Get all files for a user (no pagination — max ~50 files with 100MB quota).
 */
async function getFiles(userId) {
  const files = await File.find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .lean();

  // Get link stats for each file
  const fileIds = files.map((f) => f._id);
  const linkStats = await ShareLink.aggregate([
    { $match: { fileId: { $in: fileIds } } },
    {
      $group: {
        _id: "$fileId",
        count: { $sum: 1 },
        downloads: { $sum: "$downloadCount" },
      },
    },
  ]);

  const statsMap = {};
  linkStats.forEach((ls) => {
    statsMap[ls._id.toString()] = {
      count: ls.count,
      downloads: ls.downloads,
    };
  });

  return files.map((f) => ({
    id: f._id,
    name: f.originalFileName,
    size: f.fileSize,
    mimeType: f.mimeType,
    linkCount: statsMap[f._id.toString()]?.count || 0,
    downloadCount: statsMap[f._id.toString()]?.downloads || 0,
    createdAt: f.createdAt,
  }));
}

/**
 * Get file details + share links + recent activity in ONE response.
 * File Details page always needs all three together.
 */
async function getFileDetails(fileId, userId) {
  const file = await File.findOne({ _id: fileId, ownerId: userId }).lean();
  if (!file) {
    throw new AppError("File not found", 404);
  }

  const links = await ShareLink.find({ fileId: file._id })
    .sort({ createdAt: -1 })
    .lean();

  // Get recent activity for all links of this file (last 50)
  const linkIds = links.map((l) => l._id);
  const recentActivity = await Activity.find({
    shareLinkId: { $in: linkIds },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    file: {
      id: file._id,
      name: file.originalFileName,
      size: file.fileSize,
      mimeType: file.mimeType,
      hash: file.fileHash,
      createdAt: file.createdAt,
    },
    links: links.map((l) => ({
      id: l._id,
      shortCode: l.shortCode,
      alias: l.alias,
      url: `/s/${l.shortCode}`,
      hasPassword: !!l.passwordHash,
      expiresAt: l.expiresAt,
      maxDownloads: l.maxDownloads,
      downloadCount: l.downloadCount,
      visitCount: l.visitCount,
      lastVisitedAt: l.lastVisitedAt,
      lastDownloadedAt: l.lastDownloadedAt,
      createdAt: l.createdAt,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a._id,
      type: a.eventType,
      shareLinkId: a.shareLinkId,
      createdAt: a.createdAt,
    })),
  };
}

/**
 * Delete file — hard delete with cascade.
 *
 * Order:
 * 2. Mongo transaction: delete File + ShareLinks + Activity + update usedStorage
 * 1. Delete from Supabase
 *
 * Ownership check: always query with ownerId to prevent accessing other users' files.
 */
async function deleteFile(fileId, userId) {
  const file = await File.findOne({ _id: fileId, ownerId: userId });
  if (!file) {
    throw new AppError("File not found", 404);
  }

  // // Delete from Supabase first
  // const { error: deleteError } = await supabase.storage
  //   .from(config.supabaseBucket)
  //   .remove([file.storageKey]);

  // if (deleteError) {
  //   console.error("Supabase delete error:", deleteError);
  //   // Continue anyway — orphan cleanup can handle this later
  // }

  // Mongo transaction: cascade delete
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Get all share links for this file
    const links = await ShareLink.find({ fileId: file._id }).session(session);
    const linkIds = links.map((l) => l._id);

    // Delete activity records
    await Activity.deleteMany({ shareLinkId: { $in: linkIds } }).session(
      session
    );

    // Delete share links
    await ShareLink.deleteMany({ fileId: file._id }).session(session);

    // Delete file
    await File.deleteOne({ _id: file._id }).session(session);

    // Update usedStorage (decrement)
    await User.findByIdAndUpdate(
      userId,
      { $inc: { usedStorage: -file.fileSize } },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

      // Delete from Supabase second
  const { error: deleteError } = await supabase.storage
    .from(config.supabaseBucket)
    .remove([file.storageKey]);

  if (deleteError) {
    console.error("Supabase delete error:", deleteError);
    // Continue anyway — orphan cleanup can handle this later
  }
  
}

module.exports = { uploadFile, getFiles, getFileDetails, deleteFile };
