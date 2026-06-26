---
title: "Workshop Chart Realism + Layout & Control-Feedback Revision"
date: "2026-06-26"
type: "brainstorm"
depth: "standard"
source_request: "Revise the web app's workshop scenarios: (1) workshop graph shows flat horizontal load/FMP lines — should reflect a practical daily shape like the defaults while the 5-line bill still follows the deck's monthly numbers; (2) move the multi-year projection up to directly below the daily graph; (3) control-section changes don't appear to update the graph."
slug: "workshop-chart-layout-revision"
---

# Brainstorm: Workshop Chart Realism + Layout & Control-Feedback Revision

## Problem & Why Now
The deck↔app consolidation shipped, but the workshop presets are not presentation-ready. The
workshop daily graph is three dead-flat horizontal lines (load, generation, and FMP), which teaches
nothing — a CFO/audience gains no daily-shape intuition. Separately, the multi-year projection (a
headline output) is buried at the very bottom of the page below the controls, and the controls feel
unresponsive because the most-visible chart elements don't move when sliders change. The July
workshop is imminent, so the live tool needs to look and feel like the polished default scenarios.

## Current vs Desired State
- **Current state:**
  - `app/src/data/default-scenarios.js`: `workshop1`/`workshop2` use **flat** profiles
    (`loadProfile`/`generationProfile = HOURS.map(() => Math.round(monthlyVolume / 720))`), so every
    hour is identical (e.g. 6,944 kWh).
  - `app/src/main.js` `buildInputs()`: for `kind === 'workshop'` it sets `fmpCurve: Array(24).fill(state.marketPrice)`
    — a **flat** FMP line. Result: load, generation, matched, and FMP are all horizontal.
  - `app/src/modules/chart.js`: the re-render path is **correct** — on each `updateView()` it rebuilds
    datasets and calls `profileChart.update('none')` and refreshes `yFmp` bounds. So sliders *do* move
    the FMP line (via `marketPrice`) and the strike reference line (via `strikePrice`); they just don't
    move the dominant flat workshop load/gen lines, and no control scales load/generation at all.
  - `app/src/modules/ui.js` `renderAppShell()` order: `story-grid` → `focus-column`
    (`chart-walkthrough-row` [chart-panel + walkthrough-panel], then `details-panel`) → `lower-grid`
    (cancellation flow) → **controls-panel** → **multi-year-panel (dead last)**.
  - The 5-line monthly bill (`buildFiveLineBill`, rendered into `#fiveLineBill`) is computed from the
    preset's fixed `monthlyVolumes` + the deck's representative FMP, independent of the chart shape — so
    it stays deck-exact no matter what the chart shows.
- **Desired state:**
  - Workshop presets render a **realistic daily load curve, solar bell, and FMP curve** (like the
    defaults), scaled to the workshop frame; the 5-line monthly bill remains the authoritative deck
    number. The workshop FMP curve **varies daily but stays on the deck's side of strike** (S1 below
    1,250; S2 above 1,500) to preserve the S1-below / S2-above teaching contrast.
  - The **multi-year projection** moves to a full-width section **immediately after the chart+walkthrough
    row** (above selected-hour details / cancellation flow / controls).
  - Controls visibly drive *some* chart: `marketPrice`→FMP curve, `strikePrice`→strike line, and
    escalation/horizon→the now-prominent multi-year chart; a short note states what each control affects.
- **Key repo surfaces:**
  - `app/src/data/default-scenarios.js` — replace workshop flat profiles with realistic curves; add a
    constrained workshop FMP curve generator.
  - `app/src/main.js` — `buildInputs()` workshop branch builds the constrained workshop FMP curve instead
    of a flat fill; keep `monthlyVolumes` feeding the authoritative bill.
  - `app/src/modules/ui.js` `renderAppShell()` — move `multi-year-panel` to after `chart-walkthrough-row`;
    add the control-effect note (e.g. in `assumptions-inline` or a small caption).
  - `app/src/modules/chart.js` — already handles varying curves and flat-FMP fallback; verify the
    constrained curve renders and the `yFmp` range still includes strike.
  - `app/src/style.css` — any layout adjustments for the relocated multi-year section.
  - `app/src/modules/*.test.js` — update any test asserting workshop flat profiles; add a test that the
    workshop FMP curve stays on the correct side of strike; keep the `buildFiveLineBill` parity tests
    (unaffected by chart shape).

## Resolved Decisions
- **DEC-001:** Workshop daily graph = **realistic load + solar + FMP curves** (illustrative), scaled to
  the workshop frame; the 5-line monthly bill stays the deck-exact authoritative number. Per-hour chart
  numbers are not required to sum to the monthly bill — rationale: the bill is the deck reference and the
  chart's job is daily-shape intuition.
- **DEC-002:** Move the **multi-year projection** to a full-width section **right after the
  chart+walkthrough row** — keeps the daily graph and long-run economics together near the top.
- **DEC-003:** The workshop FMP curve **varies but stays on the deck's side of strike** (S1 entirely
  below 1,250; S2 entirely above 1,500) — preserves the S1-vs-S2 directional contrast that is the deck's
  teaching point while removing the dead-flat line.
- **DEC-004:** Concern #3 fix = **realistic curves + multi-year moved up; no new controls.** It is not a
  render bug (the update path is correct); add a brief note on what each control affects and verify each
  control drives a visible chart element in-browser.

## Assumptions & Constraints
- **ASM-001:** Workshop load/solar curves are illustrative shapes scaled so the mean roughly tracks
  `monthlyVolume / 720` (plausible kWh/h level): S1 a balanced-style load≈solar overlap (matched story);
  S2 a load-clearly-above-solar shape (shortfall story). Exact aggregation to the monthly total is not
  required (DEC-001).
- **ASM-002:** Add a constrained FMP generator (e.g. `buildWorkshopFmpCurve(midpoint, strike, side)`)
  whose amplitude is bounded so `max < strike` for `side: 'below'` and `min > strike` for `side: 'above'`,
  using a gentler version of the existing `FMP_SHAPE` so it still reads as a daily curve.
- **ASM-003:** The 5-line monthly bill continues to use the preset's fixed `monthlyVolumes` + the deck's
  representative FMP (`state.marketPrice`), so it stays penny-for-penny to the corrected deck regardless
  of the new chart shape.
- **ASM-004:** A short caption near the workshop chart/bill clarifies the chart is illustrative daily
  shape and the monthly 5-line bill is the deck-exact settlement, to prevent presenter confusion about
  why hourly figures don't sum to the bill.
- **CON-001:** Keep the deck↔app penny-for-penny parity intact (existing `buildFiveLineBill` tests and
  the parity harness must still pass).
- **CON-002:** Do not alter the existing 3 curve scenarios' behavior or numbers.
- **CON-003:** All app tests must still pass; update only tests that assumed workshop flat profiles.

## Approaches Considered
- **Chosen:** Realistic illustrative workshop curves (load+solar+FMP, FMP constrained to strike side) +
  authoritative monthly bill + relocate multi-year + control-effect note. Best balance of visual
  usefulness, deck fidelity, and minimal scope.
- **ALT-001:** Keep FMP flat, vary only load/solar — rejected (DEC-003): still leaves a dead-flat FMP
  line the user dislikes.
- **ALT-002:** Force hourly curves to aggregate exactly to the deck monthly bill — rejected: FMP
  nonlinearity makes it complex/brittle for no teaching gain over an authoritative monthly bill.
- **ALT-003:** Use the default crossing FMP shape for workshops — rejected (DEC-003): blurs the
  S1-below / S2-above contrast that distinguishes the two scenarios.
- **ALT-004:** Add factory-load / solar-size sliders so the shape responds to controls — rejected
  (DEC-004): scope creep and decouples workshop chart from deck volumes; the realism + relocation fix
  already makes controls feel responsive.

## Out of Scope
- Any change to the deck `.pptx` or the deck↔app numeric parity.
- Changes to the existing 3 curve scenarios.
- New load/solar/volume input controls.
- Reworking the multi-year computation (`projectMultiYear`) — placement only.

## Open Questions
None. (All three concerns are resolved into DEC-001..004 with implementation assumptions recorded.)

## Suggested Next Step
Run `/plan workshop-chart-layout-revision` to turn this into a multi-phase implementation plan.
