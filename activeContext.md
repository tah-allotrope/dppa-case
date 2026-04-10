# Active Context

## Plan

- [x] Correct the tariff overlay requirement so the frame is rendered over the plotted chart area, not above it.
- [x] Update the UI test first so it fails unless the tariff frame lives inside the chart wrap.
- [x] Move the tariff overlay markup into the chart area and restyle it as a non-blocking in-chart overlay.
- [x] Re-run `npm test` and confirm the overlay behavior is covered.

- [x] Capture the new direction: tariff storytelling should be simplified and overlaid into the graph area instead of living in its own standalone section.
- [x] Add failing tests for integrated chart overlay content and the intended section order.
- [x] Fold the tariff walkthrough into the chart panel in a simplified form while keeping the existing model defaults.
- [x] Move the graph earlier in the mobile reading order, followed by load-vs-generation cases and then selected-hour analysis.
- [x] Replace the three simultaneous load-vs-generation case cards with a single selected-hour case card tied to the clicked graph hour.
- [x] Move selected-hour comparison and selected-hour details up so mobile reads graph -> selected case -> comparison/details -> selected-hour panel.
- [x] Re-run `npm test`, `npm run build`, and redeploy to Firebase Hosting.

## Review / Results

- User correction: the phrase "on top of the graph" was interpreted too loosely; the intended behavior is an actual visual overlay inside the chart plotting area, not a banner stacked above the canvas.
- The tariff frame now renders inside the `.chart-wrap` overlay layer above the canvas, with `pointer-events: none` so chart clicks still select hours normally.
- Verification passed for the correction: `npm test -- --run` succeeded in `app/`.

- The reference screenshot in `background/Screenshot 2026-04-09 125837.png` emphasizes a single CFO narrative: tariff time bands across the top, one flat load line versus a solar curve, and three callout cases showing under-supply, balanced/peak crossover, and over-supply with explicit DPPA vs no-DPPA math.
- The current app already has most of the required data and formulas, but its presentation is more modular than the screenshot; the main work is reshaping the story and labels rather than replacing the settlement engine.
- Implementation kept the existing weighted Vietnam defaults and settlement formulas, but added a pricing spotlight, tariff-band storytelling row, and three representative walkthrough cards for `Load > Gen`, `Load = Gen`, and `Load < Gen`.
- Verification passed: `npm test` and `npm run build` both succeeded in `app/`. Build still reports Vite chunk-size warnings from existing heavy dependencies, but the app bundles successfully.
- New requested refinement: merge tariff storytelling into the graph itself in simplified form, reduce standalone overhead, and ensure mobile ordering prioritizes the graph first, then the case cards, then selected-hour details.
- The standalone tariff section was removed. A simplified tariff-and-pricing overlay now sits inside the chart panel, while the walkthrough cards now follow the graph directly, which also improves the mobile reading order.
- Verification passed again: `npm test`, `npm run build`, and `firebase deploy --only hosting --project dppa-case` all succeeded.
- New requested refinement: optimize space by showing only the load-vs-generation case that matches the currently selected graph hour, and move the comparison/detail blocks higher in mobile so the story stays tighter right after the graph.
- The load-vs-generation section now renders a single selected-hour case card derived from the clicked chart interval instead of showing all three scenarios at once.
- Selected-hour comparison and details were moved into the main story column ahead of the larger selected-hour panel, which tightens the mobile sequence and keeps the explanatory panels closer to the graph.
- Verification passed again: `npm test`, `npm run build`, and `firebase deploy --only hosting --project dppa-case` all succeeded for the latest revision.

## Mobile Layout Polish Round

### Plan
- [x] Expand `@media (max-width: 520px)` in `style.css`: stack topbar, hide hero-copy, fix walkthrough-head grid, reduce mermaid zoom, fix FMP strip chip wrapping, add `word-break: break-all` to equation-formula
- [x] Add new `@media (max-width: 390px)` block for extra-small phones
- [x] Fix `@media (max-width: 640px)` FMP strip: add `white-space: normal` to `.cancel-eq-label`
- [x] Fix `chart.js` plugin: skip time/tariff/spot sub-labels when band narrower than 72/88px threshold; scale callout box width and font down on narrow canvases (`w < 320`); add `linesCompact` array with shorter strings for narrow callout boxes
- [x] Run `npm test -- --run` — 16 tests pass
- [x] Run `npm run build` — clean
- [x] Run `firebase deploy --only hosting --project dppa-case` — deployed

### Review / Results
- Topbar stacks cleanly at 390px; hero-copy hidden; VND/USD buttons go full-width
- Chart band labels now width-aware: only band name shown on narrow bands (<72px), time row shown ≥72px, tariff/spot rows shown ≥88px
- Callout boxes use compact 2–4 word labels on narrow canvases and are sized at 42% of chart width
- FMP cancellation strip chips wrap naturally with `min-width: 0` and `white-space: normal` on labels
- All comparison cards, equation formulas, and settlement cards have tightened padding
- 16 tests pass, build clean, live at https://dppa-case.web.app

## Synthetic FMP Curve Feature

### Plan
- [x] Add `buildFmpCurve(midpoint)` to `default-scenarios.js` — 24-hour synthetic daily shape using `FMP_SHAPE` multipliers centred on `marketPrice`; add `fmpCurve` to `defaultInputs`
- [x] Update `settlement.js` — attach `interval.fmp` (from `fmpCurve[hour]`) to every interval; replace all `inputs.marketPrice` in EVN market, developer swap, and formula breakdown with per-hour `fmp`; average-fmp for `impliedCancellation` totals
- [x] Update `chart.js` — add FMP as 4th dataset (dashed orange line, `yAxisID: 'yFmp'`); add secondary right-side Y axis `yFmp` with auto-ranging; draw strike-price reference line on canvas via plugin; fix callout `cfdRate` to `iv.fmp`; change band label from "Spot:" to "FMP:" using band-midpoint fmp value
- [x] Update `main.js` — `buildInputs()` now calls `buildFmpCurve(state.marketPrice)` so moving the FMP slider shifts the whole curve
- [x] Update `ui.test.js` — import `buildFmpCurve`; add `fmpCurve: buildFmpCurve(1700)` to all manual test input objects
- [x] `npm test -- --run` — 16/16 pass
- [x] `npm run build` — clean (pre-existing chunk-size warnings only)
- [x] `firebase deploy --only hosting --project dppa-case` — deployed

### Review / Results
- FMP curve crosses the strike price (~1741 VND/kWh) at multiple points across the day:
  - Off-peak (00–04, 22–24): FMP ~1190–1260, below strike — developer pays factory (CfD positive)
  - Morning standard (04–09): FMP rises ~1445–1870, crosses strike around hour 07–08
  - Peak (09–11, 17–20): FMP ~2244–2448, well above strike — factory pays developer (CfD negative)
  - Both directions of cancellation are visible, which is the key CFO insight
- The `marketPrice` slider still works: adjusting it shifts the entire FMP curve proportionally via `buildFmpCurve(state.marketPrice)` in `buildInputs()`
- All settlement formulas, formula breakdown, FMP cancellation strip, and callout boxes now use the per-hour FMP value
- Strike price horizontal reference line drawn on canvas via the tariffOverlay plugin on the `yFmp` axis
- 16 tests pass, build clean, live at https://dppa-case.web.app

## UI Refinements: layout restructure (changes 4–7)

### Plan
- [x] Change 4: Move FMP cancel strip from `renderBauComparison` into `renderWalkthroughCases` — `formulas` passed as 4th arg; strip appended after the walkthrough card
- [x] Change 5: Move `details-panel` (`#selectedHourDetailsPanel`) from `.story-column` into `.focus-column` below `.walkthrough-panel`; removed from story-column
- [x] Change 6: Remove `bau-panel` from `renderAppShell` in `ui.js`; remove `renderBauComparison` call from `main.js`; remove `renderBauComparison` from imports
- [x] Change 7: Remove `hour-panel` (`#selectedHourPanel`, `#detailViewToggle`) from `renderAppShell`; remove `renderSelectedHour`, `setActiveDetailView`, `detailViewToggle` listener, `buildSelectedIntervalNarrative` import from `main.js`
- [x] Update `ui.test.js`: remove `renderSelectedHour`/`buildSelectedIntervalNarrative` imports; rewrite tests to match new layout (FMP strip in walkthrough panel, payment build-up in details panel)
- [x] `npm test -- --run` — 16/16 pass
- [x] `npm run build` — clean
- [x] `firebase deploy --only hosting --project dppa-case` — deployed

### Review / Results
- Focus column now: chart → walkthrough card + FMP cancel strip → EVN/developer payment build-up
- Story column removed; `.story-grid` now has only `.focus-column` with `.lower-grid` below
- `renderSelectedHour`, `renderBauComparison`, `setActiveDetailView` removed from `ui.js` exports and `main.js` calls
- 16 tests pass, build clean, live at https://dppa-case.web.app

## UI Refinements: chart overlap + summary pills + formula format (changes 1–4)

### Plan
- [x] Change 1 (chart overlap): `layout.padding.top` raised to 64 in `baseOptions()`; dashed vertical dividers now start at `area.top + 52` (below label block) in `chart.js`
- [x] Change 2: Remove `renderVolumeSummary` call and import from `main.js`; `#volumeSummary` div left empty in shell HTML
- [x] Change 3: Rename `'Contract'` pill to `'DPPA'` in `walkthroughCaseCard` (`ui.js`)
- [x] Change 4: Reformat EVN and Developer formula lines in `walkthroughCaseCard` to the reference-doc multi-row format: `EVN = total` / `= rate × qty + …` / `= component + …` and `Developer = total` / `= (Strike − FMP) × qty`; added `.formula-indent` CSS rule for indented expansion rows
- [x] `npm test -- --run` — 16/16 pass
- [x] `npm run build` — clean
- [x] `firebase deploy --only hosting --project dppa-case` — deployed

### Review / Results
- Chart band labels no longer overlap the Chart.js legend or plotted data lines (64px top padding gives the label block full clearance)
- Volume summary pills (Matched / Shortfall / Excess) removed from the Profiles chart headline
- Pill in walkthrough card now reads `DPPA` instead of `Contract`
- EVN and Developer formula lines now expand across three rows each, matching the reference document format: total on first line, rate × quantity breakdown on second, component totals on third
- 16 tests pass, build clean, live at https://dppa-case.web.app


