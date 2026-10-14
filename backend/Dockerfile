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

# Copy application source tree
COPY . /workspace/

ENV PYTHONPATH=/workspace

EXPOSE 8000

# Wait for database, run migrations, and launch FastAPI
CMD ["python", "scripts/entrypoint.py"]
