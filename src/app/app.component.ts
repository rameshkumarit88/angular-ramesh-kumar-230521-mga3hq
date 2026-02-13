import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: '<router-outlet></router-outlet>',
  styles: [`:host { display: block; }`]
})
export class AppComponent {}
