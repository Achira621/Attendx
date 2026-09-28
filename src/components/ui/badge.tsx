import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "error" | "info" | "outline";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    neutral: "bg-zinc-800 text-zinc-300 border-zinc-700/60",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
    warning: "bg-amber-950/60 text-amber-300 border-amber-800/50",
    error: "bg-rose-950/60 text-rose-300 border-rose-800/50",
    info: "bg-blue-950/60 text-blue-300 border-blue-800/50",
    outline: "bg-transparent text-zinc-300 border-zinc-700",
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
