const mongoose = require("mongoose");
const ResultModel = require("./models/Result"); // Import your model

// Function to get top 10 leaderboard
const getLeaderboard = async (email) => {
  try {
    // Step 1: Fetch top 10 players with bestPoints > 0.150
    const top10 = await ResultModel.find({ bestPoints: { $gt: 0.150 } })
      .sort({ bestPoints: 1 })  // Sort by bestPoints ascending (lowest = best)
      .limit(10)                 // Get only top 10
      .select("name email bestPoints averagePoints -_id"); // Select only required fields

    let userRank = null;
    let isUserInTop10 = false;

    // Step 2: Check if user is in top 10, if email is provided
    if (email) {
      const user = await ResultModel.findOne({ email }).select("name email bestPoints averagePoints -_id");

      if (user) {
        const rankIndex = await ResultModel.countDocuments({ bestPoints: { $lt: user.bestPoints } });
        userRank = { rank: rankIndex + 1, ...user.toObject() };
        isUserInTop10 = rankIndex < 10;
      }
    }

    // Step 3: If user is not in top 10, add separately
    let finalLeaderboard = [...top10];

    if (userRank && !isUserInTop10) {
      finalLeaderboard.push(userRank);
    }

    return { leaderboard: finalLeaderboard, userRank };
  } catch (error) {
    console.error("🚨 Error fetching leaderboard:", error);
    return { error: "Error fetching leaderboard." };
  }
};

module.exports = { getLeaderboard };
