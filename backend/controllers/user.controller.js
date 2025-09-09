const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register user
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, profileType, selectedCoach } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure only "Player" can select a coach
    if (profileType === "Coach" && selectedCoach) {
      return res
        .status(400)
        .json({ message: "Coaches cannot select another coach." });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      profileType,
      selectedCoach: profileType === "Player" ? selectedCoach || null : null,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, profileType: user.profileType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileType: user.profileType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get user details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT

    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user details", error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT
    const { fullName, email, password, profilePicture } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (password) updates.password = await bcrypt.hash(password, 10); // Hash new password

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      select: "-password", // Exclude password from response
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("selectedCoach", "fullName email");
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get all coaches
exports.getCoaches = async (req, res) => {
  try {
    const coaches = await User.find({ profileType: "Coach" }).select(
      "_id fullName"
    );
    res.status(200).json(coaches);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching coaches", error: error.message });
  }
};

// Get players under a coach
exports.getPlayersUnderCoach = async (req, res) => {
  try {
    const coachId = req.user.id; // Extracted from JWT

    // Verify if the logged-in user is a Coach
    const coach = await User.findById(coachId);
    if (!coach || coach.profileType !== "Coach") {
      return res
        .status(403)
        .json({ message: "Access denied. Only coaches can access this data." });
    }

    // Find all players who selected this coach
    const players = await User.find({ selectedCoach: coachId }).select(
      "_id fullName email profilePicture"
    );

    res.status(200).json(players);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching players", error: error.message });
  }
};
