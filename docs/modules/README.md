# Domain Planning Modules

This directory contains specifications and documentation for each domain-specific planning module in the **AI-Based Sustainable Event Planning Assistant**.

---

## 🍽️ Food Planning Module (`backend/app/planning/modules/food/`)

The Food Planning Module calculates meal requirements, portion counts, catering costs, and potential food waste for college events. It is architecturally decoupled from the database and consumes configurable parameters through the **Assumption Engine**.

### 1. Module Architecture & Decoupling
```text
FastAPI Router (routes/planning.py)
         │
         ▼
FoodPlanningService (services/food_planning_service.py)
         │  ├── Fetches Event & Budget from DB
         │  ├── Resolves assumptions via AssumptionResolver
         │  └── Fetches event constraints
         ▼
FoodCalculator (planning/modules/food/calculator.py)
         │  ├── Pure deterministic calculation (Zero DB access)
         │  ├── Servings estimation
         │  ├── Cost estimation (Approaches A, B, C)
         │  └── Waste estimation (Servings & Kg)
         ▼
FoodRulesEngine (planning/modules/food/rules.py)
         │  ├── Constraint evaluation (Vegetarian-only, Budget limit)
         │  └── Rule-based recommendations
         ▼
Standardized Output (FoodPlanResponse)
```

---

### 2. Assumption Parameters & Units

All heuristics are resolved via the Assumption Engine using precedence:
$$\text{EVENT-SPECIFIC} \longrightarrow \text{GLOBAL} \longrightarrow \text{MISSING (Explicit)}$$

| Parameter Key | Category | Unit | Purpose |
| :--- | :--- | :--- | :--- |
| `meal_participation_rate_{meal_type}` | `FOOD` | `ratio` (0.0 to 1.0) | Expected attendance ratio for specific meal (e.g. `lunch`, `dinner`) |
| `meal_participation_rate_default` | `FOOD` | `ratio` (0.0 to 1.0) | Fallback participation rate across all meal courses |
| `meal_cost_per_serving_{meal_type}` | `FOOD` | `INR/serving` | Reference catering unit price for specific meal |
| `meal_cost_per_serving_default` | `FOOD` | `INR/serving` | Fallback cost per serving when specific meal price is omitted |
| `vegetarian_ratio` | `FOOD` | `ratio` (0.0 to 1.0) | Portion ratio of vegetarian food for MIXED dietary preference |
| `food_waste_percentage` | `FOOD` | `ratio` (0.0 to 1.0) | Anticipated surplus/waste fraction (e.g. 0.12 = 12%) |
| `food_serving_weight_kg_default` | `FOOD` | `kg/serving` | Average portion weight used to convert waste servings into kilograms |

---

### 3. Calculation Formulas

#### A. Servings Estimation
For each meal $m$:
$$\text{attendees} = m.\text{attendee\_count} \text{ if provided else } \text{event.expected\_attendees}$$
$$\text{participation\_rate} = m.\text{user\_participation\_rate} \text{ if provided else } \text{resolved assumption}$$
$$\text{servings}_m = \lceil \text{attendees} \times \text{participation\_rate} \rceil \quad (\text{whole integer})$$

Dietary breakdown (for MIXED preference):
$$\text{veg\_servings} = \text{round}(\text{servings}_m \times \text{vegetarian\_ratio})$$
$$\text{non\_veg\_servings} = \text{servings}_m - \text{veg\_servings}$$

#### B. Cost Estimation Approaches
1. **Approach A (User-Provided Total)**:
   $$\text{Total Cost} = \text{known\_total\_cost}$$
   Allocated across meals proportionally by serving count.
2. **Approach B (User-Provided Unit Cost)**:
   $$\text{Total Cost} = \text{known\_unit\_cost} \times \text{quantity} \quad (\text{quantity is total servings or attendees})$$
3. **Approach C (Assumption-Based)**:
   $$\text{Meal Cost}_m = \text{servings}_m \times \text{cost\_per\_serving}_m$$
   $$\text{Total Cost} = \sum_{m} \text{Meal Cost}_m$$
   *If any meal's cost assumption is missing, total cost is reported as UNAVAILABLE.*

#### C. Budget Comparison
$$\text{Remaining Budget} = \text{food\_budget} - \text{Total Cost}$$
$$\text{is\_over\_budget} = \text{Total Cost} > \text{food\_budget}$$
$$\text{Variance Amount} = \text{Total Cost} - \text{food\_budget}$$

#### D. Potential Food Waste
$$\text{waste\_servings}_m = \text{round}(\text{servings}_m \times \text{food\_waste\_percentage}, 2)$$
$$\text{waste\_kg}_m = \text{round}(\text{waste\_servings}_m \times \text{food\_serving\_weight\_kg}, 2)$$
*If the serving weight assumption is missing, waste is reported in servings only (`status: SERVINGS_ONLY`), preserving cost and serving calculations without failing.*

---

### 4. Constraint Evaluation & Rule-Based Recommendations

- **Vegetarian-Only Mandates**: Evaluates whether any planned meal contains non-vegetarian servings. Flags `VIOLATED` if `REQUIRED` or `WARNING` if `PREFERRED`.
- **Food Budget Limits**: Verifies whether estimated costs exceed allocated funds.
- **Recommendations**:
  - `REC_FOOD_BUDGET_DEFICIT`: Directly calculated when estimated food cost exceeds allocated food budget, providing exact deficit metrics and actionable mitigation options without speculative claims.
  - `REC_FOOD_BUFFER_CALIBRATION`: Assumption-driven calibration suggestion generated only when `food_participation_attrition_buffer_rate` is resolved and meal participation rate is high relative to the configured buffer.
*(Note: Food donation redistribution and serviceware materials recommendations belong respectively to the Waste Module and Materials Module to maintain strict domain boundaries).*

---

## ♻️ Waste Planning Module (`backend/app/planning/modules/waste/`)

The Waste Planning Module provides component-level estimation of event waste streams across college events. It is stateless and decoupled from the database, executing deterministic calculations using inputs from the event, outputs consumed from the **Food Planning Module**, and assumptions resolved via the **Assumption Engine**.

### 1. Scope & Categories
The module covers 4 distinct waste streams:
1. **Food Waste**: Consumed directly from the Food Planning Module (`FoodWasteSummary`) or user-provided, supporting optional user overrides with full provenance tracking.
2. **Packaging Waste**: Component-based estimation of selected serviceware items (`Plate`, `Cup`, `Spoon`, `Fork`, `Glass`, `Other`).
3. **Plastic Waste**: Item-based estimation of specific plastic items (`Water Bottle`, `Plastic Bag`, `Wrapper`, `Plastic Cup`, `Other`).
4. **Other Waste**: Hybrid estimation supporting predefined categories (`Decorations`, `Broken Items`, `Mixed Waste`, `Food Containers`, `Other`) and custom items.

> [!IMPORTANT]
> **Paper Waste is explicitly WAITLISTED.** No paper waste calculations, schemas, or assumptions are implemented in this phase. The module architecture is designed to accommodate paper waste cleanly in a future release.

---

### 2. Architecture & Data Flow
```text
FastAPI Router (POST /api/v1/planning/waste)
         │
         ▼
WastePlanningService (services/waste_planning_service.py)
         │  ├── Fetches Event context (name, attendees)
         │  ├── Consumes Food Module output (reusing FoodPlanRequest if provided)
         │  └── Resolves waste assumptions via AssumptionResolver
         ▼
WasteCalculator (planning/modules/waste/calculator.py)
         │  ├── Pure deterministic calculation (Zero direct DB access)
         │  ├── Food waste planning value and override preservation
         │  ├── Packaging basis calculations & reusable/single-use splits
         │  ├── Plastic item estimations & participation rate overrides
         │  └── Other/custom waste item compilation
         ▼
WasteRulesEngine (planning/modules/waste/rules.py)
         │  ├── Reusable alternative recommendations (single-use packaging > 0)
         │  ├── Plastic reduction recommendations
         │  ├── Food surplus redistribution review
         │  └── Missing assumptions notification
         ▼
Standardized Output (WastePlanResponse)
```

---

### 3. Food $\to$ Waste Integration Principle
Waste calculations do not duplicate calculations already performed by the Food Module. The Waste Module consumes the food waste estimates (`estimated_waste_servings`, `estimated_waste_kg`) produced by the Food Module as its baseline:
- **Baseline Estimate**: Retained as `estimated_servings` (`ESTIMATED` source).
- **User Override**: If specified, set as `planning_servings` (`USER_PROVIDED` source) without deleting or overwriting the original estimate.
- **Planning Value**: Clearly identifies which figure is active for downstream planning.

---

### 4. Calculation Basis & Formulas

Primary units are **count/item-based** (`servings` for food, `items` for packaging, plastic, and other). No arbitrary conversion into kilograms is forced without empirical basis.

Supported calculation bases:
- **`PER_PERSON`**:
  $$\text{Total} = \text{Attendees} \times \text{Units per Person}$$
- **`PER_MEAL`**:
  $$\text{Total} = \text{Attendees} \times \text{Meals Count} \times \text{Units per Meal}$$
- **`PER_EVENT`**:
  $$\text{Total} = 1 \times \text{Units per Event}$$
- **`CUSTOM`**:
  $$\text{Total} = \text{User-Provided Quantity}$$

#### Packaging Reusable vs. Single-Use Split
$$\text{Single-Use Quantity} + \text{Reusable Quantity} = \text{Total Quantity}$$
- If not provided by user, the split is resolved via `reusable_ratio_<item>` or `single_use_ratio_<item>`.
- If no ratio assumption exists, the split remains **unresolved** (`is_split_resolved: False`) rather than fabricating precision.

---

### 5. Assumption Parameters

| Parameter Pattern | Category | Unit | Purpose |
| :--- | :---: | :---: | :--- |
| `packaging_<item>_per_person` | `WASTE` | `items/person` | Default items per attendee (e.g. `packaging_cup_per_person`) |
| `packaging_<item>_per_meal` | `WASTE` | `items/meal` | Default items per meal (e.g. `packaging_plate_per_meal`) |
| `packaging_<item>_per_event` | `WASTE` | `items/event` | Event-level quantity |
| `reusable_ratio_<item>` | `WASTE` | `ratio` | Baseline reusable portion fraction |
| `single_use_ratio_<item>` | `WASTE` | `ratio` | Baseline single-use portion fraction |
| `plastic_<item>_per_person` | `WASTE` | `items/person` | Default plastic item rate (e.g. `plastic_water_bottle_per_person`) |
| `plastic_<item>_per_meal` | `WASTE` | `items/meal` | Meal-based plastic rate (e.g. `plastic_wrapper_per_meal`) |

---

### 6. Sustainability Recommendations
- `REC_WASTE_REDUCE_SINGLE_USE_PACKAGING`: Triggered when planned single-use packaging items exist and reusable percentage $< 100\%$.
- `REC_WASTE_REDUCE_SINGLE_USE_PLASTIC`: Triggered when single-use plastic items are planned.
- `REC_WASTE_FOOD_SURPLUS_REVIEW`: Triggered when projected food surplus servings $> 0$.
- `REC_WASTE_MISSING_ASSUMPTIONS`: Triggered when required parameters are unconfigured.

---

### 7. Current Limitations & Extension Points
- **Paper Waste Waitlisted**: Paper waste tracking is planned for future phases.
- **Primary Metric Item Counts**: Waste is quantified in item counts and servings; weight (kg) is reported only when valid serving weight data exists.
- **Stateless Execution**: Calculations are not persisted to a dedicated waste table; selected plans can persist cost and waste summary metrics through the existing `Plan` / `CostItem` models.

