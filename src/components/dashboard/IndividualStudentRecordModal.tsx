"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { downloadCsv } from "@/lib/exportCsv";
import {
  User,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Download,
  X,
  ShieldCheck,
  Radio,
} from "lucide-react";

export interface StudentHistoryRecord {
  sessionId: string;
  sessionDate: string;
  classroom: string;
  status: string;
  verifiedAt: string | null;
  confidence: number;
  proximityTier: string;
}

export interface StudentAnalyticsItem {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  totalSessions: number;
  attendedCount: number;
  attendancePercentage: number;
  attendanceHistory: StudentHistoryRecord[];
}

export interface IndividualStudentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAnalyticsItem | null;
  courseCode: string;
  courseName: string;
}

export function IndividualStudentRecordModal({
  isOpen,
  onClose,
  student,
  courseCode,
  courseName,
}: IndividualStudentRecordModalProps) {
  if (!isOpen || !student) return null;

  const handleExportStudentCsv = () => {
    const headers = [
      "Student ID",
      "Roll Number",
      "Student Name",
      "Email",
      "Course Code",
      "Course Name",
      "Session Date",
      "Classroom",
      "Status",
      "Verified Timestamp",
      "Confidence %",
      "Proximity Tier",
    ];

    const rows = student.attendanceHistory.map((rec) => [
      student.id,
      student.rollNumber,
      student.name,
      student.email,
      courseCode,
      courseName,
      new Date(rec.sessionDate).toLocaleDateString(),
      rec.classroom,
      rec.status,
      rec.verifiedAt ? new Date(rec.verifiedAt).toLocaleString() : "N/A",
      rec.confidence ? `${Math.round(rec.confidence * 100)}%` : "0%",
      rec.proximityTier,
    ]);

    downloadCsv(`StudentRecord_${student.rollNumber}_${courseCode}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-left max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">{student.name}</h3>
                <Badge variant="outline" className="font-mono text-xs font-semibold text-slate-200">
                  {student.rollNumber}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">
                Attendance dossier for {courseCode}: {courseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportStudentCsv}
              className="text-xs sm:text-sm gap-1.5 h-8 text-slate-200 hover:text-white border-zinc-700 bg-zinc-800/60 font-semibold"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              Download CSV
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
          <Card className="border-zinc-800 bg-zinc-950 p-3 text-center">
            <span className="text-xs text-slate-200 uppercase tracking-wider font-mono font-bold">Attendance Rate</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {student.attendancePercentage}%
            </div>
          </Card>
          <Card className="border-zinc-800 bg-zinc-950 p-3 text-center">
            <span className="text-xs text-slate-200 uppercase tracking-wider font-mono font-bold">Lectures Attended</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {student.attendedCount} / {student.totalSessions}
            </div>
          </Card>
          <Card className="border-zinc-800 bg-zinc-950 p-3 text-center">
            <span className="text-xs text-slate-200 uppercase tracking-wider font-mono font-bold">Status Grade</span>
            <div className="mt-1">
              {student.attendancePercentage >= 75 ? (
                <Badge variant="success" className="text-xs font-semibold">
                  Good Standing (≥75%)
                </Badge>
              ) : (
                <Badge variant="error" className="text-xs font-semibold">
                  Below Threshold (&lt;75%)
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* Attendance Records List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-amber-400" />
            Lecture Verification History ({student.attendanceHistory.length})
          </h4>

          {student.attendanceHistory.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-200 border border-zinc-800 rounded-xl bg-zinc-950">
              No lecture sessions recorded for this course yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/70">
              {student.attendanceHistory.map((rec, idx) => {
                const dateObj = new Date(rec.sessionDate);
                const dateStr = dateObj.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                const timeStr = rec.verifiedAt
                  ? new Date(rec.verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : "Not Recorded";

                const isPresent = rec.status === "PRESENT";

                return (
                  <div key={rec.sessionId || idx} className="p-3.5 flex items-center justify-between gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{dateStr}</span>
                        <span className="text-xs font-mono text-slate-200 font-medium">• {rec.classroom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-purple-400" />
                        <span>Verified at: <span className="font-mono text-white font-medium">{timeStr}</span></span>
                        {isPresent && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300 font-mono font-semibold">{rec.proximityTier}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isPresent ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold font-mono">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>PRESENT</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold font-mono">
                          <XCircle className="h-4 w-4" />
                          <span>ABSENT</span>
                        </div>
                      )}
                      {isPresent && (
                        <span className="text-xs font-mono text-slate-200 font-bold">
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <span>Student ID: <span className="font-mono text-white font-semibold">{student.id}</span></span>
          <Button variant="secondary" size="sm" onClick={onClose} className="h-8 text-xs px-3 font-semibold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
