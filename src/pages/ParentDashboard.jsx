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
} from "lucide-react";
import { db, collection, getDocs, query, where } from "../firebase";

export const ParentDashboard = () => {
  const { userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Data States
  const [studentInfo, setStudentInfo] = useState(null);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Modal for payment simulation & gateway parameters
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [upiProvider, setUpiProvider] = useState("gpay");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Concessions
  const [concessionForm, setConcessionForm] = useState({
    discount: "25%",
    reason: "",
  });
  const [concessionRequests, setConcessionRequests] = useState([]);

  // Admit Card Modal
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);

  const [attendanceHistory, setAttendanceHistory] = useState([
    { date: "2026-06-16", status: "Present" },
    { date: "2026-06-15", status: "Present" },
    { date: "2026-06-12", status: "Present" },
    { date: "2026-06-11", status: "Absent" },
    { date: "2026-06-10", status: "Present" },
  ]);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const studentId = userData?.studentId || "student-1";

      const mockDb = localStorage.getItem("school_erp_mock_db");
      let foundStudent = null;
      if (mockDb) {
        const parsed = JSON.parse(mockDb);
        foundStudent = parsed.students.find((s) => s.id === studentId);
        // Prefer timetable for the student's class when available
        if (parsed.timetables) {
          const classKey = (foundStudent && foundStudent.class) || "10A";
          setTimetable(
            parsed.timetables[classKey] || parsed.timetables["10A"] || [],
          );
        }
        if (parsed.homework) setHomework(parsed.homework);
        if (parsed.resources) setResources(parsed.resources);

        const myConcessions = (parsed.concessionRequests || []).filter(
          (c) => c.studentId === studentId,
        );
        setConcessionRequests(myConcessions);
      }

      if (foundStudent) {
        setStudentInfo(foundStudent);
        if (foundStudent.attendanceHistory) {
          setAttendanceHistory(foundStudent.attendanceHistory);
        }
      } else {
        const q = query(
          collection(db, "students"),
          where("id", "==", studentId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setStudentInfo({ id: snap.docs[0].id, ...snap.docs[0].data() });
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
            setAttendanceHistory(foundStudent.attendanceHistory);
          }
        }
        if (parsed.timetables) {
          const classKey = (foundStudent && foundStudent.class) || "10A";
          setTimetable(
            parsed.timetables[classKey] || parsed.timetables["10A"] || [],
          );
        }
        if (parsed.homework) setHomework(parsed.homework);
        if (parsed.resources) setResources(parsed.resources);
        setNotices(parsed.notices || []);

        const myConcessions = (parsed.concessionRequests || []).filter(
          (c) => c.studentId === studentId,
        );
        setConcessionRequests(myConcessions);
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
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 90;

  const fees = studentInfo?.fees || {
    total: 50000,
    paid: 35000,
    balance: 15000,
    dueDate: "2026-06-30",
  };
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

  const handleApplyConcession = (e) => {
    e.preventDefault();
    const mockDb = localStorage.getItem("school_erp_mock_db");
    if (mockDb) {
      const parsed = JSON.parse(mockDb);
      const studentId = studentInfo?.id || "student-1";
      const newReq = {
        id: "cr_" + Math.random().toString(36).substring(2, 9),
        studentId,
        studentName: studentInfo?.name || "Emily Miller",
        class: studentInfo?.class || "10A",
        feeAmount: fees.total,
        requestedDiscount: concessionForm.discount,
        reason: concessionForm.reason,
        status: "Pending",
      };
      if (!parsed.concessionRequests) parsed.concessionRequests = [];
      parsed.concessionRequests.push(newReq);
      localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
      setConcessionForm({ discount: "25%", reason: "" });
      triggerNotification(
        "Fee concession application submitted to approvals pipeline!",
      );

      // Update Principal's logs if settings alerts are enabled (handled implicitly in shared mock DB)

      fetchStudentData();
    }
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
                Class 10A
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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
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
                className={`mb-6 p-4 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
                  notification.type === "error"
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
            {activeTab === "attendance" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                  <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">
                    Attendance Percentage
                  </h3>

                  <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        className="stroke-slate-100"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        className="stroke-amber-500 transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 62}
                        strokeDashoffset={
                          2 * Math.PI * 62 * (1 - attendanceRate / 100)
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-2xl font-black text-slate-800">
                      {attendanceRate}%
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Status: Healthy
                  </span>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-extrabold text-slate-800">
                      Attendance Calendar Log
                    </h3>
                    <button
                      onClick={handleExportAttendance}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4.5 h-4.5" /> Export Logs (CSV)
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {attendanceHistory.map((day, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs"
                      >
                        <span className="font-bold text-slate-700">
                          {day.date}
                        </span>
                        <span
                          className={`font-black uppercase tracking-wider ${day.status === "Present" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {day.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FEES STATUS & PAYMENT */}
            {activeTab === "fees" && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Total Fees
                    </span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">
                      ₹{fees.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Paid Amount
                    </span>
                    <span className="text-2xl font-black text-emerald-600 block mt-1">
                      ₹{fees.paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Balance Pending
                    </span>
                    <span className="text-2xl font-black text-rose-500 block mt-1">
                      ₹{fees.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Online Fees Payment Gateway
                    </h3>
                    <span className="text-xs text-slate-400 block mt-1">
                      Due Date: {fees.dueDate} | Invoice Status:{" "}
                      {feeStatus.label}
                    </span>
                  </div>

                  {fees.balance > 0 ? (
                    <button
                      onClick={() => {
                        setPaymentSuccess(false);
                        setShowPayModal(true);
                      }}
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Pay Now (UPI / Card)
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Settled
                    </span>
                  )}
                </div>

                {/* TWO-COLUMN LAYOUT: Concession Form & Submitted Requests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Concession Form */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-base font-extrabold text-slate-800 mb-2">
                      Apply for Tuition Fee Concession
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Submit financial concession request to the Principal
                      approval board.
                    </p>

                    <form
                      onSubmit={handleApplyConcession}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Requested Discount Ratio
                        </label>
                        <select
                          value={concessionForm.discount}
                          onChange={(e) =>
                            setConcessionForm({
                              ...concessionForm,
                              discount: e.target.value,
                            })
                          }
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 bg-slate-50 outline-none"
                        >
                          <option value="25%">25% Tuition Waiver</option>
                          <option value="50%">50% Half Waiver</option>
                          <option value="75%">75% Merit concession</option>
                          <option value="100%">100% Full Waiver (EWS)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Reason / Justification File
                        </label>
                        <textarea
                          rows="3"
                          value={concessionForm.reason}
                          onChange={(e) =>
                            setConcessionForm({
                              ...concessionForm,
                              reason: e.target.value,
                            })
                          }
                          placeholder="State reason (e.g. ward of school employee, merit rank, family income constraint...)"
                          required
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 bg-slate-50 outline-none"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Submit Concession Application
                      </button>
                    </form>
                  </div>

                  {/* Submitted Concessions History */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-base font-extrabold text-slate-800 mb-4">
                      My Concession Requests Status
                    </h3>
                    <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1 flex-1">
                      {concessionRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-slate-800 block">
                              Waiver: {req.requestedDiscount}
                            </span>
                            <span className="text-[10px] text-slate-450 block mt-0.5">
                              Reason: {req.reason}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              req.status === "Approved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : req.status === "Rejected"
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      ))}
                      {concessionRequests.length === 0 && (
                        <p className="text-center py-12 text-slate-400 text-xs">
                          No concession applications submitted yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* MODAL SIMULATION */}
                {showPayModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative">
                      {paymentSuccess ? (
                        <div className="py-8 text-center space-y-4 animate-scale-up">
                          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                            ✓
                          </div>
                          <h4 className="text-lg font-black text-slate-800">
                            Transaction Successful
                          </h4>
                          <p className="text-xs text-slate-450">
                            Transaction ID:{" "}
                            <span className="font-mono text-slate-700">
                              TXN-{Math.floor(100000 + Math.random() * 900000)}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h3 className="text-sm font-extrabold text-slate-850">
                              Online UPI Payment Gateway
                            </h3>
                            <button
                              onClick={() => setShowPayModal(false)}
                              className="text-slate-400 hover:text-slate-600 text-sm"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                                Payable Balance
                              </span>
                              <span className="text-base font-black text-slate-850">
                                ₹{fees.balance?.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded uppercase font-bold">
                              Secure Gateway
                            </span>
                          </div>

                          {/* UPI Mode Selector */}
                          <div className="grid grid-cols-3 gap-2">
                            {["gpay", "phonepe", "paytm"].map((provider) => (
                              <button
                                key={provider}
                                onClick={() => setUpiProvider(provider)}
                                className={`py-2 px-1 rounded-xl text-[10px] font-bold border capitalize transition-all ${
                                  upiProvider === provider
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-650"
                                    : "border-slate-250 text-slate-450 hover:bg-slate-50"
                                }`}
                              >
                                {provider === "gpay"
                                  ? "GPay"
                                  : provider === "phonepe"
                                    ? "PhonePe"
                                    : "Paytm"}
                              </button>
                            ))}
                          </div>

                          {/* Simulated UPI QR Code */}
                          <div className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-inner relative group">
                              {/* Draw a fake QR matrix */}
                              <div className="w-full h-full border-2 border-slate-800 p-1 flex flex-wrap gap-[2px] opacity-80">
                                {Array.from({ length: 144 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-[6px] h-[6px] rounded-[1px] ${
                                      i % 5 === 0 ||
                                      i % 7 === 0 ||
                                      i < 18 ||
                                      i % 12 === 0
                                        ? "bg-slate-800"
                                        : "bg-transparent"
                                    }`}
                                  ></div>
                                ))}
                              </div>
                              <span className="absolute text-[8px] bg-indigo-650 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                                SCAN TO PAY
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">
                              shreehsmodel@upi
                            </span>
                          </div>

                          <div className="space-y-2 pt-2">
                            <button
                              onClick={handleSimulatePayment}
                              disabled={payLoading}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-1.5"
                            >
                              {payLoading ? (
                                <>
                                  <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Verifying transaction with bank...
                                </>
                              ) : (
                                `Authorize Simulated Payment`
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RESULTS / MARKSHEET */}
            {activeTab === "results" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-base font-extrabold text-slate-800">
                      Academic Marksheet & Report Cards
                    </h3>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setShowAdmitCardModal(true)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 text-xs font-bold rounded-xl transition-all"
                      >
                        Generate Admit Card
                      </button>
                      <button
                        onClick={handleExportMarks}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-4.5 h-4.5" /> Export Report (CSV)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {studentInfo?.marks?.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <h4 className="font-extrabold text-slate-850">
                            {m.subject}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {m.exam}
                          </span>
                        </div>
                        <span className="font-black text-slate-800">
                          {m.marksObtained} / {m.maxMarks}
                        </span>
                      </div>
                    ))}
                    {(!studentInfo?.marks ||
                      studentInfo.marks.length === 0) && (
                      <p className="text-center py-8 text-slate-400 text-xs">
                        No grades submitted by teacher advisor yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* ADMIT CARD PREVIEW MODAL */}
                {showAdmitCardModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-xl w-full space-y-6 shadow-2xl relative">
                      {/* Brand Header */}
                      <div className="text-center border-b pb-4 border-slate-150">
                        <span className="text-xs text-indigo-600 font-extrabold tracking-widest uppercase">
                          Official Hall Ticket
                        </span>
                        <h2 className="text-lg font-black text-slate-850 mt-1">
                          SHREE H.S. MODEL INTER COLLEGE
                        </h2>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">
                          Academic Session Session 2026 - 2027
                        </span>
                      </div>

                      {/* Student Info Card */}
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            Student Name
                          </span>
                          <span className="font-extrabold text-slate-800 block mt-0.5">
                            {studentInfo?.name || "Emily Miller"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            Roll Number
                          </span>
                          <span className="font-mono font-bold text-slate-800 block mt-0.5">
                            {studentInfo?.rollNo || "101"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            Class / Section
                          </span>
                          <span className="font-bold text-slate-800 block mt-0.5">
                            Grade {studentInfo?.class || "10A"} - Sec{" "}
                            {studentInfo?.section || "A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            Exam Center
                          </span>
                          <span className="font-bold text-slate-850 block mt-0.5">
                            Main Campus Hall B
                          </span>
                        </div>
                      </div>

                      {/* Schedule Table */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Datesheet & Paper Schedule
                        </span>
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
                              <tr>
                                <td className="p-3 font-semibold">
                                  Mathematics
                                </td>
                                <td className="p-3">July 10, 2026</td>
                                <td className="p-3 font-mono">08:30 AM</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-semibold">Science</td>
                                <td className="p-3">July 12, 2026</td>
                                <td className="p-3 font-mono">08:30 AM</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-semibold">English</td>
                                <td className="p-3">July 14, 2026</td>
                                <td className="p-3 font-mono">08:30 AM</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex justify-between items-end pt-4 border-t border-slate-100 text-xs">
                        <div className="text-center">
                          <span className="font-mono text-slate-400 italic block">
                            Sarah Jenkins
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                            Principal Signature
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-[10px] mx-auto opacity-70">
                            SEAL
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition-all"
                        >
                          Print Admit Card
                        </button>
                        <button
                          onClick={() => setShowAdmitCardModal(false)}
                          className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl transition-all"
                        >
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
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Weekly Class Timetable
                </h3>
                {timetable.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No timetable available for your class yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                    ].map((day) => {
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
                                    <span className="font-extrabold text-amber-600 uppercase tracking-wider block text-[9px]">
                                      {t.period}
                                    </span>
                                    <h5 className="text-sm font-bold text-slate-800 mt-1">
                                      {t.subject}
                                    </h5>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">
                                      Teacher: {t.teacherName}
                                    </span>
                                  </div>
                                  <span className="font-mono text-indigo-600 font-bold text-right">
                                    {t.time}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-xl">
                <h3 className="text-base font-extrabold text-slate-800 mb-6">
                  Student Enrollment File
                </h3>
                <div className="grid grid-cols-2 gap-6 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Official Name
                    </span>
                    <span className="text-sm font-semibold text-slate-850 block mt-1">
                      {studentInfo?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Class / Section
                    </span>
                    <span className="text-sm font-semibold text-slate-850 block mt-1">
                      Grade {studentInfo?.class} (Sec {studentInfo?.section})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Student Roll No
                    </span>
                    <span className="text-sm font-mono text-slate-800 block mt-1">
                      {studentInfo?.rollNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Parent Contact Info
                    </span>
                    <span className="text-sm font-semibold text-slate-850 block mt-1">
                      {studentInfo?.email}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
};
