/**
 * Application & Interview Models
 * Synced from ApplicationService DTOs
 */

export enum ApplicationStatus {
  Submitted = 'Submitted',
  InReview = 'InReview',
  InterviewScheduled = 'InterviewScheduled',
  Interviewed = 'Interviewed',
  Offer = 'Offer',
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn'
}

export enum InterviewStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled'
}

export interface CreateApplicationRequest {
  candidateId: string;
  jobId: string;
  notes?: string;
}

export interface InterviewSchedule {
  id: string;
  applicationId: string;
  scheduledAt: string | Date;
  interviewerEmail: string;
  location?: string;
  status: InterviewStatus;
  createdAt: string | Date;
}

export interface ApplicationRecord {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string | Date;
  updatedAt?: string | Date;
  interviews: InterviewSchedule[];
}

export interface CreateInterviewRequest {
  applicationId: string;
  scheduledAt: string | Date;
  interviewerEmail: string;
  location?: string;
}

export interface KanbanAggregateResponse {
  application: ApplicationRecord[];
  candidate: CandidateProfile;
}

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
