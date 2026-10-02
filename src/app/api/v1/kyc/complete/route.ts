import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken, AUTH_COOKIE_NAME, getAuthUserFromRequest } from "@/lib/auth/jwt";
import { BiometricRepository } from "@/repositories/BiometricRepository";
import { Role } from "@prisma/client";
import { AuthUser } from "@/types/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId: providedStudentId,
      name,
      email,
      password,
      rollNumber,
      department,
      templateVectorHash,
      qualityScore = 0.90,
      algorithmVersion = "browser-mesh-v1",
    } = body;

    if (!templateVectorHash || typeof templateVectorHash !== "string" || templateVectorHash.length < 16) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid biometric face template vector is required for KYC enrollment.",
          code: "FACE_NOT_ENROLLED",
        },
        { status: 400 }
      );
    }

    const authUserFromCookie = await getAuthUserFromRequest(req);
    let targetUserId = providedStudentId || authUserFromCookie?.id;
    let finalAuthUser: AuthUser | null = null;
    let tokenToSet: string | null = null;

    // Case 1: Existing logged-in user or student ID passed
    if (targetUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "User not found with the provided student ID.",
            code: "STUDENT_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      // Update student details if provided
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          name: name ? name.trim() : existingUser.name,
          rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : existingUser.rollNumber,
          department: department ? department.trim() : existingUser.department,
        },
      });

      finalAuthUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        rollNumber: updatedUser.rollNumber,
        department: updatedUser.department,
      };
    } else {
      // Case 2: New Student Registration with immediate KYC
      if (!name || !email || !password) {
        return NextResponse.json(
          {
            success: false,
            error: "Full Name, email, and password are required for student ID creation.",
            code: "INVALID_REQUEST",
          },
          { status: 400 }
        );
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedRollNumber = (rollNumber || `CS-2026-${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase();

      const existingEmail = await prisma.user.findUnique({ where: { email: trimmedEmail } });
      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this institutional email already exists. Please sign in first.",
            code: "EMAIL_EXISTS",
          },
          { status: 409 }
        );
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
          passwordHash,
          role: Role.STUDENT,
          rollNumber: trimmedRollNumber,
          department: department?.trim() || "Computer Science & Engineering",
        },
      });

      targetUserId = newUser.id;
      finalAuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        rollNumber: newUser.rollNumber,
        department: newUser.department,
      };

      tokenToSet = await signAuthToken(finalAuthUser);
    }

    // Auto-enroll student into all courses so they are authorized for attendance
    const allCourses = await prisma.course.findMany({ select: { id: true } });
    if (allCourses.length > 0) {
      await prisma.enrollment.createMany({
        data: allCourses.map(course => ({
          courseId: course.id,
          studentId: targetUserId,
        })),
        skipDuplicates: true,
      });
    }

    // Upsert the biometric profile in the database
    const profile = await BiometricRepository.upsertProfile({
      studentId: targetUserId,
      templateVectorHash,
      qualityScore: Number(Math.max(0.75, qualityScore).toFixed(3)),
      algorithmVersion,
    });

    const response = NextResponse.json(
      {
        success: true,
        kycVerified: true,
        message: "Student ID created and Biometric Face KYC successfully enrolled.",
        user: finalAuthUser,
        profile: {
          id: profile.id,
          studentId: profile.studentId,
          qualityScore: profile.qualityScore,
          algorithmVersion: profile.algorithmVersion,
          templateVectorHash: profile.templateVectorHash,
          enrolledAt: profile.enrolledAt.toISOString(),
        },
      },
      { status: 200 }
    );

    if (tokenToSet) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: tokenToSet,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: unknown) {
    console.error("[POST /api/v1/kyc/complete] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete Student ID & KYC enrollment.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
