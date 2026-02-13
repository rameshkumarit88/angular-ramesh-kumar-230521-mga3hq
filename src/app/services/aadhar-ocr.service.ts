import { Injectable } from '@angular/core';
import { AadharDocument, AadharExtractionResult } from '../models/aadhar.model';

@Injectable({ providedIn: 'root' })
export class AadharOcrService {

  /**
   * Simulates LLM-based OCR extraction from an Aadhar card image.
   * In production, this would call an actual LLM API (e.g., GPT-4 Vision,
   * Claude Vision) to extract structured data from the document image.
   */
  extractFromImage(imageBase64: string): Promise<AadharExtractionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!imageBase64 || imageBase64.length < 100) {
          resolve({
            success: false,
            document: null,
            confidence: 0,
            errors: ['Invalid or unreadable image. Please upload a clear photo of your Aadhaar card.'],
            rawOcrText: ''
          });
          return;
        }

        const extractedDoc: AadharDocument = {
          aadhaarNumber: this.generateMaskedAadhaar(),
          fullName: this.simulateNameExtraction(),
          dateOfBirth: this.simulateDobExtraction(),
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          address: this.simulateAddressExtraction(),
          pincode: this.simulatePincodeExtraction(),
          photoBase64: this.extractFaceRegion(imageBase64),
          issueDate: '2020-03-15',
          isValid: true
        };

        const confidence = 0.85 + Math.random() * 0.14;

        resolve({
          success: true,
          document: extractedDoc,
          confidence: parseFloat(confidence.toFixed(2)),
          errors: [],
          rawOcrText: this.generateSimulatedOcrText(extractedDoc)
        });
      }, 2000);
    });
  }

  /**
   * Validates the Aadhaar number using the Verhoeff algorithm checksum.
   */
  validateAadhaarNumber(aadhaarNumber: string): boolean {
    const cleaned = aadhaarNumber.replace(/\s/g, '');
    if (cleaned.length !== 12 || !/^\d{12}$/.test(cleaned)) {
      return false;
    }
    if (/^[01]/.test(cleaned)) {
      return false;
    }
    return this.verhoeffCheck(cleaned);
  }

  /**
   * Masks the Aadhaar number for display (shows only last 4 digits).
   */
  maskAadhaarNumber(aadhaarNumber: string): string {
    const cleaned = aadhaarNumber.replace(/\s/g, '');
    if (cleaned.length !== 12) return 'XXXX-XXXX-XXXX';
    return `XXXX-XXXX-${cleaned.slice(8)}`;
  }

  private verhoeffCheck(num: string): boolean {
    const d = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,2,3,4,0,6,7,8,9,5],
      [2,3,4,0,1,7,8,9,5,6],
      [3,4,0,1,2,8,9,5,6,7],
      [4,0,1,2,3,9,5,6,7,8],
      [5,9,8,7,6,0,4,3,2,1],
      [6,5,9,8,7,1,0,4,3,2],
      [7,6,5,9,8,2,1,0,4,3],
      [8,7,6,5,9,3,2,1,0,4],
      [9,8,7,6,5,4,3,2,1,0]
    ];
    const p = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,5,7,6,2,8,3,0,9,4],
      [5,8,0,3,7,9,6,1,4,2],
      [8,9,1,6,0,4,3,5,2,7],
      [9,4,5,3,1,2,6,8,7,0],
      [4,2,8,6,5,7,3,9,0,1],
      [2,7,9,3,8,0,6,4,1,5],
      [7,0,4,6,9,1,3,2,5,8]
    ];
    const inv = [0,4,3,2,1,5,6,7,8,9];

    let c = 0;
    const digits = num.split('').map(Number).reverse();
    for (let i = 0; i < digits.length; i++) {
      c = d[c][p[i % 8][digits[i]]];
    }
    return c === 0;
  }

  private generateMaskedAadhaar(): string {
    const digits = [];
    digits.push(Math.floor(Math.random() * 8) + 2);
    for (let i = 1; i < 12; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    return digits.join('');
  }

  private simulateNameExtraction(): string {
    const names = [
      'Rajesh Kumar Sharma', 'Priya Devi Singh', 'Amit Patel',
      'Sunita Kumari Verma', 'Vikram Joshi', 'Anita Reddy'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private simulateDobExtraction(): string {
    const year = 1970 + Math.floor(Math.random() * 35);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private simulateAddressExtraction(): string {
    const addresses = [
      'H.No 42, Sector 15, Gurgaon, Haryana',
      '301, Sunshine Apartments, MG Road, Bangalore, Karnataka',
      'Plot 78, Nehru Nagar, Bhopal, Madhya Pradesh',
      '12/3, Anna Salai, Chennai, Tamil Nadu'
    ];
    return addresses[Math.floor(Math.random() * addresses.length)];
  }

  private simulatePincodeExtraction(): string {
    const pincodes = ['122001', '560001', '462001', '600002'];
    return pincodes[Math.floor(Math.random() * pincodes.length)];
  }

  private extractFaceRegion(imageBase64: string): string {
    return imageBase64.substring(0, 200);
  }

  private generateSimulatedOcrText(doc: AadharDocument): string {
    return `GOVERNMENT OF INDIA\nAADHAAR\n${doc.fullName}\nDOB: ${doc.dateOfBirth}\n${doc.gender}\n${doc.address}\n${doc.pincode}\nAadhaar No: ${this.maskAadhaarNumber(doc.aadhaarNumber)}`;
  }
}
