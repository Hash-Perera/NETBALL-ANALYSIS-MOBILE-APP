const AttackAnalysis = require("../models/attackanalysis.model");
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
  { name: "attack_analysis_correct", maxCount: 1 },
  { name: "attack_analysis_wrong", maxCount: 1 },
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

// Upload attack analysis videos
exports.uploadAttackAnalysisVideos = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "File Upload Failed.", error: err });
    }

    if (
      !req.files ||
      !req.files["attack_analysis_correct"] ||
      !req.files["attack_analysis_wrong"]
    ) {
      return res.status(400).json({ message: "Both videos are required." });
    }

    try {
      const userId = req.user.id;

      // Upload both videos to S3
      const correctVideoUrl = await uploadToS3(
        req.files["attack_analysis_correct"][0],
        userId
      );
      const wrongVideoUrl = await uploadToS3(
        req.files["attack_analysis_wrong"][0],
        userId
      );

      // Save video URLs in the database
      const attackAnalysis = new AttackAnalysis({
        userId,
        attack_analysis_correct_s3_link: correctVideoUrl,
        attack_analysis_wrong_s3_link: wrongVideoUrl,
      });

      await attackAnalysis.save();

      res.status(201).json({
        message: "Videos uploaded successfully",
        data: {
          _id: attackAnalysis._id,
          userId: attackAnalysis.userId,
          attack_analysis_correct_s3_link:
            attackAnalysis.attack_analysis_correct_s3_link,
          attack_analysis_wrong_s3_link:
            attackAnalysis.attack_analysis_wrong_s3_link,
          attack_analysis_analyzed_video_s3_link:
            attackAnalysis.analyzed_video_s3_link,
          attack_analysis_graph_s3_link: attackAnalysis.graph_s3_link,
          attack_analysis_matching_percentage:
            attackAnalysis.matching_percentage,
          attack_analysis_videoUploadTime: attackAnalysis.videoUploadTime,
          createdAt: attackAnalysis.createdAt,
          updatedAt: attackAnalysis.updatedAt,
        },
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
};

// Analyze attack analysis Videos
exports.analyzeAttackAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the Attack Analysis record by ID
    const attackAnalysis = await AttackAnalysis.findById(id);
    if (!attackAnalysis) {
      return res
        .status(404)
        .json({ message: "Attack analysis record not found" });
    }

    // Check if the video has already been analyzed
    if (attackAnalysis.attack_analysis_analyzed_video_s3_link) {
      return res.status(400).json({
        message: "Analysis has already been performed for this record.",
        attack_analysis_analyzed_video_s3_link:
          attackAnalysis.attack_analysis_analyzed_video_s3_link,
      });
    }

    // Prepare request payload
    const requestBody = {
      correct_s3_link: attackAnalysis.attack_analysis_correct_s3_link,
      wrong_s3_link: attackAnalysis.attack_analysis_wrong_s3_link,
    };

    // Send POST request to external API
    const response = await axios.post(
      `${process.env.FLASH_BACKEND}/netball-project/attack_analysis`,
      requestBody
    );

    // Extract analyzed video link and similarity data from response
    const { file_url, similarity } = response.data.attack_analysis_result;

    // Update the attack analysis record with analyzed video link and similarity values
    attackAnalysis.attack_analysis_analyzed_video_s3_link = file_url;
    attackAnalysis.attack_analysis_matching_percentage = {
      shoulder: similarity.shoulder,
      left_elbow: similarity.left_elbow,
      right_elbow: similarity.right_elbow,
      overall: similarity.overall,
    };

    await attackAnalysis.save();

    // Return success response
    res.status(200).json({
      message: "Attack analysis completed successfully",
      attack_analysis_analyzed_video_s3_link: file_url,
      attack_analysis_matching_percentage: similarity,
    });
  } catch (error) {
    console.error("Error Attack analysis handling videos:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get All User Uploaded attack analysis videos
exports.getAttackAnalysisVideos = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Fetch all videos for the given userId
    const videos = await AttackAnalysis.find({ userId });

    if (videos.length === 0) {
      return res
        .status(404)
        .json({ message: "No videos found for this user." });
    }

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching attack analysis videos:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get attack analysis matching percentages
exports.getAttackAnalysisMatchingPercentages = async (req, res) => {
  try {
    // Extract userId from the authenticated request
    const { userId } = req.params;

    // Fetch the attack analysis data for the user, selecting only the required fields
    const analyses = await AttackAnalysis.find(
      { userId },
      { attack_analysis_matching_percentage: 1, createdAt: 1, _id: 0 }
    ).sort({ createdAt: -1 }); // Sort by newest first

    if (!analyses || analyses.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching percentage data found for this user." });
    }
    res.status(200).json(analyses);
  } catch (error) {
    console.error(
      "Error fetching attack analysis matching percentages:",
      error
    );
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete attack analysis record
exports.deleteAttackAnalysis = async (req, res) => {
  try {
    const attackAnalysisId = req.params.id;
    const userId = req.user.id;

    // Find the attack analysis record
    const attackAnalysis = await AttackAnalysis.findOne({
      _id: attackAnalysisId,
      userId,
    });

    if (!attackAnalysis) {
      return res.status(404).json({
        message: "Record not found or unauthorized to delete.",
      });
    }

    // Delete the record from the database
    await AttackAnalysis.findByIdAndDelete(attackAnalysisId);

    res.status(200).json({
      message: "Attack analysis record deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting attack analysis record:", error);
    res.status(500).json({
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

// Get top payers for each coach based on attack analysis
exports.getTopUsersByAttackAnalysis = async (req, res) => {
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

    const topAttackAnalysisRecords = await AttackAnalysis.aggregate([
      { $match: { userId: { $in: playerIds } } },
      { $sort: { "attack_analysis_matching_percentage.overall": -1 } },
      {
        $group: {
          _id: "$userId",
          topRecord: { $first: "$$ROOT" },
        },
      },
      // Replace the document with the grouped top record
      { $replaceRoot: { newRoot: "$topRecord" } },
      { $sort: { "attack_analysis_matching_percentage.overall": -1 } },
      { $limit: parseInt(count) },
      // Lookup user details from the Users collection
      {
        $lookup: {
          from: "users", 
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      // Project only the desired fields
      {
        $project: {
          _id: 0,
          userFullName: "$user.fullName",
          userEmail: "$user.email",
          attackAnalysisData: "$attack_analysis_matching_percentage",
        },
      },
    ]);

    res.status(200).json({ topUsers: topAttackAnalysisRecords });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Suggest a video based on attack analysis
exports.attackAnalysisSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all attack analysis records for the user
    const attackAnalysisRecords = await AttackAnalysis.find({ userId }).sort({
      attack_analysis_matching_percentage: -1,
    });

    if (!attackAnalysisRecords.length) {
      return res.status(404).json({
        message: "No attack analysis records found for this user.",
      });
    }

    // Process each record and suggest a video
    const response = attackAnalysisRecords.map((record) => {
      let suggestedVideo = "";
      let attackMatchingPercentage = record.attack_analysis_matching_percentage;

      // If attack_analysis_matching_percentage is missing, set "No value found"
      if (
        attackMatchingPercentage === undefined ||
        attackMatchingPercentage === null
      ) {
        attackMatchingPercentage = "No value found";
        suggestedVideo = "No suggested video";
      } else if (attackMatchingPercentage > 80) {
        suggestedVideo = "https://s3.com/high_skill_attack_video.mp4";
      } else if (attackMatchingPercentage >= 60) {
        suggestedVideo = "https://s3.com/intermediate_attack_video.mp4";
      } else {
        suggestedVideo = "https://s3.com/beginner_attack_video.mp4";
      }

      return {
        attack_analysis_matching_percentage: attackMatchingPercentage,
        suggestedVideo: suggestedVideo,
      };
    });

    res.status(200).json({ data: response });
  } catch (error) {
    console.error("Error fetching user attack analysis data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
