import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/AttendanceRepository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId parameter" }, { status: 400 });
    }

    const records = await AttendanceRepository.getSessionRecords(sessionId);
    return NextResponse.json({ success: true, count: records.length, records });
  } catch (error) {
    console.error("[GET /api/v1/attendance/records] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attendance records" }, { status: 500 });
  }
}
