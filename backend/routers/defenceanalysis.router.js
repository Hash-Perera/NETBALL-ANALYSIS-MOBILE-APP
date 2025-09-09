const express = require("express");
const defenceanalysisController = require("../controllers/defenceanalysis.controller");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// Upload defence analysis videos
router.post("/upload", authenticateUser, defenceanalysisController.uploadDefenceAnalysisVideos);

// Get uploaded videos
router.get("/videos/:userId", defenceanalysisController.getDefenceAnalysisVideos);

// Get matching percentages
router.get("/matching/:userId", defenceanalysisController.getDefenceAnalysisMatchingPercentages);

// Analyze uploaded videos
router.post("/analyze/:id", authenticateUser, defenceanalysisController.analyzeDefenceAnalysis);

// Delete records
router.delete("/delete/:id", authenticateUser, defenceanalysisController.deleteDefenceAnalysis);

// Find top players in defence analysis
router.post("/top-players", authenticateUser, defenceanalysisController.getTopUsersByDefenceAnalysis);

// Get suggestions for defence analysis
router.get("/suggestions", authenticateUser,  defenceanalysisController.defenceAnalysisSuggestions);

module.exports = router;
