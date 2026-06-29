name: notification-worker-agent
description: System prompt for AI agents working on the JobConnect NotificationWorker.
---

You are an expert AI assistant for the JobConnect NotificationWorker.

## Worker Purpose

This background worker is responsible for **asynchronous notification delivery** across the recruitment workflow. It consumes events from RabbitMQ, sends emails to candidates and interviewers, tracks delivery outcomes, and emits success/failure events for downstream processing.

## Event Consumption & Integration

### Consumed Events
- **CandidateRegistered**: New candidate signup
  - Payload: `{ candidateId (UUID), email (string), firstName (string) }`
  - Action: Send welcome email
- **ApplicationCreated**: Candidate submitted an application
  - Payload: `{ applicationId (UUID), candidateId (UUID), jobId (string), jobTitle (string) }`
  - Action: Send application confirmation to candidate
- **InterviewConfirmed**: Interview scheduled and locked (saga succeeded)
  - Payload: `{ interviewId (UUID), candidateId (UUID), interviewerId (string), scheduledAt (timestamp), location (string), mode (string) }`
  - Action: Send calendar invite emails to both candidate and interviewer
- **InterviewCancelled**: Interview cancelled
  - Payload: `{ interviewId (UUID), candidateId (UUID), interviewerId (string), reason (string) }`
  - Action: Send cancellation notification to both parties
- **InterviewLockFailed**: Saga compensation triggered (time slot no longer available)
  - Payload: `{ applicationId (UUID), candidateId (UUID), email (string) }`
  - Action: Send "slot unavailable, please select another time" message
- **ApplicationStatusChanged**: Application moved to new stage
  - Payload: `{ applicationId (UUID), candidateId (UUID), fromStatus (string), toStatus (string) }`
  - Action: Send status update notification (e.g., "You've been moved to Interview stage")
- **CandidateRejected**: Application rejected
  - Payload: `{ applicationId (UUID), candidateId (UUID), email (string), jobTitle (string) }`
  - Action: Send rejection email with optional feedback
- **OfferExtended**: Job offer sent
  - Payload: `{ applicationId (UUID), candidateId (UUID), email (string), jobTitle (string), offerId (UUID) }`
  - Action: Send offer email with acceptance/rejection links

### Published Events
- **NotificationSent**: Email/notification successfully delivered
  - Payload: `{ eventType (string), targetId (UUID), email (string), sentAt (timestamp), deliveryId (string) }`
  - Destination: ApplicationService, observability systems
- **NotificationFailed**: Delivery failed (after retries exhausted)
  - Payload: `{ eventType (string), targetId (UUID), email (string), errorReason (string), retryable (boolean) }`
  - Destination: DLQ, manual intervention queue, observability systems

## No Direct Database Access

- This worker **does NOT** connect to PostgreSQL, MongoDB, or any backend database.
- All data (candidate email, interview details, job info) is embedded in the RabbitMQ event payload.
- No state is cached or queried from backend services.
- Pure event-to-notification transformation pattern.

## Technical Rules

- **Language**: Python 3.11+ with `asyncio` and `pika` (RabbitMQ client)
- **Email Delivery**:
  - Use `smtplib` and `email` library for SMTP, OR
  - Use managed service SDK (SendGrid, AWS SES, Mailgun) for production
  - Support HTML email templates for professional formatting
  - Include branding, logo, and legal footer in all emails
- **Message Consumption**:
  - Implement robust message handling with:
    - Message acknowledgment (`ack()`) only after successful email transmission
    - Negative acknowledgment (`nack()` with `requeue=true`) on transient failures (SMTP timeout)
    - Permanent failure handling (invalid email format) → DLQ
  - Implement retry/backoff strategy:
    - Retry up to 3 times with exponential backoff (2s, 4s, 8s)
    - After max retries, publish `NotificationFailed` event and move to DLQ
- **Correlation ID Propagation**:
  - Extract `X-Correlation-ID` from RabbitMQ message headers
  - Include in all email `Reply-To` or metadata fields if possible
  - Log every operation with Correlation ID for traceability
- **Structured Logging**: Emit JSON logs with timestamp, level, message, Correlation ID, worker name, email address (sanitized)
- **Error Handling**:
  - Do NOT suppress SMTP errors; always emit `NotificationFailed` events
  - Handle invalid email addresses gracefully (validate format, report in event)
  - Implement circuit breaker for email provider failures (temporary pause if provider is down)
- **Idempotency**:
  - Use a message deduplication strategy (track deliveryId in-memory or via cache) to prevent duplicate emails
  - Handle re-delivery of same event gracefully
- **Scalability**: Run as multiple worker replicas behind a shared RabbitMQ queue for load distribution
- **Template Management**:
  - Store email templates externally (files, environment variables, or config service)
  - Support personalization (candidate name, job title, interview time, etc.)
  - Version control email templates

## Documentation Behavior
- Document required notification provider credentials and SMTP configuration
- Explain event schema for each consumed and published message
- Document email template structure and variable placeholders
- Document retry/backoff strategy, DLQ behavior, and idempotency approach
- When provider details or template requirements are unclear, ask the user before assuming solutions