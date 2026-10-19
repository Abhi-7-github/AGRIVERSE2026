import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Sprout,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getRegistrationStatus } from "../api/client";

const Status = () => {
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await getRegistrationStatus(searchId.trim());
      if (res.success) {
        setResult(res.registration);
        setWhatsappGroups(res.whatsappGroups || []);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "No registration found with this Registration ID. Please check and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    switch (s) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> VERIFICATION
            VERIFIED ✓
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-extrabold shadow-xs">
            <XCircle className="w-4 h-4 text-rose-400" /> VERIFICATION REJECTED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs font-extrabold shadow-xs">
            <Clock className="w-4 h-4 text-amber-400" /> VERIFICATION PENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#132219] border border-[#1A2E21] text-slate-300 text-xs font-extrabold shadow-xs">
            <Clock className="w-4 h-4 text-slate-400" /> {s || "PENDING"}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgb(107,144,128)] border border-white/20 text-white text-xs font-bold mb-3 shadow-md">
          <img
            src="/assets/kare-tech-logo.png"
            alt="KARE Tech"
            className="w-4 h-4 rounded-full object-contain bg-black p-0.5"
          />
          <span>AgriVerse 2026 Live Verification Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-fraunces mb-2">
          Track Registration & Status
        </h1>
        <p className="text-[#CCE3DE] text-xs sm:text-sm mt-1 max-w-md mx-auto font-sans">
          Enter your unique Registration ID to check elective verification and
          participation schedule.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xl mb-8 max-w-2xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="e.g. 2100030123"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6B9080] text-sm uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer border border-[#6B9080]"
          >
            <Search className="w-4 h-4 text-white" />
            <span>{loading ? "Searching..." : "Track Status"}</span>
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 flex items-start gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Results Card */}
      {result && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl paper-card shadow-xl">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1A2E21]">
              <div>
                <span className="text-xs text-slate-400 font-mono">
                  REG ID: {result.registrationId}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {result.fullName}
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {result.registerNumber}
                </span>
              </div>
              <div>
                {getStatusBadge(result.verificationStatus || "PENDING")}
              </div>
            </div>

            {/* Unpaid notice */}
            {String(result.paymentStatus || "").toLowerCase() === "unpaid" && (
              <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-amber-200">
                      Registration Complete • Payment Unpaid
                    </span>
                    <span>
                      You are registered! Complete payment to verify your
                      AgriVerse entry.
                    </span>
                  </div>
                </div>
                <Link
                  to={`/team-payment?regNo=${encodeURIComponent(result.registerNumber || "")}`}
                  className="px-4 py-2 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs shrink-0 text-center shadow-md shadow-[#6B9080]/20 transition-all"
                >
                  Pay via Participant Portal &rarr;
                </Link>
              </div>
            )}

            {/* Rejection notice if any */}
            {String(result.verificationStatus || "").toUpperCase() ===
              "REJECTED" && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
                <span className="font-bold block text-rose-200 mb-1">
                  Reason for Rejection:
                </span>
                <p>
                  {result.rejectionReason ||
                    "Payment screenshot or transaction details could not be verified."}
                </p>
                <p className="mt-2 text-rose-300">
                  Please contact the organizing committee or complete valid
                  payment at /payment.
                </p>
              </div>
            )}

            {/* Verified / Paid banner if any */}
            {String(result.verificationStatus || "").toUpperCase() ===
              "VERIFIED" && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block text-white">
                    Payment Received & Confirmed!
                  </span>
                  <span>
                    Your registration is approved. See you at the AgriVerse 2026
                    course venue!
                  </span>
                </div>
              </div>
            )}

            {/* Participant Credentials */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Participant Credentials
              </span>

              <div className="p-4 rounded-xl bg-[#0B130E] border border-[#1A2E21] text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Register No
                    </span>
                    <span className="font-mono font-bold text-white">
                      {result.registerNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Department
                    </span>
                    <span className="font-bold text-white truncate block">
                      {result.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Year & Section
                    </span>
                    <span className="font-bold text-white">
                      {result.year}{" "}
                      {result.section ? `• Sec ${result.section}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Gender
                    </span>
                    <span className="font-bold text-white">
                      {result.gender}
                    </span>
                  </div>
                </div>

                {(result.email || result.phone) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-3 border-t border-[#1A2E21]">
                    {result.email && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Email
                        </span>
                        <span className="text-slate-300 font-medium">
                          {result.email}
                        </span>
                      </div>
                    )}
                    {result.phone && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Phone
                        </span>
                        <span className="text-slate-300 font-medium">
                          {result.phone}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-6 pt-4 border-t border-[#1A2E21] text-xs text-slate-400 flex flex-wrap justify-between gap-2">
              <span>
                Submitted: {new Date(result.registeredAt).toLocaleString()}
              </span>
              {result.verifiedAt && (
                <span>
                  Reviewed: {new Date(result.verifiedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* WhatsApp group links */}
          {whatsappGroups.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-lg text-slate-900">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Official AgriVerse WhatsApp Channels</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {whatsappGroups.map((g, i) => (
                  <a
                    key={i}
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>{g.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Return Home */}
      <div className="text-center mt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 font-bold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>
      </div>
    </div>
  );
};

export default Status;
