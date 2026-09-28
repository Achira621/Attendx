import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { AuthUser } from "@/types/auth";

export const AUTH_COOKIE_NAME = "attendex_auth_token";
const DEFAULT_SECRET = "attendex-super-secure-production-secret-key-2026-fallback-entropy";
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || DEFAULT_SECRET);

export async function signAuthToken(user: AuthUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    rollNumber: user.rollNumber,
    department: user.department,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) || "",
      role: payload.role as AuthUser["role"],
      rollNumber: (payload.rollNumber as string) || null,
      department: (payload.department as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getAuthUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  // 1. Check HTTP-only cookie
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    const user = await verifyAuthToken(cookie.value);
    if (user) return user;
  }

  // 2. Check Authorization Bearer Header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    return await verifyAuthToken(token);
  }

  return null;
}
