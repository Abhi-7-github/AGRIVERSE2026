import React, { useState } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users2,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const { admin, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F7F5]">
        <div className="w-10 h-10 border-4 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { name: "Live Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Students", path: "/admin/students", icon: Users2 },
    {
      name: "Registrations",
      path: "/admin/registrations",
      icon: Users2,
    },
    { name: "AgriVerse Settings", path: "/admin/settings", icon: SettingsIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-xs">
            <img
              src="/assets/kare-tech-logo.png"
              alt="KARE Tech AgriVerse"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm font-fraunces leading-tight">
              AgriVerse Admin
            </h2>
            <span className="text-[9px] uppercase font-bold text-[#2D5A46] bg-[#EAF2EE] px-1.5 py-0.2 rounded font-mono border border-[#6B9080]/30">
              {admin?.role || "Admin"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          aria-label="Toggle admin navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar: Slide-over drawer on mobile, persistent on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:z-auto md:shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-md">
              <img
                src="/assets/kare-tech-logo.png"
                alt="KARE Tech AgriVerse"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm font-fraunces">
                AgriVerse Admin
              </h2>
              <span className="text-[10px] uppercase font-bold text-[#2D5A46] bg-[#EAF2EE] px-2 py-0.5 rounded-full border border-[#6B9080]/30 font-mono">
                {admin?.role || "Admin"}
              </span>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-[#EAF2EE] text-[#2D5A46] border border-[#6B9080]/30 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-[#6B9080]" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {active && (
                  <ChevronRight className="w-4 h-4 text-[#6B9080]" />
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-[#6B9080] hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Live View</span>
            </Link>
          </div>
        </nav>

        {/* User Account / Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {admin?.username || "Administrator"}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                {admin?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition-colors shadow-xs cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden bg-[#F4F7F5]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
