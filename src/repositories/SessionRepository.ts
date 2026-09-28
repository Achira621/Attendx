import { prisma } from "@/lib/db/prisma";
import { SessionStatus, ProximityTier } from "@prisma/client";

export interface CreateSessionParams {
  courseId: string;
  classroomId: string;
  teacherId: string;
  proximityTierRequired?: ProximityTier;
  durationMinutes?: number;
}

export class SessionRepository {
  /**
   * Create a new session in CREATED state
   */
  public static async createSession(params: CreateSessionParams) {
    const ephemeralSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    return await prisma.attendanceSession.create({
      data: {
        courseId: params.courseId,
        classroomId: params.classroomId,
        teacherId: params.teacherId,
        status: SessionStatus.CREATED,
        ephemeralSecret,
        proximityTierRequired: params.proximityTierRequired || ProximityTier.TIER_A,
      },
      include: {
        course: true,
        classroom: true,
      },
    });
  }

  /**
   * Start session: CREATED -> ACTIVE
   */
  public static async startSession(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== SessionStatus.CREATED) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot start session in status ${session.status}`);
    }

    const now = new Date();
    return await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ACTIVE,
        startTime: now,
      },
    });
  }

  /**
   * Transition session to GRACE_PERIOD: ACTIVE -> GRACE_PERIOD
   */
  public static async startGracePeriod(sessionId: string, graceDurationSeconds = 60) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot enter grace period from status ${session.status}`);
    }

    const graceEndTime = new Date(Date.now() + graceDurationSeconds * 1000);
    return await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.GRACE_PERIOD,
        graceEndTime,
      },
    });
  }

  /**
   * Close session: (ACTIVE | GRACE_PERIOD) -> CLOSED
   */
  public static async closeSession(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== SessionStatus.ACTIVE && session.status !== SessionStatus.GRACE_PERIOD) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot close session in status ${session.status}`);
    }

    return await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CLOSED,
        endTime: new Date(),
      },
    });
  }

  /**
   * Archive session: CLOSED -> ARCHIVED
   */
  public static async archiveSession(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== SessionStatus.CLOSED) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot archive session in status ${session.status}`);
    }

    return await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ARCHIVED,
      },
    });
  }

  /**
   * Find session with full course and roster details
   */
  public static async getSessionWithRoster(sessionId: string) {
    return await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
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
            },
          },
        },
        classroom: true,
        records: true,
      },
    });
  }
}
