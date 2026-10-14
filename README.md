# AI-Based Sustainable Event Planning Assistant

A modular, scalable, software-only system designed to help college event organizers plan sustainable events within a given budget with ₹0 initial cost.

## 🌟 Core Philosophy
- **Modular Monolith**: Extensible domain modules (Food, Waste, Water, Energy, Materials, Transport, Venue, Vendors, Carbon).
- **Core First, AI/ML Optional**: The deterministic planning engine, cost calculator, and sustainability scoring run independently without mandatory external AI services.
- **Cost-Free Development**: Built strictly with open-source tools (FastAPI, React, PostgreSQL, OpenStreetMap, Vitest/Pytest).

---

## 🏗️ Repository Architecture

```text
ESC PROJECT/
├── frontend/             # React + TypeScript + Vite + Tailwind CSS
├── backend/              # FastAPI + SQLAlchemy + Pydantic Modular Monolith
│   └── app/
│       ├── api/          # Route controllers and API dependencies
│       ├── core/         # Core configs, database, security, logging
│       ├── models/       # SQLAlchemy ORM entity definitions
│       ├── schemas/      # Pydantic validation schemas
│       ├── services/     # Application service orchestrators
│       ├── planning/     # Modular domain planning engines
│       ├── optimization/ # Optimization interfaces & algorithms (e.g. OR-Tools)
│       ├── sustainability/ Scoring, metrics, & recommendations
│       ├── ai/           # Optional local/open-source AI/NLP helpers
│       ├── ml/           # scikit-learn attendance & cost predictors
│       ├── location/     # OpenStreetMap / MapLibre geocoding & routing
│       ├── reporting/    # Report generators & exporters
│       └── integrations/ # Interfaces for external and future systems
├── database/             # Migrations, seed data, and schema docs
├── tests/                # Unit and integration test suites
├── docs/                 # Architectural Decision Records (ADRs) and design guides
├── scripts/              # Development, migration, and deployment scripts
├── config/               # Baseline assumptions and sustainability constants
└── .github/              # CI/CD Workflows
```

---

## 🎯 Target Event Types
- Tech Fest
- Cultural Fest
- Hackathon
- Workshop
- Conference
- Sports Event
- College Farewell
- Department Event

## 📊 Planning Modes
1. **Balanced**
2. **Budget-focused**
3. **Sustainability-focused**
4. **Custom priorities**

---

## 📌 Project Status

### PHASE 1 STATUS:
- Database foundation implemented (PostgreSQL + SQLAlchemy 2.x declarative models: Event, Budget, CostItem, Constraint, Assumption, Plan)
- FastAPI foundation implemented (Health endpoints at `/health` and `/api/v1/health`, Pydantic Settings, CORS)
- Event API implemented (`POST /api/v1/events`, `GET /api/v1/events/{event_id}`, `GET /api/v1/events`)

### PHASE 2A STATUS:
- **Assumption Engine Implemented** (`backend/app/planning/assumption_engine/`)
- Reusable deterministic `AssumptionResolver` enforcing strict precedence: `EVENT-SPECIFIC` ──► `GLOBAL` ──► `MISSING` (never silently invents values)
- Data provenance strictly preserved across source types (`USER_PROVIDED`, `REFERENCE`, `ASSUMED`, `ACTUAL`, `ML_PREDICTED`)
- Assumption CRUD and `/api/v1/assumptions/resolve` API endpoints implemented

### PHASE 2B STATUS:
- **Food Planning Module Implemented** (`backend/app/planning/modules/food/`)
- Pure, decoupled calculation engine (`FoodCalculator`) with whole-number servings and Decimal precision
- Integrated with Assumption Engine for meal participation, costs per serving, waste percentages, and serving weights
- Supports 3 pricing approaches: User-provided total, User-provided unit cost, Assumption-based cost
- Rule-based constraint evaluation (vegetarian-only mandates, budget ceilings) and actionable eco-recommendations
- Comprehensive unit and integration test suite

### PHASE 2C STATUS:
- **Waste Planning Module Implemented** (`backend/app/planning/modules/waste/`)
- Covers 4 waste streams: Food Waste (reused directly from Food Module or user-overridden), Packaging Waste (Plate, Cup, Spoon, Fork, Glass, Other), Plastic Waste (Water Bottle, Plastic Bag, Wrapper, Plastic Cup, Other), and Other Waste (predefined categories and custom items)
- Primary metrics are count/item-based (servings, items); no forced conversion to kilograms
- Supports 4 calculation bases: `PER_PERSON`, `PER_MEAL`, `PER_EVENT`, `CUSTOM`
- Baseline reference assumptions calibrated (including `Decorations Per Event` and `Containers Per Event`)
- Reusable vs single-use split resolution with assumption fallback (`reusable_ratio_<item>`, `single_use_ratio_<item>`)
- Pure calculation engine (`WasteCalculator`), rule-based recommendations (`WasteRulesEngine`), orchestrator (`WastePlanningService`), and `POST /api/v1/planning/waste` API endpoint
- Complete automated test suite passing (123 total backend tests passing)

### PHASE 3 STATUS (Frontend & Motion Experience):
- **Full 7-Step Planning Wizard** (`frontend/src/pages/`):
  1. **Event Setup**: Type, name, attendee headcount, duration, and venue context.
  2. **Budget Calibration**: Currency and budget limits with real-time variance monitoring.
  3. **Preferences & Constraints**: User-prioritized rules (Must Have, Avoid, Would Be Nice).
  4. **Food Planning**: Meal selection, dietary split (veg/non-veg), caterer cost approaches, and waste projections.
  5. **Waste Planning**: Streamlined MVP UX across food, packaging, plastic, and general waste with actionable reduction recommendations.
  6. **Plan Alternatives**: Side-by-side comparison of Balanced, Budget-Optimized, and Eco-Focused options.
  7. **Complete Event Plan**: Chronological day-of-event timetable, vendor checklists, and exportable operational guides.
- **Cinematic Eco-Modern Motion System**:
  - **Lenis Smooth Inertial Scrolling**: Momentum scrolling across the application with an ambient `2.5px` emerald reading progress beam and elevated glassmorphic navbar.
  - **Ambient Eco-Particle Canvas**: Interactive HTML5 2D canvas with organic constellation links, mouse proximity aura, and Retina DPI scaling.
  - **Anime.js Kinetic Micro-Interactions**: Real-time numerical tweening (`<AnimatedCounter />`) with spring physics for portions, expenditures, and waste mass, plus staggered entrance choreography.

---

## 🚀 Getting Started

### Method 1: Running with Docker (Recommended)

1. Make sure **Docker Desktop** is running.
2. Clone the repository and configure your environment:
   ```bash
   cp .env.example .env
   ```
3. Build and launch all services:
   ```bash
   docker compose up --build
   ```
4. Access the applications:
   - **Frontend Web UI**: [http://localhost:5173](http://localhost:5173) (or [http://localhost:3000](http://localhost:3000))
   - **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: `localhost:5432` (`db: event_planner`)

To stop all services:
```bash
docker compose down
```

---

### Method 2: Running Locally

#### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations and seed data
alembic upgrade head
python scripts/database/seed_assumptions.py

# Start the development server
uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Tests

- **Backend Pytest Suite** (123 tests):
  ```bash
  pytest tests -q
  ```
- **Frontend Vitest Suite** (104 tests):
  ```bash
  cd frontend
  npm test -- --run
  ```
- **Frontend Production Build**:
  ```bash
  cd frontend
  npm run build
  ```

Refer to [docs/architecture/README.md](docs/architecture/README.md) and [docs/database/README.md](docs/database/README.md) for detailed architecture documentation.
