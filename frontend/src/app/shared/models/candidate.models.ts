/**
 * Candidate Models
 * Synced from CandidateService Models
 */

export interface CandidateProfile {
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

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface UpdateCandidateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CandidateDocument {
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
