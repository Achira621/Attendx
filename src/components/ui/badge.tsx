import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand" | "coral" | "success" | "warning" | "error" | "info" | "outline";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700",
    brand: "bg-[#7C3AED]/20 text-[#7C3AED] dark:text-purple-200 border-[#7C3AED]/40",
    coral: "bg-[#FF7A59]/20 text-[#FF7A59] dark:text-[#FFA085] border-[#FF7A59]/40",
    success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700/60",
    warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700/60",
    error: "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700/60",
    info: "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700/60",
    outline: "bg-transparent text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border leading-tight select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
