const DefenceAnalysis = require("../models/defenceanalysis.model");
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
  { name: "defence_analysis_correct", maxCount: 1 },
  { name: "defence_analysis_wrong", maxCount: 1 },
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

// Upload defence analysis videos
exports.uploadDefenceAnalysisVideos = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "File Upload Failed.", error: err });
    }

    if (
      !req.files ||
      !req.files["defence_analysis_correct"] ||
      !req.files["defence_analysis_wrong"]
    ) {
      return res.status(400).json({ message: "Both videos are required." });
    }

    try {
      const userId = req.user.id;

      // Upload both videos to S3
      const correctVideoUrl = await uploadToS3(
        req.files["defence_analysis_correct"][0],
        userId
      );
      const wrongVideoUrl = await uploadToS3(
        req.files["defence_analysis_wrong"][0],
        userId
      );

      // Save video URLs in the database
      const defenceAnalysis = new DefenceAnalysis({
        userId,
        defence_analysis_correct_s3_link: correctVideoUrl,
        defence_analysis_wrong_s3_link: wrongVideoUrl,
      });

      await defenceAnalysis.save();

      res.status(201).json({
        message: "Videos uploaded successfully",
        data: {
          _id: defenceAnalysis._id,
          userId: defenceAnalysis.userId,
          defence_analysis_correct_s3_link:
            defenceAnalysis.defence_analysis_correct_s3_link,
          defence_analysis_wrong_s3_link:
            defenceAnalysis.defence_analysis_wrong_s3_link,
          defence_analysis_analyzed_video_s3_link:
            defenceAnalysis.analyzed_video_s3_link,
          defence_analysis_graph_s3_link: defenceAnalysis.graph_s3_link,
          defence_analysis_matching_percentage:
            defenceAnalysis.matching_percentage,
          defence_analysis_videoUploadTime: defenceAnalysis.videoUploadTime,
          createdAt: defenceAnalysis.createdAt,
          updatedAt: defenceAnalysis.updatedAt,
        },
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
};

// Analyze defence analysis Videos
exports.analyzeDefenceAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const defenceAnalysis = await DefenceAnalysis.findById(id);
    if (!defenceAnalysis) {
      return res
        .status(404)
        .json({ message: "Defence analysis record not found" });
    }

    // Check if the video has already been analyzed
    if (defenceAnalysis.defence_analysis_analyzed_video_s3_link) {
      return res.status(400).json({
        message: "Analysis has already been performed for this record.",
        defence_analysis_analyzed_video_s3_link:
          defenceAnalysis.defence_analysis_analyzed_video_s3_link,
      });
    }

    // Prepare request payload
    const requestBody = {
      correct_s3_link: defenceAnalysis.defence_analysis_correct_s3_link,
      wrong_s3_link: defenceAnalysis.defence_analysis_wrong_s3_link,
    };

    // Send POST request to external API
    const response = await axios.post(
      `${process.env.FLASH_BACKEND}/netball-project/defence_analysis`,
      requestBody
    );

    // Extract analyzed video link and similarity data from response
    const { file_url, similarity } = response.data.defence_analysis_result;

    // Update the defence analysis record with analyzed video link and similarity values
    defenceAnalysis.defence_analysis_analyzed_video_s3_link = file_url;
    defenceAnalysis.defence_analysis_matching_percentage = {
      left_knee: similarity.left_knee,
      right_knee: similarity.right_knee,
      hip_stance: similarity.hip_stance,
      stance_width: similarity.stance_width,
      overall: similarity.overall,
    };

    await defenceAnalysis.save();

    // Return success response
    res.status(200).json({
      message: "Defence analysis completed successfully",
      defence_analysis_analyzed_video_s3_link: file_url,
      defence_analysis_matching_percentage: similarity,
    });
  } catch (error) {
    console.error("Error Defence analysis handling videos:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get All User Uploaded defence analysis videos
exports.getDefenceAnalysisVideos = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Fetch all videos for the given userId
    const videos = await DefenceAnalysis.find({ userId });

    if (videos.length === 0) {
      return res
        .status(404)
        .json({ message: "No videos found for this user." });
    }

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching defence analysis videos:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get defence analysis matching percentages
exports.getDefenceAnalysisMatchingPercentages = async (req, res) => {
  try {
    // Extract userId from the authenticated request
    const { userId } = req.params;

    // Fetch the defence analysis data for the user, selecting only the required fields
    const analyses = await DefenceAnalysis.find(
      { userId },
      { defence_analysis_matching_percentage: 1, createdAt: 1, _id: 0 }
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

// Delete defence analysis record
exports.deleteDefenceAnalysis = async (req, res) => {
  try {
    const defenceAnalysisId = req.params.id;
    const userId = req.user.id;

    // Find the defence analysis record
    const defenceAnalysis = await DefenceAnalysis.findOne({
      _id: defenceAnalysisId,
      userId,
    });

    if (!defenceAnalysis) {
      return res.status(404).json({
        message: "Record not found or unauthorized to delete.",
      });
    }

    // Delete the record from the database
    await DefenceAnalysis.findByIdAndDelete(defenceAnalysisId);

    res.status(200).json({
      message: "Defence analysis record deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting defence analysis record:", error);
    res.status(500).json({
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

// Get top payers for each coach based on defence analysis
exports.getTopUsersByDefenceAnalysis = async (req, res) => {
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

    const topDefenceAnalysisRecords = await DefenceAnalysis.aggregate([
      { $match: { userId: { $in: playerIds } } },
      { $sort: { defence_analysis_matching_percentage: -1 } },
      {
        $group: {
          _id: "$userId",
          topRecord: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$topRecord" } },
      { $sort: { defence_analysis_matching_percentage: -1 } },
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
          defenceAnalysisData: {
            defence_analysis_matching_percentage:
              "$defence_analysis_matching_percentage",
            defence_analysis_videoUploadTime:
              "$defence_analysis_videoUploadTime",
          },
        },
      },
    ]);

    res.status(200).json({ topUsers: topDefenceAnalysisRecords });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Suggest a video based on defence analysis
exports.defenceAnalysisSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all defence analysis records for the user
    const defenceAnalysisRecords = await DefenceAnalysis.find({ userId }).sort({
      defence_analysis_matching_percentage: -1,
    });

    if (!defenceAnalysisRecords.length) {
      return res.status(404).json({
        message: "No defence analysis records found for this user.",
      });
    }

    // Process each record and suggest a video
    const response = defenceAnalysisRecords.map((record) => {
      let suggestedVideo = "";
      let defenceMatchingPercentage =
        record.defence_analysis_matching_percentage;

      // If defence_analysis_matching_percentage is missing, set "No value found"
      if (
        defenceMatchingPercentage === undefined ||
        defenceMatchingPercentage === null
      ) {
        defenceMatchingPercentage = "No value found";
        suggestedVideo = "No suggested video";
      } else if (defenceMatchingPercentage > 80) {
        suggestedVideo = "https://s3.com/high_skill_attack_video.mp4";
      } else if (defenceMatchingPercentage >= 60) {
        suggestedVideo = "https://s3.com/intermediate_attack_video.mp4";
      } else {
        suggestedVideo = "https://s3.com/beginner_attack_video.mp4";
      }

      return {
        defence_analysis_matching_percentage: defenceMatchingPercentage,
        suggestedVideo: suggestedVideo,
      };
    });

    res.status(200).json({ data: response });
  } catch (error) {
    console.error("Error fetching user defence analysis data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
