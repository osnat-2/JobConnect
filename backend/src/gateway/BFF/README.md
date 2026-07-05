# BFF (Backend For Frontend)

Overview:
- Node.js Express-based BFF that aggregates requests for JobConnect.
- Routes frontend calls to internal microservices and exposes composite endpoints.
- Uses lightweight request composition and service orchestration rather than business logic.

Ports:
- Listens on container port `8080`.
- Example local Docker mapping: `-p 8080:8080`.
- Health endpoint: `/health`.

Features:
- Correlation ID propagation for downstream requests
- Bearer-token authentication when `AUTH_REQUIRED=true`
- Kanban aggregation for application and candidate data
- Proxy routing for job-service requests
- Retry logic for transient downstream failures

Configuration:
- `PORT`: override the listening port (default `8080`)
- `AUTH_REQUIRED`: enable authentication checks (`true`/`false`)
- `AUTH_TOKEN`: expected bearer token when auth is enabled
- `APPLICATION_SERVICE_URL`, `CANDIDATE_SERVICE_URL`, `JOB_SERVICE_URL`: downstream service URLs

Build and run:
- Docker build: `docker build -t bff:local .`
- Docker run example: `docker run -p 8080:8080 -e AUTH_REQUIRED=true -e AUTH_TOKEN=development-token bff:local`

Testing:
- Run `npm test` from this folder to execute the gateway test suite.

Dependencies:
- `express`
- `node-fetch`
