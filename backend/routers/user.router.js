const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authenticateUser = require("../middleware/authMiddleware");

// Register user
router.post("/register", userController.register);

// Login user
router.post("/login", userController.login);

// Get user details 
router.get("/", authenticateUser, userController.getUserDetails);

// Get all users
router.get("/all", userController.getUsers);

// Update user profile 
router.put("/update", authenticateUser, userController.updateProfile);

// Delete user profile 
router.delete("/delete", authenticateUser, userController.deleteProfile);

// Get all coaches 
router.get("/coaches", userController.getCoaches);

// Get registered players under a coach
router.get("/players", authenticateUser, userController.getPlayersUnderCoach);


module.exports = router;
