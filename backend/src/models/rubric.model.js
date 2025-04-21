const mongoose = require("mongoose");

const rubricLevelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  score: { type: Number, required: true },
});

const rubricCriteriaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  levels: [rubricLevelSchema],
});

const rubricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  criteria: [rubricCriteriaSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Rubric", rubricSchema);
