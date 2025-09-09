const InjuryDetection = require("../models/injurydetection.model");
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

// Configure Multer for image uploads
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
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
}).single("injury_image");

// Function to upload file to S3
const uploadToS3 = async (file, userId) => {
  const fileStream = fs.createReadStream(file.path);
  const params = {
    Bucket: "rp-projects-public",
    Key: `injury_images/${userId}/${Date.now()}-${path.basename(file.path)}`,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    fs.unlinkSync(file.path); // Delete local file after upload
    return data.Location;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};

// Upload image & detect injury
exports.uploadInjuryImage = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const s3Link = await uploadToS3(req.file, userId);

      // Call Injury Detection API
      const apiResponse = await axios.post(
        `${process.env.FLASH_BACKEND}/netball-project/injury-detection`,
        { s3_link: s3Link }
      );

      const { class: injuryClass, probability } = apiResponse.data;

      // Save to DB
      const injuryData = new InjuryDetection({
        userId,
        s3_link: s3Link,
        injury_class: injuryClass,
        probability: probability,
      });

      await injuryData.save();

      res.status(201).json({
        message: "Injury image uploaded and analyzed successfully",
        injuryData,
      });
    });
  } catch (error) {
    console.error("Error processing injury detection:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get All Injury Detection Records for a User
exports.getUserInjuryRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await InjuryDetection.find({ userId }).sort({
      uploadedAt: -1,
    });

    res.status(200).json({ records });
  } catch (error) {
    console.error("Error fetching injury records:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a single injury record by ID
exports.getSingleInjuryRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get logged-in user ID

    const injuryRecord = await InjuryDetection.findOne({ _id: id, userId });

    if (!injuryRecord) {
      return res.status(404).json({ message: "Injury record not found" });
    }

    res.status(200).json({ injuryRecord });
  } catch (error) {
    console.error("Error fetching injury record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete an injury record by ID
exports.deleteInjuryRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const injuryRecord = await InjuryDetection.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!injuryRecord) {
      return res.status(404).json({
        message: "Injury record not found or not authorized to delete",
      });
    }

    res.status(200).json({ message: "Injury record deleted successfully" });
  } catch (error) {
    console.error("Error deleting injury record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
