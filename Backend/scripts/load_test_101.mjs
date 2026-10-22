import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Registration from "../models/Registration.js";
import EventSettings from "../models/EventSettings.js";
import { connectDB } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

// CLI argument parsing
const args = process.argv.slice(2);
let targetUrl = process.env.TARGET_URL || "https://agriverse2026.onrender.com";
let count = 101;
let autoClean = false; // Preserves registrations in MongoDB by default so user can inspect them
let runTwoPhase = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if ((arg === "--url" || arg === "-u") && args[i + 1]) {
    targetUrl = args[++i];
  } else if (arg === "--local") {
    targetUrl = "http://localhost:5050";
  } else if (arg === "--render") {
    targetUrl = "https://agriverse2026.onrender.com";
  } else if ((arg === "--count" || arg === "-n") && args[i + 1]) {
    const parsed = parseInt(args[++i], 10);
    if (!isNaN(parsed) && parsed > 0) count = parsed;
  } else if (arg === "--clean" || arg === "-c" || arg === "--cleanup") {
    autoClean = true;
  } else if (arg === "--no-clean") {
    autoClean = false;
  } else if (arg === "--two-phase" || arg === "--verify-all") {
    runTwoPhase = true;
  } else if (!isNaN(Number(arg)) && Number(arg) > 0) {
    count = parseInt(arg, 10);
  }
}

// Normalize base URL
const cleanTarget = targetUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
const API_BASE = `${cleanTarget}/api/v1`;
const ROOT_URL = cleanTarget;

function createPayload(index, batchId) {
  const uniqueId = String(index).padStart(4, "0");
  const randomSalt = crypto.randomBytes(3).toString("hex").toUpperCase();
  return {
    fullName: `LoadTest Student ${index}`,
    registerNumber: `T101_${batchId}_${uniqueId}_${randomSalt}`,
    email: `loadtest_${batchId.toLowerCase()}_${uniqueId}@agriverse.test`,
    phone: `98${String(10000000 + index).slice(-8)}`,
    department: index % 2 === 0 ? "Computer Science and Engineering" : "Information Technology",
    section: index % 2 === 0 ? "A" : "B",
    year: "3rd Year",
    gender: index % 3 === 0 ? "Female" : "Male",
    residency: index % 2 === 0 ? "Hosteler" : "Dayscholar",
  };
}

async function fetchEventStatus() {
  try {
    const res = await fetch(`${API_BASE}/event/status`);
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

async function executeConcurrentBatch(batchCount, batchLabel) {
  const batchId = `LT_${Date.now().toString(36).toUpperCase()}`;
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`🧪 EXECUTING: ${batchLabel} (${batchCount} SIMULTANEOUS REQUESTS)`);
  console.log(`----------------------------------------------------------------------`);

  const initialStatus = await fetchEventStatus();
  console.log(`  📊 Pre-run Status: Open=${initialStatus.isOpen ? "🟢" : "🔴"} | Count=${initialStatus.registeredCount ?? "?"} | Limit=${initialStatus.limit ?? "Unlimited"} | Remaining=${initialStatus.remainingSlots ?? "?"}`);

  const payloads = Array.from({ length: batchCount }, (_, i) => createPayload(i + 1, batchId));
  const registerNumbers = payloads.map((p) => p.registerNumber);

  const t0 = performance.now();
  const results = await Promise.all(
    payloads.map(async (payload, idx) => {
      const startReq = performance.now();
      try {
        const headers = {
          "Content-Type": "application/json",
        };
        if (process.env.LOAD_TEST_BYPASS_TOKEN) {
          headers["x-load-test-bypass-token"] = process.env.LOAD_TEST_BYPASS_TOKEN;
        }

        const res = await fetch(`${API_BASE}/registrations/register`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const elapsed = performance.now() - startReq;
        const data = await res.json().catch(() => ({}));
        return {
          index: idx + 1,
          status: res.status,
          ok: res.ok,
          elapsed,
          message: data.message || "",
          registrationId: data.registration?.registrationId || null,
        };
      } catch (err) {
        const elapsed = performance.now() - startReq;
        return {
          index: idx + 1,
          status: 0,
          ok: false,
          elapsed,
          error: err.message,
        };
      }
    }),
  );

  const totalTime = performance.now() - t0;
  const totalSeconds = totalTime / 1000;

  const successful = results.filter((r) => r.status === 201);
  const capacityBlocked = results.filter((r) => r.status === 403);
  const duplicates = results.filter((r) => r.status === 409);
  const rateLimited = results.filter((r) => r.status === 429);
  const serverErrors = results.filter((r) => r.status >= 500);
  const networkErrors = results.filter((r) => r.status === 0);

  const latencies = results.map((r) => r.elapsed).sort((a, b) => a - b);
  const minLatency = latencies[0]?.toFixed(0) || 0;
  const maxLatency = latencies[latencies.length - 1]?.toFixed(0) || 0;
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
  const medianLatency = latencies[Math.floor(latencies.length / 2)]?.toFixed(0) || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(0) || 0;

  const postStatus = await fetchEventStatus();

  console.log(`  ⏱️  Duration: ${totalSeconds.toFixed(2)}s | Throughput: ${(batchCount / totalSeconds).toFixed(1)} req/s`);
  console.log(`  📈 Latency (Min/Avg/Median/P95/Max): ${minLatency}ms / ${avgLatency}ms / ${medianLatency}ms / ${p95Latency}ms / ${maxLatency}ms`);
  console.log(`  📋 Response Breakdown:`);
  console.log(`     • HTTP 201 (Created)         : ${successful.length} ${successful.length > 0 ? "✅" : ""}`);
  console.log(`     • HTTP 403 (Capacity Blocked): ${capacityBlocked.length} ${capacityBlocked.length > 0 ? "🔒 (Capacity Gate Reached)" : ""}`);
  console.log(`     • HTTP 429 (Rate Throttled)  : ${rateLimited.length} ${rateLimited.length > 0 ? "⚠️" : "✅"}`);
  console.log(`     • HTTP 409 (Key Collisions)  : ${duplicates.length} ${duplicates.length > 0 ? "⚠️" : "✅"}`);
  console.log(`     • HTTP 5xx / Net Errors      : ${serverErrors.length + networkErrors.length} ${serverErrors.length + networkErrors.length > 0 ? "❌" : "✅"}`);
  console.log(`  📊 Post-run Status: Registered=${postStatus.registeredCount ?? "?"} | Limit=${postStatus.limit ?? "?"} | Remaining=${postStatus.remainingSlots ?? "?"} | Open=${postStatus.isOpen ? "🟢" : "🔴"}`);

  return {
    results,
    successful,
    capacityBlocked,
    rateLimited,
    duplicates,
    serverErrors,
    networkErrors,
    registerNumbers,
    durationSeconds: totalSeconds,
    avgLatency,
  };
}

async function main() {
  console.log(`\n======================================================================`);
  console.log(`🚀 AGRIVERSE 2026 - ADVANCED CONCURRENCY & CAPACITY VALIDATOR`);
  console.log(`======================================================================`);
  console.log(` Target Server : ${ROOT_URL}`);
  console.log(` Endpoints     : ${API_BASE}/registrations/register`);
  console.log(` Bypass Token  : ${process.env.LOAD_TEST_BYPASS_TOKEN ? "Configured (Secure)" : "None (Using standard rate-limiter window)"}`);
  console.log(` Two-Phase Test: ${runTwoPhase ? "Enabled (Validates both High & Constrained Capacity)" : "Standard (Single 101-run)"}`);
  console.log(` Clean At End  : ${autoClean ? "Yes (Preserves production DB cleanliness)" : "No"}`);
  console.log(`======================================================================\n`);

  await connectDB();
  const originalSettings = await EventSettings.findOne().lean();
  const baselineDocs = await Registration.find().lean();
  const baselineCount = baselineDocs.length;

  try {
    if (runTwoPhase) {
      // ----------------------------------------------------------------
      // PHASE 1: Capacity High Enough (Limit 150) -> All 101 Must Pass
      // ----------------------------------------------------------------
      console.log(`\n🎯 PHASE 1: CAPACITY HIGHER THAN CONCURRENT BATCH (Limit: 150)`);
      console.log(`Goal: Verify all 101 concurrent requests succeed without any 429 or 403 errors.`);
      await EventSettings.updateOne({}, { $set: { registrationLimit: 150, registrationOpen: true } });

      const phase1 = await executeConcurrentBatch(101, "Phase 1 - High Capacity (Limit: 150)");
      if (phase1.rateLimited.length > 0) {
        console.error(`❌ Phase 1 FAILED: ${phase1.rateLimited.length} requests were throttled by rate limiting.`);
      } else if (phase1.successful.length === 101) {
        console.log(`✅ Phase 1 PASSED: Exactly 101 of 101 requests admitted successfully.`);
      }

      // Cleanup Phase 1 test records
      if (autoClean) {
        await Registration.deleteMany({ registerNumber: { $in: phase1.registerNumbers } });
        const postP1Count = await Registration.countDocuments();
        await EventSettings.updateOne({}, { $set: { currentRegistrations: postP1Count } });
      }

      // ----------------------------------------------------------------
      // PHASE 2: Capacity Strictly Lower Than Batch (Limit: 50) -> Exactly 50 Admitted, 51 Blocked
      // ----------------------------------------------------------------
      console.log(`\n🎯 PHASE 2: STRICT CAPACITY LOCKDOWN UNDER HIGH CONCURRENCY (Limit: 50)`);
      console.log(`Goal: Verify that under 101 simultaneous requests, exactly 50 succeed, 51 are locked out, and DB count never exceeds 50.`);
      await EventSettings.updateOne({}, { $set: { registrationLimit: 50, registrationOpen: true, currentRegistrations: 0 } });
      await Registration.deleteMany({}); // Temporary clean for pure mathematical validation

      const phase2 = await executeConcurrentBatch(101, "Phase 2 - Constrained Capacity (Limit: 50)");
      const dbAfterPhase2 = await Registration.countDocuments();

      if (phase2.successful.length === 50 && phase2.capacityBlocked.length === 51 && dbAfterPhase2 === 50) {
        console.log(`\n🏆 Phase 2 PASSED: Flawless Atomic Capacity Enforcement!`);
        console.log(`   • Exactly 50 admitted (201 Created)`);
        console.log(`   • Exactly 51 capacity-blocked (403 Forbidden)`);
        console.log(`   • DB document count = ${dbAfterPhase2} (Never exceeded limit of 50)`);
      } else {
        console.error(`❌ Phase 2 Capacity Gate Mismatch: Admitted=${phase2.successful.length}, Blocked=${phase2.capacityBlocked.length}, DB Count=${dbAfterPhase2}`);
      }

      // Cleanup Phase 2 test records
      await Registration.deleteMany({});
    } else {
      // ----------------------------------------------------------------
      // STANDARD 101-REQUEST RUN AGAINST TARGET
      // ----------------------------------------------------------------
      const run = await executeConcurrentBatch(count, `Standard Concurrency Run (${count} Simultaneous Requests)`);

      if (autoClean && run.successful.length > 0) {
        console.log(`\n🧹 Auto-cleaning ${run.successful.length} test records from database...`);
        const del = await Registration.deleteMany({ registerNumber: { $in: run.registerNumbers } });
        const currentTotal = await Registration.countDocuments();
        await EventSettings.updateOne({}, { $set: { currentRegistrations: currentTotal } });
        console.log(`✅ Cleaned up ${del.deletedCount} test records. Database safely restored to ${currentTotal} records.`);
      } else if (run.successful.length > 0) {
        const totalSaved = await Registration.countDocuments();
        console.log(`\n💾 SUCCESS: ${run.successful.length} registrations were PERMANENTLY SAVED in MongoDB Atlas!`);
        console.log(`   Total registered participants in database: ${totalSaved}`);
        console.log(`   You can now view all records in your Admin Dashboard (/admin/registrations) or MongoDB Atlas.`);
      }
    }
  } finally {
    // Restore pre-existing baseline registrations if any were removed
    if (baselineDocs && baselineDocs.length > 0) {
      const currentIds = (await Registration.find({}, { _id: 1 }).lean()).map((d) => String(d._id));
      const missing = baselineDocs.filter((d) => !currentIds.includes(String(d._id)));
      if (missing.length > 0) {
        await Registration.insertMany(missing).catch(() => {});
      }
    }

    // Synchronize event settings counter with total confirmed documents
    const finalCount = await Registration.countDocuments();
    const limit = originalSettings?.registrationLimit || 100;
    await EventSettings.updateOne(
      {},
      {
        $set: {
          registrationLimit: limit,
          registrationOpen: finalCount < limit,
          currentRegistrations: finalCount,
        },
      },
    );
    console.log(`\n📊 Live Database Status: ${finalCount} records saved in MongoDB | Event Capacity: ${limit} | Status: ${finalCount < limit ? "🟢 OPEN" : "🔴 CLOSED"}`);
    await mongoose.disconnect();
  }

  console.log(`\n======================================================================`);
  console.log(`🏁 LOAD TEST & CONCURRENCY VALIDATION COMPLETE`);
  console.log(`======================================================================\n`);
}

main().catch((err) => {
  console.error("Fatal Error in Load Test Suite:", err);
  process.exit(1);
});
