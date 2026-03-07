/**
 * Standalone test runner for FaceMatchService
 * Tests the core face match logic without Angular TestBed (no browser required)
 */

// Inline the types and logic to avoid Angular module resolution issues
class Candidates {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
}

interface MatchResult {
  candidate: Candidates;
  score: number;
  matchedFields: string[];
}

class FaceMatchService {
  findMatches(candidates: Candidates[], criteria: Partial<Candidates>): MatchResult[] {
    if (!candidates || candidates.length === 0) return [];
    const results: MatchResult[] = [];
    for (const candidate of candidates) {
      const matchResult = this.calculateMatch(candidate, criteria);
      if (matchResult.score > 0) results.push(matchResult);
    }
    return results.sort((a, b) => b.score - a.score);
  }

  areCandidatesMatching(a: Candidates, b: Candidates): boolean {
    if (!a || !b) return false;
    return a.gender === b.gender || a.email?.split('@')[1] === b.email?.split('@')[1];
  }

  findBestMatch(target: Candidates, candidates: Candidates[]): MatchResult | null {
    if (!target || !candidates || candidates.length === 0) return null;
    const others = candidates.filter(c => c.id !== target.id);
    const criteria: Partial<Candidates> = { gender: target.gender, last_name: target.last_name, email: target.email };
    const matches = this.findMatches(others, criteria);
    return matches.length > 0 ? matches[0] : null;
  }

  private calculateMatch(candidate: Candidates, criteria: Partial<Candidates>): MatchResult {
    let score = 0;
    const matchedFields: string[] = [];
    if (criteria.first_name && candidate.first_name?.toLowerCase() === criteria.first_name.toLowerCase()) {
      score += 30; matchedFields.push('first_name');
    }
    if (criteria.last_name && candidate.last_name?.toLowerCase() === criteria.last_name.toLowerCase()) {
      score += 30; matchedFields.push('last_name');
    }
    if (criteria.gender && candidate.gender?.toLowerCase() === criteria.gender.toLowerCase()) {
      score += 20; matchedFields.push('gender');
    }
    if (criteria.email && candidate.email?.toLowerCase() === criteria.email.toLowerCase()) {
      score += 50; matchedFields.push('email');
    }
    if (criteria.id && candidate.id === criteria.id) {
      score += 100; matchedFields.push('id');
    }
    return { candidate, score, matchedFields };
  }
}

// --- Test Data ---
const mockCandidates: Candidates[] = [
  { id: 1, first_name: 'Jeanette', last_name: 'Penddreth', email: 'jpenddreth0@census.gov', gender: 'Female' },
  { id: 2, first_name: 'Giavani', last_name: 'Frediani', email: 'gfrediani1@senate.gov', gender: 'Male' },
  { id: 3, first_name: 'Noell', last_name: 'Bea', email: 'nbea2@imageshack.us', gender: 'Female' },
  { id: 4, first_name: 'Willard', last_name: 'Valek', email: 'wvalek3@vk.com', gender: 'Male' }
];

// --- Test Runner ---
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  FAIL: ${testName}`);
  }
}

function assertEqual(actual: any, expected: any, testName: string) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.log(`    Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
  }
  assert(pass, testName);
}

const service = new FaceMatchService();

// --- findMatches tests ---
console.log('\n=== FaceMatchService.findMatches ===');

assertEqual(service.findMatches([], { gender: 'Male' }), [], 'returns empty array for empty candidates list');
assertEqual(service.findMatches(null, { gender: 'Male' }), [], 'returns empty array for null candidates');

let results = service.findMatches(mockCandidates, { gender: 'Female' });
assertEqual(results.length, 2, 'matches 2 female candidates by gender');
assertEqual(results[0].candidate.first_name, 'Jeanette', 'first female match is Jeanette');
assertEqual(results[1].candidate.first_name, 'Noell', 'second female match is Noell');
assert(results.every(r => r.matchedFields.includes('gender')), 'all results have gender in matchedFields');

results = service.findMatches(mockCandidates, { first_name: 'giavani' });
assertEqual(results.length, 1, 'matches 1 candidate by first name (case insensitive)');
assertEqual(results[0].candidate.id, 2, 'matched candidate is Giavani (id=2)');
assert(results[0].matchedFields.includes('first_name'), 'matchedFields includes first_name');

results = service.findMatches(mockCandidates, { last_name: 'Valek' });
assertEqual(results.length, 1, 'matches 1 candidate by last name');
assertEqual(results[0].candidate.first_name, 'Willard', 'matched candidate is Willard');

results = service.findMatches(mockCandidates, { email: 'nbea2@imageshack.us' });
assertEqual(results.length, 1, 'matches 1 candidate by email');
assertEqual(results[0].candidate.first_name, 'Noell', 'matched candidate is Noell');
assertEqual(results[0].score, 50, 'email match score is 50');

results = service.findMatches(mockCandidates, { id: 3 } as Partial<Candidates>);
assertEqual(results.length, 1, 'matches 1 candidate by id');
assertEqual(results[0].score, 100, 'id match score is 100');

results = service.findMatches(mockCandidates, { first_name: 'Jeanette', gender: 'Female' });
const jeanette = results.find(r => r.candidate.first_name === 'Jeanette');
const noell = results.find(r => r.candidate.first_name === 'Noell');
assert(jeanette!.score > noell!.score, 'multi-field match has higher score');
assertEqual(jeanette!.score, 50, 'Jeanette score is 50 (30+20)');
assertEqual(noell!.score, 20, 'Noell score is 20 (gender only)');

results = service.findMatches(mockCandidates, { first_name: 'Willard', gender: 'Male' });
assertEqual(results.length, 2, 'returns 2 male candidates when searching Willard+Male');
assertEqual(results[0].candidate.first_name, 'Willard', 'results sorted by score - Willard first');
assertEqual(results[1].candidate.first_name, 'Giavani', 'results sorted by score - Giavani second');

results = service.findMatches(mockCandidates, { first_name: 'Unknown' });
assertEqual(results.length, 0, 'returns no matches for non-existent name');

// --- areCandidatesMatching tests ---
console.log('\n=== FaceMatchService.areCandidatesMatching ===');

assert(service.areCandidatesMatching(mockCandidates[0], mockCandidates[2]) === true,
  'returns true for same gender (both Female)');
assert(service.areCandidatesMatching(mockCandidates[0], mockCandidates[1]) === false,
  'returns false for different gender and different domain');
assert(service.areCandidatesMatching(mockCandidates[1], mockCandidates[3]) === true,
  'returns true for same gender (both Male)');

const candidateA = { id: 10, first_name: 'A', last_name: 'A', email: 'a@test.com', gender: 'Male' };
const candidateB = { id: 11, first_name: 'B', last_name: 'B', email: 'b@test.com', gender: 'Female' };
assert(service.areCandidatesMatching(candidateA, candidateB) === true,
  'returns true for same email domain despite different gender');

assert(service.areCandidatesMatching(null, mockCandidates[0]) === false, 'returns false for null first candidate');
assert(service.areCandidatesMatching(mockCandidates[0], null) === false, 'returns false for null second candidate');

// --- findBestMatch tests ---
console.log('\n=== FaceMatchService.findBestMatch ===');

let bestMatch = service.findBestMatch(mockCandidates[0], mockCandidates);
assert(bestMatch !== null, 'finds a best match for Jeanette');
assertEqual(bestMatch!.candidate.gender, 'Female', 'best match for Jeanette is Female');
assert(bestMatch!.candidate.id !== mockCandidates[0].id, 'best match excludes the target candidate');

assert(service.findBestMatch(null, mockCandidates) === null, 'returns null for null target');
assert(service.findBestMatch(mockCandidates[0], []) === null, 'returns null for empty candidates list');

bestMatch = service.findBestMatch(mockCandidates[0], [mockCandidates[0]]);
assert(bestMatch === null, 'returns null when only target is in the list');

// --- Summary ---
console.log('\n========================================');
console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('========================================');
if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log('');
process.exit(failed > 0 ? 1 : 0);
