"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BufferAnimationProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "fullscreen";
  message?: string;
  submessage?: string;
  className?: string;
  variant?: "circular" | "rounded";
}

export function BufferAnimation({
  size = "md",
  message,
  submessage,
  className,
  variant = "rounded",
}: BufferAnimationProps) {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-14 h-14",
    md: "w-24 h-24",
    lg: "w-36 h-36",
    xl: "w-48 h-48",
    fullscreen: "w-36 h-36 sm:w-44 sm:h-44",
  };

  const shapeClass =
    variant === "circular"
      ? "rounded-full"
      : size === "xs" || size === "sm"
      ? "rounded-xl"
      : "rounded-2xl";

  const bufferMedia = (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-950/80 border border-purple-500/30 shadow-[0_0_25px_rgba(124,58,237,0.25)] flex items-center justify-center shrink-0",
        sizeClasses[size],
        shapeClass
      )}
    >
      <video
        src="/buffer-animation.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    </div>
  );

  if (size === "fullscreen") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 text-center animate-in fade-in duration-200",
          className
        )}
      >
        {bufferMedia}
        {message && (
          <p className="mt-5 text-base sm:text-lg font-bold text-white tracking-wide font-heading">
            {message}
          </p>
        )}
        {submessage && (
          <p className="mt-1 text-sm text-slate-300 font-mono font-medium">
            {submessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 text-center space-y-2.5",
        className
      )}
    >
      {bufferMedia}
      {message && (
        <p className="text-sm sm:text-base font-bold text-white tracking-wide font-heading">
          {message}
        </p>
      )}
      {submessage && (
        <p className="text-xs sm:text-sm text-slate-300 font-mono font-medium">
          {submessage}
        </p>
      )}
    </div>
  );
}
