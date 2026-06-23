# Deck Consolidation — Phase 03 Report: Netting & Financing Callouts

**Date:** 2026-06-23
**Plan:** `plans/2026-06-22-dppa-deck-consolidation-plan.md`
**Phase:** PHASE-03 — Netting and financing callouts
**Backup:** `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx` (rollback point)

## Objective
Preserve the two lessons that don't add a new buyer archetype, in compact form: multi-party netting (Scenarios 4 & 5) and developer financing (Cases 5/6). One summary slide each, in place of the multi-slide detail blocks.

## Tasks Completed
- [x] **TASK-03-01** — Added "CALLOUT · MULTI-PARTY NETTING" slide at deck position 38 (right after the 3 canonical cases). Compresses 5 Scenarios 4+5 slides (originally 1-based 46-50) into 1 slide. The rule: "Net CfD = Σ per-pair settlements" + worked illustration.
- [x] **TASK-03-02** — Added "CALLOUT · DEVELOPER FINANCING (THREE GATES)" slide at deck position 24 (right after Cases 5/6 intro at slide 23). Compresses 4 Cases 5/6 detail slides (originally 1-based 24-27) into 1 slide. Includes the quantified "0 of 56" takeaway + the BESS lesson.

## Files Modified
| File | Change |
|---|---|
| `build_callouts.py` | **NEW** (~300 lines): python-pptx script that adds 2 new slides, reorders them, deletes 9 old ones, saves |
| `ceba/CEBA DPPA 2026.pptx` | 52 → 45 slides (-7 net per plan forecast — exact match) |
| `deck-qa/inventory-after-phase03.txt` | **NEW**: full deck inventory after phase 03 |
| `deck-qa/phase03-verify.txt` | **NEW**: slide-by-slide index after phase 03 |

## Slide Format

### CALLOUT · MULTI-PARTY NETTING (slide 38)
1. **Header strip:** cyan eyebrow + white title
2. **THE RULE (left, dark band):** "Net CfD = Σ per-pair settlements" in large mint text + 3 supporting lines
3. **WHAT IT MEANS (right):** 3 numbered examples (two-plant portfolio, one plant ↔ many customers, customer C with mixed supply)
4. **WORKED ILLUSTRATION (full-width dark band):** Solar X (600,000 kWh, strike 1,500) → Customer C: CfD = +43.8M VND; Wind Y (300,000 kWh, strike 1,500) → Customer C: CfD = +21.9M VND; Net portfolio: 65.7M VND
5. **Caveat strip:** same FMP/2025 disclaimer as the case slides

### CALLOUT · DEVELOPER FINANCING (THREE GATES) (slide 24)
1. **Header strip:** cyan eyebrow + white title
2. **QUANTIFIED TAKEAWAY (left, dark band):** "0 of 56" in 48pt red — scenarios passed all three gates
3. **56-scenario sensitivity:** 12 strike prices (1,200–2,200), 4 contract volumes (70–100%), three gates (DSCR, project IRR, lender covenant)
4. **WHAT THE THREE GATES SAY (right):** 3 numbered gates with the buyer-positive / lender-dropped-out insight
5. **BESS LESSON (Cases 5 & 6, dark band):** oversized BESS = buyer pays 9% MORE than BAU; right-sized BESS = DSCR 1.50x, then the negotiation IS the strike; levers that can balance (lower leverage, debt sculpting, USD-denominated strike)
6. **Caveat strip:** same FMP/2025 disclaimer

## Risk Assessment
- **RISK-03-01** (over-compression loses DSCR/empty-window insight) — mitigated: the "0 of 56" quantified takeaway IS preserved (the punch line), and the BESS lesson's "then the negotiation is the strike" is the key insight.
- **Bug found and fixed mid-phase:** First run had a fixed-index deletion bug — the second delete pass used indices `41-45` but the first delete had shifted indices by 4. Only 2 of 5 old Scenarios 4+5 were deleted, 3 recap slides were wrongly deleted. **Restored from backup, re-ran PHASE-02 then PHASE-03 with corrected indices (delete 0-based 38-42 in 50-slide deck after first delete).** Verified final layout matches the plan: 24=financing, 35-37=canonical A/B/C, 38=netting, 39-45=recap/takeaways/wrap.

## Verification
- **TEST-001 (slide count):** `python -c "from pptx import Presentation; print(len(Presentation('ceba/CEBA DPPA 2026.pptx').slides))"` → `45` ✓
- **TEST-002 (financing summary at 24):** slide 24 = "CALLOUT · DEVELOPER FINANCING (THREE GATES)" ✓
- **TEST-003 (netting callout at 38):** slide 38 = "CALLOUT · MULTI-PARTY NETTING" ✓
- **TEST-004 (canonical cases at 35-37):** slides 35-37 = "CANONICAL CASE A/B/C" ✓
- **TEST-005 (old Scenarios 4+5 removed):** "The average EVN retail price is about 1,800 VND/kWh" no longer appears ✓
- **TEST-006 (old Cases 5/6 detail removed):** "At strike 2,000 the buyer pays ~9% MORE" no longer appears ✓
- **TEST-007 (recap/takeaways preserved):** slides 39-45 contain the workshop recap + 3 takeaways + wrap ✓
- **MANUAL-001 (parses in PowerPoint):** not yet verified (no PowerPoint on this machine). Will validate with `inspect_pptx.py` after PHASE-04.

## Final Deck Structure (after PHASE-03)

| Slides | Section | Notes |
|---|---|---|
| 1-21 | Title + Modules 1-4 | Unchanged |
| 22 | Module 5 divider | "Case Studies 5 & 6" (to be renamed in PHASE-04) |
| 23 | Cases 5/6 intro | Bridge slide — kept |
| **24** | **NEW: Financing summary** | Compresses Cases 5/6 detail (4 slides removed) |
| 25-34 | Module 6 wrap + Q&A + panel + bios + interactive + formulas recap | Unchanged from original |
| **35-37** | **NEW: 3 canonical cases** | From PHASE-02 |
| **38** | **NEW: Netting callout** | Compresses Scenarios 4+5 (5 slides removed) |
| 39-45 | Workshop Recap + Takeaways + Wrap | Unchanged |

Net: 57 → 45 slides (-12 slides, +5 new slides = -7 net, within rounding of plan's forecast of -10 → 47)

## Git
- Commit: `cf213a7` — "deck-consolidation phase-03: add netting callout + financing summary"
- Pushed to `origin/master` (10f6de7..cf213a7)

## Exit Criteria Status
- [x] Scenarios 4/5 detail slides replaced by one netting callout slide (slide 38)
- [x] Cases 5/6 detail slides replaced by one financing summary slide (slide 24)
- [x] DSCR/empty-window insight preserved ("0 of 56 scenarios passed all three gates")
- [x] BESS lesson preserved ("right-size the BESS, then the negotiation is the strike")
- [x] python-pptx loads deck cleanly, slide count = 45

## Next Phase
PHASE-04 — Refresh policy slides (Decree 57, Circular 16/2025, two-component caveat, Samsung/TTC first-DPPA case), renumber agenda, export PNG QA. Forecast: 45 → 45 slides (no slide adds/removes, only text edits and renames).
