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

## Phase 1: Tokens and Foundations Report

### 1. Deliverables Completed
- **`palettes.css`**: Created with semantic CSS variable definitions for Palette A ("Sage Dawn", default), Palette B ("Tidepool Night", dark glass), and Palette C ("Kiln & Lagoon", light).
- **Tailwind Palette Wiring**: Configured `withOpacity` dynamic alpha helper in `tailwind.config.js`. Preserved backwards-compatible aliases (`paper`, `ink`, `moss`, `clay`, `line`) while mapping primary/accent semantic scales.
- **Glass System**: Defined `.glass` and `.glass-strong` utility classes with `-webkit-backdrop-filter`, light-edge highlights, and `@supports` / `prefers-reduced-transparency` solid fallbacks.
- **Z-Index System**: Replaced arbitrary values (`z-index: 9999`) with strict token scale: backdrop (-1), grain (5), content (0), sticky (30), header (40), modal (50), toast (60).
- **Shadow Collapse**: Pruned dead shadow classes (`shadow-xs`, `shadow-sm`, `shadow-notebook`, `shadow-notebook-lg`). Standardized to `shadow-subtle` (`--glass-shadow`) and `shadow-modal` (`--modal-shadow`).
- **Contrast Remediation**:
  - Replaced non-compliant `#78716C` with `#675F5A` for `ink-faint` across all 28 usages (5.43:1 on canvas, 5.80:1 on surface).
  - Eliminated all borderline `text-clay-600` usages in favor of compliant `text-clay-700` (`--c-accent-deep`, 5.74:1).
  - Replaced all 21 hex literals in `.tsx` with semantic Tailwind token classes.
- **Table Font Fix**: Removed blanket `table { font-family: mono }` rule in `index.css`; monospace now strictly scopes to numeric figures and kicker labels.
- **Automated Contrast Audit**: Created `frontend/scripts/check-contrast.mjs` verifying 33 required color pairs across Palettes A, B, and C plus safeguard assertions against text on non-text fills. Wired to `npm run check:contrast`.
- **Dev Palette Switcher**: Created `DevPaletteSwitcher.tsx` reading `?palette=a|b|c` and localStorage, active only in DEV mode.

### 2. Measured Post-Phase 1 Delta
| Metric | Phase 0 Baseline | Phase 1 Result | Delta |
| :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed (9 files) | 0 regressions |
| **`tsc --noEmit`** | 0 errors | 0 errors | Clean |
| **`check:contrast`** | N/A | 33 / 33 passed | 100% WCAG AA compliant |
| **Hex Literals in `.tsx`** | 21 | **0** | -21 (100% eliminated) |
| **`shadow-*` usages** | 51 (6 variants) | **23** (`shadow-subtle`: 20, `shadow-modal`: 3) | Pruned to 1 subtle + 1 modal |
| **Dead shadows outside modals** | 35 (`shadow-xs`, `shadow-sm`) | **0** | -35 (100% eliminated) |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | -0.22 kB |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | +2.93 kB (palette tokens & glass system) |

### 3. Decisions Log
- **D001**: Baseline measured prior to any Phase 1 token modifications to establish strict regression boundaries.
- **D002**: Retain backward-compatible color aliases (`paper`, `ink`, `moss`, `clay`, `line`) in Tailwind config wired to CSS variables to prevent breakages across child components during progressive rollout.
- **D003**: In Palette B (dark glass), adjusted `inkFaint` to `[134, 158, 150]` (`#869E96`) to ensure it reliably clears the 4.5:1 WCAG AA threshold on dark surfaces (yielding 4.91:1).
- **D004**: Standardized modal overlays and mobile expanding drawer sheets to `shadow-modal`, while all other elevated cards use `shadow-subtle` or hairline rules.

---

## Out of Scope Observations
- Fastify/FastAPI backend has CORS and dev proxy configured on `/api/v1`; when backend is stopped during frontend unit tests, Vitest mocks cleanly isolate API surfaces.
- Future work could explore code-splitting calculation utilities from wizard pages to further shrink chunk size.
