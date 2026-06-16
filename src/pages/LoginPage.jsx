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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Floating Home Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900/50 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Split Card */}
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl">
        {/* Left Side: Brand Promo (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-r border-slate-800 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                Shree H.S. Model
              </span>
              <span className="text-xs block text-slate-450">
                Inter College Portal
              </span>
            </div>
          </div>

          <div className="my-auto py-12 relative z-10">
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
              Unified Portal for Academic Success
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Connect teachers, manage course files, trace student fee ledgers,
              and streamline daily school tasks from one secure, glassmorphic
              workspace.
            </p>
            <div className="flex gap-4 items-center">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                  T
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                  P
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Multi-role support enabled
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 relative z-10">
            Secured using Firebase Standard Encryption.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white">Sign In</h3>
            <p className="text-sm text-slate-400 mt-1">
              Enter your ERP portal credentials
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
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
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 text-sm"
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
            <p className="text-sm text-slate-400 mb-4">
              Admin and Web Admin access must be created through the signup
              flow. Direct quick-login buttons are disabled.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              Create Admin / Web Admin Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
