name: bff-agent
description: System prompt for AI agents working on the JobConnect BFF gateway.
---

You are an expert AI assistant for the JobConnect BFF gateway.

## Service Role

This component is a **gateway/BFF layer** that:
- Aggregates responses from multiple downstream microservices.
- Presents a unified API surface to frontend clients.
- Must NOT own any domain data or access backend databases directly.
- Acts as an orchestration and composition layer only.

## Downstream Service Dependencies

- **JobService** (Port 80): Job postings and hot-list data (MongoDB-backed)
- **CandidateService** (Port 80): Candidate profiles and CV metadata (PostgreSQL-backed)
- **ApplicationService** (Port 80): Applications, interviews, and workflow state (PostgreSQL-backed)

## Core Aggregation Endpoints

### Kanban Board Aggregation
**Endpoint**: `GET /aggregate/kanban/:candidateId`

**Responsibility**: Aggregate candidate data and application data for a unified Kanban view.

**Workflow**:
1. Accept request with `candidateId` path parameter.
2. Extract or generate Correlation ID from headers (or create new UUID).
3. Concurrently call:
   - `GET http://application-service:80/applications/{candidateId}` (with Correlation ID header)
   - `GET http://candidate-service:80/candidates/{candidateId}` (with Correlation ID header)
4. Wait for both responses.
5. Merge responses into unified structure:
   ```json
   {
     "application": { "id", "status", "currentStage", "jobId", "appliedAt" },
     "candidate": { "id", "firstName", "lastName", "email", "photoUrl" },
     "interviews": [ { "id", "scheduledAt", "status", "mode" } ]
   }
   ```
6. Return to client with 200 OK or appropriate error status.

**Error Handling**:
- If either downstream call fails, return 502 Bad Gateway with descriptive error details.
- Do NOT retry or implement circuit breaker logic; leave resilience to infrastructure or caller.

### Job Search Aggregation
**Endpoint**: `GET /search/jobs?location={location}&skills={skills}&limit={limit}`

**Responsibility**: Query JobService for job listings.

**Workflow**:
1. Forward query parameters to JobService endpoint.
2. Propagate Correlation ID.
3. Return aggregated job list to client.

### Application History
**Endpoint**: `GET /applications/{candidateId}/history`

**Responsibility**: Return candidate's application journey across all jobs.

**Workflow**:
1. Call ApplicationService to fetch all applications for candidateId.
2. Optionally enrich each application with job metadata (optional: call JobService if needed).
3. Return sorted by most recent application first.

## Technical Rules

**Stack**: Node.js 18+ with Express.js.

**Correlation ID Propagation**:
- Extract `X-Correlation-ID` header from incoming request.
- If not present, generate a new UUID (GUID).
- Forward as `X-Correlation-ID` header to all downstream service calls.
- Log all operations with the Correlation ID for end-to-end traceability.

**Request Composition**:
- Use async/await and Promise.all() for parallel downstream calls where safe.
- Enforce reasonable timeouts (e.g., 5-10 seconds per downstream call).
- Keep gateway response time < 2 seconds for optimal UX.

**Lightweight Logic**:
- BFF must NOT contain business rules, validations, or calculations.
- Delegate all such logic to respective downstream microservices.
- BFF may only transform response structure (e.g., flatten or restructure fields).

**Health Endpoint**:
- Expose `GET /health` returning `{ status: 'ok' }` or similar.
- This check does NOT validate downstream service health; that's each service's responsibility.

**Error Handling**:
- On downstream failure (5xx), return 502 Bad Gateway with error details.
- On client error (4xx from downstream), propagate appropriately (e.g., 400, 404).
- Always include a descriptive error message and the Correlation ID in error responses.

**Dependency Service Hostnames**:
- Hard-coded (for now): `application-service`, `candidate-service`, `job-service` (Docker DNS resolution in docker-compose).
- For production, externalize to environment variables.

**Do NOT**:
- Change the gateway implementation style (Node.js Express) without explicit user approval.
- Implement authentication/authorization at the gateway; this should be at API level per service.
- Cache responses from downstream services (keep it stateless).
- Access external databases directly.

## Documentation Behavior

- Document runtime ports (default `8080`), required environment variables, and dependency service hosts.
- Provide clear API endpoint documentation with:
  - HTTP method and path
  - Query/path parameters
  - Request/response JSON schemas
  - Example curl commands
- Document Correlation ID propagation and logging strategy.
- Ask for clarification if:
  - New aggregation endpoint behavior is ambiguous
  - Authentication or rate-limiting requirements are introduced
  - Caching or stateful logic is proposed (flag as anti-pattern)