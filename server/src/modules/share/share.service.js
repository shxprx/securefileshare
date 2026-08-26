const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ShareLink = require("./share.model");
const File = require("../file/file.model");
const Activity = require("../activity/activity.model");
const { generateShortCode } = require("../../utils/shortCode");
const supabase = require("../../utils/supabase");
const config = require("../../config");
const AppError = require("../../utils/appError");

const SALT_ROUNDS = 10;
const SIGNED_URL_EXPIRY = 120; // 120 seconds (2 minutes)

/**
 * Create a new share link for a file.
 * Links are IMMUTABLE — to change settings, delete and create a new one.
 */
async function createShareLink({ fileId, userId, alias, password, expiresAt, maxDownloads }) {
  // Verify file ownership — never query by fileId alone
  const file = await File.findOne({ _id: fileId, ownerId: userId });
  if (!file) {
    throw new AppError("File not found", 404);
  }

  // Generate unique Base62 short code with collision check
  let shortCode;
  let exists = true;
  while (exists) {
    shortCode = generateShortCode(8);
    exists = await ShareLink.findOne({ shortCode });
  }

  // Hash password if provided (bcrypt, not plaintext)
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const link = await ShareLink.create({
    fileId: file._id,
    shortCode,
    alias: alias || null,
    passwordHash,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    maxDownloads: maxDownloads || null,
  });

  return {
    id: link._id,
    shortCode: link.shortCode,
    url: `/s/${link.shortCode}`,
  };
}

/**
 * Delete a share link — hard delete + cascade to activity.
 */
async function deleteShareLink(linkId, userId) {
  // Must verify ownership through the file
  const link = await ShareLink.findById(linkId).populate("fileId");
  if (!link) {
    throw new AppError("Share link not found", 404);
  }

  const file = await File.findOne({ _id: link.fileId, ownerId: userId });
  if (!file) {
    throw new AppError("Share link not found", 404);
  }

  // Delete activity records for this link
  await Activity.deleteMany({ shareLinkId: link._id });

  // Delete the link itself
  await ShareLink.deleteOne({ _id: link._id });
}

/**
 * Get share link info for the public landing page.
 * Increments visitCount atomically and creates VISIT activity.
 */
async function getLinkInfo(shortCode) {
  const link = await ShareLink.findOne({ shortCode });
  if (!link) {
    return { found: false };
  }

  // Increment visit count atomically
  await ShareLink.updateOne(
    { _id: link._id },
    { $inc: { visitCount: 1 }, $set: { lastVisitedAt: new Date() } }
  );

  // Create VISIT activity
  await Activity.create({
    shareLinkId: link._id,
    eventType: "VISIT",
  });

  // Determine status
  let status = "ACTIVE";

  if (link.expiresAt && new Date() > link.expiresAt) {
    status = "EXPIRED";
  } else if (
    link.maxDownloads !== null &&
    link.downloadCount >= link.maxDownloads
  ) {
    status = "LIMIT_REACHED";
  }

  // Get file info
  const file = await File.findById(link.fileId);
  if (!file) {
    return { found: false };
  }

  return {
    found: true,
    status,
    requiresPassword: !!link.passwordHash,
    file: {
      name: file.originalFileName,
      size: file.fileSize,
      mimeType: file.mimeType,
    },
  };
}

/**
 * Unlock a password-protected link.
 * Issues a temporary access token as an HttpOnly cookie (session-based).
 */
async function unlockLink(shortCode, password) {
  const link = await ShareLink.findOne({ shortCode });
  if (!link) {
    throw new AppError("Link not found", 404);
  }

  if (!link.passwordHash) {
    throw new AppError("This link does not require a password", 400);
  }

  // Check expiry
  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new AppError("Link has expired", 410);
  }

  const isMatch = await bcrypt.compare(password, link.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid password", 401);
  }

  // Generate a short-lived access token for this specific link
  const accessToken = jwt.sign(
    { linkId: link._id.toString(), shortCode },
    config.jwtSecret,
    { expiresIn: "30m" } // 30 minutes
  );

  return { accessToken };
}

/**
 * Download flow — the most critical API in the project.
 *
 * 1. Re-validate everything (time may have passed since page load)
 * 2. Verify access cookie for password-protected links
 * 3. Atomic download limit check + increment (prevents race conditions)
 * 4. Generate signed URL from Supabase
 * 5. Create DOWNLOAD_GRANTED activity
 * 6. If signed URL fails → compensating rollback
 */
async function downloadLink(shortCode, accessToken) {
  const link = await ShareLink.findOne({ shortCode });
  if (!link) {
    throw new AppError("Link not found", 404);
  }

  // Re-validate expiry (defensive — time may have passed)
  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new AppError("Link has expired", 410);
  }

  // Verify password access if link is password-protected
  if (link.passwordHash) {
    if (!accessToken) {
      throw new AppError("Unauthorized — password required", 401);
    }
    try {
      const decoded = jwt.verify(accessToken, config.jwtSecret);
      if (decoded.linkId !== link._id.toString()) {
        throw new AppError("Unauthorized", 401);
      }
    } catch (err) {
      throw new AppError("Unauthorized — invalid or expired access", 401);
    }
  }

  // Atomic download limit check + increment
  // This is the core concurrency solution:
  // findOneAndUpdate checks the condition AND increments in one operation.
  // If 100 users click simultaneously and maxDownloads=1:
  //   - First request: condition true → increment → success
  //   - All others: condition false → update fails → rejected
  if (link.maxDownloads !== null) {
    const updated = await ShareLink.findOneAndUpdate(
      {
        _id: link._id,
        downloadCount: { $lt: link.maxDownloads },
      },
      {
        $inc: { downloadCount: 1 },
        $set: { lastDownloadedAt: new Date() },
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError("Download limit reached", 403);
    }
  } else {
    // No download limit — just increment counter
    await ShareLink.updateOne(
      { _id: link._id },
      {
        $inc: { downloadCount: 1 },
        $set: { lastDownloadedAt: new Date() },
      }
    );
  }

  // Get file info for storage key
  const file = await File.findById(link.fileId);
  if (!file) {
    // Compensating rollback — decrement download count
    await ShareLink.updateOne(
      { _id: link._id },
      { $inc: { downloadCount: -1 } }
    );
    throw new AppError("File not found", 404);
  }

  // Generate signed URL from Supabase (60-120 sec expiry)
  const { data, error } = await supabase.storage
    .from(config.supabaseBucket)
    .createSignedUrl(file.storageKey, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    // Compensating rollback — decrement and remove activity
    await ShareLink.updateOne(
      { _id: link._id },
      { $inc: { downloadCount: -1 } }
    );
    throw new AppError("Failed to generate download URL", 500);
  }

  // Create DOWNLOAD_GRANTED activity
  await Activity.create({
    shareLinkId: link._id,
    eventType: "DOWNLOAD_GRANTED",
  });

  return {
    downloadUrl: data.signedUrl,
    fileName: file.originalFileName,
  };
}

module.exports = {
  createShareLink,
  deleteShareLink,
  getLinkInfo,
  unlockLink,
  downloadLink,
};
