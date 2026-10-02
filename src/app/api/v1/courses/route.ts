import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const teacherIdParam = searchParams.get("teacherId");

    const effectiveTeacherId = teacherIdParam || (authUser?.role === "TEACHER" ? authUser.id : undefined);

    const whereClause: Record<string, unknown> = {};
    if (effectiveTeacherId) {
      whereClause.teacherId = effectiveTeacherId;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
        sessions: {
          select: {
            id: true,
            status: true,
            startTime: true,
            createdAt: true,
            _count: {
              select: { records: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        count: courses.length,
        courses,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/v1/courses] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    const body = await req.json();
    const { code, name, department, studentLimit, teacherId } = body;

    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Course code is required (e.g. CS-401)." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Course name is required (e.g. Advanced Operating Systems)." },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedDept = department?.trim() || "Computer Science & Engineering";
    const limitNum = typeof studentLimit === "number" ? studentLimit : parseInt(studentLimit, 10);
    const finalLimit = isNaN(limitNum) || limitNum <= 0 ? 60 : limitNum;

    // Verify course code uniqueness
    const existing = await prisma.course.findUnique({
      where: { code: trimmedCode },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Course code ${trimmedCode} already exists.` },
        { status: 409 }
      );
    }

    // Determine target teacher
    let effectiveTeacherId = teacherId || authUser?.id;
    if (!effectiveTeacherId) {
      const defaultTeacher = await prisma.user.findFirst({
        where: { role: "TEACHER" },
      });
      effectiveTeacherId = defaultTeacher?.id;
    }

    if (!effectiveTeacherId) {
      return NextResponse.json(
        { success: false, error: "Valid faculty/teacher account required to create a course." },
        { status: 400 }
      );
    }

    const newCourse = await prisma.course.create({
      data: {
        code: trimmedCode,
        name: trimmedName,
        department: trimmedDept,
        studentLimit: finalLimit,
        teacherId: effectiveTeacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Auto-enroll all active students in the database into this newly created course
    // so students can immediately test attendance in it without manual enrollment steps
    const allStudents = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });

    if (allStudents.length > 0) {
      await prisma.$transaction(
        allStudents.map((st) =>
          prisma.enrollment.upsert({
            where: {
              courseId_studentId: {
                courseId: newCourse.id,
                studentId: st.id,
              },
            },
            create: {
              courseId: newCourse.id,
              studentId: st.id,
            },
            update: {},
          })
        )
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Course ${newCourse.code} created successfully and saved to your profile.`,
        course: newCourse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/v1/courses] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create course. Please try again." },
      { status: 500 }
    );
  }
}
