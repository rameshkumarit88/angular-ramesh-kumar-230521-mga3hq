import { Component } from '@angular/core';
import { VideoKycService } from '../../services/video-kyc.service';
import { VideoKycSession } from '../../models/aadhar.model';

@Component({
  selector: 'app-kyc-dashboard',
  templateUrl: './kyc-dashboard.component.html',
  styleUrls: ['./kyc-dashboard.component.css']
})
export class KycDashboardComponent {
  applicantName = '';
  aadhaarNumber = '';
  purpose: 'policy_verification' | 'account_opening' = 'account_opening';
  currentSession: VideoKycSession | null = null;
  currentStep = 0;
  errorMessage = '';

  constructor(private videoKycService: VideoKycService) {}

  startKyc(): void {
    this.errorMessage = '';

    if (!this.applicantName.trim()) {
      this.errorMessage = 'Please enter the applicant name.';
      return;
    }
    if (!this.aadhaarNumber.trim() || this.aadhaarNumber.replace(/\s/g, '').length !== 12) {
      this.errorMessage = 'Please enter a valid 12-digit Aadhaar number.';
      return;
    }

    this.currentSession = this.videoKycService.createSession(
      this.applicantName.trim(),
      this.aadhaarNumber.replace(/\s/g, ''),
      this.purpose
    );
    this.currentStep = 1;
  }

  onDocumentVerified(): void {
    this.currentStep = 2;
  }

  onVideoComplete(): void {
    this.currentStep = 3;
  }

  resetSession(): void {
    this.currentSession = null;
    this.currentStep = 0;
    this.applicantName = '';
    this.aadhaarNumber = '';
    this.errorMessage = '';
  }

  getPurposeLabel(): string {
    return this.purpose === 'policy_verification' ? 'Policy Verification' : 'Account Opening';
  }
}
