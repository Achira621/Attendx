import { prisma } from "@/lib/db/prisma";
import { StudentBiometricProfile } from "@prisma/client";

export interface UpsertBiometricProfileParams {
  studentId: string;
  templateVectorHash: string;
  qualityScore: number;
  algorithmVersion?: string;
}

// In-memory cache for enrolled biometric profiles to accelerate attendance processing
const profileCache = new Map<string, { profile: StudentBiometricProfile; cachedAt: number }>();
const PROFILE_CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

export class BiometricRepository {
  /**
   * Upsert student biometric profile
   */
  public static async upsertProfile(params: UpsertBiometricProfileParams): Promise<StudentBiometricProfile> {
    const profile = await prisma.studentBiometricProfile.upsert({
      where: { studentId: params.studentId },
      update: {
        templateVectorHash: params.templateVectorHash,
        qualityScore: params.qualityScore,
        algorithmVersion: params.algorithmVersion || "browser-mesh-v1",
        updatedAt: new Date(),
      },
      create: {
        studentId: params.studentId,
        templateVectorHash: params.templateVectorHash,
        qualityScore: params.qualityScore,
        algorithmVersion: params.algorithmVersion || "browser-mesh-v1",
      },
    });

    profileCache.set(params.studentId, { profile, cachedAt: Date.now() });
    return profile;
  }

  /**
   * Get student biometric profile with fast in-memory caching
   */
  public static async getProfileByStudentId(studentId: string): Promise<StudentBiometricProfile | null> {
    const cached = profileCache.get(studentId);
    if (cached && Date.now() - cached.cachedAt < PROFILE_CACHE_TTL_MS) {
      return cached.profile;
    }

    const profile = await prisma.studentBiometricProfile.findUnique({
      where: { studentId },
    });

    if (profile) {
      profileCache.set(studentId, { profile, cachedAt: Date.now() });
    } else {
      profileCache.delete(studentId);
    }

    return profile;
  }

  /**
   * Delete biometric profile (e.g. privacy / right to be forgotten request)
   */
  public static async deleteProfile(studentId: string): Promise<boolean> {
    try {
      await prisma.studentBiometricProfile.delete({
        where: { studentId },
      });
      profileCache.delete(studentId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate biometric profile cache
   */
  public static invalidateCache(studentId?: string): void {
    if (studentId) {
      profileCache.delete(studentId);
    } else {
      profileCache.clear();
    }
  }
}
