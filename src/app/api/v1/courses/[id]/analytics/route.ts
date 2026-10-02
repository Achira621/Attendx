import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing course ID" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sessions: {
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            classroom: {
              select: {
                name: true,
                roomNumber: true,
              },
            },
            records: {
              select: {
                id: true,
                studentId: true,
                status: true,
                confidence: true,
                proximityTierUsed: true,
                verifiedAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                email: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const totalSessions = course.sessions.length;

    // Build per-student aggregate attendance analytics and session history
    const studentAnalytics = course.enrollments.map((enr) => {
      const student = enr.student;
      const studentRecords: Array<{
        sessionId: string;
        sessionDate: string;
        classroom: string;
        status: string;
        verifiedAt: string | null;
        confidence: number;
        proximityTier: string;
      }> = [];

      let attendedCount = 0;

      course.sessions.forEach((sess) => {
        const match = sess.records.find((r) => r.studentId === student.id);
        if (match && match.status === "PRESENT") {
          attendedCount++;
          studentRecords.push({
            sessionId: sess.id,
            sessionDate: sess.createdAt.toISOString(),
            classroom: `${sess.classroom.name} (${sess.classroom.roomNumber})`,
            status: "PRESENT",
            verifiedAt: match.verifiedAt.toISOString(),
            confidence: match.confidence,
            proximityTier: match.proximityTierUsed,
          });
        } else {
          studentRecords.push({
            sessionId: sess.id,
            sessionDate: sess.createdAt.toISOString(),
            classroom: `${sess.classroom.name} (${sess.classroom.roomNumber})`,
            status: "ABSENT",
            verifiedAt: null,
            confidence: 0,
            proximityTier: "NONE",
          });
        }
      });

      const attendancePercentage = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;

      return {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber || "N/A",
        email: student.email,
        department: student.department || course.department,
        enrolledAt: enr.enrolledAt.toISOString(),
        totalSessions,
        attendedCount,
        attendancePercentage,
        attendanceHistory: studentRecords,
      };
    });

    // Overall course statistics
    const totalPossibleAttendances = totalSessions * course.enrollments.length;
    const totalActualAttendances = studentAnalytics.reduce((sum, s) => sum + s.attendedCount, 0);
    const averageCourseAttendanceRate =
      totalPossibleAttendances > 0 ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100) : 0;

    return NextResponse.json(
      {
        success: true,
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          department: course.department,
          studentLimit: course.studentLimit,
          teacher: course.teacher,
          totalSessions,
          enrolledCount: course.enrollments.length,
          averageAttendanceRate: averageCourseAttendanceRate,
        },
        students: studentAnalytics,
        sessions: course.sessions.map((s) => ({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          classroom: `${s.classroom.name} (${s.classroom.roomNumber})`,
          attendeeCount: s.records.length,
        })),
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/v1/courses/[id]/analytics] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate course analytics" }, { status: 500 });
  }
}
