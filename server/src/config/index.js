const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  supabaseUrl: process.env.SUPABASE_URL 
    ? process.env.SUPABASE_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "") 
    : process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  supabaseBucket: process.env.SUPABASE_BUCKET || "files",
  redisUrl: process.env.REDIS_URL,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};
