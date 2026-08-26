const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { protect } = require("../../middleware/auth.middleware");
const { loginRateLimiter } = require("../../middleware/rateLimiter.middleware");

router.post("/register", authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
