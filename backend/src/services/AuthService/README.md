# AuthService

## 📝 Description
AuthService is the identity and authentication boundary for JobConnect. It exposes registration and login endpoints for users, validates credentials, hashes passwords with BCrypt, and issues JWT-based access tokens for downstream client and gateway flows. The service stores user identity data in PostgreSQL and is used by the BFF and frontend clients as the primary authentication entry point.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** .NET 8 / ASP.NET Core Web API
- **Primary Libraries:** ASP.NET Core, Entity Framework Core, Npgsql, System.IdentityModel.Tokens.Jwt, BCrypt.Net-Next, Swagger / OpenAPI, Serilog, Health Checks

## 🚀 Getting Started

### Prerequisites
- .NET SDK 8.0 or later
- Docker Desktop (recommended for PostgreSQL and full-stack orchestration)
- PostgreSQL 15 (or use the repository Docker Compose setup)

### Environment Variables / Configuration
| Variable / Key | Description | Default Value |
| --- | --- | --- |
| POSTGRES__CONN | PostgreSQL connection string used by the EF Core data context | Host=localhost;Database=ats;Username=postgres;Password=postgres |
| JwtSettings:SecretKey | Secret used to sign JWT access tokens | dev-secret-key-change-me-in-production-123456 |
| JwtSettings:Issuer | JWT issuer claim | JobConnect |
| JwtSettings:Audience | JWT audience claim | JobConnect-Clients |
| JwtSettings:ExpiresInMinutes | Token lifetime in minutes | 60 |
| ASPNETCORE_URLS | Runtime listen URL for the ASP.NET host | http://+:80 (container) |
| ASPNETCORE_ENVIRONMENT | Runtime environment mode | Development |

### How to Run Locally
```bash
# 1) Start the required PostgreSQL dependency
docker compose up -d postgres

# 2) Move into the service directory
cd backend/src/services/AuthService/AuthService

# 3) Restore and build the service
dotnet restore
dotnet build

# 4) Configure the local database connection string
$env:POSTGRES__CONN="Host=localhost;Database=ats;Username=postgres;Password=postgres"

# 5) Start the API
dotnet run
```

Once running, the service is available at:
- Swagger UI: http://localhost:5286/swagger
- Health endpoint: http://localhost:5286/health
- Authentication endpoints:
  - POST /api/auth/register
  - POST /api/auth/login

```bash
# Containerized run example
docker build -t auth-service:local -f backend/src/services/AuthService/AuthService/Dockerfile .
docker run --rm -p 5286:80 --env POSTGRES__CONN="Host=postgres;Database=ats;Username=postgres;Password=postgres" auth-service:local
```
