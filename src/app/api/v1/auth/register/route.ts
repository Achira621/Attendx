import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { AuthUser } from "@/types/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role = "STUDENT", rollNumber, department } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Full Name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid institutional email is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedRollNumber = rollNumber ? rollNumber.trim().toUpperCase() : null;
    const assignedRole = role === "TEACHER" ? Role.TEACHER : Role.STUDENT;

    if (assignedRole === Role.STUDENT && !trimmedRollNumber) {
      return NextResponse.json(
        { success: false, error: "Student roll number is required (e.g. CS-2026-005)." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Check if rollNumber already exists
    if (trimmedRollNumber) {
      const existingRoll = await prisma.user.findUnique({
        where: { rollNumber: trimmedRollNumber },
      });
      if (existingRoll) {
        return NextResponse.json(
          { success: false, error: `Roll number ${trimmedRollNumber} is already registered.` },
          { status: 409 }
        );
      }
    }

    // Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role: assignedRole,
        rollNumber: trimmedRollNumber,
        department: department?.trim() || "Computer Science & Engineering",
      },
    });

    // If student, automatically enroll them in the primary course (e.g. CS-302)
    if (assignedRole === Role.STUDENT) {
      const defaultCourse = await prisma.course.findFirst({
        where: { code: "CS-302" },
      });

      if (defaultCourse) {
        await prisma.enrollment.create({
          data: {
            courseId: defaultCourse.id,
            studentId: newUser.id,
          },
        }).catch((err) => {
          console.warn("[Register] Course enrollment note:", err.message);
        });
      }
    }

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      rollNumber: newUser.rollNumber,
      department: newUser.department,
    };

    const token = await signAuthToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
      message: "Account created successfully.",
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[POST /api/v1/auth/register] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
