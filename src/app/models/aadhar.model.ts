export interface AadharDetails {
  aadharNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

export interface VideoKycResult {
  capturedImageUrl: string | null;
  timestamp: Date | null;
  isLive: boolean;
}

export interface KycValidationResult {
  aadharValid: boolean;
  videoKycComplete: boolean;
  faceMatchScore: number;
  faceMatchPassed: boolean;
  overallStatus: 'pending' | 'in_progress' | 'passed' | 'failed';
  remarks: string;
}

export const KYC_FACE_MATCH_THRESHOLD = 70;
