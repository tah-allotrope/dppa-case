# 0002 — Scenario Training track (worked exercise deck)

**Date:** 2026-06-26
**Status:** active

## Context
After the 6-module course ([0001](0001-starting-point-and-approach.md), lessons 0001–0006
built from `ceba/CEBA DPPA 2026.pptx`), the user asked to teach the standalone
**`ceba/DPPA Presentation July 2026 Scenario Training.pptx`** (11 slides) — the interactive
exercise with two fully worked scenarios. Same cadence: one visual-first lesson per session,
deck aesthetic, verify + open, no commit unless asked.

## Key facts
- Deck was **corrected** in the consolidation work (verified live): S1 C_EVN = 8,563,196,000,
  C_KH = 9,063,196,000; slide 7 = "8.5B / 5.8B"; S2 verifies.
- The two scenarios map **1:1 to the app's Workshop presets** — S1 = Workshop 1
  (strike 1,250 / FMP 1,150 / 5,000,000 kWh), S2 = Workshop 2 (strike 1,500 / FMP 1,600 /
  8,000,000 contracted + 1,000,000 shortfall). App reproduces them penny-for-penny.
- These use the deck's **legacy** strike/FMP (not the canonical 2,000/1,427), deliberately
  showing both CfD directions (S1 factory pays; S2 developer pays).

## Progress
- ✅ Lesson 0007 — Scenario 1 (Matched): param board, 5-line waterfall, 3-party flow, CfD
  direction; corrected-bug teaching note; Workshop 1 tie-in. 3 SVGs, verified.
- ✅ Lesson 0008 — Scenario 2 (Shortfall): volume split, 5-line waterfall with NEGATIVE CfD,
  reversed 3-party flow, CfD direction, S1-vs-S2 contrast; Workshop 2 tie-in. 4 SVGs, verified
  (C_EVN 19,628,262,400 / C_KH 18,828,262,400 / −800M CfD).

## Status: SCENARIO TRACK COMPLETE (2026-06-26)
Both worked scenarios delivered (lessons 0007–0008), mapping 1:1 to app Workshop 1/2.

## Possible next sessions
- One-page cheat sheet covering both scenarios (printable reference doc).
- Mock facilitation / role-play of the interactive exercise.
- Interleaved quiz across S1 + S2 + the 6 modules.
- NOT YET COMMITTED: lessons 0007–0008 + learning-record 0002 (commit when user asks).

## Note
Related open item (not raised again by user): `ceba/DPPA Presentation July 2026 To Teach.pptx`
(35 slides, created 2026-06-26) is the trimmed teaching cut of the 6-module deck that also
embeds these two scenarios. The 6-module course was built from `CEBA DPPA 2026.pptx`; content
aligns. Offer a diff/reconcile if the user wants "To Teach" as canonical source.
