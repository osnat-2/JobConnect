import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

interface ApplicationStatus {
  [key: string]: string;
}

interface ApplicationRecord {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  notes?: string;
  appliedAt: string | Date;
  updatedAt?: string | Date;
  interviews: Array<{
    id: string;
    applicationId: string;
    scheduledAt: string | Date;
    interviewerEmail: string;
    location?: string;
    status: string;
    createdAt: string | Date;
  }>;
}

interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeFileName?: string;
  resumeUrl?: string;
  createdAtUtc: string | Date;
  updatedAtUtc: string | Date;
}

interface KanbanAggregateResponse {
  application: ApplicationRecord[];
  candidate: CandidateProfile;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  applications: ApplicationRecord[];
  count: number;
}

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit {
  @Input() candidateId!: string;
  @Input() refreshInterval: number = 0;
  @Input() enableEdit: boolean = true;
  @Input() columns: KanbanColumn[] = [];

  @Output() applicationSelected = new EventEmitter<ApplicationRecord>();
  @Output() statusChanged = new EventEmitter<{ app: ApplicationRecord; oldStatus: string; newStatus: string }>();
  @Output() interviewScheduled = new EventEmitter<any>();

  candidate: CandidateProfile | null = null;
  selectedApplication: ApplicationRecord | null = null;
  isLoading = false;
  draggedCard: ApplicationRecord | null = null;
  error: string | null = null;

  private readonly defaultColumns: KanbanColumn[] = [
    { id: 'applied', title: 'Applied', status: 'Submitted', applications: [], count: 0 },
    { id: 'screening', title: 'Screening', status: 'InReview', applications: [], count: 0 },
    { id: 'interview', title: 'Interview', status: 'InterviewScheduled', applications: [], count: 0 },
    { id: 'offered', title: 'Offered', status: 'Offer', applications: [], count: 0 },
    { id: 'rejected', title: 'Rejected', status: 'Rejected', applications: [], count: 0 }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.candidateId = this.candidateId || this.route.snapshot.params['candidateId'];
    this.columns = this.columns.length ? this.columns : this.defaultColumns.map(col => ({ ...col }));
    this.loadKanbanBoard();
  }

  loadKanbanBoard(): void {
    this.isLoading = true;
    this.error = null;

    setTimeout(() => {
      const response: KanbanAggregateResponse = {
        candidate: {
          id: this.candidateId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0100',
          resumeFileName: 'resume.pdf',
          resumeUrl: '#',
          createdAtUtc: new Date(),
          updatedAtUtc: new Date()
        },
        application: [
          {
            id: 'app-1',
            candidateId: this.candidateId,
            jobId: 'Senior Developer',
            status: 'Submitted',
            appliedAt: new Date(),
            interviews: []
          },
          {
            id: 'app-2',
            candidateId: this.candidateId,
            jobId: 'Product Designer',
            status: 'InterviewScheduled',
            appliedAt: new Date(Date.now() - 86400000),
            interviews: [
              {
                id: 'int-1',
                applicationId: 'app-2',
                scheduledAt: new Date(Date.now() + 86400000),
                interviewerEmail: 'recruiter@example.com',
                location: 'Conference Room',
                status: 'Scheduled',
                createdAt: new Date()
              }
            ]
          }
        ]
      };

      this.candidate = response.candidate;
      this.populateColumns(response.application);
      this.isLoading = false;
    }, 600);
  }

  populateColumns(applications: ApplicationRecord[]): void {
    this.columns = this.defaultColumns.map(col => ({ ...col, applications: [], count: 0 }));

    applications.forEach(app => {
      const column = this.columns.find(col => col.status === app.status);
      if (column) {
        column.applications.push(app);
        column.count++;
      }
    });
  }

  onDragStart(event: DragEvent, application: ApplicationRecord): void {
    this.draggedCard = application;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(application));
    }
  }

  onDragOver(event: DragEvent, column: KanbanColumn): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const element = event.currentTarget as HTMLElement;
    element.classList.add('drop-zone-active');
  }

  onDragLeave(event: DragEvent): void {
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drop-zone-active');
  }

  onDrop(event: DragEvent, targetColumn: KanbanColumn): void {
    event.preventDefault();
    event.stopPropagation();

    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drop-zone-active');

    if (!this.draggedCard) {
      return;
    }

    if (this.draggedCard.status === targetColumn.status) {
      this.draggedCard = null;
      return;
    }

    this.updateApplicationStatus(this.draggedCard, targetColumn.status);
    this.draggedCard = null;
  }

  updateApplicationStatus(application: ApplicationRecord, newStatus: string): void {
    const oldStatus = application.status;
    const sourceColumn = this.columns.find(col => col.status === oldStatus);
    const targetColumn = this.columns.find(col => col.status === newStatus);

    if (!sourceColumn || !targetColumn) {
      return;
    }

    const appIndex = sourceColumn.applications.findIndex(a => a.id === application.id);
    if (appIndex >= 0) {
      sourceColumn.applications.splice(appIndex, 1);
      sourceColumn.count--;
    }

    application.status = newStatus;
    targetColumn.applications.push(application);
    targetColumn.count++;

    this.statusChanged.emit({ app: application, oldStatus, newStatus });
  }

  onCardClick(application: ApplicationRecord): void {
    this.selectedApplication = application;
    this.applicationSelected.emit(application);
  }

  onScheduleInterview(application: ApplicationRecord): void {
    this.interviewScheduled.emit({ application, candidateId: this.candidateId });
  }
}
