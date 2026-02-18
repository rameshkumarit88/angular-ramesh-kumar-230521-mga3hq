import { Component, EventEmitter, Output } from '@angular/core';
import { AadharDetails } from '../../models/aadhar.model';
import { AadharValidationService } from '../../services/aadhar-validation.service';

@Component({
  selector: 'app-aadhar-upload',
  templateUrl: './aadhar-upload.component.html',
  styleUrls: ['./aadhar-upload.component.css'],
})
export class AadharUploadComponent {
  @Output() aadharValidated = new EventEmitter<AadharDetails>();

  aadharNumber = '';
  name = '';
  dateOfBirth = '';
  gender = '';
  address = '';
  imageFile: File | null = null;
  imagePreviewUrl: string | null = null;

  aadharError = '';
  imageError = '';
  formSubmitted = false;
  isValid = false;

  constructor(private validationService: AadharValidationService) {}

  onAadharNumberInput(): void {
    this.aadharError = '';
    // Auto-format with spaces
    const cleaned = this.aadharNumber.replace(/\D/g, '').slice(0, 12);
    this.aadharNumber = cleaned;
  }

  validateAadharNumber(): void {
    const result = this.validationService.validateAadharFormat(this.aadharNumber);
    this.aadharError = result.valid ? '' : result.message;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const validation = this.validationService.validateImageFile(file);

    if (!validation.valid) {
      this.imageError = validation.message;
      this.imageFile = null;
      this.imagePreviewUrl = null;
      return;
    }

    this.imageError = '';
    this.imageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreviewUrl = null;
    this.imageError = '';
  }

  getFormattedAadhar(): string {
    return this.validationService.formatAadharDisplay(this.aadharNumber);
  }

  submitAadharDetails(): void {
    this.formSubmitted = true;

    const aadharValidation = this.validationService.validateAadharFormat(this.aadharNumber);
    if (!aadharValidation.valid) {
      this.aadharError = aadharValidation.message;
      return;
    }

    if (!this.name.trim()) {
      return;
    }

    if (!this.imageFile || !this.imagePreviewUrl) {
      this.imageError = 'Please upload your Aadhar card image.';
      return;
    }

    this.isValid = true;
    const details: AadharDetails = {
      aadharNumber: this.aadharNumber,
      name: this.name.trim(),
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      address: this.address.trim(),
      imageFile: this.imageFile,
      imagePreviewUrl: this.imagePreviewUrl,
    };

    this.aadharValidated.emit(details);
  }
}
