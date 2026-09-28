import { prisma } from "@/lib/db/prisma";
import { AttendanceStatus, ProximityTier, Prisma } from "@prisma/client";

export interface CreateAttendanceParams {
  sessionId: string;
  studentId: string;
  deviceId: string;
  proximityTier: ProximityTier;
  confidence: number;
  attemptNonce: string;
  idempotencyKey: string;
}

export interface LogAttemptParams {
  sessionId: string;
  studentId: string;
  deviceId: string;
  stage: string;
  outcome: AttendanceStatus;
  failureCode?: string;
  proximityProof?: Record<string, unknown>;
  faceProof?: Record<string, unknown>;
  livenessProof?: Record<string, unknown>;
  durationMs?: number;
  clientIp?: string;
}

export class AttendanceRepository {
  /**
   * Transactional attendance commit:
   * 1. Inserts AttendanceRecord with UNIQUE(sessionId, studentId) constraint
   * 2. Inserts OutboxEvent ('ATTENDANCE_ACCEPTED') for downstream WebSocket and worker dispatch
   * 3. Idempotently returns existing record if already submitted
   */
  public static async recordAttendanceTransactional(params: CreateAttendanceParams) {
    return await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      const existing = await tx.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: params.sessionId,
            studentId: params.studentId,
          },
        },
      });

      if (existing) {
        return {
          record: existing,
          isDuplicate: true,
        };
      }

      // 2. Create Attendance Record
      const newRecord = await tx.attendanceRecord.create({
        data: {
          sessionId: params.sessionId,
          studentId: params.studentId,
          deviceId: params.deviceId,
          status: AttendanceStatus.PRESENT,
          proximityTierUsed: params.proximityTier,
          confidence: params.confidence,
          attemptNonce: params.attemptNonce,
          idempotencyKey: params.idempotencyKey,
        },
      });

      // 3. Create Outbox Event in the same atomic transaction
      await tx.outboxEvent.create({
        data: {
          eventType: "ATTENDANCE_ACCEPTED",
          aggregateType: "AttendanceRecord",
          aggregateId: newRecord.id,
          payload: {
            attendanceId: newRecord.id,
            sessionId: newRecord.sessionId,
            studentId: newRecord.studentId,
            deviceId: newRecord.deviceId,
            status: newRecord.status,
            verifiedAt: newRecord.verifiedAt.toISOString(),
            confidence: newRecord.confidence,
          },
        },
      });

      return {
        record: newRecord,
        isDuplicate: false,
      };
    });
  }

  /**
   * Log verification attempts for audit and diagnostics
   */
  public static async logAttempt(params: LogAttemptParams) {
    try {
      return await prisma.verificationAttempt.create({
        data: {
          sessionId: params.sessionId,
          studentId: params.studentId,
          deviceId: params.deviceId,
          stage: params.stage,
          outcome: params.outcome,
          failureCode: params.failureCode,
          proximityProof: params.proximityProof as Prisma.InputJsonValue | undefined,
          faceProof: params.faceProof as Prisma.InputJsonValue | undefined,
          livenessProof: params.livenessProof as Prisma.InputJsonValue | undefined,
          durationMs: params.durationMs,
          clientIp: params.clientIp,
        },
      });
    } catch (err) {
      console.error("[AttendanceRepository] Failed to log verification attempt:", err);
      return null;
    }
  }

  /**
   * Retrieve all records for a session
   */
  public static async getSessionRecords(sessionId: string) {
    return await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            email: true,
          },
        },
      },
      orderBy: { verifiedAt: "asc" },
    });
  }
}
