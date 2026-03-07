import { TestBed } from '@angular/core/testing';
import { FaceMatchService, MatchResult } from './face-match.service';
import { Candidates } from './candidates';

describe('FaceMatchService', () => {
  let service: FaceMatchService;

  const mockCandidates: Candidates[] = [
    { id: 1, first_name: 'Jeanette', last_name: 'Penddreth', email: 'jpenddreth0@census.gov', gender: 'Female' },
    { id: 2, first_name: 'Giavani', last_name: 'Frediani', email: 'gfrediani1@senate.gov', gender: 'Male' },
    { id: 3, first_name: 'Noell', last_name: 'Bea', email: 'nbea2@imageshack.us', gender: 'Female' },
    { id: 4, first_name: 'Willard', last_name: 'Valek', email: 'wvalek3@vk.com', gender: 'Male' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaceMatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findMatches', () => {
    it('should return empty array for empty candidates list', () => {
      const results = service.findMatches([], { gender: 'Male' });
      expect(results).toEqual([]);
    });

    it('should return empty array for null candidates', () => {
      const results = service.findMatches(null, { gender: 'Male' });
      expect(results).toEqual([]);
    });

    it('should match candidates by gender', () => {
      const results = service.findMatches(mockCandidates, { gender: 'Female' });
      expect(results.length).toBe(2);
      expect(results[0].candidate.first_name).toBe('Jeanette');
      expect(results[1].candidate.first_name).toBe('Noell');
      results.forEach(r => expect(r.matchedFields).toContain('gender'));
    });

    it('should match candidates by first name (case insensitive)', () => {
      const results = service.findMatches(mockCandidates, { first_name: 'giavani' });
      expect(results.length).toBe(1);
      expect(results[0].candidate.id).toBe(2);
      expect(results[0].matchedFields).toContain('first_name');
    });

    it('should match candidates by last name', () => {
      const results = service.findMatches(mockCandidates, { last_name: 'Valek' });
      expect(results.length).toBe(1);
      expect(results[0].candidate.first_name).toBe('Willard');
    });

    it('should match candidates by email exactly', () => {
      const results = service.findMatches(mockCandidates, { email: 'nbea2@imageshack.us' });
      expect(results.length).toBe(1);
      expect(results[0].candidate.first_name).toBe('Noell');
      expect(results[0].score).toBe(50);
    });

    it('should match candidates by id', () => {
      const results = service.findMatches(mockCandidates, { id: 3 } as Partial<Candidates>);
      expect(results.length).toBe(1);
      expect(results[0].candidate.first_name).toBe('Noell');
      expect(results[0].score).toBe(100);
    });

    it('should return higher scores for multiple field matches', () => {
      const results = service.findMatches(mockCandidates, {
        first_name: 'Jeanette',
        gender: 'Female'
      });
      const jeanette = results.find(r => r.candidate.first_name === 'Jeanette');
      const noell = results.find(r => r.candidate.first_name === 'Noell');
      expect(jeanette.score).toBeGreaterThan(noell.score);
      expect(jeanette.score).toBe(50); // 30 (first_name) + 20 (gender)
      expect(noell.score).toBe(20); // 20 (gender only)
    });

    it('should sort results by score descending', () => {
      const results = service.findMatches(mockCandidates, {
        first_name: 'Willard',
        gender: 'Male'
      });
      expect(results.length).toBe(2);
      expect(results[0].candidate.first_name).toBe('Willard'); // score 50
      expect(results[1].candidate.first_name).toBe('Giavani'); // score 20
    });

    it('should return no matches when criteria do not match any candidate', () => {
      const results = service.findMatches(mockCandidates, { first_name: 'Unknown' });
      expect(results.length).toBe(0);
    });
  });

  describe('areCandidatesMatching', () => {
    it('should return true for candidates with same gender', () => {
      const result = service.areCandidatesMatching(mockCandidates[0], mockCandidates[2]);
      expect(result).toBeTrue(); // Both Female
    });

    it('should return false for candidates with different gender and different domain', () => {
      const result = service.areCandidatesMatching(mockCandidates[0], mockCandidates[1]);
      expect(result).toBeFalse(); // Female vs Male, different domains
    });

    it('should return true for candidates with same email domain', () => {
      const candidateA: Candidates = { id: 10, first_name: 'A', last_name: 'A', email: 'a@test.com', gender: 'Male' };
      const candidateB: Candidates = { id: 11, first_name: 'B', last_name: 'B', email: 'b@test.com', gender: 'Female' };
      expect(service.areCandidatesMatching(candidateA, candidateB)).toBeTrue();
    });

    it('should return false for null candidates', () => {
      expect(service.areCandidatesMatching(null, mockCandidates[0])).toBeFalse();
      expect(service.areCandidatesMatching(mockCandidates[0], null)).toBeFalse();
    });
  });

  describe('findBestMatch', () => {
    it('should find the best matching candidate', () => {
      const target = mockCandidates[0]; // Jeanette, Female
      const result = service.findBestMatch(target, mockCandidates);
      expect(result).toBeTruthy();
      expect(result.candidate.gender).toBe('Female');
      expect(result.candidate.id).not.toBe(target.id);
    });

    it('should return null for null target', () => {
      expect(service.findBestMatch(null, mockCandidates)).toBeNull();
    });

    it('should return null for empty candidates list', () => {
      expect(service.findBestMatch(mockCandidates[0], [])).toBeNull();
    });

    it('should exclude the target candidate from results', () => {
      const target = mockCandidates[0];
      const result = service.findBestMatch(target, mockCandidates);
      expect(result.candidate.id).not.toBe(target.id);
    });

    it('should return null when only the target is in the list', () => {
      const target = mockCandidates[0];
      const result = service.findBestMatch(target, [target]);
      expect(result).toBeNull();
    });
  });
});
