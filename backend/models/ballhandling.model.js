const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BallHandlingSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ball_handling_correct_s3_link: {
      type: String,
      required: true,
    },
    ball_handling_wrong_s3_link: {
      type: String,
      required: true,
    },
    ball_handling_analyzed_video_s3_link: {
      type: String,
      default: "",
    },
    ball_handling_graph_s3_link: {
      type: String,
      default: "https://img.freepik.com/free-vector/bar-graph_52683-9732.jpg?t=st=1740504979~exp=1740508579~hmac=888aa8c853f8f4fb1eac06c13cde08334968b56c620615b135e70daacc2f6f4a&w=740",
    },
    ball_handling_matching_percentage: {
      type: Number
    },
    ball_handling_videoUploadTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BallHandling", BallHandlingSchema);
