const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/reaction_game";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Define MongoDB Schema
const ResultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  sex: { type: String, required: true },
  number: { type: Number, required: true }, // Change 'Number' to 'number'
  age: { type: Number, required: true },
  results: { type: [Number], required: true },
  wrongClickCount: { type: Number, default: 0 },
}, { timestamps: true });

const ResultModel = mongoose.model("Result", ResultSchema);

// Save game data (POST)
app.post("/save", async (req, res) => {
  try {
    console.log("🔵 Incoming Request:", req.method, req.url);
    console.log("📩 Received Data:", req.body);

    if (!req.body.name || !req.body.email || !req.body.age || !req.body.results) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newResult = new ResultModel(req.body);
    await newResult.save();
    
    console.log("✅ Data Saved Successfully:", newResult);
    res.json({ message: "Data saved successfully!" });
  } catch (error) {
    console.error("🚨 Error saving data:", error);
    res.status(500).json({ error: "Error saving data." });
  }
});

// Fetch leaderboard (GET)
app.get("/leaderboard", async (req, res) => {
  try {
    const players = await ResultModel.find({});
    const leaderboard = players.map((player) => {
      const bestPoints = Math.min(...player.results); // Lower reaction time is better
      const averagePoints = player.results.reduce((a, b) => a + b, 0) / player.results.length;
      return {
        name: player.name,
        bestPoints,
        averagePoints,
      };
    }).sort((a, b) => a.bestPoints - b.bestPoints) // Sort by best points
      .slice(0, 10); // Top 10 players

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Error fetching leaderboard." });
  }
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});