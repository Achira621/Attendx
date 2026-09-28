import { NextRequest, NextResponse } from "next/server";
import { AttendanceEngine } from "@/services/AttendanceEngine";
import { AttendancePayload } from "@/types/verification";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // 1. IP Rate Limiting (max 30 requests per minute per IP to prevent spamming verification attempts)
    const ipLimit = checkRateLimit(`submit_ip:${clientIp}`, 30, 60000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          outcome: "BLOCKED",
          failure: {
            code: "RATE_LIMITED",
            userMessage: "Too many verification requests. Please wait a moment before trying again.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(ipLimit.resetMs / 1000).toString(),
          },
        }
      );
    }

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

    // 2. Student Rate Limiting (max 5 attendance attempts per minute per student)
    const studentLimit = checkRateLimit(`submit_student:${body.studentId}`, 5, 60000);
    if (!studentLimit.allowed) {
      return NextResponse.json(
        {
          outcome: "BLOCKED",
          failure: {
            code: "RATE_LIMITED",
            userMessage: "Too many attempts for this account. Please wait 60 seconds.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(studentLimit.resetMs / 1000).toString(),
          },
        }
      );
    }

    const result = await AttendanceEngine.processAttendanceSubmission(body, clientIp);
    const durationMs = Math.round(performance.now() - startTime);

    const headers = {
      "Server-Timing": `total;dur=${durationMs}`,
      "X-Attempt-ID": result.attemptId,
    };

    if (result.outcome === "ACCEPTED") {
      return NextResponse.json(result, { status: 200, headers });
    } else if (result.outcome === "BLOCKED") {
      return NextResponse.json(result, { status: 403, headers });
    } else if (result.outcome === "SYSTEM_ERROR") {
      return NextResponse.json(result, { status: 503, headers });
    } else {
      return NextResponse.json(result, { status: 422, headers });
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
