import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { error as logError } from "../utils/logger";
import {
  GraduationCap,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const { login, userRole } = useAuth();
  const navigate = useNavigate();

  const invalidInput = Boolean(error);
  const inputClass = `w-full bg-slate-950/50 border rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all ${
    invalidInput
      ? "border-rose-500 focus:border-rose-400 focus:ring-rose-500/20"
      : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
  }`;

  const redirectByRole = useCallback(
    (role) => {
      if (role === "admin") navigate("/admin");
      else if (role === "webadmin") navigate("/webadmin");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "parent") navigate("/parent");
      else navigate("/");
    },
    [navigate],
  );

  // Auto redirect if already logged in or role updates
  useEffect(() => {
    if (userRole) {
      redirectByRole(userRole);
    }
  }, [userRole, redirectByRole]);

  const getRoleFromEmail = (emailStr) => {
    const emailLower = emailStr.trim().toLowerCase();
    if (emailLower === "admin@school.com") return "admin";
    if (emailLower === "webadmin@school.com") return "webadmin";
    if (emailLower === "teacher@school.com") return "teacher";
    if (emailLower === "parent@school.com") return "parent";
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      await login(email, password);

      // Try instant redirect by email
      const matchedRole = getRoleFromEmail(email);
      if (matchedRole) {
        redirectByRole(matchedRole);
        return;
      }

      // Fallback redirect: wait a moment for context to populate and redirect
      setTimeout(() => {
        if (userRole) {
          redirectByRole(userRole);
        } else {
          navigate("/");
        }
      }, 800);
    } catch (err) {
      logError(err);
      if (
        err.message === "auth/invalid-credential" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(
          "Failed to authenticate. Please check your network or try again.",
        );
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_25%)]"></div>
      <div className="absolute top-6 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-6 right-8 h-[260px] w-[260px] rounded-full bg-amber-400/10 blur-3xl" />

      {/* Floating Home Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900/50 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Split Card */}
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl">
        {/* Left Side: School Welcome Panel (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-slate-950/95 border-r border-slate-800 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%)] pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent opacity-80 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-200/10 p-3 rounded-2xl text-slate-50 shadow-sm border border-slate-800">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  Shree H.S. Model
                </p>
                <p className="text-xs text-amber-300 font-semibold">
                  Inter College, Lucknow
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
              Welcome Back to Your School Portal
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Secure login for teachers, parents, and administrators with fast
              access to attendance, timetable, fees, and campus notices.
            </p>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-sm font-semibold text-white">
                  Attendance Tracker
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Monitor student attendance and daily class roll calls.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-sm font-semibold text-white">
                  Weekly Timetable
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  View full week schedules for every class and subject.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-sm font-semibold text-white">
                  Fee & Notices
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Keep parents informed with fee status and school
                  announcements.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-100 mb-2">Campus Access</p>
            <p className="leading-6">
              One login for every campus role: admin, web admin, teacher, and
              parent. Designed for trusted school use.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-300">
              School Portal
            </div>
            <h3 className="text-3xl font-extrabold text-white mt-4">
              Welcome to the Campus Dashboard
            </h3>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Log in with your school-issued credentials to access timetables,
              attendance, notices, and academic reports.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-sm shadow-rose-500/10">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-semibold text-rose-100">Login failed</p>
                  <p className="mt-1 text-[13px] text-rose-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Enter Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Admin and Web Admin accounts must be registered through the school
              signup flow. For teacher or parent access, use the credentials
              provided by administration.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
            >
              Register Admin / Web Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
