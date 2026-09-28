"use client";

import React, { useState, useEffect, useRef } from "react";
import { AcousticEmitter } from "@/lib/verification/acoustic/acousticEngine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator, AttendanceStatusType } from "@/components/ui/status-indicator";
import {
  Volume2,
  Square,
  Users,
  Search,
  Clock,
  Radio,
  MapPin,
  Sparkles,
} from "lucide-react";

interface StudentRecord {
  id: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatusType;
  verifiedAt?: string;
  method?: string;
  confidence?: number;
}

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "1", name: "Varad Kulkarni", rollNumber: "CS-041", status: "PRESENT", verifiedAt: "09:02:14 AM", method: "Acoustic (18.75kHz) + Face", confidence: 0.96 },
  { id: "2", name: "Aarav Sharma", rollNumber: "CS-012", status: "PRESENT", verifiedAt: "09:02:45 AM", method: "Acoustic (18.75kHz) + Face", confidence: 0.94 },
  { id: "3", name: "Ananya Iyer", rollNumber: "CS-027", status: "PRESENT", verifiedAt: "09:03:10 AM", method: "Acoustic (18.75kHz) + Face", confidence: 0.98 },
  { id: "4", name: "Rohan Verma", rollNumber: "CS-055", status: "PROCESSING", method: "Proximity Signal Detected" },
  { id: "5", name: "Diya Patel", rollNumber: "CS-019", status: "PRESENT", verifiedAt: "09:03:52 AM", method: "Acoustic (18.75kHz) + Face", confidence: 0.95 },
  { id: "6", name: "Ishaan Malhotra", rollNumber: "CS-033", status: "RETRY_REQUIRED", method: "Face alignment out of bounds" },
  { id: "7", name: "Tanvi Deshmukh", rollNumber: "CS-062", status: "NOT_MARKED" },
  { id: "8", name: "Siddharth Nair", rollNumber: "CS-048", status: "PRESENT", verifiedAt: "09:04:18 AM", method: "Acoustic (18.75kHz) + Face", confidence: 0.93 },
  { id: "9", name: "Kavya Joshi", rollNumber: "CS-038", status: "NOT_MARKED" },
  { id: "10", name: "Aditya Rao", rollNumber: "CS-007", status: "NOT_MARKED" },
];

export function TeacherLiveSessionConsole() {
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [beaconEmitting, setBeaconEmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(240); // 4 minutes into session

  const emitterRef = useRef<AcousticEmitter | null>(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleBeacon = async () => {
    if (!beaconEmitting) {
      try {
        emitterRef.current = new AcousticEmitter({
          frequency: 18750,
          pulseDurationMs: 800,
          intervalMs: 1500,
          mode: "ultrasonic",
          token: "CS302-LIVE-BEACON",
        });
        await emitterRef.current.start();
        setBeaconEmitting(true);
      } catch (err: unknown) {
        alert("Failed to activate beacon emitter: " + (err as Error).message);
      }
    } else {
      if (emitterRef.current) {
        emitterRef.current.stop();
        emitterRef.current = null;
      }
      setBeaconEmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (emitterRef.current) emitterRef.current.stop();
    };
  }, []);

  // Quick simulate incoming verification
  const handleSimulateIncoming = () => {
    const notMarked = students.find((s) => s.status === "NOT_MARKED");
    if (!notMarked) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === notMarked.id
          ? {
              ...s,
              status: "PRESENT",
              verifiedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              method: "Acoustic (18.75kHz) + Face",
              confidence: 0.95,
            }
          : s
      )
    );
  };

  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const processingCount = students.filter((s) => s.status === "PROCESSING").length;
  const notMarkedCount = students.filter((s) => s.status === "NOT_MARKED" || s.status === "RETRY_REQUIRED").length;
  const totalCount = students.length;

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
      {/* Session Top Bar */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">CS-302: Distributed Systems</h1>
            <Badge variant="success">Active Session</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" /> Room 402, Hall A
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              Duration: <span className="font-mono text-zinc-200 tabular-nums">{formatTimer(elapsedSeconds)}</span> (Limit: 15:00)
            </span>
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-zinc-500" />
              Beacon: <span className="font-mono text-zinc-300">18.75 kHz (TIER_A)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant={beaconEmitting ? "destructive" : "secondary"}
            onClick={handleToggleBeacon}
            className="gap-1.5"
          >
            {beaconEmitting ? (
              <>
                <Square className="h-3.5 w-3.5" /> Stop Ultrasonic Beacon
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-blue-400" /> Start Acoustic Beacon
              </>
            )}
          </Button>

          <Button size="sm" variant="outline" onClick={handleSimulateIncoming} className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Simulate Student Mark
          </Button>
        </div>
      </div>

      {/* Primary Metric & Attendance Tally Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stat */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400 font-medium">Class Attendance Rate</div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight mt-1 tabular-nums">
              {presentCount} / {totalCount} <span className="text-xs font-normal text-zinc-500">({Math.round((presentCount / totalCount) * 100)}%)</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(presentCount / totalCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Present Counter */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
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
        <Card className="border-zinc-800/80 bg-zinc-900/40">
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
        <Card className="border-zinc-800/80 bg-zinc-900/40">
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
      <Card className="border-zinc-800/80 bg-zinc-900/30">
        <div className="p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Live Attendance Roster</h3>
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
                className="h-8 pl-8 pr-3 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 w-[180px] sm:w-[220px]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 text-xs rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-600"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="PROCESSING">Processing</option>
              <option value="NOT_MARKED">Not Marked</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/60 text-zinc-500 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-800/80">
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
                    No students matched the filter criteria.
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
  );
}
