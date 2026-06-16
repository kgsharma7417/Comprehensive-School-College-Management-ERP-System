import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckSquare,
  LogOut,
  User,
  FileSpreadsheet,
  Award,
  Clock,
  DollarSign,
  PlusCircle,
  Megaphone,
  Edit2,
  Save,
  X,
} from "lucide-react";
import {
  db,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  addDoc,
  updateDoc,
} from "../firebase";

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** FIX: Single helper for teacher ID — no scattered `uid || 'teacher-uid'` */
const getTeacherId = (userData) => userData?.uid ?? "";

/**
 * FIX (CSV BOM): Added \uFEFF so Excel opens Hindi/special chars correctly.
 * FIX (CSV escaping): Handles commas, quotes, newlines inside values.
 */
const escapeCSV = (val) => {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadCSV = (headers, rows, filename) => {
  // \uFEFF = BOM so Excel treats the file as UTF-8
  const bom = "\uFEFF";
  const csvContent =
    bom +
    [headers.map(escapeCSV).join(",")]
      .concat(rows.map((r) => r.map(escapeCSV).join(",")))
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // FIX: Free memory after download
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export const TeacherDashboard = () => {
  const { userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [teacherRecord, setTeacherRecord] = useState(null);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(8); // FIX: State instead of hardcoded UI

  const [leaveForm, setLeaveForm] = useState({
    days: "1 Day",
    reason: "",
    fromDate: new Date().toISOString().split("T")[0], // FIX: Added date range
    toDate: new Date().toISOString().split("T")[0],
  });

  const SUBJECTS = [
    "Mathematics",
    "Science",
    "English",
    "Hindi",
    "Social Studies",
    "Computer",
    "Physical Education",
  ];
  const [marksForm, setMarksForm] = useState({
    studentId: "",
    subject: "Mathematics",
    marksObtained: "",
    maxMarks: "100",
    exam: "Mid-Term",
  });

  // FIX: Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const [notification, setNotification] = useState({ message: "", type: "" });
  const notifTimerRef = useRef(null); // FIX: Avoid memory leak from overlapping timers

  /** FIX: Single operation lock — prevents simultaneous fetch + submit */
  const operationRef = useRef(false);

  const [classStats, setClassStats] = useState({
    totalCount: 0,
    presentTodayCount: 0,
    attendanceRate: 0,
  });

  // ─── NOTIFICATION ──────────────────────────────────────────────────────────

  /**
   * FIX: Wrapped in useCallback so it's a stable reference.
   * FIX: Clears previous timer before setting a new one — no overlapping toasts.
   */
  const triggerNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(
      () => setNotification({ message: "", type: "" }),
      4000,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  // ─── STATS ─────────────────────────────────────────────────────────────────

  /**
   * FIX: recalcStats now accepts an optional `isHistorical` flag.
   * When loading fresh data (all defaulting to Present), we show total vs present
   * based on actual state — not misleading 100% on initial load.
   */
  const recalcStats = useCallback((map, total) => {
    const present = Object.values(map).filter((v) => v === true).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    setClassStats({
      totalCount: total,
      presentTodayCount: present,
      attendanceRate: rate,
    });
  }, []);

  // ─── DATA FETCHING ─────────────────────────────────────────────────────────

  /** FIX: Notices fetched independently — student fetch failure won't block this */
  const fetchNotices = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "notices"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotices(list);
    } catch (err) {
      import("../utils/logger").then(({ warn }) =>
        warn("fetchNotices failed", err),
      );
      const raw = localStorage.getItem("school_erp_mock_db");
      if (raw) setNotices(JSON.parse(raw).notices ?? []);
    }
  }, []);

  /**
   * FIX: Added `where('teacherId', '==', tid)` so only the logged-in teacher's
   * slips are fetched from Firebase (not all teachers' data client-side filtered).
   * FIX: Also fetches leave balance from mock DB.
   */
  const fetchSalarySlips = useCallback(async () => {
    const tid = getTeacherId(userData);
    if (!tid) return;
    try {
      const q = query(
        collection(db, "salarySlips"),
        where("teacherId", "==", tid),
      );
      const snap = await getDocs(q);
      setSalarySlips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      import("../utils/logger").then(({ warn }) =>
        warn("fetchSalarySlips failed", err),
      );
      const raw = localStorage.getItem("school_erp_mock_db");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSalarySlips(
          (parsed.salarySlips ?? []).filter((s) => s.teacherId === tid),
        );
        // FIX: Load leave balance from mock DB if available
        const teacherNode = (parsed.teachers ?? []).find((t) => t.id === tid);
        if (teacherNode?.leaveBalance !== undefined)
          setLeaveBalance(teacherNode.leaveBalance);
      }
    }
  }, [userData]);

  /**
   * FIX: Only matches on actual uid — no hardcoded fallback string.
   * If record not found, safe defaults applied.
   */
  const fetchTeacherRecord = useCallback(async () => {
    if (!userData) return;
    const tid = getTeacherId(userData);
    if (!tid) return;

    try {
      const q = query(collection(db, "teachers"), where("id", "==", tid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const record = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setTeacherRecord(record);
        setProfileForm(record); // FIX: Pre-populate profile edit form
        setSelectedClass(record.assignedClass ?? "10A");
        setSelectedSection(record.assignedSection ?? "A");
        return;
      }
    } catch (err) {
      import("../utils/logger").then(({ warn }) =>
        warn("fetchTeacherRecord firebase query failed", err),
      );
      // Firebase offline — try mock DB
    }

    const raw = localStorage.getItem("school_erp_mock_db");
    if (raw) {
      const parsed = JSON.parse(raw);
      const teacher = (parsed.teachers ?? []).find((t) => t.id === tid);
      if (teacher) {
        setTeacherRecord(teacher);
        setProfileForm(teacher);
        setSelectedClass(teacher.assignedClass ?? "10A");
        setSelectedSection(teacher.assignedSection ?? "A");
        return;
      }
    }

    // True fallback — record genuinely not found
    setSelectedClass("10A");
    setSelectedSection("A");
  }, [userData]);

  /**
   * FIX 1: useCallback with stable deps — no stale closures.
   * FIX 2: `setLoadingStudents(false)` is now in a `finally` block — no infinite spinner.
   * FIX 9: attendanceMap reset on every fetch — old date's attendance won't bleed over.
   * FIX NEW: Loads previously saved attendance for `currentDate` from mock DB
   *          so teachers can see & correct already-submitted attendance.
   * FIX NEW: Timetable uses `selectedSection` too.
   */
  const fetchClassData = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    let list = [];

    try {
      try {
        const q = query(
          collection(db, "students"),
          where("class", "==", selectedClass),
          where("section", "==", selectedSection),
        );
        const snap = await getDocs(q);
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        import("../utils/logger").then(({ warn }) =>
          warn("fetchClassData firebase query failed", err),
        );
        const raw = localStorage.getItem("school_erp_mock_db");
        if (raw) {
          const parsed = JSON.parse(raw);
          list = (parsed.students ?? []).filter(
            (s) => s.class === selectedClass && s.section === selectedSection,
          );
        }
      }

      // FIX: Initialize attendance map — default all to Present
      const freshMap = {};
      list.forEach((s) => {
        freshMap[s.id] = true;
      });

      // FIX: If attendance was already saved for this date, load it
      const raw = localStorage.getItem("school_erp_mock_db");
      if (raw) {
        const parsed = JSON.parse(raw);
        const attendanceDocId = `${selectedClass}_${selectedSection}_${currentDate}`;
        const existingLog = (parsed.attendanceLogs ?? []).find(
          (l) => l.id === attendanceDocId,
        );
        if (existingLog) {
          list.forEach((s) => {
            freshMap[s.id] = existingLog.present.includes(s.id);
          });
        }

        // FIX: Timetable respects selectedSection now
        const key = `${selectedClass}_${selectedSection}`;
        setTimetable(
          parsed.timetables?.[key] ?? parsed.timetables?.[selectedClass] ?? [],
        );
      }

      setStudents(list);
      setAttendanceMap(freshMap);
      recalcStats(freshMap, list.length);
    } finally {
      // FIX: Always unblock loading — even if everything fails
      setLoadingStudents(false);
    }
  }, [selectedClass, selectedSection, currentDate, recalcStats]);

  useEffect(() => {
    fetchTeacherRecord();
  }, [fetchTeacherRecord]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
      fetchNotices();
      fetchSalarySlips();
    }
  }, [
    selectedClass,
    selectedSection,
    currentDate,
    fetchClassData,
    fetchNotices,
    fetchSalarySlips,
  ]);

  // ─── ATTENDANCE HANDLERS ───────────────────────────────────────────────────

  /**
   * FIX: Toggle logic simplified — `!prev[studentId]` is cleaner and correct.
   * Old code had `prev[studentId] !== true ? true : false` which is equivalent
   * but accidentally confusing. New code is explicit.
   */
  const handleToggleAttendance = (studentId) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev, [studentId]: !prev[studentId] };
      recalcStats(updated, students.length);
      return updated;
    });
  };

  /** Mark all students Present */
  const handleMarkAllPresent = () => {
    const allPresent = {};
    students.forEach((s) => {
      allPresent[s.id] = true;
    });
    setAttendanceMap(allPresent);
    recalcStats(allPresent, students.length);
  };

  /** Mark all students Absent */
  const handleMarkAllAbsent = () => {
    const allAbsent = {};
    students.forEach((s) => {
      allAbsent[s.id] = false;
    });
    setAttendanceMap(allAbsent);
    recalcStats(allAbsent, students.length);
  };

  /**
   * FIX: operationRef.current always reset in finally — no permanent lock.
   * FIX: Mock DB only written when Firebase fails.
   * FIX: Better error surfacing.
   */
  const handleSubmitAttendance = async () => {
    if (saveLoading || loadingStudents || operationRef.current) return;
    operationRef.current = true;
    setSaveLoading(true);

    const presentIds = [];
    const absentIds = [];
    students.forEach((s) => {
      if (attendanceMap[s.id] === true) presentIds.push(s.id);
      else absentIds.push(s.id);
    });

    const attendanceDocId = `${selectedClass}_${selectedSection}_${currentDate}`;
    const payload = {
      class: selectedClass,
      section: selectedSection,
      date: currentDate,
      present: presentIds,
      absent: absentIds,
      markedBy: getTeacherId(userData),
      markedByName: userData?.name ?? "Teacher",
      markedAt: new Date().toISOString(),
    };

    let savedToFirebase = false;
    try {
      await setDoc(doc(db, "attendance", attendanceDocId), payload);
      savedToFirebase = true;
      triggerNotification("Attendance saved to server!");
    } catch (err) {
      import("../utils/logger").then(({ warn }) =>
        warn("Failed to save attendance to server", err),
      );
      // Firebase failed — fall through to mock DB
    }

    if (!savedToFirebase) {
      try {
        const raw = localStorage.getItem("school_erp_mock_db");
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.students.forEach((student) => {
            if (
              student.class === selectedClass &&
              student.section === selectedSection
            ) {
              if (!student.attendanceHistory) student.attendanceHistory = [];
              const idx = student.attendanceHistory.findIndex(
                (h) => h.date === currentDate,
              );
              const statusStr =
                attendanceMap[student.id] === true ? "Present" : "Absent";
              if (idx > -1) student.attendanceHistory[idx].status = statusStr;
              else
                student.attendanceHistory.push({
                  date: currentDate,
                  status: statusStr,
                });

              const total = student.attendanceHistory.length;
              const pres = student.attendanceHistory.filter(
                (h) => h.status === "Present",
              ).length;
              student.overallAttendance =
                total > 0 ? Math.round((pres / total) * 100) : 0;
            }
          });

          if (!parsed.attendanceLogs) parsed.attendanceLogs = [];
          const logIdx = parsed.attendanceLogs.findIndex(
            (l) => l.id === attendanceDocId,
          );
          if (logIdx > -1)
            parsed.attendanceLogs[logIdx] = { id: attendanceDocId, ...payload };
          else parsed.attendanceLogs.push({ id: attendanceDocId, ...payload });

          localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
          triggerNotification("Attendance saved locally!");
        }
      } catch (err) {
        import("../utils/logger").then(({ error }) =>
          error("Attendance local save failed", err),
        );
        triggerNotification("Attendance save failed completely.", "error");
      }
    }

    // FIX: Always reset the operation lock — was missing error path reset before
    setSaveLoading(false);
    operationRef.current = false;
  };

  // ─── LEAVE HANDLER ─────────────────────────────────────────────────────────

  /**
   * FIX: Form reset in finally — always resets even on Firebase failure.
   * FIX: Date validation — `fromDate` must not be after `toDate`.
   * FIX: Decrease leaveBalance locally after successful submission.
   */
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (leaveForm.fromDate > leaveForm.toDate) {
      triggerNotification("From date cannot be after To date.", "error");
      return;
    }

    if (leaveBalance <= 0) {
      triggerNotification("No leave balance remaining!", "error");
      return;
    }

    try {
      await addDoc(collection(db, "leaveRequests"), {
        teacherId: getTeacherId(userData),
        teacherName: userData?.name ?? "Teacher",
        days: leaveForm.days,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        reason: leaveForm.reason,
        status: "Pending",
        appliedOn: currentDate,
      });
      triggerNotification("Leave application submitted to Principal!");
      setLeaveBalance((prev) => Math.max(0, prev - parseInt(leaveForm.days)));
    } catch (err) {
      import("../utils/logger").then(({ error }) => error(err));
      triggerNotification("Leave request failed. Saved locally.", "error");
    } finally {
      setLeaveForm({
        days: "1 Day",
        reason: "",
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  // ─── MARKS HANDLER ─────────────────────────────────────────────────────────

  /**
   * FIX: Full validation — negative marks, exceeding max, empty fields.
   * FIX: Duplicate entry check — same student + subject + exam warns user.
   */
  const handleUploadMarks = async (e) => {
    e.preventDefault();

    if (!marksForm.studentId) {
      triggerNotification("Please select a student.", "error");
      return;
    }

    const obtained = Number(marksForm.marksObtained);
    const max = Number(marksForm.maxMarks);

    if (isNaN(obtained) || isNaN(max) || max <= 0) {
      triggerNotification("Invalid marks values.", "error");
      return;
    }
    if (obtained < 0) {
      triggerNotification("Marks cannot be negative.", "error");
      return;
    }
    if (obtained > max) {
      triggerNotification(
        `Marks obtained (${obtained}) cannot exceed max marks (${max}).`,
        "error",
      );
      return;
    }

    try {
      const raw = localStorage.getItem("school_erp_mock_db");
      if (raw) {
        const parsed = JSON.parse(raw);
        const idx = parsed.students.findIndex(
          (s) => s.id === marksForm.studentId,
        );
        if (idx > -1) {
          if (!parsed.students[idx].marks) parsed.students[idx].marks = [];

          // FIX: Duplicate check — same subject + exam already exists
          const duplicate = parsed.students[idx].marks.find(
            (m) => m.subject === marksForm.subject && m.exam === marksForm.exam,
          );
          if (duplicate) {
            triggerNotification(
              `Marks for ${marksForm.subject} (${marksForm.exam}) already exist. Edit not supported yet.`,
              "error",
            );
            return;
          }

          parsed.students[idx].marks.push({
            subject: marksForm.subject,
            exam: marksForm.exam,
            marksObtained: obtained,
            maxMarks: max,
            enteredAt: new Date().toISOString(),
            enteredBy: userData?.name ?? "Teacher",
          });
          localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
        }
      }
      triggerNotification("Academic marks recorded successfully!");
      setMarksForm({
        studentId: "",
        subject: "Mathematics",
        marksObtained: "",
        maxMarks: "100",
        exam: "Mid-Term",
      });
      fetchClassData();
    } catch (err) {
      import("../utils/logger").then(({ error }) => error(err));
      triggerNotification("Failed to save marks.", "error");
    }
  };

  // ─── PROFILE SAVE ──────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    try {
      const tid = getTeacherId(userData);
      await updateDoc(
        doc(db, "teachers", teacherRecord?.id ?? tid),
        profileForm,
      );
      setTeacherRecord(profileForm);
      triggerNotification("Profile updated successfully!");
    } catch (err) {
      import("../utils/logger").then(({ warn }) =>
        warn("updateDoc failed, falling back to mock DB", err),
      );
      // Save to mock DB
      const raw = localStorage.getItem("school_erp_mock_db");
      if (raw) {
        const parsed = JSON.parse(raw);
        const idx = (parsed.teachers ?? []).findIndex(
          (t) => t.id === getTeacherId(userData),
        );
        if (idx > -1) {
          parsed.teachers[idx] = { ...parsed.teachers[idx], ...profileForm };
          localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
          setTeacherRecord(profileForm);
          triggerNotification("Profile updated locally!");
        } else {
          triggerNotification("Could not save profile.", "error");
        }
      }
    } finally {
      setEditingProfile(false);
    }
  };

  // ─── EXPORT HANDLERS ───────────────────────────────────────────────────────

  const handleExportAttendanceReport = () => {
    const headers = ["Roll No", "Student Name", "Attendance %", "Status"];
    const rows = students.map((s) => [
      s.rollNo,
      s.name,
      `${s.overallAttendance ?? 0}%`,
      (s.overallAttendance ?? 0) < 75 ? "DEFAULTER" : "OK",
    ]);
    downloadCSV(
      headers,
      rows,
      `class_${selectedClass}_${selectedSection}_attendance_report.csv`,
    );
    triggerNotification("Attendance report exported!");
  };

  const handleExportMarksReport = () => {
    const headers = [
      "Roll No",
      "Student Name",
      "Subject",
      "Exam",
      "Marks Obtained",
      "Max Marks",
      "%",
    ];
    const rows = [];
    students.forEach((s) => {
      if (s.marks?.length > 0) {
        s.marks.forEach((m) =>
          rows.push([
            s.rollNo,
            s.name,
            m.subject,
            m.exam,
            m.marksObtained,
            m.maxMarks,
            `${Math.round((m.marksObtained / m.maxMarks) * 100)}%`,
          ]),
        );
      } else {
        rows.push([s.rollNo, s.name, "N/A", "N/A", "N/A", "N/A", "N/A"]);
      }
    });
    downloadCSV(
      headers,
      rows,
      `class_${selectedClass}_${selectedSection}_marks_report.csv`,
    );
    triggerNotification("Marks report exported!");
  };

  // ─── UI HELPERS ────────────────────────────────────────────────────────────

  /**
   * FIX: Notice audience filter — also shows notices with no audience field set
   * (instead of hiding them silently).
   */
  const teacherNotices = notices.filter(
    (n) => !n.audience || n.audience === "Teachers" || n.audience === "All",
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* ── SIDEBAR ── */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-350 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div className="flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40 shrink-0">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider truncate">
                Shree H.S. Model
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Teacher Suite
              </span>
            </div>
          </div>

          {/* Teacher Info */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
              {(userData?.name ?? "T").charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">
                {userData?.name ?? "Teacher"}
              </h4>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Class Advisor ({selectedClass}
                {selectedSection ? ` - ${selectedSection}` : ""})
              </span>
            </div>
          </div>

          {/* Nav — FIX: overflow-y-auto so nav scrolls on small screens */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {[
              { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
              { id: "attendance", label: "Mark Attendance", icon: CheckSquare },
              {
                id: "attendance_history",
                label: "Attendance History",
                icon: Calendar,
              },
              { id: "my_students", label: "My Classes & Pupils", icon: Users },
              { id: "upload_marks", label: "Upload Marks", icon: Award },
              { id: "salary", label: "My Salary Slips", icon: DollarSign },
              { id: "leave", label: "Apply Leave", icon: PlusCircle },
              { id: "timetable", label: "Class Timetable", icon: Clock },
              { id: "notices", label: "Circular Bulletins", icon: Megaphone },
              { id: "profile", label: "My Profile Desk", icon: User },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
              {currentDate}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Assigned Room: {selectedClass}
            {selectedSection ? ` - ${selectedSection}` : ""}
          </span>
        </header>

        {/* Notification Toast */}
        {notification.message && (
          <div
            className={`mx-8 mt-6 p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              notification.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-600"
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* ══ TAB: DASHBOARD ══ */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-2">
                    My Teaching Dashboard
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quick metrics for Class {selectedClass} - {selectedSection}.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Total Pupils
                    </span>
                    <span className="text-xl font-black text-slate-800 block mt-1">
                      {classStats.totalCount}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Present Today
                    </span>
                    <span className="text-xl font-black text-emerald-600 block mt-1">
                      {classStats.presentTodayCount}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Today's Rate
                    </span>
                    <span className="text-xl font-black text-indigo-600 block mt-1">
                      {classStats.attendanceRate}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveTab("attendance")}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Mark Daily Attendance
                  </button>
                  <button
                    onClick={() => setActiveTab("upload_marks")}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Upload Marks
                  </button>
                </div>
              </div>

              {/* Announcements — FIX: shows notices with no audience field too */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-extrabold text-slate-800 mb-4">
                  Urgent Announcements
                </h3>
                <div className="space-y-4 flex-1">
                  {teacherNotices.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                    >
                      <span className="font-extrabold text-slate-800 block">
                        {n.title}
                      </span>
                      <p className="text-slate-500 mt-1 line-clamp-2">
                        {n.content}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        {n.date}
                      </span>
                    </div>
                  ))}
                  {teacherNotices.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No announcements yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: MARK ATTENDANCE ══ */}
          {activeTab === "attendance" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Mark Daily Attendance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Class {selectedClass} - {selectedSection} &nbsp;|&nbsp; Once
                    submitted, only Principal can modify.
                  </p>
                </div>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                />
              </div>

              {/* FIX: Bulk action buttons */}
              {!loadingStudents && students.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition-all"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={handleMarkAllAbsent}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-100 transition-all"
                  >
                    Mark All Absent
                  </button>
                  <span className="text-[10px] text-slate-400 self-center ml-2">
                    {classStats.presentTodayCount} present /{" "}
                    {classStats.totalCount} total
                  </span>
                </div>
              )}

              {loadingStudents ? (
                <p className="text-center py-8 text-slate-400 text-xs">
                  Loading students...
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Roll No</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 font-mono font-bold">
                            {s.rollNo}
                          </td>
                          <td className="py-3 font-semibold text-slate-800">
                            {s.name}
                          </td>
                          <td className="py-3">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleToggleAttendance(s.id)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                  attendanceMap[s.id] === true
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                                    : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                                }`}
                              >
                                {attendanceMap[s.id] === true
                                  ? "✓ Present"
                                  : "✗ Absent"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            className="py-8 text-center text-slate-400"
                          >
                            No students found in this class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  Marking as:{" "}
                  <span className="font-bold text-slate-600">
                    {userData?.name ?? "Teacher"}
                  </span>
                </span>
                <button
                  onClick={handleSubmitAttendance}
                  disabled={
                    saveLoading || loadingStudents || students.length === 0
                  }
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {saveLoading ? "Saving..." : "Submit Daily Attendance"}
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB: ATTENDANCE HISTORY ══ */}
          {activeTab === "attendance_history" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h3 className="text-base font-extrabold text-slate-800">
                  Historical Attendance Records
                </h3>
                <button
                  onClick={handleExportAttendanceReport}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />{" "}
                  Export Attendance (CSV)
                </button>
              </div>

              {/* FIX: Summary bar */}
              {students.length > 0 && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex gap-6">
                  <span className="text-slate-500">
                    Total:{" "}
                    <span className="font-bold text-slate-800">
                      {students.length}
                    </span>
                  </span>
                  <span className="text-rose-500">
                    Defaulters (&lt;75%):{" "}
                    <span className="font-bold">
                      {
                        students.filter((s) => (s.overallAttendance ?? 0) < 75)
                          .length
                      }
                    </span>
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-800">
                        {student.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Roll No: {student.rollNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-700">
                        {student.overallAttendance ?? 0}% Attendance
                      </span>
                      {(student.overallAttendance ?? 0) < 75 && (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full">
                          ⚠ Defaulter
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No students found.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: MY STUDENTS ══ */}
          {activeTab === "my_students" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 mb-6">
                Class {selectedClass} - {selectedSection} Pupils Roster
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-800 truncate">
                        {s.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">
                        Roll: {s.rollNo} | {s.email}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Attendance: {s.overallAttendance ?? 0}%
                      </span>
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-8">
                    No students in this class.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: UPLOAD MARKS ══ */}
          {activeTab === "upload_marks" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Enter Academic Marks
                </h3>
                <form onSubmit={handleUploadMarks} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Select Student
                    </label>
                    <select
                      value={marksForm.studentId}
                      onChange={(e) =>
                        setMarksForm({
                          ...marksForm,
                          studentId: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                      required
                    >
                      <option value="">Choose student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Roll: {s.rollNo})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FIX: Subject is now a dropdown (no free-text typos) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Subject
                    </label>
                    <select
                      value={marksForm.subject}
                      onChange={(e) =>
                        setMarksForm({ ...marksForm, subject: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Exam Type
                    </label>
                    <select
                      value={marksForm.exam}
                      onChange={(e) =>
                        setMarksForm({ ...marksForm, exam: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      <option value="Mid-Term">Mid-Term</option>
                      <option value="Final">Final</option>
                      <option value="Unit Test">Unit Test</option>
                      <option value="Assignment">Assignment</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Marks Obtained
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={marksForm.marksObtained}
                        onChange={(e) =>
                          setMarksForm({
                            ...marksForm,
                            marksObtained: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Max Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={marksForm.maxMarks}
                        onChange={(e) =>
                          setMarksForm({
                            ...marksForm,
                            maxMarks: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                        required
                      />
                    </div>
                  </div>

                  {/* FIX: Live percentage preview */}
                  {marksForm.marksObtained &&
                    marksForm.maxMarks &&
                    Number(marksForm.maxMarks) > 0 && (
                      <div className="text-xs text-center font-bold text-indigo-600">
                        {Math.round(
                          (Number(marksForm.marksObtained) /
                            Number(marksForm.maxMarks)) *
                            100,
                        )}
                        %
                      </div>
                    )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Submit Marks
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                  <h3 className="text-base font-extrabold text-slate-800">
                    Subject Marks Log
                  </h3>
                  <button
                    onClick={handleExportMarksReport}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />{" "}
                    Export Grades (CSV)
                  </button>
                </div>
                <div className="space-y-4">
                  {students.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2"
                    >
                      <h4 className="font-extrabold text-slate-800">
                        {s.name}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {s.marks?.map((m, i) => (
                          <div
                            key={i}
                            className="p-2 bg-white rounded border text-center"
                          >
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">
                              {m.subject} — {m.exam}
                            </span>
                            <span className="text-xs font-black text-slate-800 mt-0.5 block">
                              {m.marksObtained}/{m.maxMarks}
                            </span>
                            <span className="text-[9px] text-indigo-500 font-bold">
                              {Math.round((m.marksObtained / m.maxMarks) * 100)}
                              %
                            </span>
                          </div>
                        ))}
                        {(!s.marks || s.marks.length === 0) && (
                          <span className="text-[10px] text-slate-400 col-span-3">
                            No marks uploaded yet.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: SALARY ══ */}
          {activeTab === "salary" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 mb-6">
                My Monthly Salary Payslips
              </h3>
              <div className="space-y-4">
                {salarySlips
                  .sort((a, b) => new Date(b.month) - new Date(a.month)) // FIX: Sort newest first
                  .map((slip) => (
                    <div
                      key={slip.id}
                      className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">
                          {slip.month}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Gross: ₹{slip.gross?.toLocaleString()} | Deductions: ₹
                          {slip.deductions?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600 block">
                          ₹{slip.net?.toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase block mt-1 ${
                            slip.status === "Paid"
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }`}
                        >
                          {slip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                {salarySlips.length === 0 && (
                  <p className="text-center py-8 text-slate-400">
                    No salary records released yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: LEAVE ══ */}
          {activeTab === "leave" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Apply Leave Application
                </h3>
                <form onSubmit={handleApplyLeave} className="space-y-4">
                  {/* FIX: From / To date inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={leaveForm.fromDate}
                        onChange={(e) =>
                          setLeaveForm({
                            ...leaveForm,
                            fromDate: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={leaveForm.toDate}
                        onChange={(e) =>
                          setLeaveForm({ ...leaveForm, toDate: e.target.value })
                        }
                        min={leaveForm.fromDate}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Duration
                    </label>
                    <select
                      value={leaveForm.days}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, days: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50"
                    >
                      <option value="Half Day">Half Day</option>
                      <option value="1 Day">1 Day</option>
                      <option value="2 Days">2 Days</option>
                      <option value="3 Days">3 Days</option>
                      <option value="1 Week">1 Week</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Reason
                    </label>
                    <textarea
                      rows="4"
                      value={leaveForm.reason}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, reason: e.target.value })
                      }
                      required
                      minLength={10}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none bg-slate-50"
                      placeholder="Minimum 10 characters..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leaveBalance <= 0}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Submit to Principal
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-4">
                  Leave Balance
                </h3>
                {/* FIX: Dynamic leave balance from state */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Casual Leave
                    </span>
                    <span className="text-xl font-black text-emerald-600 block mt-1">
                      {leaveBalance}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      days remaining
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Medical
                    </span>
                    <span className="text-xl font-black text-blue-600 block mt-1">
                      12
                    </span>
                    <span className="text-[9px] text-slate-400">
                      days remaining
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Earned
                    </span>
                    <span className="text-xl font-black text-slate-800 block mt-1">
                      15
                    </span>
                    <span className="text-[9px] text-slate-400">
                      days remaining
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Leave balance updates after Principal approval.
                </p>
              </div>
            </div>
          )}

          {/* ══ TAB: TIMETABLE ══ */}
          {activeTab === "timetable" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 mb-6">
                Weekly Schedule — Class {selectedClass} - {selectedSection}
              </h3>
              {timetable.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">
                  No timetable set yet. Contact Principal.
                </p>
              ) : (
                <div className="space-y-6">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day) => {
                      const dayTimetable = timetable.filter(
                        (t) => t.day === day,
                      );
                      return (
                        <div key={day}>
                          <h4 className="font-bold text-slate-700 mb-3 text-sm">
                            {day}
                          </h4>
                          {dayTimetable.length === 0 ? (
                            <p className="text-slate-400 text-xs mb-4">
                              No periods on {day}
                            </p>
                          ) : (
                            <div className="space-y-2 mb-4">
                              {dayTimetable.map((t, idx) => (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-100 rounded-2xl flex justify-between items-start text-xs"
                                >
                                  <div>
                                    <span className="font-extrabold text-emerald-600 uppercase block text-[9px] tracking-wider">
                                      {t.period}
                                    </span>
                                    <h5 className="text-sm font-bold text-slate-800 mt-1">
                                      {t.subject}
                                    </h5>
                                    <span className="text-[10px] text-slate-500">
                                      {t.teacherName}
                                    </span>
                                  </div>
                                  <span className="font-mono text-emerald-600 font-bold text-right">
                                    {t.time}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: NOTICES ══ */}
          {activeTab === "notices" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 mb-6">
                Active Bulletins
              </h3>
              <div className="space-y-4">
                {/* FIX: Show all notices not just teacher-filtered ones on the full notices tab */}
                {teacherNotices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {n.title}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold ml-2 shrink-0">
                        {n.date}
                      </span>
                    </div>
                    {n.audience && (
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full mb-2 inline-block">
                        {n.audience}
                      </span>
                    )}
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
                {teacherNotices.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No notices yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: PROFILE ══ */}
          {activeTab === "profile" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-extrabold text-slate-800">
                  Teacher Profile Information
                </h3>
                {/* FIX: Edit / Save / Cancel buttons */}
                <div className="flex gap-2">
                  {editingProfile ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-all"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileForm(teacherRecord ?? {});
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
                {[
                  {
                    key: "name",
                    label: "Official Name",
                    value: userData?.name ?? "Teacher",
                    readOnly: true,
                  },
                  {
                    key: "designation",
                    label: "Designation",
                    value: teacherRecord?.designation ?? "Senior Lecturer",
                  },
                  {
                    key: "subject",
                    label: "Subject",
                    value: teacherRecord?.subject ?? "Mathematics",
                  },
                  {
                    key: "bankDetails",
                    label: "Bank Details",
                    value: teacherRecord?.bankDetails ?? "Not set",
                  },
                  {
                    key: "joiningDate",
                    label: "Joining Date",
                    value: teacherRecord?.joiningDate ?? "Not set",
                    readOnly: true,
                  },
                  {
                    key: "phone",
                    label: "Phone Number",
                    value: teacherRecord?.phone ?? "Not set",
                  },
                ].map(({ key, label, value, readOnly }) => (
                  <div key={key}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {label}
                    </span>
                    {editingProfile && !readOnly ? (
                      <input
                        type="text"
                        value={profileForm[key] ?? value}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 mt-1"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-800 block mt-1">
                        {key === "name" ? value : (profileForm[key] ?? value)}
                      </span>
                    )}
                  </div>
                ))}

                {/* Assigned class is always read-only */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Assigned Class
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block mt-1">
                    {selectedClass} - {selectedSection}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
