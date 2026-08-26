const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./modules/auth/auth.routes");
const fileRoutes = require("./modules/file/file.routes");
const shareRoutes = require("./modules/share/share.routes");

const app = express();

// ─── Middleware ───
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true, // Required for HttpOnly cookie auth
  })
);

// ─── Health Check ───
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ─── API Routes ───
app.use("/auth", authRoutes);
app.use("/files", fileRoutes);

// Share routes are mounted at root because public URLs use /s/:shortCode
// and authenticated routes use /files/:id/share
app.use("/", shareRoutes);

// ─── Global Error Handler ───
app.use(errorHandler);

// ─── Database Connection + Server Start ───
const PORT = config.port;

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;
