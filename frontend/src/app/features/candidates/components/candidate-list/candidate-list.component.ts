import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CandidatesService } from '../../services/candidates.service';
import { ApplicationsService } from '../../../applications/services/applications.service';
import { JobsService } from '../../../jobs/services/jobs.service';
import { CandidateProfile } from '../../../../shared/models/candidate.models';
import { CreateApplicationRequest } from '../../../../shared/models/application.models';
import { Job } from '../../../../shared/models/job.models';

@Component({
  selector: 'app-candidate-list',
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css']
})
export class CandidateListComponent implements OnInit, OnDestroy {
  candidates: CandidateProfile[] = [];
  allCandidates: CandidateProfile[] = [];
  selectedCandidate: CandidateProfile | null = null;
  jobs: Job[] = [];
  selectedJobId = '';
  filter = '';
  loading = false;
  applying = false;
  selectedFile: File | null = null;
  uploadError: string | null = null;
  applyError: string | null = null;
  applyMessage: string | null = null;
  uploading = false;
  private subs = new Subscription();

  constructor(
    private candidatesService: CandidatesService,
    private applicationsService: ApplicationsService,
    private jobsService: JobsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
    this.loadJobs();

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
        this.allCandidates = items || [];
        this.candidates = [...this.allCandidates];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    this.subs.add(s);
  }

  loadJobs(): void {
    const s = this.jobsService.getJobs().subscribe({
      next: (items) => {
        this.jobs = (items || []).filter((job) => job.isActive);
      },
      error: () => {
        this.jobs = [];
      }
    });
    this.subs.add(s);
  }

  clearApplyFeedback(): void {
    this.applyError = null;
    this.applyMessage = null;
  }

  applyWithResume(): void {
    if (!this.selectedCandidate) {
      this.applyError = 'Select a candidate to submit the application.';
      return;
    }

    if (!this.selectedJobId) {
      this.applyError = 'Please select a job before applying.';
      return;
    }

    if (!this.selectedFile && !this.selectedCandidate.resumeFileName) {
      this.applyError = 'Please choose a CV to upload or use the current resume.';
      return;
    }

    this.applying = true;
    this.applyError = null;
    this.applyMessage = null;

    const resumeUpload$ = this.selectedFile
      ? this.candidatesService.uploadResume(this.selectedCandidate.id, this.selectedFile)
      : of(this.selectedCandidate);

    const s = resumeUpload$
      .pipe(
        switchMap((updatedCandidate) => {
          if (updatedCandidate) {
            this.selectedCandidate = updatedCandidate;
            this.updateCandidateInLists(updatedCandidate);
          }

          const request: CreateApplicationRequest = {
            candidateId: this.selectedCandidate!.id,
            jobId: this.selectedJobId
          };

          return this.applicationsService.createApplication(request);
        })
      )
      .subscribe({
        next: () => {
          const job = this.jobs.find((item) => item.id === this.selectedJobId);
          this.applyMessage = `Application submitted for ${job?.title || 'selected job'}.`;
          this.selectedFile = null;
          this.uploadError = null;
        },
        error: (err) => {
          this.applyError = err?.message || 'Unable to submit application. Please try again.';
        },
        complete: () => {
          this.applying = false;
        }
      });

    this.subs.add(s);
  }

  private updateCandidateInLists(updated: CandidateProfile): void {
    const index = this.allCandidates.findIndex((c) => c.id === updated.id);
    if (index !== -1) {
      this.allCandidates[index] = updated;
    }
    this.candidates = this.candidates.map((item) => item.id === updated.id ? updated : item);
  }

  selectCandidate(candidate: CandidateProfile): void {
    this.selectedCandidate = candidate;
    this.selectedFile = null;
    this.uploadError = null;
    this.router.navigate([candidate.id], { relativeTo: this.route });
  }

  onFileSelected(event: Event): void {
    this.uploadError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    const acceptedExtensions = ['pdf', 'doc', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedExtensions.includes(extension)) {
      this.uploadError = 'Please upload a PDF or DOCX file.';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  uploadResume(): void {
    if (!this.selectedCandidate || !this.selectedFile) {
      this.uploadError = 'Select a candidate and a CV to upload.';
      return;
    }

    this.uploading = true;
    const s = this.candidatesService.uploadResume(this.selectedCandidate.id, this.selectedFile).subscribe({
      next: (updated) => {
        this.selectedCandidate = updated;
        const index = this.allCandidates.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
          this.allCandidates[index] = updated;
        }
        this.candidates = this.candidates.map((item) => item.id === updated.id ? updated : item);
        this.selectedFile = null;
        this.uploadError = null;
      },
      error: () => {
        this.uploadError = 'Upload failed. Please try again.';
      },
      complete: () => {
        this.uploading = false;
      }
    });
    this.subs.add(s);
  }

  selectCandidateById(id: string): void {
    const candidate = this.allCandidates.find((item) => item.id === id);
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
      this.candidates = [...this.allCandidates];
      return;
    }

    const filtered = this.allCandidates.filter((candidate) => {
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
