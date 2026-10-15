# Backend Architecture & Request Flow (Phase 1)

## Architecture Overview
The system follows a **Modular Monolith** pattern built with **FastAPI**, **SQLAlchemy 2.x**, and **PostgreSQL**.

The design enforces strict layer decoupling:
1. **API Layer (`backend/app/api/`)**: HTTP endpoints, input serialization, status codes, and error formatting.
2. **Service Layer (`backend/app/services/`)**: Business transaction boundaries, persistence coordination, and validation orchestration.
3. **Data Model Layer (`backend/app/models/`)**: Declarative SQLAlchemy models representing relational database tables and foreign key constraints.
4. **Schemas Layer (`backend/app/schemas/`)**: Pydantic models for validation and serialization (DTOs).

---

## Phase 1 Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / HTTP Client
    participant Router as FastAPI Router (events.py)
    participant Dep as Dependency (get_db)
    participant Service as EventService (event_service.py)
    participant Model as SQLAlchemy Event Model
    participant DB as PostgreSQL Database

    Client->>Router: POST /api/v1/events (JSON body)
    Router->>Router: Validate payload against EventCreate schema
    alt Invalid Input (e.g. attendees <= 0)
        Router-->>Client: 422 Unprocessable Entity
    else Valid Input
        Router->>Dep: Request DB session
        Dep-->>Router: Active Session
        Router->>Service: create_event(db, event_data)
        Service->>Model: Instantiate Event & optional Budget
        Service->>DB: Add, Commit & Refresh
        DB-->>Service: Persisted Event entity (with ID)
        Service-->>Router: Event entity
        Router-->>Client: 201 Created (EventResponse JSON)
    end
```

---

## Retrieval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / HTTP Client
    participant Router as FastAPI Router (events.py)
    participant Service as EventService (event_service.py)
    participant DB as PostgreSQL Database

    Client->>Router: GET /api/v1/events/{event_id}
    Router->>Service: get_event(db, event_id)
    Service->>DB: SELECT FROM events WHERE id = :event_id
    alt Not Found
        DB-->>Service: None
        Service-->>Router: None
        Router-->>Client: 404 Not Found
    else Found
        DB-->>Service: Event entity
        Service-->>Router: Event entity
        Router-->>Client: 200 OK (EventResponse JSON)
    end
```

---

## Future Planning Request Flow (Target)

When future domain modules (Food, Waste, Water, etc.) are implemented, they will seamlessly plug into this flow:

```
API Route (planning.py)
      ↓
Planning Service (plan_service.py)
      ↓
Planning Orchestrator (planner.py)
      ↓
Domain Planning Modules (Food, Waste, Water, Energy, Transport, Venue, Carbon)
      ↓
Cost / Constraint / Assumption Engines
      ↓
Sustainability Engine
      ↓
Plan Generation & Database Persistence
```
