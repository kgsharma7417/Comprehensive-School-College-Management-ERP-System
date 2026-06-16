import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Icon Components ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = 1.8, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const Icons = {
  GraduationCap: (p) => (
    <Icon {...p} d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
  ),
  ArrowRight: (p) => <Icon {...p} d="M5 12h14M12 5l7 7-7 7" />,
  Shield: (p) => (
    <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  Book: (p) => (
    <Icon
      {...p}
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"
    />
  ),
  Flask: (p) => (
    <Icon
      {...p}
      d="M9 3h6M10 9 5 19a1 1 0 0 0 .9 1.4h12.2a1 1 0 0 0 .9-1.4L14 9V3h-4v6z"
    />
  ),
  Award: (p) => (
    <Icon
      {...p}
      d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.21 13.89 7 23l5-3 5 3-1.21-9.12"
    />
  ),
  Users: (p) => (
    <Icon
      {...p}
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
    />
  ),
  Activity: (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  MapPin: (p) => (
    <Icon
      {...p}
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
    />
  ),
  Mail: (p) => (
    <Icon
      {...p}
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
    />
  ),
  Phone: (p) => (
    <Icon
      {...p}
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.28 2 2 0 0 1 3.04 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16c.013.307.013.613 0 .92z"
    />
  ),
  ChevronRight: (p) => <Icon {...p} d="M9 18l6-6-6-6" />,
  Zap: (p) => <Icon {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
};

// ─── Default Content Fallbacks ────────────────────────────────────────────────
const DEFAULT_CONTENT = {
  heroTitle: "Education Managed Intelligently.",
  heroSubtitle:
    "One platform for students, teachers, parents, and administrators. Manage grades, attendance, fees, and announcements — all in one place.",
  heroImageUrl:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
  ctaText: "Enter Portal",
  statsStudents: 1500,
  statsFaculty: 95,
  statsLabs: 12,
  statsPassRate: 98,
  contactAddress: "Agra, Uttar Pradesh, India",
  contactPhone: "+91 562 234-5678",
  contactEmail: "admissions@shreehs.edu.in",
};

// ─── Counter Hook ─────────────────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, suffix = "", label, color, inView }) {
  const count = useCounter(value, 1600, inView);
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        padding: "28px 24px",
        textAlign: "center",
        boxShadow:
          "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 10px 15px -3px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02)";
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color,
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        {count}
        {suffix}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          marginTop: 8,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: IconComp, title, desc, accent, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        border: `1px solid ${hovered ? accent : "#e2e8f0"}`,
        borderRadius: 20,
        padding: "32px 28px",
        boxShadow: hovered
          ? `0 20px 50px -20px ${accent}55`
          : "0 18px 44px -20px rgba(15, 23, 42, 0.12)",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: accent + "12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          color: accent,
        }}
      >
        <IconComp size={22} />
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#0f172a",
          margin: "0 0 10px",
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </h3>
      <p
        style={{ fontSize: 14.5, color: "#475569", margin: 0, lineHeight: 1.7 }}
      >
        {desc}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const LandingPage = () => {
  const { userRole } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [statsRef, statsInView] = useInView(0.3);
  const [pageConfig, setPageConfig] = useState(DEFAULT_CONTENT);

  // Load content dynamically from localStorage (set by Web Admin)
  useEffect(() => {
    const saved = localStorage.getItem("school_erp_landing_content");
    if (saved) {
      try {
        setPageConfig({ ...DEFAULT_CONTENT, ...JSON.parse(saved) });
      } catch (e) {
        // Use dev-only logger to avoid noisy errors in production
        import("../utils/logger").then(({ error }) =>
          error("Failed to parse website config, using defaults", e),
        );
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "webadmin") return "/webadmin";
    if (userRole === "teacher") return "/teacher";
    if (userRole === "parent") return "/parent";
    return "/login";
  };

  const features = [
    {
      icon: Icons.Shield,
      title: "Role-Based Access",
      desc: "Isolated dashboards for admins, teachers, and parents. Built on Firebase Auth with Firestore rules.",
      accent: "#3b82f6",
    },
    {
      icon: Icons.Book,
      title: "Curriculum Tracking",
      desc: "Map classrooms to subjects, log attendance daily, and visualize academic progress at a glance.",
      accent: "#10b981",
    },
    {
      icon: Icons.Flask,
      title: "Lab Management",
      desc: "12 specialized labs with booking, inventory tracking, and experiment record-keeping.",
      accent: "#f97316",
    },
    {
      icon: Icons.Activity,
      title: "Live Notices",
      desc: "Push announcements to specific roles or the entire school — instantly, from any device.",
      accent: "#ec4899",
    },
    {
      icon: Icons.Award,
      title: "Results & Awards",
      desc: "Publish marksheets, generate rank lists, and recognize achievements from one panel.",
      accent: "#eab308",
    },
    {
      icon: Icons.Zap,
      title: "Fee Management",
      desc: "Track dues, issue receipts, and send automated reminders — no manual ledgers required.",
      accent: "#06b6d4",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#334155",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Ambient Background Glows (Modern Blue-White styling) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100vw",
            height: "600px",
            background:
              "radial-gradient(ellipse at center, rgba(186,230,253,0.35) 0%, rgba(241,245,249,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: "-5%",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle at center, rgba(219,234,254,0.4) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid #e2e8f0"
            : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyBetween: "space-between",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
              }}
            >
              <Icons.GraduationCap size={20} style={{ color: "#fff" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#1e3a8a",
                  letterSpacing: "-0.3px",
                }}
              >
                Shree H.S. Model
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#2563eb",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginTop: 1,
                }}
              >
                Inter College
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav
            style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 600 }}
          >
            {["Home", "About", "Admissions", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                onMouseLeave={(e) => (e.target.style.color = "#64748b")}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <Link
            to={getDashboardLink()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(37,99,235,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(37,99,235,0.25)";
            }}
          >
            {userRole ? "Dashboard" : pageConfig.ctaText}
            <Icons.ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ── Hero Section (Blue & White Two-Column) ── */}
      <section
        id="home"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px 70px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Left Column: Dynamic Text and Actions */}
          <div style={{ textAlign: "left" }}>
            {/* Pill Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 100,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                fontSize: 12,
                fontWeight: 600,
                color: "#1e40af",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              Academic Year 2024–25 Portal Now Live
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: "clamp(38px, 5vw, 64px)",
                fontWeight: 800,
                letterSpacing: "-2px",
                lineHeight: 1.1,
                margin: "0 0 24px",
                color: "#0f172a",
              }}
            >
              {pageConfig.heroTitle.split(" ").map((word, i, arr) => {
                // Style last word as blue-indigo gradient
                if (i === arr.length - 1) {
                  return (
                    <span
                      key={word}
                      style={{
                        background:
                          "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {" " + word}
                    </span>
                  );
                }
                return (i === 0 ? "" : " ") + word;
              })}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 17,
                color: "#475569",
                lineHeight: 1.7,
                margin: "0 0 36px",
              }}
            >
              {pageConfig.heroSubtitle}
            </p>

            {/* CTA Group */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link
                to={getDashboardLink()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(37,99,235,0.2)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 24px rgba(37,99,235,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(37,99,235,0.2)";
                }}
              >
                {userRole ? "Go to Dashboard" : pageConfig.ctaText}
                <Icons.ArrowRight size={17} />
              </Link>
              <a
                href="#about"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Column: Hero Image configured by Web Admin */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: -8,
                background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                borderRadius: 32,
                zIndex: -1,
                filter: "blur(8px)",
              }}
            />
            <img
              src={pageConfig.heroImageUrl}
              alt="School Campus"
              style={{
                width: "100%",
                maxHeight: "440px",
                objectFit: "cover",
                borderRadius: 24,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "4px solid #ffffff",
              }}
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop";
              }}
            />
          </div>
        </div>

        {/* ── Mini Dashboard Preview (Light Theme) ── */}
        <div
          style={{
            width: "100%",
            marginTop: 72,
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            overflow: "hidden",
            background: "#ffffff",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Fake browser bar */}
          <div
            style={{
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {["#ef4444", "#eab308", "#22c55e"].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: c,
                  opacity: 0.8,
                }}
              />
            ))}
            <div
              style={{
                marginLeft: 12,
                flex: 1,
                height: 26,
                background: "#f1f5f9",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                fontSize: 11.5,
                color: "#64748b",
              }}
            >
              erp.shreehs-college.edu/dashboard
            </div>
          </div>

          {/* Mini Dashboard Preview Row */}
          <div
            style={{
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                label: "Total Students",
                val: `${pageConfig.statsStudents}+`,
                delta: "Active ERP profiles",
                color: "#2563eb",
              },
              {
                label: "Attendance Today",
                val: "96.4%",
                delta: "+2.4% vs last week",
                color: "#10b981",
              },
              {
                label: "Labs Operational",
                val: pageConfig.statsLabs,
                delta: "Fully equipped rooms",
                color: "#f97316",
              },
              {
                label: "Passing Record",
                val: `${pageConfig.statsPassRate}%`,
                delta: "UP Board overall rate",
                color: "#ec4899",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: item.color,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {item.val}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
                  {item.delta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Counter Grid (Dynamic numbers) ── */}
      <section
        id="about"
        ref={statsRef}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 28,
            padding: "60px 48px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div
              style={{
                fontSize: 12,
                color: "#2563eb",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Our Credentials
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 850,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-1.2px",
              }}
            >
              Dynamic Metrics & Statistics
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            <StatCard
              value={pageConfig.statsStudents}
              suffix="+"
              label="Students Enrolled"
              color="#2563eb"
              inView={statsInView}
            />
            <StatCard
              value={pageConfig.statsFaculty}
              suffix="+"
              label="Expert Faculty"
              color="#10b981"
              inView={statsInView}
            />
            <StatCard
              value={pageConfig.statsLabs}
              suffix="+"
              label="Equipped Labs"
              color="#f97316"
              inView={statsInView}
            />
            <StatCard
              value={pageConfig.statsPassRate}
              suffix="%"
              label="Board Pass Rate"
              color="#ec4899"
              inView={statsInView}
            />
          </div>
        </div>
      </section>

      {/* ── Features Grid (Light Modern layout) ── */}
      <section
        id="admissions"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              fontSize: 12,
              color: "#10b981",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Platform Features
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 850,
              color: "#0f172a",
              margin: "0 auto 16px",
              letterSpacing: "-1.2px",
              maxWidth: 600,
            }}
          >
            Everything your school needs
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#475569",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            A complete ERP built ground-up for Indian inter colleges — simple,
            fast, and secure.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
            borderRadius: 28,
            padding: "64px 48px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(30, 64, 175, 0.15)",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-1px",
                margin: "0 0 16px",
              }}
            >
              Ready to simplify school management?
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "#bfdbfe",
                marginBottom: 36,
                lineHeight: 1.7,
                maxWidth: "600px",
                margin: "0 auto 36px",
              }}
            >
              Access the secure ERP login portal or contact admissions to
              register your student profile.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to={getDashboardLink()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 36px",
                  borderRadius: 12,
                  background: "#ffffff",
                  color: "#1e40af",
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-1px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                Access Portal <Icons.ArrowRight size={17} />
              </Link>
              <a
                href="#contact"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 36px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  fontWeight: 650,
                  fontSize: 15,
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
              >
                Contact Admissions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer (Deep Slate Navy color) ── */}
      <footer
        id="contact"
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid #cbd5e1",
          background: "#0f172a",
          color: "#94a3b8",
          padding: "70px 24px 40px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 40,
              marginBottom: 56,
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icons.GraduationCap size={18} style={{ color: "#fff" }} />
                </div>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}
                >
                  Shree H.S. Model
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#94a3b8",
                  lineHeight: 1.7,
                  maxWidth: 280,
                }}
              >
                Official ERP portal for Shree H.S. Model Inter College —
                bringing modern education management to Agra.
              </p>
            </div>

            {/* Contact Details (Dynamic values loaded from localStorage config) */}
            <div>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 22,
                }}
              >
                Contact
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {[
                  { icon: Icons.MapPin, text: pageConfig.contactAddress },
                  { icon: Icons.Phone, text: pageConfig.contactPhone },
                  { icon: Icons.Mail, text: pageConfig.contactEmail },
                ].map(({ icon, text }) => (
                  <li
                    key={text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "#94a3b8",
                    }}
                  >
                    {React.createElement(icon, {
                      size: 16,
                      style: { color: "#38bdf8", flexShrink: 0 },
                    })}
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Portal Navigation */}
            <div>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 22,
                }}
              >
                Portals
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[
                  { label: "Administrator Portal", to: "/login" },
                  { label: "Web Content Editor", to: "/login" },
                  { label: "Teacher Workspace", to: "/login" },
                  { label: "Parent & Student Desk", to: "/login" },
                ].map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    style={{
                      fontSize: 14,
                      color: "#94a3b8",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#38bdf8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    <Icons.ChevronRight size={13} /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: 28,
              borderTop: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            <span>
              © {new Date().getFullYear()} Shree H.S. Model Inter College. All
              rights reserved.
            </span>
            <div style={{ display: "flex", gap: 24 }}>
              {["Privacy Policy", "Terms of Service"].map((t) => (
                <a
                  key={t}
                  href="#"
                  style={{
                    color: "#64748b",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#38bdf8")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};
