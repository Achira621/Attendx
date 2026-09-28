import { NextRequest, NextResponse } from "next/server";
import { BiometricService } from "@/services/BiometricService";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // 1. Rate limiting on enrollment attempts (max 10 enrollments per min per IP)
    const rateCheck = checkRateLimit(`enroll:${clientIp}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many biometric enrollment attempts. Please wait before retrying.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const authUser = await getAuthUserFromRequest(req);
    const body = await req.json();

    // Student can only enroll themselves unless ADMIN
    const targetStudentId = authUser?.role === "ADMIN" && body.studentId ? body.studentId : authUser?.id || body.studentId;

    if (!targetStudentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You must be logged in as a student to enroll biometrics.",
          code: "STUDENT_NOT_AUTHENTICATED",
        },
        { status: 401 }
      );
    }

    const result = await BiometricService.enrollStudent({
      studentId: targetStudentId,
      templateVectorHash: body.templateVectorHash,
      qualityScore: typeof body.qualityScore === "number" ? body.qualityScore : 0.85,
      algorithmVersion: body.algorithmVersion,
    });

    if (!result.success) {
      const status = result.code === "FACE_POOR_QUALITY" ? 422 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error("[POST /api/v1/biometrics/enroll] Internal error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred during enrollment.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
