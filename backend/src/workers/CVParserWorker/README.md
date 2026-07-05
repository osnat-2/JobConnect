# CVParserWorker

Overview:
- Python background worker that consumes RabbitMQ events, parses candidate CVs (PDF / DOCX), and publishes parsed metadata for CandidateService.
- Implements durable queue handling, dead-letter routing, and structured JSON logging with Correlation IDs.
- Uses RabbitMQ-only integration; it does not connect to any service database directly.

Supported events:
- `DocumentUploaded`
  - Consumed when CandidateService or another service publishes a new CV document event.
  - Payload: `{ "documentId": "uuid", "candidateId": "uuid", "storageUrl": "https://...", "fileType": "pdf|docx" }
`
- `MatchingRequested`
  - Consumed when an application match is requested.
  - Payload: `{ "applicationId": "uuid", "candidateId": "uuid", "jobRequirements": [ ... ], "parsedText": "..." }
`

Published events:
- `DocumentParsed`
  - Emitted when CV parsing succeeds.
  - Payload: `{ "documentId": "uuid", "candidateId": "uuid", "parsedText": "...", "extractedSkills": [ ... ], "parsedAt": "iso8601" }`
- `DocumentParsingFailed`
  - Emitted when parsing fails permanently.
  - Payload: `{ "documentId": "uuid?", "candidateId": "uuid?", "errorReason": "...", "retryable": false, "failedAt": "iso8601" }`
- `CandidateMatched`
  - Optional event emitted for matching requests.
  - Payload: `{ "applicationId": "uuid", "candidateId": "uuid", "matchScore": 0.0, "matchedSkills": [ ... ] }`

Configuration:
- Requires RabbitMQ connection details via environment variables or host configuration.
- May require CandidateService endpoint configuration if writing parsed data over HTTP.
- Use a secrets store for any external parser credentials if added.
- `RABBITMQ__HOST` - RabbitMQ hostname (e.g. `rabbitmq` in Docker Compose).
- `RABBITMQ__PORT` - RabbitMQ port (default: `5672`).
- `RABBITMQ__USER` / `RABBITMQ__PASSWORD` - RabbitMQ credentials.
- `CVPARSER_EXCHANGE` - Topic exchange name (default: `application-events`).
- `CVPARSER_QUEUE` - Worker queue name (default: `cv-parser-queue`).
- `CVPARSER_DLX` - Dead-letter exchange name (default: `cv-parser-dlx`).
- `CVPARSER_DLQ` - Dead-letter queue name (default: `cv-parser-dlq`).

Build and run:
- Install dependencies: `pip install -r requirements.txt`
- Run locally: `python worker.py`
- Docker build: `docker build -t cv-parser-worker .`

Testing:
- Run unit tests with `pytest`.

Notes:
- This folder contains a placeholder worker loop; implement real message consumption and error handling.
- Add retry/backoff logic and publish failure events to RabbitMQ when parsing or delivery fails.
- Do not embed direct access to other service databases; use event messages or API calls.
- Uses `aiohttp` for HTTP document download and `pika` for RabbitMQ.
- Keeps full correlation traceability via `X-Correlation-ID` message headers.
- DLQ behavior is configured on the worker queue for permanent failures.