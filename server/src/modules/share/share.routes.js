const express = require("express");
const router = express.Router();
const shareController = require("./share.controller");
const { protect } = require("../../middleware/auth.middleware");
const {
  passwordRateLimiter,
  downloadRateLimiter,
} = require("../../middleware/rateLimiter.middleware");

// Authenticated routes (require login)
router.post("/files/:id/share", protect, shareController.createShareLink);
router.delete("/links/:id", protect, shareController.deleteShareLink);

// Public routes (no auth — anyone with the link can access)
router.get("/s/:shortCode", shareController.getLinkInfo);
router.post(
  "/s/:shortCode/unlock",
  passwordRateLimiter,
  shareController.unlockLink
);
router.post(
  "/s/:shortCode/download",
  downloadRateLimiter,
  shareController.downloadLink
);

module.exports = router;
