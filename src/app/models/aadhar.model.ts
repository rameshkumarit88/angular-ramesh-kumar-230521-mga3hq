export interface AadharDetails {
  aadharNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceDetectionResult {
  detected: boolean;
  boundingBox: FaceBoundingBox | null;
  confidence: number;
  timestamp: number;
}

export interface FaceQualityMetrics {
  isCentered: boolean;
  isCorrectSize: boolean;
  isWellLit: boolean;
  overallQuality: 'good' | 'fair' | 'poor';
  guidance: string;
}

export type LivenessChallengeType = 'hold_steady' | 'blink' | 'turn_head';

export interface LivenessChallenge {
  type: LivenessChallengeType;
  instruction: string;
  completed: boolean;
  timeLimit: number;
}

export interface VideoKycResult {
  capturedImageUrl: string | null;
  timestamp: Date | null;
  isLive: boolean;
  livenessScore: number;
  challengesCompleted: number;
  challengesTotal: number;
  faceDetected: boolean;
  faceConfidence: number;
  faceQuality: string;
}

export interface KycValidationResult {
  aadharValid: boolean;
  videoKycComplete: boolean;
  faceMatchScore: number;
  faceMatchPassed: boolean;
  livenessScore: number;
  livenessPassed: boolean;
  challengesCompleted: number;
  challengesTotal: number;
  faceDetectionConfidence: number;
  overallStatus: 'pending' | 'in_progress' | 'passed' | 'failed';
  remarks: string;
}

export const KYC_FACE_MATCH_THRESHOLD = 70;
export const KYC_LIVENESS_THRESHOLD = 60;
