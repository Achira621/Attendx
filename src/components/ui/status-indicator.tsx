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
      bg: "bg-emerald-950/60",
      textCol: "text-emerald-300",
      border: "border-emerald-800/40",
    },
    PROCESSING: {
      symbol: "◌",
      text: "Processing",
      bg: "bg-blue-950/60",
      textCol: "text-blue-300",
      border: "border-blue-800/40",
    },
    RETRY_REQUIRED: {
      symbol: "!",
      text: "Retry Required",
      bg: "bg-amber-950/60",
      textCol: "text-amber-300",
      border: "border-amber-800/40",
    },
    REJECTED: {
      symbol: "✕",
      text: "Rejected",
      bg: "bg-rose-950/60",
      textCol: "text-rose-300",
      border: "border-rose-800/40",
    },
    BLOCKED: {
      symbol: "⊘",
      text: "Blocked",
      bg: "bg-red-950/60",
      textCol: "text-red-400",
      border: "border-red-800/50",
    },
    SYSTEM_ERROR: {
      symbol: "⚠",
      text: "System Error",
      bg: "bg-red-950/60",
      textCol: "text-red-300",
      border: "border-red-800/40",
    },
    NOT_MARKED: {
      symbol: "○",
      text: "Not Marked",
      bg: "bg-zinc-800/60",
      textCol: "text-zinc-400",
      border: "border-zinc-700/40",
    },
  };

  const current = configs[status] || configs.NOT_MARKED;
  const displayText = label || current.text;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-md select-none",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
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
