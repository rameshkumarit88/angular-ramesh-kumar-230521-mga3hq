import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [AppComponent, HelloComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have candidates data', () => {
    expect(component.candidates).toBeDefined();
    expect(component.candidates.length).toBe(4);
  });

  it('should initialize filter flags as false', () => {
    expect(component.markedMale).toBeFalse();
    expect(component.markedFemale).toBeFalse();
  });

  it('should toggle male visibility', () => {
    const event = { target: { checked: true } };
    component.toggleVisibilityMale(event);
    expect(component.markedMale).toBeTrue();

    event.target.checked = false;
    component.toggleVisibilityMale(event);
    expect(component.markedMale).toBeFalse();
  });

  it('should toggle female visibility', () => {
    const event = { target: { checked: true } };
    component.toggleVisibilityFemale(event);
    expect(component.markedFemale).toBeTrue();

    event.target.checked = false;
    component.toggleVisibilityFemale(event);
    expect(component.markedFemale).toBeFalse();
  });

  it('should display all candidates when no filter is selected', () => {
    const compiled = fixture.nativeElement;
    const rows = compiled.querySelectorAll('tr');
    expect(rows.length).toBe(4);
  });

  it('should contain candidate first names in the rendered output', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Jeanette');
    expect(compiled.textContent).toContain('Giavani');
    expect(compiled.textContent).toContain('Noell');
    expect(compiled.textContent).toContain('Willard');
  });
});
