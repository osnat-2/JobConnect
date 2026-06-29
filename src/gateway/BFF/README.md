# BFF (Backend For Frontend)

Overview:
- Node.js Express-based BFF that aggregates requests for JobConnect.
- Routes frontend calls to internal microservices and exposes composite endpoints.
- Uses lightweight request composition and service orchestration rather than business logic.

Ports:
- Listens on container port `8080`.
- Example local Docker mapping: `-p 8080:8080`.
- Health endpoint: `/health`.

Configuration:
- `PORT`: optional environment variable to override the listening port (default `8080`).
- Downstream service hostnames currently hard-coded as `application-service`, `candidate-service`, and `job-service`.
- Should propagate `Correlation ID` headers to downstream services when available.

Runtime notes:
- Implements `/aggregate/kanban/:candidateId` as an example aggregation endpoint.
- Behaves as a gateway/edge layer, not a service database owner.
- For production, add authentication, request validation, and improved error handling.

Build and run:
- Docker build: `docker build -t bff:local .`
- Docker run example: `docker run -p 8080:8080 bff:local`

Dependencies:
- `express`
- `node-fetch`

Notes:
- The current implementation is a Node.js Express BFF, not a YARP gateway.
- Keep domain-specific business rules inside the respective backend services.
