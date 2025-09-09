const BallHandling = require("../models/ballhandling.model");
const User = require("../models/user.model");
const AWS = require("aws-sdk");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_SECRET_REGION,
});

// Setup Multer for handling multiple video uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file limit per video
}).fields([
  { name: "ball_handling_correct", maxCount: 1 },
  { name: "ball_handling_wrong", maxCount: 1 },
]);

// Function to upload file to S3
const uploadToS3 = async (file, userId) => {
  const fileStream = fs.createReadStream(file.path);
  const params = {
    Bucket: "rp-projects-public",
    Key: `videos/${userId}/${Date.now()}-${path.basename(file.path)}`,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    fs.unlinkSync(file.path); // Delete temporary file after successful upload
    return data.Location;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};

// Upload ball handling videos
exports.uploadBallHandlingVideos = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "File Upload Failed.", error: err });
    }

    if (
      !req.files ||
      !req.files["ball_handling_correct"] ||
      !req.files["ball_handling_wrong"]
    ) {
      return res.status(400).json({ message: "Both videos are required." });
    }

    try {
      const userId = req.user.id;

      // Upload both videos to S3
      const correctVideoUrl = await uploadToS3(
        req.files["ball_handling_correct"][0],
        userId
      );
      const wrongVideoUrl = await uploadToS3(
        req.files["ball_handling_wrong"][0],
        userId
      );

      // Save video URLs in the database
      const ballHandling = new BallHandling({
        userId,
        ball_handling_correct_s3_link: correctVideoUrl,
        ball_handling_wrong_s3_link: wrongVideoUrl,
      });

      await ballHandling.save();

      res.status(201).json({
        message: "Videos uploaded successfully",
        data: {
          _id: ballHandling._id,
          userId: ballHandling.userId,
          ball_handling_correct_s3_link:
            ballHandling.ball_handling_correct_s3_link,
          ball_handling_wrong_s3_link: ballHandling.ball_handling_wrong_s3_link,
          ball_handling_analyzed_video_s3_link:
            ballHandling.ball_handling_analyzed_video_s3_link,
          ball_handling_graph_s3_link: ballHandling.ball_handling_graph_s3_link,
          ball_handling_matching_percentage:
            ballHandling.ball_handling_matching_percentage,
          ball_handling_videoUploadTime:
            ballHandling.ball_handling_videoUploadTime,
          createdAt: ballHandling.createdAt,
          updatedAt: ballHandling.updatedAt,
        },
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
};

exports.getBallHandlingMatchingPercentages = async (req, res) => {
  try {
    const { userId } = req.params;

    const analyses = await BallHandling.find(
      { userId },
      { ball_handling_matching_percentage: 1, createdAt: 1, _id: 0 }
    ).sort({ createdAt: -1 }); // Newest records first

    if (!analyses || analyses.length === 0) {
      return res.status(404).json({
        message: "No matching percentage data found for this user."
      });
    }

    res.status(200).json(analyses);
  } catch (error) {
    console.error("Error fetching attack analysis matching percentages:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Analyze Ball Handling Videos
exports.analyzeBallHandling = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the BallHandling record by ID
    const ballHandling = await BallHandling.findById(id);
    if (!ballHandling) {
      return res
        .status(404)
        .json({ message: "Ball handling record not found" });
    }

    // Check if the video has already been analyzed
    if (ballHandling.ball_handling_analyzed_video_s3_link) {
      return res.status(400).json({
        message: "Analysis has already been performed for this record.",
        ball_handling_analyzed_video_s3_link:
          ballHandling.ball_handling_analyzed_video_s3_link,
        ball_handling_matching_percentage:
          ballHandling.ball_handling_matching_percentage,
      });
    }

    // Prepare request payload
    const requestBody = {
      correct_s3_link: ballHandling.ball_handling_correct_s3_link,
      wrong_s3_link: ballHandling.ball_handling_wrong_s3_link,
    };

    // Send POST request to external API
    const response = await axios.post(
      `${process.env.FLASH_BACKEND}/netball-project/ball_handling`,
      requestBody
    );

    // Extract analyzed video link and similarity percentage from response
    const analyzedVideoUrl = response.data.ball_handling_result.file_url;
    const similarityPercentage = response.data.ball_handling_result.similarity;

    // Update the BallHandling record with analyzed video link and similarity percentage
    ballHandling.ball_handling_analyzed_video_s3_link = analyzedVideoUrl;
    ballHandling.ball_handling_matching_percentage = similarityPercentage;
    await ballHandling.save();

    // Return success response
    res.status(200).json({
      message: "Ball handling analysis completed successfully",
      ball_handling_analyzed_video_s3_link: analyzedVideoUrl,
      ball_handling_matching_percentage: similarityPercentage,
    });
  } catch (error) {
    console.error("Error analyzing ball handling videos:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get All User Uploaded ball handling videos
exports.getBallHandlingVideos = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Fetch all videos for the given userId
    const videos = await BallHandling.find({ userId });

    if (videos.length === 0) {
      return res
        .status(404)
        .json({ message: "No videos found for this user." });
    }

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching ball handling videos:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete ball handling record
exports.deleteBallHandling = async (req, res) => {
  try {
    const ballHandlingId = req.params.id;
    const userId = req.user.id;

    // Find the ball handling record
    const ballHandling = await BallHandling.findOne({
      _id: ballHandlingId,
      userId,
    });

    if (!ballHandling) {
      return res.status(404).json({
        message: "Record not found or unauthorized to delete.",
      });
    }

    // Delete the record from the database
    await BallHandling.findByIdAndDelete(ballHandlingId);

    res.status(200).json({
      message: "Ball handling record deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting ball handling record:", error);
    res.status(500).json({
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

// Get top payers for each coach based on ball handling
exports.getTopUsersByBallHandling = async (req, res) => {
  try {
    const userId = req.user.id; 

    // Check if the authenticated user is a coach
    const coach = await User.findById(userId);
    if (!coach || coach.profileType !== "Coach") {
      return res.status(403).json({
        message: "Access Denied. Only coaches can view this data.",
      });
    }

    const { count } = req.body;
    if (!count || count <= 0) {
      return res.status(400).json({ message: "Invalid count value." });
    }

    // Get all players assigned to this coach
    const players = await User.find({ selectedCoach: userId }).select("_id");
    const playerIds = players.map((player) => player._id);

    const topBallHandlingRecords = await BallHandling.aggregate([
      { $match: { userId: { $in: playerIds } } },
      { $sort: { ball_handling_matching_percentage: -1 } },
      {
        $group: {
          _id: "$userId",
          topRecord: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$topRecord" } },
      { $sort: { ball_handling_matching_percentage: -1 } },
      { $limit: parseInt(count) },
      {
        $lookup: {
          from: "users", 
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userFullName: "$user.fullName",
          userEmail: "$user.email",
          ballHandlingData: {
            ball_handling_matching_percentage:
              "$ball_handling_matching_percentage",
          },
        },
      },
    ]);

    res.status(200).json({ topUsers: topBallHandlingRecords });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Suggest a video based on ball handling
exports.ballHandlingSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all ball handling records for the user
    const ballHandlingRecords = await BallHandling.find({ userId }).sort({
      ball_handling_matching_percentage: -1,
    });

    if (!ballHandlingRecords.length) {
      return res.status(404).json({
        message: "No ball handling records found for this user.",
      });
    }

    // Process each record and suggest a video
    const response = ballHandlingRecords.map((record) => {
      let suggestedVideo = "";
      let ballMatchingPercentage = record.ball_handling_matching_percentage;

      // If ball_handling_matching_percentage is missing, set "No value found"
      if (
        ballMatchingPercentage === undefined ||
        ballMatchingPercentage === null
      ) {
        ballMatchingPercentage = "No value found";
        suggestedVideo = "No suggested video";
      } else if (ballMatchingPercentage > 80) {
        suggestedVideo = "https://s3.com/high_skill_ball_video.mp4";
      } else if (ballMatchingPercentage >= 60) {
        suggestedVideo = "https://s3.com/intermediate_ball_video.mp4";
      } else {
        suggestedVideo = "https://s3.com/beginner_ball_video.mp4";
      }

      return {
        ball_handling_matching_percentage: ballMatchingPercentage,
        suggestedVideo: suggestedVideo,
      };
    });

    res.status(200).json({ data: response });
  } catch (error) {
    console.error("Error fetching user ball handling data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
