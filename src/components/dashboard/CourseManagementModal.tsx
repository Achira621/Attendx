"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, X, Users, Building2, Hash, AlertCircle, CheckCircle2 } from "lucide-react";

export interface CourseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCourse: { id: string; code: string; name: string; department: string; studentLimit: number }) => void;
  teacherId?: string;
}

export function CourseManagementModal({
  isOpen,
  onClose,
  onSuccess,
  teacherId,
}: CourseManagementModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [studentLimit, setStudentLimit] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Please provide both Course Code and Course Name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          department: department.trim(),
          studentLimit: Number(studentLimit) || 60,
          teacherId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create course.");
      }

      onSuccess(data.course);
      onClose();
      setCode("");
      setName("");
      setStudentLimit(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add New Class / Course</h3>
              <p className="text-xs text-slate-300">Save course to your profile for future lectures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-purple-400" /> Course Code
            </label>
            <input
              type="text"
              placeholder="e.g. CS-401 or CSE-305"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-purple-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Course Title
            </label>
            <input
              type="text"
              placeholder="e.g. Cloud Computing & Distributed Systems"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-purple-400" /> Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-400" /> Student Limit
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={studentLimit}
                onChange={(e) => setStudentLimit(parseInt(e.target.value, 10) || 60)}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs focus:outline-hidden focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Automatic Student Discovery
            </div>
            <p className="text-slate-300">
              Students enrolled in this department will automatically have access to mark attendance when you launch an acoustic lecture beacon.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving Class..." : "Save Course to Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
