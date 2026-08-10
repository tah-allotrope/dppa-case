# 0005 — Teaching Revamp & Hardening Arc (July → October 2026)

**Date:** 2026-08-10
**Status:** in progress — the pipeline is built and verified; the pedagogy is **not yet validated**

## Context

This record covers one continuous arc rather than a single delivery: the July 2026 CEBA session
failed as a piece of teaching, and everything built between 2026-07-04 and 2026-08-10 is a response
to that failure. It exists so a future session does not have to reconstruct *why* the deck is shaped
the way it is from seven plans and five brainstorms.

Two distinct things happened, and it is worth keeping them apart:

1. **A pedagogical failure** was diagnosed and a redesign was built (July 4–10).
2. **A credibility problem** was then discovered in the redesign's own numbers, and three
   successive hardening passes built machinery to stop it recurring (July 16 – August 10).

The second is not a detour from the first. The redesign's whole premise is that participants trust
the numbers enough to hand-compute them; a slide with a figure the engine does not produce destroys
that premise faster than any amount of symbol overload.

Source material: `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` (the diagnosis),
`reports/2026-07-04-modules-teaching-revamp-implementation.md` (the response),
`facilitator/fresh-viewer-kit/README.md` (the validation design), and the plans dated
`2026-07-04`, `2026-07-05`, `2026-07-10`, `2026-07-16`, `2026-07-17`, `2026-07-21`, `2026-07-25`.

## What failed, and why

The July audience — Vietnamese/Chinese/English-speaking factory CFOs, lenders, and off-takers,
**competent practitioners, not beginners** — got lost and did not recover.

The root cause was localized precisely (DEC-002): **symbol overload in Module 2.** Slides 6–7
introduced `Q_Khc`, `k`, `K_pp`, `C_dppa_dv`, and `P_cl` *simultaneously*, alongside three `min()`
volume formulas. The audience lost the thread there and Modules 3–6 were spent behind.

Contributing factors, all measurable in the deck itself:

- ~100–165 words per content slide (appendix slides reached 183)
- 20+ distinct symbols and acronyms across the deck
- raw 10-digit VND arithmetic rendered on-slide
- **formula-first sequencing** — the notation arrived before the intuition it encoded

The diagnosis worth carrying forward is that none of these were individually fatal. The deck was
accurate and complete. It failed because it was **a reference document being read aloud**, and a
reference document's virtues (completeness, precision, formal notation) are a teaching deck's
defects.

## The design rule that came out of it

> **Distill, don't reproduce.** One crisp visual mental model per module, whiteboardable in under
> five minutes. Plain words first; official notation deferred to a single decoder slide at the end.

Concretely, as implemented:

- **Plain language before symbols** (DEC-005). "Matched solar energy × market price × small loss
  factors" carries M1–M5; ≤5 symbols appear before M6. The Decree-57 notation appears exactly once,
  in an M6 **"decoder ring"** slide that maps each plain-language bill line to its official symbol
  (`C_KH = C_EVN + C_CfD`…). The symbols become a *payoff* — a translation exercise for material the
  audience already understands — instead of an entry toll.
- **A narrative spine** (DEC-004): "one factory, one month." Every slide answers "what happens to
  *our* bill?" M1 its EVN bill today → M2 its new five-line bill → M3 why line 5 moves → M4 the
  counterparty's view → M5 its full outcome → M6 what to negotiate.
- **Algebra becomes geometry.** The three `min()` formulas that broke July became a water/pipe
  **funnel** — generation leaks a little (losses), passes a gate sized by load, then a gate sized by
  contract. The CfD became a **seesaw**. The financing tests became **three doors**. No algebra
  on-slide.
- **Hard caps as design constraints** (DEC-007, DEC-009): ≤30 words per content slide; on-slide
  numbers in VND millions at ≤3 significant figures. Exact arithmetic lives in the worksheet and the
  app, never on a slide. Density dropped via one-idea-per-slide, not fewer slides.
- **Hand-compute before reveal** (DEC-014). Participants compute the spine factory's month from a
  slimmed worksheet and verify against the live app *before* the 56-scenario heatmap lands as the
  punchline. The success criterion (DEC-003) is behavioral and testable in-session: by end of M5, a
  participant computes a settlement **without the presenter re-explaining the symbols.**

A secondary rule, learned from the delivery mechanics rather than the pedagogy: **every live
moment needs a rehearsed fallback.** One scripted app moment per module (DEC-008), a presenter
step-through `?teach=1` teach mode (DEC-030), and a pre-recorded MP4 of each demo on a hidden slide
behind each divider (DEC-023) — plus the app runs from a local build, so venue wifi is never a
dependency.

## The pipeline built to keep the numbers honest

The redesign asks the audience to trust and reproduce the arithmetic. That made number provenance a
first-class engineering problem, and it was built out in layers — each layer added because the
previous one turned out to be insufficient.

**Layer 1 — one source of truth.** `app/src/modules/settlement.js` is the canonical engine.
`app/scripts/export-spine.mjs` and `export-sweep.mjs` export `assets/teaching/spine-s*.json` and
`gate-sweep.json` *from* it. Every downstream figure — deck, reference card, worksheet — traces to
those files and is never hand-typed. The regeneration order is fixed and documented in `CLAUDE.md`.

**Layer 2 — parity checks.** `audit_teaching_deck.py` and `verify_deck_numbers.py` reconcile the
built deck against the exported JSON. The `deck-parity` CI job goes further: it *regenerates* the
exports and runs `git diff --exit-code` against the committed ones, so a hand-edited JSON or a
stale export fails the build rather than reaching a slide.

**Layer 3 — retired figures.** Parity only checks figures that are *currently* wired up. It cannot
catch a superseded number surviving in prose. `tools/retired_figures.json` + `check_retired_figures.py`
close that: when a headline figure changes, the old value is added to the retired list in the same
commit, and the guard fails if it survives anywhere in living prose.

This layer earned its place immediately. The M5 heatmap originally shipped as an **illustrative
placeholder** carrying a placeholder pass count, pending a real sweep (an explicitly logged gap in
the 07-04 implementation report). When the real 56-scenario sweep was computed and the figure
became `5 of 56`, the guard had to catch every stale copy. It also caught something nobody
predicted: an archived builder still hard-coding the placeholder at 48pt bold red — which is why
the guard now scans **generator scripts as well as prose**. A build script carrying a wrong number
is caught before it can render a slide.

**Layer 4 — prose figures and deploy provenance.** `verify_prose_figures.py` checks that grouped
VND figures in living prose are figures the engine actually produces.
`check_deploy_freshness.py` verifies the deployed bundle's build marker against the repo — added
after the served site was found carrying a marker for a commit whose tree could not have produced
it, i.e. a deploy from an uncommitted working tree.

The through-line: **each guard exists because something specific slipped past the guards that
already existed.** None of them were speculative.

## What remains unproven

This is the honest part, and the reason this record's status is *in progress*.

- **The fresh-viewer test has not been run.** This is the only check that actually tests the thing
  that failed in July. The kit is built and ready (`facilitator/fresh-viewer-kit/`), the design is
  sound — a domain-adjacent colleague who did not attend July sits through the deck cold and
  attempts the M5 worksheet unaided. But it needs a human volunteer, and it has not happened.
  Everything above is a well-reasoned hypothesis about why July failed and what fixes it. **It is
  not yet evidence.** Presenter self-assessment cannot substitute: the presenter already knows the
  material, and the entire question is what a first-time listener absorbs. Tracked as **H5**.
- **The lender/investor gate thresholds are an illustrative band**, not calibrated against real
  Allotrope deal data. The heatmap's pass count is real arithmetic over real scenarios, but the
  gates that arithmetic is tested against are proxies. Tracked as **H3**.
- **The Vietnamese and Chinese decks are gated on translation.** `terminology-map.json` still
  carries `UNTRANSLATED` sentinels; the build refuses to proceed while any consumed key is
  untranslated, so a clean `--lang vi` / `--lang zh` run is itself the completeness check. Needs a
  qualified speaker, not a guess. Tracked as **H2**.
- **There is no working visual-regression gate.** No Linux pixel baselines are committed, so the
  `e2e:visual` CI step runs with `continue-on-error: true` and cannot fail. Tracked as **H6**.

All four are in the human-blocked register of `plans/2026-october-readiness-checklist.md`, which
`tools/check_human_blocked_register.py` parses weekly so a deadline raises an alarm on its own.

## The lesson, stated once

The July deck was **correct and unteachable**, and those are independent properties. The rebuild
treats teaching as a design problem with hard constraints (word caps, symbol budgets, one visual per
module) rather than as a presentation of finished analysis. The hardening work that followed treats
number provenance the same way — as something enforced by machinery, not by care.

The remaining risk is not in either of those. It is that the redesign has been validated against its
own internal logic and against the engine, but **never against a human being who did not already
know the answer.**
