import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users2,
  GraduationCap,
  Clock,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Eye,
  Sprout,
  ArrowUpRight,
} from "lucide-react";
import { getDashboardStats, updateAdminSettings } from "../api/client";
import ProgressBar from "../components/ProgressBar";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboardStats();
      if (res.success) {
        setStats(res.stats);
        setRecentRegistrations(res.recentRegistrations || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleRegistration = async () => {
    if (!stats) return;
    setToggleLoading(true);
    try {
      const newStatus = !stats.registrationOpen;
      const res = await updateAdminSettings({ registrationOpen: newStatus });
      if (res.success) {
        setStats((prev) => ({ ...prev, registrationOpen: newStatus }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle registration status.");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    totalTeams = 0,
    totalStudents = 0,
    pendingCount = 0,
    verifiedCount = 0,
    teamLimit = 100,
    remainingSlots = 100,
    registrationOpen = true,
  } = stats || {};

  return (
    <div className="w-full space-y-8">
      {/* Top Header & Quick Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#6B9080]/30 text-[#6B9080] text-xs font-bold mb-2 shadow-xs">
            <Sprout className="w-3.5 h-3.5 text-[#6B9080]" />
            <span>Live Committee Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-fraunces">
            AgriVerse Live Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time registered participants, verification progress, and symposium capacity metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Toggle for Registration Availability */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700">
              Registrations:
            </span>
            <button
              type="button"
              onClick={handleToggleRegistration}
              disabled={toggleLoading}
              role="switch"
              aria-checked={registrationOpen}
              aria-label={`Turn registrations ${registrationOpen ? "off" : "on"}`}
              className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                registrationOpen
                  ? "bg-[#6B9080] border-[#587B6C] hover:bg-[#587B6C]"
                  : "bg-slate-300 border-slate-300 hover:bg-slate-400"
              }`}
            >
              <span
                className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  registrationOpen ? "translate-x-8" : "translate-x-1"
                }`}
              />
              <span className="sr-only">{registrationOpen ? "ON" : "OFF"}</span>
              <span
                className={`absolute text-[9px] font-extrabold ${
                  registrationOpen
                    ? "left-2 text-white"
                    : "right-2 text-slate-600"
                }`}
              >
                {registrationOpen ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Registrations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Registrations
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF2EE] text-[#2D5A46] flex items-center justify-center border border-[#6B9080]/30 shadow-xs">
              <Users2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3 font-mono">
            {totalTeams}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Capacity:{" "}
            <span className="text-[#6B9080] font-bold">
              {totalTeams} / {teamLimit}
            </span>
          </div>
        </div>

        {/* Total Participants */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Participants
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3 font-mono">
            {totalStudents}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            (Solo individual participants)
          </div>
        </div>

        {/* Pending Verification */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending Verification
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-3 font-mono">
            {pendingCount}
          </div>
          <Link
            to="/admin/registrations?status=PENDING"
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold mt-1 transition-colors"
          >
            <span>View Pending</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Verified Registrations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Verified Registrations
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-3 font-mono">
            {verifiedCount}
          </div>
          <Link
            to="/admin/registrations?status=VERIFIED"
            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold mt-1 transition-colors"
          >
            <span>View Verified</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Progress & Capacity Details */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-slate-900">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#6B9080]" />
          <span>AgriVerse Registration Capacity & Quota</span>
        </h3>

        <ProgressBar
          registeredTeams={totalTeams}
          registrationLimit={teamLimit}
          isOpen={registrationOpen}
          isFull={totalTeams >= teamLimit}
        />
      </div>

      {/* Recent Registrations Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-slate-900">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Registrations
            </h3>
            <p className="text-xs text-slate-500">
              Latest participant submissions requiring verification
            </p>
          </div>
          <Link
            to="/admin/registrations"
            className="inline-flex items-center gap-1 text-xs text-[#6B9080] hover:text-[#587B6C] font-bold transition-colors"
          >
            <span>View All Registrations</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No registrations received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Reg No</th>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentRegistrations.map((reg) => (
                  <tr
                    key={reg._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {reg.registerNumber || reg.registrationId}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2D5A46]">
                      {reg.fullName || reg.teamName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {reg.phone || reg.members?.[0]?.phone || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {reg.department || reg.members?.[0]?.department || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ["paid", "PAID"].includes(reg.paymentStatus)
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {String(reg.paymentStatus || "UNPAID").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {String(
                        reg.verificationStatus || "PENDING",
                      ).toUpperCase() === "VERIFIED" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          VERIFIED
                        </span>
                      )}
                      {String(
                        reg.verificationStatus || "PENDING",
                      ).toUpperCase() === "REJECTED" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                          REJECTED
                        </span>
                      )}
                      {String(
                        reg.verificationStatus || "PENDING",
                      ).toUpperCase() === "PENDING" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/admin/registrations`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#6B9080] hover:bg-slate-100 inline-flex items-center transition-colors cursor-pointer"
                        title="Manage"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
