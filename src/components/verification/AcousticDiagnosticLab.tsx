"use client";

import React, { useState, useEffect, useRef } from "react";
import { AcousticEmitter, AcousticReceiver } from "@/lib/verification/acoustic/acousticEngine";
import { ProximityProof } from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Volume2, Mic, Play, Square, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

export function AcousticDiagnosticLab() {
  const [emitterActive, setEmitterActive] = useState(false);
  const [emitterFreq, setEmitterFreq] = useState<number>(18750);
  const [emitterMode, setEmitterMode] = useState<"ultrasonic" | "audible_fallback">("ultrasonic");

  const [receiverActive, setReceiverActive] = useState(false);
  const [receiverFreq, setReceiverFreq] = useState<number>(18750);
  const [detectedProof, setDetectedProof] = useState<ProximityProof | null>(null);
  const [detectionLogs, setDetectionLogs] = useState<string[]>([]);
  const [receiverError, setReceiverError] = useState<string | null>(null);

  const emitterRef = useRef<AcousticEmitter | null>(null);
  const receiverRef = useRef<AcousticReceiver | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleStartEmitter = async () => {
    try {
      if (!emitterRef.current) {
        emitterRef.current = new AcousticEmitter({
          frequency: emitterFreq,
          pulseDurationMs: 800,
          intervalMs: 1500,
          mode: emitterMode,
          token: "SESSION-DEMO-2026",
        });
      } else {
        emitterRef.current.updateConfig({
          frequency: emitterFreq,
          mode: emitterMode,
        });
      }
      await emitterRef.current.start();
      setEmitterActive(true);
    } catch (err: unknown) {
      alert("Failed to start audio emitter: " + (err as Error).message);
    }
  };

  const handleStopEmitter = () => {
    if (emitterRef.current) {
      emitterRef.current.stop();
      emitterRef.current = null;
    }
    setEmitterActive(false);
  };

  const handleStartReceiver = async () => {
    try {
      setReceiverError(null);
      receiverRef.current = new AcousticReceiver(receiverFreq, 350, 30);

      await receiverRef.current.startListening(
        (proof) => {
          setDetectedProof(proof);
          setDetectionLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] BEACON VERIFIED: ${proof.metrics?.detectedFrequency}Hz (SNR: +${proof.metrics?.snrDb}dB, Conf: ${(proof.confidence * 100).toFixed(0)}%)`,
            ...prev.slice(0, 7),
          ]);
        },
        (spectrum, peakFreq, detected) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw high-frequency spectrum slice (top 40% of bins)
          const startBin = Math.floor(spectrum.length * 0.6);
          const binWidth = canvas.width / (spectrum.length - startBin);

          for (let i = startBin; i < spectrum.length; i++) {
            const val = spectrum[i];
            const barHeight = (val / 255) * canvas.height;
            const x = (i - startBin) * binWidth;
            const y = canvas.height - barHeight;

            ctx.fillStyle = detected ? "#10b981" : "#3b82f6";
            ctx.fillRect(x, y, Math.max(1, binWidth - 1), barHeight);
          }
        }
      );
      setReceiverActive(true);
    } catch (err: unknown) {
      setReceiverError("Microphone access denied or audio device unavailable: " + (err as Error).message);
      setReceiverActive(false);
    }
  };

  const handleStopReceiver = () => {
    if (receiverRef.current) {
      receiverRef.current.stop();
      receiverRef.current = null;
    }
    setReceiverActive(false);
  };

  useEffect(() => {
    return () => {
      if (emitterRef.current) emitterRef.current.stop();
      if (receiverRef.current) receiverRef.current.stop();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Radio className="h-5 w-5 text-blue-400" />
            Acoustic Proximity Diagnostic Lab
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Test and evaluate ultrasonic beacon emission and FFT receiver decoding on your physical hardware.
          </p>
        </div>
        <Badge variant={emitterActive || receiverActive ? "success" : "neutral"}>
          {emitterActive || receiverActive ? "Hardware Active" : "Standby"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transmitter Card */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Volume2 className="h-4 w-4 text-zinc-400" />
                Teacher Beacon Emitter (Classroom Speaker)
              </CardTitle>
              <Badge variant={emitterActive ? "success" : "outline"}>
                {emitterActive ? "Emitting Pulses" : "Off"}
              </Badge>
            </div>
            <CardDescription>
              Broadcasts a repeating cryptographic challenge pulse over Web Audio API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Carrier Frequency Preset</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmitterFreq(18750);
                    setEmitterMode("ultrasonic");
                  }}
                  className={`p-2.5 rounded border text-xs text-left transition-all ${
                    emitterFreq === 18750
                      ? "border-blue-500 bg-blue-950/30 text-blue-200"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-semibold text-zinc-200">18.75 kHz (Inaudible)</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Near-ultrasonic standard</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmitterFreq(15000);
                    setEmitterMode("audible_fallback");
                  }}
                  className={`p-2.5 rounded border text-xs text-left transition-all ${
                    emitterFreq === 15000
                      ? "border-blue-500 bg-blue-950/30 text-blue-200"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-semibold text-zinc-200">15.00 kHz (Fallback)</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Audible test chirp</div>
                </button>
              </div>
            </div>

            <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/80 text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Active Frequency:</span>
                <span className="text-zinc-200 font-mono tabular-nums">{emitterFreq} Hz</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Pulse Interval:</span>
                <span className="text-zinc-200 font-mono">1500 ms (800ms pulse)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Envelope:</span>
                <span className="text-zinc-200 font-mono">Anti-click Hanning/Linear ramp</span>
              </div>
            </div>

            <div className="pt-2">
              {!emitterActive ? (
                <Button onClick={handleStartEmitter} variant="primary" className="w-full">
                  <Play className="h-4 w-4" /> Start Beacon Emitter
                </Button>
              ) : (
                <Button onClick={handleStopEmitter} variant="destructive" className="w-full">
                  <Square className="h-4 w-4" /> Stop Emitter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receiver Card */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mic className="h-4 w-4 text-zinc-400" />
                Student Beacon Receiver (Device Microphone)
              </CardTitle>
              <Badge variant={receiverActive ? "success" : "outline"}>
                {receiverActive ? "Listening (FFT 2048)" : "Off"}
              </Badge>
            </div>
            <CardDescription>
              Captures live ambient audio, computes FFT bins, and isolates target proximity carrier frequency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Target Listening Band</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={receiverFreq === 18750 ? "primary" : "secondary"}
                  onClick={() => setReceiverFreq(18750)}
                  disabled={receiverActive}
                >
                  18.75 kHz
                </Button>
                <Button
                  size="sm"
                  variant={receiverFreq === 15000 ? "primary" : "secondary"}
                  onClick={() => setReceiverFreq(15000)}
                  disabled={receiverActive}
                >
                  15.00 kHz
                </Button>
              </div>
            </div>

            {/* FFT Canvas */}
            <div className="relative rounded bg-zinc-950 border border-zinc-800 overflow-hidden">
              <canvas ref={canvasRef} width={400} height={90} className="w-full h-[90px] block" />
              <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-500">
                14 kHz – 22 kHz spectrum
              </div>
            </div>

            {receiverError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{receiverError}</span>
              </div>
            )}

            {detectedProof && (
              <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Proximity Verified (TIER_A)
                </div>
                <div className="flex justify-between text-zinc-400 mt-1">
                  <span>Detected Peak:</span>
                  <span className="font-mono text-zinc-200">{String(detectedProof.metrics?.detectedFrequency ?? "—")} Hz</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Signal-to-Noise Ratio:</span>
                  <span className="font-mono text-zinc-200">+{String(detectedProof.metrics?.snrDb ?? "—")} dB</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Confidence:</span>
                  <span className="font-mono text-zinc-200">{(detectedProof.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              {!receiverActive ? (
                <Button onClick={handleStartReceiver} variant="secondary" className="w-full">
                  <Activity className="h-4 w-4" /> Start Acoustic Receiver
                </Button>
              ) : (
                <Button onClick={handleStopReceiver} variant="destructive" className="w-full">
                  <Square className="h-4 w-4" /> Stop Receiver
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Detection Log */}
      <Card className="border-zinc-800/80 bg-zinc-900/30">
        <CardHeader className="py-3">
          <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
            Acoustic Signal Event Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="font-mono text-[11px] space-y-1 bg-zinc-950 p-3 rounded border border-zinc-800/80 min-h-[90px]">
            {detectionLogs.length === 0 ? (
              <div className="text-zinc-600">No detection events yet. Start both emitter and receiver to verify hardware.</div>
            ) : (
              detectionLogs.map((log, idx) => (
                <div key={idx} className="text-emerald-400 flex items-center gap-2">
                  <span>▸</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
