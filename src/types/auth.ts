import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  rollNumber?: string | null;
  department?: string | null;
}

export interface LoginCredentials {
  identifier: string; // email or rollNumber
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}
