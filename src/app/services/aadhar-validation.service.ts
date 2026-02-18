import { Injectable } from '@angular/core';
import {
  AadharDetails,
  VideoKycResult,
  KycValidationResult,
  KYC_FACE_MATCH_THRESHOLD,
} from '../models/aadhar.model';

@Injectable({
  providedIn: 'root',
})
export class AadharValidationService {
  // Verhoeff algorithm tables
  private static readonly MULTIPLICATION_TABLE: number[][] = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];

  private static readonly PERMUTATION_TABLE: number[][] = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];

  private static readonly INVERSE_TABLE: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  validateAadharFormat(aadharNumber: string): { valid: boolean; message: string } {
    if (!aadharNumber) {
      return { valid: false, message: 'Aadhar number is required.' };
    }

    const cleaned = aadharNumber.replace(/\s/g, '');

    if (!/^\d{12}$/.test(cleaned)) {
      return { valid: false, message: 'Aadhar number must be exactly 12 digits.' };
    }

    if (/^[01]/.test(cleaned)) {
      return { valid: false, message: 'Aadhar number cannot start with 0 or 1.' };
    }

    if (!this.verhoeffCheck(cleaned)) {
      return { valid: false, message: 'Invalid Aadhar number (checksum failed).' };
    }

    return { valid: true, message: 'Aadhar number is valid.' };
  }

  private verhoeffCheck(number: string): boolean {
    let c = 0;
    const digits = number.split('').map(Number).reverse();
    for (let i = 0; i < digits.length; i++) {
      c =
        AadharValidationService.MULTIPLICATION_TABLE[c][
          AadharValidationService.PERMUTATION_TABLE[i % 8][digits[i]]
        ];
    }
    return c === 0;
  }

  validateImageFile(file: File): { valid: boolean; message: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSizeMB = 5;

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Only JPG/PNG images are allowed.' };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, message: `Image size must be less than ${maxSizeMB}MB.` };
    }

    return { valid: true, message: 'Image file is valid.' };
  }

  performFaceMatch(
    aadharDetails: AadharDetails,
    videoKycResult: VideoKycResult
  ): KycValidationResult {
    if (!aadharDetails.imagePreviewUrl || !videoKycResult.capturedImageUrl) {
      return {
        aadharValid: !!aadharDetails.aadharNumber,
        videoKycComplete: false,
        faceMatchScore: 0,
        faceMatchPassed: false,
        overallStatus: 'failed',
        remarks: 'Both Aadhar image and video KYC photo are required for face matching.',
      };
    }

    // Simulated face match score (in production, this would call a face recognition API)
    const faceMatchScore = this.simulateFaceMatchScore();
    const faceMatchPassed = faceMatchScore >= KYC_FACE_MATCH_THRESHOLD;

    const aadharValidation = this.validateAadharFormat(aadharDetails.aadharNumber);

    const overallStatus: KycValidationResult['overallStatus'] =
      aadharValidation.valid && videoKycResult.isLive && faceMatchPassed
        ? 'passed'
        : 'failed';

    let remarks = '';
    if (!aadharValidation.valid) {
      remarks += 'Aadhar validation failed. ';
    }
    if (!videoKycResult.isLive) {
      remarks += 'Liveness check failed. ';
    }
    if (!faceMatchPassed) {
      remarks += `Face match score (${faceMatchScore}%) is below the threshold (${KYC_FACE_MATCH_THRESHOLD}%). `;
    }
    if (overallStatus === 'passed') {
      remarks = 'All KYC checks passed successfully.';
    }

    return {
      aadharValid: aadharValidation.valid,
      videoKycComplete: true,
      faceMatchScore,
      faceMatchPassed,
      overallStatus,
      remarks: remarks.trim(),
    };
  }

  private simulateFaceMatchScore(): number {
    // Simulates a face match score between 60-99 for demo purposes.
    // In production, replace with an actual face recognition API call.
    return Math.floor(Math.random() * 40) + 60;
  }

  formatAadharDisplay(aadharNumber: string): string {
    const cleaned = aadharNumber.replace(/\s/g, '');
    if (cleaned.length !== 12) {
      return aadharNumber;
    }
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
  }

  maskAadharNumber(aadharNumber: string): string {
    const cleaned = aadharNumber.replace(/\s/g, '');
    if (cleaned.length !== 12) {
      return aadharNumber;
    }
    return `XXXX XXXX ${cleaned.slice(8, 12)}`;
  }
}
