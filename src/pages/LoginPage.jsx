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

// ─── CSS ─────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Open+Sans:wght@300;400;500;600;700&display=swap');

  .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'Open Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* ── Left Panel ── */
  .lp-left {
    position: relative;
    background: linear-gradient(160deg, #00477a 0%, #003460 55%, #001e3c 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    overflow: hidden;
    min-height: 100vh;
  }

  /* Background subtle pattern */
  .lp-left-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }

  /* Decorative glow blobs */
  .lp-blob-1 {
    position: absolute;
    top: -100px; right: -80px;
    width: 380px; height: 380px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(209,70,90,0.28), transparent 70%);
    pointer-events: none;
  }
  .lp-blob-2 {
    position: absolute;
    bottom: -60px; left: -60px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(241,137,64,0.18), transparent 70%);
    pointer-events: none;
  }

  /* Top logo bar */
  .lp-left-header {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 14px;
  }
  .lp-left-emblem {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 2px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .lp-left-emblem img { width: 100%; height: 100%; object-fit: cover; }
  .lp-left-school-name {
    font-family: 'Playfair Display', serif;
    font-size: 15px; font-weight: 700; color: #fff;
    line-height: 1.3;
  }
  .lp-left-school-sub {
    font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-top: 2px;
  }

  /* Main left content */
  .lp-left-body {
    position: relative; z-index: 2;
    flex: 1;
    display: flex; flex-direction: column;
    justify-content: center;
    padding: 48px 0;
  }
  .lp-left-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(241,137,64,0.18);
    border: 1px solid rgba(241,137,64,0.4);
    color: #f4a261;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 6px 16px; border-radius: 100px;
    margin-bottom: 28px; width: fit-content;
  }
  .lp-left-badge .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #f4a261;
    animation: lpPulse 2s ease-in-out infinite;
  }
  @keyframes lpPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

  .lp-left-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 2.8vw, 42px);
    font-weight: 700; color: #fff;
    line-height: 1.2; margin-bottom: 20px;
    letter-spacing: -0.3px;
  }
  .lp-left-title em { color: #f4a261; font-style: normal; }
  .lp-left-desc {
    font-size: 15px; color: rgba(255,255,255,0.68);
    line-height: 1.8; margin-bottom: 44px;
    max-width: 380px;
  }

  /* Feature chips */
  .lp-features { display: flex; flex-direction: column; gap: 14px; }
  .lp-feature {
    display: flex; align-items: flex-start; gap: 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 16px 18px;
    transition: background 0.2s;
  }
  .lp-feature:hover { background: rgba(255,255,255,0.1); }
  .lp-feature-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(241,137,64,0.18);
    border: 1px solid rgba(241,137,64,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .lp-feature-text .t1 { font-size: 14px; font-weight: 700; color: #fff; }
  .lp-feature-text .t2 { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 3px; line-height: 1.5; }

  /* Bottom footer on left */
  .lp-left-footer {
    position: relative; z-index: 2;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 16px 20px;
    font-size: 12.5px; color: rgba(255,255,255,0.55);
    line-height: 1.7;
  }
  .lp-left-footer strong { color: rgba(255,255,255,0.85); }

  /* ── Right Panel ── */
  .lp-right {
    background: #f7f8fc;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 52px 60px;
    position: relative;
    min-height: 100vh;
  }

  /* Back button */
  .lp-back {
    position: absolute; top: 28px; left: 32px;
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 600;
    color: #5a7080; text-decoration: none;
    background: #fff; border: 1px solid #dde4ec;
    border-radius: 10px; padding: 8px 14px;
    transition: all 0.2s;
  }
  .lp-back:hover { color: #00477a; border-color: #00477a; background: #f0f5ff; }

  .lp-form-wrap { width: 100%; max-width: 400px; }

  /* Form header */
  .lp-form-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(0,71,122,0.08);
    border: 1px solid rgba(0,71,122,0.18);
    color: #00477a;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 6px 16px; border-radius: 100px;
    margin-bottom: 22px;
  }
  .lp-form-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(24px, 2.5vw, 34px);
    font-weight: 700; color: #1a2e3e;
    line-height: 1.2; margin-bottom: 10px;
  }
  .lp-form-sub {
    font-size: 14px; color: #5a7080;
    line-height: 1.7; margin-bottom: 36px;
  }

  /* Error alert */
  .lp-error {
    display: flex; align-items: flex-start; gap: 12px;
    background: #fff5f5;
    border: 1px solid #f5c6cb;
    border-radius: 12px; padding: 14px 16px;
    margin-bottom: 24px;
  }
  .lp-error-icon {
    width: 34px; height: 34px; border-radius: 8px;
    background: #d3465a; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
    color: #fff;
  }
  .lp-error-title { font-size: 13px; font-weight: 700; color: #9b1c2c; }
  .lp-error-msg { font-size: 12.5px; color: #b22535; margin-top: 3px; line-height: 1.5; }

  /* Input fields */
  .lp-field { margin-bottom: 20px; }
  .lp-label {
    display: block; font-size: 12px; font-weight: 700;
    color: #3a5060; text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 8px;
  }
  .lp-input-wrap { position: relative; }
  .lp-input-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    color: #8aa0b0; display: flex; align-items: center;
    pointer-events: none;
  }
  .lp-input {
    width: 100%;
    background: #fff;
    border: 1.5px solid #dde4ec;
    border-radius: 12px;
    padding: 13px 14px 13px 44px;
    font-size: 14px; color: #1a2e3e;
    font-family: 'Open Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .lp-input::placeholder { color: #aab8c4; }
  .lp-input:focus {
    border-color: #00477a;
    box-shadow: 0 0 0 4px rgba(0,71,122,0.1);
  }
  .lp-input.is-error {
    border-color: #d3465a;
    box-shadow: 0 0 0 4px rgba(211,70,90,0.1);
  }
  .lp-input.is-error:focus { border-color: #d3465a; }

  /* Submit button */
  .lp-submit {
    width: 100%;
    padding: 15px;
    border-radius: 12px;
    border: none; cursor: pointer;
    background: linear-gradient(135deg, #00477a 0%, #003460 100%);
    color: #fff;
    font-size: 15px; font-weight: 700;
    font-family: 'Open Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.25s;
    box-shadow: 0 6px 20px rgba(0,71,122,0.3);
    margin-top: 8px;
    position: relative; overflow: hidden;
  }
  .lp-submit::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
    opacity: 0; transition: opacity 0.25s;
  }
  .lp-submit:hover::before { opacity: 1; }
  .lp-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,71,122,0.38); }
  .lp-submit:active { transform: translateY(0); }
  .lp-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

  /* Spinner */
  .lp-spinner {
    width: 20px; height: 20px;
    border: 2.5px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lpSpin 0.8s linear infinite;
  }
  @keyframes lpSpin { to { transform: rotate(360deg); } }

  /* Divider */
  .lp-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 28px 0;
  }
  .lp-divider-line { flex: 1; height: 1px; background: #dde4ec; }
  .lp-divider-text { font-size: 12px; font-weight: 600; color: #8aa0b0; white-space: nowrap; }

  /* Register link */
  .lp-register {
    display: flex; flex-direction: column; gap: 14px; text-align: center;
  }
  .lp-register-note {
    font-size: 13px; color: #5a7080; line-height: 1.65;
  }
  .lp-register-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 28px;
    border-radius: 12px;
    background: #fff;
    border: 1.5px solid #dde4ec;
    color: #1a2e3e;
    font-size: 14px; font-weight: 700;
    text-decoration: none;
    font-family: 'Open Sans', sans-serif;
    transition: all 0.22s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .lp-register-btn:hover {
    border-color: #d3465a;
    color: #d3465a;
    box-shadow: 0 4px 16px rgba(211,70,90,0.15);
    transform: translateY(-2px);
  }

  /* Right side decorative accent bar */
  .lp-right-accent {
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: linear-gradient(to bottom, #d3465a, #f18940, #00477a);
  }

  /* Role indicator dots at bottom of right panel */
  .lp-roles {
    display: flex; gap: 8px; align-items: center;
    justify-content: center; margin-top: 32px;
    flex-wrap: wrap;
  }
  .lp-role-chip {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600; color: #5a7080;
    background: #fff; border: 1px solid #dde4ec;
    border-radius: 100px; padding: 4px 12px;
  }
  .lp-role-chip .dot {
    width: 6px; height: 6px; border-radius: 50%;
  }

  /* ── Responsive ── */
  @media (max-width: 800px) {
    .lp-root { grid-template-columns: 1fr; }
    .lp-left { display: none; }
    .lp-right {
      padding: 80px 28px 48px;
      background: linear-gradient(160deg, #00477a 0%, #003460 30%, #f7f8fc 30%);
    }
    .lp-right-accent { display: none; }
    .lp-form-wrap { max-width: 420px; }
    .lp-form-title { color: #1a2e3e; }
  }
  @media (max-width: 420px) {
    .lp-right { padding: 70px 20px 40px; }
  }
`;

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const { login, userRole } = useAuth();
  const navigate = useNavigate();

  // Inject CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const invalidInput = Boolean(error);

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

  useEffect(() => {
    if (userRole) {
      redirectByRole(userRole);
    }
  }, [userRole, redirectByRole]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      // login() returns { user } from the API — user.role is available immediately
      const result = await login(email, password);

      // Prefer role from API response (most reliable)
      const roleFromApi = result?.user?.role;
      if (roleFromApi) {
        redirectByRole(roleFromApi);
        return;
      }

      // Fallback: infer role from email
      const emailLower = email.trim().toLowerCase();
      if (emailLower === "admin@school.com") { redirectByRole("admin"); return; }
      if (emailLower === "webadmin@school.com") { redirectByRole("webadmin"); return; }
      if (emailLower === "teacher@school.com") { redirectByRole("teacher"); return; }
      if (emailLower === "parent@school.com") { redirectByRole("parent"); return; }

      // Last resort: wait briefly for context to update
      setTimeout(() => {
        if (userRole) redirectByRole(userRole);
        else navigate("/");
      }, 600);

    } catch (err) {
      logError(err);
      const msg = err.message || "";
      if (msg.includes("Invalid") || msg.includes("auth/invalid-credential") || msg.includes("401")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("500")) {
        setError("Server unreachable. Please make sure the backend is running on port 5000.");
      } else {
        setError("Login failed: " + (msg || "Unknown error. Please try again."));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* ── Left Panel ── */}
      <div className="lp-left">
        <div className="lp-left-pattern" />
        <div className="lp-blob-1" />
        <div className="lp-blob-2" />

        {/* School logo */}
        <div className="lp-left-header">
          <div className="lp-left-emblem">
            <img
              src="https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=100&auto=format&fit=crop"
              alt="School Logo"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
              }}
            />
          </div>
          <div>
            <div className="lp-left-school-name">Shree H.S. Model Inter College</div>
            <div className="lp-left-school-sub">Lucknow, U.P. · Est. 1998</div>
          </div>
        </div>

        {/* Main content */}
        <div className="lp-left-body">
          <div className="lp-left-badge">
            <span className="dot" />
            School Management Portal
          </div>

          <h1 className="lp-left-title">
            Welcome Back to Your <em>Campus Dashboard</em>
          </h1>

          <p className="lp-left-desc">
            Secure, role-based access for teachers, parents, and administrators.
            One portal for attendance, timetables, fees, and campus notices.
          </p>

          <div className="lp-features">
            <div className="lp-feature">
              <div className="lp-feature-icon">📋</div>
              <div className="lp-feature-text">
                <div className="t1">Attendance Tracker</div>
                <div className="t2">Monitor student attendance and daily class roll calls in real time.</div>
              </div>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon">🗓️</div>
              <div className="lp-feature-text">
                <div className="t1">Weekly Timetable</div>
                <div className="t2">View full-week schedules for every class, section, and subject.</div>
              </div>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon">📢</div>
              <div className="lp-feature-text">
                <div className="t1">Fees & Notices</div>
                <div className="t2">Stay informed with fee status, school announcements, and reports.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="lp-left-footer">
          <strong>One login for every campus role:</strong> admin, web admin,
          teacher, and parent — designed for trusted, secure school use only.
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="lp-right">
        {/* Accent bar */}
        <div className="lp-right-accent" />

        {/* Back button */}
        <Link to="/" className="lp-back">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="lp-form-wrap">
          {/* Header */}
          <div className="lp-form-eyebrow">
            <GraduationCap size={13} />
            School Portal
          </div>
          <h2 className="lp-form-title">Sign In to Your Account</h2>
          <p className="lp-form-sub">
            Enter your school-issued credentials to access your dashboard,
            timetables, attendance, and academic reports.
          </p>

          {/* Error */}
          {error && (
            <div className="lp-error">
              <div className="lp-error-icon">
                <AlertCircle size={16} />
              </div>
              <div>
                <div className="lp-error-title">Login Failed</div>
                <div className="lp-error-msg">{error}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="lp-field">
              <label className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  required
                  className={`lp-input${invalidInput ? " is-error" : ""}`}
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`lp-input${invalidInput ? " is-error" : ""}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="lp-submit"
            >
              {loginLoading ? (
                <div className="lp-spinner" />
              ) : (
                <>
                  Enter Portal <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider + register */}
          <div className="lp-divider">
            <div className="lp-divider-line" />
            <span className="lp-divider-text">New admin or web admin?</span>
            <div className="lp-divider-line" />
          </div>

          <div className="lp-register">
            <p className="lp-register-note">
              Admin and Web Admin accounts must be registered through the school
              signup flow. Teacher and parent credentials are issued by administration.
            </p>
            <Link to="/signup" className="lp-register-btn">
              Register Admin / Web Admin →
            </Link>
          </div>

          {/* Role chips */}
          <div className="lp-roles">
            <div className="lp-role-chip">
              <span className="dot" style={{ background: "#00477a" }} />
              Admin
            </div>
            <div className="lp-role-chip">
              <span className="dot" style={{ background: "#d3465a" }} />
              Web Admin
            </div>
            <div className="lp-role-chip">
              <span className="dot" style={{ background: "#f18940" }} />
              Teacher
            </div>
            <div className="lp-role-chip">
              <span className="dot" style={{ background: "#3a8a5a" }} />
              Parent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
