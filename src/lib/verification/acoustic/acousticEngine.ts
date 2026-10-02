import { ProximityProof, ProximityTier } from "@/types/verification";

export type AcousticReachMode = 'whole_classroom' | 'standard' | 'near_ultrasonic';

export interface AcousticBeaconConfig {
  frequency: number; // Primary carrier in Hz (e.g. 16500 for whole classroom reach or 18750)
  secondaryFrequency?: number; // Complementary carrier to eliminate standing wave nulls (e.g. 17500)
  pulseDurationMs: number;
  intervalMs: number;
  mode: 'ultrasonic' | 'audible_fallback';
  reachMode?: AcousticReachMode;
  token: string;
  gainLevel?: number; // 0.05 to 0.35 (protected by high-pass biquad filter)
}

export class AcousticEmitter {
  private audioCtx: AudioContext | null = null;
  private isEmitting = false;
  private timer: number | null = null;
  private highpassFilter: BiquadFilterNode | null = null;

  constructor(private config: AcousticBeaconConfig) {}

  public async start(): Promise<void> {
    if (this.isEmitting) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API not supported in this browser");
    }

    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // High-pass filter cuts off sub-14kHz noise and DAC intermodulation pops
    // This allows higher gain for whole-room reach without laptop speaker buzz!
    this.highpassFilter = this.audioCtx.createBiquadFilter();
    this.highpassFilter.type = 'highpass';
    this.highpassFilter.frequency.setValueAtTime(14000, this.audioCtx.currentTime);
    this.highpassFilter.Q.setValueAtTime(0.707, this.audioCtx.currentTime);
    this.highpassFilter.connect(this.audioCtx.destination);

    this.isEmitting = true;
    this.schedulePulse();
  }

  private schedulePulse(): void {
    if (!this.isEmitting || !this.audioCtx) return;

    this.emitSinglePulse();
    this.timer = window.setTimeout(() => {
      this.schedulePulse();
    }, this.config.intervalMs);
  }

  private emitSinglePulse(): void {
    if (!this.audioCtx || !this.highpassFilter) return;

    try {
      const now = this.audioCtx.currentTime;
      const reachMode = this.config.reachMode || 'whole_classroom';

      // Whole-classroom reach mode uses dual-carrier (e.g. 16.5 kHz + 17.5 kHz)
      // to eliminate destructive standing wave nulls across the room
      let primaryFreq = this.config.frequency || 16500;
      let secondaryFreq = this.config.secondaryFrequency || 17500;
      let targetGain = this.config.gainLevel ?? 0.30;

      if (reachMode === 'whole_classroom') {
        primaryFreq = 16500;
        secondaryFreq = 17500;
        targetGain = Math.min(0.38, Math.max(0.18, targetGain));
      } else if (reachMode === 'standard') {
        primaryFreq = 17500;
        secondaryFreq = 18200;
        targetGain = Math.min(0.28, Math.max(0.10, targetGain));
      } else if (reachMode === 'near_ultrasonic') {
        primaryFreq = 18750;
        secondaryFreq = 0;
        targetGain = Math.min(0.20, Math.max(0.06, targetGain));
      }

      const pulseDurationSec = Math.max(0.8, this.config.pulseDurationMs / 1000);
      const rampTime = Math.min(0.06, pulseDurationSec / 6);

      // Primary Carrier
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(primaryFreq, now);

      const splitGain = secondaryFreq > 0 ? targetGain * 0.72 : targetGain;
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(splitGain, now + rampTime);
      gain1.gain.setValueAtTime(splitGain, now + pulseDurationSec - rampTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + pulseDurationSec);

      osc1.connect(gain1);
      gain1.connect(this.highpassFilter);
      osc1.start(now);
      osc1.stop(now + pulseDurationSec);

      // Secondary Carrier (Dual-Band Spread)
      if (secondaryFreq > 0) {
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(secondaryFreq, now);

        gain2.gain.setValueAtTime(0.0001, now);
        gain2.gain.exponentialRampToValueAtTime(splitGain, now + rampTime);
        gain2.gain.setValueAtTime(splitGain, now + pulseDurationSec - rampTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + pulseDurationSec);

        osc2.connect(gain2);
        gain2.connect(this.highpassFilter);
        osc2.start(now);
        osc2.stop(now + pulseDurationSec);
      }
    } catch (err) {
      console.warn("[AcousticEmitter] Pulse emit error:", err);
    }
  }

  /**
   * Play an audible 200ms test chime so the teacher can verify their speakers are unmuted
   */
  public async playTestChime(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') await ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6 note

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 400);
    } catch (err) {
      console.warn("[AcousticEmitter] Test chime failed:", err);
    }
  }

  public updateConfig(newConfig: Partial<AcousticBeaconConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public stop(): void {
    this.isEmitting = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.highpassFilter = null;
    }
  }

  public getStatus(): { isEmitting: boolean; config: AcousticBeaconConfig } {
    return {
      isEmitting: this.isEmitting,
      config: { ...this.config },
    };
  }
}

export class AcousticReceiver {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isListening = false;

  constructor(
    private targetFrequency: number = 16500, // Default to whole classroom reach frequency
    private bandwidthHz: number = 1200, // 1200 Hz window tolerance for mobile clock drift & acoustic dispersion
    private detectionThreshold: number = 2 // 2 dB SNR above clean ambient noise floor (sensitive across classroom)
  ) {}

  public async startListening(
    onDetect: (proof: ProximityProof) => void,
    onSpectrum?: (spectrum: Uint8Array, peakFreq: number, detected: boolean, snr: number, signalPercent: number) => void
  ): Promise<void> {
    if (this.isListening) return;

    // Mobile microphone capture: prioritize high sample rate and agc for distant beacons
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: 1,
        },
      });
    } catch {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
          },
        });
      } catch {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.25; // Responsive reaction time
    source.connect(this.analyser);

    this.isListening = true;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = this.audioCtx.sampleRate;
    const nyquist = sampleRate / 2;

    // Frequencies monitored for classroom acoustic presence:
    // 1) Target frequency (from session or default reach frequency)
    // 2) Standard classroom carriers (16500 Hz, 17500 Hz, 18750 Hz)
    const monitoredFrequencies = Array.from(new Set([
      this.targetFrequency,
      16500,
      17500,
      18750,
    ])).filter((f) => f > 0 && f < nyquist - 200);

    let consecutiveHits = 0;
    const REQUIRED_HITS = 2; // Fast trigger on 2 positive frames (~35ms)

    const analyze = () => {
      if (!this.isListening || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Compute ambient baseline noise floor in high-frequency zone (14 kHz - 21 kHz)
      // EXCLUDE all monitored carrier bands (±900 Hz) so the beacon's own energy does NOT inflate baseline noise
      const noiseMinBin = Math.max(0, Math.round((14000 / nyquist) * bufferLength));
      const noiseMaxBin = Math.min(bufferLength - 1, Math.round((21000 / nyquist) * bufferLength));

      let noiseSum = 0;
      let noiseCount = 0;
      for (let i = noiseMinBin; i <= noiseMaxBin; i++) {
        const binFreq = (i / bufferLength) * nyquist;
        const isCarrierZone = monitoredFrequencies.some(
          (freq) => Math.abs(binFreq - freq) < 900
        );
        if (!isCarrierZone) {
          noiseSum += dataArray[i];
          noiseCount++;
        }
      }
      const baselineNoise = noiseCount > 0 ? Math.max(1, noiseSum / noiseCount) : 3;

      // Scan all candidate classroom beacon carriers
      let bestSignal = 0;
      let bestSnr = 0;
      let bestFreq = this.targetFrequency;

      for (const freq of monitoredFrequencies) {
        const centerBin = Math.round((freq / nyquist) * bufferLength);
        const win = Math.max(2, Math.round((this.bandwidthHz / nyquist) * bufferLength));

        for (let i = Math.max(0, centerBin - win); i <= Math.min(bufferLength - 1, centerBin + win); i++) {
          const val = dataArray[i];
          if (val > bestSignal) {
            bestSignal = val;
            bestSnr = Math.max(0, val - baselineNoise);
            bestFreq = Math.round((i / bufferLength) * nyquist);
          }
        }
      }

      // Detection condition: Signal exceeds isolated noise floor by threshold, or distinct peak
      const detected = (bestSnr >= this.detectionThreshold && bestSignal >= 6) || bestSignal >= 16;
      const signalPercent = Math.min(100, Math.round((bestSnr / 12) * 100));

      if (detected) {
        consecutiveHits++;
        if (consecutiveHits >= REQUIRED_HITS) {
          const confidence = Math.min(1.0, 0.85 + (bestSnr / 40));
          const proof: ProximityProof = {
            providerId: 'acoustic',
            tier: 'TIER_A' as ProximityTier,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(2, 10),
            confidence: Number(confidence.toFixed(2)),
            payload: `AC-BEACON-${bestFreq}Hz-${Date.now()}`,
            metrics: {
              targetFrequency: this.targetFrequency,
              detectedFrequency: bestFreq,
              snrDb: Math.round(bestSnr),
              signalMagnitude: bestSignal,
              noiseFloor: Math.round(baselineNoise),
              reachMode: bestFreq <= 17000 ? "whole_classroom_reach" : "near_ultrasound",
            },
          };
          onDetect(proof);
          consecutiveHits = 0;
        }
      } else {
        consecutiveHits = Math.max(0, consecutiveHits - 1);
      }

      if (onSpectrum) {
        onSpectrum(dataArray, bestFreq, detected, Math.round(bestSnr), signalPercent);
      }

      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  public stop(): void {
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  public getListeningStatus(): boolean {
    return this.isListening;
  }
}

