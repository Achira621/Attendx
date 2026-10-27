import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

import { GlobalBackButton } from "@/components/ui/GlobalBackButton";
import { AmbientCanvasBackground } from "@/components/ui/AmbientCanvasBackground";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Attendex — Presence with Purpose",
  description: "AI-powered, privacy-preserving, edge-first attendance for classrooms and organisations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0B0F19] text-[#F8FAFC] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59] relative">
        <AmbientCanvasBackground />
        <div className="relative z-10 flex flex-col flex-1">
          <GlobalBackButton />
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
