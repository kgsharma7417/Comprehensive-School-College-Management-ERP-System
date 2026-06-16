import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Globe,
  Save,
  Image as ImageIcon,
  BarChart3,
  PhoneCall,
  LogOut,
  ArrowLeft,
  CheckCircle,
  Eye,
} from "lucide-react";

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

export const WebAdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing content from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("school_erp_landing_content");
    if (saved) {
      try {
        setContent({ ...DEFAULT_CONTENT, ...JSON.parse(saved) });
      } catch (e) {
        import("../utils/logger").then(({ error }) =>
          error("Failed to parse landing page content", e),
        );
      }
    }
  }, []);

  const handleChange = (key, value) => {
    setContent((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("school_erp_landing_content", JSON.stringify(content));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all website content to defaults?",
      )
    ) {
      setContent(DEFAULT_CONTENT);
      localStorage.setItem(
        "school_erp_landing_content",
        JSON.stringify(DEFAULT_CONTENT),
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Web Admin Control Center
              </h1>
              <p className="text-xs text-slate-500">
                Manage Shree H.S. Model Landing Page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" /> Live Site
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {saveSuccess && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm shadow-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Success! Landing Page configuration saved and updated
              successfully.
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Card: Hero Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Hero Section Settings
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={content.heroTitle}
                  onChange={(e) => handleChange("heroTitle", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Hero Subtitle
                </label>
                <textarea
                  value={content.heroSubtitle}
                  onChange={(e) => handleChange("heroSubtitle", e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Hero Image URL
                  </label>
                  <input
                    type="url"
                    value={content.heroImageUrl}
                    onChange={(e) =>
                      handleChange("heroImageUrl", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={content.ctaText}
                    onChange={(e) => handleChange("ctaText", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* URL Preview */}
              {content.heroImageUrl && (
                <div className="mt-4 border border-slate-100 rounded-xl p-3 bg-slate-50">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Image Preview
                  </span>
                  <img
                    src={content.heroImageUrl}
                    alt="Hero Preview"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card: Stats Counters */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Institution Stats (Counters)
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Students Enrolled
                </label>
                <input
                  type="number"
                  value={content.statsStudents}
                  onChange={(e) =>
                    handleChange("statsStudents", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Expert Faculty
                </label>
                <input
                  type="number"
                  value={content.statsFaculty}
                  onChange={(e) =>
                    handleChange("statsFaculty", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Equipped Labs
                </label>
                <input
                  type="number"
                  value={content.statsLabs}
                  onChange={(e) =>
                    handleChange("statsLabs", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Board Pass Rate %
                </label>
                <input
                  type="number"
                  max="100"
                  value={content.statsPassRate}
                  onChange={(e) =>
                    handleChange("statsPassRate", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Card: Contact Details */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2.5">
              <PhoneCall className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Footer / Contact Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={content.contactAddress}
                  onChange={(e) =>
                    handleChange("contactAddress", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={content.contactPhone}
                    onChange={(e) =>
                      handleChange("contactPhone", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={content.contactEmail}
                    onChange={(e) =>
                      handleChange("contactEmail", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 px-4 text-sm text-slate-800 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-3 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-350 rounded-xl transition-all"
            >
              Reset to Defaults
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition-all"
            >
              <Save className="w-4 h-4" /> Save Page Content
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
