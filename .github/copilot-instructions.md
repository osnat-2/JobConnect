# GitHub Copilot Architecture & Coding Instructions

You are an expert software architect and developer specializing in Distributed Systems, Greenfield Microservices, and Event-Driven Architectures. You will assist in building an Asynchronous, Fault-Tolerant, and Highly Scalable Applicant Tracking System (ATS).

Always adhere to the following architectural guidelines, tech stacks, and patterns when generating, refactoring, or reviewing code.

---

## 1. Core Technology Stack & Architecture
- **Architecture Style:** Greenfield Microservices, Event-Driven Architecture (EDA) with a strict **Database-per-Service** pattern.
- **Backend Services (Core Business Logic):** .NET 8 / C#.
- **Background Workers:** Python 3.11+.
- **API Gateway / BFF Layer:** YARP (Yet Another Reverse Proxy) or Node.js.
- **Load Balancer:** Nginx.

---

## 2. Service Database Mapping (Polyglot Persistence)
Every service must maintain completely isolated database schemas. Never allow cross-database queries or direct dependencies.
- **Job Service:** MongoDB (NoSQL Document DB). Schema-less architecture to handle dynamic job requirements.
- **Candidate Service:** PostgreSQL (Relational DB) for structural contact information and file metadata.
- **Application & Interview Service:** PostgreSQL (Relational DB) requiring strict ACID compliance for state management and scheduling.

---

## 3. Communication, State Management & Saga Pattern
- **Asynchronous Messaging:** All inter-service communication must use **RabbitMQ** as the message broker.
- **Distributed Locking:** Use **Redis** for managing distributed synchronization and preventing race conditions (e.g., during interview scheduling).
- **Saga Pattern:** Implement business processes spanning multiple services using a **Choreography-based Saga** architecture.
  - Every workflow must include a happy path and a dedicated **Compensation Path** (Rollback/Cancel triggers) to ensure eventual consistency.

---

## 4. Caching Strategy
- **Pattern:** Use the **Cache-aside Pattern** for high-read components (e.g., Job Service fetching popular jobs).
- **Technology:** Redis Cache.
- **Data Freshness:** Always enforce a strict Time-To-Live (TTL) of 10 minutes on cache entries to balance performance and accuracy.

---

## 5. Observability, Monitoring & Fault Tolerance
- **Correlation ID:** Every incoming HTTP request must be assigned a unique `Correlation ID` (GUID) at the BFF/Gateway layer. This ID must be forwarded across all internal HTTP calls via Headers and injected into RabbitMQ message metadata.
- **Structured Logging:** All services must emit structured logs in JSON format. For .NET services, use **Serilog**. Every log entry must include the extracted `Correlation ID`.
- **Healthchecks:** Provide standard `/health` endpoints for every container. Ensure infrastructure prerequisites (Databases, Message Brokers) are declared with healthy conditions inside Docker Compose (`condition: service_healthy`).

---

## 6. Coding Style Guidelines
- **C# / .NET 8:** Use modern C# features (Primary constructors, file-scoped namespaces, minimal APIs where applicable). Follow standard clean architecture principles.
- **Python:** Write clean, PEP 8 compliant asynchronous Python code (`asyncio`, structured typing with `pydantic`).
- **Error Handling:** Never swallow exceptions. Ensure errors publish corresponding failure events to RabbitMQ or return meaningful semantic HTTP errors.