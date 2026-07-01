import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from io import BytesIO, StringIO
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import aiohttp
import pika
from docx import Document
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams
from pika.adapters.asyncio_connection import AsyncioConnection
from pika.exchange_type import ExchangeType


class TransientWorkerError(Exception):
    pass


class PermanentWorkerError(Exception):
    pass


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "worker": "cv-parser",
        }

        extras = getattr(record, "extra", {})
        if isinstance(extras, dict):
            payload.update(extras)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


logger = logging.getLogger("cv-parser-worker")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger.addHandler(handler)


def current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_correlation_id(raw_id: Any) -> str:
    if raw_id is None:
        return str(uuid.uuid4())

    raw = str(raw_id).strip()
    return raw if raw else str(uuid.uuid4())


def infer_file_type(storage_url: str, file_type: Optional[str]) -> str:
    if file_type:
        return file_type.strip().lower()

    parsed = urlparse(storage_url or "")
    path = parsed.path or storage_url
    if ".pdf" in path.lower():
        return "pdf"
    if ".docx" in path.lower():
        return "docx"
    if ".doc" in path.lower():
        return "doc"
    raise PermanentWorkerError("Unable to infer document file type from storage URL.")


def extract_skills_from_text(text: str) -> List[str]:
    keywords = [
        "python", "c#", "java", "javascript", "typescript", "sql", "nosql", "mongo", "mongodb",
        "postgres", "aws", "azure", "docker", "kubernetes", "react", "angular", "node", "html",
        "css", "git", "rest", "graphql", "microservices", "testing", "ci/cd", "devops", "machine learning",
    ]

    normalized = text.lower()
    found = [skill for skill in keywords if skill in normalized]
    return sorted(set(found))


def compute_match_score(job_requirements: List[Any], parsed_text: str) -> Dict[str, Any]:
    if not job_requirements or not parsed_text:
        return {"matchScore": 0.0, "matchedSkills": []}

    parsed_text_lower = parsed_text.lower()
    requirements = [str(item).strip() for item in job_requirements if str(item).strip()]
    if not requirements:
        return {"matchScore": 0.0, "matchedSkills": []}

    matched_skills = [requirement for requirement in requirements if requirement.lower() in parsed_text_lower]
    score = len(matched_skills) / len(requirements)
    return {
        "matchScore": round(score, 3),
        "matchedSkills": list(dict.fromkeys(matched_skills)),
    }


class CvParserWorker:
    def __init__(self) -> None:
        self.rabbitmq_host = os.getenv("RABBITMQ__HOST", "localhost")
        self.rabbitmq_port = int(os.getenv("RABBITMQ__PORT", "5672"))
        self.rabbitmq_user = os.getenv("RABBITMQ__USER", "guest")
        self.rabbitmq_password = os.getenv("RABBITMQ__PASSWORD", "guest")
        self.exchange_name = os.getenv("CVPARSER_EXCHANGE", "application-events")
        self.queue_name = os.getenv("CVPARSER_QUEUE", "cv-parser-queue")
        self.dlx_name = os.getenv("CVPARSER_DLX", "cv-parser-dlx")
        self.dlq_name = os.getenv("CVPARSER_DLQ", "cv-parser-dlq")
        self.connection: Optional[AsyncioConnection] = None
        self.channel: Optional[pika.channel.Channel] = None
        self.bindings_remaining = 0
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    def log(self, level: str, message: str, **kwargs: Any) -> None:
        logger.log(getattr(logging, level.upper(), logging.INFO), message, extra={"extra": kwargs})

    def start(self) -> None:
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        credentials = pika.PlainCredentials(self.rabbitmq_user, self.rabbitmq_password)
        parameters = pika.ConnectionParameters(
            host=self.rabbitmq_host,
            port=self.rabbitmq_port,
            credentials=credentials,
            heartbeat=60,
            blocked_connection_timeout=30,
        )

        self.log("info", "Starting CVParserWorker", rabbitmq_host=self.rabbitmq_host, rabbitmq_port=self.rabbitmq_port)

        try:
            self.connection = AsyncioConnection(
                parameters,
                on_open_callback=self.on_connection_open,
                on_open_error_callback=self.on_connection_error,
                on_close_callback=self.on_connection_closed,
                custom_ioloop=self.loop,
            )
            self.loop.run_forever()
        except KeyboardInterrupt:
            self.log("info", "Keyboard interrupt received, shutting down.")
        finally:
            self.stop()

    def stop(self) -> None:
        if self.connection and not self.connection.is_closed:
            self.connection.close()
        if self.loop and self.loop.is_running():
            self.loop.stop()

    def on_connection_open(self, _connection: pika.SelectConnection) -> None:
        self.log("info", "RabbitMQ connection opened.")
        self.connection.channel(on_open_callback=self.on_channel_open)

    def on_connection_error(self, _connection: pika.SelectConnection, exception: Exception) -> None:
        self.log("error", "Unable to open RabbitMQ connection.", error=str(exception))
        if self.loop and self.loop.is_running():
            self.loop.stop()

    def on_connection_closed(self, _connection: pika.SelectConnection, reason: Exception) -> None:
        self.log("warning", "RabbitMQ connection closed.", reason=str(reason))
        if self.loop and self.loop.is_running():
            self.loop.stop()

    def on_channel_open(self, channel: pika.channel.Channel) -> None:
        self.channel = channel
        self.log("info", "RabbitMQ channel opened.")
        self.channel.exchange_declare(
            exchange=self.exchange_name,
            exchange_type=ExchangeType.topic,
            durable=True,
            callback=self.on_exchange_declared,
        )

    def on_exchange_declared(self, _frame: Any) -> None:
        self.log("info", "Exchange declared.", exchange=self.exchange_name)
        queue_arguments = {
            "x-dead-letter-exchange": self.dlx_name,
            "x-dead-letter-routing-key": "cv-parser-dlq",
        }
        self.channel.queue_declare(
            queue=self.queue_name,
            durable=True,
            arguments=queue_arguments,
            callback=self.on_queue_declared,
        )

    def on_queue_declared(self, _method_frame: Any) -> None:
        self.log("info", "Queue declared.", queue=self.queue_name)
        routing_keys = ["DocumentUploaded", "MatchingRequested"]
        self.bindings_remaining = len(routing_keys)
        for routing_key in routing_keys:
            self.channel.queue_bind(
                queue=self.queue_name,
                exchange=self.exchange_name,
                routing_key=routing_key,
                callback=self.on_bind_ok,
            )

        self.channel.exchange_declare(
            exchange=self.dlx_name,
            exchange_type=ExchangeType.fanout,
            durable=True,
            callback=self.on_dlx_declared,
        )

    def on_dlx_declared(self, _frame: Any) -> None:
        self.channel.queue_declare(
            queue=self.dlq_name,
            durable=True,
            callback=self.on_dlq_declared,
        )

    def on_dlq_declared(self, _frame: Any) -> None:
        self.channel.queue_bind(
            queue=self.dlq_name,
            exchange=self.dlx_name,
            routing_key="cv-parser-dlq",
            callback=lambda _frame: self.log("info", "DLQ is ready.", dlq=self.dlq_name),
        )

    def on_bind_ok(self, _frame: Any) -> None:
        self.bindings_remaining -= 1
        if self.bindings_remaining == 0 and self.channel:
            self.log("info", "All routing keys bound. Starting consumer.")
            self.channel.basic_qos(prefetch_count=1)
            self.channel.basic_consume(queue=self.queue_name, on_message_callback=self.on_message)

    def on_message(
        self,
        channel: pika.channel.Channel,
        method: pika.spec.Basic.Deliver,
        properties: pika.spec.BasicProperties,
        body: bytes,
    ) -> None:
        correlation_id = self.extract_correlation_id(properties)
        self.log(
            "info",
            "Message received.",
            routing_key=method.routing_key,
            delivery_tag=method.delivery_tag,
            correlation_id=correlation_id,
            redelivered=method.redelivered,
        )
        asyncio.create_task(self.process_message(channel, method, properties, body, correlation_id))

    async def process_message(
        self,
        channel: pika.channel.Channel,
        method: pika.spec.Basic.Deliver,
        properties: pika.spec.BasicProperties,
        body: bytes,
        correlation_id: str,
    ) -> None:
        payload: Dict[str, Any] = {}
        try:
            payload = json.loads(body.decode("utf-8"))
            event_name = method.routing_key or str(payload.get("eventName", ""))
            if event_name == "DocumentUploaded":
                await self.handle_document_uploaded(payload, correlation_id)
            elif event_name == "MatchingRequested":
                await self.handle_matching_requested(payload, correlation_id)
            else:
                raise PermanentWorkerError(f"Unsupported event type: {event_name}")

            channel.basic_ack(delivery_tag=method.delivery_tag)
            self.log("info", "Message processed and acknowledged.", event_name=event_name, correlation_id=correlation_id)
        except TransientWorkerError as exc:
            self.log("warning", "Transient processing error.", error=str(exc), correlation_id=correlation_id)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        except PermanentWorkerError as exc:
            self.log("error", "Permanent processing error.", error=str(exc), correlation_id=correlation_id)
            self.publish_failure_event(payload if isinstance(payload, dict) else {}, str(exc), correlation_id)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception as exc:
            self.log("error", "Unhandled processing failure.", error=str(exc), correlation_id=correlation_id, exc_info=True)
            if method.redelivered:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            else:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    async def handle_document_uploaded(self, payload: Dict[str, Any], correlation_id: str) -> None:
        document_id = str(payload.get("documentId", "") or "")
        candidate_id = str(payload.get("candidateId", "") or "")
        storage_url = str(payload.get("storageUrl", "") or "")
        file_type = str(payload.get("fileType", "") or "")

        if not document_id or not candidate_id or not storage_url:
            raise PermanentWorkerError("DocumentUploaded event missing required fields.")

        source_bytes = await self.download_document(storage_url)
        extracted_text = self.extract_text(source_bytes, storage_url, file_type)
        extracted_skills = extract_skills_from_text(extracted_text)

        event_payload = {
            "documentId": document_id,
            "candidateId": candidate_id,
            "parsedText": extracted_text,
            "extractedSkills": extracted_skills,
            "parsedAt": current_timestamp(),
        }
        self.publish_event("DocumentParsed", event_payload, correlation_id)

    async def handle_matching_requested(self, payload: Dict[str, Any], correlation_id: str) -> None:
        application_id = str(payload.get("applicationId", "") or "")
        candidate_id = str(payload.get("candidateId", "") or "")
        job_requirements = payload.get("jobRequirements") or []
        parsed_text = str(payload.get("parsedText", "") or payload.get("candidateText", "") or "")

        if not application_id or not candidate_id:
            raise PermanentWorkerError("MatchingRequested event missing required identifiers.")

        if not parsed_text:
            raise PermanentWorkerError("MatchingRequested event missing parsedText or candidateText.")

        score_payload = compute_match_score(job_requirements, parsed_text)
        matched_payload = {
            "applicationId": application_id,
            "candidateId": candidate_id,
            "matchScore": score_payload["matchScore"],
            "matchedSkills": score_payload["matchedSkills"],
        }
        self.publish_event("CandidateMatched", matched_payload, correlation_id)

    def extract_text(self, source_bytes: bytes, storage_url: str, file_type: str) -> str:
        effective_type = infer_file_type(storage_url, file_type)
        if effective_type == "pdf":
            return self.extract_text_from_pdf(source_bytes)
        if effective_type == "docx":
            return self.extract_text_from_docx(source_bytes)
        raise PermanentWorkerError(f"Unsupported document format: {effective_type}")

    @staticmethod
    def extract_text_from_pdf(source_bytes: bytes) -> str:
        output = StringIO()
        try:
            extract_text_to_fp(BytesIO(source_bytes), output, laparams=LAParams())
            return output.getvalue().strip()
        except Exception as exc:
            raise PermanentWorkerError(f"PDF parsing failed: {exc}") from exc

    @staticmethod
    def extract_text_from_docx(source_bytes: bytes) -> str:
        try:
            document = Document(BytesIO(source_bytes))
            paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
            return "\n".join(paragraphs)
        except Exception as exc:
            raise PermanentWorkerError(f"DOCX parsing failed: {exc}") from exc

    async def download_document(self, storage_url: str) -> bytes:
        parsed_url = urlparse(storage_url)
        if parsed_url.scheme in ("http", "https"):
            return await self.download_http_document(storage_url)

        if parsed_url.scheme == "file":
            local_path = parsed_url.path
        else:
            local_path = storage_url

        if os.path.exists(local_path):
            return await self.load_local_document(local_path)

        raise TransientWorkerError(f"Unable to retrieve document from storage URL: {storage_url}")

    async def load_local_document(self, path: str) -> bytes:
        try:
            with open(path, "rb") as file:
                return file.read()
        except FileNotFoundError as exc:
            raise TransientWorkerError(f"Local document not found: {path}") from exc
        except PermissionError as exc:
            raise PermanentWorkerError(f"Access denied to local document: {path}") from exc
        except Exception as exc:
            raise TransientWorkerError(f"Local document read failed: {exc}") from exc

    async def download_http_document(self, url: str) -> bytes:
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            try:
                async with session.get(url) as response:
                    response.raise_for_status()
                    return await response.read()
            except aiohttp.ClientResponseError as exc:
                raise TransientWorkerError(f"Failed to fetch document: {exc.status} {exc.message}") from exc
            except aiohttp.ClientError as exc:
                raise TransientWorkerError(f"HTTP connection failed: {exc}") from exc
            except asyncio.TimeoutError as exc:
                raise TransientWorkerError(f"Document download timed out: {exc}") from exc

    def publish_event(self, event_name: str, payload: Dict[str, Any], correlation_id: str) -> None:
        if not self.channel or self.channel.is_closed:
            raise RuntimeError("RabbitMQ channel is not open.")

        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        properties = pika.BasicProperties(
            content_type="application/json",
            delivery_mode=2,
            headers={"X-Correlation-ID": correlation_id},
        )
        self.channel.basic_publish(
            exchange=self.exchange_name,
            routing_key=event_name,
            body=body,
            properties=properties,
        )
        self.log("info", "Published event.", event_name=event_name, correlation_id=correlation_id)

    def publish_failure_event(self, payload: Dict[str, Any], error_reason: str, correlation_id: str) -> None:
        event_payload = {
            "documentId": payload.get("documentId"),
            "candidateId": payload.get("candidateId"),
            "errorReason": error_reason,
            "retryable": False,
            "failedAt": current_timestamp(),
        }

        if not self.channel or self.channel.is_closed:
            self.log("warning", "Unable to publish failure event because RabbitMQ channel is unavailable.", correlation_id=correlation_id)
            return

        self.publish_event("DocumentParsingFailed", event_payload, correlation_id)

    @staticmethod
    def extract_correlation_id(properties: pika.spec.BasicProperties) -> str:
        headers = getattr(properties, "headers", {}) or {}
        raw_id = headers.get("X-Correlation-ID") or headers.get("x-correlation-id")
        return normalize_correlation_id(raw_id)


if __name__ == "__main__":
    CvParserWorker().start()
