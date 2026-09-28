import { prisma } from "@/lib/db/prisma";
import { SessionStatus, ProximityTier } from "@prisma/client";

export interface CachedSessionData {
  id: string;
  status: SessionStatus;
  ephemeralSecret: string;
  proximityTierRequired: ProximityTier;
  maxAttempts: number;
  courseId: string;
  enrolledStudentIds: Set<string>;
  cachedAt: number;
}

const CACHE_TTL_MS = 10 * 1000; // 10 seconds TTL
const sessionCache = new Map<string, CachedSessionData>();

export class SessionCache {
  /**
   * Get cached session data or fetch from database with short TTL
   */
  public static async getSessionWithEnrollments(sessionId: string): Promise<CachedSessionData | null> {
    const now = Date.now();
    const cached = sessionCache.get(sessionId);

    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      return cached;
    }

    // Cache miss or expired - fetch from DB
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!session) {
      sessionCache.delete(sessionId);
      return null;
    }

    const enrolledStudentIds = new Set(session.course.enrollments.map((e) => e.studentId));

    const entry: CachedSessionData = {
      id: session.id,
      status: session.status,
      ephemeralSecret: session.ephemeralSecret,
      proximityTierRequired: session.proximityTierRequired,
      maxAttempts: session.maxAttempts,
      courseId: session.courseId,
      enrolledStudentIds,
      cachedAt: now,
    };

    sessionCache.set(sessionId, entry);
    return entry;
  }

  /**
   * Explicitly invalidate cached session (e.g. when teacher ends session or changes status)
   */
  public static invalidate(sessionId: string): void {
    sessionCache.delete(sessionId);
  }

  /**
   * Clear entire cache
   */
  public static clear(): void {
    sessionCache.clear();
  }
}
