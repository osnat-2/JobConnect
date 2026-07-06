# NotificationWorker - Python worker
FROM python:3.11-slim
WORKDIR /app
COPY NotificationWorker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY NotificationWorker/ ./
COPY shared/ ./shared/
CMD ["python","worker.py"]
