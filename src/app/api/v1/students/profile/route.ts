import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");
    const authUser = await getAuthUserFromRequest(req);

    const targetStudentId = studentIdParam || authUser?.id;
    if (!targetStudentId) {
      return NextResponse.json({ success: false, error: "Missing student identifier" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: {
        biometricProfile: true,
        devices: {
          select: {
            deviceId: true,
            deviceModel: true,
            isTrusted: true,
            registeredAt: true,
            lastActiveAt: true,
          },
        },
        enrollments: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                _count: {
                  select: { sessions: true },
                },
              },
            },
          },
        },
        attendance: {
          include: {
            session: {
              include: {
                course: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
                classroom: {
                  select: {
                    name: true,
                    roomNumber: true,
                  },
                },
              },
            },
          },
          orderBy: { verifiedAt: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    // Compute course attendance breakdown
    const courseStats = student.enrollments.map((enr) => {
      const course = enr.course;
      const totalSessions = course._count.sessions;
      const attended = student.attendance.filter(
        (r) => r.session.course.code === course.code && r.status === "PRESENT"
      ).length;

      const rate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100;

      return {
        courseId: course.id,
        code: course.code,
        name: course.name,
        department: course.department,
        studentLimit: course.studentLimit,
        teacherName: course.teacher.name,
        enrolledAt: enr.enrolledAt.toISOString(),
        totalSessions,
        attendedSessions: attended,
        attendanceRate: rate,
      };
    });

    const totalLecturesHeld = courseStats.reduce((sum, c) => sum + c.totalSessions, 0);
    const totalLecturesAttended = student.attendance.filter((r) => r.status === "PRESENT").length;
    const overallRate = totalLecturesHeld > 0 ? Math.round((totalLecturesAttended / totalLecturesHeld) * 100) : 100;

    return NextResponse.json(
      {
        success: true,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber || "CS-REG",
          department: student.department || "Computer Science & Engineering",
          createdAt: student.createdAt.toISOString(),
          kycEnrolled: !!student.biometricProfile,
          biometricProfile: student.biometricProfile
            ? {
                qualityScore: student.biometricProfile.qualityScore,
                algorithmVersion: student.biometricProfile.algorithmVersion,
                enrolledAt: student.biometricProfile.enrolledAt.toISOString(),
                templateVectorHash: student.biometricProfile.templateVectorHash,
              }
            : null,
          devices: student.devices,
          overallAttendance: {
            totalLecturesHeld,
            totalLecturesAttended,
            attendanceRate: overallRate,
          },
          courses: courseStats,
          recentRecords: student.attendance.slice(0, 15).map((r) => ({
            id: r.id,
            status: r.status,
            verifiedAt: r.verifiedAt.toISOString(),
            confidence: r.confidence,
            proximityTier: r.proximityTierUsed,
            courseCode: r.session.course.code,
            courseName: r.session.course.name,
            classroom: `${r.session.classroom.name} (${r.session.classroom.roomNumber})`,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/v1/students/profile] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch student profile" }, { status: 500 });
  }
}
