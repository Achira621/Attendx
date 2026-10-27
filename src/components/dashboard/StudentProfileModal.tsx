"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";
import { downloadCsv } from "@/lib/exportCsv";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Download,
  X,
} from "lucide-react";

export interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  createdAt: string;
  kycEnrolled: boolean;
  biometricProfile: {
    qualityScore: number;
    algorithmVersion: string;
    enrolledAt: string;
    templateVectorHash?: string;
  } | null;
  devices: Array<{
    deviceId: string;
    deviceModel: string | null;
    isTrusted: boolean;
    registeredAt: string;
  }>;
  overallAttendance: {
    totalLecturesHeld: number;
    totalLecturesAttended: number;
    attendanceRate: number;
  };
  courses: Array<{
    courseId: string;
    code: string;
    name: string;
    department: string;
    studentLimit: number;
    teacherName: string;
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
  }>;
  recentRecords: Array<{
    id: string;
    status: string;
    verifiedAt: string;
    confidence: number;
    proximityTier: string;
    courseCode: string;
    courseName: string;
    classroom: string;
  }>;
}

export interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  photoUrl?: string | null;
}

export function StudentProfileModal({
  isOpen,
  onClose,
  studentId,
  photoUrl,
}: StudentProfileModalProps) {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/students/profile?studentId=${encodeURIComponent(studentId)}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.student) {
            setProfile(data.student);
          }
        }
      } catch (err) {
        console.error("[StudentProfileModal] Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const handleExportPersonalCsv = () => {
    if (!profile) return;

    const headers = [
      "Student ID",
      "Roll Number",
      "Name",
      "Course Code",
      "Course Name",
      "Classroom",
      "Verification Timestamp",
      "Status",
      "Proximity Tier",
      "Confidence %",
    ];

    const rows = profile.recentRecords.map((r) => [
      profile.id,
      profile.rollNumber,
      profile.name,
      r.courseCode,
      r.courseName,
      r.classroom,
      new Date(r.verifiedAt).toLocaleString(),
      r.status,
      r.proximityTier,
      `${Math.round(r.confidence * 100)}%`,
    ]);

    downloadCsv(`MyAttendanceTranscript_${profile.rollNumber}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-left max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Student" className="h-full w-full object-cover -scale-x-100" />
              ) : (
                <GraduationCap className="h-6 w-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{profile?.name || "Student Profile"}</h3>
                <Badge variant="outline" className="font-mono text-[10px] text-slate-200">
                  {profile?.rollNumber || "CS-2026"}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {profile?.department || "Computer Science & Engineering"} • Attendex Digital ID
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile && profile.recentRecords.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPersonalCsv}
                className="text-xs gap-1.5 h-8 text-slate-200 hover:text-white border-zinc-700 bg-zinc-800/80"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                Export CSV
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <LoadingAnimation
              size="md"
              message="Loading Student Record"
              submessage="Decrypting verified attendance records & biometrics..."
            />
          </div>
        ) : profile ? (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-zinc-800 bg-zinc-950 p-3 text-center">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-mono font-semibold">Overall Attendance</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {profile.overallAttendance.attendanceRate}%
                </div>
              </Card>

              <Card className="border-zinc-800 bg-zinc-950 p-3 text-center">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-mono font-semibold">Lectures Attended</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {profile.overallAttendance.totalLecturesAttended} / {profile.overallAttendance.totalLecturesHeld}
                </div>
              </Card>

              <Card className="border-zinc-800 bg-zinc-950 p-3 text-center">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-mono font-semibold">KYC Biometrics</span>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {profile.kycEnrolled ? (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Enrolled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/40">
                      Pending
                    </Badge>
                  )}
                </div>
              </Card>
            </div>

            {/* Enrolled Courses & Attendance Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                Enrolled Courses & Standing ({profile.courses.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.courses.map((c) => (
                  <div
                    key={c.courseId}
                    className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{c.code}</span>
                      <span className="font-mono font-semibold text-emerald-400">{c.attendanceRate}%</span>
                    </div>
                    <div className="text-white font-medium truncate">{c.name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium pt-1 border-t border-zinc-800/60">
                      <span>Faculty: {c.teacherName}</span>
                      <span>{c.attendedSessions}/{c.totalSessions} Lectures</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Biometric & Identity Credentials */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Biometric KYC Privacy Assertions
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200 font-mono">
                <div>
                  <span className="text-slate-400">Quality Score: </span>
                  <span className="text-white font-semibold">
                    {profile.biometricProfile ? `${Math.round(profile.biometricProfile.qualityScore * 100)}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Engine: </span>
                  <span className="text-white font-medium">{profile.biometricProfile?.algorithmVersion || "browser-mesh-v1"}</span>
                </div>
                <div className="col-span-2 truncate">
                  <span className="text-slate-400">Hash: </span>
                  <span className="text-slate-300 text-[10px]">{profile.biometricProfile?.templateVectorHash || "Local hash only"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Official Institutional Identity Verification Record</span>
          <Button variant="secondary" size="sm" onClick={onClose} className="h-7 text-xs px-3">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
