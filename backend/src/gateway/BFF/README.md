# BFF

## 📝 Description
The BFF acts as the gateway layer between the Angular frontend and the backend microservices. It aggregates requests for jobs, candidates, applications, and authentication, while also injecting correlation IDs and enforcing the shared API contract for the UI.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** Node.js / Express
- **Primary Libraries:** Express, multer, node-fetch, custom logging middleware

## 🚀 Getting Started

### Prerequisites
- Node.js 20 LTS or later
- npm
- Docker Desktop (optional, for the full stack)

### Environment Variables / Configuration
| Variable / Key | Description | Default Value |
| --- | --- | --- |
| PORT | HTTP port for the BFF | 8080 |
| AUTH_REQUIRED | Enables auth middleware checks | false |
| AUTH_TOKEN | Expected bearer token when auth is enabled | none |
| APPLICATION_SERVICE_URL | Base URL for ApplicationService | http://application-service:80 |
| CANDIDATE_SERVICE_URL | Base URL for CandidateService | http://candidate-service:80 |
| JOB_SERVICE_URL | Base URL for JobService | http://job-service:80 |

### How to Run Locally
```bash
# 1) Move into the BFF directory
cd backend/src/gateway/BFF

# 2) Install dependencies
npm install

# 3) Start the BFF
npm start
```

The gateway will listen on:
- http://localhost:8080

```bash
# Docker run example
docker build -t bff:local -f backend/src/gateway/BFF/Dockerfile .
docker run --rm -p 8080:8080 -e AUTH_REQUIRED=false bff:local
```
