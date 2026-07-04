---
title: "Modules 1-6 Teaching Revamp — Implementation Status"
date: "2026-07-04"
type: "phase-report"
plan: "plans/2026-07-04-dppa-modules-teaching-revamp-plan.md"
brainstorm: "research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md"
---

# Modules 1-6 Teaching Revamp — Implementation Status

This session implemented PHASE-01 through PHASE-04 of the plan in full for English,
plus the code/tooling that PHASE-06 (vi/zh-cn cloning) depends on. **PHASE-05
(validation) and the human-recording half of PHASE-02 cannot be executed
autonomously** — they require a live presenter, a real screen capture, and a
fresh human viewer. These are called out below rather than marked done.

## PHASE-01 — Numbers pack + scripted visuals — DONE

- `app/scripts/export-spine.mjs` generates `assets/teaching/spine-s1.json` directly
  from `buildFiveLineBill()` in `app/src/modules/settlement.js` — every figure used
  downstream (deck, card, worksheet) traces back to this file, never hand-typed.
  Verified against `research/2026-06-29_dppa-scenario-numbers-spec.md`: C_EVN
  8,563,196,000 / CfD +500,000,000 / C_KH 9,063,196,000 / plant total 6,296,000,000
  — exact match.
- `build_teaching_visuals.py` renders all seven visual families (24h TOU strip,
  volume funnel, 5-frame Sankey bill build + GIF, CfD seesaw, three doors, 56-scenario
  heatmap, cold-open bill-pair bars) plus the 7-variant breadcrumb strip, for all
  three languages (en/vi/zh). Run: `PYTHONPATH= py build_teaching_visuals.py --lang en|vi|zh`.
  Output in `assets/teaching/`.
- Numeric reconciliation spot-checked via a one-off Node script comparing every
  card/worksheet figure against `spine-s1.json` — all matched exactly (see commit).

**Known gap:** the M5 heatmap is illustrative (not yet wired to a real 56-scenario
sweep computation) — TASK-01-07 called for sourcing it from `build_canonical_cases.py`'s
case-sweep data, which was not located/wired in this pass. Treat the heatmap as a
placeholder visual carrying the "0 of 56" narrative until a real sweep is computed
and re-rendered.

## PHASE-02 — App teach mode — CODE DONE, RECORDINGS PENDING

- `app/src/data/teach-steps.js` + `app/src/modules/teach.js`: a `?teach=1`
  presenter step-through with six steps (one per module), each driving the
  existing scenario-tab and slider DOM controls exactly as a click/drag would —
  no new state plumbing in `main.js` beyond a two-line import + init call.
- `app/src/modules/teach.test.js`: 4 new tests (gating, banner render, next/prev
  wraparound) — all pass. Full app suite: **48/48 passing**. `npm run build`
  succeeds (254.96 kB bundle, no errors).
- **Not done (needs a human with a browser):** TASK-02-04 (live browser
  verification against a running `vite preview`) and TASK-02-05 (six recorded
  GIF/MP4 fallbacks). The deck's hidden fallback slides currently say so
  explicitly rather than embedding a fake recording. One exception: the M3
  fallback slide reuses the **already-existing** `assets/cfd-s1-en.gif` (real,
  from `build_cfd_slide.py`), since it independently carries the sign-flip point.
- **Not done:** deploying the updated app to dppa-case.web.app (no deploy
  credentials in this environment) — the code is committed and buildable;
  deploy is a manual step.

## PHASE-03 — EN deck rebuild — DONE

- `build_oct_teaching_deck.py` rebuilds from `ceba/CEBA DPPA 2026.pptx` (its
  slides are cleared, its masters/layouts/theme kept), producing
  `ceba/DPPA Presentation Oct 2026 To Teach.pptx` — 27 slides: cold open, six
  module dividers (each with a breadcrumb + hidden fallback slide), M1-M6
  content per the brainstorm's per-module visual designs, the M6 decoder +
  five-levers slides, a close slide, and a 3-slide slimmed scenario appendix.
- `audit_teaching_deck.py` checks the ≤30-word budget (three explicitly exempted
  slides: decoder, levers, M5 exercise-instructions) and scans for pre-decoder
  Decree-57 symbols. **Result: PASS, 0 violations.**
- Full speaker notes on every slide (explanation, app-moment script with exact
  expected numbers, checkpoint question, timing) — the facilitator guide's new
  run-of-show (below) is derived from these notes.

**Known gap:** no QR code image (the `qrcode` Python package is not installed in
this environment) — the close slide's notes flag this; the URL is plain text for
now. Also not done: opening the deck in actual PowerPoint to confirm GIF autoplay
and hidden-slide behavior (TASK-03-04) — needs a human with PowerPoint.

## PHASE-04 — Print artifacts + facilitator guide — DONE (untested in print)

- `lessons/0012-reference-card/reference-card.html` — double-sided A4 (side A:
  five-line bill with VI/ZH glosses for the six load-bearing terms; side B:
  Decree-57 decoder table, TOU rate matrix, three gates), following the existing
  `lessons/0011-worksheets.html` print-CSS pattern.
- `lessons/0012-reference-card/m5-worksheet.html` — one-page worksheet with S1
  volumes pre-filled, five blank line boxes, and an answer key on a second
  (print-paginated) page, all figures reconciled to `spine-s1.json`.
- `facilitator/dppa-workshop-facilitator-guide.md` — new "Modules 1-6 Teaching
  Session (~60 min, October 2026)" section appended after the existing 90-min
  workshop run-of-show: per-module timing, checkpoint questions, teach-mode step
  references, contingency plan, and a pre-session validation checklist.

**Known gap:** TASK-04-04 (physical duplex print test) not performed — needs a
printer. Do this before October.

## PHASE-05 — Validation, fixes, freeze — NOT DONE (requires a human)

Cannot be executed by an autonomous coding session:
- **TASK-05-01** (timed solo dry-run) needs a live presenter running the actual
  60-minute session.
- **TASK-05-02** (fresh-viewer M5 compute test) needs a second human who did not
  attend July — this is the direct test of the success criterion (DEC-003) and
  must not be skipped or simulated.
- Automated proxies that *were* run in place of human validation: the deck audit
  (PASS), the full app test suite (48/48 PASS), and the numeric reconciliation
  check (all figures match). These catch mechanical regressions, not
  comprehension — they are necessary, not sufficient.

**Action for the user:** schedule the solo dry-run and the fresh-viewer session
per the facilitator guide's new checklist before declaring content freeze. Only
after both pass should PHASE-06 proceed.

## PHASE-06 — vi/zh-cn cloning — DELIBERATELY NOT STARTED

Per DEC-018, cloning must happen *after* EN content freeze, and freeze is gated
on PHASE-05's human validation, which has not occurred. Producing vi/zh-cn decks
now would risk translating content that the fresh-viewer test could still change.
What's already in place to make PHASE-06 fast once freeze happens:
- `build_teaching_visuals.py --lang vi|zh` already renders localized visuals
  (captions translated, matching the existing lesson/worksheet vocabulary).
- `build_oct_teaching_deck.py --lang vi|zh` runs end-to-end today, but currently
  falls back to the English text layer (`TEXT["vi"] = TEXT["en"]` placeholder) —
  translating `TEXT` per TASK-06-01's terminology map is the remaining work,
  scoped to happen only after freeze.

## Summary of files added/changed

- `app/scripts/export-spine.mjs`, `app/scripts/js-resolve-loader.mjs`
- `assets/teaching/spine-s1.json` + ~40 PNG/GIF visuals (en/vi/zh)
- `app/src/data/teach-steps.js`, `app/src/modules/teach.js`, `app/src/modules/teach.test.js`
- `app/src/main.js` (2-line integration)
- `build_teaching_visuals.py`, `build_oct_teaching_deck.py`, `audit_teaching_deck.py`
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx`
- `lessons/0012-reference-card/reference-card.html`, `m5-worksheet.html`
- `facilitator/dppa-workshop-facilitator-guide.md` (extended)
- This report.

## What the user should do next

1. Record the six `?teach=1` demo steps as GIF/MP4 (PHASE-02 TASK-02-05) and drop
   them into `assets/teaching/fallback/`; rebuild the deck so the fallback slides
   pick them up.
2. Deploy the updated app.
3. Print-test the A4 card and worksheet on a real printer.
4. Run the solo dry-run and book a fresh-viewer session (facilitator guide
   checklist) — this is the one step that actually proves the redesign works.
5. Only after that: translate `TEXT` in `build_oct_teaching_deck.py` and run
   PHASE-06 to produce the vi/zh-cn decks and card/worksheet variants.
