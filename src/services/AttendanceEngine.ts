import { AttendanceRepository } from "@/repositories/AttendanceRepository";
import { getFailureDefinition } from "@/lib/verification/failureRegistry";
import { AttendancePayload, VerificationResult, FailureCode } from "@/types/verification";
import { SessionStatus, ProximityTier } from "@prisma/client";
import { SessionCache } from "@/lib/cache/sessionCache";
import { BiometricService } from "@/services/BiometricService";
import { prisma } from "@/lib/db/prisma";

export class AttendanceEngine {
  /**
   * Authoritative backend attendance verification & transactional commit
   */
  public static async processAttendanceSubmission(
    payload: AttendancePayload,
    clientIp?: string
  ): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      // 1. Session Validation using high-speed SessionCache
      const session = await SessionCache.getSessionWithEnrollments(payload.sessionId);

      if (!session) {
        return this.createFailureResult(payload, "SESSION_NOT_FOUND", startTime, clientIp);
      }

      if (session.status === SessionStatus.CREATED) {
        return this.createFailureResult(payload, "SESSION_NOT_OPEN", startTime, clientIp);
      }

      if (session.status === SessionStatus.CLOSED || session.status === SessionStatus.ARCHIVED) {
        return this.createFailureResult(payload, "SESSION_EXPIRED", startTime, clientIp);
      }

      // 2. Student Enrollment Validation
      const isEnrolled = session.enrolledStudentIds.has(payload.studentId);
      if (!isEnrolled) {
        return this.createFailureResult(payload, "STUDENT_NOT_ENROLLED", startTime, clientIp);
      }

      // Check student capacity limit if configured
      if (session.studentLimit && session.studentLimit > 0) {
        const currentCount = await prisma.attendanceRecord.count({
          where: { sessionId: payload.sessionId, status: "PRESENT" },
        });
        const alreadyRecorded = await prisma.attendanceRecord.findUnique({
          where: {
            sessionId_studentId: {
              sessionId: payload.sessionId,
              studentId: payload.studentId,
            },
          },
        });
        if (!alreadyRecorded && currentCount >= session.studentLimit) {
          return this.createFailureResult(payload, "RATE_LIMITED", startTime, clientIp);
        }
      }

      // 3. Freshness & Timestamp Drift Check (allowed drift: 90 seconds)
      const now = Date.now();
      const timeDiff = Math.abs(now - payload.timestamp);
      if (timeDiff > 90 * 1000) {
        return this.createFailureResult(payload, "TIMESTAMP_INVALID", startTime, clientIp);
      }

      // 4. Proximity Policy Validation
      const prox = payload.proximityProof;
      if (!prox) {
        return this.createFailureResult(payload, "PROXIMITY_SIGNAL_NOT_DETECTED", startTime, clientIp);
      }

      if (session.proximityTierRequired === ProximityTier.TIER_A && prox.tier !== "TIER_A") {
        return this.createFailureResult(payload, "PROXIMITY_VERIFICATION_FAILED", startTime, clientIp);
      }

      if (prox.confidence < 0.6) {
        return this.createFailureResult(payload, "PROXIMITY_VERIFICATION_FAILED", startTime, clientIp);
      }

      // 5. Face Biometric Proof Validation against Enrolled Profile
      const face = payload.faceProof;
      if (!face || !face.matched) {
        return this.createFailureResult(payload, "FACE_MISMATCH", startTime, clientIp);
      }

      if (face.confidence < 0.65) {
        return this.createFailureResult(payload, "FACE_CONFIDENCE_INSUFFICIENT", startTime, clientIp);
      }

      // Check biometric profile match in database
      const biometricCheck = await BiometricService.verifyFaceMatch(payload.studentId, face);
      if (!biometricCheck.matched) {
        if (biometricCheck.failureReason === "FACE_NOT_ENROLLED") {
          return this.createFailureResult(payload, "FACE_NOT_ENROLLED", startTime, clientIp);
        }
        return this.createFailureResult(payload, "FACE_MISMATCH", startTime, clientIp);
      }

      // 6. Liveness Proof Validation
      const liveness = payload.livenessProof;
      if (!liveness || !liveness.passed) {
        if (liveness?.attackDetected) {
          return this.createFailureResult(payload, "POSSIBLE_PRESENTATION_ATTACK", startTime, clientIp);
        }
        return this.createFailureResult(payload, "LIVENESS_FAILED", startTime, clientIp);
      }

      // 7. Security / Nonce & Signature Validation
      if (!payload.signature) {
        return this.createFailureResult(payload, "INVALID_SIGNATURE", startTime, clientIp);
      }

      // 8. Commit Transactionally (UNIQUE(session_id, student_id))
      const proximityTierPrisma =
        prox.tier === "TIER_A" ? ProximityTier.TIER_A : prox.tier === "TIER_B" ? ProximityTier.TIER_B : ProximityTier.TIER_C;

      const combinedConfidence = Number(((prox.confidence + face.confidence) / 2).toFixed(2));

      const commitResult = await AttendanceRepository.recordAttendanceTransactional({
        sessionId: payload.sessionId,
        studentId: payload.studentId,
        deviceId: payload.deviceId,
        proximityTier: proximityTierPrisma,
        confidence: combinedConfidence,
        attemptNonce: prox.nonce,
        idempotencyKey: payload.attemptId,
      });

      // Audit log attempt
      await AttendanceRepository.logAttempt({
        sessionId: payload.sessionId,
        studentId: payload.studentId,
        deviceId: payload.deviceId,
        stage: "ATTENDANCE_ACCEPTED",
        outcome: "PRESENT",
        proximityProof: prox as unknown as Record<string, unknown>,
        faceProof: face as unknown as Record<string, unknown>,
        livenessProof: liveness as unknown as Record<string, unknown>,
        durationMs: Date.now() - startTime,
        clientIp,
      });

      return {
        attemptId: payload.attemptId,
        outcome: "ACCEPTED",
        stage: "ATTENDANCE_ACCEPTED",
        verifiedAt: commitResult.record.verifiedAt.toISOString(),
        attendanceId: commitResult.record.id,
        isDuplicate: commitResult.isDuplicate,
      };
    } catch (err: unknown) {
      console.error("[AttendanceEngine] Unexpected internal error during verification:", err);
      const failureDef = getFailureDefinition("DATABASE_ERROR");

      return {
        attemptId: payload.attemptId,
        outcome: failureDef.outcome,
        stage: "FINAL_VALIDATION",
        failure: failureDef,
      };
    }
  }

  private static async createFailureResult(
    payload: AttendancePayload,
    code: FailureCode,
    startTime: number,
    clientIp?: string
  ): Promise<VerificationResult> {
    const failureDef = getFailureDefinition(code);

    // Audit log failed attempt asynchronously
    AttendanceRepository.logAttempt({
      sessionId: payload.sessionId,
      studentId: payload.studentId,
      deviceId: payload.deviceId,
      stage: failureDef.category,
      outcome:
        failureDef.outcome === "REJECTED"
          ? "REJECTED"
          : failureDef.outcome === "BLOCKED"
          ? "BLOCKED"
          : failureDef.outcome === "RETRY_REQUIRED"
          ? "RETRY_REQUIRED"
          : "SYSTEM_ERROR",
      failureCode: code,
      durationMs: Date.now() - startTime,
      clientIp,
    }).catch(() => {});

    return {
      attemptId: payload.attemptId,
      outcome: failureDef.outcome,
      stage: "FINAL_VALIDATION",
      failure: failureDef,
    };
  }
}
