FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /workspace/backend/requirements.txt
RUN pip install --no-cache-dir -r /workspace/backend/requirements.txt

# Copy source tree
COPY . /workspace/

ENV PYTHONPATH=/workspace

EXPOSE 8000

# Wait for database, run database migrations, then start FastAPI
CMD ["sh", "-c", "python -c \"import time, socket;\nwhile True:\n    try:\n        with socket.create_connection(('db', 5432), timeout=2): break\n    except Exception:\n        time.sleep(1)\n\" && alembic upgrade head && python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"]
