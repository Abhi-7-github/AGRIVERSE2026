import { Blob } from "buffer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import mongoose from "mongoose";
import crypto from "crypto";
import Registration from "../models/Registration.js";
import EventSettings from "../models/EventSettings.js";
import { connectDB } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const defaultTargets = [
  "https://agriverse2026.onrender.com",
];
let rawTargets = process.env.API_BASE || process.env.TARGET_URL || defaultTargets.join(",");
for (let i = 0; i < process.argv.length; i++) {
  if ((process.argv[i] === "--url" || process.argv[i] === "-u") && process.argv[i + 1]) {
    rawTargets = process.argv[i + 1];
    break;
  }
}

const TARGET_BASES = rawTargets
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean)
  .map((u) => {
    const root = u.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
    return `${root}/api/v1`;
  });

let targetCounter = 0;
function getNextTargetApi() {
  const t = TARGET_BASES[targetCounter % TARGET_BASES.length];
  targetCounter++;
  return t;
}

const API_BASE = TARGET_BASES[0];
const ROOT_URL = API_BASE.replace(/\/api\/v1\/?$/, "");

const dummyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

function createMockParticipant(index, prefix = "P") {
  return {
    fullName: `Researcher ${index} ${prefix}`,
    registerNumber: `R${String(index).padStart(4, "0")}${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    phone: `98${String(10000000 + index).slice(-8)}`,
    department: "Computer Science and Engineering",
    section: index % 2 === 0 ? "A" : "B",
    year: "3rd Year",
    gender: index % 3 === 0 ? "Female" : "Male",
    residency: index % 2 === 0 ? "Hosteler" : "Dayscholar",
  };
}

let totalPassed = 0;
let totalFailed = 0;

function logTestHeader(suiteName) {
  console.log(
    `\n======================================================================`,
  );
  console.log(`🧪 SUITE: ${suiteName}`);
  console.log(
    `======================================================================`,
  );
}

function assertTest(name, condition, details = "") {
  if (condition) {
    totalPassed++;
    console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ""}`);
  } else {
    totalFailed++;
    console.log(`  ❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
  }
}

async function getLiveRegistrationStatus() {
  let settings = await EventSettings.findOne().lean();
  if (!settings) {
    settings = await EventSettings.create({});
  }
  const confirmed = await Registration.countDocuments();
  const limit =
    typeof settings.registrationLimit === "number"
      ? settings.registrationLimit
      : null;
  const remaining =
    limit !== null && limit > 0 ? Math.max(0, limit - confirmed) : "Unlimited";
  const isFull = limit !== null && limit > 0 && confirmed >= limit;
  return {
    limit: limit !== null ? limit : "Unlimited",
    confirmed,
    remaining,
    isFull,
    registrationOpen: settings.registrationOpen && !isFull,
  };
}

async function displayLiveRegistrationStatus(title = "Database Status") {
  const { limit, confirmed, remaining, registrationOpen } =
    await getLiveRegistrationStatus();
  console.log(
    `  📊 [${title}] Event Limit: ${limit} | Registered: ${confirmed} | Available: ${remaining} | Status: ${registrationOpen ? "🟢 OPEN" : "🔴 CLOSED"
    }`,
  );
}

// Command-line options parsing
function parseCliArgs() {
  const args = process.argv.slice(2);
  let count = null;
  let autoConfirm = false;
  let cleanStart = null;
  let keepAtEnd = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--yes" || arg === "-y") {
      autoConfirm = true;
    } else if (arg === "--clean" || arg === "-c") {
      cleanStart = true;
    } else if (arg === "--keep" || arg === "-k") {
      keepAtEnd = true;
    } else if (arg === "--count" && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!isNaN(parsed) && parsed > 0) count = parsed;
    } else if (!isNaN(Number(arg)) && Number(arg) > 0) {
      count = parseInt(arg, 10);
    }
  }

  return { count, autoConfirm, cleanStart, keepAtEnd };
}

async function promptParticipantCount(defaultCount = 300, autoConfirm = false) {
  if (autoConfirm || !process.stdin.isTTY) {
    console.log(
      `\n⚡ Automated run: Using ${defaultCount} participants for concurrency benchmark.\n`,
    );
    return defaultCount;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `👉 How many concurrent participants do you want to benchmark? [Default: ${defaultCount}]: `,
      (answer) => {
        rl.close();
        const parsed = parseInt(answer.trim(), 10);
        if (isNaN(parsed) || parsed <= 0) {
          console.log(`Using default: ${defaultCount} participants.\n`);
          resolve(defaultCount);
        } else {
          console.log(`Configured: ${parsed} participants for benchmark.\n`);
          resolve(parsed);
        }
      },
    );
  });
}

async function promptYesNo(question, defaultVal = true, autoConfirm = false) {
  if (autoConfirm || !process.stdin.isTTY) {
    return defaultVal;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const hint = defaultVal ? "[Y/n]" : "[y/N]";
    rl.question(`${question} ${hint}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "") {
        resolve(defaultVal);
      } else if (trimmed === "y" || trimmed === "yes") {
        resolve(true);
      } else if (trimmed === "n" || trimmed === "no") {
        resolve(false);
      } else {
        resolve(defaultVal);
      }
    });
  });
}

// --------------------------------------------------------------------
// SUITE 1: System Health, Dynamic Status & DB Connection
// --------------------------------------------------------------------
async function testSystemHealth() {
  logTestHeader("1. System Health, Dynamic Status & DB Connection");

  try {
    const res = await fetch(`${ROOT_URL}/api/health`);
    const data = await res.json();
    assertTest(
      "API Health Endpoint (/api/health)",
      res.ok && data.status === "healthy",
    );
  } catch (e) {
    assertTest("API Health Endpoint (/api/health)", false, e.message);
  }

  try {
    const isConnected = mongoose.connection.readyState === 1;
    assertTest(
      "MongoDB Atlas Connection",
      isConnected,
      `Host: ${mongoose.connection.host}`,
    );
  } catch (e) {
    assertTest("MongoDB Atlas Connection", false, e.message);
  }

  // Test primary status endpoint
  try {
    const statusRes = await fetch(`${API_BASE}/event/status`);
    const statusData = await statusRes.json();
    assertTest(
      "Live Registration Status Endpoint (/api/v1/event/status)",
      statusRes.ok &&
      statusData.success === true &&
      typeof statusData.isOpen === "boolean",
      `Open: ${statusData.isOpen}, Limit: ${statusData.limit ?? "Unlimited"}, Available: ${statusData.remainingSlots ?? "Unlimited"}`,
    );
  } catch (e) {
    assertTest(
      "Live Registration Status Endpoint (/api/v1/event/status)",
      false,
      e.message,
    );
  }

  // Test alias status endpoints
  try {
    const aliasRes = await fetch(`${API_BASE}/event/registration-status`);
    const aliasData = await aliasRes.json();
    assertTest(
      "Alias Status Endpoint (/api/v1/event/registration-status)",
      aliasRes.ok &&
      aliasData.success === true &&
      typeof aliasData.isOpen === "boolean",
    );
  } catch (e) {
    assertTest(
      "Alias Status Endpoint (/api/v1/event/registration-status)",
      false,
      e.message,
    );
  }

  try {
    const regCheckRes = await fetch(`${API_BASE}/registrations/check-status`);
    const regCheckData = await regCheckRes.json();
    assertTest(
      "Registration Route Status Endpoint (/api/v1/registrations/check-status)",
      regCheckRes.ok &&
      regCheckData.success === true &&
      typeof regCheckData.isOpen === "boolean",
    );
  } catch (e) {
    assertTest(
      "Registration Route Status Endpoint (/api/v1/registrations/check-status)",
      false,
      e.message,
    );
  }

  // Test public settings endpoint
  try {
    const settingsRes = await fetch(`${API_BASE}/event/settings`);
    const settingsData = await settingsRes.json();
    assertTest(
      "Public Event Settings Endpoint (/api/v1/event/settings)",
      settingsRes.ok &&
      settingsData.success === true &&
      typeof settingsData.event?.registrationOpen === "boolean",
      `Limit: ${settingsData.event?.registrationLimit ?? "Unlimited"}`,
    );
  } catch (e) {
    assertTest(
      "Public Event Settings Endpoint (/api/v1/event/settings)",
      false,
      e.message,
    );
  }

  await displayLiveRegistrationStatus("Initial State");
}

// --------------------------------------------------------------------
// SUITE 2: Solo Participant Availability Pre-Checks
// --------------------------------------------------------------------
async function testAvailabilityChecks() {
  logTestHeader("2. Solo Participant Availability Pre-Checks");

  const uniqueRegNo = `CHK${Date.now().toString(36).toUpperCase()}`;

  const uniqueCheck = await fetch(`${API_BASE}/registrations/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registerNumber: uniqueRegNo,
    }),
  });
  const uniqueData = await uniqueCheck.json();
  assertTest(
    "Valid Unique Participant Pre-Check",
    uniqueCheck.ok && uniqueData.available === true,
  );

  // Pre-insert a participant into DB to test duplicate rejection
  const existingDoc = new Registration({
    registrationId: `REG-CHK-${Date.now()}`,
    fullName: "Duplicate Test Student",
    registerNumber: `DUP${uniqueRegNo}`,
    phone: "9876543210",
    department: "CSE",
    section: "A",
    year: "3rd Year",
    gender: "Male",
    residency: "Dayscholar",
    registrationStatus: "registered",
    paymentStatus: "UNPAID",
    verificationStatus: "PENDING",
  });
  await existingDoc.save();

  const dupCheck = await fetch(`${API_BASE}/registrations/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registerNumber: existingDoc.registerNumber,
    }),
  });
  const dupData = await dupCheck.json();
  assertTest(
    "Existing Register Number Rejection",
    dupData.available === false && Boolean(dupData.errors?.registerNumber),
  );

  await Registration.deleteOne({ _id: existingDoc._id });
}

// --------------------------------------------------------------------
// SUITE 3: Separate Payment and Verification State Lifecycle
// --------------------------------------------------------------------
async function testSoloRegistrationLifecycle() {
  logTestHeader("3. Separate Payment and Verification State Lifecycle");

  const mock = createMockParticipant(1, "Lifecycle");

  const regRes = await fetch(`${API_BASE}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mock),
  });
  const regData = await regRes.json();

  assertTest(
    "Submit Solo Registration without Payment (HTTP 201)",
    regRes.status === 201 && Boolean(regData.registration?.registrationId),
    `Reg ID: ${regData.registration?.registrationId}`,
  );

  assertTest(
    'Registration Created with paymentStatus="UNPAID" and verificationStatus="PENDING"',
    regData.registration?.paymentStatus === "UNPAID" &&
    regData.registration?.verificationStatus === "PENDING",
  );

  assertTest(
    "Solo Participant Attributes Correctly Persisted",
    regData.registration?.fullName === mock.fullName &&
    regData.registration?.registerNumber === mock.registerNumber &&
    regData.registration?.department === mock.department &&
    regData.registration?.year === mock.year &&
    regData.registration?.gender === mock.gender &&
    regData.registration?.residency === mock.residency,
  );

  // Verify duplicate registration attempt is rejected
  const dupRegRes = await fetch(`${API_BASE}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mock),
  });
  assertTest(
    "Block Duplicate Registration on Same Register Number (HTTP 409)",
    dupRegRes.status === 409,
  );

  return regData.registration;
}

// --------------------------------------------------------------------
// SUITE 4: Missed-Payment Recovery via Register Number (/team-payment)
// --------------------------------------------------------------------
async function testPaymentRecoveryFlow(registeredParticipant) {
  logTestHeader(
    "4. Missed-Payment Recovery via Register Number (/team-payment)",
  );

  // 1. Lookup Participant by Register Number
  const lookupRes = await fetch(`${API_BASE}/registrations/lookup-team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registerNumber: registeredParticipant.registerNumber,
    }),
  });
  const lookupData = await lookupRes.json();

  assertTest(
    "Lookup Participant by Register Number",
    lookupRes.ok &&
    lookupData.participant?.registerNumber ===
    registeredParticipant.registerNumber,
    `Found: ${lookupData.participant?.fullName}`,
  );

  assertTest(
    "Participant Identification Credentials Rendered Accurately",
    lookupData.participant?.fullName === registeredParticipant.fullName &&
    lookupData.participant?.department === registeredParticipant.department &&
    lookupData.participant?.year === registeredParticipant.year &&
    lookupData.participant?.gender === registeredParticipant.gender,
  );

  // 2. Submit Payment Proof (UTR + Screenshot)
  const txnId = `TXN_RECOV_${Date.now()}`;
  const formData = new FormData();
  formData.append("registerNumber", registeredParticipant.registerNumber);
  formData.append("registrationId", registeredParticipant.registrationId);
  formData.append("transactionId", txnId);
  const fileBlob = new Blob([dummyPng], { type: "image/png" });
  formData.append("paymentScreenshot", fileBlob, "receipt.png");

  const payRes = await fetch(`${API_BASE}/registrations/payment`, {
    method: "POST",
    body: formData,
  });
  const payData = await payRes.json();

  assertTest(
    'Submit Payment Proof Updates paymentStatus to "PAID" and verificationStatus to "PENDING" (HTTP 200)',
    payRes.ok &&
    payData.registration?.paymentStatus === "PAID" &&
    payData.registration?.verificationStatus === "PENDING",
    `Txn: ${payData.registration?.transactionId}`,
  );

  // 3. Re-lookup Participant (Should now indicate already paid)
  const reLookupRes = await fetch(`${API_BASE}/registrations/lookup-team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registerNumber: registeredParticipant.registerNumber,
    }),
  });
  const reLookupData = await reLookupRes.json();

  assertTest(
    'Re-lookup Reflects paymentStatus="PAID" and verificationStatus="PENDING"',
    reLookupRes.ok &&
    reLookupData.participant?.paymentStatus === "PAID" &&
    reLookupData.participant?.verificationStatus === "PENDING",
  );

  // Cleanup test record
  await Registration.deleteOne({
    registerNumber: registeredParticipant.registerNumber,
  });
}

// --------------------------------------------------------------------
// SUITE 5: Boundary Capacity Lockdown (Concurrent Race at Capacity Limit)
// --------------------------------------------------------------------
async function testRaceConditionBoundary() {
  logTestHeader(
    "5. Boundary Capacity Lockdown (Concurrent Race at Capacity Limit)",
  );

  // Read current live event settings
  const originalSettings = await EventSettings.findOne().lean();
  const currentCount = await Registration.countDocuments();

  // Dynamically set limit to exactly currentCount + 1 to test simultaneous race for the 1 remaining slot
  const testLimit = currentCount + 1;
  await EventSettings.updateOne(
    {},
    {
      $set: {
        registrationLimit: testLimit,
        currentRegistrations: currentCount,
        registrationOpen: true,
      },
    },
  );

  console.log(
    `  ℹ️ Configured temporary boundary test limit = ${testLimit} (Current registrations: ${currentCount}, Exactly 1 slot remaining)...`,
  );
  await displayLiveRegistrationStatus("1 Slot Remaining");

  console.log(
    `  ℹ️ Firing Participant A and Participant B simultaneously for the 1 remaining slot...`,
  );
  const partA = createMockParticipant(9991, "BoundaryA");
  const partB = createMockParticipant(9992, "BoundaryB");

  const [resA, resB] = await Promise.all([
    fetch(`${API_BASE}/registrations/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partA),
    }),
    fetch(`${API_BASE}/registrations/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partB),
    }),
  ]);

  const grantedCount =
    (resA.status === 201 ? 1 : 0) + (resB.status === 201 ? 1 : 0);
  const blockedCount =
    (resA.status === 403 ? 1 : 0) + (resB.status === 403 ? 1 : 0);

  assertTest(
    "Capacity Lockdown: Exactly 1 Granted (201) and 1 Blocked (403)",
    grantedCount === 1 && blockedCount === 1,
    `Granted: ${grantedCount}, Blocked: ${blockedCount}`,
  );

  const afterBoundaryCount = await Registration.countDocuments();
  assertTest(
    `Database Integrity: Total Registrations Does Not Exceed Limit (${testLimit})`,
    afterBoundaryCount === testLimit,
    `Total in DB: ${afterBoundaryCount}`,
  );

  await displayLiveRegistrationStatus("Full Capacity State");

  // Cleanup the test participant and restore original settings
  await Registration.deleteMany({
    registerNumber: { $in: [partA.registerNumber, partB.registerNumber] },
  });
  if (originalSettings) {
    await EventSettings.updateOne(
      {},
      {
        $set: {
          registrationLimit: originalSettings.registrationLimit,
          currentRegistrations: currentCount,
          registrationOpen: originalSettings.registrationOpen,
        },
      },
    );
  }
}

// --------------------------------------------------------------------
// SUITE 6: High Concurrency Benchmark (Simultaneous Solo Registrations)
// --------------------------------------------------------------------
async function testConcurrencyBenchmark(attemptCount) {
  logTestHeader(
    `6. High Concurrency Benchmark: ${attemptCount} Simultaneous Solo Registrations`,
  );

  await Registration.deleteMany({});
  await EventSettings.updateOne({}, { $set: { currentRegistrations: 0 } });

  const settings = await EventSettings.findOne().lean();
  const dbLimit =
    typeof settings?.registrationLimit === "number"
      ? settings.registrationLimit
      : null;

  await displayLiveRegistrationStatus("Benchmark Start");

  console.log(
    `  ℹ️ Generating ${attemptCount} unique solo participant payloads...`,
  );
  const participants = Array.from({ length: attemptCount }, (_, i) =>
    createMockParticipant(i + 1, "Bench"),
  );

  console.log(
    `  ℹ️ Firing ${attemptCount} simultaneous POST /registrations/register requests balanced across ${TARGET_BASES.length} Render instances in Round Robin:`,
  );
  TARGET_BASES.forEach((b, i) => console.log(`      Node [${i + 1}]: ${b}`));
  const t0 = performance.now();

  const results = await Promise.all(
    participants.map(async (p, idx) => {
      const targetApi = TARGET_BASES[idx % TARGET_BASES.length];
      let res;
      let data = {};
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch(`${targetApi}/registrations/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          });
          data = await res.json().catch(() => ({}));
          // If server was temporarily rate-limited by Atlas SSL or cold-start (500/502/503/504), retry with backoff
          if ([500, 502, 503, 504].includes(res.status) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }
          break;
        } catch (e) {
          if (attempt === 2) {
            return { status: 0, ok: false, error: e.message };
          }
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      return { status: res?.status || 0, ok: res?.ok || false, data };
    }),
  );

  const duration = performance.now() - t0;
  const successful = results.filter((r) => r.ok && r.status === 201);
  const blocked = results.filter((r) => r.status === 403);
  const duplicates = results.filter((r) => r.status === 409);

  const expectedSuccess =
    dbLimit !== null && dbLimit > 0
      ? Math.min(attemptCount, dbLimit)
      : attemptCount;
  const expectedBlocked =
    dbLimit !== null && dbLimit > 0 ? Math.max(0, attemptCount - dbLimit) : 0;

  assertTest(
    `Concurrent Registrations Handled (Success: ${expectedSuccess}, Blocked: ${expectedBlocked})`,
    successful.length === expectedSuccess && blocked.length === expectedBlocked,
    `Successful: ${successful.length}, Blocked: ${blocked.length}, Time: ${(duration / 1000).toFixed(2)}s, Throughput: ${(
      attemptCount /
      (duration / 1000)
    ).toFixed(1)} req/s`,
  );

  assertTest(
    "Zero Unexpected Duplicate Key Collisions (HTTP 409)",
    duplicates.length === 0,
    `Duplicates: ${duplicates.length}`,
  );

  await displayLiveRegistrationStatus("After Benchmark Submissions");

  // Database Integrity Audit
  const dbRecords = await Registration.find().lean();
  const uniqueRegIds = new Set(dbRecords.map((r) => r.registrationId));
  const uniqueRegNos = new Set(dbRecords.map((r) => r.registerNumber));
  const uniquePhones = new Set(dbRecords.map((r) => r.phone));
  const validResidencies = dbRecords.every((r) =>
    ["Hosteler", "Dayscholar"].includes(r.residency),
  );

  assertTest(
    `DB Integrity: Exactly ${expectedSuccess} Records in MongoDB Atlas`,
    dbRecords.length === expectedSuccess,
  );
  assertTest(
    `DB Integrity: ${expectedSuccess} Unique Registration IDs`,
    uniqueRegIds.size === expectedSuccess,
  );
  assertTest(
    `DB Integrity: ${expectedSuccess} Unique Register Numbers`,
    uniqueRegNos.size === expectedSuccess,
  );
  assertTest(
    `DB Integrity: ${expectedSuccess} Unique Phone Numbers`,
    uniquePhones.size === expectedSuccess,
  );
  assertTest(
    "DB Integrity: All Records Persisted Valid Residency (Hosteler / Dayscholar)",
    validResidencies,
  );

  // Public Student Status Lookup (/api/v1/registrations/status/:id)
  if (dbRecords.length > 0) {
    const sampleReg = dbRecords[0];
    const statusRes = await fetch(
      `${API_BASE}/registrations/status/${sampleReg.registrationId}`,
    );
    const statusData = await statusRes.json();
    assertTest(
      "Public Status Lookup (/status/:id) Correctly Returns Solo Credentials",
      statusRes.ok &&
      statusData.registration?.registrationId === sampleReg.registrationId &&
      statusData.registration?.fullName === sampleReg.fullName &&
      statusData.registration?.registerNumber === sampleReg.registerNumber,
    );
  }
}

// --------------------------------------------------------------------
// MASTER RUNNER
// --------------------------------------------------------------------
async function runMasterTestSuite() {
  console.log(
    `======================================================================`,
  );
  console.log(`🚀 MASTER EVENT REGISTRATION TEST SUITE (SOLO ARCHITECTURE)`);
  console.log(
    `======================================================================`,
  );

  await connectDB();

  const cliOpts = parseCliArgs();

  const existingRegCount = await Registration.countDocuments();
  if (existingRegCount > 0) {
    console.log(
      `\n⚠️  Found ${existingRegCount} confirmed registrations in MongoDB.`,
    );
    const shouldCleanStart =
      cliOpts.cleanStart ??
      (await promptYesNo(
        `👉 Clear existing registrations before running the test suite?`,
        true,
        cliOpts.autoConfirm,
      ));
    if (shouldCleanStart) {
      await Registration.deleteMany({});
      await EventSettings.updateOne({}, { $set: { currentRegistrations: 0 } });
      console.log(`🧹 Database cleared for clean test baseline.\n`);
    } else {
      console.log(`ℹ️  Proceeding without clearing existing database data.\n`);
    }
  }

  let eventSettings = await EventSettings.findOne().lean();
  if (!eventSettings) {
    eventSettings = await EventSettings.create({});
  }

  if (!eventSettings.registrationOpen) {
    await EventSettings.updateOne({}, { $set: { registrationOpen: true } });
    eventSettings.registrationOpen = true;
  }

  const liveLimit =
    typeof eventSettings.registrationLimit === "number"
      ? eventSettings.registrationLimit
      : null;

  console.log(`\n📖 Database Configuration (MongoDB Atlas):`);
  console.log(
    `   • Total Event Capacity in DB : ${liveLimit !== null && liveLimit > 0 ? `${liveLimit} Participants` : "Unlimited"}`,
  );
  console.log(
    `   • Registration Status        : ${eventSettings.registrationOpen ? "🟢 OPEN" : "🔴 CLOSED"}\n`,
  );

  // Participant count: prioritize CLI option, otherwise prompt (default 300)
  const defaultBenchCount =
    liveLimit !== null && liveLimit > 0 ? liveLimit : 300;
  const attemptCount =
    cliOpts.count ||
    (await promptParticipantCount(defaultBenchCount, cliOpts.autoConfirm));

  const masterStart = performance.now();

  await testSystemHealth();
  await testAvailabilityChecks();
  const sampleParticipant = await testSoloRegistrationLifecycle();
  await testPaymentRecoveryFlow(sampleParticipant);
  await testRaceConditionBoundary();
  await testConcurrencyBenchmark(attemptCount);

  console.log(
    `\n----------------------------------------------------------------------`,
  );
  const shouldDeleteAtEnd =
    cliOpts.keepAtEnd !== null
      ? !cliOpts.keepAtEnd
      : await promptYesNo(
        `👉 Do you want to delete/clean up the test registrations from MongoDB?`,
        true,
        cliOpts.autoConfirm,
      );

  if (shouldDeleteAtEnd) {
    await Registration.deleteMany({});
    await EventSettings.updateOne({}, { $set: { currentRegistrations: 0 } });
    console.log(`  🧹 Test registrations deleted successfully from MongoDB.`);
  } else {
    console.log(
      `  💾 Test registrations preserved in MongoDB Atlas for inspection.`,
    );
  }

  const totalTime = ((performance.now() - masterStart) / 1000).toFixed(2);

  console.log(
    `\n======================================================================`,
  );
  console.log(
    `🏁 TEST SUITE SUMMARY (Tested ${attemptCount} Participants Against DB Limit: ${liveLimit ?? "Unlimited"})`,
  );
  console.log(
    `======================================================================`,
  );
  console.log(`Total Passed Tests : ${totalPassed}`);
  console.log(`Total Failed Tests : ${totalFailed}`);
  console.log(`Total Duration     : ${totalTime} seconds`);
  await displayLiveRegistrationStatus("Production Ready State");
  console.log(
    `Overall Result     : ${totalFailed === 0 ? "🏆 ALL TESTS PASSED SUCCESSFULLY!" : "⚠️ SOME TESTS FAILED"}`,
  );
  console.log(
    `======================================================================\n`,
  );

  process.exit(totalFailed === 0 ? 0 : 1);
}

runMasterTestSuite().catch((err) => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
