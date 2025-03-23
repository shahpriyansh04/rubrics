const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user.model");
const { auth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("sapid").trim().notEmpty(),
    body("role").isIn(["student", "teacher", "admin"]),
    body("rollno").if(body("role").equals("student")).trim().notEmpty(),
    body("class").if(body("role").equals("student")).trim().notEmpty(),
    body("batch").if(body("role").equals("student")).trim().notEmpty(),
    body("sem").if(body("role").equals("student")).trim().notEmpty(),
    body("year").if(body("role").equals("student")).trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        role,
        sapid,
        rollno,
        batch,
        year,
        sem,
        class: className,
      } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = new User({
        email,
        password,
        firstName,
        lastName,
        year,
        role,
        sapid,
        rollno,
        class: className,
        batch,
        sem,
      });

      await user.save();

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          sapid: user.sapid,
          rollno: user.rollno,
          year: user.year,
          class: user.class,
          batch: user.batch,
          sem: user.sem,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
);

router.post(
  "/login",
  [
    body("identifier").notEmpty().withMessage("Email or SAP ID is required"),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { identifier, password, role } = req.body;

      const user = await User.findOne({
        $or: [{ email: identifier }, { sapid: identifier }],
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (role && user.role !== role) {
        return res.status(401).json({ message: "Invalid role for this user" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          sapid: user.sapid,
          rollno: user.rollno,
          class: user.class,
          batch: user.batch,
          sem: user.sem,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.json({
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          sapid: user.sapid,
          rollno: user.rollno,
          class: user.class,
          batch: user.batch,
          sem: user.sem,
          token: token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error logging in" });
    }
  }
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data" });
  }
});

module.exports = router;
