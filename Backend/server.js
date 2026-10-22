import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { seedInitialData } from "./services/seeder.js";
import { errorHandler } from "./middleware/errorHandler.js";

import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Start database work asynchronously
connectDB()
  .then(() => seedInitialData())
  .catch((err) => {
    console.warn("[MongoDB Startup Note]:", err.message);
  });

const app = express();

// Enable reverse proxy support for Render / Cloudflare client IP resolution
app.set("trust proxy", 1);

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const configuredClients = (process.env.CLIENT_URL || "")
  .split(",")
  .map((u) => u.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredClients,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check explicit allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any localhost/127.0.0.1 port
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Allow standard frontend deployments on Vercel, Netlify, and Render
      if (/^https:\/\/[\w.-]+\.(vercel\.app|netlify\.app|onrender\.com)$/.test(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS policy does not allow access from origin: ${origin}`),
      );
    },
    credentials: true,
  }),
);

// Secure timing-safe test-bypass validator for high-concurrency load testing
const isSecureLoadTestBypass = (req) => {
  const secretToken = process.env.LOAD_TEST_BYPASS_TOKEN;
  // Require explicit high-entropy token of at least 16 chars; fails safe in prod if unset
  if (!secretToken || typeof secretToken !== "string" || secretToken.trim().length < 16) {
    return false;
  }
  const clientToken =
    req.headers["x-load-test-bypass-token"] ||
    req.headers["x-test-bypass-token"];
  if (!clientToken || typeof clientToken !== "string") {
    return false;
  }
  const secretBuf = Buffer.from(secretToken.trim());
  const clientBuf = Buffer.from(clientToken.trim());
  if (secretBuf.length !== clientBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(secretBuf, clientBuf);
};

// General and route-specific Rate Limiting to prevent DoS & brute-force attacks
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isSecureLoadTestBypass(req) || process.env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 15 minutes.",
  },
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isSecureLoadTestBypass(req) || process.env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many registration attempts from this IP, please try again later.",
  },
});

app.use("/api", generalApiLimiter);
app.use("/api/v1/auth/admin/login", authLimiter);
app.use("/api/v1/registrations/register", registrationLimiter);
app.use("/api/v1/registrations/create", registrationLimiter);
app.use("/api/v1/registrations/payment", registrationLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve local upload static files
const uploadsDir = process.env.VERCEL
  ? path.resolve("/tmp/uploads")
  : path.resolve("public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// API Health check with DB status
app.get("/api/health", (req, res) => {
  const readyStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbStatus = readyStates[mongoose.connection.readyState] || "unknown";

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Event Registration & Payment Verification API",
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1,
      hasMongoUri: Boolean(process.env.MONGODB_URI),
    },
  });
});

// Middleware to ensure DB connection is ready before servicing API requests
app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
      detail: err.message,
      troubleshoot: !process.env.MONGODB_URI
        ? "MONGODB_URI environment variable is missing on Vercel."
        : "Check MongoDB Atlas Network Access: add 0.0.0.0/0 to allow serverless IP access.",
    });
  }
});

// Mount Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/event", eventRoutes);
app.use("/api/v1/registrations", registrationRoutes);
app.use("/api/v1/admin", adminRoutes);

// Fallback 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`,
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server = null;

if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
    console.log(`=============================================`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌ [Port Conflict]: Port ${PORT} is already in use by another running instance. Please close the other process or select a different PORT in .env.`,
      );
    } else {
      console.error("\n❌ [Server Error]:", err.message);
    }
  });
}

export { app, server };
export default app;
