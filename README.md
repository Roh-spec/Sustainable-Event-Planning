# EcoPlan: Sustainable Event Planning Assistant

[![CI](https://github.com/Roh-spec/Sustainable-Event-Planning/actions/workflows/ci.yml/badge.svg)](https://github.com/Roh-spec/Sustainable-Event-Planning/actions/workflows/ci.yml)

Plan a college event that wastes less, costs what you can afford, and shows its working.

EcoPlan walks an organiser through seven steps, from event details to a printable run-of-show. It estimates food surplus and single-use waste, compares three plan alternatives, and explains every number it produces. It is built from open-source tools only, so the initial software cost is ₹0.

<!-- Add screenshots to docs/images/ and reference them here, for example: ![Plan comparison](docs/images/plan-comparison.png) -->

---

## Why EcoPlan is different

- **Physical units, never invented scores.** Results are kilograms, item counts and rupees. There is no "87/100 eco score".
- **It never silently invents a value.** Every number is traced to its source: `USER_PROVIDED`, `REFERENCE`, `ASSUMED`, `ACTUAL` or `ML_PREDICTED`. If a value is missing, the engine says so.
- **Honest trade-offs.** Three alternatives (*Cost-First Ledger*, *Pragmatic Balance*, *Maximum Circularity*) show what you gain and what you pay.
- **Deterministic core.** Planning, costing and constraint checks run without any external AI service. AI and ML are optional future add-ons.
- **Honest deficits.** If your budget can't cover a plan, EcoPlan states the shortfall instead of hiding it.

---

## What works today

| Area | Status |
| --- | --- |
| Event setup, budget and constraints | Implemented |
| Assumption engine (event-specific → global → missing) | Implemented |
| Food planning (servings, cost, surplus, dietary split) | Implemented |
| Waste planning (packaging, plastic, food and other waste) | Implemented |
| Cost engine and constraint engine | Implemented |
| Plan alternatives and side-by-side comparison | Implemented |
| Complete plan: timetable, checklist, resource manifest, budget ledger | Implemented |
| 7-step React wizard and printable day sheet | Implemented |
| Water, energy, materials, transport, venue, vendors, carbon | Scaffolded, not yet implemented |
| Reports/export, optimisation, AI/ML helpers, maps | Scaffolded, not yet implemented |

---

## How it works

```text
Event details → Budget & constraints → Food → Waste → Plan alternatives → Complete plan
```

```text
React wizard
   │  JSON over /api/v1
   ▼
FastAPI routes ──► Services ──► Orchestrator
                                   ├── Assumption engine   (resolves every parameter, keeps provenance)
                                   ├── Food module         (pure calculator + rules engine)
                                   ├── Waste module        (pure calculator + rules engine)
                                   ├── Cost engine
                                   ├── Constraint engine
                                   └── Scheduling module   (timetable and checklist)
                                   │
                                   ▼
                              PostgreSQL (events, budgets, constraints, assumptions, plans)
```

Calculators are pure functions with no database access, which keeps them easy to test. Services fetch data and call them.

---

## Tech stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, PostgreSQL 16
- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6, anime.js, Lenis
- **Testing:** Pytest (backend, in-memory SQLite) and Vitest with Testing Library (frontend)
- **Tooling:** Docker Compose

---

## Getting started

### Option 1: Docker (recommended)

Requirements: Docker Desktop (or Docker Engine with Compose).

```bash
cp .env.example .env        # Windows: copy .env.example .env
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:5173 |
| API docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432`, database `sustainable_events` |

The backend waits for the database, runs `alembic upgrade head` (which also loads the baseline assumptions), and starts with auto-reload.

```bash
docker compose down        # stop
docker compose down -v     # stop and wipe the database
```

### Option 2: Run locally

Requirements: Python 3.11+, Node.js 18+ (20 LTS recommended), and a running PostgreSQL instance.

**Database** (quickest way to get one):

```bash
docker compose up db
```

**Backend**

```bash
python -m venv venv
# Windows: venv\Scripts\activate      Linux/macOS: source venv/bin/activate
pip install -r backend/requirements.txt
alembic upgrade head
python -m uvicorn backend.app.main:app --reload --port 8000
```

`alembic upgrade head` creates the tables and loads the baseline assumptions. `scripts/database/seed_assumptions.py` is also available if you want to seed them manually.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

---

## Configuration

Copy `.env.example` to `.env`. Main variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sustainable_events` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `SECRET_KEY` | Application secret | **change before any real deployment** |
| `DEBUG` / `ENVIRONMENT` | Runtime mode | `True` / `development` |
| `VITE_API_BASE_URL` | API URL used by the frontend | `http://localhost:8000/api/v1` |
| `ENABLE_AI_FEATURES`, `ENABLE_ML_PREDICTIONS` | Optional modules (not yet implemented) | `False` |

---

## API overview

Interactive documentation is always available at `/docs`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health`, `/api/v1/health` | Health checks |
| POST, GET | `/api/v1/events` | Create and list events |
| GET | `/api/v1/events/{event_id}` | Fetch one event |
| various | `/api/v1/assumptions` | Create, read, update and delete assumptions |
| GET/POST | `/api/v1/assumptions/resolve` | Resolve a parameter with provenance |
| POST | `/api/v1/planning/generate` | Generate the plan alternatives |
| POST | `/api/v1/planning/food` | Food estimate |
| POST | `/api/v1/planning/waste` | Waste estimate |
| POST | `/api/v1/planning/complete-plan` | Full run-of-show plan |

---

## Data and assumptions

Every parameter is resolved with this strict precedence: **event-specific → global → missing**. The source type is preserved on every value:

| Source | Meaning |
| --- | --- |
| `USER_PROVIDED` | Entered by the organiser |
| `REFERENCE` | Taken from a benchmark or quote |
| `ASSUMED` | A default used because nothing better exists |
| `ACTUAL` | Measured after the event |
| `ML_PREDICTED` | Produced by an optional model |

The baseline values shipped in `database/migrations/versions/002_seed_baseline_assumptions.py` are starting points for Indian college events. Replace them with your own caterer quotes and measurements before relying on the results.

---

## Frontend design system

- **Look:** a glass-over-landscape interface with a ledger-style core, so data stays precise and floating panels stay light.
- **Palettes:** three swappable palettes defined in one file (`frontend/src/styles/palettes.css`). In development, add `?palette=a`, `b` or `c` to the URL to compare them.
- **Accessibility:** WCAG AA contrast is enforced by `npm run check:contrast`; motion respects reduced-motion; glass falls back to solid surfaces when transparency is reduced; the day sheet prints cleanly.
- Details live in [docs/frontend.md](docs/frontend.md); the redesign history is in [docs/ui-redesign-log.md](docs/ui-redesign-log.md).

---

## Testing

```bash
# Backend (123 tests, no database needed)
pytest tests -q

# Frontend (104 tests)
cd frontend
npm test

# Contrast check for all palettes
npm run check:contrast

# Type check and production build
npx tsc --noEmit
npm run build
```

---

## Project structure

```text
.
├── frontend/                 React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/            The 7 wizard steps plus Home, Events and 404
│       ├── components/       Layout, common UI, planning, comparison, complete plan
│       ├── hooks/            Page state hooks and helpers
│       ├── context/          Planning wizard state
│       ├── styles/           Tokens, palettes, glass and motion rules
│       └── test/             Vitest suites
├── backend/app/
│   ├── api/                  Route controllers
│   ├── core/                 Config, database, logging
│   ├── models/               SQLAlchemy models
│   ├── schemas/              Pydantic schemas
│   ├── services/             Orchestration and persistence
│   ├── planning/
│   │   ├── assumption_engine/
│   │   ├── constraint_engine/
│   │   ├── cost_engine/
│   │   ├── orchestrator/
│   │   └── modules/          food, waste, scheduling (implemented); others scaffolded
│   └── (optimization, ai, ml, location, reporting, integrations: scaffolded)
├── database/                 Alembic migrations and seed SQL
├── tests/                    Backend unit and integration tests
├── docs/                     Architecture, database, modules and frontend guides
└── scripts/database/         Manual assumption seeding
```

---

## Known limitations

- No authentication yet; anyone who can reach the API can list events.
- Plans are not saved on the server. The wizard state is held in the browser session, so a refresh loses it.
- Only the Food and Waste engines exist. Carbon, transport, water, energy and the other modules are planned.
- The Docker setup is for development (auto-reload, default database credentials, exposed database port). Harden it before any public deployment.
- Baseline assumptions are editable estimates, not audited data.

## Roadmap

1. Plan persistence, shareable read-only links and PDF/CSV export
2. Transport and carbon modules (reported as kg CO₂e, never as a score)
3. What-if sliders (attendance, veg split, reusable ratio)
4. Post-event actuals feeding back into assumptions
5. Authentication and saved events
6. Continuous integration running both test suites against PostgreSQL
7. Optional natural-language event setup using a local model

## Documentation

- [Architecture and request flow](docs/architecture.md)
- [Database schema](docs/database.md)
- [Planning modules](docs/modules.md)
- [Frontend design system](docs/frontend.md)
- [Continuous Integration (CI)](docs/ci.md)

## Contributing

1. Run the backend and frontend tests before opening a change.
2. Keep the core principle: show real units, and never invent or default a value that the engine didn't produce.
3. Add or update tests alongside any behaviour change.

## License

MIT. See [LICENSE](LICENSE).