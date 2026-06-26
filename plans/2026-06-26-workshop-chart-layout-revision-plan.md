---
title: "Workshop Chart Realism + Layout & Control-Feedback Revision"
date: "2026-06-26"
status: "draft"
request: "Revise the web app workshop scenarios: (1) replace flat workshop graph lines with realistic daily load/solar/FMP curves while keeping the 5-line monthly bill deck-exact; (2) move the multi-year projection up to directly below the daily graph; (3) make control changes visibly reflected in the charts."
plan_type: "multi-phase"
research_inputs:
  - "research/2026-06-26_workshop-chart-layout-revision-brainstorm.md"
  - "research/2026-06-26_deck-app-workshop-consolidation-brainstorm.md"
---

# Plan: Workshop Chart Realism + Layout & Control-Feedback Revision

## Objective
Make the web app's two workshop presets presentation-ready for the July workshop: replace the dead-flat
workshop graph with realistic daily load/solar/FMP curves (FMP staying on the deck's side of strike),
relocate the multi-year projection to sit directly below the daily graph, and make control changes
visibly reflected — all while the 5-line monthly bill stays penny-for-penny exact to the corrected deck.

## Context Snapshot
- **Current state:**
  - `app/src/data/default-scenarios.js`: `workshop1`/`workshop2` use **flat** profiles
    (`loadProfile`/`generationProfile = HOURS.map(() => Math.round(monthlyVolume / 720))`); every hour
    is identical (e.g. 6,944 kWh). Each preset has `overrides {strikePrice, marketPrice}` and
    `monthlyVolumes {contracted, total}`.
  - `app/src/main.js` `buildInputs()`: for `kind === 'workshop'` sets `fmpCurve: Array(24).fill(state.marketPrice)`
    (flat FMP). `updateView()` computes the 5-line bill from the preset's fixed `monthlyVolumes` +
    `state.marketPrice`, independent of chart shape.
  - `app/src/modules/chart.js`: re-render path is **correct** (`profileChart.update('none')` with rebuilt
    datasets + refreshed `yFmp` min/max). Sliders move the FMP line (`marketPrice`) and strike reference
    line (`strikePrice`); no control scales load/generation.
  - `app/src/modules/ui.js` `renderAppShell()` order: `story-grid`→`focus-column`
    (`chart-walkthrough-row` then `details-panel`)→`lower-grid` (cancellation flow)→`controls-panel`→
    **`multi-year-panel` (dead last)**.
  - Tests: `ui.test.js` asserts workshop tabs + `#fiveLineBill` existence and the bill totals/"RE GENCO
    mirror" via `scenarioProfiles.workshop1.monthlyVolumes` (shape-independent). No test pins workshop
    profiles to flat.
- **Desired state:**
  - Workshop graph shows a realistic load curve, solar bell, and a daily FMP curve that **varies but
    stays below strike for S1 and above strike for S2**. The 5-line monthly bill remains deck-exact.
  - `multi-year-panel` rendered full-width **immediately after `chart-walkthrough-row`** (above
    `details-panel`, cancellation flow, and controls).
  - `marketPrice` reshapes the FMP curve; `strikePrice` moves the strike line; escalation/horizon visibly
    reshape the now-prominent multi-year chart; a short note states what each control drives.
- **Key repo surfaces:**
  - `app/src/data/default-scenarios.js` — realistic workshop load/solar profiles; new
    `buildWorkshopFmpCurve(midpoint, strike, side)`; add `fmpSide` to each workshop preset.
  - `app/src/main.js` — workshop branch of `buildInputs()` calls `buildWorkshopFmpCurve`.
  - `app/src/modules/ui.js` — move `multi-year-panel`; add control-effect note.
  - `app/src/style.css` — adjust any rule that pins multi-year to the bottom; spacing for relocated panel.
  - `app/src/modules/chart.js` — verify (no change expected) the varying curve + strike line render and
    `yFmp` range includes strike.
  - `app/src/modules/profiles.test.js` / `ui.test.js` / `settlement.test.js` — add FMP-side-of-strike +
    non-flat tests; keep bill parity tests.
- **Out of scope:** deck `.pptx` and deck↔app numeric parity; the 3 existing curve scenarios; new
  load/solar/volume controls; changing `projectMultiYear` logic (placement only).

## Research Inputs
- `research/2026-06-26_workshop-chart-layout-revision-brainstorm.md` — supplies the four resolved
  decisions (DEC-001..004) and implementation assumptions; defines the whole scope and the
  "illustrative chart, authoritative bill" principle.
- `research/2026-06-26_deck-app-workshop-consolidation-brainstorm.md` — establishes the penny-for-penny
  bill contract that this revision must not break (bill is decoupled from chart shape).

## Assumptions and Constraints
- **ASM-001:** Workshop load/solar curves are illustrative shapes (reuse the `solarCurve` helper for
  generation; a step-function load like the existing scenarios): S1 a balanced-style load≈solar overlap
  (matched story); S2 a load-clearly-above-solar shape (shortfall story), with means roughly tracking
  `monthlyVolume / 720`. Exact aggregation to the monthly total is not required (DEC-001).
- **ASM-002:** `buildWorkshopFmpCurve(midpoint, strike, side)` centers a reduced-amplitude daily shape on
  `midpoint` with amplitude bounded by the midpoint↔strike gap so it never crosses strike while the
  midpoint stays on the correct side: `amp = min(midpoint * 0.15, |strike − midpoint| * 0.8)`; for
  `side: 'below'` values = `midpoint ± amp·shapeNorm` capped under `strike`; symmetric for `'above'`.
  Centering on `midpoint` keeps it responsive to the `marketPrice` slider (concern #3).
- **ASM-003:** The 5-line monthly bill keeps using the preset's fixed `monthlyVolumes` + `state.marketPrice`
  as the representative FMP, so it stays penny-for-penny to the corrected deck regardless of chart shape.
- **ASM-004:** Add a short caption near the workshop chart/bill noting the chart is illustrative daily
  shape and the monthly 5-line bill is the deck-exact settlement (prevents "hourly doesn't sum to bill"
  confusion).
- **CON-001:** Existing `buildFiveLineBill` parity tests and totals must still pass unchanged.
- **CON-002:** Do not alter the 3 existing curve scenarios' numbers or behavior.
- **CON-003:** All app tests must pass; update only tests that would assume flat workshop profiles (none
  found today) and add the new curve/FMP assertions.
- **DEC-001..004 (from brainstorm):** realistic workshop curves + authoritative bill; multi-year moved
  full-width right after the chart row; workshop FMP varies but stays on the deck's side of strike; no new
  controls (realism + relocation fix the perceived inertness) plus a control-effect note.

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Realistic workshop load/solar + constrained workshop FMP curve | None | Updated `default-scenarios.js`, `main.js` + unit tests |
| PHASE-02 | Move multi-year below the daily graph + control-effect note | None | Updated `ui.js`, `style.css` (+ test adjust if needed) |
| PHASE-03 | Verify, build, browser smoke-check, deploy, document | PHASE-01, PHASE-02 | Green tests/build, deployed app, report + activeContext |

## Detailed Phases

### PHASE-01 - Realistic Workshop Curves (load, solar, FMP)
**Goal**
Replace the flat workshop profiles and flat FMP with realistic daily curves; FMP varies but stays on the
deck's side of strike. Keep the monthly bill deck-exact.

**Tasks**
- [ ] TASK-01-01: In `default-scenarios.js`, replace `workshop1.loadProfile`/`generationProfile` with a
  balanced-style overlap (load≈solar daytime, e.g. reuse `solarCurve` for generation and a step-function
  load) scaled near `5,000,000/720`. Keep `overrides`, `monthlyVolumes` unchanged; add `fmpSide: 'below'`.
- [ ] TASK-01-02: Replace `workshop2.loadProfile`/`generationProfile` with a load-above-solar shortfall
  shape (load mean near `9,000,000/720`, a smaller solar bell). Keep `overrides`, `monthlyVolumes`; add
  `fmpSide: 'above'`.
- [ ] TASK-01-03: Add `buildWorkshopFmpCurve(midpoint, strike, side)` to `default-scenarios.js` per
  ASM-002 (gap-bounded amplitude, centered on midpoint, never crosses strike). Export it.
- [ ] TASK-01-04: In `main.js` `buildInputs()`, change the workshop branch to
  `fmpCurve: buildWorkshopFmpCurve(state.marketPrice, state.strikePrice, scenario.fmpSide)`; import the
  new function. Leave the bill computation untouched (still `state.marketPrice` + `monthlyVolumes`).
- [ ] TASK-01-05: Add tests (`profiles.test.js` or `settlement.test.js`): workshop1 FMP curve all
  `< strikePrice` and non-constant (max ≠ min); workshop2 FMP curve all `> strikePrice` and non-constant;
  workshop load/gen profiles are non-flat (max ≠ min).

**Files / Surfaces**
- `app/src/data/default-scenarios.js` — workshop profiles + `buildWorkshopFmpCurve` + `fmpSide`.
- `app/src/main.js` — workshop `buildInputs()` branch + import.
- `app/src/modules/profiles.test.js` / `settlement.test.js` — new assertions.

**Dependencies**
- None.

**Exit Criteria**
- [ ] `cd app && npm test -- --run` passes incl. new curve/FMP tests; existing `buildFiveLineBill` totals
  unchanged.
- [ ] In-browser, Workshop 1/2 show non-flat load, solar, and FMP curves; FMP stays below (S1) / above
  (S2) the strike line.

**Phase Risks**
- **RISK-01-01:** Dragging `marketPrice` across strike breaks the side guarantee for a workshop preset →
  mitigation: `buildWorkshopFmpCurve` clamps to the side with a small margin even if the midpoint crosses
  (curve compresses rather than crossing); accept that an extreme manual slider value flattens slightly.
- **RISK-01-02:** New per-hour curves make the per-hour walkthrough numbers diverge from the monthly bill
  → mitigation: ASM-004 caption clarifies chart is illustrative and the monthly bill is authoritative.

### PHASE-02 - Multi-Year Relocation + Control-Effect Note
**Goal**
Move the multi-year projection to directly below the daily-graph row and make control effects legible.

**Tasks**
- [ ] TASK-02-01: In `ui.js` `renderAppShell()`, move the entire `<section class="panel multi-year-panel
  bottom-panel">…</section>` block to immediately **after** the `chart-walkthrough-row` div and **before**
  the `details-panel` (inside `focus-column`, so it spans full width). Remove it from the page bottom.
- [ ] TASK-02-02: Check `style.css` for rules tying `.multi-year-panel`/`.bottom-panel` to the bottom
  (margins, order); adjust spacing so the relocated panel sits cleanly between the chart row and details.
- [ ] TASK-02-03: Add a concise control-effect note in the controls panel (extend `.assumptions-inline`
  or add a `.control-hints` line): e.g. "Strike & FMP reshape the daily graph; escalation & horizon
  reshape the multi-year projection."
- [ ] TASK-02-04: Update `ui.test.js` only if it asserts DOM order (current shell test asserts existence,
  not order); add an assertion that `#multiYearChart` precedes `#cancellationFlow`/controls in the DOM if
  cheap to verify.

**Files / Surfaces**
- `app/src/modules/ui.js` — `renderAppShell` section reordering + control note.
- `app/src/style.css` — relocation spacing / ordering rules.
- `app/src/modules/ui.test.js` — order assertion (optional).

**Dependencies**
- None (independent of PHASE-01).

**Exit Criteria**
- [ ] `cd app && npm test -- --run` passes.
- [ ] In-browser, the multi-year section appears directly below the daily-graph row for all scenarios;
  changing escalation/horizon visibly moves it; the control-effect note is present.

**Phase Risks**
- **RISK-02-01:** Moving the panel into `focus-column` changes responsive stacking at the 900/520/390px
  breakpoints → mitigation: verify each breakpoint after the move; the panel was already full-width so
  reflow risk is low.

### PHASE-03 - Verification, Build, Deploy, Document
**Goal**
Prove the revision works end-to-end and ship it.

**Tasks**
- [ ] TASK-03-01: `cd app && npm test -- --run` (all green) and `npm run build` (clean).
- [ ] TASK-03-02: Browser smoke-check: Workshop 1/2 curves non-flat and FMP on correct side; bill totals
  still 5,946,696,000 / 8,563,196,000 / 9,063,196,000 (S1); multi-year directly below the graph; moving
  `marketPrice`/`strikePrice` reshapes the daily graph and escalation/horizon reshapes multi-year; no
  console errors; check 1280/900/520/390px.
- [ ] TASK-03-03: `firebase deploy --only hosting --project dppa-case`; record result in `app/deployment.md`.
- [ ] TASK-03-04: Append a Review/Results section to `activeContext.md` and write
  `reports/2026-06-26-workshop-chart-layout-revision-completion.md`.

**Files / Surfaces**
- `app/deployment.md`, `activeContext.md`, `reports/2026-06-26-workshop-chart-layout-revision-completion.md`.

**Dependencies**
- PHASE-01, PHASE-02.

**Exit Criteria**
- [ ] Tests green, build clean, app deployed and reachable; smoke-check items confirmed.

**Phase Risks**
- **RISK-03-01:** Firebase deploy auth/project binding may be unavailable → mitigation: stop at a clean
  build + verified `dist/` and flag deploy as a manual step (consistent with prior sprints).

## Verification Strategy
- **TEST-001:** `cd app && npm test -- --run` — full suite incl. new workshop curve/FMP-side tests
  (TASK-01-05) and unchanged `buildFiveLineBill` parity totals.
- **MANUAL-001:** Browser smoke-check of Workshop 1/2 curve realism, FMP-vs-strike side, bill totals,
  multi-year placement, and control responsiveness across breakpoints (TASK-03-02).
- **OBS-001:** `npm run build` clean; deployed app returns 200 and renders the relocated multi-year panel
  and non-flat workshop charts (TASK-03-03).

## Risks and Alternatives
- **RISK-001:** The realism work accidentally changes the deck-exact bill → mitigation: bill uses fixed
  `monthlyVolumes` + `state.marketPrice` only (ASM-003); the existing parity totals test guards this.
- **ALT-001:** Keep FMP flat and vary only load/solar — rejected (DEC-003): leaves a dead-flat FMP line.
- **ALT-002:** Add factory-load/solar-size sliders — rejected (DEC-004): scope creep; decouples workshop
  chart from deck volumes; realism + relocation already fix perceived control inertness.

## Grill Me
No open clarification questions. (The revision brainstorm resolved all four decisions; remaining choices
are implementation details captured in ASM-001..004.)

## Suggested Next Step
Begin PHASE-01 and PHASE-02 in parallel (independent), then PHASE-03 to verify, build, and deploy. The
brainstorm + this plan are being committed and pushed now per the request.
