# Planning Engine Architecture

The Planning Engine is the deterministic core of the **AI-Based Sustainable Event Planning Assistant**. It orchestrates domain planning modules, enforces constraints, computes costs, and calculates sustainability scores.

---

## 🧠 Phase 2A: Assumption Engine

The **Assumption Engine** (`backend/app/planning/assumption_engine/`) serves as the foundational parameter provider for all future domain calculators (Food, Waste, Water, Energy, Materials, Transport, Venue, Carbon, and Cost Estimation).

### Core Philosophy
1. **An assumption is NOT an actual measurement**:
   - `water_per_person_per_day = 5 L/person/day` (Assumption/Reference)
   - `actual_water_used = 4300 L` (Audited post-event measurement)
   - `predicted_water_used = 4500 L` (Statistical ML prediction)
   - The system strictly preserves data provenance and never silently overwrites an assumption with an actual value, or an actual value with an ML prediction.
2. **Never Silently Invent Values**:
   - If an assumption is missing, the resolver explicitly reports it as unresolved (`is_resolved=False`). It never substitutes zero, guessing, or hallucinations.
3. **Domain Calculators Decoupled from Database**:
   - Calculators (Food, Waste, Water) do not query database tables directly. They query the `AssumptionResolver` interface.

---

## Resolution Priority & Precedence

When a domain calculator requests a parameter value for an event context:

```text
               AssumptionResolver.resolve(parameter, event_id)
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │ Search Event-Specific    │
                        │ Assumption (event_id = X)│
                        └─────────────┬────────────┘
                                      │
                         Found? ──────┴────── Not Found?
                           │                      │
                           ▼                      ▼
                ┌─────────────────────┐┌──────────────────────────┐
                │ Return with scope:  ││ Search Global Assumption │
                │ EVENT (Precedence)  ││ (event_id IS NULL)       │
                └─────────────────────┘└──────────┬───────────────┘
                                                  │
                                     Found? ──────┴────── Not Found?
                                       │                      │
                                       ▼                      ▼
                            ┌─────────────────────┐┌───────────────────────┐
                            │ Return with scope:  ││ Return is_resolved:   │
                            │ GLOBAL              ││ FALSE (Missing)       │
                            └─────────────────────┘└───────────────────────┘
```

1. **EVENT-SPECIFIC**: If defined specifically for the event (`event_id = :event_id`), it overrides global defaults.
2. **GLOBAL**: If no event-specific override exists, the global baseline (`event_id IS NULL`) is returned.
3. **MISSING**: If neither exists, the engine reports the assumption as missing with an explanatory reason.

---

## Structured Assumption Result (`ResolvedAssumption`)

The resolver returns a structured object containing complete provenance and context:
- `parameter`: The queried parameter key.
- `value`: Resolved string/numeric value (or `None`).
- `unit`: Measurement unit (e.g. `litres/person/day`, `INR/meal`).
- `source_type`: `USER_PROVIDED`, `REFERENCE`, `ASSUMED`, `ACTUAL`, or `ML_PREDICTED`.
- `category`: Domain category (`WATER`, `FOOD`, etc.).
- `confidence`: Optional confidence metric (`0.00` to `1.00`).
- `reference_notes`: Citations, guidelines, or methodology notes.
- `scope`: `GLOBAL` or `EVENT`.
- `is_resolved`: Boolean flag indicating if resolution succeeded.
- `explanation`: Human-readable explanation (e.g. *"Estimated using an event-specific assumption."*).

---

## Architecture & Layer Decoupling

```text
API Layer (routes/assumptions.py)
      │
      ▼
Service Layer (services/assumption_service.py)
      │
      ▼
Assumption Engine (planning/assumption_engine/manager.py)
      │
      ▼
SQLAlchemy Model (models/assumption.py)
      │
      ▼
PostgreSQL Database (assumptions table)
```

Domain calculators invoke `AssumptionResolver.resolve(...)` directly using database sessions, independent of HTTP or FastAPI contexts.

---

## Future ML Integration

The Assumption Engine interface is forward-compatible with ML models:
```text
Historical Event Data ──► ML Model ──► ML_PREDICTED Parameter ──► Assumption Engine ──► Planning Calculators
```
Domain calculators request assumptions through the same uniform interface without needing to know whether the resolved value originated from a heuristic, user override, or ML model.

---

## 🚀 Phase 3A: Planning Engine Foundation

The **Planning Engine** (`backend/app/planning/orchestrator/`) acts as the top-level orchestration layer for event planning. It coordinates domain modules, evaluates candidate configurations, enforces constraint hierarchies, and ranks multi-objective plan alternatives.

```text
User / Frontend
      │
      ▼
FastAPI Route (/api/v1/planning/generate)
      │
      ▼
Planning Service (services/planning_service.py)
      │
      ▼
Planning Orchestrator (planning/orchestrator/pipeline.py)
 ├── Candidate Generator (deterministic options)
 ├── Module Evaluators:
 │    ├── Food Module Adapter
 │    └── Waste Module Adapter
 ├── Cost Engine (aggregation & budget variance)
 ├── Constraint Engine (hard/soft hierarchy)
 └── Plan Ranker (multi-objective alternatives & trade-offs)
      │
      ▼
PostgreSQL / Stored Context (read-only for planning)
```

### 1. Architectural Philosophy & Separation of Concerns
- **Modular Monolith**: No microservices, no unnecessary network overhead.
- **Pure Orchestrator**: The Planning Engine **does not** compute food portions, meal costs, or waste item breakdowns directly. It delegates all domain logic to decoupled module evaluators (`FoodModuleEvaluator`, `WasteModuleEvaluator`).
- **₹0/Free-Cost Software**: 100% deterministic software algorithms. No external paid APIs, no LLM calls, no hardware sensors.
- **Stateless & Non-Destructive**: Planning candidate evaluations are calculated statelessly without introducing redundant database tables or altering approved domain models.

### 2. Candidate-Based Architecture
The planner evaluates a discrete set of legitimate candidate configurations:
- **Baseline Configuration**: Uses planner inputs and active reference assumptions.
- **High-Reusability Configuration**: Evaluates washable/reusable serviceware across packaging items.
- **Plastic-Free Configuration**: Eliminates disposable plastic items (e.g. water bottles) via bulk dispensers.
- **Comprehensive Zero-Waste Configuration**: Combines 100% reusable packaging with zero plastic.
- **Plant-Forward Menu Configuration**: Configures vegetarian menus when dietary options permit.

#### Fixed vs. Optimizable Parameters
- **STRICTLY FIXED**:
  - Expected attendees (`expected_attendees`)
  - Event duration (`duration_days`)
  - Event type (`event_type`)
  - Event location/venue
  - Serving portions per attendee (the planner **never** cuts portions to simulate budget savings)
- **OPTIMIZABLE**:
  - Packaging material selection (reusable vs. single-use)
  - Disposable plastic substitution
  - Menu composition (vegetarian ratio within allowed dietary preference)

### 3. Constraint Hierarchy & Relaxation
Constraints are categorized into a strict priority hierarchy:

#### Hard Constraints (Never Violated)
1. **NOT_ALLOWED**: Strict prohibitions (e.g., `NO_PLASTIC`, `NO_BEEF`). Any candidate violating this is marked infeasible (`feasible=False`).
2. **REQUIRED**: Mandatory requirements (e.g., `VEGAN_OPTIONS_MANDATORY`). Any candidate lacking this is marked infeasible.
3. **BUDGET**: Hard financial ceiling. If a candidate exceeds the budget, it is marked infeasible.

#### Soft Constraints (May Be Relaxed When Necessary)
4. **PREFERRED**: Desired configurations (e.g., `PREFER 100% REUSABLE`). If budget or inventory prevents satisfaction, the engine relaxes the preference and **explicitly logs the relaxation reason**.
5. **FLEXIBLE**: Adjustable parameters (e.g., `FLEXIBLE ATTENDEE BUFFER`). Adjusted as needed with full traceability.

### 4. Budget Infeasibility & User Approval
- **Deficit Detection**: If no candidate fits within the specified budget, the pipeline returns status `INFEASIBLE_BUDGET`.
- **Minimum Feasible Budget**: Calculates the minimum funding required to satisfy the cheapest configuration.
- **No Silent Budget Increases**: The system **never** silently expands budget limits. Budget increases require explicit user consent via `allow_budget_increase=True` and `max_approved_budget`.

### 5. Multi-Objective Plan Selection
Rather than relying on arbitrary percentage weights (e.g., 50% cost + 50% eco), the engine selects up to three distinct, meaningful alternatives:
1. **`BUDGET_FOCUSED`**: The lowest-cost feasible candidate.
2. **`SUSTAINABILITY_FOCUSED`**: The feasible candidate with the best measurable environmental indicators (least plastic, least packaging waste, least food waste).
3. **`BALANCED`**: A meaningful trade-off candidate balancing cost savings against significant waste reductions.

If fewer than 3 genuinely distinct alternatives exist, only unique plans are returned (no artificial duplicates).

### 6. Measurable Sustainability Indicators (No Arbitrary Scores)
The engine **strictly rejects** arbitrary 0–100 sustainability scores. All metrics reflect physical, observable quantities:
- `food_waste_servings` (servings)
- `food_waste_kg` (kg)
- `reusable_packaging_items` (items)
- `single_use_packaging_items` (items)
- `total_plastic_items` (items)

### 7. Trade-Off Explanations & Provenance
Every plan provides concrete explanations comparing it to other alternatives (e.g., *"Costs ₹3,500 more than Budget-Focused plan, but avoids 150 single-use plastic bottles."*). All estimated values preserve their provenance:
- `USER_PROVIDED`
- `ESTIMATED`
- `REFERENCE`
- `ACTUAL`
- `ML_PREDICTED`

---

## 🔮 Roadmap & Extensibility

### Current Implementation (Phase 3A)
- Planning Engine foundation and orchestration pipeline.
- Food Module Adapter (`FoodModuleEvaluator`).
- Waste Module Adapter (`WasteModuleEvaluator`).
- Cost Engine (`CostCalculator`).
- Constraint Engine (`ConstraintEvaluator`).
- REST API endpoint: `POST /api/v1/planning/generate`.

### Future Extensions
- **Phase 3B**: OR-Tools formal multi-objective Pareto optimization.
- **Phase 4**: Future domain modules (Energy, Materials, Transport, Venue, Carbon, Vendors).
- **Phase 5**: Machine Learning prediction of attendance attrition and waste generation.

### Explicitly Out of Scope
- **Water Waste / Monitoring**: Water planning and IoT sensor functionality are deferred to later phases.
- **Hardware / IoT Sensors**: No physical sensor integration or real-time IoT feeds.
- **Paid Third-Party APIs**: Zero external commercial API dependencies.

