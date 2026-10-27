"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function GlobalBackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanGoBack(window.history.length > 2);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!canGoBack) return null;

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-4 left-4 z-[100] p-2.5 rounded-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-xl transition-all cursor-pointer"
      aria-label="Go Back"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
