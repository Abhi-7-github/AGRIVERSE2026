import Registration from "../models/Registration.js";
import EventSettings from "../models/EventSettings.js";
import {
  uploadBufferToStorage,
  deleteStorageImage,
} from "../config/cloudinary.js";
import { generateRegistrationsExcel } from "../services/excelService.js";

const normalizeStatusForResponse = (registration) => {
  const data = registration.toObject
    ? registration.toObject()
    : { ...registration };
  const legacyStatus = String(data.paymentStatus || "").toUpperCase();

  if (
    ["PENDING", "VERIFIED", "REJECTED"].includes(legacyStatus) &&
    (!data.verificationStatus || data.verificationStatus === "PENDING")
  ) {
    data.verificationStatus = legacyStatus;
  }
  if (["PENDING", "VERIFIED", "REJECTED"].includes(legacyStatus)) {
    data.paymentStatus =
      data.transactionId || data.paymentScreenshot?.url ? "PAID" : "UNPAID";
  }

  return data;
};

// Helper to escape user input before regex compilation to prevent ReDoS attacks
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  try {
    const settings = await EventSettings.findOne();
    const teamLimit = settings?.registrationLimit ?? 0;
    const isRegistrationOpen = settings ? settings.registrationOpen : false;

    const [
      totalTeams,
      unpaidCount,
      paidCount,
      pendingCount,
      verifiedCount,
      rejectedCount,
      recentRegistrations,
    ] = await Promise.all([
      Registration.countDocuments(),
      Registration.countDocuments({
        paymentStatus: { $in: ["unpaid", "UNPAID"] },
      }),
      Registration.countDocuments({ paymentStatus: { $in: ["paid", "PAID"] } }),
      Registration.countDocuments({
        $or: [
          { verificationStatus: { $in: ["pending", "PENDING"] } },
          { paymentStatus: { $in: ["pending", "PENDING"] } },
        ],
      }),
      Registration.countDocuments({
        $or: [
          { verificationStatus: { $in: ["verified", "VERIFIED"] } },
          { paymentStatus: { $in: ["verified", "VERIFIED"] } },
        ],
      }),
      Registration.countDocuments({
        $or: [
          { verificationStatus: { $in: ["rejected", "REJECTED"] } },
          { paymentStatus: { $in: ["rejected", "REJECTED"] } },
        ],
      }),

      Registration.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const totalStudents = totalTeams;
    const remainingSlots = Math.max(0, teamLimit - totalTeams);

    res.status(200).json({
      success: true,
      stats: {
        totalTeams,
        totalStudents,
        unpaidCount,
        paidCount,
        pendingCount,
        verifiedCount,
        rejectedCount,
        teamLimit,
        remainingSlots,
        registrationOpen: isRegistrationOpen,
        progressPercent: Math.min(
          100,
          Math.round((totalTeams / teamLimit) * 100),
        ),
      },
      recentRegistrations: recentRegistrations.map(normalizeStatusForResponse),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Paginated and Filtered Registrations List
// @route   GET /api/v1/admin/registrations
// @access  Private (Admin)
export const getRegistrations = async (req, res, next) => {
  try {
    const {
      search = "",
      status = "ALL",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};
    const filters = [];

    // Filter by payment or verification status.
    if (status && status !== "ALL") {
      const normalizedStatus = escapeRegex(status.trim().toUpperCase());
      if (["PAID", "UNPAID"].includes(normalizedStatus)) {
        filters.push({
          paymentStatus: { $regex: new RegExp(`^${normalizedStatus}$`, "i") },
        });
      } else {
        filters.push({
          $or: [
            {
              verificationStatus: {
                $regex: new RegExp(`^${normalizedStatus}$`, "i"),
              },
            },
            {
              paymentStatus: {
                $regex: new RegExp(`^${normalizedStatus}$`, "i"),
              },
            },
          ],
        });
      }
    }

    // Search filter across solo participant fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      filters.push({
        $or: [
          { fullName: searchRegex },
          { registerNumber: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { department: searchRegex },
          { registrationId: searchRegex },
          { transactionId: searchRegex },
        ],
      });
    }

    if (filters.length) query.$and = filters;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [total, registrations] = await Promise.all([
      Registration.countDocuments(query),
      Registration.find(query).sort(sortOptions).skip(skip).limit(limitNumber),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      data: registrations.map(normalizeStatusForResponse),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single registration details
// @route   GET /api/v1/admin/registrations/:id
// @access  Private (Admin)
export const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration record not found",
      });
    }

    res.status(200).json({
      success: true,
      registration: normalizeStatusForResponse(registration),
    });
  } catch (error) {
    next(error);
  }
};

const studentFields = [
  "fullName",
  "registerNumber",
  "email",
  "phone",
  "department",
  "section",
  "year",
  "gender",
  "residency",
  "registrationStatus",
  "paymentStatus",
  "verificationStatus",
  "transactionId",
  "rejectionReason",
];

const applyStudentFields = (registration, body) => {
  studentFields.forEach((field) => {
    if (body[field] !== undefined) registration[field] = body[field];
  });

  if (body.registerNumber !== undefined) {
    registration.registerNumber = String(body.registerNumber)
      .trim()
      .toUpperCase();
    registration.registrationId = registration.registerNumber;
  }
  if (body.fullName !== undefined)
    registration.fullName = String(body.fullName).trim();
  if (body.department !== undefined)
    registration.department = String(body.department).trim();
  if (body.section !== undefined)
    registration.section = String(body.section).trim().toUpperCase();
  if (body.email !== undefined)
    registration.email = String(body.email).trim().toLowerCase();
  if (body.paymentStatus !== undefined)
    registration.paymentStatus = String(body.paymentStatus).toUpperCase();
  if (body.verificationStatus !== undefined)
    registration.verificationStatus = String(
      body.verificationStatus,
    ).toUpperCase();
};

// @desc    Get students for dashboard management
// @route   GET /api/v1/admin/students
export const getStudents = async (req, res, next) => {
  try {
    const students = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({
      success: true,
      students: students.map(normalizeStatusForResponse),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a student from the admin dashboard
// @route   POST /api/v1/admin/students
export const createStudent = async (req, res, next) => {
  try {
    const student = new Registration({
      registrationId: String(req.body.registerNumber || "")
        .trim()
        .toUpperCase(),
      paymentStatus: "UNPAID",
      verificationStatus: "PENDING",
    });
    applyStudentFields(student, req.body);
    await student.save();

    res.status(201).json({
      success: true,
      student: normalizeStatusForResponse(student),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A student with this registration number already exists.",
      });
    }
    next(error);
  }
};

// @desc    Edit a student from the admin dashboard
// @route   PATCH /api/v1/admin/students/:id
export const updateStudent = async (req, res, next) => {
  try {
    const student = await Registration.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    applyStudentFields(student, req.body);
    await student.save();

    res.status(200).json({
      success: true,
      student: normalizeStatusForResponse(student),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A student with this registration number already exists.",
      });
    }
    next(error);
  }
};

// @desc    Verify registration payment
// @route   PATCH /api/v1/admin/registrations/:id/verify
// @access  Private (Admin)
export const verifyPayment = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    registration.verificationStatus = "VERIFIED";
    registration.verifiedAt = new Date();
    registration.rejectionReason = "";

    await registration.save();

    res.status(200).json({
      success: true,
      message: `Payment for participant "${registration.fullName} (${registration.registerNumber})" verified successfully.`,
      registration: normalizeStatusForResponse(registration),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject registration payment
// @route   PATCH /api/v1/admin/registrations/:id/reject
// @access  Private (Admin)
export const rejectPayment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    registration.verificationStatus = "REJECTED";
    registration.verifiedAt = new Date();
    registration.rejectionReason =
      reason && reason.trim()
        ? reason.trim()
        : "Invalid transaction details or mismatched screenshot proof.";

    await registration.save();

    res.status(200).json({
      success: true,
      message: `Payment for participant "${registration.fullName} (${registration.registerNumber})" rejected.`,
      registration: normalizeStatusForResponse(registration),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update registration verification status (VERIFIED, PENDING, REJECTED)
// @route   PATCH /api/v1/admin/registrations/:id/status
// @access  Private (Admin)
export const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const upperStatus = (status || "").toUpperCase();
    const allowed = ["VERIFIED", "PENDING", "REJECTED"];

    if (!allowed.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowed.join(", ")}`,
      });
    }

    registration.verificationStatus = upperStatus;
    registration.verifiedAt = new Date();

    if (upperStatus === "REJECTED") {
      registration.rejectionReason =
        reason && reason.trim()
          ? reason.trim()
          : "Payment submission rejected by administrator.";
    } else {
      registration.rejectionReason = "";
    }

    await registration.save();

    res.status(200).json({
      success: true,
      message: `Status for participant "${registration.fullName} (${registration.registerNumber})" updated to ${upperStatus}.`,
      registration: normalizeStatusForResponse(registration),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export registrations to Excel (.xlsx)
// @route   GET /api/v1/admin/export/excel
// @access  Private (Admin)
export const exportRegistrationsExcel = async (req, res, next) => {
  try {
    const { status = "ALL", residency = "ALL" } = req.query;
    const query = {};

    if (status && status !== "ALL") {
      const normalizedStatus = status.toUpperCase();
      if (["PAID", "UNPAID"].includes(normalizedStatus)) {
        query.paymentStatus = normalizedStatus;
      } else {
        query.$or = [
          { verificationStatus: normalizedStatus },
          { paymentStatus: normalizedStatus },
        ];
      }
    }

    if (residency && residency.toUpperCase() !== "ALL") {
      const normalizedResidency = residency.toUpperCase();
      query.residency =
        normalizedResidency === "HOSTLERS"
          ? { $in: ["Hosteler", "Hosteller"] }
          : { $in: ["Dayscholar", "Day Scholar"] };
    }

    const registrations = await Registration.find(query).sort({
      createdAt: -1,
    });
    const workbook = await generateRegistrationsExcel(
      registrations.map(normalizeStatusForResponse),
      status.toUpperCase(),
    );

    const filename = `Team_Registrations_${status.toUpperCase()}_${residency.toUpperCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin settings
// @route   GET /api/v1/admin/settings
// @access  Private (Admin)
export const getAdminSettings = async (req, res, next) => {
  try {
    let settings = await EventSettings.findOne();
    if (!settings) {
      settings = await EventSettings.create({});
    }

    // Auto-migrate legacy qrCode if qrCodes array is empty
    if (settings.qrCode?.url && (!settings.qrCodes || settings.qrCodes.length === 0)) {
      settings.qrCodes = [
        {
          title: "Primary UPI QR",
          url: settings.qrCode.url,
          publicId: settings.qrCode.publicId || "",
          upiId: "",
          active: true,
          createdAt: new Date(),
        },
      ];
      settings.markModified("qrCodes");
      await settings.save();
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin settings
// @route   PATCH /api/v1/admin/settings
// @access  Private (Admin)
export const updateAdminSettings = async (req, res, next) => {
  try {
    const { registrationOpen, registrationLimit, registrationFee } = req.body;

    let settings = await EventSettings.findOne();
    if (!settings) {
      settings = new EventSettings({});
    }

    if (registrationOpen !== undefined)
      settings.registrationOpen = Boolean(registrationOpen);
    if (registrationLimit !== undefined)
      settings.registrationLimit = Number(registrationLimit);
    if (registrationFee !== undefined)
      settings.registrationFee = Number(registrationFee);

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Event settings updated successfully",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload new Payment QR Code (supports single or multiple files)
// @route   POST /api/v1/admin/settings/qr
// @access  Private (Admin)
export const uploadQRCode = async (req, res, next) => {
  try {
    let incomingFiles = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        incomingFiles = req.files;
      } else if (typeof req.files === "object") {
        incomingFiles = [
          ...(req.files.qrCode || []),
          ...(req.files.qrImage || []),
          ...(req.files.image || []),
        ];
      }
    } else if (req.file && req.file.buffer) {
      incomingFiles = [req.file];
    }

    if (incomingFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an image file for the Payment QR Code",
      });
    }

    let settings = await EventSettings.findOne();
    if (!settings) {
      settings = new EventSettings({});
    }

    if (!settings.qrCodes) settings.qrCodes = [];

    // Auto-migrate legacy qrCode if qrCodes array is empty
    if (settings.qrCode?.url && settings.qrCodes.length === 0) {
      settings.qrCodes.push({
        title: "Primary UPI QR",
        url: settings.qrCode.url,
        publicId: settings.qrCode.publicId || "",
        upiId: "",
        active: true,
        createdAt: new Date(),
      });
    }

    const uploadedItems = [];
    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const uploadedQR = await uploadBufferToStorage(
        file.buffer,
        "event_settings",
        `qr_code_${Date.now()}_${i}`,
      );

      const title =
        incomingFiles.length === 1 && req.body.title
          ? req.body.title.trim()
          : req.body.title
            ? `${req.body.title.trim()} (${settings.qrCodes.length + 1})`
            : `UPI QR ${settings.qrCodes.length + 1}`;

      const upiId = (req.body.upiId || "").trim();

      const newQrItem = {
        title,
        url: uploadedQR.url,
        publicId: uploadedQR.publicId,
        upiId,
        active: true,
        createdAt: new Date(),
      };

      settings.qrCodes.push(newQrItem);
      uploadedItems.push(newQrItem);

      // Keep primary legacy qrCode synced to newest uploaded QR
      settings.qrCode = {
        url: uploadedQR.url,
        publicId: uploadedQR.publicId,
      };
    }

    settings.markModified("qrCodes");
    settings.markModified("qrCode");
    await settings.save();

    res.status(200).json({
      success: true,
      message: `${uploadedItems.length} Payment QR Code(s) uploaded successfully`,
      qrCode: settings.qrCode,
      qrCodes: settings.qrCodes,
      uploadedItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Payment QR Code (by ID or all)
// @route   DELETE /api/v1/admin/settings/qr/:id?
// @access  Private (Admin)
export const deleteQRCode = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.body.id || req.query.id;
    const settings = await EventSettings.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }

    if (
      targetId &&
      targetId !== "legacy" &&
      settings.qrCodes &&
      settings.qrCodes.length > 0
    ) {
      const qrItem = settings.qrCodes.id(targetId);
      if (qrItem) {
        if (qrItem.publicId) {
          await deleteStorageImage(qrItem.publicId);
        }
        settings.qrCodes.pull(targetId);
      }

      // Update primary qrCode to first remaining active QR, or empty
      const remainingActive = settings.qrCodes.find((q) => q.active !== false);
      if (remainingActive) {
        settings.qrCode = {
          url: remainingActive.url,
          publicId: remainingActive.publicId || "",
        };
      } else {
        settings.qrCode = { url: "", publicId: "" };
      }
      settings.markModified("qrCodes");
      settings.markModified("qrCode");
      await settings.save();

      return res.status(200).json({
        success: true,
        message: "QR Code removed successfully",
        qrCodes: settings.qrCodes,
        qrCode: settings.qrCode,
      });
    }

    // Legacy delete: remove all
    if (settings.qrCode?.publicId) {
      await deleteStorageImage(settings.qrCode.publicId);
    }
    for (const q of settings.qrCodes || []) {
      if (q.publicId) {
        await deleteStorageImage(q.publicId);
      }
    }
    settings.qrCode = { url: "", publicId: "" };
    settings.qrCodes = [];
    settings.markModified("qrCodes");
    settings.markModified("qrCode");
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Payment QR Code removed successfully",
      qrCodes: [],
      qrCode: settings.qrCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle active status or update details of a QR code
// @route   PATCH /api/v1/admin/settings/qr/:id
// @access  Private (Admin)
export const toggleQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, title, upiId } = req.body;

    const settings = await EventSettings.findOne();
    if (!settings || !settings.qrCodes) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }

    const qrItem = settings.qrCodes.id(id);
    if (!qrItem) {
      return res
        .status(404)
        .json({ success: false, message: "QR Code item not found" });
    }

    if (active !== undefined) qrItem.active = Boolean(active);
    if (title !== undefined) qrItem.title = title.trim();
    if (upiId !== undefined) qrItem.upiId = upiId.trim();

    // Re-sync primary qrCode
    const firstActive = settings.qrCodes.find((q) => q.active);
    if (firstActive) {
      settings.qrCode = {
        url: firstActive.url,
        publicId: firstActive.publicId,
      };
    }

    settings.markModified("qrCodes");
    settings.markModified("qrCode");
    await settings.save();

    res.status(200).json({
      success: true,
      message: "QR Code updated successfully",
      qrCodes: settings.qrCodes,
      qrCode: settings.qrCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add WhatsApp Group
// @route   POST /api/v1/admin/settings/whatsapp
// @access  Private (Admin)
export const addWhatsAppGroup = async (req, res, next) => {
  try {
    const { name, url, active = true, order = 0 } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: "Group name and WhatsApp URL are required",
      });
    }

    let settings = await EventSettings.findOne();
    if (!settings) settings = new EventSettings({});

    settings.whatsappGroups.push({
      name: name.trim(),
      url: url.trim(),
      active: Boolean(active),
      order: Number(order) || 0,
    });

    await settings.save();

    res.status(201).json({
      success: true,
      message: "WhatsApp group added successfully",
      whatsappGroups: settings.whatsappGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update WhatsApp Group
// @route   PATCH /api/v1/admin/settings/whatsapp/:id
// @access  Private (Admin)
export const updateWhatsAppGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, active, order } = req.body;

    const settings = await EventSettings.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }

    const group = settings.whatsappGroups.id(id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "WhatsApp group not found" });
    }

    if (name !== undefined) group.name = name.trim();
    if (url !== undefined) group.url = url.trim();
    if (active !== undefined) group.active = Boolean(active);
    if (order !== undefined) group.order = Number(order);

    await settings.save();

    res.status(200).json({
      success: true,
      message: "WhatsApp group updated successfully",
      whatsappGroups: settings.whatsappGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete WhatsApp Group
// @route   DELETE /api/v1/admin/settings/whatsapp/:id
// @access  Private (Admin)
export const deleteWhatsAppGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    const settings = await EventSettings.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }

    settings.whatsappGroups = settings.whatsappGroups.filter(
      (g) => g._id.toString() !== id,
    );

    await settings.save();

    res.status(200).json({
      success: true,
      message: "WhatsApp group deleted successfully",
      whatsappGroups: settings.whatsappGroups,
    });
  } catch (error) {
    next(error);
  }
};
