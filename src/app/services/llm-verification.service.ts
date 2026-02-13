import { Injectable } from '@angular/core';
import {
  VideoKycSession, LlmVerificationResult,
  KycReport, VerificationStep
} from '../models/aadhar.model';

@Injectable({ providedIn: 'root' })
export class LlmVerificationService {

  /**
   * Simulates an LLM-powered comprehensive KYC verification.
   *
   * In production, this would send all collected data (OCR results,
   * face match scores, liveness data, document images) to an LLM API
   * with a structured prompt to get an intelligent risk assessment.
   *
   * The LLM would analyze:
   * 1. Document authenticity indicators
   * 2. Cross-reference data consistency
   * 3. Face match confidence interpretation
   * 4. Liveness detection results
   * 5. Risk pattern recognition
   * 6. Regulatory compliance checks
   */
  performVerification(session: VideoKycSession): Promise<LlmVerificationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const docScore = this.assessDocumentAuthenticity(session);
        const dataScore = this.assessDataConsistency(session);
        const faceScore = session.faceMatchResult?.confidence || 0;
        const livenessScore = session.faceMatchResult?.livenessScore || 0;

        const overallScore = parseFloat(
          ((docScore * 0.3) + (dataScore * 0.2) + (faceScore * 0.3) + (livenessScore * 0.2)).toFixed(2)
        );

        const riskFlags = this.identifyRiskFlags(session, docScore, dataScore);
        const recommendation = this.determineRecommendation(overallScore, riskFlags);

        const result: LlmVerificationResult = {
          overallScore,
          documentAuthenticity: parseFloat(docScore.toFixed(2)),
          dataConsistency: parseFloat(dataScore.toFixed(2)),
          faceMatchConfidence: faceScore,
          livenessConfidence: livenessScore,
          riskFlags,
          recommendation,
          summary: this.generateSummary(session, overallScore, recommendation),
          detailedAnalysis: this.generateDetailedAnalysis(session, docScore, dataScore, faceScore, livenessScore, riskFlags)
        };

        resolve(result);
      }, 3000);
    });
  }

  /**
   * Generates a full KYC report for regulatory compliance.
   */
  generateReport(session: VideoKycSession): KycReport {
    const steps: VerificationStep[] = [];

    steps.push({
      step: 'Document Upload',
      status: session.aadharDocument ? 'passed' : 'failed',
      details: session.aadharDocument
        ? `Aadhaar document uploaded and parsed. Extracted name: ${session.aadharDocument.fullName}`
        : 'Document not uploaded or parsing failed',
      timestamp: session.createdAt
    });

    steps.push({
      step: 'OCR & Data Extraction',
      status: session.aadharExtractionResult?.success ? 'passed' : 'failed',
      details: session.aadharExtractionResult
        ? `LLM-based OCR completed with ${(session.aadharExtractionResult.confidence * 100).toFixed(0)}% confidence`
        : 'OCR extraction not performed',
      timestamp: new Date(session.createdAt.getTime() + 2000)
    });

    const allLivenessPassed = session.livenessChallenges.every(c => c.completed);
    steps.push({
      step: 'Liveness Detection',
      status: allLivenessPassed ? 'passed' : 'failed',
      details: `${session.livenessChallenges.filter(c => c.completed).length}/${session.livenessChallenges.length} challenges completed`,
      timestamp: new Date(session.createdAt.getTime() + 5000)
    });

    steps.push({
      step: 'Face Match Verification',
      status: session.faceMatchResult?.matched ? 'passed' : (session.faceMatchResult ? 'failed' : 'warning'),
      details: session.faceMatchResult
        ? `Face match confidence: ${(session.faceMatchResult.confidence * 100).toFixed(0)}%. Spoof detected: ${session.faceMatchResult.spoofDetected ? 'Yes' : 'No'}`
        : 'Face match not performed',
      timestamp: new Date(session.createdAt.getTime() + 7000)
    });

    steps.push({
      step: 'LLM Risk Assessment',
      status: session.llmVerificationResult
        ? (session.llmVerificationResult.recommendation === 'approve' ? 'passed' : session.llmVerificationResult.recommendation === 'reject' ? 'failed' : 'warning')
        : 'warning',
      details: session.llmVerificationResult
        ? `Overall score: ${(session.llmVerificationResult.overallScore * 100).toFixed(0)}%. Recommendation: ${session.llmVerificationResult.recommendation.toUpperCase()}`
        : 'LLM verification not completed',
      timestamp: new Date(session.createdAt.getTime() + 10000)
    });

    return {
      session,
      generatedAt: new Date(),
      reportId: 'RPT-' + Date.now().toString(36).toUpperCase(),
      verificationSteps: steps,
      finalDecision: session.status === 'approved' ? 'APPROVED' : session.status === 'rejected' ? 'REJECTED' : 'PENDING REVIEW',
      complianceNotes: this.generateComplianceNotes(session)
    };
  }

  private assessDocumentAuthenticity(session: VideoKycSession): number {
    if (!session.aadharExtractionResult?.success) return 0;
    return 0.80 + Math.random() * 0.19;
  }

  private assessDataConsistency(session: VideoKycSession): number {
    if (!session.aadharDocument) return 0;
    let score = 0.7;
    if (session.aadharDocument.fullName && session.aadharDocument.fullName.length > 3) score += 0.1;
    if (session.aadharDocument.dateOfBirth) score += 0.05;
    if (session.aadharDocument.address && session.aadharDocument.address.length > 10) score += 0.05;
    if (session.aadharDocument.pincode && /^\d{6}$/.test(session.aadharDocument.pincode)) score += 0.05;
    return Math.min(score + Math.random() * 0.05, 1.0);
  }

  private identifyRiskFlags(session: VideoKycSession, docScore: number, dataScore: number): string[] {
    const flags: string[] = [];
    if (docScore < 0.85) flags.push('Document authenticity score below threshold');
    if (dataScore < 0.80) flags.push('Data consistency concerns detected');
    if (session.faceMatchResult && !session.faceMatchResult.matched) flags.push('Face match failed');
    if (session.faceMatchResult?.spoofDetected) flags.push('Possible spoof attempt detected');
    if (session.faceMatchResult && session.faceMatchResult.livenessScore < 0.8) flags.push('Liveness score below confidence threshold');
    const incompleteChallenges = session.livenessChallenges.filter(c => !c.completed);
    if (incompleteChallenges.length > 0) flags.push(`${incompleteChallenges.length} liveness challenge(s) incomplete`);
    return flags;
  }

  private determineRecommendation(overallScore: number, riskFlags: string[]): 'approve' | 'reject' | 'manual_review' {
    if (overallScore >= 0.85 && riskFlags.length === 0) return 'approve';
    if (overallScore < 0.60 || riskFlags.length >= 3) return 'reject';
    return 'manual_review';
  }

  private generateSummary(session: VideoKycSession, score: number, recommendation: string): string {
    const purposeText = session.purpose === 'policy_verification'
      ? 'insurance policy verification' : 'account opening';

    if (recommendation === 'approve') {
      return `Video KYC for ${purposeText} completed successfully. All verification checks passed with an overall confidence score of ${(score * 100).toFixed(0)}%. The applicant's identity has been verified against their Aadhaar document. Recommendation: APPROVE.`;
    } else if (recommendation === 'reject') {
      return `Video KYC for ${purposeText} has failed verification. Multiple risk indicators were detected with an overall score of ${(score * 100).toFixed(0)}%. The application cannot be processed. Recommendation: REJECT.`;
    }
    return `Video KYC for ${purposeText} requires manual review. The overall verification score is ${(score * 100).toFixed(0)}% which falls in the review zone. Some risk flags require human assessment. Recommendation: MANUAL REVIEW.`;
  }

  private generateDetailedAnalysis(
    session: VideoKycSession,
    docScore: number,
    dataScore: number,
    faceScore: number,
    livenessScore: number,
    riskFlags: string[]
  ): string {
    return `
=== LLM-POWERED KYC VERIFICATION ANALYSIS ===

Applicant: ${session.applicantName}
Purpose: ${session.purpose === 'policy_verification' ? 'Policy Verification' : 'Account Opening'}
Session: ${session.sessionId}

--- DOCUMENT VERIFICATION ---
Aadhaar Number: ${session.aadharDocument ? 'XXXX-XXXX-' + session.aadharDocument.aadhaarNumber.slice(8) : 'N/A'}
Document Authenticity Score: ${(docScore * 100).toFixed(1)}%
Analysis: The uploaded Aadhaar document has been analyzed for visual consistency,
font patterns, hologram indicators, and layout conformance.

--- DATA CONSISTENCY ---
Consistency Score: ${(dataScore * 100).toFixed(1)}%
Name Extracted: ${session.aadharDocument?.fullName || 'N/A'}
DOB Extracted: ${session.aadharDocument?.dateOfBirth || 'N/A'}
Address Verified: ${session.aadharDocument?.address || 'N/A'}
Analysis: Cross-referencing extracted fields for internal consistency and format validity.

--- BIOMETRIC VERIFICATION ---
Face Match Confidence: ${(faceScore * 100).toFixed(1)}%
Liveness Score: ${(livenessScore * 100).toFixed(1)}%
Spoof Detection: ${session.faceMatchResult?.spoofDetected ? 'ALERT - Possible spoof' : 'Clear'}
Challenges Completed: ${session.livenessChallenges.filter(c => c.completed).length}/${session.livenessChallenges.length}

--- RISK FLAGS ---
${riskFlags.length === 0 ? 'No risk flags identified.' : riskFlags.map((f, i) => `${i + 1}. ${f}`).join('\n')}

--- COMPLIANCE ---
KYC Regulation: RBI Video KYC Guidelines
Data Protection: Aadhaar data handled per UIDAI guidelines
Consent: Customer consent obtained for video recording and document processing
    `.trim();
  }

  private generateComplianceNotes(session: VideoKycSession): string {
    return `This KYC verification was conducted in compliance with RBI\'s Video-based Customer Identification Process (V-CIP) guidelines. ` +
      `Aadhaar data was processed in accordance with UIDAI regulations. ` +
      `Session initiated at ${session.createdAt.toISOString()}. ` +
      `Purpose: ${session.purpose === 'policy_verification' ? 'Insurance Policy Verification' : 'Account Opening'}.`;
  }
}
