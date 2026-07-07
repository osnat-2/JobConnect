# CandidateService

## 📝 Description
CandidateService manages candidate profiles, contact information, and CV document metadata for JobConnect. It stores candidate records in PostgreSQL and publishes candidate-related events to RabbitMQ so document processing and application workflows can remain decoupled.

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
| POSTGRES__CONN | PostgreSQL connection string for candidate persistence | Host=localhost;Database=ats;Username=postgres;Password=postgres |
| RABBITMQ__HOST | RabbitMQ hostname for event publishing and listening | localhost |
| ASPNETCORE_URLS | ASP.NET listening URL | http://+:80 (container) |
| ASPNETCORE_ENVIRONMENT | Runtime environment mode | Development |

### How to Run Locally
```bash
# 1) Start PostgreSQL and RabbitMQ
docker compose up -d postgres rabbitmq

# 2) Move into the service directory
cd backend/src/services/CandidateService/CandidateService

# 3) Restore and build the service
dotnet restore
dotnet build

# 4) Start the API
dotnet run
```

Access the service at:
- Swagger UI: http://localhost:5286/swagger
- Health endpoint: http://localhost:5286/health

```bash
# Containerized run example
docker build -t candidate-service:local -f backend/src/services/CandidateService/CandidateService/Dockerfile .
docker run --rm -p 5002:80 --env POSTGRES__CONN="Host=postgres;Database=ats;Username=postgres;Password=postgres" --env RABBITMQ__HOST="rabbitmq" candidate-service:local
```
