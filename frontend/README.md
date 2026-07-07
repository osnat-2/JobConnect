# Frontend

## 📝 Description
The Angular frontend provides the user-facing experience for JobConnect, including job browsing, candidate management, application tracking, and the interview workflow. It communicates with the BFF layer, which in turn routes requests to the underlying services.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** Angular 14 / TypeScript
- **Primary Libraries:** Angular Core, Angular Router, Angular Forms, RxJS, Zone.js, UUID

## 🚀 Getting Started

### Prerequisites
- Node.js 20 LTS or later
- npm
- Angular CLI (optional, but recommended)

### Environment Variables / Configuration
| Variable / Key | Description | Default Value |
| --- | --- | --- |
| apiUrl | Base URL for BFF API requests | http://localhost:8080/api |
| production | Enables production build mode | false |
| logLevel | Client-side logging level | debug |

### How to Run Locally
```bash
# 1) Move into the frontend directory
cd frontend

# 2) Install dependencies
npm install

# 3) Start the development server
npm start
```

The UI will be available at:
- http://localhost:4200

```bash
# Production build example
npm run build
```
