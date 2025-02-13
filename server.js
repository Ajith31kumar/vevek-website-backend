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
  age: { type: Number, required: true },
  results: { type: [Number], required: true },
  wrongClickCount: { type: Number, default: 0 },
}, { timestamps: true });

const ResultModel = mongoose.model("Result", ResultSchema);

// Save game data (POST)
app.post("/save", async (req, res) => {
  try {
    console.log("Received Data:", req.body); // Debugging Log
    const newResult = new ResultModel(req.body);
    await newResult.save();
    res.json({ message: "Data saved successfully!" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Error saving data." });
  }
});

// Fetch all game results (GET)
app.get("/getResults", async (req, res) => {
  try {
    const results = await ResultModel.find().sort({ createdAt: -1 }); // Sort by latest
    console.log("Fetched Results:", results); // Debugging Log
    res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ error: "Error fetching results." });
  }
});

// Fetch a single user's result by email (GET)
app.get("/getResult/:email", async (req, res) => {
  try {
    const userResult = await ResultModel.findOne({ email: req.params.email });
    if (!userResult) {
      return res.status(404).json({ error: "No results found for this email." });
    }
    res.json(userResult);
  } catch (error) {
    console.error("Error fetching user result:", error);
    res.status(500).json({ error: "Error fetching user result." });
  }
});

// Delete all results (DELETE) - Be careful using this in production!
app.delete("/deleteAll", async (req, res) => {
  try {
    await ResultModel.deleteMany({});
    res.json({ message: "All results deleted successfully." });
  } catch (error) {
    console.error("Error deleting results:", error);
    res.status(500).json({ error: "Error deleting results." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
