---
title: "DPPA Modules 1–6 Teaching Revamp (October 2026 Session)"
date: "2026-07-04"
type: "brainstorm"
depth: "deep"
source_request: "Revamp the teaching/delivery of Modules 1–6 for DPPA calculation in the slide deck (ceba/DPPA Presentation July 2026 To Teach.pptx); audience got confused and lost due to too much text, heavy terminology, and complex formulas"
slug: "dppa-modules-teaching-revamp"
---

# Brainstorm: DPPA Modules 1–6 Teaching Revamp (October 2026 Session)

## Problem & Why Now

At the July 2026 CEBA session, the audience (Vietnamese/Chinese/English-speaking factory CFOs, lenders, and off-takers — competent practitioners, not beginners) got confused and lost while being taught the DPPA settlement calculation from `ceba/DPPA Presentation July 2026 To Teach.pptx`. The observed failure mode: **symbol overload in Module 2** — slides 6–7 introduce Q_Khc, k, K_pp, C_dppa_dv, P_cl and three `min()` volume formulas simultaneously, and the audience never recovered for Modules 3–6. Contributing factors: ~100–165 words per content slide, ~20+ symbols/acronyms across the deck, raw 10-digit VND arithmetic on-slide, and formula-first (rather than intuition-first) sequencing.

The next teaching session is **October 2026**, so there is ample runway to rebuild properly. The repo's own `MISSION.md`/`NOTES.md` already diagnose the deck as "too wordy to teach from directly" and prescribe the fix ("distill, don't reproduce; one crisp visual mental model per module, whiteboardable in <5 min") — this brainstorm turns that documented philosophy into a concrete deck+app redesign.

**Success criterion (DEC-003):** by the end of Module 5, a participant can hand-compute (and app-verify) a simple monthly settlement for a given FMP/strike/load without the presenter re-explaining the symbols. Behavioral and testable in-session via the slimmed worksheet.

## Current vs Desired State

- **Current state:** 35-slide deck (6 module dividers + content + 8-slide scenario appendix), extracted from the 44-slide master `ceba/CEBA DPPA 2026.pptx`. Content slides run 100–165 words; nearly every slide is table+callout, no true diagrams beyond the slide-5 money-flow; formulas shown symbolically before intuition (five-line bill as a formula table on slide 6; three `min()` formulas on slide 7; 10-digit VND arithmetic on slide 9; full Decree-57 decomposition on slide 27). Worst offenders: slides 1, 3, 6, 7, 9, 14, 17, 23, 27; appendix slides 28–35 are even denser (up to 183 words).
- **Desired state:** A rebuilt trilingual (en/vi/zh-cn) teaching deck — visual-first, ≤30 words/slide, plain-language-first with symbols deferred to an M6 "decoder" — delivered as a **deck + live-app hybrid** with one scripted app moment per module, a 10-minute hand-compute exercise in M5, a presenter step-through "teach mode" in the app, GIF fallbacks for every app moment, a double-sided A4 reference card, and full speaker notes making the deck self-contained.
- **Key repo surfaces:**
  - `ceba/CEBA DPPA 2026.pptx` — the 44-slide master the new deck is rebuilt from (DEC-020); `ceba/DPPA Presentation July 2026 To Teach.pptx` — the failed July extract, kept as reference.
  - `app/` (Vite + Chart.js, dppa-case.web.app) — gains the presenter step-through teach mode; `app/src/modules/settlement.js` stays the canonical answer-key engine; `app/src/data/default-scenarios.js` holds the verified S1 numbers and workshop presets.
  - `assets/cfd-s{1,2,3}-{en,vi,zh-cn}.gif/.mp4` + `build_cfd_slide.py` — reusable animated CfD charts and the scripted-render pattern the new visuals extend.
  - `lessons/0001–0006` (distilled HTML lessons, the proven target format), `lessons/0011-worksheets` (basis for the slimmed M5 worksheet), `reference/dppa-glossary.html` (canonical nomenclature for the decoder and A4 card).
  - `facilitator/dppa-workshop-facilitator-guide.md` — gains a regenerated Modules 1–6 run-of-show derived from the speaker notes.
  - `research/2026-06-29_dppa-scenario-numbers-spec.md` — canonical S1/S2/S3 numbers all new slide figures must reconcile to.

## Resolved Decisions

**Framing**
- **DEC-001:** Deliverable is a **deck + live-app hybrid** — slides slimmed to visual anchors, the live app carries all numeric walk-throughs, deck as connective tissue.
- **DEC-002:** Root failure identified as **symbol overload in M2** (slides 6–7 introduce five symbols and three `min()` formulas at once); the redesign attacks that point first.
- **DEC-003:** Success bar = **participants compute a monthly settlement by end of M5**, verified in-session with the worksheet + app.
- **DEC-028:** Target is the **October 2026 session** (the July session already happened; that is where the confusion was observed). No emergency timeline.

**Pedagogical architecture**
- **DEC-004:** Narrative spine = **"one factory, one month"** — follow a single named factory's electricity bill start to finish; every slide answers "what happens to OUR bill?" (M1 its EVN bill today → M2 its new five-line bill → M3 why line 5 moves → M4 the counterparty's view → M5 its full outcome → M6 what to negotiate).
- **DEC-005:** **Plain words first, symbols later** — no subscripted Decree-57 symbols on M1–M5 slides ("matched solar energy × market price × small loss factors"); the official notation appears once, in the M6 decoder slide, as a translation exercise. ≤5 symbols total before M6.
- **DEC-006:** The five-line bill (M2) is presented as a **Sankey / money-flow build**: the slide-5 money-flow diagram animates, each bill line is one arrow with its VND amount, the five arrows sum visually into the factory's total. (User override of the invoice-mockup recommendation.)
- **DEC-007:** All on-slide numbers in **VND millions, ≤3 significant figures** ("7,446 triệu ≈ 7.4 tỷ"); exact arithmetic lives only in worksheets and the app.
- **DEC-009:** Hard cap **≤30 words per content slide** (headline + caption only); keep roughly the current slide count for M1–M6 — density drops via one-idea-per-slide, not fewer slides.
- **DEC-027:** **Bill-shock cold open** — spine factory's two bills side by side (today vs with-DPPA, totals only) + hook "you'll compute this difference yourself in 60 minutes"; agenda collapses to a **6-icon strip** that recurs as the breadcrumb on every module divider.
- **DEC-025:** **One retrieval checkpoint per module divider** — a single plain-language show-of-hands question (e.g. "If market price crashes to 600, who pays whom?"), 30 seconds, no tooling.
- **DEC-032:** Close = **callback to the cold-open bill pair** ("you can now compute every line of this difference") + five-levers checklist slide + QR to app/lessons + invitation to the 90-min scenario workshop.

**Per-module design**
- **DEC-010 (M1):** One visual — a **24-hour TOU price strip** (colored bands) with the spine factory's load curve overlaid; only the factory's own voltage tier on-slide; full rate matrix moves to the A4 handout. Sets up the FMP-curve comparison in M3.
- **DEC-011 (M2 volumes):** The three `min()` formulas become a **water/pipe funnel visual** — generation leaks a little (grid losses), passes a gate sized by load ("you can only match what you consume"), then a gate sized by contract ("you only hedge what you contracted"). No algebra on-slide. Taught before the Sankey bill build (the gates feed the arrows).
- **DEC-012 (M3):** **Seesaw visual + existing animated 24h CfD chart** (assets/cfd-s1) showing the sign flipping through the day, then the app moment: drag the strike slider live. Single takeaway line: "a lock, not a discount." Zero formulas.
- **DEC-013 (M4):** **Three doors/gates visual, no formulas** — buyer door (cumulative cost ≤ doing nothing), lender door (repaid every year, ≥1.2× cover), investor door (equity ≥12–15%). Threshold numbers only; DSCR/IRR definitions to handout. CFOs know these ratios by name.
- **DEC-014 (M5):** **Hand-compute then reveal** — participants compute the spine factory's one-month bill from the slimmed worksheet, verify against the app, THEN the 56-scenario gate-sweep heatmap lands as the punchline ("scale your month ×12 ×20 strikes — here's why the window is empty").
- **DEC-026 (M5 exercise):** One-page worksheet, **five bill lines with pre-filled volumes** (S1 matched energy and CfD volume pre-printed), computed in VND millions with phone calculators, totaled and compared vs BAU. ~10 min. Tests bill assembly, not `min()` derivation under time pressure.
- **DEC-015 (M6):** **Five negotiation levers** (one per slide, with a "which way it moves your bill" arrow) + one **"decoder ring" slide** mapping the plain-language bill lines to official Decree-57 symbols (C_KH = C_EVN + C_CfD…) — the promised symbols-later payoff. Full formula appendix (old slide 27) moves to the printed handout.

**Data & case**
- **DEC-016:** Spine numbers = **canonical Scenario 1 (matched/base case)** from `app/src/data/default-scenarios.js` and the scenario-numbers spec — app preset, animated chart (cfd-s1), and worksheets already exist for it; M5's hand-compute uses the same case followed all along. `settlement.js` remains the single numeric source of truth; every on-slide figure reconciles to it.

**Delivery choreography**
- **DEC-008:** **One scripted app moment per module** — slides teach the concept (~3–4 min), one app demo proves it live (~2–3 min), divider re-anchors. Predictable rhythm.
- **DEC-024:** Time budget **~60 minutes including the 10-min M5 compute** (~8 min/module + buffer); the separate 90-min workshop track stays intact.
- **DEC-030:** App gains a **presenter step-through teach mode** (`?teach=1`): arrow-key/next-prev steps through the six scripted demos in order; each step auto-loads the right scenario/view/slider state and shows a one-line annotation banner; presenter can still move sliders live within a step. Presenter-facing only — no participant accounts or sync.
- **DEC-023:** Contingency: **pre-recorded GIF/MP4 of each of the six app demos on a hidden slide** after each divider (unhide and play if the app fails), plus the app runs locally (vite preview) so venue wifi is never required.

**Production**
- **DEC-020:** **Rebuild the deck from the 44-slide master** `ceba/CEBA DPPA 2026.pptx` (keeping its masters/branding/layouts) rather than editing the July extract in place; the July deck stays untouched as reference. New file named for the October session (e.g. `ceba/DPPA Presentation Oct 2026 To Teach.pptx`).
- **DEC-019:** New bespoke visuals (Sankey bill build, volume funnel, seesaw, three doors, TOU strip, gate heatmap) produced as **scripted PNG renders — and animated GIFs where motion helps** — extending the `build_cfd_slide.py` matplotlib pattern, styled to the course.css/app teal aesthetic. Reproducible and re-renderable when numbers change.
- **DEC-021:** Scenario appendix (old slides 28–35) **slimmed to 3 chart slides** — one per scenario, each just the existing animated CfD chart + a one-line takeaway; detailed numbers stay in the scenario lessons/worksheets.
- **DEC-017:** **Three parallel decks — en, vi, zh-cn** — matching the existing lesson/worksheet language pattern.
- **DEC-018:** Build sequence: **EN first, dry-run, content freeze, then clone vi and zh-cn** reusing the terminology already established in the existing vi/zh-cn lesson and worksheet variants. Visuals shared; only text layers swap (per-language chart text re-rendered via the build scripts, as done for cfd-s*-vi/zh-cn).
- **DEC-022:** Handout = **one new double-sided A4 reference card** (side A: five-line bill Sankey with plain-language labels + VI/ZH glosses; side B: Decree-57 symbol decoder + TOU rate matrix + gate thresholds), printed per seat, produced per language; everything else reuses the existing worksheets docx and glossary.
- **DEC-029:** **Full speaker notes on every slide are canonical** (explanation moved off-slide, app-moment script with preset/slider/expected number, checkpoint question + answer, timing) — AND the facilitator guide gains a regenerated Modules 1–6 run-of-show derived from those notes.

**Validation**
- **DEC-031:** Verification = **one full timed solo dry-run** (60-min fit, app switching, GIF fallbacks) **plus a fresh-viewer test** — a colleague who did not attend July sits the session; pass = they can compute the S1 bill at the M5 pause. Mechanical checks (≤30-word budget, symbol-count audit per module) run as a script during the build.

## Assumptions & Constraints

- **ASM-001:** `app/src/modules/settlement.js` and `research/2026-06-29_dppa-scenario-numbers-spec.md` remain the single source of numeric truth; no slide figure is hand-typed without reconciling to them.
- **ASM-002:** The existing vi/zh-cn terminology in lessons/worksheets is approved vocabulary and can be reused verbatim for the cloned decks and A4 cards.
- **ASM-003:** PowerPoint's GIF/MP4 embed behavior (GIFs autoplay in slideshow; MP4 needs click/auto trigger) is sufficient for the animated visuals and fallback demos; exact embed format is a build-time technical choice.
- **ASM-004:** The 44-slide master's layouts/branding are current and approved for the October session (no CEBA re-branding pending).
- **CON-001:** 60-minute session slot including the 10-minute M5 hand-compute; per-module budget ~8 minutes.
- **CON-002:** ≤30 words per content slide; ≤5 symbols on-slide before the M6 decoder.
- **CON-003:** Venue connectivity cannot be assumed — every app moment must work from a local build and have a recorded fallback.
- **CON-004:** Content freeze must precede vi/zh-cn cloning; late EN edits after freeze triple the rework.

## Approaches Considered

- **Chosen:** Rebuild a visual-first teaching deck from the 44-slide master + live-app hybrid with one scripted app moment per module, plain-language-first symbol strategy, S1 spine case, and an M5 hand-compute — because the observed failure (M2 symbol overload) is a sequencing/density problem the existing distilled-lesson format has already solved once, and the repo's own teaching philosophy prescribes exactly this.
- **ALT-001:** Edit the July deck in place — rejected by user in favor of rebuilding from the master (July deck kept pristine as the A/B reference of what confused the room).
- **ALT-002:** Teach directly from the HTML lessons (deck as leave-behind) — rejected; the deck remains the session backbone with the app for numerics.
- **ALT-003:** Invoice-mockup line-by-line reveal for M2 — considered; user chose the Sankey/money-flow build instead (one persistent spatial model reused from the cold open through the close).
- **ALT-004:** Deep-link presets only for the app (minimal change) — rejected in favor of a presenter step-through teach mode; worth the extra build for deterministic, fumble-proof demos.
- **ALT-005:** English-only or bilingual-on-slide language treatment — rejected; three parallel decks match the established lesson/worksheet pattern.
- **ALT-006:** Keeping Decree-57 notation throughout with mnemonics/legends — rejected; notation deferred entirely to the M6 decoder and handout.

## Out of Scope

- Redesigning the 90-min group workshop track, scenario lessons (0007–0009), or worksheets beyond the slimmed one-page M5 exercise.
- Changing the settlement engine, scenario numbers, or app calculator logic (teach mode is additive UI only).
- A participant-facing guided tour / self-paced mode in the app (presenter-facing step-through only).
- Full visual-first redesign of the scenario appendix (slimmed to 3 chart slides instead).
- Editing the 44-slide master `CEBA DPPA 2026.pptx` itself or the July deck.
- New translation vocabulary — vi/zh-cn terminology is reused from existing artifacts.

## Open Questions

1. **Q-001:** What is the exact October 2026 session date (and venue)?
   - **Recommended default:** Plan backwards from **October 1**: EN deck + visuals + teach mode by early September, dry-run + fresh-viewer test mid-September, freeze, then vi/zh-cn clones and printed A4 cards by late September.
   - **Why this matters:** Sets the content-freeze date that gates translation cloning and print production.
2. **Q-002:** Who is the fresh-viewer colleague for the validation run (someone who did not attend July)?
   - **Recommended default:** Any Allotrope colleague or friendly practitioner contact; schedule them when the EN dry-run passes.
   - **Why this matters:** The fresh-viewer M5 compute is the only direct test of the success criterion before the real session.
3. **Q-003:** What is the spine factory's name/persona on the slides (a fictional but realistic Vietnamese factory)?
   - **Recommended default:** A neutral fictional persona consistent with the S1 load profile (e.g. a garment/electronics factory sized to S1's monthly load), named once and reused everywhere including the worksheet.
   - **Why this matters:** The "one factory, one month" spine needs a stable named protagonist across deck, worksheet, and app teach-mode annotations.

## Suggested Next Step

Run `/plan dppa-modules-teaching-revamp` to turn this into a multi-phase implementation plan.
