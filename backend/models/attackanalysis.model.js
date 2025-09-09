const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AttackAnalysisSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attack_analysis_correct_s3_link: {
      type: String,
      required: true,
    },
    attack_analysis_wrong_s3_link: {
      type: String,
      required: true,
    },
    attack_analysis_analyzed_video_s3_link: {
      type: String,
      default: "",
    },
    attack_analysis_matching_percentage: {
      shoulder: { 
        type: Number, 
        default: 0 
      },
      left_elbow: { 
        type: Number, 
        default: 0 
      },
      right_elbow: { 
        type: Number, 
        default: 0 
      },
      overall: { 
        type: Number, 
        default: 0 
      },
    },
    attack_analysis_videoUploadTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttackAnalysis", AttackAnalysisSchema);
