import { Injectable } from '@angular/core';
import { Candidates } from './candidates';

export interface MatchResult {
  candidate: Candidates;
  score: number;
  matchedFields: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FaceMatchService {

  /**
   * Find candidates matching the given criteria.
   * Returns matches sorted by score (highest first).
   */
  findMatches(
    candidates: Candidates[],
    criteria: Partial<Candidates>
  ): MatchResult[] {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const results: MatchResult[] = [];

    for (const candidate of candidates) {
      const matchResult = this.calculateMatch(candidate, criteria);
      if (matchResult.score > 0) {
        results.push(matchResult);
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if two candidates are a match based on shared attributes.
   */
  areCandidatesMatching(a: Candidates, b: Candidates): boolean {
    if (!a || !b) {
      return false;
    }
    return a.gender === b.gender || a.email?.split('@')[1] === b.email?.split('@')[1];
  }

  /**
   * Find the best match for a given candidate from a list.
   */
  findBestMatch(
    target: Candidates,
    candidates: Candidates[]
  ): MatchResult | null {
    if (!target || !candidates || candidates.length === 0) {
      return null;
    }

    const others = candidates.filter(c => c.id !== target.id);
    const criteria: Partial<Candidates> = {
      gender: target.gender,
      last_name: target.last_name,
      email: target.email
    };

    const matches = this.findMatches(others, criteria);
    return matches.length > 0 ? matches[0] : null;
  }

  private calculateMatch(
    candidate: Candidates,
    criteria: Partial<Candidates>
  ): MatchResult {
    let score = 0;
    const matchedFields: string[] = [];

    if (criteria.first_name && candidate.first_name?.toLowerCase() === criteria.first_name.toLowerCase()) {
      score += 30;
      matchedFields.push('first_name');
    }

    if (criteria.last_name && candidate.last_name?.toLowerCase() === criteria.last_name.toLowerCase()) {
      score += 30;
      matchedFields.push('last_name');
    }

    if (criteria.gender && candidate.gender?.toLowerCase() === criteria.gender.toLowerCase()) {
      score += 20;
      matchedFields.push('gender');
    }

    if (criteria.email && candidate.email?.toLowerCase() === criteria.email.toLowerCase()) {
      score += 50;
      matchedFields.push('email');
    }

    if (criteria.id && candidate.id === criteria.id) {
      score += 100;
      matchedFields.push('id');
    }

    return { candidate, score, matchedFields };
  }
}
