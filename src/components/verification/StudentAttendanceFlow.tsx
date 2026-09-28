"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { VerificationOrchestrator } from "@/lib/verification/orchestrator";
import { AcousticReceiver } from "@/lib/verification/acoustic/acousticEngine";
import { BrowserFaceVerificationEngine } from "@/lib/verification/face/faceEngine";
import { VerificationResult, ProximityProof } from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, Radio, ArrowRight, RotateCcw, MapPin, UserCheck } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export interface StudentAttendanceFlowProps {
  session?: {
    id: string;
    courseCode: string;
    courseName: string;
    classroomName: string;
    roomNumber: string;
    beaconFrequencyHz?: number;
    ephemeralSecret?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StudentAttendanceFlow({ session, onSuccess, onCancel }: StudentAttendanceFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"IDLE" | "PROXIMITY" | "FACE" | "RESULT">("IDLE");
  const [proximityStatus, setProximityStatus] = useState<"LISTENING" | "DETECTED" | "TIMEOUT">("LISTENING");
  const [faceStatus, setFaceStatus] = useState<"WAITING" | "ALIGNING" | "CONFIRMING">("WAITING");
  const [faceGuidance, setFaceGuidance] = useState<string>("Center your face in the oval guide");
  const [result, setResult] = useState<VerificationResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const orchestratorRef = useRef<VerificationOrchestrator | null>(null);
  const acousticReceiverRef = useRef<AcousticReceiver | null>(null);
  const faceEngineRef = useRef<BrowserFaceVerificationEngine | null>(null);
  const faceIntervalRef = useRef<number | null>(null);

  const cleanupHardware = useCallback(() => {
    if (acousticReceiverRef.current) {
      acousticReceiverRef.current.stop();
      acousticReceiverRef.current = null;
    }
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (faceEngineRef.current) {
      faceEngineRef.current.stop();
      faceEngineRef.current = null;
    }
  }, []);

  // Initialize orchestrator with real student credentials & session
  useEffect(() => {
    const effectiveStudentId = user?.id || "std_varad_001";
    const effectiveStudentName = user?.name || "Varad Dalvi";
    const effectiveSessionId = session?.id || "sess_cs302_2026";
    const deviceId = typeof window !== "undefined"
      ? (localStorage.getItem("attendex_device_id") || (() => {
          const id = "dev_" + Math.random().toString(36).substring(2, 10);
          try { localStorage.setItem("attendex_device_id", id); } catch {}
          return id;
        })())
      : "dev_browser";

    orchestratorRef.current = new VerificationOrchestrator({
      sessionId: effectiveSessionId,
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      deviceId,
    });

    return () => {
      cleanupHardware();
    };
  }, [user, session, cleanupHardware]);

  const transitionToFaceScan = useCallback(async () => {
    setStep("FACE");
    setFaceStatus("ALIGNING");

    setTimeout(async () => {
      if (!videoRef.current) return;
      try {
        const engine = new BrowserFaceVerificationEngine();
        faceEngineRef.current = engine;
        await engine.initializeCamera(videoRef.current);

        let stableFrames = 0;
        faceIntervalRef.current = window.setInterval(async () => {
          if (!faceEngineRef.current) return;
          const assessment = faceEngineRef.current.assessFrame();

          if (assessment.detected && assessment.isCentered && assessment.isProperSize) {
            stableFrames++;
            setFaceGuidance("Face aligned. Hold steady for liveness...");

            if (stableFrames >= 6) {
              setFaceStatus("CONFIRMING");
              if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);

              const faceProof = faceEngineRef.current.createFaceProof(assessment);
              const livenessProof = faceEngineRef.current.assessLiveness();

              orchestratorRef.current?.recordFaceProof(faceProof);
              orchestratorRef.current?.recordLivenessProof(livenessProof);

              faceEngineRef.current.stop();

              const finalOutcome = await orchestratorRef.current?.evaluateFinalSubmission();
              if (finalOutcome) {
                setResult(finalOutcome);
                setStep("RESULT");
              }
            }
          } else {
            stableFrames = Math.max(0, stableFrames - 1);
            if (!assessment.detected) {
              setFaceGuidance("Looking for face. Position yourself in the guide.");
            } else if (!assessment.isProperSize) {
              setFaceGuidance("Move closer to fill the oval frame.");
            } else {
              setFaceGuidance("Center your face inside the oval.");
            }
          }
        }, 200);
      } catch {
        setResult(orchestratorRef.current?.failWithCode("CAMERA_PERMISSION_DENIED") || null);
        setStep("RESULT");
      }
    }, 100);
  }, []);

  const startAcousticScan = useCallback(async () => {
    try {
      const receiver = new AcousticReceiver(18750, 350, 25);
      acousticReceiverRef.current = receiver;

      await receiver.startListening((proof: ProximityProof) => {
        orchestratorRef.current?.recordProximityProof(proof);
        setProximityStatus("DETECTED");
        receiver.stop();

        setTimeout(() => {
          transitionToFaceScan();
        }, 900);
      });
    } catch {
      setProximityStatus("TIMEOUT");
    }
  }, [transitionToFaceScan]);

  const handleStartVerification = () => {
    setStep("PROXIMITY");
    setProximityStatus("LISTENING");
    startAcousticScan();
  };

  const handleSimulateProximityPass = () => {
    if (acousticReceiverRef.current) acousticReceiverRef.current.stop();
    const mockProof: ProximityProof = {
      providerId: "acoustic",
      tier: "TIER_A",
      timestamp: 1774580000000,
      nonce: "NONCE_AC_982",
      confidence: 0.96,
      payload: "AC-BEACON-18750Hz-VERIFIED",
      metrics: { detectedFrequency: 18750, snrDb: 42 },
    };
    orchestratorRef.current?.recordProximityProof(mockProof);
    setProximityStatus("DETECTED");
    setTimeout(() => {
      transitionToFaceScan();
    }, 700);
  };

  const handleSimulateFacePass = async () => {
    cleanupHardware();
    if (orchestratorRef.current) {
      orchestratorRef.current.recordFaceProof({
        providerId: "browser-mesh-v1",
        matched: true,
        confidence: 0.94,
        featureVectorHash: "FV-DEMO-PASS",
      });
      orchestratorRef.current.recordLivenessProof({
        passed: true,
        method: "passive_micro_motion",
        confidence: 0.92,
      });
      const finalOutcome = await orchestratorRef.current.evaluateFinalSubmission();
      setResult(finalOutcome);
      setStep("RESULT");
    }
  };

  const handleReset = () => {
    cleanupHardware();
    orchestratorRef.current?.reset();
    setStep("IDLE");
    setProximityStatus("LISTENING");
    setFaceStatus("WAITING");
    setResult(null);
  };

  const courseCode = session?.courseCode || "CS-302";
  const courseName = session?.courseName || "Distributed Systems";
  const classroomDisplay = session?.classroomName
    ? `${session.classroomName}${session.roomNumber ? ` (${session.roomNumber})` : ""}`
    : "Room 402, Hall A";
  const beaconFreq = session?.beaconFrequencyHz ? `${(session.beaconFrequencyHz / 1000).toFixed(2)} kHz` : "18.75 kHz";

  return (
    <div className="max-w-[420px] mx-auto w-full">
      {/* Session Header Card */}
      <div className="mb-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Active Course Session</span>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px]">Active Now</Badge>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        <h3 className="text-base font-semibold text-zinc-100 mt-1">{courseCode}: {courseName}</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-zinc-500" /> {classroomDisplay}
          </span>
          <span className="flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 text-blue-400" /> {beaconFreq}
          </span>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="flex items-center justify-between mb-6 px-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              step === "IDLE"
                ? "bg-zinc-800 text-zinc-400"
                : proximityStatus === "DETECTED" || step === "FACE" || step === "RESULT"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-blue-600 text-white animate-pulse"
            }`}
          >
            {proximityStatus === "DETECTED" || step === "FACE" || step === "RESULT" ? "✓" : "1"}
          </span>
          <span className={step === "PROXIMITY" ? "text-zinc-100 font-medium" : "text-zinc-500"}>Proximity</span>
        </div>

        <div className="h-px w-8 bg-zinc-800" />

        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              step === "FACE"
                ? "bg-blue-600 text-white animate-pulse"
                : step === "RESULT" && result?.outcome === "ACCEPTED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {step === "RESULT" && result?.outcome === "ACCEPTED" ? "✓" : "2"}
          </span>
          <span className={step === "FACE" ? "text-zinc-100 font-medium" : "text-zinc-500"}>Face Identity</span>
        </div>

        <div className="h-px w-8 bg-zinc-800" />

        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              step === "RESULT" && result?.outcome === "ACCEPTED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {step === "RESULT" && result?.outcome === "ACCEPTED" ? "✓" : "3"}
          </span>
          <span className={step === "RESULT" ? "text-zinc-100 font-medium" : "text-zinc-500"}>Result</span>
        </div>
      </div>

      {/* Step Views */}
      {step === "IDLE" && (
        <Card className="border-zinc-800 bg-zinc-900/40 text-center py-8 px-5">
          <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-zinc-100">Ready to Mark Attendance</h4>
          <p className="text-xs text-zinc-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
            Please ensure you are seated inside the classroom. Verification requires acoustic proximity and a single one-time face scan.
          </p>

          <div className="mt-6 space-y-2">
            <Button onClick={handleStartVerification} variant="primary" size="lg" className="w-full">
              Mark Attendance <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {step === "PROXIMITY" && (
        <Card className="border-zinc-800 bg-zinc-900/40 text-center py-8 px-5 space-y-4">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border border-blue-500/30 ${
                proximityStatus === "LISTENING" ? "animate-ping opacity-40" : ""
              }`}
            />
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                proximityStatus === "DETECTED"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-blue-600/10 text-blue-400 border border-blue-500/30"
              }`}
            >
              {proximityStatus === "DETECTED" ? <CheckCircle2 className="h-7 w-7" /> : <Radio className="h-6 w-6" />}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {proximityStatus === "DETECTED" ? "Classroom Proximity Confirmed" : "Verifying Classroom Proximity..."}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-[260px] mx-auto">
              {proximityStatus === "DETECTED"
                ? "Acoustic beacon verified (TIER_A). Moving to face identity check..."
                : "Listening for the classroom acoustic beacon. Keep device steady."}
            </p>
          </div>

          {proximityStatus === "LISTENING" && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateProximityPass}
                className="text-[11px] text-zinc-400 border-dashed"
              >
                Pass Proximity (Dev Bypass)
              </Button>
            </div>
          )}
        </Card>
      )}

      {step === "FACE" && (
        <Card className="border-zinc-800 bg-zinc-900/40 p-3 text-center space-y-3">
          <div className="relative w-full aspect-[3/4] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover transform -scale-x-100" />

            {/* Oval Cutout Mask */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 133" fill="none">
                <defs>
                  <mask id="modal-oval-cutout">
                    <rect width="100" height="133" fill="white" />
                    <ellipse cx="50" cy="58" rx="26" ry="34" fill="black" />
                  </mask>
                </defs>
                <rect width="100" height="133" fill="rgba(9, 9, 11, 0.45)" mask="url(#modal-oval-cutout)" />
                <ellipse
                  cx="50"
                  cy="58"
                  rx="26"
                  ry="34"
                  stroke={faceStatus === "CONFIRMING" ? "#10b981" : "#3b82f6"}
                  strokeWidth="1.2"
                  className="transition-colors duration-200"
                />
              </svg>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-zinc-900/90 backdrop-blur-xs border border-zinc-700/60 px-3 py-1.5 rounded-full text-xs text-zinc-200 font-medium">
                {faceGuidance}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateFacePass}
              className="text-[11px] text-zinc-400 w-full border-dashed"
            >
              Verify Face (Dev Bypass)
            </Button>
          </div>
        </Card>
      )}

      {step === "RESULT" && (
        <Card className="border-zinc-800 bg-zinc-900/40 text-center py-6 px-5 space-y-4">
          {result?.outcome === "ACCEPTED" ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-zinc-100">Attendance Recorded</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Verified for <span className="text-zinc-200 font-medium">{result.studentName}</span>
                </p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 text-xs space-y-1.5 text-left">
                <div className="flex justify-between text-zinc-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-zinc-200">{result.verifiedAt}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Proximity Tier:</span>
                  <span className="font-mono text-emerald-400">TIER_A (Acoustic)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Verification Hash:</span>
                  <span className="font-mono text-zinc-400 text-[10px]">{result.attendanceId}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (onSuccess) onSuccess();
                  else handleReset();
                }}
                variant="secondary"
                className="w-full"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <ShieldAlert className="h-6 w-6" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-zinc-100">Verification Incomplete</h4>
                <p className="text-xs text-rose-300/90 mt-1 max-w-[280px] mx-auto">
                  {result?.failure?.userMessage || "Unable to confirm attendance conditions."}
                </p>
              </div>

              <Button onClick={handleReset} variant="primary" className="w-full">
                <RotateCcw className="h-4 w-4 mr-1.5" /> Try Again
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
