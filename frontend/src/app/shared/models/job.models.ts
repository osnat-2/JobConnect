/**
 * Job Models
 * Synced from JobService Models
 */

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  category: string;
  employmentType: string; // e.g., 'FullTime', 'PartTime', 'Contract'
  salaryMin?: number;
  salaryMax?: number;
  requirements: string[];
  tags: string[];
  isActive: boolean;
  postedAt: string | Date;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  description: string;
  location: string;
  category: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: string[];
  tags?: string[];
}

export interface UpdateJobRequest {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  category?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: string[];
  tags?: string[];
  isActive?: boolean;
}
