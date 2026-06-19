import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Student from "./models/Student.js";
import Teacher from "./models/Teacher.js";
import Notice from "./models/Notice.js";
import LeaveRequest from "./models/LeaveRequest.js";
import FeePayment from "./models/FeePayment.js";
import Homework from "./models/Homework.js";
import Resource from "./models/Resource.js";
import SalarySlip from "./models/SalarySlip.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/school-erp";

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Notice.deleteMany({});
    await LeaveRequest.deleteMany({});
    await FeePayment.deleteMany({});
    await Homework.deleteMany({});
    await Resource.deleteMany({});
    await SalarySlip.deleteMany({});
    console.log("Cleared all existing database collections.");

    // Seed Students
    const student1 = await Student.create({
      name: "Emily Miller",
      email: "emily@school.com",
      class: "Class 10",
      section: "A",
      rollNo: "101",
      fees: {
        total: 50000,
        paid: 35000,
        balance: 15000,
        dueDate: "2026-06-30",
        breakdown: {
          monthlyTuition: 3000,
          yearlyTerm: 10000,
          extraCharges: 4000,
        },
      },
      attendanceHistory: [
        { date: "2026-06-16", status: "Present" },
        { date: "2026-06-15", status: "Present" },
        { date: "2026-06-12", status: "Present" },
        { date: "2026-06-11", status: "Absent" },
        { date: "2026-06-10", status: "Present" },
        { date: "2026-06-09", status: "Present" },
        { date: "2026-06-08", status: "Present" },
        { date: "2026-06-05", status: "Present" },
      ],
      overallAttendance: 88,
      marks: [
        {
          subject: "Mathematics",
          exam: "Mid-Term",
          marksObtained: 88,
          maxMarks: 100,
        },
        {
          subject: "Science",
          exam: "Mid-Term",
          marksObtained: 92,
          maxMarks: 100,
        },
        {
          subject: "English",
          exam: "Mid-Term",
          marksObtained: 85,
          maxMarks: 100,
        },
      ],
    });

    const student2 = await Student.create({
      name: "James Wilson",
      email: "james@school.com",
      class: "Class 10",
      section: "A",
      rollNo: "102",
      fees: {
        total: 50000,
        paid: 50000,
        balance: 0,
        dueDate: "2026-06-30",
        breakdown: {
          monthlyTuition: 3000,
          yearlyTerm: 10000,
          extraCharges: 4000,
        },
      },
      attendanceHistory: [
        { date: "2026-06-16", status: "Present" },
        { date: "2026-06-15", status: "Present" },
      ],
      overallAttendance: 100,
      marks: [
        {
          subject: "Mathematics",
          exam: "Mid-Term",
          marksObtained: 72,
          maxMarks: 100,
        },
        {
          subject: "Science",
          exam: "Mid-Term",
          marksObtained: 78,
          maxMarks: 100,
        },
      ],
    });

    const student3 = await Student.create({
      name: "Sophia Chen",
      email: "sophia@school.com",
      class: "Class 9",
      section: "B",
      rollNo: "201",
      fees: {
        total: 48000,
        paid: 20000,
        balance: 28000,
        dueDate: "2026-06-25",
        breakdown: {
          monthlyTuition: 2800,
          yearlyTerm: 9000,
          extraCharges: 5400,
        },
      },
      attendanceHistory: [
        { date: "2026-06-16", status: "Absent" },
        { date: "2026-06-15", status: "Present" },
      ],
      overallAttendance: 50,
      marks: [
        {
          subject: "Mathematics",
          exam: "Mid-Term",
          marksObtained: 95,
          maxMarks: 100,
        },
      ],
    });

    console.log("Seeded students successfully.");

    // Seed Users (hashed passwords via Mongoose pre-save)
    const adminUser = await User.create({
      name: "Dr. Sarah Jenkins",
      email: "admin@school.com",
      password: "admin123",
      role: "admin",
    });

    const webadminUser = await User.create({
      name: "Web Content Manager",
      email: "webadmin@school.com",
      password: "webadmin123",
      role: "webadmin",
    });

    const teacherUser = await User.create({
      name: "Mr. Robert Harrison",
      email: "teacher@school.com",
      password: "teacher123",
      role: "teacher",
      class: "Class 10",
      section: "A",
    });

    const parentUser = await User.create({
      name: "David Miller",
      email: "parent@school.com",
      password: "parent123",
      role: "parent",
      studentId: student1._id.toString(),
    });

    console.log("Seeded user authentication accounts successfully.");

    // Seed Teachers Profile Detail
    await Teacher.create({
      _id: teacherUser._id, // match auth account
      name: "Mr. Robert Harrison",
      email: "teacher@school.com",
      class: "Class 10",
      section: "A",
      designation: "Senior PGT Mathematics",
      joiningDate: "2022-08-10",
      salary: 45000,
      salaryDetails: {
        base: 40000,
        allowances: 5000,
        deductions: 0,
        net: 45000,
      },
      bankDetails: "SBI A/C: 38291029302",
      syllabusCompletion: 78,
      status: "Present",
      checkIn: "08:30 AM",
      remarks: "On Time",
    });

    console.log("Seeded teacher profile successfully.");

    // Seed Notices
    await Notice.create([
      {
        title: "Monsoon Break Notification",
        content: "Due to excessive rain warnings, college will remain closed tomorrow, June 17, 2026.",
        date: "2026-06-16",
        audience: "All",
      },
      {
        title: "Teacher Faculty Meeting",
        content: "All PGT teachers must report in the main conference room at 2 PM for syllabus review.",
        date: "2026-06-15",
        audience: "Teachers",
      },
    ]);

    // Seed Leave Request
    await LeaveRequest.create({
      teacherId: teacherUser._id.toString(),
      teacherName: "Mr. Robert Harrison",
      days: "2 Days",
      reason: "Medical Checkup",
      status: "Pending",
      date: "2026-06-16",
    });

    // Seed Fee Payment Requests
    await FeePayment.create({
      studentId: student1._id.toString(),
      studentName: "Emily Miller",
      class: "Class 10",
      amountPaid: 15000,
      paymentDate: "2026-06-15",
      transactionId: "TXN123456789",
      message: "Paid remaining balance via GPay",
      status: "Approved",
    });

    // Seed Homework
    await Homework.create({
      class: "Class 10",
      subject: "Mathematics",
      title: "Algebra exercise 4.2",
      description: "Solve all questions from 1 to 10 in homework copy.",
      dueDate: "2026-06-18",
    });

    // Seed Resources
    await Resource.create({
      title: "Class 10 Algebra Formulas Cheat Sheet",
      type: "PDF",
      url: "#",
      size: "1.2 MB",
    });

    // Seed Salary slips
    await SalarySlip.create({
      teacherId: teacherUser._id.toString(),
      month: "May 2026",
      base: 45000,
      deductions: 1500,
      net: 43500,
      status: "Paid",
    });

    console.log("Seeded notices, leaves, homework, resources, and salary slips successfully!");
    console.log("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

seedData();
