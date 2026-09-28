export type VerificationStage =
  | 'INITIATED'
  | 'SESSION_VALIDATING'
  | 'PROXIMITY_VERIFYING'
  | 'FACE_VERIFYING'
  | 'LIVENESS_VERIFYING'
  | 'FINAL_VALIDATION'
  | 'ATTENDANCE_ACCEPTED';

export type FinalOutcome =
  | 'ACCEPTED'
  | 'RETRY_REQUIRED'
  | 'REJECTED'
  | 'BLOCKED'
  | 'SYSTEM_ERROR';

export type FailureCategory =
  | 'SESSION'
  | 'PROXIMITY'
  | 'CAMERA'
  | 'FACE_DETECTION'
  | 'FACE_IDENTITY'
  | 'LIVENESS'
  | 'AUTHENTICATION'
  | 'SECURITY'
  | 'SYSTEM';

export type FailureCode =
  // Session
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_OPEN'
  | 'STUDENT_NOT_ENROLLED'
  | 'SESSION_ALREADY_COMPLETED'
  | 'ATTENDANCE_ALREADY_RECORDED'
  // Proximity
  | 'PROXIMITY_UNAVAILABLE'
  | 'PROXIMITY_PERMISSION_DENIED'
  | 'PROXIMITY_TIMEOUT'
  | 'PROXIMITY_SIGNAL_NOT_DETECTED'
  | 'PROXIMITY_SIGNAL_INVALID'
  | 'PROXIMITY_CHALLENGE_EXPIRED'
  | 'PROXIMITY_CHALLENGE_REPLAYED'
  | 'PROXIMITY_VERIFICATION_FAILED'
  | 'PROXIMITY_CONFLICT'
  // Camera
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_PERMISSION_BLOCKED'
  | 'CAMERA_INITIALIZATION_FAILED'
  | 'CAMERA_INTERRUPTED'
  | 'CAMERA_TIMEOUT'
  // Face Detection
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'FACE_TOO_SMALL'
  | 'FACE_OUT_OF_FRAME'
  | 'FACE_POOR_QUALITY'
  | 'FACE_POOR_POSE'
  | 'FACE_OCCLUDED'
  // Face Identity
  | 'FACE_NOT_ENROLLED'
  | 'FACE_MISMATCH'
  | 'FACE_CONFIDENCE_INSUFFICIENT'
  | 'FACE_VERIFICATION_ERROR'
  // Liveness
  | 'LIVENESS_UNAVAILABLE'
  | 'LIVENESS_TIMEOUT'
  | 'LIVENESS_FAILED'
  | 'POSSIBLE_PRESENTATION_ATTACK'
  // Auth/Device
  | 'STUDENT_NOT_AUTHENTICATED'
  | 'DEVICE_NOT_REGISTERED'
  | 'DEVICE_IDENTITY_MISMATCH'
  | 'AUTHENTICATION_EXPIRED'
  | 'AUTHORIZATION_FAILED'
  // Security
  | 'INVALID_REQUEST'
  | 'INVALID_SIGNATURE'
  | 'NONCE_INVALID'
  | 'TIMESTAMP_INVALID'
  | 'REPLAY_DETECTED'
  | 'RATE_LIMITED'
  | 'SUSPICIOUS_ACTIVITY'
  // System
  | 'NETWORK_UNAVAILABLE'
  | 'SERVER_UNAVAILABLE'
  | 'VERIFICATION_SERVICE_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

export interface FailureStateDefinition {
  code: FailureCode;
  category: FailureCategory;
  userMessage: string;
  retryable: boolean;
  securitySensitive: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  outcome: FinalOutcome;
}

export type ProximityTier = 'TIER_A' | 'TIER_B' | 'TIER_C';

export interface ProximityProof {
  providerId: 'acoustic' | 'lan' | 'ble' | 'gps';
  tier: ProximityTier;
  timestamp: number;
  nonce: string;
  confidence: number;
  payload: string;
  metrics?: Record<string, unknown>;
}

export interface FaceProof {
  providerId: string;
  matched: boolean;
  confidence: number;
  faceBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  featureVectorHash?: string;
}

export interface LivenessProof {
  passed: boolean;
  method: 'passive_micro_motion' | 'interactive_challenge';
  confidence: number;
  attackDetected?: boolean;
}

export interface AttendancePayload {
  attemptId: string;
  sessionId: string;
  studentId: string;
  deviceId: string;
  timestamp: number;
  proximityProof: ProximityProof;
  faceProof: FaceProof;
  livenessProof: LivenessProof;
  signature: string;
}

export interface VerificationResult {
  attemptId: string;
  outcome: FinalOutcome;
  stage: VerificationStage;
  failure?: FailureStateDefinition;
  verifiedAt?: string;
  attendanceId?: string;
  studentName?: string;
}
