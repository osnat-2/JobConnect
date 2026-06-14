# Architectural Specifications: Distributed Applicant Tracking System (ATS)

### 1. Overview and Objectives
The system is designed from scratch utilizing a Greenfield microservices architecture and an Event-Driven architecture. It is built to manage end-to-end recruitment processes asynchronously, ensuring high fault tolerance and scalability.

### 2. Service Structure and Data Architecture (Database-per-Service)
Each service runs as an independent container within Docker and maintains an entirely separate database to ensure decoupling. In accordance with Polyglot Persistence principles, different types of databases are utilized based on the nature of the data:

#### A. Core Services (Business Logic) – Technology: .NET 8 / C#

- **Job Service**  Role: Manages the job lifecycle (publishing, updating, cataloging).
- **Database:** MongoDB (NoSQL Document DB). Architectural Justification: Job requirements and prerequisites change frequently across different industries and roles; therefore, a schema-less model fits best here.

- **Candidate Service** Role: Manages candidate profiles and stores resume/CV metadata.
- **Database:** PostgreSQL. Provides structured storage of contact details and links to external files.

- **Application & Interview Service** Role: Manages the application process, the Kanban board status engine, and interview scheduling.
- **Database:** PostgreSQL (SQL - Relational DB). Architectural Justification: Managing recruitment stages requires strict ACID compliance to maintain data consistency (preventing scenarios where a candidate is simultaneously in two conflicting stages, or double-booking an interview).

#### B. Background Services (Background Workers) – Technology: Python

- **CV Parser & Matcher Worker:** Consumes asynchronous messages, extracts text from resume files (PDF/Word), and executes an initial matching algorithm against job requirements.
- **Notification Worker:** A dedicated service for sending emails and system notifications based on message queues.

### 3. Gateway, BFF, and Load Balancing (Gateway & Aggregation Layer)

- **Nginx Load Balancer:** Functions as the primary entry point to the network. It replicates and balances loads for the Job Service, which experiences a high volume of read requests from job seekers.
- **BFF (Backend for Frontend) / API Gateway (YARP / Node.js):** Authentication: Validates tokens (JWT) at the gateway before routing requests to internal services.
- **Data Aggregation (Mandatory Requirement 3.2):** To display the recruiter's Kanban board, the BFF exposes a single endpoint that executes parallel calls to the Application Service (to retrieve application status) and the Candidate Service (to retrieve the candidate's name and photo), aggregates the information, and returns a single, processed JSON object to the client side.

### 4. Asynchronous Communication and Saga Pattern (Mandatory Requirement 4.2)
Communication between microservices is handled via RabbitMQ (Message Broker) for complete decoupling. To manage multi-service business processes without direct database transactions, a Choreography-based Saga pattern is implemented for the "Interview Scheduling" process:

```
[Application Service] ──(InterviewRequested Event)──> [Distributed Lock / Redis]
▲ │
│ (Compensation: Rollback/Cancel) ▼
└─────────────────────────────── (LockFailed Event) ─── OR ─── (LockSuccess Event) ──> [Notification Service]
```

#### Saga Stages (Success Path):

1. The candidate selects an available time slot in the calendar. The Application Service creates an interview entity in a `Pending` state and publishes an event: `InterviewRequested`.
2. The Distributed Lock service (backed by Redis) listens for the event and attempts to lock the interviewer's time slot in Redis to prevent double-booking (Race Condition).
3. The lock succeeds ➡️ The service publishes an `InterviewLockSuccess` event.
4. The Application Service listens for the event and updates the interview status to `Confirmed`. The Notification Worker service sends an automated invitation email to both the interviewer and the candidate.

#### Compensation Path (Mandatory to Specify):

1. If the lock fails during stage (2) (for example, another candidate captured the same slot a millisecond earlier), the lock service publishes a failure event: `InterviewLockFailed`.
2. The Application Service consumes the failure event and triggers compensation logic: it deletes/cancels the temporary interview and reverts the candidate's status to the previous state.
3. The notification service sends a message to the candidate: "The selected time is no longer available, please choose a new time."

### 5. Caching Layer

- **Cache-aside Pattern:** The Job Service uses Redis Cache to store the list of the hottest and most popular jobs on the site. Each key is configured with a TTL (Time-To-Live) of 10 minutes to drastically reduce the number of queries to MongoDB and prevent fetching excessively outdated data.

### 6. Monitoring, Observability, and Resilience (Phase 5 - Mandatory Requirements)

- **Correlation ID (Requirement 5.2):** Every request entering from the UI through the BFF receives a unique identifier (GUID) in the Header. This identifier is passed along with every HTTP call between services and injected as part of the message properties within RabbitMQ.
- **Structured Logging (Requirement 5.1):** All services write structured logs (in JSON format, utilizing Serilog in .NET) containing the Correlation ID. These are centralized into a central monitoring tool (such as Seq or ELK Stack), allowing end-to-end tracking of job applications.
- **Healthchecks (Requirement 5.3):** Configuration of `/health` endpoints in every container, integrated into the `docker-compose.yml` file with `depends_on` and `condition: service_healthy` settings. This ensures infrastructure services (such as the DB and queues) are up and ready before dependent services start running.
