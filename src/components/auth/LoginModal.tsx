"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, UserCheck, GraduationCap, Lock, Mail, AlertCircle, Loader2, X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login, quickLogin } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Institutional Sign In</h2>
              <p className="text-xs text-zinc-400">Authenticate your Attendex academic identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Institutional Email or Roll Number</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="teacher@attendex.edu or CS-2026-001"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In to Attendex"}
          </button>
        </form>

        {/* Quick Demo Identities */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider text-center">
            Or test with verified seeded identities
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("TEACHER")}
              disabled={loading}
              className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/80 transition text-left flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                <UserCheck className="h-3.5 w-3.5" />
                Teacher Console
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
                Student PWA
              </div>
              <span className="text-[10px] text-zinc-400">Varad Dalvi (CS-2026-001)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
