import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { AuthUser } from "@/types/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Identifier (Email / Roll Number) and Password are required." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    // Query user by email (case-insensitive) OR rollNumber (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmedIdentifier, mode: "insensitive" } },
          { rollNumber: { equals: trimmedIdentifier, mode: "insensitive" } },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your details." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your details." },
        { status: 401 }
      );
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      rollNumber: user.rollNumber,
      department: user.department,
    };

    const token = await signAuthToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token, // Also returned for client convenience (e.g. mobile app or headers)
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
    console.error("[POST /api/v1/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
