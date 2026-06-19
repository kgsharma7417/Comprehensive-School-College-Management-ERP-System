import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key_12345";

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        user: {
          uid: user._id,
          email: user.email,
          displayName: user.name,
          role: user.role,
          studentId: user.studentId,
          class: user.class,
          section: user.section,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Register (General/Public signup)
router.post("/register", async (req, res) => {
  const { name, email, password, role, studentId, class: className, section } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "parent",
      studentId,
      class: className,
      section,
    });

    res.status(201).json({
      user: {
        uid: user._id,
        email: user.email,
        displayName: user.name,
        role: user.role,
        studentId: user.studentId,
        class: user.class,
        section: user.section,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Admin Create User (Secondary creation)
router.post("/admin-create-user", async (req, res) => {
  const { name, email, password, role, studentId, class: className, section } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId,
      class: className,
      section,
    });

    res.status(201).json({
      user: {
        uid: user._id,
        email: user.email,
        displayName: user.name,
        role: user.role,
        studentId: user.studentId,
        class: user.class,
        section: user.section,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get current profile
router.get("/me", protect, async (req, res) => {
  res.json({
    uid: req.user._id,
    email: req.user.email,
    displayName: req.user.name,
    role: req.user.role,
    studentId: req.user.studentId,
    class: req.user.class,
    section: req.user.section,
  });
});

export default router;
