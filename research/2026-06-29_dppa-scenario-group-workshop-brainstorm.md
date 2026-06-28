---
title: "DPPA Scenario Group-Learning Workshop Module"
date: "2026-06-29"
type: "brainstorm"
depth: "standard"
source_request: "Group-learning teaching module built from the existing DPPA PowerPoint scenario-training slides — turn the scenario training into an interactive group-learn experience with lively charts and visuals, plus group tasks that walk participants through all the calculations, numbers, and details. Output should feed into a teaching/lesson-building workflow."
slug: "dppa-scenario-group-workshop"
---

# Brainstorm: DPPA Scenario Group-Learning Workshop Module

## Problem & Why Now
<!-- seeds /plan ## Objective -->
The existing DPPA course (`lessons/0001–0008`) and the live app (dppa-case.web.app)
teach Vietnam DPPA settlement mechanics well, but they are **solitary, read-only**
experiences: a learner clicks through SVGs and answers individual quizzes. The
scenario training in particular (S1 matched, S2 shortfall — and a Scenario 3 that
lives only in the July 2026 deck) is delivered as *worked examples*, not as a thing
a room of people actively **does together**.

The need now is a **live, facilitated group-learning module** that turns the scenario
training into an interactive workshop: sub-groups roleplay the two sides of a DPPA
(off-taker/factory vs developer), **compute every line of the bill by hand**, then
**negotiate a strike price** and watch the signed CfD flip — all reinforced with
new, lively per-scenario visuals. This is the "do it, don't just read it" layer that
the course explicitly lacks (the learning record even names a negotiation sim as a
"possible next session" that was never built). It feeds the existing teaching/lesson
workflow: new artifacts land in `lessons/`, reuse `course.css` + `quiz.js`, drive the
live app, and are generated/rendered with the existing `build_cfd_slide.py` tooling.

## Current vs Desired State
<!-- seeds /plan ## Context Snapshot -->
- **Current state:**
  - 8 standalone English HTML lessons (`lessons/0001–0008`): 6 modules + S1 (matched) + S2 (shortfall), built on `assets/course.css` and the `assets/quiz.js` retrieval widget.
  - Live app (vanilla JS + Vite + Chart.js) at https://dppa-case.web.app with `app/src/modules/settlement.js` (5-line bill, signed CfD, 20-yr projection) and **workshop1/workshop2 presets that match the S1/S2 lesson numbers penny-for-penny**.
  - `build_cfd_slide.py` (Python + matplotlib + Pillow + ffmpeg) renders the 24-hour CfD chart as PNG/GIF/MP4 in **en/vi/zh-cn** with TOU-band overlays.
  - Glossary `reference/dppa-glossary.html` (16 symbols, the five-line formula, sign convention: CfD + = factory pays developer, CfD − = developer pays factory) plus a verified 2025 basis (retail 2,204 · fees 523.3 · loss 1.0342).
  - Source decks in `ceba/`, including `DPPA Presentation July 2026 Scenario Training.pptx` and `DPPA Presentation July 2026 To Teach.pptx` (the latter untracked).
  - **No group-task / collaborative / facilitation layer exists.** No Scenario 3 lesson exists yet.
- **Desired state:** a facilitator-ready, ~90-minute group module for ~10–25 practitioners in sub-groups of 3–5. Approximate flow:
  1. Short framing (recap the five-line bill + signed CfD; assign roles).
  2. For each of **3 scenarios (S1, S2, S3)**: sub-groups **hand-compute the full bill** (all 5 lines + signed CfD + C_EVN↔C_KH reconciliation + the multi-year crossover) on structured worksheets, then **verify against the live app preset**.
  3. **Role-based negotiation round:** off-taker vs developer sub-groups negotiate a strike; re-key it into the app's strike slider and watch the signed CfD flip live.
  4. Cross-group debrief anchored on **new per-scenario visuals** (animated 24h CfD chart re-rendered per scenario + a static five-line "bill waterfall" SVG per scenario).
  - Ships with a **full facilitator kit** (timeboxed run-of-show, facilitator script, answer keys, debrief prompts, printable participant worksheets) and launches in **en/vi/zh-cn**.
- **Key repo surfaces:**
  - `lessons/` (new activity guide files, `000X` numbering, reuse `course.css` + `quiz.js`); `lessons/0007`, `0008` as content baselines.
  - `app/src/data/default-scenarios.js` (workshop1/workshop2 presets; add Scenario 3 preset) and `app/src/modules/settlement.js` (the answer-key source of truth — reused, not rewritten).
  - `build_cfd_slide.py` (extend to render per-scenario animated charts in 3 languages) and `assets/` (new GIF/MP4/SVG outputs).
  - `reference/dppa-glossary.html` (referenced, not duplicated).
  - `ceba/DPPA Presentation July 2026 Scenario Training.pptx` (extract Scenario 3 numbers).
  - Workspace docs: `MISSION.md`, `NOTES.md`, `learning-records/` (record the new module's status).

## Resolved Decisions
<!-- the grilled Q&A; each one keeps /plan's Grill Me empty -->
- **DEC-001:** Delivery is a **live facilitated workshop** (not self-paced, not hybrid) — matches the "July 2026 To Teach" context.
- **DEC-002:** Outcome = each group can **both compute** the full bill + signed CfD **and negotiate/decide** a strike price (the two are combined, not either/or).
- **DEC-003:** Audience is **~10–25 practitioners split into sub-groups of 3–5** (competent practitioners per `NOTES.md`).
- **DEC-004:** Primary artifact = **new HTML activity guide(s) in `lessons/`** (`000X` numbering) reusing `course.css` + `quiz.js`; projectable and printable. No new web stack.
- **DEC-005:** Core task format = **role-based negotiation** — sub-groups split into off-taker (factory) vs developer, each computes its own side, paired groups negotiate a strike, then watch the signed CfD flip.
- **DEC-006:** Groups **hand-compute on structured worksheets first, then verify against the live app** (maximizes "illustrate all the calculations, numbers, details").
- **DEC-007:** Scope = **Scenarios 1, 2, and 3 from the presentation** (S3 is new — see DEC-014).
- **DEC-008:** Math depth = **everything**: all 5 bill lines + signed CfD + C_EVN↔C_KH reconciliation + the multi-year crossover.
- **DEC-009:** **Build new visuals** for each scenario's calculations and figures (not reuse-only).
- **DEC-010:** Visual form = **per-scenario animated 24h CfD chart (GIF/MP4)** re-rendered with that scenario's numbers **plus a static five-line "bill waterfall" SVG** per scenario.
- **DEC-011:** Ship a **full facilitator kit**: timeboxed run-of-show + facilitator script + answer keys + debrief prompts + printable participant worksheets.
- **DEC-012:** Session length = **~90 minutes** (intro + 3 scenarios hand-worked + a negotiation round + debrief).
- **DEC-013:** Launch in **all three languages: en + vi + zh-cn** (matches the existing chart-asset i18n pattern in `build_cfd_slide.py`).
- **DEC-014:** **Scenario 3 numbers are extracted from the July 2026 deck** (`DPPA Presentation July 2026 Scenario Training.pptx`, fallback `…To Teach.pptx`) and reconciled against `settlement.js`.

## Assumptions & Constraints
<!-- seeds /plan ## Assumptions and Constraints -->
- **ASM-001:** The "watch the CfD flip live" negotiation moment uses the app's **existing strike-price slider** (which already recomputes the signed CfD); no new app "Workshop mode" build is required for v1.
- **ASM-002:** `settlement.js` is the **canonical answer-key engine** — worksheet answer keys are derived from it (and from the workshop1/workshop2 presets), not recomputed independently, so hand-math and app always reconcile.
- **ASM-003:** Scenario numbers from the July 2026 deck are treated as **canonical for the activity** (they already match the app presets for S1/S2); the glossary's "verified vs illustrative" note is cited where relevant rather than re-deriving market data.
- **ASM-004:** New activity guides follow the existing **one-mental-model-per-page, Material-design** convention and live as new `000X` files in `lessons/` (exact file split — e.g., one run-of-show page + per-scenario pages — left to `/plan`).
- **ASM-005:** Per-scenario animated charts are produced by **extending `build_cfd_slide.py`** (parameterizing the hardcoded 24h profiles + strike/FMP per scenario, looping over the existing en/vi/zh-cn language dict), not by introducing a new charting tool.
- **CON-001:** Aesthetic is **locked to the deck/Material palette** (teal #0097A7, amber, ink #212121) via `course.css`; new visuals must match.
- **CON-002:** No public NSMO/ERAV FMP time series exists (`RESOURCES.md`); all curves remain **illustrative** hardcoded profiles.
- **CON-003:** No LMS, auth, accounts, or real-time shared/multiplayer state — the workshop runs on static HTML + the existing public app + paper worksheets.
- **CON-004:** "All three languages" multiplies effort: 3 scenarios × 3 languages for visuals, plus localized learner-facing HTML/worksheets (see Q-002 on how far localization extends).

## Approaches Considered
<!-- seeds /plan ## Risks and Alternatives -->
- **Chosen:** **Layer a facilitated role-based-negotiation workshop on top of the existing course** — new HTML activity guides in `lessons/` + printable worksheets + a full facilitator kit, driving the live app for verification and the CfD-flip, with new per-scenario animated charts + bill-waterfall SVGs from the extended build script. Lowest friction, reuses the tested settlement engine and design system, and directly hits "compute + negotiate + lively visuals + all the numbers."
- **ALT-001:** Build a dedicated **"Workshop mode" inside the live app** (guided multi-step, group inputs, a bespoke negotiation-outcome chart). Rejected for v1 — most build effort; the existing strike slider already delivers the live CfD flip (ASM-001).
- **ALT-002:** **Paper-first facilitator guide + worksheets** with the app only as an optional aid. Rejected — under-uses the penny-for-penny app presets that make self-verification powerful.
- **ALT-003:** **Scenario-race** or **line-jigsaw** task formats. Rejected as the primary format — neither exercises the negotiation/decision outcome the user wants; elements (e.g., a comparison debrief) can still be folded into the role-based format.
- **ALT-004:** **Reuse existing visuals only.** Rejected — user explicitly wants new per-scenario figures for the calculations.

## Out of Scope
- Any LMS, login, accounts, progress tracking, or analytics.
- Real-time shared/multiplayer state or a live consensus/voting tool.
- Rewriting the 8 existing lessons or the `settlement.js` math (reuse only).
- A new in-app "Workshop mode" (deferred; ALT-001) for v1.
- Editing/regenerating the source `.pptx` decks (Scenario 3 is *read* for its numbers, not re-authored).

## Open Questions
<!-- the few that survived; seed /plan ## Grill Me -->
1. **Q-001:** What are Scenario 3's exact inputs (matched/contracted/total volumes, strike, FMP shape, and the resulting C_EVN / C_KH)?
   - **Recommended default:** Extract from `ceba/DPPA Presentation July 2026 Scenario Training.pptx` and reconcile against `settlement.js`; if S3 doesn't map cleanly, fall back to the app's `higherGen` (over-generation/excess) preset as the third case.
   - **Why this matters:** Determines the worksheet answer keys, the third app preset, and the third set of rendered visuals — the whole third leg of the session depends on it.
2. **Q-002:** How far does "all three languages" extend for launch — only learner-facing artifacts (activity HTML, worksheets, visuals) in en/vi/zh-cn, or also the facilitator script/run-of-show/answer keys?
   - **Recommended default:** Localize all **learner-facing** artifacts (activity pages, participant worksheets, per-scenario visuals) in en/vi/zh-cn; keep the **facilitator script + run-of-show + answer keys English-only** for v1 unless requested.
   - **Why this matters:** Roughly halves translation/QA effort and changes how many files `/plan` schedules.

## Suggested Next Step
Run `/plan dppa-scenario-group-workshop` to turn this into a multi-phase implementation plan.
