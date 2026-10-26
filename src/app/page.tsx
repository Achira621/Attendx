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

import { AttendexLogo } from "@/components/ui/AttendexLogo";

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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      {/* Top Application Bar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0F172A]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <AttendexLogo size={36} withText={true} withTagline={false} />
            {user ? (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  user.role === "STUDENT"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                    : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50"
                }`}
              >
                {user.role === "STUDENT" ? "Student Portal" : "Faculty Console"}
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700">
                Presence with Purpose
              </span>
            )}
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
          /* NOT LOGGED IN: Welcome Portal with Poster Hero Design */
          <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-12">
            {/* Hero Section matching the Design System Poster */}
            <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-[#E7F2FF]/40 dark:from-slate-900 dark:via-[#111827] dark:to-[#1E1B4B]/30 shadow-xl">
              {/* Decorative Subtle Background Orbs */}
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#7C3AED]/15 via-[#FF7A59]/10 to-transparent blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-[#E7F2FF] to-transparent dark:from-[#7C3AED]/10 blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#7C3AED]" />
                    <span>Trusted by Modern Institutions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-slate-400">
                    <span>SECURE</span>
                    <span>•</span>
                    <span>AUTHENTIC</span>
                    <span>•</span>
                    <span>PRIVATE</span>
                    <span>•</span>
                    <span>EFFORTLESS</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.08]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                    Real People. <br />
                    <span className="bg-gradient-to-r from-[#0F172A] via-[#7C3AED] to-[#FF7A59] dark:from-white dark:via-purple-300 dark:to-[#FF7A59] bg-clip-text text-transparent">
                      Real Presence.
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed pt-1">
                    AI-powered, privacy-preserving, edge-first attendance for classrooms and organisations.
                  </p>
                </div>

                {/* Primary CTA Buttons from Poster */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsKycModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm shadow-xs transition-all hover:scale-[1.02]"
                  >
                    <ScanFace className="h-4 w-4 text-[#FF7A59]" />
                    <span>Create Student ID & KYC</span>
                  </button>
                </div>

                {/* Brand Feature Badges Strip (from poster bottom) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-md bg-[#FF7A59]/15 flex items-center justify-center text-[#FF7A59] shrink-0">
                      <Radio className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">Anti-Proxy Ultrasonic</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-md bg-[#7C3AED]/15 flex items-center justify-center text-[#7C3AED] shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">Privacy by Design</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">Edge Architecture</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <GraduationCap className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">Built for Education</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Launch Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                    Interactive Role Launchers
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jump directly into the student or teacher portal to experience dual presence live.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Student Role Card */}
                <div
                  onClick={() => handleSwitchRole("STUDENT")}
                  className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 hover:shadow-lg transition cursor-pointer space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                        Enter as Student
                      </h3>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sign in as <span className="text-slate-900 dark:text-slate-200 font-medium">Varad Dalvi</span>. Scan classroom audio beacon & perform on-device biometric presence.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400">✓ Acoustic receiver</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400">✓ On-device face scan</span>
                  </div>
                </div>

                {/* Faculty Role Card */}
                <div
                  onClick={() => handleSwitchRole("TEACHER")}
                  className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-[#7C3AED]/50 hover:shadow-lg transition cursor-pointer space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-[#7C3AED] group-hover:scale-105 transition">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#7C3AED] transition" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                        Enter as Faculty
                      </h3>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sign in as <span className="text-slate-900 dark:text-slate-200 font-medium">Dr. Arjun Mehta</span>. Broadcast ultrasonic beacon & track real-time attendance tally.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span className="text-[#7C3AED]">✓ Ultrasonic emitter</span>
                    <span>•</span>
                    <span className="text-[#7C3AED]">✓ Real-time roster telemetry</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote / Footer Banner matching image footer */}
            <div className="text-center py-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs italic text-slate-400 font-serif">
                &ldquo;Attendance isn&apos;t just a number, it&apos;s a step towards a brighter future.&rdquo;
              </p>
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
