# JobService

## 📝 Description
JobService manages job postings and job lifecycle operations for JobConnect. It uses MongoDB for flexible document storage and Redis for cache-aside access to frequently requested job listings, while remaining isolated from the other service databases.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** .NET 8 / ASP.NET Core Web API
- **Primary Libraries:** MongoDB.Driver, StackExchange.Redis, AutoMapper, RabbitMQ.Client, Swagger / OpenAPI, Serilog, Health Checks

## 🚀 Getting Started

### Prerequisites
- .NET SDK 8.0 or later
- Docker Desktop
- MongoDB 6 and Redis 7 (or the repository Docker Compose stack)

### Environment Variables / Configuration
| Variable / Key | Description | Default Value |
| --- | --- | --- |
| MONGO__CONNECTION | MongoDB connection string for job persistence | mongodb://localhost:27017/jobs |
| REDIS__HOST | Redis hostname for cache access | localhost |
| REDIS__PORT | Redis port | 6379 |
| ASPNETCORE_URLS | ASP.NET listening URL | http://+:80 (container) |
| ASPNETCORE_ENVIRONMENT | Runtime environment mode | Development |

### How to Run Locally
```bash
# 1) Start MongoDB and Redis
docker compose up -d mongo redis

# 2) Move into the service directory
cd backend/src/services/JobService/JobService

# 3) Restore and build the service
dotnet restore
dotnet build

# 4) Start the API
dotnet run
```

The service exposes:
- Swagger UI: http://localhost:5286/swagger
- Health endpoint: http://localhost:5286/health

```bash
# Containerized run example
docker build -t job-service:local -f backend/src/services/JobService/JobService/Dockerfile .
docker run --rm -p 5001:80 --env MONGO__CONNECTION="mongodb://mongo:27017/jobs" --env REDIS__HOST="redis" job-service:local
```