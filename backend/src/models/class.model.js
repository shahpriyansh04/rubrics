const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    courseCode: {
      type: String,
    },
    courseOutcomes: [
      {
        code: String,
        description: String,
        bloomsLevel: String,
      },
    ],
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rubrics: [
      {
        name: String,
        maxMarks: Number,
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],
    columns: [
      {
        name: String,
        type: {
          type: String,
          enum: ["Experiment", "Assignment", "Mini Project"],
        },
        courseOutcome: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
