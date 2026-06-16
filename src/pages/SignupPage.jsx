import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
} from "../firebase";
import { error as logError } from "../utils/logger";

export const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = result.user;
      const adminProfile = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      };

      if (db.isMock) {
        const stored = localStorage.getItem("school_erp_mock_db");
        const parsed = stored ? JSON.parse(stored) : { users: {} };
        parsed.users = parsed.users || {};
        parsed.users[user.uid] = { ...adminProfile, password };
        localStorage.setItem("school_erp_mock_db", JSON.stringify(parsed));
      } else {
        await setDoc(doc(db, "users", user.uid), adminProfile);
      }

      navigate("/login", { replace: true });
    } catch (err) {
      logError("Signup error:", err);
      setError(
        err.message || "Unable to create admin account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-white">
          {role === "webadmin" ? "Web Admin Signup" : "Admin Signup"}
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Create a {role === "webadmin" ? "web admin" : "school admin"} account
          and then login from the portal.
        </p>

        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-100 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <label className="block text-sm text-slate-300">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin name"
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="admin">Admin</option>
              <option value="webadmin">Web Admin</option>
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "webadmin" ? "webadmin@school.com" : "admin@school.com"
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? "Creating account..."
              : `Create ${role === "webadmin" ? "Web Admin" : "Admin"} Account`}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-300 hover:text-indigo-200"
          >
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};
