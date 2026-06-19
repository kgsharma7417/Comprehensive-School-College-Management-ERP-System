import express from "express";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import Notice from "../models/Notice.js";
import LeaveRequest from "../models/LeaveRequest.js";
import FeePayment from "../models/FeePayment.js";
import Attendance from "../models/Attendance.js";
import Homework from "../models/Homework.js";
import Resource from "../models/Resource.js";
import SalarySlip from "../models/SalarySlip.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Helper to normalize Mongoose document (adds `id` field from `_id`)
const normalize = (doc) => {
  if (!doc) return doc;
  if (Array.isArray(doc)) {
    return doc.map((d) => normalize(d));
  }
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id ? obj._id.toString() : obj.id;
  return obj;
};

// ----------------------------------------------------
// USERS ROUTING (for Profile compatibility)
// ----------------------------------------------------
router.get("/users/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(normalize(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/users/:id", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    res.json(normalize(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ----------------------------------------------------
// STUDENTS ROUTING
// ----------------------------------------------------
router.get("/students", protect, async (req, res) => {
  try {
    const { class: cls, section, email } = req.query;
    const filter = {};
    if (cls) filter.class = cls;
    if (section) filter.section = section;
    if (email) filter.email = email;

    const list = await Student.find(filter);
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/students/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(normalize(student));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/students", protect, async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(normalize(student));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/students/:id", protect, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(normalize(student));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// TEACHERS ROUTING
// ----------------------------------------------------
router.get("/teachers", protect, async (req, res) => {
  try {
    const { email, id } = req.query;
    const filter = {};
    if (email) filter.email = email;
    if (id) filter._id = id;

    const list = await Teacher.find(filter);
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/teachers/:id", protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(normalize(teacher));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/teachers", protect, async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json(normalize(teacher));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/teachers/:id", protect, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(normalize(teacher));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// NOTICES ROUTING
// ----------------------------------------------------
router.get("/notices", protect, async (req, res) => {
  try {
    const list = await Notice.find().sort({ date: -1 });
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/notices", protect, async (req, res) => {
  try {
    const notice = await Notice.create(req.body);
    res.status(201).json(normalize(notice));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// LEAVE REQUESTS ROUTING
// ----------------------------------------------------
router.get("/leaveRequests", protect, async (req, res) => {
  try {
    const { teacherId } = req.query;
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;

    const list = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/leaveRequests", protect, async (req, res) => {
  try {
    const request = await LeaveRequest.create(req.body);
    res.status(201).json(normalize(request));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/leaveRequests/:id", protect, async (req, res) => {
  try {
    const request = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(normalize(request));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// FEE PAYMENT REQUESTS ROUTING
// ----------------------------------------------------
router.get("/feePaymentRequests", protect, async (req, res) => {
  try {
    const { studentId } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;

    const list = await FeePayment.find(filter).sort({ createdAt: -1 });
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/feePaymentRequests", protect, async (req, res) => {
  try {
    const request = await FeePayment.create(req.body);
    res.status(201).json(normalize(request));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/feePaymentRequests/:id", protect, async (req, res) => {
  try {
    const request = await FeePayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(normalize(request));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// SALARY SLIPS ROUTING
// ----------------------------------------------------
router.get("/salarySlips", protect, async (req, res) => {
  try {
    const { teacherId } = req.query;
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;

    const list = await SalarySlip.find(filter).sort({ createdAt: -1 });
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/salarySlips", protect, async (req, res) => {
  try {
    const slip = await SalarySlip.create(req.body);
    res.status(201).json(normalize(slip));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// HOMEWORK & RESOURCES
// ----------------------------------------------------
router.get("/homework", protect, async (req, res) => {
  try {
    const { class: cls } = req.query;
    const filter = {};
    if (cls) filter.class = cls;

    const list = await Homework.find(filter).sort({ createdAt: -1 });
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/homework", protect, async (req, res) => {
  try {
    const item = await Homework.create(req.body);
    res.status(201).json(normalize(item));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/resources", protect, async (req, res) => {
  try {
    const list = await Resource.find().sort({ createdAt: -1 });
    res.json(normalize(list));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/resources", protect, async (req, res) => {
  try {
    const item = await Resource.create(req.body);
    res.status(201).json(normalize(item));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ----------------------------------------------------
// ATTENDANCE ROUTING
// ----------------------------------------------------
router.get("/attendance/:docId", protect, async (req, res) => {
  try {
    const log = await Attendance.findOne({ docId: req.params.docId });
    res.json(normalize(log));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/attendance/:docId", protect, async (req, res) => {
  try {
    const { docId } = req.params;
    let log = await Attendance.findOne({ docId });
    if (log) {
      log = await Attendance.findOneAndUpdate({ docId }, req.body, { new: true });
    } else {
      log = await Attendance.create({ docId, ...req.body });
    }
    res.json(normalize(log));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
