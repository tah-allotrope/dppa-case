# 0004 — DPPA Worksheets + Answer Summary (combined bilingual Word doc)

**Date:** 2026-06-29
**Status:** complete

## Context
The CEBA 2026 group workshop has two separate training assets that belong
together: the **blank compute worksheets** in
`lessons/0011-worksheets.html` (+ `-vi`/`-zh-cn`) — S1/S2/S3 + negotiation grids
participants fill by hand — and the polished bilingual **answer/scenario
summary** `lessons/DPPA_Scenario_Answer_Summary.docx`. A facilitator couldn't
hand out one clean printable that lets a participant **compute, then self-check**.
This delivery produces a single bilingual (EN | VI) Word document that pairs
each blank worksheet with its worked totals, in the exact house style of the
reference.

- Brainstorm: `research/2026-06-29_dppa-worksheet-answer-docx-brainstorm.md`
- Plan: `plans/2026-06-29-dppa-worksheet-answer-docx-plan.md`
- Numbers: `research/2026-06-29_dppa-scenario-numbers-spec.md` (source of truth)

## What shipped
- ✅ **`lessons/DPPA_Worksheets_and_Answers.docx`** (15 KB) — built by
  `build_worksheet_answer_docx.py`. Inherits the reference's A4 + 0.75in margins
  + blue banner / subhead / callout / footer styling by copy-template approach.
- ✅ **Per scenario (S1 matched · S2 shortfall · S3 excess)** — each = styled
  banner → inputs callout → **blank fillable 5-line grid** (line label EN|VI +
  formula in *Calculation* + shaded empty answer cells) → **answer totals
  table** (C_EVN / CfD / C_KH / Effective). S3 adds the **excess block** below
  (Excess volume / Spot value / Foregone CfD). Page break per scenario.
- ✅ **Negotiation block** — banner → blank 4-round proposal grid → blank
  resulting-economics table → guidance callout (worked example at strike
  1,200: `CfD = (1,200 − 1,150) × 5,000,000 = +250,000,000`; "crosses zero at
  strike = FMP"; three-gate trade-off). EN | VI.
- ✅ **3-case comparison summary** — closing table modeled on the reference's
  Scenario Comparison Summary, 9 columns × 4 rows, blue header.
- ✅ **Shared constants/legal-basis block** — k×K_pp 1.034208, service 360,
  clearing 163.30, fees 523.30, retail 2,204, Decree 57/243. Bilingual.
- ✅ **Footer** — verbatim from the reference ("Prepared for CEBA 2026
  Training … Allotrope Partners Vietnam … Decree 57 & 243"). 8pt gray.
- ✅ **Totals verified byte-for-byte vs the spec** — 8,563,196,000 /
  +500,000,000 / 9,063,196,000 (S1) · 19,628,262,400 / −800,000,000 /
  18,828,262,400 (S2) · 8,304,644,000 / +750,000,000 / 9,054,644,000 (S3).
- ✅ **VI parity** — `Giá thực hiện`, `Phụ tải`, `Sản lượng khớp`, `Mua thêm
  bán lẻ`, `Phí dịch vụ`, `Phí bù trừ`, `Hiệu dụng`, `Dòng 1 + 2 + 3 + 4`
  all present; no zh-cn leak.

## Decisions (from the plan, DEC-001…008)
Per scenario: banner → blank grid → worked totals. Bilingual EN | VI. Answers
= totals only (C_EVN / CfD / C_KH + effective). Style shell only carried over
(no IP/duck-curve/CFO narrative prose from the reference). New file (original
untouched). Build = copy reference as template, clear body, extend with
S1/S2/S3 + negotiation + comparison. Grill-Me Q-001/Q-002 defaults both
adopted (replace reference bodies with workshop S1/S2/S3; totals inline under
each grid).

## Verification
- **Structure dump:** 37 paragraphs + 15 tables; A4 + 0.75in margins preserved;
  title banner shd `1F4E79`; all expected tables (constants, inputs callouts,
  3 worksheet grids, 3 totals tables, 1 excess block, 2 negotiation tables,
  1 guidance callout, 1 comparison summary) present.
- **Number anchor:** all 9 canonical totals present byte-for-byte; 0 foreign
  numbers in the totals tables.
- **VI parity:** all key VI strings present in `word/document.xml` (UTF-8).
- **Visual QA:** **deferred to manual** — no LibreOffice/Word on this machine
  (CON-001). The generator + structural dump prove content fidelity; the
  user must open in Word to confirm colors/spacing/pagination. (Auto PDF/PNG
  render not feasible in-session per repo learnings.)

## Status: COMPLETE (2026-06-29)
All four plan phases delivered. New file lives at
`lessons/DPPA_Worksheets_and_Answers.docx`; original
`DPPA_Scenario_Answer_Summary.docx` is untouched. Generator
`build_worksheet_answer_docx.py` is committed so the doc can be rebuilt
whenever the spec changes.
