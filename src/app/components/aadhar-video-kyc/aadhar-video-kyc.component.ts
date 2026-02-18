import { Component } from '@angular/core';
import {
  AadharDetails,
  VideoKycResult,
  KycValidationResult,
  KYC_FACE_MATCH_THRESHOLD,
} from '../../models/aadhar.model';
import { AadharValidationService } from '../../services/aadhar-validation.service';

@Component({
  selector: 'app-aadhar-video-kyc',
  templateUrl: './aadhar-video-kyc.component.html',
  styleUrls: ['./aadhar-video-kyc.component.css'],
})
export class AadharVideoKycComponent {
  currentStep: 'aadhar' | 'video' | 'result' = 'aadhar';
  aadharDetails: AadharDetails | null = null;
  videoKycResult: VideoKycResult | null = null;
  validationResult: KycValidationResult | null = null;
  isProcessing = false;
  threshold = KYC_FACE_MATCH_THRESHOLD;

  constructor(private validationService: AadharValidationService) {}

  onAadharValidated(details: AadharDetails): void {
    this.aadharDetails = details;
    this.currentStep = 'video';
  }

  onKycCaptured(result: VideoKycResult): void {
    this.videoKycResult = result;
    this.processVerification();
  }

  onGoBackToAadhar(): void {
    this.currentStep = 'aadhar';
  }

  processVerification(): void {
    this.isProcessing = true;
    this.currentStep = 'result';

    // Simulate processing delay for face matching
    setTimeout(() => {
      this.validationResult = this.validationService.performFaceMatch(
        this.aadharDetails,
        this.videoKycResult
      );
      this.isProcessing = false;
    }, 2500);
  }

  getMaskedAadhar(): string {
    if (!this.aadharDetails) {
      return '';
    }
    return this.validationService.maskAadharNumber(this.aadharDetails.aadharNumber);
  }

  resetProcess(): void {
    this.currentStep = 'aadhar';
    this.aadharDetails = null;
    this.videoKycResult = null;
    this.validationResult = null;
    this.isProcessing = false;
  }
}
