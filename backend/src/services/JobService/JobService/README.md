# JobService

Overview:
- .NET 8 ASP.NET Core Web API managing job postings, search, and lifecycle operations.
- Uses MongoDB for document-oriented job storage.
- Uses Redis for cache-aside hot listings and distributed synchronization.
- Should publish job lifecycle events to RabbitMQ for integration with other services and workers.
- Designed as an isolated microservice with no direct access to other service databases.

Ports:
- Service listens on container port `80`.
- Example local mapping: `-p 5001:80`.
- Expected health endpoint: `/health`, reporting MongoDB and Redis connectivity.

Configuration:
- `MONGO__CONNECTION`: MongoDB connection string, e.g. `mongodb://mongo:27017/jobs`
- `REDIS__HOST`: Redis host, e.g. `redis`
- `ASPNETCORE_URLS`: `http://+:80`
- `DOTNET_ENVIRONMENT`: optional environment mode
- `RABBITMQ__HOST`: expected for event publication if RabbitMQ integration is implemented.

Build and run:
- Docker build: `docker build -t job-service:local .`
- Docker run example:
  `docker run --env MONGO__CONNECTION="..." --env REDIS__HOST="..." -p 5001:80 job-service:local`

  Note: when running via `docker-compose`, this service listens on port 80 internally and is not published externally by default. Only the gateway/BFF is exposed externally.

Notes:
- Follow the Redis cache-aside pattern and enforce a TTL of 10 minutes on cached hot listings.
- Use structured JSON logs and propagate Correlation IDs through HTTP and event metadata.
- Store connection strings through environment variables or secrets.