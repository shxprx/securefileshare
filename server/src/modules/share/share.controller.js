const shareService = require("./share.service");
const config = require("../../config");

async function createShareLink(req, res, next) {
  try {
    const { alias, password, expiresAt, maxDownloads } = req.body;
    const link = await shareService.createShareLink({
      fileId: req.params.id,
      userId: req.user._id,
      alias,
      password,
      expiresAt,
      maxDownloads,
    });

    res.status(201).json({
      success: true,
      link,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteShareLink(req, res, next) {
  try {
    await shareService.deleteShareLink(req.params.id, req.user._id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Get link landing page info.
 * Returns status (ACTIVE, EXPIRED, LIMIT_REACHED) — not HTTP errors.
 * Frontend renders different UI based on status.
 */
async function getLinkInfo(req, res, next) {
  try {
    const info = await shareService.getLinkInfo(req.params.shortCode);

    if (!info.found) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    res.status(200).json({
      success: true,
      status: info.status,
      requiresPassword: info.requiresPassword,
      file: info.file,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Unlock password-protected link.
 * Issues a temporary access cookie (session-based).
 */
async function unlockLink(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const { accessToken } = await shareService.unlockLink(
      req.params.shortCode,
      password
    );

    // Set access token as HttpOnly cookie (session-based — expires on browser close)
    const isProduction = config.nodeEnv === "production";
    res.cookie(`access_${req.params.shortCode}`, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      // No maxAge = session cookie (expires on browser close)
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Download file via signed URL.
 * The most critical endpoint — handles concurrency, validation, signed URLs.
 */
async function downloadLink(req, res, next) {
  try {
    const accessToken = req.cookies[`access_${req.params.shortCode}`] || null;

    const result = await shareService.downloadLink(
      req.params.shortCode,
      accessToken
    );

    res.status(200).json({
      success: true,
      downloadUrl: result.downloadUrl,
      fileName: result.fileName,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createShareLink,
  deleteShareLink,
  getLinkInfo,
  unlockLink,
  downloadLink,
};
