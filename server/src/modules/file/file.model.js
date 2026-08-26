const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true, // e.g. "files/userId/uuid.ext"
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      required: true, // SHA-256 for duplicate detection
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for duplicate detection: find files with same hash for same owner
fileSchema.index({ ownerId: 1, fileHash: 1 });

const File = mongoose.model("File", fileSchema);
module.exports = File;
