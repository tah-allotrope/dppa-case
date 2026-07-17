---
title: "DPPA-Case: Prose Parity & Plan Gaps Brainstorm"
date: "2026-07-17"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze the project's current state, codebase, documentation and architecture; brainstorm improvements, features, refactors, architectural changes or optimizations that would take it to the next level"
slug: "prose-parity-and-plan-gaps"
builds_on:
  - "research/2026-07-16-post-hardening-next-level-brainstorm.md"
  - "plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md"
---

# Brainstorm: What Today's Fresh Pass Found That Yesterday's Didn't

## 0. State of play (verified 2026-07-17)

- **Nothing has been executed since the last commit** (`d24ed9b`, 2026-07-11). `git status` shows
  exactly two untracked files: yesterday's brainstorm and the 6-phase
  **Gate Credibility & Pipeline Hardening** plan drafted from it. Working tree is otherwise clean.
- That plan is thorough (1,086 lines, binding defaults, planted-failure tests) and its sequencing
  is right: PHASE-01 (make "5 of 56" defensible) is calendar-gated to land before the 2026-09-15
  content freeze. **This brainstorm deliberately does not re-litigate it.** Instead it reports
  (a) what a fresh verification pass found that the plan misses, and (b) the territory the plan
  scoped out.
- The stray branch `cc-nightly/20260710-213046` has **zero unique commits** vs master — prunable.

**Headline finding:** the repo has a *second, unguarded number pipeline*. The deck's figures trace
to the engine and are CI-checked; but the **prose artifacts** — lessons HTML, facilitator guides,
the printed Word handout builder, NOTES/RESOURCES/checklist — carry **76 hand-typed canonical
figures across 15 files**, and at least **four of them are already wrong today**. The plan hardens
the deck pipeline further while leaving this second pipeline entirely outside the net.

---

## Theme A — Live stale numbers in facilitator- and learner-facing artifacts ⭐ act now

This is not a hypothetical drift risk; the drift has already happened once and survived a fix.

When the real gate sweep landed (2026-07-11, commit `7f6a042`), the "0 of 56" placeholder was
updated to the computed "5 of 56" in the deck, visuals, and
`facilitator/dppa-workshop-facilitator-guide.md`. The sweep of references stopped there. Still
stating the **retired** "0 of 56" today:

| File | Evidence | Audience |
|---|---|---|
| `facilitator/dppa-panel-guide.md:80` | "the empty-window finding (**0 of 56** … passed all three)" | The presenter, live at a CEBA panel |
| `lessons/0004-module-4-three-gates.html:190,228` | "found **0 of 56** passed all three gates" (twice) | The learner (the user), rehearsing M4 |
| `lessons/0005-module-5-canonical-cases.html:135` | SVG `aria-label="Zero of 56 scenarios passed…"` | Same |

The panel guide one is the worst: it anchors an *answer to a lender-panel question* on a number
that has been false for six days. The presenter rehearsing from it would say "zero" in a room
where the deck says "5" (and post-PHASE-01, a band out of 70).

**A1. Fix the four stale references immediately** — a 10-minute edit, independent of the plan.

**A2. Institutionalize the pattern with a *retired-figures denylist*.** Every time a headline
changes, the superseded value joins `tools/retired-figures.json`
(e.g. `"0 of 56"`, and after PHASE-01: `"5 of 56"`, `"of 56"`). A tiny checker greps
`*.md`, `lessons/**/*.html`, `facilitator/**` for retired strings and fails CI on a hit. This is
the cheap dual of the parity check: parity proves the deck says the *right* number; the denylist
proves nothing anywhere still says the *old* one. It would have caught all four instances above,
and it automatically catches the much larger blast radius PHASE-01 is about to create (see B1).

## Theme B — Amendments the drafted plan needs before execution

**B1. PHASE-01's blast radius is understated.** TASK-01-12 updates only
`facilitator/dppa-workshop-facilitator-guide.md`, but "5 of 56 / 56-scenario" also lives in
`NOTES.md:9-11`, `RESOURCES.md:19`, `plans/2026-october-readiness-checklist.md:19`, and the exit
criterion greps only the two build scripts plus one guide. After PHASE-01 lands, four more docs
go stale the same way the panel guide did. Amend TASK-01-12 to a repo-wide prose sweep — or
better, land A2 first and let the denylist enumerate the stragglers mechanically.

**B2. The plan's manifest idea stops at the deck; extend it to the handout.**
`build_worksheet_answer_docx.py` hand-types *every* figure it prints — `8,563,196,000`,
`19,628,262,400`, `9,054,644,000`, the formulas, the effective rates (lines 85-141). The printed
Word handout participants compute against is the artifact with the *least* verification in the
repo, and it's the one that can't be hot-fixed on session day once printed. Root cause:
`export-spine.mjs` exports **S1 only**; S2/S3 canonical numbers exist nowhere in JSON — their
source of truth is a research markdown (`research/2026-06-29_dppa-scenario-numbers-spec.md`) plus
duplication across the docx builder, three lesson-HTML families, the facilitator guide, and
learning records (the 76 occurrences). Proposal, as a new plan phase (or PHASE-03b):
1. Generalize `export-spine.mjs` → `spine-s{1,2,3}.json` (the engine's `buildFiveLineBill`
   already computes S2/S3 — the app's workshop2/workshop3 presets prove it).
2. Wire `build_worksheet_answer_docx.py` to read the spines instead of literals — same surgery
   the deck builder already had.
3. Add `tools/verify_prose_figures.py`: for each canonical figure in the spines, assert every
   occurrence of a *near-miss* (same figure ± last-digit edits) in md/html matches exactly. Even
   a dumb "known-canonical strings must match character-for-character" pass beats today's nothing.

**B3. One more grid-size literal family the plan's grep misses.** The PHASE-01 exit grep covers
`build_*.py` and one guide, but "56-scenario" phrasing also appears in `RESOURCES.md` and the
readiness checklist (B1 list), and `lessons/0004`/`0005` HTML hardcode both the count and the
result inside prose *and* an `aria-label`. Add `lessons/**` and `facilitator/**` to TEST-003's
scope.

**B4. Commit the plan.** A day of high-quality planning work exists only as untracked files on
one Windows laptop (there *is* a GitHub remote, so the exposure is "until the next commit", not
"forever" — but yesterday's session ended without one). First action of any execution session:
commit brainstorm + plan, delete the empty `cc-nightly/20260710-213046` branch locally and on
origin.

## Theme C — The scoped-out frontier (carried, with sharper shapes)

These were explicitly out of the plan's scope; they are where value sits once PHASE-01/02 land.

**C1. The FMP evidence hunt is automatable research, not blocked work.** The plan's out-of-scope
list bundles "real FMP series" with "needs Allotrope deal data", but they're different: LCOE/DSCR
needs deal data (truly human), while a public CGM/SMP proxy series and the official Decree
57/2025/ND-CP + Circular 16/2025/TT-BCT texts are *findable* (thuvienphapluat.vn, EVN/NSMO
publications, ERAV releases). A focused research session could close both `RESOURCES.md` "Gaps to
fill" bullets — the two footnotes a regulatory teaching session most needs. Output: sourced URLs
in RESOURCES.md, and if a monthly SMP/CGM series surfaces, a `research/fmp-series.md` with the
observed range vs the illustrative 1,427 — even "observed range brackets our illustrative value"
is a defensible slide footnote.

**C2. A human-blocked register with dates, not prose.** The critical path now contains five
human-only items scattered across three documents: session date (Q-001, open since 07-04),
VI/ZH translator engagement (blocks PHASE-05), LCOE/DSCR recalibration (ASM-002), Firebase deploy
credentials (deploy job commented out), fresh-viewer volunteer scheduling. Consolidate into one
table in the readiness checklist with owner + needed-by date derived from the 09-15 freeze
(e.g. translator must be engaged by ~08-25 for a September delivery). The repo is excellent at
machine-verifiable gates and has no equivalent for human ones.

**C3. Presenter crib cards from speaker notes.** The deck's speaker notes deliberately carry the
exact answer-key numbers (they're exempt from the word budget). A small `build_crib_cards.py` —
python-pptx reads notes per slide, emits a print-ready A5 HTML/PDF per module in the deck
aesthetic — gives the presenter the "teach from memory, glance at a card" artifact MISSION.md
describes, generated from the same single source of truth so it can never drift from the deck.
Cheap: the extraction logic already exists in `audit_teaching_deck.py`.

**C4. July→October A/B evidence artifact** (carried E4). Run the audit over both decks, publish
words/symbols/visuals per module as a one-page report. It's the proof the redesign method worked
— for CEBA, and as an Allotrope capability story. One hour with tooling that already exists.

**C5. Process debt worth one editing pass** (carried E1–E3): learning record `0005` for the
teaching-revamp + hardening arc (the July symbol-overload failure that motivated everything still
has no learning record); archive `activeContext.md`'s completed phases (45 KB append-only log);
MISSION.md still frames the session as July (plan TASK-04-07 covers this — fine to leave to it).

## Recommended sequence

1. **A1** — fix the four live "0 of 56" references (10 minutes, zero risk, wrong-today).
2. **B4** — commit the plan + brainstorm; prune the empty nightly branch.
3. **Amend the plan per B1–B3** (blast-radius sweep, worksheet/spine phase, wider grep scope),
   then **execute PHASE-01** as drafted — it remains the only calendar-gated work.
4. **A2** — retired-figures denylist, ideally landing in the same PR as PHASE-01 so "5 of 56"
   enters the denylist the moment it's retired.
5. **C1** — FMP/decree research session (parallelizable with any of the above).
6. **C2** — human-blocked register, before the translator deadline math stops being comfortable.
7. Then the plan's PHASE-02→06 as sequenced; **C3–C5** opportunistically post-freeze.

## Assumptions adopted (unattended run — no questions asked, per brief)

- **Analysis only; no fixes applied** — including the live-stale A1 items. They are wrong today
  and trivially fixable, but the brief asked for brainstorm output, and A1 touches
  facilitator-facing prose the user may want to word themselves. Flagged as step 1 instead.
- **Yesterday's plan is treated as accepted-pending-review**, not re-derived. Where I disagree I
  amended (B1–B3) rather than proposed a rival plan; the plan's own sequencing and binding
  defaults are sound.
- **"0 of 56" is judged stale, not intentional**: the panel guide predates the real sweep
  (2026-06-29 vs 07-11), the July-11 fix's own report (`reports/2026-07-11-phase-03-gate-sweep.html`)
  says it updated all facilitator references but only touched the workshop guide, and no document
  frames "0" as a historical July figure. If the user intended the panel guide to preserve the
  July-session narrative, A1 becomes "label it historical" rather than "update it".
- **The 76-occurrence count** comes from grepping the six canonical totals
  (`9,063… / 8,563… / 8,304… / 9,054… / 18,828… / 19,628…`) across `facilitator/`, `lessons/`,
  `learning-records/` — a lower bound; component figures (fees, loss factors) would widen it.
- I did not run the JS test suite or rebuild any artifact today; pipeline-health claims rest on
  yesterday's verified brainstorm plus the unchanged working tree since `d24ed9b`.
