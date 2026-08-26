const Redis = require("ioredis");
const config = require("../config");

let redis = null;

try {
  if (config.redisUrl) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });
  }
} catch (err) {
  console.error("Redis initialization failed:", err.message);
}

module.exports = redis;
