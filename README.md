# JobConnect

## 📝 Description
JobConnect is a microservices-based Applicant Tracking System (ATS) that combines a .NET backend, a Node.js BFF, an Angular frontend, and background workers into a modular event-driven architecture. The platform is organized around isolated service boundaries for authentication, jobs, candidates, applications, and asynchronous processing.

## 🛠️ Tech Stack & Key Dependencies
- **Backend:** .NET 8 / ASP.NET Core, Node.js / Express
- **Frontend:** Angular 14, TypeScript, RxJS
- **Data & Messaging:** PostgreSQL, MongoDB, Redis, RabbitMQ
- **Infrastructure:** Docker Compose, Nginx

## 🧩 Project Structure
- **backend/services** – core business services for auth, jobs, candidates, and applications
- **backend/gateway/BFF** – backend-for-frontend gateway for the Angular UI
- **backend/workers** – Python workers for asynchronous processing such as CV parsing and notifications
- **frontend** – Angular application for the user experience
- **docker-compose.yml** – local infrastructure and service orchestration

## 🚀 Getting Started

### Prerequisites
- Docker Desktop
- .NET SDK 8.0 or later
- Node.js 20 LTS or later
- Python 3.11 or later

### Run the Full Stack
```bash
docker compose up --build
```

### Run the Frontend Locally
```bash
cd frontend
npm install
npm start
```

### Run a Backend Service Locally
```bash
cd backend/src/services/AuthService/AuthService
dotnet restore
dotnet run
```

## 📚 Documentation
Each major component includes its own README for service-specific setup and runtime details:
- [backend/src/services/AuthService/AuthService/README.md](backend/src/services/AuthService/AuthService/README.md)
- [backend/src/services/ApplicationService/ApplicationService/README.md](backend/src/services/ApplicationService/ApplicationService/README.md)
- [backend/src/services/CandidateService/README.md](backend/src/services/CandidateService/README.md)
- [backend/src/services/JobService/JobService/README.md](backend/src/services/JobService/JobService/README.md)
- [backend/src/gateway/BFF/README.md](backend/src/gateway/BFF/README.md)
- [frontend/README.md](frontend/README.md)
- [backend/src/workers/CVParserWorker/README.md](backend/src/workers/CVParserWorker/README.md)
- [backend/src/workers/NotificationWorker/README.md](backend/src/workers/NotificationWorker/README.md)
