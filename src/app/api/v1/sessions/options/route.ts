import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);

    // Fetch courses (filtered by teacher if teacher, or all courses for demo/admin)
    const courses = await prisma.course.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { code: "asc" },
    });

    // Fetch classrooms
    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        courses,
        classrooms,
        currentUserId: authUser?.id || null,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/v1/sessions/options] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch session options" }, { status: 500 });
  }
}
