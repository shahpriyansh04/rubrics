const express = require("express");
const { auth, checkRole } = require("../middleware/auth.middleware");
const Class = require("../models/class.model");
const User = require("../models/user.model");
const defaultCriteria = require("../constants/criteria");
const Grade = require("../models/grade.model");

const router = express.Router();

const generateUniqueCode = async () => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const existingClass = await Class.findOne({ code });
  if (existingClass) {
    return generateUniqueCode(); // Recursively try again if code exists
  }
  return code;
};

router.post("/", auth, checkRole("teacher"), async (req, res) => {
  try {
    const { name, description, columns } = req.body;
    const code = await generateUniqueCode();

    const defaultColumns = [
      { name: "Experiment 1", type: "Experiment" },
      { name: "Experiment 2", type: "Experiment" },
      { name: "Experiment 3", type: "Experiment" },
      { name: "Experiment 4", type: "Experiment" },
      { name: "Experiment 5", type: "Experiment" },
      { name: "Experiment 6", type: "Experiment" },
      { name: "Experiment 7", type: "Experiment" },
      { name: "Experiment 8", type: "Experiment" },
    ];

    const newClass = new Class({
      name,
      description,
      code,
      teacher: req.user._id,
      students: [],
      rubrics: defaultCriteria,
      columns: columns || defaultColumns,
    });

    await newClass.save();

    res.status(201).json({
      ...newClass.toObject(),
      joinCode: code,
      message: `Class created successfully. Share this code with your students: ${code}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating class" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    let classes;
    if (req.user.role === "teacher") {
      classes = await Class.find({ teacher: req.user._id })
        .populate("students", "firstName lastName email")
        .populate("teacher", "firstName lastName email");
    } else if (req.user.role === "student") {
      classes = await Class.find({ students: req.user._id })
        .populate("students", "firstName lastName email")
        .populate("teacher", "firstName lastName email");
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("students", "-password")
      .populate("teacher", "-password");

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (
      req.user.role === "teacher" &&
      classData.teacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role === "student" &&
      !classData.students.some(
        (student) => student._id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching class" });
  }
});

router.post("/join", auth, checkRole("student"), async (req, res) => {
  try {
    const { code } = req.body;
    const classToJoin = await Class.findOne({ code });

    if (!classToJoin) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classToJoin.students.includes(req.user._id)) {
      return res.status(400).json({ message: "Already joined this class" });
    }

    classToJoin.students.push(req.user._id);
    await classToJoin.save();

    res.json({ message: "Successfully joined the class" });
  } catch (error) {
    res.status(500).json({ message: "Error joining class" });
  }
});

router.post("/:id/students", auth, checkRole("teacher"), async (req, res) => {
  try {
    const { studentId } = req.body;
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(400).json({ message: "Invalid student" });
    }

    if (classData.students.includes(studentId)) {
      return res.status(400).json({ message: "Student already in class" });
    }

    classData.students.push(studentId);
    await classData.save();

    const populatedClass = await Class.findById(req.params.id)
      .populate("students", "-password")
      .populate("teacher", "-password");

    res.json(populatedClass);
  } catch (error) {
    res.status(500).json({ message: "Error adding student to class" });
  }
});

router.delete(
  "/:id/students/:studentId",
  auth,
  checkRole("teacher"),
  async (req, res) => {
    try {
      const classData = await Class.findById(req.params.id);

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (classData.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      classData.students = classData.students.filter(
        (studentId) => studentId.toString() !== req.params.studentId
      );

      await Grade.deleteMany({
        class: req.params.id,
        student: req.params.studentId,
      });

      await classData.save();
      res.json(classData);
    } catch (error) {
      res.status(500).json({ message: "Error removing student from class" });
    }
  }
);

router.put("/:id/rubrics", auth, checkRole("teacher"), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const totalMarks = req.body.rubrics.reduce(
      (sum, rubric) => sum + (rubric.enabled ? rubric.maxMarks : 0),
      0
    );
    if (totalMarks !== 25) {
      return res.status(400).json({ message: "Total marks must equal 25" });
    }

    classData.rubrics = req.body.rubrics;
    await classData.save();

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: "Error updating class rubrics" });
  }
});

router.put("/:id/columns", auth, checkRole("teacher"), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const validTypes = ["Experiment", "Assignment", "Mini Project"];
    const invalidColumns = req.body.columns.filter(
      (col) => !validTypes.includes(col.type)
    );
    if (invalidColumns.length > 0) {
      return res.status(400).json({ message: "Invalid column type" });
    }

    classData.columns = req.body.columns;
    await classData.save();

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: "Error updating class columns" });
  }
});

module.exports = router;
