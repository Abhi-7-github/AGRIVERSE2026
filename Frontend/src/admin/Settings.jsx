import React, { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  QrCode,
  MessageCircle,
  Upload,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sprout,
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  uploadQRCode,
  deleteQRCode,
  toggleQRCode,
  addWhatsAppGroup,
  updateWhatsAppGroup,
  deleteWhatsAppGroup,
} from "../api/client";
import { useEvent } from "../context/EventContext";

const Settings = () => {
  const { refreshEvent } = useEvent();
  const fileInputRef = useRef(null);

  // Settings State: fee, limit, open/close, qrCode, qrCodes, whatsappGroups
  const [settings, setSettings] = useState({
    registrationOpen: true,
    registrationLimit: 100,
    registrationFee: 0,
    qrCode: null,
    qrCodes: [],
    whatsappGroups: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // QR Code upload form state
  const [qrFiles, setQrFiles] = useState([]);
  const [qrTitle, setQrTitle] = useState("");
  const [qrUpiId, setQrUpiId] = useState("");
  const [qrUploading, setQrUploading] = useState(false);

  // WhatsApp group form state
  const [newGroup, setNewGroup] = useState({
    name: "",
    url: "",
    active: true,
    order: 1,
  });
  const [groupLoading, setGroupLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getAdminSettings();
      if (res.success) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load event settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await updateAdminSettings({
        registrationOpen: settings.registrationOpen,
        registrationLimit: Number(settings.registrationLimit),
        registrationFee: Number(settings.registrationFee),
      });

      if (res.success) {
        setSuccessMsg("Settings updated successfully.");
        refreshEvent();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrationToggle = async (event) => {
    const nextValue = event.target.checked;
    const previousValue = Boolean(settings.registrationOpen);
    setSettings((prev) => ({ ...prev, registrationOpen: nextValue }));
    setToggleSaving(true);
    setErrorMsg("");

    try {
      const res = await updateAdminSettings({ registrationOpen: nextValue });
      if (!res.success)
        throw new Error("Failed to update registration availability");
      refreshEvent();
    } catch (err) {
      setSettings((prev) => ({ ...prev, registrationOpen: previousValue }));
      setErrorMsg(
        err.response?.data?.message || "Failed to toggle registration status",
      );
    } finally {
      setToggleSaving(false);
    }
  };

  const handleQRUpload = async (e) => {
    e.preventDefault();
    if (!qrFiles || qrFiles.length === 0) return;

    setQrUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let latestUpdatedSettings = null;

      for (let i = 0; i < qrFiles.length; i++) {
        const file = qrFiles[i];
        const formData = new FormData();
        formData.append("qrImage", file);

        let fileTitle = qrTitle.trim();
        if (qrFiles.length > 1) {
          fileTitle = fileTitle
            ? `${fileTitle} (${i + 1})`
            : `Payment Account ${i + 1}`;
        } else if (!fileTitle) {
          fileTitle = "UPI QR Code";
        }

        formData.append("title", fileTitle);
        if (qrUpiId.trim()) formData.append("upiId", qrUpiId.trim());

        const res = await uploadQRCode(formData);
        if (res.success) {
          latestUpdatedSettings = res.settings;
        }
      }

      if (latestUpdatedSettings) {
        setSettings(latestUpdatedSettings);
        setSuccessMsg(
          qrFiles.length > 1
            ? `Successfully uploaded ${qrFiles.length} QR codes!`
            : "Payment QR code uploaded successfully!",
        );
        setQrFiles([]);
        setQrTitle("");
        setQrUpiId("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        refreshEvent();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to upload QR code(s)");
    } finally {
      setQrUploading(false);
    }
  };

  const handleQRDelete = async (id, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title || "this QR Code"}"?`,
      )
    )
      return;
    try {
      const res = await deleteQRCode(id);
      if (res.success) {
        setSettings(res.settings);
        setSuccessMsg("QR code deleted.");
        refreshEvent();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete QR code");
    }
  };

  const handleQRToggle = async (id, currentActiveState) => {
    try {
      const res = await toggleQRCode(id, !currentActiveState);
      if (res.success) {
        setSettings(res.settings);
        refreshEvent();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to toggle QR code");
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim() || !newGroup.url.trim()) return;

    setGroupLoading(true);
    try {
      const res = await addWhatsAppGroup(newGroup);
      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          whatsappGroups: res.whatsappGroups,
        }));
        setNewGroup({ name: "", url: "", active: true, order: 1 });
        setSuccessMsg("WhatsApp group added successfully!");
        refreshEvent();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add WhatsApp group");
    } finally {
      setGroupLoading(false);
    }
  };

  const handleToggleGroup = async (group) => {
    try {
      const res = await updateWhatsAppGroup(group._id, {
        active: !group.active,
      });
      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          whatsappGroups: res.whatsappGroups,
        }));
        refreshEvent();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update WhatsApp group");
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Delete this WhatsApp group link?")) return;
    try {
      const res = await deleteWhatsAppGroup(id);
      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          whatsappGroups: res.whatsappGroups,
        }));
        setSuccessMsg("WhatsApp group link removed.");
        refreshEvent();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete WhatsApp group");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-slate-900">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#6B9080]/30 text-[#6B9080] text-xs font-bold mb-2 shadow-xs">
          <Sprout className="w-3.5 h-3.5 text-[#6B9080]" />
          <span>AgriVerse Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-fraunces">
          Event Settings & Live Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure registration limits, registration fees, dynamic QR code hot-swapper, and official WhatsApp groups.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Registration Limits & Fee Configuration */}
      <form
        onSubmit={handleGeneralSubmit}
        className="w-full p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 text-slate-900"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-[#6B9080]" />
            <h3 className="text-base font-bold text-slate-900 font-fraunces">
              Registration Quota & Fee Parameters
            </h3>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Configuration</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Registration Limit */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Participant Registration Capacity (Limit)
            </label>
            <input
              type="number"
              min={1}
              value={settings.registrationLimit ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, registrationLimit: e.target.value })
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/15 text-sm font-mono font-bold"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Maximum number of participants admitted
            </span>
          </div>

          {/* Registration Fee */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Registration Fee (₹ INR per Participant)
            </label>
            <input
              type="number"
              min={0}
              value={settings.registrationFee ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, registrationFee: e.target.value })
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/15 text-sm font-mono font-bold"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Charged per participant (enter 0 for free entry)
            </span>
          </div>

          {/* Registration Active Toggle */}
          <div className="md:col-span-2 pt-2">
            <label className="flex items-center justify-between gap-3 cursor-pointer p-4 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                checked={Boolean(settings.registrationOpen)}
                onChange={handleRegistrationToggle}
                disabled={toggleSaving}
                className="peer sr-only"
              />
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  Public Registrations Availability
                </span>
                <span className="text-slate-500 text-xs">
                  Enable or disable submissions on the public student portal.
                </span>
              </div>
              <span
                className={`relative h-7 w-14 shrink-0 rounded-full border transition-colors ${
                  settings.registrationOpen
                    ? "bg-[#6B9080] border-[#587B6C]"
                    : "bg-slate-300 border-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.registrationOpen
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
                <span
                  className={`absolute top-1.5 text-[9px] font-extrabold ${
                    settings.registrationOpen
                      ? "left-2 text-white"
                      : "right-2 text-slate-600"
                  }`}
                >
                  {settings.registrationOpen ? "ON" : "OFF"}
                </span>
              </span>
            </label>
          </div>
        </div>
      </form>

      {/* 2. Multi-Payment QR Code Management */}
      <div className="w-full p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#6B9080]" />
            <div>
              <h3 className="text-base font-bold text-slate-900 font-fraunces">
                Payment QR Codes (Multi-Account & Failover)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload multiple QR codes. All active QRs appear on the registration form so students can switch if an account reaches its limit.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            {(settings.qrCodes || []).filter((q) => q.active !== false).length} Active QR{(settings.qrCodes || []).filter((q) => q.active !== false).length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Upload New QR Code Form */}
        <form onSubmit={handleQRUpload} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            + Upload New Payment QR Code
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                Account / QR Name
              </label>
              <input
                type="text"
                placeholder="e.g. Account 1 / GPay Primary"
                value={qrTitle}
                onChange={(e) => setQrTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#6B9080]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                UPI ID / VPA (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. organizer@okaxis"
                value={qrUpiId}
                onChange={(e) => setQrUpiId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#6B9080] font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-600 font-semibold">
                  QR Image File(s) <span className="text-rose-500">*</span>
                </label>
                {qrFiles.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {qrFiles.length} file{qrFiles.length > 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setQrFiles(Array.from(e.target.files || []))}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#6B9080] file:text-white hover:file:bg-[#587B6C] cursor-pointer"
              />
              <span className="block text-[10px] text-slate-400 mt-1">
                Select one or multiple QR screenshots.
              </span>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={qrFiles.length === 0 || qrUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
            >
              {qrUploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {qrUploading
                  ? "Uploading..."
                  : qrFiles.length > 1
                  ? `Upload ${qrFiles.length} QR Codes`
                  : "Upload & Add QR"}
              </span>
            </button>
          </div>
        </form>

        {/* Existing QR Codes Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active & Configured QR Codes
            </span>
          </div>

          {(settings.qrCodes && settings.qrCodes.length > 0) || settings.qrCode?.url ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {((settings.qrCodes && settings.qrCodes.length > 0)
                ? settings.qrCodes
                : [
                    {
                      _id: "legacy",
                      title: "Primary UPI QR",
                      url: settings.qrCode?.url,
                      active: true,
                    },
                  ]
              ).map((qr, idx) => {
                const qrUrl = qr.url?.startsWith("http")
                  ? qr.url
                  : `http://localhost:5000${qr.url}`;
                return (
                  <div
                    key={qr._id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      qr.active !== false
                        ? "bg-white border-emerald-300 shadow-sm"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    } flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                          {qr.title || `UPI QR #${idx + 1}`}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            qr.active !== false
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {qr.active !== false ? "Active" : "Disabled"}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl mb-3 flex items-center justify-center border border-slate-200 shadow-2xs">
                        <img
                          src={qrUrl}
                          alt={qr.title || "Payment QR"}
                          className="w-36 h-36 object-contain rounded-lg"
                        />
                      </div>

                      {qr.upiId && (
                        <p className="text-[11px] font-mono text-[#2D5A46] bg-[#EAF2EE] p-1.5 rounded-lg border border-[#6B9080]/20 text-center mb-3 truncate font-bold">
                          {qr.upiId}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {qr._id && qr._id !== "legacy" && (
                        <button
                          type="button"
                          onClick={() => handleQRToggle(qr._id, qr.active !== false)}
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                        >
                          {qr.active !== false ? "Disable" : "Enable"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQRDelete(qr._id, qr.title)}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-bold ml-auto transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <QrCode className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No Payment QR Codes active.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload one above to allow participants to scan and pay.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. WhatsApp Groups Management */}
      <div className="w-full p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 text-slate-900">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <div>
            <h3 className="text-base font-bold text-slate-900 font-fraunces">
              Official Participant WhatsApp Groups
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Channels configured here will display on the student payment verification page and success dashboard.
            </p>
          </div>
        </div>

        {/* Existing Groups List */}
        <div className="space-y-3">
          {!settings.whatsappGroups || settings.whatsappGroups.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 italic">
                No WhatsApp groups configured yet. Add your group invite URL below to make it visible on the payment page.
              </p>
            </div>
          ) : (
            settings.whatsappGroups.map((group) => (
              <div
                key={group._id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {group.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        group.active
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-200 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {group.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <a
                    href={group.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2D5A46] hover:underline inline-flex items-center gap-1 mt-1 text-[11px] font-mono"
                  >
                    <span>{group.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleGroup(group)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      group.active
                        ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {group.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Group */}
        <form
          onSubmit={handleAddGroup}
          className="pt-4 border-t border-slate-100 space-y-3"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Add New WhatsApp Group
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              placeholder="Group Name (e.g. AgriVerse Official Announcements)"
              value={newGroup.name}
              onChange={(e) =>
                setNewGroup({ ...newGroup, name: e.target.value })
              }
              required
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-[#6B9080]"
            />
            <input
              type="url"
              placeholder="WhatsApp Invite URL (https://chat.whatsapp.com/...)"
              value={newGroup.url}
              onChange={(e) =>
                setNewGroup({ ...newGroup, url: e.target.value })
              }
              required
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-[#6B9080]"
            />
          </div>
          <button
            type="submit"
            disabled={groupLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white text-xs font-bold shadow-md shadow-[#6B9080]/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add WhatsApp Channel</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
