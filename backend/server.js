const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const userRoute = require("./routers/user.router");
const ballhandlingRoute = require("./routers/ballhandling.router");
const attackanalysisRoute = require("./routers/attackanalysis.router");
const defenceanalysisRoute = require("./routers/defenceanalysis.router");
const injurydetectionRoute = require("./routers/injurydetection.router");
const chatRoute = require("./routers/chat.router");

// App Config
const app = express();
const PORT = process.env.PORT || 6000;

// MongoDB Connection
const URI = process.env.MONGODB;

mongoose
  .connect(URI, { dbName: "mydatabase" })
  .then(() => console.log("✅ Database is connected"))
  .catch((err) => console.error("❌ Database connection error:", err));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/health", (req, res) => {
  res.status(200).json({ message: "API is healthy" });
});
app.use("/api/users", userRoute);
app.use("/api/ballhandling", ballhandlingRoute);
app.use("/api/attackanalysis", attackanalysisRoute);
app.use("/api/defenceanalysis", defenceanalysisRoute);
app.use("/api/injury", injurydetectionRoute);
app.use("/api/chat", chatRoute);

// Server startup
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
