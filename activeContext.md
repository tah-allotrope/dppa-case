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

## Layout + Formula Refinements

### Plan
- [x] Layout: chart and walkthrough-panel side-by-side in `.chart-walkthrough-row` (CSS grid 1.1fr / 0.9fr), collapses to 1-col at ≤900px
- [x] EVN formula rewritten to "FMP (fig) × Kpp (fig) × qty + CDPPA (fig) × qty [+ Retail (fig) × shortfall]" with three-row expansion
- [x] Developer formula rewritten to "(Strike (fig) − FMP (fig)) × qty" with signed total
- [x] Net row added: "Net = EVN + Developer = total" with formula expansion and red cancellation callout chip
- [x] `buildWalkthroughCase` in settlement.js extended with `strikePrice` and `lossFactor` fields
- [x] Tests updated: shell test uses `.chart-walkthrough-row` selector; walkthrough test asserts `'Net = EVN + Developer'`
- [x] `npm test -- --run` — 16/16 pass
- [x] `npm run build` — clean
- [x] `firebase deploy --only hosting --project dppa-case` — deployed

### Review / Results
- Chart and walkthrough panel sit side by side on desktop (≥901px); stack vertically on mobile
- Walkthrough panel has `max-height: 480px; overflow-y: auto` to match chart panel height on desktop
- EVN row format: `EVN = total` / `= FMP (x) × Kpp (x) × q kWh + CDPPA (x) × q kWh [+ Retail (x) × shortfall]` / `= component + component`
- Developer row: `Developer = ±total (signed)` / `= (Strike (x) − FMP (x)) × q kWh` / `= ±total (signed)`
- Net row: `Net = EVN + Developer = total` / `= EVN ± |developer|` / red callout identifying FMP cancellation (clean vs partial)
- All three scenarios verified in browser: balanced, under-supply (with retail row), over-supply
- 16 tests pass, build clean, live at https://dppa-case.web.app

## Desktop Balance + Net Cancellation Formula

### Plan
- [x] Make the chart panel visibly larger than the load-vs-generation panel on desktop while keeping the existing mobile collapse.
- [x] Add failing UI tests for the explicit Net cancellation formula and EVN/developer ownership labels in the FMP cancellation strip.
- [x] Expand the walkthrough Net section so it shows the full EVN-vs-developer cancellation algebra, including the developer `- FMP x aligned` term highlighted in red.
- [x] Add EVN / Developer ownership to the corresponding FMP cancellation chips and tighten any overlapping text in the walkthrough panel.
- [x] Re-run `npm test`, review desktop layout in the browser, fix any overlap issues found, then `npm run build` and redeploy to Firebase Hosting.

## Desktop Ratio + Overlap Review Round

### Plan
- [x] Increase the desktop chart-to-walkthrough width ratio so the graph is slightly larger than the load-vs-generation tab without changing mobile stacking.
- [x] Add failing UI tests for the expanded Net cancellation formula and EVN/Developer labels on the per-kWh FMP cancellation boxes.
- [x] Update the walkthrough Net formula to show the full EVN FMP term canceling against the developer `- FMP x load` term, with the developer-side FMP highlighted in red.
- [x] Label each FMP cancellation box with whether the corresponding per-kWh FMP sits under EVN or Developer, and tighten CSS to prevent text overlap.
- [x] Run `npm test -- --run`, review the app in the browser for overlap issues, fix any issues found, then run `npm run build` and `firebase deploy --only hosting --project dppa-case`.

### Review / Results
- Desktop ratio increased to `1.56fr / 0.64fr` in `app/src/style.css`, leaving the chart visibly wider than the walkthrough panel while keeping the existing `<=900px` stack.
- `app/src/modules/ui.js` now shows the Net section as explicit EVN and Developer ownership lines: `EVN = FMP × Kpp × load ...` and `Developer = - FMP × aligned + Strike × contract`, with the developer-side cancellation line kept red.
- The FMP cancellation strip now renders owner badges per chip (`EVN` / `Developer`) so each per-kWh FMP box clearly states which side it belongs to.
- Browser review at `1440px` and `1280px` found the main remaining issue was horizontal spill being reported on the scrollable walkthrough container itself; no child text nodes were still overflowing after the CSS wrap hardening. Added `overflow-x: hidden`, stronger wrapping, and a tighter heading width in `app/src/style.css`.
- Verification passed: `npm test -- --run` = 16/16 pass, `npm run build` succeeded, and `firebase deploy --only hosting --project dppa-case` succeeded.
- Live site updated at https://dppa-case.web.app

## Remove Cancellation Tab + Keep Mermaid

### Plan
- [x] Remove the end-of-page cancellation effect panel while keeping a Mermaid flow panel in the same general area above controls.
- [x] Remove the weighted EVN tariff slider from controls and clean up now-unused retail-tariff input wiring.
- [x] Update UI tests to match the new shell and Mermaid-only behavior, then run `npm test -- --run`.
- [x] Review desktop and mobile browser views, fix any layout/readability issues found, then run `npm run build` and deploy to Firebase Hosting.

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

## Post-deploy cleanup: remove cancellation tab + control simplification + responsive review

### Plan
- [x] Confirm and enforce that no standalone "Cancellation effect" tab/panel remains above controls while keeping the Mermaid flow panel intact.
- [x] Remove the weighted EVN tariff slider from controls (and any associated UI wiring), preserving retail tariff only as an internal modeling assumption.
- [x] Update/add UI tests first for shell expectations, then run `npm test -- --run`.
- [x] Review desktop and mobile layouts in-browser for readability/overflow issues, apply minimal fixes, then run `npm run build` and redeploy to Firebase Hosting.

### In-progress review notes
- Desktop check confirms cancellation tab/panel is not present; Mermaid panel remains immediately above controls as requested.
- Controls check confirms no weighted EVN tariff slider is present in the shell.
- Mobile check found Mermaid flow text too small at narrow widths due to aggressive zoom reduction; adjusted Mermaid card to allow horizontal pan and increased mobile zoom for readability.

### Review / Results
- Verified shell behavior aligns with requested structure: Mermaid flow panel remains above controls, and no standalone cancellation-effect tab/panel appears.
- Verified controls section has no weighted EVN tariff slider; retail tariff stays an internal assumption in the settlement model.
- Implemented responsive polish for Mermaid readability: `app/src/style.css` now enables horizontal pan at `.mermaid-card`, increases mobile Mermaid zoom, and sets a minimum width for the diagram at narrow breakpoints.
- Verification passed: `npm test -- --run` (16/16), `npm run build` succeeded, and `firebase deploy --only hosting --project dppa-case` succeeded.
- Live site updated at https://dppa-case.web.app

## Codebase Cleanup + Daily Totals Panel

### Plan
- [x] Remove 5 dead exports from `ui.js`: `renderVolumeSummary`, `renderMetrics`, `renderBauComparison`, `renderSelectedHour`, `setActiveDetailView`
- [x] Remove `buildSelectedIntervalNarrative` from `settlement.js` (exported but never imported)
- [x] Add `profiles.test.js` with direct coverage for `scaleProfile`, `deriveVolumes`, `sumVolume`, and `buildFmpCurve` shape/scaling
- [x] Replace empty `#volumeSummary` div with `#dailyTotals`; add `renderDailyTotals` to `ui.js` surfacing engine-computed totals (matched kWh, shortfall, excess, daily cost, blended price, savings vs BAU, to EVN, to developer)
- [x] Wire `renderDailyTotals` in `main.js` after chart render
- [x] Tick off previously-completed but unchecked plan sections in `activeContext.md`
- [x] `npm test -- --run` — all tests pass
- [x] `npm run build` — clean
- [x] `firebase deploy --only hosting --project dppa-case` — deployed

### Review / Results
- Dead code removed: `ui.js` shrank by ~150 lines; `settlement.js` shrank by ~13 lines
- New test file `profiles.test.js`: 10 tests covering all pure functions in `profiles.js` and `buildFmpCurve`
- Daily totals strip now visible in the chart panel headline on every scenario/currency change
- All tests pass, build clean, live at https://dppa-case.web.app

## Walkthrough Rewrite + Responsive Cleanup

### Plan
- [x] Remove the daily totals pills from the Profiles panel so the chart area stays visually clean.
- [x] Update UI tests first for the new selected-hour walkthrough format and the removed profiles totals strip.
- [x] Rewrite the load-vs-generation walkthrough card into a compact cancellation-first formula layout: EVN total, Developer total, then a Net line that visually strikes through the canceling FMP terms and leaves CDPPA + Strike prominent in red.
- [x] Reduce walkthrough panel bulk on desktop and tighten mobile spacing to avoid text/box overlap.
- [x] Verify desktop and mobile layouts in-browser, then run `npm test -- --run`, `npm run build`, and deploy to Firebase Hosting.

### Review / Results
- Removed the Profiles header totals strip entirely so the chart panel stays focused on the load-vs-solar visual.
- Rewrote the clicked-hour walkthrough card to use a cancellation-first formula format closer to the requested CFO example: single-line EVN and Developer equations, followed by a Net section with struck-through FMP terms and retained CDPPA / Strike terms highlighted in red.
- Tightened the walkthrough panel sizing: desktop column widened from the prior overly-narrow formula box, title copy shortened, step badge removed, and the panel now reads more like a compact explanation than a mini-dashboard.
- Mobile browser review at `390x844` confirmed the previous overlap issue is resolved; the Net equation now wraps into readable chips instead of collapsing into overlapping inline text.
- Desktop browser review at `1440x1200` confirmed the walkthrough panel no longer feels as clunky, though the selected-hour card remains intentionally compact to preserve chart dominance.

## Walkthrough Strip Restore + Scenario QA

### Plan
- [x] Update UI tests first to lock in the restored per-kWh FMP strip, calmer Net-term coloring, and roomier walkthrough header/card spacing.
- [x] Restore the per-kWh FMP cancellation strip in the walkthrough panel while keeping the compact inline Net equation.
- [x] Relax the walkthrough panel header/card spacing so the outline no longer feels cramped around `Load-vs-generation cases` and the selected-case heading.
- [x] Restrict red emphasis in the Net equation to struck-through cancelled FMP terms only; retained `CDPPA`, `Strike`, `Retail`, and `Loss adj.` terms should stay neutral.
- [x] Verify Mermaid behavior on mobile in-browser and fix any rendering or readability regressions.
- [x] Click through all three load-vs-generation scenarios and multiple graph points to identify formatting bugs, repeated text, or scenario-specific issues.
- [ ] Run `npm test -- --run`, `npm run build`, deploy to Firebase Hosting, then commit and push.

### Review / Results
- Restored the per-kWh FMP cancellation strip directly below the clicked-hour walkthrough card and kept the inline Net algebra above it.
- Walkthrough spacing was relaxed by increasing card padding and desktop panel height so the section no longer feels boxed-in around `Load-vs-generation cases`, `Clicked-hour cancellation view`, and the selected case header.
- Red emphasis in the Net algebra is now limited to the struck-through cancelled FMP terms; retained `CDPPA`, `Strike`, `Retail`, and `Loss adj.` terms stay neutral white.
- Browser QA found a real Mermaid interaction bug: after scenario/hour changes the diagram sometimes fell back to raw Mermaid source text instead of SVG. Fixed by switching from repeated `mermaid.run()` calls to explicit `mermaid.render()` with a render token guard in `app/src/main.js`.
- Mobile browser review at `390x844` now shows Mermaid rendering as SVG with horizontal overflow available inside `.mermaid-card`; the remaining limitation is readability, not functional failure.
- Full scenario click-through across all three tabs and multiple graph points confirmed the selected card updates correctly for under-supply, balanced, and over-supply hours. Expected repeated under-supply wording still appears at night because solar generation is zero in every scenario, but no scenario-specific logic bugs were found in the walkthrough or details panels.
