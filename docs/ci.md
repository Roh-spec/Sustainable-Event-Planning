# Continuous Integration (CI) Architecture & Operations Guide

This document describes the automated CI pipeline for **EcoPlan (Sustainable Event Planning)**, how each job functions, how to reproduce every check locally, how to diagnose failures, and how to maintain dependencies and bundle budgets.

---

## 1. CI Pipeline Architecture

The CI pipeline runs on GitHub Actions via [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It triggers on:
- Every `push` to `main`
- Every `pull_request` targeting `main`
- Manual invocation via `workflow_dispatch`

Path filters are intentionally omitted so required status checks evaluate on every commit.

```text
                                  ┌──────────────────────────────┐
                                  │         Event Trigger        │
                                  │  (push / PR / manual dispatch)│
                                  └──────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
             ┌─────────────────────┐                           ┌─────────────────────┐
             │       Backend       │                           │      Frontend       │
             │   (Python 3.11/12   │                           │      (Node 20       │
             │  + real PostgreSQL) │                           │  + Bundle Budgets)  │
             └──────────┬──────────┘                           └──────────┬──────────┘
                        │                                                 │
                        └────────────────────────┬────────────────────────┘
                                                 │ Both must pass
                                                 ▼
                                      ┌─────────────────────┐
                                      │    Compose smoke    │
                                      │  (Full Docker Stack │
                                      │   + Health Probes)  │
                                      └─────────────────────┘
```

### Required Status Checks
For branch protection rules on `main`, configure these three exact job names as required checks:
1. `Backend`
2. `Frontend`
3. `Compose smoke`

---

## 2. Jobs Overview

### Job 1: `Backend` (Matrix: Python 3.11, Python 3.12)
- **Goal:** Verify that deterministic planning algorithms, constraint engines, and database migrations function accurately across supported Python runtimes against real PostgreSQL.
- **Service Container:** Spins up `postgres:16-alpine` with an automated `pg_isready` health check.
- **Steps:**
  1. **Dependency Installation:** Upgrades `pip` and installs pinned dependencies from `backend/requirements-dev.txt` using GitHub Actions pip caching.
  2. **Test Suite Execution:** Runs `pytest tests -q` with `PYTHONPATH=.` (123 tests across domain calculators, assumption resolution, and cost models).
  3. **Database Migration Verification:** Runs `alembic upgrade head` with `DATABASE_URL` pointing to the real PostgreSQL container. Verifies schema creation (`001_initial_schema`) and baseline assumption data loading (`002_seed_baseline_assumptions`).
  4. **Assumption Seed Verification:** Queries the database using SQLAlchemy ORM to assert that the `assumptions` table contains seeded rows and fails if count is zero.
  5. **Live Health Probe:** Boots `uvicorn backend.app.main:app` in the background and executes a bounded retry loop (up to 30 attempts, 1s sleep) querying `GET /health`.

### Job 2: `Frontend` (Node 20)
- **Goal:** Enforce TypeScript correctness, UI test integrity, accessibility contrast compliance, production build stability, and bundle size budgets.
- **Steps:**
  1. **Clean Installation:** Executes `npm ci` against `frontend/package-lock.json` with npm caching.
  2. **TypeScript Type Check:** Runs `npx tsc --noEmit` under strict typing rules.
  3. **Unit & Integration Tests:** Runs `npm test` (`vitest run`, 104 tests) ensuring components and custom hooks behave as expected.
  4. **WCAG AA Contrast Audit:** Runs `npm run check:contrast` validating 33 text/background pairs across Palettes A, B, and C.
  5. **Production Build:** Runs `npm run build` (`tsc && vite build`).
  6. **Bundle Budget Enforcement:** Inspects `dist/assets/` to ensure the main JS bundle does not exceed `MAX_MAIN_JS_KB` (250 KB) and the main CSS does not exceed `MAX_CSS_KB` (70 KB).
  7. **Artifact Archival:** Uploads `frontend/dist/` with a 7-day retention period.

### Job 3: `Compose smoke` (Docker Compose)
- **Goal:** Verify cold-start container orchestration from clean volumes. Runs only after `Backend` and `Frontend` jobs pass (`needs: [backend, frontend]`).
- **Steps:**
  1. **Stack Launch:** Executes `docker compose up -d --build`.
  2. **Backend Startup Verification:** Polls `http://localhost:8000/health` with a bounded loop (up to 120 seconds).
  3. **Frontend Server Probe:** Verifies the frontend dev server is reachable at `http://localhost:5173`.
  4. **Failure Diagnostics:** Executes `docker compose logs` if any step fails.
  5. **Clean Teardown:** Executes `docker compose down -v` under an `always()` conditional to remove volumes and avoid disk leakage.

---

## 3. Running Checks Locally

Every command in CI can be run locally before opening a pull request.

### Backend Validation
```bash
# 1. Activate virtual environment
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate

# 2. Install pinned development dependencies
pip install -r backend/requirements-dev.txt

# 3. Run the test suite (123 tests)
# Windows PowerShell:
$env:PYTHONPATH="."
pytest tests -q

# Linux/macOS:
PYTHONPATH=. pytest tests -q
```

To test real PostgreSQL migrations locally:
```bash
# Start standalone PostgreSQL container
docker run -d --name local-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sustainable_events -p 5432:5432 postgres:16-alpine

# Run migrations
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sustainable_events alembic upgrade head

# Verify seeded assumptions
python -c "from backend.app.core.database import SessionLocal; from backend.app.models.assumption import Assumption; db = SessionLocal(); count = db.query(Assumption).count(); db.close(); print(f'Seeded: {count}'); assert count > 0"

# Stop and clean container
docker rm -f local-postgres
```

### Frontend Validation
```bash
cd frontend

# 1. Clean installation
npm ci

# 2. TypeScript compilation
npx tsc --noEmit

# 3. Vitest unit tests (104 tests)
npm test

# 4. WCAG AA contrast check
npm run check:contrast

# 5. Production build
npm run build
```

### Docker Compose Smoke Test
```bash
# Clean cold start with volume wipe
docker compose down -v
docker compose up -d --build

# Probe health endpoints
curl -f http://localhost:8000/health
curl -I http://localhost:5173

# Clean teardown
docker compose down -v
```

---

## 4. How to Read & Triage Failures

| Step Failing | Typical Cause | Resolution |
| :--- | :--- | :--- |
| **Backend: Run backend tests** | A regression in calculation logic, constraint rules, or model schemas. | Run `pytest tests/ -v -k "<failing_test_name>"` locally with `PYTHONPATH=.` to inspect diff. |
| **Backend: Run database migrations** | Migration script error or revision conflict. | Inspect the failed migration file in `database/migrations/versions/`. Test locally with `alembic upgrade head`. |
| **Backend: Verify baseline assumptions** | Migration 002 failed to insert rows. | Check `002_seed_baseline_assumptions.py` for syntax or parameter errors. |
| **Backend: Start FastAPI backend** | Port conflict or import error in `backend.app.main`. | Check uvicorn startup logs in the GitHub Actions step output. |
| **Frontend: Run TypeScript check** | Type mismatch, missing prop interface, or unhandled null/undefined. | Run `cd frontend && npx tsc --noEmit` to locate line numbers. |
| **Frontend: Run WCAG AA contrast check** | A color token or text/background pair failed the 4.5:1 ratio. | Run `npm run check:contrast` in `frontend/`. Check `src/styles/palettes.css` and use `-deep` variants for text. |
| **Frontend: Check bundle budgets** | New imports pushed main JS (> 250 KB) or CSS (> 70 KB). | Ensure new routes or heavy components use `React.lazy()`. Check bundle sizes with `npm run build`. |
| **Compose smoke: Wait for backend** | Container failed to start, port 8000 blocked, or DB connection failed. | Inspect the `Output container logs on failure` step output in GitHub Actions. |

---

## 5. Maintenance Procedures

### Updating Pinned Python Dependencies
1. Edit `backend/requirements.txt` (runtime packages only) or `backend/requirements-dev.txt` (test tools).
2. Install in a clean virtual environment and run the test suite:
   ```bash
   pip install -r backend/requirements-dev.txt
   pytest tests -q
   ```
3. Test that the Docker image builds:
   ```bash
   docker build -f backend/Dockerfile .
   ```

### Updating Node Dependencies
1. Update packages using npm in `frontend/`:
   ```bash
   cd frontend
   npm install <package>@<version>
   ```
2. Verify all checks pass:
   ```bash
   npm ci && npx tsc --noEmit && npm test && npm run build
   ```
3. Commit both `package.json` and `package-lock.json`.

### Adjusting Bundle Budgets
Bundle budgets are declared at the top of [`.github/workflows/ci.yml`](../.github/workflows/ci.yml):
```yaml
env:
  MAX_MAIN_JS_KB: 250
  MAX_CSS_KB: 70
```
If future features legitimately require adjusting these limits, update these environment variable thresholds in `ci.yml` and document the rationale in PR notes.

---

## 6. Architecture & Design Decisions

- **D001: Pinned Dependencies Separation (`requirements.txt` vs. `requirements-dev.txt`)**
  Separated runtime packages (`fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `psycopg[binary]`, `alembic`) from test tools (`pytest`, `httpx`). Docker production images build using `requirements.txt` only, reducing image size and attack surface, while CI and local development use `requirements-dev.txt`.
- **D002: Single PostgreSQL Driver Selection (`psycopg[binary]`)**
  Identified that SQLAlchemy 2.x defaults to `psycopg` (psycopg 3) for `postgresql://` connection strings. Removed redundant `psycopg2-binary` to avoid binary driver bloat and compilation overhead on Alpine images.
- **D003: Upgrade Frontend Base Image to `node:20-alpine`**
  Upgraded `frontend/Dockerfile` from deprecated `node:18-alpine` to `node:20-alpine` (Active LTS). Preserved exact configuration and port mappings.
- **D004: Disproven / Resolved Seed Mount Collision**
  Proved through local volume wipe tests that mounting `./database/seed:/docker-entrypoint-initdb.d` in `docker-compose.yml` caused Postgres container crashes on cold start (`relation "assumptions" does not exist`, exit code 3). Removed this mount line from `docker-compose.yml` because Alembic migration `002_seed_baseline_assumptions.py` already seeds baseline assumptions cleanly.
- **D005: Job Display Names**
  Standardized exact display names (`Backend`, `Frontend`, `Compose smoke`) to provide predictable, permanent status check names for GitHub repository branch rulesets.
- **D006: Real PostgreSQL Service in Backend CI**
  Instead of relying solely on SQLite for CI, configured a dedicated `postgres:16-alpine` service container to validate actual Alembic PostgreSQL migration DDL and ORM seed queries on both Python 3.11 and 3.12.
- **D007: Automated Dependabot Grouping**
  Configured `.github/dependabot.yml` with weekly scans for pip, npm, GitHub Actions, and Docker base images. Grouped minor and patch updates together and capped open PRs at 5 per ecosystem to prevent notification fatigue.
