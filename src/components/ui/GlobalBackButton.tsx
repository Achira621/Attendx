"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function GlobalBackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 2); // 1 or 2 often means it's the first page load in some browsers
  }, []);

  if (!canGoBack) return null;

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-4 left-4 z-[100] p-2.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 shadow-xl transition-all"
      aria-label="Go Back"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
