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
- Reusable vs single-use split resolution with assumption fallback (`reusable_ratio_<item>`, `single_use_ratio_<item>`)
- Pure calculation engine (`WasteCalculator`), rule-based recommendations (`WasteRulesEngine`), orchestrator (`WastePlanningService`), and `POST /api/v1/planning/waste` API endpoint
- **Paper Waste explicitly WAITLISTED** for future phases
- Complete automated test suite passing (73 total tests passing)
- Future domain modules (Water, Energy, Transport, Venue, Vendors, Carbon, Orchestrator) reserved for subsequent phases

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or Docker)

Refer to [docs/architecture/README.md](docs/architecture/README.md) and [docs/database/README.md](docs/database/README.md) for detailed documentation.
