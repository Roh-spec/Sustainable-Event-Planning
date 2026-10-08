# Database Architecture & Design (Phase 1)

## Overview
The **AI-Based Sustainable Event Planning Assistant** uses **PostgreSQL** as its relational database. The schema is constructed using **SQLAlchemy 2.x** declarative models with strict type annotations (`Mapped`, `mapped_column`).

To ensure precision and financial transparency, all monetary and cost fields utilize `Numeric(12, 2)` (never floating-point numbers). In accordance with project principles, redundant timestamp fields (`created_at`, `updated_at`) are intentionally omitted to maintain a lean, purpose-driven schema.

---

## Entity Relational Hierarchy

```
                    ┌────────────────────────┐
                    │         Event          │
                    │  (Core Event Details)  │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼────────────────────────┬─────────────────────┐
        │ 1:1                   │ 1:N                    │ 1:N                 │ 1:N
        ▼                       ▼                        ▼                     ▼
┌──────────────┐        ┌──────────────┐        ┌────────────────┐     ┌──────────────┐
│    Budget    │        │  CostItem    │        │   Constraint   │     │  Assumption  │
│  (Financial  │        │  (Provenance │        │  (Enforcement  │     │ (Heuristics &│
│  Constraint) │        │  & Pricing)  │        │    Levels)     │     │ Provenance)  │
└──────────────┘        └──────────────┘        └────────────────┘     └──────────────┘
                                │
                                │ 1:N
                                ▼
                        ┌──────────────┐
                        │     Plan     │
                        │(Alternatives │
                        │  & Outcomes) │
                        └──────────────┘
```

---

## Entities & Field Specifications

### 1. `Event` (`events`)
- **`id`**: `Integer`, Primary Key, autoincrementing index.
- **`name`**: `String(255)`, non-nullable. Title of the event.
- **`event_type`**: `String(50)`, non-nullable, indexed. Supports `TECH_FEST`, `CULTURAL_FEST`, `HACKATHON`, `WORKSHOP`, `CONFERENCE`, `SPORTS_EVENT`, `FAREWELL`, `DEPARTMENT_EVENT`, and `OTHER`.
- **`expected_attendees`**: `Integer`, non-nullable (> 0).
- **`duration_days`**: `Integer`, non-nullable (> 0).
- **`location`**: `String(255)`, nullable. Campus venue or location descriptor.
- **Relationships**:
  - `budget`: 1-to-1 relationship with `Budget` (`uselist=False`, cascade delete).
  - `cost_items`: 1-to-N relationship with `CostItem` (cascade delete).
  - `constraints`: 1-to-N relationship with `Constraint` (cascade delete).
  - `assumptions`: 1-to-N relationship with `Assumption` (cascade delete).
  - `plans`: 1-to-N relationship with `Plan` (cascade delete).

### 2. `Budget` (`budgets`)
- **`id`**: `Integer`, Primary Key.
- **`event_id`**: `Integer`, Foreign Key referencing `events.id`, unique index, non-nullable.
- **`total_budget`**: `Numeric(12, 2)`, non-nullable (>= 0).
- **`currency`**: `String(10)`, non-nullable, default `"INR"`.
- **`status`**: `String(50)`, nullable (e.g. `"APPROVED"`, `"DRAFT"`).

### 3. `CostItem` (`cost_items`)
- **`id`**: `Integer`, Primary Key.
- **`event_id`**: `Integer`, Foreign Key referencing `events.id`, indexed, non-nullable.
- **`category`**: `String(100)`, indexed, non-nullable (e.g., `FOOD`, `VENUE`, `WASTE`).
- **`name`**: `String(255)`, non-nullable.
- **`description`**: `Text`, nullable.
- **`amount`**: `Numeric(12, 2)`, non-nullable.
- **`pricing_unit`**: `String(50)`, non-nullable (`PER_PERSON`, `TOTAL`).
- **`quantity`**: `Numeric(10, 2)`, non-nullable, default `1.00`.
- **`source_type`**: `String(50)`, indexed, non-nullable.
- **`source_reference`**: `String(255)`, nullable.

### 4. `Constraint` (`constraints`)
- **`id`**: `Integer`, Primary Key.
- **`event_id`**: `Integer`, Foreign Key referencing `events.id`, indexed, non-nullable.
- **`category`**: `String(100)`, indexed, non-nullable.
- **`description`**: `Text`, non-nullable.
- **`constraint_type`**: `String(50)`, indexed, non-nullable. Values:
  - `REQUIRED`: Hard constraint that must be satisfied.
  - `PREFERRED`: Soft constraint targeted during optimization.
  - `NOT_ALLOWED`: Prohibited item or practice (e.g., single-use plastics).
  - `FLEXIBLE`: Elastic preference that can adapt to budget or green targets.
- **`value`**: `String(255)`, nullable.

### 5. `Assumption` (`assumptions`)
- **`id`**: `Integer`, Primary Key.
- **`event_id`**: `Integer`, Foreign Key referencing `events.id`, indexed, nullable.
  - When `event_id IS NULL`: Represents a **Global Assumption** (baseline default across all events).
  - When `event_id` is populated: Represents an **Event-Specific Assumption** (overrides the global baseline for that event).
- **`category`**: `String(100)`, indexed, non-nullable.
- **`parameter`**: `String(100)`, indexed, non-nullable.
- **`value`**: `String(100)`, non-nullable.
- **`unit`**: `String(50)`, non-nullable (e.g., `litres/person/day`, `grams/meal`).
- **`source_type`**: `String(50)`, indexed, non-nullable.
- **`description`**: `Text`, nullable.
- **`confidence`**: `Numeric(5, 2)`, nullable. Rating from `0.00` to `1.00`.
- **`reference_notes`**: `Text`, nullable.

---

## Global vs. Event-Specific Scoping & Resolution Priority

The assumption architecture distinguishes between two scope levels:
1. **Global Assumptions (`event_id IS NULL`)**: Default baseline guidelines (e.g. `water_per_person_per_day = 5`).
2. **Event-Specific Assumptions (`event_id = :event_id`)**: Explicit organizer or context overrides for a specific event (e.g. `water_per_person_per_day = 4`).

### Resolution Priority Flow
When an assumption is requested for an event context:
$$\text{EVENT-SPECIFIC} \longrightarrow \text{GLOBAL} \longrightarrow \text{MISSING (Explicit)}$$

- **Event-Specific Precedence**: If an assumption exists for the target `event_id`, it is returned with `scope = EVENT`.
- **Global Fallback**: If no event-specific record exists, the global default is returned with `scope = GLOBAL`.
- **Missing State**: If neither exists, the engine returns an unresolved result (`is_resolved = False`). It **never** silently invents or assumes a default value.

---

## Explanation of Source Types & Provenance

To fulfill the core requirement that **the planning system is explainable, audit-ready, and transparent**, data values must retain their provenance:

| Source Type | Meaning & Role | Overwrite Rules |
| :--- | :--- | :--- |
| `USER_PROVIDED` | Explicitly entered or overridden by the organizer. Highest precedence. | Never overwritten by heuristics or models. |
| `ESTIMATED` | Deterministically derived by planning engine calculators and heuristics. | Distinct from baseline assumptions. |
| `REFERENCE` | Empirical benchmarks from verified college event records, research, or guidelines. | Read-only reference standards. |
| `ACTUAL` | Realized post-event quantities recorded for auditing and continuous learning. | Never converted to an assumption. |
| `ML_PREDICTED` | Statistical predictions (e.g., scikit-learn models). Kept clearly distinct from deterministic rules. | Never confused with deterministic rules. |

Values of different source types never silently overwrite each other. An assumption is **not** an actual measurement.

---

### 6. `Plan` (`plans`)
- **`id`**: `Integer`, Primary Key.
- **`event_id`**: `Integer`, Foreign Key referencing `events.id`, indexed, non-nullable.
- **`name`**: `String(255)`, non-nullable.
- **`planning_mode`**: `String(50)`, indexed, non-nullable (`BALANCED`, `BUDGET_FOCUSED`, `SUSTAINABILITY_FOCUSED`, `CUSTOM`).
- **`status`**: `String(50)`, non-nullable, default `"GENERATED"`.
- **`total_estimated_cost`**: `Numeric(12, 2)`, nullable.
- **`sustainability_score`**: `Numeric(5, 2)`, nullable (placeholder for composite green index).
- **`explanation`**: `Text`, nullable. Summarizes trade-offs.
- **`is_selected`**: `Boolean`, default `False`. Tracks final chosen plan.

---

## Database Migrations (Alembic)

Alembic is configured in `alembic.ini` and `database/migrations/`.

### Migration Commands
1. **Generate a migration revision**:
   ```bash
   alembic revision --autogenerate -m "create_initial_schema"
   ```
2. **Apply migrations**:
   ```bash
   alembic upgrade head
   ```
3. **Rollback migration**:
   ```bash
   alembic downgrade -1
   ```

### PostgreSQL Connection & Local Development
Configure `DATABASE_URL` in `.env` (or via environment variables):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sustainable_events
ENVIRONMENT=development
SECRET_KEY=change_this_to_a_secure_random_key_in_production
```

---

## 🛠️ Local PostgreSQL Setup Guide

### 1. How to Start PostgreSQL with Docker
Reuse the existing `db` service configured in `docker-compose.yml`:
```bash
docker compose up -d db
```
This spins up PostgreSQL 16 on port `5432` with database `sustainable_events`.

### 2. How to Run Migrations
Apply the initial schema migration using Alembic:
```bash
.venv\Scripts\alembic -c alembic.ini upgrade head
```

### 3. How to Start FastAPI
Launch the backend server:
```bash
.venv\Scripts\uvicorn backend.app.main:app --reload --port 8000
```
Verify the API:
- Health check: `http://localhost:8000/health`
- Interactive Swagger docs: `http://localhost:8000/docs`

### 4. How to Stop PostgreSQL
Stop the container when finished:
```bash
docker compose stop db
```
To shut down and preserve data:
```bash
docker compose down
```

### 5. Environment Variable Configuration
Copy `.env.example` to `.env` (or export in shell):
```bash
# Minimal required variables
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sustainable_events
ENVIRONMENT=development
SECRET_KEY=dev_secret_key_placeholder
```
