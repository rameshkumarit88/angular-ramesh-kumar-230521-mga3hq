import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { VideoKycResult } from '../../models/aadhar.model';

@Component({
  selector: 'app-video-kyc',
  templateUrl: './video-kyc.component.html',
  styleUrls: ['./video-kyc.component.css'],
})
export class VideoKycComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement: ElementRef<HTMLCanvasElement>;

  @Output() kycCaptured = new EventEmitter<VideoKycResult>();
  @Output() goBack = new EventEmitter<void>();

  stream: MediaStream | null = null;
  cameraActive = false;
  capturedImageUrl: string | null = null;
  errorMessage = '';
  countdown: number | null = null;
  isCapturing = false;
  instructions = [
    'Ensure your face is clearly visible and well-lit.',
    'Remove any face coverings, glasses, or hats.',
    'Look directly at the camera.',
    'Keep a neutral expression.',
    'Make sure the background is plain.',
  ];

  async startCamera(): Promise<void> {
    this.errorMessage = '';
    this.capturedImageUrl = null;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      this.cameraActive = true;

      // Wait for view to update with the video element
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
        }
      }, 100);
    } catch (err) {
      this.errorMessage =
        'Unable to access camera. Please allow camera permissions and try again.';
      this.cameraActive = false;
    }
  }

  captureWithCountdown(): void {
    if (this.isCapturing) {
      return;
    }

    this.isCapturing = true;
    this.countdown = 3;

    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.countdown = null;
        this.capturePhoto();
        this.isCapturing = false;
      }
    }, 1000);
  }

  private capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    }

    this.stopCamera();
  }

  retakePhoto(): void {
    this.capturedImageUrl = null;
    this.startCamera();
  }

  submitCapture(): void {
    if (!this.capturedImageUrl) {
      return;
    }

    const result: VideoKycResult = {
      capturedImageUrl: this.capturedImageUrl,
      timestamp: new Date(),
      isLive: true, // In production, liveness detection would verify this
    };

    this.kycCaptured.emit(result);
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.cameraActive = false;
  }

  onGoBack(): void {
    this.stopCamera();
    this.goBack.emit();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
