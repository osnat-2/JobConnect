# BFF (Backend For Frontend)

Role:
- Authentication (JWT), aggregation endpoints (e.g., Kanban aggregation), request composition

Tech options:
- YARP (recommended for .NET shops) or Node.js (Express) as a lightweight BFF

Quick Node.js example (implemented in this folder):
- `index.js` is a simple Express app that can call downstream services and aggregate responses.
- Build with `docker build -t bff:local .`
