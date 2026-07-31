---
title: "DPPA Modules 1–6 Teaching Revamp (October 2026 Session)"
date: "2026-07-04"
status: "complete — bulk-corrected 2026-07-31 per directive: plan predates 2026-07-20 and is presumed fully implemented (NOT individually verified against git/code evidence)"
request: "dppa-modules-teaching-revamp — rebuild the teaching/delivery of Modules 1–6 for DPPA calculation as a visual-first deck + live-app hybrid for the October 2026 session, fixing the July symbol-overload failure"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md"
  - "research/2026-06-29_dppa-scenario-numbers-spec.md"
---

# Plan: DPPA Modules 1–6 Teaching Revamp (October 2026 Session)

## Objective

Rebuild the DPPA teaching materials for the October 2026 CEBA session as a deck + live-app hybrid: a new trilingual (en/vi/zh-cn) visual-first deck built from the 44-slide master, a presenter step-through "teach mode" in the app, a slimmed M5 hand-compute worksheet, and a double-sided A4 reference card — so that participants can hand-compute a monthly DPPA settlement by end of Module 5. This fixes the July 2026 failure where symbol overload in Module 2 (slides 6–7) lost the audience for the rest of the session.

## Context Snapshot

- **Current state:** `ceba/DPPA Presentation July 2026 To Teach.pptx` (35 slides, ~100–165 words/slide, ~20+ Decree-57 symbols, formula-first sequencing) confused the July audience. The repo already holds the proven distilled format (lessons/0001–0006 HTML lessons), verified S1/S2/S3 numbers (`app/src/data/default-scenarios.js`, settlement engine `app/src/modules/settlement.js`), animated CfD charts (`assets/cfd-s{1,2,3}-{en,vi,zh-cn}.gif/.mp4`), scripted-render tooling (`build_cfd_slide.py`), worksheets (`lessons/0011-*`), a facilitator guide, and a canonical glossary (`reference/dppa-glossary.html`).
- **Desired state:** New deck `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (+ `-vi` and `-zh-cn` clones) rebuilt from `ceba/CEBA DPPA 2026.pptx`: ≤30 words/slide, plain-language-first (Decree-57 symbols deferred to an M6 "decoder" slide), one signature visual per module (24h TOU strip, volume funnel, Sankey bill build, CfD seesaw, three doors, gate heatmap), one scripted app moment per module driven by an app `?teach=1` presenter step-through, hidden-slide GIF fallbacks, full canonical speaker notes, a 3-slide scenario appendix, a bill-shock cold open and callback close, plus a per-seat A4 reference card and a one-page M5 worksheet with pre-filled volumes. Validated by a timed dry-run and a fresh-viewer test before content freeze and translation cloning.
- **Key repo surfaces:** `ceba/CEBA DPPA 2026.pptx` (rebuild source), `app/src/modules/settlement.js` + `app/src/data/default-scenarios.js` (numeric source of truth), `app/src/modules/ui.js` / `chart.js` / `flow-diagram.js` (teach-mode integration points), `build_cfd_slide.py` (render-pattern to extend), `assets/` (existing animations + new renders), `lessons/0011-worksheets*` (worksheet basis), `facilitator/dppa-workshop-facilitator-guide.md` (run-of-show), `reference/dppa-glossary.html` (decoder/card vocabulary), `verify_deck_app_parity.py` and `inspect_pptx.py` (verification tooling to reuse).
- **Out of scope:** Redesigning the 90-min workshop track, scenario lessons 0007–0009, or the full worksheets; changing the settlement engine or scenario numbers; a participant-facing app tour; editing the 44-slide master or the July deck; new translation vocabulary.

## Research Inputs

- `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` — the deep brainstorm that fixed all 32 design decisions (DEC-001…DEC-032): hybrid delivery, "one factory, one month" S1 spine, plain-words-first symbol strategy, per-module visual designs, ≤30-word budget, teach mode shape, three-deck language plan, validation plan. This plan executes those decisions; none are re-litigated here.
- `research/2026-06-29_dppa-scenario-numbers-spec.md` — canonical S1/S2/S3 numbers; every figure rendered into the new visuals and worksheet must reconcile to this spec and to `settlement.js` output.

## Assumptions and Constraints

- **ASM-001:** `settlement.js` + `default-scenarios.js` are the single numeric source of truth; no slide/card/worksheet figure is hand-typed without reconciling against them (extend `verify_deck_app_parity.py` where practical).
- **ASM-002:** Existing vi/zh-cn terminology in lessons/worksheets is approved vocabulary and is reused verbatim for cloned decks and cards.
- **ASM-003:** The 44-slide master's layouts/branding are current and approved for October (no CEBA re-branding pending).
- **ASM-004:** GIFs autoplay in PowerPoint slideshow mode; MP4 embeds need a play trigger — prefer GIF for in-slide animation, MP4 acceptable for hidden fallback slides.
- **CON-001:** 60-minute session including the 10-min M5 hand-compute (~8 min/module + buffer).
- **CON-002:** ≤30 words per content slide; ≤5 distinct symbols on-slide before the M6 decoder.
- **CON-003:** Venue connectivity cannot be assumed — every app moment must work from a local build (`vite preview`) and have a recorded fallback.
- **CON-004:** Content freeze (end of PHASE-05) gates vi/zh-cn cloning; no EN content edits after freeze without re-cloning.
- **DEC-*:** All 32 brainstorm decisions apply verbatim; see the brainstorm file. The most load-bearing: DEC-004 (S1 "one factory, one month" spine), DEC-005 (symbols deferred to M6), DEC-006 (Sankey bill build), DEC-020 (rebuild from master), DEC-030 (presenter step-through teach mode), DEC-031 (dry-run + fresh-viewer validation).

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Numbers pack + scripted visual assets | None | `build_teaching_visuals.py`, PNG/GIF renders in `assets/teaching/`, reconciled numbers JSON |
| PHASE-02 | App presenter teach mode + demo recordings | PHASE-01 (annotation numbers) | `?teach=1` step-through in `app/`, six fallback GIF/MP4 recordings |
| PHASE-03 | EN deck rebuild from master | PHASE-01, PHASE-02 | `ceba/DPPA Presentation Oct 2026 To Teach.pptx` with speaker notes, hidden fallbacks, audit script |
| PHASE-04 | Print artifacts + facilitator run-of-show | PHASE-01 (visuals), PHASE-03 (notes) | A4 reference card (PDF), one-page M5 worksheet + answer key, updated facilitator guide |
| PHASE-05 | Validation, fixes, content freeze | PHASE-03, PHASE-04 | Timed dry-run + fresh-viewer results, fix list applied, frozen EN deck |
| PHASE-06 | vi/zh-cn cloning | PHASE-05 (freeze) | `-vi` / `-zh-cn` decks, localized visuals, translated A4 cards and worksheets |

## Detailed Phases

### PHASE-01 - Numbers Pack and Scripted Visual Assets

**Goal**
Produce every bespoke visual as a reproducible scripted render, with all figures generated from the settlement engine's S1 output — never hand-typed.

**Tasks**
- [x] TASK-01-01: Extract the canonical S1 "spine pack" — one JSON (e.g. `assets/teaching/spine-s1.json`) holding the spine factory's monthly volumes, the five bill-line amounts, BAU total, DPPA total, and per-kWh inputs, generated by a small Node script that imports `app/src/modules/settlement.js` and `app/src/data/default-scenarios.js`. All figures rounded per DEC-007 (VND millions, ≤3 sig figs) with exact values retained alongside.
- [x] TASK-01-02: Create `build_teaching_visuals.py` (matplotlib, extending the `build_cfd_slide.py` style/palette to match `assets/course.css` teal aesthetic) reading `spine-s1.json`; parameterize language (en/vi/zh-cn) for later cloning.
- [x] TASK-01-03: Render M1 visual — 24h TOU price strip (colored bands, factory's voltage tier only) with the S1 load curve overlaid (PNG).
- [x] TASK-01-04: Render M2 visuals — (a) water/pipe volume funnel (generation → loss leak → load gate → contract gate) as PNG; (b) Sankey/money-flow bill build as a staged sequence (5 PNG frames, one per bill line, plus an assembled-total frame; also emit an animated GIF of the build).
- [x] TASK-01-05: Render M3 visual — CfD seesaw (FMP above/below strike → who pays whom) PNG; reuse existing `assets/cfd-s1-en.gif` for the animated 24h chart (no re-render).
- [x] TASK-01-06: Render M4 visual — three doors/gates (buyer / lender ≥1.2× / investor ≥12–15%) PNG, thresholds only, no formulas.
- [x] TASK-01-07: Render M5 visual — 56-scenario gate-sweep heatmap ("empty window") PNG, sourced from the existing case-sweep data used in `build_canonical_cases.py` / M5 lesson.
- [x] TASK-01-08: Render shared chrome — cold-open bill-pair visual (today vs with-DPPA, totals only), 6-icon module breadcrumb strip (one full strip + six "you are here" variants), and M6 five-lever arrow icons.
- [x] TASK-01-09: Reconciliation check — script asserts every number appearing in rendered visuals matches `settlement.js` output within rounding rules; wire into or alongside `verify_deck_app_parity.py`.

**Files / Surfaces**
- `assets/teaching/` (new) — all rendered PNG/GIF assets + `spine-s1.json`
- `build_teaching_visuals.py` (new) — render script
- `app/src/modules/settlement.js`, `app/src/data/default-scenarios.js` — imported read-only as numeric source
- `build_cfd_slide.py`, `assets/course.css` — style reference

**Dependencies**
- None

**Exit Criteria**
- [ ] All visuals render from one command (`python build_teaching_visuals.py --lang en`) and re-render deterministically.
- [ ] Reconciliation script passes: zero hand-typed figures.
- [ ] Visual style matches the existing cfd-s* chart aesthetic (spot check side by side).

**Phase Risks**
- **RISK-01-01:** Matplotlib Sankey support is weak — if `matplotlib.sankey` fights the design, fall back to hand-drawn flows with `FancyArrowPatch` (the existing `flow-diagram.js` layout is the visual reference); do not switch tools.
- **RISK-01-02:** Importing ESM `settlement.js` from Node for the spine pack may need a small wrapper; if the app modules aren't cleanly importable, add a tiny `app/scripts/export-spine.mjs` runner rather than duplicating formulas in Python.

### PHASE-02 - App Presenter Teach Mode and Demo Recordings

**Goal**
Add a presenter-facing `?teach=1` step-through to the app so each of the six scripted demos loads deterministically, then record fallback animations of each.

**Tasks**
- [x] TASK-02-01: Define the six demo steps as data (e.g. `app/src/data/teach-steps.js`): per step — module, scenario preset to load, view/chart to show, initial slider values, one-line annotation banner text, and the "expected number" the presenter calls out. Content comes from the brainstorm's per-module app moments (M1 TOU/load view; M2 volume/bill view; M3 strike-slider CfD flip at FMP crossing; M4 gate readouts; M5 S1 settlement verify; M6 lever sensitivity).
- [x] TASK-02-02: Implement teach mode in `app/src/modules/ui.js` (or a new `teach.js` module): activated by `?teach=1`; arrow keys / on-screen prev-next step through the steps; each step applies its state and shows the annotation banner; sliders remain live within a step; step index shown ("Demo 3/6").
- [x] TASK-02-03: Unit-test step-state application (each step produces the intended scenario/slider state) following the existing `*.test.js` pattern; run the app test suite.
- [ ] TASK-02-04: Verify teach mode end-to-end in a browser against a local `vite preview` build; confirm each step's on-screen numbers match `spine-s1.json` / scenario spec.
- [ ] TASK-02-05: Record the six demos as screen captures; export GIF (preferred) and MP4 per demo into `assets/teaching/fallback/` with names like `demo-m3-strike-slider.gif`.
- [ ] TASK-02-06: Deploy the updated app to dppa-case.web.app and document the local-serve fallback command in the facilitator guide (PHASE-04 picks this up).

**Files / Surfaces**
- `app/src/data/teach-steps.js` (new) — demo step definitions
- `app/src/modules/ui.js` / new `app/src/modules/teach.js` — mode wiring
- `app/src/modules/chart.js`, `flow-diagram.js` — inspected for view-switching hooks
- `assets/teaching/fallback/` (new) — recorded demo GIF/MP4s

**Dependencies**
- PHASE-01 (annotation/expected numbers come from the spine pack)

**Exit Criteria**
- [ ] `?teach=1` steps through all six demos with deterministic state; normal app behavior unchanged without the flag.
- [ ] App test suite passes including new teach-step tests.
- [ ] Six fallback recordings exist and visibly show the key motion (especially the M3 sign flip).

**Phase Risks**
- **RISK-02-01:** Teach mode leaking into normal UX — gate every teach-mode DOM element and key handler behind the flag; exit criterion explicitly checks the no-flag path.
- **RISK-02-02:** Deployed app drift before October — pin the demo to work against both prod and local build; the dry-run (PHASE-05) re-verifies after any later app deploys.

### PHASE-03 - EN Deck Rebuild from the 44-Slide Master

**Goal**
Build `ceba/DPPA Presentation Oct 2026 To Teach.pptx` from the master's layouts: visual-first module slides, canonical speaker notes, checkpoints, hidden fallbacks, slimmed appendix.

**Tasks**
- [x] TASK-03-01: Write the slide-by-slide content spec first (a markdown table in the plan's working notes or `reports/`): for each slide — headline (≤30 words total with caption), visual asset path, speaker notes (explanation + app-moment script + checkpoint Q&A + timing), layout from the master. Structure: cold open (bill pair) → 6× [divider with breadcrumb + checkpoint question | 3–4 content slides | hidden fallback slide] → M6 decoder + five levers → close (callback + workshop invite + QR) → 3-slide scenario appendix (existing cfd-s1/s2/s3 GIFs + one-line takeaways).
- [x] TASK-03-02: Build the deck programmatically with python-pptx from `ceba/CEBA DPPA 2026.pptx` layouts (new script `build_oct_teaching_deck.py`, following the `build_2026_from_ref.py` pattern): copy masters/branding, place PNG/GIF assets from `assets/teaching/`, write titles/captions and full speaker notes, insert fallback GIFs on hidden slides, add QR code (generate via `qrcode` lib) linking to app + lessons.
- [x] TASK-03-03: Write `audit_teaching_deck.py`: per-slide word count (fail >30 on content slides), symbol scan (fail if Decree-57 tokens like `Q_Khc`, `K_pp`, `C_dppa` appear before the M6 decoder slide), and figure reconciliation against `spine-s1.json` (reuse `inspect_pptx.py` extraction).
- [ ] TASK-03-04: Run the audit, fix violations, and manually review the deck in PowerPoint (GIF playback in slideshow mode, hidden-slide behavior, layout fidelity on the projector aspect ratio).
- [ ] TASK-03-05: Timestamped backup of the generated deck following the repo's `*.backup-YYYY-MM-DD.pptx` convention once stable.

**Files / Surfaces**
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (new) — the deliverable
- `build_oct_teaching_deck.py`, `audit_teaching_deck.py` (new) — build + audit tooling
- `ceba/CEBA DPPA 2026.pptx` — read-only layout/branding source
- `assets/teaching/**` — inserted assets
- `inspect_pptx.py` — reused for audit extraction

**Dependencies**
- PHASE-01 (visual assets), PHASE-02 (fallback recordings, app-moment scripts for notes)

**Exit Criteria**
- [ ] `audit_teaching_deck.py` passes: word budget, symbol deferral, figure reconciliation.
- [ ] Deck opens clean in PowerPoint; GIFs autoplay in slideshow; hidden fallback slides stay hidden in normal flow.
- [ ] Every slide has complete speaker notes (spot-check: a stranger could deliver M3 from the notes alone).

**Phase Risks**
- **RISK-03-01:** python-pptx cannot clone master layouts across files cleanly — mitigate by starting the build FROM a copy of the master (open master, delete its slides, append new ones) instead of copying layouts into a blank deck; `build_2026_from_ref.py` should show the working pattern.
- **RISK-03-02:** ≤30 words proves too tight for a specific slide (e.g. the decoder) — the decoder and appendix slides may exempt themselves in the audit config, but exemptions must be explicit and listed, not silent.

### PHASE-04 - Print Artifacts and Facilitator Run-of-Show

**Goal**
Produce the per-seat A4 reference card, the one-page M5 worksheet with pre-filled volumes + answer key, and regenerate the facilitator guide's Modules 1–6 run-of-show from the deck's speaker notes.

**Tasks**
- [x] TASK-04-01: Build the double-sided A4 reference card (HTML + `course.css` print styles → PDF, matching the `lessons/0011` worksheet pipeline): side A = five-line bill Sankey with plain-language labels + VI/ZH glosses for the ~6 load-bearing terms; side B = Decree-57 symbol decoder + TOU rate matrix (from the old slide 3 content / glossary) + three gate thresholds. Output `lessons/0012-reference-card/` (en, with vi/zh-cn stubs for PHASE-06).
- [x] TASK-04-02: Build the one-page M5 worksheet: S1 volumes pre-printed, five blank bill-line boxes in VND millions, total + BAU comparison row; plus a matching answer key generated from `spine-s1.json`. Derive from `lessons/0011-worksheets` markup; output alongside the card.
- [x] TASK-04-03: Regenerate `facilitator/dppa-workshop-facilitator-guide.md`: add a "Modules 1–6 (60 min) run-of-show" section derived from the deck speaker notes — per module: timing, checkpoint question + expected answer, app teach-mode step number, fallback slide location; plus setup checklist (local `vite preview` command, teach-mode URL, print counts).
- [ ] TASK-04-04: Print-test both artifacts (A4 duplex, margins, legibility of the Sankey at print size).

**Files / Surfaces**
- `lessons/0012-reference-card/` (new) — card + worksheet HTML/PDF
- `facilitator/dppa-workshop-facilitator-guide.md` — extended with the new run-of-show
- `lessons/0011-worksheets*`, `reference/dppa-glossary.html` — content sources
- `assets/teaching/spine-s1.json` — answer-key source

**Dependencies**
- PHASE-01 (Sankey render, spine pack), PHASE-03 (speaker notes as run-of-show source)

**Exit Criteria**
- [ ] Card and worksheet print correctly duplex on A4; every worksheet answer matches `settlement.js` output.
- [ ] Facilitator guide run-of-show is complete enough that the timed dry-run (PHASE-05) can be executed from it alone.

**Phase Risks**
- **RISK-04-01:** The Sankey rendered for slides may be illegible at A4 print size — render a print-variant (thicker strokes, larger labels) from the same script rather than reusing the slide PNG blindly.

### PHASE-05 - Validation, Fixes, and Content Freeze

**Goal**
Prove the redesign fixes the confusion: timed solo dry-run plus a fresh-viewer test against the success criterion, apply fixes, freeze EN content.

**Tasks**
- [ ] TASK-05-01: Full timed solo dry-run from the facilitator run-of-show: 60-min fit (per-module timings logged), all six app-moment switches, one deliberate fallback drill (kill the app, unhide the fallback slide mid-flow). Record it for self-review.
- [ ] TASK-05-02: Fresh-viewer session: a colleague who did not attend July sits the full 60 minutes; at the M5 pause they attempt the worksheet unaided. Pass = they compute all five lines and the total within the 10 minutes without symbol re-explanation. Log where they hesitate.
- [ ] TASK-05-03: Triage findings into must-fix (blocks comprehension/timing) vs nice-to-have; apply must-fixes across deck/visuals/worksheet; re-run `audit_teaching_deck.py` and the reconciliation checks after edits.
- [ ] TASK-05-04: Declare content freeze: tag the frozen state in git (e.g. `oct2026-en-freeze`), create the timestamped deck backup, and record the freeze date + dry-run results in a short report under `reports/`.

**Files / Surfaces**
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx`, `assets/teaching/**`, `lessons/0012-reference-card/**` — fixed as needed
- `reports/` — dry-run/fresh-viewer findings report

**Dependencies**
- PHASE-03, PHASE-04

**Exit Criteria**
- [ ] Dry-run fits 60 min with ≥3 min buffer; fallback drill succeeds.
- [ ] Fresh viewer passes the M5 compute (the success criterion, DEC-003).
- [ ] EN content frozen and tagged; findings report saved.

**Phase Risks**
- **RISK-05-01:** Fresh viewer fails the M5 compute — treat as a design signal, not a scheduling slip: identify the specific line/concept that failed, fix that module's visual or worksheet scaffolding, and re-test with a second fresh viewer before freezing. Budget calendar time for one full retest cycle (this is why the freeze target is mid/late September, not the session week).

### PHASE-06 - Vietnamese and Chinese Deck Cloning

**Goal**
Clone the frozen EN deliverables to vi and zh-cn using the established terminology, with localized visual text layers.

**Tasks**
- [ ] TASK-06-01: Build a terminology map (en → vi → zh-cn) for all deck strings, sourced from the existing lessons/worksheets vi/zh-cn variants and `reference/dppa-glossary.html`; store as a translations file consumed by the build scripts (mirroring how `build_cfd_slide.py` produced cfd-s*-vi/zh-cn).
- [x] TASK-06-02: Re-render visuals per language: `python build_teaching_visuals.py --lang vi|zh-cn` (chart labels, funnel/seesaw/door captions); reuse existing `assets/cfd-s*-vi/zh-cn.gif` for the animated charts and appendix.
- [ ] TASK-06-03: Generate `ceba/DPPA Presentation Oct 2026 To Teach vi.pptx` and `... zh-cn.pptx` via `build_oct_teaching_deck.py --lang ...` (titles, captions, speaker notes, localized assets); run the audit script per deck (word budget interpreted per language: caption brevity, not literal 30-word English count — set per-language limits in audit config).
- [ ] TASK-06-04: Translate the A4 card and M5 worksheet (vi, zh-cn) reusing the trilingual worksheet pipeline; regenerate answer keys (numbers unchanged).
- [ ] TASK-06-05: Native-reader review pass (vi at minimum) on decks + print artifacts; fix and finalize.

**Files / Surfaces**
- `ceba/DPPA Presentation Oct 2026 To Teach vi.pptx`, `... zh-cn.pptx` (new)
- `assets/teaching/` — vi/zh-cn renders
- `lessons/0012-reference-card/` — vi/zh-cn card + worksheet variants
- Existing vi/zh-cn lessons/worksheets — terminology source (read-only)

**Dependencies**
- PHASE-05 content freeze

**Exit Criteria**
- [ ] Both cloned decks pass their audits and open clean in PowerPoint.
- [ ] Terminology matches the existing vi/zh-cn lesson vocabulary (spot-check against lessons 0007–0011 variants).
- [ ] Native-reader review complete for vi (zh-cn if a reviewer is available).

**Phase Risks**
- **RISK-06-01:** CJK/Vietnamese fonts in matplotlib renders and pptx text (diacritics, CJK glyphs) — the cfd-s*-vi/zh-cn builds already solved font selection; lift the exact font config from `build_cfd_slide.py` before rendering anything.

## Verification Strategy

- **TEST-001:** `python audit_teaching_deck.py` — per-slide word budget, pre-decoder symbol scan, figure reconciliation vs `spine-s1.json` (PHASE-03/05/06 gates).
- **TEST-002:** App test suite (existing `*.test.js` + new teach-step tests) passes; `?teach=1` off-path leaves normal UX unchanged (PHASE-02).
- **TEST-003:** Numbers reconciliation — every rendered/printed figure traced to `settlement.js` output via `spine-s1.json`; extend/reuse `verify_deck_app_parity.py` (PHASE-01/04).
- **MANUAL-001:** Timed solo dry-run incl. fallback drill; 60-min fit with buffer (PHASE-05).
- **MANUAL-002:** Fresh-viewer M5 compute test — the direct measurement of the success criterion (PHASE-05).
- **MANUAL-003:** PowerPoint playback checks per deck: GIF autoplay in slideshow, hidden slides hidden, projector aspect ratio (PHASE-03/06).
- **OBS-001:** At the October session itself: track the divider checkpoint questions (rough correct-answer rate) and M5 worksheet completion as the real-world confirmation; fold into a post-session report.

## Risks and Alternatives

- **RISK-001:** Scope is wide for one presenter-author (deck + app mode + visuals + print + translations). Mitigation: the phase order front-loads everything the dry-run needs (P1–P4) and gates translations behind the freeze so a slip degrades gracefully (worst case: EN deck + existing trilingual handouts, which is still a large improvement over July).
- **RISK-002:** Rebuild-from-master via python-pptx is the least-proven technical step. Mitigation: TASK-03-01's content spec is tool-agnostic — if scripted building stalls, the deck can be assembled by hand in PowerPoint from the same spec and assets, and only the audit script (which reads any pptx) is kept.
- **ALT-001:** Editing the July deck in place — rejected in the brainstorm (DEC-020); the July deck stays as the A/B reference of what confused the room.
- **ALT-002:** Deep-link app presets instead of teach mode — rejected (DEC-030); step-through eliminates live-fumble risk, worth the build cost.
- **ALT-003:** Fewer, denser slides — rejected (DEC-009); density drops via one-idea-per-slide at roughly constant slide count.

## Grill Me

1. **Q-001:** What is the exact October session date and venue?
   - **Recommended default:** Plan against October 1: PHASE-01–04 done by early September, PHASE-05 dry-run + fresh-viewer by mid-September, freeze ~Sept 15, PHASE-06 + printing by late September.
   - **Why this matters:** Sets the freeze date that gates translation and print production, and how much retest slack PHASE-05 has.
   - **If answered differently:** Later date relaxes PHASE-05/06 scheduling; an early-October date with travel means printing must complete in September.
2. **Q-002:** Who is the fresh-viewer for TASK-05-02 (someone who did not attend July)?
   - **Recommended default:** An Allotrope colleague or friendly practitioner; book them once the solo dry-run passes.
   - **Why this matters:** MANUAL-002 is the only pre-session test of the success criterion; a domain-adjacent viewer (per the ZPD note) is more representative than a layperson.
   - **If answered differently:** If nobody suitable is available, substitute the worksheet cold-pilot (send card + worksheet to 2–3 practitioners remotely) as a weaker proxy.
3. **Q-003:** Spine factory persona name for slides/worksheet/teach-mode annotations?
   - **Recommended default:** A neutral fictional Vietnamese factory consistent with the S1 load profile (e.g. a garment or electronics plant), named once in TASK-03-01's content spec and reused everywhere.
   - **Why this matters:** The "one factory, one month" spine needs one stable protagonist across deck, worksheet, card, and app annotations; renaming late touches every artifact.
   - **If answered differently:** A real (anonymized) client profile could replace the fiction — then load numbers must still be S1's, only the story changes.

## Suggested Next Step

Answer the three Grill Me questions (or accept the defaults), then begin PHASE-01 with TASK-01-01 (spine pack extraction) — it unblocks everything else.
