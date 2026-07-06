# CVParserWorker - Python worker
FROM python:3.11-slim
WORKDIR /app
COPY CVParserWorker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY CVParserWorker/ ./
COPY shared/ ./shared/
CMD ["python","worker.py"]
