"use client";

import React, { useState } from "react";
import { AuthUser } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ScanFace,
  QrCode,
  GraduationCap,
  RefreshCw,
  Fingerprint,
  Building2,
  CheckCircle2,
  AlertTriangle,
  User,
} from "lucide-react";

export interface StudentIdCardProps {
  user: AuthUser;
  biometricProfile: {
    id: string;
    qualityScore: number;
    algorithmVersion: string;
    templateVectorHash?: string;
    enrolledAt?: string;
  } | null;
  onOpenKycModal: () => void;
  onOpenProfileModal?: () => void;
  photoUrl?: string | null;
}

export function StudentIdCard({
  user,
  biometricProfile,
  onOpenKycModal,
  onOpenProfileModal,
  photoUrl,
}: StudentIdCardProps) {
  const [showTechSpecs, setShowTechSpecs] = useState(false);

  const isVerified =
    !!biometricProfile &&
    !!biometricProfile.templateVectorHash &&
    !biometricProfile.templateVectorHash.startsWith("mock_") &&
    !biometricProfile.templateVectorHash.startsWith("sha256_mock");

  const enrolledDateDisplay = biometricProfile?.enrolledAt
    ? new Date(biometricProfile.enrolledAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not Yet Enrolled";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-md backdrop-blur-md transition-all hover:border-[#7C3AED]/40">
      {/* Decorative brand watermark glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-[#7C3AED]/10 to-[#FF7A59]/10 blur-3xl" />
      {isVerified && (
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
      )}

      {/* Card Header: Institution & Type */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-[#7C3AED]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-slate-800 dark:text-slate-100 font-mono">
              VIT University • Attendex Campus
            </div>
            <div className="text-xs font-medium text-slate-300 dark:text-slate-300">Official Student Digital Identity</div>
          </div>
        </div>

        {/* KYC Verification Badge */}
        {isVerified ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>KYC Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>KYC Pending</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Student Photo / Portrait */}
        <div className="sm:col-span-4 flex flex-col items-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-xl border-2 border-zinc-700 bg-zinc-950 shadow-inner flex items-center justify-center group">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={user.name}
                className="h-full w-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <span className="text-3xl font-bold text-white">{user.name.charAt(0)}</span>
                <span className="text-xs mt-1 text-slate-300 font-mono font-medium">NO PHOTO</span>
              </div>
            )}

            {/* Verification Watermark */}
            {isVerified && (
              <div className="absolute bottom-1 right-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 p-1 text-emerald-400 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
              Batch 2024-2028
            </span>
          </div>
        </div>

        {/* Student Data Fields */}
        <div className="sm:col-span-8 space-y-2.5 text-left">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Student Name
            </div>
            <div className="text-lg font-extrabold text-white tracking-tight leading-snug">
              {user.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Roll Number / ID
              </div>
              <div className="font-mono font-bold text-white text-sm">
                {user.rollNumber || "CS-2026-001"}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Status
              </div>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Active Enrolled
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Academic Department
            </div>
            <div className="text-sm text-slate-100 font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-purple-400" />
              {user.department || "Computer Science & Engineering"}
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Institutional Email
            </div>
            <div className="text-sm text-slate-200 font-mono font-medium truncate">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Card Footer: Security Barcode & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Biometric Verification Status */}
        <div className="flex items-center gap-2">
          <Fingerprint
            className={`h-4 w-4 ${isVerified ? "text-emerald-400" : "text-amber-400"}`}
          />
          <div className="text-left">
            <div className="text-slate-200 font-semibold text-xs sm:text-sm">
              {isVerified ? "Face Vector Hash Enrolled" : "Biometric KYC Not Done"}
            </div>
            <div className="text-xs font-mono text-slate-300 font-medium">
              {isVerified
                ? `${biometricProfile.templateVectorHash?.substring(0, 16)}... • ${enrolledDateDisplay}`
                : "Scan required to mark attendance"}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onOpenProfileModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenProfileModal}
              className="text-xs sm:text-sm text-slate-200 font-semibold border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-amber-400" />
              Academic Profile
            </Button>
          )}

          {isVerified ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenKycModal}
              className="text-xs sm:text-sm text-slate-200 font-semibold border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-scan Face
            </Button>
          ) : (
            <Button
              size="sm"
              variant="brand"
              onClick={onOpenKycModal}
              className="text-xs sm:text-sm font-semibold w-full sm:w-auto gap-1.5 shadow-sm"
            >
              <ScanFace className="h-4 w-4" />
              Complete Face KYC Now
            </Button>
          )}

          <button
            onClick={() => setShowTechSpecs(!showTechSpecs)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition"
            title="Toggle cryptographic spec details"
          >
            <QrCode className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Technical Specs & Cryptographic Proof */}
      {showTechSpecs && (
        <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 space-y-1 animate-in fade-in duration-150">
          <div className="flex justify-between">
            <span>Algorithm:</span>
            <span className="text-zinc-200">{biometricProfile?.algorithmVersion || "browser-mesh-v1"}</span>
          </div>
          <div className="flex justify-between">
            <span>Template Quality:</span>
            <span className="text-emerald-400">
              {biometricProfile ? `${(biometricProfile.qualityScore * 100).toFixed(0)}%` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Full Hash:</span>
            <span className="text-zinc-300 truncate max-w-[200px]">
              {biometricProfile?.templateVectorHash || "NONE"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Dual-Presence:</span>
            <span className="text-amber-400 font-medium">Acoustic Proximity + Facial KYC</span>
          </div>
        </div>
      )}
    </div>
  );
}
