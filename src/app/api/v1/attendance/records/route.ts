import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/AttendanceRepository";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const studentId = searchParams.get("studentId");

    if (sessionId) {
      const records = await AttendanceRepository.getSessionRecords(sessionId);
      return NextResponse.json(
        { success: true, count: records.length, records },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    if (studentId) {
      const records = await AttendanceRepository.getStudentRecords(studentId);
      return NextResponse.json(
        { success: true, count: records.length, records },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    return NextResponse.json({ success: false, error: "Missing sessionId or studentId parameter" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/v1/attendance/records] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attendance records" }, { status: 500 });
  }
}
