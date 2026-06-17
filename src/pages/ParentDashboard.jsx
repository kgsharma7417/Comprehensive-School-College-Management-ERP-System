import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Calendar,
  CreditCard,
  Megaphone,
  LogOut,
  Award,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { db, collection, getDocs, query, where, isMockMode } from "../firebase";

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
  "Computer",
  "Physical Education",
];

const EXAMS = ["Mid-Term", "Final", "Unit Test", "Assignment"];

export const ParentDashboard = () => {
  const { userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Data States
  const [studentInfo, setStudentInfo] = useState(null);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [timetableStartHour, setTimetableStartHour] = useState(8);
  const [timetablePeriodDuration, setTimetablePeriodDuration] = useState(60);

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

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Modal for payment simulation & gateway parameters
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [upiProvider, setUpiProvider] = useState("gpay");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Payment Verification Requests State
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionId: "",
    message: "",
  });
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [showFeesBreakdownModal, setShowFeesBreakdownModal] = useState(false);
  const [showPaidHistoryModal, setShowPaidHistoryModal] = useState(false);

  // Admit Card Modal
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);

  const [attendanceHistory, setAttendanceHistory] = useState([
    { date: "2026-06-16", status: "Present" },
    { date: "2026-06-15", status: "Present" },
    { date: "2026-06-12", status: "Present" },
    { date: "2026-06-11", status: "Absent" },
    { date: "2026-06-10", status: "Present" },
  ]);

  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // June
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("All");

  useEffect(() => {
    if (attendanceHistory.length > 0) {
      const latestEntry = attendanceHistory[0];
      const dateParts = latestEntry.date.split("-");
      if (dateParts.length === 3) {
        setCalendarYear(parseInt(dateParts[0]));
        setCalendarMonth(parseInt(dateParts[1]) - 1);
      }
    }
  }, [attendanceHistory]);

  const [profileForm, setProfileForm] = useState({
    aadharNo: "",
    address: "",
    bloodGroup: "",
    dob: "",
    gender: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    motherMobile: "",
  });

  useEffect(() => {
    if (studentInfo) {
      setProfileForm({
        aadharNo: studentInfo.aadharNo || "",
        address: studentInfo.address || "",
        bloodGroup: studentInfo.bloodGroup || "",
        dob: studentInfo.dob || "",
        gender: studentInfo.gender || "",
        fatherName: studentInfo.fatherName || "",
        fatherMobile: studentInfo.fatherMobile || "",
        motherName: studentInfo.motherName || "",
        motherMobile: studentInfo.motherMobile || "",
      });
    }
  }, [studentInfo]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const studentId = studentInfo?.id;
    if (!studentId) return;

    const mockDb = localStorage.getItem("school_erp_mock_db");
    if (mockDb) {
      const parsed = JSON.parse(mockDb);
      const idx = parsed.students.findIndex((s) => s.id === studentId);
      if (idx > -1) {
        parsed.students[idx] = {
          ...parsed.students[idx],
          ...profileForm,
        };
        localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
      }
    }

    try {
      const { doc, setDoc } = await import("../firebase");
      const studentDocRef = doc(db, "students", studentId);
      await setDoc(studentDocRef, {
        ...studentInfo,
        ...profileForm,
      });
      triggerNotification("Profile details updated successfully!");
      fetchStudentData();
    } catch (err) {
      import("../utils/logger").then(({ error }) => error("Profile update failed", err));
      triggerNotification("Profile details updated locally.");
      fetchStudentData();
    }
  };

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const studentId = userData?.studentId || "student-1";

      if (isMockMode) {
        const mockDb = localStorage.getItem("school_erp_mock_db");
        let foundStudent = null;
        if (mockDb) {
          const parsed = JSON.parse(mockDb);
          foundStudent = parsed.students.find((s) => s.id === studentId);
          if (parsed.timetables) {
            const classKey = (foundStudent && foundStudent.class) || "Class 10";
            const secKey = foundStudent ? `${foundStudent.class}_${foundStudent.section}` : "";
            setTimetable(
              parsed.timetables[secKey] || parsed.timetables[classKey] || parsed.timetables["Class 10"] || [],
            );
          }
          if (parsed.timetableStartHour) {
            setTimetableStartHour(parsed.timetableStartHour);
          }
          if (parsed.timetablePeriodDuration) {
            setTimetablePeriodDuration(parsed.timetablePeriodDuration);
          }
          if (parsed.homework) setHomework(parsed.homework);
          if (parsed.resources) setResources(parsed.resources);

          const myPayments = (parsed.feePaymentRequests || []).filter(
            (c) => c.studentId === studentId,
          );
          setPaymentRequests(myPayments);
        }

        if (foundStudent) {
          setStudentInfo(foundStudent);
          if (foundStudent.attendanceHistory) {
            const sortedHistory = [...foundStudent.attendanceHistory].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );
            setAttendanceHistory(sortedHistory);
          }
        }
      } else {
        // Live Firebase Mode: Query Firestore for student data
        const q = query(
          collection(db, "students"),
          where("id", "==", studentId),
        );
        const snap = await getDocs(q);
        let fetchedStudent = null;
        if (!snap.empty) {
          fetchedStudent = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setStudentInfo(fetchedStudent);
          if (fetchedStudent.attendanceHistory) {
            const sortedHistory = [...fetchedStudent.attendanceHistory].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );
            setAttendanceHistory(sortedHistory);
          }
        } else {
          // Fallback to local storage if student not found in Firestore
          const mockDb = localStorage.getItem("school_erp_mock_db");
          if (mockDb) {
            const parsed = JSON.parse(mockDb);
            const foundStudent = parsed.students.find((s) => s.id === studentId);
            if (foundStudent) {
              setStudentInfo(foundStudent);
              if (foundStudent.attendanceHistory) {
                const sortedHistory = [...foundStudent.attendanceHistory].sort(
                  (a, b) => new Date(b.date) - new Date(a.date)
                );
                setAttendanceHistory(sortedHistory);
              }
            }
          }
        }

        // Also load supplementary data (timetables, resources, homework) from local mock DB if not yet set up in Firestore
        const mockDb = localStorage.getItem("school_erp_mock_db");
        if (mockDb) {
          const parsed = JSON.parse(mockDb);
          const localStudent = parsed.students.find((s) => s.id === studentId);
          const activeStudent = fetchedStudent || localStudent;
          if (parsed.timetables) {
            const classKey = (activeStudent && activeStudent.class) || "Class 10";
            const secKey = activeStudent ? `${activeStudent.class}_${activeStudent.section}` : "";
            setTimetable(
              parsed.timetables[secKey] || parsed.timetables[classKey] || parsed.timetables["Class 10"] || [],
            );
          }
          if (parsed.timetableStartHour) {
            setTimetableStartHour(parsed.timetableStartHour);
          }
          if (parsed.timetablePeriodDuration) {
            setTimetablePeriodDuration(parsed.timetablePeriodDuration);
          }
          if (parsed.homework) setHomework(parsed.homework);
          if (parsed.resources) setResources(parsed.resources);

          const myPayments = (parsed.feePaymentRequests || []).filter(
            (c) => c.studentId === studentId,
          );
          setPaymentRequests(myPayments);
        }
      }

      const noticesSnap = await getDocs(collection(db, "notices"));
      setNotices(
        noticesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)),
      );
    } catch (error) {
      import("../utils/logger").then(({ warn }) =>
        warn(
          "Live Firebase offline in Parent Dashboard. Loading local simulation DB:",
          error,
        ),
      );
      const mockDb = localStorage.getItem("school_erp_mock_db");
      if (mockDb) {
        const parsed = JSON.parse(mockDb);
        const studentId = userData?.studentId || "student-1";
        const foundStudent = parsed.students.find((s) => s.id === studentId);
        if (foundStudent) {
          setStudentInfo(foundStudent);
          if (foundStudent.attendanceHistory) {
            const sortedHistory = [...foundStudent.attendanceHistory].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            );
            setAttendanceHistory(sortedHistory);
          }
        }
        if (parsed.timetables) {
          const classKey = (foundStudent && foundStudent.class) || "Class 10";
          const secKey = foundStudent ? `${foundStudent.class}_${foundStudent.section}` : "";
          setTimetable(
            parsed.timetables[secKey] || parsed.timetables[classKey] || parsed.timetables["Class 10"] || [],
          );
        }
        if (parsed.timetableStartHour) {
          setTimetableStartHour(parsed.timetableStartHour);
        }
        if (parsed.timetablePeriodDuration) {
          setTimetablePeriodDuration(parsed.timetablePeriodDuration);
        }
        if (parsed.homework) setHomework(parsed.homework);
        if (parsed.resources) setResources(parsed.resources);
        setNotices(parsed.notices || []);

        const myPayments = (parsed.feePaymentRequests || []).filter(
          (c) => c.studentId === studentId,
        );
        setPaymentRequests(myPayments);
      }
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter(
    (d) => d.status === "Present",
  ).length;
  const attendanceRate =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  const totalPresents = presentDays;
  const totalAbsents = attendanceHistory.filter((d) => d.status === "Absent").length;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const calendarCells = (() => {
    const cells = [];
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(i);
    }
    return cells;
  })();

  const filteredHistory = attendanceHistory.filter((day) => {
    const matchesSearch = day.date.toLowerCase().includes(attendanceSearch.toLowerCase());
    const matchesFilter = attendanceFilter === "All" || day.status === attendanceFilter;
    return matchesSearch && matchesFilter;
  });

  const getUpdatedFees = () => {
    const baseFees = studentInfo?.fees || {
      total: 50000,
      paid: 35000,
      balance: 15000,
      dueDate: "2026-06-30",
      breakdown: {
        monthlyTuition: 3000,
        yearlyTerm: 10000,
        extraCharges: 4000
      }
    };

    if (!baseFees.breakdown) {
      baseFees.breakdown = {
        monthlyTuition: 3000,
        yearlyTerm: 10000,
        extraCharges: 4000
      };
    }

    const monthlyTotal = (Number(baseFees.breakdown.monthlyTuition) || 3000) * 12;
    const yearlyTotal = Number(baseFees.breakdown.yearlyTerm) || 10000;
    const extraTotal = Number(baseFees.breakdown.extraCharges) || 4000;

    baseFees.total = monthlyTotal + yearlyTotal + extraTotal;
    baseFees.balance = Math.max(0, baseFees.total - baseFees.paid);

    return baseFees;
  };

  const fees = getUpdatedFees();
  const getFeeStatus = () => {
    if (fees.balance === 0)
      return {
        label: "Paid",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      };
    const today = new Date();
    const due = new Date(fees.dueDate);
    if (today > due)
      return {
        label: "Overdue",
        color: "bg-rose-50 text-rose-600 border-rose-100",
      };
    return {
      label: "Partially Paid",
      color: "bg-amber-50 text-amber-600 border-amber-100",
    };
  };

  const feeStatus = getFeeStatus();
  const monthlyFee = fees.breakdown?.monthlyTuition || 3000;
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });
  const currentMonthDue = fees.balance > 0 ? Math.min(fees.balance, monthlyFee) : 0;

  const triggerNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4050);
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(",")].concat(rows.map((r) => r.join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAttendance = () => {
    const headers = ["Date", "Status"];
    const rows = attendanceHistory.map((day) => [day.date, day.status]);
    downloadCSV(
      headers,
      rows,
      `${studentInfo?.name || "student"}_attendance_report.csv`,
    );
    triggerNotification("Attendance history exported to CSV!");
  };

  const handleExportMarks = () => {
    if (!studentInfo?.marks || studentInfo.marks.length === 0) {
      triggerNotification("No grades available to export.", "error");
      return;
    }
    const headers = ["Subject", "Exam", "Marks Obtained", "Max Marks"];
    const rows = studentInfo.marks.map((m) => [
      m.subject,
      m.exam,
      m.marksObtained,
      m.maxMarks,
    ]);
    downloadCSV(
      headers,
      rows,
      `${studentInfo?.name || "student"}_report_card.csv`,
    );
    triggerNotification("Academic grades exported to CSV!");
  };

  const handleSendPaymentRequest = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentForm.amountPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerNotification("Please enter a valid payment amount.", "error");
      return;
    }

    const studentId = studentInfo?.id || "student-1";
    const payload = {
      id: "pay_req_" + Math.random().toString(36).substring(2, 9),
      studentId,
      studentName: studentInfo?.name || "Emily Miller",
      class: studentInfo?.class || "Class 10",
      section: studentInfo?.section || "A",
      amountPaid: amountNum,
      paymentDate: paymentForm.paymentDate,
      transactionId: paymentForm.transactionId,
      message: paymentForm.message,
      status: "Pending",
      submittedAt: new Date().toISOString(),
    };

    let savedToFirebase = false;
    try {
      const { doc, setDoc, collection, addDoc } = await import("../firebase");
      await addDoc(collection(db, "feePaymentRequests"), payload);
      savedToFirebase = true;
      triggerNotification("Payment verification request submitted to Admin!");
    } catch (err) {
      import("../utils/logger").then(({ warn }) =>
        warn("Failed to save payment request to Firestore", err)
      );
    }

    // Always update local storage too
    try {
      const mockDb = localStorage.getItem("school_erp_mock_db");
      if (mockDb) {
        const parsed = JSON.parse(mockDb);
        if (!parsed.feePaymentRequests) parsed.feePaymentRequests = [];
        const exists = parsed.feePaymentRequests.some(r => r.id === payload.id || (r.transactionId && r.transactionId === payload.transactionId));
        if (!exists) {
          parsed.feePaymentRequests.push(payload);
          localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
        }
      }
      if (!savedToFirebase) {
        triggerNotification("Payment verification request saved locally!");
      }
    } catch (err) {
      console.error(err);
    }

    setPaymentForm({
      amountPaid: "",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionId: "",
      message: "",
    });
    fetchStudentData();
  };

  const handleSimulatePayment = () => {
    setPayLoading(true);
    setTimeout(() => {
      // update db
      const mockDb = localStorage.getItem("school_erp_mock_db");
      if (mockDb) {
        const parsed = JSON.parse(mockDb);
        const idx = parsed.students.findIndex(
          (s) => s.id === (studentInfo?.id || "student-1"),
        );
        if (idx > -1) {
          parsed.students[idx].fees.paid = parsed.students[idx].fees.total;
          parsed.students[idx].fees.balance = 0;
          localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
        }
      }
      setPayLoading(false);
      setPaymentSuccess(true);
      triggerNotification(
        "Payment authorized successfully! Fees ledger updated.",
        "success",
      );
      setTimeout(() => {
        setShowPayModal(false);
        setPaymentSuccess(false);
      }, 2000);
      fetchStudentData();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* SIDEBAR: Slate 900 */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-355 flex flex-col justify-between shrink-0 border-r border-slate-850">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
            <div className="bg-amber-600 p-2.5 rounded-xl text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider truncate">
                Shree H.S. Model
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Student Portal
              </span>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
              S
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">
                {studentInfo?.name || "Emily Miller"}
              </h4>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                {studentInfo?.class || "Class 10"}{studentInfo?.section ? ` - ${studentInfo.section}` : ""}
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "My Dashboard", icon: TrendingUp },
              { id: "attendance", label: "My Attendance", icon: Calendar },
              { id: "fees", label: "Fees & Payment", icon: CreditCard },
              { id: "results", label: "Results & Marksheet", icon: Award },
              { id: "timetable", label: "Class Timetable", icon: Clock },
              { id: "notices", label: "Homework & Notices", icon: Megaphone },
              { id: "resources", label: "Library Resources", icon: BookOpen },
              { id: "profile", label: "Student Profile", icon: User },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                >
                  <IconComp className="w-4 h-4" /> {tab.label}
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

      {/* CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Student ID: {studentInfo?.id}
          </span>
        </header>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-450 uppercase tracking-wider">
              Loading Desk...
            </span>
          </div>
        ) : (
          <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            {/* Notification Banner */}
            {notification.message && (
              <div
                className={`mb-6 p-4 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${notification.type === "error"
                  ? "bg-rose-50 border-rose-105 text-rose-650"
                  : "bg-emerald-50 border-emerald-105 text-emerald-650"
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{notification.message}</span>
              </div>
            )}

            {/* TAB 1: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-2">
                      My Student Portal
                    </h3>
                    <p className="text-xs text-slate-450">
                      Track your overall syllabus, attendances, and billing
                      parameters.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Attendance Rate
                      </span>
                      <span className="text-xl font-black text-slate-800 block mt-1">
                        {attendanceRate}%
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Pending Fees
                      </span>
                      <span className="text-xl font-black text-rose-500 block mt-1">
                        ₹{fees.balance?.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Academic Ranks
                      </span>
                      <span className="text-xl font-black text-indigo-600 block mt-1">
                        First Division
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-4">
                      Urgent Bulletins
                    </h3>
                    <div className="space-y-4">
                      {notices
                        .filter(
                          (n) =>
                            n.audience === "Parents" || n.audience === "All",
                        )
                        .slice(0, 2)
                        .map((n) => (
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
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY ATTENDANCE */}
            {/* TAB 2: MY ATTENDANCE */}
            {activeTab === "attendance" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Calendar Grid */}
                <div className="space-y-6 lg:col-span-1">
                  {/* Ring Stats Panel */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">
                      Attendance Percentage
                    </h3>
                    <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="54" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="64" cy="64" r="54"
                          className="stroke-amber-500 transition-all duration-1000 ease-out"
                          strokeWidth="8" fill="transparent"
                          strokeDasharray={2 * Math.PI * 54}
                          strokeDashoffset={2 * Math.PI * 54 * (1 - attendanceRate / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-xl font-black text-slate-800">{attendanceRate}%</div>
                    </div>
                    <div className="flex justify-around w-full border-t border-slate-100 pt-4 text-center mt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Present</span>
                        <span className="text-sm font-extrabold text-emerald-600">{totalPresents} Days</span>
                      </div>
                      <div className="border-l border-slate-100 h-8 self-center"></div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Absent</span>
                        <span className="text-sm font-extrabold text-rose-500">{totalAbsents} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Calendar Panel */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Monthly Overview</h3>
                      <div className="flex gap-1">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 self-center px-1">
                          {monthNames[calendarMonth]} {calendarYear}
                        </span>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span>
                      <span>Th</span><span>Fr</span><span>Sa</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} className="h-8"></div>;
                        const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const record = attendanceHistory.find((h) => h.date === dateString);
                        let tileClass = "text-slate-600 hover:bg-slate-100";
                        if (record) {
                          if (record.status === "Present") tileClass = "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20";
                          else if (record.status === "Absent") tileClass = "bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20 animate-pulse";
                        } else {
                          const dayOfWeek = new Date(calendarYear, calendarMonth, day).getDay();
                          if (dayOfWeek === 0 || dayOfWeek === 6) tileClass = "text-slate-300 font-semibold bg-slate-50/50";
                        }
                        return (
                          <div
                            key={`day-${day}`}
                            className={`h-8 flex flex-col items-center justify-center rounded-lg text-xs transition-all relative group cursor-pointer ${tileClass}`}
                            title={record ? `${day} ${monthNames[calendarMonth]} - ${record.status}` : `${day} ${monthNames[calendarMonth]}`}
                          >
                            <span>{day}</span>
                            {record && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-150 justify-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-md block"></span> Present</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-md block"></span> Absent</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-50 border border-slate-200 rounded-md block"></span> Unmarked</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">Detailed Attendance Ledger</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Filter and search through daily academic logs.</p>
                    </div>
                    <button onClick={handleExportAttendance} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Export Logs (CSV)
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-72">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        placeholder="Search date (e.g. 2026-06)..."
                        className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs bg-slate-50/55 text-slate-700 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      />
                    </div>
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {["All", "Present", "Absent"].map((filterOpt) => (
                        <button
                          key={filterOpt}
                          onClick={() => setAttendanceFilter(filterOpt)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${attendanceFilter === filterOpt ? "bg-white text-slate-850 shadow-sm" : "text-slate-400 hover:text-slate-750"
                            }`}
                        >
                          {filterOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-2">
                    {filteredHistory.map((day, idx) => {
                      const dateObj = new Date(day.date);
                      const weekdayStr = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                      const prettyDateStr = dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                      return (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50/70 border border-slate-100 hover:border-slate-200 rounded-2xl text-xs hover:shadow-sm transition-all">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-700 block">{prettyDateStr}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">{weekdayStr}</span>
                          </div>
                          <span className={`font-black uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-full border ${day.status === "Present" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                            }`}>
                            {day.status}
                          </span>
                        </div>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <div className="col-span-2 py-12 text-center text-slate-400 text-xs font-semibold">
                        No attendance matching selected query.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FEES STATUS & PAYMENT */}
            {/* TAB 3: FEES STATUS & PAYMENT */}
            {activeTab === "fees" && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div onClick={() => setShowFeesBreakdownModal(true)} className="bg-white border border-slate-200 p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block group-hover:text-amber-600 transition-colors">Total Fees (Click Details)</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">₹{fees.total.toLocaleString()}</span>
                  </div>
                  <div onClick={() => setShowPaidHistoryModal(true)} className="bg-white border border-slate-200 p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block group-hover:text-emerald-600 transition-colors">Paid Amount (Click History)</span>
                    <span className="text-2xl font-black text-emerald-600 block mt-1">₹{fees.paid.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance Pending</span>
                    <span className="text-2xl font-black text-rose-500 block mt-1">₹{fees.balance.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Tuition ({monthName})</span>
                    <span className="text-2xl font-black text-indigo-600 block mt-1">₹{monthlyFee.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Due ({monthName})</span>
                    <span className={`text-2xl font-black block mt-1 ${currentMonthDue > 0 ? "text-amber-500" : "text-emerald-600"}`}>
                      ₹{currentMonthDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Online Fees Payment Gateway</h3>
                    <span className="text-xs text-slate-400 block mt-1">Due Date: {fees.dueDate} | Invoice Status: {feeStatus.label}</span>
                  </div>
                  {fees.balance > 0 ? (
                    <button onClick={() => { setPaymentSuccess(false); setShowPayModal(true); }} className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                      Pay Now (UPI / Card)
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Settled
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 mb-2">School Bank Account & UPI Details</h3>
                      <p className="text-xs text-slate-400">Transfer the fee amount using details below and submit verification details.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Direct Bank Transfer</h4>
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                          <span className="text-slate-450">Bank Name:</span>
                          <span className="font-semibold text-slate-800 text-right">State Bank of India (SBI)</span>
                          <span className="text-slate-450">Account Holder:</span>
                          <span className="font-semibold text-slate-800 text-right">Shree H.S. Model School Admin</span>
                          <span className="text-slate-450">Account Number:</span>
                          <span className="font-mono font-bold text-slate-850 text-right">38291029302</span>
                          <span className="text-slate-450">IFSC Code:</span>
                          <span className="font-mono font-bold text-indigo-650 text-right">SBIN0001234</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transfer via UPI ID</h4>
                          <span className="font-mono font-bold text-xs text-slate-800 mt-1 block">admin@school</span>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText("admin@school"); triggerNotification("UPI ID Copied to Clipboard!"); }}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold text-xs rounded-xl transition-all"
                        >
                          Copy UPI ID
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 mb-2">Submit Payment Verification Request</h3>
                      <p className="text-xs text-slate-400 mb-6">Enter payment details along with the transaction UTR number to request balance verification.</p>
                    </div>
                    <form onSubmit={handleSendPaymentRequest} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Amount Paid (₹)</label>
                          <input type="number" min="1" max={fees.balance} value={paymentForm.amountPaid}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                            placeholder="e.g. 15000" required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-750 bg-slate-50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Payment Date</label>
                          <input type="date" value={paymentForm.paymentDate}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                            required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-750 bg-slate-50 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Transaction ID / UTR Number</label>
                        <input type="text" value={paymentForm.transactionId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                          placeholder="Enter 12-digit transaction ID" required
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-750 bg-slate-50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Payment Description / Message</label>
                        <textarea rows="3" value={paymentForm.message}
                          onChange={(e) => setPaymentForm({ ...paymentForm, message: e.target.value })}
                          placeholder="Type details..." required
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-750 bg-slate-50 outline-none"
                        ></textarea>
                      </div>
                      <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                        Send Verification Request to Admin
                      </button>
                    </form>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-8">
                  <h3 className="text-base font-extrabold text-slate-800 mb-4">My Payment Requests History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[280px] overflow-y-auto pr-1">
                    {paymentRequests.map((req) => (
                      <div key={req.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between text-xs space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">UTR / TRANSACTION ID</span>
                            <span className="font-mono font-bold text-slate-800">{req.transactionId}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${req.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : req.status === "Rejected" ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}>{req.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] border-t border-b border-slate-100 py-2">
                          <span className="text-slate-450">Amount Paid:</span>
                          <span className="font-bold text-slate-800 text-right">₹{req.amountPaid.toLocaleString()}</span>
                          <span className="text-slate-450">Date of Transfer:</span>
                          <span className="font-semibold text-slate-700 text-right">{req.paymentDate}</span>
                        </div>
                        {req.message && (
                          <div className="text-[11px] text-slate-500 bg-slate-100/60 p-2.5 rounded-xl">
                            <span className="font-bold text-slate-600 block text-[9px] uppercase mb-0.5">Student Note:</span>
                            {req.message}
                          </div>
                        )}
                      </div>
                    ))}
                    {paymentRequests.length === 0 && (
                      <p className="text-center col-span-2 py-12 text-slate-400 text-xs">No payment verification requests submitted yet.</p>
                    )}
                  </div>
                </div>

                {/* MODAL SIMULATION */}
                {showPayModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative">
                      {paymentSuccess ? (
                        <div className="py-8 text-center space-y-4 animate-scale-up">
                          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
                          <h4 className="text-lg font-black text-slate-800">Transaction Successful</h4>
                          <p className="text-xs text-slate-450">Transaction ID: <span className="font-mono text-slate-700">TXN-{Math.floor(100000 + Math.random() * 900000)}</span></p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h3 className="text-sm font-extrabold text-slate-850">Online UPI Payment Gateway</h3>
                            <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                          </div>
                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Payable Balance</span>
                              <span className="text-base font-black text-slate-850">₹{fees.balance?.toLocaleString()}</span>
                            </div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded uppercase font-bold">Secure Gateway</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["gpay", "phonepe", "paytm"].map((provider) => (
                              <button key={provider} onClick={() => setUpiProvider(provider)}
                                className={`py-2 px-1 rounded-xl text-[10px] font-bold border capitalize transition-all ${upiProvider === provider ? "bg-indigo-50 border-indigo-200 text-indigo-650" : "border-slate-250 text-slate-450 hover:bg-slate-50"
                                  }`}>
                                {provider === "gpay" ? "GPay" : provider === "phonepe" ? "PhonePe" : "Paytm"}
                              </button>
                            ))}
                          </div>
                          <div className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-inner relative group">
                              <div className="w-full h-full border-2 border-slate-800 p-1 flex flex-wrap gap-[2px] opacity-80">
                                {Array.from({ length: 144 }).map((_, i) => (
                                  <div key={i} className={`w-[6px] h-[6px] rounded-[1px] ${i % 5 === 0 || i % 7 === 0 || i < 18 || i % 12 === 0 ? "bg-slate-800" : "bg-transparent"}`}></div>
                                ))}
                              </div>
                              <span className="absolute text-[8px] bg-indigo-650 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">SCAN TO PAY</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">shreehsmodel@upi</span>
                          </div>
                          <div className="space-y-2 pt-2">
                            <button onClick={handleSimulatePayment} disabled={payLoading}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-1.5">
                              {payLoading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Verifying transaction with bank...</>
                              ) : "Authorize Simulated Payment"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {showFeesBreakdownModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider">Fee Structure Breakdown</h3>
                        <button onClick={() => setShowFeesBreakdownModal(false)} className="text-slate-400 hover:text-slate-650 text-sm font-bold">✕</button>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-450 font-medium">Monthly Tuition Fee:</span>
                            <span className="font-bold text-slate-800 text-right">
                              ₹{(studentInfo?.fees?.breakdown?.monthlyTuition || 3000).toLocaleString()} / month
                              <span className="block text-[10px] text-slate-400 font-normal">(x12 months: ₹{((studentInfo?.fees?.breakdown?.monthlyTuition || 3000) * 12).toLocaleString()})</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                            <span className="text-slate-450 font-medium">Yearly Term/Admission:</span>
                            <span className="font-bold text-slate-800 text-right">₹{(studentInfo?.fees?.breakdown?.yearlyTerm || 10000).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                            <span className="text-slate-450 font-medium">Extra Charges (Labs/Sports/Library):</span>
                            <span className="font-bold text-slate-800 text-right">₹{(studentInfo?.fees?.breakdown?.extraCharges || 4000).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-black text-indigo-700 uppercase">Gross Total Fee</span>
                          <span className="text-base font-black text-slate-850">₹{(fees.total).toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => setShowFeesBreakdownModal(false)} className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all">
                        Close Breakdown
                      </button>
                    </div>
                  </div>
                )}

                {showPaidHistoryModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 shrink-0">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider">Payment & Transaction Ledger</h3>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">
                            Total Approved Payouts: ₹{(paymentRequests.filter(r => r.status === 'Approved').reduce((s, r) => s + Number(r.amountPaid), 0)).toLocaleString()}
                          </span>
                        </div>
                        <button onClick={() => setShowPaidHistoryModal(false)} className="text-slate-400 hover:text-slate-650 text-sm font-bold">✕</button>
                      </div>
                      <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                        {paymentRequests.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-xs font-semibold">No payment transactions recorded yet.</div>
                        ) : (
                          paymentRequests.map((req) => (
                            <div key={req.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs gap-4 hover:border-slate-200 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-700">{req.transactionId || "CASH-PAYMENT"}</span>
                                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                    {req.paymentMode || (req.transactionId?.startsWith("CASH") ? "CASH" : "UPI")}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  Date: {req.paymentDate} {req.message && `| Note: "${req.message}"`}
                                </span>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <span className="font-extrabold text-slate-800">+₹{Number(req.amountPaid).toLocaleString()}</span>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : req.status === "Rejected" ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                  }`}>{req.status}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button onClick={() => setShowPaidHistoryModal(false)} className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0">
                        Close History Ledger
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RESULTS / MARKSHEET */}
            {/* TAB 4: RESULTS / MARKSHEET */}
            {activeTab === "results" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-base font-extrabold text-slate-800">Academic Marksheet & Report Cards</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => setShowAdmitCardModal(true)} className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 text-xs font-bold rounded-xl transition-all">
                        Generate Admit Card
                      </button>
                      <button onClick={handleExportMarks} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
                        <Download className="w-4 h-4" /> Export Report (CSV)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {EXAMS.map((examType) => {
                      const examMarks = (studentInfo?.marks ?? []).filter((m) => m.exam === examType);
                      return (
                        <div key={examType} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                          <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider flex justify-between items-center">
                            <span>{examType} Term Report</span>
                            {examMarks.length > 0 ? (
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Released</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 border border-slate-200 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Not Uploaded / Awaiting</span>
                            )}
                          </h4>
                          <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white">
                            <table className="w-full text-left text-[11px] border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                  <th className="p-2.5">Subject</th>
                                  <th className="p-2.5 text-center">Marks Obtained</th>
                                  <th className="p-2.5 text-center">Percentage</th>
                                  <th className="p-2.5 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 text-slate-700">
                                {SUBJECTS.map((subject) => {
                                  const mark = examMarks.find((m) => m.subject === subject);
                                  if (mark) {
                                    return (
                                      <tr key={subject} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-2.5 font-bold text-slate-800">{subject}</td>
                                        <td className="p-2.5 text-center font-mono font-bold">{mark.marksObtained} / {mark.maxMarks}</td>
                                        <td className="p-2.5 text-center font-black text-slate-800">{Math.round((mark.marksObtained / mark.maxMarks) * 100)}%</td>
                                        <td className="p-2.5 text-center">
                                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold">Released</span>
                                        </td>
                                      </tr>
                                    );
                                  } else {
                                    return (
                                      <tr key={subject} className="hover:bg-slate-50/50 transition-colors bg-slate-50/10">
                                        <td className="p-2.5 font-bold text-slate-400">{subject}</td>
                                        <td className="p-2.5 text-center text-slate-350 font-mono">-</td>
                                        <td className="p-2.5 text-center text-slate-350 font-bold">-</td>
                                        <td className="p-2.5 text-center">
                                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-bold">Not Released</span>
                                        </td>
                                      </tr>
                                    );
                                  }
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {showAdmitCardModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-xl w-full space-y-6 shadow-2xl relative">
                      <div className="text-center border-b pb-4 border-slate-150">
                        <span className="text-xs text-indigo-600 font-extrabold tracking-widest uppercase">Official Hall Ticket</span>
                        <h2 className="text-lg font-black text-slate-850 mt-1">SHREE H.S. MODEL INTER COLLEGE</h2>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Academic Session Session 2026 - 2027</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Student Name</span>
                          <span className="font-extrabold text-slate-800 block mt-0.5">{studentInfo?.name || "Emily Miller"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Roll Number</span>
                          <span className="font-mono font-bold text-slate-800 block mt-0.5">{studentInfo?.rollNo || "101"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Class / Section</span>
                          <span className="font-bold text-slate-800 block mt-0.5">Grade {studentInfo?.class || "10A"} - Sec {studentInfo?.section || "A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Exam Center</span>
                          <span className="font-bold text-slate-850 block mt-0.5">Main Campus Hall B</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Datesheet & Paper Schedule</span>
                        <div className="overflow-hidden border border-slate-150 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-150">
                              <tr>
                                <th className="p-3">Course Subject</th>
                                <th className="p-3">Exam Date</th>
                                <th className="p-3">Reporting Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 text-slate-650">
                              <tr><td className="p-3 font-semibold">Mathematics</td><td className="p-3">July 10, 2026</td><td className="p-3 font-mono">08:30 AM</td></tr>
                              <tr><td className="p-3 font-semibold">Science</td><td className="p-3">July 12, 2026</td><td className="p-3 font-mono">08:30 AM</td></tr>
                              <tr><td className="p-3 font-semibold">English</td><td className="p-3">July 14, 2026</td><td className="p-3 font-mono">08:30 AM</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="flex justify-between items-end pt-4 border-t border-slate-100 text-xs">
                        <div className="text-center">
                          <span className="font-mono text-slate-400 italic block">Sarah Jenkins</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Principal Signature</span>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-[10px] mx-auto opacity-70">SEAL</div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => window.print()} className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition-all">
                          Print Admit Card
                        </button>
                        <button onClick={() => setShowAdmitCardModal(false)} className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl transition-all">
                          Close Preview
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: TIMETABLE */}
            {activeTab === "timetable" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Weekly Class Timetable
                </h3>
                {timetable.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No timetable available for your class yet.
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
                              const slotData = timetable.find(
                                (t) => t.day === day && t.period === p
                              );
                              return (
                                <td key={p} className="p-2 border-r border-slate-100 last:border-r-0 text-center vertical-align-middle">
                                  {slotData ? (
                                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-left hover:scale-[1.02] hover:bg-indigo-50/90 transition-all">
                                      <span className="font-extrabold text-indigo-700 text-[11px] block truncate" title={slotData.subject}>
                                        {slotData.subject}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block mt-1 truncate" title={slotData.teacherName}>
                                        👤 {slotData.teacherName}
                                      </span>
                                      <span className="text-[9px] text-indigo-500 font-mono block mt-0.5">
                                        ⏱ {getPeriodTime(p, timetableStartHour, timetablePeriodDuration).split(" - ")[0]}
                                      </span>
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
            )}

            {/* TAB 6: NOTICES / HOMEWORK */}
            {activeTab === "notices" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-800 mb-6">
                    Broadcast Bulletins
                  </h3>
                  <div className="space-y-4">
                    {notices.map((n) => (
                      <div
                        key={n.id}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                      >
                        <div className="flex justify-between items-start text-xs">
                          <h4 className="font-extrabold text-slate-850">
                            {n.title}
                          </h4>
                          <span className="text-[9px] text-slate-400">
                            {n.date}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-2 text-xs leading-relaxed">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-800 mb-6">
                    Homework Assignments
                  </h3>
                  <div className="space-y-4">
                    {homework.map((hw) => (
                      <div
                        key={hw.id}
                        className="p-4 bg-slate-55/40 border border-slate-100 rounded-2xl text-xs space-y-2"
                      >
                        <div className="flex justify-between">
                          <h4 className="font-extrabold text-slate-800">
                            {hw.subject}
                          </h4>
                          <span className="text-[10px] text-rose-500 font-bold">
                            Due: {hw.dueDate}
                          </span>
                        </div>
                        <span className="font-bold text-slate-700 block mt-1">
                          {hw.title}
                        </span>
                        <p className="text-slate-500 text-xs mt-1">
                          {hw.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: LIBRARY / RESOURCES */}
            {activeTab === "resources" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Digital Library Resources
                </h3>
                <div className="space-y-4">
                  {resources.map((res) => (
                    <div
                      key={res.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {res.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Type: {res.type} | Size: {res.size}
                        </span>
                      </div>
                      <a
                        href="#"
                        className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Student Enrollment File
                </h3>

                {/* Official Read-Only Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Official Name</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-1">{studentInfo?.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Class / Sec</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-1">{studentInfo?.class} - {studentInfo?.section}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Roll No</span>
                    <span className="text-xs font-mono font-bold text-slate-850 block mt-1">{studentInfo?.rollNo}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Official Email</span>
                    <span className="text-xs font-semibold text-slate-850 block mt-1 truncate">{studentInfo?.email}</span>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aadhar Card Number</label>
                      <input
                        type="text"
                        value={profileForm.aadharNo}
                        onChange={(e) => setProfileForm({ ...profileForm, aadharNo: e.target.value })}
                        placeholder="12-digit number"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Blood Group</label>
                      <select
                        value={profileForm.bloodGroup}
                        onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Residential Address</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="House No, Area, City..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2 pt-4">Parent / Guardian Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Father's Name</label>
                      <input
                        type="text"
                        value={profileForm.fatherName}
                        onChange={(e) => setProfileForm({ ...profileForm, fatherName: e.target.value })}
                        placeholder="Father's name"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Father's Mobile No</label>
                      <input
                        type="text"
                        value={profileForm.fatherMobile}
                        onChange={(e) => setProfileForm({ ...profileForm, fatherMobile: e.target.value })}
                        placeholder="Mobile number"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mother's Name</label>
                      <input
                        type="text"
                        value={profileForm.motherName}
                        onChange={(e) => setProfileForm({ ...profileForm, motherName: e.target.value })}
                        placeholder="Mother's name"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mother's Mobile No</label>
                      <input
                        type="text"
                        value={profileForm.motherMobile}
                        onChange={(e) => setProfileForm({ ...profileForm, motherMobile: e.target.value })}
                        placeholder="Mobile number"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                  >
                    Save & Update My Profile
                  </button>
                </form>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
};
