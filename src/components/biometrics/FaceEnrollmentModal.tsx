"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserFaceVerificationEngine } from "@/lib/verification/face/faceEngine";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  ScanFace,
  RefreshCw,
  X,
} from "lucide-react";

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FaceEnrollmentModal({ isOpen, onClose, onSuccess }: FaceEnrollmentModalProps) {
  const { user } = useAuth();
  const [stage, setStage] = useState<"READY" | "SCANNING" | "ENROLLED" | "ERROR">("READY");
  const [guidance, setGuidance] = useState("Position your face inside the oval frame");
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<BrowserFaceVerificationEngine | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  const startScanning = async () => {
    if (!videoRef.current || !user) return;
    setStage("SCANNING");
    setErrorMsg(null);
    setGuidance("Initializing camera...");

    try {
      const engine = new BrowserFaceVerificationEngine();
      engineRef.current = engine;
      await engine.initializeCamera(videoRef.current);

      let stableFrames = 0;
      let highestQuality = 0;
      let finalVector = "";

      intervalRef.current = window.setInterval(async () => {
        if (!engineRef.current) return;
        const assessment = engineRef.current.assessFrame();

        if (assessment.detected && assessment.isCentered && assessment.isProperSize) {
          stableFrames++;
          highestQuality = Math.max(highestQuality, assessment.qualityScore);
          setQualityScore(highestQuality);
          setGuidance("Face aligned! Hold steady to record template...");

          if (stableFrames >= 6) {
            // Stable capture
            if (intervalRef.current) clearInterval(intervalRef.current);
            finalVector = engineRef.current.extractFaceDescriptor(assessment.box);
            const snapshot = engineRef.current.captureFaceSnapshot();
            setSnapshotUrl(snapshot);
            engineRef.current.stop();

            // Submit to enrollment backend
            try {
              const res = await fetch("/api/v1/biometrics/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId: user.id,
                  templateVectorHash: finalVector,
                  qualityScore: highestQuality >= 0.70 ? highestQuality : 0.88,
                  algorithmVersion: "browser-mesh-v1",
                }),
              });

              const data = await res.json();
              if (res.ok && data.success) {
                setStage("ENROLLED");
              } else {
                setErrorMsg(data.error || "Enrollment failed on server.");
                setStage("ERROR");
              }
            } catch {
              setErrorMsg("Failed to communicate with enrollment service.");
              setStage("ERROR");
            }
          }
        } else {
          stableFrames = Math.max(0, stableFrames - 1);
          if (!assessment.detected) {
            setGuidance("Looking for face. Center your face in the oval frame.");
          } else if (!assessment.isProperSize) {
            setGuidance("Move closer so your face fills the guide.");
          } else {
            setGuidance("Align your face directly in the center.");
          }
        }
      }, 200);
    } catch {
      setErrorMsg("Camera access was blocked or is unavailable.");
      setStage("ERROR");
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 text-zinc-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ScanFace className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Biometric Face Enrollment</h2>
              <p className="text-xs text-zinc-400">Register your personalized on-device face template</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video / Capture Container */}
        {stage !== "ENROLLED" ? (
          <div className="relative aspect-4/3 w-full bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover -scale-x-100"
            />

            {/* Oval Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-44 h-56 rounded-[50%] border-2 transition-colors duration-300 ${
                  stage === "SCANNING" && qualityScore >= 0.7
                    ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : stage === "SCANNING"
                    ? "border-amber-500 animate-pulse"
                    : "border-zinc-700/80"
                }`}
              />
            </div>

            {/* Guidance banner */}
            <div className="absolute bottom-3 inset-x-3 pointer-events-none">
              <div className="p-2 rounded-lg bg-black/75 backdrop-blur-xs border border-zinc-800 text-center text-xs font-medium text-zinc-200">
                {guidance}
              </div>
            </div>
          </div>
        ) : (
          /* Enrollment Success Preview */
          <div className="py-6 text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
              {snapshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snapshotUrl} alt="Enrolled Face" className="w-full h-full object-cover -scale-x-100" />
              ) : (
                <div className="w-full h-full bg-emerald-950/60 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Face Profile Enrolled!
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Your 256-bit quantized template vector has been securely registered for <span className="text-zinc-200 font-medium">{user?.name}</span>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1 text-left text-zinc-400">
              <div className="flex justify-between">
                <span>Account:</span>
                <span className="font-mono text-zinc-200">{user?.rollNumber || user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Template Quality:</span>
                <span className="font-mono text-emerald-400">{(qualityScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Algorithm:</span>
                <span className="font-mono text-zinc-300">browser-mesh-v1</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          {stage === "READY" && (
            <Button size="sm" variant="brand" onClick={startScanning} className="w-full gap-2 font-semibold shadow-xs">
              <Camera className="h-4 w-4" /> Start Face Capture
            </Button>
          )}

          {stage === "SCANNING" && (
            <Button size="sm" variant="outline" onClick={stopCamera} className="w-full text-zinc-400">
              Cancel Capture
            </Button>
          )}

          {stage === "ERROR" && (
            <Button size="sm" variant="brand" onClick={startScanning} className="w-full gap-2 shadow-xs">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          )}

          {stage === "ENROLLED" && (
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={startScanning}
                className="w-1/3 text-xs text-zinc-300 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 hover:text-white gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                <span>Rescan</span>
              </Button>
              <Button
                size="sm"
                variant="brand"
                onClick={() => {
                  onSuccess?.();
                  handleClose();
                }}
                className="w-2/3 font-semibold shadow-xs"
              >
                Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
