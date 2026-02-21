import {
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import {
  VideoKycResult,
  FaceDetectionResult,
  FaceQualityMetrics,
  LivenessChallenge,
} from '../../models/aadhar.model';
import { FaceDetectionService } from '../../services/face-detection.service';

type KycState = 'idle' | 'detecting' | 'challenges' | 'captured' | 'error';

@Component({
  selector: 'app-video-kyc',
  templateUrl: './video-kyc.component.html',
  styleUrls: ['./video-kyc.component.css'],
})
export class VideoKycComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('captureCanvas') captureCanvas: ElementRef<HTMLCanvasElement>;

  @Output() kycCaptured = new EventEmitter<VideoKycResult>();
  @Output() goBack = new EventEmitter<void>();

  stream: MediaStream | null = null;
  state: KycState = 'idle';
  capturedImageUrl: string | null = null;
  errorMessage = '';

  // Face detection state
  faceDetected = false;
  faceConfidence = 0;
  faceQuality: FaceQualityMetrics | null = null;
  detectionActive = false;
  private detectionFrameId: number | null = null;
  private lastDetectionTime = 0;
  private detectionInterval = 120;

  // Liveness challenge state
  challenges: LivenessChallenge[] = [];
  currentChallengeIndex = 0;
  challengeProgress = 0;
  livenessScore = 0;
  allChallengesComplete = false;

  // Motion tracking for challenges
  private steadyFrameCount = 0;
  private motionHistory: number[] = [];
  private horizontalShiftAccum = 0;
  private challengeStartTime = 0;

  // Countdown for capture
  countdown: number | null = null;
  isCapturing = false;

  instructions = [
    'Ensure your face is clearly visible and well-lit.',
    'Remove any face coverings, glasses, or hats.',
    'Look directly at the camera.',
    'Keep a neutral expression.',
    'Complete liveness challenges when prompted.',
  ];

  constructor(
    private faceDetectionService: FaceDetectionService,
    private ngZone: NgZone
  ) {}

  async startCamera(): Promise<void> {
    this.errorMessage = '';
    this.capturedImageUrl = null;
    this.resetDetection();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      this.state = 'detecting';

      setTimeout(() => {
        if (this.videoElement) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;
          video.onloadedmetadata = () => {
            this.setupOverlayCanvas();
            this.startDetectionLoop();
          };
        }
      }, 100);
    } catch {
      this.errorMessage =
        'Unable to access camera. Please allow camera permissions and try again.';
      this.state = 'error';
    }
  }

  private setupOverlayCanvas(): void {
    if (!this.overlayCanvas || !this.videoElement) return;
    const video = this.videoElement.nativeElement;
    const canvas = this.overlayCanvas.nativeElement;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
  }

  private startDetectionLoop(): void {
    this.detectionActive = true;
    this.faceDetectionService.resetTracking();

    this.ngZone.runOutsideAngular(() => {
      this.runDetection();
    });
  }

  private async runDetection(): Promise<void> {
    if (!this.detectionActive) return;

    const now = Date.now();
    if (now - this.lastDetectionTime >= this.detectionInterval) {
      this.lastDetectionTime = now;
      await this.performDetection();
    }

    this.detectionFrameId = requestAnimationFrame(() => this.runDetection());
  }

  private async performDetection(): Promise<void> {
    if (!this.videoElement || !this.overlayCanvas) return;

    const video = this.videoElement.nativeElement;
    if (video.readyState < 2) return;

    const result: FaceDetectionResult =
      await this.faceDetectionService.detectFace(video);

    let quality: FaceQualityMetrics | null = null;
    if (result.detected && result.boundingBox) {
      quality = this.faceDetectionService.assessQuality(
        result.boundingBox,
        video.videoWidth,
        video.videoHeight
      );
    }

    // Draw overlay
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.faceDetectionService.drawDetectionOverlay(
        ctx,
        result,
        quality,
        canvas.width,
        canvas.height
      );
    }

    // Update state in Angular zone
    this.ngZone.run(() => {
      this.faceDetected = result.detected;
      this.faceConfidence = result.confidence;
      this.faceQuality = quality;

      if (
        this.state === 'detecting' &&
        result.detected &&
        quality?.overallQuality === 'good'
      ) {
        this.steadyFrameCount++;
        if (this.steadyFrameCount > 8) {
          this.startLivenessChallenges();
        }
      } else if (this.state === 'detecting') {
        this.steadyFrameCount = Math.max(0, this.steadyFrameCount - 1);
      }

      if (this.state === 'challenges') {
        this.processChallenge(video, result);
      }
    });
  }

  private startLivenessChallenges(): void {
    this.state = 'challenges';
    this.currentChallengeIndex = 0;
    this.allChallengesComplete = false;
    this.livenessScore = 0;

    this.challenges = [
      {
        type: 'hold_steady',
        instruction: 'Hold your face steady and look at the camera',
        completed: false,
        timeLimit: 4,
      },
      {
        type: 'blink',
        instruction: 'Blink your eyes naturally',
        completed: false,
        timeLimit: 6,
      },
      {
        type: 'turn_head',
        instruction: 'Slowly turn your head to the right and back',
        completed: false,
        timeLimit: 8,
      },
    ];

    this.challengeStartTime = Date.now();
    this.motionHistory = [];
    this.horizontalShiftAccum = 0;
  }

  private processChallenge(
    video: HTMLVideoElement,
    result: FaceDetectionResult
  ): void {
    if (
      this.allChallengesComplete ||
      this.currentChallengeIndex >= this.challenges.length
    ) {
      return;
    }

    const challenge = this.challenges[this.currentChallengeIndex];
    const elapsed = (Date.now() - this.challengeStartTime) / 1000;

    if (elapsed > challenge.timeLimit) {
      this.advanceChallenge(false);
      return;
    }

    this.challengeProgress = Math.min(
      (elapsed / challenge.timeLimit) * 100,
      100
    );

    const motionScore = this.faceDetectionService.calculateMotionScore(video);
    this.motionHistory.push(motionScore);

    if (!result.detected) return;

    switch (challenge.type) {
      case 'hold_steady':
        this.processHoldSteady(motionScore, elapsed);
        break;
      case 'blink':
        this.processBlink();
        break;
      case 'turn_head':
        this.processTurnHead(result);
        break;
    }
  }

  private processHoldSteady(motionScore: number, elapsed: number): void {
    if (motionScore < 8 && this.faceDetected) {
      this.steadyFrameCount++;
    } else {
      this.steadyFrameCount = Math.max(0, this.steadyFrameCount - 2);
    }

    if (this.steadyFrameCount > 15 && elapsed > 2) {
      this.advanceChallenge(true);
    }
  }

  private processBlink(): void {
    if (this.motionHistory.length < 3) return;

    const recent = this.motionHistory.slice(-5);
    const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const hasSpike = recent.some((v) => v > avg * 1.8 && v > 4);

    if (hasSpike && this.motionHistory.length > 8) {
      this.advanceChallenge(true);
    }
  }

  private processTurnHead(result: FaceDetectionResult): void {
    if (!result.boundingBox) return;

    const shift = this.faceDetectionService.getHorizontalShift(
      result.boundingBox
    );
    this.horizontalShiftAccum += Math.abs(shift);

    if (this.horizontalShiftAccum > 80) {
      this.advanceChallenge(true);
    }
  }

  private advanceChallenge(passed: boolean): void {
    if (this.currentChallengeIndex < this.challenges.length) {
      this.challenges[this.currentChallengeIndex].completed = passed;
      if (passed) {
        this.livenessScore += Math.round(100 / this.challenges.length);
      }
    }

    this.currentChallengeIndex++;
    this.motionHistory = [];
    this.horizontalShiftAccum = 0;
    this.steadyFrameCount = 0;
    this.challengeStartTime = Date.now();
    this.challengeProgress = 0;

    if (this.currentChallengeIndex >= this.challenges.length) {
      this.allChallengesComplete = true;
      this.livenessScore = Math.min(this.livenessScore, 100);
    }
  }

  captureWithCountdown(): void {
    if (this.isCapturing) return;

    this.isCapturing = true;
    this.countdown = 3;

    const interval = setInterval(() => {
      this.countdown!--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.countdown = null;
        this.capturePhoto();
        this.isCapturing = false;
      }
    }, 1000);
  }

  captureNow(): void {
    this.capturePhoto();
  }

  private capturePhoto(): void {
    if (!this.videoElement || !this.captureCanvas) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.captureCanvas.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    }

    this.stopDetection();
    this.stopCamera();
    this.state = 'captured';
  }

  retakePhoto(): void {
    this.capturedImageUrl = null;
    this.resetDetection();
    this.startCamera();
  }

  submitCapture(): void {
    if (!this.capturedImageUrl) return;

    const completedCount = this.challenges.filter((c) => c.completed).length;

    const result: VideoKycResult = {
      capturedImageUrl: this.capturedImageUrl,
      timestamp: new Date(),
      isLive: this.livenessScore >= 60,
      livenessScore: this.livenessScore,
      challengesCompleted: completedCount,
      challengesTotal: this.challenges.length,
      faceDetected: this.faceDetected,
      faceConfidence: this.faceConfidence,
      faceQuality: this.faceQuality?.overallQuality || 'poor',
    };

    this.kycCaptured.emit(result);
  }

  private stopDetection(): void {
    this.detectionActive = false;
    if (this.detectionFrameId !== null) {
      cancelAnimationFrame(this.detectionFrameId);
      this.detectionFrameId = null;
    }
  }

  private resetDetection(): void {
    this.faceDetected = false;
    this.faceConfidence = 0;
    this.faceQuality = null;
    this.steadyFrameCount = 0;
    this.motionHistory = [];
    this.horizontalShiftAccum = 0;
    this.challenges = [];
    this.currentChallengeIndex = 0;
    this.challengeProgress = 0;
    this.livenessScore = 0;
    this.allChallengesComplete = false;
    this.faceDetectionService.resetTracking();
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  onGoBack(): void {
    this.stopDetection();
    this.stopCamera();
    this.state = 'idle';
    this.goBack.emit();
  }

  get currentChallenge(): LivenessChallenge | null {
    if (this.currentChallengeIndex < this.challenges.length) {
      return this.challenges[this.currentChallengeIndex];
    }
    return null;
  }

  get completedChallengeCount(): number {
    return this.challenges.filter((c) => c.completed).length;
  }

  ngOnDestroy(): void {
    this.stopDetection();
    this.stopCamera();
  }
}
