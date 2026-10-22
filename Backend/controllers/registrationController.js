import crypto from "crypto";
import Registration from "../models/Registration.js";
import EventSettings from "../models/EventSettings.js";
import { uploadBufferToStorage } from "../config/cloudinary.js";

// Helper to use Register Number directly as the primary unique registration ID
const generateRegistrationId = (regNo) => {
  return regNo ? regNo.trim().toUpperCase() : "";
};

// @desc    Pre-check availability of register number, email, and transaction ID
// @route   POST /api/v1/registrations/check
// @access  Public
export const checkAvailability = async (req, res, next) => {
  try {
    const { registerNumber, email, transactionId } = req.body;
    const errors = {};

    // 1. Check Register Number
    if (registerNumber && typeof registerNumber === "string") {
      const cleanRegNo = registerNumber.trim().toUpperCase();
      if (cleanRegNo.length >= 2) {
        const existingReg = await Registration.findOne({
          registerNumber: cleanRegNo,
        });
        if (existingReg) {
          errors.registerNumber = "This Register Number is already registered.";
        }
      }
    }

    // 2. Check Email
    if (email && typeof email === "string") {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail.length >= 4) {
        const existingReg = await Registration.findOne({ email: cleanEmail });
        if (existingReg) {
          errors.email = "This academic email is already registered.";
        }
      }
    }

    // 3. Check Transaction ID
    if (transactionId && typeof transactionId === "string") {
      const cleanTxn = transactionId.trim().toUpperCase();
      const existingTxn = await Registration.findOne({
        transactionId: cleanTxn,
      });
      if (existingTxn) {
        errors.transactionId =
          "This Transaction ID has already been submitted.";
      }
    }

    const hasErrors = Object.keys(errors).length > 0;
    res.status(200).json({
      success: !hasErrors,
      available: !hasErrors,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

// Cached event settings with short TTL
let cachedSettings = null;
let cachedSettingsTime = 0;
export const getCachedEventSettings = async (force = false) => {
  const now = Date.now();
  if (!cachedSettings || force || now - cachedSettingsTime > 3000) {
    cachedSettings = await EventSettings.findOne().lean();
    cachedSettingsTime = now;
  }
  return cachedSettings;
};

// In-memory mutex lock for in-flight register numbers to prevent concurrency race conditions
const activeRegistrationLocks = new Set();

// @desc    Submit new solo participant registration (paymentStatus = UNPAID, verificationStatus = PENDING)
// @route   POST /api/v1/registrations/register or /create
// @access  Public
export const createRegistration = async (req, res, next) => {
  let slotClaimed = false;
  let lockKey = null;
  try {
    const {
      fullName,
      registerNumber,
      email,
      phone,
      department,
      section,
      year,
      gender,
      residency,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      { name: "fullName", label: "Full name" },
      { name: "registerNumber", label: "Register / Roll number" },
      { name: "department", label: "Department" },
      { name: "section", label: "Section" },
      { name: "year", label: "Academic year" },
      { name: "gender", label: "Gender" },
      { name: "residency", label: "Residency (Hosteler / Dayscholar)" },
    ];

    for (const f of requiredFields) {
      if (!req.body[f.name] || String(req.body[f.name]).trim() === "") {
        return res.status(400).json({
          success: false,
          message: `${f.label} is required.`,
        });
      }
    }

    const cleanRegNo = String(registerNumber).trim().toUpperCase();
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const cleanFullName = String(fullName).trim();
    const cleanPhone = phone && String(phone).trim() ? String(phone).trim() : "N/A";
    const cleanDept = String(department).trim();
    const cleanSection = String(section).trim().toUpperCase();
    const cleanYear = String(year).trim();
    const cleanGender = String(gender).trim();
    const cleanResidency = (residency || "Dayscholar").trim();

    // Acquire concurrency lock on Register Number
    if (activeRegistrationLocks.has(cleanRegNo)) {
      return res.status(409).json({
        success: false,
        message: "Registration for this Register Number is already in progress. Please wait a moment.",
      });
    }
    activeRegistrationLocks.add(cleanRegNo);
    lockKey = cleanRegNo;

    // 1. Fast Single-Query Duplicate Check on Register Number
    const existing = await Registration.findOne({
      registerNumber: cleanRegNo,
    }).lean();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This Register Number is already registered.",
      });
    }

    // 2. Atomic Capacity & Status Gate in MongoDB
    const claimedSettings = await EventSettings.findOneAndUpdate(
      {
        registrationOpen: true,
        $or: [
          { registrationLimit: { $exists: false } },
          { registrationLimit: null },
          { registrationLimit: 0 },
          {
            $expr: {
              $lt: [
                { $ifNull: ["$currentRegistrations", 0] },
                "$registrationLimit",
              ],
            },
          },
        ],
      },
      { $inc: { currentRegistrations: 1 } },
      { new: true },
    );

    if (!claimedSettings) {
      const currentSettings = await EventSettings.findOne().lean();
      if (!currentSettings || !currentSettings.registrationOpen) {
        return res.status(403).json({
          success: false,
          message: "Registrations are currently closed by the administrator.",
        });
      }
      return res.status(403).json({
        success: false,
        message: `Registration limit of ${currentSettings.registrationLimit} participants has been reached.`,
      });
    }
    slotClaimed = true;

    // 3. Persist Registration Document
    const registrationId = cleanRegNo;
    const newRegistration = new Registration({
      registrationId,
      fullName: cleanFullName,
      registerNumber: cleanRegNo,
      email: cleanEmail,
      phone: cleanPhone,
      department: cleanDept,
      section: cleanSection,
      year: cleanYear,
      gender: cleanGender,
      residency: cleanResidency,
      registrationStatus: "registered",
      paymentStatus: "UNPAID",
      verificationStatus: "PENDING",
      registeredAt: new Date(),
    });

    await newRegistration.save();

    // Active WhatsApp Groups
    const activeWhatsAppGroups = (claimedSettings.whatsappGroups || [])
      .filter((g) => g.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((g) => ({
        name: g.name,
        url: g.url,
      }));

    return res.status(201).json({
      success: true,
      message:
        "Registration completed successfully! Your payment is unpaid and verification is pending.",
      registration: {
        registrationId: newRegistration.registrationId,
        fullName: newRegistration.fullName,
        registerNumber: newRegistration.registerNumber,
        email: newRegistration.email,
        phone: newRegistration.phone,
        department: newRegistration.department,
        section: newRegistration.section,
        year: newRegistration.year,
        gender: newRegistration.gender,
        residency: newRegistration.residency,
        registrationStatus: newRegistration.registrationStatus,
        paymentStatus: newRegistration.paymentStatus,
        verificationStatus: newRegistration.verificationStatus,
        registeredAt: newRegistration.registeredAt,
      },
      event: {
        registrationFee: claimedSettings.registrationFee || 0,
        qrCode: claimedSettings.qrCode?.url ? claimedSettings.qrCode : null,
        qrCodes: (claimedSettings.qrCodes || [])
          .filter((q) => q.active !== false && q.url)
          .map((q) => ({
            id: q._id ? String(q._id) : undefined,
            title: q.title || "UPI QR Code",
            url: q.url,
            upiId: q.upiId || "",
            active: q.active !== false,
          })),
      },
      whatsappGroups: activeWhatsAppGroups,
    });
  } catch (error) {
    if (slotClaimed) {
      await EventSettings.updateOne(
        { currentRegistrations: { $gt: 0 } },
        { $inc: { currentRegistrations: -1 } },
      ).catch(() => { });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "Field";
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }
    next(error);
  } finally {
    if (lockKey) {
      activeRegistrationLocks.delete(lockKey);
    }
  }
};

// @desc    Submit payment for a registered participant (immediate or via /team-payment)
// @route   POST /api/v1/registrations/payment
// @access  Public
export const submitPayment = async (req, res, next) => {
  try {
    const { registerNumber, registrationId, identifier, transactionId } =
      req.body;

    const lookupKey = (
      registerNumber ||
      identifier ||
      registrationId ||
      ""
    ).trim();
    if (!lookupKey) {
      return res.status(400).json({
        success: false,
        message: "Register number or Registration ID is required.",
      });
    }

    // Find participant by registerNumber or registrationId or email
    const cleanKey = lookupKey.toUpperCase();
    const reg = await Registration.findOne({
      $or: [
        { registerNumber: cleanKey },
        { registrationId: cleanKey },
        { email: lookupKey.toLowerCase() },
      ],
    });

    if (!reg) {
      return res.status(404).json({
        success: false,
        message:
          "Participant not found. Please enter the exact Register Number used during registration.",
      });
    }

    // Check if already paid
    const currentStatus = String(reg.paymentStatus || "").toLowerCase();
    if (currentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message:
          "This participant has already completed payment. No further payment required.",
        registration: {
          registrationId: reg.registrationId,
          fullName: reg.fullName,
          registerNumber: reg.registerNumber,
          paymentStatus: reg.paymentStatus,
          verificationStatus: reg.verificationStatus,
          transactionId: reg.transactionId,
          paymentDate: reg.paymentDate,
        },
      });
    }

    // Validate Transaction ID
    if (
      !transactionId ||
      typeof transactionId !== "string" ||
      transactionId.trim().length < 4
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid Transaction ID / Reference Number is required.",
      });
    }

    const cleanTxnId = transactionId.trim().toUpperCase();
    const existingTxn = await Registration.findOne({
      transactionId: cleanTxnId,
      _id: { $ne: reg._id },
    });

    if (existingTxn) {
      return res.status(409).json({
        success: false,
        message:
          "This Transaction ID has already been submitted by another participant.",
      });
    }

    // Validate Screenshot
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message:
          "Payment screenshot proof is required. Please upload your payment receipt.",
      });
    }

    // Upload Screenshot to Cloudinary/Storage
    let uploadedScreenshot;
    try {
      uploadedScreenshot = await uploadBufferToStorage(
        req.file.buffer,
        "payment_screenshots",
        `${reg.registerNumber}_${Date.now()}`,
      );
    } catch (uploadError) {
      console.error("[Upload Error]:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload payment screenshot. Please try again.",
      });
    }

    // Update existing registration record
    reg.paymentStatus = "PAID";
    reg.verificationStatus = "PENDING";
    reg.transactionId = cleanTxnId;
    reg.paymentScreenshot = {
      url: uploadedScreenshot.url,
      publicId: uploadedScreenshot.publicId,
    };
    reg.paymentDate = new Date();

    await reg.save();

    const settings = await EventSettings.findOne();
    const activeWhatsAppGroups = (settings?.whatsappGroups || [])
      .filter((g) => g.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((g) => ({
        name: g.name,
        url: g.url,
      }));

    res.status(200).json({
      success: true,
      message:
        "Payment submitted successfully! Your payment is paid and verification is pending.",
      registration: {
        registrationId: reg.registrationId,
        fullName: reg.fullName,
        registerNumber: reg.registerNumber,
        email: reg.email,
        phone: reg.phone,
        department: reg.department,
        section: reg.section,
        year: reg.year,
        gender: reg.gender,
        registrationStatus: reg.registrationStatus,
        paymentStatus: reg.paymentStatus,
        verificationStatus: reg.verificationStatus,
        transactionId: reg.transactionId,
        paymentDate: reg.paymentDate,
        registeredAt: reg.registeredAt,
      },
      whatsappGroups: activeWhatsAppGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup registered participant by exact register number (used by /team-payment / missed-payment)
// @route   POST /api/v1/registrations/lookup-team or /lookup-participant
// @access  Public
export const lookupTeam = async (req, res, next) => {
  try {
    const { registerNumber, identifier, teamName } = req.body;
    const lookupKey = (registerNumber || identifier || teamName || "").trim();

    if (!lookupKey || lookupKey.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Register / Roll Number.",
      });
    }

    const cleanKey = lookupKey.toUpperCase();
    const reg = await Registration.findOne({
      $or: [
        { registerNumber: cleanKey },
        { registrationId: cleanKey },
        { email: lookupKey.toLowerCase() },
      ],
    });

    if (!reg) {
      return res.status(404).json({
        success: false,
        message:
          "Participant not found. Please enter the exact Register Number used during registration.",
      });
    }

    const settings = await EventSettings.findOne();
    const activeWhatsAppGroups = (settings?.whatsappGroups || [])
      .filter((g) => g.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((g) => ({
        name: g.name,
        url: g.url,
      }));

    res.status(200).json({
      success: true,
      participant: {
        registrationId: reg.registrationId,
        fullName: reg.fullName,
        registerNumber: reg.registerNumber,
        email: reg.email,
        phone: reg.phone,
        department: reg.department,
        section: reg.section,
        year: reg.year,
        gender: reg.gender,
        residency: reg.residency || "Dayscholar",
        registrationStatus: reg.registrationStatus || "registered",
        paymentStatus: reg.paymentStatus,
        verificationStatus: reg.verificationStatus || "PENDING",
        transactionId: reg.transactionId || null,
        paymentDate: reg.paymentDate || null,
        registeredAt: reg.registeredAt,
      },
      // Backward compatibility alias for team field
      team: {
        registrationId: reg.registrationId,
        teamName: reg.fullName,
        fullName: reg.fullName,
        registerNumber: reg.registerNumber,
        email: reg.email,
        department: reg.department,
        section: reg.section,
        year: reg.year,
        gender: reg.gender,
        residency: reg.residency || "Dayscholar",
        registrationStatus: reg.registrationStatus || "registered",
        paymentStatus: reg.paymentStatus,
        verificationStatus: reg.verificationStatus || "PENDING",
        transactionId: reg.transactionId || null,
        paymentDate: reg.paymentDate || null,
        registeredAt: reg.registeredAt,
      },
      event: {
        registrationFee: settings?.registrationFee || 0,
        qrCode: settings?.qrCode?.url ? settings.qrCode : null,
        qrCodes: (settings?.qrCodes || [])
          .filter((q) => q.active !== false && q.url)
          .map((q) => ({
            id: q._id ? String(q._id) : undefined,
            title: q.title || "UPI QR Code",
            url: q.url,
            upiId: q.upiId || "",
            active: q.active !== false,
          })),
      },
      whatsappGroups: activeWhatsAppGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registration status for student lookup
// @route   GET /api/v1/registrations/status/:registrationId
// @access  Public
export const getRegistrationStatus = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res
        .status(400)
        .json({ success: false, message: "Registration ID is required" });
    }

    const reg = await Registration.findOne({
      registrationId: registrationId.trim().toUpperCase(),
    });

    if (!reg) {
      return res.status(404).json({
        success: false,
        message:
          "No registration found with this Registration ID. Please check and try again.",
      });
    }

    const settings = await EventSettings.findOne();
    const activeWhatsAppGroups = (settings?.whatsappGroups || [])
      .filter((g) => g.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((g) => ({
        name: g.name,
        url: g.url,
      }));

    res.status(200).json({
      success: true,
      registration: {
        registrationId: reg.registrationId,
        fullName: reg.fullName,
        registerNumber: reg.registerNumber,
        email: reg.email,
        phone: reg.phone,
        department: reg.department,
        section: reg.section,
        year: reg.year,
        gender: reg.gender,
        residency: reg.residency || "Dayscholar",
        registrationStatus: reg.registrationStatus || "registered",
        transactionId: reg.transactionId,
        paymentStatus: reg.paymentStatus,
        verificationStatus: reg.verificationStatus || "PENDING",
        paymentDate: reg.paymentDate,
        rejectionReason: reg.rejectionReason,
        registeredAt: reg.registeredAt,
        verifiedAt: reg.verifiedAt,
      },
      whatsappGroups: activeWhatsAppGroups,
    });
  } catch (error) {
    next(error);
  }
};
