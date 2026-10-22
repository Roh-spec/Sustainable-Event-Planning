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

## Out of Scope Observations
- Fastify/FastAPI backend has CORS and dev proxy configured on `/api/v1`; when backend is stopped during frontend unit tests, Vitest mocks cleanly isolate API surfaces.
- Future work could explore code-splitting calculation utilities from wizard pages to further shrink chunk size.



