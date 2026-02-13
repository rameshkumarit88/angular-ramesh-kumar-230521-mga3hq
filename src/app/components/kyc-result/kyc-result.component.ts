import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { VideoKycService } from '../../services/video-kyc.service';
import { LlmVerificationService } from '../../services/llm-verification.service';
import {
  VideoKycSession, LlmVerificationResult, KycReport
} from '../../models/aadhar.model';

@Component({
  selector: 'app-kyc-result',
  templateUrl: './kyc-result.component.html',
  styleUrls: ['./kyc-result.component.css']
})
export class KycResultComponent implements OnInit {
  @Input() session: VideoKycSession;
  @Output() restart = new EventEmitter<void>();

  verificationResult: LlmVerificationResult | null = null;
  report: KycReport | null = null;
  isVerifying = true;
  showDetailedReport = false;

  constructor(
    private videoKycService: VideoKycService,
    private llmVerificationService: LlmVerificationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.verificationResult = await this.llmVerificationService.performVerification(this.session);
    this.session.llmVerificationResult = this.verificationResult;

    if (this.verificationResult.recommendation === 'approve') {
      this.videoKycService.updateSessionStatus(this.session.sessionId, 'approved');
    } else if (this.verificationResult.recommendation === 'reject') {
      this.videoKycService.updateSessionStatus(this.session.sessionId, 'rejected');
    } else {
      this.videoKycService.updateSessionStatus(this.session.sessionId, 'on_hold');
    }

    this.report = this.llmVerificationService.generateReport(this.session);
    this.isVerifying = false;
  }

  toggleReport(): void {
    this.showDetailedReport = !this.showDetailedReport;
  }

  startNewSession(): void {
    this.restart.emit();
  }

  getRecommendationClass(): string {
    if (!this.verificationResult) return '';
    switch (this.verificationResult.recommendation) {
      case 'approve': return 'approved';
      case 'reject': return 'rejected';
      default: return 'review';
    }
  }

  getRecommendationLabel(): string {
    if (!this.verificationResult) return '';
    switch (this.verificationResult.recommendation) {
      case 'approve': return 'APPROVED';
      case 'reject': return 'REJECTED';
      default: return 'MANUAL REVIEW REQUIRED';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 0.85) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  getStepIcon(status: string): string {
    switch (status) {
      case 'passed': return 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3';
      case 'failed': return 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 0l4 4m-4-4L8 6';
      default: return 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1 5h2v5h-2zm0 7h2v2h-2z';
    }
  }
}
