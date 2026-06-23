# Deck Consolidation Map — CEBA DPPA 2026 → 3 Canonical Cases

**Date:** 2026-06-23
**Source deck:** `ceba/CEBA DPPA 2026.pptx` (57 slides)
**Backup:** `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx`
**Target state:** 3 canonical teaching cases (matched / shortfall / excess) + netting callout + financing summary
**Plan:** `plans/2026-06-22-dppa-deck-consolidation-plan.md`

## Verified 2026 Number Basis (single source of truth)

| Constant | Value | Source |
|---|---|---|
| EVN retail avg | 2,204.07 VND/kWh | Dec. 599/QD-EVN, eff. 10 May 2025 |
| Fixed DPPA fees | 360 + 163.3 = 523.3 VND/kWh | EVN annual notice (illustrative, source-flag) |
| Loss / price coeff. | k = 1.026, K_pp = 1.008 (product = 1.0342) | EVN annual notice |
| Avg FMP | ~1,427 VND/kWh (illustrative) | EAVCED training; NSMO/ERAV not public |
| Settlement interval | 30 min (modeled as hourly) | Circular 16/2025/TT-BCT |
| Strike (teaching default) | 2,000 VND/kWh | App default, same as deck |
| App factory frame (kWh/h) | 4,200–6,200 kWh/h | `app/src/data/default-scenarios.js` |

## Section / Module Map (current 57 slides)

| Slides | Section | Action |
|---|---|---|
| 1 | Title | KEEP |
| 2 | About the speaker | KEEP |
| 3 | Follow the money / roadmap | KEEP (renumber workshop roadmap) |
| 4 | Module 1 divider | KEEP |
| 5 | Module 1 — EVN bill baseline | KEEP |
| 6 | Module 2 divider | KEEP |
| 7-8 | Module 2 — Five-line bill diagrams | KEEP |
| 9 | Module 2 — Lines 1-4 by EVN, line 5 CfD | KEEP |
| 10 | Module 2 — Volumes & K_pp | KEEP |
| 11 | Module 2 — Worked example (50 MW, exactly matched) | **KEEP as Module 2 worked example** (its numbers are illustrative; this is the only Module 2 worked example that pre-dates the workshop scenarios) |
| 12 | Module 2 — Effective cost vs retail | KEEP |
| 13 | Module 2 — 523 fees don't move w/ strike | KEEP |
| 14 | Module 3 divider | KEEP |
| 15 | Module 3 — CfD cash flow | KEEP |
| 16 | Module 3 — Strike escalation / Year 1 | KEEP |
| 17 | Module 3 — Hourly matching | KEEP |
| 18 | Module 4 divider | KEEP |
| 19 | Module 4 — Developer revenue | KEEP |
| 20 | Module 4 — Three gates / DSCR | KEEP |
| 21 | Module 4 — Other tariff components | KEEP |
| 22 | Module 5 divider | **RENAME** "Module 5: Three Canonical Cases" |
| 23 | Module 5 — Cases 5/6 intro (yesterday on-site) | **REMOVE** (depends on removed slides) |
| 24 | Case Study 5 — Solar + Large BESS (battery eats deal) | **REMOVE → folding into excess case + financing summary** |
| 25 | Case Study 6 — Solar + Minimum BESS (bankable) | **REMOVE → folding into excess case + financing summary** |
| 26 | 56-scenario analysis (0/56 pass three gates) | **COMPRESS → financing summary slide (TASK-03-02)** |
| 27 | BESS/three-gates expected savings | **REMOVE** (folded into financing summary) |
| 28 | Module 6 divider | KEEP |
| 29-30 | Module 6 — Decision points / wrap | KEEP (update slide 30 to reference 3 canonical cases not 6-7 scenarios) |
| 31-32 | Q&A + QR | KEEP |
| 33-35 | Panel / speaker bios / interactive group | KEEP |
| 36 | Interactive exercise intro | KEEP (renumber: "Exercise: Apply the 3 canonical cases") |
| 37 | Workshop formulas recap | **RENAME** "Reference: Five-line formulas (Decree 57/2025)" |
| 38-41 | Scenario 1 (matched, strike 1,250 / FMP 1,150) | **COMPRESS → matched case (TASK-02-01)** |
| 42-45 | Scenario 3 (shortfall, strike 1,500 / FMP 1,600) | **COMPRESS → shortfall case (TASK-02-02)** |
| 46-50 | Scenario 4 + 5 (multi-plant / multi-customer netting) | **COMPRESS → netting callout (TASK-03-01)** |
| 51 | Workshop Recap | KEEP |
| 52-53 | Module 6 takeaways / action | KEEP (update slide 52 to cite Samsung/TTC Duc Hue 2 first DPPA, not "emerging") |
| 54-55 | Recap numbers | KEEP |
| 56-57 | Wrap / thank you | KEEP |

## Phase-by-Phase Action Map

### PHASE-02: Build the 3 canonical case slides (replace standalone scenario blocks)

| Source slides | Action | Target slide(s) | Numbers to align to verified 2026 |
|---|---|---|---|
| 38-41 (Scenario 1) | **Replace** with new "Case A: Matched" — single worked five-line settlement, factory frame matches app (5,000 kWh/h, 24h) | New slide 38 | strike 2,000; FMP 1,427 (illustrative); retail 2,204; fees 523.3; loss 1.0342 |
| 42-45 (Scenario 3) | **Replace** with new "Case B: Shortfall (Load>Gen)" — factory frame matches app (6,100 kWh/h load, 4,200 gen); residual EVN purchase + negative-CfD | New slide 39 | Same constants; FMP below strike so buyer still pays; residual retail purchase for shortfall |
| 24-25 (Cases 5/6 buyers' view) | **Replace** with new "Case C: Excess (Load<Gen)" — factory frame matches app (2,600 kWh/h load, 4,700 gen); CfD caps at consumed volume; excess earns generator spot only | New slide 40 | Same constants; FMP above strike so developer pays factory; explicit cap formula |

### PHASE-03: Netting + financing callouts

| Source slides | Action | Target slide(s) |
|---|---|---|
| 26 (56-scenario analysis) + 27 (BESS expected savings) | **Compress** into 1 financing summary slide: "0 of 56 scenarios passed all three gates" + "right-size the BESS, then the negotiation is the strike; window can be empty" | New slide 41 |
| 46-50 (Scenarios 4 & 5: multi-plant / multi-customer) | **Compress** into 1 netting callout slide: "net CfD = sum of per-pair settlements" | New slide 42 |

### PHASE-04: Policy refresh + renumbering

| Slide | Action |
|---|---|
| 3 (roadmap) | Update workshop roadmap reference: "3 canonical cases (matched/shortfall/excess)" instead of "5 scenarios" |
| 22 (Module 5 divider) | Rename: "Module 5: Three Canonical Cases" |
| 29-30 (Module 6) | Update to reference 3 cases |
| 36 (workshop intro) | Update: "Apply the 3 canonical cases" |
| 37 (formulas recap) | Update citation to "Decree 57/2025/ND-CP" + "Circular 16/2025/TT-BCT (FMP = SMP + CAN, 30-min)" |
| 52 (action slide) | Replace "first transactions emerging" with "Samsung SEVT ↔ TTC Duc Hue 2 — first grid DPPA live 2026" |
| 38-42 (new case slides) | Add "FMP: illustrative, NSMO/ERAV not public" caveat on every worked slide |
| 38-42 (new case slides) | Add "Two-component retail tariff pilot (Oct 2025): double-charge caveat" note to all case slides |

## Agenda Renumbering (Section / Divider slides to update)

| Slide | Current | New |
|---|---|---|
| 22 | "Module 5: Case Studies 5 & 6" | "Module 5: Three Canonical Cases" |
| 36 | "DPPA Scenario Analysis (~60 minutes)" | "Apply the 3 Canonical Cases" |
| 37 | "Cost Formulas" | "Reference: Five-line Formulas (Decree 57/2025)" |
| 51 | "Workshop Recap and Wrap Up" | (KEEP) |

## Open / Pre-existing Risks

- **RISK-01-01** (slide indices differ from estimates): confirmed — actual Scenarios 1-5 are at slides 38-50, not 37-50. All actions mapped off actual inventory.
- **RISK-02-01** (XML corruption): will back up before editing; use python-pptx (already validated) not direct XML.
- **RISK-04-01** (PowerPoint repair prompt): validate with `inspect_pptx.py` after each phase.

## Verification

- **TEST-001:** `python inspect_pptx.py` after each phase — slide count + structure parses
- **MANUAL-001:** `python -c "from pptx import Presentation; p = Presentation('ceba/CEBA DPPA 2026.pptx'); print(len(p.slides))"` — assert no PowerPoint repair needed
- **OBS-001:** PNG export — **BLOCKED**: no LibreOffice / unoconv / mutool on this machine, and `export-slides.ps1` requires PowerPoint COM. Will note as manual step; skip in CI.

## Net Slide Count (forecast)

| Phase | Removes | Adds | Net change |
|---|---|---|---|
| PHASE-02 | 8 (Scenarios 1/3/5/6: 38-41, 42-45) | 3 (matched, shortfall, excess) | -5 |
| PHASE-03 | 7 (Cases 5/6: 24-25, 27; Scenarios 4/5: 46-50) | 2 (netting callout, financing summary) | -5 |
| PHASE-04 | 0 | 0 (renumbering only) | 0 |
| **Total** | 15 | 5 | **-10** |

Forecasted final slide count: **47 slides** (down from 57).
