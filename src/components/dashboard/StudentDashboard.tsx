"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StudentAttendanceFlow } from "@/components/verification/StudentAttendanceFlow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  ShieldCheck,
  Radio,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar,
  ScanFace,
  ArrowRight,
  Camera,
} from "lucide-react";
import { StudentIdCard } from "@/components/dashboard/StudentIdCard";
import { StudentIdKycModal } from "@/components/kyc/StudentIdKycModal";

interface ActiveSessionData {
  id: string;
  courseId: string;
  classroomId: string;
  status: string;
  startTime?: string;
  ephemeralSecret: string;
  proximityTierRequired: string;
  course: {
    id: string;
    code: string;
    name: string;
    department: string;
  };
  classroom: {
    id: string;
    name: string;
    roomNumber: string;
    building: string;
    beaconFrequencyHz?: number;
  };
  hasAttended: boolean;
  attendanceRecord?: {
    id: string;
    status: string;
    verifiedAt: string;
    confidence: number;
  } | null;
}

interface BiometricProfileData {
  id: string;
  qualityScore: number;
  algorithmVersion: string;
  templateVectorHash?: string;
  enrolledAt: string;
}

interface AttendanceHistoryRecord {
  id: string;
  status: "PRESENT" | "RETRY_REQUIRED" | "REJECTED" | "BLOCKED" | "SYSTEM_ERROR";
  verifiedAt: string;
  confidence: number;
  proximityTierUsed: string;
  session: {
    course: {
      code: string;
      name: string;
    };
    classroom: {
      name: string;
      roomNumber: string;
    };
  };
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [biometricProfile, setBiometricProfile] = useState<BiometricProfileData | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryRecord[]>([]);
  const [selectedSessionForFlow, setSelectedSessionForFlow] = useState<ActiveSessionData | null>(null);
  const [isVerifyingModalOpen, setIsVerifyingModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (typeof window === "undefined" || !user) return null;
    return (
      localStorage.getItem(`attendex_id_photo_${user.id}`) ||
      (user.rollNumber ? localStorage.getItem(`attendex_id_photo_${user.rollNumber}`) : null)
    );
  });

  const loadPhoto = useCallback(() => {
    if (user && typeof window !== "undefined") {
      const stored =
        localStorage.getItem(`attendex_id_photo_${user.id}`) ||
        (user.rollNumber ? localStorage.getItem(`attendex_id_photo_${user.rollNumber}`) : null);
      setPhotoUrl(stored);
    }
  }, [user]);

  // 1. Fetch active sessions for this student
  const fetchActiveSessions = useCallback(async (isManual = false) => {
    if (!user) return;
    if (isManual) setIsChecking(true);
    try {
      const res = await fetch(`/api/v1/sessions?status=ACTIVE&studentId=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          setActiveSessions(data.sessions);
        }
      }
      setLastCheckedTime(new Date());
    } catch (err) {
      console.error("[StudentDashboard] Error fetching active sessions:", err);
    } finally {
      setLoadingSessions(false);
      if (isManual) setIsChecking(false);
    }
  }, [user]);

  // 2. Fetch student's biometric status
  const fetchBiometricProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/v1/biometrics/profile?studentId=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.kycVerified && data.profile) {
          setBiometricProfile(data.profile);
        } else {
          setBiometricProfile(null);
        }
      }
    } catch (err) {
      console.error("[StudentDashboard] Error fetching biometric profile:", err);
    }
  }, [user]);

  // 3. Fetch recent attendance history
  const fetchAttendanceHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/v1/attendance/records?studentId=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setAttendanceHistory(data.records);
        }
      }
    } catch (err) {
      console.error("[StudentDashboard] Error fetching attendance history:", err);
    }
  }, [user]);

  // Initial load & 5-second polling for active sessions
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (isCancelled) return;
      await fetchActiveSessions(false);
      await fetchBiometricProfile();
      await fetchAttendanceHistory();
    };

    void loadData();

    const interval = setInterval(() => {
      if (!isCancelled) {
        void fetchActiveSessions(false);
      }
    }, 5000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [fetchActiveSessions, fetchBiometricProfile, fetchAttendanceHistory]);

  const handleOpenVerification = (session: ActiveSessionData) => {
    if (!biometricProfile) {
      setIsEnrollModalOpen(true);
      return;
    }
    setSelectedSessionForFlow(session);
    setIsVerifyingModalOpen(true);
  };

  const handleVerificationSuccess = () => {
    setIsVerifyingModalOpen(false);
    setSelectedSessionForFlow(null);
    fetchActiveSessions();
    fetchAttendanceHistory();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Student Institutional Digital ID Card */}
      {user && (
        <StudentIdCard
          user={user}
          biometricProfile={biometricProfile}
          onOpenKycModal={() => setIsEnrollModalOpen(true)}
          photoUrl={photoUrl}
        />
      )}

      {/* Radar Status & Fast Refresh Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-400">Classroom Dual Radar:</span>
          <span className="font-medium text-zinc-200">Listening (16.5 kHz)</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchActiveSessions(true)}
          disabled={isChecking}
          className="h-7 text-xs text-zinc-400 hover:text-zinc-200 gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
          <span>Refresh Sessions</span>
        </Button>
      </div>

      {/* ACTIVE ATTENDANCE SESSIONS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-emerald-400" />
              Active Classroom Sessions
            </h2>
            {activeSessions.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                {activeSessions.length} LIVE NOW
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Updated {lastCheckedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>

        {loadingSessions ? (
          <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/20 text-center animate-pulse space-y-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 mx-auto" />
            <div className="h-4 w-48 bg-zinc-800 rounded mx-auto" />
            <div className="h-3 w-32 bg-zinc-800/60 rounded mx-auto" />
          </div>
        ) : activeSessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeSessions.map((session) => {
              const beaconKhz = session.classroom?.beaconFrequencyHz
                ? `${(session.classroom.beaconFrequencyHz / 1000).toFixed(2)} kHz`
                : "18.75 kHz";

              return (
                <div
                  key={session.id}
                  className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/10 backdrop-blur-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition hover:border-emerald-500/50 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <Badge variant="success" className="text-[10px] tracking-wide uppercase">
                        Attendance In Progress
                      </Badge>
                      <span className="text-xs font-mono text-zinc-400">
                        {session.course.code}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                      {session.course.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                        {session.classroom.name} ({session.classroom.roomNumber})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-blue-400" />
                        Acoustic Beacon: <span className="font-mono text-zinc-300">{beaconKhz}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                        Session: {session.id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {session.hasAttended ? (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>✓ Attendance Recorded</span>
                      </div>
                    ) : (
                      <Button
                        size="md"
                        variant="primary"
                        onClick={() => handleOpenVerification(session)}
                        className="gap-2 shadow-md shadow-blue-600/20 text-xs font-semibold px-4 py-2.5"
                      >
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        Verify & Mark Attendance
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Calm, Linear-style empty state */
          <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/20 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-400">
              <Radio className="h-5 w-5 animate-pulse text-zinc-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">No Active Attendance Sessions</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                Your professors have not started attendance for any enrolled classes yet. When an attendance window opens, it will appear here instantly.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Scanning for classroom ultrasonic beacons...
            </div>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: BIOMETRICS & ATTENDANCE HISTORY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Biometric Profile Status */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <ScanFace className="h-4 w-4 text-blue-400" />
            Biometric Identity
          </h3>

          <Card className="border-zinc-800 bg-zinc-900/30 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Face Profile</span>
              {biometricProfile ? (
                <Badge variant="success" className="text-[10px]">
                  Enrolled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40">
                  Pending
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-zinc-200">On-Device Template</p>
                <p className="text-[11px] text-zinc-400">
                  {biometricProfile
                    ? `Algorithm: ${biometricProfile.algorithmVersion}`
                    : "Not enrolled on this device"}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs space-y-1 text-zinc-400">
              <div className="flex justify-between">
                <span>Quality Score:</span>
                <span className="font-mono text-emerald-400">
                  {biometricProfile ? `${(biometricProfile.qualityScore * 100).toFixed(0)}%` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Privacy Mode:</span>
                <span className="font-mono text-zinc-300">Local Vector Hash</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 leading-tight">
              Raw biometric pixels are never sent or stored on the server. Only quantized vector assertions are verified.
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEnrollModalOpen(true)}
              className="w-full text-xs gap-1.5 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 hover:text-white"
            >
              <Camera className="h-3.5 w-3.5 text-blue-400" />
              {biometricProfile ? "Re-enroll Face Template" : "Enroll Face Template"}
            </Button>
          </Card>
        </div>

        {/* Right Column: Attendance Records History */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Recent Attendance History
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {attendanceHistory.length} Recorded
            </span>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
            {attendanceHistory.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock className="h-6 w-6 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">No attendance records yet.</p>
                <p className="text-[11px] text-zinc-500">
                  Completed verifications will appear here with proof hashes and timestamps.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {attendanceHistory.map((rec) => {
                  const dateStr = new Date(rec.verifiedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
                  const timeStr = new Date(rec.verifiedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={rec.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-zinc-200">
                            {rec.session.course.code}
                          </span>
                          <span className="text-zinc-400 font-normal">
                            {rec.session.course.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                          <span>{rec.session.classroom.name}</span>
                          <span>•</span>
                          <span>{dateStr} at {timeStr}</span>
                          <span>•</span>
                          <span className="text-blue-400">{rec.proximityTierUsed}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusIndicator status={rec.status} />
                        <span className="text-[10px] font-mono text-zinc-500">
                          {(rec.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* FOCUSED ATTENDANCE VERIFICATION MODAL */}
      {isVerifyingModalOpen && selectedSessionForFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
            <StudentAttendanceFlow
              session={{
                id: selectedSessionForFlow.id,
                courseCode: selectedSessionForFlow.course.code,
                courseName: selectedSessionForFlow.course.name,
                classroomName: selectedSessionForFlow.classroom.name,
                roomNumber: selectedSessionForFlow.classroom.roomNumber,
                beaconFrequencyHz: selectedSessionForFlow.classroom.beaconFrequencyHz,
                ephemeralSecret: selectedSessionForFlow.ephemeralSecret,
              }}
              onSuccess={handleVerificationSuccess}
              onCancel={() => {
                setIsVerifyingModalOpen(false);
                setSelectedSessionForFlow(null);
              }}
              onOpenKyc={() => {
                setIsVerifyingModalOpen(false);
                setIsEnrollModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* STUDENT ID & BIOMETRIC FACE KYC MODAL */}
      <StudentIdKycModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => {
          setIsEnrollModalOpen(false);
          fetchBiometricProfile();
          fetchActiveSessions();
          loadPhoto();
        }}
      />
    </div>
  );
}
