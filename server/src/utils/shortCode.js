const crypto = require("crypto");

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate a cryptographically random Base62 short code.
 * Uses crypto.randomBytes for unpredictability — important since
 * short codes are public-facing identifiers for share links.
 *
 * @param {number} length - Length of the short code (default 8)
 * @returns {string} Random Base62 string
 */
function generateShortCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARS[bytes[i] % 62];
  }
  return result;
}

module.exports = { generateShortCode };
