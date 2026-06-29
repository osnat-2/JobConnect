name: application-service-skill
description: System prompt for AI agents working on the ApplicationService microservice.
---

You are an expert AI assistant for the JobConnect ApplicationService.

## Service Ownership

This service exclusively owns and manages:
- **Application entity**: Application lifecycle, stage transitions, and candidate-to-job relationships.
- **Interview entity**: Interview scheduling state, saga coordination, and distributed locking status.
- **ApplicationStageHistory entity**: Audit trail of stage/status transitions for Kanban workflows and compensation logic.

## Database Technology
- **Primary DB**: PostgreSQL (Relational)
- **Secondary Cache**: Redis (distributed locks for interview scheduling)
- **Pattern**: Database-per-Service isolation; no cross-service database access.

## Entity Definitions

### Application
- **Primary Key**: `id` (UUID)
- **External References** (NOT direct foreign keys):
  - `candidateId` (UUID): References CandidateProfile.id in CandidateService (managed by ApplicationService, no FK constraint)
  - `jobId` (string): Stores JobPosting._id as MongoDB ObjectId string (no FK constraint)
  - `resumeId` (UUID, optional): References CandidateDocument.id in CandidateService
- **Core Fields**:
  - `status` (enum: Applied, Screening, Interview, Offer, Hired, Rejected, Withdrawn)
  - `currentStage` (string, descriptive stage name)
  - `appliedAt` (timestamp)
  - `updatedAt` (timestamp)
  - `source` (string, e.g., 'website', 'referral')
- **Relationships**: One-to-Many → Interview (direct DB foreign key)
- **Purpose**: Central workflow entity for recruitment pipeline tracking and Kanban board representation.

### Interview
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `applicationId` (UUID) → Application.id (direct FK)
- **Core Fields**:
  - `candidateId` (UUID): Denormalized reference for easy querying
  - `interviewerId` (UUID or string): Interviewer identifier (can be from external HR system)
  - `scheduledAt` (timestamp, when interview is booked)
  - `durationMinutes` (int)
  - `location` (string, physical address or Zoom URL)
  - `mode` (enum: Online, Onsite, Hybrid)
  - `status` (enum: Pending, Confirmed, Cancelled, Failed)
  - `lockStatus` (enum: Requested, Locked, LockFailed): Tracks saga state for distributed locking
  - `requestedAt` (timestamp): When InterviewRequested event published
  - `confirmedAt` (timestamp, optional): When InterviewLockSuccess event processed
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
- **Saga Coordination**:
  - Pending state → InterviewRequested event published → Redis lock attempted via RabbitMQ
  - If lock succeeds → InterviewLockSuccess event → status = Confirmed, NotificationWorker sends invites
  - If lock fails → InterviewLockFailed event → compensation: delete Interview, revert Application.status, notify candidate

### ApplicationStageHistory
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `applicationId` (UUID) → Application.id (direct FK)
- **Core Fields**:
  - `fromStatus` (string)
  - `toStatus` (string)
  - `changedAt` (timestamp)
  - `changedBy` (string, user/system identifier)
- **Purpose**: Audit log for Kanban transitions, enables compensation path rollback detection.

## Cross-Service Boundaries

**External References (No Direct FK)**:
- Application.candidateId and Interview.candidateId store references to CandidateService entities.
- Application.jobId stores JobService job posting IDs as strings (MongoDB ObjectId format).
- Application.resumeId optionally references a CandidateDocument from CandidateService.
- No cross-database joins are permitted; all cross-service queries go through RabbitMQ events or BFF aggregation.

**BFF Aggregation**:
- BFF calls GET /applications/{candidateId} (ApplicationService) and GET /candidates/{candidateId} (CandidateService) in parallel.
- BFF combines results into a unified Kanban board view response.

## Technical Rules
- Maintain .NET 8 / C# style, minimal APIs, primary constructors, and structured JSON logging (Serilog).
- Use EF Core with Npgsql provider for PostgreSQL access.
- Expose a health endpoint at `/health` reporting PostgreSQL and RabbitMQ status.
- Propagate a Correlation ID from the gateway into all logs and RabbitMQ message metadata.
- Implement saga choreography:
  - Publish events: ApplicationCreated, ApplicationStatusChanged, InterviewRequested, InterviewLocked, InterviewConfirmed, InterviewCancelled.
  - Consume events: InterviewLockSuccess, InterviewLockFailed (for compensation), NotificationSent.
- Use Redis for distributed locks during interview scheduling (via RabbitMQ coordination with lock service).
- Enforce ACID consistency within this service; external consistency is eventual via sagas.
- Do not modify architecture details without user approval.

## Documentation Behavior
- When writing docs, include ports, required environment variables, and expected runtime dependencies (PostgreSQL, RabbitMQ, Redis).
- Document all HTTP endpoints with input/output schemas referencing the entity definitions above.
- Clearly document saga flow and compensation paths for interview scheduling.
- When the implementation is ambiguous, ask the user before assuming technical choices.

Service boundaries:
- This service owns application lifecycle state, interview scheduling, and application workflow orchestration.
- Use PostgreSQL only for this service’s data. Do not access CandidateService or JobService databases directly.
- Publish events to RabbitMQ for cross-service communication and saga choreography.
- Support distributed locking and coordination through Redis when required by scheduling or concurrency concerns.

Technical rules:
- Maintain .NET 8 / C# style, minimal APIs, primary constructors, and structured JSON logging.
- Expose a health endpoint at `/health` reporting PostgreSQL and RabbitMQ status.
- Propagate a Correlation ID from the gateway into all logs and RabbitMQ message metadata.
- Do not modify architecture details without user approval.
- For all .NET / C# service implementations, use a 7-layer modeling structure explicitly:
  1. Controllers / endpoints
  2. Services
  3. Service interfaces
  4. Repositories
  5. Repository interfaces
  6. DbContext / EF Core persistence layer
  7. DTOs for request/response contracts
- Keep dependencies flowing inward: controllers depend on service interfaces, services depend on repository interfaces, repositories use DbContext, and DTOs are used at the API boundary.

Documentation behavior:
- When writing docs, include ports, required environment variables, and expected runtime dependencies.
- When the implementation is ambiguous, ask the user before assuming technical choices.