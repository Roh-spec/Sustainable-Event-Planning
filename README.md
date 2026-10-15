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

### FRONTEND & DESIGN SYSTEM (Field Notebook UI):
- **Field Notebook Design Language**:
  - Curated, organic palette: warm paper (`#F8F5EE`), deep ink (`#1E231F`), forest moss (`#2D5A3D`), and terra-cotta clay (`#C46849`).
  - Editorial typography: **Fraunces** serif for headings, **Plus Jakarta Sans** for interfaces, and **JetBrains Mono** for metrics and financial ledgers.
  - Physical stationery aesthetics: `.surface-sheet`, `.label-kicker`, delicate rules, and tactile notebook shadow tokens.

- **Full 7-Step Planning Wizard** (`frontend/src/pages/`):
  1. **Event Setup**: Type selection via illustrated tiles, attendee headcount, duration, and venue context.
  2. **Budget Calibration**: Currency and ceiling limits with real-time variance monitoring and honest deficit reporting.
  3. **Preferences & Constraints**: User-prioritized rules with clear preference tags (*Must Have*, *Avoid*, *Would Be Nice*, *Flexible*).
  4. **Food Planning**: Meal selection, dietary split sliders (veg/non-veg), caterer pricing modes, and edible surplus projections.
  5. **Waste Planning**: Streamlined item-based calculations across packaging, plastic, and general waste streams with reference benchmark transparency.
  6. **Plan Alternatives & Decision Ledger**: Multi-objective alternative cards (*Cost-First Ledger*, *Pragmatic Balance*, *Maximum Circularity*) with spend-vs-waste trade-off meters and comprehensive side-by-side comparison.
  7. **Run of Show / Complete Event Plan**: Authentic chronological vertical spine timetable, interactive operational execution checklist with session tracking, 3-column resource manifest, budget ledger, sustainability verification criteria, and print-optimized (`@media print`) physical day sheet.

- **Accessible Motion System (Anime.js + Lenis)**:
  - **Accessibility Compliance**: Dedicated `prefersReducedMotion()` utility respecting operating system and browser accessibility settings.
  - **Lenis Smooth Inertial Scrolling**: Momentum scrolling across the application with route-based scroll reset and an ambient gradient reading beam (hidden during print).
  - **Kinetic Micro-Interactions**: Real-time numerical tweening (`<AnimatedCounter />`) with spring physics for portions, expenditures, and waste mass.
  - **Choreographed Feedback**: Elastic active step pulse in wizard navigation, plan selection pulse, and staggered entrance reveals for alternative cards.

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
