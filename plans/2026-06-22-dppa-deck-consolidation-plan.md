---
title: "CEBA DPPA 2026 Deck — Scenario Consolidation to 3 Canonical Cases"
date: "2026-06-22"
status: "draft"
request: "Based on brainstorm dppa-app-deck-consolidation: consolidate the deck's 6-7 scenarios into 3 canonical cases using the web app's model"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-06-22_dppa-app-deck-consolidation-brainstorm.md"
  - "research/2026-06-22_vietnam-dppa-2026.md"
---

# Plan: CEBA DPPA 2026 Deck — Scenario Consolidation to 3 Canonical Cases

## Objective
Collapse the deck's redundant worked scenarios (Case Studies 5 & 6 + workshop Scenarios 1–5) into the web app's three canonical teaching cases — matched (=), shortfall (Load>Gen), excess (Load<Gen) — while preserving the multi-party netting lesson and the developer-financing lesson as compact callouts, and aligning every number to verified 2026 values.

## Context Snapshot
- **Current state:** `ceba/CEBA DPPA 2026.pptx` (57 slides) carries overlapping scenarios with separately-numbered, sometimes inconsistent inputs (Scenario 1 strike 1,250/FMP 1,150; Scenario 3 strike 1,500/FMP 1,600; Scenario 4 multi-plant; Scenario 5 multi-customer; Cases 5/6 solar+BESS at strike 2,000). The web app proves Scenarios 1/2/3 and Cases 5/6 are one parameterized model.
- **Desired state:** A consolidated deck where worked examples map to 3 canonical cases mirroring the app; Scenarios 4/5 become a single "net CfD = sum of per-pair settlements" callout; Cases 5/6 financing/three-gates/empty-window compress to one summary slide; retail/fees/loss aligned to verified 2026 values; Decree 57 / Circular 16/2025 / first-transaction facts updated.
- **Key repo surfaces:** `ceba/CEBA DPPA 2026.pptx` (target), `ref/DPPA 2025 ref.pptx` (template basis), `build_2026_from_ref.py`, `build-deck.js`, `export-slides.ps1`, `inspect_pptx.py`, `deck-qa/`.
- **Out of scope:** App code changes (see app plan); GHG/Scope content; adding new financing math; changing master/template design.

## Research Inputs
- `research/2026-06-22_dppa-app-deck-consolidation-brainstorm.md` — DEC-006 (3 canonical cases), DEC-007 (multi-party as netting callout), DEC-008 (financing → one summary slide).
- `research/2026-06-22_vietnam-dppa-2026.md` — Verified retail 2,204; fees 523.3; loss 1.0342; FMP illustrative; Decree 57 eligibility relaxation; Circular 16/2025 (FMP=SMP+CAN, 30-min); two-component tariff double-charge caveat; Samsung/TTC Duc Hue 2 first grid DPPA.

## Assumptions and Constraints
- **ASM-001:** Editing happens on the pptx in place (per workflow preference), preserving masters/layouts/branding — not a from-scratch rebuild.
- **ASM-002:** The 3 canonical cases reuse the app's archetype mapping: Scenario 1 → matched; Scenario 2 (duck-curve) → matched w/ FMP-below-strike; Scenario 3 → shortfall; Cases 5/6 (overbuild) → excess.
- **CON-001:** Slide count will drop; section/agenda slides (3, 22, 37) and module dividers must be re-numbered/re-pointed.
- **CON-002:** FMP/fee figures shown must carry an "illustrative / EVN annual notice" caveat.
- **DEC-001:** Keep the deck's overall module structure (1–6 + workshop + takeaways); only the scenario slides consolidate.

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Inventory + mapping spec | None | Slide-by-slide consolidation map |
| PHASE-02 | Build the 3 canonical case slides | PHASE-01 | Rewritten matched/shortfall/excess slides w/ verified numbers |
| PHASE-03 | Netting + financing callouts | PHASE-02 | Multi-party netting callout; one financing summary slide |
| PHASE-04 | Policy refresh + QA export | PHASE-03 | Updated facts, renumbered agenda, exported PNG QA |

## Detailed Phases

### PHASE-01 - Inventory and mapping spec
**Goal**
Produce an exact mapping from current scenario slides to the 3 canonical cases before touching the pptx.

**Tasks**
- [ ] TASK-01-01: Run `python inspect_pptx.py` (or extend it) against `ceba/CEBA DPPA 2026.pptx` to dump slide index → title → text for the scenario range (Cases 5/6 ≈ slides 23–27; Scenarios 1–5 ≈ slides 37–50).
- [ ] TASK-01-02: Write a mapping table (in `deck-qa/consolidation-map.md`): each source slide → target canonical case (matched/shortfall/excess) or callout, plus which numbers change to verified values.
- [ ] TASK-01-03: Identify all agenda/divider slides that reference scenario numbers (e.g. slides 3, 22, 36–37) for later renumbering.

**Files / Surfaces**
- `inspect_pptx.py` — text dump tool.
- `ceba/CEBA DPPA 2026.pptx` — source of truth for current content.
- `deck-qa/consolidation-map.md` — new mapping artifact.

**Dependencies**
- None.

**Exit Criteria**
- [ ] Mapping table covers every scenario slide with a target and number-change list.

**Phase Risks**
- **RISK-01-01:** Slide indices differ from estimates → drive everything off the actual `inspect_pptx.py` dump, not assumptions.

### PHASE-02 - Build the 3 canonical case slides
**Goal**
Create one coherent worked example per canonical case, consistent with the app's engine and verified numbers.

**Tasks**
- [ ] TASK-02-01: Matched case (=): one worked five-line settlement where consumption = contracted = matched (folds Scenario 1 + Scenario 2's FMP-below-strike point), retail 2,204, fees 523.3, loss 1.0342, FMP labeled illustrative.
- [ ] TASK-02-02: Shortfall case (Load>Gen): worked example with residual EVN purchase and a negative-CfD month (folds Scenario 3), same constants.
- [ ] TASK-02-03: Excess case (Load<Gen): overbuild example (folds Cases 5/6 buyer view) showing CfD caps at consumed volume, excess earns generator spot only.
- [ ] TASK-02-04: Use a single consistent factory/plant frame across all three so numbers are comparable; remove the old per-scenario standalone slides.

**Files / Surfaces**
- `ceba/CEBA DPPA 2026.pptx` — edited in place (preserve layouts).
- `build_2026_from_ref.py` / `build-deck.js` — reuse if scenario slides are generated from a data structure; otherwise edit slides directly.

**Dependencies**
- PHASE-01 mapping.

**Exit Criteria**
- [ ] Three canonical case slides exist with internally consistent, verified numbers; superseded scenario slides removed.

**Phase Risks**
- **RISK-02-01:** Editing XML directly can corrupt the pptx → prefer the existing python-pptx build path; keep a backup copy before edits.

### PHASE-03 - Netting and financing callouts
**Goal**
Preserve the two lessons that don't add a new buyer archetype, in compact form.

**Tasks**
- [ ] TASK-03-01: Add a multi-party netting callout (on/after the canonical cases): "net CfD = sum of per-pair settlements," distilling Scenarios 4 & 5; remove their standalone slides.
- [ ] TASK-03-02: Compress Cases 5/6 developer-economics/three-gates/empty-window into one summary slide ("right-size the BESS; then the negotiation is the strike; window can be empty"), referenced from the excess case; keep Modules 3–4 conceptual slides intact.

**Files / Surfaces**
- `ceba/CEBA DPPA 2026.pptx` — callout + summary slide.

**Dependencies**
- PHASE-02.

**Exit Criteria**
- [ ] Scenarios 4/5 and Cases 5/6 detail slides replaced by one netting callout + one financing summary slide.

**Phase Risks**
- **RISK-03-01:** Over-compression loses the DSCR/empty-window insight → keep the single quantified takeaway (0 of 56 scenarios passed all three gates).

### PHASE-04 - Policy refresh, renumbering, QA export
**Goal**
Update stale facts and verify the deck renders cleanly.

**Tasks**
- [ ] TASK-04-01: Refresh policy slides: eligibility wording (Decree 57 relaxed 200k-kWh/22kV → MOIT-adjustable), add Circular 16/2025 (FMP=SMP+CAN, 30-min) basis, two-component-tariff double-charge caveat, and the Samsung/TTC Duc Hue 2 first-transaction case (replaces "emerging" on slide 52).
- [ ] TASK-04-02: Renumber agenda/divider/section slides to match the reduced scenario set.
- [ ] TASK-04-03: Export slides to PNG via `export-slides.ps1` into `deck-qa/` and visually review for layout/overflow.

**Files / Surfaces**
- `ceba/CEBA DPPA 2026.pptx`, `export-slides.ps1`, `deck-qa/`.

**Dependencies**
- PHASE-03.

**Exit Criteria**
- [ ] Deck opens without repair prompt; agenda numbering consistent; PNG QA shows no overflow on edited slides.

**Phase Risks**
- **RISK-04-01:** PowerPoint "repair" on open = corruption → validate by reopening and by re-running `inspect_pptx.py` after each batch of edits.

## Verification Strategy
- **TEST-001:** `python inspect_pptx.py` after edits — confirms slide text/structure parses and matches the mapping.
- **MANUAL-001:** Open `ceba/CEBA DPPA 2026.pptx` in PowerPoint — no repair prompt, branding/layout intact.
- **OBS-001:** PNG export in `deck-qa/` reviewed slide-by-slide for the consolidated cases.

## Risks and Alternatives
- **RISK-001:** Numbers in deck drift from app again — mitigate by sourcing both from the same verified-values list (`research/2026-06-22_vietnam-dppa-2026.md`).
- **ALT-001:** One parameterized scenario engine + presets (brainstorm option A) — rejected in favor of 3 canonical cases (DEC-006) for teaching clarity.
- **ALT-002:** Keep all scenarios, only standardize numbers — rejected (DEC-006) as leaving redundancy.

## Grill Me
1. **Q-001:** Should the consolidated cases use the same factory frame as the app (so deck and live tool show identical numbers), or keep the deck's larger industrial-park figures?
   - **Recommended default:** Same factory frame as the app, for a seamless live-demo handoff.
   - **Why this matters:** Determines whether facilitators can switch deck↔app without renumbering.
   - **If answered differently:** Deck keeps its own scale; app and deck numbers diverge by design.
2. **Q-002:** Confirm FMP figure to display on the worked slides pending primary data.
   - **Recommended default:** Deck's ~1,427 labeled "illustrative 2025 reference."
   - **Why this matters:** Drives every worked total on the canonical case slides.
   - **If answered differently:** All three case slides re-compute with the supplied FMP.

## Suggested Next Step
Answer Grill Me Q-001/Q-002, then execute PHASE-01 (inventory + mapping) before any pptx edits.
