# CVParserWorker

## 📝 Description
CVParserWorker is a Python background worker that processes uploaded CV documents and extracts structured information for candidate matching and enrichment. It consumes RabbitMQ events, parses document content, and emits downstream events for the rest of the ATS workflow.

## 🛠️ Tech Stack & Key Dependencies
- **Runtime/Framework:** Python 3.11+
- **Primary Libraries:** aiohttp, pika, pdfminer.six, python-docx, pytest

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
| CVPARSER_EXCHANGE | Exchange used for incoming/outgoing events | application-events |
| CVPARSER_QUEUE | Worker queue name | cv-parser-queue |
| CVPARSER_DLX | Dead-letter exchange | cv-parser-dlx |
| CVPARSER_DLQ | Dead-letter queue | cv-parser-dlq |

### How to Run Locally
```bash
# 1) Move into the worker directory
cd backend/src/workers/CVParserWorker

# 2) Install dependencies
pip install -r requirements.txt

# 3) Start the worker
python worker.py
```

```bash
# Docker build example
docker build -t cv-parser-worker:local -f backend/src/workers/CVParserWorker/Dockerfile .
```