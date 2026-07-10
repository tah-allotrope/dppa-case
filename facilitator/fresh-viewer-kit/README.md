# Fresh-Viewer Test Kit

This kit exists so the one validation step that actually proves the October
2026 redesign works — DEC-031 / PHASE-05 in
`plans/2026-07-10-october-readiness-hardening-plan.md` — can be scheduled with
a single link to this folder, instead of re-explaining the test from scratch
each time.

## What this test is

The July 2026 session failed because the audience got lost in symbol overload
at Module 2 and never recovered (see
`research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md`). The October
rebuild's stated success criterion (DEC-003) is:

> By the end of Module 5, a participant can hand-compute (and app-verify) a
> simple monthly settlement for a given FMP/strike/load **without the
> presenter re-explaining the symbols.**

A fresh-viewer test is the only way to check this before the real session: a
colleague who did **not** attend the July session sits through the deck as if
they were a real participant, then attempts the Module 5 worksheet unaided.
Self-assessment by the presenter (who already knows the material) cannot
substitute for this — the whole point is testing what a first-time listener
actually absorbs.

## Who to recruit

- **Recommended default:** any Allotrope colleague, or a friendly external
  contact (CEBA network, EuroCham/AmCham energy committee contact) who is
  domain-adjacent (understands basic energy/finance concepts) but has **not**
  seen this deck, the app, or the July session.
- They do not need Vietnam DPPA expertise — the whole point is testing
  whether the deck teaches the mechanics from a cold start.

## What to send them beforehand

Nothing. That is the point — a fresh viewer sees exactly what an October
participant will see, with no advance briefing.

## Running the session (~65 minutes)

1. **Setup (5 min, presenter only, before the volunteer arrives):**
   - Open `ceba/DPPA Presentation Oct 2026 To Teach.pptx` in PowerPoint,
     slideshow mode.
   - Open the live app in a second window: https://dppa-case.web.app/?present=1
     (or run `cd app && npm run preview` locally if testing offline resilience
     too).
   - Print or have on-screen: `lessons/0012-reference-card/m5-worksheet.html`
     (the Module 5 hand-compute exercise).
   - Have `rubric.md` (this folder) open for the presenter to fill in live —
     do not let the volunteer see it.
2. **Run the session (~60 min):** follow the "Modules 1–6 Teaching Session"
   run-of-show in `facilitator/dppa-workshop-facilitator-guide.md` exactly as
   written for the real session — same pacing, same checkpoint questions,
   same app moments. Do not skip steps or offer extra explanation beyond what
   the script calls for; if you find yourself over-explaining, note it (that
   is itself a finding).
3. **Module 5 exercise (10 min, embedded in step 2):** hand the volunteer the
   worksheet exactly as described in the run-of-show. Do not help unless they
   are completely stuck for more than 60 seconds — note it if you do.
4. **Immediately after:** have the volunteer fill out `feedback-form.md`
   without conferring with the presenter first.
5. **Score the result** against `rubric.md`.

## Files in this kit

- `rubric.md` — the pass/fail bar and what to record during the session.
- `feedback-form.md` — structured questions for the volunteer, filled out
  immediately after, before any debrief conversation.

## What happens with the result

- **Pass:** proceed to EN content freeze (per DEC-018), then PHASE-06
  (vi/zh-cn cloning) can start.
- **Fail or partial:** do not freeze. Fix the specific module(s) that lost
  the volunteer (per the rubric's per-module breakdown), then re-run this
  same kit with a different fresh volunteer before freezing.
- Either way, record the outcome — a completed `rubric.md` and
  `feedback-form.md` pair, dated — so there is a paper trail proving the
  validation happened and what it found.
