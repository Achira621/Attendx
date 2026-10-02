"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  X,
  User,
  Building2,
  Hash,
  UserPlus,
  LogIn,
  ScanFace,
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenKyc?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess, onOpenKyc }: LoginModalProps) {
  const { login, register, quickLogin } = useAuth();
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Sign In fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Registration fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [regRollNumber, setRegRollNumber] = useState("");
  const [regDepartment, setRegDepartment] = useState("Computer Science & Engineering");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please provide your institutional email/roll number and password.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || "Authentication failed. Please verify your credentials.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError("Name, email, and password are required.");
      return;
    }

    if (regRole === "STUDENT" && !regRollNumber) {
      setError("Student roll number is required (e.g. CS-2026-005).");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      rollNumber: regRole === "STUDENT" ? regRollNumber : undefined,
      department: regDepartment,
    });

    setLoading(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || "Registration failed.");
    }
  };

  const handleQuickLogin = async (role: "TEACHER" | "STUDENT") => {
    setLoading(true);
    setError(null);
    const result = await quickLogin(role);
    setLoading(false);
    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || "Quick sign-in failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 text-zinc-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Attendex Identity Portal</h2>
              <p className="text-xs text-zinc-400">Institutional dual-factor presence access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab("LOGIN");
              setError(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
              tab === "LOGIN"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("REGISTER");
              setError(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
              tab === "REGISTER"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Create Account
          </button>
        </div>

        {/* Fast KYC Onboarding Callout */}
        {onOpenKyc && (
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-200">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <ScanFace className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-white leading-tight">Create Student ID & KYC</p>
                <p className="text-[11px] text-zinc-400 leading-tight">Instant ID + Biometric face registration</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenKyc();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs whitespace-nowrap shadow-xs transition"
            >
              Start KYC
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {tab === "LOGIN" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Institutional Email or Roll Number</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@attendex.edu or CS-2026-001"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-xs"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In to Attendex"}
            </button>
          </form>
        )}

        {/* TAB 2: CREATE NEW USER */}
        {tab === "REGISTER" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Role Picker */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole("STUDENT")}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    regRole === "STUDENT"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole("TEACHER")}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    regRole === "TEACHER"
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Faculty
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rohan@attendex.edu"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                  required
                />
              </div>
            </div>

            {/* Roll Number (Students only) */}
            {regRole === "STUDENT" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={regRollNumber}
                    onChange={(e) => setRegRollNumber(e.target.value)}
                    placeholder="e.g. CS-2026-005"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                    required
                  />
                </div>
              </div>
            )}

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Academic Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/60 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Registration"}
            </button>
          </form>
        )}

        {/* Quick Demo Identities */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider text-center">
            Or test with verified demo identities
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("TEACHER")}
              disabled={loading}
              className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/80 transition text-left flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                <UserCheck className="h-3.5 w-3.5" />
                Faculty
              </div>
              <span className="text-[10px] text-zinc-400">Dr. Evelyn Reed</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("STUDENT")}
              disabled={loading}
              className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/80 transition text-left flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <GraduationCap className="h-3.5 w-3.5" />
                Student
              </div>
              <span className="text-[10px] text-zinc-400">Varad Dalvi (CS-2026-001)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
