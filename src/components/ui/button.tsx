import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "brand" | "coral" | "purple" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]";

    const variants = {
      primary: "bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-white dark:text-[#0F172A] dark:hover:bg-slate-100 font-semibold shadow-xs",
      brand: "bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#7C3AED] text-white hover:opacity-95 font-semibold shadow-xs",
      coral: "bg-[#FF7A59] text-white hover:bg-[#F4643F] font-semibold shadow-xs",
      purple: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] font-semibold shadow-xs",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
      outline: "border border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
      ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
      destructive: "bg-rose-600 text-white hover:bg-rose-500 shadow-xs",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs sm:text-sm font-semibold rounded-lg gap-2",
      md: "h-10 px-4.5 text-sm sm:text-base font-semibold rounded-lg gap-2",
      lg: "h-12 px-6 text-base sm:text-lg font-semibold rounded-xl gap-2.5",
      icon: "h-10 w-10 rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
