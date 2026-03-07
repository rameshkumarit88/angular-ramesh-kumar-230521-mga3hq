import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FaceMatchComponent } from './face-match.component';
import { FaceMatchService } from './face-match.service';

describe('FaceMatchComponent', () => {
  let component: FaceMatchComponent;
  let fixture: ComponentFixture<FaceMatchComponent>;
  let faceMatchService: FaceMatchService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [FaceMatchComponent],
      providers: [FaceMatchService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaceMatchComponent);
    component = fixture.componentInstance;
    faceMatchService = TestBed.inject(FaceMatchService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have all candidates loaded', () => {
    expect(component.allCandidates.length).toBe(4);
  });

  it('should initialize with empty search state', () => {
    expect(component.searchName).toBe('');
    expect(component.selectedGender).toBe('');
    expect(component.matchResults).toEqual([]);
    expect(component.searched).toBeFalse();
  });

  it('should search by name and return matches', () => {
    component.searchName = 'Jeanette';
    component.onSearch();
    expect(component.matchResults.length).toBe(1);
    expect(component.matchResults[0].candidate.first_name).toBe('Jeanette');
    expect(component.searched).toBeTrue();
  });

  it('should search by gender and return matches', () => {
    component.selectedGender = 'Male';
    component.onSearch();
    expect(component.matchResults.length).toBe(2);
    component.matchResults.forEach(r =>
      expect(r.candidate.gender).toBe('Male')
    );
  });

  it('should search by both name and gender', () => {
    component.searchName = 'Willard';
    component.selectedGender = 'Male';
    component.onSearch();
    expect(component.matchResults.length).toBe(2);
    expect(component.matchResults[0].candidate.first_name).toBe('Willard');
  });

  it('should clear results when search criteria are empty', () => {
    component.searchName = 'Jeanette';
    component.onSearch();
    expect(component.matchResults.length).toBe(1);

    component.searchName = '';
    component.selectedGender = '';
    component.onSearch();
    expect(component.matchResults).toEqual([]);
    expect(component.searched).toBeFalse();
  });

  it('should show no results for non-matching search', () => {
    component.searchName = 'NonExistentPerson';
    component.onSearch();
    expect(component.matchResults.length).toBe(0);
    expect(component.searched).toBeTrue();
  });

  describe('pair matching', () => {
    it('should start with null pair result', () => {
      expect(component.pairResult).toBeNull();
    });

    it('should check pair match when both candidates are selected', () => {
      component.selectedCandidateA = component.allCandidates[0]; // Jeanette Female
      component.selectedCandidateB = component.allCandidates[2]; // Noell Female
      component.onPairCheck();
      expect(component.pairResult).toBeTrue(); // Same gender
    });

    it('should show no match for non-matching pair', () => {
      component.selectedCandidateA = component.allCandidates[0]; // Jeanette Female
      component.selectedCandidateB = component.allCandidates[1]; // Giavani Male
      component.onPairCheck();
      expect(component.pairResult).toBeFalse();
    });

    it('should reset pair result when a candidate is deselected', () => {
      component.selectedCandidateA = component.allCandidates[0];
      component.selectedCandidateB = component.allCandidates[1];
      component.onPairCheck();
      expect(component.pairResult).not.toBeNull();

      component.selectedCandidateA = null;
      component.onPairCheck();
      expect(component.pairResult).toBeNull();
    });
  });
});
