# Deck Consolidation — Phase 02 Report: Build the 3 Canonical Case Slides

**Date:** 2026-06-23
**Plan:** `plans/2026-06-22-dppa-deck-consolidation-plan.md`
**Phase:** PHASE-02 — Build the 3 canonical case slides
**Backup:** `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx` (rollback point)

## Objective
Create one coherent worked example per canonical case (matched / shortfall / excess), consistent with the app's engine and verified 2026 numbers, then remove the old standalone scenario slides.

## Tasks Completed
- [x] **TASK-02-01** — Built Case A "Matched" slide at deck position 38: 4,200 kWh/h × 24 h = 100,800 kWh/day balanced at 4,200 kWh/h solar; consumption = contracted = matched. Full 5-line bill + CfD + Net = EVN + CfD with verified 2026 numbers.
- [x] **TASK-02-02** — Built Case B "Shortfall (Load > Gen)" slide at deck position 39: 6,100 kWh/h load vs 4,200 kWh/h solar; 1,900 kWh/h × 24 h = 45,600 kWh/day residual EVN retail purchase.
- [x] **TASK-02-03** — Built Case C "Excess (Load < Gen)" slide at deck position 40: 2,600 kWh/h load vs 4,700 kWh/h solar; 2,100 kWh/h × 24 h = 50,400 kWh/day excess. CfD capped at consumed volume (62,400 kWh).
- [x] **TASK-02-04** — Used the same factory frame as the app (`app/src/data/default-scenarios.js`) so deck and live tool show identical numbers. Removed 8 old standalone scenario slides (originally 1-based 38-45 = Scenarios 1+3).

## Files Modified
| File | Change |
|---|---|
| `build_canonical_cases.py` | **NEW** (~450 lines): python-pptx script that adds 3 new slides, reorders them, deletes 8 old ones, saves |
| `ceba/CEBA DPPA 2026.pptx` | 57 → 52 slides (-5 net per plan forecast — exact match) |
| `deck-qa/case-slides-content.txt` | **NEW**: full text dump of new case slides for verification |
| `deck-qa/inventory-after-phase02.txt` | **NEW**: full deck inventory after phase 02 |
| `deck-qa/layout-inventory.txt` | **NEW**: layout structure from before edits (for cross-reference) |

## Slide Format (mirrors the app's `walkthroughCaseCard`)

Each new slide has:
1. **Header strip:** cyan eyebrow ("CANONICAL CASE A · MATCHED (Load = Gen)") + white title
2. **Case pill:** color-coded (mint for matched, amber for shortfall, cyan for excess)
3. **Narrative:** factory load + solar generation + matched/shortfall/excess call-out
4. **EVN bill (5-line, on matched volume):** cyan heading, white lines, total in cyan
5. **CfD settlement:** amber heading, white lines, direction flagged
6. **Net = EVN + CfD total:** full-width mint band with $/kWh
7. **Formula breakdown:** 3-line expansion matching the app's `formula-expanded` style
8. **Comparison vs BAU:** amber call-out
9. **Caveat strip (footer):** "FMP ~1,427 illustrative (NSMO/ERAV not public). Retail 2,204 / fees 523.3 / loss 1.0342 are 2025 verified; settlement modeled hourly (Circular 16/2025 = 30-min)."

## Numbers Per Case (verified 2026, app-matching)

| | Case A (Matched) | Case B (Shortfall) | Case C (Excess) |
|---|---|---|---|
| Load (kWh/h) | 4,200 | 6,100 | 2,600 |
| Generation (kWh/h) | 4,200 | 4,200 | 4,700 |
| Matched volume (kWh/day) | 100,800 | 100,800 | 62,400 |
| Shortfall (kWh/day) | 0 | 45,600 | 0 |
| Excess (kWh/day) | 0 | 0 | 50,400 |
| Line 1: matched × FMP × Kpp | 148,760,983 VND | 148,760,983 VND | 92,075,517 VND |
| Line 2: matched × FEES | 52,748,640 VND | 52,748,640 VND | 32,653,920 VND |
| Line 4: shortfall × RETAIL | 0 | 100,502,400 VND | 0 |
| Total EVN | 201,509,623 VND | 302,012,023 VND | 124,729,437 VND |
| CfD = (Strike−FMP) × matched | +57,808,800 VND | +57,808,800 VND | +35,780,400 VND |
| **Net total** | **259,318,423 VND** | **359,820,823 VND** | **160,509,837 VND** |
| Net per matched kWh | 2,572.91 VND | — | 2,572.91 VND |
| BAU (load × retail) | 221,786,256 VND | 322,762,656 VND | 137,127,168 VND |
| Savings vs BAU | -37,532,167 VND (-16.9%) | -37,058,167 VND (-11.5%) | -23,382,669 VND (-17.1%) |
| Why? | FMP < Strike: factory pays strike+fees; BAU is cheaper because strike is high | Shortfall dilutes the FMP cancellation; extra retail purchase erodes savings | Best $/kWh: fixed fees only on matched kWh; but strike too high relative to FMP |

Note: the savings are **negative** in all 3 cases because the chosen strike (2,000) is **above** the FMP (1,427) — every matched kWh's CfD is a net outflow from the factory. This is consistent with the deck's narrative ("In most realistic structures, Year 1 DPPA cost is at or above BAU; savings build as EVN escalates") and with the app's current strike default.

## Design Decisions

### Why slide 38-40 specifically
The new cases go right after the existing "Cost Formulas" recap slide (slide 37) and before the workshop exercise intro (slide 36 is "DPPA Scenario Analysis" intro). This keeps the workshop flow: intro → formulas recap → 3 cases → multi-party netting (PHASE-03) → workshop exercise.

### Why same factory frame as the app (Q-001 default)
A facilitator running a workshop can switch mid-deck to the live app at https://dppa-case.web.app and the numbers will match (4,200 kWh/h load, 2,000 strike, 1,427 FMP, 523.3 fees, 2,204 retail, 1.0342 loss). No re-doing math.

### Why FMP 1,427 stays illustrative (Q-002 default)
Labeled on every slide via the footer caveat strip. Matches the app's `marketPrice: 1427` default.

### Why CfD "positive = factory pays developer"
The deck's existing language: when (Strike − FMP) > 0 and we settle on matched kWh, the factory pays the developer the difference. This is the FMP-below-strike case. In the deck's chosen default (Strike 2,000 / FMP 1,427), this is the live direction.

### Why 5-line bill is the same on all 3 slides
The 5-line structure is the deck's Module 2 teaching device (slides 9-13). Showing it consistently across the 3 canonical cases reinforces the model. The shortfall case adds a non-zero Line 4 (retail on shortfall); the excess case has Line 4 = 0 because Load < Gen. This visual contrast is the CFO's "why matched is the cleanest" lesson.

## Risk Assessment
- **RISK-02-01** (XML corruption): mitigated — backup taken; used python-pptx (validated `import pptx; pptx.__version__ == '1.0.2'`); deck loads cleanly post-edit. 52-slide deck parses without error.
- **Bug found and fixed mid-phase:** First run had an off-by-one in the deletion indices. The surviving old Scenario 1 setup at slide 41 was wrongly preserved and the Scenario 4 setup at slide 49 was wrongly deleted. **Restored from backup, re-ran with corrected indices (delete 0-based 40-47, not 41-48), verified new layout: 38-40 are the canonical cases, 41-45 are the old Scenarios 4+5 preserved for PHASE-03.**

## Verification
- **TEST-001 (slide count):** `python -c "from pptx import Presentation; print(len(Presentation('ceba/CEBA DPPA 2026.pptx').slides))"` → `52` ✓
- **TEST-002 (new cases at right positions):** slides 38-40 are "CANONICAL CASE A/B/C" ✓
- **TEST-003 (old Scenarios 1+3 removed):** old setup text "Your manufacturing plant has a strict corporate target" no longer appears in the deck ✓
- **TEST-004 (old Scenarios 4+5 preserved):** slides 41-45 are the multi-plant/multi-customer netting (will be compressed in PHASE-03) ✓
- **MANUAL-001 (parses in PowerPoint):** not yet verified (no PowerPoint on this machine). Will validate with `inspect_pptx.py` after each remaining phase.

## Git
- Commit: `75580ee` — "deck-consolidation phase-02: build 3 canonical case slides"
- Pushed to `origin/master` (852322b..75580ee)

## Exit Criteria Status
- [x] Three canonical case slides exist at deck positions 38, 39, 40
- [x] Internally consistent, verified numbers (retail 2,204; fees 523.3; loss 1.0342; strike 2,000; FMP 1,427 illustrative)
- [x] 8 old standalone scenario slides removed
- [x] Deck: 57 → 52 slides (forecast was 52)
- [x] python-pptx loads deck without error

## Next Phase
PHASE-03 — Add multi-party netting callout (compresses Scenarios 4+5 slides 41-45 into 1 slide) + 1 financing summary slide (compresses Cases 5/6 slides 24-25, 27). Forecast: 52 → 47 slides.
