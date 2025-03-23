const express = require("express");
const Grade = require("../models/grade.model");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/:classId/:studentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can add grades" });
    }

    const { column, grades } = req.body;

    let gradeDoc = await Grade.findOne({
      class: req.params.classId,
      student: req.params.studentId,
      column,
    });

    if (gradeDoc) {
      if (gradeDoc.submittedAt) {
        return res
          .status(400)
          .json({ message: "Grades have already been submitted" });
      }
      gradeDoc.grades = grades;
    } else {
      gradeDoc = new Grade({
        class: req.params.classId,
        student: req.params.studentId,
        column,
        grades,
      });
    }

    await gradeDoc.save();
    res.json(gradeDoc);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:classId/:studentId/submit", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can submit grades" });
    }

    const { column } = req.body;

    const gradeDoc = await Grade.findOne({
      class: req.params.classId,
      student: req.params.studentId,
      column,
    });

    if (!gradeDoc) {
      return res.status(404).json({ message: "Grades not found" });
    }

    if (gradeDoc.submittedAt) {
      return res
        .status(400)
        .json({ message: "Grades have already been submitted" });
    }

    gradeDoc.submittedAt = new Date();
    gradeDoc.submittedBy = req.user._id;
    await gradeDoc.save();

    res.json(gradeDoc);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:classId/:studentId", auth, async (req, res) => {
  try {
    const grades = await Grade.find({
      class: req.params.classId,
      student: req.params.studentId,
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
