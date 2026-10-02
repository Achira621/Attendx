"use client";

import React, { useState } from "react";
import { TeacherLiveSessionConsole } from "@/components/dashboard/TeacherLiveSessionConsole";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { AcousticDiagnosticLab } from "@/components/verification/AcousticDiagnosticLab";
import { FaceDiagnosticLab } from "@/components/verification/FaceDiagnosticLab";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Radio,
  Camera,
  ShieldCheck,
  FileText,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  ScanFace,
} from "lucide-react";
import { StudentIdKycModal } from "@/components/kyc/StudentIdKycModal";

type TeacherTab = "teacher" | "acoustic_lab" | "face_lab" | "architecture";

export default function Home() {
  const { user, logout, quickLogin, loading } = useAuth();
  const [teacherTab, setTeacherTab] = useState<TeacherTab>("teacher");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Quick switch role convenience for evaluators/testers
  const handleSwitchRole = async (targetRole: "TEACHER" | "STUDENT") => {
    try {
      setSwitchingRole(true);
      await quickLogin(targetRole);
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-zinc-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Application Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-bold text-amber-400 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Attendex</span>
                {user ? (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      user.role === "STUDENT"
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                        : "bg-amber-950/40 text-amber-300 border-amber-800/50"
                    }`}
                  >
                    {user.role === "STUDENT" ? "Student Portal" : "Faculty Console"}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Dual-Presence
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Teacher-Only Navigation Tabs (Hidden for Students) */}
          {user && user.role === "TEACHER" && (
            <nav className="hidden md:flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setTeacherTab("teacher")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                  teacherTab === "teacher"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Live Sessions
              </button>

              <button
                onClick={() => setTeacherTab("acoustic_lab")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                  teacherTab === "acoustic_lab"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Radio className="h-3.5 w-3.5 text-amber-400" />
                Acoustic Lab
              </button>

              <button
                onClick={() => setTeacherTab("face_lab")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                  teacherTab === "face_lab"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                Face Lab
              </button>

              <button
                onClick={() => setTeacherTab("architecture")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                  teacherTab === "architecture"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Specs
              </button>
            </nav>
          )}

          {/* User Auth Profile & Fast Switch Controls */}
          <div className="flex items-center gap-2.5">
            {loading ? (
              <div className="h-7 w-24 bg-zinc-800/60 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Fast Role Switcher for Demo / Testing */}
                <button
                  onClick={() => handleSwitchRole(user.role === "STUDENT" ? "TEACHER" : "STUDENT")}
                  disabled={switchingRole}
                  title={`Switch to ${user.role === "STUDENT" ? "Teacher" : "Student"} view`}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] transition"
                >
                  <ArrowLeftRight className={`h-3 w-3 ${switchingRole ? "animate-spin" : ""}`} />
                  <span>Switch to {user.role === "STUDENT" ? "Teacher" : "Student"}</span>
                </button>

                {/* Profile Pill */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                  {user.role === "TEACHER" ? (
                    <User className="h-3.5 w-3.5 text-amber-400" />
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

                {/* Sign Out */}
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsKycModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold text-amber-400 border-amber-500/30 hover:bg-amber-950/30 hidden sm:flex"
                >
                  <ScanFace className="h-3.5 w-3.5" />
                  Create Student ID & KYC
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation for Teacher */}
        {user && user.role === "TEACHER" && (
          <div className="md:hidden flex items-center justify-around border-t border-zinc-800 px-2 py-1.5 text-xs">
            <button
              onClick={() => setTeacherTab("teacher")}
              className={`p-1.5 font-medium ${
                teacherTab === "teacher" ? "text-amber-400 font-semibold" : "text-zinc-400"
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setTeacherTab("acoustic_lab")}
              className={`p-1.5 font-medium ${
                teacherTab === "acoustic_lab" ? "text-amber-400 font-semibold" : "text-zinc-400"
              }`}
            >
              Acoustic
            </button>
            <button
              onClick={() => setTeacherTab("face_lab")}
              className={`p-1.5 font-medium ${
                teacherTab === "face_lab" ? "text-amber-400 font-semibold" : "text-zinc-400"
              }`}
            >
              Face Lab
            </button>
            <button
              onClick={() => setTeacherTab("architecture")}
              className={`p-1.5 font-medium ${
                teacherTab === "architecture" ? "text-amber-400 font-semibold" : "text-zinc-400"
              }`}
            >
              Specs
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-mono">Authenticating institutional session...</p>
          </div>
        ) : user ? (
          /* Logged In View */
          user.role === "STUDENT" ? (
            /* STUDENT VIEW: ONLY STUDENT CONTENT & SESSIONS */
            <StudentDashboard />
          ) : (
            /* TEACHER VIEW: LIVE SESSIONS & DIAGNOSTIC LABS */
            <>
              {teacherTab === "teacher" && <TeacherLiveSessionConsole />}
              {teacherTab === "acoustic_lab" && <AcousticDiagnosticLab />}
              {teacherTab === "face_lab" && <FaceDiagnosticLab />}
              {teacherTab === "architecture" && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-amber-400" />
                      Attendex Architecture Principles
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Edge-First + Cloud-Backed + Event-Driven Dual Presence Verification
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                      <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Dual Presence Formula
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-mono text-[11px]">
                        VALID SESSION + VALID STUDENT + PROXIMITY VERIFIED + FACE MATCH + LIVENESS PASS + UNIQUE ATTEMPT = ATTENDANCE ACCEPTED
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                      <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-amber-400" />
                        Acoustic Beaconing (TIER_A)
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Near-ultrasonic 18.75 kHz rotating cryptographic acoustic challenges prevent GPS spoofing and remote proxies across walls.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          /* NOT LOGGED IN: Welcome Portal with Instant Role Launchers */
          <div className="max-w-4xl mx-auto py-12 space-y-10">
            {/* Hero */}
            <div className="text-center space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Next-Gen Academic Presence Infrastructure
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
                Classroom Attendance with Dual-Factor Presence
              </h1>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Attendex binds physical classroom proximity (ultrasonic acoustic beacons) with on-device face matching and passive liveness detection.
              </p>
            </div>

            {/* Quick Demo Launch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Instant Student ID & KYC Onboarding Card */}
              <div
                onClick={() => setIsKycModalOpen(true)}
                className="group relative p-6 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-zinc-900/90 via-zinc-900/40 to-amber-950/15 hover:border-amber-500/40 transition cursor-pointer space-y-4 md:col-span-2 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                      <ScanFace className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                          Create Student ID & Complete Face KYC
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                        Register your student credentials, generate an official institutional digital ID card, and perform a one-time biometric face scan to unlock dual-factor attendance.
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="brand"
                    className="shrink-0 text-xs font-semibold gap-1.5"
                  >
                    <span>Create ID & KYC</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Student Role Card */}
              <div
                onClick={() => handleSwitchRole("STUDENT")}
                className="group relative p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/40 transition cursor-pointer space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      Enter as Student
                    </h3>
                    <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sign in as <span className="text-zinc-200 font-medium">Varad Dalvi</span> (CS-2026-001). See active attendance sessions and mark presence.
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                  <span>✓ Acoustic receiver</span>
                  <span>•</span>
                  <span>✓ On-device face scan</span>
                </div>
              </div>

              {/* Faculty Role Card */}
              <div
                onClick={() => handleSwitchRole("TEACHER")}
                className="group relative p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-amber-500/40 transition cursor-pointer space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                      Enter as Faculty
                    </h3>
                    <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sign in as <span className="text-zinc-200 font-medium">Dr. Evelyn Reed</span> (Faculty). Launch attendance windows and emit ultrasonic beacons.
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                  <span>✓ Ultrasonic emitter</span>
                  <span>•</span>
                  <span>✓ Live roster tally</span>
                </div>
              </div>
            </div>

            {/* Custom Credentials Sign In */}
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                className="gap-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in with custom email / credentials
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenKyc={() => setIsKycModalOpen(true)}
      />

      {/* Student ID & Face KYC Modal */}
      <StudentIdKycModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
      />
    </div>
  );
}
