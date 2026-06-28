# 0003 — Group Workshop module (facilitated role-play exercise)

**Date:** 2026-06-29
**Status:** complete

## Context
The "possible next session" flagged in [0002](0002-scenario-training-track.md) — *mock
facilitation / role-play of the interactive exercise* — built out in full. Brainstorm →
plan → implementation:
- `research/2026-06-29_dppa-scenario-group-workshop-brainstorm.md`
- `plans/2026-06-29-dppa-scenario-group-workshop-plan.md`
- `research/2026-06-29_dppa-scenario-numbers-spec.md` (canonical numbers, source of truth)

Turns the solitary scenario lessons into a **live, facilitated ~90-min group workshop**:
role-based negotiation (off-taker vs developer), hand-compute-then-verify, full math, new
per-scenario animated visuals, trilingual learner artifacts + English facilitator kit.

## Key facts
- **Scenario 3 is new.** Neither July 2026 deck has a third worked scenario, so S3 = the
  third canonical case the deck names (To Teach slide 14: over-contract / excess earns nothing)
  and the app's `higherGen`. New numbers, reconciled to `settlement.js`:
  Q_KH 5,000,000 · gen 6,500,000 · FMP 1,100 · strike 1,250 →
  **C_EVN 8,304,644,000 · CfD +750,000,000 · C_KH 9,054,644,000** (excess 1,500,000 kWh →
  spot 1,663,200,000, foregone CfD 225,000,000).
- **Three-case spine:** S1 matched (CfD +500M) · S2 shortfall (CfD −800M, retail line 4) ·
  S3 excess (CfD +750M, excess earns nothing). Volume axis is the teaching spine; CfD sign
  follows FMP vs strike.
- App `workshop3` preset mirrors workshop1/2 and renders the bill penny-for-penny (verified live).

## What shipped
- ✅ **App:** `app/src/data/default-scenarios.js` — `workshop3` preset + `scenarioOrder`.
  Tests: `settlement.test.js` (workshop3 bill assertion), `profiles.test.js` (workshop3 profiles).
  **44/44 Vitest pass**, build clean (250 KB / 82 KB gzip), Workshop 3 verified in live app.
- ✅ **Visuals:** `build_cfd_slide.py` refactored to a `SCENARIOS` dict (consolidated + S1/S2/S3),
  per-scenario strike + FMP. Rendered `assets/cfd-s{1,2,3}-{en,vi,zh-cn}.gif` (+ `.mp4`) — 18 new
  assets. Consolidated outputs preserved (restored to avoid byte churn). All 3 charts visually verified.
- ✅ **Lessons (trilingual):** `lessons/0009` (Scenario 3), `0010` (group-workshop guide),
  `0011` (printable worksheets) in en / vi / zh-cn = 9 files. Reuse `course.css` + `quiz.js`.
  `0007`/`0008` updated: embedded animated charts + nav rewired into the new flow.
  All 11 pages 200 OK, correct lang, zero broken links/assets.
- ✅ **Facilitator kit (EN):** `facilitator/dppa-workshop-facilitator-guide.md` — run-of-show,
  script, full S1/S2/S3 answer keys, debrief prompts. (Q-002 default: kit English-only.)

## Decisions (from the brainstorm, DEC-001…014)
Live facilitated workshop · ~10–25 in sub-groups of 3–5 · role-based negotiation ·
hand-compute then verify · full 5-line + CfD + reconciliation · S1–S3 · new per-scenario
visuals (animated CfD + bill waterfall) · full facilitator kit · ~90 min · en/vi/zh-cn launch ·
S3 extracted-then-fallback to excess. Grill-Me defaults adopted: S3 = excess; learner-facing
trilingual, facilitator kit EN-only; commit only, **no Firebase deploy** (deferred to user).

## Status: COMPLETE (2026-06-29)
All six plan phases delivered and verified. App preset live-rendered; tests + build green;
lessons link-checked. Deploy intentionally deferred (Q-003) — committed, not pushed to hosting.
