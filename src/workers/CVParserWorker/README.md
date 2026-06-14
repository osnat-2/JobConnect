# CVParserWorker

Responsibilities:
- Consume new application events
- Parse uploaded CVs and extract structured data
- Store parsed results in CandidateService or a shared DB

Suggested tech: Python (for NLP) or Node.js

Run (example):
- Implement as a worker connected to the message broker
