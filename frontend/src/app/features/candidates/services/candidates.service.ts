import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { CandidateProfile, CreateCandidateRequest } from '../../../shared/models/candidate.models';

/**
 * Candidates API Service
 * Handles all candidate-related HTTP operations
 * Communicates with BFF /api/candidates endpoint
 */
@Injectable({
  providedIn: 'root'
})
export class CandidatesService extends ApiService {
  private readonly endpoint = '/candidates';

  /**
   * Fetch all candidates
   */
  getCandidates(): Observable<CandidateProfile[]> {
    return this.get<CandidateProfile[]>(this.endpoint);
  }

  /**
   * Fetch a single candidate by ID
   */
  getCandidate(id: string): Observable<CandidateProfile> {
    return this.get<CandidateProfile>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new candidate
   */
  createCandidate(request: CreateCandidateRequest): Observable<CandidateProfile> {
    return this.post<CandidateProfile>(this.endpoint, request);
  }

  /**
   * Update an existing candidate
   */
  updateCandidate(id: string, updates: Partial<CandidateProfile>): Observable<CandidateProfile> {
    return this.put<CandidateProfile>(`${this.endpoint}/${id}`, updates);
  }

  /**
   * Delete a candidate
   */
  deleteCandidate(id: string): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Upload candidate resume/CV
   */
  uploadResume(candidateId: string, file: File): Observable<CandidateProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<CandidateProfile>(`${this.endpoint}/${candidateId}/resume`, formData);
  }

  /**
   * Search candidates by name or email
   */
  searchCandidates(query: string): Observable<CandidateProfile[]> {
    return this.get<CandidateProfile[]>(
      `${this.endpoint}/search?q=${encodeURIComponent(query)}`
    );
  }
}
