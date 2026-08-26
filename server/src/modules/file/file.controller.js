const fileService = require("./file.service");

async function upload(req, res, next) {
  try {
    const forceUpload = req.query.force === "true";
    const result = await fileService.uploadFile({
      file: req.file,
      userId: req.user._id,
      forceUpload,
    });

    if (result.duplicate) {
      return res.status(200).json({
        success: false,
        duplicate: true,
        existingFile: result.existingFile,
      });
    }

    res.status(201).json({
      success: true,
      file: result.file,
    });
  } catch (err) {
    next(err);
  }
}

async function getFiles(req, res, next) {
  try {
    const files = await fileService.getFiles(req.user._id);
    res.status(200).json({
      success: true,
      files,
    });
  } catch (err) {
    next(err);
  }
}

async function getFileDetails(req, res, next) {
  try {
    const data = await fileService.getFileDetails(
      req.params.id,
      req.user._id
    );
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteFile(req, res, next) {
  try {
    await fileService.deleteFile(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, getFiles, getFileDetails, deleteFile };
