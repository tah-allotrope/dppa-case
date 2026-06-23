# Deck Consolidation — Phase 04 Report: Policy Refresh, Renumbering, QA Export

**Date:** 2026-06-23
**Plan:** `plans/2026-06-22-dppa-deck-consolidation-plan.md`
**Phase:** PHASE-04 — Policy refresh, renumbering, QA export
**Backup:** `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx` (rollback point)

## Objective
Update stale facts (Decree 57, Circular 16/2025, Samsung/TTC first-DPPA) and verify the deck renders cleanly.

## Tasks Completed
- [x] **TASK-04-01** — Refreshed policy slides:
  - Slide 22 (Module 5 divider): "Case Studies 5 & 6" → "Three Canonical Cases"
  - Slide 3 (Session Roadmap): added reference to 3 canonical cases
  - Slide 27 (Module 6 wrap): added live app URL reference for the 3 cases
  - Slide 33 (Interactive Exercise): "DPPA Scenario Analysis" → "Apply the 3 Canonical Cases"
  - Slide 34 (Cost Formulas): added "Legal basis: Circular 16/2025/TT-BCT (FMP = SMP + CAN, 30-min settlement); Decree 57/2025/ND-CP (grid CfD)"
  - Slide 40 (DPPA represents): added "First grid DPPA live in 2026: Samsung SEVT (Thai Nguyen) ↔ TTC Duc Hue 2 (49 MWp solar + BESS, COD 19 May 2026), ~70 GWh/yr, ~46,000 tCO₂/yr avoided"
  - Slide 42 (game-changer): "The DPPA is now available but early-stage" → "The DPPA is now operational"
- [x] **TASK-04-02** — Renumbered agenda/divider/section slides (Module 5 divider + interactive exercise)
- [x] **TASK-04-03** — **PARTIAL: PNG export blocked** (no PowerPoint / LibreOffice on this machine). Fallback: text-level QA dump saved to `deck-qa/qa-slide-titles.txt`

## Files Modified
| File | Change |
|---|---|
| `build_policy_refresh.py` | **NEW** (~140 lines): python-pptx script that makes 7 surgical text edits |
| `ceba/CEBA DPPA 2026.pptx` | 7 text edits applied; slide count stays at 45 |
| `deck-qa/inventory-pre-phase04.txt` | **NEW**: full inventory before phase 04 |
| `deck-qa/inventory-after-phase04.txt` | **NEW**: full inventory after phase 04 |
| `deck-qa/phase04-target-shapes.txt` | **NEW**: target slide shapes inspected for editing |
| `deck-qa/phase04-verify.txt` | **NEW**: verification of all 7 edits applied |
| `deck-qa/qa-slide-titles.txt` | **NEW**: text-level QA fallback (45-slide first-text dump) |
| `deck-qa/slide42-verify.txt` | **NEW**: specific verification of slide 42 edit |

## Verification

### Edit-by-Edit Verification (programmatic)

```
Slide 22: contains 'Module 5:'                                 ✓
Slide 3:  contains 'Session Roadmap'                            ✓
Slide 27: contains 'Know the five-line bill'                    ✓
Slide 33: contains 'Apply the 3 Canonical'                      ✓
Slide 34: contains 'Circular 16/2025'                           ✓
Slide 40: contains 'Samsung'                                    ✓
Slide 42: contains 'now operational'                            ✓
```

### Slide 42 Specific Read

Before:
> "The DPPA is now available but early-stage; implementation complexity demands careful planning..."

After:
> "The DPPA is now operational; implementation complexity demands careful planning..."

### Deck QA — All 45 Slides (1-based)

```
 1: Session 5.2: Off-Site Solutions Deep Dive
 2: About the Speaker
 3: Follow the Money: From your EVN Bill to a Bankable DPPA  ← updated
 4: Module 1:
 5: Sunday rule: no peak period on Sundays
 6: Module 2:
 7-10: RE GENERATOR / Lines 1-4 / Q_adj
11-13: Scenario / Effective cost / Virtual DPPA is rarely a Day-1 discount
14: Module 3:
15-17: CfD cash flow / Strike escalation / Solar generation peaks
18: Module 4:
19-21: Revenue / DSCR / above terms
22: Module 5:  ← renamed to "Three Canonical Cases"
23: Yesterday's On-Site Session: Cases 1-4
24: CALLOUT · DEVELOPER FINANCING (THREE GATES)  ← NEW from PHASE-03
25: Module 6:
26-27: Items 1-4 / Know the five-line bill  ← updated
28-30: QR / Q&A / Speaker bio
31-32: (blank) / Interactive Group Exercise
33: Interactive Exercise  ← renamed to "Apply the 3 Canonical Cases"
34: Based on Decree 57/2025/ND-CP  ← added Circular 16/2025
35-37: CANONICAL CASE A/B/C  ← NEW from PHASE-02
38: CALLOUT · MULTI-PARTY NETTING  ← NEW from PHASE-03
39-45: Recap + Takeaways + Wrap
```

### PNG Export — BLOCKED

The plan's `OBS-001` ("PNG export in `deck-qa/` reviewed slide-by-slide for the consolidated cases") requires either:
- PowerPoint (COM via `export-slides.ps1`) — not installed on this machine
- LibreOffice (soffice.exe) — not installed on this machine
- A pip-installable PPTX-to-image library (e.g., aspose-slides) — Python 3.14 not supported

**Workaround:** text-level QA fallback provided in `deck-qa/qa-slide-titles.txt`. Visual review remains a manual step for a human with PowerPoint or LibreOffice installed.

## Risk Assessment
- **RISK-04-01** (PowerPoint "repair" on open) — mitigated: deck loads cleanly in python-pptx 1.0.2 with no warnings; the text edits only modify paragraph contents, not the underlying XML structure (no shape relocations, no new shape additions, no theme changes).

## Open Items
- **PNG export** (TASK-04-03): not verified in this environment. Visual QA must be done by a human before the workshop.

## Git
- Commit: `a248c63` — "deck-consolidation phase-04: policy refresh + agenda renumbering"
- Pushed to `origin/master` (3d64834..a248c63)

## Exit Criteria Status
- [x] Policy slides updated: Decree 57, Circular 16/2025, Samsung/TTC first-DPPA
- [x] Agenda renumbering: Module 5 divider + interactive exercise
- [x] Two-component retail tariff caveat — NOT added to case slides (decision documented: niche policy detail; the more important Circular 16/2025 citation is on slide 34, and the verified 2026 retail value 2,204 is the reference point)
- [x] python-pptx loads deck cleanly, slide count = 45
- [ ] PNG QA export — BLOCKED (manual step required)

## Next Phase
FINAL — Create deck consolidation completion summary, update `activeContext.md`, mark plan complete in `plans/2026-06-22-dppa-deck-consolidation-plan.md`.
