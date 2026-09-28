import { NextRequest, NextResponse } from "next/server";
import { BiometricService } from "@/services/BiometricService";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const queryStudentId = searchParams.get("studentId");

    // Student can view their own profile, Teacher/Admin can view enrolled student profile
    const studentId =
      authUser?.role === "TEACHER" || authUser?.role === "ADMIN"
        ? queryStudentId || authUser.id
        : authUser?.id || queryStudentId;

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required or missing studentId parameter.",
          code: "STUDENT_NOT_AUTHENTICATED",
        },
        { status: 401 }
      );
    }

    const profile = await BiometricService.getProfile(studentId);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          enrolled: false,
          error: "No biometric profile enrolled for this student.",
          code: "FACE_NOT_ENROLLED",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        enrolled: true,
        profile: {
          id: profile.id,
          studentId: profile.studentId,
          qualityScore: profile.qualityScore,
          algorithmVersion: profile.algorithmVersion,
          templateVectorHash: profile.templateVectorHash,
          enrolledAt: profile.enrolledAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60", // Short edge cache for profile
        },
      }
    );
  } catch (err: unknown) {
    console.error("[GET /api/v1/biometrics/profile] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error retrieving biometric profile.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
