const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const User = require("./auth.model");
const AppError = require("../../utils/appError");

const SALT_ROUNDS = 10;
const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Set JWT as HttpOnly cookie on response.
 * Local dev: secure=false, sameSite=lax
 * Production: secure=true, sameSite=none (cross-domain)
 */
function setTokenCookie(res, token) {
  const isProduction = config.nodeEnv === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Register a new user — auto login by issuing JWT cookie.
 */
async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    usedStorage: 0,
  });

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      usedStorage: user.usedStorage,
    },
  };
}

/**
 * Login user — returns "Invalid credentials" for both
 * wrong email and wrong password (never reveal which).
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      usedStorage: user.usedStorage,
    },
  };
}

/**
 * Get current user from JWT (already verified by auth middleware)
 */
async function getMe(userId) {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    usedStorage: user.usedStorage,
    maxStorage: MAX_STORAGE,
  };
}

module.exports = { register, login, getMe, setTokenCookie, MAX_STORAGE };
