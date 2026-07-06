import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { JobsService } from '../../services/jobs.service';
import { Job } from '../../../../shared/models/job.models';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css']
})
export class JobsComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  selectedJob: Job | null = null;
  loading = false;

  private subs = new Subscription();

  constructor(
    private jobsService: JobsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadJobs();

    const p = this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        this.loadJob(id);
      } else {
        this.selectedJob = null;
      }
    });

    this.subs.add(p);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadJobs(): void {
    this.loading = true;
    const s = this.jobsService.getJobs().subscribe({
      next: (items) => {
        this.jobs = items || [];
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
    this.subs.add(s);
  }

  loadJob(id: string): void {
    const s = this.jobsService.getJob(id).subscribe({
      next: (job) => (this.selectedJob = job),
      error: () => (this.selectedJob = null)
    });
    this.subs.add(s);
  }

  selectJob(job: Job): void {
    this.router.navigate([job.id], { relativeTo: this.route.parent || this.route });
    this.selectedJob = job;
  }
}
