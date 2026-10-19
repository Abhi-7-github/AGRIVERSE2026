import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";

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

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, can restrict in strict prod
    },
    credentials: true,
  }),
);

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
      `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
    console.log(`📡 API URL: http://localhost:${PORT}/api/v1`);
    console.log(`=============================================`);
  });
}

export { app, server };
export default app;
