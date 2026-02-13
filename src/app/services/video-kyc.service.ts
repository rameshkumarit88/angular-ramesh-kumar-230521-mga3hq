import { Injectable } from '@angular/core';
import {
  VideoKycSession, KycStatus, FaceMatchResult,
  LivenessChallenge, AadharExtractionResult
} from '../models/aadhar.model';

@Injectable({ providedIn: 'root' })
export class VideoKycService {

  private sessions: Map<string, VideoKycSession> = new Map();

  /**
   * Initiates a new Video KYC session.
   */
  createSession(
    applicantName: string,
    aadhaarNumber: string,
    purpose: 'policy_verification' | 'account_opening'
  ): VideoKycSession {
    const session: VideoKycSession = {
      sessionId: this.generateSessionId(),
      applicantName,
      aadhaarNumber,
      purpose,
      status: 'initiated',
      aadharDocument: null,
      aadharExtractionResult: null,
      faceMatchResult: null,
      livenessChallenges: this.generateLivenessChallenges(),
      llmVerificationResult: null,
      createdAt: new Date(),
      completedAt: null,
      agentNotes: ''
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId: string): VideoKycSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSessionStatus(sessionId: string, status: KycStatus): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      if (status === 'approved' || status === 'rejected') {
        session.completedAt = new Date();
      }
    }
  }

  /**
   * Attaches the Aadhar extraction result to the session.
   */
  attachAadharResult(sessionId: string, result: AadharExtractionResult): void {
    const session = this.sessions.get(sessionId);
    if (session && result.success) {
      session.aadharDocument = result.document;
      session.aadharExtractionResult = result;
      session.status = 'document_verified';
    }
  }

  /**
   * Simulates face matching between the live video frame and the Aadhaar photo.
   * In production, this would use a face recognition model API.
   */
  performFaceMatch(sessionId: string, liveFrameBase64: string): Promise<FaceMatchResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const confidence = 0.80 + Math.random() * 0.19;
        const livenessScore = 0.75 + Math.random() * 0.24;

        const result: FaceMatchResult = {
          matched: confidence > 0.85,
          confidence: parseFloat(confidence.toFixed(2)),
          livenessScore: parseFloat(livenessScore.toFixed(2)),
          spoofDetected: livenessScore < 0.6
        };

        const session = this.sessions.get(sessionId);
        if (session) {
          session.faceMatchResult = result;
          if (result.matched && !result.spoofDetected) {
            session.status = 'face_matched';
          }
        }

        resolve(result);
      }, 1500);
    });
  }

  /**
   * Processes a liveness challenge (e.g., blink, turn head).
   */
  completeLivenessChallenge(sessionId: string, challengeId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const challenge = session.livenessChallenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.completed = true;
      challenge.timestamp = Date.now();

      const allCompleted = session.livenessChallenges.every(c => c.completed);
      if (allCompleted) {
        session.status = 'liveness_passed';
      }
      return true;
    }
    return false;
  }

  getLivenessChallenges(sessionId: string): LivenessChallenge[] {
    const session = this.sessions.get(sessionId);
    return session ? session.livenessChallenges : [];
  }

  getNextChallenge(sessionId: string): LivenessChallenge | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.livenessChallenges.find(c => !c.completed) || null;
  }

  getAllSessions(): VideoKycSession[] {
    return Array.from(this.sessions.values());
  }

  private generateSessionId(): string {
    return 'KYC-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateLivenessChallenges(): LivenessChallenge[] {
    return [
      {
        id: 'ch-1',
        type: 'blink',
        instruction: 'Please blink your eyes naturally',
        completed: false,
        timestamp: 0
      },
      {
        id: 'ch-2',
        type: 'turn_left',
        instruction: 'Slowly turn your head to the left',
        completed: false,
        timestamp: 0
      },
      {
        id: 'ch-3',
        type: 'turn_right',
        instruction: 'Slowly turn your head to the right',
        completed: false,
        timestamp: 0
      },
      {
        id: 'ch-4',
        type: 'smile',
        instruction: 'Please smile naturally',
        completed: false,
        timestamp: 0
      }
    ];
  }
}
