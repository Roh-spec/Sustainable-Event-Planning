"""
Pytest configuration and fixtures.

NOTE ON DATABASE CONFIGURATION FOR TESTS:
- The production application (backend.app.core.database) is strictly configured for PostgreSQL.
- For isolated, zero-cost, and offline unit/integration test execution without requiring
  a running external PostgreSQL service, tests utilize an isolated in-memory SQLite
  database (via StaticPool) to instantiate the SQLAlchemy tables, populate test fixtures,
  and override the FastAPI `get_db` dependency.
- If an external PostgreSQL test database is available, set `TEST_DATABASE_URL` to point
  to it (e.g., postgresql://postgres:postgres@localhost:5432/test_events).
"""

import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db

# Use TEST_DATABASE_URL if provided, otherwise in-memory SQLite for test isolation
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")

connect_args = {"check_same_thread": False} if TEST_DATABASE_URL.startswith("sqlite") else {}
poolclass = StaticPool if TEST_DATABASE_URL.startswith("sqlite") else None

test_engine_kwargs = {"pool_pre_ping": True}
if poolclass:
    test_engine_kwargs["poolclass"] = poolclass
if connect_args:
    test_engine_kwargs["connect_args"] = connect_args

test_engine = create_engine(TEST_DATABASE_URL, **test_engine_kwargs)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Creates all database tables in the test database schema."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Yields a database session with transaction rollback per test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with overridden get_db dependency."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
