---
title: "DPPA Scenario Group-Learning Workshop Module"
date: "2026-06-29"
status: "complete — bulk-corrected 2026-07-31 per directive: plan predates 2026-07-20 and is presumed fully implemented (NOT individually verified against git/code evidence)"
request: "Based on brainstorm, build a multi-phase plan for a group-learning teaching module from the DPPA scenario-training slides — interactive group-learn experience with lively charts and visuals, plus group tasks that walk participants through all the calculations, numbers, and details."
plan_type: "multi-phase"
research_inputs:
  - "research/2026-06-29_dppa-scenario-group-workshop-brainstorm.md"
---

# Plan: DPPA Scenario Group-Learning Workshop Module

## Objective
Turn the existing solitary DPPA scenario lessons (S1 matched, S2 shortfall — plus a Scenario 3 that today exists only in the July 2026 deck) into a **live, facilitated ~90-minute group workshop** for ~10–25 practitioners in sub-groups of 3–5. Sub-groups roleplay off-taker (factory) vs developer, **hand-compute the full five-line bill + signed CfD by hand, then verify against the live app**, then **negotiate a strike price** and watch the CfD flip — reinforced with new per-scenario animated charts and bill-waterfall figures, shipped with a full facilitator kit, in English, Vietnamese, and Chinese (zh-cn).

## Context Snapshot
- **Current state:**
  - 8 English HTML lessons in `lessons/` (`0001`–`0008`); the scenario exercises `0007-scenario-1-matched.html` and `0008-scenario-2-shortfall.html` are worked examples with embedded SVG figures, a 5-line bill table, and `quiz.js` retrieval widgets. No Scenario 3 lesson exists.
  - Live app (`app/`, vanilla JS + Vite + Chart.js, Firebase-hosted at https://dppa-case.web.app). `app/src/data/default-scenarios.js` defines `workshop1`/`workshop2` presets matching S1/S2 penny-for-penny; `app/src/modules/settlement.js` computes the 5-line bill, signed CfD, and 20-year projection.
  - `build_cfd_slide.py` (matplotlib + Pillow + python-pptx) renders one consolidated 24h CfD chart as PNG + animated GIF in en/vi/zh; MP4 variants were produced by GIF→ffmpeg conversion (commit `2f51d1a`). Profiles (`load`, `solar`, `matched`, `fmp`, `STRIKE`) are hardcoded module-level globals; `TEXTS` holds the en/vi/zh language dict; `generate_gif(lang, filename)` renders one language.
  - `reference/dppa-glossary.html` (16 symbols, five-line formula, sign convention) and a verified 2025 number basis (retail 2,204 · fees 360+163.3=523.3 · loss 1.0342).
  - `ceba/DPPA Presentation July 2026 Scenario Training.pptx` and `ceba/DPPA Presentation July 2026 To Teach.pptx` hold the scenario source content, including Scenario 3.
  - **No group-task / facilitation / collaborative layer exists.** This is the greenfield.
- **Desired state:** a new facilitated workshop module — a `workshop3` app preset, three sets of new per-scenario visuals (animated CfD GIF/MP4 + bill-waterfall SVG) in en/vi/zh, a new Scenario 3 lesson, learner-facing group-activity guide(s) + printable worksheets (localized in 3 languages), and an English facilitator kit (run-of-show, script, answer keys, debrief). All numbers reconcile to `settlement.js`.
- **Key repo surfaces:** `lessons/0007`,`0008` (baselines + new `0009`/`0010`/`0011` activity files), `app/src/data/default-scenarios.js`, `app/src/modules/settlement.js`, `app/test/` (Vitest), `build_cfd_slide.py`, `assets/` (new GIF/MP4/SVG outputs + `course.css`/`quiz.js`), `reference/dppa-glossary.html`, `ceba/*Scenario Training.pptx`, `learning-records/` (status), `NOTES.md`/`MISSION.md`.
- **Out of scope:** any LMS/auth/accounts/analytics; real-time shared/multiplayer state; rewriting the 8 existing lessons or the `settlement.js` math; a bespoke in-app "Workshop mode" UI (the existing strike slider already delivers the live CfD flip); re-authoring the source `.pptx` decks (Scenario 3 is read, not rewritten).

## Research Inputs
- `research/2026-06-29_dppa-scenario-group-workshop-brainstorm.md` — Source of all 14 decisions (DEC-001…014). Fixes: live facilitated workshop (not self-paced); role-based negotiation format; hand-compute-then-verify; full math depth (5 lines + CfD + C_EVN↔C_KH reconciliation + multi-year crossover); Scenarios 1–3; new per-scenario visuals (animated CfD + bill waterfall); full facilitator kit; ~90 min; trilingual launch; Scenario 3 extracted from the deck. Its two Open Questions become Grill Me Q-001 (S3 numbers) and Q-002 (localization extent). Its ASM-001 (negotiation uses the existing strike slider — no new app mode) directly removes a whole phase of app work.

## Assumptions and Constraints
- **ASM-001:** `app/src/modules/settlement.js` (`buildFiveLineBill`, `calculateSettlement`, `projectMultiYear`) is the canonical answer-key engine; all worksheet answer keys and visual numbers are derived from it (and the workshop presets), never recomputed independently.
- **ASM-002:** The "watch the CfD flip live" moment uses the app's existing strike-price slider, which already recomputes the signed CfD. No new in-app workshop UI is built (per brainstorm ASM-001).
- **ASM-003:** Per-scenario MP4s are produced by converting the rendered GIFs with ffmpeg (H.264, `yuv420p`, `+faststart`, 30 fps) as established in commit `2f51d1a`.
- **ASM-004:** Scenario 1/2 canonical numbers are already fixed by the lessons and presets — S1: Q=5,000,000 kWh, strike 1,250, FMP 1,150, line4=0, C_EVN 8,563,196,000, CfD +500,000,000, C_KH 9,063,196,000; S2: contracted 8,000,000 / total 9,000,000 (1M shortfall), strike 1,500, FMP 1,600, C_EVN 19,628,262,400, CfD negative, C_KH 18,828,262,400.
- **CON-001:** Visual + page aesthetic is locked to the Material/deck palette (teal `#0097A7`, amber `#FFAB40`, ink `#212121`) via `assets/course.css` and the `build_cfd_slide.py` palette constants.
- **CON-002:** No public NSMO/ERAV FMP time series exists; all curves remain illustrative hardcoded profiles (per `RESOURCES.md`).
- **DEC-001:** Artifacts are static HTML in `lessons/` reusing `course.css` + `quiz.js`; no new web framework, no build step for the lessons themselves.
- **DEC-002:** Trilingual learner-facing artifacts follow the existing `-vi` / `-zh-cn` filename suffix convention used for the chart assets.

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Extract Scenario 3 + lock a single canonical number spec for S1–S3 | None | `research/` scenario-data spec (S1–S3: volumes, strike, FMP, all 5 lines, CfD, C_EVN/C_KH, crossover) |
| PHASE-02 | Add the Scenario 3 (`workshop3`) preset to the app and verify against the spec | PHASE-01 | Updated `default-scenarios.js` + passing Vitest |
| PHASE-03 | Render new per-scenario visuals (animated CfD GIF/MP4 + bill-waterfall SVG) in en/vi/zh | PHASE-01 | New assets in `assets/` for S1/S2/S3 × 3 languages |
| PHASE-04 | Build the Scenario 3 lesson + group-activity guide(s) + printable worksheets (trilingual) | PHASE-01, PHASE-02, PHASE-03 | New `lessons/0009`–`0011*` HTML (en/vi/zh) with print CSS |
| PHASE-05 | Author the English facilitator kit (run-of-show, script, answer keys, debrief) | PHASE-01, PHASE-04 | Facilitator section/file + answer keys |
| PHASE-06 | Verify end to end, record status, (optionally) deploy | PHASE-02…05 | Preview proof, `learning-records/0003`, updated `NOTES.md` |

## Detailed Phases

### PHASE-01 - Scenario extraction & canonical number spec
**Goal**
Produce one authoritative numbers document covering Scenarios 1, 2, and 3 so that the app preset, visuals, lessons, worksheets, and answer keys all derive from the same source and cannot drift.

**Tasks**
- [ ] TASK-01-01: Extract Scenario 3 inputs from `ceba/DPPA Presentation July 2026 Scenario Training.pptx` (fallback `…To Teach.pptx`): contracted/total monthly volumes, strike, FMP, and any stated C_EVN/C_KH. Use python-pptx (already a repo dependency) or unzip the pptx XML.
- [ ] TASK-01-02: Reconcile S3 against `settlement.js` by computing `buildFiveLineBill` for those inputs; confirm the five lines, signed CfD, C_EVN, and C_KH. If the deck's S3 does not map to the engine cleanly, fall back to the `higherGen` over-generation case (see Grill Me Q-001).
- [ ] TASK-01-03: Capture S1 and S2 canonical numbers (ASM-004) alongside S3 in a single spec table, including multi-year crossover year from `projectMultiYear` for each.
- [ ] TASK-01-04: Write the spec to `research/2026-06-29_dppa-scenario-numbers-spec.md` (per-line formula + value, CfD sign + magnitude, C_EVN, C_KH, effective VND/kWh, crossover year, and the daily load/solar/FMP shape used for visuals).

**Files / Surfaces**
- `ceba/DPPA Presentation July 2026 Scenario Training.pptx` - read S3 numbers.
- `app/src/modules/settlement.js` - reconcile every figure against the engine.
- `app/src/data/default-scenarios.js` - confirm S1/S2 baseline matches the spec.
- `research/2026-06-29_dppa-scenario-numbers-spec.md` (new) - the single source of truth.

**Dependencies**
- None.

**Exit Criteria**
- [ ] Spec file exists with S1, S2, S3 fully tabulated and every figure traceable to `settlement.js`.
- [ ] S3 inputs are decided (deck-derived or documented fallback) with the reconciled five-line bill.

**Phase Risks**
- **RISK-01-01:** Deck S3 numbers may be illustrative/inconsistent or use a different fee basis. Mitigation: reconcile to `settlement.js`; if irreconcilable, use the `higherGen` fallback and record the deviation in the spec.

### PHASE-02 - App: add the Scenario 3 (`workshop3`) preset
**Goal**
Give the live app a third workshop preset so sub-groups can self-verify S3 the same way they verify S1/S2, and so the negotiation round has a third base case.

**Tasks**
- [ ] TASK-02-01: Add a `workshop3` entry to `scenarioProfiles` in `app/src/data/default-scenarios.js` mirroring the `workshop1`/`workshop2` shape (`kind: 'workshop'`, `overrides: { strikePrice, marketPrice }`, `monthlyVolumes: { contracted, total }`, `fmpSide`, illustrative `loadProfile`/`generationProfile`) using PHASE-01 numbers.
- [ ] TASK-02-02: Append `'workshop3'` to `scenarioOrder`.
- [ ] TASK-02-03: Add/extend a Vitest case asserting `buildFiveLineBill` for `workshop3` returns the spec's C_EVN/C_KH/CfD (follow the existing workshop1/workshop2 test pattern in `app/test/`).
- [ ] TASK-02-04: Run the app test suite and the dev server; confirm the new preset renders the daily chart, 5-line bill, and multi-year chart without errors.

**Files / Surfaces**
- `app/src/data/default-scenarios.js` - new preset + order.
- `app/test/` - settlement assertion for `workshop3`.
- `app/src/modules/ui.js` / `chart.js` - inspect only if the preset label/picker needs a hook (likely none; presets are data-driven).

**Dependencies**
- PHASE-01.

**Exit Criteria**
- [ ] `npm test` (in `app/`) passes including the new `workshop3` assertion.
- [ ] Selecting Workshop 3 in the running dev app shows a 5-line bill matching the spec penny-for-penny.

**Phase Risks**
- **RISK-02-01:** A shortfall/over-gen S3 may need `settlementMode`/`fmpSide` tuning to display correctly. Mitigation: copy the closest existing workshop preset (workshop2 for shortfall) and adjust only the differing fields.

### PHASE-03 - Per-scenario visuals (animated CfD + bill waterfall), trilingual
**Goal**
Produce the "lively charts and visuals" — for each scenario, an animated 24h CfD chart (GIF + MP4) and a static five-line bill-waterfall figure — in en/vi/zh.

**Tasks**
- [ ] TASK-03-01: Refactor `build_cfd_slide.py` to lift the module-level `load`/`solar`/`matched`/`fmp`/`STRIKE` globals into a `SCENARIOS` dict keyed `s1`/`s2`/`s3`, each carrying its own profile arrays + strike (from the PHASE-01 spec). Parameterize `draw_base`/`generate_gif` to take a scenario.
- [ ] TASK-03-02: Loop `generate_gif` over scenarios × languages → `assets/cfd-s1-<lang>.gif`, `cfd-s2-<lang>.gif`, `cfd-s3-<lang>.gif` (lang ∈ en/vi/zh-cn), preserving the TOU overlay and the strike-vs-FMP callout wording already in `TEXTS`.
- [ ] TASK-03-03: Generalize the `below`/`above`/`equal` callout strings in `TEXTS` so the "strike 2,000" literal is replaced by each scenario's strike value (format placeholder), since S1/S2/S3 use different strikes.
- [ ] TASK-03-04: Convert each GIF to MP4 (ffmpeg, H.264/`yuv420p`/`+faststart`, 30 fps) → `assets/cfd-s{1,2,3}-<lang>.mp4`, per ASM-003. Add the ffmpeg invocation to the script or a sibling `build_scenario_mp4.sh`/Python `subprocess` step.
- [ ] TASK-03-05: Author a static five-line bill-waterfall SVG per scenario (en/vi/zh) — reuse the inline-SVG waterfall pattern from `lessons/0007` (VISUAL 1), scaled to each scenario's C_KH. These can be embedded directly in the lesson HTML rather than separate files.

**Files / Surfaces**
- `build_cfd_slide.py` - parameterize into per-scenario rendering.
- `assets/cfd-s{1,2,3}-{en,vi,zh-cn}.gif` / `.mp4` (new) - animated outputs.
- `lessons/0007`,`0008` - reuse the existing bill-waterfall SVG markup as the template for S1/S2/S3 figures.

**Dependencies**
- PHASE-01 (numbers + daily shapes).

**Exit Criteria**
- [ ] Nine GIFs (3 scenarios × 3 languages) render with correct per-scenario strike lines and callouts.
- [ ] Matching MP4s exist and play (faststart, yuv420p).
- [ ] One bill-waterfall figure per scenario reconciles visually to the spec's C_EVN/C_KH split.

**Phase Risks**
- **RISK-03-01:** zh-cn glyphs require the `Microsoft YaHei` font (already referenced in `TEXTS["zh"]`). Mitigation: confirm the font is available on the render host; the script already sets `fontfamily` per language.
- **RISK-03-02:** ffmpeg may not be on PATH. Mitigation: document the dependency in the script header (matches the existing GIF→MP4 workflow) and surface a clear error if missing.

### PHASE-04 - Scenario 3 lesson + group-activity guide + worksheets (trilingual)
**Goal**
Build the learner-facing artifacts: a Scenario 3 worked-example lesson (mirroring 0007/0008) and the role-based group-workshop guide with printable worksheets, localized in en/vi/zh.

**Tasks**
- [ ] TASK-04-01: Create `lessons/0009-scenario-3-<slug>.html` mirroring `0007`/`0008` (eyebrow, modmap, parameter `pgrid`, bill-waterfall SVG, money-flow SVG, CfD-direction SVG, 5-line table, `tryit` linking to Workshop 3, three `quiz` blocks, glossary link, nav). Numbers from PHASE-01; figures from PHASE-03.
- [ ] TASK-04-02: Create the group-workshop guide `lessons/0010-group-workshop.html`: a ~90-min role-based-negotiation activity orchestrating all three scenarios — role assignment (off-taker vs developer), per-scenario hand-compute rounds, the negotiation round (re-key strike into the app slider, observe the CfD flip), and the cross-group debrief. Embed the per-scenario animated CfD videos and link each round to its app Workshop preset.
- [ ] TASK-04-03: Add printable participant worksheets — a blank five-line/CfD compute grid per scenario — either embedded in `0010` behind `@media print` rules in `assets/course.css` (preferred, one source) or as `lessons/0011-worksheets.html`. Include the negotiation outcome grid.
- [ ] TASK-04-04: Produce Vietnamese (`-vi`) and Chinese (`-zh-cn`) copies of the learner-facing pages (S3 lesson, workshop guide, worksheets), swapping the embedded visuals for the matching `-vi`/`-zh-cn` assets and translating learner-facing copy. (Per Grill Me Q-002 the facilitator kit stays English-only.)
- [ ] TASK-04-05: Wire navigation: link `0008` → `0009` → `0010`, and add a "group workshop" entry point from the scenario lessons.

**Files / Surfaces**
- `lessons/0009-scenario-3-<slug>.html` (+ `-vi`, `-zh-cn`) - new S3 worked example.
- `lessons/0010-group-workshop.html` (+ `-vi`, `-zh-cn`) - the facilitated activity guide.
- `lessons/0011-worksheets.html` (optional, + locales) - printable compute grids.
- `assets/course.css` - add `@media print` worksheet styles (extend, don't restyle existing lessons).
- `assets/quiz.js` - reuse as-is for retrieval checks.

**Dependencies**
- PHASE-01, PHASE-02, PHASE-03.

**Exit Criteria**
- [ ] S3 lesson renders with correct numbers and figures, consistent with 0007/0008.
- [ ] Workshop guide walks all three scenarios + negotiation + debrief and embeds the new videos.
- [ ] Worksheets print cleanly (one scenario per page) with a usable blank compute grid.
- [ ] en/vi/zh-cn variants exist for every learner-facing page.

**Phase Risks**
- **RISK-04-01:** Trilingual HTML triples surface area and drift risk. Mitigation: build/validate the English set fully first, then clone+translate; keep all numbers identical across locales (only copy changes).

### PHASE-05 - Facilitator kit (English)
**Goal**
Equip a facilitator to run the 90-minute session cold: timing, script, answer keys, and debrief.

**Tasks**
- [ ] TASK-05-01: Write the timeboxed run-of-show (e.g., 10' framing / 3×~18' scenario rounds / 15' negotiation / 12' debrief — tune to 90') as a collapsible section in `lessons/0010-group-workshop.html` and/or `facilitator/dppa-workshop-facilitator-guide.md`.
- [ ] TASK-05-02: Write the answer keys — the fully worked five-line bill + signed CfD + C_EVN/C_KH + crossover for S1/S2/S3 — sourced verbatim from the PHASE-01 spec.
- [ ] TASK-05-03: Write the facilitator script (talking points per round, the role-assignment mechanic, how to drive the app strike slider during the negotiation, common misconceptions to pre-empt — e.g., the C_EVN vs C_KH confusion and CfD sign).
- [ ] TASK-05-04: Write debrief prompts that compare outcomes across sub-groups and connect back to the bankable-strike / DSCR concepts from modules 3–4.

**Files / Surfaces**
- `lessons/0010-group-workshop.html` - embed facilitator notes (collapsible) and/or
- `facilitator/dppa-workshop-facilitator-guide.md` (new) - standalone kit.
- `research/2026-06-29_dppa-scenario-numbers-spec.md` - answer-key source.

**Dependencies**
- PHASE-01, PHASE-04.

**Exit Criteria**
- [ ] Run-of-show sums to ~90 minutes with explicit per-segment timings.
- [ ] Answer keys match the spec and the app presets exactly.
- [ ] A facilitator with no prior context could run the session from the kit alone.

**Phase Risks**
- **RISK-05-01:** Facilitator notes embedded in learner HTML could leak answers to participants. Mitigation: gate behind a collapsed `<details>`/print-hidden block, or keep the kit in the separate `facilitator/` file.

### PHASE-06 - Verify, record, and (optional) deploy
**Goal**
Prove the module works end to end, record status in the workspace, and decide on deployment.

**Tasks**
- [ ] TASK-06-01: Open each new lesson/workshop page in the preview browser; confirm visuals (GIF/MP4 + SVG) load, quizzes work, and print layout is correct. Capture a screenshot of the workshop guide and one worksheet.
- [ ] TASK-06-02: Run `app/` Vitest suite; confirm green including the `workshop3` assertion.
- [ ] TASK-06-03: Cross-check every displayed number (lessons + worksheets + answer keys + app preset) against `research/2026-06-29_dppa-scenario-numbers-spec.md`.
- [ ] TASK-06-04: Add `learning-records/0003-group-workshop-module.md` (status, decisions, next steps) and update `NOTES.md`/`MISSION.md` to note the group-workshop track.
- [ ] TASK-06-05: Decide deployment (Grill Me Q-003): if approved, build + `firebase deploy --only hosting --project dppa-case` for the app's Scenario 3 preset.

**Files / Surfaces**
- `app/` - test + optional deploy.
- `lessons/*` - preview verification.
- `learning-records/0003-*.md`, `NOTES.md`, `MISSION.md` - status records.

**Dependencies**
- PHASE-02, PHASE-03, PHASE-04, PHASE-05.

**Exit Criteria**
- [ ] All numbers reconcile across artifacts.
- [ ] Tests pass; preview screenshots captured.
- [ ] Learning record written; deployment decision executed or explicitly deferred.

**Phase Risks**
- **RISK-06-01:** A number mismatch found late forces edits across many localized files. Mitigation: PHASE-01 spec + PHASE-06 cross-check are the gates; do TASK-06-03 before translating-heavy edits settle (i.e., verify English first in PHASE-04).

## Verification Strategy
- **TEST-001:** `cd app && npm test` — Vitest, including the new `workshop3` `buildFiveLineBill` assertion (PHASE-02/06).
- **MANUAL-001:** Preview each new HTML page; confirm embedded GIF/MP4 + SVG render, `quiz.js` feedback works, navigation links resolve, and `@media print` produces one-scenario-per-page worksheets (PHASE-06).
- **MANUAL-002:** Live-app self-verify — select Workshop 1/2/3, confirm the five-line bill matches the spec and the strike slider flips the CfD sign as the negotiation step describes (PHASE-02/06).
- **OBS-001:** If deployed, confirm https://dppa-case.web.app serves Workshop 3 and the bill reads correctly post-deploy (PHASE-06, gated by Q-003).
- **DATA-001:** Reconcile every figure in lessons/worksheets/answer-keys/app against `research/2026-06-29_dppa-scenario-numbers-spec.md` (PHASE-06 TASK-06-03).

## Risks and Alternatives
- **RISK-001:** Number drift across app preset, three lessons × three languages, worksheets, visuals, and answer keys. Mitigation: a single PHASE-01 spec as source of truth + a PHASE-06 reconciliation gate; numbers identical across locales (copy-only translation).
- **RISK-002:** Trilingual scope (DEC-013) is the largest cost driver. Mitigation: build/verify English end-to-end first, then clone+translate; Grill Me Q-002 keeps the facilitator kit English-only.
- **ALT-001:** Build a dedicated in-app "Workshop mode" with a bespoke negotiation-outcome chart. Not chosen — the existing strike slider already flips the CfD live (brainstorm ASM-001); far less build for the same pedagogical payoff.
- **ALT-002:** Scenario-race or line-jigsaw task format. Not chosen — neither exercises the negotiation/decision outcome the user wants; comparison elements are folded into the role-based debrief instead.

## Grill Me
1. **Q-001:** What are Scenario 3's exact inputs (matched/contracted/total volumes, strike, FMP, resulting C_EVN/C_KH)?
   - **Recommended default:** Extract from `ceba/DPPA Presentation July 2026 Scenario Training.pptx` and reconcile against `settlement.js`; if it doesn't map cleanly, use the app's `higherGen` over-generation case as S3.
   - **Why this matters:** Drives PHASE-01 spec, the `workshop3` preset, S3 visuals, the S3 lesson, worksheets, and answer keys — the entire third leg of the session.
   - **If answered differently:** If you hand me the numbers directly, PHASE-01 skips extraction and goes straight to reconciliation; if S3 is "over-generation/excess", the bill emphasizes excess handling rather than residual shortfall.
2. **Q-002:** How far does the trilingual launch extend — only learner-facing artifacts (lessons, workshop guide, worksheets, visuals), or also the facilitator kit (script, run-of-show, answer keys)?
   - **Recommended default:** Localize learner-facing artifacts in en/vi/zh-cn; keep the facilitator kit English-only for v1.
   - **Why this matters:** Roughly halves PHASE-04/05 translation + QA effort and changes the file count.
   - **If answered differently:** Full localization adds vi/zh-cn copies of the facilitator guide and answer keys (more PHASE-05 work + review).
3. **Q-003:** Should the app's new Scenario 3 preset be deployed to production (`firebase deploy`) as part of this work, or committed and held for review?
   - **Recommended default:** Build + test locally and commit; deploy only on your explicit go (deploy is an outward-facing action).
   - **Why this matters:** Determines whether PHASE-06 ends with a live https://dppa-case.web.app change.
   - **If answered differently:** "Deploy now" adds the firebase build+deploy step and a post-deploy smoke check to PHASE-06.

## Suggested Next Step
Answer the three Grill Me questions (especially Q-001, which unblocks PHASE-01), update this plan if any default changes, then begin PHASE-01 — extract Scenario 3 and lock the canonical number spec.
