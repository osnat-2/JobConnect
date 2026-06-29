# CVParserWorker

Overview:
- Background worker that consumes application events from RabbitMQ and parses candidate CV documents.
- Extracts structured candidate metadata and forwards parsed results to CandidateService.
- Designed as an asynchronous worker process with no HTTP service interface.

Runtime:
- Uses Python and `pika` to connect to RabbitMQ.
- Parses CV content using `pdfminer.six` and `python-docx`.
- May call downstream HTTP endpoints or publish events after extraction.

Configuration:
- Requires RabbitMQ connection details via environment variables or host configuration.
- May require CandidateService endpoint configuration if writing parsed data over HTTP.
- Use a secrets store for any external parser credentials if added.

Build and run:
- Install dependencies: `pip install -r requirements.txt`
- Run: `python worker.py`
- Docker build: `docker build -t cv-parser-worker .`

Notes:
- This folder contains a placeholder worker loop; implement real message consumption and error handling.
- Add retry/backoff logic and publish failure events to RabbitMQ when parsing or delivery fails.
- Do not embed direct access to other service databases; use event messages or API calls.
