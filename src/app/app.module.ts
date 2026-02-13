import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { KycDashboardComponent } from './components/kyc-dashboard/kyc-dashboard.component';
import { AadharUploadComponent } from './components/aadhar-upload/aadhar-upload.component';
import { VideoCaptureComponent } from './components/video-capture/video-capture.component';
import { KycResultComponent } from './components/kyc-result/kyc-result.component';

import { AadharOcrService } from './services/aadhar-ocr.service';
import { VideoKycService } from './services/video-kyc.service';
import { LlmVerificationService } from './services/llm-verification.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: KycDashboardComponent },
      { path: '**', redirectTo: '' }
    ])
  ],
  declarations: [
    AppComponent,
    HelloComponent,
    KycDashboardComponent,
    AadharUploadComponent,
    VideoCaptureComponent,
    KycResultComponent
  ],
  providers: [
    AadharOcrService,
    VideoKycService,
    LlmVerificationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
