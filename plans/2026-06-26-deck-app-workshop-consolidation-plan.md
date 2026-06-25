---
title: "July 2026 Scenario-Training Deck ↔ Web App Consolidation"
date: "2026-06-26"
status: "draft"
request: "Based on the brainstorm brief, create a multi-phase plan to review the new 'DPPA Presentation July 2026 Scenario Training.pptx' for errors and consolidate it with the web app for combined flip-to-flip use at the July workshop."
plan_type: "multi-phase"
research_inputs:
  - "research/2026-06-26_deck-app-workshop-consolidation-brainstorm.md"
  - "deck-qa/consolidation-map.md"
---

# Plan: July 2026 Scenario-Training Deck ↔ Web App Consolidation

## Objective
Make the new standalone facilitator deck `ceba/DPPA Presentation July 2026 Scenario Training.pptx`
arithmetically correct, then make the web app reproduce the deck's two worked scenarios
**penny-for-penny** so a presenter can flip between the deck (worked reference) and the live app
(interactive demo) at the July workshop and every figure matches. Time-boxed: the workshop is this July.

## Context Snapshot
- **Current state:**
  - The deck is the standalone extract of the workshop interactive exercise (legacy pre-alignment
    numbers): Scenario 1 matched (strike `Pc` 1,250 / FMP 1,150, 5,000,000 kWh/month) and Scenario 2
    shortfall (strike 1,500 / FMP 1,600, 8,000,000 contracted + 1,000,000 residual at retail).
  - **Confirmed deck bug:** Scenario 1's four EVN lines sum to `8,563,196,000` but slide 5 states
    `8,263,196,000` (a `5→2` typo, off by 300M). It cascades to slide 6 (`CKH` shows 8,763,196,000,
    should be 9,063,196,000) and slide 7 (EVN box "8.2B" should be "8.5B"; "6.2B on the spot market"
    should be "5.8B" = gross market revenue `5,040,000 × 1,150`, per slide 11's convention).
    Scenario 2 (slides 9–11) verifies correctly.
  - The web app (`app/`, deployed https://dppa-case.web.app) is an hourly 24-interval model with 3
    curve scenarios and a single-midpoint FMP curve (defaults strike 2,000 / FMP 1,427). Its per-unit
    settlement formulas already mirror the deck's 5-line bill; only **strike/FMP** and the **time base**
    (monthly lump vs hourly curve) differ. Shared constants already match: fees `360+163.3=523.3`
    (app stores combined `523.34`), loss `1.0342` (k 1.026 × Kpp 1.008), retail `2,204`.
- **Desired state:**
  - Deck arithmetic corrected (slides 5–7) + slide-3 notation normalized; deck stays standalone.
  - App gains 2 presets ("Workshop 1 — matched", "Workshop 2 — shortfall") reproducing the deck
    penny-for-penny, with a 5-line monthly bill readout shown **only** for those presets, alongside
    the existing 3 curve scenarios.
  - An automated cross-check proves deck numbers == app engine output (no LibreOffice/PowerPoint here).
- **Key repo surfaces:**
  - `ceba/DPPA Presentation July 2026 Scenario Training.pptx` (edit; back up first).
  - `app/src/data/default-scenarios.js` (fee split; workshop presets w/ overrides + monthly volumes + flat FMP flag).
  - `app/src/modules/settlement.js` (new `buildFiveLineBill`; optional plant-revenue mirror).
  - `app/src/main.js` (scenario switch applies overrides + refresh controls; flat-FMP in `buildInputs`; render bill panel).
  - `app/src/modules/ui.js` (scenario tabs incl. workshop presets; `renderFiveLineBill` panel + shell slot).
  - `app/src/modules/chart.js` (flat-FMP secondary-axis handling).
  - `app/src/style.css` (bill panel styling).
  - `app/src/modules/settlement.test.js`, `profiles.test.js`, `ui.test.js` (update + add cases).
  - New `verify_deck_app_parity.py` (cross-check harness).
- **Out of scope:** merging the July deck into `ceba/CEBA DPPA 2026.pptx`; any change to the main
  45-slide deck; retuning the existing 3 curve scenarios; multi-year (`projectMultiYear`) changes;
  deck layout/wording beyond arithmetic/label/notation; visual PNG render QA.

## Research Inputs
- `research/2026-06-26_deck-app-workshop-consolidation-brainstorm.md` — supplies all 8 resolved
  decisions (DEC-001..008), assumptions (ASM-001..005), constraints (CON-001..004), and the one open
  question (plant-revenue mirror). Drives the whole phase split and the penny-for-penny approach.
- `deck-qa/consolidation-map.md` — confirms this deck is the legacy "Scenario 1/3" extract and provides
  the verified 2026 number basis (523.3 fees, 1.0342 loss, 2,204 retail) the app already aligns to;
  confirms only strike/FMP and time base differ.

## Assumptions and Constraints
- **ASM-001:** Split the app fee into `dppaServiceFee = 360` + `dppaClearingFee = 163.3` (sum **523.3**,
  correcting the current 523.34). The combined value still drives the per-hour `evnDppa`; the split is
  needed to render the deck's separate lines 2 and 3. `settlement.test.js:267` must be updated.
- **ASM-002:** Workshop presets carry **explicit monthly volumes** (S1: contracted = total = 5,000,000;
  S2: contracted = 8,000,000, total = 9,000,000 → shortfall 1,000,000). The 5-line bill is computed
  directly from these (decoupled from the 24×days hourly aggregation); the hourly chart for these
  presets shows illustrative flat lines and the bill is authoritative.
- **ASM-003:** Workshop presets use a **flat FMP** (all 24 hours = preset FMP), so the engine collapses
  to the deck's flat-FMP monthly total and the cross-check is exact.
- **ASM-004:** If the plant-revenue mirror (Grill Me Q-001) is built, generator-side volume uses
  **Kpp only** (`Qm = contracted × 1.008`) while the customer market line uses k × Kpp (1.0342) — the
  deck's intentional asymmetry (slides 6/10 vs 5/9).
- **ASM-005:** The 5-line bill readout supports the existing VND/USD toggle; deck comparison is in VND.
- **DEC-001..008 (from brainstorm):** deck standalone; flip-to-flip; deck = source of truth; 2 penny-for-penny
  presets + bill readout; keep existing 3 scenarios; bill workshop-only; fix all deck math + slide-7 +
  notation (backup first); verify via Python cross-check harness + Vitest.
- **CON-001:** No LibreOffice/PowerPoint/unoconv on this machine → correctness proven by harness + tests
  + manual figure read-through, not PNG render.
- **CON-002:** Edit the `.pptx` with `python-pptx` via the `py` launcher (Python 3.14, python-pptx 1.0.2);
  the default `python` (3.11) lacks the module. Set `PYTHONIOENCODING=utf-8` or write to a UTF-8 file to
  avoid the cp1252 console crash on `−`/unicode.
- **CON-003:** All 38 existing app tests must still pass; new presets must not alter the existing 3
  scenarios' numbers or break their panels.
- **CON-004:** Main CEBA deck untouched.

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Fix the deck's arithmetic + notation (backup first) | None | Corrected `.pptx` + backup + `deck-qa` verify note |
| PHASE-02 | App data + engine: fee split, workshop presets, `buildFiveLineBill`, flat-FMP | None | Updated `default-scenarios.js`, `settlement.js` + unit tests |
| PHASE-03 | App UI: workshop tabs, bill panel (workshop-only), chart flat-FMP | PHASE-02 | Updated `ui.js`, `main.js`, `chart.js`, `style.css` + UI tests |
| PHASE-04 | Cross-check harness + full verification + build/deploy | PHASE-01, PHASE-03 | `verify_deck_app_parity.py`, green tests/build, deployed app |

## Detailed Phases

### PHASE-01 - Deck Arithmetic & Notation Correction
**Goal**
Correct Scenario 1's propagating total error and slide-7 flow figures, and normalize slide-3 coefficient
notation — arithmetic/label only, no layout or wording changes. Independent of all app work.

**Tasks**
- [ ] TASK-01-01: Copy `ceba/DPPA Presentation July 2026 Scenario Training.pptx` to
  `ceba/DPPA Presentation July 2026 Scenario Training.backup-2026-06-26.pptx`.
- [ ] TASK-01-02: Write `apply_deck_corrections.py` (uses `py` / python-pptx) that opens the deck and,
  via run-level text replacement (preserve formatting), applies:
  - Slide 5: `8,263,196,000` → `8,563,196,000` (the CEVN total line).
  - Slide 6: `8,763,196,000` → `9,063,196,000` (the `CKH = CEVN + CCfD` result; keep the `8,263,196,000`
    addend in that line consistent → update to `8,563,196,000 + 500,000,000 = 9,063,196,000`).
  - Slide 7: EVN figure `8,2 billion`/`8.2 billion` → `8.5 billion`; `6.2 billion ... spot market` →
    `5.8 billion ... spot market`.
  - Slide 3: `1,026` → `1.026`, `1,008` → `1.008`, `163,3` → `163.30` (coefficient table cells only;
    do not touch `2,204` which is a thousands-separator).
- [ ] TASK-01-03: Run the script; confirm `python-pptx` reloads the saved deck with slide count = 11 and
  no repair prompt; dump corrected text to `deck-qa/july-deck-corrections-verify.txt`.

**Files / Surfaces**
- `ceba/DPPA Presentation July 2026 Scenario Training.pptx` — the deck to correct.
- `apply_deck_corrections.py` — new one-shot correction script (sibling to existing `apply_corrections.py`).
- `deck-qa/july-deck-corrections-verify.txt` — text-level QA artifact (render QA is blocked, CON-001).

**Dependencies**
- None.

**Exit Criteria**
- [ ] Backup file exists.
- [ ] Reloaded deck: slide 5 shows `8,563,196,000`; slide 6 shows `9,063,196,000`; slide 7 shows `8.5`
  and `5.8 billion`; slide 3 shows `1.026 / 1.008 / 163.30`.
- [ ] `py -c "from pptx import Presentation; print(len(Presentation('<deck>').slides))"` prints `11`.

**Phase Risks**
- **RISK-01-01:** A target number is split across multiple runs inside one paragraph, so a single
  run-replace misses it → mitigation: match at paragraph level, iterate runs, and rebuild the run text;
  verify each replacement count is exactly 1 and fail loudly if 0.
- **RISK-01-02:** Replacing `1,008` could also hit an unrelated occurrence → mitigation: scope replacement
  to the slide-3 parameter table cells (by shape/table index), not a global find/replace.

### PHASE-02 - App Data + Engine (fee split, workshop presets, 5-line bill)
**Goal**
Add the data and pure-logic foundation so the engine can reproduce the deck's monthly 5-line bill exactly,
without touching the existing 3 scenarios' behavior.

**Tasks**
- [ ] TASK-02-01: In `default-scenarios.js`, add `dppaServiceFee: 360` and `dppaClearingFee: 163.3` to
  `defaultInputs`; set `dppaCharge: 523.3` (= 360 + 163.3). Keep `lossFactor 1.0342`, `retailTariff 2204`.
- [ ] TASK-02-02: Extend the scenario model with two workshop presets and a `kind` field. Existing 3 get
  `kind: 'curve'`. Add `workshop1` (kind `'workshop'`) and `workshop2`. Each workshop preset carries:
  `overrides: { strikePrice, marketPrice }` (S1: 1250/1150; S2: 1500/1600), `monthlyVolumes:
  { contracted, total }` (S1: 5_000_000/5_000_000; S2: 8_000_000/9_000_000), and illustrative flat
  `loadProfile`/`generationProfile` (flat hourly ≈ contracted/720 for a plausible chart; bill is
  authoritative per ASM-002). Append both to `scenarioOrder`.
- [ ] TASK-02-03: Add `buildFiveLineBill(constants, volumes)` to `settlement.js` — pure function taking
  `{ fmp, strikePrice, serviceFee, clearingFee, lossFactor, retailTariff }` and
  `{ contracted, total }`, returning the 5 lines (`marketEnergy = contracted × fmp × lossFactor`,
  `systemService = contracted × serviceFee`, `diffClearing = contracted × clearingFee`,
  `additionalPurchase = (total − contracted) × retailTariff`, `cfd = contracted × (strike − fmp)`),
  plus `cEvn` (lines 1–4), `cKh` (cEvn + cfd), and (if Q-001 = yes) `plantRevenue`
  (`market = contracted × lossFactorKppOnly × fmp` with `lossFactorKppOnly = 1.008`, `+ cfd`).
- [ ] TASK-02-04: Update `settlement.test.js:259-275` to expect `dppaCharge === 523.3` and assert the new
  `dppaServiceFee`/`dppaClearingFee`. Keep the `settlementModes` label assertion unchanged.
- [ ] TASK-02-05: Add `settlement.test.js` cases asserting `buildFiveLineBill` reproduces the **corrected**
  deck numbers exactly: S1 → marketEnergy 5,946,696,000; systemService 1,800,000,000; diffClearing
  816,500,000; additionalPurchase 0; cEvn 8,563,196,000; cfd 500,000,000; cKh 9,063,196,000. S2 → cEvn
  19,628,262,400; cfd −800,000,000; cKh 18,828,262,400 (and plantRevenue 6,296,000,000 / 12,102,400,000 if built).

**Files / Surfaces**
- `app/src/data/default-scenarios.js` — fee split, workshop presets, `scenarioOrder`.
- `app/src/modules/settlement.js` — `buildFiveLineBill` (+ optional plant revenue).
- `app/src/modules/settlement.test.js` — update default-basis test; add bill-parity tests.

**Dependencies**
- None (can run in parallel with PHASE-01; the parity numbers it asserts are the *corrected* deck values).

**Exit Criteria**
- [ ] `cd app && npm test -- --run` passes, including the new `buildFiveLineBill` parity cases.
- [ ] Existing 3 scenarios' settlement output is byte-identical to before (no number drift): confirm via
  the unchanged `profiles.test.js` below-strike test and the existing settlement cases still passing.

**Phase Risks**
- **RISK-02-01:** Changing `dppaCharge` 523.34→523.3 shifts existing scenarios' numbers slightly and could
  break other hardcoded expectations → mitigation: grep tests/UI for `523.34`; only `settlement.test.js:267`
  asserts it; the per-hour math change is 0.04 VND/kWh and within `toBeCloseTo` tolerances elsewhere. Run
  the full suite to confirm.

### PHASE-03 - App UI Integration (workshop tabs + bill panel)
**Goal**
Wire the workshop presets into the UI: tabs apply per-scenario overrides, the 5-line monthly bill renders
only for workshop presets, and the chart handles a flat FMP curve.

**Tasks**
- [ ] TASK-03-01: In `main.js`, on scenario switch, read the selected scenario; if it has `overrides`,
  apply them to `state` (strikePrice, marketPrice) and call `syncInputsFromState()` so sliders reflect
  the preset; if no overrides (curve scenarios), restore defaults for strike/marketPrice. Then `updateView()`.
- [ ] TASK-03-02: In `buildInputs()`, when the active scenario `kind === 'workshop'`, build a **flat** FMP
  curve (`Array(24).fill(state.marketPrice)`) instead of `buildFmpCurve(...)`; pass through `monthlyVolumes`,
  `dppaServiceFee`, `dppaClearingFee`.
- [ ] TASK-03-03: In `ui.js`, render the 2 workshop tabs in `#scenarioTabs` (reuse existing tab markup;
  `setActiveScenario` already keys on id). Add `renderFiveLineBill(node, bill, currency)` and a
  `#fiveLineBill` slot in `renderAppShell`.
- [ ] TASK-03-04: In `main.js` `updateView()`, when `kind === 'workshop'`, compute the bill via
  `buildFiveLineBill(...)` from the preset's `monthlyVolumes` + constants and call `renderFiveLineBill`;
  otherwise clear/hide `#fiveLineBill`. Keep the existing per-hour panels rendering for all scenarios.
- [ ] TASK-03-05: In `chart.js`, guard the secondary FMP axis when the curve is flat (all equal): set an
  explicit `min`/`max` padding (e.g. ±10%) so the strike reference line and FMP line still render and don't
  collapse to a zero-height axis.
- [ ] TASK-03-06: Add `style.css` rules for `.five-line-bill` (clean tabular layout, VND/USD aware, mobile
  wrap consistent with existing breakpoints at 1280/900/520/390px).
- [ ] TASK-03-07: Update `ui.test.js`: assert workshop tabs exist; assert the 5-line bill panel renders the
  corrected S1/S2 line totals when a workshop preset is active and is absent/empty for curve scenarios.

**Files / Surfaces**
- `app/src/main.js` — scenario-switch override application, flat-FMP `buildInputs`, bill render wiring.
- `app/src/modules/ui.js` — workshop tabs, `renderFiveLineBill`, shell slot.
- `app/src/modules/chart.js` — flat-FMP axis guard.
- `app/src/style.css` — bill panel styles.
- `app/src/modules/ui.test.js` — workshop tab + bill panel assertions.

**Dependencies**
- PHASE-02 (presets, fee split, `buildFiveLineBill`).

**Exit Criteria**
- [ ] `cd app && npm test -- --run` passes (incl. new UI tests); total test count increases, none fail.
- [ ] Selecting Workshop 1/2 shows the 5-line bill with corrected deck totals and flat FMP/strike lines;
  selecting a curve scenario hides the bill and restores strike 2,000 / FMP 1,427 behavior.

**Phase Risks**
- **RISK-03-01:** Applying overrides into shared `state` then switching back to a curve scenario leaves
  stale strike/FMP → mitigation: explicitly reset strike/marketPrice to `defaultInputs` values when the
  target scenario has no `overrides`; cover with a UI test that toggles workshop→curve→workshop.
- **RISK-03-02:** The flat illustrative hourly profile confuses viewers (hourly × 24 ≠ monthly) →
  mitigation: label the bill panel "Monthly settlement (per Decree 57/2025)" and keep the chart clearly
  the illustrative profile; bill is the authoritative number (ASM-002).

### PHASE-04 - Cross-Check Harness + Verification + Deploy
**Goal**
Prove the deck and app agree, run the full verification gate, and ship.

**Tasks**
- [ ] TASK-04-01: Write `verify_deck_app_parity.py` that hardcodes the shared constants and the corrected
  deck line totals (from PHASE-01), recomputes the 5-line bill from constants, and asserts equality with
  the corrected deck figures for both scenarios; print PASS/FAIL per line. (This is the deck-side mirror;
  the app side is covered by the Vitest parity cases in TASK-02-05 — together they pin both surfaces to the
  same numbers.)
- [ ] TASK-04-02: Run `cd app && npm test -- --run` (all green) and `npm run build` (clean; pre-existing
  chunk-size warnings acceptable).
- [ ] TASK-04-03: Browser smoke-check (existing dev/preview flow): toggle Workshop 1/2 and a curve scenario,
  VND/USD, confirm bill totals match the deck and no console errors.
- [ ] TASK-04-04: `firebase deploy --only hosting --project dppa-case`; record the live URL/result in
  `app/deployment.md`.
- [ ] TASK-04-05: Append a Review/Results section to `activeContext.md` and write
  `reports/2026-06-26-deck-app-consolidation-completion.md`.

**Files / Surfaces**
- `verify_deck_app_parity.py` — new deck↔constants parity harness.
- `app/deployment.md`, `activeContext.md`, `reports/2026-06-26-deck-app-consolidation-completion.md`.

**Dependencies**
- PHASE-01 (corrected deck numbers) and PHASE-03 (app implementation).

**Exit Criteria**
- [ ] `py verify_deck_app_parity.py` prints all PASS.
- [ ] `npm test` green, `npm run build` clean, app deployed and reachable.

**Phase Risks**
- **RISK-04-01:** Deploy step needs Firebase auth/project binding that may not be active → mitigation:
  if deploy is unavailable, stop at a clean build + verified `dist/` and flag deploy as a manual step
  (consistent with prior sprints).

## Verification Strategy
- **TEST-001:** `cd app && npm test -- --run` — full Vitest suite incl. new `buildFiveLineBill` parity cases
  (TASK-02-05) and workshop UI tests (TASK-03-07); all green, no regressions to the existing 38.
- **TEST-002:** `py verify_deck_app_parity.py` — asserts the corrected deck's 5-line totals equal the
  constants-derived bill for both scenarios (deck-side parity).
- **MANUAL-001:** Read `deck-qa/july-deck-corrections-verify.txt` and confirm slides 5/6/7/3 show the
  corrected figures; reload the deck in python-pptx (no repair).
- **MANUAL-002:** Browser smoke-check of Workshop 1/2 vs deck figures and curve-scenario restore (TASK-04-03).
- **OBS-001:** `npm run build` output clean; deployed app returns 200 and the bill panel renders (TASK-04-04).

## Risks and Alternatives
- **RISK-001:** The deck and app drift again later (someone edits one set of numbers) → mitigation: the
  parity harness (TEST-002) + Vitest parity cases (TASK-02-05) pin both to the same constants; document the
  single source of truth in the completion report.
- **RISK-002:** Penny-for-penny depends on the app using `523.3` and Kpp/k exactly as the deck → covered by
  ASM-001/004 and the parity tests; any mismatch fails TEST-001/002 loudly.
- **ALT-001:** Render the bill by aggregating the hourly model ×30 instead of explicit monthly volumes —
  rejected (brainstorm ALT-004): produces ugly per-hour fractions and an averaged "monthly FMP" that maps
  to no single deck number.
- **ALT-002:** Re-align the deck to the app (strike 2,000/FMP 1,427) — rejected (brainstorm DEC-003):
  loses the deck's both-CfD-directions teaching.

## Grill Me
1. **Q-001:** Should the app's 5-line bill panel also render the **plant-revenue (RE GENCO) mirror** /
   3-party flow (deck slides 7 & 11), or only the customer-side 5-line bill + CfD + net cost (`CKH`)?
   - **Recommended default:** Include a compact one-line plant-revenue mirror (`Qm × FMP` with Kpp-only
     generation volume, + CfD), kept visually secondary to the customer bill.
   - **Why this matters:** Determines whether `buildFiveLineBill` also computes generator-side figures
     (TASK-02-03) and whether PHASE-03 adds a small flow visual — affects PHASE-02/03 size.
   - **If answered differently:** If customer-side only, drop the `plantRevenue` output and the
     associated parity assertions; PHASE-02/03 shrink slightly.

## Suggested Next Step
Answer Q-001 (default: include the compact plant-revenue mirror), then begin PHASE-01 (deck correction —
independent and fastest) while PHASE-02 proceeds in parallel. The brainstorm + this plan are being committed
and pushed now per the request.
