import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any


class TransientWorkerError(Exception):
    pass


class PermanentWorkerError(Exception):
    pass


class JsonFormatter(logging.Formatter):
    def __init__(self, worker_name: str) -> None:
        super().__init__()
        self.worker_name = worker_name

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "worker": self.worker_name,
        }

        extras = getattr(record, "extra", {})
        if isinstance(extras, dict):
            payload.update(extras)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def create_logger(worker_name: str) -> logging.Logger:
    logger = logging.getLogger(worker_name)
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter(worker_name))
    logger.handlers = [handler]
    return logger


def normalize_correlation_id(raw_id: Any) -> str:
    if raw_id is None:
        return str(uuid.uuid4())

    raw = str(raw_id).strip()
    return raw if raw else str(uuid.uuid4())


def get_rabbitmq_config(prefix: str) -> dict[str, Any]:
    return {
        "host": os.getenv(f"{prefix}__HOST", "localhost"),
        "port": int(os.getenv(f"{prefix}__PORT", "5672")),
        "user": os.getenv(f"{prefix}__USER", "guest"),
        "password": os.getenv(f"{prefix}__PASSWORD", "guest"),
    }
