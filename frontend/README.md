# JobConnect Frontend - Angular Application

## Overview
Modern Angular 14+ frontend for the JobConnect Applicant Tracking System (ATS). Built with reactive patterns, lazy-loaded feature modules, and comprehensive end-to-end request tracing.

## Architecture

### Directory Structure
```
src/app/
├── core/                         # Global infrastructure (Singletons)
│   ├── interceptors/             # HTTP Interceptors (Correlation ID injection)
│   │   └── correlation-id.interceptor.ts
│   ├── guards/                   # Route guards & access control
│   └── services/                 # Core application services
│       └── correlation-id.service.ts
│
├── shared/                       # Reusable components & utilities
│   ├── components/               # Shared UI components
│   ├── models/                   # TypeScript interfaces (synced from backend DTOs)
│   │   ├── application.models.ts
│   │   ├── job.models.ts
│   │   ├── candidate.models.ts
│   │   └── index.ts (barrel export)
│   ├── pipes/                    # Custom display pipes
│   └── services/                 # Shared services
│       ├── api.service.ts        # Base HTTP service
│       └── index.ts (barrel export)
│
├── features/                     # Feature modules (Domain-driven)
│   │
│   ├── jobs/                     # Job Management
│   │   ├── components/           # Job list, job details, job filters
│   │   ├── services/
│   │   │   ├── jobs.service.ts   # HTTP operations for jobs
│   │   │   └── index.ts
│   │   └── jobs.module.ts        # Lazy-loaded module
│   │
│   ├── candidates/               # Candidate Management
│   │   ├── components/           # Candidate profiles, CV upload
│   │   ├── services/
│   │   │   ├── candidates.service.ts  # HTTP operations for candidates
│   │   │   └── index.ts
│   │   └── candidates.module.ts   # Lazy-loaded module
│   │
│   └── applications/             # Application Tracking & Kanban
│       ├── components/           # Kanban board, application details
│       ├── services/
│       │   ├── applications.service.ts # HTTP operations for applications
│       │   └── index.ts
│       └── applications.module.ts # Lazy-loaded module
│
├── app-routing.module.ts         # Main routing configuration
├── app.module.ts                 # Root module
├── app.component.ts              # Root component
└── app.component.html            # Root template
```

## Key Features

### 1. Correlation ID Tracking
- **File**: `src/app/core/interceptors/correlation-id.interceptor.ts`
- Auto-generates unique UUID per session
- Injected into every HTTP request via `X-Correlation-ID` header
- Enables end-to-end request tracing across microservices
- Stored in `sessionStorage` for persistence across page navigation

### 2. Type-Safe Models
- **Location**: `src/app/shared/models/`
- TypeScript interfaces synced from backend DTOs
- Covers all API contracts:
  - `ApplicationRecord`, `ApplicationStatus`, `InterviewSchedule`, `InterviewStatus`
  - `Job`, `CreateJobRequest`, `UpdateJobRequest`
  - `CandidateProfile`, `CreateCandidateRequest`
- Provides type safety for HTTP responses

### 3. Feature Services
Each feature module includes a dedicated service for backend communication:

**JobsService** (`src/app/features/jobs/services/jobs.service.ts`)
```typescript
getJobs(): Observable<Job[]>
getJob(id: string): Observable<Job>
createJob(request: CreateJobRequest): Observable<Job>
searchJobs(query: string): Observable<Job[]>
```

**CandidatesService** (`src/app/features/candidates/services/candidates.service.ts`)
```typescript
getCandidates(): Observable<CandidateProfile[]>
getCandidate(id: string): Observable<CandidateProfile>
uploadResume(candidateId: string, file: File): Observable<CandidateProfile>
searchCandidates(query: string): Observable<CandidateProfile[]>
```

**ApplicationsService** (`src/app/features/applications/services/applications.service.ts`)
```typescript
getApplications(candidateId: string): Observable<ApplicationRecord[]>
createApplication(request: CreateApplicationRequest): Observable<ApplicationRecord>
updateApplicationStatus(applicationId: string, status: string): Observable<ApplicationRecord>
scheduleInterview(request: CreateInterviewRequest): Observable<InterviewSchedule>
getKanbanBoard(candidateId: string): Observable<KanbanAggregateResponse>
```

### 4. Base API Service
- **File**: `src/app/shared/services/api.service.ts`
- Provides common HTTP operations (GET, POST, PUT, PATCH, DELETE)
- All feature services extend this class
- Centralized API URL configuration via `environment.ts`

### 5. Environment Configuration
- **Development**: `src/environments/environment.ts` → `http://localhost:3000/api`
- **Production**: `src/environments/environment.prod.ts` → `/api`

## HTTP Interceptor Chain

Every HTTP request flows through:
1. **Request Phase**:
   - Correlation ID extracted/generated via `CorrelationIdService`
   - `X-Correlation-ID` header injected via `CorrelationIdInterceptor`
   
2. **Response Phase**:
   - Success: Log with correlation ID
   - Error: Log error details with correlation ID

3. **BFF Layer** (backend):
   - Receives `X-Correlation-ID` header
   - Forwards to downstream microservices
   - Enables distributed tracing

## Usage Examples

### Using Jobs Service
```typescript
import { Component, OnInit } from '@angular/core';
import { JobsService } from './services/jobs.service';
import { Job } from '@app/shared/models';

@Component({
  selector: 'app-jobs-list',
  template: `<div *ngFor="let job of jobs">{{ job.title }}</div>`
})
export class JobsListComponent implements OnInit {
  jobs: Job[] = [];

  constructor(private jobsService: JobsService) {}

  ngOnInit() {
    this.jobsService.getJobs().subscribe(jobs => {
      this.jobs = jobs;
    });
  }
}
```

### Using Kanban Board Service
```typescript
import { ApplicationsService } from './services/applications.service';
import { KanbanAggregateResponse } from '@app/shared/models';

export class KanbanBoardComponent implements OnInit {
  kanban: KanbanAggregateResponse;

  constructor(private applicationsService: ApplicationsService) {}

  ngOnInit() {
    const candidateId = 'candidate-id-here';
    this.applicationsService.getKanbanBoard(candidateId).subscribe(data => {
      this.kanban = data;
    });
  }
}
```

### Getting Correlation ID in Components
```typescript
import { CorrelationIdService } from '@app/core/services';

export class SomeComponent {
  correlationId: string;

  constructor(private correlationIdService: CorrelationIdService) {
    this.correlationId = this.correlationIdService.getId();
  }
}
```

## Module Registration

All features are lazy-loaded in `app-routing.module.ts`:
```typescript
const routes: Routes = [
  {
    path: 'jobs',
    loadChildren: () =>
      import('./features/jobs/jobs.module').then(m => m.JobsModule)
  },
  // ... more routes
];
```

HTTP Interceptor registered in `app.module.ts`:
```typescript
@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorrelationIdInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
```

## Development Workflow

1. **Add new backend DTO** → Translate to TypeScript interface in `shared/models/`
2. **Create feature service** → Extend `ApiService` with domain-specific endpoints
3. **Build feature components** → Use typed services to fetch data
4. **HTTP requests automatically traced** → Correlation ID injected + logged

## Next Steps

- [ ] Build shared UI components (buttons, loaders, tables, forms)
- [ ] Implement feature components (job list, kanban board, CV upload)
- [ ] Add route guards for authentication
- [ ] Configure error handling and notifications
- [ ] Implement state management (NgRx/Signals)
- [ ] Add unit tests for services and components

## Dependencies

- Angular 14+ (peer dependency)
- TypeScript 4.7+
- uuid (for correlation ID generation)

## Notes

- All HTTP requests automatically include `X-Correlation-ID` header
- Correlation ID persists across page navigation via `sessionStorage`
- Feature modules are lazy-loaded for optimal performance
- Services use constructor injection for DI
- All responses logged with correlation ID for debugging
