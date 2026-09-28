"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrowserFaceVerificationEngine, FaceDetectionAssessment } from "@/lib/verification/face/faceEngine";
import { LivenessProof } from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, ShieldCheck, AlertCircle, Eye } from "lucide-react";

export function FaceDiagnosticLab() {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<FaceDetectionAssessment | null>(null);
  const [liveness, setLiveness] = useState<LivenessProof | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<BrowserFaceVerificationEngine | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const handleStartCamera = async () => {
    try {
      setCameraError(null);
      if (!videoRef.current) return;

      const engine = new BrowserFaceVerificationEngine();
      engineRef.current = engine;
      await engine.initializeCamera(videoRef.current);
      setCameraActive(true);

      frameIntervalRef.current = window.setInterval(() => {
        if (!engineRef.current) return;
        const currentAssessment = engineRef.current.assessFrame();
        setAssessment(currentAssessment);

        const currentLiveness = engineRef.current.assessLiveness();
        setLiveness(currentLiveness);
      }, 150);
    } catch (err: unknown) {
      setCameraError((err as Error).message);
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setCameraActive(false);
    setAssessment(null);
    setLiveness(null);
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-400" />
            Face Verification & Liveness Diagnostic Lab
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Test on-device facial bounding, lighting thresholds, centering, and passive micro-liveness evaluation.
          </p>
        </div>
        <Badge variant={cameraActive ? "success" : "neutral"}>
          {cameraActive ? "Camera Streaming (Local)" : "Camera Offline"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Camera Viewport & Oval Guide */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[440px] aspect-[3/4] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-lg">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                cameraActive ? "block" : "hidden"
              }`}
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                <Camera className="h-10 w-10 mb-3 stroke-[1.5] text-zinc-600" />
                <p className="text-sm font-medium text-zinc-300">Camera preview is standby</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
                  Click &apos;Activate Camera&apos; to evaluate biometric alignment directly inside your browser.
                </p>
              </div>
            )}

            {/* SVG Biometric Oval Guide */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 133" fill="none">
                  {/* Subtle darkened backdrop mask around face */}
                  <defs>
                    <mask id="oval-cutout">
                      <rect width="100" height="133" fill="white" />
                      <ellipse cx="50" cy="58" rx="26" ry="34" fill="black" />
                    </mask>
                  </defs>
                  <rect width="100" height="133" fill="rgba(9, 9, 11, 0.45)" mask="url(#oval-cutout)" />

                  {/* Target Alignment Guide Ring */}
                  <ellipse
                    cx="50"
                    cy="58"
                    rx="26"
                    ry="34"
                    stroke={
                      assessment?.detected && assessment.isCentered && assessment.isProperSize
                        ? "#10b981"
                        : assessment?.detected
                        ? "#f59e0b"
                        : "#3f3f46"
                    }
                    strokeWidth="1.2"
                    strokeDasharray={assessment?.detected ? "none" : "3 3"}
                    className="transition-colors duration-200"
                  />
                </svg>

                {/* Status Guidance Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <div className="bg-zinc-900/90 backdrop-blur-xs border border-zinc-700/60 px-3.5 py-1.5 rounded-full text-xs text-zinc-200 font-medium shadow-md flex items-center gap-1.5">
                    {assessment?.detected ? (
                      assessment.isCentered && assessment.isProperSize ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" /> Perfect Alignment
                        </span>
                      ) : !assessment.isProperSize ? (
                        <span className="text-amber-400">Move closer to fill the oval</span>
                      ) : (
                        <span className="text-amber-400">Center your face in the guide</span>
                      )
                    ) : (
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Looking for face...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-[440px] pt-4">
            {!cameraActive ? (
              <Button onClick={handleStartCamera} variant="primary" className="w-full">
                <Camera className="h-4 w-4" /> Activate Camera
              </Button>
            ) : (
              <Button onClick={handleStopCamera} variant="secondary" className="w-full">
                Deactivate Camera
              </Button>
            )}
          </div>
        </div>

        {/* Diagnostic Telemetry Panel */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-zinc-800/80 bg-zinc-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Real-time Biometric Telemetry</CardTitle>
              <CardDescription>
                Zero pixels sent to cloud. Analyzed entirely inside client memory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Face Detected:</span>
                <span className="font-semibold text-zinc-200">
                  {assessment?.detected ? "YES (1 face)" : "NO"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Center Alignment:</span>
                <span className={`font-semibold ${assessment?.isCentered ? "text-emerald-400" : "text-zinc-400"}`}>
                  {assessment?.isCentered ? "PASSED" : "NEEDS ADJUSTMENT"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Distance / Scale Ratio:</span>
                <span className={`font-semibold ${assessment?.isProperSize ? "text-emerald-400" : "text-amber-400"}`}>
                  {assessment?.isProperSize ? "OPTIMAL" : "OUT OF BOUNDS"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Luminance (Ambient Light):</span>
                <span className="font-mono text-zinc-200">
                  {assessment ? `${Math.round(assessment.brightness)} / 255` : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Passive Liveness (Micro-motion):</span>
                <span
                  className={`font-semibold ${
                    liveness?.passed
                      ? "text-emerald-400"
                      : liveness?.attackDetected
                      ? "text-rose-400"
                      : "text-zinc-400"
                  }`}
                >
                  {liveness?.passed ? "VERIFIED (LIVE)" : liveness?.attackDetected ? "STATIC ATTACK" : "EVALUATING..."}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-zinc-400">Quality Confidence:</span>
                <span className="font-mono text-zinc-100 font-semibold">
                  {assessment ? `${(assessment.qualityScore * 100).toFixed(0)}%` : "0%"}
                </span>
              </div>
            </CardContent>
          </Card>

          {cameraError && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Camera Access Error</div>
                <div className="text-[11px] text-rose-400/90 mt-0.5">{cameraError}</div>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 text-zinc-400 text-xs space-y-1">
            <div className="font-medium text-zinc-300">Privacy Guarantee</div>
            <p className="text-[11px] leading-relaxed">
              In accordance with our architectural rules, the video stream never leaves this device. Only an Ed25519-signed verification assertion is transmitted upon confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
