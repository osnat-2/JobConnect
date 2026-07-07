# NotificationWorker - Python worker
FROM python:3.11-slim
WORKDIR /app
COPY src/workers/NotificationWorker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY src/workers/NotificationWorker/ ./
COPY shared/python/ ./shared/
CMD ["python","worker.py"]
