import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Icons (inline SVG to avoid extra deps) ──────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  globe: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.5 2.5-4 5.9-4 10s1.5 7.5 4 10m0-20c2.5 2.5 4 5.9 4 10s-1.5 7.5-4 10M2 12h20",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8",
  image: "M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21",
  stats: "M18 20V10 M12 20V4 M6 20v-6",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  check: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
  plus: "M12 5v14 M5 12h14",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  layout: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  arrowL: "M19 12H5 M12 19l-7-7 7-7",
  x: "M18 6 6 18 M6 6l12 12",
  chevD: "M6 9l6 6 6-6",
  move: "M5 9l-3 3 3 3 M9 5l3-3 3 3 M15 19l-3 3-3-3 M19 9l3 3-3 3 M2 12h20 M12 2v20",
};

// ─── Default content (mirrors LandingPage.jsx) ────────────────────────────────
const DEFAULT_CONTENT = {
  // Hero
  heroTitle: "Shree H.S. Model\nHigh School",
  heroSubtitle: "Nurturing minds and building character since 2001. A UP Board-affiliated school in Agra committed to academic excellence, moral values, and all-round development.",
  heroImageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
  ctaText: "Enquire for Admission →",
  ctaSecondary: "Know Our School",
  heroBadge: "Admissions Open 2025–26",
  // Stats
  statsStudents: 1200,
  statsFaculty: 95,
  statsLabs: 12,
  statsPassRate: 98,
  statsYears: 23,
  // Slider images
  slides: [
    { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop", caption: "🏫 Shree H.S. Model High School — Agra" },
    { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop", caption: "📚 Modern Classrooms for Quality Learning" },
    { src: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=1200&auto=format&fit=crop", caption: "🔬 Science Laboratories — Hands-on Education" },
    { src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop", caption: "⚽ Sports Ground — All-Round Development" },
  ],
  // Gallery
  gallery: [
    { src: "https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?q=80&w=800&auto=format&fit=crop", caption: "📍 Main School Building" },
    { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop", caption: "🏫 Modern Classrooms" },
    { src: "https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?q=80&w=600&auto=format&fit=crop", caption: "📚 School Library" },
    { src: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=800&auto=format&fit=crop", caption: "🔬 Science Laboratory" },
    { src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop", caption: "⚽ Sports Ground" },
    { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop", caption: "🎭 Annual Cultural Program" },
  ],
  // Principal quote strip
  principalQuoteShort: "Education is not merely about marks — it is about kindling the flame of curiosity, discipline, and humanity in every child. At Shree H.S. Model High School, we believe every student carries infinite potential.",
  principalName: "Principal Rang Bahadur Singh Chauhan",
  principalFull: `"It is with immense pride and humility that I address the Shree H.S. Model High School family. Since our founding in 2001, we have strived to create an environment where every child feels valued, challenged, and inspired. Our school is not merely a place of academic learning — it is a second home where students develop not only their intellect, but their character, resilience, and compassion.\n\nWe believe in the holistic development of each student — through rigorous academics, creative arts, physical education, and above all, the inculcation of strong moral values. Together, we will shape the leaders and citizens of tomorrow."`,
  managerName: "Dr. P.S. Chauhan",
  managerFull: `"As the Manager of Shree H.S. Model High School, my commitment has always been to provide an institution that is accessible, affordable, and of the highest quality for the students of Agra. We have invested in modern classrooms, qualified teachers, and an environment that promotes curiosity and growth. Our students are our greatest achievement."`,
  // Contact
  contactAddress: "Shree H.S. Model High School, Agra, Uttar Pradesh – 282001",
  contactPhone: "+91 562 234-5678",
  contactPhoneAdmission: "+91 562 234-5679",
  contactEmail: "info@shreehsmodelhs.edu.in",
  contactHours: "Mon – Sat: 8:00 AM – 2:30 PM",
  // Notices
  notices: [
    { day: "20", mon: "Jun", title: "Class 10 & 12 Final Exam Schedule Released", desc: "UP Board final examination timetable for Class 10 and 12 has been released. Students are advised to collect their admit cards from the school office by 25 June.", tag: "exam" },
    { day: "15", mon: "Jun", title: "Independence Day Celebration – 15 August", desc: "All students and staff are requested to be present on 15th August at 7:00 AM for flag hoisting ceremony. Cultural programs will follow. White uniform is compulsory.", tag: "event" },
    { day: "10", mon: "Jun", title: "Parent-Teacher Meeting – Class 6 to 10", desc: "A Parent-Teacher meeting for classes 6 to 10 will be held on 22nd June (Saturday) between 9 AM – 1 PM. Parents are requested to attend and collect their child's progress report.", tag: "meeting" },
    { day: "05", mon: "Jun", title: "Half-Yearly Holiday Notice", desc: "School will remain closed from 20 June to 30 June on account of summer vacation. Classes will resume on 1st July.", tag: "holiday" },
    { day: "01", mon: "Jun", title: "Admission Open for 2025–26 Academic Session", desc: "Admissions are now open for Class 1 to Class 11. Contact the school office between 9 AM to 2 PM on working days. Documents: Birth certificate, marksheet, Aadhar card.", tag: "event" },
  ],
  // Why-us
  whyCards: [
    { icon: "🏆", title: "Academic Excellence", desc: "Consistently 98%+ result in UP Board exams with top district rankers every year." },
    { icon: "🕉️", title: "Moral Values", desc: "Character building through daily prayers, Sanskrit shloka recitation, and Yoga sessions." },
    { icon: "🔬", title: "Modern Labs", desc: "Physics, Chemistry, Biology & Computer labs with modern equipment for hands-on learning." },
    { icon: "⚽", title: "Sports & Arts", desc: "Annual sports meet, cultural programs, drawing & elocution competitions — talent nurtured." },
  ],
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --ink: #0f1117;
    --ink2: #3d4151;
    --ink3: #6b7280;
    --line: #e5e7eb;
    --surface: #f8f9fb;
    --white: #ffffff;
    --blue: #2563eb;
    --blue-l: #eff4ff;
    --blue-d: #1d4ed8;
    --green: #16a34a;
    --green-l: #f0fdf4;
    --red: #dc2626;
    --red-l: #fef2f2;
    --amber: #d97706;
    --amber-l: #fffbeb;
    --purple: #7c3aed;
    --purple-l: #f5f3ff;
    --radius: 10px;
    --shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
    --shadow-md: 0 4px 12px rgba(0,0,0,.1);
  }
  .wad-wrap { display: flex; min-height: 100vh; background: var(--surface); font-family: 'Inter', system-ui, sans-serif; color: var(--ink); }

  /* Sidebar */
  .wad-sidebar {
    width: 230px; flex-shrink: 0; background: var(--white); border-right: 1px solid var(--line);
    position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column;
  }
  .wad-logo { padding: 20px 18px 16px; border-bottom: 1px solid var(--line); }
  .wad-logo-top { display: flex; align-items: center; gap: 10px; }
  .wad-logo-icon { width: 34px; height: 34px; background: var(--blue); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .wad-logo-name { font-size: 13px; font-weight: 700; color: var(--ink); }
  .wad-logo-sub { font-size: 10.5px; color: var(--ink3); margin-top: 1px; }
  .wad-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  .wad-nav-section { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink3); padding: 10px 8px 4px; }
  .wad-nav-btn {
    display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px;
    border: none; background: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--ink2);
    text-align: left; width: 100%; transition: all .15s;
  }
  .wad-nav-btn:hover { background: var(--surface); color: var(--ink); }
  .wad-nav-btn.active { background: var(--blue-l); color: var(--blue); font-weight: 600; }
  .wad-nav-btn .nb-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: var(--surface); flex-shrink: 0; transition: all .15s; }
  .wad-nav-btn.active .nb-icon { background: var(--blue); color: #fff; }
  .wad-nav-footer { padding: 12px 10px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; }
  .wad-nav-footer-btn {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
    border: none; background: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500;
    text-align: left; width: 100%; transition: all .15s; text-decoration: none;
  }
  .wad-nav-footer-btn.view { color: var(--blue); } .wad-nav-footer-btn.view:hover { background: var(--blue-l); }
  .wad-nav-footer-btn.logout { color: var(--red); } .wad-nav-footer-btn.logout:hover { background: var(--red-l); }

  /* Main */
  .wad-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .wad-topbar { background: var(--white); border-bottom: 1px solid var(--line); padding: 0 28px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 20; }
  .wad-topbar-left { display: flex; align-items: center; gap: 10px; }
  .wad-topbar-title { font-size: 15px; font-weight: 700; color: var(--ink); }
  .wad-topbar-sub { font-size: 12px; color: var(--ink3); }
  .wad-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink3); }
  .wad-save-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 18px;
    background: var(--blue); color: #fff; border: none; border-radius: 8px;
    font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s;
  }
  .wad-save-btn:hover { background: var(--blue-d); }
  .wad-content { flex: 1; padding: 24px 28px; overflow-y: auto; }

  /* Toast */
  .wad-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    display: flex; align-items: center; gap: 10px; padding: 12px 20px;
    background: var(--ink); color: #fff; border-radius: var(--radius);
    font-size: 13px; font-weight: 500; box-shadow: var(--shadow-md);
    animation: wToastIn .25s ease;
  }
  @keyframes wToastIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
  .wad-toast.success { background: var(--green); }
  .wad-toast.error   { background: var(--red); }

  /* Cards */
  .wad-card { background: var(--white); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 20px; overflow: hidden; }
  .wad-card-header { padding: 14px 20px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; background: #fafafa; }
  .wad-card-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--ink); }
  .wad-card-title .ct-icon { width: 26px; height: 26px; border-radius: 6px; background: var(--blue-l); color: var(--blue); display: flex; align-items: center; justify-content: center; }
  .wad-card-body { padding: 20px; }

  /* Form fields */
  .wad-field { margin-bottom: 16px; }
  .wad-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--ink2); margin-bottom: 5px; text-transform: uppercase; letter-spacing: .05em; }
  .wad-input, .wad-textarea, .wad-select {
    width: 100%; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px;
    font-family: inherit; font-size: 13px; color: var(--ink); background: var(--white); outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .wad-input:focus, .wad-textarea:focus, .wad-select:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
  .wad-textarea { resize: vertical; }
  .wad-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .wad-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .wad-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  @media (max-width: 900px) { .wad-grid-4 { grid-template-columns: 1fr 1fr; } .wad-grid-3 { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .wad-grid-2, .wad-grid-3, .wad-grid-4 { grid-template-columns: 1fr; } .wad-sidebar { display: none; } }

  /* Image picker */
  .wad-img-picker { border: 2px dashed var(--line); border-radius: var(--radius); overflow: hidden; background: var(--surface); }
  .wad-img-preview { width: 100%; height: 180px; object-fit: cover; display: block; }
  .wad-img-preview.tall { height: 220px; }
  .wad-img-controls { padding: 12px 14px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; border-top: 1px solid var(--line); background: var(--white); }
  .wad-img-url-row { padding: 12px 14px; border-top: 1px solid var(--line); display: flex; gap: 8px; }
  .wad-img-url-row .wad-input { flex: 1; }
  .wad-img-empty { height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--ink3); font-size: 13px; }

  /* Pill buttons */
  .wad-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 7px; border: 1px solid var(--line); background: var(--white); font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; color: var(--ink2); }
  .wad-btn:hover { background: var(--surface); border-color: #d1d5db; }
  .wad-btn.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
  .wad-btn.primary:hover { background: var(--blue-d); }
  .wad-btn.danger { background: var(--red-l); color: var(--red); border-color: #fecaca; }
  .wad-btn.danger:hover { background: #fee2e2; }
  .wad-btn.success { background: var(--green-l); color: var(--green); border-color: #bbf7d0; }
  .wad-btn.sm { padding: 5px 9px; font-size: 11px; }
  .wad-btn.icon-only { padding: 6px; }

  /* List items (notices, slides, gallery) */
  .wad-list { display: flex; flex-direction: column; gap: 10px; }
  .wad-list-item { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; position: relative; }
  .wad-list-item-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .wad-list-item-title { font-size: 13px; font-weight: 600; color: var(--ink); flex: 1; min-width: 0; }
  .wad-list-actions { display: flex; gap: 5px; flex-shrink: 0; }
  .wad-add-row { padding: 12px; border: 2px dashed var(--line); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; gap: 7px; background: var(--white); cursor: pointer; font-size: 13px; font-weight: 600; color: var(--blue); transition: all .15s; border-style: dashed; }
  .wad-add-row:hover { background: var(--blue-l); border-color: var(--blue); }

  /* Gallery grid (preview) */
  .wad-gal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .wad-gal-item { border-radius: 8px; overflow: hidden; position: relative; border: 1px solid var(--line); aspect-ratio: 4/3; background: var(--surface); }
  .wad-gal-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wad-gal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; gap: 6px; }
  .wad-gal-item:hover .wad-gal-overlay { display: flex; }
  .wad-gal-add { border: 2px dashed var(--line); border-radius: 8px; aspect-ratio: 4/3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; color: var(--blue); font-size: 12px; font-weight: 600; background: var(--white); transition: all .15s; }
  .wad-gal-add:hover { background: var(--blue-l); border-color: var(--blue); }

  /* Slides horizontal preview */
  .wad-slide-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
  .wad-slide-thumb { position: relative; flex-shrink: 0; width: 200px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); aspect-ratio: 16/9; background: var(--surface); cursor: pointer; }
  .wad-slide-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .wad-slide-thumb .st-caption { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,.65); color: #fff; font-size: 10px; padding: 5px 8px; }
  .wad-slide-thumb .st-del { position: absolute; top: 5px; right: 5px; background: var(--red); color: #fff; border: none; border-radius: 5px; width: 22px; height: 22px; display: none; align-items: center; justify-content: center; cursor: pointer; }
  .wad-slide-thumb:hover .st-del { display: flex; }
  .wad-slide-add { flex-shrink: 0; width: 200px; aspect-ratio: 16/9; border: 2px dashed var(--line); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; cursor: pointer; color: var(--blue); font-size: 12px; font-weight: 600; background: var(--white); transition: all .15s; }
  .wad-slide-add:hover { background: var(--blue-l); border-color: var(--blue); }

  /* Tab bar */
  .wad-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--line); margin-bottom: 20px; overflow-x: auto; }
  .wad-tab { padding: 9px 16px; border: none; background: none; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--ink3); cursor: pointer; border-bottom: 2px solid transparent; transition: all .15s; white-space: nowrap; }
  .wad-tab.active { color: var(--blue); border-bottom-color: var(--blue); font-weight: 600; }
  .wad-tab:hover:not(.active) { color: var(--ink2); background: var(--surface); border-radius: 6px 6px 0 0; }

  /* Modal overlay */
  .wad-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .wad-modal { background: var(--white); border-radius: 14px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-md); }
  .wad-modal-header { padding: 18px 20px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
  .wad-modal-title { font-size: 15px; font-weight: 700; }
  .wad-modal-body { padding: 20px; }
  .wad-modal-footer { padding: 14px 20px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 8px; }

  /* Notice tag badge */
  .ntag { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 700; }
  .ntag.exam     { background: #fbe3dc; color: #8f3f23; }
  .ntag.event    { background: #e3e9fb; color: #2d3f8f; }
  .ntag.holiday  { background: #e2ecd9; color: #3f5a2a; }
  .ntag.meeting  { background: #fffbeb; color: #8a5a06; }

  /* Why cards */
  .wad-why-item { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
  .wad-why-icon-picker { font-size: 24px; cursor: pointer; padding: 6px; border-radius: 8px; border: 1px solid var(--line); background: var(--white); width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .wad-why-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }

  /* Stat counter card */
  .wad-stat-card { background: var(--white); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 18px; text-align: center; }
  .wad-stat-card .sc-label { font-size: 11px; color: var(--ink3); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
  .wad-stat-card input { text-align: center; font-size: 22px; font-weight: 700; color: var(--blue); }

  /* Unsaved indicator */
  .wad-unsaved-dot { width: 7px; height: 7px; background: var(--amber); border-radius: 50%; display: inline-block; margin-left: 6px; }

  /* Overview page */
  .wad-overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .wad-ov-card { background: var(--white); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px 16px; display: flex; align-items: center; gap: 13px; cursor: pointer; transition: all .15s; }
  .wad-ov-card:hover { border-color: var(--blue); box-shadow: var(--shadow-md); }
  .wad-ov-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .wad-ov-label { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .wad-ov-sub { font-size: 11px; color: var(--ink3); }
  .wad-reset-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--white); font-family: inherit; font-size: 12px; font-weight: 600; color: var(--ink3); cursor: pointer; transition: all .15s; }
  .wad-reset-btn:hover { background: var(--red-l); color: var(--red); border-color: #fecaca; }
`;

// ─── Image Picker Component ───────────────────────────────────────────────────
function ImagePicker({ value, onChange, label, tall = false, showCaption = false, caption = "", onCaptionChange }) {
  const [mode, setMode] = useState("url"); // "url" | "gallery"
  const [urlInput, setUrlInput] = useState(value || "");
  const [imgError, setImgError] = useState(false);

  const GALLERY_IMAGES = [
    { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop", label: "School Building 1" },
    { src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop", label: "School Building 2" },
    { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", label: "Classroom" },
    { src: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=800&auto=format&fit=crop", label: "Science Lab" },
    { src: "https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?q=80&w=800&auto=format&fit=crop", label: "Main Building" },
    { src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop", label: "Sports Ground" },
    { src: "https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?q=80&w=800&auto=format&fit=crop", label: "Library" },
    { src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=800&auto=format&fit=crop", label: "Students" },
    { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop", label: "Study" },
    { src: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop", label: "Teachers" },
    { src: "https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=800&auto=format&fit=crop", label: "Event 1" },
    { src: "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=800&auto=format&fit=crop", label: "Event 2" },
  ];

  const applyUrl = () => { if (urlInput.trim()) { onChange(urlInput.trim()); setImgError(false); } };

  return (
    <div>
      {label && <label className="wad-label">{label}</label>}
      <div className="wad-img-picker">
        {/* Mode toggle */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
          {["url", "gallery"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px", border: "none", background: mode === m ? "var(--blue-l)" : "var(--white)",
              color: mode === m ? "var(--blue)" : "var(--ink3)", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              cursor: "pointer", borderBottom: mode === m ? "2px solid var(--blue)" : "2px solid transparent",
              textTransform: "capitalize"
            }}>
              {m === "url" ? "🔗 URL se daalo" : "🖼️ Gallery se chuno"}
            </button>
          ))}
        </div>

        {/* Preview */}
        {value && !imgError ? (
          <img src={value} alt="preview" className={`wad-img-preview${tall ? " tall" : ""}`} onError={() => setImgError(true)} />
        ) : (
          <div className="wad-img-empty">
            <Icon d={ICONS.image} size={32} />
            <span>{imgError ? "Image load nahi hui — naya URL daalo" : "Koi image select nahi ki"}</span>
          </div>
        )}

        {/* URL mode */}
        {mode === "url" && (
          <div className="wad-img-url-row">
            <input
              className="wad-input"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyUrl()}
            />
            <button className="wad-btn primary" onClick={applyUrl}>Apply</button>
            {value && <button className="wad-btn danger sm icon-only" onClick={() => { onChange(""); setUrlInput(""); setImgError(false); }}><Icon d={ICONS.x} size={13} /></button>}
          </div>
        )}

        {/* Gallery mode */}
        {mode === "gallery" && (
          <div style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, maxHeight: 260, overflowY: "auto" }}>
              {GALLERY_IMAGES.map((g, i) => (
                <div key={i} onClick={() => { onChange(g.src); setUrlInput(g.src); setImgError(false); }}
                  style={{ borderRadius: 7, overflow: "hidden", cursor: "pointer", border: value === g.src ? "2px solid var(--blue)" : "2px solid transparent", aspectRatio: "4/3", position: "relative" }}>
                  <img src={g.src} alt={g.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {value === g.src && <div style={{ position: "absolute", top: 3, right: 3, background: "var(--blue)", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 9, padding: "3px 5px" }}>{g.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caption field */}
        {showCaption && (
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)" }}>
            <input className="wad-input" placeholder="Caption text (e.g. 📍 Main School Building)" value={caption} onChange={e => onCaptionChange(e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notice Modal ─────────────────────────────────────────────────────────────
function NoticeModal({ notice, onSave, onClose }) {
  const [form, setForm] = useState(notice || { day: "", mon: "Jan", title: "", desc: "", tag: "event" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    <div className="wad-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wad-modal">
        <div className="wad-modal-header">
          <div className="wad-modal-title">📋 {notice ? "Notice Edit karo" : "Naya Notice"}</div>
          <button className="wad-btn sm icon-only" onClick={onClose}><Icon d={ICONS.x} size={14} /></button>
        </div>
        <div className="wad-modal-body">
          <div className="wad-grid-2" style={{ marginBottom: 14 }}>
            <div className="wad-field">
              <label className="wad-label">Din (Day)</label>
              <input className="wad-input" type="number" min="1" max="31" value={form.day} onChange={e => set("day", e.target.value)} placeholder="20" />
            </div>
            <div className="wad-field">
              <label className="wad-label">Mahina (Month)</label>
              <select className="wad-select" value={form.mon} onChange={e => set("mon", e.target.value)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="wad-field">
            <label className="wad-label">Notice Heading</label>
            <input className="wad-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Exam schedule, event, holiday..." />
          </div>
          <div className="wad-field">
            <label className="wad-label">Vivaran (Description)</label>
            <textarea className="wad-textarea" rows={3} value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Notice ki poori jankari..." />
          </div>
          <div className="wad-field">
            <label className="wad-label">Category</label>
            <select className="wad-select" value={form.tag} onChange={e => set("tag", e.target.value)}>
              <option value="exam">📝 Exam</option>
              <option value="event">🎉 Event</option>
              <option value="meeting">👨‍👩‍👧 PTM / Meeting</option>
              <option value="holiday">🌿 Holiday</option>
            </select>
          </div>
        </div>
        <div className="wad-modal-footer">
          <button className="wad-btn" onClick={onClose}>Cancel</button>
          <button className="wad-btn primary" onClick={() => { if (form.title && form.day) onSave(form); }}>
            <Icon d={ICONS.save} size={13} /> Save Notice
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slide Modal ──────────────────────────────────────────────────────────────
function SlideModal({ slide, onSave, onClose }) {
  const [form, setForm] = useState(slide || { src: "", caption: "" });
  return (
    <div className="wad-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wad-modal">
        <div className="wad-modal-header">
          <div className="wad-modal-title">🖼️ {slide ? "Slide Edit karo" : "Naya Slide Jodo"}</div>
          <button className="wad-btn sm icon-only" onClick={onClose}><Icon d={ICONS.x} size={14} /></button>
        </div>
        <div className="wad-modal-body">
          <ImagePicker value={form.src} onChange={src => setForm(f => ({ ...f, src }))} label="Slide Image" showCaption caption={form.caption} onCaptionChange={caption => setForm(f => ({ ...f, caption }))} />
        </div>
        <div className="wad-modal-footer">
          <button className="wad-btn" onClick={onClose}>Cancel</button>
          <button className="wad-btn primary" onClick={() => { if (form.src) onSave(form); }}>
            <Icon d={ICONS.save} size={13} /> Save Slide
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Item Modal ────────────────────────────────────────────────────────
function GalleryModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || { src: "", caption: "" });
  return (
    <div className="wad-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wad-modal">
        <div className="wad-modal-header">
          <div className="wad-modal-title">🖼️ {item ? "Gallery Photo Edit" : "Naya Gallery Photo"}</div>
          <button className="wad-btn sm icon-only" onClick={onClose}><Icon d={ICONS.x} size={14} /></button>
        </div>
        <div className="wad-modal-body">
          <ImagePicker value={form.src} onChange={src => setForm(f => ({ ...f, src }))} label="Photo" tall showCaption caption={form.caption} onCaptionChange={caption => setForm(f => ({ ...f, caption }))} />
        </div>
        <div className="wad-modal-footer">
          <button className="wad-btn" onClick={onClose}>Cancel</button>
          <button className="wad-btn primary" onClick={() => { if (form.src) onSave(form); }}>
            <Icon d={ICONS.save} size={13} /> Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export const WebAdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [toast, setToast] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const [modal, setModal] = useState(null); // { type, data, index }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("school_erp_landing_content_v2");
      if (saved) setContent({ ...DEFAULT_CONTENT, ...JSON.parse(saved) });
    } catch { }
  }, []);

  const set = (key, val) => { setContent(c => ({ ...c, [key]: val })); setUnsaved(true); };
  const setNested = (key, idx, field, val) => {
    setContent(c => {
      const arr = [...(c[key] || [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...c, [key]: arr };
    });
    setUnsaved(true);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = () => {
    localStorage.setItem("school_erp_landing_content_v2", JSON.stringify(content));
    setUnsaved(false);
    showToast("✓ Saari changes save ho gayi! Landing page update ho gaya.");
  };

  const handleReset = () => {
    if (window.confirm("Sab kuch default pe reset karna chahte ho? Saari changes chali jayengi.")) {
      setContent(DEFAULT_CONTENT);
      localStorage.setItem("school_erp_landing_content_v2", JSON.stringify(DEFAULT_CONTENT));
      setUnsaved(false);
      showToast("Reset complete!", "success");
    }
  };

  // Slides CRUD
  const addSlide = (slide) => { set("slides", [...(content.slides || []), slide]); setModal(null); };
  const updateSlide = (idx, slide) => { const arr = [...content.slides]; arr[idx] = slide; set("slides", arr); setModal(null); };
  const deleteSlide = (idx) => { if (window.confirm("Ye slide delete karna chahte ho?")) set("slides", content.slides.filter((_, i) => i !== idx)); };

  // Gallery CRUD
  const addGallery = (item) => { set("gallery", [...(content.gallery || []), item]); setModal(null); };
  const updateGallery = (idx, item) => { const arr = [...content.gallery]; arr[idx] = item; set("gallery", arr); setModal(null); };
  const deleteGallery = (idx) => { if (window.confirm("Ye photo delete karna chahte ho?")) set("gallery", content.gallery.filter((_, i) => i !== idx)); };

  // Notices CRUD
  const addNotice = (n) => { set("notices", [n, ...(content.notices || [])]); setModal(null); };
  const updateNotice = (idx, n) => { const arr = [...content.notices]; arr[idx] = n; set("notices", arr); setModal(null); };
  const deleteNotice = (idx) => { if (window.confirm("Ye notice delete karna chahte ho?")) set("notices", content.notices.filter((_, i) => i !== idx)); };

  const NAV = [
    { id: "overview", label: "Overview", icon: ICONS.layout, color: "#3b82f6" },
    { id: "hero", label: "Hero Section", icon: ICONS.image, color: "#8b5cf6" },
    { id: "stats", label: "Stats / Counters", icon: ICONS.stats, color: "#10b981" },
    { id: "slides", label: "Image Slider", icon: ICONS.move, color: "#f59e0b" },
    { id: "gallery", label: "Gallery", icon: ICONS.grid, color: "#ec4899" },
    { id: "notices", label: "Notice Board", icon: ICONS.bell, color: "#ef4444" },
    { id: "principal", label: "Principal / About", icon: ICONS.users, color: "#6366f1" },
    { id: "why", label: "Why Choose Us", icon: ICONS.check, color: "#14b8a6" },
    { id: "contact", label: "Contact / Footer", icon: ICONS.phone, color: "#f97316" },
  ];

  const SECTION_LABELS = { overview: "Overview", hero: "Hero Section", stats: "Stats", slides: "Image Slider", gallery: "Gallery", notices: "Notice Board", principal: "Principal / About", why: "Why Choose Us", contact: "Contact" };

  return (
    <>
      <style>{STYLES}</style>
      <div className="wad-wrap">

        {/* ── Sidebar ── */}
        <aside className="wad-sidebar">
          <div className="wad-logo">
            <div className="wad-logo-top">
              <div className="wad-logo-icon"><Icon d={ICONS.globe} size={16} /></div>
              <div>
                <div className="wad-logo-name">Web Admin</div>
                <div className="wad-logo-sub">Landing Page Control</div>
              </div>
            </div>
          </div>
          <nav className="wad-nav">
            <div className="wad-nav-section">Sections</div>
            {NAV.map(n => (
              <button key={n.id} className={`wad-nav-btn${section === n.id ? " active" : ""}`} onClick={() => setSection(n.id)}>
                <div className="nb-icon" style={section === n.id ? {} : { color: n.color }}>
                  <Icon d={n.icon} size={14} />
                </div>
                {n.label}
                {unsaved && section === n.id && <span className="wad-unsaved-dot" />}
              </button>
            ))}
          </nav>
          <div className="wad-nav-footer">
            <button className="wad-nav-footer-btn view" onClick={() => navigate("/")}>
              <Icon d={ICONS.eye} size={14} /> Live Site dekho
            </button>
            <button className="wad-nav-footer-btn logout" onClick={logout}>
              <Icon d={ICONS.logout} size={14} /> Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="wad-main">
          {/* Topbar */}
          <div className="wad-topbar">
            <div className="wad-topbar-left">
              <div>
                <div className="wad-topbar-title">{SECTION_LABELS[section]}</div>
                <div className="wad-breadcrumb">
                  <span>Shree H.S. Model</span>
                  <span style={{ color: "var(--line)" }}>›</span>
                  <span style={{ color: "var(--blue)" }}>{SECTION_LABELS[section]}</span>
                  {unsaved && <span style={{ color: "var(--amber)", fontWeight: 600 }}>• Unsaved changes</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="wad-reset-btn" onClick={handleReset}>↺ Reset</button>
              <button className="wad-save-btn" onClick={handleSave}>
                <Icon d={ICONS.save} size={14} /> Save karo
              </button>
            </div>
          </div>

          <div className="wad-content">

            {/* ── OVERVIEW ── */}
            {section === "overview" && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Landing Page ka poora control yahan hai 👋</h2>
                  <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>Kisi bhi section pe click karo — hero image, slider, gallery, notices sab edit kar sakte ho. Save karne ke baad live site turant update ho jaata hai.</p>
                </div>
                <div className="wad-overview-grid">
                  {NAV.filter(n => n.id !== "overview").map(n => (
                    <div key={n.id} className="wad-ov-card" onClick={() => setSection(n.id)}>
                      <div className="wad-ov-icon" style={{ background: n.color + "20", color: n.color }}>
                        <Icon d={n.icon} size={18} />
                      </div>
                      <div>
                        <div className="wad-ov-label">{n.label}</div>
                        <div className="wad-ov-sub" style={{ color: n.color }}>Edit →</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title">
                      <div className="ct-icon"><Icon d={ICONS.check} size={13} /></div>
                      Abhi kya save hua hai
                    </div>
                  </div>
                  <div className="wad-card-body">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: "var(--ink2)" }}>
                      <span>🖼️ <b>{(content.slides || []).length}</b> slides</span>
                      <span>📷 <b>{(content.gallery || []).length}</b> gallery photos</span>
                      <span>📋 <b>{(content.notices || []).length}</b> notices</span>
                      <span>🏆 Pass Rate: <b>{content.statsPassRate}%</b></span>
                      <span>👨‍🎓 Students: <b>{content.statsStudents}+</b></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── HERO ── */}
            {section === "hero" && (
              <div>
                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.image} size={13} /></div>Hero Main Image</div>
                  </div>
                  <div className="wad-card-body">
                    <ImagePicker label="Hero Image (Right side ka photo)" value={content.heroImageUrl} onChange={v => set("heroImageUrl", v)} tall />
                  </div>
                </div>

                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.edit} size={13} /></div>Hero Text Content</div>
                  </div>
                  <div className="wad-card-body">
                    <div className="wad-field">
                      <label className="wad-label">Admission Badge Text</label>
                      <input className="wad-input" value={content.heroBadge} onChange={e => set("heroBadge", e.target.value)} placeholder="Admissions Open 2025–26" />
                    </div>
                    <div className="wad-field">
                      <label className="wad-label">Hero Headline (Main Title)</label>
                      <textarea className="wad-textarea" rows={2} value={content.heroTitle} onChange={e => set("heroTitle", e.target.value)} />
                    </div>
                    <div className="wad-field">
                      <label className="wad-label">Hero Subtitle (Description)</label>
                      <textarea className="wad-textarea" rows={3} value={content.heroSubtitle} onChange={e => set("heroSubtitle", e.target.value)} />
                    </div>
                    <div className="wad-grid-2">
                      <div className="wad-field">
                        <label className="wad-label">Primary Button Text</label>
                        <input className="wad-input" value={content.ctaText} onChange={e => set("ctaText", e.target.value)} />
                      </div>
                      <div className="wad-field">
                        <label className="wad-label">Secondary Button Text</label>
                        <input className="wad-input" value={content.ctaSecondary} onChange={e => set("ctaSecondary", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STATS ── */}
            {section === "stats" && (
              <div className="wad-card">
                <div className="wad-card-header">
                  <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.stats} size={13} /></div>Hero Stats / Counter Numbers</div>
                  <span style={{ fontSize: 11, color: "var(--ink3)" }}>Hero section mein dikhte hain</span>
                </div>
                <div className="wad-card-body">
                  <div className="wad-grid-4">
                    {[
                      { key: "statsStudents", label: "Students Enrolled", suffix: "+" },
                      { key: "statsFaculty", label: "Expert Faculty", suffix: "+" },
                      { key: "statsPassRate", label: "Board Pass Rate", suffix: "%" },
                      { key: "statsYears", label: "Years of Legacy", suffix: "+" },
                    ].map(s => (
                      <div key={s.key} className="wad-stat-card">
                        <div className="sc-label">{s.label}</div>
                        <input
                          className="wad-input"
                          type="number"
                          value={content[s.key]}
                          onChange={e => set(s.key, parseInt(e.target.value) || 0)}
                          style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "var(--blue)" }}
                        />
                        <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>Site pe dikhega: <b>{content[s.key]}{s.suffix}</b></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: 12, background: "var(--surface)", borderRadius: 8, fontSize: 12, color: "var(--ink3)" }}>
                    💡 Ye numbers hero section ke niche scroll karke stats mein dikhte hain.
                  </div>
                </div>
              </div>
            )}

            {/* ── SLIDES ── */}
            {section === "slides" && (
              <div className="wad-card">
                <div className="wad-card-header">
                  <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.move} size={13} /></div>Image Slider (Home page)</div>
                  <button className="wad-btn primary sm" onClick={() => setModal({ type: "slide" })}>
                    <Icon d={ICONS.plus} size={12} /> Slide Jodo
                  </button>
                </div>
                <div className="wad-card-body">
                  <div className="wad-slide-strip">
                    {(content.slides || []).map((slide, idx) => (
                      <div key={idx} className="wad-slide-thumb">
                        <img src={slide.src} alt={slide.caption} onError={e => e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400&auto=format&fit=crop"} />
                        <div className="st-caption">{slide.caption || `Slide ${idx + 1}`}</div>
                        <button className="st-del" onClick={() => deleteSlide(idx)}><Icon d={ICONS.x} size={11} /></button>
                        <div style={{ position: "absolute", top: 5, left: 5, background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 5, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}
                          onClick={() => setModal({ type: "slide", data: slide, index: idx })}>✏️ Edit</div>
                      </div>
                    ))}
                    <div className="wad-slide-add" onClick={() => setModal({ type: "slide" })}>
                      <Icon d={ICONS.plus} size={20} />
                      <span>Naya Slide</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink3)" }}>
                    💡 Slides home page pe hero ke niche auto-play hote hain. Edit ya delete karne ke liye slide pe hover karo.
                  </div>
                </div>
              </div>
            )}

            {/* ── GALLERY ── */}
            {section === "gallery" && (
              <div className="wad-card">
                <div className="wad-card-header">
                  <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.grid} size={13} /></div>School Gallery Photos</div>
                  <button className="wad-btn primary sm" onClick={() => setModal({ type: "gallery" })}>
                    <Icon d={ICONS.plus} size={12} /> Photo Jodo
                  </button>
                </div>
                <div className="wad-card-body">
                  <div className="wad-gal-grid">
                    {(content.gallery || []).map((item, idx) => (
                      <div key={idx} className="wad-gal-item">
                        <img src={item.src} alt={item.caption} onError={e => e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400&auto=format&fit=crop"} />
                        <div className="wad-gal-overlay">
                          <button className="wad-btn sm" style={{ background: "#fff", color: "var(--ink)" }} onClick={() => setModal({ type: "gallery", data: item, index: idx })}>
                            <Icon d={ICONS.edit} size={12} /> Edit
                          </button>
                          <button className="wad-btn sm danger" onClick={() => deleteGallery(idx)}>
                            <Icon d={ICONS.trash} size={12} /> Delete
                          </button>
                        </div>
                        {item.caption && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 10, padding: "4px 7px" }}>{item.caption}</div>}
                      </div>
                    ))}
                    <div className="wad-gal-add" onClick={() => setModal({ type: "gallery" })}>
                      <Icon d={ICONS.plus} size={22} />
                      <span>Photo Jodo</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink3)" }}>
                    💡 Gallery mein pehla photo (index 0) bada dikhta hai. Photo pe hover karo edit/delete karne ke liye.
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTICES ── */}
            {section === "notices" && (
              <div className="wad-card">
                <div className="wad-card-header">
                  <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.bell} size={13} /></div>Notice Board</div>
                  <button className="wad-btn primary sm" onClick={() => setModal({ type: "notice" })}>
                    <Icon d={ICONS.plus} size={12} /> Naya Notice
                  </button>
                </div>
                <div className="wad-card-body">
                  <div className="wad-list">
                    {(content.notices || []).map((n, idx) => (
                      <div key={idx} className="wad-list-item">
                        <div className="wad-list-item-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ background: "var(--ink)", color: "#fff", borderRadius: 7, padding: "6px 10px", textAlign: "center", minWidth: 44, flexShrink: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{n.day}</div>
                              <div style={{ fontSize: 9, color: "#f59e0b", textTransform: "uppercase" }}>{n.mon}</div>
                            </div>
                            <div>
                              <div className="wad-list-item-title">{n.title}</div>
                              <span className={`ntag ${n.tag}`}>{n.tag}</span>
                            </div>
                          </div>
                          <div className="wad-list-actions">
                            <button className="wad-btn sm" onClick={() => setModal({ type: "notice", data: n, index: idx })}>
                              <Icon d={ICONS.edit} size={12} /> Edit
                            </button>
                            <button className="wad-btn sm danger icon-only" onClick={() => deleteNotice(idx)}>
                              <Icon d={ICONS.trash} size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6 }}>{n.desc}</div>
                      </div>
                    ))}
                    <div className="wad-add-row" onClick={() => setModal({ type: "notice" })}>
                      <Icon d={ICONS.plus} size={15} /> Naya Notice Jodo
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PRINCIPAL / ABOUT ── */}
            {section === "principal" && (
              <div>
                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.users} size={13} /></div>Principal ka Short Quote (Home page)</div>
                  </div>
                  <div className="wad-card-body">
                    <div className="wad-field">
                      <label className="wad-label">Principal ka Naam</label>
                      <input className="wad-input" value={content.principalName} onChange={e => set("principalName", e.target.value)} />
                    </div>
                    <div className="wad-field">
                      <label className="wad-label">Short Quote (Home page strip mein dikhta hai)</label>
                      <textarea className="wad-textarea" rows={3} value={content.principalQuoteShort} onChange={e => set("principalQuoteShort", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.edit} size={13} /></div>Principal ka Full Message (About page)</div>
                  </div>
                  <div className="wad-card-body">
                    <div className="wad-field">
                      <label className="wad-label">Full Message</label>
                      <textarea className="wad-textarea" rows={6} value={content.principalFull} onChange={e => set("principalFull", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.users} size={13} /></div>Manager ka Message</div>
                  </div>
                  <div className="wad-card-body">
                    <div className="wad-field">
                      <label className="wad-label">Manager ka Naam</label>
                      <input className="wad-input" value={content.managerName} onChange={e => set("managerName", e.target.value)} />
                    </div>
                    <div className="wad-field">
                      <label className="wad-label">Manager ka Message</label>
                      <textarea className="wad-textarea" rows={4} value={content.managerFull} onChange={e => set("managerFull", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── WHY CHOOSE US ── */}
            {section === "why" && (
              <div className="wad-card">
                <div className="wad-card-header">
                  <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.check} size={13} /></div>Why Choose Us — Cards</div>
                </div>
                <div className="wad-card-body">
                  {(content.whyCards || []).map((card, idx) => (
                    <div key={idx} className="wad-why-item">
                      <div className="wad-why-icon-picker" title="Emoji icon">{card.icon}</div>
                      <div className="wad-why-fields">
                        <div className="wad-grid-2" style={{ marginBottom: 0 }}>
                          <input className="wad-input" placeholder="Emoji icon (e.g. 🏆)" value={card.icon}
                            onChange={e => { const a = [...content.whyCards]; a[idx] = { ...a[idx], icon: e.target.value }; set("whyCards", a); }} />
                          <input className="wad-input" placeholder="Card Title" value={card.title}
                            onChange={e => { const a = [...content.whyCards]; a[idx] = { ...a[idx], title: e.target.value }; set("whyCards", a); }} />
                        </div>
                        <textarea className="wad-textarea" rows={2} placeholder="Description..." value={card.desc}
                          onChange={e => { const a = [...content.whyCards]; a[idx] = { ...a[idx], desc: e.target.value }; set("whyCards", a); }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <button className="wad-add-row" onClick={() => set("whyCards", [...(content.whyCards || []), { icon: "⭐", title: "Naya Feature", desc: "Iska vivaran yahan likhein." }])}>
                      <Icon d={ICONS.plus} size={15} /> Naya Card Jodo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── CONTACT ── */}
            {section === "contact" && (
              <div>
                <div className="wad-card">
                  <div className="wad-card-header">
                    <div className="wad-card-title"><div className="ct-icon"><Icon d={ICONS.phone} size={13} /></div>Contact Details (Footer + Contact page)</div>
                  </div>
                  <div className="wad-card-body">
                    <div className="wad-field">
                      <label className="wad-label">Poora Pata (Address)</label>
                      <textarea className="wad-textarea" rows={2} value={content.contactAddress} onChange={e => set("contactAddress", e.target.value)} />
                    </div>
                    <div className="wad-grid-2">
                      <div className="wad-field">
                        <label className="wad-label">Main Phone Number</label>
                        <input className="wad-input" value={content.contactPhone} onChange={e => set("contactPhone", e.target.value)} />
                      </div>
                      <div className="wad-field">
                        <label className="wad-label">Admission Enquiry Number</label>
                        <input className="wad-input" value={content.contactPhoneAdmission} onChange={e => set("contactPhoneAdmission", e.target.value)} />
                      </div>
                      <div className="wad-field">
                        <label className="wad-label">Email Address</label>
                        <input className="wad-input" type="email" value={content.contactEmail} onChange={e => set("contactEmail", e.target.value)} />
                      </div>
                      <div className="wad-field">
                        <label className="wad-label">Office Hours</label>
                        <input className="wad-input" value={content.contactHours} onChange={e => set("contactHours", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type === "slide" && (
        <SlideModal
          slide={modal.data}
          onSave={slide => modal.index !== undefined ? updateSlide(modal.index, slide) : addSlide(slide)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "gallery" && (
        <GalleryModal
          item={modal.data}
          onSave={item => modal.index !== undefined ? updateGallery(modal.index, item) : addGallery(item)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "notice" && (
        <NoticeModal
          notice={modal.data}
          onSave={n => modal.index !== undefined ? updateNotice(modal.index, n) : addNotice(n)}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <div className={`wad-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
};