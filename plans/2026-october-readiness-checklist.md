---
title: "October 2026 Readiness Checklist"
date: "2026-07-11"
status: "open — a live pre-session checklist: 5 human-blocked register items (H1-H5) are still pending, and every Mid-September, content-freeze, late-September, and day-of item remains unticked as of 2026-07-31"
plan_type: "checklist"
---

# October 2026 Readiness Checklist

Backward-planned from an assumed **October 1, 2026** session date (Q-001 in
`research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` is still
open — no confirmed date/venue as of this checklist's writing, 2026-07-11).
Adjust the dates below if the real date is confirmed; the sequence and gates
do not change.

## Human-blocked register

Every item below needs a person, not a coding session — dates are
backward-planned from the same assumed **October 1, 2026** session date as
the rest of this checklist (ASM-008 of
`plans/2026-07-17-prose-parity-second-pipeline-plan.md`) and move together if
the real date is confirmed.

| # | Item | Owner | Needed by | Blocks |
|---|---|---|---|---|
| H1 | Confirm session date & venue (Q-001, open since 2026-07-04) | Presenter | 2026-08-15 | every date below |
| H2 | Engage qualified VI/ZH translator for `assets/teaching/terminology-map.json` | Presenter | 2026-08-25 | localization (deck + app), late-Sept print run |
| H3 | Recalibrate lender/investor gate proxies with real Allotrope deal data — or accept the illustrative band | Presenter + Allotrope | 2026-09-01 | gate-sweep credibility work, M5 rehearsal |
| H4 | Firebase deploy credentials → enable the commented `deploy` job in `.github/workflows/ci.yml` | Presenter | 2026-09-08 | QR codes pointing at a current build |
| H5 | Schedule fresh-viewer volunteer (kit: `facilitator/fresh-viewer-kit/`) | Presenter | 2026-09-08 | content freeze (gate for 2026-09-15) |

Status legend: **[x] done** (verified in this session or an earlier one) ·
**[ ] pending** · **(human-only)** = cannot be executed by an autonomous
coding session, needs a person with a browser/PowerPoint/printer.

## Already done (as of 2026-07-11, ahead of the original early-September target)

- [x] Six teach-mode fallback recordings (MP4 + poster), automated and
      regenerable via `cd app && npm run record:demos`
      (`plans/2026-07-10-october-readiness-hardening-plan.md` PHASE-02).
- [x] Real 56-scenario gate sweep behind the M5 heatmap — computed
      `assets/teaching/gate-sweep.json`, current result **5 of 56** (PHASE-03).
- [x] QR code on the close slide (PHASE-04).
- [x] Deck↔engine numbers parity check, wired into CI as the `deck-parity`
      job (PHASE-04).
- [x] Terminology map + fresh-viewer test kit (PHASE-05, this checklist).
- [x] Repo integrity: worksheet template and July reference deck tracked in
      git; stale Firebase cache untracked (PHASE-01).

## Early September (or ~8 weeks before the session)

- [ ] **(human-only)** Open `ceba/DPPA Presentation Oct 2026 To Teach.pptx`
      in real PowerPoint; confirm the 6 embedded MP4 fallback slides autoplay
      or are easy to click-to-play; confirm hidden-slide unhide/reveal works
      in slideshow mode.
- [x] **(human-only)** Deploy the app (`cd app && npm run predeploy` then the
      Firebase deploy command in `app/deployment.md`) so
      `https://dppa-case.web.app` reflects the teach-mode banner, presenter
      theme, and current scenario numbers. — done 2026-07-25, verified by
      `python tools/check_deploy_freshness.py` (PASS, commit `22bae59`, no
      `-dirty` marker; see `app/deployment.md`'s Last Deploy table).
- [ ] If the illustrative lender/investor gate proxy constants in
      `app/scripts/export-sweep.mjs` (currently 1,380 / 1,450 VND/kWh) should
      be recalibrated with real developer economics, do it now — re-run
      `node scripts/export-sweep.mjs`, re-render visuals
      (`PYTHONPATH= py build_teaching_visuals.py --lang en`), rebuild the
      deck, and update the two facilitator-guide references to the pass
      count (`facilitator/dppa-workshop-facilitator-guide.md`).

## Mid September (~4–6 weeks before)

- [ ] **(human-only)** Timed solo dry-run: the presenter runs the full
      60-minute run-of-show alone, including a deliberate fallback drill
      (kill the app mid-M3, unhide the fallback slide, confirm the recording
      carries the point). Checklist already in
      `facilitator/dppa-workshop-facilitator-guide.md` under "Pre-session
      validation."
- [ ] **(human-only)** Fresh-viewer test using
      `facilitator/fresh-viewer-kit/` — the direct test of the session's
      success criterion (DEC-003). Do not skip; do not simulate. If it
      fails, fix the specific module(s) it flags and re-run with a different
      volunteer before freezing.
- [ ] **(human-only)** Physical duplex print test of
      `lessons/0012-reference-card/reference-card.html` and
      `m5-worksheet.html` on a real printer (A4, 0.75in margins).

## Content freeze (gated on the two items above passing)

- [ ] Declare EN content freeze. After this point, do not edit
      `build_oct_teaching_deck.py`'s `TEXT["en"]` dict or
      `build_teaching_visuals.py`'s English captions without re-running the
      fresh-viewer test — late edits after freeze triple the translation
      rework (CON-004 in the teaching-revamp plan).

## Late September (~1–2 weeks before)

- [ ] Translate the remaining `UNTRANSLATED` entries in
      `assets/teaching/terminology-map.json` (31 VI / 33 ZH entries as of
      this checklist — see `research/dppa-terminology-map.md` for the
      already-sourced vocabulary to reuse). A qualified VI/ZH speaker should
      do this, not a guess.
- [ ] Run `PYTHONPATH= py build_oct_teaching_deck.py --lang vi` and
      `--lang zh` — the build now refuses to proceed while any consumed key
      is still `UNTRANSLATED`, so a clean run is itself the completeness
      check.
- [ ] Run `PYTHONPATH= py build_teaching_visuals.py --lang vi` and `--lang
      zh` to refresh localized visuals if any translated wording changed
      chart captions.
- [ ] Print per-language A4 reference cards and worksheets.
- [ ] Translate `app/src/data/strings.js`'s `vi`/`zh` values alongside
      `assets/teaching/terminology-map.json`, then re-run
      `cd app && npm run i18n:report` to confirm the untranslated count is 0
      for both languages.
- [ ] Re-run `PYTHONPATH= py audit_teaching_deck.py` and
      `PYTHONPATH= py verify_deck_numbers.py` against each language build.

## Day before / day of

- [ ] Confirm venue wifi is not required: `cd app && npm run build && npm run
      preview` serves the app locally; the deck's hidden fallback slides are
      the wifi-independent backup for every app moment.
- [ ] Bring printed A4 cards + worksheets (per language mix of the actual
      audience).
- [ ] Bring a laptop with the deck, the local app build, and this repo
      checked out (in case a last-minute number needs re-verifying against
      `assets/teaching/spine-s1.json` or `gate-sweep.json`).
