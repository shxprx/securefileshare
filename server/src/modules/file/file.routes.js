const express = require("express");
const router = express.Router();
const fileController = require("./file.controller");
const { protect } = require("../../middleware/auth.middleware");
const { upload, validateFileSignature } = require("../../middleware/upload.middleware");

// All file routes require authentication
router.use(protect);

// Upload pipeline: protect -> Multer (buffer into RAM) -> validateFileSignature -> fileController
router.post(
    "/upload",
    upload.single("file"),
    validateFileSignature,
    fileController.upload
);

router.get("/", fileController.getFiles);
router.get("/:id", fileController.getFileDetails);
router.delete("/:id", fileController.deleteFile);

module.exports = router;