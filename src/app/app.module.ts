import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { AadharUploadComponent } from './components/aadhar-upload/aadhar-upload.component';
import { VideoKycComponent } from './components/video-kyc/video-kyc.component';
import { AadharVideoKycComponent } from './components/aadhar-video-kyc/aadhar-video-kyc.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: AadharVideoKycComponent },
    ]),
  ],
  declarations: [
    AppComponent,
    HelloComponent,
    AadharUploadComponent,
    VideoKycComponent,
    AadharVideoKycComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
