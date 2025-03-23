const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  sapid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  rollno: {
    type: String,
    required: function () {
      return this.role === "student";
    },
    trim: true,
  },
  year: {
    type: String,
    required: function () {
      return this.role === "student";
    },
  },
  class: {
    type: String,
    required: function () {
      return this.role === "student";
    },
    trim: true,
  },
  batch: {
    type: String,
    required: function () {
      return this.role === "student";
    },
    trim: true,
  },
  sem: {
    type: Number,
    required: function () {
      return this.role === "student";
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
