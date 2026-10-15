# EcoPlan — AI-Based Sustainable Event Planning Assistant

A modular, scalable, software-only system designed to help college event organizers plan sustainable events within a given budget with ₹0 initial cost.

> **Kilograms, rupees, and item counts — not fake scores.**  
> EcoPlan eliminates arbitrary 87/100 sustainability ratings in favor of concrete physics and honest accounting: edible food surplus in kg, single-use packaging counts, plastic elimination ratios, and real rupee variances against budget ceilings.

---

## 🌟 Core Philosophy

- **Physical & Verifiable Metrics**: Every estimate is expressed in measurable real-world units (servings, items, kilograms, currency) rather than opaque "green points."
- **Deterministic First, AI/ML Optional**: Core calculations, cost modeling, constraint satisfaction, and plan alternatives run on a pure deterministic engine that never invents data or hallucinates budgets.
- **Data Provenance & Assumption Transparency**: Every number traces back to its source—user input, calibrated institutional reference benchmarks, or explicit planning formulas.
- **₹0 Cost-Free Stack**: Built exclusively with open-source tools: FastAPI, PostgreSQL, React, TypeScript, Tailwind CSS, Vitest, and Pytest.

---

## 🏗️ System Architecture

```text
Sustainable-Event-Planning/
├── frontend/             # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Field Notebook UI components (wizard, complete_plan, planning)
│   │   ├── context/      # PlanningWizardContext with sessionStorage persistence
│   │   ├── pages/        # 7-step wizard pages & decision ledger
│   │   ├── styles/       # Design system tokens (paper, ink, moss, clay)
│   │   └── utils/        # Metric formatting, 12-hour time parsing, anime.js motion
├── backend/              # FastAPI + SQLAlchemy 2.x Modular Monolith
│   └── app/
│       ├── api/          # Route controllers (events, food, waste, planning, assumptions)
│       ├── core/         # Settings, database engine, CORS, exception handling
│       ├── models/       # SQLAlchemy ORM declarative models
│       ├── schemas/      # Pydantic v2 schemas and validation contracts
│       ├── services/     # Domain services orchestrating business logic
│       └── planning/     # Assumption resolver & domain calculators (food, waste, multi-objective)
├── database/             # PostgreSQL Alembic migrations & initial seed data
├── docs/                 # Consolidated engineering documentation
│   ├── index.md          # Technical documentation index
│   ├── architecture.md   # System design & modular monolith principles
│   ├── database.md       # Relational schema, tables & migrations
│   ├── frontend.md       # React architecture & Field Notebook design system
│   ├── modules.md        # Food & waste calculation methodology
│   └── planning.md       # Multi-objective optimization & candidate evaluation
├── scripts/              # Database seeding and migration utilities
└── tests/                # Comprehensive Pytest suite (unit & integration)
```

---

## 📋 The 7-Step Planning Wizard

EcoPlan guides organizers through a structured, 7-step workflow styled in the **Field Notebook** aesthetic (warm paper, editorial Fraunces typography, and deep forest moss accents):

1. **Event Setup**: Configure event name, illustrated event type tiles, expected attendee headcount, duration in days, and venue context.
2. **Budget Calibration**: Set total budget and currency with real-time variance monitoring and honest deficit warnings (no hidden cost assumptions).
3. **Preferences & Constraints**: Express organizer rules with intuitive preference tags (*Must Have*, *Avoid*, *Would Be Nice*, *Flexible*).
4. **Food Planning**: Select meals (breakfast, lunch, high tea, dinner), tune vegetarian ratio sliders, choose caterer cost models (per-plate or total), and project food surplus in kg.
5. **Waste Planning**: Configure packaging, plastic bottles, and event decoration waste with transparent reference benchmarks and reusable fleet suggestions.
6. **Plan Alternatives & Decision Ledger**: Review multi-objective alternatives:
   - 💰 **Cost-First Baseline**: Minimizes budget absorption while meeting attendee catering targets.
   - ⚖️ **Pragmatic Balance**: Optimal equilibrium between fiscal limits and high diversion rates.
   - 🌱 **Maximum Circularity**: Eliminates single-use plastics and maximizes reusable tableware fleets.
   - Includes visual spend-vs-waste trade-off meters and side-by-side comparison.
7. **Run of Show / Complete Event Plan**:
   - **Chronological Vertical Spine Timetable**: Formatted 12-hour slots (`09:00 AM – 10:00 AM`), activity status nodes, meal badges, and buffer conflict alerts (`BUFFER TIGHT`).
   - **Operational Execution Checklist**: Chronological task grouping (*Before the Event*, *Morning*, *During*, *After*) with interactive session progress tracking.
   - **Resource Manifest (3-Column Split)**: Separate cards for catering portions, tableware reusables, and plastic elimination, plus suggested equipment cards requiring organizer verification.
   - **Plan Budget Summary & Ledger**: JetBrains Mono financial ledger with deficit alerts and contingency margins.
   - **Sustainability Verification Criteria**: Clear action items with target metrics and physical on-site audit steps.
   - **Assumptions Disclosure**: Full transparency accordion translating reference calculation factors into plain language.
   - **Print Optimization**: Clean `@media print` day sheet hiding navigation controls for physical clipboard usage.

---

## 🎨 Motion & Aesthetics

- **Field Notebook Palette**: Warm paper background (`#F8F5EE`), deep ink text (`#1E231F`), forest moss (`#2D5A3D`), and terra-cotta clay (`#C46849`).
- **Typography**: **Fraunces** serif for editorial titles, **Plus Jakarta Sans** for clean interface controls, and **JetBrains Mono** for figures and ledger tables.
- **Lenis Smooth Inertial Scrolling**: Momentum scrolling across the application with route-based scroll reset and an ambient gradient reading beam.
- **Anime.js Kinetic Micro-Interactions**: Real-time numerical tweening (`<AnimatedCounter />`) with spring physics for portions, expenditures, and waste mass.
- **Accessibility Guarantee**: Built-in `prefersReducedMotion()` utility honoring operating system and browser accessibility preferences.

---

## 🚀 Getting Started

### Option 1: Running with Docker (Recommended)

1. Ensure **Docker Desktop** is running.
2. Clone the repository and configure your environment:
   ```bash
   cp .env.example .env
   ```
3. Build and launch all services:
   ```bash
   docker compose up --build
   ```
4. Access the applications:
   - **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
   - **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: `localhost:5432` (database: `event_planner`)

To stop all containers:
```bash
docker compose down
```

---

### Option 2: Running Locally

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

# Run migrations and seed baseline assumptions
alembic upgrade head
python scripts/database/seed_assumptions.py

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated Testing & Quality Assurance

EcoPlan maintains a comprehensive test suite across backend calculation engines and frontend user journeys:

- **Backend Pytest Suite** (123 tests passing):
  ```bash
  pytest tests -q
  ```
- **Frontend Vitest Suite** (104 tests passing):
  ```bash
  cd frontend
  npm test -- --run
  ```
- **Frontend Production TypeScript Build**:
  ```bash
  cd frontend
  npm run build
  ```

---

## 📚 Technical Documentation

For detailed architecture diagrams, database schemas, and calculation methodology, explore the consolidated documentation in [`docs/`](docs/index.md):

- [Architecture & Modular Monolith Principles](docs/architecture.md)
- [Database Models & Relational Schema](docs/database.md)
- [Frontend Architecture & Design Tokens](docs/frontend.md)
- [Food & Waste Calculation Modules](docs/modules.md)
- [Planning Engine & Optimization Pipeline](docs/planning.md)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
