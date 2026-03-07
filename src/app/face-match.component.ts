import { Component, OnInit } from '@angular/core';
import { candidates, Candidates } from './candidates';
import { FaceMatchService, MatchResult } from './face-match.service';

@Component({
  selector: 'app-face-match',
  template: `
    <div class="face-match-container">
      <h2>Face Match</h2>

      <div class="search-section">
        <label>Search by Name:</label>
        <input type="text" [(ngModel)]="searchName" placeholder="Enter candidate name" (input)="onSearch()">

        <label>Filter by Gender:</label>
        <select [(ngModel)]="selectedGender" (change)="onSearch()">
          <option value="">All</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div class="results-section" *ngIf="matchResults.length > 0">
        <h3>Match Results ({{matchResults.length}} found)</h3>
        <div *ngFor="let result of matchResults" class="match-card">
          <strong>{{result.candidate.first_name}} {{result.candidate.last_name}}</strong>
          <span class="score">Score: {{result.score}}%</span>
          <span class="email">{{result.candidate.email}}</span>
          <span class="gender">{{result.candidate.gender}}</span>
          <span class="fields">Matched: {{result.matchedFields.join(', ')}}</span>
        </div>
      </div>

      <div class="no-results" *ngIf="searched && matchResults.length === 0">
        No matches found.
      </div>

      <div class="pair-match-section">
        <h3>Candidate Pair Match</h3>
        <div class="pair-selectors">
          <select [(ngModel)]="selectedCandidateA" (change)="onPairCheck()">
            <option [ngValue]="null">Select Candidate A</option>
            <option *ngFor="let c of allCandidates" [ngValue]="c">{{c.first_name}} {{c.last_name}}</option>
          </select>
          <select [(ngModel)]="selectedCandidateB" (change)="onPairCheck()">
            <option [ngValue]="null">Select Candidate B</option>
            <option *ngFor="let c of allCandidates" [ngValue]="c">{{c.first_name}} {{c.last_name}}</option>
          </select>
        </div>
        <div *ngIf="pairResult !== null" class="pair-result">
          <span [class.match]="pairResult" [class.no-match]="!pairResult">
            {{pairResult ? 'These candidates match!' : 'These candidates do not match.'}}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .face-match-container { padding: 16px; font-family: Lato, sans-serif; }
    .search-section { margin-bottom: 16px; }
    .search-section label { display: block; margin-top: 8px; font-weight: bold; }
    .search-section input, .search-section select { padding: 6px; margin-top: 4px; width: 250px; }
    .match-card { border: 1px solid #ccc; padding: 12px; margin: 8px 0; border-radius: 4px; }
    .match-card strong { display: block; font-size: 1.1em; }
    .match-card span { display: block; color: #555; margin-top: 4px; }
    .score { color: #2196F3 !important; font-weight: bold; }
    .pair-match-section { margin-top: 24px; }
    .pair-selectors select { margin-right: 8px; padding: 6px; }
    .pair-result { margin-top: 12px; font-size: 1.1em; }
    .match { color: green; font-weight: bold; }
    .no-match { color: red; }
    .no-results { color: #999; font-style: italic; margin-top: 12px; }
  `]
})
export class FaceMatchComponent implements OnInit {
  allCandidates: Candidates[] = candidates;
  matchResults: MatchResult[] = [];
  searchName = '';
  selectedGender = '';
  searched = false;

  selectedCandidateA: Candidates | null = null;
  selectedCandidateB: Candidates | null = null;
  pairResult: boolean | null = null;

  constructor(private faceMatchService: FaceMatchService) {}

  ngOnInit() {}

  onSearch() {
    const criteria: Partial<Candidates> = {};

    if (this.searchName.trim()) {
      criteria.first_name = this.searchName.trim();
    }
    if (this.selectedGender) {
      criteria.gender = this.selectedGender;
    }

    if (criteria.first_name || criteria.gender) {
      this.matchResults = this.faceMatchService.findMatches(this.allCandidates, criteria);
      this.searched = true;
    } else {
      this.matchResults = [];
      this.searched = false;
    }
  }

  onPairCheck() {
    if (this.selectedCandidateA && this.selectedCandidateB) {
      this.pairResult = this.faceMatchService.areCandidatesMatching(
        this.selectedCandidateA,
        this.selectedCandidateB
      );
    } else {
      this.pairResult = null;
    }
  }
}
