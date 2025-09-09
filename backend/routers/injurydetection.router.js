const express = require("express");
const router = express.Router();
const injurydetectionController = require("../controllers/injurydetection.controller");
const authenticateUser = require("../middleware/authMiddleware");

// Route to upload image and detect injury
router.post("/upload", authenticateUser, injurydetectionController.uploadInjuryImage);

// Route to get all injury detection records for a user
router.get("/all", authenticateUser, injurydetectionController.getUserInjuryRecords);

// Get a single injury record by ID
router.get("/:id", authenticateUser, injurydetectionController.getSingleInjuryRecord);

// Delete an injury record by ID
router.delete("/:id", authenticateUser, injurydetectionController.deleteInjuryRecord);


module.exports = router;
