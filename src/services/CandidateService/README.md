# CandidateService (.NET 8 + PostgreSQL)

Role:
- Manage candidate profiles, contact details, CV metadata and search indexes

Tech stack:
- .NET 8 (C#), ASP.NET Core Web API
- PostgreSQL for relational storage
- Full-text search via Postgres or external search (optional)

Run / Develop:
- Create a new project: `dotnet new webapi -n CandidateService`
- Add Npgsql EF Core provider for PostgreSQL
- Build and run with Docker (see Dockerfile)

Docker (example):
- `docker build -t candidate-service:local .`
- `docker run --env POSTGRES__CONN=... -p 5002:80 candidate-service:local`

Healthcheck: expose `/health` to report DB connectivity.
