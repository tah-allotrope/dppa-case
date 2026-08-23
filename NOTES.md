# Teaching Notes & Preferences

> **Start with `CLAUDE.md`** (repo root) — it is the authoritative entry point for project rules:
> repo layout, exact build/test/deploy commands, the `PYTHONPATH= py` prefix, code style, the
> explicit-`.js`-import rule, the retirement rules, and the regeneration order. This file holds
> teaching facts and preferences; `CLAUDE.md` holds the rules for working in the repo.
>
> For *why* the teaching material is shaped the way it is — the July 2026 symbol-overload failure,
> the design rules that came out of it, the number-provenance pipeline, and what is still unproven —
> see `learning-records/0005-teaching-revamp-and-hardening-arc.md`.

## Repo layout (2026-07-25)
- The repo root now carries exactly **six** live build/verify scripts, each with a `# LIVE:`
  header comment naming what runs it and the exact regenerate command: `audit_teaching_deck.py`,
  `verify_deck_numbers.py`, `build_oct_teaching_deck.py`, `build_teaching_visuals.py`,
  `build_cfd_slide.py`, `build_worksheet_answer_docx.py`. Everything else that used to live at
  the root — 12 one-off scripts and 7 orphaned decks/screenshots from earlier consolidation
  phases — moved into `archive/` (`git mv`, not deleted; see `archive/README.md` for what each
  file was and its live equivalent, if any).
- **Regeneration order** when `app/src/modules/settlement.js`, `app/src/data/default-scenarios.js`,
  or the escalation assumptions change: `cd app && node scripts/export-spine.mjs && node
  scripts/export-sweep.mjs` → `PYTHONPATH= py build_teaching_visuals.py --lang en` →
  `PYTHONPATH= py build_oct_teaching_deck.py --lang en` → `PYTHONPATH= py audit_teaching_deck.py`
  + `PYTHONPATH= py verify_deck_numbers.py`.
- **Retirement rule:** whenever a headline figure changes (e.g. the gate-sweep pass count), add
  the superseded value to `tools/retired_figures.json`'s `retired` list in the *same commit*.
  `tools/check_retired_figures.py` scans both prose (`NOTES.md`, `RESOURCES.md`, `MISSION.md`,
  `corrections-log.md`, `facilitator/**/*.md`, `lessons/**/*.html`) and the six live generator scripts
  themselves — a build script that still hard-codes a retired figure is caught even before it
  produces a slide with the wrong number on it (this closed a real gap: `build_callouts.py`, now
  archived, still hard-coded the pre-gate-sweep placeholder value — see `archive/README.md` for
  the retired figure it hard-coded, which is deliberately not repeated here so this note itself
  doesn't trip the guard it describes).

## October readiness hardening (2026-07-11)
- Teach-mode fallback slides (the 6 hidden slides shown only if the live app fails)
  now embed real recorded MP4s instead of placeholder text. Regenerate with
  `cd app && npm run record:demos`, then rebuild the deck
  (`PYTHONPATH= py build_oct_teaching_deck.py --lang en`). See
  `plans/2026-07-10-october-readiness-hardening-plan.md` PHASE-02.
- The M5 heatmap's "N of M" figure is now computed from a real strike x volume
  gate sweep (`cd app && node scripts/export-sweep.mjs` → `assets/teaching/gate-sweep.json`),
  not a hard-coded placeholder. The grid is 10 strikes (1,100–1,550) x 7 volume
  ratios = 70 cells (extended 2026-08-23 from 8 strikes/56 cells so both the
  lender and investor thresholds sit interior to the grid, not at its edge —
  see `plans/2026-08-22-delivery-stall-recovery-plan.md` PHASE-06). Current
  computed result: **15 of 70** combinations clear all three gates
  (buyer/lender/investor) at once — per-gate: buyer 62, lender 28, investor 21.
  Re-run the sweep, then `PYTHONPATH= py build_teaching_visuals.py --lang en`
  and rebuild the deck, whenever `settlement.js` or the escalation assumptions
  change. See PHASE-03 of the 2026-07-10 plan.
  Fixed along the way: `app/src/modules/settlement.js` had an extensionless import
  (`from './profiles'`) that Vite tolerates but plain Node ESM does not — changed to
  `'./profiles.js'` so `node scripts/export-*.mjs` runs without a custom loader.
- QR code (dppa-case.web.app) now on the deck's close slide
  (`assets/teaching/qr-app-{en,vi,zh}.png`); `verify_deck_numbers.py` reconciles every
  on-slide VND figure against the spine/sweep exports and runs as a CI job
  (`deck-parity` in `.github/workflows/ci.yml`) alongside the app `quality` job.
- **Translation prep:** `assets/teaching/terminology-map.json` +
  `research/dppa-terminology-map.md` carry the EN→VI→ZH vocabulary that already
  exists in the repo (breadcrumb labels, worksheet terms); `build_oct_teaching_deck.py
  --lang vi|zh` now reads this map and refuses to build while any consumed key is
  `UNTRANSLATED` — translate the map, don't touch the build script, when that work
  starts (see `facilitator/translation-brief.md`).
- **Fresh-viewer test kit:** `facilitator/fresh-viewer-kit/` makes the one
  validation that actually proves the redesign works (DEC-003) schedulable — hand
  the folder to a volunteer who didn't attend July.
- **Human-blocked register:** every item that needs a person, not a coding session
  (date/venue confirmation, translator, Firebase creds, fresh-viewer scheduling), is
  tracked in one dated table — see the "Human-blocked register" section of
  `facilitator/october-run-plan.md`.

## How the user wants to be taught
- **Distill, don't reproduce.** The deck is too wordy; each lesson = one crisp visual
  mental model that fits in working memory and can be whiteboarded in <5 min.
- **Module by module**, in deck order (Modules 1–6 of `ceba/CEBA DPPA 2026.pptx`).
- **Teach using insights from THIS repo**, not just the slides. Ground every module in
  the working artifacts already built here:
  - **Live app** https://dppa-case.web.app — the 3 canonical cases, currency toggle,
    multi-year crossover, and (new) Workshop 1/2 presets that mirror the July deck.
  - **Settlement engine** `app/src/modules/settlement.js` — the exact code formulas:
    `evnMarket = matched × fmp × lossFactor`, `evnDppa = matched × dppaCharge`,
    `evnRetail = shortfall × retailTariff`, `developer = contractQty × (strike − fmp)`,
    plus `buildFiveLineBill` and `projectMultiYear` (crossover year logic).
  - **Default basis** `app/src/data/default-scenarios.js` — verified 2025 numbers:
    retail 2,204 · fees 360+163.3=523.3 · loss k×Kpp=1.026×1.008=1.0342 · strike 2,000 ·
    FMP ~1,427 (illustrative).
  - **Buyer guide** `reports/2026-04-07-vietnam-dppa-buyer-guide.md`.
  - **Consolidation learnings** `deck-qa/consolidation-map.md` — the single-source-of-truth
    number basis and why the deck/app must agree.
- Each lesson should tie the deck concept → the app behaviour the user can demo live.

## Visual aesthetic (MUST match the deck)
Source: theme of `ceba/CEBA DPPA 2026.pptx` (Google-Slides / Material style, 16:9).
- **Font:** Arial / Helvetica, sans-serif.
- **Background:** white `#FFFFFF`; panels `#FAFAFA` / `#EEEEEE`.
- **Ink:** `#212121`; secondary gray `#595959`; blue-gray `#78909C`.
- **Primary accent:** teal `#0097A7`.
- **Secondary accents:** amber `#FFAB40`, blue `#4285F4`, lime highlight `#EEFF41` (sparingly).
- **Lines/borders:** `#E0E0E0`.
- Clean cards, generous whitespace, Tufte-ish reading width (~760px), print-friendly.
- All generated visuals (SVG/HTML) use these tokens via `assets/course.css`.

## Group Workshop track (2026-06-29)
- Beyond the solitary lessons, there is now a **facilitated group workshop** (lessons 0009–0011 +
  `facilitator/dppa-workshop-facilitator-guide.md`): role-based negotiation (off-taker vs developer),
  hand-compute-then-verify, ~90 min, en/vi/zh-cn learner artifacts.
- **Scenario 3 = Excess / over-generation** (new): app `workshop3` preset · C_EVN 8,304,644,000 ·
  CfD +750,000,000 · C_KH 9,054,644,000. The three canonical cases are now matched (S1) / shortfall (S2)
  / excess (S3). Canonical numbers live in `research/2026-06-29_dppa-scenario-numbers-spec.md`.
- Per-scenario animated charts: `assets/cfd-s{1,2,3}-{en,vi,zh-cn}.gif/.mp4`, built by `build_cfd_slide.py`
  (now a per-scenario `SCENARIOS` dict). Regenerate with `py build_cfd_slide.py`.
- **Printable bilingual handout (Word):** `lessons/DPPA_Worksheets_and_Answers.docx` — for each
  scenario (S1/S2/S3) pairs a blank 5-line compute worksheet with its worked totals, plus a negotiation
  block (worked example: `CfD = (1,200 − 1,150) × 5,000,000 = +250,000,000`; "crosses zero at
  strike = FMP") and a 3-case comparison summary. Built by `build_worksheet_answer_docx.py` from the
  reference template (`DPPA_Scenario_Answer_Summary.docx`), inheriting its blue banner / subhead /
  callout / footer styling. Regenerate with `py build_worksheet_answer_docx.py`.

## Format preferences (from Lesson 1 feedback, 2026-06-26)
- **More visuals.** Lead with diagrams/SVG, not prose. Aim for ≥2–3 visuals per lesson
  (e.g. a flow/money-map, a worked-number figure, a comparison). Keep text to captions and
  one short mental-model line per visual.
- **Pace: one module per session.** Deliver a single module, let the user engage, then build
  the next on their cue. Do NOT batch-generate the remaining modules.

## User profile (for ZPD calibration)
- Domain-adjacent professional (Allotrope clean-energy advisory) — knows solar/wind &
  project development. NOT a beginner. Pitch lessons at "competent practitioner who needs
  the DPPA-specific settlement mechanics to stick," not intro energy concepts.
- Confirm starting level explicitly if a lesson assumes too much/little.
