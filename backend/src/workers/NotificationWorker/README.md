# NotificationWorker

## 📝 Description
NotificationWorker consumes application and interview events from RabbitMQ and delivers notifications such as email or other outbound messages. It is designed to work asynchronously and to publish delivery outcomes back into the event-driven workflow.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** Python 3.11+
- **Primary Libraries:** pika

## 🚀 Getting Started

### Prerequisites
- Python 3.11 or later
- pip
- RabbitMQ (or the repository Docker Compose stack)

### Environment Variables / Configuration
| Variable / Key | Description | Default Value |
| --- | --- | --- |
| RABBITMQ__HOST | RabbitMQ hostname | localhost |
| RABBITMQ__PORT | RabbitMQ port | 5672 |
| RABBITMQ__USER | RabbitMQ username | guest |
| RABBITMQ__PASSWORD | RabbitMQ password | guest |
| NOTIFICATION_EXCHANGE | Exchange for notification events | application-events |
| NOTIFICATION_QUEUE | Worker queue name | notification-queue |
| NOTIFICATION_DLX | Dead-letter exchange | notification-dlx |
| NOTIFICATION_DLQ | Dead-letter queue | notification-dlq |

### How to Run Locally
```bash
# 1) Move into the worker directory
cd backend/src/workers/NotificationWorker

# 2) Install dependencies
pip install -r requirements.txt

# 3) Start the worker
python worker.py
```

```bash
# Docker build example
docker build -t notification-worker:local -f backend/src/workers/NotificationWorker/Dockerfile .
```
