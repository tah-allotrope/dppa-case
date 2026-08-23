---
title: "October 2026 Run Plan — Presenter"
date: "2026-08-23"
status: "human-only; not tracked by tools/check_plan_status.py (this is a presenter's artifact, not a coding plan)"
---

# October 2026 Run Plan — Presenter

Split 2026-08-23 from the original `plans/2026-october-readiness-checklist.md`, which mixed
human-only, physical, date-bound work with coding-session tasks and made both harder to track
honestly. **This file is the human half.** The coding-session half is
`plans/2026-october-readiness-checklist.md`.

Backward-planned from an assumed **October 1, 2026** session date (Q-001 in
`research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` is still open — no confirmed
date/venue). Adjust the dates below if the real date is confirmed; the sequence and gates do not
change.

## Human-blocked register

`tools/check_human_blocked_register.py` parses this exact table every Monday
(`.github/workflows/freshness-checks.yml`) and fails the job if any row is overdue or due within 7
days — that failure is usually a real deadline, not a broken build. Every item here needs a
person, not a coding session.

| # | Item | Owner | Needed by | Blocks |
|---|---|---|---|---|
| H1 | Confirm session date & venue (Q-001, open since 2026-07-04) | Presenter | 2026-08-15 | every date below |
| H2 | Engage qualified VI/ZH translator for `assets/teaching/terminology-map.json` and `app/src/data/strings.js` (see `facilitator/translation-brief.md`) | Presenter | 2026-08-25 | localization (deck + app), late-Sept print run |
| H3 | Recalibrate lender/investor gate proxies with real Allotrope deal data — or accept the illustrative band | Presenter + Allotrope | 2026-09-01 | gate-sweep credibility work, M5 rehearsal |
| H4 | Firebase deploy credentials → enable the commented `deploy` job in `.github/workflows/ci.yml` | Presenter | 2026-09-08 | automated CI deploys (manual `npm run deploy` already works and has been used) |
| H5 | Schedule fresh-viewer volunteer (kit: `facilitator/fresh-viewer-kit/`) | Presenter | 2026-09-08 | content freeze (gate for 2026-09-15) |
| H6 | Trigger the `visual-bootstrap` `workflow_dispatch` job on GitHub Actions, download the Linux `-linux.png` baselines, and commit them to `app/e2e/visual.spec.js-snapshots/` (then remove `continue-on-error` from the `e2e:visual` step and delete the bootstrap job) | Presenter | 2026-08-15 | the real visual-regression gate; requires pushing/running a workflow, which an unattended coding session must not do |

Status legend: **done** (verified in a session and noted below) · **pending** · every row here is
**(human-only)** by definition — that is the point of this table.

## Early September (or ~8 weeks before the session)

- [ ] Open `ceba/DPPA Presentation Oct 2026 To Teach.pptx` in real PowerPoint; confirm the 6
      embedded MP4 fallback slides autoplay or are easy to click-to-play; confirm hidden-slide
      unhide/reveal works in slideshow mode.
- [x] Deploy the app so `https://dppa-case.web.app` reflects current work — most recently
      2026-08-23 (`plans/2026-08-22-delivery-stall-recovery-plan.md` PHASE-02), verified fresh by
      `python tools/check_deploy_freshness.py`. Re-verify close to the session date, since more
      commits will land before October.
- [ ] Decide on H3 (real deal data vs. accept the illustrative gate-proxy band). If recalibrating,
      the mechanical follow-through is a coding-session task — see the corresponding section of
      `plans/2026-october-readiness-checklist.md`.

## Mid September (~4–6 weeks before)

- [ ] Timed solo dry-run: the presenter runs the full 60-minute run-of-show alone, including a
      deliberate fallback drill (kill the app mid-M3, unhide the fallback slide, confirm the
      recording carries the point). Checklist already in
      `facilitator/dppa-workshop-facilitator-guide.md` under "Pre-session validation."
- [ ] Fresh-viewer test using `facilitator/fresh-viewer-kit/` — the direct test of the session's
      success criterion (DEC-003). Do not skip; do not simulate. If it fails, fix the specific
      module(s) it flags and re-run with a different volunteer before freezing.
- [ ] Physical duplex print test of `lessons/0012-reference-card/reference-card.html` and the
      worksheet handout on a real printer (A4, 0.75in margins).

## Content freeze (gated on the two dry-run items above passing)

- [ ] Declare EN content freeze. After this point, do not edit
      `build_oct_teaching_deck.py`'s `TEXT["en"]` dict or `build_teaching_visuals.py`'s English
      captions without re-running the fresh-viewer test — late edits after freeze triple the
      translation rework (CON-004 in the teaching-revamp plan).

## Late September (~1–2 weeks before)

- [ ] Translate the remaining `UNTRANSLATED` entries in both files per
      `facilitator/translation-brief.md`. A qualified VI/ZH speaker should do this, not a guess.
      Once delivered, the build/verify steps are a coding-session task — see
      `plans/2026-october-readiness-checklist.md`'s "Once the translator (H2) delivers both files."
- [ ] Print per-language A4 reference cards and worksheets, once the translated decks build clean.

## Day before / day of

- [ ] Bring printed A4 cards + worksheets (per language mix of the actual audience).
- [ ] Bring a laptop with the deck, the local app build, and this repo checked out (in case a
      last-minute number needs re-verifying against `assets/teaching/spine-s1.json` or
      `gate-sweep.json`).
- [ ] Venue offline drill: load `https://dppa-case.web.app` once on the presenter laptop and on one
      phone at the actual venue, then enable airplane mode and confirm the app still loads and the
      five-line bill still renders. A synthetic version of this (headless browser, simulated
      offline) already passed against the live deploy on 2026-08-23 — see the "Offline drill"
      section of `app/deployment.md` — but the real venue network is the test that matters.
