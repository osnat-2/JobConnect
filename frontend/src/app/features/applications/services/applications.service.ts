import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import {
  ApplicationRecord,
  CreateApplicationRequest,
  CreateInterviewRequest,
  KanbanAggregateResponse,
  InterviewSchedule
} from '../../../shared/models/application.models';

/**
 * Applications API Service
 * Handles all application and interview-related HTTP operations
 * Communicates with BFF /api/applications and /api/kanban endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationsService extends ApiService {
  private readonly applicationsEndpoint = '/applications';
  private readonly kanbanEndpoint = '/aggregate/kanban';

  /**
   * Fetch all applications for a candidate
   */
  getApplications(candidateId: string): Observable<ApplicationRecord[]> {
    return this.get<ApplicationRecord[]>(`${this.applicationsEndpoint}/${candidateId}`);
  }

  /**
   * Fetch a single application by ID
   */
  getApplication(applicationId: string): Observable<ApplicationRecord> {
    return this.get<ApplicationRecord>(`${this.applicationsEndpoint}/${applicationId}`);
  }

  /**
   * Create a new application
   */
  createApplication(request: CreateApplicationRequest): Observable<ApplicationRecord> {
    return this.post<ApplicationRecord>(this.applicationsEndpoint, request);
  }

  /**
   * Update application status
   */
  updateApplicationStatus(
    applicationId: string,
    status: string
  ): Observable<ApplicationRecord> {
    return this.patch<ApplicationRecord>(`${this.applicationsEndpoint}/${applicationId}`, {
      status
    });
  }

  /**
   * Withdraw/cancel an application
   */
  withdrawApplication(applicationId: string): Observable<ApplicationRecord> {
    return this.patch<ApplicationRecord>(`${this.applicationsEndpoint}/${applicationId}`, {
      status: 'Withdrawn'
    });
  }

  /**
   * Schedule an interview for an application
   */
  scheduleInterview(request: CreateInterviewRequest): Observable<InterviewSchedule> {
    return this.post<InterviewSchedule>(`${this.applicationsEndpoint}/interviews`, request);
  }

  /**
   * Get all interviews for an application
   */
  getInterviews(applicationId: string): Observable<InterviewSchedule[]> {
    return this.get<InterviewSchedule[]>(
      `${this.applicationsEndpoint}/${applicationId}/interviews`
    );
  }

  /**
   * Cancel an interview
   */
  cancelInterview(interviewId: string): Observable<void> {
    return this.delete<void>(`${this.applicationsEndpoint}/interviews/${interviewId}`);
  }

  /**
   * Fetch Kanban board aggregated data (applications + candidate profile)
   */
  getKanbanBoard(candidateId: string): Observable<KanbanAggregateResponse> {
    return this.get<KanbanAggregateResponse>(`${this.kanbanEndpoint}/${candidateId}`);
  }

  /**
   * Get all applications grouped by status (for kanban columns)
   */
  getApplicationsByStatus(candidateId: string): Observable<Record<string, ApplicationRecord[]>> {
    return this.get<Record<string, ApplicationRecord[]>>(
      `${this.applicationsEndpoint}/${candidateId}/grouped`
    );
  }
}
