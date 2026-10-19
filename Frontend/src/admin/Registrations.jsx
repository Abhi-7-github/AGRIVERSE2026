import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  RefreshCw,
  FileSpreadsheet,
  Sprout,
} from "lucide-react";
import {
  getRegistrations,
  verifyRegistrationPayment,
  rejectRegistrationPayment,
  updateRegistrationStatus,
  downloadRegistrationsExcel,
} from "../api/client";
import ImageViewerModal from "../components/ImageViewerModal";

const getPaymentStatus = (registration) => {
  const status = String(registration.paymentStatus || "").toUpperCase();
  return ["PAID", "VERIFIED", "REJECTED"].includes(status) ? "PAID" : "UNPAID";
};

const getVerificationStatus = (registration) => {
  const status = String(
    registration.verificationStatus || registration.paymentStatus || "",
  ).toUpperCase();
  return ["PENDING", "VERIFIED", "REJECTED"].includes(status)
    ? status
    : "PENDING";
};

const Registrations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  // Data & Filtering state
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected registration for details modal
  const [selectedReg, setSelectedReg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Reason Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Full Screen Image Viewer Modal State
  const [imageViewerUrl, setImageViewerUrl] = useState("");

  // Export filter popup state
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const fetchList = async (
    page = 1,
    status = statusFilter,
    search = searchQuery,
  ) => {
    setLoading(true);
    setError("");
    try {
      const res = await getRegistrations({
        page,
        limit: 10,
        status,
        search,
      });
      if (res.success) {
        setRegistrations(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, statusFilter, searchQuery);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchList(1, statusFilter, searchQuery);
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setSearchParams(newStatus === "ALL" ? {} : { status: newStatus });
  };

  const handleOpenReject = (reg) => {
    setSelectedReg(reg);
    setRejectReason(reg.rejectionReason || "");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;

    setActionLoading(true);
    try {
      const res = await rejectRegistrationPayment(
        selectedReg._id,
        rejectReason,
      );
      if (res.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r._id === selectedReg._id ? res.registration : r)),
        );
        setSelectedReg(res.registration);
        setRejectModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusSelect = async (reg, targetStatus) => {
    if (targetStatus === "REJECTED") {
      handleOpenReject(reg);
      return;
    }
    setActionLoading(true);
    try {
      const res = await updateRegistrationStatus(reg._id, targetStatus);
      if (res.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r._id === reg._id ? res.registration : r)),
        );
        if (selectedReg?._id === reg._id) {
          setSelectedReg(res.registration);
        }
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to update registration status",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExcel = async (residency) => {
    try {
      await downloadRegistrationsExcel(statusFilter, residency);
      setExportModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to export registrations");
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-900">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#6B9080]/30 text-[#6B9080] text-xs font-bold mb-2 shadow-xs">
            <Sprout className="w-3.5 h-3.5 text-[#6B9080]" />
            <span>Verification Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-fraunces">
            Participant Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Validate payment records and verify participant registrations, then export official spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>

          <button
            onClick={() =>
              fetchList(pagination.page, statusFilter, searchQuery)
            }
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {["ALL", "UNPAID", "PAID", "PENDING", "VERIFIED", "REJECTED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? "bg-[#EAF2EE] text-[#2D5A46] border border-[#6B9080]/40 shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 w-full md:w-80"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participant, reg no..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6B9080]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Registrations Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden text-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-rose-500 text-sm font-semibold">
            {error}
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No registrations found matching the current filter.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 rounded-l-xl">Reg No</th>
                    <th className="py-3.5 px-4">Participant Name</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Department & Year</th>
                    <th className="py-3.5 px-4">UTR / Proof</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {registrations.map((reg) => {
                    const studentName = reg.fullName || reg.teamName || "-";
                    const regNo =
                      reg.registerNumber || reg.registrationId || "-";
                    const phone = reg.phone || reg.members?.[0]?.phone || "-";
                    const dept =
                      reg.department || reg.members?.[0]?.department || "-";
                    const yr = reg.year || reg.members?.[0]?.year || "";
                    const sec = reg.section || reg.members?.[0]?.section || "";

                    return (
                      <tr
                        key={reg._id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {regNo}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#2D5A46]">
                          {studentName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {phone}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{dept}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {reg.residency || "Dayscholar"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {yr}
                            {sec ? ` • Sec ${sec}` : ""}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-700 text-[11px] truncate max-w-[120px]">
                            {reg.transactionId || "-"}
                          </div>
                          {reg.paymentScreenshot?.url && (
                            <button
                              onClick={() =>
                                setImageViewerUrl(reg.paymentScreenshot.url)
                              }
                              className="text-[10px] text-[#6B9080] hover:text-[#587B6C] font-bold inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                            >
                              <ZoomIn className="w-3 h-3" /> View Receipt
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              getPaymentStatus(reg) === "PAID"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {getPaymentStatus(reg) === "PAID" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {getPaymentStatus(reg)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getVerificationStatus(reg) === "VERIFIED" && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> VERIFIED
                            </span>
                          )}
                          {getVerificationStatus(reg) === "REJECTED" && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                          )}
                          {getVerificationStatus(reg) === "PENDING" && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedReg(reg)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
                              title="View full details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Verification Status Dropdown under Action */}
                            <select
                              value={getVerificationStatus(reg)}
                              onChange={(e) =>
                                handleStatusSelect(reg, e.target.value)
                              }
                              disabled={actionLoading}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all ${
                                getVerificationStatus(reg) === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400"
                                  : getVerificationStatus(reg) === "REJECTED"
                                    ? "bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400"
                                    : "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400"
                              }`}
                            >
                              <option value="VERIFIED">✓ VERIFIED</option>
                              <option value="PENDING">⏳ PENDING</option>
                              <option value="REJECTED">✕ REJECTED</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing page{" "}
                <span className="font-bold text-slate-900">{pagination.page}</span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {pagination.totalPages || 1}
                </span>{" "}
                (Total {pagination.total} participants)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    fetchList(pagination.page - 1, statusFilter, searchQuery)
                  }
                  disabled={!pagination.hasPrevPage}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-slate-700 shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-mono font-bold text-[#6B9080]">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    fetchList(pagination.page + 1, statusFilter, searchQuery)
                  }
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-slate-700 shadow-xs cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FULL DETAILS MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#2D5A46] font-bold bg-[#EAF2EE] px-2 py-0.5 rounded border border-[#6B9080]/30">
                    {selectedReg.registrationId}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedReg.registerNumber ||
                      selectedReg.members?.[0]?.registerNumber}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 font-fraunces mt-1">
                  {selectedReg.fullName || selectedReg.teamName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Payment info bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">
                    Transaction Reference ID:
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {selectedReg.transactionId || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {selectedReg.paymentScreenshot?.url && (
                    <button
                      onClick={() =>
                        setImageViewerUrl(selectedReg.paymentScreenshot.url)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6B9080] text-white text-xs font-bold hover:bg-[#587B6C] shadow-xs transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Inspect Receipt</span>
                    </button>
                  )}

                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        getPaymentStatus(selectedReg) === "PAID"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {getPaymentStatus(selectedReg) === "PAID" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      PAYMENT: {getPaymentStatus(selectedReg)}
                    </span>
                    {getVerificationStatus(selectedReg) === "VERIFIED" && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1 ml-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                      </span>
                    )}
                    {getVerificationStatus(selectedReg) === "REJECTED" && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 ml-2">
                        <XCircle className="w-3.5 h-3.5" /> REJECTED
                      </span>
                    )}
                    {getVerificationStatus(selectedReg) === "PENDING" && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1 ml-2">
                        <Clock className="w-3.5 h-3.5" /> PENDING
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {getVerificationStatus(selectedReg) === "REJECTED" &&
                selectedReg.rejectionReason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <span className="font-bold block mb-1">
                      Rejection Reason:
                    </span>
                    <p>{selectedReg.rejectionReason}</p>
                  </div>
                )}

              {/* Participant Credentials */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs border-t-4 border-t-[#6B9080]">
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-3 text-[#6B9080]">
                  Registered Participant Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Full Name
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedReg.fullName || selectedReg.teamName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Register / Roll Number
                      </span>
                      <span className="font-mono font-bold text-[#6B9080] text-sm">
                        {selectedReg.registerNumber ||
                          selectedReg.members?.[0]?.registerNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Residency
                      </span>
                      <span className="text-slate-700 font-bold">
                        {selectedReg.residency || "Dayscholar"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Phone
                      </span>
                      <span className="text-slate-700 font-mono">
                        {selectedReg.phone || selectedReg.members?.[0]?.phone}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Department
                      </span>
                      <span className="text-slate-800 font-medium">
                        {selectedReg.department ||
                          selectedReg.members?.[0]?.department}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Year
                        </span>
                        <span className="text-slate-700">
                          {selectedReg.year || selectedReg.members?.[0]?.year}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Section
                        </span>
                        <span className="text-slate-700">
                          {selectedReg.section ||
                            selectedReg.members?.[0]?.section}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Gender
                      </span>
                      <span className="text-slate-700">
                        {selectedReg.gender || selectedReg.members?.[0]?.gender}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Registered At
                      </span>
                      <span className="text-slate-600">
                        {selectedReg.registeredAt
                          ? new Date(selectedReg.registeredAt).toLocaleString()
                          : new Date(selectedReg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Proof Snapshot Preview */}
              {selectedReg.paymentScreenshot?.url && (
                <div>
                  <span className="text-xs uppercase font-bold text-slate-700 block mb-2">
                    Submitted Payment Screenshot
                  </span>
                  <div
                    onClick={() =>
                      setImageViewerUrl(selectedReg.paymentScreenshot.url)
                    }
                    className="relative cursor-pointer group max-w-sm rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={
                        selectedReg.paymentScreenshot.url.startsWith("http")
                          ? selectedReg.paymentScreenshot.url
                          : `http://localhost:5000${selectedReg.paymentScreenshot.url}`
                      }
                      alt="Receipt Thumbnail"
                      className="w-full h-44 object-cover group-hover:opacity-85 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/60 transition-opacity">
                      <span className="px-3 py-1.5 rounded-xl bg-[#6B9080] text-white text-xs font-bold flex items-center gap-1 shadow-md">
                        <ZoomIn className="w-3.5 h-3.5" /> Fullscreen View
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Verification Status Dropdown & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Registered on {new Date(selectedReg.createdAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold">
                  Change Status:
                </span>
                <select
                  value={getVerificationStatus(selectedReg)}
                  onChange={(e) =>
                    handleStatusSelect(selectedReg, e.target.value)
                  }
                  disabled={actionLoading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all ${
                    getVerificationStatus(selectedReg) === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : getVerificationStatus(selectedReg) === "REJECTED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  <option value="VERIFIED">✓ VERIFIED</option>
                  <option value="PENDING">⏳ PENDING</option>
                  <option value="REJECTED">✕ REJECTED</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl shadow-2xl p-6 text-slate-900">
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-fraunces">
              Reject Participant Payment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify reason for participant "
              {selectedReg?.fullName ||
                selectedReg?.teamName ||
                "this participant"}
              ". The student will see this reason on their status tracker.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID not found in bank statement / Screenshot is blurry / Amount mismatched."
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-rose-500 placeholder-slate-400"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT FILTER POPUP */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
            <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-fraunces">
                  Export Registrations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose which residency group to download.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close export popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { value: "ALL", label: "All Registrations" },
                { value: "DAY_SCHOLARS", label: "Dayscholars" },
                { value: "HOSTLERS", label: "Hostlers" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleExportExcel(option.value)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#6B9080] hover:bg-[#EAF2EE] text-left text-sm font-bold text-slate-800 transition-colors cursor-pointer"
                >
                  <span>{option.label}</span>
                  <Download className="w-4 h-4 text-[#6B9080]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Viewer Modal */}
      <ImageViewerModal
        isOpen={Boolean(imageViewerUrl)}
        imageUrl={imageViewerUrl}
        onClose={() => setImageViewerUrl("")}
      />
    </div>
  );
};

export default Registrations;
