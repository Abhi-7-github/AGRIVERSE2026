import express from "express";
import {
  getDashboardStats,
  getRegistrations,
  getRegistrationById,
  getStudents,
  createStudent,
  updateStudent,
  verifyPayment,
  rejectPayment,
  updateRegistrationStatus,
  exportRegistrationsExcel,
  getAdminSettings,
  updateAdminSettings,
  uploadQRCode,
  deleteQRCode,
  toggleQRCode,
  addWhatsAppGroup,
  updateWhatsAppGroup,
  deleteWhatsAppGroup,
} from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/auth.js";
import { upload, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// All admin routes require authentication
router.use(protectAdmin);

// Dashboard & Registrations
router.get("/dashboard", getDashboardStats);
router.get("/registrations", getRegistrations);
router.get("/registrations/:id", getRegistrationById);
router.get("/students", getStudents);
router.post("/students", createStudent);
router.patch("/students/:id", updateStudent);
router.patch("/registrations/:id/verify", verifyPayment);
router.patch("/registrations/:id/reject", rejectPayment);
router.patch("/registrations/:id/status", updateRegistrationStatus);

// Excel Export
router.get("/export/excel", exportRegistrationsExcel);

// Event Settings & QR code
router.get("/settings", getAdminSettings);
router.patch("/settings", updateAdminSettings);
router.post(
  "/settings/qr",
  upload.array("qrCode", 10),
  handleUploadError,
  uploadQRCode,
);
router.patch("/settings/qr/:id", toggleQRCode);
router.delete("/settings/qr/:id?", deleteQRCode);

// WhatsApp groups
router.post("/settings/whatsapp", addWhatsAppGroup);
router.patch("/settings/whatsapp/:id", updateWhatsAppGroup);
router.delete("/settings/whatsapp/:id", deleteWhatsAppGroup);

export default router;
