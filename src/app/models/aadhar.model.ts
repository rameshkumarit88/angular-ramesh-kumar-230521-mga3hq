export interface AadharDocument {
  aadhaarNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  pincode: string;
  photoBase64: string;
  issueDate: string;
  isValid: boolean;
}

export interface AadharExtractionResult {
  success: boolean;
  document: AadharDocument | null;
  confidence: number;
  errors: string[];
  rawOcrText: string;
}

export interface FaceMatchResult {
  matched: boolean;
  confidence: number;
  livenessScore: number;
  spoofDetected: boolean;
}

export interface LivenessChallenge {
  id: string;
  type: 'blink' | 'turn_left' | 'turn_right' | 'smile' | 'nod';
  instruction: string;
  completed: boolean;
  timestamp: number;
}

export interface VideoKycSession {
  sessionId: string;
  applicantName: string;
  aadhaarNumber: string;
  purpose: 'policy_verification' | 'account_opening';
  status: KycStatus;
  aadharDocument: AadharDocument | null;
  aadharExtractionResult: AadharExtractionResult | null;
  faceMatchResult: FaceMatchResult | null;
  livenessChallenges: LivenessChallenge[];
  llmVerificationResult: LlmVerificationResult | null;
  createdAt: Date;
  completedAt: Date | null;
  agentNotes: string;
}

export type KycStatus =
  | 'initiated'
  | 'document_uploaded'
  | 'document_verified'
  | 'video_started'
  | 'liveness_passed'
  | 'face_matched'
  | 'llm_verified'
  | 'approved'
  | 'rejected'
  | 'on_hold';

export interface LlmVerificationResult {
  overallScore: number;
  documentAuthenticity: number;
  dataConsistency: number;
  faceMatchConfidence: number;
  livenessConfidence: number;
  riskFlags: string[];
  recommendation: 'approve' | 'reject' | 'manual_review';
  summary: string;
  detailedAnalysis: string;
}

export interface KycReport {
  session: VideoKycSession;
  generatedAt: Date;
  reportId: string;
  verificationSteps: VerificationStep[];
  finalDecision: string;
  complianceNotes: string;
}

export interface VerificationStep {
  step: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
  timestamp: Date;
}
