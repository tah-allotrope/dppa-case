---
title: "October 2026 Readiness Checklist — Coding-Session Tasks"
date: "2026-07-11"
status: "abandoned — 2026-08-29: at the user's direction, closed out. Remaining scope was gated on H2 (translator delivery: vi/zh deck builds, i18n:check, notes/numbers re-audit), H3 (gate recalibration: re-export sweep, re-render visuals, rebuild deck, retire the superseded pass count), and a close-to-session re-verification of the local build/preview fallback. None of that work is done; abandoning this file means it is no longer tracked here or anywhere else. The human-only counterpart, facilitator/october-run-plan.md (H1-H6 register, dry-runs, day-of logistics), is untouched by this closure and still governs the actual session prep."
plan_type: "checklist"
---

# October 2026 Readiness Checklist — Coding-Session Tasks

The presenter-facing, human-only counterpart to this file is
`facilitator/october-run-plan.md` — it carries the human-blocked register (H1-H6),
the dry-run/fresh-viewer/print-test items, and day-of logistics.
`tools/check_human_blocked_register.py` parses **that** file now, not this one.

This file holds only tasks a coding session can execute without a person's decision or physical
action. Everything here is backward-planned from the same assumed **October 1, 2026** session date
as the human-blocked register (still unconfirmed — see H1 in `facilitator/october-run-plan.md`).

## Already done

- [x] Six teach-mode fallback recordings (MP4 + poster), automated and
      regenerable via `cd app && npm run record:demos`
      (`plans/2026-07-10-october-readiness-hardening-plan.md` PHASE-02).
- [x] Real 56-scenario gate sweep behind the M5 heatmap — computed
      `assets/teaching/gate-sweep.json` (PHASE-03).
- [x] QR code on the close slide (PHASE-04).
- [x] Deck↔engine numbers parity check, wired into CI as the `deck-parity`
      job (PHASE-04).
- [x] Terminology map + fresh-viewer test kit (PHASE-05, this checklist).
- [x] Repo integrity: worksheet template and July reference deck tracked in
      git; stale Firebase cache untracked (PHASE-01).
- [x] App deployed and `sw.js` verified serving real JavaScript
      (`plans/2026-08-22-delivery-stall-recovery-plan.md` PHASE-02, 2026-08-23;
      supersedes the 2026-07-25 deploy this row used to cite).

## Once the translator (H2) delivers both files

- [ ] Run `PYTHONPATH= py build_oct_teaching_deck.py --lang vi` and
      `--lang zh` — the build refuses to proceed while any consumed key is
      still `UNTRANSLATED`, so a clean run is itself the completeness check.
- [ ] Run `PYTHONPATH= py build_teaching_visuals.py --lang vi` and `--lang
      zh` to refresh localized visuals if any translated wording changed
      chart captions.
- [ ] Confirm `cd app && npm run i18n:check` still passes (the string table
      must still match the frozen baseline — see
      `app/src/data/strings.baseline.json`) and
      `cd app && node scripts/i18n-report.mjs` reports 0 untranslated for
      both `vi` and `zh`.
- [ ] Re-run `PYTHONPATH= py audit_teaching_deck.py` and
      `PYTHONPATH= py verify_deck_numbers.py --lang vi --deck "ceba/DPPA Presentation Oct 2026 To Teach vi.pptx"`
      (and the `zh` equivalent) against each language build.
- [ ] Re-run `PYTHONPATH= py tools/check_terminology_numbers.py` to confirm the
      translator didn't hand-type a figure over a `{placeholder}` token.

## If the lender/investor gate proxies are recalibrated (H3)

- [ ] Re-run `cd app && node scripts/export-sweep.mjs`.
- [ ] Re-render visuals: `PYTHONPATH= py build_teaching_visuals.py --lang en`
      (and `vi`/`zh` if those builds already exist).
- [ ] Rebuild the deck: `PYTHONPATH= py build_oct_teaching_deck.py --lang en`.
- [ ] Update the pass-count references in
      `facilitator/dppa-workshop-facilitator-guide.md`, and add the
      superseded pass count to `tools/retired_figures.json`'s `retired` list
      in the same commit (`CLAUDE.md` §6).
- [ ] Re-run `python tools/check_retired_figures.py`,
      `python audit_teaching_deck.py`, and `python verify_deck_numbers.py` —
      all must pass before committing.

## Day-of technical confirmation (coding-verifiable part only)

- [x] Confirm venue wifi is not required: verified 2026-08-23 against the live
      deploy (`app/deployment.md`'s "Offline drill" section) — the service
      worker precaches the app and a reload while offline still renders all
      four charts. The *physical* re-confirmation at the actual venue is
      `facilitator/october-run-plan.md`'s job, not this file's.
- [ ] `cd app && npm run build && npm run preview` still serves the app
      locally as the wifi-independent local fallback — re-verify this is
      still true close to the session date, since dependencies may have
      moved.
