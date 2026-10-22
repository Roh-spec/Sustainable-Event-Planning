# EcoPlan UI Redesign Log: Glass Field-Station & Living Landscape

This document records the measured progress, architecture decisions, contrast audits, bundle metrics, and phase reports for the EcoPlan UI redesign.

---

## Phase 0: Baseline Metrics (Starting Point)

Recorded at commit branch: `ui/glass-redesign` (based on `main@e697a9c`).

### 1. Test & Build Suite
- **Vitest Test Suite**: 9 files, 104 passed (100% pass rate)
- **TypeScript `tsc --noEmit`**: 0 errors
- **Production Build Artifacts**:
  - `dist/assets/index-PSWItUiV.js`: **513.94 kB** (gzip: 135.88 kB)
  - `dist/assets/index-B1rGsnT1.css`: **45.96 kB** (gzip: 8.84 kB)
  - `dist/index.html`: **1.71 kB** (gzip: 0.83 kB)

### 2. Page File Sizes (`frontend/src/pages/`)
| Page Component | File Size (KB) | Raw Bytes | Notes |
| :--- | :--- | :--- | :--- |
| `BudgetPage.tsx` | 9.09 KB | 9,304 B | Ledger format |
| `CompletePlanPage.tsx` | 28.32 KB | 28,999 B | Timetable & execution checklist |
| `ConstraintsPage.tsx` | 16.50 KB | 16,899 B | Preference rows |
| `EventCreationPage.tsx` | 16.13 KB | 16,513 B | Wizard Step 1 |
| `EventsListPage.tsx` | 6.13 KB | 6,282 B | Events directory |
| `FoodPlanningPage.tsx` | **76.53 KB** | 78,369 B | Target for Phase 5a refactoring |
| `HomePage.tsx` | 15.50 KB | 15,872 B | Worked example ledger & hero |
| `NotFoundPage.tsx` | 3.39 KB | 3,476 B | 404 notebook illustration |
| `PlanComparisonPage.tsx` | 26.70 KB | 27,341 B | Multi-plan comparison |
| `PlansPage.tsx` | 22.23 KB | 22,767 B | Plan selection |
| `WastePlanningPage.tsx` | **40.53 KB** | 41,502 B | Target for Phase 5a refactoring |

### 3. Codebase Metrics
| Metric | Baseline Count | Notes / Locations |
| :--- | :--- | :--- |
| **Hex literals in `.tsx`** | 21 | 7 in `PlanCard.tsx`, 14 in `NotFoundPage.tsx` |
| **`shadow-*` utility usages** | 51 | `shadow-sm`: 21, `shadow-xs`: 13, `shadow-subtle`: 7, `shadow-notebook`: 7, `shadow-lg`: 2, `shadow-notebook-lg`: 1 |
| **`rounded-*` utility usages** | 260 | `rounded-control`: 147, `rounded-full`: 58, `rounded-sheet`: 53, `rounded-b-*`: 2 |
| **`Sparkles` icon imports** | 8 | Used as decorative element across 8 files |
| **`document.title` coverage** | 5 / 11 pages (45%) | Missing on Home, EventCreation, Budget, Constraints, Food, Waste |

---

## Decisions Log
- **D001**: Baseline measured prior to any Phase 1 token modifications to establish strict regression boundaries.
- **D002**: Retain backward-compatible color aliases (`paper`, `ink`, `moss`, `clay`, `line`) in Tailwind config wired to CSS variables to prevent breakages across child components during progressive rollout.

---

## Out of Scope Observations
- Fastify/FastAPI backend has CORS and dev proxy configured on `/api/v1`; when backend is stopped during frontend unit tests, Vitest mocks cleanly isolate API surfaces.
- Future work could explore code-splitting calculation utilities from wizard pages to further shrink chunk size.
