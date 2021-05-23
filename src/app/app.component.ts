import { Component, VERSION } from '@angular/core';
import { candidates } from './candidates';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  candidates = candidates;
  markedMale = false;
  markedFemale = false;
  checkbox = false;
  name = 'Angular ' + VERSION.major;

  toggleVisibilityMale(e){
    this.markedMale = e.target.checked;
  }
   toggleVisibilityFemale(e){
    this.markedFemale = e.target.checked;
  }

  

}
