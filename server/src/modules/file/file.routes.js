const express = require("express");
const router = express.Router();
const fileController = require("./file.controller");
const { protect } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");

// All file routes require authentication
router.use(protect);

router.post("/upload", upload.single("file"), fileController.upload);
router.get("/", fileController.getFiles);
router.get("/:id", fileController.getFileDetails);
router.delete("/:id", fileController.deleteFile);

module.exports = router;
