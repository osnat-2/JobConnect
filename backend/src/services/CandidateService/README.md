# CandidateService

Overview:
- .NET 8 ASP.NET Core Web API for managing candidate profiles, contact information, CV metadata, and candidate search indexing.
- Uses PostgreSQL as the isolated service database.
- Publishes candidate-related domain events to RabbitMQ for notifications, application workflow updates, and downstream processing.
- Designed as a bounded microservice with no direct cross-service database queries.

Ports:
- Service listens on container port `80`.
- Example local mapping: `-p 5002:80`.
- Expected health endpoint: `/health`, verifying PostgreSQL connectivity.

Configuration:
- `POSTGRES__CONN`: PostgreSQL connection string, e.g. `Host=postgres;Database=ats;Username=postgres;Password=postgres`
- `ASPNETCORE_URLS`: `http://+:80`
- `DOTNET_ENVIRONMENT`: optional environment mode
- Additional RabbitMQ configuration may be required if event publication is implemented.

Build and run:
- Docker build: `docker build -t candidate-service:local .`
- Docker run example:
  `docker run --env POSTGRES__CONN="..." -p 5002:80 candidate-service:local`

  Note: when running via `docker-compose`, this service listens on port 80 internally and is not published externally by default. Only the gateway/BFF is exposed externally.

Notes:
- Use EF Core with the Npgsql provider for PostgreSQL access.
- Keep candidate data isolated and integrate with other services via RabbitMQ events.
- Provide structured JSON logs and include the Correlation ID on requests.
