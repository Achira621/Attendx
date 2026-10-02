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
  photoUrl?: string | null;
}

export function StudentIdCard({
  user,
  biometricProfile,
  onOpenKycModal,
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900/70 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-zinc-700">
      {/* Decorative university watermark / subtle glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-600/10 blur-3xl" />
      {isVerified && (
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
      )}

      {/* Card Header: Institution & Type */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-300 font-mono">
              Attendex Institute of Technology
            </div>
            <div className="text-[10px] text-zinc-500">Official Student Digital Identity</div>
          </div>
        </div>

        {/* KYC Verification Badge */}
        {isVerified ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>KYC Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
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
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <span className="text-3xl font-bold text-zinc-300">{user.name.charAt(0)}</span>
                <span className="text-[9px] mt-1 text-zinc-500 font-mono">NO PHOTO</span>
              </div>
            )}

            {/* Verification Watermark */}
            {isVerified && (
              <div className="absolute bottom-1 right-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 p-1 text-emerald-400 shadow-xs">
                <ShieldCheck className="h-3 w-3" />
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Batch 2024-2028
            </span>
          </div>
        </div>

        {/* Student Data Fields */}
        <div className="sm:col-span-8 space-y-2 text-left">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Student Name
            </div>
            <div className="text-base font-bold text-white tracking-tight leading-snug">
              {user.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Roll Number / ID
              </div>
              <div className="font-mono font-semibold text-blue-400 text-xs">
                {user.rollNumber || "CS-2026-001"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Status
              </div>
              <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active Enrolled
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Academic Department
            </div>
            <div className="text-xs text-zinc-300 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-zinc-500" />
              {user.department || "Computer Science & Engineering"}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Institutional Email
            </div>
            <div className="text-xs text-zinc-400 font-mono truncate">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Card Footer: Security Barcode & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        {/* Biometric Verification Status */}
        <div className="flex items-center gap-2">
          <Fingerprint
            className={`h-4 w-4 ${isVerified ? "text-emerald-400" : "text-amber-400"}`}
          />
          <div className="text-left">
            <div className="text-zinc-400 font-medium">
              {isVerified ? "Face Vector Hash Enrolled" : "Biometric KYC Not Done"}
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              {isVerified
                ? `${biometricProfile.templateVectorHash?.substring(0, 16)}... • ${enrolledDateDisplay}`
                : "Scan required to mark attendance"}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isVerified ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenKycModal}
              className="text-xs h-7 text-zinc-300 border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Re-scan Face
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenKycModal}
              className="text-xs h-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold w-full sm:w-auto gap-1.5 shadow-md shadow-blue-500/20"
            >
              <ScanFace className="h-3.5 w-3.5" />
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
            <span className="text-blue-400">Acoustic Proximity + Facial KYC</span>
          </div>
        </div>
      )}
    </div>
  );
}
