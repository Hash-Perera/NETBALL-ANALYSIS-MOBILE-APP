const mongoose = require("mongoose");

const InjuryDetectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    s3_link: {
      type: String,
      required: true,
    },
    injury_class: {
      type: String,
      default: "Not Detected",
    },
    probability: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InjuryDetection", InjuryDetectionSchema);
