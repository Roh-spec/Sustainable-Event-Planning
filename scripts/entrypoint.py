"""Docker container entrypoint script for the FastAPI backend.
Handles database connection readiness, runs migrations, and launches uvicorn.
"""
import socket
import subprocess
import sys
import time


def wait_for_database(host: str = "db", port: int = 5432, timeout_seconds: int = 60) -> None:
    """Poll database socket until ready or timeout."""
    print(f"Waiting for database connection at {host}:{port}...")
    start_time = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=2):
                print(f"Database connection established ({host}:{port}).")
                return
        except Exception:
            if time.time() - start_time > timeout_seconds:
                print(f"Timed out waiting for database after {timeout_seconds}s.", file=sys.stderr)
                sys.exit(1)
            time.sleep(1)


def run_migrations() -> None:
    """Run Alembic database schema migrations."""
    print("Applying database migrations (alembic upgrade head)...")
    subprocess.run(["alembic", "upgrade", "head"], check=True)


def start_server() -> None:
    """Launch the FastAPI uvicorn development server."""
    print("Starting FastAPI development server on port 8000...")
    subprocess.run(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "backend.app.main:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
            "--reload",
        ],
        check=True,
    )


if __name__ == "__main__":
    wait_for_database()
    run_migrations()
    start_server()
