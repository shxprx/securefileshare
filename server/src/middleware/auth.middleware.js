const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("../utils/appError");
const User = require("../modules/auth/auth.model");

/**
 * Auth middleware — verifies JWT from HttpOnly cookie.
 * Cookie is automatically sent by the browser (withCredentials: true).
 * We NEVER read JWT from Authorization header or localStorage.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return next(new AppError("Unauthorized", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new AppError("Unauthorized", 401));
  }
};

module.exports = { protect };
