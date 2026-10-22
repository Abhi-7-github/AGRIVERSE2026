import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  QrCode,
  Sparkles,
  Info,
  ShieldCheck,
  FileCheck,
  X,
  Sprout,
  Hash,
  Eye,
  ArrowLeft,
  User,
  ExternalLink,
  MessageCircle,
  Building2,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react";
import { lookupTeam, submitPayment, getMediaUrl } from "../api/client";
import { useEvent } from "../context/EventContext";

const TeamPayment = () => {
  const { eventData: globalEventData, refreshEvent } = useEvent();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery =
    searchParams.get("regNo") ||
    searchParams.get("team") ||
    searchParams.get("query") ||
    (() => {
      try {
        return sessionStorage.getItem("agrigen_payment_portal_reg") || "";
      } catch (e) {
        return "";
      }
    })();

  // Search form state
  const [identifierQuery, setIdentifierQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Loaded Participant State
  const [participantData, setParticipantData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [whatsappGroups, setWhatsappGroups] = useState([]);

  // QR Refresh State
  const [selectedQrIndex, setSelectedQrIndex] = useState(0);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrRefreshMsg, setQrRefreshMsg] = useState("");
  const [qrRefreshStatus, setQrRefreshStatus] = useState("");

  const handleRefreshQr = async () => {
    if (isRefreshingQr) return;
    setIsRefreshingQr(true);
    setQrRefreshStatus("");
    try {
      const updated = await refreshEvent();
      if (updated?.qrCodes || updated?.qrCode) {
        setEventData((prev) => ({
          ...(prev || {}),
          qrCode: updated.qrCode || prev?.qrCode,
          qrCodes: updated.qrCodes || prev?.qrCodes,
          registrationFee: updated.registrationFee ?? prev?.registrationFee,
        }));
      }
      setQrRefreshStatus("success");
      setQrRefreshMsg("QR updated!");
      setTimeout(() => {
        setQrRefreshMsg("");
        setQrRefreshStatus("");
      }, 3500);
    } catch (err) {
      setQrRefreshStatus("error");
      setQrRefreshMsg("Refresh failed");
      setTimeout(() => {
        setQrRefreshMsg("");
        setQrRefreshStatus("");
      }, 3500);
    } finally {
      setIsRefreshingQr(false);
    }
  };

  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auto-search if query param provided
  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      handlePerformLookup(initialQuery.trim());
    }
  }, [initialQuery]);

  // Clean up object url preview
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePerformLookup = async (queryToSearch) => {
    if (!queryToSearch || queryToSearch.trim().length < 2) {
      setSearchError("Please enter your exact Register Number (e.g. 21CS042).");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setParticipantData(null);
    setShowPaymentForm(false);
    setPaymentSuccess(false);
    setSubmitError("");

    try {
      const res = await lookupTeam({ registerNumber: queryToSearch.trim() });
      if (res.success && (res.participant || res.team)) {
        const p = res.participant || res.team;
        setParticipantData(p);
        setEventData(res.event || null);
        setWhatsappGroups(res.whatsappGroups || []);
        setShowPaymentForm(true);
        setSearchParams({ regNo: queryToSearch.trim().toUpperCase() }, { replace: true });
        try {
          sessionStorage.setItem("agrigen_payment_portal_reg", queryToSearch.trim().toUpperCase());
        } catch (e) { }
      }
    } catch (err) {
      setParticipantData(null);
      setSearchError(
        err.response?.data?.message ||
          "Participant not found. Please enter the exact Register Number used during registration.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetSearch = () => {
    try {
      sessionStorage.removeItem("agrigen_payment_portal_reg");
    } catch (e) { }
    setParticipantData(null);
    setIdentifierQuery("");
    setShowPaymentForm(false);
    setPaymentSuccess(false);
    setSearchError("");
    setSearchParams({}, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handlePerformLookup(identifierQuery.trim());
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPaymentErrors((prev) => ({
        ...prev,
        paymentScreenshot:
          "Please upload a valid image file (PNG, JPG, or WEBP).",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentErrors((prev) => ({
        ...prev,
        paymentScreenshot: "File size must be 5MB or less.",
      }));
      return;
    }

    setPaymentScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPaymentErrors((prev) => {
      const next = { ...prev };
      delete next.paymentScreenshot;
      return next;
    });
  };

  const validatePayment = () => {
    const errs = {};
    if (!transactionId.trim()) {
      errs.transactionId = "UPI Transaction / Reference ID is required.";
    } else if (transactionId.trim().length < 6) {
      errs.transactionId = "Please enter a valid Transaction / Reference ID.";
    }

    if (!paymentScreenshot) {
      errs.paymentScreenshot = "Payment screenshot receipt is required.";
    }

    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!validatePayment()) return;

    setIsSubmittingPayment(true);
    setSubmitError("");

    try {
      const pData = new FormData();
      pData.append("registerNumber", participantData.registerNumber);
      pData.append("transactionId", transactionId.trim().toUpperCase());
      pData.append("paymentScreenshot", paymentScreenshot);

      const res = await submitPayment(pData);
      if (res.success) {
        try {
          sessionStorage.removeItem("agrigen_payment_portal_reg");
        } catch (e) { }
        setPaymentSuccess(true);
        setShowPaymentForm(false);
        setParticipantData((prev) => ({
          ...prev,
          paymentStatus: "paid",
          transactionId: transactionId.trim().toUpperCase(),
        }));
      }
    } catch (err) {
      console.error(err);
      setSubmitError(
        err.response?.data?.message ||
          "Payment submission failed. Please check your inputs and try again.",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const isAlreadyPaid =
    participantData &&
    ["paid", "PAID"].includes(String(participantData.paymentStatus));

  // Compute full list of available QR codes
  const allQrCodes = (() => {
    const list = eventData?.qrCodes;
    if (Array.isArray(list) && list.length > 0) {
      return list
        .map((item, idx) => {
          const rawUrl = typeof item === "string" ? item : item.url;
          const fullUrl = rawUrl ? getMediaUrl(rawUrl) : null;
          return {
            id: item.id || item._id || idx,
            title: item.title || `UPI QR ${idx + 1}`,
            url: fullUrl,
            upiId: item.upiId || "",
          };
        })
        .filter((item) => Boolean(item.url));
    }
    const rawSingle = eventData?.qrCode;
    const singleUrl = typeof rawSingle === "string"
      ? getMediaUrl(rawSingle)
      : rawSingle?.url
        ? getMediaUrl(rawSingle.url)
        : null;
    if (singleUrl) {
      return [
        {
          id: "primary",
          title: "Primary UPI QR",
          url: singleUrl,
          upiId: "",
        },
      ];
    }
    return [];
  })();

  const activeQr = allQrCodes[selectedQrIndex] || allQrCodes[0] || null;
  const qrImageUrl = activeQr?.url || null;

  // Active WhatsApp groups configured in backend (no default hardcoded group)
  const activeWhatsAppGroups =
    whatsappGroups && whatsappGroups.length > 0
      ? whatsappGroups
      : eventData?.whatsappGroups && eventData.whatsappGroups.length > 0
        ? eventData.whatsappGroups
        : globalEventData?.whatsappGroups && globalEventData.whatsappGroups.length > 0
          ? globalEventData.whatsappGroups
          : [];

  return (
    <div className="min-h-screen py-10 sm:py-14 pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#6B9080]/30 text-[#6B9080] text-xs font-bold mb-3 shadow-md">
            <img
              src="/assets/kare-tech-logo.png"
              alt="KARE Tech"
              className="w-4 h-4 rounded-full object-contain bg-black p-0.5"
            />
            <span>AgriVerse 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-fraunces mb-2">
            Participant Payment Portal
          </h1>

          <p className="text-xs sm:text-sm text-[#CCE3DE] max-w-lg mx-auto leading-relaxed font-sans">
            Enter your Register / Roll Number below to identify your elective participant
            profile and complete payment verification.
          </p>
        </div>

        {/* ================= STEP A: PARTICIPANT SEARCH CARD ================= */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-xl mb-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 font-sans">
                Enter your Register / Roll Number{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={identifierQuery}
                  onChange={(e) => {
                    setIdentifierQuery(e.target.value.toUpperCase());
                    if (searchError) setSearchError("");
                  }}
                  placeholder="e.g. 21CS042"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border ${
                    searchError
                      ? "border-rose-400 bg-rose-50"
                      : "border-slate-200"
                  } text-slate-900 placeholder-slate-400 text-sm font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/20 transition-all`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Enter the exact student Register Number provided during
                registration.
              </span>
              <button
                type="submit"
                disabled={isSearching || !identifierQuery.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#6B9080]/20 border border-[#6B9080] transition-all cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Continue to Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error: Participant Not Found */}
          {searchError && (
            <div className="mt-5 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-200">
                  Participant not found.
                </span>
                <span>{searchError}</span>
                <div className="mt-2 text-rose-300 text-xs">
                  Not registered yet?{" "}
                  <Link
                    to="/agrigenevent/registerationforstudent"
                    className="font-bold underline hover:text-white"
                  >
                    Register here &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= STEP B: PARTICIPANT FOUND RESULTS ================= */}
        {participantData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Participant Credentials Identification Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0E1712] border border-[#1A2E21] shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1A2E21]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                      Participant Found ✓
                    </span>
                    <h2 className="text-xl font-extrabold text-white">
                      {participantData.fullName}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#0B130E] text-emerald-400 border border-[#1A2E21]">
                    {participantData.registrationId}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="text-[11px] text-slate-400 hover:text-rose-300 px-2.5 py-1 rounded-lg border border-[#1A2E21] hover:border-rose-500/40 bg-[#0B130E] transition-colors cursor-pointer"
                    title="Search a different participant"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Verified Student Credentials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-5">
                <div className="p-3 rounded-xl bg-[#0B130E] border border-[#1A2E21]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Register No
                  </span>
                  <span className="font-mono font-bold text-white">
                    {participantData.registerNumber}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B130E] border border-[#1A2E21]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Department
                  </span>
                  <span className="font-bold text-white truncate block">
                    {participantData.department}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B130E] border border-[#1A2E21]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Year & Section
                  </span>
                  <span className="font-bold text-white">
                    {participantData.year} • Sec {participantData.section}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B130E] border border-[#1A2E21]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Gender
                  </span>
                  <span className="font-bold text-white">
                    {participantData.gender}
                  </span>
                </div>
              </div>

              {/* Status Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-3.5 rounded-2xl bg-[#0B130E] border border-[#1A2E21]">
                  <span className="text-slate-400 block mb-0.5">
                    Registration Status:
                  </span>
                  <span className="font-extrabold text-white capitalize text-sm">
                    {participantData.registrationStatus || "Registered"} ✓
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isAlreadyPaid || paymentSuccess
                      ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-200"
                      : "bg-amber-950/40 border-amber-800/40 text-amber-200"
                  }`}
                >
                  <span className="block mb-0.5 opacity-80">
                    Payment Status:
                  </span>
                  <span className="font-extrabold text-sm flex items-center gap-1.5">
                    {isAlreadyPaid || paymentSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Already Paid ✓</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Unpaid</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* If Already Paid */}
              {(isAlreadyPaid || paymentSuccess) && (
                <div className="mt-5 p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-base text-white">
                      No payment required.
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    Your registration payment has already been completed. Your
                    AgriVerse 2026 entry is confirmed!
                  </p>

                  {/* WhatsApp Channels */}
                  {activeWhatsAppGroups && activeWhatsAppGroups.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-900/60">
                      <span className="text-xs font-bold text-white block mb-2 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>Official WhatsApp Groups:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeWhatsAppGroups.map((g, i) => (
                          <a
                            key={i}
                            href={g.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B130E] hover:bg-[#132219] border border-emerald-500/30 text-emerald-200 text-xs font-bold transition-colors"
                          >
                            <span>{g.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      to="/"
                      className="px-4 py-2 rounded-xl bg-[#0B130E] text-white text-xs font-bold hover:bg-[#132219] border border-[#1A2E21] transition-colors"
                    >
                      Return to Overview
                    </Link>
                    <Link
                      to={`/success/${participantData.registrationId}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                    >
                      View Registration Status
                    </Link>
                  </div>
                </div>
              )}

              {/* If Unpaid and payment form not yet opened */}
              {!isAlreadyPaid && !paymentSuccess && !showPaymentForm && (
                <div className="mt-5 pt-4 border-t border-[#1A2E21] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Registration confirmed. Please complete payment to finalize
                    your presentation schedule.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Payment</span>
                  </button>
                </div>
              )}
            </div>

            {/* ================= STEP C: UNPAID PAYMENT TERMINAL ================= */}
            {!isAlreadyPaid && !paymentSuccess && showPaymentForm && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                {submitError && (
                  <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold">Error: </span>
                      {submitError}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitError("")}
                      className="p-1 text-rose-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: QR Code & Fee */}
                  <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0E1712] border border-[#1A2E21] shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#1A2E21]">
                        <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-white text-sm">
                          Official AgriVerse UPI
                        </h3>
                      </div>

                      {/* Fee Pill */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mb-4 text-center text-slate-900">
                        <span className="text-[10px] text-[#587B6C] uppercase tracking-widest font-extrabold block">
                          Registration Fee
                        </span>
                        <div className="text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight font-research">
                          ₹{eventData?.registrationFee || 0}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Solo Participant Entry
                        </span>
                      </div>

                      {/* QR Frame */}
                      <div className="p-4 rounded-2xl bg-[#0B130E] border border-[#1A2E21] space-y-3 mb-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1A2E21]/60">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Payment QR Code
                          </span>
                          <button
                            type="button"
                            onClick={handleRefreshQr}
                            disabled={isRefreshingQr}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E2015] hover:bg-[#143020] border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                            title="Receiver limit reached? Click to fetch latest updated QR Codes"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRefreshingQr ? "animate-spin text-emerald-300" : ""}`} />
                            <span>{isRefreshingQr ? "Refreshing..." : "Refresh QRs"}</span>
                          </button>
                        </div>

                        {/* Multiple Account Tabs */}
                        {allQrCodes.length > 1 && (
                          <div className="space-y-1 text-left">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300 font-bold flex items-center gap-1">
                                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                                Payment Accounts ({allQrCodes.length})
                              </span>
                              <span className="text-[10px] text-amber-300/90 font-medium">
                                Limit over? Switch QR below ↓
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                              {allQrCodes.map((qr, idx) => {
                                const isSelected = selectedQrIndex === idx;
                                return (
                                  <button
                                    key={qr.id || idx}
                                    type="button"
                                    onClick={() => setSelectedQrIndex(idx)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                      isSelected
                                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                        : "bg-[#0E2015] border border-[#1A2E21] text-slate-300 hover:text-white hover:border-emerald-500/40"
                                    }`}
                                  >
                                    <span>{qr.title}</span>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {qrImageUrl ? (
                          <div className="flex flex-col items-center justify-center">
                            {activeQr?.title && (
                              <div className="text-xs font-bold text-emerald-400 mb-1.5">
                                {activeQr.title}
                              </div>
                            )}
                            <div className="p-2.5 bg-white rounded-2xl border-2 border-emerald-500/40 shadow-md mb-2">
                              <img
                                src={qrImageUrl}
                                alt={activeQr?.title || "Payment QR Code"}
                                className="w-44 h-44 object-contain rounded-xl"
                              />
                            </div>
                            {activeQr?.upiId && (
                              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg mb-2">
                                <span className="truncate max-w-[160px]">{activeQr.upiId}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(activeQr.upiId);
                                    setCopiedUpi(true);
                                    setTimeout(() => setCopiedUpi(false), 2000);
                                  }}
                                  className="text-slate-400 hover:text-white cursor-pointer ml-1"
                                  title="Copy UPI ID"
                                >
                                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              Scan with GPay, PhonePe, Paytm, or BHIM
                            </span>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-500">
                            <QrCode className="w-12 h-12 mx-auto mb-2 opacity-40" />
                            <p className="text-xs font-semibold">
                              Payment QR Code
                            </p>
                          </div>
                        )}

                        {/* Thumbnail gallery if multiple QRs */}
                        {allQrCodes.length > 1 && (
                          <div className="pt-2 border-t border-[#1A2E21]/60 text-left space-y-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              All Available QRs (Tap to switch):
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {allQrCodes.map((qr, idx) => {
                                const isSelected = selectedQrIndex === idx;
                                return (
                                  <div
                                    key={qr.id || idx}
                                    onClick={() => setSelectedQrIndex(idx)}
                                    className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400"
                                        : "bg-[#0E2015] border-[#1A2E21] hover:border-emerald-500/40 opacity-70 hover:opacity-100"
                                    }`}
                                  >
                                    <div className="w-full h-12 bg-white rounded-lg p-1 flex items-center justify-center mb-1">
                                      <img src={qr.url} alt={qr.title} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-[10px] font-bold truncate text-white">
                                      {qr.title}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#1A2E21]/60 flex items-center justify-between text-[10px] text-slate-400">
                          <span>UPI limit over? Switch QR or tap</span>
                          {qrRefreshMsg && (
                            <span className={`font-bold px-1.5 py-0.5 rounded ${qrRefreshStatus === "success" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"}`}>
                              {qrRefreshMsg}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1A2E21] text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Note down the 12-digit UTR/Reference number from your
                        UPI app receipt after payment.
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Transaction ID & Receipt Upload */}
                  <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0E1712] border border-[#1A2E21] shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1A2E21]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">
                              Payment Proof Submission
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Attach screenshot & UTR number
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[#0B130E] text-emerald-400 border border-[#1A2E21]">
                          {participantData.registerNumber}
                        </span>
                      </div>

                      {/* Transaction ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          UPI Transaction ID / UTR{" "}
                          <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => {
                              setTransactionId(e.target.value.toUpperCase());
                              if (paymentErrors.transactionId) {
                                setPaymentErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.transactionId;
                                  return next;
                                });
                              }
                            }}
                            placeholder="e.g. 423987129034 / UPI Ref"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B130E] border ${
                              paymentErrors.transactionId
                                ? "border-rose-500/80 bg-rose-950/20"
                                : "border-[#1A2E21]"
                            } text-white placeholder-slate-500 text-xs sm:text-sm font-mono font-bold uppercase focus:bg-[#0E1712] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all`}
                          />
                        </div>
                        {paymentErrors.transactionId && (
                          <p className="text-xs text-rose-400 mt-1 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {paymentErrors.transactionId}
                          </p>
                        )}
                      </div>

                      {/* Receipt Screenshot Upload */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Payment Screenshot Receipt{" "}
                          <span className="text-rose-400">*</span>
                        </label>

                        {!previewUrl ? (
                          <label className="border-2 border-dashed border-[#1A2E21] hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#0B130E] hover:bg-[#132219]/60 transition-all text-center group">
                            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-emerald-500/30">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-200">
                              Click to upload screenshot receipt
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              PNG, JPG, or WEBP (Max: 5MB)
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="rounded-2xl border border-[#1A2E21] overflow-hidden bg-[#0B130E] p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="relative group cursor-pointer"
                                onClick={() => setShowScreenshotModal(true)}
                              >
                                <img
                                  src={previewUrl}
                                  alt="Receipt preview"
                                  className="w-12 h-12 object-cover rounded-xl border border-[#1A2E21] shadow-2xs"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white line-clamp-1">
                                  {paymentScreenshot?.name}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {(paymentScreenshot?.size / 1024).toFixed(1)}{" "}
                                  KB • Ready to submit
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowScreenshotModal(true)}
                                className="p-1.5 rounded-lg bg-[#132219] border border-[#1A2E21] text-slate-300 hover:bg-[#1a2e21] cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentScreenshot(null);
                                  setPreviewUrl("");
                                }}
                                className="p-1.5 rounded-lg bg-[#132219] border border-[#1A2E21] text-slate-300 hover:text-rose-400 hover:bg-rose-950/60 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {paymentErrors.paymentScreenshot && (
                          <p className="text-xs text-rose-400 mt-1 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {paymentErrors.paymentScreenshot}
                          </p>
                        )}
                      </div>

                      {/* Official WhatsApp Group joining section */}
                      {activeWhatsAppGroups && activeWhatsAppGroups.length > 0 && (
                        <div className="p-4 rounded-2xl bg-[#0B1E12] border border-emerald-500/40 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <MessageCircle className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-white text-xs sm:text-sm">
                                Join Official WhatsApp Group
                              </h4>
                              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                                Join our official WhatsApp group for schedules, presentation updates, and event coordinators.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {activeWhatsAppGroups.map((group, idx) => (
                              <a
                                key={group.id || group._id || idx}
                                href={group.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                <span>{group.name || 'Join WhatsApp Group'}</span>
                                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Submit Button */}
                    <div className="mt-6 pt-4 border-t border-[#1A2E21] flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingPayment}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-sm shadow-md shadow-[#6B9080]/20 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Updating Payment Status...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submit Payment Proof</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Modal for Receipt Zoom */}
        {showScreenshotModal && previewUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setShowScreenshotModal(false)}
          >
            <div
              className="bg-[#0E1712] border border-[#1A2E21] rounded-3xl max-w-lg w-full p-5 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A2E21]">
                <h4 className="font-bold text-white text-sm">
                  Receipt Screenshot Preview
                </h4>
                <button
                  onClick={() => setShowScreenshotModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[#132219] text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden bg-[#080D0A] border border-[#1A2E21] flex items-center justify-center max-h-[70vh]">
                <img
                  src={previewUrl}
                  alt="Receipt Preview Modal"
                  className="w-full h-auto object-contain max-h-[70vh]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Event Overview
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamPayment;
