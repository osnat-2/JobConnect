# NotificationWorker

Overview:
- Background worker that consumes notification events from RabbitMQ and sends email or push notifications.
- Handles retry and backoff for delivery failures.
- Operates asynchronously and does not expose a public HTTP API.

Runtime:
- Uses Python and `pika` to connect to RabbitMQ.
- Can use email provider SDKs or SMTP libraries for message delivery.
- Should emit delivery success or failure events back to RabbitMQ.

Configuration:
- Requires RabbitMQ connection details.
- Requires notification provider credentials or SMTP configuration via environment variables.
- Use secrets for provider API keys and credentials.

Build and run:
- Install dependencies: `pip install -r requirements.txt`
- Run: `python worker.py`
- Docker build: `docker build -t notification-worker .`

Notes:
- This directory contains a placeholder worker loop; implement real message consumption and delivery logic.
- Keep notification state in event-driven workflow rather than direct service database writes.
- Ensure delivered metrics and failure events are traceable via Correlation IDs when possible.
