import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CandidatesService } from '../../services/candidates.service';
import { CandidateProfile } from '../../../../shared/models/candidate.models';

@Component({
  selector: 'app-candidate-list',
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css']
})
export class CandidateListComponent implements OnInit, OnDestroy {
  candidates: CandidateProfile[] = [];
  selectedCandidate: CandidateProfile | null = null;
  filter = '';
  loading = false;
  private subs = new Subscription();

  constructor(
    private candidatesService: CandidatesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCandidates();

    const p = this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        this.selectCandidateById(id);
      } else {
        this.selectedCandidate = null;
      }
    });

    this.subs.add(p);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadCandidates(): void {
    this.loading = true;
    const s = this.candidatesService.getCandidates().subscribe({
      next: (items) => {
        this.candidates = items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    this.subs.add(s);
  }

  selectCandidate(candidate: CandidateProfile): void {
    this.selectedCandidate = candidate;
    this.router.navigate([candidate.id], { relativeTo: this.route });
  }

  selectCandidateById(id: string): void {
    const candidate = this.candidates.find((item) => item.id === id);
    if (candidate) {
      this.selectedCandidate = candidate;
      return;
    }

    const s = this.candidatesService.getCandidate(id).subscribe({
      next: (item) => {
        this.selectedCandidate = item;
      },
      error: () => {
        this.selectedCandidate = null;
      }
    });
    this.subs.add(s);
  }

  applyFilter(): void {
    const query = this.filter.trim().toLowerCase();
    if (!query) {
      this.loadCandidates();
      return;
    }

    const filtered = this.candidates.filter((candidate) => {
      const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        (candidate.phone ?? '').toLowerCase().includes(query)
      );
    });

    this.candidates = filtered;
  }
}
