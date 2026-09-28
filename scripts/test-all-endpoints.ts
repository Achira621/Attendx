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
  // 1. AUTH ENDPOINTS
  // -------------------------------------------------------------
  console.log("=== 1. Testing Auth Endpoints ===");

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
    assert(res.status === 200 && data.success && data.user.role === "STUDENT", "Student Login with Roll Number", `Roll: ${data.user?.rollNumber}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Student Login with Roll Number", errorMsg);
  }

  // 1.3 Login with Wrong Password
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "teacher@attendex.edu", password: "WrongPassword" }),
    });
    const data = await res.json();
    assert(res.status === 401 && !data.success, "Login with Invalid Password (Rejected)", data.error);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Login with Invalid Password", errorMsg);
  }

  // 1.4 Login with Empty Fields
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "", password: "" }),
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
  // 2. SESSION ENDPOINTS
  // -------------------------------------------------------------
  console.log("\n=== 2. Testing Session Endpoints ===");

  // 2.1 List Sessions
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sessions`);
    const data = await res.json();
    assert(res.status === 200 && data.success && Array.isArray(data.sessions), "GET /api/v1/sessions", `Found ${data.sessions?.length} sessions`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/sessions", errorMsg);
  }

  // 2.2 Get Active Session with Roster
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}`);
    const data = await res.json();
    assert(res.status === 200 && data.success && data.session.id === activeSession.id, "GET /api/v1/sessions/[id]", `Course: ${data.session?.course?.name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/sessions/[id]", errorMsg);
  }

  // -------------------------------------------------------------
  // 3. ATTENDANCE VERIFICATION & SUBMISSION ENDPOINTS
  // -------------------------------------------------------------
  console.log("\n=== 3. Testing Attendance Submission & Failure Mapping ===");

  const validAttemptId = `attempt_${Date.now()}_test`;
  const validNonce = `nonce_${Date.now()}`;

  // 3.1 Valid Attendance Submission
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        attemptId: validAttemptId,
        sessionId: activeSession.id,
        studentId: studentUser.id,
        deviceId: "device-test-chrome-pixel8",
        timestamp: Date.now(),
        proximityProof: {
          tier: "TIER_A",
          confidence: 0.94,
          nonce: validNonce,
          provider: "AcousticProvider",
        },
        faceProof: {
          matched: true,
          confidence: 0.91,
          algorithmVersion: "browser-mesh-v1",
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

  // 3.2 Idempotency Test (Submit exact same student for same session)
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
          algorithmVersion: "browser-mesh-v1",
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

  // 3.3 Face Mismatch (Failure Code: FACE_MISMATCH -> REJECTED, status 422)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: `attempt_${Date.now()}_mismatch`,
        sessionId: activeSession.id,
        studentId: "cmukyyrc4000g12bw3nnyb5lq-fake", // Will check either enrollment or mismatch
        deviceId: "device-test-chrome-pixel8",
        timestamp: Date.now(),
        proximityProof: { tier: "TIER_A", confidence: 0.9, nonce: "nonce1" },
        faceProof: { matched: false, confidence: 0.2 },
        livenessProof: { passed: true, attackDetected: false },
        signature: "valid_sig",
      }),
    });
    const data = await res.json();
    assert(res.status === 422 && data.outcome === "REJECTED", "Face Mismatch Failure (REJECTED)", `Code: ${data.failure?.code}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Face Mismatch Failure", errorMsg);
  }

  // 3.4 Presentation Attack Detected (Failure Code: POSSIBLE_PRESENTATION_ATTACK -> BLOCKED, status 403)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: `attempt_${Date.now()}_attack`,
        sessionId: activeSession.id,
        studentId: studentUser.id,
        deviceId: "device-test-chrome-pixel8",
        timestamp: Date.now(),
        proximityProof: { tier: "TIER_A", confidence: 0.9, nonce: "nonce2" },
        faceProof: { matched: true, confidence: 0.9 },
        livenessProof: { passed: false, attackDetected: true },
        signature: "valid_sig",
      }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.outcome === "BLOCKED", "Presentation Attack Detected (BLOCKED)", `Code: ${data.failure?.code}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "Presentation Attack Detected", errorMsg);
  }

  // 3.5 Timestamp Drift > 90s (Failure Code: TIMESTAMP_INVALID -> RETRY_REQUIRED, status 422)
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
        faceProof: { matched: true, confidence: 0.9 },
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
  // 4. ATTENDANCE RECORDS ENDPOINT
  // -------------------------------------------------------------
  console.log("\n=== 4. Testing Attendance Records Retrieval ===");

  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/records?sessionId=${activeSession.id}`);
    const data = await res.json();
    assert(res.status === 200 && data.success && data.count >= 1, "GET /api/v1/attendance/records", `Verified records count: ${data.count}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(false, "GET /api/v1/attendance/records", errorMsg);
  }

  // -------------------------------------------------------------
  // 5. SUMMARY
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
