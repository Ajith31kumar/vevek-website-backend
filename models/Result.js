// models/Result.js
const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  email: { type: String, required: true },
  age: { type: Number, default: null },
  results: {
    type: [{
      attempt: { type: Number, required: true },
      result: { type: String, required: true }
    }],
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model("Result", ResultSchema);