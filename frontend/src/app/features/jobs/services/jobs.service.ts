import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Job, CreateJobRequest } from '../../shared/models';

/**
 * Jobs API Service
 * Handles all job-related HTTP operations
 * Communicates with BFF /api/jobs endpoint
 */
@Injectable({
  providedIn: 'root'
})
export class JobsService extends ApiService {
  private readonly endpoint = '/jobs';

  /**
   * Fetch all jobs
   */
  getJobs(): Observable<Job[]> {
    return this.get<Job[]>(this.endpoint);
  }

  /**
   * Fetch a single job by ID
   */
  getJob(id: string): Observable<Job> {
    return this.get<Job>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new job
   */
  createJob(request: CreateJobRequest): Observable<Job> {
    return this.post<Job>(this.endpoint, request);
  }

  /**
   * Update an existing job
   */
  updateJob(id: string, updates: Partial<Job>): Observable<Job> {
    return this.put<Job>(`${this.endpoint}/${id}`, updates);
  }

  /**
   * Delete a job
   */
  deleteJob(id: string): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Search jobs with filters
   */
  searchJobs(query: string, filters?: Record<string, any>): Observable<Job[]> {
    let endpoint = `${this.endpoint}/search?q=${encodeURIComponent(query)}`;
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== null && filters[key] !== undefined) {
          endpoint += `&${key}=${encodeURIComponent(filters[key])}`;
        }
      });
    }
    return this.get<Job[]>(endpoint);
  }
}
