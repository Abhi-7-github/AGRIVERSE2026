import ExcelJS from "exceljs";

/**
 * Generate Excel workbook for solo participant registrations
 * @param {Array} registrations
 * @param {String} filterStatus
 * @returns {Promise<ExcelJS.Workbook>}
 */
export const generateRegistrationsExcel = async (
  registrations,
  filterStatus = "ALL",
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Event Registration Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Registrations (${filterStatus})`, {
    pageSetup: { orientation: "landscape" },
    views: [{ state: "frozen", ySplit: 2 }],
  });

  // Define Columns for Solo Participants
  worksheet.columns = [
    { header: "Reg ID", key: "registrationId", width: 18 },
    { header: "Full Name", key: "fullName", width: 22 },
    { header: "Register Number", key: "registerNumber", width: 18 },
    { header: "Residency", key: "residency", width: 16 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Department", key: "department", width: 16 },
    { header: "Section", key: "section", width: 10 },
    { header: "Year", key: "year", width: 12 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Verification Status", key: "verificationStatus", width: 20 },
    { header: "Transaction ID", key: "transactionId", width: 22 },
    { header: "Rejection Reason", key: "rejectionReason", width: 26 },
    { header: "Registered At", key: "registeredAt", width: 22 },
    { header: "Verified At", key: "verifiedAt", width: 22 },
    { header: "Payment Proof URL", key: "proofUrl", width: 32 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // Populate data
  registrations.forEach((reg) => {
    const row = worksheet.addRow({
      registrationId: reg.registrationId,
      fullName: reg.fullName || "",
      registerNumber: reg.registerNumber || "",
      residency: reg.residency || "Dayscholar",
      phone: reg.phone || "",
      department: reg.department || "",
      section: reg.section || "",
      year: reg.year || "",
      gender: reg.gender || "",
      paymentStatus: reg.paymentStatus || "UNPAID",
      verificationStatus: reg.verificationStatus || "PENDING",
      transactionId: reg.transactionId || "",
      rejectionReason: reg.rejectionReason || "N/A",
      registeredAt: reg.registeredAt
        ? new Date(reg.registeredAt).toLocaleString()
        : "",
      verifiedAt: reg.verifiedAt
        ? new Date(reg.verifiedAt).toLocaleString()
        : "N/A",
      proofUrl: reg.paymentScreenshot?.url || "",
    });

    row.height = 22;
    row.alignment = { vertical: "middle" };

    // Row borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  return workbook;
};

export default generateRegistrationsExcel;
