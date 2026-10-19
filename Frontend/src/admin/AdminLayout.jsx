import React from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users2,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sprout,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const { admin, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

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
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100">
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
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
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
      <main className="flex-1 w-full min-w-0 p-6 md:p-8 overflow-y-auto bg-[#F4F7F5]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
