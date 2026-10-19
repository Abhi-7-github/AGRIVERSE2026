import express from "express";
import {
  checkAvailability,
  createRegistration,
  submitPayment,
  lookupTeam,
  getRegistrationStatus,
} from "../controllers/registrationController.js";
import { checkRegistrationStatus } from "../controllers/eventController.js";
import { upload, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Public check for registration availability before registering
router.get("/check-status", checkRegistrationStatus);

// Availability pre-check (team name, register numbers, emails, txn)
router.post("/check", checkAvailability);

// Create registration (creates record with paymentStatus = 'UNPAID' and verificationStatus = 'PENDING')
router.post("/register", createRegistration);
router.post("/create", createRegistration);

// Submit payment with screenshot upload (updates paymentStatus to 'PAID' and resets verificationStatus to 'PENDING')
router.post(
  "/payment",
  upload.single("paymentScreenshot"),
  handleUploadError,
  submitPayment,
);

// Lookup team by exact team name for /team-payment
router.post("/lookup-team", lookupTeam);

// Public student status lookup by registration ID
router.get("/status/:registrationId", getRegistrationStatus);

export default router;
