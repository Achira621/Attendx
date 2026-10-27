import * as React from "react";
import { cn } from "@/lib/utils";

export type AttendanceStatusType =
  | "PRESENT"
  | "PROCESSING"
  | "RETRY_REQUIRED"
  | "REJECTED"
  | "BLOCKED"
  | "SYSTEM_ERROR"
  | "NOT_MARKED";

interface StatusIndicatorProps {
  status: AttendanceStatusType;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusIndicator({ status, label, className, size = "md" }: StatusIndicatorProps) {
  const configs: Record<AttendanceStatusType, { symbol: string; text: string; bg: string; textCol: string; border: string }> = {
    PRESENT: {
      symbol: "✓",
      text: "Present",
      bg: "bg-emerald-950/70",
      textCol: "text-emerald-300",
      border: "border-emerald-700/60",
    },
    PROCESSING: {
      symbol: "◌",
      text: "Processing",
      bg: "bg-amber-950/70",
      textCol: "text-amber-300",
      border: "border-amber-700/60",
    },
    RETRY_REQUIRED: {
      symbol: "!",
      text: "Retry Required",
      bg: "bg-amber-950/70",
      textCol: "text-amber-300",
      border: "border-amber-700/60",
    },
    REJECTED: {
      symbol: "✕",
      text: "Rejected",
      bg: "bg-rose-950/70",
      textCol: "text-rose-300",
      border: "border-rose-700/60",
    },
    BLOCKED: {
      symbol: "⊘",
      text: "Blocked",
      bg: "bg-rose-950/70",
      textCol: "text-rose-300",
      border: "border-rose-700/60",
    },
    SYSTEM_ERROR: {
      symbol: "⚠",
      text: "System Error",
      bg: "bg-rose-950/70",
      textCol: "text-rose-300",
      border: "border-rose-700/60",
    },
    NOT_MARKED: {
      symbol: "○",
      text: "Not Marked",
      bg: "bg-slate-800/90",
      textCol: "text-slate-200",
      border: "border-slate-700",
    },
  };

  const current = configs[status] || configs.NOT_MARKED;
  const displayText = label || current.text;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border rounded-lg select-none",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        current.bg,
        current.textCol,
        current.border,
        className
      )}
    >
      <span className="font-bold">{current.symbol}</span>
      <span>{displayText}</span>
    </span>
  );
}
