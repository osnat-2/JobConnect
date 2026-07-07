# CVParserWorker - Python worker
FROM python:3.11-slim
WORKDIR /app
COPY src/workers/CVParserWorker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY src/workers/CVParserWorker/ ./
COPY shared/python/ ./shared/
CMD ["python","worker.py"]
