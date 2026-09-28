import { NextRequest, NextResponse } from "next/server";
import { AttendanceEngine } from "@/services/AttendanceEngine";
import { AttendancePayload } from "@/types/verification";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AttendancePayload;

    if (!body || !body.sessionId || !body.studentId) {
      return NextResponse.json(
        {
          outcome: "REJECTED",
          failure: {
            code: "INVALID_REQUEST",
            userMessage: "Missing required attendance payload parameters.",
          },
        },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const result = await AttendanceEngine.processAttendanceSubmission(body, clientIp);

    if (result.outcome === "ACCEPTED") {
      return NextResponse.json(result, { status: 200 });
    } else if (result.outcome === "BLOCKED") {
      return NextResponse.json(result, { status: 403 });
    } else if (result.outcome === "SYSTEM_ERROR") {
      return NextResponse.json(result, { status: 503 });
    } else {
      return NextResponse.json(result, { status: 422 });
    }
  } catch (err: unknown) {
    console.error("[POST /api/v1/attendance/submit] Error:", err);
    return NextResponse.json(
      {
        outcome: "SYSTEM_ERROR",
        failure: {
          code: "INTERNAL_ERROR",
          userMessage: "Internal server error occurred.",
        },
      },
      { status: 500 }
    );
  }
}
