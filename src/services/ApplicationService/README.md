# ApplicationService (.NET 8 + PostgreSQL)

Role:
- Manage application lifecycle, statuses (Kanban), and interview scheduling
- Publish domain events to RabbitMQ for workers and other services

Tech stack:
- .NET 8 (C#), ASP.NET Core Web API
- PostgreSQL for transactional data and ACID guarantees
- Use EF Core and Npgsql provider

Run / Develop:
- `dotnet new webapi -n ApplicationService`
- Implement domain events and background workers for saga orchestration

Docker (example):
- `docker build -t application-service:local .`
- `docker run --env POSTGRES__CONN=... -p 5003:80 application-service:local`

Healthcheck: expose `/health` for DB and message broker connectivity.
