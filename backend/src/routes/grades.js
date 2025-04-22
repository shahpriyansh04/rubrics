const express = require("express");
const Grade = require("../models/grade.model");
const auth = require("../middleware/auth");
const router = express.Router();
const fs = require("fs-extra");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const docxConverter = require("docx-pdf");
const util = require("util");
const User = require("../models/user.model");
const Class = require("../models/class.model");

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

router.get("/downloadRubric/:studentId/:classId", auth, async (req, res) => {
  const { studentId, classId } = req.params;

  try {
    // Fetch student and class data
    const student = await User.findById(studentId).select("-password");
    const classData = await Class.findById(classId).populate(
      "teacher",
      "firstName lastName"
    );

    if (!student || !classData) {
      return res.status(404).json({ message: "Student or class not found" });
    }

    // Fetch all grades for this student in this class
    const grades = await Grade.find({
      class: classId,
      student: studentId,
    });

    // Create a matrix of grades
    const gradeMatrix = {};

    // Initialize all possible keys with empty spaces
    // Assuming we have 5 criteria and the number of columns from grades.length
    for (let criteriaIndex = 1; criteriaIndex <= 7; criteriaIndex++) {
      for (let columnIndex = 1; columnIndex <= 10; columnIndex++) {
        const key = `${criteriaIndex}${columnIndex}`;
        gradeMatrix[key] = " ";
        gradeMatrix[`t${columnIndex}`] = " ";
      }
    }

    // Now update with actual values
    grades.forEach((grade, columnIndex) => {
      grade.grades.forEach((g, criteriaIndex) => {
        const key = `${criteriaIndex + 1}${columnIndex + 1}`;
        if (g.marks !== undefined) {
          gradeMatrix[key] = g.marks;
        }
      });

      // Calculate total for this column
      const columnTotal = grade.grades.reduce((sum, g) => {
        return sum + (g.marks || 0);
      }, 0);

      // Add total for this column in format {t1}, {t2}, etc.
      const totalKey = `t${columnIndex + 1}`;
      gradeMatrix[totalKey] = columnTotal;
    });

    // Load the template
    const content = await fs.readFile(
      path.join(__dirname, "../../template.docx"),
      "binary"
    );

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Set the template variables
    try {
      doc.render({
        name: `${student.firstName} ${student.lastName}`,
        sapid: student.sapid,
        course: classData.name,
        course_code: classData.code,
        year: student.year,
        sem: student.sem,
        batch: student.batch,
        teacher_name: `${classData.teacher.firstName} ${classData.teacher.lastName}`,
        ...gradeMatrix, // This will now include {11}, {12}, etc. format and {t1}, {t2}, etc. for totals
      });
    } catch (error) {
      console.error("Template render error:", error);
      return res.status(500).send("Template render error");
    }

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Set headers for DOCX download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${student.firstName}_${student.sapid}_rubric.docx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating rubric file");
  }
});

async function getStudentDetails(studentId) {
  return {
    firstName: "Priyansh",
    lastName: "Shah",
    sapid: "60003220151",
    year: "S.Y",
    batch: "B1",
    sem: 3,
  };
}

async function getStudentGrades(studentId, classId) {
  return {
    knowledge: 5,
    describe: 4,
    demonstration: 5,
    interpret: 6,
    nonVerbal: 5,
    total: 25,
  };
}

module.exports = router;
