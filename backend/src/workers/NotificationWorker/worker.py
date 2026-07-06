import json
import logging
import os
import smtplib
import sys
import uuid
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Dict, List, Optional

import pika

sys.path.append(str(Path(__file__).resolve().parent.parent))
from shared.worker_common import PermanentWorkerError, TransientWorkerError, create_logger


logger = create_logger("notification-worker")


class NotificationWorker:
    def __init__(self) -> None:
        self.rabbitmq_host = os.getenv("RABBITMQ__HOST", "localhost")
        self.rabbitmq_port = int(os.getenv("RABBITMQ__PORT", "5672"))
        self.rabbitmq_user = os.getenv("RABBITMQ__USER", "guest")
        self.rabbitmq_password = os.getenv("RABBITMQ__PASSWORD", "guest")
        self.exchange_name = os.getenv("NOTIFICATION_EXCHANGE", "application-events")
        self.queue_name = os.getenv("NOTIFICATION_QUEUE", "notification-queue")
        self.dlx_name = os.getenv("NOTIFICATION_DLX", "notification-dlx")
        self.dlq_name = os.getenv("NOTIFICATION_DLQ", "notification-dlq")
        self.smtp_host = os.getenv("SMTP__HOST")
        self.smtp_port = int(os.getenv("SMTP__PORT", "587"))
        self.smtp_user = os.getenv("SMTP__USER")
        self.smtp_password = os.getenv("SMTP__PASSWORD")
        self.smtp_from = os.getenv("SMTP__FROM", "no-reply@jobconnect.local")
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[pika.channel.Channel] = None

    def log(self, level: str, message: str, **kwargs: Any) -> None:
        logger.log(getattr(logging, level.upper(), logging.INFO), message, extra={"extra": kwargs})

    def start(self) -> None:
        credentials = pika.PlainCredentials(self.rabbitmq_user, self.rabbitmq_password)
        parameters = pika.ConnectionParameters(
            host=self.rabbitmq_host,
            port=self.rabbitmq_port,
            credentials=credentials,
            heartbeat=60,
            blocked_connection_timeout=30,
        )
        self.log("info", "Starting NotificationWorker", rabbitmq_host=self.rabbitmq_host, rabbitmq_port=self.rabbitmq_port)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.exchange_declare(exchange=self.exchange_name, exchange_type="topic", durable=True)
        self.channel.exchange_declare(exchange=self.dlx_name, exchange_type="fanout", durable=True)
        self.channel.queue_declare(
            queue=self.queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": self.dlx_name,
                "x-dead-letter-routing-key": self.dlq_name,
            },
        )
        self.channel.queue_declare(queue=self.dlq_name, durable=True)
        self.channel.queue_bind(queue=self.queue_name, exchange=self.exchange_name, routing_key="InterviewRequested")
        self.channel.queue_bind(queue=self.queue_name, exchange=self.exchange_name, routing_key="InterviewLockSuccess")
        self.channel.queue_bind(queue=self.queue_name, exchange=self.exchange_name, routing_key="InterviewLockFailed")
        self.channel.queue_bind(queue=self.queue_name, exchange=self.exchange_name, routing_key="NotificationRequested")
        self.channel.queue_bind(queue=self.dlq_name, exchange=self.dlx_name, routing_key=self.dlq_name)
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(queue=self.queue_name, on_message_callback=self.on_message, auto_ack=False)
        self.log("info", "Awaiting notification messages.")
        self.channel.start_consuming()

    def stop(self) -> None:
        if self.connection and not self.connection.is_closed:
            self.connection.close()

    def on_message(self, channel: pika.channel.Channel, method: pika.spec.Basic.Deliver, properties: pika.spec.BasicProperties, body: bytes) -> None:
        correlation_id = self.extract_correlation_id(properties)
        self.log(
            "info",
            "Message received.",
            routing_key=method.routing_key,
            delivery_tag=method.delivery_tag,
            correlation_id=correlation_id,
        )
        try:
            payload = self.parse_payload(body)
            event_name = method.routing_key or str(payload.get("eventName", "")).strip()
            notification = self.build_notification(event_name, payload)
            self.send_notification(notification, correlation_id)
            channel.basic_ack(delivery_tag=method.delivery_tag)
            self.publish_event("NotificationDelivered", {"eventName": event_name, "notification": notification}, correlation_id)
        except TransientWorkerError as exc:
            self.log("warning", "Transient processing error.", error=str(exc), correlation_id=correlation_id)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        except PermanentWorkerError as exc:
            self.log("error", "Permanent processing error.", error=str(exc), correlation_id=correlation_id)
            self.publish_failure_event(payload if isinstance(payload, dict) else {}, str(exc), correlation_id)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception as exc:
            self.log("error", "Unhandled processing failure.", error=str(exc), correlation_id=correlation_id, exc_info=True)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def parse_payload(self, body: bytes) -> Dict[str, Any]:
        if not body:
            return {}
        try:
            return json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise PermanentWorkerError("Message body is not valid JSON.") from exc

    def build_notification(self, event_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        event_name = (event_name or "").strip()
        recipients = self.extract_recipients(payload)
        if not recipients:
            raise PermanentWorkerError("Notification event missing required recipients.")

        if event_name == "InterviewLockSuccess":
            subject = "Interview confirmed"
            body = (
                f"Your interview for application {payload.get('applicationId', 'unknown')} has been confirmed. "
                f"Scheduled at {payload.get('scheduledAt', 'TBD')}."
            )
        elif event_name == "InterviewLockFailed":
            subject = "Interview slot unavailable"
            body = (
                f"The selected interview slot for application {payload.get('applicationId', 'unknown')} is no longer available. "
                "Please choose a new time."
            )
        elif event_name in {"InterviewRequested", "NotificationRequested"}:
            subject = "Notification"
            body = str(payload.get("message") or payload.get("body") or "You have a new notification.")
        else:
            subject = "JobConnect notification"
            body = json.dumps(payload, ensure_ascii=False)

        return {
            "eventName": event_name,
            "subject": subject,
            "recipients": recipients,
            "body": body,
            "payload": payload,
        }

    def extract_recipients(self, payload: Dict[str, Any]) -> List[str]:
        emails: List[str] = []
        for key in ("candidateEmail", "interviewerEmail", "email", "to"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                emails.append(value.strip())
            elif isinstance(value, list):
                emails.extend([str(item).strip() for item in value if str(item).strip()])
        return sorted(set(emails))

    def send_notification(self, notification: Dict[str, Any], correlation_id: str) -> None:
        if not self.smtp_host:
            self.log("info", "SMTP host not configured; simulating delivery.", correlation_id=correlation_id, recipients=notification["recipients"])
            return

        message = EmailMessage()
        message["From"] = self.smtp_from
        message["To"] = ", ".join(notification["recipients"])
        message["Subject"] = notification["subject"]
        message.set_content(notification["body"])

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as smtp:
                if self.smtp_user and self.smtp_password:
                    smtp.starttls()
                    smtp.login(self.smtp_user, self.smtp_password)
                smtp.send_message(message)
        except Exception as exc:
            raise TransientWorkerError(f"SMTP delivery failed: {exc}") from exc

    def publish_event(self, event_name: str, payload: Dict[str, Any], correlation_id: str) -> None:
        if not self.channel:
            return
        self.channel.basic_publish(
            exchange=self.exchange_name,
            routing_key=event_name,
            body=json.dumps({"eventName": event_name, **payload}).encode("utf-8"),
            properties=pika.BasicProperties(content_type="application/json", delivery_mode=2, correlation_id=correlation_id),
        )

    def publish_failure_event(self, payload: Dict[str, Any], error: str, correlation_id: str) -> None:
        self.publish_event("NotificationFailed", {"error": error, **payload}, correlation_id)

    def extract_correlation_id(self, properties: Optional[pika.spec.BasicProperties]) -> str:
        if properties and properties.correlation_id:
            return str(properties.correlation_id)
        return str(uuid.uuid4())


if __name__ == "__main__":
    worker = NotificationWorker()
    try:
        worker.start()
    except KeyboardInterrupt:
        worker.log("info", "Keyboard interrupt received; shutting down.")
    finally:
        worker.stop()
