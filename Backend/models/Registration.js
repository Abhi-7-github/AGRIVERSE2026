import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Solo Participant Details
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    registerNumber: {
      type: String,
      required: [true, "Register number is required"],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    residency: {
      type: String,
      required: [true, "Residency status is required"],
      enum: ["Hosteler", "Dayscholar", "Hosteller", "Day Scholar"],
      default: "Dayscholar",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      default: "N/A",
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
    },
    year: {
      type: String,
      required: [true, "Year is required"],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },

    // Registration, payment, and verification states
    registrationStatus: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    paymentScreenshot: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "unpaid", "paid"],
      default: "UNPAID",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: [
        "PENDING",
        "VERIFIED",
        "REJECTED",
        "pending",
        "verified",
        "rejected",
      ],
      default: "PENDING",
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Normalize records created before payment and verification were separated.
RegistrationSchema.pre("validate", function normalizeLegacyStatuses(next) {
  const legacyStatus = String(this.paymentStatus || "").toUpperCase();
  const legacyVerificationStatuses = ["PENDING", "VERIFIED", "REJECTED"];

  if (legacyVerificationStatuses.includes(legacyStatus)) {
    if (!this.verificationStatus || this.verificationStatus === "PENDING") {
      this.verificationStatus = legacyStatus;
    }
    this.paymentStatus =
      this.transactionId || this.paymentScreenshot?.url ? "PAID" : "UNPAID";
  }

  next();
});

// Indexes for fast lookup and atomic duplicate prevention under concurrency
RegistrationSchema.index(
  { transactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionId: { $type: "string" } },
  },
);
RegistrationSchema.index({ createdAt: -1 });

export const Registration = mongoose.model("Registration", RegistrationSchema);
export default Registration;
