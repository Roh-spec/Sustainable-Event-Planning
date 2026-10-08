
"""
Script to set up the complete directory structure and placeholders for
the AI-Based Sustainable Event Planning Assistant (ESC PROJECT).
"""
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# All files to create with their placeholder content
FILES = {
    # Root files
    ".gitignore": """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.venv
venv/
ENV/
.pytest_cache/
.coverage
htmlcov/

# Node / Frontend
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
frontend/dist/
frontend/dist-ssr/
*.local

# Environment & Secret files
.env
.env.local
.env.*.local
*.pem
*.key

# IDE & Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Database & Logs
*.sqlite3
*.log
logs/
""",

    ".env.example": """# AI-Based Sustainable Event Planning Assistant
# Environment Variables Example Configuration

# Application Environment
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO
APP_PORT=8000
APP_HOST=0.0.0.0

# Frontend Configuration
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Database Configuration (PostgreSQL)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=sustainable_events
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sustainable_events

# Security & CORS
SECRET_KEY=change_this_to_a_secure_random_key_in_production
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# AI / ML Configuration (Optional & Modular - Defaults to Local/Disabled)
AI_PROVIDER=local
LOCAL_LLM_HOST=http://localhost:11434
ENABLE_AI_FEATURES=False
ENABLE_ML_PREDICTIONS=False

# Map / Geospatial Services (Free/OpenSource Tiles)
MAP_TILE_PROVIDER=openstreetmap
OPENSTREETMAP_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
""",

    "docker-compose.yml": """version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: esc_backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/sustainable_events
      - ENVIRONMENT=development
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - ./config:/app/config

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: esc_frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    container_name: esc_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sustainable_events
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/seed:/docker-entrypoint-initdb.d

volumes:
  postgres_data:
""",

    "LICENSE": """MIT License

Copyright (c) 2026 AI-Based Sustainable Event Planning Assistant Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
""",

    "README.md": """# AI-Based Sustainable Event Planning Assistant

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

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or Docker)

Refer to [docs/architecture/README.md](docs/architecture/README.md) for detailed architectural documentation.
""",

    # Backend Root & Init
    "backend/app/__init__.py": '"""AI-Based Sustainable Event Planning Assistant Backend Application Package."""\n',
    "backend/app/main.py": """\"\"\"
FastAPI Application Entry Point.

Initializes the FastAPI application, mounts API routers, middleware,
CORS policies, and lifecycle event handlers.
\"\"\"
""",

    # Backend API
    "backend/app/api/__init__.py": '"""API Package containing route endpoints and request dependencies."""\n',
    "backend/app/api/dependencies/__init__.py": '"""Common API dependencies such as database session injection."""\n',
    "backend/app/api/routes/__init__.py": '"""Route handlers for the FastAPI REST API."""\n',
    "backend/app/api/routes/health.py": '"""Health check endpoint to monitor application and service status."""\n',
    "backend/app/api/routes/events.py": '"""API route endpoints for Event lifecycle management."""\n',
    "backend/app/api/routes/planning.py": '"""API route endpoints for triggering and configuring event planning runs."""\n',
    "backend/app/api/routes/plans.py": '"""API route endpoints for managing, retrieving, and selecting generated plans."""\n',
    "backend/app/api/routes/comparison.py": '"""API route endpoints for comparing multiple alternative event plans."""\n',
    "backend/app/api/routes/budget.py": '"""API route endpoints for budget breakdown and allocation tracking."""\n',
    "backend/app/api/routes/sustainability.py": '"""API route endpoints for sustainability metrics and eco-scoring."""\n',
    "backend/app/api/routes/reports.py": '"""API route endpoints for generating exportable event planning reports."""\n',
    "backend/app/api/routes/ai.py": '"""Optional API route endpoints for AI-assisted command parsing and suggestions."""\n',
    "backend/app/api/routes/ml.py": '"""Optional API route endpoints for ML attendance and cost predictions."""\n',

    # Backend Core
    "backend/app/core/__init__.py": '"""Core infrastructure package (settings, database session, logging)."""\n',
    "backend/app/core/config.py": '"""Application configuration loaded from environment variables using Pydantic Settings."""\n',
    "backend/app/core/database.py": '"""SQLAlchemy database engine, sessionmaker, and declarative base setup."""\n',
    "backend/app/core/security.py": '"""Security utilities, hashing placeholders, and CORS configurations."""\n',
    "backend/app/core/logging.py": '"""Structured logging configuration for backend services."""\n',

    # Backend Models (SQLAlchemy ORM Placeholders)
    "backend/app/models/__init__.py": '"""SQLAlchemy ORM models package."""\n',
    "backend/app/models/event.py": '"""SQLAlchemy model placeholder for Event entities."""\n',
    "backend/app/models/plan.py": '"""SQLAlchemy model placeholder for Plan entities (options, alternatives)."""\n',
    "backend/app/models/budget.py": '"""SQLAlchemy model placeholder for Budget entities."""\n',
    "backend/app/models/cost.py": '"""SQLAlchemy model placeholder for Cost item entities and estimations."""\n',
    "backend/app/models/constraint.py": '"""SQLAlchemy model placeholder for user and institutional constraints."""\n',
    "backend/app/models/assumption.py": '"""SQLAlchemy model placeholder for system planning assumptions."""\n',
    "backend/app/models/resource.py": '"""SQLAlchemy model placeholder for physical and service resources."""\n',
    "backend/app/models/sustainability.py": '"""SQLAlchemy model placeholder for Sustainability scores and audits."""\n',
    "backend/app/models/prediction.py": '"""SQLAlchemy model placeholder for ML prediction results."""\n',
    "backend/app/models/user.py": '"""SQLAlchemy model placeholder for Organizer/User accounts."""\n',

    # Backend Schemas (Pydantic DTOs Placeholders)
    "backend/app/schemas/__init__.py": '"""Pydantic schemas package for request validation and response serialization."""\n',
    "backend/app/schemas/event.py": '"""Pydantic schema placeholders for Event create, read, update DTOs."""\n',
    "backend/app/schemas/plan.py": '"""Pydantic schema placeholders for Plan DTOs and alternatives."""\n',
    "backend/app/schemas/budget.py": '"""Pydantic schema placeholders for Budget management and allocations."""\n',
    "backend/app/schemas/cost.py": '"""Pydantic schema placeholders for Cost line-items and estimation results."""\n',
    "backend/app/schemas/constraint.py": '"""Pydantic schema placeholders for Constraint rules and filters."""\n',
    "backend/app/schemas/assumption.py": '"""Pydantic schema placeholders for baseline and custom assumptions."""\n',
    "backend/app/schemas/resource.py": '"""Pydantic schema placeholders for Resource specifications."""\n',
    "backend/app/schemas/sustainability.py": '"""Pydantic schema placeholders for Sustainability scoring and metrics."""\n',
    "backend/app/schemas/prediction.py": '"""Pydantic schema placeholders for ML predictions and inference responses."""\n',
    "backend/app/schemas/user.py": '"""Pydantic schema placeholders for User and organizer profiles."""\n',

    # Backend Services
    "backend/app/services/__init__.py": '"""Service layer coordinating domain logic and persistence."""\n',
    "backend/app/services/event_service.py": '"""Service coordinating Event creation, retrieval, and updates."""\n',
    "backend/app/services/plan_service.py": '"""Service coordinating Plan generation, comparison, and selection."""\n',
    "backend/app/services/budget_service.py": '"""Service coordinating Budget tracking and expense summaries."""\n',
    "backend/app/services/cost_service.py": '"""Service coordinating Cost calculation and user overrides."""\n',
    "backend/app/services/constraint_service.py": '"""Service evaluating and applying user and system constraints."""\n',
    "backend/app/services/sustainability_service.py": '"""Service computing sustainability scores and green recommendations."""\n',

    # Backend Planning Engine & Modules
    "backend/app/planning/__init__.py": '"""Planning package: domain calculation modules, engines, and orchestrator."""\n',
    "backend/app/planning/common/__init__.py": '"""Shared interfaces, base classes, and domain types for planning."""\n',
    "backend/app/planning/common/types.py": '"""Common domain types, enums (e.g. PlanningMode, ConstraintType), and value objects."""\n',
    "backend/app/planning/common/interfaces.py": '"""Abstract base interfaces for planning modules and calculation engines."""\n',

    "backend/app/planning/modules/__init__.py": '"""Domain-specific planning submodules (Food, Waste, Water, Energy, etc.)."""\n',

    # Food Module
    "backend/app/planning/modules/food/__init__.py": '"""Food planning submodule."""\n',
    "backend/app/planning/modules/food/calculator.py": '"""Calculates food portions, meal counts, and catering requirements."""\n',
    "backend/app/planning/modules/food/rules.py": '"""Domain rules and heuristics for food planning."""\n',
    "backend/app/planning/modules/food/schemas.py": '"""Data schemas specific to food planning inputs and outputs."""\n',

    # Waste Module
    "backend/app/planning/modules/waste/__init__.py": '"""Waste management submodule."""\n',
    "backend/app/planning/modules/waste/calculator.py": '"""Calculates expected waste volumes, segregation needs, and disposal methods."""\n',
    "backend/app/planning/modules/waste/rules.py": '"""Zero-waste principles and waste reduction rules."""\n',
    "backend/app/planning/modules/waste/schemas.py": '"""Data schemas specific to waste planning."""\n',

    # Water Module
    "backend/app/planning/modules/water/__init__.py": '"""Water conservation and supply planning submodule."""\n',
    "backend/app/planning/modules/water/calculator.py": '"""Calculates drinking and utility water requirements."""\n',
    "backend/app/planning/modules/water/rules.py": '"""Water dispensing and conservation rules."""\n',
    "backend/app/planning/modules/water/schemas.py": '"""Data schemas specific to water planning."""\n',

    # Energy Module
    "backend/app/planning/modules/energy/__init__.py": '"""Energy planning submodule."""\n',
    "backend/app/planning/modules/energy/calculator.py": '"""Calculates stage, lighting, AV, and power consumption needs."""\n',
    "backend/app/planning/modules/energy/rules.py": '"""Energy efficiency rules and generator vs grid preferences."""\n',
    "backend/app/planning/modules/energy/schemas.py": '"""Data schemas specific to energy planning."""\n',

    # Materials Module
    "backend/app/planning/modules/materials/__init__.py": '"""Materials, merchandise, and signage planning submodule."""\n',
    "backend/app/planning/modules/materials/calculator.py": '"""Calculates material quantities (banners, badges, stationery, decor)."""\n',
    "backend/app/planning/modules/materials/rules.py": '"""Reusability, biodegradability, and eco-friendly material guidelines."""\n',
    "backend/app/planning/modules/materials/schemas.py": '"""Data schemas specific to material planning."""\n',

    # Transport Module
    "backend/app/planning/modules/transport/__init__.py": '"""Transport and attendee transit planning submodule."""\n',
    "backend/app/planning/modules/transport/calculator.py": '"""Calculates transit requirements, shuttle capacities, and parking footprint."""\n',
    "backend/app/planning/modules/transport/rules.py": '"""Carpooling, public transit, and green mobility rules."""\n',
    "backend/app/planning/modules/transport/schemas.py": '"""Data schemas specific to transport planning."""\n',

    # Venue Module
    "backend/app/planning/modules/venue/__init__.py": '"""Venue selection and spatial planning submodule."""\n',
    "backend/app/planning/modules/venue/recommender.py": '"""Recommends on-campus or partner venues matching attendee capacity."""\n',
    "backend/app/planning/modules/venue/rules.py": '"""Venue constraints, capacity limits, and ventilation criteria."""\n',
    "backend/app/planning/modules/venue/schemas.py": '"""Data schemas specific to venue requirements."""\n',

    # Vendors Module
    "backend/app/planning/modules/vendors/__init__.py": '"""Vendor discovery and matching submodule."""\n',
    "backend/app/planning/modules/vendors/matcher.py": '"""Matches event requirements with local, sustainable vendors."""\n',
    "backend/app/planning/modules/vendors/rules.py": '"""Vendor sustainability criteria and budget fitting rules."""\n',
    "backend/app/planning/modules/vendors/schemas.py": '"""Data schemas specific to vendor matching."""\n',

    # Carbon Module
    "backend/app/planning/modules/carbon/__init__.py": '"""Carbon footprint accounting submodule."""\n',
    "backend/app/planning/modules/carbon/calculator.py": '"""Calculates estimated CO2 emissions across all planning domains."""\n',
    "backend/app/planning/modules/carbon/factors.py": '"""Emission factors and reference coefficient tables."""\n',
    "backend/app/planning/modules/carbon/schemas.py": '"""Data schemas specific to carbon footprint estimation."""\n',

    # Cost Engine
    "backend/app/planning/cost_engine/__init__.py": '"""Cost engine: aggregates costs, computes per-person/total budgets."""\n',
    "backend/app/planning/cost_engine/calculator.py": '"""Computes line-item and aggregate event costs."""\n',
    "backend/app/planning/cost_engine/estimator.py": '"""Provides cost estimations based on category averages and tier models."""\n',
    "backend/app/planning/cost_engine/schemas.py": '"""Schemas for cost computation inputs, overrides, and outputs."""\n',

    # Constraint Engine
    "backend/app/planning/constraint_engine/__init__.py": '"""Constraint engine: validates plan feasibility against user/system rules."""\n',
    "backend/app/planning/constraint_engine/evaluator.py": '"""Evaluates hard (Required/Not Allowed) and soft (Preferred/Flexible) constraints."""\n',
    "backend/app/planning/constraint_engine/schemas.py": '"""Schemas for constraint definitions and evaluation reports."""\n',

    # Assumption Engine
    "backend/app/planning/assumption_engine/__init__.py": '"""Assumption engine: manages default values and contextual heuristics."""\n',
    "backend/app/planning/assumption_engine/manager.py": '"""Resolves default assumptions when specific user inputs are omitted."""\n',
    "backend/app/planning/assumption_engine/sources.py": '"""Data sources and loaders for baseline domain assumptions."""\n',
    "backend/app/planning/assumption_engine/schemas.py": '"""Schemas for assumption records and customization."""\n',

    # Orchestrator
    "backend/app/planning/orchestrator/__init__.py": '"""Planning orchestrator: coordinates pipeline execution across modules."""\n',
    "backend/app/planning/orchestrator/planner.py": '"""Master orchestrator generating alternative plans (Balanced, Budget, Green)."""\n',
    "backend/app/planning/orchestrator/pipeline.py": '"""Execution pipeline for running domain modules in order."""\n',
    "backend/app/planning/orchestrator/schemas.py": '"""Schemas for orchestration requests and generated plan options."""\n',

    # Optimization
    "backend/app/optimization/__init__.py": '"""Mathematical and combinatorial optimization package (e.g. OR-Tools)."""\n',
    "backend/app/optimization/optimizer.py": '"""Optimizer placeholder for multi-objective trade-off solving."""\n',
    "backend/app/optimization/objectives.py": '"""Objective functions (e.g. minimize cost, maximize sustainability)."""\n',
    "backend/app/optimization/constraints.py": '"""Mathematical constraint formulations for the solver."""\n',
    "backend/app/optimization/interfaces.py": '"""Abstract interfaces for solver implementations."""\n',

    # Sustainability
    "backend/app/sustainability/__init__.py": '"""Sustainability scoring, metric computation, and green recommendations."""\n',
    "backend/app/sustainability/scoring.py": '"""Calculates composite green scores based on domain metrics."""\n',
    "backend/app/sustainability/metrics.py": '"""Standard sustainability indicator definitions."""\n',
    "backend/app/sustainability/recommendations.py": '"""Generates actionable eco-friendly recommendations for organizers."""\n',

    # AI Package
    "backend/app/ai/__init__.py": '"""Optional AI and NLP assistance package (strictly modular)."""\n',
    "backend/app/ai/interfaces.py": '"""Abstract interface definitions for AI providers."""\n',
    "backend/app/ai/command_parser.py": '"""Parses natural language requests into structured event parameters."""\n',
    "backend/app/ai/prompts/__init__.py": '"""Prompt templates for natural language processing."""\n',
    "backend/app/ai/providers/__init__.py": '"""Provider adapters (e.g. Local LLM / Ollama placeholder)."""\n',

    # ML Package
    "backend/app/ml/__init__.py": '"""Optional Machine Learning package (scikit-learn predictive models)."""\n',
    "backend/app/ml/interfaces.py": '"""Abstract interfaces for ML predictors and model pipelines."""\n',
    "backend/app/ml/features/__init__.py": '"""Feature extraction and preprocessing pipelines."""\n',
    "backend/app/ml/datasets/__init__.py": '"""Dataset loaders and training data definitions."""\n',
    "backend/app/ml/models/__init__.py": '"""Trained model serialization and registry placeholders."""\n',
    "backend/app/ml/predictors/__init__.py": '"""Inference predictors (e.g. attendance predictor, cost estimator)."""\n',
    "backend/app/ml/evaluation/__init__.py": '"""Model performance evaluation metrics and validation routines."""\n',

    # Location Package
    "backend/app/location/__init__.py": '"""Location and geospatial utilities using open-source mapping services."""\n',
    "backend/app/location/geocoding.py": '"""Geocoding client interface (OpenStreetMap / Nominatim)."""\n',
    "backend/app/location/maps.py": '"""Map tile configuration and bounds calculation helpers."""\n',
    "backend/app/location/routing.py": '"""Routing and distance computation placeholders."""\n',

    # Reporting Package
    "backend/app/reporting/__init__.py": '"""Event plan reporting and document generation package."""\n',
    "backend/app/reporting/generator.py": '"""Generates consolidated plan summaries and audit reports."""\n',
    "backend/app/reporting/templates/__init__.py": '"""Templates for report generation (HTML/Markdown/Text)."""\n',
    "backend/app/reporting/exporters/__init__.py": '"""Exporters for PDF, CSV, and JSON plan formats."""\n',

    # Integrations Package
    "backend/app/integrations/__init__.py": '"""External integration interfaces (Map tiles, data providers, future IoT)."""\n',
    "backend/app/integrations/maps/__init__.py": '"""Integration adapters for OpenFreeMap / MapLibre."""\n',
    "backend/app/integrations/ai/__init__.py": '"""Integration adapters for optional AI runtimes."""\n',
    "backend/app/integrations/external_data/__init__.py": '"""Adapters for public environmental factor data."""\n',
    "backend/app/integrations/future/__init__.py": '"""Placeholders for future integrations (IoT sensors, campus systems)."""\n',

    # Database Directory
    "database/README.md": """# Database Management

This directory contains database migrations, seed data, and schema definitions for PostgreSQL.

## Structure
- `migrations/`: Alembic / SQL database migration scripts.
- `seed/`: Seed scripts for initial reference tables (event types, emission factors, default assumptions).

## Usage
- Run migrations using your migration tool (e.g., Alembic).
- Initial schema setup will be tracked here.
""",
    "database/migrations/.gitkeep": "",
    "database/seed/.gitkeep": "",

    # Tests Structure
    "tests/__init__.py": '"""Test suite root package."""\n',
    "tests/unit/__init__.py": '"""Unit test package."""\n',
    "tests/unit/planning/__init__.py": '"""Unit tests for domain planning modules."""\n',
    "tests/unit/cost/__init__.py": '"""Unit tests for cost calculation and estimation."""\n',
    "tests/unit/constraints/__init__.py": '"""Unit tests for constraint evaluation."""\n',
    "tests/unit/sustainability/__init__.py": '"""Unit tests for sustainability scoring."""\n',
    "tests/unit/ai/__init__.py": '"""Unit tests for AI command parser."""\n',
    "tests/unit/ml/__init__.py": '"""Unit tests for ML predictors."""\n',
    "tests/integration/__init__.py": '"""Integration tests for API routes and workflows."""\n',
    "tests/fixtures/__init__.py": '"""Test fixtures and mock input payloads."""\n',

    # Documentation Structure
    "docs/README.md": """# Project Documentation

Welcome to the documentation for the **AI-Based Sustainable Event Planning Assistant**.

## Documentation Index
- [Architecture](architecture/README.md): High-level system design, modular monolith details.
- [API](api/README.md): REST API endpoints and contract specifications.
- [Planning Engine](planning/README.md): Planning orchestrator and pipeline execution.
- [Domain Modules](modules/README.md): Food, waste, water, energy, transport, venue, vendor modules.
- [Sustainability Framework](sustainability/README.md): Scoring methodology and metrics.
- [AI Architecture](ai/README.md): Modular, optional AI assistance design.
- [ML Architecture](ml/README.md): Attendance and cost prediction models.
- [Database Schema](database/README.md): Relational data models.
- [Architecture Decision Records (ADRs)](decisions/README.md): Key technical choices.
- [Diagrams](diagrams/README.md): Architecture and workflow diagrams.
""",
    "docs/architecture/README.md": "# System Architecture\n\nModular Monolith architecture documentation.\n",
    "docs/api/README.md": "# API Specification\n\nREST API endpoints specifications and contracts.\n",
    "docs/planning/README.md": "# Planning Engine\n\nOrchestrator, pipeline, cost engine, and constraint engine documentation.\n",
    "docs/modules/README.md": "# Domain Planning Modules\n\nDocumentation for Food, Waste, Water, Energy, Materials, Transport, Venue, Vendors, and Carbon modules.\n",
    "docs/ai/README.md": "# AI System Design\n\nOptional, modular AI assistant and NLP design without paid API lock-in.\n",
    "docs/ml/README.md": "# Machine Learning Design\n\nAttendance prediction and cost estimation with scikit-learn.\n",
    "docs/database/README.md": "# Database Design\n\nPostgreSQL relational schema and entity relationships.\n",
    "docs/decisions/README.md": "# Architectural Decision Records (ADRs)\n\nLog of significant architectural decisions.\n",
    "docs/diagrams/README.md": "# Architecture & Sequence Diagrams\n\nMermaid and visual diagrams for system flows.\n",

    # Scripts Structure
    "scripts/development/README.md": "# Development Scripts\n\nScripts to assist with local development setup and linting.\n",
    "scripts/database/README.md": "# Database Scripts\n\nScripts for running migrations, backups, and seed data loading.\n",
    "scripts/deployment/README.md": "# Deployment Scripts\n\nScripts and Docker helpers for staging and production deployments.\n",

    # Config Structure
    "config/assumptions/README.md": "# Baseline Assumptions\n\nDefault assumptions for attendee behavior, portion sizes, and resource consumption.\n",
    "config/sustainability/README.md": "# Sustainability Factors\n\nEmission factors, waste metrics, and green scoring weights.\n",
    "config/planning/README.md": "# Planning Defaults\n\nDefault parameters for event types (Tech Fest, Hackathon, Cultural Fest, etc.).\n",

    # GitHub Actions Workflows
    ".github/workflows/.gitkeep": "",

    # Frontend Structure
    "frontend/public/.gitkeep": "",
    "frontend/src/assets/.gitkeep": "",
    "frontend/src/components/common/.gitkeep": "",
    "frontend/src/components/layout/.gitkeep": "",
    "frontend/src/components/event/.gitkeep": "",
    "frontend/src/components/planning/.gitkeep": "",
    "frontend/src/components/plans/.gitkeep": "",
    "frontend/src/components/budget/.gitkeep": "",
    "frontend/src/components/sustainability/.gitkeep": "",
    "frontend/src/components/comparison/.gitkeep": "",
    "frontend/src/components/dashboard/.gitkeep": "",

    "frontend/src/pages/home/.gitkeep": "",
    "frontend/src/pages/event/.gitkeep": "",
    "frontend/src/pages/planning/.gitkeep": "",
    "frontend/src/pages/plans/.gitkeep": "",
    "frontend/src/pages/comparison/.gitkeep": "",
    "frontend/src/pages/dashboard/.gitkeep": "",

    "frontend/src/services/api/.gitkeep": "",
    "frontend/src/services/event/.gitkeep": "",
    "frontend/src/services/planning/.gitkeep": "",
    "frontend/src/services/reports/.gitkeep": "",

    "frontend/src/hooks/.gitkeep": "",
    "frontend/src/context/.gitkeep": "",
    "frontend/src/types/.gitkeep": "",
    "frontend/src/utils/.gitkeep": "",
    "frontend/src/constants/.gitkeep": "",
    "frontend/src/config/.gitkeep": "",
    "frontend/src/routes/.gitkeep": ""
}

def main():
    count_dirs = 0
    count_files = 0
    created_dirs = set()

    for file_path, content in FILES.items():
        full_path = os.path.join(BASE_DIR, file_path)
        directory = os.path.dirname(full_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            created_dirs.add(directory)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        count_files += 1

    print(f"Successfully created {count_files} files and required directories.")

if __name__ == "__main__":
    main()
