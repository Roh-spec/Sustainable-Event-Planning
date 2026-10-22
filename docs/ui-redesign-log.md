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

## Phase 2: Shell, Backdrop and Motion Engine Report

### 1. Deliverables Completed
- **`Backdrop.tsx` (Living Landscape)**:
  - Created `frontend/src/components/layout/Backdrop.tsx` mounted once at `MainLayout.tsx`.
  - Implemented 3 organic inline SVG paths (bezier curves, never geometric circles) tinted with palette tokens (`--c-primary`, `--c-accent`, `--c-canvas-2`), blurred 60-85px at 58-65% opacity.
  - Slow transform-only drift keyframe animations (`blobDrift1`, `blobDrift2`, `blobDrift3`) cycling over 48-68s without layout reflows.
  - Overlay: Original set of 8 nested wavy topographic contour paths with 1px stroke at 7% opacity (`rgb(var(--c-ink))`), featuring micro tabular mono elevation labels (100m, 140m, 180m, 220m).
  - Mobile handling: Viewports < 768px hide the third blob, use static blur, and disable scroll parallax.
  - Motion safeguards: Completely frozen under `prefers-reduced-motion: reduce`; hidden in print.
- **Tiled Grain Overlay**:
  - Replaced full-viewport SVG `feTurbulence` filter with a deterministic, lightweight 64x64 tiled PNG data-URI at 3% opacity at `var(--z-grain, 5)`.
  - Zero SVG filter re-rasterization during scrolling; disabled in print (`display: none !important`).
- **Glass Header & Progress Line**:
  - Updated `Header.tsx` to elevate to `glass-strong` (`backdrop-filter: blur(20px)`) after 20px scroll.
  - Replaced Lucide `Sparkles` in the header with custom `WaypointIcon`.
  - Removed top gradient reading beam from `SmoothScrollProvider.tsx`.
  - Added a 2px solid primary reading progress line (`bg-moss-700`) along the bottom edge of `Header.tsx` linked to `scrollProgress`.
- **Universal Page Titles (`usePageTitle.ts`)**:
  - Created `frontend/src/hooks/usePageTitle.ts` enforcing consistent branding.
  - Applied across all 11 pages (100% coverage, up from 45% baseline):
    - `HomePage`: "Sustainable Event Planning · EcoPlan"
    - `EventCreationPage`: "New Event · EcoPlan"
    - `BudgetPage`: "Budget & Scale · EcoPlan"
    - `ConstraintsPage`: "Constraints & Rules · EcoPlan"
    - `FoodPlanningPage`: "Food & Catering · EcoPlan"
    - `WastePlanningPage`: "Materials & Waste · EcoPlan"
    - `PlansPage`: "Plans · EcoPlan"
    - `PlanComparisonPage`: "Compare Plans · EcoPlan"
    - `CompletePlanPage`: "Complete Plan · EcoPlan"
    - `EventsListPage`: "Events Directory · EcoPlan"
    - `NotFoundPage`: "Page Not Found · EcoPlan"
- **Motion System Foundation**:
  - Created `frontend/src/utils/motion.ts` exporting `prefersReducedMotion()`, timing constants, easing curves (`outExpo`, `outCubic`, `stampSpring`), and micro-moment helpers (`triggerStampThump`).
  - Created `frontend/src/components/common/Reveal.tsx` implementing run-once IntersectionObserver (threshold 0.15) fade-up (20px) with 6px to 0 blur transition (550ms outExpo) and 60ms optional stagger.
- **Generic Motion Pruning**:
  - Removed `card-hover` lift from `EventsListPage.tsx`, `ExecutionChecklist.tsx`, `ResourceManifest.tsx`, and `SustainabilityActionsList.tsx`.
  - `card-hover` is now strictly isolated to `PlanCard.tsx`.
- **Extended Icons**:
  - Added `WaypointIcon` (diamond waypoint mark) and `ContourPinIcon` (elevation pin) to `frontend/src/components/icons/index.tsx`.

### 2. Measured Post-Phase 2 Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 Result | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | **104 passed (9 files)** | 0 regressions |
| **`tsc --noEmit`** | 0 errors | 0 errors | **0 errors** | Clean |
| **`check:contrast`** | N/A | 33 / 33 passed | **33 / 33 passed** | 100% AA compliant |
| **Page Title Coverage** | 5 / 11 (45%) | 5 / 11 (45%) | **11 / 11 (100%)** | +6 pages (Full coverage) |
| **`card-hover` Usages** | 5 files | 5 files | **1 file (`PlanCard.tsx`)** | -4 files (Pruned generic lift) |
| **`Sparkles` Imports** | 8 | 8 | **7** | -1 (Replaced in Header) |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | **518.50 kB** | +4.56 kB (Backdrop & Motion) |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | **56.57 kB** | +10.61 kB (within <= 70 KB budget) |

### 3. Decisions Log (Phase 2)
- **D005**: Implemented Backdrop organic shapes as pure inline SVG with cubic bezier paths (`d="M... C..."`) rather than CSS circles or radial gradients to give the living landscape an authentic topographical feel.
- **D006**: Generated a self-contained 64x64 grayscale PNG noise data-URI directly in `index.css`, eliminating SVG filter turbulence recalculation on mobile and low-powered GPUs during high-frequency scrolling.
- **D007**: Relocated the reading progress bar from a standalone top-of-window gradient element in `SmoothScrollProvider` to a 2px solid primary bar on the bottom edge of `Header.tsx`, resolving the anti-AI gradient ban and reinforcing the physical ledger edge aesthetic.

---

## Phase 3: Shared Components and Icons Report

### 1. Deliverables Completed
- **`GlassPanel.tsx`**: Reusable component wrapping `.glass` and `.glass-strong` with light-edge borders, inner top highlights, and solid surface fallbacks.
- **`Stamp.tsx` & Stamp Styles**: Ledger status confirmation marks (`stamp-moss`, `stamp-clay`, `stamp-faint`) with authentic -2deg rotation, high-contrast borders, and `stamp-thump` entrance animation.
- **`LedgerTable.tsx` Upgrade**: Enhanced `LedgerRow` with `isHero` numeral contrast support, dotted leader lines, and ReactNode badges.
- **`MarginNote.tsx` Upgrade**: Integrated with `Stamp`, Caveat handwriting styling, and accessible contrast borders.
- **`Receipt.tsx`**: Monospace line item summary with double-rule total, physical unit precision, and authentic torn-edge SVG bottom.
- **`WaypointStepper.tsx`**: Contour-map survey route connecting numbered waypoints with drawn SVG progress paths.
- **`RangeSlider.tsx`**: Notched physical survey slider with monospace value badge, calibrated tick marks, and keyboard accessibility.
- **`SegmentedToggle.tsx`**: Sliding segmented selector with tactile active states and radio-group keyboard navigation.
- **`EmptyState.tsx`**: Field-station empty logbook illustration on dotgrid background with Newsreader serif title.
- **`ErrorState.tsx`**: Field discrepancy card on dotgrid with clay status stamp and retry action.
- **`SkeletonLines.tsx`**: Opacity-pulsing ledger lines placeholder avoiding layout shifts and respecting reduced motion.
- **Icon Set Extended**: Added `WaypointIcon` (diamond waypoint) and `ContourPinIcon` (elevation pin) in `icons/index.tsx`.
- **Zero Sparkles Imports**: Replaced Lucide `Sparkles` across all 7 remaining files (`PlanCard.tsx`, `TimingWindowBar.tsx`, `ResourceManifest.tsx`, `CompletePlanPage.tsx`, `PlansPage.tsx`, `FoodPlanningPage.tsx`, `WastePlanningPage.tsx`) with custom semantic marks (`WaypointIcon`, `SproutIcon`, `LedgerIcon`, `PlateIcon`, `BinIcon`, `CupIcon`).
- **Documentation**: Documented all 12 shared components with import and usage examples in Section 8 of `docs/frontend.md`.
- **Component File Limits**: Every component in `frontend/src/components/common/` is strictly under 200 lines (longest is `LedgerTable.tsx` at 142 lines).

### 2. Measured Post-Phase 3 Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 | Phase 3 Result | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | 104 passed | **104 passed (9 files)** | **0 regressions** |
| **`tsc --noEmit`** | 0 errors | 0 errors | 0 errors | **0 errors** | **Clean** |
| **`check:contrast`** | N/A | 33 / 33 passed | 33 / 33 passed | **33 / 33 passed** | **100% AA compliant** |
| **Page Title Coverage** | 5 / 11 (45%) | 5 / 11 (45%) | 11 / 11 (100%) | **11 / 11 (100%)** | +6 pages (100%) |
| **`Sparkles` Imports** | 8 | 8 | 7 | **0** | **-8 (100% eliminated)** |
| **Common Components <= 200 lines** | N/A | N/A | 100% | **17 / 17 (100%)** | Max 142 lines |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | 518.50 kB | **518.32 kB** | +4.38 kB |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | 56.57 kB | **59.41 kB** | +13.45 kB (budget <= 70 KB) |

### 3. Decisions Log (Phase 3)
- **D008**: Replaced Lucide `Sparkles` with semantic icons tailored to each domain context (`CupIcon` for refreshments, `PlateIcon` for food estimation, `BinIcon` for waste calculation, `LedgerIcon` for timetable generation, and `WaypointIcon` for sustainable plan selection and route milestones).
- **D009**: Designed `Receipt` with an inline SVG torn bottom edge (`M0,0 L5,7 L10,1...`) that inherits `currentColor` over `text-paper-raised`, creating a realistic torn receipt edge without image asset dependencies.

---

## Phase 4: Home, Events List, Event Creation, 404 Report

### 1. Deliverables Completed
- **`HomePage.tsx` Redesign**:
  - Asymmetric hero grid (7 cols text / 5 cols worked example) over the living landscape backdrop.
  - Hero typographic scale contrast: Newsreader headline (`font-display text-4xl sm:text-5xl lg:text-6xl`) with tiny JetBrains Mono kickers (`label-kicker`).
  - Staggered entrance animations via `Reveal` (`delay={60}`, `delay={120}`).
- **`HomeWorkedExample.tsx`**:
  - Encapsulated 150-person hackathon worked case study in a floating `GlassPanel` (`variant="strong"`).
  - Strictly conditional phrasing ("would eliminate", "food surplus that would be averted").
  - Mathematical minus sign (`−`, `\u2212`) throughout: `−26 kg` hero counter and `8 kg (−26)` low-waste comparison.
  - Authentic double-ruled total spend line (`double-rule-top double-rule-bottom`).
  - Caveat handwritten organizer margin note.
- **`HomeWorkflowRoute.tsx`**:
  - Field-station guided survey route displaying 6 sequential ledger steps.
  - Connected with `.route-draw` horizontal rule on desktop (drawn line animation) and vertical timeline on mobile.
  - Custom domain marks (`HackathonMark`, `ScaleIcon`, `SproutIcon`, `PlateIcon`, `BinIcon`, `LedgerIcon`).
- **Recent Events Ledger on Solid Surface**:
  - Solid surface ledger rows (`surface-sheet divide-y divide-line/60`) with mono IDs, attendees, durations, and budget ceilings.
  - Strictly **ZERO glass inside lists**.
  - Integrated `EmptyState` ("The ledger desk is clear"), `ErrorState`, and `SkeletonLines`.
- **`EventsListPage.tsx` Directory Redesign**:
  - Replaced generic card grid with an authentic tabular ledger directory.
  - Clean metadata chips (mono IDs, attendees, days, budget ceiling in ₹).
  - Wired `EmptyState` and `ErrorState` components.
  - 100% responsive down to 360px viewport.
- **`EventCreationPage.tsx` & `EventTypeTiles.tsx`**:
  - Extracted format selector into `EventTypeTiles.tsx` featuring 8 illustrated format tiles with custom marks (`HackathonMark`, `CulturalMark`, `WorkshopMark`, `ConferenceMark`, `SportsMark`, `SocialMark`) and active selection states.
  - Synchronized accessible native `<select>` preserving all `getByLabelText` queries.
  - Ruled sections (Section A: Identity & Format, Section B: Scale & Attendance, Section C: Venue & Logistics) on solid surface (`bg-paper-raised`).
  - Page file shrunk from 16.51 KB (445 lines) to 8.11 KB (212 lines).
- **`NotFoundPage.tsx` Custom 404 Notebook**:
  - Field notebook illustration with center spine, ruled leaves, dog-ear fold, and sprout bookmark.
  - Added `Stamp` with `variant="clay"` ("404 UNCHARTED").
  - Dotgrid background with accessible return actions.
- **Rule Draw Motion**:
  - Added `.rule-draw` and `.route-draw` (transform-only `scaleX(0)` to `scaleX(1)`, 500-700ms outExpo) in `index.css` with `prefers-reduced-motion` override.

### 2. Measured Post-Phase 4 Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 | Phase 3 | Phase 4 Result | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | 104 passed | 104 passed | **104 passed (9 files)** | **0 regressions** |
| **`tsc --noEmit`** | 0 errors | 0 errors | 0 errors | 0 errors | **0 errors** | **Clean** |
| **`check:contrast`** | N/A | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | **33 / 33 passed** | **100% AA compliant** |
| **Glass inside Lists** | N/A | N/A | N/A | N/A | **0 (Strictly solid)** | **Enforced** |
| **Hex literals in `.tsx`** | 21 | 0 | 0 | 0 | **0** | **-21 (Clean)** |
| **`Sparkles` Imports** | 8 | 8 | 7 | 0 | **0** | **-8 (Clean)** |
| **HomePage Size** | 15.87 KB (357 lines) | 15.87 KB | 15.87 KB | 15.87 KB | **8.15 KB (190 lines)** | -7.72 KB (-49%) |
| **EventCreationPage Size** | 16.51 KB (445 lines) | 16.51 KB | 16.51 KB | 16.51 KB | **8.11 KB (212 lines)** | -8.40 KB (-51%) |
| **EventsListPage Size** | 6.28 KB (159 lines) | 6.28 KB | 6.28 KB | 6.28 KB | **6.85 KB (178 lines)** | +0.57 KB (ledger rows) |
| **NotFoundPage Size** | 3.48 KB (79 lines) | 3.48 KB | 3.48 KB | 3.48 KB | **3.67 KB (111 lines)** | +0.19 KB |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | 518.50 kB | 518.32 kB | **522.43 kB** | +8.49 kB |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | 56.57 kB | 59.41 kB | **60.02 kB** | +14.06 kB (budget <= 70 KB) |

### 3. Decisions Log (Phase 4)
- **D010**: Extracted `HomeWorkedExample.tsx`, `HomeWorkflowRoute.tsx`, and `EventTypeTiles.tsx` into dedicated, typed subcomponents to uphold the component size limit (< 200 lines) and ensure page files stay thin and modular (< 15 KB).
- **D011**: Converted the Events Directory from multi-column floating cards to clean ledger rows on solid paper with 1px hairline rules, strictly adhering to the architectural invariant that glass is never placed inside scrolling lists or table rows.
- **D012**: Replaced all hyphens in numeric differences with the true mathematical minus sign (`−`, unicode `\u2212`) across worked example ledgers.

---

## Phase 5a: Page Split (Pure Refactor) Report

### 1. Deliverables Completed
- **`FoodPlanningPage.tsx` Modularization** (shrunk from 78.48 KB / 1,496 lines to 8.83 KB / 212 lines):
  - **`foodPlanningHelpers.tsx`**: Static meal definitions, parameter label mappings, and formatting helpers.
  - **`MealSelectionSection.tsx`**: Multi-day tabs, meal card selection with visual indicators, and scheduled meal tags.
  - **`DietaryPreferenceSection.tsx`**: Strict dietary radio options, custom dietary tags, and vegetarian proportion slider.
  - **`FoodBudgetSection.tsx`**: Catering budget mode toggles (calculated estimates vs explicit budget caps).
  - **`FoodCustomizationSection.tsx`**: Accordion customization section for meal attendance and meal-specific pricing.
  - **`FoodCalculationSection.tsx`**: Calculation trigger, 3 primary physical unit metric cards (Total Food kg, Food Waste kg, Catering Budget ₹), domain recommendations, and constraint alerts.
  - **`FoodExplainableSection.tsx`**: Accordion explainable drawer detailing formulas, per-person rates, safety buffers, and estimation assumptions.
  - **`useFoodPlanningState.ts`**: Pure custom hook managing local state, calculations, API sync, wizard state preservation, and navigation.
- **`WastePlanningPage.tsx` Modularization** (shrunk from 41.58 KB / 816 lines to 6.98 KB / 174 lines):
  - **`wastePlanningHelpers.ts`**: Waste category definitions, default items, unit formatters, and parameter mappings.
  - **`WasteCategorySelector.tsx`**: Waste streams selector (Food, Disposable, Plastic, Other) with attendance summary and estimate CTA.
  - **`WasteResultsSection.tsx`**: 4 primary physical unit metric cards (Total Waste kg, Landfill kg, Recycled kg, Compost kg), itemized waste category ledgers with physical unit rates, and domain recommendations.
  - **`WasteExplainableSection.tsx`**: Field methodology accordion with event benchmark baselines, calculation methods, and transparency notes.
  - **`useWastePlanningState.ts`**: Pure custom hook managing category selections, calculation requests, wizard synchronization, and step navigation.
- **Strict Invariants Maintained**:
  - **0 test modifications**: All 104 Vitest unit/integration tests pass unmodified (`food_planning.test.tsx` 21/21, `waste_planning.test.tsx` 14/14).
  - **0 DOM/visual deviations**: All IDs, ARIA labels, roles, and text nodes remain strictly identical.
  - **Strict size targets achieved**: Both pages are well under the 15 KB target (< 9 KB each).

### 2. Measured Post-Phase 5a Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5a Result | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | 104 passed | 104 passed | 104 passed | **104 passed (9 files)** | **0 regressions** |
| **`tsc --noEmit`** | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | **0 errors** | **Clean** |
| **`check:contrast`** | N/A | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | **33 / 33 passed** | **100% AA compliant** |
| **FoodPlanningPage Size** | 78.48 KB (1,496 lines) | 78.48 KB | 78.48 KB | 78.48 KB | 78.48 KB | **8.83 KB (212 lines)** | **-69.65 KB (-89%)** |
| **WastePlanningPage Size** | 41.58 KB (816 lines) | 41.58 KB | 41.58 KB | 41.58 KB | 41.58 KB | **6.98 KB (174 lines)** | **-34.60 KB (-83%)** |
| **Page Size Target (< 15 KB)** | 0 / 2 passed | 0 / 2 | 0 / 2 | 0 / 2 | 0 / 2 | **2 / 2 passed (100%)** | **Both < 9 KB** |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | 518.50 kB | 518.32 kB | 522.43 kB | **526.10 kB** | +12.16 kB |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | 56.57 kB | 59.41 kB | 60.02 kB | **60.02 kB** | +14.06 kB (budget <= 70 KB) |

### 3. Decisions Log (Phase 5a)
- **D013**: Separated logic and presentation for both wizard pages into dedicated custom hooks (`useFoodPlanningState`, `useWastePlanningState`) and step section subcomponents under `components/planning/food/` and `components/planning/waste/`. This isolates business logic for calculation workflows from UI markup, making Phase 5b's restyling targeted and safe.
- **D014**: Retained 100% of existing ARIA role attributes, test IDs, and form field bindings without modification, ensuring zero test churn and total backward compatibility with the existing test suite.

---

## Phase 5b: Budget, Constraints, Food, Waste Report

### 1. Deliverables Completed
- **`BudgetPage.tsx` Restyle**:
  - Integrated `Stamp` (`variant="clay"` with authentic thump entrance) for over-ceiling deficit indicators.
  - Connected `SegmentedToggle` for currency selection (INR, USD, EUR) while maintaining accessible fallbacks.
  - Implemented mathematical minus sign (`−`, `\u2212`) across remaining budget and deficit indicators.
  - Added live regions (`aria-live="polite"`) to announce real-time variance and remaining balance changes.
- **`ConstraintsPage.tsx` Pattern-Coded Rule Directives**:
  - Distinct border pattern hierarchy: Must Have (solid, moss), Avoid (thick solid, clay), Would Be Nice (dashed, moss-muted), Flexible (dotted, ink-muted).
  - Special requirements ledger on solid surface with 1px hairline rules (`divide-y divide-line/60`).
  - Optimization priority cards (Save Money, Balanced, Reduce Waste) with keyboard radio-group semantics and visible focus rings.
- **`FoodPlanningPage.tsx` & `FoodLiveReceipt.tsx` Glass Restyle**:
  - Desktop sticky live receipt upgraded to `GlassPanel` (`variant="strong"`), sitting at `top-20` on desktop.
  - Mobile bottom live receipt upgraded to expanding glass bottom sheet with smooth accordion details drawer.
  - Added bottom padding (`pb-28 sm:pb-32 lg:pb-8`) ensuring **zero overlap** with form inputs and navigation buttons at any viewport width from 360px to 1440px.
  - Integrated `RangeSlider` into `DietaryPreferenceSection.tsx` with calibrated ticks and real-time vegetarian ratio readout.
  - Added live regions (`aria-live="polite"`) on updating cost and surplus totals.
- **`WastePlanningPage.tsx` & `WasteLiveReceipt.tsx` Glass Restyle**:
  - Upgraded desktop sticky live receipt with `GlassPanel` and mobile expanding glass bottom bar with zero form overlap.
  - Replaced generic icons in `WasteCategorySelector.tsx` with handcrafted domain marks (`PlateIcon`, `TrayIcon`, `BottleIcon`, `BagIcon`).
  - Added live regions (`aria-live="polite"`) on total planned items and reusable percentage tallies.
  - Verified responsive rendering down to 360px via browser subagent (`waste_page_mobile_1792650622784.png`).

### 2. Measured Post-Phase 5b Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5a | Phase 5b Result | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | 104 passed | 104 passed | 104 passed | 104 passed | **104 passed (9 files)** | **0 regressions** |
| **`tsc --noEmit`** | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | **0 errors** | **Clean** |
| **`check:contrast`** | N/A | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | **33 / 33 passed** | **100% AA compliant** |
| **Receipt Overlap** | N/A | N/A | N/A | N/A | N/A | N/A | **0 overlap (360-1440px)** | **Verified** |
| **Custom Marks in Waste** | 0 | 0 | 0 | 0 | 0 | 0 | **4 / 4 categories** | **Custom marks** |
| **RangeSlider in Use** | 0 | 0 | 0 | 1 | 1 | 1 | **2 (Food & Common)** | **Integrated** |
| **SegmentedToggle in Use** | 0 | 0 | 0 | 1 | 1 | 1 | **2 (Budget & Common)** | **Integrated** |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | 518.50 kB | 518.32 kB | 522.43 kB | 526.10 kB | **527.76 kB** | +13.82 kB |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | 56.57 kB | 59.41 kB | 60.02 kB | 60.02 kB | **60.17 kB** | +14.21 kB (budget <= 70 KB) |

### 3. Decisions Log (Phase 5b)
- **D015**: Styled mobile live receipts as expandable bottom glass bars (`glass-strong` with backdrop blur) and added generous page bottom clearance (`pb-28 sm:pb-32 lg:pb-8`) across wizard steps 4 and 5 so the fixed mobile receipt never covers form fields or navigation buttons on any mobile screen.
- **D016**: Replaced generic Lucide icons in the waste stream selector with handcrafted domain marks (`PlateIcon` for food waste, `TrayIcon` for disposables, `BottleIcon` for plastic, `BagIcon` for other materials) to maintain the field-station ledger identity.
- **D017**: Extended `RangeSlider` with `customReadout` and `tickLabels` to allow rich composite labels (e.g. `80% Vegetarian • 20% Non-Vegetarian`) while preserving standard range input semantics for testing and accessibility.

---

## Phase 6: Plans, Comparison, Complete Plan Report

### 1. Deliverables Completed
- **`DumbbellChart.tsx`**:
  - Handcrafted inline-SVG dumbbell chart plotting physical spend versus waste / circularity trade-offs.
  - Clay node for spend/cost burden (`fill-clay-700 stroke-paper-raised`).
  - Moss node for circularity / waste diversion (`fill-moss-700 stroke-paper-raised`).
  - Monospace delta label (`font-mono tabular-nums text-ink-muted`) indicating exact budget variance and disposable item counts.
  - Zero hardcoded colors; respects palette tokens and reduced-motion.
- **`PlanCard.tsx` Restyle**:
  - Integrated `DumbbellChart` for spend vs circularity trade-off visualization.
  - Selection indicator uses authentic verification `Stamp` with thump entrance (`<Stamp variant="moss" thump>Selected</Stamp>`).
  - Zero gradients remain; maintains physical units and full test compatibility.
- **`PlanComparisonPage.tsx` Comparison Ledger**:
  - Solid surface ledger table on `bg-paper-raised` with 1px rules.
  - Recommended column raised on glass (`glass-strong border-t-4 border-t-moss-800 border-x border-moss-700/30 shadow-subtle z-10`) with `Stamp` badge ("Recommended" / "Selected").
  - Physical Spend vs. Circularity Dumbbell Chart row integrated across all evaluated alternatives.
  - Mobile swipeable stacked layout (`flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-none`) cleanly readable down to 360px viewport without page overflow.
- **`CompletePlanPage.tsx` Clean Field-Station Output**:
  - Completely removed icon-in-colored-square anti-pattern at lines ~527 and ~704, replacing them with clean unboxed line artwork on dotgrid empty sheets while preserving all test expectations.
  - Timetable rendered with printed-schedule hairline spine (`border-l-2 border-line ml-3 sm:ml-4`) and monospace times (`font-mono tabular-nums font-bold text-ink`).
  - Operational checklist featuring interactive task completion with animated SVG checkmark tick draw (`checklist-tick`).
  - Clean black-on-white print styles: `@media print` rules ensure zero backdrop blur, zero glass, zero grain, solid black borders, and clean printer-friendly layout with `print:hidden` controls.
- **Gradient Verification**:
  - Verified `grep -rn gradient src` strictly matches only the two allowed utility patterns in `index.css` (`repeating-linear-gradient` for lined ledger and `radial-gradient` for dotgrid). Zero gradient classes or inline gradients in `.tsx`.

### 2. Measured Post-Phase 6 Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5a | Phase 5b | Phase 6 Result | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | 104 passed | 104 passed | 104 passed | 104 passed | 104 passed | **104 passed (9 files)** | **0 regressions** |
| **`tsc --noEmit`** | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | **0 errors** | **Clean** |
| **`check:contrast`** | N/A | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | **33 / 33 passed** | **100% AA compliant** |
| **Gradients in Codebase** | 3 | 2 | 2 | 2 | 2 | 2 | 2 | **2 (CSS definitions only)** | **-1 (PlanCard removed)** |
| **Icon-in-Box Anti-Patterns** | 2 | 2 | 2 | 2 | 2 | 2 | 2 | **0 (Eliminated)** | **-2 (100% eliminated)** |
| **DumbbellChart in Use** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **2 (PlanCard & Comparison)** | **Created & Integrated** |
| **Printed Spine Schedule** | No | No | No | No | No | No | No | **Yes (EventTimetable)** | **Implemented** |
| **Checklist Tick Animation** | Basic | Basic | Basic | Basic | Basic | Basic | Basic | **Yes (`checklist-tick`)** | **Implemented** |
| **JS Bundle Size** | 513.94 kB | 513.72 kB | 518.50 kB | 518.32 kB | 522.43 kB | 526.10 kB | 527.76 kB | **532.26 kB** | +18.32 kB |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | 56.57 kB | 59.41 kB | 60.02 kB | 60.02 kB | 60.17 kB | **61.71 kB** | +15.75 kB (budget <= 70 KB) |

### 3. Decisions Log (Phase 6)
- **D018**: Extracted `DumbbellChart.tsx` as a standalone SVG component plotting spend vs. circularity with explicit mathematical deltas (over/under budget ceiling and disposable item count). In legend items, kept percentage values within parent text strings (`Spend (60%)`, `Circularity (70%)`) to avoid isolated percentage nodes interfering with query selectors in tests.
- **D019**: Designed the side-by-side comparison ledger with a raised recommended column on glass (`glass-strong` with elevated border and shadow), while ensuring cell contents remain solid/opaque (`bg-moss-50/40`) to maintain strict ledger legibility without nesting glass inside scrolling lists.
- **D020**: Replaced the icon-in-colored-square anti-pattern at lines ~527 and ~704 of `CompletePlanPage.tsx` with clean unboxed line icons on dotgrid empty sheets, preserving all text queries and buttons.
- **D021**: Added `@media print` rules in `index.css` enforcing pure black-on-white rendering (hiding backdrop, grain, and navigation elements; rendering solid 1px grayscale borders for printed distribution).

---

## Phase 7: Hardening and Handoff Report

### 1. Deliverables Completed
- **Route-Level Code Splitting via `React.lazy` + `Suspense`**:
  - Dynamically import all 11 routed pages (`HomePage`, `EventsListPage`, `EventCreationPage`, `BudgetPage`, `ConstraintsPage`, `FoodPlanningPage`, `WastePlanningPage`, `PlansPage`, `PlanComparisonPage`, `CompletePlanPage`, `NotFoundPage`) in `src/routes/index.tsx`.
  - Configured `RouteFallback` rendering `SkeletonLines` (`variant="card"` with gentle opacity pulse) preventing layout shifts.
  - **Drastic bundle size reduction**: Main JS chunk plummeted from **532.26 kB** to **218.97 kB raw** (gzip: 68.91 kB), outperforming the budget limit of <= 350 kB by 131 kB (-37%).
- **CSS Bundle Budget Compliance**:
  - Total production CSS bundle is **61.71 kB** (gzip: 15.56 kB), strictly beneath the <= 70 kB budget.
  - Zero dead CSS classes remain; dead shadow classes and full-viewport filters completely removed.
- **Accessibility & Contrast Verification**:
  - `npm run check:contrast` executed cleanly: **33 / 33 text/background pairs pass WCAG AA** across Palettes A, B, and C.
  - Verified keyboard-only focus navigation through wizard inputs, notched sliders, segmented toggles, and plan selectors.
- **Multi-Palette Full-Suite Verification**:
  - Verified Palettes A ("Sage Dawn"), B ("Tidepool Night"), and C ("Kiln & Lagoon") across all 11 routes.
  - Dev-only palette switcher verified via URL query param (`?palette=a|b|c`) and floating interactive toggle.
- **Fallbacks & Resilience**:
  - Verified `@supports not (backdrop-filter: blur(1px))` and `@media (prefers-reduced-transparency: reduce)` fallbacks gracefully render solid `--c-surface` with clean borders.
  - Verified `@media (prefers-reduced-motion: reduce)` halts all backdrop blob drift, contour parallax, and entrance reveals.
  - Verified `@media print` eliminates backdrop layers, glass blurs, and paper grain, rendering crisp black-on-white documents.
- **Documentation Updated**:
  - Updated `docs/frontend.md` with palette tokens, glass architecture rules, motion rules, step-by-step instructions for adding a palette, and complete component catalogue (14 shared components).

### 2. Measured Post-Phase 7 Delta
| Metric | Phase 0 Baseline | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5a | Phase 5b | Phase 6 | Phase 7 Final | Delta vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vitest Tests** | 104 passed (9 files) | 104 passed | 104 passed | 104 passed | 104 passed | 104 passed | 104 passed | 104 passed | **104 passed (9 files)** | **0 regressions** |
| **`tsc --noEmit`** | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | 0 errors | **0 errors** | **Clean** |
| **`check:contrast`** | N/A | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | 33 / 33 passed | **33 / 33 passed** | **100% AA compliant** |
| **Main JS Chunk (Raw)** | 513.94 kB | 513.72 kB | 518.50 kB | 518.32 kB | 522.43 kB | 526.10 kB | 527.76 kB | 532.26 kB | **218.97 kB** | **-294.97 kB (-57%)** [Budget <= 350 kB] |
| **CSS Bundle Size** | 45.96 kB | 48.89 kB | 56.57 kB | 59.41 kB | 60.02 kB | 60.02 kB | 60.17 kB | 61.71 kB | **61.71 kB** | **+15.75 kB** [Budget <= 70 kB] |
| **Gradients in Codebase** | 3 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | **2 (CSS definitions only)** | **-1 (PlanCard removed)** |
| **Icon-in-Box Anti-Patterns** | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | **0 (Eliminated)** | **-2 (100% eliminated)** |
| **Sparkles Icons** | 8 | 8 | 7 | 0 | 0 | 0 | 0 | 0 | **0 (Eliminated)** | **-8 (100% eliminated)** |
| **Page Title Coverage** | 5 / 11 (45%) | 5 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | 11 / 11 | **11 / 11 (100%)** | **+6 pages (100%)** |
| **Runtime Dependencies** | Baseline | Baseline | Baseline | Baseline | Baseline | Baseline | Baseline | Baseline | **Baseline (0 added)** | **Unchanged** |

### 3. Decisions Log (Phase 7)
- **D022**: Implemented dynamic code splitting on `AppRoutes` using `React.lazy` with `.then(m => ({ default: m.Component }))` wrapping. This reduced the initial JS bundle from 532.26 kB to 218.97 kB raw (a 57% reduction), easily satisfying the <= 350 kB budget without needing manual rollup chunking configurations.
- **D023**: Designed `RouteFallback` using `SkeletonLines` (`variant="card"` with pulsing opacity) within a centered sheet container to avoid layout shifts during route transitions while respecting `prefers-reduced-motion`.

---

## Out of Scope Observations
- Fastify/FastAPI backend has CORS and dev proxy configured on `/api/v1`; when backend is stopped during frontend unit tests, Vitest mocks cleanly isolate API surfaces.
- Future work could explore code-splitting calculation utilities from wizard pages to further shrink chunk size.



