# ApplicationService

## 📝 Description
ApplicationService handles the lifecycle of job applications, status transitions, and interview scheduling within JobConnect. It persists transactional application state in PostgreSQL and publishes event messages to RabbitMQ so downstream workers and other services can react asynchronously.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** .NET 8 / ASP.NET Core Web API
- **Primary Libraries:** Entity Framework Core, Npgsql, RabbitMQ.Client, Swagger / OpenAPI, Serilog, Health Checks

## 🚀 Getting Started

### Prerequisites
- .NET SDK 8.0 or later
- Docker Desktop
- PostgreSQL 15 and RabbitMQ (or the repository Docker Compose stack)

### Environment Variables / Configuration
| Variable / Key | Description | Default Value |
| --- | --- | --- |
| POSTGRES__CONN | PostgreSQL connection string for application persistence | Host=localhost;Database=ats;Username=postgres;Password=postgres |
| RABBITMQ__HOST | RabbitMQ hostname for event publication | localhost |
| ASPNETCORE_URLS | ASP.NET listening URL | http://+:80 (container) |
| ASPNETCORE_ENVIRONMENT | Runtime environment mode | Development |

### How to Run Locally
```bash
# 1) Start the supporting infrastructure
docker compose up -d postgres rabbitmq

# 2) Move into the service directory
cd backend/src/services/ApplicationService/ApplicationService

# 3) Restore and build the service
dotnet restore
dotnet build

# 4) Start the API
dotnet run
```

The API will be reachable at:
- Swagger UI: http://localhost:5286/swagger
- Health endpoint: http://localhost:5286/health

```bash
# Containerized run example
docker build -t application-service:local -f backend/src/services/ApplicationService/ApplicationService/Dockerfile .
docker run --rm -p 5003:80 --env POSTGRES__CONN="Host=postgres;Database=ats;Username=postgres;Password=postgres" --env RABBITMQ__HOST="rabbitmq" application-service:local
```
