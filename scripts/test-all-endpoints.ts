import { PrismaClient } from "@prisma/client";

const BASE_URL = "http://localhost:3000";
const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  status?: number;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ""}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
  }
}

async function runTests() {
  console.log("🚀 Starting Attendex Comprehensive Endpoints Test Suite...\n");

  // Fetch seeded references directly from DB to test accurately
  const teacherUser = await prisma.user.findUnique({ where: { email: "teacher@attendex.edu" } });
  const studentUser = await prisma.user.findUnique({ where: { email: "student@attendex.edu" } });
  const activeSession = await prisma.attendanceSession.findFirst({
    where: { status: "ACTIVE" },
    include: { course: true },
  });

  if (!teacherUser || !studentUser || !activeSession) {
    console.error("Missing seeded data in database! Please run prisma seed first.");
    process.exit(1);
  }

  let teacherToken = "";
  let studentToken = "";

  // -------------------------------------------------------------
  // 0. HEALTH & VERCEL READINESS ENDPOINT
  // -------------------------------------------------------------
  console.log("=== 0. Testing Vercel Deployment Health & Readiness ===");
  try {
    const res = await fetch(`${BASE_URL}/api/v1/health`);
    const data = await res.json();
    assert(
      res.status === 200 && data.status === "healthy" && data.services?.database?.status === "up",
      "GET /api/v1/health (Liveness & DB Ping)",
      `DB Latency: ${data.services?.database?.latencyMs}ms | Memory: ${data.services?.serverlessRuntime?.memoryUsageMb}MB`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/health", errorMsg);
  }

  // -------------------------------------------------------------
  // 1. AUTH ENDPOINTS
  // -------------------------------------------------------------
  console.log("\n=== 1. Testing Auth Endpoints ===");

  // 1.1 Teacher Login with Email
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "teacher@attendex.edu", password: "Pass@1234" }),
    });
    const data = await res.json();
    teacherToken = data.token;
    assert(res.status === 200 && data.success && data.user.role === "TEACHER", "Teacher Login with Email", `User: ${data.user?.name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Teacher Login with Email", errorMsg);
  }

  // 1.2 Student Login with Roll Number
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "CS-2026-001", password: "Pass@1234" }),
    });
    const data = await res.json();
    studentToken = data.token;
    assert(res.status === 200 && data.success && data.user.role === "STUDENT", "Student Login with Roll Number", `User: ${data.user?.name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Student Login with Roll Number", errorMsg);
  }

  // 1.3 Invalid Password Rejection (401)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "student@attendex.edu", password: "WrongPassword" }),
    });
    const data = await res.json();
    assert(res.status === 401 && !data.success, "Invalid Credentials Rejection (401)");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Invalid Credentials Rejection", errorMsg);
  }

  // 1.4 Missing Fields Rejection (400)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "student@attendex.edu" }),
    });
    assert(res.status === 400, "Login Missing Fields (Bad Request)");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Login Missing Fields", errorMsg);
  }

  // 1.5 GET /api/v1/auth/me (Authenticated)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const data = await res.json();
    assert(res.status === 200 && data.authenticated && data.user.email === "teacher@attendex.edu", "GET /api/v1/auth/me (Authenticated)", data.user?.email);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/auth/me (Authenticated)", errorMsg);
  }

  // 1.6 GET /api/v1/auth/me (Unauthenticated)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`);
    const data = await res.json();
    assert(res.status === 401 && !data.authenticated, "GET /api/v1/auth/me (Unauthenticated 401)");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/auth/me (Unauthenticated)", errorMsg);
  }

  // 1.7 POST /api/v1/auth/logout
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, { method: "POST" });
    const data = await res.json();
    assert(res.status === 200 && data.success, "POST /api/v1/auth/logout (Clears Session)");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "POST /api/v1/auth/logout", errorMsg);
  }

  // -------------------------------------------------------------
  // 2. BIOMETRIC FACE DATA MANAGEMENT & RETRIEVAL
  // -------------------------------------------------------------
  console.log("\n=== 2. Testing Biometric Face Data Management & Retrieval ===");

  // 2.1 Get Student Biometric Profile (Existing Seeded Profile)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/biometrics/profile?studentId=${studentUser.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success && data.enrolled === true,
      "GET /api/v1/biometrics/profile (Seeded Profile Found)",
      `Hash: ${data.profile?.templateVectorHash}`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/biometrics/profile", errorMsg);
  }

  // 2.2 Enroll / Update Face Biometric Template (Quality >= 0.70)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/biometrics/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        templateVectorHash: "FV-DEMO-PASS",
        qualityScore: 0.94,
        algorithmVersion: "browser-mesh-v1",
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true,
      "POST /api/v1/biometrics/enroll (Valid Quality >= 0.70)",
      `Score: ${data.profile?.qualityScore}`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "POST /api/v1/biometrics/enroll", errorMsg);
  }

  // 2.3 Enroll Face Rejection on Poor Quality (< 0.70)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/biometrics/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        templateVectorHash: "FV-POOR-LIGHTING",
        qualityScore: 0.45, // Below threshold
      }),
    });
    const data = await res.json();
    assert(
      res.status === 422 && data.code === "FACE_POOR_QUALITY",
      "POST /api/v1/biometrics/enroll (Reject Poor Quality < 0.70)"
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "POST /api/v1/biometrics/enroll (Reject Poor Quality)", errorMsg);
  }

  // 2.4 Verify Biometric Match Direct
  try {
    const res = await fetch(`${BASE_URL}/api/v1/biometrics/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: studentUser.id,
        faceProof: {
          providerId: "browser-mesh-v1",
          matched: true,
          confidence: 0.92,
          featureVectorHash: "FV-DEMO-PASS",
        },
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.matched === true, "POST /api/v1/biometrics/verify (Matched)", `Confidence: ${data.confidence}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "POST /api/v1/biometrics/verify", errorMsg);
  }

  // -------------------------------------------------------------
  // 3. SESSION ENDPOINTS
  // -------------------------------------------------------------
  console.log("\n=== 3. Testing Session Endpoints ===");

  // 3.1 List Sessions
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sessions`);
    const data = await res.json();
    assert(res.status === 200 && data.success && Array.isArray(data.sessions), "GET /api/v1/sessions", `Found ${data.sessions?.length} sessions`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/sessions", errorMsg);
  }

  // 3.2 Get Active Session with Roster
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}`);
    const data = await res.json();
    assert(res.status === 200 && data.success && data.session.id === activeSession.id, "GET /api/v1/sessions/[id]", `Course: ${data.session?.course?.name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/sessions/[id]", errorMsg);
  }

  // -------------------------------------------------------------
  // 4. ATTENDANCE SUBMISSION ENGINE (Authoritative Dual Presence)
  // -------------------------------------------------------------
  console.log("\n=== 4. Testing Attendance Submission Engine ===");

  const validNonce = `NONCE_TEST_${Date.now()}`;

  // 4.1 Valid Attendance Submission
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: `attempt_${Date.now()}_valid`,
        sessionId: activeSession.id,
        studentId: studentUser.id,
        deviceId: "device-test-chrome-pixel8",
        timestamp: Date.now(),
        proximityProof: {
          tier: "TIER_A",
          confidence: 0.95,
          nonce: validNonce,
          provider: "AcousticProvider",
        },
        faceProof: {
          matched: true,
          confidence: 0.89,
          featureVectorHash: "FV-DEMO-PASS",
        },
        livenessProof: {
          passed: true,
          attackDetected: false,
          score: 0.98,
        },
        signature: "sig_mock_ed25519_valid_signature",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.outcome === "ACCEPTED", "Valid Attendance Submission (ACCEPTED)", `Outcome: ${data.outcome}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Valid Attendance Submission", errorMsg);
  }

  // 4.2 Idempotency Test (Submit exact same student for same session)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: `attempt_${Date.now()}_duplicate`,
        sessionId: activeSession.id,
        studentId: studentUser.id,
        deviceId: "device-test-chrome-pixel8",
        timestamp: Date.now(),
        proximityProof: {
          tier: "TIER_A",
          confidence: 0.95,
          nonce: validNonce,
          provider: "AcousticProvider",
        },
        faceProof: {
          matched: true,
          confidence: 0.89,
          featureVectorHash: "FV-DEMO-PASS",
        },
        livenessProof: {
          passed: true,
          attackDetected: false,
          score: 0.92,
        },
        signature: "sig_mock_ed25519_valid_signature",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.outcome === "ACCEPTED" && data.isDuplicate === true, "Idempotent Re-submission (ACCEPTED Duplicate)", `isDuplicate: ${data.isDuplicate}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Idempotent Re-submission", errorMsg);
  }

  // 4.3 Stale Timestamp Drift (Failure Code: TIMESTAMP_INVALID -> RETRY_REQUIRED, status 422)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: `attempt_${Date.now()}_stale`,
        sessionId: activeSession.id,
        studentId: studentUser.id,
        deviceId: "device-test-chrome-pixel8",
        timestamp: Date.now() - 120 * 1000, // 2 minutes ago
        proximityProof: { tier: "TIER_A", confidence: 0.9, nonce: "nonce3" },
        faceProof: { matched: true, confidence: 0.9, featureVectorHash: "FV-DEMO-PASS" },
        livenessProof: { passed: true, attackDetected: false },
        signature: "valid_sig",
      }),
    });
    const data = await res.json();
    assert(res.status === 422 && data.outcome === "RETRY_REQUIRED", "Stale Timestamp Drift (RETRY_REQUIRED)", `Code: ${data.failure?.code}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Stale Timestamp Drift", errorMsg);
  }

  // -------------------------------------------------------------
  // 5. ATTENDANCE RECORDS RETRIEVAL
  // -------------------------------------------------------------
  console.log("\n=== 5. Testing Attendance Records Retrieval ===");

  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/records?sessionId=${activeSession.id}`);
    const data = await res.json();
    assert(res.status === 200 && data.success && data.count >= 1, "GET /api/v1/attendance/records", `Verified records count: ${data.count}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/attendance/records", errorMsg);
  }

  // -------------------------------------------------------------
  // 6. TRANSACTIONAL OUTBOX WORKER
  // -------------------------------------------------------------
  console.log("\n=== 6. Testing Transactional Outbox Worker ===");

  try {
    const res = await fetch(`${BASE_URL}/api/v1/workers/outbox`, { method: "POST" });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "POST /api/v1/workers/outbox (Drain Pending Events)", `Processed: ${data.processed}, Succeeded: ${data.succeeded}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "POST /api/v1/workers/outbox", errorMsg);
  }

  // -------------------------------------------------------------
  // 7. SUMMARY
  // -------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n==========================================");
  console.log(`Test Results: ${passed}/${total} Passed (${failed} Failed)`);
  console.log("==========================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
