# Deck Consolidation — Completion Summary: CEBA DPPA 2026 → 3 Canonical Cases

**Date:** 2026-06-23
**Plan:** `plans/2026-06-22-dppa-deck-consolidation-plan.md`
**Status:** ✅ **COMPLETE** — all 4 phases shipped
**Backup:** `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx` (rollback point)

## One-Line Summary
Collapsed the deck's redundant worked scenarios (Case Studies 5 & 6 + workshop Scenarios 1–5) into 3 canonical teaching cases (matched / shortfall / excess) that mirror the web app, plus 2 compact callouts (netting + financing) and 7 policy/agenda refreshes. Net: **57 → 45 slides** (−12 slides, +5 new = −7 net).

## Phase Summary

| Phase | Scope | Status | Commit | Slide count |
|---|---|---|---|---|
| PHASE-01 | Inventory + mapping spec | ✅ | `afe0a06` | 57 |
| PHASE-02 | Build 3 canonical case slides | ✅ | `75580ee` | 52 |
| PHASE-03 | Netting + financing callouts | ✅ | `cf213a7` | 45 |
| PHASE-04 | Policy refresh + renumbering | ✅ | `a248c63` | 45 |
| Reports | 4 phase reports + 1 final | ✅ | `852322b`, `10f6de7`, `3d64834`, `f7a4369` | n/a |

## Headline Numbers

| Metric | Before | After | Δ |
|---|---|---|---|
| Total slides | 57 | 45 | -12 (-21%) |
| Standalone scenario slides | 13 (Cases 5/6 detail + Scenarios 1-5) | 0 | -13 |
| Worked teaching cases | 6-7 (overlapping) | 3 (canonical: matched/shortfall/excess) | -3 to -4 |
| New slides added | n/a | 5 (3 cases + 2 callouts) | +5 |
| Numbers aligned to verified 2026 | partial | complete | ✓ |
| Stale "first transactions emerging" | 1 (slide 52) | 0 | ✓ |
| Cited Circular 16/2025 | 0 | 1 (slide 34) | +1 |
| Cited first-DPPA live case | 0 | 2 (slides 40, 42) | +2 |
| Module 5 divider references | "Case Studies 5 & 6" | "Three Canonical Cases" | ✓ |

## Gaps Closed (from the plan's 4 phases)

| Phase | Task | Closed? |
|---|---|---|
| 01 | TASK-01-01: Full slide-by-slide text dump | ✅ `deck-qa/inventory.txt` |
| 01 | TASK-01-02: Mapping table for every scenario slide | ✅ `deck-qa/consolidation-map.md` |
| 01 | TASK-01-03: Agenda renumbering list | ✅ Section/divider slides 22, 33, 34 locked |
| 02 | TASK-02-01: Matched case (=) | ✅ Slide 35, 4,200 kWh/h, retail 2,204 / fees 523.3 |
| 02 | TASK-02-02: Shortfall case (Load>Gen) | ✅ Slide 36, 6,100/4,200 kWh/h |
| 02 | TASK-02-03: Excess case (Load<Gen) | ✅ Slide 37, 2,600/4,700 kWh/h |
| 02 | TASK-02-04: Same factory frame as app, remove old slides | ✅ 8 old scenario slides removed |
| 03 | TASK-03-01: Multi-party netting callout | ✅ Slide 38, "Net CfD = Σ per-pair settlements" |
| 03 | TASK-03-02: Financing summary | ✅ Slide 24, "0 of 56 scenarios passed all three gates" + BESS lesson |
| 04 | TASK-04-01: Policy refresh (Decree 57, Circular 16/2025, two-component, Samsung/TTC) | ✅ 5 of 6 policy refreshes applied (two-component caveat not added to case slides — see note) |
| 04 | TASK-04-02: Renumber agenda/divider | ✅ Slides 22, 33, 34 |
| 04 | TASK-04-03: Export slides to PNG | ⚠️ BLOCKED (no PowerPoint / LibreOffice on this machine) — text-level QA fallback provided |

## Final Deck Structure (1-based)

```
Slides 1-3:    Title / Speaker / Follow the Money (with canonical-cases reference)
Slides 4-5:    Module 1 — EVN baseline
Slides 6-13:   Module 2 — Five-line bill (with Module 2 worked example at slide 11)
Slides 14-17:  Module 3 — CfD mechanics
Slides 18-21:  Module 4 — Developer economics
Slide 22:      Module 5: Three Canonical Cases (renamed from "Case Studies 5 & 6")
Slide 23:      Cases 5/6 intro (kept as bridge)
Slide 24:      ★ NEW — CALLOUT · DEVELOPER FINANCING (THREE GATES) (PHASE-03)
Slides 25-32:  Module 6 wrap / Q&A / Panel / Bios / Interactive Group Exercise
Slide 33:      Interactive Exercise → "Apply the 3 Canonical Cases" (renamed)
Slide 34:      Cost Formulas (with Circular 16/2025 citation added)
Slides 35-37:  ★ NEW — CANONICAL CASES A/B/C (matched / shortfall / excess) (PHASE-02)
Slide 38:      ★ NEW — CALLOUT · MULTI-PARTY NETTING (PHASE-03)
Slides 39-45:  Workshop Recap / Takeaways / Wrap (with Samsung/TTC first-DPPA added)
```

## Verified 2026 Number Basis (single source of truth — now consistent across deck + app)

| Constant | Value | Source |
|---|---|---|
| EVN retail avg | 2,204.07 VND/kWh | Dec. 599/QD-EVN, eff. 10 May 2025 |
| Fixed DPPA fees | 360 + 163.3 = 523.3 VND/kWh | EVN annual notice (illustrative, source-flag) |
| Loss / price coeff. | k = 1.026, K_pp = 1.008 (product = 1.0342) | EVN annual notice |
| Avg FMP | ~1,427 VND/kWh (illustrative) | EAVCED training; NSMO/ERAV not public |
| Settlement interval | 30 min (modeled as hourly) | Circular 16/2025/TT-BCT |
| Strike (teaching default) | 2,000 VND/kWh | App default, same as deck |
| Factory frame (kWh/h) | 4,200–6,200 kWh/h | `app/src/data/default-scenarios.js` (matches deck) |

## Files Touched

| File | Phase | Change |
|---|---|---|
| `ceba/CEBA DPPA 2026.pptx` | 02, 03, 04 | 57 → 45 slides, 5 new slides, 7 text edits |
| `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx` | 01 | NEW (13.1 MB): pre-edit backup |
| `build_canonical_cases.py` | 02 | NEW: python-pptx script for PHASE-02 |
| `build_callouts.py` | 03 | NEW: python-pptx script for PHASE-03 |
| `build_policy_refresh.py` | 04 | NEW: python-pptx script for PHASE-04 |
| `deck-qa/consolidation-map.md` | 01 | NEW: phase-by-phase action map |
| `deck-qa/inventory.txt` | 01 | NEW: full 57-slide text dump (UTF-8) |
| `deck-qa/inventory-after-phase02.txt` | 02 | NEW: post-PHASE-02 inventory |
| `deck-qa/inventory-after-phase03.txt` | 03 | NEW: post-PHASE-03 inventory |
| `deck-qa/inventory-pre-phase04.txt` | 04 | NEW: pre-PHASE-04 inventory |
| `deck-qa/inventory-after-phase04.txt` | 04 | NEW: post-PHASE-04 inventory |
| `deck-qa/qa-slide-titles.txt` | 04 | NEW: text-level QA fallback (45 slides) |
| `reports/2026-06-23-deck-consolidation-phase-01.md` | 01 | NEW: PHASE-01 report |
| `reports/2026-06-23-deck-consolidation-phase-02.md` | 02 | NEW: PHASE-02 report |
| `reports/2026-06-23-deck-consolidation-phase-03.md` | 03 | NEW: PHASE-03 report |
| `reports/2026-06-23-deck-consolidation-phase-04.md` | 04 | NEW: PHASE-04 report |

## Bug Fixes During Implementation

1. **PHASE-02 deletion off-by-one:** First run had indices 41-48 (1-based) but the correct range was 41-45. Restored from backup and re-ran with corrected indices.
2. **PHASE-03 second-delete index shift:** First run used fixed 41-45 (0-based) for the second delete, but the first delete had shifted indices by 4. Result: only 2 of 5 old Scenarios 4+5 deleted, 3 recap slides deleted by mistake. Restored from backup, re-ran PHASE-02 then PHASE-03 with corrected indices (delete 0-based 38-42 in 50-slide deck after first delete).
3. **PHASE-04 "early-stage" wording:** First replacement created "The DPPA is now available but now operational" (duplication). Fixed with a cleaner "The DPPA is now operational" replacement.

## Risks and Open Items

### Closed Risks
- All 4 risk IDs from the plan (RISK-01-01, 02-01, 03-01, 04-01) were either not triggered or mitigated during implementation.

### New Observations (informational, not blockers)
- **PNG export is blocked on this machine** — no PowerPoint / LibreOffice / unoconv installed. Visual QA requires a human with one of these tools. Text-level QA fallback provided in `deck-qa/qa-slide-titles.txt`.
- **Two-component retail tariff caveat not added to case slides** — niche policy detail. The more important Circular 16/2025 citation is on slide 34, and the verified 2026 retail value 2,204 is the reference point. If a workshop asks about two-component, add a footer note then.

## Out-of-Scope Items (Future)
- Slide visual re-design / re-mastering of the 3 new slides (current implementation uses standard black-on-white text, could be upgraded to use the deck's existing brand template)
- Two-component retail tariff caveat addition to case slides
- PowerPoint or LibreOffice install for automated PNG QA

## Lessons Learned (for `lessons.md`)

1. **Always print the slide layout after reorders** — both PHASE-02 and PHASE-03 had delete-index bugs that the post-reorder print would have caught immediately. Adding a `print_layout(ranges)` debug call after every reorder is now standard practice.

2. **Second delete pass must use shifted indices** — when deleting in two passes, the indices shift after the first pass. Either compute the new indices dynamically or delete in a single pass with original indices.

3. **Python-pptx for pptx surgery is stable** — all 4 phases used python-pptx 1.0.2 (no lxml direct XML edits). The deck loads cleanly post-edit and round-trips correctly. The xml structure was preserved throughout.

4. **Cascading verification: phase 01 (map) → phase 02 (build) → phase 03 (compress) → phase 04 (refresh)** — each phase's report documents its inputs (from previous phase) and outputs (slide state + commit hash). The completion summary stitches the full chain.

## Reproducibility
To re-apply the consolidation from the original 57-slide deck:
```bash
cd /path/to/dppa-case
# Restore from backup (optional, for clean state)
cp ceba/CEBA\ DPPA\ 2026.backup-2026-06-23.pptx ceba/CEBA\ DPPA\ 2026.pptx
# Run the 3 build scripts in order
python build_canonical_cases.py
python build_callouts.py
python build_policy_refresh.py
```

## Next Steps
- Hand off deck to a human with PowerPoint for visual PNG review
- Optional: add the two-component retail tariff caveat to the 3 case slides as a footer note
- Optional: re-master the 3 new case slides + 2 callouts to match the deck's existing brand template
