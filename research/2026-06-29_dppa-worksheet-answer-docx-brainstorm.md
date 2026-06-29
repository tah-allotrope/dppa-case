---
title: "DPPA Worksheets + Answer Summary — Combined Bilingual Word Doc"
date: "2026-06-29"
type: "brainstorm"
depth: "deep"
source_request: "deep — combine the worksheets in lessons folder with the dppa scenario answer summary into a new Word doc following the style/format of the docx file"
slug: "dppa-worksheet-answer-docx"
---

# Brainstorm: DPPA Worksheets + Answer Summary — Combined Bilingual Word Doc

## Problem & Why Now
The CEBA 2026 training has two separate assets that belong together: the **blank compute worksheets** (`lessons/0011-worksheets*.html` — S1/S2/S3 + negotiation grids participants fill by hand) and a polished **answer/scenario summary** (`lessons/DPPA_Scenario_Answer_Summary.docx`). Right now a facilitator can't hand out one clean printable that lets a participant **compute, then self-check**. The ask is a **single new Word document** that, per scenario, pairs the blank worksheet grid with its worked totals, in the **exact bilingual house style** of the existing `.docx`. It needs to be Word (not HTML) because it's printed/shared as a training handout, and it must look like it belongs in the same set as the existing answer summary.

## Current vs Desired State
- **Current state:**
  - **Worksheets:** `lessons/0011-worksheets.html` (+ `-vi`, `-zh-cn`) — blank fillable compute grids: S1 matched, S2 shortfall, S3 excess (each = 5-line bill with the *Calculation* column pre-filled and the *VND/month* column blank, plus C_EVN/CfD/C_KH/effective rows; S2 adds the retail line-4; S3 adds an excess block) and a negotiation grid.
  - **Answer/style reference:** `lessons/DPPA_Scenario_Answer_Summary.docx` — bilingual **EN | VI**, 56 paragraphs + **23 tables**, two scenario sections (Scenario 1 Industrial Park; Scenario 2 Duck Curve & Price Crashes) with sub-sections (context, Decree-243 legal change, 3-step plan, 4 parties, CfD calculation, two-bill problem, budget scenarios, CFO message, comparison summary). **Style:** centered title banner 18pt bold white on shaded blue; VI subtitle 14pt light-blue `D6E4F0`; section heads 12pt bold dark-blue `1F4E79`; sub-heads bold medium-blue `2E75B6`; gray `888888` footer "Prepared for CEBA 2026 Training | Allotrope Partners Vietnam | Based on Decree 57/2025 & 243/2026"; ~0.75in margins.
  - **Canonical numbers:** `research/2026-06-29_dppa-scenario-numbers-spec.md` — S1 C_EVN 8,563,196,000 / CfD +500,000,000 / C_KH 9,063,196,000 (~1,813 VND/kWh); S2 19,628,262,400 / −800,000,000 / 18,828,262,400 (~2,092); S3 8,304,644,000 / +750,000,000 / 9,054,644,000 (~1,811). Constants: k×K_pp = 1.034208, service 360, clearing 163.30 (fees 523.30), retail 2,204.
  - **Tooling:** `python-docx 1.2.0` available (repo already uses python-docx/pptx for generation).
  - No combined worksheet+answer Word doc exists yet.
- **Desired state:** a new **`lessons/DPPA_Worksheets_and_Answers.docx`** that, in the reference's bilingual blue style, presents — per scenario (S1, S2, S3, then negotiation) — a styled **banner → blank worksheet grid → worked totals (C_EVN / CfD / C_KH)**, preceded by a shared title banner + constants/legal-basis block and followed by a 3-case comparison summary table; gray footer. The original `DPPA_Scenario_Answer_Summary.docx` is left untouched.
- **Key repo surfaces:** `lessons/0011-worksheets.html` + `-vi` (grid layout + EN/VI cell text), `lessons/DPPA_Scenario_Answer_Summary.docx` (style template + footer/constants source), `research/2026-06-29_dppa-scenario-numbers-spec.md` (totals + constants, verbatim), optionally `facilitator/dppa-workshop-facilitator-guide.md` (answer-key cross-check).

## Resolved Decisions
- **DEC-001:** Structure = **per scenario: styled banner → blank worksheet grid → worked totals**, repeated for S1/S2/S3 + negotiation, then a comparison summary. — a self-contained "compute then check" packet.
- **DEC-002:** Scenarios = the **workshop's S1 matched / S2 shortfall / S3 excess + negotiation** (the worksheet set), rendered in the reference docx's visual style. Adds S3 (the reference has only two scenarios).
- **DEC-003:** **Bilingual EN | VI** throughout, matching the reference; VI text lifted from `lessons/0011-worksheets-vi.html` and the reference docx.
- **DEC-004:** Worked answer = **totals only** per scenario — C_EVN, signed CfD, C_KH (the reconciliation checkpoints) — not a full line-by-line re-derivation (the blank grid already lists the line formulas to compute).
- **DEC-005:** Include a closing **EN | VI 3-case comparison summary table** (volume axis · line 4 · FMP vs strike · CfD sign · C_EVN · C_KH · effective · risk lesson) from the numbers spec, mirroring the reference's "Scenario Comparison Summary".
- **DEC-006:** Carry over **style shell only** from the reference — title banner, a shared constants/legal-basis block (k×K_pp, fees 523.30, retail 2,204, Decree 57/243), and the gray footer — **not** the IP/duck-curve/CFO narrative prose.
- **DEC-007:** Output = **new file `lessons/DPPA_Worksheets_and_Answers.docx`**; the original `DPPA_Scenario_Answer_Summary.docx` is kept untouched.
- **DEC-008:** Build by **copying the reference `.docx` as a template and extending it** — i.e., start from the reference so the new doc inherits its exact styles/theme/banner/footer **byte-for-byte**, then replace the scenario bodies with the S1/S2/S3 worksheet+totals content (see DEC-010 / Q-001 for the replace-vs-keep nuance).
- **DEC-009:** Negotiation "answer" = **brief guidance + a worked example** — `CfD = (strike − 1,150) × 5,000,000` at a sample strike, the "crosses zero at strike = FMP" note, and the buyer/seller/lender gate trade-off — not a single "correct" strike.
- **DEC-010:** Reconciliation of DEC-002/006/008: the reference docx provides the **visual shell** (banner, `1F4E79`/`2E75B6`/`D6E4F0` palette, table look, footer); its **IP/duck-curve scenario content is replaced** by the workshop S1/S2/S3 + negotiation. "Extend" = build on the template's *styling*, not its scenario *content*.

## Assumptions & Constraints
- **ASM-001:** Every numeric total is copied **verbatim** from `research/2026-06-29_dppa-scenario-numbers-spec.md` (S1/S2/S3 C_EVN/CfD/C_KH + effective); no re-derivation.
- **ASM-002:** Blank grids mirror `lessons/0011`: the *Calculation* column shows the formula (e.g., `5,000,000 × 1,150 × 1.026 × 1.008`), the *VND/month* column is an empty, lightly-shaded fillable cell sized for handwriting; rows = lines 1–4, C_EVN, line 5 CfD, C_KH, effective. S2 includes the retail line-4 row; S3 includes the excess block (excess volume, spot value, foregone CfD) as blanks.
- **ASM-003:** One scenario per page (page break between scenarios), matching the reference docx's section paging.
- **ASM-004:** Bilingual rendering reuses the reference's two-column / "EN | VI" inline pattern; VI strings come from `0011-worksheets-vi.html` and the reference docx so terminology is consistent (Giá thực hiện, Phụ tải, etc.).
- **CON-001:** zh-cn is **out of scope** — the reference docx and the chosen format are EN | VI only (DEC-003), even though a zh-cn worksheet exists.
- **CON-002:** Faithfully cloning the reference's shaded banner cells / table fills via python-docx may require direct XML (`w:shd`, cell properties) since python-docx has limited high-level shading support; starting from the copied template (DEC-008) mitigates this by inheriting existing styled tables to clone.
- **CON-003:** Word-document edits are local files only; no Google Docs / browser involvement (distinct from the parked panel-comment task).

## Approaches Considered
- **Chosen:** Copy the reference `.docx` → keep its shell/styles → replace scenario bodies with S1/S2/S3 + negotiation (blank grid → totals) + comparison summary, bilingual. — inherits exact styling; lowest visual-fidelity risk.
- **ALT-001:** Build a fresh doc with python-docx replicating the observed style constants. — rejected (DEC-008): re-deriving banner shading/table fills from scratch risks visual drift from the reference.
- **ALT-002:** Two-part layout (all blanks, then an answer-key section). — rejected (DEC-001): user chose per-scenario blank→answer.
- **ALT-003:** Full line-by-line worked answers. — rejected (DEC-004): totals-only check; the blank grid carries the line formulas.
- **ALT-004:** Keep the reference's IP/duck-curve scenarios and just append S3. — rejected (DEC-002/010): content is the workshop canonical set.

## Out of Scope
- A zh-cn version (CON-001).
- Editing/replacing the original `DPPA_Scenario_Answer_Summary.docx` (DEC-007).
- The reference's IP/duck-curve/CFO narrative prose (DEC-006).
- Full line-by-line answer derivations (DEC-004).
- Any Google Docs / browser action (the panel-comment task is separate and parked).

## Open Questions
1. **Q-001:** Confirm the "copy & extend" intent: the new doc should **replace** the reference's two scenario sections (IP, Duck Curve) with the workshop S1/S2/S3 + negotiation, keeping only the reference's shell/styles — correct?
   - **Recommended default:** Yes — template = styling/shell only; content = S1/S2/S3 + negotiation (per DEC-002, DEC-006, DEC-010).
   - **Why this matters:** If instead the original two scenarios should be *retained* and S3/worksheets *appended*, the doc roughly doubles in length and mixes two scenario-numbering schemes.
2. **Q-002:** Should the per-scenario worked totals sit **immediately under each blank grid** (visible while computing), or just below a divider on the same page so a participant can fold/cover them?
   - **Recommended default:** Immediately under each grid (DEC-001's "blank → worked answer" reads as inline); add a thin rule + "Answer / Đáp án" label so it's visually distinct.
   - **Why this matters:** Affects whether the same printout doubles as a blanks-only handout; if answers must be hidden, they move to a back-of-doc key (contradicting DEC-001).

## Suggested Next Step
Run `/plan dppa-worksheet-answer-docx` to turn this into a multi-phase implementation plan.
