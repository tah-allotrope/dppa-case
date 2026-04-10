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

## New Round: Canvas-Native Tariff Overlay

### Plan
- [x] Remove `tariffWindows`, `renderChartStoryOverlay`, and `#chartStoryOverlay` HTML div from `ui.js`
- [x] Remove `renderChartStoryOverlay` import and call from `main.js`; pass `inputs` as 6th arg to `renderProfileChart`
- [x] Remove all HTML overlay CSS classes from `style.css`
- [x] Rewrite `chart.js` with a Chart.js custom plugin (`tariffOverlay`) that draws band fills, dashed dividers, time/tariff/spot labels, numbered callout boxes with connector lines — all on canvas
- [x] Update `ui.test.js` to match new structure (no more `renderChartStoryOverlay` references)
- [x] Run `npm test -- --run` — all 16 tests pass
- [x] Run `npm run build` — build succeeds (chunk warnings expected from Mermaid/Chart.js)
- [x] Run `firebase deploy --only hosting --project dppa-case` — deployed to https://dppa-case.web.app

### Review / Results
- All HTML overlay approaches have been fully removed. The tariff storytelling now lives exclusively inside the Chart.js canvas via a custom plugin.
- The plugin draws coloured vertical bands, dashed dividers, time/tariff/spot price labels at the top of the chart area, and three numbered callout boxes with connector lines — matching the reference screenshot in `background/Screenshot 2026-04-09 125837.png`.
- All 16 tests pass, build is clean, and the app is live at https://dppa-case.web.app.
