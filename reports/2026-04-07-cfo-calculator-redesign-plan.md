# CFO calculator redesign plan

## Goal

Refine the current DPPA CFO calculator so it feels less like a dashboard and more like a presentation tool for a finance audience.

The redesign should:

1. place the profile chart at the center of attention;
2. reduce header and control clutter;
3. add the company logo at the top;
4. support a VND/USD toggle using `26,500 VND = 1 USD`;
5. simplify inputs by removing unnecessary scale controls;
6. move controls lower and give the cancellation section a more prominent explanatory position;
7. let you click a point in time on the profile chart and instantly see the EVN and developer payment logic for that time block, visually.

## What changed from the first MVP

The first MVP proved the formula logic and overall narrative, but the feedback shows it is still too control-heavy for a CFO demo.

The redesign should shift the product from:

- an interactive calculator with many visible knobs,

to:

- a guided visual explainer where the chart is primary and the math appears only when needed.

## Design objectives

### 1. Presentation-first layout

The top of the page should feel lighter and tighter.

- add company logo in the top bar;
- reduce vertical space used by the current "Neon CFO calculator" hero;
- keep the title, but compress it into a compact presentation header;
- keep the load-vs-generation visual above the fold as the dominant element.

### 2. Chart-first storytelling

The profile chart should become the main storytelling canvas.

- the chart should occupy more horizontal and visual weight;
- the matched/shortfall/excess summary should sit on the same horizontal line or same visual zone as the chart header instead of taking its own large block beneath the chart;
- the chart should be the first thing a CFO notices.

### 3. Visual point-in-time explanation

The most important new feature is time-specific explanation.

When clicking a point or node on the load-vs-generation chart:

- the selected hour should be highlighted;
- the app should show whether that hour is `load > generation`, `load = generation`, or `load < generation`;
- the app should show the EVN and developer payment during that hour visually;
- the app should explain the cancellation effect for that hour, not only in aggregate.

This should make the per-kWh logic more intuitive for a non-technical finance audience.

## Requested changes translated into product requirements

## Header and branding

### Requirement

Add the uploaded company logo in the top area and reduce the vertical footprint of the title block.

### Implementation notes

- place logo at top-left in a compact brand bar;
- move title and subtitle into a shorter header strip;
- remove or compress the current chip row if it competes with the main chart;
- keep enough branding for screen sharing without turning the top of the page into a banner.

### Acceptance criteria

- logo is visible and crisp;
- top header uses significantly less height than current MVP;
- main chart is visible sooner without scrolling.

## Chart and summary layout

### Requirement

Keep the profile chart as the focal area and reduce the footprint of matched/shortfall/excess metrics.

### Implementation notes

- move matched/shortfall/excess into small compact pills or micro-cards near the chart title or in the same row as the chart header;
- avoid a separate large summary row under the chart;
- increase the chart height slightly if space allows;
- use solar in **yellow**, not lime.

### Acceptance criteria

- the chart remains the dominant visual block on first view;
- summary values remain visible but do not visually compete with the chart;
- solar generation is clearly yellow and visually distinct from load.

## Currency toggle

### Requirement

Support switching all financial outputs between VND and USD using:

```text
1 USD = 26,500 VND
```

### Implementation notes

- add a global currency toggle in a compact location near the top-right or in the calculation area;
- convert all displayed financial amounts, KPI cards, tooltips, and point-in-time payment panels;
- keep internal calculations in VND for consistency;
- per-kWh metrics should also toggle;
- labels must clearly show whether the view is in `VND/kWh`, `USD/kWh`, `VND`, or `USD`.

### Acceptance criteria

- all displayed monetary outputs switch consistently;
- no calculation logic changes internally;
- the toggle feels instant and presentation-safe.

## Controls simplification

### Requirement

Remove `load scale` and `solar scale` from the visible controls for now.

### Implementation notes

- keep default profiles only;
- retain scenario tabs for `load > gen`, `load = gen`, and `load < gen`;
- move the remaining controls such as strike price, market price, DPPA charge, loss factor, retail tariff, and settlement mode to the bottom section of the page;
- compress the controls visually so they look secondary, not primary.

### Acceptance criteria

- top half of the page is less cluttered;
- profile scenarios are still easy to switch;
- pricing controls remain available but visually de-emphasized.

## Cancellation-effect panel relocation

### Requirement

Move the cancellation-effect explainer into the space currently occupied by the controls block.

### Implementation notes

- the upper-right area should become a more visual explanation panel rather than a form area;
- this panel should support both aggregate explanation and selected-hour explanation;
- the controls should shift to a lower section below the main storytelling area.

### Acceptance criteria

- the explanation panel feels more central and useful than the current control block;
- the page reads more like a story than a dashboard.

## Point-in-time payment explainer

### Requirement

Allow clicking the load-vs-generation chart to inspect payment logic at a specific hour.

### Core story to show

At the selected hour, the app should answer:

1. how much of load is matched by solar;
2. how much is shortfall or excess;
3. what is paid to EVN in that hour;
4. what is paid to the developer in that hour;
5. what the effective matched-kWh price is for that hour;
6. whether the market-linked terms are cancelling cleanly or not.

### Recommended UI pattern

Recommended design: a **selected-hour explainer card** with a compact process diagram.

Suggested structure:

- top: selected time badge, for example `11:00 - 12:00`;
- left mini-state card: `load > gen`, `load = gen`, or `load < gen`;
- center visual flow:
  - load and generation bars or capsules for the selected hour;
  - a matched portion highlighted;
  - shortfall or excess highlighted;
- right calculation diagram:
  - EVN payment block;
  - developer payment block;
  - total block;
  - simplified result block.

### Diagram behavior

When a point is selected:

- update the selected-hour explainer instantly;
- highlight the selected hour on the main chart;
- update payment terms for that hour only;
- show one-line English explanation such as:

```text
At 13:00, solar exceeds your load, so EVN bills only the matched market-linked energy plus DPPA charge, while the developer CfD may still settle on excess contracted volume depending on settlement mode.
```

### Visual options for the explainer

Option A - Recommended:

- Sankey-style or flow-card diagram built with HTML/CSS blocks
- easier to control visually and easier to theme than a true graph library

Option B:

- stacked mini-bars for load/generation plus formula boxes

Option C:

- radial or circular explainer
- likely too decorative and less clear for finance discussion

### Recommendation (agreed)

Use **Option A** for clarity and polish with toggle for option B view

## Proposed revised layout

## Top strip

- company logo
- compact title
- currency toggle
- maybe one tiny subtitle or label

## Main storytelling row

### Left side

- large load-vs-generation chart
- compact scenario tabs
- compact matched/shortfall/excess pills near chart title

### Right side

- cancellation-effect explainer
- selected-hour payment explainer
- top KPI summary for total / matched-kWh / blended average

## Lower utility row

- pricing controls
- settlement quantity mode selector
- assumptions drawer or simplified notes

This layout keeps the story on top and the tuning controls below.

## Revised information hierarchy

The page should communicate in this order:

1. **What is happening physically?**
   - load versus solar chart

2. **What happens at this selected time?**
   - point-in-time explainer

3. **Why does the market term cancel?**
   - cancellation diagram

4. **What are the financial results overall?**
   - KPI cards

5. **What assumptions or inputs are driving the scenario?**
   - controls and notes below

## Calculation model additions

The current engine already supports interval-level calculations, which is good.

The redesign should expose selected-interval outputs explicitly.

### Selected interval outputs needed

For the selected hour `t`, compute and display:

- `load[t]`
- `generation[t]`
- `matched[t]`
- `shortfall[t]`
- `excess[t]`
- `contract quantity[t]`
- `EVN market component[t]`
- `EVN DPPA charge[t]`
- `EVN retail shortfall[t]`
- `developer CfD[t]`
- `total buyer cost[t]`
- `effective matched price[t]` where applicable

### Additional logic for selected state label

The app should derive a plain-language state:

- if `load > generation` -> `Shortfall hour`
- if `load = generation` -> `Balanced hour`
- if `generation > load` -> `Excess solar hour`

This label should drive both color and explanation copy.

## Multi-phase redesign plan

### Phase A - Visual hierarchy redesign

Objective:

Restructure the page so the chart and explanation dominate, while controls move lower and branding becomes compact.

Tasks:

- add company logo to a compact top bar;
- reduce hero height;
- move currency toggle into the header;
- move compact metric pills into chart header area;
- move controls to the bottom zone;
- move cancellation panel into the current controls area.

Deliverables:

- revised layout shell;
- new header;
- updated chart card structure;
- bottom controls section.

Acceptance criteria:

- top half feels presentation-first;
- chart is clearly the dominant block.

### Phase B - Currency and formatting layer

Objective:

Support seamless VND/USD switching without changing the underlying calculation engine.

Tasks:

- create display currency state;
- add conversion helpers using `26,500` exchange rate;
- update KPI cards, selected-hour explainer, chart tooltips, and formulas;
- ensure unit labels update consistently.

Deliverables:

- currency toggle;
- unified money formatter layer;
- updated UI labels.

Acceptance criteria:

- all visible monetary amounts switch consistently and correctly.

### Phase C - Selected-hour interaction

Objective:

Turn the chart into an interactive explainer for point-in-time DPPA settlement.

Tasks:

- capture click events on chart points or nearest hour;
- highlight selected hour on chart;
- build selected-hour state panel;
- compute selected-hour payment components from existing interval results;
- show visual payment flow for EVN and developer;
- update narrative copy by hour type.

Deliverables:

- selected-hour interaction model;
- payment flow explainer card;
- hour-specific calculation display.

Acceptance criteria:

- clicking the chart immediately explains what is being paid in that hour;
- the CFO can understand the settlement visually without reading dense formulas.

### Phase D - Narrative refinement and polishing

Objective:

Make the redesign feel polished and presentation-safe.

Tasks:

- switch solar color to yellow and refine the visual palette;
- reduce noisy text and emphasize one-line explanations;
- improve spacing and hierarchy for KPI cards;
- make the selected-hour story and aggregate story complement each other;
- improve mobile fallback without compromising desktop presentation.

Deliverables:

- refined color system;
- simplified copy;
- presentation-quality polish.

Acceptance criteria:

- screen-share readability improves;
- page feels more intentional and less tool-like.

### Phase E - Validation pass

Objective:

Verify that the redesigned app still explains the commercial logic correctly.

Tasks:

- test VND/USD toggling;
- test selected-hour explanation for all three core scenario types;
- confirm the selected-hour numbers match interval calculations;
- confirm aggregate totals still match the existing engine;
- visually verify layout and click behavior in browser.

Deliverables:

- verified redesigned app;
- short testing notes;
- optional follow-up phase report.

Acceptance criteria:

- redesign improves usability without breaking finance logic.

## Risks and mitigations

### Risk 1 - Too much information in the selected-hour panel

Mitigation:

- use a visual flow with only a few numbers shown prominently;
- hide secondary detail behind small captions, not large paragraphs.

### Risk 2 - Currency toggle creates confusion between VND and USD

Mitigation:

- keep unit labels visible everywhere;
- use one shared formatter for all monetary outputs.

### Risk 3 - Click interaction on chart feels imprecise

Mitigation:

- snap to nearest hour;
- show selected hour badge clearly;
- optionally add hover preview later.

### Risk 4 - Page loses the aggregate story while focusing on selected hours

Mitigation:

- retain top-level KPI cards and cancellation summary;
- position selected-hour explainer as a drill-down, not a replacement.

## MVP boundary for the redesign (agreed)

I recommend the redesign MVP include:

- compact branded header with logo;
- yellow solar line;
- smaller matched/shortfall/excess pills in chart header;
- VND/USD toggle;
- removal of load and solar scale controls;
- bottom controls section;
- cancellation panel in upper-right;
- clickable selected-hour explainer with visual payment flow.

I recommend excluding for this redesign pass:

- deployment work;
- custom file upload;
- additional profile creation tools;
- advanced animations beyond subtle highlighting.

## Open items to confirm before implementation

1. Where exactly is the uploaded logo file located in the workspace?
2. Do you want the selected-hour explainer to default to the noon hour on initial load, or no selection until clicked?
3. For the visual payment flow, do you prefer a more corporate style or a more neon-illustrative style?
4. Should the KPI cards remain in the upper-right, or should some of them move below the selected-hour panel?

## Recommended next step

Review this redesign plan first.

Once approved, the next implementation pass should focus on:

1. compact header + layout restructuring,
2. currency toggle,
3. selected-hour explainer interaction,
4. final visual polish.
