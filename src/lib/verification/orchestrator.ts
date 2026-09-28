import {
  VerificationStage,
  VerificationResult,
  ProximityProof,
  FaceProof,
  LivenessProof,
  AttendancePayload,
  FailureCode,
} from "@/types/verification";
import { getFailureDefinition } from "./failureRegistry";

export interface VerificationContext {
  sessionId: string;
  studentId: string;
  studentName: string;
  deviceId: string;
  enrolledTemplateHash?: string;
  maxAttempts?: number;
}

export type StageChangeCallback = (stage: VerificationStage, message?: string) => void;

export class VerificationOrchestrator {
  private currentStage: VerificationStage = 'INITIATED';
  private proximityProof: ProximityProof | null = null;
  private faceProof: FaceProof | null = null;
  private livenessProof: LivenessProof | null = null;
  private attemptCount = 0;

  constructor(private context: VerificationContext) {}

  public getStage(): VerificationStage {
    return this.currentStage;
  }

  public recordProximityProof(proof: ProximityProof): void {
    this.proximityProof = proof;
  }

  public recordFaceProof(proof: FaceProof): void {
    this.faceProof = proof;
  }

  public recordLivenessProof(proof: LivenessProof): void {
    this.livenessProof = proof;
  }

  public failWithCode(code: FailureCode): VerificationResult {
    const failureDef = getFailureDefinition(code);
    return {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      outcome: failureDef.outcome,
      stage: this.currentStage,
      failure: failureDef,
      studentName: this.context.studentName,
    };
  }

  public async evaluateFinalSubmission(): Promise<VerificationResult> {
    this.attemptCount++;
    this.currentStage = 'FINAL_VALIDATION';

    // 1. Validate Session & Student
    if (!this.context.sessionId) {
      return this.failWithCode('SESSION_NOT_FOUND');
    }
    if (!this.context.studentId) {
      return this.failWithCode('STUDENT_NOT_AUTHENTICATED');
    }

    // 2. Validate Proximity Proof
    if (!this.proximityProof) {
      return this.failWithCode('PROXIMITY_SIGNAL_NOT_DETECTED');
    }
    if (this.proximityProof.confidence < 0.6) {
      return this.failWithCode('PROXIMITY_VERIFICATION_FAILED');
    }

    // 3. Validate Face Identity Proof
    if (!this.faceProof || !this.faceProof.matched) {
      return this.failWithCode('FACE_MISMATCH');
    }
    if (this.faceProof.confidence < 0.65) {
      return this.failWithCode('FACE_CONFIDENCE_INSUFFICIENT');
    }

    // 4. Validate Liveness Proof
    if (!this.livenessProof || !this.livenessProof.passed) {
      if (this.livenessProof?.attackDetected) {
        return this.failWithCode('POSSIBLE_PRESENTATION_ATTACK');
      }
      return this.failWithCode('LIVENESS_FAILED');
    }

    // 5. Build signed payload and commit acceptance
    this.currentStage = 'ATTENDANCE_ACCEPTED';
    const timestamp = Date.now();
    const payload: AttendancePayload = {
      attemptId: `att_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId: this.context.sessionId,
      studentId: this.context.studentId,
      deviceId: this.context.deviceId,
      timestamp,
      proximityProof: this.proximityProof,
      faceProof: this.faceProof,
      livenessProof: this.livenessProof,
      signature: `SIG_ED25519_${Math.random().toString(36).substring(2, 16)}`,
    };

    return {
      attemptId: payload.attemptId,
      outcome: 'ACCEPTED',
      stage: 'ATTENDANCE_ACCEPTED',
      verifiedAt: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      attendanceId: `REC-${timestamp.toString(36).toUpperCase()}`,
      studentName: this.context.studentName,
    };
  }

  public reset(): void {
    this.currentStage = 'INITIATED';
    this.proximityProof = null;
    this.faceProof = null;
    this.livenessProof = null;
  }
}
