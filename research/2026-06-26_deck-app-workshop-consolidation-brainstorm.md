---
title: "July 2026 Scenario-Training Deck ↔ Web App Consolidation"
date: "2026-06-26"
type: "brainstorm"
depth: "standard"
source_request: "Review the new 'DPPA Presentation July 2026 Scenario Training.pptx' (added yesterday) for errors, then consolidate this deck with the web app (https://dppa-case.web.app) for combined use during the in-person workshop this July."
slug: "deck-app-workshop-consolidation"
---

# Brainstorm: July 2026 Scenario-Training Deck ↔ Web App Consolidation

## Problem & Why Now

A new 11-slide facilitator deck — `ceba/DPPA Presentation July 2026 Scenario Training.pptx`
(added 2026-06-25, untracked) — is the standalone extract of the workshop interactive
exercise (the original CEBA deck's "Scenario 1 / Scenario 3" slides). It carries two
deliberately-chosen worked DPPA settlement scenarios that show **both directions of the
CfD swap**:

- **Scenario 1 (matched):** strike `Pc` 1,250, FMP 1,150 → FMP < strike, factory tops up developer.
- **Scenario 2 (shortfall):** strike `Pc` 1,500, FMP 1,600 → FMP > strike, developer pays factory; plus a 1,000,000 kWh residual bought from EVN at retail.

Two problems block using this deck and the live web app **together** at the July workshop:

1. **The deck has a confirmed, propagating arithmetic error** (see Current State). A
   workshop deck whose numbers don't add up is exactly the failure this project has been
   hardening against (the last main-deck commit fixed a "P0 inverted savings" bug).
2. **The deck and the app show contradicting numbers.** When the original scenarios were
   folded into the main CEBA deck and the web app, their numbers were re-aligned to a
   single source of truth (strike 2,000, FMP 1,427). This standalone July deck still
   carries the **legacy pre-alignment** strike/FMP pairs. A presenter flipping between the
   deck (worked reference) and the app (live demo) would show figures that don't match.

The workshop is **this July**, so this is time-boxed and high-visibility.

## Current vs Desired State

- **Current state:**
  - **Deck (`ceba/DPPA Presentation July 2026 Scenario Training.pptx`, 11 slides, 16:9):**
    - Slides 1–2: facilitator exercise intros. Slide 3: parameters + cost formulas. Slide 4:
      Scenario 1 narrative. Slides 5–7: Scenario 1 worked bill + 3-party flow. Slide 8:
      Scenario 2 narrative. Slides 9–11: Scenario 2 worked bill + 3-party flow.
    - **Confirmed bug — Scenario 1 EVN total does not add up:** lines sum to
      `5,946,696,000 + 1,800,000,000 + 816,500,000 + 0 = 8,563,196,000`, but slide 5 states
      `8,263,196,000` (off by exactly 300M, a `5→2` digit typo). It cascades:
      - Slide 6 `CKH = CEVN + CfD` shows 8,763,196,000; should be **9,063,196,000**.
      - Slide 7 flow diagram EVN box reads "8.2 billion"; should be **8.5 billion**.
      - Slide 7 "6.2 billion VND on the spot market" is inconsistent with slide 11's
        convention (gross market revenue `Qm × FMP`): plant market revenue is
        `5,040,000 × 1,150 = 5,796,000,000`, so it should read **5.8 billion** (the 6.2
        appears to be a mis-stated *total* revenue of ~6.296B).
    - Scenario 2 (slides 9–11) is **fully correct** (CEVN 19,628,262,400; CKH 18,828,262,400;
      plant revenue 12,102,400,000 all verify).
    - Minor notation: slide 3 lists coefficients with commas (`1,026`, `1,008`, `163,3`)
      while the worked formulas use periods (`1.026`, `1.008`, `163.30`).
  - **Web app (`app/`, deployed at https://dppa-case.web.app):** hourly 24-interval model.
    `app/src/data/default-scenarios.js` has 3 scenarios (Load>Gen / Load=Gen / Load<Gen)
    built around a synthetic FMP curve. Defaults: strike **2,000**, FMP **1,427**,
    `dppaCharge` **523.34**, `lossFactor` **1.0342** (k 1.026 × Kpp 1.008), retail **2,204**.
    `app/src/modules/settlement.js` per-unit formulas mirror the deck's 5-line bill exactly:
    `evnMarket = matched × fmp × lossFactor`, `evnDppa = matched × dppaCharge`,
    `evnRetail = shortfall × retailTariff`, `developer = contractQuantity × (strike − fmp)`.
  - **Shared constants already match across deck and app:** fees `360 + 163.3 = 523.3`
    (app stores combined 523.34 — a 0.04 rounding drift), loss `1.0342`, retail `2,204`.
    Only **strike and FMP differ** (deck per-scenario 1,250/1,500 & 1,150/1,600 vs app 2,000/1,427),
    and the **time base differs** (deck monthly lump vs app hourly curve).

- **Desired state:**
  - Deck arithmetic is correct (Scenario 1 totals fixed on slides 5–7), deck stays a
    standalone 11-slide facilitator packet.
  - The deck's **two scenarios are the canonical workshop source of truth.**
  - The web app reproduces both deck scenarios **penny-for-penny** via 2 new presets, with a
    5-line monthly bill readout, so a presenter can flip deck↔app and every figure matches.
  - The app's existing 3 hourly-curve scenarios remain (they teach the intraday cancellation
    effect that the flat-FMP deck scenarios don't).
  - An automated cross-check proves deck numbers == app engine output, since there is no
    LibreOffice/PowerPoint on this machine for visual render QA.

- **Key repo surfaces:**
  - `ceba/DPPA Presentation July 2026 Scenario Training.pptx` — the deck to fix (back up first).
  - `app/src/data/default-scenarios.js` — add Workshop 1/2 presets; split fee into service (360)
    + clearing (163.3); add flat-FMP + monthly-volume fields.
  - `app/src/modules/settlement.js` — add a monthly 5-line bill builder (`buildFiveLineBill`)
    reusing the existing per-unit formulas; optionally a plant-revenue mirror.
  - `app/src/modules/ui.js` + `main.js` + `style.css` — render the 5-line bill panel for
    workshop presets only; wire the 2 new scenario tabs.
  - `app/src/modules/*.test.js` — Vitest assertions for the workshop presets' exact totals.
  - New cross-check harness (Python) — recompute deck bill from constants, assert == app engine.
  - `deck-qa/consolidation-map.md` — prior alignment pattern + verified number basis to reuse.
  - Out of scope: `ceba/CEBA DPPA 2026.pptx` (the main 45-slide deck) — leave untouched.

## Resolved Decisions

- **DEC-001:** Keep the July deck **standalone** (facilitator exercise packet); do not merge
  it into the main CEBA deck — avoids re-duplicating what consolidation removed.
- **DEC-002:** Target use = **deck as worked reference, app as live demo of the same numbers**
  (flip-to-flip), so numeric alignment must be exact, not directional.
- **DEC-003:** The **deck's two scenarios are the single source of truth** (strike 1,250/1,500,
  FMP 1,150/1,600); the app is changed to reproduce them. Rationale: the pair deliberately
  shows both CfD directions — strong teaching the app's single below-strike curve lacks.
- **DEC-004:** Reproduce the deck in the app via **2 new presets** ("Workshop 1 — matched",
  "Workshop 2 — shortfall") matching **penny-for-penny**: deck flat FMP, deck strike,
  monthly-equivalent volumes, plus a 5-line monthly bill readout.
- **DEC-005:** **Keep the existing 3 hourly-curve scenarios** alongside the new workshop
  presets — they retain the intraday FMP-curve cancellation teaching.
- **DEC-006:** The **5-line monthly bill readout shows only for the workshop presets** (where
  a flat monthly FMP maps to a single deck number); existing scenarios keep their per-hour panels.
- **DEC-007:** **Fix all deck math + slide-7 figures, backup first.** Slide 5 CEVN →
  8,563,196,000; slide 6 CKH → 9,063,196,000; slide 7 EVN → 8.5B and spot-market → 5.8B; also
  normalize slide-3 coefficient notation (1,026→1.026, 163,3→163.30). Arithmetic/label only —
  no layout or wording changes.
- **DEC-008:** Verify via a **Python cross-check harness** that recomputes the deck's 5-line
  bill from the shared constants and asserts equality with the app's settlement engine output
  for both workshop presets, plus Vitest cases asserting the presets' exact line totals.

## Assumptions & Constraints

- **ASM-001:** The app's `dppaCharge` is split into `dppaServiceFee = 360` + `dppaClearingFee = 163.3`
  (sum **523.3**, correcting the current 523.34). The combined value still drives the per-hour
  charge; the split is needed to render the deck's separate lines 2 and 3.
- **ASM-002:** Workshop presets carry the deck's **monthly volumes directly** (S1: Qkhhc = QKH =
  5,000,000; S2: Qkhhc = 8,000,000, QKH = 9,000,000 → shortfall 1,000,000). The 5-line bill is
  computed from these monthly volumes × constants (decoupled from the 24×days aggregation), so
  totals match the deck without ugly per-hour fractions. The hourly chart for these presets is
  illustrative flat lines.
- **ASM-003:** Workshop presets use a **flat FMP** (all 24 hours = scenario FMP: 1,150 / 1,600),
  so the engine's per-hour math collapses to the deck's flat-FMP monthly total.
- **ASM-004:** Plant-revenue mirror (RE GENCO side, deck slides 6/10) uses **Kpp only** (1.008)
  for generator-side volume (`Qm = consumed × 1.008`), distinct from the customer market line
  which uses k × Kpp (1.0342) — this asymmetry is intentional in the deck and must be preserved
  if the mirror is implemented.
- **ASM-005:** The 5-line bill readout supports the app's existing VND/USD toggle; deck
  comparison is done in VND (deck is VND-only).
- **CON-001:** No LibreOffice / PowerPoint / unoconv on this machine → no PNG render QA;
  correctness is proven by the cross-check harness + unit tests + manual figure read-through.
- **CON-002:** Edit the `.pptx` with `python-pptx` (validated in prior deck work via the `py`
  launcher / Python 3.14), not raw XML; back up before editing.
- **CON-003:** All existing app tests (38) must still pass; new presets must not alter the
  existing 3 scenarios' numbers or break their panels.
- **CON-004:** Main CEBA deck (`ceba/CEBA DPPA 2026.pptx`) is untouched.

## Approaches Considered

- **Chosen:** Deck stays source of truth + app gets penny-for-penny workshop presets and a
  workshop-only 5-line bill readout, alongside the existing curve scenarios — exact flip-to-flip
  alignment while preserving both teaching modes.
- **ALT-001:** Re-align the deck to the app's 2,000/1,427 — rejected; loses the deck's clean
  above-strike scenario (both-CfD-directions teaching) unless the app's curve is also retuned.
- **ALT-002:** Define one new reconciled number set for both deck and app — rejected; most work,
  and it would churn the already-aligned main deck + app.
- **ALT-003:** Directional-only match (deck strike/FMP in the app but keep hourly curves) —
  rejected; totals wouldn't equal the deck's monthly lump figures, breaking flip-to-flip.
- **ALT-004:** Add an always-on 5-line bill for every scenario by aggregating the hourly model —
  rejected; for curve scenarios the "monthly FMP" is an average that maps to no single deck number.

## Out of Scope

- Merging the July deck into the main CEBA deck (DEC-001).
- Any change to the main 45-slide CEBA deck or its numbers.
- Re-tuning the existing 3 app scenarios' strike/FMP/volumes.
- Multi-year projection (`projectMultiYear`) changes.
- Deck layout, wording, or design changes beyond the arithmetic/label corrections and slide-3
  notation normalization.
- Visual PNG render QA (blocked by tooling; replaced by the cross-check harness).

## Open Questions

1. **Q-001:** Should the app's 5-line bill panel also render the **plant-revenue (RE GENCO)
   mirror** and the 3-party flow (deck slides 7/11), or only the customer-side 5-line bill + CfD
   + net customer cost (CKH)?
   - **Recommended default:** Include a compact one-line plant-revenue mirror (`Qm × FMP` with
     Kpp-only generation volume, + CfD), since the deck emphasizes the three-party view and it
     completes the flip-to-flip parity; keep it visually secondary to the customer bill.
   - **Why this matters:** Determines whether `buildFiveLineBill` also computes generator-side
     figures and whether the UI needs a flow visual, affecting the UI phase's size.

## Suggested Next Step
Run `/plan deck-app-workshop-consolidation` to turn this into a multi-phase implementation plan.
