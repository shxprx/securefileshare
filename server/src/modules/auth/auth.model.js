const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    usedStorage: {
      type: Number,
      default: 0, // in bytes — denormalized counter, updated atomically in transactions
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index on email for fast lookups (unique already creates index)

const User = mongoose.model("User", userSchema);
module.exports = User;
