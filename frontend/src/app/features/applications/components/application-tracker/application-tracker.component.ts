import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationsService } from '../../services/applications.service';
import { ApplicationRecord, ApplicationStatus } from '../../../../shared/models/application.models';

interface KanbanColumn {
  id: string;
  title: string;
  status: ApplicationStatus;
  applications: ApplicationRecord[];
}

@Component({
  selector: 'app-application-tracker',
  templateUrl: './application-tracker.component.html',
  styleUrls: ['./application-tracker.component.css']
})
export class ApplicationTrackerComponent implements OnInit, OnDestroy {
  columns: KanbanColumn[] = [];
  selectedApplication: ApplicationRecord | null = null;
  isLoading = false;
  error: string | null = null;
  candidateId = '';
  private sub = new Subscription();

  private readonly defaultColumns: KanbanColumn[] = [
    { id: 'applied', title: 'Applied', status: ApplicationStatus.Submitted, applications: [] },
    { id: 'interviewing', title: 'Interviewing', status: ApplicationStatus.InterviewScheduled, applications: [] },
    { id: 'offered', title: 'Offered', status: ApplicationStatus.Offer, applications: [] },
    { id: 'rejected', title: 'Rejected', status: ApplicationStatus.Rejected, applications: [] }
  ];

  constructor(
    private applicationsService: ApplicationsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.candidateId = this.route.snapshot.paramMap.get('candidateId') || '';
    this.columns = this.defaultColumns.map((column) => ({ ...column, applications: [] }));
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.error = null;
    if (!this.candidateId) {
      this.error = 'Candidate ID is required to load applications.';
      this.isLoading = false;
      return;
    }

    const s = this.applicationsService.getApplications(this.candidateId).subscribe({
      next: (applications) => {
        this.distributeApplications(applications);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Unable to load applications.';
        this.isLoading = false;
      }
    });
    this.sub.add(s);
  }

  distributeApplications(applications: ApplicationRecord[]): void {
    this.columns = this.defaultColumns.map((column) => ({ ...column, applications: [] }));
    applications.forEach((application) => {
      const column = this.columns.find((c) => c.status === application.status);
      if (column) {
        column.applications.push(application);
      }
    });
  }

  onCardClick(application: ApplicationRecord): void {
    this.selectedApplication = application;
  }

  onDragStart(event: DragEvent, application: ApplicationRecord): void {
    this.selectedApplication = application;
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(application));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.add('drop-zone-active');
    }
  }

  onDragLeave(event: DragEvent): void {
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('drop-zone-active');
    }
  }

  onDrop(event: DragEvent, targetStatus: ApplicationStatus): void {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('drop-zone-active');
    }

    const payload = event.dataTransfer?.getData('application/json');
    if (!payload) {
      return;
    }

    const application: ApplicationRecord = JSON.parse(payload);
    if (application.status === targetStatus) {
      return;
    }

    this.updateStatus(application, targetStatus);
  }

  updateStatus(application: ApplicationRecord, newStatus: ApplicationStatus): void {
    const oldStatus = application.status;
    const s = this.applicationsService
      .updateApplicationStatus(application.id, newStatus)
      .subscribe({
        next: (updated) => {
          application.status = updated.status;
          this.moveApplicationBetweenColumns(application, oldStatus, newStatus);
          if (this.selectedApplication?.id === application.id) {
            this.selectedApplication = updated;
          }
        },
        error: (err) => {
          this.error = err?.message || 'Unable to update application status.';
        }
      });

    this.sub.add(s);
  }

  moveApplicationBetweenColumns(application: ApplicationRecord, oldStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    const sourceColumn = this.columns.find((col) => col.status === oldStatus);
    const targetColumn = this.columns.find((col) => col.status === newStatus);
    if (!sourceColumn || !targetColumn) {
      return;
    }
    sourceColumn.applications = sourceColumn.applications.filter((item) => item.id !== application.id);
    targetColumn.applications = [...targetColumn.applications, application];
  }
}
