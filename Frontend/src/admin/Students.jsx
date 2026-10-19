import React, { useEffect, useState } from "react";
import { Pencil, Plus, Save, X, Sprout } from "lucide-react";
import {
  createAdminStudent,
  getAdminStudents,
  updateAdminStudent,
} from "../api/client";

const emptyStudent = {
  fullName: "",
  registerNumber: "",
  email: "",
  phone: "",
  department: "",
  section: "",
  year: "",
  gender: "Male",
  residency: "Dayscholar",
  registrationStatus: "registered",
  paymentStatus: "UNPAID",
  verificationStatus: "PENDING",
  transactionId: "",
  rejectionReason: "",
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ ...emptyStudent });
  const [studentSaving, setStudentSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getAdminStudents();
      if (res.success) setStudents(res.students || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openStudentModal = (student = null) => {
    setEditingStudent(student);
    setStudentForm(
      student ? { ...emptyStudent, ...student } : { ...emptyStudent },
    );
    setError("");
    setStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    if (studentSaving) return;
    setStudentModalOpen(false);
    setEditingStudent(null);
  };

  const updateStudentField = (field, value) => {
    setStudentForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleStudentSave = async (event) => {
    event.preventDefault();
    setStudentSaving(true);
    setError("");
    try {
      const res = editingStudent
        ? await updateAdminStudent(editingStudent._id, studentForm)
        : await createAdminStudent(studentForm);
      if (!res.success) throw new Error("Student could not be saved.");

      setStudents((previous) =>
        editingStudent
          ? previous.map((student) =>
              student._id === editingStudent._id ? res.student : student,
            )
          : [res.student, ...previous],
      );
      setStudentModalOpen(false);
      setEditingStudent(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save student.",
      );
    } finally {
      setStudentSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#6B9080]/30 text-[#6B9080] text-xs font-bold mb-2 shadow-xs">
            <Sprout className="w-3.5 h-3.5 text-[#6B9080]" />
            <span>Student Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-fraunces">
            Students Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Add new participants or update any existing registration profile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openStudentModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white text-xs font-bold shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {error && !studentModalOpen && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <section className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden text-slate-900">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#6B9080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Register No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Residency</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {student.registerNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#2D5A46] block">
                        {student.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {student.email || student.phone || "No contact"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {student.department}{" "}
                      {student.year ? `• ${student.year}` : ""}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {student.residency}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ["PAID", "VERIFIED"].includes(
                            String(student.paymentStatus || "").toUpperCase(),
                          )
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {String(student.paymentStatus || "UNPAID").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          String(
                            student.verificationStatus || "",
                          ).toUpperCase() === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : String(
                                student.verificationStatus || "",
                              ).toUpperCase() === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {String(
                          student.verificationStatus || "PENDING",
                        ).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openStudentModal(student)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-[#6B9080] transition-colors cursor-pointer"
                        title={`Edit ${student.fullName}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 text-slate-900">
            <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-fraunces">
                  {editingStudent ? "Edit Student" : "Add Student"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage participant details, payment, and verification.
                </p>
              </div>
              <button
                type="button"
                onClick={closeStudentModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}
            <form
              onSubmit={handleStudentSave}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                ["fullName", "Full Name"],
                ["registerNumber", "Register Number"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["department", "Department"],
                ["section", "Section"],
                ["year", "Year"],
                ["transactionId", "Transaction ID"],
              ].map(([field, label]) => (
                <label key={field} className="text-xs font-bold text-slate-700">
                  {label}
                  <input
                    required={[
                      "fullName",
                      "registerNumber",
                      "department",
                      "section",
                      "year",
                    ].includes(field)}
                    type={field === "email" ? "email" : "text"}
                    value={studentForm[field] || ""}
                    onChange={(event) =>
                      updateStudentField(field, event.target.value)
                    }
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/15"
                  />
                </label>
              ))}
              <label className="text-xs font-bold text-slate-700">
                Gender
                <select
                  value={studentForm.gender}
                  onChange={(event) =>
                    updateStudentField("gender", event.target.value)
                  }
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080]"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Residency
                <select
                  value={studentForm.residency}
                  onChange={(event) =>
                    updateStudentField("residency", event.target.value)
                  }
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080]"
                >
                  <option value="Dayscholar">Dayscholar</option>
                  <option value="Hosteler">Hosteler</option>
                  <option value="Hosteller">Hosteller</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Payment Status
                <select
                  value={studentForm.paymentStatus}
                  onChange={(event) =>
                    updateStudentField("paymentStatus", event.target.value)
                  }
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080]"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Registration Status
                <select
                  value={studentForm.registrationStatus}
                  onChange={(event) =>
                    updateStudentField("registrationStatus", event.target.value)
                  }
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080]"
                >
                  <option value="registered">REGISTERED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Verification Status
                <select
                  value={studentForm.verificationStatus}
                  onChange={(event) =>
                    updateStudentField("verificationStatus", event.target.value)
                  }
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080]"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
              <label className="sm:col-span-2 text-xs font-bold text-slate-700">
                Rejection Reason
                <textarea
                  value={studentForm.rejectionReason || ""}
                  onChange={(event) =>
                    updateStudentField("rejectionReason", event.target.value)
                  }
                  rows={2}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/15"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeStudentModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />{" "}
                  {studentSaving ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
