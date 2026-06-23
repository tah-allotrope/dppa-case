# Deck Consolidation — Phase 01 Report: Inventory & Mapping Spec

**Date:** 2026-06-23
**Plan:** `plans/2026-06-22-dppa-deck-consolidation-plan.md`
**Phase:** PHASE-01 — Inventory and mapping spec

## Objective
Produce an exact mapping from current scenario slides to the 3 canonical cases before touching the pptx. Identify all numbers that need to update to verified 2026 values, and lock the agenda/divider renumbering list.

## Tasks Completed
- [x] **TASK-01-01** — Ran `python inspect_pptx.py` against `ceba/CEBA DPPA 2026.pptx`. Captured full inventory to `deck-qa/inventory.txt` (UTF-8 to preserve Vietnamese/minus/non-ASCII characters that the default `print()` chokes on with the `charmap` codec).
- [x] **TASK-01-02** — Wrote `deck-qa/consolidation-map.md` mapping every scenario slide to its target (matched/shortfall/excess/callout) plus a number-change list anchored to verified 2026 values.
- [x] **TASK-01-03** — Identified all agenda/divider/section slides that need renumbering: 3, 22, 29-30, 36, 37, 52. Locked into the map.

## Files Modified
| File | Change |
|---|---|
| `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx` | **NEW** (13.1 MB): pre-edit backup of the deck |
| `deck-qa/inventory.txt` | **NEW** (~3,500 lines): full text dump of all 57 slides |
| `deck-qa/consolidation-map.md` | **NEW** (~190 lines): the action map for phases 02-04 |

## Key Findings (vs. plan estimates)

The plan's rough slide-index estimates were slightly off — fixed by driving off the actual `inspect_pptx.py` dump per `RISK-01-01`:

| Plan estimate | Actual | Notes |
|---|---|---|
| Cases 5/6 ≈ slides 23-27 | ✓ slides 23-27 | Confirmed |
| Scenarios 1-5 ≈ slides 37-50 | slides 38-50 (formulas at 37) | Off by 1; formulas slide is 37 |
| 56-scenario analysis on slide 26 | ✓ slide 26 | Confirmed |
| First transaction "emerging" on slide 52 | ✓ slide 52 | Confirmed |

Additional finding not anticipated by plan:
- **Slide 11** has a Module 2 worked example (50 MW solar matched to one customer, computed against the deck's illustrative numbers) that pre-dates the workshop scenarios. This is a Module 2 teaching slide, NOT a workshop scenario — keeping it intact, just verifying the illustrative caveat is already present.

## Section / Module Map (current 57 slides)

- **Slides 1-3:** Title, speaker, roadmap — KEEP
- **Slides 4-5:** Module 1 (EVN baseline) — KEEP
- **Slides 6-13:** Module 2 (Five-line bill) — KEEP
- **Slides 14-17:** Module 3 (CfD mechanics) — KEEP
- **Slides 18-21:** Module 4 (Developer economics) — KEEP
- **Slide 22:** Module 5 divider — **RENAME** to "Three Canonical Cases"
- **Slides 23-27:** Cases 5/6 (BESS) — **REMOVE/COMPRESS in PHASE-03**
- **Slide 28:** Module 6 divider — KEEP
- **Slides 29-32:** Module 6 wrap / Q&A — KEEP (with renumbering)
- **Slides 33-35:** Panel / speaker bios — KEEP
- **Slides 36-50:** Workshop exercise + scenarios — **REPLACE in PHASE-02/03**
- **Slides 51-57:** Workshop recap + takeaways + wrap — KEEP (with policy refresh in PHASE-04)

## Verified 2026 Number Basis (locked in this phase)

| Constant | Value | Source |
|---|---|---|
| EVN retail avg | 2,204.07 VND/kWh | Dec. 599/QD-EVN, eff. 10 May 2025 |
| Fixed DPPA fees | 360 + 163.3 = 523.3 VND/kWh | EVN annual notice (illustrative, source-flag) |
| Loss / price coeff. | k = 1.026, K_pp = 1.008 (product = 1.0342) | EVN annual notice |
| Avg FMP | ~1,427 VND/kWh (illustrative) | EAVCED training; NSMO/ERAV not public |
| Settlement interval | 30 min (modeled as hourly) | Circular 16/2025/TT-BCT |
| Strike (teaching default) | 2,000 VND/kWh | App default, same as deck |
| App factory frame (kWh/h) | 4,200–6,200 kWh/h | `app/src/data/default-scenarios.js` |

## Design Decisions

### Why a 5-line "Net = total" formula on the new case slides
Each of the 3 canonical case slides will show the same five-line EVN bill plus the CfD settlement as the app does, then a Net = EVN + Developer total. This matches the app's `walkthroughCard` format so a facilitator can hand off from deck to live tool without re-doing the math. The existing deck scenarios use a different (and partly inconsistent) layout — switching to the app's layout is the live-demo handoff win the plan calls out.

### Why same factory frame as the app (Q-001 default)
The plan's Q-001 default is "same factory frame as the app." Following the default means a slide-38 worked example with strike 2,000, FMP 1,427, retail 2,204, fees 523.3, loss 1.0342, and the app's per-hour load (e.g., 4,700 kWh for the balanced case) maps 1:1 onto the live app's numbers. Facilitators can switch mid-demo.

### Why FMP 1,427 stays illustrative (Q-002 default)
The plan's Q-002 default is "deck's ~1,427 labeled illustrative 2025 reference." This matches the app's `marketPrice: 1427` default and keeps deck + app on the same baseline. Each new case slide will carry an "FMP: illustrative, NSMO/ERAV not public" caveat per `CON-002`.

## Risk Assessment
- **RISK-01-01** (slide indices differ) — mitigated: drove everything off actual `inspect_pptx.py` dump; captured in `inventory.txt`.
- **RISK-02-01** (XML corruption) — mitigated: backup taken; will use python-pptx (validated `import pptx; pptx.__version__ == '1.0.2'`) not direct XML; validate after each phase.

## Git
- Commit: `afe0a06` — "deck-consolidation phase-01: inventory + mapping spec"
- Pushed to `origin/master` (a8423cd..afe0a06)

## Exit Criteria Status
- [x] Mapping table covers every scenario slide with a target and number-change list
- [x] Verified 2026 number basis is locked
- [x] Agenda renumbering list is locked
- [x] Backup of the source deck is in place

## Next Phase
PHASE-02 — Build the 3 canonical case slides (matched / shortfall / excess) using python-pptx, replacing standalone scenario blocks at slides 38-45.
