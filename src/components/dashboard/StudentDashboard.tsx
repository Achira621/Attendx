"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { StudentProfileModal } from "@/components/dashboard/StudentProfileModal";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
      const res = await fetch(
        `/api/v1/sessions?status=ACTIVE&studentId=${encodeURIComponent(user.id)}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
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
      const res = await fetch(`/api/v1/biometrics/profile?studentId=${encodeURIComponent(user.id)}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
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
      const res = await fetch(
        `/api/v1/attendance/records?studentId=${encodeURIComponent(user.id)}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
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

  const isVerifyingModalOpenRef = useRef(isVerifyingModalOpen);
  useEffect(() => {
    isVerifyingModalOpenRef.current = isVerifyingModalOpen;
  }, [isVerifyingModalOpen]);

  // Initial load & 4-second polling for active sessions (paused while verifying)
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
      if (!isCancelled && !isVerifyingModalOpenRef.current) {
        void fetchActiveSessions(false);
      }
    }, 4000);

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

  const handleAttendanceRecorded = useCallback(
    (recordResult: { attendanceId?: string; verifiedAt?: string }) => {
      if (selectedSessionForFlow) {
        setActiveSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSessionForFlow.id
              ? {
                  ...s,
                  hasAttended: true,
                  attendanceRecord: {
                    id: recordResult.attendanceId || "rec_live",
                    status: "PRESENT",
                    verifiedAt: recordResult.verifiedAt || new Date().toISOString(),
                    confidence: 0.95,
                  },
                }
              : s
          )
        );
      }
      void fetchActiveSessions(false);
      void fetchAttendanceHistory();
    },
    [selectedSessionForFlow, fetchActiveSessions, fetchAttendanceHistory]
  );

  const handleVerificationSuccess = () => {
    if (selectedSessionForFlow) {
      setActiveSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionForFlow.id
            ? {
                ...s,
                hasAttended: true,
                attendanceRecord: {
                  id: "rec_live",
                  status: "PRESENT",
                  verifiedAt: new Date().toISOString(),
                  confidence: 0.95,
                },
              }
            : s
        )
      );
    }
    setIsVerifyingModalOpen(false);
    setSelectedSessionForFlow(null);
    void fetchActiveSessions(true);
    void fetchAttendanceHistory();
  };

  const memoizedFlowSession = useMemo(() => {
    if (!selectedSessionForFlow) return undefined;
    return {
      id: selectedSessionForFlow.id,
      courseCode: selectedSessionForFlow.course.code,
      courseName: selectedSessionForFlow.course.name,
      classroomName: selectedSessionForFlow.classroom.name,
      roomNumber: selectedSessionForFlow.classroom.roomNumber,
      beaconFrequencyHz: selectedSessionForFlow.classroom.beaconFrequencyHz,
      ephemeralSecret: selectedSessionForFlow.ephemeralSecret,
    };
  }, [selectedSessionForFlow]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Student Institutional Digital ID Card */}
      {user && (
        <StudentIdCard
          user={user}
          biometricProfile={biometricProfile}
          onOpenKycModal={() => setIsEnrollModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          photoUrl={photoUrl}
        />
      )}

      {/* Radar Status & Fast Refresh Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-medium">Classroom Dual Radar:</span>
          <span className="font-semibold text-white">Listening (16.5 kHz)</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchActiveSessions(true)}
          disabled={isChecking}
          className="h-7 text-xs text-slate-300 hover:text-white gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
          <span>Refresh Sessions</span>
        </Button>
      </div>

      {/* ACTIVE ATTENDANCE SESSIONS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-emerald-400" />
              Active Classroom Sessions
            </h2>
            {activeSessions.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 font-semibold">
                {activeSessions.length} LIVE NOW
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-300 font-mono font-medium">
            Updated {lastCheckedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>

        {loadingSessions ? (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-center">
            <LoadingAnimation
              size="md"
              message="Scanning Classroom Proximity Channels"
              submessage="Searching for acoustic lecture beacons & scheduled sessions..."
            />
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
                      <Badge variant="success" className="text-xs tracking-wide uppercase font-semibold">
                        Attendance In Progress
                      </Badge>
                      <span className="text-sm font-mono text-slate-200 font-bold">
                        {session.course.code}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {session.course.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        {session.classroom.name} ({session.classroom.roomNumber})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-amber-400" />
                        Acoustic Beacon: <span className="font-mono text-amber-300 font-bold">{beaconKhz}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-xs text-slate-300 font-semibold">
                        Session: {session.id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {session.hasAttended ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>✓ Attendance Recorded</span>
                      </div>
                    ) : (
                      <Button
                        size="md"
                        variant="brand"
                        onClick={() => handleOpenVerification(session)}
                        className="gap-2 shadow-xs text-sm font-bold px-5 py-3"
                      >
                        <Sparkles className="h-4 w-4 text-zinc-950" />
                        Verify & Mark Attendance
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Calm, Linear-style empty state */
          <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-amber-400">
              <Radio className="h-5 w-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Active Attendance Sessions</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                Your professors have not started attendance for any enrolled classes yet. When an attendance window opens, it will appear here instantly.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-slate-300 font-medium">
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
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ScanFace className="h-4 w-4 text-amber-400" />
            Biometric Identity
          </h3>

          <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Face Profile</span>
              {biometricProfile ? (
                <Badge variant="success" className="text-[10px]">
                  Enrolled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/40">
                  Pending
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">On-Device Template</p>
                <p className="text-[11px] text-slate-300">
                  {biometricProfile
                    ? `Algorithm: ${biometricProfile.algorithmVersion}`
                    : "Not enrolled on this device"}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs space-y-1 text-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-300">Quality Score:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {biometricProfile ? `${(biometricProfile.qualityScore * 100).toFixed(0)}%` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Privacy Mode:</span>
                <span className="font-mono text-white font-medium">Local Vector Hash</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-tight">
              Raw biometric pixels are never sent or stored on the server. Only quantized vector assertions are verified.
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEnrollModalOpen(true)}
              className="w-full text-xs gap-1.5 border-zinc-700 bg-zinc-800/80 text-white hover:bg-zinc-700 hover:text-white"
            >
              <Camera className="h-3.5 w-3.5 text-zinc-300" />
              {biometricProfile ? "Re-enroll Face Template" : "Enroll Face Template"}
            </Button>
          </Card>
        </div>

        {/* Right Column: Attendance Records History */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Recent Attendance History
            </h3>
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {attendanceHistory.length} Recorded
            </span>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/60 overflow-hidden">
            {attendanceHistory.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock className="h-7 w-7 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-200 font-medium">No attendance records yet.</p>
                <p className="text-xs text-slate-400">
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
                    <div key={rec.id} className="p-4 flex items-center justify-between gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-white text-sm">
                            {rec.session.course.code}
                          </span>
                          <span className="text-slate-200 font-medium text-sm">
                            {rec.session.course.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span className="text-slate-300 font-medium">{rec.session.classroom.name}</span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">{dateStr} at {timeStr}</span>
                          <span>•</span>
                          <span className="text-amber-300 font-mono font-semibold">{rec.proximityTierUsed}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusIndicator status={rec.status} />
                        <span className="text-xs font-mono text-slate-200 font-bold">
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
              session={memoizedFlowSession}
              onSuccess={handleVerificationSuccess}
              onAttendanceRecorded={handleAttendanceRecorded}
              onCancel={() => {
                setIsVerifyingModalOpen(false);
                setSelectedSessionForFlow(null);
                void fetchActiveSessions(true);
                void fetchAttendanceHistory();
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

      {/* STUDENT INSTITUTIONAL ACADEMIC PROFILE & ATTENDANCE RECORD MODAL */}
      {user && (
        <StudentProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          studentId={user.id}
          photoUrl={photoUrl}
        />
      )}
    </div>
  );
}
