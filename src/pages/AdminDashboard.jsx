import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  UserPlus,
  CreditCard,
  Megaphone,
  LayoutDashboard,
  LogOut,
  DollarSign,
  BookOpen,
  CheckCircle,
  Search,
  Clock,
  AlertCircle,
  Bell,
  Calendar,
  Send,
  Sliders,
  Shield,
  UserX,
  PlusCircle,
  Award,
  Contact,
} from "lucide-react";
import {
  db,
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  auth,
  adminCreateUser,
} from "../firebase";

// ─── FIX 1: Complete class list Nursery → Class 12 ───────────────────────────
const ALL_CLASSES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11 (Science)",
  "Class 11 (Commerce)",
  "Class 11 (Arts)",
  "Class 12 (Science)",
  "Class 12 (Commerce)",
  "Class 12 (Arts)",
];

const SECTIONS = ["A", "B", "C", "D"];

// ─── FIX 2: Class-wise roll number prefix map ────────────────────────────────
const CLASS_ROLL_PREFIX = {
  Nursery: "N",
  LKG: "LK",
  UKG: "UK",
  "Class 1": "01",
  "Class 2": "02",
  "Class 3": "03",
  "Class 4": "04",
  "Class 5": "05",
  "Class 6": "06",
  "Class 7": "07",
  "Class 8": "08",
  "Class 9": "09",
  "Class 10": "10",
  "Class 11 (Science)": "11S",
  "Class 11 (Commerce)": "11C",
  "Class 11 (Arts)": "11A",
  "Class 12 (Science)": "12S",
  "Class 12 (Commerce)": "12C",
  "Class 12 (Arts)": "12A",
};

// ─── FIX 4: Safe localStorage helper (handles empty / corrupt state) ─────────
const getMockDb = () => {
  try {
    const raw = localStorage.getItem("school_erp_mock_db");
    if (!raw) return getEmptyMockDb();
    const parsed = JSON.parse(raw);
    // ensure all keys exist
    return { ...getEmptyMockDb(), ...parsed };
  } catch {
    return getEmptyMockDb();
  }
};

const getPeriodTime = (periodStr, startHour, durationMinutes) => {
  const periodSlots = {
    "1st": 1,
    "2nd": 2,
    "3rd": 3,
    "4th": 4,
    "5th": 5,
    "6th": 6,
    "7th": 7,
  };
  const slotIndex = periodSlots[periodStr] || 1;
  const start = parseInt(startHour) || 8;
  const dur = parseInt(durationMinutes) || 60;

  const startTotalMinutes = start * 60 + (slotIndex - 1) * dur;
  const endTotalMinutes = startTotalMinutes + dur;

  const formatTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    let displayHour = hours % 12;
    if (displayHour === 0) displayHour = 12;
    const padHour = displayHour < 10 ? `0${displayHour}` : displayHour;
    const padMin = minutes < 10 ? `0${minutes}` : minutes;
    return `${padHour}:${padMin} ${period}`;
  };

  return `${formatTime(startTotalMinutes)} - ${formatTime(endTotalMinutes)}`;
};

const getEmptyMockDb = () => ({
  students: [],
  teachers: [],
  notices: [],
  leaveRequests: [],
  concessionRequests: [],
  salarySlips: [],
  timetables: {},
  exams: [],
  timetableStartHour: 8,
  timetablePeriodDuration: 60,
});

const saveMockDb = (data) => {
  try {
    localStorage.setItem("school_erp_mock_db", JSON.stringify(data));
  } catch (err) {
    import("../utils/logger").then(({ error }) =>
      error("Failed to save mock DB", err),
    );
  }
};

// ─── FIX 5: Next-class promotion map ─────────────────────────────────────────
const NEXT_CLASS_MAP = {
  Nursery: "LKG",
  LKG: "UKG",
  UKG: "Class 1",
  "Class 1": "Class 2",
  "Class 2": "Class 3",
  "Class 3": "Class 4",
  "Class 4": "Class 5",
  "Class 5": "Class 6",
  "Class 6": "Class 7",
  "Class 7": "Class 8",
  "Class 8": "Class 9",
  "Class 9": "Class 10",
  "Class 10": "Class 11 (Science)", // default; can be changed
  "Class 11 (Science)": "Class 12 (Science)",
  "Class 11 (Commerce)": "Class 12 (Commerce)",
  "Class 11 (Arts)": "Class 12 (Arts)",
  "Class 12 (Science)": "Passed Out",
  "Class 12 (Commerce)": "Passed Out",
  "Class 12 (Arts)": "Passed Out",
};

export const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [feePaymentRequests, setFeePaymentRequests] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [examsList, setExamsList] = useState([]);

  const [stats, setStats] = useState({
    attendanceRate: 84,
    teachersOnLeave: "0/0",
    collectedFees: "₹0",
    pendingFees: "₹0",
    alertsCount: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [dirSearchTerm, setDirSearchTerm] = useState("");
  const [dirClassFilter, setDirClassFilter] = useState("All");
  const [settingsAlerts, setSettingsAlerts] = useState({
    sms: true,
    email: true,
    whatsapp: false,
  });
  const [simulatedLogs, setSimulatedLogs] = useState([
    "[System] Notification pipeline initialized.",
  ]);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] =
    useState(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [timetableForm, setTimetableForm] = useState({
    className: "Class 10",
    section: "A",
    day: "Monday",
    period: "1st",
    subject: "Mathematics",
    teacherName: "",
  });
  const [classTimetable, setClassTimetable] = useState([]);
  const [timetableClass, setTimetableClass] = useState("Class 10");
  const [timetableSection, setTimetableSection] = useState("A");
  const [timetableStartHour, setTimetableStartHour] = useState(() => {
    const mockDb = getMockDb();
    return mockDb.timetableStartHour || 8;
  });
  const [timetablePeriodDuration, setTimetablePeriodDuration] = useState(() => {
    const mockDb = getMockDb();
    return mockDb.timetablePeriodDuration || 60;
  });
  const [editingBlock, setEditingBlock] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState({
    name: "Shree H.S. Model Inter College",
    address: "100 Education Blvd, Academic Valley, CA 90210",
    email: "admissions@shreehs-college.edu",
  });

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    className: "Class 1",
    section: "A",
    tuition: 35000,
    transport: 5000,
    hostel: 10000,
    password: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    motherMobile: "",
  });
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    designation: "Senior Lecturer",
    subject: "Mathematics",
    salary: 45050,
    bankDetails: "",
    password: "",
    className: "Class 10",
    section: "A",
  });

  // Custom states for direct cash payments and breakdown adjustments
  const [selectedStudentForCash, setSelectedStudentForCash] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashMessage, setCashMessage] = useState("");

  const [selectedStudentForBreakdown, setSelectedStudentForBreakdown] = useState("");
  const [breakdownForm, setBreakdownForm] = useState({
    monthlyTuition: "",
    yearlyTerm: "",
    extraCharges: ""
  });

  // Teacher Salary Control states
  const [selectedTeacherForSalary, setSelectedTeacherForSalary] = useState("");
  const [salaryControlForm, setSalaryControlForm] = useState({
    base: "",
    allowances: "",
    deductions: ""
  });
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
    audience: "All",
  });
  const [examForm, setExamForm] = useState({
    examName: "Mid-Term",
    subject: "Mathematics",
    examDate: "2026-07-10",
  });
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState(null);

  // ─── FIX 2: Auto roll number (class-wise ascending) ────────────────────────
  const generateRollNo = (className, section, existingStudents) => {
    const prefix = CLASS_ROLL_PREFIX[className] || "XX";
    const sectionCode = section || "A";
    const classStudents = existingStudents.filter(
      (s) => s.class === className && s.section === sectionCode,
    );
    const maxSerial = classStudents.reduce((max, s) => {
      const parts = String(s.rollNo).split("-");
      const serial = parseInt(parts[parts.length - 1]) || 0;
      return Math.max(max, serial);
    }, 0);
    const nextSerial = String(maxSerial + 1).padStart(3, "0");
    return `${prefix}-${sectionCode}-${nextSerial}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const [studSnap, tchSnap, notSnap, lvSnap, paySnap, salSnap] =
        await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "notices")),
          getDocs(collection(db, "leaveRequests")),
          getDocs(collection(db, "feePaymentRequests")),
          getDocs(collection(db, "salarySlips")),
        ]);

      const loadedStudents = studSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const loadedTeachers = tchSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const loadedNotices = notSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const loadedLeaves = lvSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const loadedPayments = paySnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const loadedSalaries = salSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      applyData(
        loadedStudents,
        loadedTeachers,
        loadedNotices,
        loadedLeaves,
        loadedPayments,
        loadedSalaries,
      );
    } catch (err) {
      // ─── FIX 4: Safe fallback ────────────────────────────────────────────
      const mockDb = getMockDb();
      applyData(
        mockDb.students,
        mockDb.teachers,
        mockDb.notices,
        mockDb.leaveRequests,
        mockDb.feePaymentRequests || [],
        mockDb.salarySlips,
      );

      // Load timetable for selected class
      const key = `${timetableClass}_${timetableSection}`;
      const tt = mockDb.timetables?.[key] ?? mockDb.timetables?.[timetableClass] ?? [];
      setClassTimetable(tt);

      // ─── FIX 9: Load persisted exams from localStorage ───────────────────
      setExamsList(mockDb.exams || []);

      import("../utils/logger").then(({ error }) =>
        error("Admin fetchData failed", err),
      );
    }
  }, [timetableClass, timetableSection]);

  const applyData = (studs, tchs, nots, lvs, payments, sals) => {
    // Dynamically adjust student fees based on approved payment requests in history
    const adjustedStudents = studs.map((s) => {
      if (!s.fees) return s;
      const bd = s.fees.breakdown || {
        monthlyTuition: 3000,
        yearlyTerm: 10000,
        extraCharges: 4000
      };
      const monthlyTotal = (Number(bd.monthlyTuition) || 3000) * 12;
      const yearlyTotal = Number(bd.yearlyTerm) || 10000;
      const extraTotal = Number(bd.extraCharges) || 4000;
      const computedTotal = monthlyTotal + yearlyTotal + extraTotal;

      return {
        ...s,
        fees: {
          ...s.fees,
          breakdown: bd,
          total: computedTotal,
          balance: Math.max(0, computedTotal - Number(s.fees.paid || 0)),
        }
      };
    });

    // ─── FIX 10: Sort students by rollNo ascending ────────────────────────
    const sortedStudents = [...adjustedStudents].sort((a, b) =>
      String(a.rollNo).localeCompare(String(b.rollNo)),
    );
    setStudents(sortedStudents);
    setTeachers(tchs);
    setNotices(nots);
    setLeaveRequests(lvs);
    setFeePaymentRequests(payments);
    setSalarySlips(sals);

    const collected = adjustedStudents.reduce(
      (s, st) => s + (Number(st.fees?.paid) || 0),
      0,
    );
    const pending = adjustedStudents.reduce(
      (s, st) => s + (Number(st.fees?.balance) || 0),
      0,
    );
    const absent = tchs.filter(
      (t) => t.status === "Absent" || t.status === "Half-Day",
    ).length;

    setStats({
      attendanceRate: 84,
      teachersOnLeave: `${absent}/${tchs.length || 0}`,
      collectedFees: `₹${collected.toLocaleString("en-IN")}`,
      pendingFees: `₹${pending.toLocaleString("en-IN")}`,
      alertsCount:
        lvs.filter((l) => l.status === "Pending").length +
        cons.filter((c) => c.status === "Pending").length +
        2,
    });
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reload timetable whenever selected class or section changes
  useEffect(() => {
    const mockDb = getMockDb();
    const key = `${timetableClass}_${timetableSection}`;
    setClassTimetable(mockDb.timetables?.[key] ?? mockDb.timetables?.[timetableClass] ?? []);
  }, [timetableClass, timetableSection]);

  const triggerNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  };

  // ─── Student Admission ──────────────────────────────────────────────────────
  const handleAdmitStudent = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!studentForm.name || !studentForm.email) {
      triggerNotification("Name and email are required.", "error");
      return;
    }
    const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(studentForm.email);
    if (!emailValid) {
      triggerNotification("Enter a valid email address.", "error");
      return;
    }

    const mockDb = getMockDb();

    // FIX 2: Auto-generate class-wise roll number
    const rollNo = generateRollNo(
      studentForm.className,
      studentForm.section,
      mockDb.students,
    );
    const totalFees =
      Number(studentForm.tuition) +
      Number(studentForm.transport) +
      Number(studentForm.hostel);
    const sId = "std_" + Math.random().toString(36).substring(2, 9);

    // Generate password if not provided
    const password =
      studentForm.password ||
      "Pass@" + rollNo.split("-").join("").substring(0, 4);

    const newStudent = {
      id: sId,
      name: studentForm.name,
      email: studentForm.email,
      class: studentForm.className,
      section: studentForm.section,
      rollNo,
      overallAttendance: 100,
      fees: {
        total: totalFees,
        paid: 0,
        balance: totalFees,
        dueDate: "2026-06-30",
      },
      attendanceHistory: [],
      marks: [],
      fatherName: studentForm.fatherName || "",
      fatherMobile: studentForm.fatherMobile || "",
      motherName: studentForm.motherName || "",
      motherMobile: studentForm.motherMobile || "",
      aadharNo: "",
      address: "",
      bloodGroup: "",
      dob: "",
      gender: "",
    };

    // Save to localStorage (FIX 4: always works even if Firebase offline)
    mockDb.students.push(newStudent);
    // Sort after adding
    mockDb.students.sort((a, b) =>
      String(a.rollNo).localeCompare(String(b.rollNo)),
    );
    saveMockDb(mockDb);

    // Try to create Firebase auth user
    let authCreated = false;
    let userUid = sId;
    let authResult = null;
    try {
      authResult = await adminCreateUser(
        studentForm.email,
        password,
      );
      if (authResult?.user?.uid) {
        userUid = authResult.user.uid;
        authCreated = true;
      }
    } catch (err) {
      import("../utils/logger").then(({ error }) =>
        error("Failed to create Firebase auth user", err),
      );
    }

    if (authCreated && authResult?.user?.uid) {
      try {
        await setDoc(doc(db, "students", sId), newStudent);
        await setDoc(doc(db, "users", userUid), {
          uid: userUid,
          name: studentForm.name,
          email: studentForm.email,
          role: "parent",
          studentId: sId,
        });
      } catch (err) {
        import("../utils/logger").then(({ error }) =>
          error("Failed to persist student to Firestore", err),
        );
      }
    } else {
      try {
        await setDoc(doc(db, "students", sId), newStudent);
        await setDoc(doc(db, "users", sId), {
          uid: sId,
          name: studentForm.name,
          email: studentForm.email,
          role: "parent",
          studentId: sId,
        });
      } catch (err2) {
        import("../utils/logger").then(({ error }) =>
          error("Failed to persist new student fallback", err2),
        );
      }
    }

    // Add to mock users DB for login
    if (!mockDb.users) mockDb.users = {};
    mockDb.users[userUid] = {
      uid: userUid,
      email: studentForm.email,
      name: studentForm.name,
      role: "parent",
      studentId: sId,
      password,
    };
    saveMockDb(mockDb);

    // Show credentials modal
    setCredentialsData({
      type: "student",
      name: studentForm.name,
      email: studentForm.email,
      rollNo,
      password,
      userId: sId,
    });
    setShowCredentialsModal(true);

    triggerNotification(
      `Student ${studentForm.name} admitted! Roll No: ${rollNo}`,
    );
    setStudentForm({
      name: "",
      email: "",
      className: "Class 1",
      section: "A",
      tuition: 35000,
      transport: 5000,
      hostel: 10000,
      password: "",
      fatherName: "",
      fatherMobile: "",
      motherName: "",
      motherMobile: "",
    });
    fetchData();
  };

  // ─── FIX 5: Promote with full class map ────────────────────────────────────
  const handlePromoteClass = (studentId) => {
    const mockDb = getMockDb();
    const idx = mockDb.students.findIndex((s) => s.id === studentId);
    if (idx === -1) return;
    const currentClass = mockDb.students[idx].class;
    const nextClass = NEXT_CLASS_MAP[currentClass];
    if (!nextClass || nextClass === "Passed Out") {
      triggerNotification(
        nextClass === "Passed Out"
          ? "Student has completed Class 12 — mark as Passed Out."
          : "Next class not found.",
        "error",
      );
      return;
    }
    // Assign new roll in next class
    const newRoll = generateRollNo(
      nextClass,
      mockDb.students[idx].section,
      mockDb.students,
    );
    mockDb.students[idx].class = nextClass;
    mockDb.students[idx].rollNo = newRoll;
    mockDb.students.sort((a, b) =>
      String(a.rollNo).localeCompare(String(b.rollNo)),
    );
    saveMockDb(mockDb);
    triggerNotification(`Promoted to ${nextClass}! New Roll No: ${newRoll}`);
    fetchData();
  };

  const handleIssueTC = (studentId) => {
    const mockDb = getMockDb();
    mockDb.students = mockDb.students.filter((s) => s.id !== studentId);
    saveMockDb(mockDb);
    triggerNotification(
      "Transfer Certificate issued. Student removed from roster.",
    );
    fetchData();
  };

  // ─── Teacher Management ─────────────────────────────────────────────────────
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    const tId = "tch_" + Math.random().toString(36).substring(2, 9);

    // Validation
    if (!teacherForm.name || !teacherForm.email) {
      triggerNotification("Teacher name and email required.", "error");
      return;
    }
    const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(teacherForm.email);
    if (!emailValid) {
      triggerNotification("Enter a valid email address.", "error");
      return;
    }

    // Generate password if not provided
    const password =
      teacherForm.password ||
      "Pass@" + teacherForm.name.substring(0, 4).toUpperCase();

    const newTeacher = {
      id: tId,
      name: teacherForm.name,
      email: teacherForm.email,
      designation: teacherForm.designation,
      subject: teacherForm.subject,
      salary: Number(teacherForm.salary),
      bankDetails: teacherForm.bankDetails,
      joiningDate: new Date().toISOString().split("T")[0],
      status: "Present",
      checkIn: "08:30 AM",
      remarks: "Active Duty",
      syllabusCompletion: 0,
      class: teacherForm.className,
      section: teacherForm.section,
    };

    const mockDb = getMockDb();
    mockDb.teachers.push(newTeacher);

    // Try to create Firebase auth user
    let authCreated = false;
    let userUid = tId;
    let authResult = null;
    try {
      authResult = await adminCreateUser(
        teacherForm.email,
        password,
      );
      if (authResult?.user?.uid) {
        userUid = authResult.user.uid;
        authCreated = true;
      }
    } catch (err) {
      import("../utils/logger").then(({ error }) =>
        error("Failed to create Firebase auth user for teacher", err),
      );
    }

    if (authCreated && authResult?.user?.uid) {
      try {
        await setDoc(doc(db, "teachers", tId), newTeacher);
        await setDoc(doc(db, "users", userUid), {
          uid: userUid,
          name: teacherForm.name,
          email: teacherForm.email,
          role: "teacher",
          teacherId: tId,
        });
      } catch (err) {
        import("../utils/logger").then(({ error }) =>
          error("Failed to persist teacher registry to Firestore", err),
        );
      }
    } else {
      try {
        await setDoc(doc(db, "teachers", tId), newTeacher);
        await setDoc(doc(db, "users", tId), {
          uid: tId,
          name: teacherForm.name,
          email: teacherForm.email,
          role: "teacher",
          teacherId: tId,
        });
      } catch (err2) {
        import("../utils/logger").then(({ error }) =>
          error("Failed to persist new teacher fallback", err2),
        );
      }
    }

    // Add to mock users DB for login
    if (!mockDb.users) mockDb.users = {};
    mockDb.users[userUid] = {
      uid: userUid,
      email: teacherForm.email,
      name: teacherForm.name,
      role: "teacher",
      teacherId: tId,
      password,
    };
    saveMockDb(mockDb);

    // Show credentials modal
    setCredentialsData({
      type: "teacher",
      name: teacherForm.name,
      email: teacherForm.email,
      subject: teacherForm.subject,
      password,
      userId: tId,
    });
    setShowCredentialsModal(true);

    triggerNotification(`Teacher ${teacherForm.name} registered successfully!`);
    setTeacherForm({
      name: "",
      email: "",
      designation: "Senior Lecturer",
      subject: "Mathematics",
      salary: 45050,
      bankDetails: "",
      password: "",
      className: "Class 10",
      section: "A",
    });
    fetchData();
  };

  const handleTeacherClassSectionChange = async (teacherId, field, value) => {
    const mockDb = getMockDb();
    const idx = mockDb.teachers.findIndex((t) => t.id === teacherId);
    if (idx > -1) {
      mockDb.teachers[idx][field] = value;
      saveMockDb(mockDb);

      // Update Firebase too
      try {
        await setDoc(doc(db, "teachers", teacherId), mockDb.teachers[idx]);
      } catch (err) {
        import("../utils/logger").then(({ warn }) =>
          warn("Failed to update teacher class/section in Firebase", err)
        );
      }
      triggerNotification(`Teacher assignment updated!`);
      fetchData();
    }
  };

  const handleTeacherAttendanceChange = (teacherId, field, value) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        const updated = { ...t, [field]: value };
        const mockDb = getMockDb();
        const idx = mockDb.teachers.findIndex((item) => item.id === teacherId);
        if (idx > -1) {
          mockDb.teachers[idx][field] = value;
          saveMockDb(mockDb);
        }
        return updated;
      }),
    );
  };

  const handleSyncAttendance = () =>
    triggerNotification(
      "Daily staff attendance synchronized with monthly payroll ledger.",
    );

  // ─── Timetable (FIX 12: per-class, not hardcoded) ──────────────────────────
  const handleAddTimetablePeriod = (e) => {
    e.preventDefault();
    const periodSlots = {
      "1st": 1,
      "2nd": 2,
      "3rd": 3,
      "4th": 4,
      "5th": 5,
      "6th": 6,
      "7th": 7,
    };
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    // Check for conflict: same day + period combo in CURRENT class (excluding the block we are editing, if any)
    const conflictFound = classTimetable.find(
      (c) =>
        c.day === timetableForm.day &&
        c.period === timetableForm.period &&
        !(editingBlock && editingBlock.day === c.day && editingBlock.period === c.period)
    );
    if (conflictFound) {
      triggerNotification(
        `Conflict! ${timetableForm.day} ${timetableForm.period} period already assigned.`,
        "error",
      );
      return;
    }

    // Check for teacher conflict: same day + period combo in ANY class
    const mockDb = getMockDb();
    const assignedTeacher = timetableForm.teacherName;
    if (assignedTeacher && assignedTeacher !== "Not Assigned") {
      const timetables = mockDb.timetables || {};
      const currentClassKey = `${timetableForm.className}_${timetableForm.section}`;
      for (const [classKey, schedule] of Object.entries(timetables)) {
        if (classKey === currentClassKey || classKey === timetableForm.className) continue;
        const conflict = schedule.find(
          (c) =>
            c.day === timetableForm.day &&
            c.period === timetableForm.period &&
            c.teacherName === assignedTeacher
        );
        if (conflict) {
          triggerNotification(
            `Teacher Conflict! ${assignedTeacher} is already teaching ${classKey} on ${timetableForm.day} during ${timetableForm.period} period.`,
            "error"
          );
          return;
        }
      }
    }

    const slotNum = periodSlots[timetableForm.period] || 1;
    const computedTime = getPeriodTime(timetableForm.period, timetableStartHour, timetablePeriodDuration);

    const newPeriod = {
      day: timetableForm.day,
      period: timetableForm.period,
      slot: slotNum,
      time: computedTime,
      subject: timetableForm.subject,
      teacherName: timetableForm.teacherName || "Not Assigned",
    };

    // Filter out the edited block if in edit mode
    let baseTimetable = classTimetable;
    if (editingBlock) {
      baseTimetable = classTimetable.filter(
        (c) => !(c.day === editingBlock.day && c.period === editingBlock.period)
      );
    }

    // Sort by day, then by numeric slot
    const updated = [...baseTimetable, newPeriod].sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
      if (dayDiff !== 0) return dayDiff;
      return a.slot - b.slot;
    });

    setClassTimetable(updated);
    setEditingBlock(null);

    if (!mockDb.timetables) mockDb.timetables = {};
    const key = `${timetableForm.className}_${timetableForm.section}`;
    mockDb.timetables[key] = updated;
    mockDb.timetables[timetableForm.className] = updated;
    saveMockDb(mockDb);
    triggerNotification(
      editingBlock
        ? `Timetable entry updated for ${timetableForm.day} ${timetableForm.period}!`
        : `Timetable entry saved for ${timetableForm.day} ${timetableForm.period}!`,
    );
  };

  const handleCopyMondaySchedule = () => {
    const mondayPeriods = classTimetable.filter((t) => t.day === "Monday");
    if (mondayPeriods.length === 0) {
      triggerNotification("No periods scheduled for Monday to copy!", "error");
      return;
    }

    const otherDays = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mockDb = getMockDb();
    const timetables = mockDb.timetables || {};
    const currentKey = `${timetableClass}_${timetableSection}`;

    // Verify all teacher allocations on Tuesday - Saturday do not conflict with other classes
    for (const day of otherDays) {
      for (const mp of mondayPeriods) {
        const assignedTeacher = mp.teacherName;
        if (assignedTeacher && assignedTeacher !== "Not Assigned") {
          for (const [classKey, schedule] of Object.entries(timetables)) {
            if (classKey === currentKey || classKey === timetableClass) continue;
            const conflict = schedule.find(
              (c) =>
                c.day === day &&
                c.period === mp.period &&
                c.teacherName === assignedTeacher
            );
            if (conflict) {
              triggerNotification(
                `Teacher Conflict! ${assignedTeacher} is already teaching ${classKey} on ${day} during ${mp.period} period. Copy aborted.`,
                "error"
              );
              return;
            }
          }
        }
      }
    }

    // No conflicts, duplicate Monday schedule to other days
    let updated = [...mondayPeriods];
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    otherDays.forEach((day) => {
      mondayPeriods.forEach((mp) => {
        const computedTime = getPeriodTime(mp.period, timetableStartHour, timetablePeriodDuration);
        updated.push({
          ...mp,
          day: day,
          time: computedTime,
        });
      });
    });

    updated.sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
      if (dayDiff !== 0) return dayDiff;
      return a.slot - b.slot;
    });

    setClassTimetable(updated);
    if (!mockDb.timetables) mockDb.timetables = {};
    mockDb.timetables[currentKey] = updated;
    mockDb.timetables[timetableClass] = updated;
    saveMockDb(mockDb);

    triggerNotification("Monday's schedule successfully copied to Tuesday - Saturday!");
  };

  const handleDeleteTimetablePeriod = (day, periodSlot) => {
    const updated = classTimetable.filter(
      (c) => !(c.day === day && c.period === periodSlot)
    );
    setClassTimetable(updated);
    const mockDb = getMockDb();
    if (!mockDb.timetables) mockDb.timetables = {};
    const key = `${timetableClass}_${timetableSection}`;
    mockDb.timetables[key] = updated;
    mockDb.timetables[timetableClass] = updated;
    saveMockDb(mockDb);
    triggerNotification(`Deleted ${day} ${periodSlot} period!`);
  };

  // ─── Leave & Concession approvals ──────────────────────────────────────────
  const handleLeaveDecision = (id, decision) => {
    const mockDb = getMockDb();
    const idx = mockDb.leaveRequests.findIndex((r) => r.id === id);
    if (idx > -1) {
      mockDb.leaveRequests[idx].status = decision;
      saveMockDb(mockDb);
    }
    triggerNotification(`Leave ${decision}.`);
    fetchData();
  };

  // ─── FIX 6: Concession discount — ensure numeric ───────────────────────────
  const handlePaymentRequestDecision = async (
    reqId,
    decision,
    amountPaid,
    studentId,
  ) => {
    const mockDb = getMockDb();
    const pIdx = (mockDb.feePaymentRequests || []).findIndex((p) => p.id === reqId);
    if (pIdx > -1) {
      mockDb.feePaymentRequests[pIdx].status = decision;
      mockDb.feePaymentRequests[pIdx].processedAt = new Date().toISOString();
      mockDb.feePaymentRequests[pIdx].processedBy = userData?.name || "Admin";
    }

    if (decision === "Approved") {
      const amountPaidNum = Number(amountPaid);
      const sIdx = mockDb.students.findIndex((s) => s.id === studentId);
      if (sIdx > -1) {
        const student = mockDb.students[sIdx];
        student.fees.paid = (Number(student.fees.paid) || 0) + amountPaidNum;
        student.fees.balance = Math.max(
          0,
          student.fees.total - student.fees.paid,
        );

        // Update local storage
        saveMockDb(mockDb);

        // Update Firestore
        try {
          await updateDoc(doc(db, "students", studentId), {
            fees: student.fees,
          });
        } catch (fbErr) {
          console.warn("Failed to sync student fees update to Firestore:", fbErr);
        }
      }
    } else {
      saveMockDb(mockDb);
    }

    // Update the payment request status in Firestore
    try {
      await updateDoc(doc(db, "feePaymentRequests", reqId), {
        status: decision,
        processedAt: new Date().toISOString(),
        processedBy: userData?.name || "Admin",
      });
    } catch (fbErr) {
      console.warn("Failed to sync payment request status to Firestore:", fbErr);
    }

    triggerNotification(`Payment request ${decision}.`);
    fetchData();
  };

  // ─── FIX 11: Notice with localStorage fallback ─────────────────────────────
  const handleAddNotice = async (e) => {
    e.preventDefault();
    const newNotice = {
      id: "ntc_" + Math.random().toString(36).substring(2, 9),
      title: noticeForm.title,
      content: noticeForm.content,
      audience: noticeForm.audience,
      date: new Date().toISOString().split("T")[0],
    };
    const mockDb = getMockDb();
    mockDb.notices.push(newNotice);
    saveMockDb(mockDb);

    try {
      await addDoc(collection(db, "notices"), newNotice);
    } catch (err) {
      import("../utils/logger").then(({ error }) =>
        error("Failed to persist notice", err),
      );
    }
    triggerNotification(`Notice sent to: ${noticeForm.audience}`);
    setNoticeForm({ title: "", content: "", audience: "All" });
    fetchData();
  };

  // ─── FIX 9: Exams persisted to localStorage ────────────────────────────────
  const handleAddExam = (e) => {
    e.preventDefault();
    const newExam = {
      id: "ex_" + Math.random().toString(36).substring(2, 9),
      examName: examForm.examName,
      subject: examForm.subject,
      date: examForm.examDate,
    };
    const mockDb = getMockDb();
    mockDb.exams = [...(mockDb.exams || []), newExam];
    saveMockDb(mockDb);
    setExamsList(mockDb.exams);
    triggerNotification("Exam scheduled and saved!");
  };

  // ─── FIX 8: Salary disburse with localStorage fallback ─────────────────────
  const handleDisburseSalary = async (teacher) => {
    const basePay = teacher.salary || 45000;
    const deductions =
      teacher.status === "Absent" ? Math.round(basePay / 30) : 0;
    const netPay = basePay - deductions;
    const slip = {
      id: "sal_" + Math.random().toString(36).substring(2, 9),
      teacherId: teacher.id,
      month: "June 2026",
      base: basePay,
      deductions,
      net: netPay,
      status: "Paid",
    };
    const mockDb = getMockDb();
    mockDb.salarySlips.push(slip);
    saveMockDb(mockDb);

    try {
      await addDoc(collection(db, "salarySlips"), slip);
    } catch (err) {
      import("../utils/logger").then(({ error }) =>
        error("Failed to persist salary slip", err),
      );
    }
    triggerNotification(`Salary disbursed to ${teacher.name}!`);
    fetchData();
  };

  // ─── Direct Cash Payments, Breakdown Adjustments & Salary Controls ────────
  const handleRecordCashPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudentForCash) {
      triggerNotification("Please select a student.", "error");
      return;
    }
    const amt = Number(cashAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerNotification("Please enter a valid cash amount.", "error");
      return;
    }

    const mockDb = getMockDb();
    const student = mockDb.students.find((s) => s.id === selectedStudentForCash);
    if (!student) {
      triggerNotification("Student not found.", "error");
      return;
    }

    const txnId = "CASH-" + Math.floor(100000 + Math.random() * 900000);
    const newRequest = {
      id: "csh_" + Math.random().toString(36).substring(2, 9),
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      amountPaid: amt,
      paymentDate: new Date().toISOString().split("T")[0],
      transactionId: txnId,
      paymentMode: "CASH",
      message: cashMessage || "Direct cash payment received by Admin.",
      status: "Approved",
      processedAt: new Date().toISOString(),
      processedBy: userData?.name || "Admin",
    };

    // Update student paid and balance
    student.fees.paid = (Number(student.fees.paid) || 0) + amt;
    student.fees.balance = Math.max(0, student.fees.total - student.fees.paid);

    mockDb.feePaymentRequests = mockDb.feePaymentRequests || [];
    mockDb.feePaymentRequests.push(newRequest);
    saveMockDb(mockDb);

    try {
      await addDoc(collection(db, "feePaymentRequests"), newRequest);
      await updateDoc(doc(db, "students", student.id), {
        fees: student.fees,
      });
    } catch (err) {
      console.error("Failed to sync direct cash payment to Firestore:", err);
    }

    triggerNotification(`Cash payment of ₹${amt.toLocaleString()} recorded for ${student.name}!`);
    setCashAmount("");
    setCashMessage("");
    setSelectedStudentForCash("");
    fetchData();
  };

  const handleUpdateBreakdown = async (e) => {
    e.preventDefault();
    if (!selectedStudentForBreakdown) {
      triggerNotification("Please select a student.", "error");
      return;
    }

    const mTuition = Number(breakdownForm.monthlyTuition) || 0;
    const yTerm = Number(breakdownForm.yearlyTerm) || 0;
    const eCharges = Number(breakdownForm.extraCharges) || 0;

    const mockDb = getMockDb();
    const sIdx = mockDb.students.findIndex((s) => s.id === selectedStudentForBreakdown);
    if (sIdx > -1) {
      const student = mockDb.students[sIdx];
      student.fees.breakdown = {
        monthlyTuition: mTuition,
        yearlyTerm: yTerm,
        extraCharges: eCharges
      };

      const computedTotal = (mTuition * 12) + yTerm + eCharges;
      student.fees.total = computedTotal;
      student.fees.balance = Math.max(0, computedTotal - Number(student.fees.paid || 0));

      saveMockDb(mockDb);

      try {
        await updateDoc(doc(db, "students", student.id), {
          fees: student.fees,
        });
      } catch (err) {
        console.error("Failed to sync student fee breakdown to Firestore:", err);
      }

      triggerNotification(`Fee breakdown updated successfully for ${student.name}!`);
      setSelectedStudentForBreakdown("");
      setBreakdownForm({ monthlyTuition: "", yearlyTerm: "", extraCharges: "" });
      fetchData();
    }
  };

  const handleDisburseCustomSalary = async (teacher) => {
    const basePay = Number(salaryControlForm.base) || teacher.salaryDetails?.base || teacher.salary || 40000;
    const allowances = Number(salaryControlForm.allowances) || teacher.salaryDetails?.allowances || 0;
    const deductions = Number(salaryControlForm.deductions) || teacher.salaryDetails?.deductions || 0;
    const netPay = basePay + allowances - deductions;

    const slip = {
      id: "sal_" + Math.random().toString(36).substring(2, 9),
      teacherId: teacher.id,
      month: "June 2026",
      base: basePay,
      allowances,
      deductions,
      net: netPay,
      status: "Paid",
    };

    const mockDb = getMockDb();
    mockDb.salarySlips.push(slip);
    const tIdx = mockDb.teachers.findIndex((t) => t.id === teacher.id);
    if (tIdx > -1) {
      mockDb.teachers[tIdx].salaryDetails = {
        base: basePay,
        allowances,
        deductions,
        net: netPay
      };
      mockDb.teachers[tIdx].salary = netPay;
    }
    saveMockDb(mockDb);

    try {
      await addDoc(collection(db, "salarySlips"), slip);
      await updateDoc(doc(db, "teachers", teacher.id), {
        salary: netPay,
        salaryDetails: {
          base: basePay,
          allowances,
          deductions,
          net: netPay
        }
      });
    } catch (err) {
      console.error("Failed to disburse custom salary in Firestore:", err);
    }

    triggerNotification(`Custom Salary disbursed to ${teacher.name}! Net: ₹${netPay}`);
    setSelectedTeacherForSalary("");
    setSalaryControlForm({ base: "", allowances: "", deductions: "" });
    fetchData();
  };

  // ─── Reminders ─────────────────────────────────────────────────────────────
  const handleSendReminder = (name) => {
    const t = new Date().toLocaleTimeString();
    const sms = settingsAlerts.sms ? "SMS Queued" : "SMS Disabled";
    const email = settingsAlerts.email ? "Email Queued" : "Email Disabled";
    setSimulatedLogs((prev) => [
      `[${t}] ALERT → ${name}'s parents. [${sms}] [${email}]`,
      ...prev,
    ]);
    triggerNotification(`Reminder dispatched for ${name}'s parents.`);
  };

  const handleSendTestNotification = () => {
    const t = new Date().toLocaleTimeString();
    setSimulatedLogs((prev) => [
      `[${t}] TEST → SMS:[${settingsAlerts.sms ? "OK" : "OFF"}] Email:[${settingsAlerts.email ? "OK" : "OFF"}] WhatsApp:[${settingsAlerts.whatsapp ? "OK" : "OFF"}]`,
      ...prev,
    ]);
    triggerNotification("Test notification sent through all enabled channels!");
  };

  // ─── FIX 10: Search — coerce rollNo to string before includes ──────────────
  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(term);
    const rollMatch = String(s.rollNo || "")
      .toLowerCase()
      .includes(term);
    const phoneMatch =
      String(s.fatherMobile || "").toLowerCase().includes(term) ||
      String(s.motherMobile || "").toLowerCase().includes(term);
    const classMatch = classFilter === "All" || s.class === classFilter;
    return (nameMatch || rollMatch || phoneMatch) && classMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-350 flex flex-col justify-between shrink-0 border-r border-slate-850">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider truncate">
                {schoolInfo.name}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                Principal Portal
              </span>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
              P
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">
                {userData?.name || "Dr. Sarah Jenkins"}
              </h4>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                College Director
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              {
                id: "overview",
                label: "Dashboard Home",
                icon: LayoutDashboard,
              },
              { id: "approvals", label: "Approvals Hub", icon: Shield },
              { id: "students", label: "Student Management", icon: Users },
              { id: "student_info", label: "Student Directory", icon: Contact },
              { id: "teachers", label: "Teacher Management", icon: UserPlus },
              { id: "attendance", label: "Attendance Reports", icon: Calendar },
              { id: "fees", label: "Fees Management", icon: CreditCard },
              { id: "salary", label: "Salary Management", icon: DollarSign },
              { id: "notices", label: "Notice & Circular", icon: Megaphone },
              { id: "timetable", label: "Timetable Control", icon: Clock },
              { id: "exams", label: "Exam & Results", icon: Award },
              { id: "settings", label: "Settings & Roles", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative p-1.5 hover:bg-slate-100 rounded-full cursor-pointer">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                {stats.alertsCount}
              </span>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                P
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:block">
                Director Jenkins
              </span>
            </div>
          </div>
        </header>

        {notification.message && (
          <div
            className={`mx-8 mt-6 p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${notification.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-600"
              }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* STATS HERO */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              {
                label: "Today's Attendance",
                value: `${stats.attendanceRate}%`,
                sub: "Students Active",
                color: "text-slate-800",
                bar: true,
                barColor: "bg-indigo-500",
                barW: stats.attendanceRate,
              },
              {
                label: "Staff On Duty",
                value: stats.teachersOnLeave,
                sub: "Teachers Absent",
                color: "text-slate-800",
                bar: true,
                barColor: "bg-rose-500",
                barW: 15,
              },
              {
                label: "Finance Ledger",
                value: stats.collectedFees,
                sub: "Collected Fees",
                color: "text-emerald-600",
              },
              {
                label: "Pending Dues",
                value: stats.pendingFees,
                sub: "Outstanding Dues",
                color: "text-rose-500",
              },
              {
                label: "Director Alerts",
                value: stats.alertsCount,
                sub: "Required Approvals",
                color: "text-amber-600",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  {s.label}
                </span>
                <h3 className={`text-2xl font-black mt-1 ${s.color}`}>
                  {s.value}
                </h3>
                {s.bar && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`${s.barColor} h-full rounded-full`}
                      style={{ width: `${s.barW}%` }}
                    ></div>
                  </div>
                )}
                <span className="text-[9px] text-slate-400 font-bold block mt-1">
                  {s.sub}
                </span>
              </div>
            ))}
          </section>

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-2">
                  School Status Dashboard
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Real-time registration counters.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Pupils",
                      val: students.length,
                      color: "text-slate-800",
                    },
                    {
                      label: "Active Faculty",
                      val: teachers.length,
                      color: "text-slate-800",
                    },
                    {
                      label: "Leave Requests",
                      val: leaveRequests.filter((l) => l.status === "Pending")
                        .length,
                      color: "text-amber-600",
                    },
                    {
                      label: "Fee Requests",
                      val: feePaymentRequests.filter(
                        (c) => c.status === "Pending",
                      ).length,
                      color: "text-indigo-600",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {item.label}
                      </span>
                      <span
                        className={`text-xl font-black block mt-1 ${item.color}`}
                      >
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>Database: Active</span>
                  <span
                    className="font-semibold text-indigo-600 cursor-pointer hover:underline"
                    onClick={() => setActiveTab("students")}
                  >
                    Open Admissions →
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-4">
                    Urgent Actions
                  </h3>
                  <div className="space-y-3">
                    {leaveRequests
                      .filter((l) => l.status === "Pending")
                      .slice(0, 3)
                      .map((req) => (
                        <div
                          key={req.id}
                          className="p-3 border border-slate-100 rounded-xl text-xs"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700">
                              {req.teacherName}
                            </span>
                            <span className="text-[9px] text-amber-600 font-bold uppercase">
                              {req.days} Leave
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-1">
                            {req.reason}
                          </p>
                        </div>
                      ))}
                    {leaveRequests.filter((l) => l.status === "Pending")
                      .length === 0 && (
                        <p className="text-center py-6 text-slate-400 text-xs">
                          No pending requests.
                        </p>
                      )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("approvals")}
                  className="mt-6 w-full text-center text-xs text-indigo-600 font-bold hover:text-indigo-500 py-2.5 bg-indigo-50 rounded-xl"
                >
                  Manage Approvals Hub
                </button>
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {activeTab === "students" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Student Admission Form
                </h3>
                <form onSubmit={handleAdmitStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Student Name
                    </label>
                    <input
                      type="text"
                      value={studentForm.name}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, name: e.target.value })
                      }
                      placeholder="Aditya Roy"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="aditya@school.com"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Father's Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={studentForm.fatherName}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            fatherName: e.target.value,
                          })
                        }
                        placeholder="Mr. Roy"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Father's Mobile (Optional)
                      </label>
                      <input
                        type="text"
                        value={studentForm.fatherMobile}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            fatherMobile: e.target.value,
                          })
                        }
                        placeholder="9876543210"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Mother's Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={studentForm.motherName}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            motherName: e.target.value,
                          })
                        }
                        placeholder="Mrs. Roy"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Mother's Mobile (Optional)
                      </label>
                      <input
                        type="text"
                        value={studentForm.motherMobile}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            motherMobile: e.target.value,
                          })
                        }
                        placeholder="9876543211"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  </div>

                  {/* FIX 1: Full class list */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Class
                      </label>
                      <select
                        value={studentForm.className}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            className: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      >
                        {ALL_CLASSES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* FIX 3: Section dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Section
                      </label>
                      <select
                        value={studentForm.section}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            section: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      >
                        {SECTIONS.map((s) => (
                          <option key={s} value={s}>
                            Section {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-semibold">
                    Roll No will be auto-assigned:{" "}
                    <span className="font-black">
                      {generateRollNo(
                        studentForm.className,
                        studentForm.section,
                        students,
                      )}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-600">
                      Fees Allocation (INR)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Tuition", key: "tuition" },
                        { label: "Transport", key: "transport" },
                        { label: "Hostel", key: "hostel" },
                      ].map((f) => (
                        <div key={f.key}>
                          <span className="text-[10px] text-slate-400 block mb-1">
                            {f.label}
                          </span>
                          <input
                            type="number"
                            value={studentForm[f.key]}
                            onChange={(e) =>
                              setStudentForm({
                                ...studentForm,
                                [f.key]: e.target.value,
                              })
                            }
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Password (leave empty for auto-generate)
                    </label>
                    <input
                      type="text"
                      value={studentForm.password}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          password: e.target.value,
                        })
                      }
                      placeholder="Auto-generated if empty"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Admit Student
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-base font-extrabold text-slate-800">
                    Student Enrollment Directory
                  </h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* FIX 1: Full class filter list */}
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none font-semibold text-slate-600"
                    >
                      <option value="All">All Classes</option>
                      {ALL_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name/roll..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredStudents.length === 0 && (
                    <p className="text-center py-8 text-slate-400 text-xs col-span-2">
                      No students found.
                    </p>
                  )}
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentForModal(student)}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{student.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">
                            Roll No: {student.rollNo}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-full">
                          {student.class} - {student.section}
                        </span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-400">
                          Attendance: <span className="font-bold text-emerald-600">{student.overallAttendance || 100}%</span>
                        </span>
                        <span className="text-slate-400">
                          Fees: <span className={`font-bold ${student.fees?.balance === 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {student.fees?.balance === 0 ? "Settled" : `₹${student.fees?.balance?.toLocaleString()}`}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENT DIRECTORY ── */}

          {activeTab === "student_info" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Student Personal Profiles Directory
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    View and manage personal information of all registered pupils.
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <select
                    value={dirClassFilter}
                    onChange={(e) => setDirClassFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none font-semibold text-slate-600"
                  >
                    <option value="All">All Classes</option>
                    {ALL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, roll, aadhar..."
                      value={dirSearchTerm}
                      onChange={(e) => setDirSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {students.filter((s) => {
                const classMatch = dirClassFilter === "All" || s.class === dirClassFilter;
                const searchMatch =
                  dirSearchTerm === "" ||
                  s.name.toLowerCase().includes(dirSearchTerm.toLowerCase()) ||
                  (s.rollNo && String(s.rollNo).includes(dirSearchTerm)) ||
                  (s.aadharNo && String(s.aadharNo).includes(dirSearchTerm));
                return classMatch && searchMatch;
              }).length === 0 ? (
                <p className="text-center py-12 text-slate-400 text-xs">
                  No student profiles matched the criteria.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class/Sec</th>
                        <th className="p-3">DOB / Gender</th>
                        <th className="p-3">Aadhar Card</th>
                        <th className="p-3">Father's Info</th>
                        <th className="p-3">Mother's Info</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                      {students.filter((s) => {
                        const classMatch = dirClassFilter === "All" || s.class === dirClassFilter;
                        const searchMatch =
                          dirSearchTerm === "" ||
                          s.name.toLowerCase().includes(dirSearchTerm.toLowerCase()) ||
                          (s.rollNo && String(s.rollNo).includes(dirSearchTerm)) ||
                          (s.aadharNo && String(s.aadharNo).includes(dirSearchTerm));
                        return classMatch && searchMatch;
                      }).map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          onClick={() => setSelectedStudentForModal(s)}
                          title="Click to view full scorecard and statistics"
                        >
                          <td className="p-3 font-mono font-bold text-slate-800">{s.rollNo || "-"}</td>
                          <td className="p-3">
                            <span className="font-extrabold text-slate-800 block text-sm">{s.name}</span>
                            <span className="text-[10px] text-slate-400 block">{s.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold text-[10px]">
                              {s.class} - {s.section}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="block">{s.dob || "-"}</span>
                            <span className="text-[10px] text-slate-400 block">{s.gender || "-"}</span>
                          </td>
                          <td className="p-3 font-mono">{s.aadharNo || "-"}</td>
                          <td className="p-3">
                            <span className="block font-bold text-slate-700">{s.fatherName || "-"}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{s.fatherMobile || "-"}</span>
                          </td>
                          <td className="p-3">
                            <span className="block font-bold text-slate-700">{s.motherName || "-"}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{s.motherMobile || "-"}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${s.bloodGroup ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"}`}>
                              {s.bloodGroup || "N/A"}
                            </span>
                          </td>
                          <td className="p-3 max-w-[150px] truncate" title={s.address}>{s.address || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TEACHERS ── */}
          {activeTab === "teachers" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Register Faculty Teacher
                </h3>
                <form onSubmit={handleAddTeacher} className="space-y-4">
                  {[
                    {
                      label: "Teacher Name",
                      key: "name",
                      type: "text",
                      placeholder: "Mrs. Anjali Sharma",
                    },
                    {
                      label: "Email Address",
                      key: "email",
                      type: "email",
                      placeholder: "anjali@school.com",
                    },
                    {
                      label: "Designation",
                      key: "designation",
                      type: "text",
                      placeholder: "Senior PGT Teacher",
                    },
                    {
                      label: "Subject",
                      key: "subject",
                      type: "text",
                      placeholder: "Physics",
                    },
                    {
                      label: "Monthly Base Salary",
                      key: "salary",
                      type: "number",
                      placeholder: "45000",
                    },
                    {
                      label: "Bank Account (Salary)",
                      key: "bankDetails",
                      type: "text",
                      placeholder: "SBI A/C: 38291029302",
                    },
                    {
                      label: "Password (leave empty for auto-generate)",
                      key: "password",
                      type: "text",
                      placeholder: "Auto-generated if empty",
                    },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={teacherForm[f.key]}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          setTeacherForm({
                            ...teacherForm,
                            [f.key]: e.target.value,
                          })
                        }
                        required={
                          f.key !== "bankDetails" && f.key !== "password"
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Assigned Class
                      </label>
                      <select
                        value={teacherForm.className}
                        onChange={(e) =>
                          setTeacherForm({
                            ...teacherForm,
                            className: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      >
                        <option value="">None</option>
                        {ALL_CLASSES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Assigned Section
                      </label>
                      <select
                        value={teacherForm.section}
                        onChange={(e) =>
                          setTeacherForm({
                            ...teacherForm,
                            section: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      >
                        <option value="">None</option>
                        {SECTIONS.map((s) => (
                          <option key={s} value={s}>
                            Section {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Save Faculty Registry
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Faculty Roster
                </h3>
                {teachers.length === 0 && (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No teachers registered yet. Add faculty using the form.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teachers.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 border border-slate-100 rounded-2xl text-xs space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {t.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                            {t.designation}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-full">
                          {t.subject}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between text-slate-500">
                          <span>Joined: {t.joiningDate}</span>
                          <span className="font-bold text-slate-800">
                            ₹{t.salary?.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-400 font-bold">Class:</span>
                          <select
                            value={t.class || ""}
                            onChange={(e) => handleTeacherClassSectionChange(t.id, "class", e.target.value)}
                            className="border border-slate-200 rounded px-2 py-0.5 bg-slate-50 text-[10px]"
                          >
                            <option value="">None</option>
                            {ALL_CLASSES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-slate-400 font-bold">Sec:</span>
                          <select
                            value={t.section || ""}
                            onChange={(e) => handleTeacherClassSectionChange(t.id, "section", e.target.value)}
                            className="border border-slate-200 rounded px-2 py-0.5 bg-slate-50 text-[10px]"
                          >
                            <option value="">None</option>
                            {SECTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === "attendance" && (
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Mark Teacher Attendance
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Principal's direct staff attendance panel.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncAttendance}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                  >
                    Sync with Payroll
                  </button>
                </div>
                {/* FIX 7: Empty state for teacher table */}
                {teachers.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No teachers registered. Add faculty in Teacher Management.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Teacher</th>
                          <th className="pb-3">Subject</th>
                          <th className="pb-3">Check-in</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {teachers.map((teacher) => (
                          <tr key={teacher.id}>
                            <td className="py-3 font-bold">{teacher.name}</td>
                            <td className="py-3 text-slate-400">
                              {teacher.subject}
                            </td>
                            <td className="py-3">
                              <input
                                type="text"
                                value={teacher.checkIn}
                                onChange={(e) =>
                                  handleTeacherAttendanceChange(
                                    teacher.id,
                                    "checkIn",
                                    e.target.value,
                                  )
                                }
                                className="border border-slate-200 bg-slate-50 rounded px-2 py-1 font-mono w-24 text-[11px]"
                              />
                            </td>
                            <td className="py-3">
                              <div className="flex gap-1">
                                {["Present", "Absent", "Half-Day"].map(
                                  (opt) => (
                                    <button
                                      key={opt}
                                      onClick={() =>
                                        handleTeacherAttendanceChange(
                                          teacher.id,
                                          "status",
                                          opt,
                                        )
                                      }
                                      className={`px-2 py-1 text-[9px] font-bold rounded border transition-all ${teacher.status === opt
                                          ? opt === "Present"
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                            : opt === "Absent"
                                              ? "bg-rose-50 border-rose-200 text-rose-600"
                                              : "bg-amber-50 border-amber-200 text-amber-600"
                                          : "border-slate-200 text-slate-400 hover:bg-slate-50"
                                        }`}
                                    >
                                      {opt}
                                    </button>
                                  ),
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <input
                                type="text"
                                value={teacher.remarks}
                                onChange={(e) =>
                                  handleTeacherAttendanceChange(
                                    teacher.id,
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                                placeholder="Remarks"
                                className="border border-slate-200 bg-slate-50 rounded px-2 py-1 w-36 text-[11px]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-rose-600 mb-4 flex items-center gap-1.5">
                    <AlertCircle className="w-5 h-5" /> Low Attendance (&lt;75%)
                  </h3>
                  <div className="space-y-3">
                    {students
                      .filter((s) => (s.overallAttendance || 90) < 75)
                      .map((student) => (
                        <div
                          key={student.id}
                          className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-center text-xs"
                        >
                          <div>
                            <h4 className="font-extrabold text-slate-800">
                              {student.name}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              {student.class} | Roll: {student.rollNo}
                            </span>
                          </div>
                          <span className="text-sm font-black text-rose-600">
                            {student.overallAttendance}%
                          </span>
                        </div>
                      ))}
                    {students.filter((s) => (s.overallAttendance || 90) < 75)
                      .length === 0 && (
                        <p className="text-center py-8 text-slate-400 text-xs">
                          No critically low attendance records.
                        </p>
                      )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-800 mb-4">
                    Student Attendance History
                  </h3>
                  <select
                    onChange={(e) =>
                      setSelectedStudentForAttendance(
                        students.find((s) => s.id === e.target.value) || null,
                      )
                    }
                    className="border border-slate-200 px-3 py-1.5 rounded-xl text-xs bg-slate-50 outline-none w-full mb-4"
                  >
                    <option value="">Select Student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll: {s.rollNo})
                      </option>
                    ))}
                  </select>
                  {selectedStudentForAttendance ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                        Overall:{" "}
                        {selectedStudentForAttendance.overallAttendance}%
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto">
                        {selectedStudentForAttendance.attendanceHistory?.map(
                          (day, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-lg text-center text-[10px] font-bold border ${day.status === "Present"
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                  : "bg-rose-50 border-rose-100 text-rose-600"
                                }`}
                            >
                              <div>{day.date}</div>
                              <div className="text-[8px] uppercase mt-0.5">
                                {day.status}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-400 text-xs">
                      Select a student to view history.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── FEES ── */}
          {activeTab === "fees" && (
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Fee Defaulters
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Class</th>
                        <th className="pb-3">Total Fees</th>
                        <th className="pb-3">Outstanding</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {students
                        .filter((s) => (s.fees?.balance || 0) > 0)
                        .map((student) => (
                          <tr key={student.id}>
                            <td className="py-3.5 font-bold text-slate-800">
                              {student.name}
                            </td>
                            <td className="py-3.5">
                              {student.class} — {student.section}
                            </td>
                            <td className="py-3.5 font-mono">
                              ₹{student.fees?.total.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 font-mono text-rose-600 font-bold">
                              ₹{student.fees?.balance.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => handleSendReminder(student.name)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center gap-1 text-[10px]"
                              >
                                <Send className="w-3 h-3" /> Send Reminder
                              </button>
                            </td>
                          </tr>
                        ))}
                      {students.filter((s) => (s.fees?.balance || 0) > 0)
                        .length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="py-8 text-center text-slate-400"
                            >
                              All accounts are cleared.
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TWO COLUMN GRID: Record Cash Payment & Edit Fee Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Record Direct Cash Payment */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-2">
                      Record Cash Payment Collection
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Instantly record cash paid directly to the office. This updates the student's balance.
                    </p>
                    <form onSubmit={handleRecordCashPayment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Select Student
                        </label>
                        <select
                          value={selectedStudentForCash}
                          onChange={(e) => setSelectedStudentForCash(e.target.value)}
                          required
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 outline-none"
                        >
                          <option value="">Choose student...</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} (Roll: {s.rollNo} | {s.class}-{s.section} | Bal: ₹{s.fees?.balance?.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Cash Amount (₹)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-slate-50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Remarks/Message
                          </label>
                          <input
                            type="text"
                            value={cashMessage}
                            onChange={(e) => setCashMessage(e.target.value)}
                            placeholder="Received at desk"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-slate-50 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Submit Cash Payout
                      </button>
                    </form>
                  </div>
                </div>

                {/* Column 2: Edit Student Fee Breakdown */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-2">
                      Adjust Student Fee Breakdowns
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Customize tuition, term fees, or misc charges. Total fee updates automatically.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Select Student
                        </label>
                        <select
                          value={selectedStudentForBreakdown}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedStudentForBreakdown(val);
                            const matched = students.find((s) => s.id === val);
                            if (matched) {
                              setBreakdownForm({
                                monthlyTuition: matched.fees?.breakdown?.monthlyTuition || 3000,
                                yearlyTerm: matched.fees?.breakdown?.yearlyTerm || 10000,
                                extraCharges: matched.fees?.breakdown?.extraCharges || 4000,
                              });
                            }
                          }}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 outline-none"
                        >
                          <option value="">Choose student...</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} (Roll: {s.rollNo} | {s.class})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedStudentForBreakdown && (
                        <form onSubmit={handleUpdateBreakdown} className="space-y-4 animate-fade-in">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">Monthly Tuition (₹)</span>
                              <input
                                type="number"
                                value={breakdownForm.monthlyTuition}
                                onChange={(e) => setBreakdownForm({ ...breakdownForm, monthlyTuition: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">Yearly Term (₹)</span>
                              <input
                                type="number"
                                value={breakdownForm.yearlyTerm}
                                onChange={(e) => setBreakdownForm({ ...breakdownForm, yearlyTerm: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">Extra Charges (₹)</span>
                              <input
                                type="number"
                                value={breakdownForm.extraCharges}
                                onChange={(e) => setBreakdownForm({ ...breakdownForm, extraCharges: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                                required
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-700">
                            New Total Fees obligation will be: <span className="font-bold">₹{((Number(breakdownForm.monthlyTuition) * 12) + Number(breakdownForm.yearlyTerm) + Number(breakdownForm.extraCharges)).toLocaleString()}</span>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                          >
                            Update Fee Structure
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "salary" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1: Staff Payslips Ledger */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Staff Salary Payslips Ledger{" "}
                  <span className="text-sm text-slate-400 font-semibold">
                    ({salarySlips.length})
                  </span>
                </h3>
                {teachers.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No teachers registered yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Teacher</th>
                          <th className="pb-3">Base Pay</th>
                          <th className="pb-3">Allowances</th>
                          <th className="pb-3">Deductions</th>
                          <th className="pb-3">Net Payout</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {teachers.map((teacher) => {
                          const basePay = teacher.salaryDetails?.base || teacher.salary || 40000;
                          const allowances = teacher.salaryDetails?.allowances || 0;
                          const deductions = teacher.status === "Absent" ? Math.round(basePay / 30) : (teacher.salaryDetails?.deductions || 0);
                          const netPay = basePay + allowances - deductions;
                          return (
                            <tr key={teacher.id}>
                              <td className="py-3.5 font-bold text-slate-800">
                                {teacher.name}
                              </td>
                              <td className="py-3.5 font-mono">
                                ₹{basePay.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3.5 font-mono text-emerald-600">
                                +₹{allowances.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3.5 font-mono text-rose-500 font-bold">
                                -₹{deductions.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3.5 font-mono text-indigo-650 font-extrabold">
                                ₹{netPay.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedTeacherForSalary(teacher.id);
                                    setSalaryControlForm({
                                      base: basePay,
                                      allowances: allowances,
                                      deductions: deductions
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold rounded-lg text-[10px] transition-all"
                                >
                                  Configure Payout
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Column 2: Configure & Disburse Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-2">
                  Configure & Disburse Salary
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Select a teacher from the roster to customize base pay, allowances, and deductions before disbursing.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Select Faculty
                    </label>
                    <select
                      value={selectedTeacherForSalary}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTeacherForSalary(val);
                        const matched = teachers.find((t) => t.id === val);
                        if (matched) {
                          setSalaryControlForm({
                            base: matched.salaryDetails?.base || matched.salary || 40000,
                            allowances: matched.salaryDetails?.allowances || 0,
                            deductions: matched.status === "Absent" ? Math.round((matched.salaryDetails?.base || matched.salary || 40000) / 30) : (matched.salaryDetails?.deductions || 0),
                          });
                        }
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 outline-none"
                    >
                      <option value="">Choose teacher...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTeacherForSalary && (() => {
                    const teacher = teachers.find((t) => t.id === selectedTeacherForSalary);
                    if (!teacher) return null;
                    const calculatedNet = Number(salaryControlForm.base || 0) + Number(salaryControlForm.allowances || 0) - Number(salaryControlForm.deductions || 0);
                    return (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Base Pay (₹)
                          </label>
                          <input
                            type="number"
                            value={salaryControlForm.base}
                            onChange={(e) => setSalaryControlForm({ ...salaryControlForm, base: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Allowances (₹)
                          </label>
                          <input
                            type="number"
                            value={salaryControlForm.allowances}
                            onChange={(e) => setSalaryControlForm({ ...salaryControlForm, allowances: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Deductions (₹)
                          </label>
                          <input
                            type="number"
                            value={salaryControlForm.deductions}
                            onChange={(e) => setSalaryControlForm({ ...salaryControlForm, deductions: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                            required
                          />
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700">
                          Disbursement Net Payout: <span className="font-extrabold">₹{calculatedNet.toLocaleString()}</span>
                        </div>

                        <button
                          onClick={() => handleDisburseCustomSalary(teacher)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Disburse June Salary
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── NOTICES ── */}
          {activeTab === "notices" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Broadcast New Notice
                </h3>
                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Notice Title
                    </label>
                    <input
                      type="text"
                      value={noticeForm.title}
                      onChange={(e) =>
                        setNoticeForm({ ...noticeForm, title: e.target.value })
                      }
                      placeholder="Holiday Announcement"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={noticeForm.audience}
                      onChange={(e) =>
                        setNoticeForm({
                          ...noticeForm,
                          audience: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    >
                      <option value="All">All</option>
                      <option value="Teachers">Only Faculty</option>
                      <option value="Parents">Parents & Students</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Notice Body
                    </label>
                    <textarea
                      rows="4"
                      value={noticeForm.content}
                      onChange={(e) =>
                        setNoticeForm({
                          ...noticeForm,
                          content: e.target.value,
                        })
                      }
                      placeholder="Details..."
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5"
                  >
                    <Megaphone className="w-4 h-4" /> Broadcast
                  </button>
                </form>
              </div>
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Active Notices
                </h3>
                {notices.length === 0 && (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No notices yet.
                  </p>
                )}
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                  {notices.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-800 text-sm">
                          {n.title}
                        </h4>
                        <div className="flex gap-2 text-[8px] font-bold">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase">
                            {n.audience}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded">
                            {n.date}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed mt-2">
                        {n.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TIMETABLE ── FIX 12: per-class ── */}
          {activeTab === "timetable" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  {editingBlock ? "Modify Timetable Block" : "Create Timetable Schedule"}
                </h3>
                <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-850 mb-1.5">
                      First Class Start Hour (e.g. 8 or 10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={timetableStartHour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 8;
                        setTimetableStartHour(val);
                        const mockDb = getMockDb();
                        mockDb.timetableStartHour = val;
                        saveMockDb(mockDb);
                        triggerNotification(`Timetable start hour updated to ${val}:00!`);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white font-bold text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-850 mb-1.5">
                      Class Duration (Period Length)
                    </label>
                    <select
                      value={timetablePeriodDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 60;
                        setTimetablePeriodDuration(val);
                        const mockDb = getMockDb();
                        mockDb.timetablePeriodDuration = val;
                        saveMockDb(mockDb);
                        triggerNotification(`Class duration updated to ${val} minutes!`);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white font-bold text-slate-850"
                    >
                      <option value="45">45 Minutes</option>
                      <option value="60">1 Hour (60 Min)</option>
                      <option value="30">30 Minutes</option>
                      <option value="50">50 Minutes</option>
                      <option value="90">1.5 Hours (90 Min)</option>
                    </select>
                  </div>
                </div>
                <form onSubmit={handleAddTimetablePeriod} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Class
                    </label>
                    <select
                      value={timetableClass}
                      onChange={(e) => {
                        setTimetableClass(e.target.value);
                        setTimetableForm({
                          ...timetableForm,
                          className: e.target.value,
                        });
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      {ALL_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Section
                    </label>
                    <select
                      value={timetableSection}
                      onChange={(e) => {
                        setTimetableSection(e.target.value);
                        setTimetableForm({
                          ...timetableForm,
                          section: e.target.value,
                        });
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Day
                    </label>
                    <select
                      value={timetableForm.day}
                      onChange={(e) =>
                        setTimetableForm({
                          ...timetableForm,
                          day: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Period Slot
                    </label>
                    <select
                      value={timetableForm.period}
                      onChange={(e) =>
                        setTimetableForm({
                          ...timetableForm,
                          period: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"].map(
                        (p) => (
                          <option key={p} value={p}>
                            {p} Period
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={timetableForm.subject}
                      onChange={(e) =>
                        setTimetableForm({
                          ...timetableForm,
                          subject: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Assign Teacher
                    </label>
                    <select
                      value={timetableForm.teacherName}
                      onChange={(e) =>
                        setTimetableForm({
                          ...timetableForm,
                          teacherName: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50"
                    >
                      <option value="">Select Faculty...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.subject})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                  >
                    {editingBlock ? "Update Timetable Block" : "Save Timetable Block"}
                  </button>
                  {editingBlock && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBlock(null);
                        setTimetableForm({
                          ...timetableForm,
                          subject: "",
                          teacherName: "",
                        });
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs mt-2"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h3 className="text-base font-extrabold text-slate-800">
                    Weekly Schedule for {timetableClass} - Section {timetableSection}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyMondaySchedule}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>📋 Copy Monday to All Days</span>
                  </button>
                </div>
                {classTimetable.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No periods scheduled for {timetableClass} - Section {timetableSection} yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-4 px-4 font-extrabold text-slate-800 border-r border-slate-200">Day</th>
                          {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"].map((p) => {
                            const timeStr = getPeriodTime(p, timetableStartHour, timetablePeriodDuration);
                            return (
                              <th key={p} className="py-4 px-3 text-center border-r border-slate-200 last:border-r-0 min-w-[140px]">
                                <span className="block text-indigo-650 font-black">{p}</span>
                                <span className="block text-[9px] text-slate-400 font-normal mt-0.5 normal-case font-mono">{timeStr}</span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                          <tr key={day} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-4 text-xs font-black text-slate-700 bg-slate-50/40 border-r border-slate-200">
                              {day}
                            </td>
                            {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"].map((p) => {
                              const slotData = classTimetable.find(
                                (t) => t.day === day && t.period === p
                              );
                              return (
                                <td key={p} className="p-2 border-r border-slate-100 last:border-r-0 text-center vertical-align-middle">
                                  {slotData ? (
                                    <div
                                      onClick={() => {
                                        setEditingBlock({ day, period: p });
                                        setTimetableForm({
                                          className: timetableClass,
                                          section: timetableSection,
                                          day: day,
                                          period: p,
                                          subject: slotData.subject,
                                          teacherName: slotData.teacherName === "Not Assigned" ? "" : slotData.teacherName,
                                        });
                                      }}
                                      className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-left relative group hover:scale-[1.02] hover:bg-indigo-50/90 transition-all cursor-pointer hover:border-indigo-400"
                                      title="Click to Edit"
                                    >
                                      <span className="font-extrabold text-indigo-700 text-[11px] block truncate" title={slotData.subject}>
                                        {slotData.subject}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block mt-1 truncate" title={slotData.teacherName}>
                                        👤 {slotData.teacherName}
                                      </span>
                                      <span className="text-[9px] text-indigo-500 font-mono block mt-0.5">
                                        ⏱ {getPeriodTime(p, timetableStartHour, timetablePeriodDuration).split(" - ")[0]}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTimetablePeriod(day, p);
                                        }}
                                        className="mt-2 text-[9px] text-rose-600 hover:text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity block w-full text-center py-0.5 bg-rose-50 rounded border border-rose-100"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-300 italic">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EXAMS ── FIX 9: persisted ── */}
          {activeTab === "exams" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Schedule Exam Datesheet
                </h3>
                <form onSubmit={handleAddExam} className="space-y-4">
                  {[
                    { label: "Exam Name", key: "examName", type: "text" },
                    { label: "Subject", key: "subject", type: "text" },
                    { label: "Exam Date", key: "examDate", type: "date" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={examForm[f.key]}
                        onChange={(e) =>
                          setExamForm({ ...examForm, [f.key]: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    Schedule Exam
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-4">
                    Scheduled Exams
                  </h3>
                  {examsList.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs">
                      No exams scheduled yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {examsList.map((ex) => (
                        <div
                          key={ex.id}
                          className="p-4 border border-slate-100 rounded-2xl text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                              {ex.examName}
                            </span>
                            <h4 className="font-extrabold text-slate-800 mt-1">
                              {ex.subject}
                            </h4>
                          </div>
                          <span className="font-mono text-slate-500 font-bold">
                            {ex.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-base font-extrabold text-slate-800 mb-4">
                    Pass / Fail Analytics
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-3">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Total Students:</span>
                      <span className="font-black text-slate-800">
                        {students.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600 font-semibold">
                      <span>Passed (CGPA &gt; 5.0):</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  School Configuration
                </h3>
                {[
                  { label: "School Name", key: "name", type: "text" },
                  { label: "Address", key: "address", type: "text" },
                  { label: "Contact Email", key: "email", type: "email" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={schoolInfo[f.key]}
                      onChange={(e) =>
                        setSchoolInfo({
                          ...schoolInfo,
                          [f.key]: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-slate-50 outline-none"
                    />
                  </div>
                ))}
                <button
                  onClick={() => triggerNotification("School profile saved!")}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl mt-6"
                >
                  Save Configuration
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-800 mb-4">
                    Academic Year
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700">
                    Active Session: 2026 – 2027
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-800 mb-2">
                    Notification Channels
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Manage SMS, Email, WhatsApp dispatch.
                  </p>
                  <div className="space-y-3">
                    {[
                      { key: "sms", label: "SMS Alerts (Twilio)" },
                      { key: "email", label: "Email Digests (SendGrid)" },
                      { key: "whatsapp", label: "WhatsApp (Meta Cloud API)" },
                    ].map((ch) => (
                      <label
                        key={ch.key}
                        className="flex items-center gap-3 text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={settingsAlerts[ch.key]}
                          onChange={(e) =>
                            setSettingsAlerts({
                              ...settingsAlerts,
                              [ch.key]: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300 w-4 h-4"
                        />
                        {ch.label}
                      </label>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={handleSendTestNotification}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl"
                    >
                      Send Test Alert
                    </button>
                    <button
                      onClick={() =>
                        setSimulatedLogs(["[System] Logs cleared."])
                      }
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-3">
                    Dispatch Pipeline Logs
                  </h3>
                  <div className="bg-slate-950 p-4 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1.5 max-h-[180px] overflow-y-auto border border-slate-900">
                    {simulatedLogs.map((log, i) => (
                      <div
                        key={i}
                        className="leading-relaxed pb-1 border-b border-slate-900/60 last:border-0"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── APPROVALS ── */}
          {activeTab === "approvals" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-extrabold text-slate-800 mb-4">
                  Teacher Leave Requests
                </h3>
                <div className="space-y-4 flex-1">
                  {leaveRequests.length === 0 && (
                    <p className="text-center py-8 text-slate-400 text-xs">
                      No pending leaves.
                    </p>
                  )}
                  {leaveRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">
                            {req.teacherName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Duration: {req.days} | {req.reason}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${req.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.status === "Pending" && (
                        <div className="flex gap-2 justify-end mt-4">
                          <button
                            onClick={() =>
                              handleLeaveDecision(req.id, "Approved")
                            }
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleLeaveDecision(req.id, "Rejected")
                            }
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-extrabold text-slate-800 mb-2">
                  Student Fee Payment Requests
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Verify bank transfers/UPI details and UTR transaction numbers to approve fee deductions.
                </p>
                <div className="space-y-4 flex-1 max-h-[350px] overflow-y-auto pr-1">
                  {feePaymentRequests.filter((r) => r.status === "Pending").length === 0 && (
                    <p className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No pending payment verification requests.
                    </p>
                  )}
                  {feePaymentRequests.filter((r) => r.status === "Pending").map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-850">
                            {req.studentName}
                          </h4>
                          <span className="text-[10px] text-slate-450 font-bold block mt-0.5">
                            Class {req.class} | Date: {req.paymentDate}
                          </span>
                        </div>
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-1 text-[11px] bg-slate-100/40 p-2.5 rounded-xl border border-slate-200/40">
                        <span className="text-slate-450">Amount Sent:</span>
                        <span className="font-extrabold text-slate-800 text-right">₹{req.amountPaid.toLocaleString()}</span>

                        <span className="text-slate-450">UTR / Txn ID:</span>
                        <span className="font-mono font-bold text-indigo-600 text-right">{req.transactionId}</span>
                      </div>

                      {req.message && (
                        <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100">
                          "{req.message}"
                        </p>
                      )}

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() =>
                            handlePaymentRequestDecision(
                              req.id,
                              "Approved",
                              req.amountPaid,
                              req.studentId,
                            )
                          }
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-xs shadow-sm shadow-emerald-650/10 transition-all"
                        >
                          Approve Payment
                        </button>
                        <button
                          onClick={() =>
                            handlePaymentRequestDecision(
                              req.id,
                              "Rejected",
                              req.amountPaid,
                              req.studentId,
                            )
                          }
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 font-bold text-xs transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* History Log section inside approvals hub */}
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-4">
                    Resolved Payments Log
                  </h3>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {feePaymentRequests.filter((r) => r.status !== "Pending").map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-700 block">
                            {req.studentName} (₹{req.amountPaid.toLocaleString()})
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            UTR: {req.transactionId} | Date: {req.paymentDate}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${req.status === "Approved"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                    {feePaymentRequests.filter((r) => r.status !== "Pending").length === 0 && (
                      <p className="text-center py-6 text-slate-400 text-xs">
                        No payment requests processed yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── CREDENTIALS MODAL ── */}
        {showCredentialsModal && credentialsData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
              <h2 className="text-lg font-extrabold text-slate-800 mb-4">
                {credentialsData.type === "student"
                  ? "Student Login Credentials"
                  : "Teacher Login Credentials"}
              </h2>

              <div className="space-y-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Name
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {credentialsData.name}
                  </p>
                </div>

                {credentialsData.type === "student" && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Roll Number
                    </p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {credentialsData.rollNo}
                    </p>
                  </div>
                )}

                {credentialsData.type === "teacher" && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Subject
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {credentialsData.subject}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Email (Login)
                  </p>
                  <p className="text-sm font-bold text-slate-800 font-mono">
                    {credentialsData.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Password
                  </p>
                  <p className="text-sm font-bold text-slate-800 font-mono bg-indigo-50 p-2 rounded border border-indigo-200">
                    {credentialsData.password}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                <p className="text-xs text-amber-800 font-semibold">
                  ⚠️ Important: Share these credentials with the{" "}
                  {credentialsData.type === "student"
                    ? "student/parent"
                    : "teacher"}
                  . They can login at the LoginPage using email and password.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const text = `${credentialsData.type === "student" ? "Student" : "Teacher"} Credentials:\nName: ${credentialsData.name}\nEmail: ${credentialsData.email}\nPassword: ${credentialsData.password}`;
                    navigator.clipboard.writeText(text);
                    alert("Credentials copied to clipboard!");
                  }}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Copy Credentials
                </button>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Detailed Student Modal */}
        {selectedStudentForModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-4xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-8">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-850">
                    {selectedStudentForModal.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Roll Number: {selectedStudentForModal.rollNo} | {selectedStudentForModal.class} - {selectedStudentForModal.section}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentForModal(null)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Grid Layout of Info Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 1: Personal Details */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b pb-2">
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Father's Name</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.fatherName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Father's Mobile</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudentForModal.fatherMobile || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Mother's Name</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.motherName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Mother's Mobile</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudentForModal.motherMobile || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Aadhar Number</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudentForModal.aadharNo || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Date of Birth</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.dob || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Gender</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.gender || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Blood Group</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.bloodGroup || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Residential Address</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.address || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Attendance details */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                      Attendance Roster
                    </h4>
                    <span className="text-xs font-black text-indigo-600">
                      Overall: {selectedStudentForModal.overallAttendance || 100}%
                    </span>
                  </div>

                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {(!selectedStudentForModal.attendanceHistory || selectedStudentForModal.attendanceHistory.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-4">No attendance marked yet.</p>
                    ) : (
                      selectedStudentForModal.attendanceHistory.map((h, i) => (
                        <div key={i} className="flex justify-between text-xs bg-white p-2 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-650">{h.date}</span>
                          <span className={`font-bold uppercase ${h.status === "Present" ? "text-emerald-600" : "text-rose-600"}`}>
                            {h.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Results and Fee status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 3: Grades/Results */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b pb-2">
                    Academic Reports
                  </h4>
                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                    {(!selectedStudentForModal.marks || selectedStudentForModal.marks.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-4">No exams recorded yet.</p>
                    ) : (
                      selectedStudentForModal.marks.map((m, i) => (
                        <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-800">{m.subject}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-bold uppercase">{m.exam}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-800">{m.marksObtained}/{m.maxMarks}</span>
                            <span className="text-[10px] text-indigo-500 font-bold block">
                              {Math.round((m.marksObtained / m.maxMarks) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 4: Fees Details */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b pb-2">
                    Accounts Ledgers
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-white p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Fees</span>
                      <span className="font-black text-slate-800 text-sm">₹{selectedStudentForModal.fees?.total?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Paid Amount</span>
                      <span className="font-black text-emerald-600 text-sm">₹{selectedStudentForModal.fees?.paid?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Balance</span>
                      <span className={`font-black text-sm ${selectedStudentForModal.fees?.balance > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                        ₹{selectedStudentForModal.fees?.balance?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Date</span>
                      <span className="font-semibold text-slate-800">{selectedStudentForModal.fees?.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handlePromoteClass(selectedStudentForModal.id)}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Promote Class
                </button>
                <button
                  onClick={() => {
                    handleIssueTC(selectedStudentForModal.id);
                    setSelectedStudentForModal(null);
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all"
                >
                  Issue Transfer Certificate (TC)
                </button>
                <button
                  onClick={() => setSelectedStudentForModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Close Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
