const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DefenceAnalysisSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    defence_analysis_correct_s3_link: {
      type: String,
      required: true,
    },
    defence_analysis_wrong_s3_link: {
      type: String,
      required: true,
    },
    defence_analysis_analyzed_video_s3_link: {
      type: String,
      default: "",
    },
    defence_analysis_matching_percentage: {
      left_knee: {
        type: Number,
        default: 0,
      },
      right_knee: {
        type: Number,
        default: 0,
      },
      hip_stance: {
        type: Number,
        default: 0,
      },
      stance_width: {
        type: Number,
        default: 0,
      },
      overall: {
        type: Number,
        default: 0,
      },
    },
    defence_analysis_videoUploadTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DefenceAnalysis", DefenceAnalysisSchema);
