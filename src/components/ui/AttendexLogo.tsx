import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "gradient" | "dark" | "white" | "light";
  withText?: boolean;
  withTagline?: boolean;
}

export function AttendexLogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  const uniqueId = React.useId().replace(/:/g, "_");
  const aGradId = `att_agrad_${uniqueId}`;
  const ringGradId = `att_ringgrad_${uniqueId}`;
  const sphereGradId = `att_spheregrad_${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Deep Indigo to Aurora Purple / Sunset Coral */}
        <linearGradient id={aGradId} x1="12" y1="54" x2="48" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="45%" stopColor="#1E1B4B" />
          <stop offset="70%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#FF7A59" />
        </linearGradient>

        {/* Orbit Ring Gradient (Amber Sand to Coral) */}
        <linearGradient id={ringGradId} x1="4" y1="46" x2="58" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F6D7B0" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#FF7A59" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.9" />
        </linearGradient>

        {/* Floating Sphere */}
        <radialGradient id={sphereGradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FF9E7D" />
          <stop offset="55%" stopColor="#FF7A59" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
      </defs>

      {/* Background Orbit Arc - behind the left stem */}
      <path
        d="M 12 40 C 14 30, 24 22, 38 20 C 48 18.5, 56 22, 57 26"
        stroke={`url(#${ringGradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Stylized 'A' Apex and Stems */}
      <path
        d="M 18 52 C 20 46, 26 24, 31.5 12 C 32.5 9.8, 35.5 9.8, 36.5 12 C 42 24, 48 46, 50 52 C 50.8 54.5, 48.2 55.5, 46.5 53.5 C 44 50.5, 41 42, 34 42 C 27 42, 24 50.5, 21.5 53.5 C 19.8 55.5, 17.2 54.5, 18 52 Z"
        fill={`url(#${aGradId})`}
      />

      {/* Inner Aperture cutout */}
      <path
        d="M 34 22 C 32 28, 30 34, 29 38 C 32 37.5, 36 37.5, 39 38 C 38 34, 36 28, 34 22 Z"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Foreground Orbit Arc - looping around and through the 'A' */}
      <path
        d="M 10 42 C 16 48, 30 50, 44 44 C 54 39, 58 31, 56 25"
        stroke={`url(#${ringGradId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
      />

      {/* Central Presence Sphere */}
      <circle cx="34" cy="35" r="5.5" fill={`url(#${sphereGradId})`} />
      <circle cx="32.5" cy="33.5" r="1.8" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

export function AttendexLogo({
  className = "",
  size = 32,
  withText = true,
  withTagline = false,
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <AttendexLogoIcon size={size} />
      {withText && (
        <div className="flex flex-col text-left">
          <span
            className="font-bold tracking-tight text-slate-900 dark:text-white"
            style={{
              fontFamily: "var(--font-sora), var(--font-geist-sans), sans-serif",
              fontSize: size >= 40 ? "1.5rem" : size >= 32 ? "1.125rem" : "0.95rem",
              lineHeight: 1.1,
            }}
          >
            Attendex
          </span>
          {withTagline && (
            <span
              className="text-[9px] uppercase tracking-[0.18em] font-medium text-slate-400 dark:text-slate-400 mt-0.5"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              Presence with Purpose
            </span>
          )}
        </div>
      )}
    </div>
  );
}
