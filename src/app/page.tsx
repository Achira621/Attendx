"use client";

import React, { useState } from "react";
import { TeacherLiveSessionConsole } from "@/components/dashboard/TeacherLiveSessionConsole";
import { StudentAttendanceFlow } from "@/components/verification/StudentAttendanceFlow";
import { AcousticDiagnosticLab } from "@/components/verification/AcousticDiagnosticLab";
import { FaceDiagnosticLab } from "@/components/verification/FaceDiagnosticLab";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Smartphone,
  Radio,
  Camera,
  ShieldCheck,
  FileText,
  Activity,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  GraduationCap,
} from "lucide-react";

type ActiveTab = "teacher" | "student" | "acoustic_lab" | "face_lab" | "architecture";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ActiveTab | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Derive active tab based on explicit user navigation or current role
  const activeTab: ActiveTab = selectedTab ?? (user?.role === "STUDENT" ? "student" : "teacher");
  const setActiveTab = (tab: ActiveTab) => setSelectedTab(tab);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Attendex</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  v1.0-MVP
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeTab === "teacher"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Teacher Console
            </button>

            <button
              onClick={() => setActiveTab("student")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeTab === "student"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Student Flow (PWA)
            </button>

            <button
              onClick={() => setActiveTab("acoustic_lab")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeTab === "acoustic_lab"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-blue-400" />
              Acoustic Lab
            </button>

            <button
              onClick={() => setActiveTab("face_lab")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeTab === "face_lab"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-emerald-400" />
              Face & Liveness Lab
            </button>

            <button
              onClick={() => setActiveTab("architecture")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeTab === "architecture"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Architecture
            </button>
          </nav>

          {/* User Auth Profile & Controls */}
          <div className="flex items-center gap-2.5">
            {loading ? (
              <div className="h-7 w-20 bg-zinc-800/60 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs">
                  {user.role === "TEACHER" ? (
                    <User className="h-3.5 w-3.5 text-blue-400" />
                  ) : (
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-zinc-100 text-[11px] leading-tight">{user.name}</span>
                    <span className="text-[9px] font-mono text-zinc-400 leading-tight">
                      {user.role === "STUDENT" ? user.rollNumber : "Faculty"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center justify-around border-t border-zinc-800/80 px-2 py-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("teacher")}
            className={`p-2 text-xs font-medium rounded ${
              activeTab === "teacher" ? "text-blue-400 font-semibold" : "text-zinc-400"
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`p-2 text-xs font-medium rounded ${
              activeTab === "student" ? "text-blue-400 font-semibold" : "text-zinc-400"
            }`}
          >
            Student PWA
          </button>
          <button
            onClick={() => setActiveTab("acoustic_lab")}
            className={`p-2 text-xs font-medium rounded ${
              activeTab === "acoustic_lab" ? "text-blue-400 font-semibold" : "text-zinc-400"
            }`}
          >
            Acoustic
          </button>
          <button
            onClick={() => setActiveTab("face_lab")}
            className={`p-2 text-xs font-medium rounded ${
              activeTab === "face_lab" ? "text-blue-400 font-semibold" : "text-zinc-400"
            }`}
          >
            Face Lab
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`p-2 text-xs font-medium rounded ${
              activeTab === "architecture" ? "text-blue-400 font-semibold" : "text-zinc-400"
            }`}
          >
            Architecture
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === "teacher" && <TeacherLiveSessionConsole />}

        {activeTab === "student" && (
          <div className="py-4">
            <StudentAttendanceFlow />
          </div>
        )}

        {activeTab === "acoustic_lab" && <AcousticDiagnosticLab />}

        {activeTab === "face_lab" && <FaceDiagnosticLab />}

        {activeTab === "architecture" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                Attendex Core Principles & Architecture
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Edge-First + Cloud-Backed + Event-Driven + Modular Dual-Factor Presence Verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Dual-Factor Presence Thesis
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Attendance is only recorded when BOTH physical classroom proximity (acoustic/network) and enrolled identity (on-device face match + liveness) pass independently.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  Student Privacy & Compute Offloading
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No video streaming to teacher or cloud. Biometric verification runs on the student&apos;s own device. Zero cloud GPU costs during peak attendance windows.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-amber-400" />
                  Fail Closed for Security, Degrade for Availability
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A failed acoustic speaker does not accept attendance automatically; the orchestrator gracefully falls back to configured Tier B (LAN) or Tier C (GPS) assurance policies.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-purple-400" />
                  Idempotent & Offline-Resilient
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  PostgreSQL unique constraint <code className="text-zinc-300">UNIQUE(session_id, student_id)</code> prevents duplicates. Background sync queues offline signed attempts for delayed verification.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs space-y-2">
              <div className="text-zinc-400 font-semibold">Strict Authoritative State Transition Flow</div>
              <div className="text-emerald-400">
                INITIATED ➔ SESSION_VALIDATING ➔ PROXIMITY_VERIFYING ➔ FACE_VERIFYING ➔ LIVENESS_VERIFYING ➔ FINAL_VALIDATION ➔ ATTENDANCE_ACCEPTED
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Subtle Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-[11px] text-zinc-500">
        Attendex Attendance Platform • Complies with strict architectural fault-tolerance and UX design rules.
      </footer>

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
