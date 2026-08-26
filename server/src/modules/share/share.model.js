const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
    index: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  alias: {
    type: String,
    default: null, // metadata only, NOT part of URL routing
  },
  passwordHash: {
    type: String,
    default: null, // null = no password required
  },
  expiresAt: {
    type: Date,
    default: null, // null = never expires
  },
  maxDownloads: {
    type: Number,
    default: null, // null = unlimited downloads
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  visitCount: {
    type: Number,
    default: 0,
  },
  lastVisitedAt: {
    type: Date,
    default: null,
  },
  lastDownloadedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for expiry-based queries (cleanup job)
shareLinkSchema.index({ expiresAt: 1 });

const ShareLink = mongoose.model("ShareLink", shareLinkSchema);
module.exports = ShareLink;
