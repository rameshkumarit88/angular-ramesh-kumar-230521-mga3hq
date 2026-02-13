import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AadharOcrService } from '../../services/aadhar-ocr.service';
import { VideoKycService } from '../../services/video-kyc.service';
import { VideoKycSession, AadharExtractionResult } from '../../models/aadhar.model';

@Component({
  selector: 'app-aadhar-upload',
  templateUrl: './aadhar-upload.component.html',
  styleUrls: ['./aadhar-upload.component.css']
})
export class AadharUploadComponent {
  @Input() session: VideoKycSession;
  @Output() verified = new EventEmitter<void>();

  imagePreview: string | null = null;
  extractionResult: AadharExtractionResult | null = null;
  isProcessing = false;
  isDragOver = false;
  fileName = '';

  constructor(
    private aadharOcrService: AadharOcrService,
    private videoKycService: VideoKycService
  ) {}

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async extractDocument(): Promise<void> {
    if (!this.imagePreview) return;

    this.isProcessing = true;
    this.extractionResult = null;

    try {
      this.extractionResult = await this.aadharOcrService.extractFromImage(this.imagePreview);

      if (this.extractionResult.success) {
        this.videoKycService.attachAadharResult(this.session.sessionId, this.extractionResult);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  proceedToVideo(): void {
    this.verified.emit();
  }

  resetUpload(): void {
    this.imagePreview = null;
    this.extractionResult = null;
    this.fileName = '';
  }

  getMaskedAadhaar(): string {
    if (this.extractionResult?.document) {
      return this.aadharOcrService.maskAadhaarNumber(this.extractionResult.document.aadhaarNumber);
    }
    return '';
  }
}
