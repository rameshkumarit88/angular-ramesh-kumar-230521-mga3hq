import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { VideoKycService } from '../../services/video-kyc.service';
import { VideoKycSession, LivenessChallenge, FaceMatchResult } from '../../models/aadhar.model';

@Component({
  selector: 'app-video-capture',
  templateUrl: './video-capture.component.html',
  styleUrls: ['./video-capture.component.css']
})
export class VideoCaptureComponent implements OnInit {
  @Input() session: VideoKycSession;
  @Output() completed = new EventEmitter<void>();

  cameraActive = false;
  currentChallenge: LivenessChallenge | null = null;
  challenges: LivenessChallenge[] = [];
  faceMatchResult: FaceMatchResult | null = null;
  isProcessingChallenge = false;
  isMatchingFace = false;
  allChallengesComplete = false;
  videoPhase: 'setup' | 'liveness' | 'face_match' | 'complete' = 'setup';
  countdownValue = 0;

  constructor(private videoKycService: VideoKycService) {}

  ngOnInit(): void {
    this.challenges = this.videoKycService.getLivenessChallenges(this.session.sessionId);
    this.currentChallenge = this.videoKycService.getNextChallenge(this.session.sessionId);
  }

  startCamera(): void {
    this.cameraActive = true;
    this.videoPhase = 'liveness';
    this.videoKycService.updateSessionStatus(this.session.sessionId, 'video_started');
  }

  async completeChallenge(): Promise<void> {
    if (!this.currentChallenge || this.isProcessingChallenge) return;

    this.isProcessingChallenge = true;

    // Simulate a countdown for the challenge
    this.countdownValue = 3;
    await this.countdown();

    this.videoKycService.completeLivenessChallenge(
      this.session.sessionId,
      this.currentChallenge.id
    );

    this.currentChallenge = this.videoKycService.getNextChallenge(this.session.sessionId);
    this.challenges = this.videoKycService.getLivenessChallenges(this.session.sessionId);
    this.isProcessingChallenge = false;

    if (!this.currentChallenge) {
      this.allChallengesComplete = true;
      this.videoPhase = 'face_match';
    }
  }

  async performFaceMatch(): Promise<void> {
    this.isMatchingFace = true;
    const simulatedFrame = 'simulated-live-frame-base64-data-' + Date.now();
    this.faceMatchResult = await this.videoKycService.performFaceMatch(
      this.session.sessionId,
      simulatedFrame
    );
    this.isMatchingFace = false;
    this.videoPhase = 'complete';
  }

  proceedToResults(): void {
    this.completed.emit();
  }

  getCompletedCount(): number {
    return this.challenges.filter(c => c.completed).length;
  }

  getChallengeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'blink': 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
      'turn_left': 'M15 18l-6-6 6-6',
      'turn_right': 'M9 18l6-6-6-6',
      'smile': 'M8 14s1.5 2 4 2 4-2 4-2',
      'nod': 'M12 5v14'
    };
    return icons[type] || '';
  }

  private countdown(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        this.countdownValue--;
        if (this.countdownValue <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 800);
    });
  }
}
