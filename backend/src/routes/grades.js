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

router.get("/downloadRubric/:studentId/:classId", async (req, res) => {
  const { studentId, classId } = req.params;

  try {
    // Fetch student and grade data
    const student = await getStudentDetails(studentId);
    const grades = await getStudentGrades(studentId, classId);

    // Load the template
    const content = await fs.readFile(
      path.join(__dirname, "../../1.docx"),
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
        // year: student.year,
        // sem: student.sem,
        // batch: student.batch,
        // knowledge: grades.knowledge,
        // describe: grades.describe,
        // demonstration: grades.demonstration,
        // interpret: grades.interpret,
        // nonVerbal: grades.nonVerbal,
        // total: grades.total,
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
    const convertDocxToPdf = util.promisify(
      (inputPath, outputPath, callback) => {
        docxConverter(inputPath, outputPath, callback);
      }
    );
    // fs.writeFileSync("output.docx", buffer);
    const docxPath = path.join(__dirname, "output1.docx");
    const pdfPath = path.join(__dirname, "output.pdf");

    await fs.writeFile(docxPath, buffer);

    // Now that the file is fully written, convert it to PDF
    await convertDocxToPdf(docxPath, pdfPath);
    const pdfBuffer = await fs.readFile(pdfPath);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${student.firstName}_${student.sapId}_rubric.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
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
