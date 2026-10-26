import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand" | "coral" | "success" | "warning" | "error" | "info" | "outline";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    brand: "bg-[#7C3AED]/10 text-[#7C3AED] dark:text-purple-300 border-[#7C3AED]/25",
    coral: "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/30",
    success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
    warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
    error: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
    info: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
    outline: "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border leading-tight select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
