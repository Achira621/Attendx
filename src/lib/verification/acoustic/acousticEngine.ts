import { ProximityProof, ProximityTier } from "@/types/verification";

export interface AcousticBeaconConfig {
  frequency: number; // In Hz, e.g. 18750 (near-ultrasound) or 16500 (clean high acoustic)
  pulseDurationMs: number;
  intervalMs: number;
  mode: 'ultrasonic' | 'audible_fallback';
  token: string;
  gainLevel?: number; // 0.01 to 0.12 (default: 0.05 to prevent laptop speaker buzz)
}

export class AcousticEmitter {
  private audioCtx: AudioContext | null = null;
  private isEmitting = false;
  private timer: number | null = null;

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
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.config.frequency, now);

      // Low gain with smooth exponential attack/decay prevents speaker clipping and buzzing
      const peakGain = Math.min(0.12, Math.max(0.01, this.config.gainLevel ?? 0.05));
      const pulseDurationSec = this.config.pulseDurationMs / 1000;
      const rampTime = Math.min(0.08, pulseDurationSec / 4);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + rampTime);
      gain.gain.setValueAtTime(peakGain, now + pulseDurationSec - rampTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + pulseDurationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + pulseDurationSec);
    } catch (err) {
      console.warn("[AcousticEmitter] Pulse emit error:", err);
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
    private targetFrequency: number = 18750,
    private bandwidthHz: number = 500, // 500 Hz window tolerance for clock drift
    private detectionThreshold: number = 10 // 10 dB SNR above noise floor (tuned for mobile phone mics)
  ) {}

  public async startListening(
    onDetect: (proof: ProximityProof) => void,
    onSpectrum?: (spectrum: Uint8Array, peakFreq: number, detected: boolean, snr: number) => void
  ): Promise<void> {
    if (this.isListening) return;

    // Mobile mic constraints: request raw audio without aggressive speech low-pass filters
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.5;
    source.connect(this.analyser);

    this.isListening = true;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = this.audioCtx.sampleRate;
    const nyquist = sampleRate / 2;

    const targetBin = Math.round((this.targetFrequency / nyquist) * bufferLength);
    const binWindow = Math.max(2, Math.round((this.bandwidthHz / nyquist) * bufferLength));

    let consecutiveHits = 0;
    const REQUIRED_HITS = 2; // Fast detection: 2 consecutive frames (~30ms)

    const analyze = () => {
      if (!this.isListening || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Compute ambient baseline noise floor around high-frequency band (excluding target)
      let noiseSum = 0;
      let noiseCount = 0;
      const startBin = Math.max(0, targetBin - binWindow * 5);
      const endBin = Math.min(bufferLength - 1, targetBin + binWindow * 5);

      for (let i = startBin; i <= endBin; i++) {
        if (Math.abs(i - targetBin) > binWindow) {
          noiseSum += dataArray[i];
          noiseCount++;
        }
      }
      const baselineNoise = noiseCount > 0 ? noiseSum / noiseCount : 8;

      // Find max signal in target band window
      let peakSignal = 0;
      let peakBin = targetBin;
      for (let i = targetBin - binWindow; i <= targetBin + binWindow; i++) {
        if (i >= 0 && i < bufferLength) {
          if (dataArray[i] > peakSignal) {
            peakSignal = dataArray[i];
            peakBin = i;
          }
        }
      }

      const peakFreq = Math.round((peakBin / bufferLength) * nyquist);
      const snr = Math.max(0, peakSignal - baselineNoise);

      // Detection condition: signal rises above local high-frequency noise floor
      const detected = snr >= this.detectionThreshold && peakSignal >= 12;

      if (detected) {
        consecutiveHits++;
        if (consecutiveHits >= REQUIRED_HITS) {
          const confidence = Math.min(1.0, 0.75 + (snr / 60));
          const proof: ProximityProof = {
            providerId: 'acoustic',
            tier: 'TIER_A' as ProximityTier,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(2, 10),
            confidence: Number(confidence.toFixed(2)),
            payload: `AC-BEACON-${peakFreq}Hz-${Date.now()}`,
            metrics: {
              targetFrequency: this.targetFrequency,
              detectedFrequency: peakFreq,
              snrDb: Math.round(snr),
              signalMagnitude: peakSignal,
              noiseFloor: Math.round(baselineNoise),
            },
          };
          onDetect(proof);
          consecutiveHits = 0;
        }
      } else {
        consecutiveHits = Math.max(0, consecutiveHits - 1);
      }

      if (onSpectrum) {
        onSpectrum(dataArray, peakFreq, detected, Math.round(snr));
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
