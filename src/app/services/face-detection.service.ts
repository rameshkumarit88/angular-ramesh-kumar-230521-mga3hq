import { Injectable } from '@angular/core';
import {
  FaceBoundingBox,
  FaceDetectionResult,
  FaceQualityMetrics,
} from '../models/aadhar.model';

@Injectable({
  providedIn: 'root',
})
export class FaceDetectionService {
  private faceDetector: any = null;
  private useBrowserApi = false;
  private analysisCanvas: HTMLCanvasElement;
  private analysisCtx: CanvasRenderingContext2D;
  private previousFrameData: Uint8ClampedArray | null = null;
  private previousFaceCenter: { x: number; y: number } | null = null;

  constructor() {
    this.analysisCanvas = document.createElement('canvas');
    this.analysisCtx = this.analysisCanvas.getContext('2d')!;
    this.initBrowserApi();
  }

  private initBrowserApi(): void {
    try {
      if ('FaceDetector' in window) {
        this.faceDetector = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        this.useBrowserApi = true;
      }
    } catch {
      this.useBrowserApi = false;
    }
  }

  async detectFace(videoEl: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (this.useBrowserApi) {
      try {
        return await this.detectWithBrowserApi(videoEl);
      } catch {
        return this.detectWithSkinColor(videoEl);
      }
    }
    return this.detectWithSkinColor(videoEl);
  }

  private async detectWithBrowserApi(
    videoEl: HTMLVideoElement
  ): Promise<FaceDetectionResult> {
    const faces = await this.faceDetector.detect(videoEl);
    if (faces.length === 0) {
      return {
        detected: false,
        boundingBox: null,
        confidence: 0,
        timestamp: Date.now(),
      };
    }
    const face = faces[0];
    const box: FaceBoundingBox = {
      x: face.boundingBox.x,
      y: face.boundingBox.y,
      width: face.boundingBox.width,
      height: face.boundingBox.height,
    };
    this.updateFaceCenter(box);
    return {
      detected: true,
      boundingBox: box,
      confidence: 0.92,
      timestamp: Date.now(),
    };
  }

  private detectWithSkinColor(
    videoEl: HTMLVideoElement
  ): FaceDetectionResult {
    const w = 160;
    const h = 120;
    this.analysisCanvas.width = w;
    this.analysisCanvas.height = h;
    this.analysisCtx.drawImage(videoEl, 0, 0, w, h);

    const imageData = this.analysisCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Collect skin-colored pixels
    const skinPixels: { x: number; y: number }[] = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (this.isSkinColor(r, g, b)) {
          skinPixels.push({ x, y });
        }
      }
    }

    const totalPixels = w * h;
    const skinRatio = skinPixels.length / totalPixels;

    if (skinRatio < 0.04 || skinPixels.length < 50) {
      return {
        detected: false,
        boundingBox: null,
        confidence: 0,
        timestamp: Date.now(),
      };
    }

    // Find bounding box of skin region
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;

    for (const p of skinPixels) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }

    const regionW = maxX - minX;
    const regionH = maxY - minY;

    // Filter out non-face detections: face should have reasonable aspect ratio
    if (regionW < 15 || regionH < 18 || regionH / regionW > 3 || regionW / regionH > 2.5) {
      return {
        detected: false,
        boundingBox: null,
        confidence: 0,
        timestamp: Date.now(),
      };
    }

    // Use centroid to refine bounding box (face is typically centered in skin region)
    const centroidX = sumX / skinPixels.length;
    const centroidY = sumY / skinPixels.length;

    // Estimate face box around centroid
    const faceW = regionW * 0.85;
    const faceH = regionH * 0.9;
    const faceX = centroidX - faceW / 2;
    const faceY = centroidY - faceH / 2;

    // Scale back to video dimensions
    const scaleX = videoEl.videoWidth / w;
    const scaleY = videoEl.videoHeight / h;

    const box: FaceBoundingBox = {
      x: Math.max(0, faceX * scaleX),
      y: Math.max(0, faceY * scaleY),
      width: faceW * scaleX,
      height: faceH * scaleY,
    };

    this.updateFaceCenter(box);

    const confidence = Math.min(0.5 + skinRatio * 3, 0.88);

    return {
      detected: true,
      boundingBox: box,
      confidence,
      timestamp: Date.now(),
    };
  }

  private isSkinColor(r: number, g: number, b: number): boolean {
    // YCbCr skin color detection
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
    const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;

    return y > 60 && cb > 77 && cb < 127 && cr > 133 && cr < 173;
  }

  private updateFaceCenter(box: FaceBoundingBox): void {
    this.previousFaceCenter = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
  }

  calculateMotionScore(videoEl: HTMLVideoElement): number {
    const w = 80;
    const h = 60;
    this.analysisCanvas.width = w;
    this.analysisCanvas.height = h;
    this.analysisCtx.drawImage(videoEl, 0, 0, w, h);

    const currentData = this.analysisCtx.getImageData(0, 0, w, h).data;

    if (!this.previousFrameData) {
      this.previousFrameData = new Uint8ClampedArray(currentData);
      return 0;
    }

    let diffSum = 0;
    const pixelCount = w * h;

    for (let i = 0; i < currentData.length; i += 4) {
      const diff =
        Math.abs(currentData[i] - this.previousFrameData[i]) +
        Math.abs(currentData[i + 1] - this.previousFrameData[i + 1]) +
        Math.abs(currentData[i + 2] - this.previousFrameData[i + 2]);
      diffSum += diff;
    }

    this.previousFrameData = new Uint8ClampedArray(currentData);

    return diffSum / (pixelCount * 3);
  }

  getHorizontalShift(currentBox: FaceBoundingBox | null): number {
    if (!currentBox || !this.previousFaceCenter) {
      return 0;
    }
    const currentCenterX = currentBox.x + currentBox.width / 2;
    return currentCenterX - this.previousFaceCenter.x;
  }

  assessQuality(
    box: FaceBoundingBox,
    videoWidth: number,
    videoHeight: number
  ): FaceQualityMetrics {
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const videoCenterX = videoWidth / 2;
    const videoCenterY = videoHeight / 2;

    const offsetX = Math.abs(faceCenterX - videoCenterX) / videoWidth;
    const offsetY = Math.abs(faceCenterY - videoCenterY) / videoHeight;
    const isCentered = offsetX < 0.18 && offsetY < 0.18;

    const faceRatio = box.height / videoHeight;
    const isCorrectSize = faceRatio > 0.2 && faceRatio < 0.7;

    const isWellLit = true;

    let guidance = '';
    if (!isCentered && !isCorrectSize) {
      guidance = 'Center your face and move closer to the camera';
    } else if (!isCentered) {
      if (offsetX > 0.18) {
        const dir = faceCenterX > videoCenterX ? 'left' : 'right';
        guidance = `Move your face slightly to the ${dir}`;
      } else {
        const dir = faceCenterY > videoCenterY ? 'up' : 'down';
        guidance = `Move your face slightly ${dir}`;
      }
    } else if (!isCorrectSize) {
      guidance =
        faceRatio < 0.2
          ? 'Move closer to the camera'
          : 'Move further from the camera';
    } else {
      guidance = 'Face position is good';
    }

    let overallQuality: FaceQualityMetrics['overallQuality'] = 'poor';
    if (isCentered && isCorrectSize && isWellLit) {
      overallQuality = 'good';
    } else if (isCentered || isCorrectSize) {
      overallQuality = 'fair';
    }

    return { isCentered, isCorrectSize, isWellLit, overallQuality, guidance };
  }

  drawDetectionOverlay(
    ctx: CanvasRenderingContext2D,
    result: FaceDetectionResult,
    quality: FaceQualityMetrics | null,
    width: number,
    height: number
  ): void {
    ctx.clearRect(0, 0, width, height);

    if (!result.detected || !result.boundingBox) {
      this.drawFaceGuide(ctx, width, height, 'rgba(239, 83, 80, 0.7)');
      return;
    }

    const box = result.boundingBox;
    const color =
      quality?.overallQuality === 'good'
        ? '#4caf50'
        : quality?.overallQuality === 'fair'
        ? '#ff9800'
        : '#ef5350';

    // Draw bounding box corner markers
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    const cornerLen = Math.min(25, box.width * 0.2);

    // Top-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + cornerLen);
    ctx.lineTo(box.x, box.y);
    ctx.lineTo(box.x + cornerLen, box.y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLen, box.y);
    ctx.lineTo(box.x + box.width, box.y);
    ctx.lineTo(box.x + box.width, box.y + cornerLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + box.height - cornerLen);
    ctx.lineTo(box.x, box.y + box.height);
    ctx.lineTo(box.x + cornerLen, box.y + box.height);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Draw confidence label
    const label = `Face ${Math.round(result.confidence * 100)}%`;
    ctx.font = 'bold 13px Arial';
    const labelWidth = ctx.measureText(label).width;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(box.x, box.y - 24, labelWidth + 12, 22);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.fillText(label, box.x + 6, box.y - 8);

    // Draw face guide oval (subtle when face detected)
    ctx.globalAlpha = 0.25;
    this.drawFaceGuide(ctx, width, height, color);
    ctx.globalAlpha = 1;
  }

  private drawFaceGuide(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.16;
    const radiusY = height * 0.27;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  resetTracking(): void {
    this.previousFrameData = null;
    this.previousFaceCenter = null;
  }
}
