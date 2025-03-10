const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;


// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("🚨 MongoDB Connection Error:", err.message);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Define MongoDB Schema
const ResultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  sex: { type: String, required: true },
  number: { type: Number, required: true },
  age: { type: Number, required: true },
  results: { 
    type: [{
      attempt: { type: Number, required: true },
      result: { type: String, required: true }
    }], 
    required: true 
  },
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

    // Calculate bestPoints and averagePoints
    const reactionTimes = req.body.results
      .filter(result => result.result.startsWith("✅")) // Filter valid results
      .map(result => parseFloat(result.result.replace("✅ ", "").replace(" sec", "")));

    const bestPoints = reactionTimes.length > 0 ? Math.min(...reactionTimes) : null;
    const averagePoints = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : null;

    // Add calculated fields to the request body
    const newResult = new ResultModel({
      ...req.body,
      bestPoints,
      averagePoints,
    });

    await newResult.save();

    console.log("✅ Data Saved Successfully:", newResult);
    res.json({ message: "Data saved successfully!", userRank: 1 }); // Add userRank for testing
  } catch (error) {
    console.error("🚨 Error saving data:", error.message);
    res.status(500).json({ error: "Error saving data.", details: error.message });
  }
});

// Fetch leaderboard (GET)
app.get("/leaderboard", async (req, res) => {
  try {
    const players = await ResultModel.find({});

    const leaderboardMap = new Map();

    players.forEach((player) => {
      const reactionTimes = player.results
        .filter(result => result.result.startsWith("✅")) // Filter valid results
        .map(result => parseFloat(result.result.replace("✅ ", "").replace(" sec", "")));

      const bestPoints = reactionTimes.length > 0 ? Math.min(...reactionTimes) : null;
      const averagePoints = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : null;

      if (!leaderboardMap.has(player.email)) {
        leaderboardMap.set(player.email, {
          name: player.name,
          email: player.email,
          bestPoints,
          averagePoints
        });
      } else {
        const existing = leaderboardMap.get(player.email);
        if (bestPoints < existing.bestPoints) {
          leaderboardMap.set(player.email, {
            name: player.name,
            email: player.email,
            bestPoints,
            averagePoints
          });
        }
      }
    });

    // Convert to array and sort by bestPoints (lower is better)
    const sortedLeaderboard = Array.from(leaderboardMap.values())
      .sort((a, b) => a.bestPoints - b.bestPoints);

    // Top 10 players
    const top10 = sortedLeaderboard.slice(0, 10);

    // Current user rank (if provided in query)
    const { email } = req.query;
    let userRank = null;
    let isUserInTop10 = false;

    if (email) {
      const rankIndex = sortedLeaderboard.findIndex(player => player.email === email);
      if (rankIndex !== -1) {
        userRank = { rank: rankIndex + 1, ...sortedLeaderboard[rankIndex] };
        isUserInTop10 = rankIndex < 10; // Check if user is in top 10
      }
    }

    // Final leaderboard output
    let finalLeaderboard = [...top10];

    // If user is outside top 10, include their rank separately
    if (userRank && !isUserInTop10) {
      finalLeaderboard.push(userRank);
    }

    res.json({ leaderboard: finalLeaderboard, userRank });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Error fetching leaderboard." });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

//comment
//CLIENT_URL=https://www.vevekseetharaman.com
//