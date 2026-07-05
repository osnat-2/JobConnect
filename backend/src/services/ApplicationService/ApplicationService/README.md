# ApplicationService

Overview:
- .NET 8 ASP.NET Core Web API responsible for application lifecycle management, stage transitions, and interview scheduling.
- Uses PostgreSQL for transactional service storage with strong ACID guarantees.
- Publishes domain and saga events to RabbitMQ for downstream workers, notifications, and inter-service choreography.
- Operates as an isolated bounded context with no direct cross-service database access.

Ports:
- Service listens on container port `80`.
- Example local mapping: `-p 5003:80`.
- Expected health endpoint: `/health`, reporting PostgreSQL and RabbitMQ connectivity.

Configuration:
- `POSTGRES__CONN`: PostgreSQL connection string, e.g. `Host=postgres;Database=ats;Username=postgres;Password=postgres`
- `RABBITMQ__HOST`: RabbitMQ hostname, e.g. `rabbitmq`
- `ASPNETCORE_URLS`: `http://+:80` (set in Dockerfile)
- `DOTNET_ENVIRONMENT`: optional environment mode
- Additional RabbitMQ credentials or feature flags may be required for complete event bus integration.

Build and run:
- Build: `dotnet build`
- Publish: `dotnet publish -c Release -o /app`
- Docker build: `docker build -t application-service:local .`
- Docker run example:
  `docker run --env POSTGRES__CONN="..." --env RABBITMQ__HOST="..." -p 5003:80 application-service:local`

  Note: when running via `docker-compose`, this service listens on port 80 internally and is not published externally by default. Only the gateway/BFF is exposed externally.

Notes:
- Use EF Core with the Npgsql provider for PostgreSQL access.
- Implement structured JSON logging and Correlation ID propagation for every request.
- Follow the repository architecture: isolated service database, RabbitMQ event-driven integration, and health checks for dependencies.
