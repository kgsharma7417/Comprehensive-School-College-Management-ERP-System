import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── CSS Injection ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --clay: #b85c38;
    --clay-deep: #8f3f23;
    --indigo: #1f2937;
    --indigo-deep: #14181f;
    --marigold: #e8a317;
    --marigold-light: #fdf2dc;
    --sandstone: #f6f1e7;
    --sandstone-deep: #ece3d0;
    --white: #ffffff;
    --ink: #211b16;
    --ink-soft: #5b5248;
    --ink-faint: #8d8273;
    --line: #e3d9c6;
    --sidebar-w: 270px;
    --topbar-h: 68px;
    --radius: 14px;
    --shadow: 0 2px 14px rgba(33,27,22,0.08);
    --shadow-lg: 0 14px 40px rgba(33,27,22,0.14);
    --focus: 0 0 0 3px rgba(232,163,23,0.55);
  }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
    background: var(--sandstone);
    color: var(--ink);
    overflow-x: hidden;
  }

  /* ── Tricolor bar ── */
  .lp-tricolor { height: 4px; background: linear-gradient(to right, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%); position: fixed; top: 0; left: 0; right: 0; z-index: 300; }

  /* ── Topbar ── */
  .lp-topbar {
    position: fixed; top: 4px; left: 0; right: 0; z-index: 200;
    height: var(--topbar-h);
    background: var(--indigo-deep);
    display: flex; align-items: center;
    padding: 0 22px; gap: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
  }
  .lp-hamburger {
    background: none; border: none; cursor: pointer;
    display: flex; flex-direction: column; gap: 5px;
    padding: 8px; border-radius: 8px; transition: background 0.2s;
  }
  .lp-hamburger:hover { background: rgba(255,255,255,0.1); }
  .lp-hamburger span {
    display: block; width: 22px; height: 2px;
    background: var(--marigold); border-radius: 2px;
    transition: all 0.35s cubic-bezier(.4,0,.2,1);
  }
  .lp-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .lp-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .lp-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  .lp-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
  .lp-logo-emblem {
    width: 42px; height: 42px; border-radius: 10px;
    background: linear-gradient(150deg, var(--clay), var(--clay-deep));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700;
    color: var(--marigold-light); flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(184,92,56,0.45);
  }
  .lp-logo-name { line-height: 1.25; }
  .lp-logo-name .t1 { font-size: 15px; font-weight: 700; color: #fff; font-family: 'Fraunces', serif; }
  .lp-logo-name .t2 { font-size: 10px; font-weight: 500; color: #9aa3af; letter-spacing: 0.08em; text-transform: uppercase; }

  .lp-topnav { margin-left: auto; display: flex; gap: 2px; align-items: center; }
  .lp-topnav a, .lp-topnav button:not(.lp-admit-btn) {
    position: relative; font-size: 13px; font-weight: 600; color: #e2e8f0;
    text-decoration: none; padding: 9px 16px; border-radius: 8px; transition: all 0.2s;
    background: none; border: none; cursor: pointer; font-family: inherit;
  }
  .lp-topnav a:hover, .lp-topnav button:not(.lp-admit-btn):hover { background: rgba(255,255,255,0.12); color: #fff; }
  .lp-topnav a.active, .lp-topnav button:not(.lp-admit-btn).active { color: #fff; }
  .lp-topnav a.active::after, .lp-topnav button:not(.lp-admit-btn).active::after {
    content: ''; position: absolute; left: 16px; right: 16px; bottom: 3px;
    height: 2px; background: var(--marigold); border-radius: 2px;
  }
  .lp-admit-btn {
    background: var(--marigold) !important; color: var(--indigo-deep) !important;
    font-weight: 700 !important; padding: 9px 18px !important;
    border-radius: 8px; margin-left: 6px;
  }
  .lp-admit-btn::after { display: none !important; }
  .lp-admit-btn:hover { background: #d4930f !important; color: #fff !important; }

  /* ── Sidebar ── */
  .lp-sidebar {
    position: fixed; top: calc(var(--topbar-h) + 4px); left: 0; bottom: 0;
    width: var(--sidebar-w); z-index: 150;
    background: var(--white); border-right: 1px solid var(--line);
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(.4,0,.2,1);
    overflow-y: auto; box-shadow: 4px 0 28px rgba(33,27,22,0.10);
  }
  .lp-sidebar.open { transform: translateX(0); }
  .lp-overlay {
    display: none; position: fixed; inset: 0; z-index: 140;
    background: rgba(20,16,12,0.4);
  }
  .lp-overlay.show { display: block; }
  .sb-section { padding: 20px 16px 8px; }
  .sb-label { font-size: 10px; font-weight: 700; color: var(--ink-faint); letter-spacing: 0.12em; text-transform: uppercase; padding: 0 8px; margin-bottom: 8px; }
  .sb-link {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px; border-radius: 10px;
    text-decoration: none; color: var(--ink-soft);
    font-size: 14px; font-weight: 500; transition: all 0.18s; margin-bottom: 2px;
    background: none; border: none; width: 100%; cursor: pointer; text-align: left;
  }
  .sb-link .sb-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--sandstone-deep);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0; transition: all 0.18s;
  }
  .sb-link:hover { background: var(--marigold-light); color: var(--clay-deep); }
  .sb-link:hover .sb-icon { background: var(--marigold); }
  .sb-link.active { background: #fdf2dc; color: var(--clay-deep); font-weight: 700; }
  .sb-link.active .sb-icon { background: var(--clay); color: #fff; }
  .sb-divider { height: 1px; background: var(--sandstone-deep); margin: 8px 16px; }

  /* ── Main layout ── */
  .lp-main { margin-top: calc(var(--topbar-h) + 4px); min-height: calc(100vh - var(--topbar-h) - 4px); }
  .lp-section { display: none; }
  .lp-section.active { display: block; animation: lpFadeIn 0.4s ease; }
  @keyframes lpFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Hero ── */
  .lp-hero {
    background: linear-gradient(165deg, var(--indigo-deep) 0%, var(--indigo) 55%, #2a2118 100%);
    position: relative; overflow: hidden; min-height: 560px;
    display: flex; align-items: center; padding: 64px 40px;
  }
  .lp-hero::before {
    content: ''; position: absolute; top: -100px; right: -100px;
    width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(184,92,56,0.28), transparent 70%);
    pointer-events: none;
  }
  .lp-hero::after {
    content: ''; position: absolute; bottom: -80px; left: 12%;
    width: 320px; height: 320px; border-radius: 50%;
    background: radial-gradient(circle, rgba(232,163,23,0.12), transparent 70%);
    pointer-events: none;
  }
  .lp-hero-motif {
    position: absolute; top: 0; right: 0; bottom: 0; width: 38%;
    opacity: 0.5; pointer-events: none;
    background-image: radial-gradient(circle at 20% 20%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 50% 20%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 80% 20%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 35% 50%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 65% 50%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 20% 80%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 50% 80%, rgba(232,163,23,0.16) 0, transparent 3%),
      radial-gradient(circle at 80% 80%, rgba(232,163,23,0.16) 0, transparent 3%);
    background-size: 70px 70px;
  }

  /* ── Hero split layout ── */
  .lp-hero-inner {
    position: relative; z-index: 2; width: 100%;
    display: grid; grid-template-columns: 1.05fr 0.95fr;
    gap: 30px; align-items: center;
  }
  .lp-hero-content { max-width: 640px; }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(232,163,23,0.16); border: 1px solid rgba(232,163,23,0.4);
    color: var(--marigold); font-size: 12px; font-weight: 600;
    padding: 6px 15px; border-radius: 100px; margin-bottom: 26px; letter-spacing: 0.04em;
    opacity: 0; animation: lpRise 0.7s cubic-bezier(.16,1,.3,1) 0.05s forwards;
  }
  .lp-hero-badge .dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--marigold);
    animation: lpPulse 2s infinite;
  }
  @keyframes lpPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes lpRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  .lp-hero h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(30px, 5vw, 54px); font-weight: 700; color: #fff;
    line-height: 1.12; margin-bottom: 18px; letter-spacing: -0.5px;
    opacity: 0; animation: lpRise 0.75s cubic-bezier(.16,1,.3,1) 0.15s forwards;
  }
  .lp-hero h1 em { color: var(--marigold); font-style: normal; }
  .lp-hero p {
    font-size: 15.5px; color: #c3c9d3; line-height: 1.8; margin-bottom: 34px; max-width: 560px;
    opacity: 0; animation: lpRise 0.75s cubic-bezier(.16,1,.3,1) 0.28s forwards;
  }
  .lp-hero-btns {
    display: flex; gap: 12px; flex-wrap: wrap;
    opacity: 0; animation: lpRise 0.75s cubic-bezier(.16,1,.3,1) 0.4s forwards;
  }
  .lp-btn-primary {
    padding: 14px 30px; border-radius: 10px;
    background: var(--marigold); color: var(--indigo-deep);
    font-weight: 700; font-size: 14px; text-decoration: none;
    border: none; cursor: pointer; transition: all 0.22s;
    display: inline-flex; align-items: center; gap: 8px; font-family: inherit;
  }
  .lp-btn-primary:hover { background: #d4930f; color: #fff; transform: translateY(-2px); }
  .lp-btn-outline {
    padding: 14px 30px; border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,0.28);
    color: #fff; background: rgba(255,255,255,0.06);
    font-weight: 600; font-size: 14px; text-decoration: none;
    cursor: pointer; transition: all 0.22s;
    display: inline-flex; align-items: center; gap: 8px; font-family: inherit;
  }
  .lp-btn-outline:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.5); }
  .lp-hero-stats {
    display: flex; gap: 34px; flex-wrap: wrap; margin-top: 42px;
    padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);
    opacity: 0; animation: lpRise 0.75s cubic-bezier(.16,1,.3,1) 0.52s forwards;
  }
  .lp-hero-stat .num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: var(--marigold); }
  .lp-hero-stat .lbl { font-size: 12px; color: #aab2bf; margin-top: 3px; font-weight: 500; }

  /* ── Hero visual (right side — rotating slideshow with mouse-tilt + blended edges) ── */
  .lp-hero-visual {
    position: relative; height: 460px; display: flex; align-items: center; justify-content: center;
    perspective: 1400px;
    opacity: 0; animation: lpVisualRise 0.9s cubic-bezier(.16,1,.3,1) 0.3s forwards;
  }
  @keyframes lpVisualRise { from { opacity: 0; transform: translateY(26px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

  .lp-hero-visual-stage {
    position: relative; width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.25s cubic-bezier(.22,1,.36,1);
    will-change: transform;
  }

  .lp-hero-glow {
    position: absolute; inset: -40px;
    background: radial-gradient(circle at 50% 45%, rgba(232,163,23,0.30) 0%, rgba(184,92,56,0.16) 38%, transparent 72%);
    filter: blur(6px);
    animation: lpGlowBreathe 5s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes lpGlowBreathe { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }

  .lp-hero-frame {
    position: relative; width: 88%; height: 88%; margin: 0 auto;
    border-radius: 26px; overflow: hidden;
    transform: translateZ(20px);
    box-shadow:
      0 30px 60px -15px rgba(0,0,0,0.55),
      0 10px 24px -8px rgba(0,0,0,0.4),
      0 0 0 1px rgba(255,255,255,0.06) inset;
    animation: lpFloat 6.5s ease-in-out infinite;
  }
  @keyframes lpFloat { 0%,100% { transform: translateZ(20px) translateY(0px); } 50% { transform: translateZ(20px) translateY(-14px); } }

  /* stack of crossfading slides inside the frame */
  .lp-hero-slide {
    position: absolute; inset: 0;
    opacity: 0;
    transition: opacity 1.1s ease;
    pointer-events: none;
  }
  .lp-hero-slide.is-active {
    opacity: 1;
    z-index: 1;
  }
  .lp-hero-slide img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transform: scale(1.06);
    filter: saturate(1.08) contrast(1.04);
    animation: lpKenBurns 7s ease-out forwards;
  }
  @keyframes lpKenBurns {
    from { transform: scale(1.0); }
    to   { transform: scale(1.12); }
  }

  /* blended / faded edges so the photo melts into the hero background */
  .lp-hero-frame-shade {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background:
      linear-gradient(180deg, rgba(20,24,31,0.5) 0%, transparent 22%, transparent 70%, rgba(20,24,31,0.65) 100%),
      linear-gradient(90deg, rgba(20,24,31,0.55) 0%, transparent 26%, transparent 78%, rgba(20,24,31,0.4) 100%);
  }
  .lp-hero-frame-vignette {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    box-shadow: inset 0 0 70px 18px rgba(20,24,31,0.55);
    mix-blend-mode: multiply;
    border-radius: 26px;
  }

  .lp-hero-frame-caption {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 3;
    padding: 22px 22px 16px;
    background: linear-gradient(0deg, rgba(15,18,24,0.9) 0%, transparent 100%);
    color: #fff; font-size: 13.5px; font-weight: 600;
    transform: translateZ(28px);
    display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;
  }
  .lp-hero-frame-caption span.txt {
    transition: opacity 0.4s ease;
  }

  /* progress dots for the slideshow, sitting in the caption bar */
  .lp-hero-frame-dots { display: flex; gap: 6px; flex-shrink: 0; padding-bottom: 2px; }
  .lp-hero-frame-dot {
    width: 16px; height: 3px; border-radius: 3px;
    background: rgba(255,255,255,0.3); border: none; cursor: pointer; padding: 0;
    transition: background 0.25s;
  }
  .lp-hero-frame-dot.is-active { background: var(--marigold); }

  /* floating accent chips around the frame, drifting gently */
  .lp-hero-chip {
    position: absolute; z-index: 4;
    background: rgba(20,24,31,0.72);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px; padding: 10px 14px;
    display: flex; align-items: center; gap: 9px;
    box-shadow: 0 14px 30px rgba(0,0,0,0.35);
    transform: translateZ(60px);
  }
  .lp-hero-chip .ic {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
    background: var(--marigold); flex-shrink: 0;
  }
  .lp-hero-chip .tx { line-height: 1.25; }
  .lp-hero-chip .tx .v { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 700; color: #fff; }
  .lp-hero-chip .tx .l { font-size: 10px; color: #aab2bf; }
  .lp-chip-1 { top: 6%; left: -6%; animation: lpDriftA 5.5s ease-in-out infinite; }
  .lp-chip-2 { bottom: 13%; right: -7%; animation: lpDriftB 6.2s ease-in-out infinite; }
  @keyframes lpDriftA { 0%,100% { transform: translateZ(60px) translateY(0) rotate(-2deg); } 50% { transform: translateZ(60px) translateY(-10px) rotate(1deg); } }
  @keyframes lpDriftB { 0%,100% { transform: translateZ(60px) translateY(0) rotate(2deg); } 50% { transform: translateZ(60px) translateY(12px) rotate(-1deg); } }

  .lp-hero-ring {
    position: absolute; border-radius: 50%;
    border: 1px solid rgba(232,163,23,0.25);
    pointer-events: none; transform-style: preserve-3d;
  }
  .lp-ring-1 { width: 120%; height: 120%; top: -10%; left: -10%; transform: translateZ(-10px); animation: lpSpin 26s linear infinite; }
  .lp-ring-2 { width: 96%; height: 96%; top: 2%; left: 2%; border-color: rgba(184,92,56,0.22); transform: translateZ(-4px); animation: lpSpin 18s linear infinite reverse; }
  @keyframes lpSpin { from { transform: translateZ(-10px) rotate(0deg); } to { transform: translateZ(-10px) rotate(360deg); } }

  /* particles drifting behind the frame */
  .lp-hero-particle {
    position: absolute; border-radius: 50%; background: var(--marigold);
    opacity: 0.55; pointer-events: none; transform: translateZ(-2px);
    animation: lpParticleFloat 7s ease-in-out infinite;
  }
  @keyframes lpParticleFloat { 0%,100% { transform: translateZ(-2px) translateY(0) translateX(0); opacity: 0.35; } 50% { transform: translateZ(-2px) translateY(-22px) translateX(8px); opacity: 0.75; } }

  @media (prefers-reduced-motion: reduce) {
    .lp-hero-frame, .lp-hero-chip, .lp-hero-ring, .lp-hero-particle, .lp-hero-glow,
    .lp-hero-badge, .lp-hero h1, .lp-hero p, .lp-hero-btns, .lp-hero-stats, .lp-hero-visual,
    .lp-hero-slide img {
      animation: none !important; opacity: 1 !important; transform: none !important;
    }
    .lp-hero-slide { transition: none !important; }
  }

  /* ── Image Slider ── */
  .lp-slider { position: relative; overflow: hidden; height: 420px; }
  .lp-slider-track { display: flex; height: 100%; transition: transform 0.6s cubic-bezier(.4,0,.2,1); }
  .lp-slide { flex-shrink: 0; width: 100%; height: 100%; position: relative; }
  .lp-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .lp-slide-caption {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(0deg, rgba(20,16,12,0.85) 0%, transparent 100%);
    color: #fff; padding: 32px 28px 20px;
    font-size: 15px; font-weight: 600;
  }
  .lp-slider-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(20,16,12,0.55); border: none; cursor: pointer;
    width: 42px; height: 42px; border-radius: 50%;
    color: #fff; font-size: 18px; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s; z-index: 10;
  }
  .lp-slider-btn:hover { background: var(--clay); }
  .lp-slider-btn.prev { left: 16px; }
  .lp-slider-btn.next { right: 16px; }
  .lp-slider-dots { position: absolute; bottom: 12px; right: 16px; display: flex; gap: 6px; z-index: 10; }
  .lp-slider-dot {
    width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.45);
    border: none; cursor: pointer; transition: background 0.2s; padding: 0;
  }
  .lp-slider-dot.active { background: var(--marigold); }

  /* ── Quick links bar ── */
  .lp-quickbar { background: #fff; border-bottom: 1px solid var(--line); padding: 16px 24px; }
  .lp-quickbar-inner { max-width: 1100px; margin: 0 auto; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .lp-qlink {
    display: flex; align-items: center; gap: 7px; padding: 9px 16px;
    border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; font-family: inherit; transition: opacity 0.18s;
  }
  .lp-qlink:hover { opacity: 0.82; }

  /* ── Section common ── */
  .lp-wrap { max-width: 1100px; margin: 0 auto; padding: 64px 24px; }
  .lp-sec-header { text-align: center; margin-bottom: 54px; }
  .lp-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--clay); margin-bottom: 12px; }
  .lp-sec-title { font-family: 'Fraunces', serif; font-size: clamp(26px, 3.5vw, 38px); font-weight: 700; color: var(--indigo-deep); letter-spacing: -0.5px; line-height: 1.2; }
  .lp-sec-sub { margin-top: 14px; font-size: 15px; color: var(--ink-soft); line-height: 1.7; max-width: 540px; margin-left: auto; margin-right: auto; }

  /* ── Why-us cards ── */
  .lp-why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; }
  .lp-why-card {
    background: #fff; border-radius: var(--radius); padding: 28px 22px;
    border: 1px solid var(--line); box-shadow: var(--shadow);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .lp-why-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--clay); }
  .lp-why-icon { font-size: 32px; margin-bottom: 14px; }
  .lp-why-title { font-size: 16px; font-weight: 700; color: var(--indigo-deep); margin-bottom: 8px; }
  .lp-why-desc { font-size: 13.5px; color: var(--ink-soft); line-height: 1.7; }

  /* ── Principal quote ── */
  .lp-principal-strip { background: linear-gradient(150deg, var(--marigold-light) 0%, #f6f1e7 100%); padding: 64px 24px; border-top: 1px solid var(--line); }
  .lp-principal-strip-inner { max-width: 800px; margin: 0 auto; text-align: center; }
  .lp-pquote { font-family: 'Fraunces', serif; font-size: 19px; color: var(--indigo-deep); line-height: 1.75; margin: 22px 0 28px; font-weight: 600; font-style: italic; }

  /* ── About ── */
  .lp-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: start; }
  .lp-about-img-wrap { position: relative; }
  .lp-about-img { width: 100%; border-radius: var(--radius); aspect-ratio: 4/3; object-fit: cover; box-shadow: var(--shadow-lg); }
  .lp-about-badge {
    position: absolute; bottom: -20px; right: -20px;
    background: var(--clay); color: #fff; padding: 18px 22px; border-radius: 14px;
    text-align: center; box-shadow: var(--shadow-lg);
  }
  .lp-about-badge .num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; }
  .lp-about-badge .lbl { font-size: 11px; color: var(--marigold-light); margin-top: 2px; }
  .lp-about-content h2 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: var(--indigo-deep); margin-bottom: 18px; }
  .lp-about-content p { font-size: 14.5px; color: var(--ink-soft); line-height: 1.85; margin-bottom: 16px; }
  .lp-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 26px; }
  .lp-info-card { background: var(--sandstone-deep); border-radius: 10px; padding: 14px 16px; border-left: 4px solid var(--marigold); }
  .lp-info-card .label { font-size: 11px; color: var(--ink-faint); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .lp-info-card .value { font-size: 14px; font-weight: 700; color: var(--indigo-deep); margin-top: 3px; }

  /* ── Principal cards ── */
  .lp-principal-card {
    background: linear-gradient(150deg, var(--indigo-deep), var(--indigo));
    border-radius: 20px; padding: 48px;
    display: flex; gap: 40px; align-items: flex-start;
    box-shadow: var(--shadow-lg); color: #fff; margin-bottom: 24px;
  }
  .lp-principal-avatar {
    width: 116px; height: 116px; border-radius: 16px; flex-shrink: 0;
    background: linear-gradient(150deg, var(--clay), var(--clay-deep));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif; font-size: 36px; font-weight: 700; color: var(--marigold-light);
    box-shadow: 0 6px 22px rgba(184,92,56,0.4);
  }
  .lp-manager-card { background: linear-gradient(150deg, #5b4636, #3e2f24); }
  .lp-manager-avatar { background: linear-gradient(150deg, #8a9a5b, #6b7d42); color: #f3f0e3; }
  .lp-principal-quote { font-size: 15px; line-height: 1.9; color: #d4d8de; margin-bottom: 26px; }
  .lp-principal-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: var(--marigold); }
  .lp-principal-role { font-size: 13px; color: #9aa3af; margin-top: 4px; }

  /* ── Curriculum ── */
  .lp-class-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 48px; }
  .lp-class-card {
    background: #fff; border: 1px solid var(--line); border-radius: 12px;
    padding: 22px; text-align: center; box-shadow: var(--shadow); transition: all 0.2s;
  }
  .lp-class-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
  .lp-class-card .icon { font-size: 26px; margin-bottom: 10px; }
  .lp-class-card .name { font-weight: 700; color: var(--indigo-deep); font-size: 15px; }
  .lp-class-card .range { font-size: 12px; color: var(--ink-faint); margin-top: 4px; }
  .lp-stream-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 48px; }
  .lp-stream-card {
    background: #fff; border-radius: var(--radius); border: 1px solid var(--line);
    padding: 28px 24px; transition: all 0.22s; box-shadow: var(--shadow);
  }
  .lp-stream-card:hover { border-color: var(--clay); transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .lp-stream-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 18px; }
  .lp-stream-card h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: var(--indigo-deep); margin-bottom: 10px; }
  .lp-stream-card p { font-size: 13.5px; color: var(--ink-soft); line-height: 1.7; }
  .lp-tag { display: inline-block; margin-top: 14px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; }
  .lp-subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .lp-subject-chip {
    background: #fff; border: 1px solid var(--line); border-radius: 10px;
    padding: 13px 16px; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow);
  }
  .lp-subject-chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--marigold); flex-shrink: 0; }
  .lp-subject-chip span { font-size: 13.5px; font-weight: 600; color: var(--indigo-deep); }

  /* ── Faculty ── */
  .lp-teachers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
  .lp-teacher-card {
    background: #fff; border-radius: var(--radius); border: 1px solid var(--line);
    padding: 28px 20px; text-align: center; box-shadow: var(--shadow); transition: all 0.22s;
  }
  .lp-teacher-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--marigold); }
  .lp-teacher-avatar {
    width: 78px; height: 78px; border-radius: 50%; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: #fff;
  }
  .lp-teacher-name { font-size: 16px; font-weight: 700; color: var(--indigo-deep); }
  .lp-teacher-subject { font-size: 12px; color: var(--clay); font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  .lp-teacher-qual { font-size: 12px; color: var(--ink-faint); margin-top: 6px; }
  .lp-teacher-exp { margin-top: 14px; padding: 6px 14px; border-radius: 100px; background: var(--marigold-light); color: var(--clay-deep); font-size: 11px; font-weight: 700; display: inline-block; }

  /* ── Gallery ── */
  .lp-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 200px; gap: 12px; }
  .lp-gallery-item { border-radius: var(--radius); overflow: hidden; position: relative; cursor: pointer; background: var(--sandstone-deep); }
  .lp-gallery-item:nth-child(1) { grid-column: span 2; grid-row: span 2; }
  .lp-gallery-item:nth-child(4) { grid-column: span 2; }
  .lp-gallery-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; display: block; }
  .lp-gallery-item:hover .lp-gallery-img { transform: scale(1.06); }
  .lp-gallery-caption {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(0deg, rgba(20,16,12,0.85) 0%, transparent 100%);
    color: #fff; padding: 20px 16px 14px; font-size: 13px; font-weight: 600;
    opacity: 0; transition: opacity 0.3s;
  }
  .lp-gallery-item:hover .lp-gallery-caption { opacity: 1; }

  /* ── Notices ── */
  .lp-notice-list { display: flex; flex-direction: column; gap: 14px; }
  .lp-notice-item {
    background: #fff; border-radius: var(--radius); border: 1px solid var(--line);
    padding: 20px 22px; display: flex; gap: 18px; align-items: flex-start;
    box-shadow: var(--shadow); transition: all 0.2s;
  }
  .lp-notice-item:hover { border-color: var(--clay); transform: translateX(4px); }
  .lp-notice-date { flex-shrink: 0; text-align: center; padding: 10px 14px; background: var(--indigo-deep); border-radius: 10px; color: #fff; min-width: 56px; }
  .lp-notice-date .day { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; }
  .lp-notice-date .mon { font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--marigold); }
  .lp-notice-title { font-size: 15px; font-weight: 700; color: var(--indigo-deep); margin-bottom: 5px; }
  .lp-notice-desc { font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; }
  .lp-ntag { display: inline-block; margin-top: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px; }
  .lp-tag-exam { background: #fbe3dc; color: #8f3f23; }
  .lp-tag-event { background: #e3e9fb; color: #2d3f8f; }
  .lp-tag-holiday { background: #e2ecd9; color: #3f5a2a; }
  .lp-tag-meeting { background: var(--marigold-light); color: #8a5a06; }

  /* ── Contact ── */
  .lp-contact-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: start; }
  .lp-contact-block { display: flex; flex-direction: column; gap: 16px; }
  .lp-contact-card {
    background: #fff; border-radius: var(--radius); border: 1px solid var(--line);
    padding: 18px 20px; display: flex; gap: 14px; align-items: flex-start; box-shadow: var(--shadow);
  }
  .lp-contact-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--indigo-deep); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .lp-contact-label { font-size: 11px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
  .lp-contact-value { font-size: 14px; font-weight: 600; color: var(--indigo-deep); }
  .lp-map { border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-lg); }
  .lp-map iframe { width: 100%; height: 320px; border: none; display: block; }
  .lp-field-label { font-size: 12px; font-weight: 600; color: var(--ink-soft); margin-bottom: 5px; display: block; }
  .lp-field-input, .lp-field-select, .lp-field-textarea {
    width: 100%; padding: 11px 14px; border: 1px solid var(--line); border-radius: 8px;
    font-size: 13.5px; font-family: inherit; outline: none; background: #fff; color: var(--ink);
    transition: border-color 0.2s;
  }
  .lp-field-input:focus, .lp-field-select:focus, .lp-field-textarea:focus { border-color: var(--clay); }
  .lp-field-textarea { resize: none; }
  .lp-submit-btn {
    padding: 13px; background: var(--indigo-deep); color: #fff; border: none; border-radius: 8px;
    font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.2s; width: 100%;
  }
  .lp-submit-btn:hover { background: var(--indigo); }
  .lp-form-ok { display: none; font-size: 13px; padding: 11px 14px; border-radius: 8px; background: #e2ecd9; color: #3f5a2a; margin-top: 8px; }
  .lp-form-ok.show { display: block; }

  /* ── Footer ── */
  .lp-footer { background: var(--indigo-deep); color: #aab2bf; padding: 50px 24px 26px; margin-top: 64px; }
  .lp-footer-inner { max-width: 1100px; margin: 0 auto; }
  .lp-footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .lp-footer-brand-name { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 700; color: #fff; margin-bottom: 12px; }
  .lp-footer-brand p { font-size: 13px; line-height: 1.8; }
  .lp-footer-col h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #fff; margin-bottom: 16px; }
  .lp-footer-col a, .lp-footer-col button {
    display: block; font-size: 13px; color: #aab2bf; text-decoration: none; margin-bottom: 11px;
    transition: color 0.18s; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; padding: 0;
  }
  .lp-footer-col a:hover, .lp-footer-col button:hover { color: var(--marigold); }
  .lp-footer-bottom { padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; flex-wrap: wrap; gap: 8px; color: #6b7280; }
  .lp-footer-badges { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
  .lp-footer-badge { background: rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; color: #aab2bf; border: 1px solid rgba(255,255,255,0.1); }

  /* ── ERP Portal Link button ── */
  .lp-portal-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px; border-radius: 10px;
    background: var(--marigold); color: var(--indigo-deep);
    font-weight: 700; font-size: 13px; text-decoration: none;
    border: none; cursor: pointer; transition: all 0.22s; font-family: inherit;
  }
  .lp-portal-btn:hover { background: #d4930f; }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .lp-topnav a:not(.lp-admit-btn) { display: none; }
  }
  @media (max-width: 768px) {
    .lp-hero { padding: 44px 22px; }
    .lp-hero-inner { grid-template-columns: 1fr; }
    .lp-hero-visual { height: 300px; order: -1; margin-bottom: 18px; }
    .lp-hero-chip { display: none; }
    .lp-about-grid, .lp-contact-grid { grid-template-columns: 1fr; }
    .lp-about-badge { right: 10px; bottom: -16px; }
    .lp-principal-card { flex-direction: column; gap: 24px; padding: 32px 24px; }
    .lp-principal-avatar { width: 80px; height: 80px; font-size: 28px; }
    .lp-gallery-grid { grid-template-columns: 1fr 1fr; grid-auto-rows: 160px; }
    .lp-gallery-item:nth-child(1) { grid-column: span 2; grid-row: span 1; }
    .lp-gallery-item:nth-child(4) { grid-column: span 1; }
    .lp-footer-grid { grid-template-columns: 1fr; }
    .lp-info-row { grid-template-columns: 1fr; }
    .lp-wrap { padding: 44px 18px; }
    .lp-slider { height: 260px; }
  }
  @media (max-width: 480px) {
    .lp-hero h1 { font-size: 27px; }
    .lp-hero-stats { gap: 22px; }
    .lp-hero-stat .num { font-size: 22px; }
    .lp-gallery-grid { grid-template-columns: 1fr; }
    .lp-gallery-item:nth-child(1), .lp-gallery-item:nth-child(4) { grid-column: span 1; }
  }
  .lp-sidebar::-webkit-scrollbar { width: 4px; }
  .lp-sidebar::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────

// Images used inside the hero slideshow (frame on the right of the hero).
// Each entry pairs a professional campus-life photo with a short caption.
const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop",
    caption: "Our Campus, Agra",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    caption: "Bright, Modern Classrooms",
  },
  {
    src: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=1200&auto=format&fit=crop",
    caption: "Hands-on Science Learning",
  },
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop",
    caption: "Sports & All-Round Growth",
  },
];

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
    caption: "🏫 Shree H.S. Model High School — Agra",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    caption: "📚 Modern Classrooms for Quality Learning",
  },
  {
    src: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=1200&auto=format&fit=crop",
    caption: "🔬 Science Laboratories — Hands-on Education",
  },
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop",
    caption: "⚽ Sports Ground — All-Round Development",
  },
];

const NOTICES = [
  {
    day: "20",
    mon: "Jun",
    title: "Class 10 & 12 Final Exam Schedule Released",
    desc: "UP Board final examination timetable for Class 10 and 12 has been released. Students are advised to collect their admit cards from the school office by 25 June.",
    tag: "lp-tag-exam",
    tagLabel: "📝 Exam",
  },
  {
    day: "15",
    mon: "Jun",
    title: "Independence Day Celebration – 15 August",
    desc: "All students and staff are requested to be present on 15th August at 7:00 AM for flag hoisting ceremony. Cultural programs will follow. White uniform is compulsory.",
    tag: "lp-tag-event",
    tagLabel: "🎉 Event",
  },
  {
    day: "10",
    mon: "Jun",
    title: "Parent-Teacher Meeting – Class 6 to 10",
    desc: "A Parent-Teacher meeting for classes 6 to 10 will be held on 22nd June (Saturday) between 9 AM – 1 PM. Parents are requested to attend and collect their child's progress report.",
    tag: "lp-tag-meeting",
    tagLabel: "👨‍👩‍👧 PTM",
  },
  {
    day: "05",
    mon: "Jun",
    title: "Half-Yearly Holiday Notice",
    desc: "School will remain closed from 20 June to 30 June on account of summer vacation. Classes will resume on 1st July.",
    tag: "lp-tag-holiday",
    tagLabel: "🌿 Holiday",
  },
  {
    day: "01",
    mon: "Jun",
    title: "Admission Open for 2025–26 Academic Session",
    desc: "Admissions are now open for Class 1 to Class 11. Contact the school office between 9 AM to 2 PM on working days. Documents: Birth certificate, marksheet, Aadhar card.",
    tag: "lp-tag-event",
    tagLabel: "📌 Admissions",
  },
];

const TEACHERS = [
  {
    init: "RC",
    name: "Rang Bahadur Singh Chauhan",
    subject: "Principal",
    qual: "M.A., B.Ed · 25+ Years",
    exp: "Administration",
    bg: "linear-gradient(150deg,#1f2937,#14181f)",
  },
  {
    init: "SK",
    name: "Smt. Sunita Kumari",
    subject: "Hindi",
    qual: "M.A. Hindi, B.Ed · 18 Years",
    exp: "Sr. Faculty",
    bg: "linear-gradient(150deg,#b85c38,#8f3f23)",
  },
  {
    init: "RS",
    name: "Ramesh Kumar Sharma",
    subject: "Mathematics",
    qual: "M.Sc. Maths, B.Ed · 15 Years",
    exp: "Sr. Faculty",
    bg: "linear-gradient(150deg,#3f5a2a,#5a7a3e)",
  },
  {
    init: "PV",
    name: "Dr. Priya Verma",
    subject: "Science / Biology",
    qual: "M.Sc., Ph.D, B.Ed · 12 Years",
    exp: "Sr. Faculty",
    bg: "linear-gradient(150deg,#5b3a7a,#7d52a8)",
  },
  {
    init: "AK",
    name: "Anil Kumar Gupta",
    subject: "Physics",
    qual: "M.Sc. Physics, B.Ed · 14 Years",
    exp: "Sr. Faculty",
    bg: "linear-gradient(150deg,#1a5a6b,#2a7a8f)",
  },
  {
    init: "NM",
    name: "Nirmala Mishra",
    subject: "English",
    qual: "M.A. English, B.Ed · 16 Years",
    exp: "Sr. Faculty",
    bg: "linear-gradient(150deg,#8f2d52,#b8447a)",
  },
  {
    init: "VS",
    name: "Vijay Singh Yadav",
    subject: "Social Science",
    qual: "M.A., B.Ed · 11 Years",
    exp: "Faculty",
    bg: "linear-gradient(150deg,#8a5a06,#c47d0f)",
  },
  {
    init: "KP",
    name: "Kavita Pandey",
    subject: "Sanskrit",
    qual: "M.A. Sanskrit, B.Ed · 9 Years",
    exp: "Faculty",
    bg: "linear-gradient(150deg,#2d3f8f,#4a5fc4)",
  },
];

const SUBJECTS = [
  "Hindi",
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Sanskrit",
  "Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Civics",
  "Economics",
  "Home Science",
];

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?q=80&w=800&auto=format&fit=crop",
    caption: "📍 Main School Building",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop",
    caption: "🏫 Modern Classrooms",
  },
  {
    src: "https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?q=80&w=600&auto=format&fit=crop",
    caption: "📚 School Library",
  },
  {
    src: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=800&auto=format&fit=crop",
    caption: "🔬 Science Laboratory",
  },
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop",
    caption: "⚽ Sports Ground",
  },
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop",
    caption: "🎭 Annual Cultural Program",
  },
];

const NOTICE_TAGS = {
  exam: { label: "📝 Exam", className: "lp-tag-exam" },
  event: { label: "🎉 Event", className: "lp-tag-event" },
  meeting: { label: "👨‍👩‍👧 PTM", className: "lp-tag-meeting" },
  holiday: { label: "🌿 Holiday", className: "lp-tag-holiday" },
};

const DEFAULT_CONTENT = {
  heroTitle: "Shree H.S. Model\nHigh School",
  heroSubtitle:
    "Nurturing minds and building character since 2001. A UP Board-affiliated school in Agra committed to academic excellence, moral values, and all-round development.",
  heroImageUrl:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
  heroSlides: [...HERO_SLIDES],
  ctaText: "Enquire for Admission →",
  ctaSecondary: "Know Our School",
  heroBadge: "Admissions Open 2025–26",
  statsStudents: 1200,
  statsFaculty: 95,
  statsPassRate: 98,
  statsYears: 23,
  slides: [...SLIDES],
  gallery: [...GALLERY],
  notices: [...NOTICES],
  whyCards: [
    {
      icon: "🏆",
      title: "Academic Excellence",
      desc: "Consistently 98%+ result in UP Board exams with top district rankers every year.",
    },
    {
      icon: "🕉️",
      title: "Moral Values",
      desc: "Character building through daily prayers, Sanskrit shloka recitation, and Yoga sessions.",
    },
    {
      icon: "🔬",
      title: "Modern Labs",
      desc: "Physics, Chemistry, Biology & Computer labs with modern equipment for hands-on learning.",
    },
    {
      icon: "⚽",
      title: "Sports & Arts",
      desc: "Annual sports meet, cultural programs, drawing & elocution competitions — talent nurtured.",
    },
  ],
  principalQuoteShort:
    "Education is not merely about marks — it is about kindling the flame of curiosity, discipline, and humanity in every child. At Shree H.S. Model High School, we believe every student carries infinite potential.",
  principalName: "Principal Rang Bahadur Singh Chauhan",
  principalFull:
    "It is with immense pride and humility that I address the Shree H.S. Model High School family. Since our founding in 2001, we have strived to create an environment where every child feels valued, challenged, and inspired. Our school is not merely a place of academic learning — it is a second home where students develop not only their intellect, but their character, resilience, and compassion.\n\nWe believe in the holistic development of each student — through rigorous academics, creative arts, physical education, and above all, the inculcation of strong moral values. Together, we will shape the leaders and citizens of tomorrow.",
  managerName: "Dr. P.S. Chauhan",
  managerFull:
    "As the Manager of Shree H.S. Model High School, my commitment has always been to provide an institution that is accessible, affordable, and of the highest quality for the students of Agra. We have invested in modern classrooms, qualified teachers, and an environment that promotes curiosity and growth. Our students are our greatest achievement.",
  contactAddress: "Shree H.S. Model High School, Agra, Uttar Pradesh – 282001",
  contactPhone: "+91 562 234-5678",
  contactPhoneAdmission: "+91 562 234-5679",
  contactEmail: "info@shreehsmodelhs.edu.in",
  contactHours: "Mon – Sat: 8:00 AM – 2:30 PM",
};

// ─── Hero Visual (crossfading slideshow + mouse-tilt parallax + blended edges) ─
// Replaces the old single-static-image hero visual. Cycles through several
// professional campus photos with a smooth crossfade + slow Ken Burns zoom,
// so the hero feels alive without resorting to a jarring hard-cut carousel.
function HeroVisual({ slides = HERO_SLIDES, fallbackImageUrl }) {
  const stageRef = useRef(null);
  const rafRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(0);

  // If a single custom heroImageUrl was supplied (e.g. via admin settings)
  // and no slide list is present, fall back to a one-slide "show".
  const effectiveSlides =
    slides && slides.length > 0
      ? slides
      : [{ src: fallbackImageUrl, caption: "Our Campus, Agra" }];

  // Auto-advance the slideshow.
  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % effectiveSlides.length);
    }, 4500);
    return () => clearInterval(id);
  }, [effectiveSlides.length]);

  // Mouse-tilt parallax on the whole stage (frame + chips + rings).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      const { x, y } = current.current;
      if (stage) {
        stage.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    target.current = { x: px * 16, y: -py * 14 };
  };

  const handleMouseLeave = () => {
    target.current = { x: 0, y: 0 };
  };

  return (
    <div
      className="lp-hero-visual"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="lp-hero-glow" />
      <div ref={stageRef} className="lp-hero-visual-stage">
        <div className="lp-hero-ring lp-ring-1" />
        <div className="lp-hero-ring lp-ring-2" />

        {[
          { top: "8%", left: "6%", size: 6 },
          { top: "20%", left: "84%", size: 4 },
          { top: "70%", left: "10%", size: 5 },
          { top: "82%", left: "78%", size: 6 },
          { top: "45%", left: "92%", size: 4 },
        ].map((p, i) => (
          <span
            key={i}
            className="lp-hero-particle"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}

        <div className="lp-hero-frame">
          {effectiveSlides.map((s, i) => (
            <div
              key={i}
              className={`lp-hero-slide${i === active ? " is-active" : ""}`}
            >
              {/* key forces the Ken Burns animation to restart each time this slide becomes active */}
              <img
                key={`${i}-${i === active ? "on" : "off"}`}
                src={s.src}
                alt={s.caption || "Shree H.S. Model High School campus"}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}

          <div className="lp-hero-frame-shade" />
          <div className="lp-hero-frame-vignette" />

          <div className="lp-hero-frame-caption">
            <span className="txt">
              🏫 {effectiveSlides[active]?.caption || "Our Campus, Agra"}
            </span>
            {effectiveSlides.length > 1 && (
              <div className="lp-hero-frame-dots">
                {effectiveSlides.map((_, i) => (
                  <button
                    key={i}
                    className={`lp-hero-frame-dot${i === active ? " is-active" : ""}`}
                    onClick={() => setActive(i)}
                    aria-label={`Show photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lp-hero-chip lp-chip-1">
          <div className="ic">🎓</div>
          <div className="tx">
            <div className="v">23+ Years</div>
            <div className="l">of Legacy</div>
          </div>
        </div>
        <div className="lp-hero-chip lp-chip-2">
          <div className="ic">🏆</div>
          <div className="tx">
            <div className="v">98%</div>
            <div className="l">Board Pass Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Slider ─────────────────────────────────────────────────────────────
function ImageSlider({ slides = SLIDES }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const go = (idx) => {
    setCurrent((idx + slides.length) % slides.length);
  };

  useEffect(() => {
    timerRef.current = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      4000,
    );
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  return (
    <div className="lp-slider">
      <div
        className="lp-slider-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={i} className="lp-slide">
            <img
              src={s.src}
              alt={s.caption}
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="lp-slide-caption">{s.caption}</div>
          </div>
        ))}
      </div>
      <button
        className="lp-slider-btn prev"
        onClick={() => go(current - 1)}
        aria-label="Previous"
      >
        &#8592;
      </button>
      <button
        className="lp-slider-btn next"
        onClick={() => go(current + 1)}
        aria-label="Next"
      >
        &#8594;
      </button>
      <div className="lp-slider-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`lp-slider-dot${i === current ? " active" : ""}`}
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const LandingPage = () => {
  const { userRole } = useAuth();
  const [activeSection, setActiveSection] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const [content, setContent] = useState(DEFAULT_CONTENT);

  const loadContentFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem("school_erp_landing_content_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        setContent((c) => {
          // Only update if actually changed (prevents unnecessary re-renders)
          if (
            JSON.stringify(c) ===
            JSON.stringify({ ...DEFAULT_CONTENT, ...parsed })
          )
            return c;
          return { ...DEFAULT_CONTENT, ...parsed };
        });
      }
    } catch (error) {
      console.error("Landing page content load failed:", error);
    }
  }, []);

  useEffect(() => {
    loadContentFromStorage();

    // Listen for storage changes from other tabs/windows
    const handleStorage = (e) => {
      if (e.key === "school_erp_landing_content_v2" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setContent({ ...DEFAULT_CONTENT, ...parsed });
        } catch {}
      }
    };

    // When user returns to this tab, re-read storage (catches same-tab SPA nav)
    const handleFocus = () => {
      loadContentFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadContentFromStorage]);

  const showSection = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "webadmin") return "/webadmin";
    if (userRole === "teacher") return "/teacher";
    if (userRole === "parent") return "/parent";
    return "/login";
  };

  const handleEnquiry = (e) => {
    e.preventDefault();
    setFormStatus("show");
    e.target.reset();
    setTimeout(() => setFormStatus(""), 5000);
  };

  const NAV_ITEMS = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "curriculum", label: "Curriculum" },
    { id: "teachers", label: "Faculty" },
    { id: "gallery", label: "Gallery" },
    { id: "notices", label: "Notices" },
  ];

  const SIDEBAR_ITEMS = [
    { id: "home", icon: "🏫", label: "Home" },
    { id: "about", icon: "📖", label: "About School" },
    { id: "curriculum", icon: "📚", label: "Curriculum" },
    { id: "teachers", icon: "👨‍🏫", label: "Our Faculty" },
    { id: "gallery", icon: "🖼️", label: "School Gallery" },
    { id: "notices", icon: "📋", label: "Notice Board" },
    { id: "contact", icon: "📞", label: "Contact Us" },
  ];

  return (
    <>
      <style>{STYLES}</style>

      {/* Tricolor bar */}
      <div className="lp-tricolor" />

      {/* Topbar */}
      <header className="lp-topbar">
        <button
          className={`lp-hamburger${sidebarOpen ? " open" : ""}`}
          aria-label="Open menu"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <button
          className="lp-logo"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={() => showSection("home")}
        >
          <div className="lp-logo-emblem">श्री</div>
          <div className="lp-logo-name">
            <div className="t1">Shree H.S. Model High School</div>
            <div className="t2">Agra, Uttar Pradesh · Est. 2001</div>
          </div>
        </button>

        <nav className="lp-topnav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "active" : ""}
              onClick={() => showSection(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="lp-admit-btn"
            onClick={() => showSection("contact")}
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              borderRadius: "8px",
            }}
          >
            Contact Us
          </button>
          <Link
            to={getDashboardLink()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 8,
              marginLeft: 6,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            🔐 {userRole ? "Dashboard" : "Login"}
          </Link>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`lp-overlay${sidebarOpen ? " show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`lp-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sb-section">
          <div className="sb-label">Main Menu</div>
          {SIDEBAR_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={`sb-link${activeSection === item.id ? " active" : ""}`}
              onClick={() => showSection(item.id)}
            >
              <div className="sb-icon">{item.icon}</div> {item.label}
            </button>
          ))}
        </div>
        <div className="sb-divider" />
        <div className="sb-section">
          <div className="sb-label">Campus Life</div>
          {SIDEBAR_ITEMS.slice(4).map((item) => (
            <button
              key={item.id}
              className={`sb-link${activeSection === item.id ? " active" : ""}`}
              onClick={() => showSection(item.id)}
            >
              <div className="sb-icon">{item.icon}</div> {item.label}
            </button>
          ))}
        </div>
        <div className="sb-divider" />
        <div className="sb-section">
          <div className="sb-label">Quick Info</div>
          <div
            style={{
              padding: "14px 12px",
              background: "var(--marigold-light)",
              borderRadius: 12,
              fontSize: 13,
              color: "var(--clay-deep)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              📅 Academic Year 2025–26
            </div>
            <div style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Session: April – March
              <br />
              Board: UP Madhyamik
              <br />
              Medium: Hindi & English
            </div>
          </div>
        </div>
        <div
          style={{
            padding: 16,
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button
            className="lp-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => showSection("contact")}
          >
            📩 Admission Enquiry
          </button>
          <Link
            to={getDashboardLink()}
            onClick={() => setSidebarOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            🔐 {userRole ? "Go to Dashboard" : "Staff / Parent Login"}
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="lp-main">
        {/* ── HOME ── */}
        <section
          className={`lp-section${activeSection === "home" ? " active" : ""}`}
        >
          {/* Hero */}
          <div className="lp-hero">
            <div className="lp-hero-motif" />
            <div className="lp-hero-inner">
              <div className="lp-hero-content">
                <div className="lp-hero-badge">
                  <span className="dot" />
                  {content.heroBadge}
                </div>
                <h1>
                  {content.heroTitle.split("\n").map((line, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <br />}
                      {idx === 1 ? <em>{line}</em> : line}
                    </React.Fragment>
                  ))}
                </h1>
                <p>{content.heroSubtitle}</p>
                <div className="lp-hero-btns">
                  <button
                    className="lp-btn-primary"
                    onClick={() => showSection("contact")}
                  >
                    {content.ctaText}
                  </button>
                  <button
                    className="lp-btn-outline"
                    onClick={() => showSection("about")}
                  >
                    {content.ctaSecondary}
                  </button>
                </div>
                <div className="lp-hero-stats">
                  <div className="lp-hero-stat">
                    <div className="num">{content.statsStudents}+</div>
                    <div className="lbl">Students Enrolled</div>
                  </div>
                  <div className="lp-hero-stat">
                    <div className="num">{content.statsFaculty}+</div>
                    <div className="lbl">Expert Faculty</div>
                  </div>
                  <div className="lp-hero-stat">
                    <div className="num">{content.statsPassRate}%</div>
                    <div className="lbl">Board Pass Rate</div>
                  </div>
                  <div className="lp-hero-stat">
                    <div className="num">{content.statsYears}+</div>
                    <div className="lbl">Years of Legacy</div>
                  </div>
                </div>
              </div>

              <HeroVisual
                slides={content.heroSlides}
                fallbackImageUrl={content.heroImageUrl}
              />
            </div>
          </div>

          {/* Image Slider */}
          <ImageSlider slides={content.slides} />

          {/* Quick links bar */}
          <div className="lp-quickbar">
            <div className="lp-quickbar-inner">
              {[
                {
                  label: "📋 Latest Notices",
                  sec: "notices",
                  bg: "var(--marigold-light)",
                  color: "#8a5a06",
                },
                {
                  label: "📚 Our Curriculum",
                  sec: "curriculum",
                  bg: "#e3e9fb",
                  color: "#2d3f8f",
                },
                {
                  label: "🖼️ School Gallery",
                  sec: "gallery",
                  bg: "#e2ecd9",
                  color: "#3f5a2a",
                },
                {
                  label: "👨‍🏫 Our Faculty",
                  sec: "teachers",
                  bg: "#fbe3dc",
                  color: "#8f3f23",
                },
                {
                  label: "📞 Contact Us",
                  sec: "contact",
                  bg: "var(--indigo-deep)",
                  color: "var(--marigold)",
                },
              ].map((q) => (
                <button
                  key={q.sec}
                  className="lp-qlink"
                  style={{ background: q.bg, color: q.color }}
                  onClick={() => showSection(q.sec)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Why Us */}
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Why Choose Us</div>
              <div className="lp-sec-title">Excellence in Every Dimension</div>
              <div className="lp-sec-sub">
                From academics to sports, arts to values — we build complete
                human beings.
              </div>
            </div>
            <div className="lp-why-grid">
              {(content.whyCards || []).map((c) => (
                <div key={c.title} className="lp-why-card">
                  <div className="lp-why-icon">{c.icon}</div>
                  <div className="lp-why-title">{c.title}</div>
                  <div className="lp-why-desc">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Principal quote strip */}
          <div className="lp-principal-strip">
            <div className="lp-principal-strip-inner">
              <div className="lp-eyebrow">From the Principal's Desk</div>
              <blockquote className="lp-pquote">
                "Education is not merely about marks — it is about kindling the
                flame of curiosity, discipline, and humanity in every child. At
                Shree H.S. Model High School, we believe every student carries
                infinite potential."
              </blockquote>
              <div
                style={{
                  fontWeight: 700,
                  color: "var(--indigo-deep)",
                  fontSize: 16,
                }}
              >
                Principal Rang Bahadur Singh Chauhan
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-faint)",
                  marginTop: 4,
                }}
              >
                Shree H.S. Model High School, Agra
              </div>
              <button
                className="lp-btn-primary"
                style={{ marginTop: 22, display: "inline-flex" }}
                onClick={() => showSection("about")}
              >
                Read Full Message →
              </button>
            </div>
          </div>

          {/* ERP Portal CTA */}
          <div
            style={{
              background: "var(--indigo-deep)",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(22px, 3vw, 32px)",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                School ERP Portal
              </div>
              <p
                style={{
                  fontSize: 15,
                  color: "#c3c9d3",
                  marginBottom: 28,
                  lineHeight: 1.7,
                }}
              >
                Teachers, parents and admins — access your dashboard for grades,
                attendance, fees and announcements.
              </p>
              <Link to={getDashboardLink()} className="lp-portal-btn">
                {userRole ? "Go to Dashboard →" : "Enter ERP Portal →"}
              </Link>
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section
          className={`lp-section${activeSection === "about" ? " active" : ""}`}
        >
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Our Story</div>
              <div className="lp-sec-title">
                About Shree H.S. Model High School
              </div>
            </div>

            <div className="lp-about-grid">
              <div className="lp-about-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop"
                  alt="School building"
                  className="lp-about-img"
                  loading="lazy"
                />
                <div className="lp-about-badge">
                  <div className="num">2001</div>
                  <div className="lbl">Established</div>
                </div>
              </div>
              <div className="lp-about-content">
                <h2>A Legacy of Learning in the Heart of Agra</h2>
                <p>
                  Shree H.S. Model High School was established in 2001 with a
                  vision to provide quality education rooted in Indian values
                  and cultural heritage. Located in Agra, Uttar Pradesh, our
                  school has grown from a small institution to one of the most
                  respected educational centers in the region.
                </p>
                <p>
                  Affiliated with the Uttar Pradesh Madhyamik Shiksha Parishad
                  (UP Board), we offer classes from primary level through Class
                  XII, focusing on both Hindi and English mediums. Our
                  curriculum blends modern pedagogy with traditional values.
                </p>
                <p>
                  Over more than two decades, we have produced thousands of
                  successful alumni — doctors, engineers, teachers, civil
                  servants — all carrying the values we instilled in them.
                </p>
                <div className="lp-info-row">
                  {[
                    { label: "Established", value: "2001" },
                    { label: "Affiliation", value: "UP Board (UPMSP)" },
                    { label: "Principal", value: "Rang Bahadur Singh Chauhan" },
                    { label: "Manager", value: "Dr. P.S. Chauhan" },
                    { label: "Medium", value: "Hindi & English" },
                    { label: "Students", value: "1200+ Enrolled" },
                  ].map((i) => (
                    <div key={i.label} className="lp-info-card">
                      <div className="label">{i.label}</div>
                      <div className="value">{i.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 64 }}>
              <div className="lp-sec-header">
                <div className="lp-eyebrow">Leadership</div>
                <div className="lp-sec-title">Principal's Message</div>
              </div>
              <div className="lp-principal-card">
                <div className="lp-principal-avatar">RC</div>
                <div>
                  <p className="lp-principal-quote">
                    "{content.principalFull}"
                  </p>
                  <div className="lp-principal-name">
                    {content.principalName}
                  </div>
                  <div className="lp-principal-role">
                    Shree H.S. Model High School, Agra · Since 2001
                  </div>
                </div>
              </div>
              <div className={`lp-principal-card lp-manager-card`}>
                <div className="lp-principal-avatar lp-manager-avatar">PC</div>
                <div>
                  <p className="lp-principal-quote">"{content.managerFull}"</p>
                  <div className="lp-principal-name">{content.managerName}</div>
                  <div className="lp-principal-role">
                    Manager, Shree H.S. Model High School, Agra
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CURRICULUM ── */}
        <section
          className={`lp-section${activeSection === "curriculum" ? " active" : ""}`}
        >
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Academics</div>
              <div className="lp-sec-title">Our Curriculum</div>
              <div className="lp-sec-sub">
                UP Board affiliated. Classes from Primary to Senior Secondary
                (Class XII) in Hindi & English medium.
              </div>
            </div>

            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--indigo-deep)",
                marginBottom: 20,
              }}
            >
              Classes We Offer
            </h3>
            <div className="lp-class-grid">
              {[
                { icon: "📘", name: "Primary", range: "Class 1 – 5" },
                { icon: "📗", name: "Junior", range: "Class 6 – 8" },
                { icon: "📙", name: "Secondary", range: "Class 9 – 10" },
                {
                  icon: "📕",
                  name: "Senior Secondary",
                  range: "Class 11 – 12",
                },
              ].map((c) => (
                <div key={c.name} className="lp-class-card">
                  <div className="icon">{c.icon}</div>
                  <div className="name">{c.name}</div>
                  <div className="range">{c.range}</div>
                </div>
              ))}
            </div>

            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--indigo-deep)",
                marginBottom: 20,
              }}
            >
              Streams Available (Class 11–12)
            </h3>
            <div className="lp-stream-grid">
              {[
                {
                  icon: "🔬",
                  title: "Science Stream",
                  desc: "Physics, Chemistry, Biology/Mathematics. Prepares students for medical, engineering, and research careers.",
                  tag: "PCB / PCM",
                  bg: "#e3e9fb",
                  color: "#2d3f8f",
                },
                {
                  icon: "📊",
                  title: "Commerce Stream",
                  desc: "Accounts, Business Studies, Economics. Foundation for CA, MBA, banking, and entrepreneurship.",
                  tag: "Commerce",
                  bg: "var(--marigold-light)",
                  color: "#8a5a06",
                },
                {
                  icon: "🏛️",
                  title: "Arts / Humanities",
                  desc: "History, Geography, Civics, Hindi Literature, Home Science. Ideal for civil services, law, and education.",
                  tag: "Humanities",
                  bg: "#e2ecd9",
                  color: "#3f5a2a",
                },
              ].map((s) => (
                <div key={s.title} className="lp-stream-card">
                  <div
                    className="lp-stream-icon"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <span
                    className="lp-tag"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.tag}
                  </span>
                </div>
              ))}
            </div>

            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--indigo-deep)",
                marginBottom: 20,
              }}
            >
              Core Subjects Taught
            </h3>
            <div className="lp-subject-grid">
              {SUBJECTS.map((s) => (
                <div key={s} className="lp-subject-chip">
                  <div className="dot" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FACULTY ── */}
        <section
          className={`lp-section${activeSection === "teachers" ? " active" : ""}`}
        >
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Our Team</div>
              <div className="lp-sec-title">Meet Our Faculty</div>
              <div className="lp-sec-sub">
                95+ qualified and experienced teachers dedicated to student
                success and holistic development.
              </div>
            </div>
            <div className="lp-teachers-grid">
              {TEACHERS.map((t) => (
                <div key={t.init} className="lp-teacher-card">
                  <div
                    className="lp-teacher-avatar"
                    style={{ background: t.bg }}
                  >
                    {t.init}
                  </div>
                  <div className="lp-teacher-name">{t.name}</div>
                  <div className="lp-teacher-subject">{t.subject}</div>
                  <div className="lp-teacher-qual">{t.qual}</div>
                  <span className="lp-teacher-exp">{t.exp}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 42,
                textAlign: "center",
                padding: 28,
                background: "var(--marigold-light)",
                borderRadius: 14,
                border: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--indigo-deep)",
                }}
              >
                95+ Faculty Members in Total
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-faint)",
                  marginTop: 6,
                }}
              >
                All teachers are UP Board certified and hold B.Ed / M.Ed
                qualifications with years of teaching experience.
              </div>
            </div>
          </div>
        </section>

        {/* ── GALLERY ── */}
        <section
          className={`lp-section${activeSection === "gallery" ? " active" : ""}`}
        >
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Campus Life</div>
              <div className="lp-sec-title">School Gallery</div>
              <div className="lp-sec-sub">
                A glimpse into the vibrant life at Shree H.S. Model High School.
              </div>
            </div>
            <div className="lp-gallery-grid">
              {(content.gallery || []).map((g, i) => (
                <div key={i} className="lp-gallery-item">
                  <img
                    src={g.src}
                    alt={g.caption}
                    className="lp-gallery-img"
                    loading="lazy"
                  />
                  <div className="lp-gallery-caption">{g.caption}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NOTICES ── */}
        <section
          className={`lp-section${activeSection === "notices" ? " active" : ""}`}
        >
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Updates</div>
              <div className="lp-sec-title">Notice Board</div>
              <div className="lp-sec-sub">
                Latest announcements, exam schedules, and school events.
              </div>
            </div>
            <div className="lp-notice-list">
              {(content.notices || []).map((n, i) => (
                <div key={i} className="lp-notice-item">
                  <div className="lp-notice-date">
                    <div className="day">{n.day}</div>
                    <div className="mon">{n.mon}</div>
                  </div>
                  <div>
                    <div className="lp-notice-title">{n.title}</div>
                    <div className="lp-notice-desc">{n.desc}</div>
                    <span
                      className={`lp-ntag ${NOTICE_TAGS[n.tag]?.className || n.tag}`}
                    >
                      {n.tagLabel || NOTICE_TAGS[n.tag]?.label || ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section
          className={`lp-section${activeSection === "contact" ? " active" : ""}`}
        >
          <div className="lp-wrap">
            <div className="lp-sec-header">
              <div className="lp-eyebrow">Get In Touch</div>
              <div className="lp-sec-title">Contact Us</div>
              <div className="lp-sec-sub">
                We're happy to answer your questions about admissions,
                academics, or any school matters.
              </div>
            </div>
            <div className="lp-contact-grid">
              <div className="lp-contact-block">
                {[
                  {
                    icon: "📍",
                    label: "Address",
                    value: content.contactAddress,
                  },
                  { icon: "📞", label: "Phone", value: content.contactPhone },
                  { icon: "✉️", label: "Email", value: content.contactEmail },
                  {
                    icon: "🕘",
                    label: "Office Hours",
                    value: content.contactHours,
                  },
                  {
                    icon: "🎓",
                    label: "Admission Enquiry",
                    value: content.contactPhoneAdmission,
                  },
                ].map((c) => (
                  <div key={c.label} className="lp-contact-card">
                    <div className="lp-contact-icon">{c.icon}</div>
                    <div>
                      <div className="lp-contact-label">{c.label}</div>
                      <div className="lp-contact-value">{c.value}</div>
                    </div>
                  </div>
                ))}

                <form
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    padding: 24,
                    boxShadow: "var(--shadow)",
                  }}
                  onSubmit={handleEnquiry}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--indigo-deep)",
                      fontSize: 15,
                      marginBottom: 16,
                    }}
                  >
                    📩 Quick Enquiry
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label className="lp-field-label">Your Name</label>
                      <input
                        className="lp-field-input"
                        type="text"
                        placeholder="e.g. Ravi Sharma"
                        required
                      />
                    </div>
                    <div>
                      <label className="lp-field-label">Phone Number</label>
                      <input
                        className="lp-field-input"
                        type="tel"
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                    <div>
                      <label className="lp-field-label">Enquiry Type</label>
                      <select
                        className="lp-field-select"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select enquiry type
                        </option>
                        <option>Admission Enquiry</option>
                        <option>Fee Related</option>
                        <option>Exam / Result</option>
                        <option>General Query</option>
                      </select>
                    </div>
                    <div>
                      <label className="lp-field-label">Your Message</label>
                      <textarea
                        className="lp-field-textarea"
                        rows={3}
                        placeholder="Tell us briefly how we can help"
                      />
                    </div>
                    <button type="submit" className="lp-submit-btn">
                      Send Enquiry
                    </button>
                    <div className={`lp-form-ok ${formStatus}`}>
                      ✓ Thank you! We will contact you soon.
                    </div>
                  </div>
                </form>
              </div>

              <div>
                <div className="lp-map">
                  <iframe
                    title="Map showing Agra, Uttar Pradesh"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d114427.61568!2d77.9908!3d27.1767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39747121d702ff6d%3A0xdd2ae4803f767dde!2sAgra%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div
                  style={{
                    marginTop: 20,
                    padding: "20px 22px",
                    background:
                      "linear-gradient(150deg,var(--marigold-light),#f6f1e7)",
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--indigo-deep)",
                      fontSize: 15,
                      marginBottom: 12,
                    }}
                  >
                    📋 Documents for Admission
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {[
                      "Birth Certificate (Original + Photocopy)",
                      "Previous Class Marksheet / Transfer Certificate",
                      "Aadhar Card of Student & Parent",
                      "Passport size photographs (4 copies)",
                      "Caste Certificate (if applicable)",
                    ].map((d) => (
                      <li
                        key={d}
                        style={{
                          fontSize: 13.5,
                          color: "var(--ink-soft)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ color: "var(--clay)" }}>✓</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-footer-brand-name">
                🏫 Shree H.S. Model High School
              </div>
              <p>
                Nurturing minds and building character since 2001. UP Board
                affiliated school in Agra dedicated to academic excellence and
                Indian values.
              </p>
              <div className="lp-footer-badges">
                {["UP Board Affiliated", "Est. 2001", "Agra, UP"].map((b) => (
                  <span key={b} className="lp-footer-badge">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="lp-footer-col">
              <h4>Quick Links</h4>
              {[
                { label: "Home", sec: "home" },
                { label: "About School", sec: "about" },
                { label: "Curriculum", sec: "curriculum" },
                { label: "Our Faculty", sec: "teachers" },
                { label: "Gallery", sec: "gallery" },
                { label: "Notice Board", sec: "notices" },
              ].map((l) => (
                <button key={l.sec} onClick={() => showSection(l.sec)}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="lp-footer-col">
              <h4>Contact</h4>
              <a href="#">📍 Agra, Uttar Pradesh – 282001</a>
              <a href="tel:+915622345678">📞 +91 562 234-5678</a>
              <a href="mailto:info@shreehsmodelhs.edu.in">
                ✉️ info@shreehsmodelhs.edu.in
              </a>
              <a href="#">🕘 Mon–Sat: 8 AM – 2:30 PM</a>
              <div style={{ marginTop: 16 }}>
                <button
                  className="lp-portal-btn"
                  onClick={() => showSection("contact")}
                >
                  📩 Admission Enquiry
                </button>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>
              © {new Date().getFullYear()} Shree H.S. Model High School, Agra.
              All rights reserved.
            </span>
            <span>
              Principal: Rang Bahadur Singh Chauhan | Manager: Dr. P.S. Chauhan
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};
