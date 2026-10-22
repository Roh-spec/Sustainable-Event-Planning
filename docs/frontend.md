# Frontend Architecture & Planning Workflow Documentation (Phase 3B)

## 1. Overview
The Frontend for the **AI-Based Sustainable Event Planning Assistant** provides an intuitive, guided multi-step wizard empowering event organizers to generate, compare, and select practical event plans that reduce environmental impact while strictly honoring budgets, requirements, and constraints.

The frontend is built with **React 18**, **TypeScript 5.6**, **Vite 5.4**, and **Tailwind CSS 3.4**, communicating directly with the backend FastAPI modular monolith over a centralized REST client.

---

## 2. Architecture & Directory Structure

The frontend adheres to a modular design separating API communication, domain types, reusable layout/wizard components, and routed pages:

```
frontend/
├── src/
│   ├── api/                     # Centralized API service layer
│   │   ├── client.ts            # Fetch wrapper with ApiError, unwrapping Pydantic 422s
│   │   ├── events.ts            # Event CRUD endpoints
│   │   ├── food.ts              # Food planning API integration
│   │   ├── waste.ts             # Waste planning API integration
│   │   ├── planning.ts          # Planning engine & plan selection endpoints
│   │   └── assumptions.ts       # Assumption inspection endpoints
│   ├── components/              # Modular UI components
│   │   ├── layout/              # Header, Footer, MainLayout
│   │   ├── wizard/              # WizardProgress, EventSummaryBanner
│   │   ├── sustainability/      # ExplainableMetric (collapsible "Why?" provenance drawer)
│   │   └── planning/            # PlanCard, InfeasibleBudgetAlert, PlanSelectionModal
│   ├── context/                 # State management
│   │   └── PlanningWizardContext.tsx # Multi-step wizard state with sessionStorage persistence
│   ├── pages/                   # Routed view components
│   │   ├── HomePage.tsx         # Landing view with CTA to new event
│   │   ├── EventsListPage.tsx   # Overview of planned events
│   │   ├── EventCreationPage.tsx# Step 1: Event baseline
│   │   ├── BudgetPage.tsx       # Step 2: Maximum budget specification
│   │   ├── ConstraintsPage.tsx  # Step 3: Constraint builder (Required, Preferred, etc.)
│   │   ├── FoodPlanningPage.tsx # Step 4: Meal configuration & participation
│   │   ├── WastePlanningPage.tsx# Step 5: Packaging & plastic waste configuration
│   │   ├── PlansPage.tsx        # Step 6: Generated plan alternatives
│   │   ├── PlanComparisonPage.tsx# Side-by-side trade-off matrix
│   │   └── NotFoundPage.tsx     # 404 handler
│   ├── routes/                  # React Router declarative routing definitions
│   │   └── index.tsx
│   ├── test/                    # Vitest & React Testing Library test suites
│   ├── types/                   # TypeScript domain contracts matching backend schemas
│   │   ├── assumptions.ts
│   │   ├── budget.ts
│   │   ├── constraints.ts
│   │   ├── events.ts
│   │   ├── food.ts
│   │   ├── planning.ts
│   │   └── waste.ts
│   ├── App.tsx                  # App shell
│   ├── main.tsx                 # Entrypoint
│   └── index.css                # Tailwind directives & design tokens
```

---

## 3. Routes & Guided Wizard Flow

The application provides a continuous, guided wizard workflow. The user is guided step-by-step without needing to understand backend module internals:

| Step | Route | Purpose | Key User Actions |
|---|---|---|---|
| — | `/` | Home Landing | Start a new event plan or view existing events |
| — | `/events` | Events List | Browse existing events and continue planning |
| 1 | `/events/new` | Event Creation | Set Event Name, Target Type, Attendees, Duration, Location, Date |
| 2 | `/events/:eventId/budget` | Budget | Define Maximum Event Budget and Currency (default ₹ / INR) |
| 3 | `/events/:eventId/constraints` | Constraints | Add Required, Preferred, Not Allowed, and Flexible constraints |
| 4 | `/events/:eventId/food` | Food Planning | Configure meals, dietary splits, and unit/total costs |
| 5 | `/events/:eventId/waste` | Waste Planning | Set packaging reusable/single-use splits and plastic items |
| 6 | `/events/:eventId/plans` | Plan Results | Inspect up to 3 generated plans (Budget, Balanced, Sustainable) |
| — | `/events/:eventId/compare` | Plan Comparison | Side-by-side comparative table with trade-off analysis |

### Wizard Navigation & State Preservation
- **Non-Destructive Navigation:** Users can use `Back` and `Next` buttons or click any completed step in the `WizardProgress` bar.
- **Session Persistence:** All entered form data across steps is saved in `sessionStorage` via `PlanningWizardContext`, preventing data loss on accidental reloads or backwards navigation.
- **Context Banner:** An `EventSummaryBanner` displays the event name, attendee count, duration, and current budget across all subsequent steps.

---

## 4. API Integration & Backend Synchronization

The frontend interacts with the FastAPI backend using exact Pydantic-compliant request and response payloads:

1. **`POST /api/v1/events`**: Creates the event baseline record.
2. **`POST /api/v1/planning/generate`**: Submits `PlanningRequest` containing:
   - `event_id`: UUID
   - `budget`: Maximum budget amount and currency
   - `constraints`: Array of `ConstraintBase` objects
   - `module_context`: Object containing `food` (`FoodPlanRequest`) and `waste` (`WastePlanRequest`) payloads
   - `allow_budget_increase`: Boolean flag
   - `max_approved_budget`: Optional float
3. **Response Handling:**
   - `status: "COMPLETE"` / `"PARTIAL"`: Renders generated candidates (up to 3: Budget-Focused, Balanced, Sustainability-Focused).
   - `status: "INFEASIBLE_BUDGET"`: Renders `InfeasibleBudgetAlert` showing the minimum feasible budget and deficit, allowing the user to explicitly approve a budget revision.
4. **`POST /api/v1/plans`**: Used for plan persistence. When deferred or session-scoped, the frontend transparently presents the session-selected plan without fabricating fake database records.

---

## 5. Measurable Sustainability & Explainability

### No Fake Scores
In accordance with core project principles, the frontend **never fabricates arbitrary scores** (e.g., "87/100"). All sustainability indicators are concrete, physical, and measurable:
- **Estimated Food Waste (kg)**
- **Single-Use Packaging Items**
- **Reusable Packaging Items**
- **Plastic Waste Items**
- **Total Estimated Cost vs. Budget Balance**

### Honest Null/Unavailable Representation
If a metric is not returned or cannot be computed due to missing assumptions, the UI displays **"Not available"** or **"Not estimated"**. It **never coerces `null` or `undefined` into `0`**, ensuring organizers are not misled.

### Explainability ("Why this estimate?")
The `ExplainableMetric` component offers a collapsible breakdown of any metric or recommendation:
- **Estimated Value & Physical Unit**
- **Parameter Name**
- **Source Type:** `EVENT_SPECIFIC`, `GLOBAL`, `ESTIMATED`, `CALCULATED`, or `USER_OVERRIDE`
- **Underlying Calculation / Rule**

---

## 6. Plan Comparison & Selection

### Side-by-Side Comparison
The `/events/:eventId/compare` view aggregates all candidate plans into a structured comparison matrix:
- **Financial Dimension:** Total Cost, Budget Margin/Deficit.
- **Environmental Dimension:** Food Waste (kg), Single-Use Items, Reusable Items, Plastic Items.
- **Constraint Satisfaction:** Hard requirements satisfied, soft preferences relaxed.
- **Key Trade-Offs:** Direct statements answering *"What do I gain if I spend more?"*

### Explicit Plan Selection
Plan selection is an explicit, intentional organizer decision:
1. Clicking **"Select Plan"** opens a confirmation modal detailing the selected plan's financial and ecological commitments.
2. Confirming persists the selection to the active wizard session.
3. The selected plan is badged across comparison and plan overview views.

---

## 7. Scope Boundaries

### CURRENT (Phase 3B — Implemented & Active)
- Event Baseline & Target Event Types (Tech Fest, Cultural Fest, Hackathon, Workshop, Conference, etc.)
- Event Budget (INR ₹ default) & Infeasible Budget Deficit Handling
- Multi-tier Constraint Builder (Required, Preferred, Not Allowed, Flexible)
- Food Planning (Meal types, vegetarian/non-vegetarian splits, unit/total costs, assumption fallbacks)
- Waste Planning (Reusable vs. single-use packaging, plastic items, other waste categories)
- Planning Engine Orchestration (`POST /api/v1/planning/generate`)
- Multi-candidate Plan Cards (Budget-Focused, Balanced, Sustainability-Focused)
- Side-by-Side Plan Comparison Matrix
- Honest Explainability Drawers ("Why this estimate?")
- Explicit Plan Selection Workflow

### EXPLICITLY OUT OF SCOPE / FUTURE EXTENSIONS
The following modules are strictly deferred to future project phases and have no frontend mockups or fake implementations:
- **Paper Waste:** Waitlisted.
- **Energy Module:** Power grids, generators, lighting loads.
- **Transport Module:** Commute emissions, shuttle routes, vehicle fleets.
- **Venue Module:** Room thermal models, capacity optimizations.
- **Carbon Calculations:** Scope 1, 2, 3 carbon accounting.
- **Sensors / IoT / Water Waste:** Hardware monitoring and smart bin telemetry.
- **Vendor Marketplace:** B2B supplier contracting.
- **Machine Learning / External AI APIs:** Live LLM chat agents or OR-Tools solvers.
- **PDF Report Generation:** Document export engines.

---

## 8. Shared Field-Station Design System Components (Phase 3)

The interface is styled as a **glass field-station over a living landscape**, balancing airy frosted glass floating panels with strict physical ledger rules.

### Component Catalogue

#### 1. `GlassPanel`
- **Location:** `src/components/common/GlassPanel.tsx`
- **Purpose:** Wraps `.glass` (~0.62 opacity) or `.glass-strong` (~0.78 opacity for text/forms) with `-webkit-backdrop-filter`, light-edge highlights, and solid surface fallbacks.
- **Usage Example:**
  ```tsx
  import { GlassPanel } from "../components/common/GlassPanel";

  <GlassPanel variant="strong" className="p-6 max-w-md">
    <h3 className="font-display text-lg text-ink">Field Estimate</h3>
    <p className="text-sm text-ink-muted">Refracting living landscape backdrop.</p>
  </GlassPanel>
  ```

#### 2. `Stamp`
- **Location:** `src/components/common/Stamp.tsx`
- **Purpose:** Physical status confirmation marks with authentic angle (-2deg) and high-contrast borders. Supports `thump` micro-moment animation.
- **Variants:** `moss` (verified/recommended), `clay` (over-budget/deficit), `faint` (neutral/metadata).
- **Usage Example:**
  ```tsx
  import { Stamp } from "../components/common/Stamp";

  <Stamp variant="moss" thump>RECOMMENDED</Stamp>
  <Stamp variant="clay">OVER BUDGET</Stamp>
  ```

#### 3. `LedgerTable` & `LedgerRow`
- **Location:** `src/components/common/LedgerTable.tsx`
- **Purpose:** Strict tabular figures with dotted leader lines, double-rule totals, and hero numeral scale contrast.
- **Usage Example:**
  ```tsx
  import { LedgerTable, LedgerRow } from "../components/common/LedgerTable";

  <LedgerTable title="Event Budget Allocation" badge="VERIFIED">
    <LedgerRow label="Food Surplus Averted" value="-26" unit="kg" deltaType="moss" isHero />
    <LedgerRow label="Single-Use Items" value="90" unit="items" />
    <LedgerRow label="Committed Total" value="₹46,800" isTotal />
  </LedgerTable>
  ```

#### 4. `MarginNote`
- **Location:** `src/components/common/MarginNote.tsx`
- **Purpose:** Restrained field marginalia rendered in Caveat handwriting with pen mark or stamp. Limit: 1-2 per page.
- **Usage Example:**
  ```tsx
  import { MarginNote } from "../components/common/MarginNote";

  <MarginNote label="Organizer Note" type="note">
    Eliminated 530 single-use items by allocating ₹4,300 to reusable steel thalis.
  </MarginNote>
  ```

#### 5. `Receipt`
- **Location:** `src/components/common/Receipt.tsx`
- **Purpose:** Physical checkout estimate card featuring monospace item rows, double-rule total, and authentic torn-edge SVG bottom.
- **Usage Example:**
  ```tsx
  import { Receipt } from "../components/common/Receipt";

  <Receipt
    title="LIVE WASTE RECEIPT"
    receiptNumber="W-104"
    timestamp="14:30 IST"
    items={[
      { label: "Reusable Plates", value: "150", unit: "items" },
      { label: "Plastic Diverted", value: "18.5", unit: "kg", deltaType: "moss" },
    ]}
    summaryRow={<div className="font-bold flex justify-between"><span>Net Cost</span><span>₹12,400</span></div>}
  />
  ```

#### 6. `WaypointStepper`
- **Location:** `src/components/common/WaypointStepper.tsx`
- **Purpose:** Contour-map survey route connecting numbered waypoints with drawn SVG paths and active step highlighting.
- **Usage Example:**
  ```tsx
  import { WaypointStepper } from "../components/common/WaypointStepper";

  <WaypointStepper
    steps={[
      { id: 1, label: "Event" },
      { id: 2, label: "Budget" },
      { id: 3, label: "Plans" },
    ]}
    currentStep={2}
    onStepClick={(step) => navigate(`/step/${step.id}`)}
  />
  ```

#### 7. `RangeSlider`
- **Location:** `src/components/common/RangeSlider.tsx`
- **Purpose:** Notched physical survey slider with monospace value badge and calibrated tick markings. Accessible keyboard controls.
- **Usage Example:**
  ```tsx
  import { RangeSlider } from "../components/common/RangeSlider";

  <RangeSlider
    label="Vegetarian Ratio"
    value={vegRatio}
    min={0}
    max={100}
    step={5}
    unit="%"
    ticks={[0, 25, 50, 75, 100]}
    onChange={(val) => setVegRatio(val)}
  />
  ```

#### 8. `SegmentedToggle`
- **Location:** `src/components/common/SegmentedToggle.tsx`
- **Purpose:** Sliding segmented selector with keyboard radiogroup accessibility and high-contrast tactile feedback.
- **Usage Example:**
  ```tsx
  import { SegmentedToggle } from "../components/common/SegmentedToggle";

  <SegmentedToggle
    label="Pricing Basis"
    options={[
      { value: "PER_PERSON", label: "Per Person", sublabel: "₹/head" },
      { value: "TOTAL", label: "Fixed Package", sublabel: "₹ total" },
    ]}
    value={priceBasis}
    onChange={(val) => setPriceBasis(val)}
  />
  ```

#### 9. `EmptyState`
- **Location:** `src/components/common/EmptyState.tsx`
- **Purpose:** Dotgrid registry empty-state illustration with Newsreader title, clear explanation, and action button.
- **Usage Example:**
  ```tsx
  import { EmptyState } from "../components/common/EmptyState";

  <EmptyState
    title="No Events Found"
    description="Your field station logbook is empty. Create your first sustainable event plan."
    action={<button className="btn-primary">Plan First Event</button>}
  />
  ```

#### 10. `ErrorState`
- **Location:** `src/components/common/ErrorState.tsx`
- **Purpose:** Incident discrepancy card on dotgrid with clay status stamp and retry action.
- **Usage Example:**
  ```tsx
  import { ErrorState } from "../components/common/ErrorState";

  <ErrorState
    title="Ledger Communication Failure"
    message="Unable to reach the event calculations service. Please check network connectivity."
    onRetry={() => refetch()}
  />
  ```

#### 11. `SkeletonLines`
- **Location:** `src/components/common/SkeletonLines.tsx`
- **Purpose:** Subtle opacity-pulsing ledger lines mimicking physical paper ruling without layout shifts.
- **Usage Example:**
  ```tsx
  import { SkeletonLines } from "../components/common/SkeletonLines";

  <SkeletonLines lines={4} variant="table" />
  ```

#### 12. `Reveal`
- **Location:** `src/components/common/Reveal.tsx`
- **Purpose:** Run-once IntersectionObserver scroll reveal (20px fade-up with 6px blur to 0, 550ms outExpo). Frozen under reduced motion.
- **Usage Example:**
  ```tsx
  import { Reveal } from "../components/common/Reveal";

  <Reveal staggerIndex={1}>
    <div className="surface-sheet p-6">Revealed content</div>
  </Reveal>
  ```

