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

## Formula Dedup + Below-Strike Match Check

### Plan
- [x] Update UI tests first to prevent duplicated Net formulas in zero-contract / zero-match edge cases and to require the new EVN-side strikethrough treatment in the per-kWh cancellation strip.
- [x] Fix repeated Net lines in the load-vs-generation walkthrough so cases like pure retail fallback do not render the same retained formula twice.
- [x] Add the requested EVN-side strikethrough emphasis inside the FMP cancellation strip across all cases, including zero-value matched slices.
- [x] Verify whether any existing scenario contains matched hours where `FMP < strike`; if not, adjust the synthetic scenarios so at least one matched hour demonstrates below-strike settlement and cancellation behavior.
- [ ] Run targeted browser QA across the graph and scenario tabs, then run tests, build, deploy, commit, and push.

### Review / Results
- The load-vs-generation Net section now suppresses duplicate algebra in retail-only fallback cases, so the same retained formula is not shown twice before the final total.
- The per-kWh cancellation strip now strikes through both cancelling FMP references: the EVN-side `FMP x matched` term and the developer-side `- FMP x aligned` term.
- Browser QA confirmed the new strike-through treatment appears in both zero-value and non-zero matched cases.
- The current synthetic profiles already include matched hours with `FMP < strike`; the balanced scenario at `07:00 - 08:00` shows matched volume with positive developer settlement, so no scenario-data change was needed.
- Verified in-browser that the below-strike matched hour uses the correct positive developer formula and still shows the expected cancellation effect strip and clean-cancellation note.

## Mermaid + FMP Alignment Review Round

### Plan
- [x] Update tests first for the Mermaid flow wording, stronger below-strike matched-hour visibility, and FMP-cancellation strip labels that reconcile selected graph FMP with per-load values.
- [x] Rewrite the Mermaid clean-cancellation flow so the diagram itself explicitly shows the spot/FMP reference appearing on EVN, then canceling against the aligned developer volume.
- [x] Adjust the default synthetic FMP curve so matched DPPA hours spend more visible time below strike while still crossing above strike later in the day.
- [x] Tighten the FMP cancellation strip copy so each case shows the actual selected-hour FMP from the graph and explains why the displayed per-load amount can differ from the raw FMP.
- [x] Run tests, build, deploy, then commit and sync the changes.

### Review / Results
- `app/src/modules/ui.js` now makes the Mermaid clean-cancellation flow say the spot/FMP reference is shown on EVN and then canceled on aligned volume inside the diagram itself, instead of only mentioning that in the note below.
- `app/src/data/default-scenarios.js` now uses a 24-point synthetic FMP curve with a longer below-strike morning run, so the default matched story shows several below-strike hours before crossing above strike later in the day.
- `app/src/modules/settlement.js` and `app/src/modules/ui.js` now label the cancellation strip as load-normalized contributions and surface the selected graph FMP explicitly, which resolves the confusion between raw graph FMP and per-kWh-on-load amounts across clean and shortfall cases.
- `app/src/modules/ui.test.js` and `app/src/modules/profiles.test.js` were updated first and now pass against the revised behavior, including the 24-hour curve length, repeated below-strike matched hours, and the new Mermaid wording.
- Verification passed: `npm test`, `npm run build`, and `firebase deploy --only hosting --project dppa-case` succeeded in `app/`.

## DPPA Mechanism Review Against Extracted Sources

### Plan
- [x] Lock in test coverage for the policy-alignment fixes: remove misleading weighted-tariff claims, make time-band visuals clearly illustrative, and relabel non-core settlement modes as demo assumptions.
- [x] Update the default pricing story so the app defaults align with the reviewed 2025 example inputs more closely and no longer imply unsupported tariff mechanics.
- [x] Tighten the chart and UI copy so readers can distinguish synthetic demo inputs from documented DPPA mechanism elements.
- [x] Run tests, build, and redeploy if anything changes, then commit and sync only the intended files.

### Review / Results
- Reviewed `extracted/simplified_settlement.txt`, `extracted/synthetic_policy.txt`, `extracted/ecoplexus_presentation.txt`, and `reports/2026-04-07-vietnam-dppa-buyer-guide.md` against the current app.
- The core EVN + CfD algebra was already directionally correct, but the app overstated fidelity in three places: it claimed a weighted tariff basis while defaulting to `1,833`, it presented tariff blocks as if they were calculation inputs while using a flat tariff, and it exposed unsupported settlement-mode names too authoritatively.
- `app/src/data/default-scenarios.js` now defaults to the reviewed 2025 example pricing basis (`strikePrice = 2100`, `retailTariff = 2100`, `dppaCharge = 523.34`) and labels the FMP curve as synthetic teaching data.
- `app/src/modules/ui.js` and `app/src/modules/chart.js` now describe the app as a 2025 teaching model with illustrative tariff blocks and synthetic FMP, rather than implying full time-of-use tariff settlement accuracy.
- `app/src/data/default-scenarios.js` and `app/src/modules/settlement.js` now keep only the supported core matched mode plus clearly-labeled demo assumption modes, removing the redundant `minimum` option.
- Verification passed: `npm test`, `npm run build`, and `firebase deploy --only hosting --project dppa-case` succeeded in `app/`.

## 2026 Ref-Style Deck Build — Completed 2026-05-28

Finished `build_2026_from_ref.py` (the in-place approach: open `ref/DPPA 2025 ref.pptx`, preserve real masters/logos/backgrounds/diagrams, replace content at existing shape positions, drop rendered PNG charts into the image slots). This is the chosen path over the from-scratch `build-2026-refstyle-presentation.js` (which caused the "generated-looking" problem).

- Output: `dppa-2026-factory-energy-proposal.pptx` (13 slides), assets in `deck-qa/generated-2026/`.
- Verified by rendering every slide to PNG via LibreOffice + PyMuPDF (`deck-qa/render-2026/`).
- Fixed three layout bugs found in render QA:
  - Slide 6 (Diurnal Profile): 2-line headline overflowed and collided with the chart → headline 18→15pt, chart nudged to y=1.74.
  - Slide 9 (Feasibility table): 2-line headline collided with table top → headline 18→14pt, table moved to y=1.78.
  - Slide 12 (Negotiation): stray inherited bullet on the reused textbox → added `suppress_bullet()` (buNone) in `set_text`.
- All shape-index targets confirmed against the live ref deck; real payment-mechanism diagram (slide 5) and section dividers preserved intact.

## Sprint 1: Workshop Demo Safety — Completed 2026-06-23

Closed 5 gaps from `reports/2026-05-22-workshop-readiness-gap-analysis.md`: GAP-01 (error handling), GAP-05 (loading state), GAP-06 (meta tags), GAP-07 (touch feedback), GAP-08 (Firebase deployment). Plan: `plans/sprint-1-demo-safety.md`.

### Plan
- [x] PHASE-01: Wrap mermaid/chart renders in try/catch with token-guarded fallback; add `window.unhandledrejection` listener; add `.mermaid-fallback` CSS class
- [x] PHASE-02: Inline loading splash with allotrope logo + pulsing text; `theme-color` meta; Open Graph tags; `apple-touch-icon`
- [x] PHASE-03: `:active` + `:focus-visible` styles on `.toggle-button`/`.scenario-tab`/`.ghost-button`; wrap existing hover in `@media (hover: hover)`; `:active` brightness bump on `.walkthrough-card.is-selected`; `cursor: pointer` on tabs
- [x] PHASE-04: Production build, browser-verified, deployed to https://dppa-case.web.app, recorded URL in `app/deployment.md`

### Review / Results
- All 38 tests pass after each phase; no regressions
- Build succeeds in ~3.4s; main bundle 318 KB (gzip 107 KB); pre-existing chunk-size warnings are Sprint 2 scope
- Live site verified via real browser: 200 OK, all meta tags present in served HTML, loading splash visible, all 3 scenario tabs interactive, zero console errors, zero JS errors
- Touch feedback pattern established: `@media (hover: hover)` wrapping + `:active` + `:focus-visible` — repeatable for Sprint 2 mobile interactions
- Render-function try/catch with token guard pattern documented for future async renderers
- Reports: `reports/2026-06-23-sprint-1-phase-{01,02,03,04}.md` + `reports/2026-06-23-sprint-1-completion.md`
- Commits pushed: `0d0ef1f` (phase 01), `9500110` (phase 02), `2c75536` (phase 03), `c63b36c` (phase 04), plus report commits

## Deck Consolidation (CEBA DPPA 2026) — Completed 2026-06-23

Consolidated the deck's redundant worked scenarios (Case Studies 5 & 6 + workshop Scenarios 1–5) into 3 canonical teaching cases (matched / shortfall / excess) that mirror the web app, plus 2 compact callouts (netting + financing) and 7 policy/agenda refreshes. Plan: `plans/2026-06-22-dppa-deck-consolidation-plan.md`.

### Plan
- [x] PHASE-01: Inventory + mapping spec (`deck-qa/consolidation-map.md`)
- [x] PHASE-02: Build 3 canonical case slides using python-pptx (`build_canonical_cases.py`)
- [x] PHASE-03: Add multi-party netting callout + financing summary (`build_callouts.py`)
- [x] PHASE-04: Policy refresh + agenda renumbering (`build_policy_refresh.py`)

### Review / Results
- Deck: 57 → 45 slides (-12 slides, +5 new = -7 net)
- 5 new slides: 3 canonical cases (matched/shortfall/excess), 1 financing summary, 1 netting callout
- 13 redundant slides removed: 4 Cases 5/6 detail, 8 Scenarios 1+3, 5 Scenarios 4+5
- All slides use verified 2026 numbers (retail 2,204 / fees 523.3 / loss 1.0342 / strike 2,000 / FMP 1,427 illustrative)
- Same factory frame as the app: 4,200-6,200 kWh/h, so deck and live tool show identical numbers
- Policy refresh: Circular 16/2025 cited on slide 34, Samsung SEVT ↔ TTC Duc Hue 2 first-DPPA cited on slides 40 and 42
- Module 5 divider renamed "Case Studies 5 & 6" → "Three Canonical Cases"
- Interactive Exercise renamed "DPPA Scenario Analysis" → "Apply the 3 Canonical Cases"
- Backup preserved: `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx`
- python-pptx loads deck cleanly, slide count = 45
- **Known limitation:** PNG export (TASK-04-03) blocked because no PowerPoint / LibreOffice on this machine. Text-level QA fallback in `deck-qa/qa-slide-titles.txt`; visual review remains a manual step.
- Reports: `reports/2026-06-23-deck-consolidation-phase-{01,02,03,04}.md` + `reports/2026-06-23-deck-consolidation-completion.md`
- Commits pushed: `afe0a06` (phase 01), `75580ee` (phase 02), `cf213a7` (phase 03), `a248c63` (phase 04), plus report commits

## Sprint 2: Mobile Optimization & Bundle Performance — Completed 2026-06-23

Closed 3 gaps from `reports/2026-05-22-workshop-readiness-gap-analysis.md`: GAP-02 (bundle size 3.1 MB), GAP-03 (chart tap targets 1.5px), GAP-04 (mermaid mobile horizontal scroll). Plan: `plans/sprint-2-mobile-optimization.md`.

### Plan
- [x] PHASE-01: Replace Mermaid with HTML/CSS flow diagram (new `flow-diagram.js` module); remove mermaid import + initialize + renderMermaidDiagram; uninstall `mermaid` (129 packages removed); update tests to assert on HTML output
- [x] PHASE-02: Increase chart pointRadius (1.5→4 base, 5→8 selected, mobile-aware via matchMedia); add chart-tap-hint subtitle; add prev/next hour nav row with HH:00 label
- [x] PHASE-03: Create `vite.config.js` with `chunkSizeWarningLimit: 300`; rename legacy `#cancellationMermaid` → `#cancellationFlow`; mobile viewport verification at 375/390/412 px

### Review / Results
- Bundle dropped 92%: 3.1 MB → 245 KB (gzip 80.7 KB)
- node_modules: 215 → 86 packages (60% fewer)
- Build time: 3.4s → 0.8-1.1s
- dist files: 95 → 3 (97% fewer)
- Zero mermaid/cytoscape/katex/dagre artifacts in dist
- All 38 tests pass after each phase
- Mobile (390px): flow direction = column, no horizontal scroll, hour nav works
- Live site verified at https://dppa-case.web.app: prev/next cycles 12:00→13:00→14:00→13:00, all 4 flow rows render, 0 console errors
- Reports: `reports/2026-06-23-sprint-2-phase-{01,02,03}.md` + `reports/2026-06-23-sprint-2-completion.md`
- Commits pushed: `3f55863` (phase 01), `b3691f8` (phase 02), `2905211` (phase 03), plus report commits

## July Scenario Training Deck/App Consolidation — Completed locally 2026-06-26

Implemented `plans/2026-06-26-deck-app-workshop-consolidation-plan.md` with the Grill Me default: include a compact RE GENCO plant-revenue mirror in the workshop bill panel.

### Plan
- [x] PHASE-01: Correct standalone July scenario-training deck arithmetic and notation; backup created.
- [x] PHASE-02: Add app workshop presets, split DPPA fees, and pure five-line monthly bill engine.
- [x] PHASE-03: Wire workshop tabs, flat FMP curves, workshop-only monthly bill panel, and flat-axis chart guard.
- [x] PHASE-04: Add parity harnesses, run tests/build, and document deployment limitation.

### Review / Results
- Corrected deck: `ceba/DPPA Presentation July 2026 Scenario Training.pptx`; backup: `ceba/DPPA Presentation July 2026 Scenario Training.backup-2026-06-26.pptx`.
- Text QA artifact: `deck-qa/july-deck-corrections-verify.txt` confirms slide 3 notation and slide 5/6/7 corrected figures.
- App presets: Workshop 1 (strike 1,250 / FMP 1,150 / 5,000,000 kWh) and Workshop 2 (strike 1,500 / FMP 1,600 / 8,000,000 contracted + 1,000,000 retail shortfall).
- Monthly bill parity uses exact coefficient product `1.026 * 1.008 = 1.034208`; the display/default rounded coefficient remains `1.0342`.
- Verification passed: `node verify_deck_app_parity.js`, `npm.cmd test -- --run` (41 tests), and `npm.cmd run build`.
- Browser smoke was limited: Vite preview can serve HTTP 200 when run directly, but background preview did not persist and Playwright CLI fetch was blocked by permissions/network.
- Deploy blocked: `firebase.cmd` is not installed on PATH in this session. `app/deployment.md` records the manual deploy command.
- Git commit/push blocked: sandbox denies `.git/index.lock` creation, so phase commits could not be made from this session.
- Reports: `reports/2026-06-26-deck-app-consolidation-phase-01.html` through `phase-04.html`, plus `reports/2026-06-26-deck-app-consolidation-completion.md`.

## Workshop Chart Realism + Layout & Control Feedback Revision — Completed 2026-06-26

Implemented `plans/2026-06-26-workshop-chart-layout-revision-plan.md` to fix three workshop-app gaps the user raised after the consolidation shipped: flat workshop graph, buried multi-year projection, and controls that felt inert.

### Plan
- [x] PHASE-01: Realistic workshop load/solar curves + `buildWorkshopFmpCurve` (varies but stays on the deck side of strike); 5-line bill untouched (deck-exact).
- [x] PHASE-02: Move multi-year projection full-width directly below the daily-graph row; add control-effect note + illustrative-vs-authoritative caption.
- [x] PHASE-03: Verify (43 tests), build, browser smoke-check, deploy, document.

### Review / Results
- `app/src/data/default-scenarios.js`: workshop1/2 now use realistic step-function load + `solarCurve` bells (S1 overlap/matched, S2 load>gen/shortfall) and carry `fmpSide`. New exported `buildWorkshopFmpCurve(midpoint, strike, side)` centers a bounded daily curve on `marketPrice` (slider-responsive) without crossing strike: W1 ≈ 1,092–1,225 (< strike 1,250), W2 ≈ 1,542–1,680 (> strike 1,500).
- `app/src/main.js`: workshop `buildInputs` branch calls `buildWorkshopFmpCurve`; bill still uses fixed `monthlyVolumes`.
- `app/src/modules/ui.js` + `style.css`: multi-year panel relocated into `focus-column` right after the chart row; `.control-hints` and `.five-line-caption` added.
- Concern #3 diagnosed (not a render bug): chart `update('none')` path is correct; flat lines + buried multi-year masked control effects. Fixed by realism + relocation; no new controls.
- Verified: `npm test -- --run` 43/43; `npm run build` clean (250 KB / 82 KB gzip); live browser check (Workshop 2 bill CKH 18,828,262,400 with −800M CfD; balanced clears bill; multi-year in focus column; no console errors); `firebase deploy` succeeded.
- Live: https://dppa-case.web.app
- Reports: `reports/2026-06-26-phase-01-workshop-curve-realism.html`, `reports/2026-06-26-phase-02-layout-control-feedback.html`, `reports/2026-06-26-final-workshop-chart-layout-revision.html`.
- Commits: `e26bf17` (phase-01), `048ce2a` (phase-02), + phase-03/final.

## Group-Learning Workshop Module — Completed 2026-06-29

Implemented `plans/2026-06-29-dppa-scenario-group-workshop-plan.md` (full plan).
Grill-Me defaults adopted: Q-001 extract S3 from deck → fallback excess/higherGen · Q-002 learner-facing trilingual, facilitator kit EN-only · Q-003 commit only, no Firebase deploy.

### Plan
- [x] PHASE-01: Extract Scenario 3 + lock canonical number spec (`research/2026-06-29_dppa-scenario-numbers-spec.md`). Neither deck had an S3 → S3 = excess/over-generation (deck's named third case + app `higherGen`), reconciled to settlement.js.
- [x] PHASE-02: `workshop3` preset in `default-scenarios.js` + `scenarioOrder`; Vitest assertion (settlement) + profiles assertion. **44/44 pass.**
- [x] PHASE-03: `build_cfd_slide.py` → `SCENARIOS` dict (consolidated + S1/S2/S3); rendered `assets/cfd-s{1,2,3}-{en,vi,zh-cn}.gif`+`.mp4` (18 assets); consolidated outputs preserved.
- [x] PHASE-04: `lessons/0009`/`0010`/`0011` × en/vi/zh-cn (9 files) + 0007/0008 embedded charts + nav. All 11 pages 200, zero broken links.
- [x] PHASE-05: `facilitator/dppa-workshop-facilitator-guide.md` (run-of-show, answer keys S1/S2/S3, script, debrief).
- [x] PHASE-06: Verify + record `learning-records/0003` + NOTES update + commit/push.

### Review / Results
- **Scenario 3 (new, excess):** C_EVN 8,304,644,000 · CfD +750,000,000 · C_KH 9,054,644,000 · effective ~1,811 VND/kWh; excess 1,500,000 kWh → spot 1,663,200,000, foregone CfD 225,000,000. Reconciled to `buildFiveLineBill` and verified live in the app (Workshop 3 renders penny-for-penny).
- **Verification:** Vitest 44/44; `npm run build` clean (250 KB / 82 KB gzip); 0 console errors; all 11 lessons 200 OK with correct lang + no broken assets/links; 3 scenario charts visually verified.
- **Visuals:** per-scenario animated CfD charts in 3 languages with correct strike lines and callouts (S1 FMP&lt;1,250; S2 FMP&gt;1,500; S3 sunny trough &lt;1,250 with solar above load).
- **Deploy:** intentionally NOT deployed to Firebase (Q-003 default) — committed only.
