"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AcousticEmitter } from "@/lib/verification/acoustic/acousticEngine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator, AttendanceStatusType } from "@/components/ui/status-indicator";
import { useAuth } from "@/context/AuthContext";
import {
  Volume2,
  Square,
  Users,
  Search,
  Clock,
  Radio,
  MapPin,
  Sparkles,
  Plus,
  Play,
  XCircle,
  RefreshCw,
  X,
} from "lucide-react";

interface CourseOption {
  id: string;
  code: string;
  name: string;
  department: string;
  _count?: { enrollments: number };
}

interface ClassroomOption {
  id: string;
  name: string;
  building: string;
  roomNumber: string;
  beaconFrequencyHz: number;
}

interface StudentRosterItem {
  id: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatusType;
  verifiedAt?: string;
  method?: string;
  confidence?: number;
}

interface ActiveSessionDetails {
  id: string;
  courseId: string;
  classroomId: string;
  teacherId: string;
  status: "CREATED" | "ACTIVE" | "GRACE_PERIOD" | "CLOSED" | "ARCHIVED";
  startTime?: string;
  endTime?: string;
  graceEndTime?: string;
  ephemeralSecret: string;
  proximityTierRequired: "TIER_A" | "TIER_B" | "TIER_C";
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
    beaconFrequencyHz: number;
  };
  enrolledStudents?: {
    id: string;
    name: string;
    rollNumber: string;
  }[];
  records?: {
    id: string;
    studentId: string;
    status: string;
    verifiedAt: string;
    confidence: number;
    proximityTierUsed: string;
  }[];
}

export function TeacherLiveSessionConsole() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSessionDetails | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedProximityTier, setSelectedProximityTier] = useState<"TIER_A" | "TIER_B" | "TIER_C">("TIER_A");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Session Console State
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [beaconEmitting, setBeaconEmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const emitterRef = useRef<AcousticEmitter | null>(null);

  // 1. Fetch available options for session creation
  const fetchSessionOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/sessions/options");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCourses(data.courses || []);
          setClassrooms(data.classrooms || []);
          if (data.courses?.length > 0 && !selectedCourseId) {
            setSelectedCourseId(data.courses[0].id);
          }
          if (data.classrooms?.length > 0 && !selectedClassroomId) {
            setSelectedClassroomId(data.classrooms[0].id);
          }
        }
      }
    } catch (err) {
      console.error("[TeacherLiveSessionConsole] Failed to load options:", err);
    }
  }, [selectedCourseId, selectedClassroomId]);

  // 2. Fetch all sessions to find active or recent ones
  const fetchSessions = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/sessions");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          // Look for an ACTIVE or GRACE_PERIOD session
          const currentActive = data.sessions.find(
            (s: ActiveSessionDetails) => s.status === "ACTIVE" || s.status === "GRACE_PERIOD"
          );
          if (currentActive) {
            setActiveSession(currentActive);
          } else if (data.sessions.length > 0) {
            setActiveSession((prev) => prev || data.sessions[0]);
          }
        }
      }
    } catch (err) {
      console.error("[TeacherLiveSessionConsole] Failed to load sessions:", err);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // 3. Fetch detailed roster & records for the selected active session
  const fetchSessionRoster = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          const s = data.session;
          setActiveSession(s);

          // Build unified roster from enrolled students & attendance records
          const enrolled = s.course?.enrollments?.map((e: { student: { id: string; name: string; rollNumber: string } }) => e.student) || [];
          const recordsMap = new Map<string, { status: string; verifiedAt: string; confidence: number; proximityTierUsed: string }>();

          if (Array.isArray(s.records)) {
            s.records.forEach((r: { studentId: string; status: string; verifiedAt: string; confidence: number; proximityTierUsed: string }) => {
              recordsMap.set(r.studentId, r);
            });
          }

          const rosterList: StudentRosterItem[] = enrolled.map((st: { id: string; name: string; rollNumber: string }) => {
            const rec = recordsMap.get(st.id);
            if (rec) {
              const dateObj = new Date(rec.verifiedAt);
              const timeStr = isNaN(dateObj.getTime())
                ? "Just now"
                : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

              return {
                id: st.id,
                name: st.name,
                rollNumber: st.rollNumber || "CS-REG",
                status: "PRESENT" as AttendanceStatusType,
                verifiedAt: timeStr,
                method: `${rec.proximityTierUsed} + Face Mesh`,
                confidence: rec.confidence || 0.95,
              };
            }
            return {
              id: st.id,
              name: st.name,
              rollNumber: st.rollNumber || "CS-REG",
              status: "NOT_MARKED" as AttendanceStatusType,
            };
          });

          setStudents(rosterList);
        }
      }
    } catch (err) {
      console.error("[TeacherLiveSessionConsole] Error fetching roster:", err);
    }
  }, []);

  // Poll session roster every 3 seconds if session is active
  useEffect(() => {
    const currentId = activeSession?.id;
    const currentStatus = activeSession?.status;
    if (!currentId || (currentStatus !== "ACTIVE" && currentStatus !== "GRACE_PERIOD")) return;

    let isCancelled = false;
    const syncRoster = async () => {
      if (!isCancelled) {
        await fetchSessionRoster(currentId);
      }
    };
    void syncRoster();

    const pollTimer = setInterval(() => {
      if (!isCancelled) {
        void fetchSessionRoster(currentId);
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(pollTimer);
    };
  }, [activeSession?.id, activeSession?.status, fetchSessionRoster]);

  // Initial mount
  useEffect(() => {
    let isCancelled = false;
    const init = async () => {
      if (!isCancelled) {
        await fetchSessionOptions();
        await fetchSessions(false);
      }
    };
    void init();
    return () => {
      isCancelled = true;
    };
  }, [fetchSessionOptions, fetchSessions]);

  // Session elapsed timer
  useEffect(() => {
    if (!activeSession || activeSession.status !== "ACTIVE") return;
    const startTs = activeSession.startTime ? new Date(activeSession.startTime).getTime() : Date.now();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTs) / 1000)));
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  // Hardware cleanup
  useEffect(() => {
    return () => {
      if (emitterRef.current) {
        emitterRef.current.stop();
        emitterRef.current = null;
      }
    };
  }, []);

  // Acoustic Emitter toggle
  const handleToggleBeacon = async () => {
    if (!beaconEmitting) {
      try {
        const freq = activeSession?.classroom?.beaconFrequencyHz || 18750;
        const token = activeSession?.ephemeralSecret || "CS302-LIVE-BEACON";
        emitterRef.current = new AcousticEmitter({
          frequency: freq,
          pulseDurationMs: 800,
          intervalMs: 1500,
          mode: "ultrasonic",
          token,
        });
        await emitterRef.current.start();
        setBeaconEmitting(true);
      } catch (err: unknown) {
        alert("Failed to activate acoustic emitter: " + (err as Error).message);
      }
    } else {
      if (emitterRef.current) {
        emitterRef.current.stop();
        emitterRef.current = null;
      }
      setBeaconEmitting(false);
    }
  };

  // Create & Start New Session
  const handleCreateAndStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedClassroomId) {
      setCreateError("Please select both a course and a classroom.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      // 1. Create Session
      const createRes = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          classroomId: selectedClassroomId,
          teacherId: user?.id,
          proximityTierRequired: selectedProximityTier,
          durationMinutes,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success || !createData.session) {
        throw new Error(createData.error || "Failed to create session record.");
      }

      const newSessionId = createData.session.id;

      // 2. Immediately start session (transition CREATED -> ACTIVE)
      const startRes = await fetch(`/api/v1/sessions/${newSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.success) {
        throw new Error(startData.error || "Session created but failed to start.");
      }

      setIsCreateModalOpen(false);
      await fetchSessions();
      await fetchSessionRoster(newSessionId);

      // Auto start acoustic beacon
      try {
        const classroom = classrooms.find((c) => c.id === selectedClassroomId);
        const freq = classroom?.beaconFrequencyHz || 18750;
        emitterRef.current = new AcousticEmitter({
          frequency: freq,
          pulseDurationMs: 800,
          intervalMs: 1500,
          mode: "ultrasonic",
          token: startData.session?.ephemeralSecret || "CS302-LIVE-BEACON",
        });
        await emitterRef.current.start();
        setBeaconEmitting(true);
      } catch (audioErr) {
        console.warn("[TeacherLiveSessionConsole] Beacon auto-start prompt:", audioErr);
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to launch session.");
    } finally {
      setIsCreating(false);
    }
  };

  // Session Control: Grace Period
  const handleStartGracePeriod = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`/api/v1/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grace_period", graceDurationSeconds: 60 }),
      });
      if (res.ok) {
        await fetchSessionRoster(activeSession.id);
      }
    } catch (err) {
      console.error("Failed to start grace period:", err);
    }
  };

  // Session Control: Close Session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    if (!confirm("Are you sure you want to end this attendance session? No further submissions will be accepted.")) {
      return;
    }

    try {
      if (emitterRef.current) {
        emitterRef.current.stop();
        emitterRef.current = null;
      }
      setBeaconEmitting(false);

      const res = await fetch(`/api/v1/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (res.ok) {
        await fetchSessions();
        await fetchSessionRoster(activeSession.id);
      }
    } catch (err) {
      console.error("Failed to close session:", err);
    }
  };

  // Simulate a student marking attendance (calls real submit endpoint)
  const handleSimulateStudentAttendance = async () => {
    if (!activeSession) return;
    const notMarked = students.find((s) => s.status === "NOT_MARKED");
    if (!notMarked) {
      alert("All enrolled students have already marked attendance for this session!");
      return;
    }

    try {
      const payload = {
        attemptId: `att_${Date.now()}_sim`,
        sessionId: activeSession.id,
        studentId: notMarked.id,
        deviceId: "dev_simulated_hardware",
        timestamp: Date.now(),
        proximityProof: {
          providerId: "acoustic",
          tier: activeSession.proximityTierRequired,
          timestamp: Date.now(),
          nonce: "NONCE_SIM_" + Math.random().toString(36).substring(2, 6),
          confidence: 0.96,
          payload: "SIM_VERIFIED",
        },
        faceProof: {
          providerId: "browser-mesh-v1",
          matched: true,
          confidence: 0.95,
          featureVectorHash: "FV-DEMO-PASS",
        },
        livenessProof: {
          passed: true,
          method: "passive_micro_motion",
          confidence: 0.93,
        },
        signature: `SIG_ED25519_SIM_${Math.random().toString(36).substring(2, 10)}`,
      };

      const res = await fetch("/api/v1/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSessionRoster(activeSession.id);
      } else {
        const data = await res.json();
        alert(`Simulation response: ${data.outcome} (${data.failure?.userMessage || "Error"})`);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  // Metrics
  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const processingCount = students.filter((s) => s.status === "PROCESSING").length;
  const notMarkedCount = students.filter((s) => s.status === "NOT_MARKED" || s.status === "RETRY_REQUIRED").length;
  const totalCount = students.length || 1;
  const attendancePercentage = Math.round((presentCount / totalCount) * 100);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Session Hub Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Faculty Attendance Console</h1>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 bg-zinc-800/80 text-zinc-300">
              {user?.name || "Dr. Evelyn Reed"}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time classroom session management, proximity ultrasonic beaconing, and biometric verification feed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchSessions()}
            disabled={isRefreshing}
            className="gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setIsCreateModalOpen(true);
              fetchSessionOptions();
            }}
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Attendance Session
          </Button>
        </div>
      </div>

      {/* Active Session Overview or Empty State */}
      {activeSession ? (
        <div className="space-y-6">
          {/* Live Session Control Panel */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                {activeSession.status === "ACTIVE" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Badge variant="success">Active Session</Badge>
                  </>
                ) : activeSession.status === "GRACE_PERIOD" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <Badge variant="warning">Grace Period</Badge>
                  </>
                ) : (
                  <Badge variant="neutral">{activeSession.status}</Badge>
                )}

                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                  {activeSession.course?.code}: {activeSession.course?.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  {activeSession.classroom?.name} ({activeSession.classroom?.roomNumber})
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Elapsed: <span className="font-mono text-zinc-200 tabular-nums">{formatTimer(elapsedSeconds)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-blue-400" />
                  Beacon: <span className="font-mono text-zinc-300">
                    {(activeSession.classroom?.beaconFrequencyHz / 1000).toFixed(2)} kHz ({activeSession.proximityTierRequired})
                  </span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                  ID: {activeSession.id.slice(-8)}
                </span>
              </div>
            </div>

            {/* Session Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {activeSession.status === "ACTIVE" && (
                <>
                  <Button
                    size="sm"
                    variant={beaconEmitting ? "destructive" : "secondary"}
                    onClick={handleToggleBeacon}
                    className="gap-1.5 text-xs"
                  >
                    {beaconEmitting ? (
                      <>
                        <Square className="h-3.5 w-3.5" /> Stop Ultrasonic Tone
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-blue-400" /> Start 18.75kHz Beacon
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartGracePeriod}
                    className="gap-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-950/20"
                  >
                    <Clock className="h-3.5 w-3.5" /> Grace +60s
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSimulateStudentAttendance}
                    className="gap-1.5 text-xs text-blue-400 border-blue-500/30 hover:bg-blue-950/20"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Sim Student
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCloseSession}
                    className="gap-1.5 text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Close Session
                  </Button>
                </>
              )}

              {activeSession.status === "CLOSED" && (
                <div className="text-xs text-zinc-400 italic">
                  Session Closed • Attendance locked
                </div>
              )}
            </div>
          </div>

          {/* Primary Metric & Attendance Tally Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Stat */}
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardContent className="p-4">
                <div className="text-xs text-zinc-400 font-medium">Class Attendance Rate</div>
                <div className="text-2xl font-bold text-zinc-100 tracking-tight mt-1 tabular-nums">
                  {presentCount} / {students.length}{" "}
                  <span className="text-xs font-normal text-zinc-500">({attendancePercentage}%)</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${attendancePercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Present Counter */}
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <span>✓</span> Verified Present
                  </div>
                  <div className="text-2xl font-bold text-emerald-300 tracking-tight mt-1 tabular-nums">
                    {presentCount}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-bold">
                  ✓
                </div>
              </CardContent>
            </Card>

            {/* Processing Counter */}
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-400 font-medium flex items-center gap-1">
                    <span>◌</span> In Verification
                  </div>
                  <div className="text-2xl font-bold text-blue-300 tracking-tight mt-1 tabular-nums">
                    {processingCount}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400 font-bold">
                  ◌
                </div>
              </CardContent>
            </Card>

            {/* Not Marked Counter */}
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                    <span>○</span> Unmarked / Absent
                  </div>
                  <div className="text-2xl font-bold text-zinc-300 tracking-tight mt-1 tabular-nums">
                    {notMarkedCount}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center text-zinc-400 font-bold">
                  ○
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Roster Table Card */}
          <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Live Enrolled Roster</h3>
                <Badge variant="outline" className="text-[10px]">
                  {filteredStudents.length} Students
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or roll..."
                    className="h-8 pl-8 pr-3 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-600 w-[180px] sm:w-[220px]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-hidden focus:border-zinc-600"
                >
                  <option value="ALL">All Status</option>
                  <option value="PRESENT">Present</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="NOT_MARKED">Not Marked</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/60 text-zinc-500 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Roll No</th>
                    <th className="py-2.5 px-4 font-medium">Student</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Verified Time</th>
                    <th className="py-2.5 px-4 font-medium">Verification Method</th>
                    <th className="py-2.5 px-4 font-medium text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-zinc-400 font-medium">{s.rollNumber}</td>
                        <td className="py-3 px-4 font-medium text-zinc-100">{s.name}</td>
                        <td className="py-3 px-4">
                          <StatusIndicator status={s.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400 tabular-nums">
                          {s.verifiedAt || "—"}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {s.method || "Awaiting submission"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-300">
                          {s.confidence ? `${(s.confidence * 100).toFixed(0)}%` : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Empty State when no session exists */
        <div className="p-12 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center mx-auto text-blue-400">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">No Active Attendance Session</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              Launch an attendance window to start emitting classroom ultrasonic challenges and collect tamper-proof biometric verifications.
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            onClick={() => {
              setIsCreateModalOpen(true);
              fetchSessionOptions();
            }}
            className="gap-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create Attendance Session
          </Button>
        </div>
      )}

      {/* SESSION CREATOR MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 text-zinc-100">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-400" />
                  Launch Attendance Session
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure classroom verification rules and acoustic proximity parameters.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Alert */}
            {createError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {createError}
              </div>
            )}

            {/* Creation Form */}
            <form onSubmit={handleCreateAndStartSession} className="space-y-4">
              {/* Course Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Academic Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-hidden focus:border-blue-500"
                  required
                >
                  {courses.length === 0 && <option value="">Loading courses...</option>}
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.name} ({c._count?.enrollments || 3} Enrolled)
                    </option>
                  ))}
                </select>
              </div>

              {/* Classroom Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Classroom Location</label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-hidden focus:border-blue-500"
                  required
                >
                  {classrooms.length === 0 && <option value="">Loading classrooms...</option>}
                  {classrooms.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name} — Room {cr.roomNumber} ({cr.building})
                    </option>
                  ))}
                </select>
              </div>

              {/* Proximity Assurance Tier */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Proximity Assurance Level</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedProximityTier("TIER_A")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selectedProximityTier === "TIER_A"
                        ? "border-blue-500 bg-blue-600/10 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold text-[11px] text-blue-400">TIER_A</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Acoustic 18.75kHz</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProximityTier("TIER_B")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selectedProximityTier === "TIER_B"
                        ? "border-blue-500 bg-blue-600/10 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold text-[11px] text-emerald-400">TIER_B</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Local Wi-Fi BSSID</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProximityTier("TIER_C")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selectedProximityTier === "TIER_C"
                        ? "border-blue-500 bg-blue-600/10 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold text-[11px] text-zinc-300">TIER_C</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">GPS Geofence</div>
                  </button>
                </div>
              </div>

              {/* Attendance Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Attendance Window Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-1.5 text-xs rounded-lg border text-center font-mono transition ${
                        durationMinutes === mins
                          ? "border-blue-500 bg-blue-600/15 text-white font-medium"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreating}
                  className="gap-2 font-semibold shadow-xs"
                >
                  {isCreating ? "Launching..." : "🚀 Launch & Start Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
