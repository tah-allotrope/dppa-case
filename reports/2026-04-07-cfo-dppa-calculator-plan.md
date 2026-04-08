# Vietnam DPPA CFO calculator and visual explainer plan

## Goal

Build a browser-based visual calculator that helps a non-technical CFO understand Vietnam synthetic DPPA economics by showing:

1. how factory load overlaps with solar generation;
2. how settlement changes when `load > generation`, `load = generation`, or `load < generation`;
3. why the EVN market-linked payment and the developer CfD settlement mostly cancel;
4. why the buyer's matched renewable kWh effectively ends up near:

```text
strike price + DPPA charge + loss adjustment
```

The experience should work locally in a browser for screen sharing, look polished in a neon theme, and be easy to deploy later to a free platform such as Firebase Hosting or Streamlit.

## Recommendation

Recommended first implementation: a **static single-page web app** using plain HTML/CSS/JavaScript with charting.

Why this is the best first step:

- easiest to run locally by opening a browser or using a tiny local server;
- easiest to share on screen with no backend dependency;
- easiest to deploy free on Firebase Hosting;
- best fit for highly visual interactive sliders and profile charts;
- avoids Streamlit's more app-like Python layout constraints for this presentation-first use case.

Recommended deployment path:

1. **Phase 1-4:** local static app
2. **Phase 5:** optional Firebase Hosting deployment
3. **Optional alternative:** Streamlit version later only if you want a Python-based internal tool

## Primary audience

- CFO or finance executive with limited power-market knowledge
- Energy procurement lead presenting to internal decision-makers
- Commercial reviewers comparing contract scenarios

## Core message the app must communicate

The app should make one idea visually obvious:

```text
EVN market-linked payment
+ developer CfD settlement
= roughly strike price + DPPA charge + loss adjustment for matched kWh
```

That cancellation effect is the narrative center of the product.

## Product principles

- **Visual first:** a finance leader should understand the story from the charts before reading formulas.
- **Simple language:** avoid legal/regulatory wording unless needed in tooltips.
- **Interactive:** sliders should immediately change both the profile chart and the payment results.
- **Scenario-driven:** make `load > gen`, `load = gen`, and `load < gen` easy to compare.
- **Presentation-friendly:** strong layout, large values, clean callouts, neon aesthetic, screen-share readable.
- **Trustworthy:** show formulas and assumptions clearly enough that a commercial lead can defend the logic.

## Proposed experience

### Left side: profile visualizer

Interactive chart showing hourly factory load and solar generation on the same graph.

Visual requirements:

- load profile as a bright neon line/area;
- solar profile as a contrasting neon line/area;
- shaded overlap region showing matched DPPA volume;
- highlighted shortfall region when `load > generation`;
- highlighted excess generation region when `generation > load`;
- movable scenario slider(s) that reshape profiles or switch preset scenarios.

Suggested display modes:

1. **Preset mode**
   - base load factory
   - daytime-heavy factory
   - 24/7 plant
   - office/commercial load
   - overbuilt solar case

2. **Manual mode**
   - load scale slider
   - solar capacity slider
   - strike price slider
   - market price slider
   - DPPA charge slider or fixed published value toggle
   - loss coefficient slider
   - contract quantity mode selector

### Right side: payment explainer

A live calculation panel that updates as the chart changes.

Sections:

1. **Payment to EVN**
   - matched volume x market-linked EVN charge x loss coefficient
   - plus matched volume x DPPA charge
   - plus shortfall volume x retail tariff

2. **Payment to developer**
   - CfD settlement = contract quantity x (strike price - market price)

3. **Cancellation effect**
   - show the market term on both sides crossing out visually;
   - simplify the expression step by step;
   - land on the buyer-friendly result:

```text
matched kWh ~= strike price + DPPA charge + loss adjustment
```

4. **Final KPI cards**
   - total payment to EVN
   - total payment to developer
   - total all-in buyer cost
   - effective matched kWh price
   - blended average price across full load
   - savings/premium vs no-DPPA baseline

## Interaction model

### Required controls

- scenario selector: `load > gen`, `load = gen`, `load < gen`
- hourly load scale
- solar capacity scale
- strike price
- market price / FMP
- DPPA charge
- loss coefficient
- retail tariff
- settlement quantity mode

### Settlement quantity mode options

This is commercially important and should be explicit in the UI.

Suggested modes:

1. `Matched consumption only`
2. `Allocated generation`
3. `Generation regardless of consumption`
4. `Minimum of load and generation`

This helps explain why some structures are benign while others create overgeneration risk.

## Calculation model

### Core variables

- `Q_load[t]`: hourly load
- `Q_gen[t]`: hourly solar generation
- `Q_match[t] = min(Q_load[t], Q_gen[t])`
- `Q_shortfall[t] = max(Q_load[t] - Q_gen[t], 0)`
- `Q_excess[t] = max(Q_gen[t] - Q_load[t], 0)`
- `Pc`: strike price
- `FMP`: market price
- `CFMP`: EVN market-linked price
- `KPP`: loss coefficient
- `CDPPA`: DPPA charge per kWh
- `Retail`: retail tariff for shortfall

### Buyer-side formulas to model

#### EVN payment

```text
EVN = sum over t of:
  Q_match[t] x CFMP[t] x KPP[t]
+ Q_match[t] x CDPPA[t]
+ Q_shortfall[t] x Retail[t]
```

#### Developer payment under CfD

```text
Developer = sum over t of:
  Q_contract[t] x (Pc[t] - FMP[t])
```

#### Total buyer cost

```text
Total = EVN + Developer
```

#### Simplified matched-kWh intuition

If `CFMP ~= FMP` and the contract quantity is aligned with matched consumption:

```text
matched kWh ~= strike + DPPA charge + loss adjustment
```

### Baseline comparison

The tool should also calculate a no-DPPA baseline:

```text
No DPPA = sum over t of Q_load[t] x Retail[t]
```

And then show:

```text
Savings / premium = No DPPA - Total DPPA cost
```

## Visual design direction

### Theme

The CFO prefers neon, so the design should be presentation-grade neon rather than gamer-chaos neon.

Suggested palette:

- background: deep blue-black or charcoal
- load line: electric cyan
- solar line: neon lime or bright gold-green
- EVN panel: vivid blue
- developer/CfD panel: magenta or orange neon accent
- cancellation callout: bright white or mint highlight
- warnings: amber neon

### Visual treatment

- dark glass panels with subtle blur;
- glowing chart strokes and filled overlap regions;
- oversized number cards for price outputs;
- animated transitions on slider movement;
- formula reveal cards that simplify in stages;
- screen-share-safe typography with strong contrast.

### Accessibility and presentation rules

- readable at 100% zoom on a laptop screen share;
- all critical numbers visible without scrolling on common desktop widths;
- mobile layout should work, but desktop presentation is primary;
- avoid over-animating the calculator results.

## Technical architecture

## Option A - Recommended: static front-end app

Stack:

- HTML
- CSS
- JavaScript or TypeScript
- Chart.js or Apache ECharts for profiles and stacked breakdowns

Pros:

- dead simple local run
- best for Firebase Hosting
- easy export/share
- very visual
- no backend needed

Cons:

- less natural if you later want file uploads, scenario storage, or Python-based analytics

## Option B - Alternative: Streamlit

Stack:

- Python
- Streamlit
- Plotly or Altair

Pros:

- quick to add Python calculation logic
- easy scenario forms
- simple deployment on Streamlit Community Cloud

Cons:

- harder to achieve a truly polished neon presentation layer
- less ideal for a premium CFO demo aesthetic
- more constrained interaction choreography for formula cancellation storytelling

## Recommendation summary

Start with **Option A**.

## Proposed file structure

```text
app/
  index.html
  styles.css
  main.js
  data/
    default-scenarios.js
  modules/
    profiles.js
    settlement.js
    formatters.js
    chart.js
    ui.js
  assets/
    icons/
    logo/
docs/
  assumptions.md
  formulas.md
```

## Multi-phase implementation plan

### Phase 0 - Scope lock and calculator specification

Objective:

Define exactly what the calculator must and must not do so the first build is commercially accurate and easy to explain.

Deliverables:

- agreed scope document;
- finalized buyer formulas;
- scenario definitions;
- initial wireframe;
- deployment preference confirmation.

Tasks:

- lock the core commercial story: cancellation effect around matched kWh;
- define whether the MVP uses hourly or 30-minute intervals;
- decide whether market price is flat or time-varying in v1;
- decide whether retail tariff is flat or time-of-use in v1;
- define contract quantity logic for each scenario mode;
- document assumptions that simplify the regulation for CFO use.

Acceptance criteria:

- one-page spec approved by you;
- no ambiguity on formula treatment in the MVP.

### Phase 1 - UX and visual prototype

Objective:

Build a front-end shell that already looks demo-ready before wiring full calculations.

Deliverables:

- neon design system;
- desktop-first responsive layout;
- static chart mock;
- placeholder KPI cards;
- visual formula panel skeleton.

Tasks:

- create page layout with left visual / right calculation split;
- define typography, spacing, glow effects, and panel system;
- add scenario tabs and slider styling;
- add a static profile chart to validate readability on screen share;
- add placeholder cards for EVN, developer, total, and effective kWh price.

Acceptance criteria:

- CFO-facing aesthetic approved;
- numbers and graph readable on a shared screen.

### Phase 2 - Calculation engine

Objective:

Implement the underlying settlement math in a clean, testable module.

Deliverables:

- settlement engine functions;
- scenario state model;
- formatting helpers;
- test cases against the worked examples already documented.

Tasks:

- implement hourly arrays for load and generation;
- calculate matched, shortfall, and excess volumes;
- implement EVN payment logic;
- implement developer CfD logic;
- implement baseline no-DPPA comparison;
- implement simplified cancellation view;
- validate against the example cases in the report.

Acceptance criteria:

- outputs reproduce the known example numbers within agreed rounding tolerance;
- logic is isolated from UI code.

### Phase 3 - Interactive profile and scenario controls

Objective:

Connect sliders and scenario presets to the chart and live calculations.

Deliverables:

- interactive load/generation chart;
- preset scenario library;
- slider-driven recalculation;
- contract quantity mode switch.

Tasks:

- implement preset profiles for different load shapes;
- implement solar curve scaling and shifting if needed;
- wire controls to recalculate metrics on change;
- animate transitions smoothly but lightly;
- show overlap, shortfall, and excess visually.

Acceptance criteria:

- moving controls updates graph and numbers instantly;
- the three key scenarios are visually obvious.

### Phase 4 - Cancellation-effect explainer

Objective:

Turn the math into a CFO-friendly narrative that explains why the market price mostly cancels.

Deliverables:

- step-by-step formula simplifier;
- visual term cancellation treatment;
- plain-English tooltips;
- headline takeaway summary.

Tasks:

- show EVN market term and developer market term side by side;
- animate or highlight the cancellation relationship;
- collapse the formula to `strike + DPPA charge + loss adjustment`;
- explain where the simplification breaks when settlement quantity is not aligned;
- add a warning state for overgeneration/CfD mismatch.

Acceptance criteria:

- a finance audience can explain the cancellation effect back after a short demo;
- the app clearly distinguishes matched-kWh price from blended full-load average price.

### Phase 5 - Local presentation packaging

Objective:

Make the tool reliable and frictionless for local demos.

Deliverables:

- local run instructions;
- single command local server or open-in-browser workflow;
- optional presentation mode;
- reset-to-default scenarios button.

Tasks:

- ensure static assets load correctly locally;
- add a clean default opening state;
- add full-screen presentation polish;
- add branded footer/source note;
- create a short presenter script if helpful.

Acceptance criteria:

- you can launch it locally in under one minute;
- no technical setup friction during a screen share.

### Phase 6 - Free deployment

Objective:

Publish the tool for easy remote access.

Preferred path: Firebase Hosting

Deliverables:

- production-ready static build;
- Firebase Hosting configuration;
- public URL;
- deployment README.

Tasks:

- prepare deployable static folder;
- configure Firebase Hosting;
- publish to a stable URL;
- verify desktop/mobile behavior after deployment.

Acceptance criteria:

- tool is accessible via public HTTPS link;
- deployment is repeatable in a few commands.

### Phase 7 - Optional advanced enhancements

Objective:

Add deeper commercial usefulness after the core explainer is successful.

Potential enhancements:

- upload custom hourly load CSV;
- upload custom solar profile CSV;
- save and compare scenarios;
- export PDF summary for finance committee packs;
- toggle between hourly and 30-minute settlement;
- multiple tariff periods;
- REC/carbon value overlay;
- sensitivity heatmap for strike price vs market price;
- compare different contract quantity rules side by side.

## Testing and verification plan

### Functional verification

- check known example values from the existing report;
- verify `load > gen`, `load = gen`, and `load < gen` outputs;
- verify matched price, blended price, and baseline comparison independently;
- verify overgeneration warning logic.

### UX verification

- validate the chart is understandable in under 30 seconds;
- validate the formula panel is understandable in under 60 seconds;
- validate critical KPI cards remain visible on a normal laptop screen.

### Commercial verification

- confirm that matched-kWh pricing is not confused with whole-load average pricing;
- confirm treatment of contract quantity modes is explicit;
- confirm assumptions are clearly labeled as educational simplifications where needed.

## Risks and mitigation

### Risk 1 - Oversimplifying the regulation

Mitigation:

- clearly label the tool as a buyer explainer, not a legal settlement engine;
- include an assumptions drawer;
- keep formulas traceable.

### Risk 2 - CFO confuses matched cost with blended plant cost

Mitigation:

- always show both values side by side;
- label them distinctly and repeatedly.

### Risk 3 - Overgeneration story is hidden

Mitigation:

- always visualize excess generation in the chart;
- show warning banners when contract quantity exceeds useful consumption.

### Risk 4 - Neon design hurts readability

Mitigation:

- use restrained glow and strong contrast;
- design for executive readability first, style second.

## Open decisions for review

These should be confirmed before implementation starts:

1. Should v1 use **hourly** intervals for simplicity, or **30-minute** intervals for closer realism?
2. Should v1 assume **flat market price** and **flat retail tariff**, or include time-of-day variation immediately?
3. Should the default story emphasize **matched consumption settlement** or explicitly showcase the riskier **generation-based settlement** first?
4. Do you want the first version branded as an internal finance explainer, or kept visually neutral?
5. Do you want a simple **public-share deployment** in scope now, or only after local review?

## Suggested MVP boundary

To keep the first version sharp, I recommend the MVP include:

- one polished single-page web app;
- hourly load and solar profiles;
- three preset scenarios plus manual sliders;
- EVN vs developer vs total payment breakdown;
- cancellation-effect explainer;
- baseline comparison;
- local browser run;
- optional Firebase deployment afterward.

I recommend excluding from MVP:

- CSV upload;
- authentication;
- persistent scenario saving;
- multi-user collaboration;
- full legal/regulatory annexes inside the app.

## Recommended next step

Review this plan and approve:

1. the **static web app approach**;
2. the **MVP scope**;
3. the **Phase 0 assumptions**, especially interval granularity and contract quantity mode.

Once approved, the next document should be a tighter implementation spec with wireframe-level screen definitions and precise formula handling for the MVP.
