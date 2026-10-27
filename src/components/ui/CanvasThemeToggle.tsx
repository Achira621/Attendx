"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CanvasThemeToggleProps {
  variant?: "pill" | "icon";
  className?: string;
}

function subscribe(callback: () => void) {
  window.addEventListener("attendex-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("attendex-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return true;
}

export function CanvasThemeToggle({
  variant = "pill",
  className,
}: CanvasThemeToggleProps) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("attendex-canvas-theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("attendex-canvas-theme", "light");
      } catch {}
    }
    window.dispatchEvent(new Event("attendex-theme-change"));
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-xl border transition-all duration-200 flex items-center justify-center",
          isDark
            ? "bg-slate-900 border-slate-700/80 text-amber-300 hover:text-amber-200 hover:border-amber-500/40 shadow-xs"
            : "bg-white border-slate-300 text-purple-600 hover:text-purple-700 hover:border-purple-400 shadow-xs",
          className
        )}
        title={isDark ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
        aria-label={isDark ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 select-none cursor-pointer",
        isDark
          ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white shadow-xs"
          : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950 shadow-xs",
        className
      )}
      title={isDark ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
      aria-label={isDark ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full transition-transform duration-200 group-hover:rotate-45",
          isDark ? "text-amber-300" : "text-purple-600"
        )}
      >
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </span>
      <span className="font-medium text-[11px] sm:text-xs tracking-tight">
        {isDark ? "Dark" : "Light"}
        <span className="hidden sm:inline">&nbsp;Canvas</span>
      </span>
    </button>
  );
}
