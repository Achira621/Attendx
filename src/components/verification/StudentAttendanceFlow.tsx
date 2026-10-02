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
  onOpenKyc?: () => void;
}

export function StudentAttendanceFlow({ session, onSuccess, onCancel, onOpenKyc }: StudentAttendanceFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"IDLE" | "PROXIMITY" | "FACE" | "RESULT">("IDLE");
  const [proximityStatus, setProximityStatus] = useState<"LISTENING" | "DETECTED" | "TIMEOUT">("LISTENING");
  const [signalStrength, setSignalStrength] = useState<number>(0);
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(null);
  const [detectedSnr, setDetectedSnr] = useState<number | null>(null);
  const [faceStatus, setFaceStatus] = useState<"WAITING" | "ALIGNING" | "CONFIRMING">("WAITING");
  const [faceGuidance, setFaceGuidance] = useState<string>("Center your face in the oval guide");
  const [result, setResult] = useState<VerificationResult | null>(null);

  // KYC Enrollment verification state
  const [enrolledHash, setEnrolledHash] = useState<string | null>(null);
  const [isEnrolledKyc, setIsEnrolledKyc] = useState<boolean>(true);
  const [faceMatchSimilarity, setFaceMatchSimilarity] = useState<number | null>(null);

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

  // Check student's enrolled biometric KYC profile
  useEffect(() => {
    if (!user) return;
    const checkKyc = async () => {
      try {
        const res = await fetch(`/api/v1/biometrics/profile?studentId=${encodeURIComponent(user.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.kycVerified && data.profile) {
            setEnrolledHash(data.profile.templateVectorHash);
            setIsEnrolledKyc(true);
          } else {
            setIsEnrolledKyc(false);
          }
        }
      } catch (err) {
        console.warn("[StudentAttendanceFlow] Could not fetch profile:", err);
      }
    };
    void checkKyc();
  }, [user]);

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
            const liveVector = faceEngineRef.current.extractFaceDescriptor(assessment.box);

            if (enrolledHash) {
              const comp = BrowserFaceVerificationEngine.compareFaceVectors(liveVector, enrolledHash);
              const simPercent = Math.round(comp.similarity * 100);
              setFaceMatchSimilarity(simPercent);
              setFaceGuidance(`Face match: ${simPercent}% with ID: ${user?.rollNumber || "CS-2026-001"}. Hold steady...`);
            } else {
              setFaceGuidance("Face aligned. Hold steady for liveness...");
            }

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
    }, 2000); // 2 second delay to allow camera lighting adjustment
  }, [enrolledHash, user]);

  const startAcousticScan = useCallback(async () => {
    try {
      const targetFrequency = session?.beaconFrequencyHz || 16500;
      // High-sensitivity mobile parameters: 600 Hz drift window, 6 dB SNR threshold
      const receiver = new AcousticReceiver(targetFrequency, 600, 6);
      acousticReceiverRef.current = receiver;

      await receiver.startListening(
        (proof: ProximityProof) => {
          orchestratorRef.current?.recordProximityProof(proof);
          setProximityStatus("DETECTED");
          setDetectedFrequency((proof.metrics?.detectedFrequency as number) || targetFrequency);
          setDetectedSnr((proof.metrics?.snrDb as number) || 10);
          receiver.stop();

          setTimeout(() => {
            transitionToFaceScan();
          }, 800);
        },
        (_spectrum, peakFreq, detected, snr, signalPercent) => {
          setSignalStrength(signalPercent);
          if (detected) {
            setDetectedFrequency(peakFreq);
            setDetectedSnr(snr);
          }
        }
      );
    } catch {
      setProximityStatus("TIMEOUT");
    }
  }, [session, transitionToFaceScan]);

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
        <Card className="border-zinc-800 bg-zinc-900/40 text-center py-6 px-5">
          {!isEnrolledKyc && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-left text-xs space-y-2 text-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-zinc-100">Face KYC Required</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Your Student ID requires an enrolled biometric face template to verify classroom attendance.
              </p>
              {onOpenKyc && (
                <Button size="sm" variant="primary" onClick={onOpenKyc} className="text-xs h-7 gap-1">
                  Complete Face KYC Scan
                </Button>
              )}
            </div>
          )}

          <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-zinc-100">Ready to Mark Attendance</h4>
          <p className="text-xs text-zinc-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
            Please ensure you are seated inside the classroom. Verification requires acoustic proximity and a single one-time face scan against your enrolled Student ID.
          </p>

          <div className="mt-5 space-y-2">
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
              {proximityStatus === "DETECTED"
                ? "Classroom Proximity Confirmed"
                : proximityStatus === "TIMEOUT"
                ? "Acoustic Signal Not Detected"
                : "Verifying Classroom Proximity..."}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-[280px] mx-auto">
              {proximityStatus === "DETECTED"
                ? "Classroom acoustic presence verified. Moving to facial verification..."
                : proximityStatus === "TIMEOUT"
                ? "Could not capture the classroom acoustic beacon. Ensure the professor has started broadcasting."
                : "Listening for the classroom acoustic beacon across the room. Keep device steady."}
            </p>
          </div>

          {/* Real-time Audio Radar Signal Meter */}
          {proximityStatus === "LISTENING" && (
            <div className="max-w-[260px] mx-auto space-y-2 pt-1">
              <div className="flex justify-between items-center text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Classroom Acoustic Radar
                </span>
                <span className="font-mono text-blue-400 font-semibold">{signalStrength}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.max(6, signalStrength)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Monitoring 16.5 kHz dual-carrier & ultrasound
              </p>
            </div>
          )}

          {/* Confirmed Metrics Tag */}
          {proximityStatus === "DETECTED" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-mono">
              <span>✓ Verified at {detectedFrequency ? (detectedFrequency / 1000).toFixed(1) : "16.5"} kHz</span>
              {detectedSnr !== null && <span>(+{detectedSnr} dB SNR)</span>}
            </div>
          )}

          {/* Timeout Recovery Actions */}
          {proximityStatus === "TIMEOUT" && (
            <div className="pt-2 flex flex-col gap-2 max-w-[260px] mx-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartVerification}
                className="text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retry Audio Scan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateProximityPass}
                className="text-xs text-zinc-400 border-zinc-700 hover:bg-zinc-800"
              >
                Confirm Physical Presence (Bypass)
              </Button>
            </div>
          )}

          {proximityStatus === "LISTENING" && (
            <div className="pt-2">
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
        <Card className="border-zinc-800 bg-zinc-900/40 p-3 text-center space-y-2.5">
          {/* Student ID Matching Header */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
              <span className="text-zinc-500">ID:</span>
              <span className="text-blue-400 font-semibold">{user?.rollNumber || "CS-2026-001"}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 truncate max-w-[120px]">{user?.name}</span>
            </div>
            {faceMatchSimilarity !== null && (
              <Badge
                variant={faceMatchSimilarity >= 70 ? "success" : "warning"}
                className="text-[10px] font-mono"
              >
                {faceMatchSimilarity}% Match
              </Badge>
            )}
          </div>

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

              <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/80 text-xs space-y-2 text-left">
                <div className="flex justify-between text-zinc-400">
                  <span>Student ID:</span>
                  <span className="font-mono text-zinc-200">{user?.rollNumber || "CS-2026-001"} ({result.studentName})</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-zinc-200">{result.verifiedAt}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Proximity:</span>
                  <span className="font-mono text-emerald-400">✓ TIER_A Acoustic Verified</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Biometric KYC Check:</span>
                  <span className="font-mono text-emerald-400">✓ Face & Liveness Verified</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Record ID:</span>
                  <span className="font-mono text-zinc-500 text-[10px] truncate max-w-[160px]">{result.attendanceId}</span>
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
