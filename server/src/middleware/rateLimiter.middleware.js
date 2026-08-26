const redis = require("../utils/redis");
const AppError = require("../utils/appError");

/**
 * Creates a rate limiter middleware using Redis sliding window.
 * If Redis is down, rate limiting is disabled (fail open) —
 * core app functionality is more important than rate limiting.
 *
 * @param {object} options
 * @param {string} options.prefix - Redis key prefix (e.g. "login", "link")
 * @param {number} options.maxAttempts - Max attempts in the window
 * @param {number} options.windowSeconds - Window duration in seconds
 * @param {function} options.keyGenerator - Function(req) => string for unique key
 */
function createRateLimiter({ prefix, maxAttempts, windowSeconds, keyGenerator }) {
  return async (req, res, next) => {
    // Fail open if Redis is unavailable
    if (!redis) {
      return next();
    }

    try {
      const key = `${prefix}:${keyGenerator(req)}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxAttempts) {
        return next(
          new AppError("Too many attempts. Please try again later.", 429)
        );
      }

      next();
    } catch (err) {
      // If Redis fails, allow the request (fail open)
      console.error("Rate limiter error:", err.message);
      next();
    }
  };
}

// Login rate limiter: 5 attempts per minute per IP
const loginRateLimiter = createRateLimiter({
  prefix: "login:ip",
  maxAttempts: 5,
  windowSeconds: 60,
  keyGenerator: (req) => req.ip,
});

// Password attempt rate limiter: 5 attempts per minute per shortCode+IP
const passwordRateLimiter = createRateLimiter({
  prefix: "link",
  maxAttempts: 5,
  windowSeconds: 60,
  keyGenerator: (req) => `${req.params.shortCode}:ip:${req.ip}`,
});

// Download rate limiter: 20 attempts per minute per shortCode+IP
const downloadRateLimiter = createRateLimiter({
  prefix: "download",
  maxAttempts: 20,
  windowSeconds: 60,
  keyGenerator: (req) => `${req.params.shortCode}:ip:${req.ip}`,
});

module.exports = {
  createRateLimiter,
  loginRateLimiter,
  passwordRateLimiter,
  downloadRateLimiter,
};
