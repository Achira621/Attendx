import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SessionRepository } from "@/repositories/SessionRepository";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { ProximityTier, SessionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const whereClause: Record<string, unknown> = {};
    if (statusParam && Object.values(SessionStatus).includes(statusParam as SessionStatus)) {
      whereClause.status = statusParam;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            department: true,
            _count: {
              select: { enrollments: true },
            },
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            building: true,
          },
        },
        _count: {
          select: { records: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      { success: true, sessions },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/v1/sessions] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sessions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    // If authenticated, ensure teacher or admin role
    if (authUser && authUser.role === "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized. Students cannot create sessions." }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, classroomId, teacherId, proximityTierRequired, durationMinutes } = body;

    const effectiveTeacherId = authUser?.id || teacherId;
    if (!courseId || !classroomId || !effectiveTeacherId) {
      return NextResponse.json(
        { success: false, error: "courseId, classroomId, and teacherId are required." },
        { status: 400 }
      );
    }

    const session = await SessionRepository.createSession({
      courseId,
      classroomId,
      teacherId: effectiveTeacherId,
      proximityTierRequired: (proximityTierRequired as ProximityTier) || ProximityTier.TIER_A,
      durationMinutes: durationMinutes || 15,
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/sessions] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create session." }, { status: 500 });
  }
}
