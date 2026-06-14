# JobService (.NET 8 + MongoDB)

Role:
- Manages job lifecycle (publish, update, search, archive)
- High-read traffic; uses Redis cache for hot listings

Tech stack:
- .NET 8 (C#), ASP.NET Core Web API
- MongoDB for document storage
- Redis for cache & distributed counters
- Serilog for structured JSON logging

Run / Develop:
- Create a new solution and Web API project: `dotnet new webapi -n JobService`
- Add MongoDB NuGet packages and Serilog
- Build and run with Docker (see Dockerfile)

Docker (example):
- `docker build -t job-service:local .`
- `docker run --env MONGO__CONNECTION=... -p 5001:80 job-service:local`

Healthcheck: expose `/health` returning JSON with DB and cache status.

Notes: Store connection strings via environment variables or secrets.
