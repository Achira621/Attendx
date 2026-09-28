import { NextRequest, NextResponse } from "next/server";
import { BiometricService } from "@/services/BiometricService";
import { FaceProof } from "@/types/verification";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, faceProof } = body as { studentId: string; faceProof: FaceProof };

    if (!studentId || !faceProof) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing studentId or faceProof in request body.",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    const matchResult = await BiometricService.verifyFaceMatch(studentId, faceProof);

    return NextResponse.json(
      {
        success: matchResult.matched,
        matched: matchResult.matched,
        confidence: matchResult.confidence,
        failureReason: matchResult.failureReason,
      },
      { status: matchResult.matched ? 200 : 422 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/v1/biometrics/verify] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during face verification.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
