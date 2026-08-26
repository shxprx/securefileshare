const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  shareLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShareLink",
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ["VISIT", "DOWNLOAD_GRANTED"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Activity = mongoose.model("Activity", activitySchema);
module.exports = Activity;
