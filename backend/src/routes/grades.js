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

    // Debug logging to check columns and grades
    console.log("classData.columns:", classData.columns);
    console.log("grades:", grades);

    // Create the experiments array with their details
    const experiments = grades.map((grade, index) => {
      // Find the column to get its associated course outcome
      const column = classData.columns.find((col) => col.name === grade.column);
      console.log(`Mapping grade.column '${grade.column}' to column:`, column);
      const courseOutcomeCode = column?.courseOutcome || "";

      // Find the course outcome details if there's an association
      let courseOutcomeDetails = "";
      if (courseOutcomeCode && classData.courseOutcomes) {
        const outcome = classData.courseOutcomes.find(
          (co) => co.code === courseOutcomeCode
        );
        if (outcome) {
          courseOutcomeDetails = `${outcome.code} - ${outcome.description}`;
        } else {
          courseOutcomeDetails = courseOutcomeCode;
        }
      }

      // Calculate total for this experiment
      const total = grade.grades.reduce((sum, g) => sum + (g.marks || 0), 0);

      return {
        no: index + 1,
        co: courseOutcomeDetails,
        criteria: grade.grades.map((g, idx) => ({
          name: g.criterion,
          index: idx + 1,
          type: column?.type || "Experiment",
          maxscore: 25,
          score: g.marks || 0,
        })),
        total: total,
      };
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

    // Prepare the data for the template
    // Create separate arrays for each data column to avoid concatenation issues
    const experimentNumbers = experiments.map((exp) => exp.no);
    const experimentCOs = experiments.map((exp) => exp.co);
    const experimentTotals = experiments.map((exp) => exp.total);

    // Prepare scores in a format that matches the template structure
    const experimentScores = [];
    for (let i = 0; i < experiments[0].criteria.length; i++) {
      const rowScores = [];
      for (let j = 0; j < experiments.length; j++) {
        rowScores.push(experiments[j].criteria[i].score);
      }
      experimentScores.push(rowScores);
    }

    // Set the template variables
    try {
      doc.render({
        name: `${student.firstName} ${student.lastName}`,
        sapid: student.sapid,
        course: classData.name,
        course_code: classData.courseCode,
        year: student.year,
        sem: student.sem,
        batch: student.batch,
        teacher_name: `${classData.teacher.firstName} ${classData.teacher.lastName}`,
        courses: classData.courseOutcomes.map((co) => ({
          code: co.code,
          outcome: co.description,
          level: co.bloomsLevel,
        })),
        // Pass individual arrays for each column in the table
        e: experimentNumbers, // This will render as separate numbers
        co: experimentCOs,
        // Format scores to match template structure
        scores: experimentScores,
        criteria: experiments[0].criteria,
        total: experimentTotals,
      });
      console.log("Experiment Numbers:", experimentNumbers);
      console.log("Criteria:", experiments[0].criteria);
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

module.exports = router;
