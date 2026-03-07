import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { FaceMatchComponent } from './face-match.component';
import { FaceMatchService } from './face-match.service';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([{ path: '', component: AppComponent }])
  ],
  declarations: [AppComponent, HelloComponent, FaceMatchComponent],
  providers: [FaceMatchService],
  bootstrap: [AppComponent]
})
export class AppModule {}
