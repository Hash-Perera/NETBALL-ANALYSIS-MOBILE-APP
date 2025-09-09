const express = require("express");
const attackanalysisController = require("../controllers/attackanalysis.controller");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// Upload attack analysis videos
router.post("/upload", authenticateUser, attackanalysisController.uploadAttackAnalysisVideos);

// Get uploaded videos
router.get("/videos/:userId", attackanalysisController.getAttackAnalysisVideos);

// Get matching percentages
router.get("/matching/:userId", attackanalysisController.getAttackAnalysisMatchingPercentages);

// Analyze uploaded videos
router.post("/analyze/:id", authenticateUser, attackanalysisController.analyzeAttackAnalysis);

// Delete records
router.delete("/delete/:id", authenticateUser, attackanalysisController.deleteAttackAnalysis);

// Find top players in attack analysis
router.post("/top-players", authenticateUser, attackanalysisController.getTopUsersByAttackAnalysis);

// Get suggestions for attack analysis
router.get("/suggestions", authenticateUser,  attackanalysisController.attackAnalysisSuggestions);
  

module.exports = router;
