---
title: "DPPA Web App as Live Workshop Tool (Multi-Year + Recalibration)"
date: "2026-06-22"
status: "complete — bulk-corrected 2026-07-31 per directive: plan predates 2026-07-20 and is presumed fully implemented (NOT individually verified against git/code evidence)"
request: "Based on brainstorm dppa-app-deck-consolidation: grow the web app into the live workshop tool with multi-year BAU-vs-DPPA and verified 2026 calibration"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-06-22_dppa-app-deck-consolidation-brainstorm.md"
  - "research/2026-06-22_vietnam-dppa-2026.md"
---

# Plan: DPPA Web App as Live Workshop Tool (Multi-Year + Recalibration)

## Objective
Turn the single-day DPPA calculator into the live engine that powers the CEBA workshop: recalibrate it to verified 2026 values and add a multi-year BAU-vs-DPPA horizon view (escalation + cumulative cost), while keeping it a buyer-facing teaching tool. This lets facilitators manipulate the deck's cases live instead of showing static slides.

## Context Snapshot
- **Current state:** App models a 24-hour synthetic day only — five-line settlement + cancellation effect (`app/src/modules/settlement.js`), 3 load/gen profiles + 3 settlement modes (`app/src/data/default-scenarios.js`), flat slider prices, single period. Defaults are stale/contradictory: code retail `2100` / strike `2100` vs `app/docs/assumptions.md` retail `1,833` / strike `1,741.35`; folded `lossFactor 1.027263` ≠ k×K_pp (1.026×1.008 = 1.0342). `dppaCharge 523.34` is correct.
- **Desired state:** Defaults recalibrated to verified 2026 basis; a multi-year layer computes Year 1 / 10-yr / lifetime cumulative cost for BAU and DPPA with separate EVN and strike escalation; FMP clearly labeled illustrative; docs reconciled; tests green.
- **Key repo surfaces:** `app/src/data/default-scenarios.js`, `app/src/modules/settlement.js`, `app/src/modules/ui.js`, `app/src/modules/chart.js`, `app/src/modules/formatters.js`, `app/src/modules/*.test.js`, `app/docs/assumptions.md`, `app/docs/formulas.md`, `app/index.html`.
- **Out of scope:** Developer IRR/NPV/DSCR/three-gates; BESS sizing; full TOU tariff table as live input; seasonality / 8760-hour / real meter data; auto-generating the deck (see deck plan).

## Research Inputs
- `research/2026-06-22_dppa-app-deck-consolidation-brainstorm.md` — Fixes scope: DEC-001 (live workshop tool), DEC-002 (multi-year only), DEC-003 (representative day × 365 + escalation), DEC-004 (EVN+strike escalation sliders + horizon), DEC-005 (adopt verified values, flag FMP).
- `research/2026-06-22_vietnam-dppa-2026.md` — Supplies verified numbers: retail 2,204.07 VND/kWh (Dec 599/QD-EVN, May 2025); fixed fees 360+163.3=523.3; k≈1.026, K_pp≈1.008 → 1.0342; EVN escalation ~4%/yr; FMP not publicly published (label illustrative).

## Assumptions and Constraints
- **ASM-001:** Annual cost = representative-day total × 365; acceptable teaching simplification (no seasonality).
- **ASM-002:** Lifetime horizon default 20 yr (adjustable); strike escalation default 4%/yr fixed-VND with index label.
- **ASM-003:** The 3 canonical case keys already exist via `classifyInterval` (shortfall/balanced/excess) and are reused, not rebuilt.
- **CON-001:** App remains "teaching tool, not a legal settlement engine"; multi-year is a buyer decision lens.
- **CON-002:** FMP and exact fee VND remain publicly unverifiable — must render with an "illustrative" label.
- **DEC-001:** Keep the existing hourly engine; the multi-year layer wraps `calculateSettlement`, it does not replace it.

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Recalibrate defaults + reconcile docs | None | Corrected `default-scenarios.js`, updated docs, green tests |
| PHASE-02 | Multi-year escalation engine | PHASE-01 | `projectMultiYear()` + unit tests |
| PHASE-03 | Multi-year UI (controls + horizon view) | PHASE-02 | Escalation sliders, horizon selector, cumulative cost panel |
| PHASE-04 | FMP labeling + verification pass | PHASE-03 | Illustrative labels, full test/build/manual check |

## Detailed Phases

### PHASE-01 - Recalibrate defaults and reconcile docs
**Goal**
Bring all numeric defaults to the verified 2026 basis and remove the doc/code contradiction.

**Tasks**
- [ ] TASK-01-01: In `app/src/data/default-scenarios.js`, set `retailTariff: 2204`, `lossFactor: 1.0342`, keep `dppaCharge: 523.34`; reconcile `strikePrice`/`marketPrice` defaults to a documented basis (strike default = retail-linked teaching value; record the choice inline).
- [ ] TASK-01-02: Update `app/docs/assumptions.md` to match the code exactly (retail 2,204; fees 360+163.3; loss k×K_pp=1.0342; cite `research/2026-06-22_vietnam-dppa-2026.md`); delete the stale 1,833 / 1,741.35 lines.
- [ ] TASK-01-03: Update `app/docs/formulas.md` if any constant references changed.
- [ ] TASK-01-04: Update `app/src/modules/settlement.test.js` and `profiles.test.js` expected values to the new constants.

**Files / Surfaces**
- `app/src/data/default-scenarios.js` — defaults are the single source of calibration.
- `app/docs/assumptions.md`, `app/docs/formulas.md` — must agree with code.
- `app/src/modules/settlement.test.js`, `app/src/modules/profiles.test.js` — encode expected outputs.

**Dependencies**
- None.

**Exit Criteria**
- [ ] `npm test` passes with recalibrated constants.
- [ ] `assumptions.md` and `default-scenarios.js` state identical retail/fee/loss values.

**Phase Risks**
- **RISK-01-01:** Test snapshots hard-code old totals → update expected values in the same commit; do not weaken assertions.

### PHASE-02 - Multi-year escalation engine
**Goal**
Add a pure function that projects annualized BAU and DPPA cost across a horizon with independent escalation.

**Tasks**
- [ ] TASK-02-01: Add `projectMultiYear(result, opts)` to `app/src/modules/settlement.js` where `opts = { years, evnEscalation, strikeEscalation }`. Year n: `bau_n = baselineCost*365*(1+evnEsc)^(n-1)`; DPPA = recompute with strike and retail escalated per year (retail affects shortfall + BAU; FMP held flat unless provided).
- [ ] TASK-02-02: Return per-year and cumulative arrays plus Year 1 / 10-yr / lifetime rollups and `savingsVsBau` per horizon.
- [ ] TASK-02-03: Add `settlement.test.js` cases: flat (esc=0) equals 365× single-day; escalation compounds correctly; crossover year where DPPA beats BAU is detected.

**Files / Surfaces**
- `app/src/modules/settlement.js` — wraps existing `calculateSettlement`; no engine rewrite.
- `app/src/modules/settlement.test.js` — new multi-year assertions.

**Dependencies**
- PHASE-01 (correct constants).

**Exit Criteria**
- [ ] Multi-year function unit-tested; flat-escalation result == 365× single-day totals.

**Phase Risks**
- **RISK-02-01:** Double-escalating retail (in both BAU and shortfall) is correct but easy to mis-wire → assert with a hand-computed 2-year fixture.

### PHASE-03 - Multi-year UI (controls + horizon view)
**Goal**
Expose escalation controls and a cumulative-cost view in the existing single-screen layout.

**Tasks**
- [ ] TASK-03-01: Add to `app/index.html` controls: EVN escalation slider, strike escalation slider (+ index label fixed/CPI/USD), horizon selector (Year 1 / 10-yr / lifetime), lifetime-years input (default 20).
- [ ] TASK-03-02: Wire state + `data-output` bindings in `app/src/modules/ui.js`; default EVN escalation 4%, strike escalation 4%.
- [ ] TASK-03-03: Render a cumulative BAU-vs-DPPA panel (table or small chart via `app/src/modules/chart.js`) showing cost by horizon and the crossover year.
- [ ] TASK-03-04: Add a one-line "evaluate over 10-yr/lifetime, not Year 1" framing note (deck slide 16/30 thesis).

**Files / Surfaces**
- `app/index.html` — control markup.
- `app/src/modules/ui.js` — render + state binding.
- `app/src/modules/chart.js` — optional cumulative-cost chart.

**Dependencies**
- PHASE-02.

**Exit Criteria**
- [ ] Moving escalation sliders updates the horizon panel live; Year 1 vs lifetime savings differ as expected.

**Phase Risks**
- **RISK-03-01:** UI crowding on the single screen → place multi-year as a dedicated panel/section, not inline with hourly controls.

### PHASE-04 - FMP labeling and verification
**Goal**
Make unverifiable inputs honest and prove the whole app works.

**Tasks**
- [ ] TASK-04-01: Label FMP/market-price control "illustrative — pending NSMO/ERAV source" in `index.html`/`ui.js`; add the same caveat to `assumptions.md`.
- [ ] TASK-04-02: Run `npm test` and `npm run build`; fix fallout.
- [ ] TASK-04-03: Manual smoke: load app, click an hour, toggle horizons, switch VND/USD, confirm cancellation strip + cumulative panel render.

**Files / Surfaces**
- `app/index.html`, `app/src/modules/ui.js`, `app/docs/assumptions.md`.

**Dependencies**
- PHASE-03.

**Exit Criteria**
- [ ] `npm test` and `npm run build` both pass; manual smoke clean.

**Phase Risks**
- **RISK-04-01:** Build pulls stale dist → rebuild and verify `app/dist` reflects new copy.

## Verification Strategy
- **TEST-001:** `cd app && npm test` — settlement (incl. multi-year), profiles, ui, formatters.
- **TEST-002:** `cd app && npm run build` — static build succeeds.
- **MANUAL-001:** Run `npm run dev`, exercise escalation sliders + horizon selector, confirm crossover-year behavior and FMP label.
- **OBS-001:** N/A (static client app).

## Risks and Alternatives
- **RISK-001:** Scope creep toward developer economics — explicitly excluded (DEC-002); reject in review.
- **ALT-001:** 8760-hour/monthly engine — rejected (DEC-003) as heavier and needing real data.
- **ALT-002:** Generate the deck from the app — deferred; not part of the workshop-tool goal.

## Grill Me
1. **Q-001:** What FMP value (and source) should be the default once available?
   - **Recommended default:** Keep deck's ~1,427 labeled illustrative until an NSMO/ERAV figure is supplied.
   - **Why this matters:** FMP is the one input that materially moves results.
   - **If answered differently:** A primary-sourced FMP becomes the default and the "illustrative" label is dropped.
2. **Q-002:** Lifetime horizon and strike-escalation index defaults (20 vs 25 yr; fixed/CPI/USD)?
   - **Recommended default:** 20-yr, 4%/yr fixed-VND, both adjustable.
   - **Why this matters:** Sets the cumulative-cost baseline; deck case studies use 25-yr.
   - **If answered differently:** Default horizon/index change; verification fixtures adjust accordingly.

## Suggested Next Step
Answer Grill Me Q-001/Q-002, then execute PHASE-01.
