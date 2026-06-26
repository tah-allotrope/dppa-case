# 0001 — Starting point and teaching approach

**Date:** 2026-06-26
**Status:** active

## Context
User is preparing to teach/facilitate the CEBA "Session 5.2: Vietnam DPPA Pricing"
workshop (July 2026). Source deck `ceba/CEBA DPPA 2026.pptx` (44 slides, 6 modules) is
too wordy to teach from. User works at Allotrope clean-energy advisory — domain-adjacent,
not a beginner.

## Decisions
- **Mission set** ([MISSION.md](../MISSION.md)): own the DPPA settlement mechanics well
  enough to whiteboard each module in <5 min and field CFO/lender questions.
- **Teach module by module**, distilling each into one visual mental model.
- **Ground in repo insights**, not only the slides (user's explicit instruction): every
  lesson ties the concept to the live app (`dppa-case.web.app`), the settlement engine
  (`app/src/modules/settlement.js`), the verified 2025 number basis, and the buyer guide.
- **Aesthetic locked** to the deck (Material: Arial; teal #0097A7, amber #FFAB40, blue
  #4285F4, lime #EEFF41, ink #212121; white bg; 16:9) — captured in
  [NOTES.md](../NOTES.md) and `assets/course.css`.

## Workspace seeded
- `assets/course.css` (shared stylesheet), `assets/quiz.js` (retrieval-practice widget).
- `reference/dppa-glossary.html` (nomenclature — adhere to in every lesson).
- `lessons/0001-module-1-evn-baseline.html` (Module 1 delivered).

## Assumed prior knowledge (revise if wrong)
- Comfortable with solar/wind project basics, IRR, DSCR, CAPEX/debt structure.
- New-to-stick: the *Vietnam DPPA-specific* settlement mechanics (five-line bill, k vs
  K_pp, Q_Khc/Q_CfD volumes, the three gates).

## Progress
- ✅ Module 1 delivered (`lessons/0001`).
- ✅ Module 2 delivered (`lessons/0002`) — five-line bill, money-flow + volume-funnel +
  bill-composition SVGs, worked 50 MW example, tie to `buildFiveLineBill`.
- ✅ Module 3 delivered (`lessons/0003`) — CfD mechanics, 4 visuals (price-clamp, two-way
  directionality, escalation-crossover, hourly overlap), tie to `developer` settlement.
- ✅ Module 4 delivered (`lessons/0004`) — three gates, 4 visuals (bankable revenue,
  strike-line empty window, DSCR-by-year battery dip, capital structure), tie to
  `projectMultiYear` buyer gate + 56-scenario callout.
- ✅ Module 5 delivered (`lessons/0005`) — 3 canonical cases, 4 visuals (3 shapes,
  effective-rate vs BAU, financing 0-of-56, netting flow) + numbers table; tie directly to
  the live app's 3 scenarios + Workshop presets (this module IS the app).
- ✅ Module 6 delivered (`lessons/0006`) — finale, 4 visuals (course-journey, fixed-vs-
  negotiable, 5-decision checklist, price-anatomy capstone) + takeaways + community seed.
- Confirmed prefs (2026-06-26): **more visuals** (~4 per lesson) and **one module per
  session** — recorded in [NOTES.md](../NOTES.md).

## Status: ALL 6 MODULES COMPLETE (2026-06-26)
Full course delivered (`lessons/0001`–`0006`) + glossary reference + shared assets.

## Possible next sessions
- One-page printable cheat sheet (reference doc) distilling the whole course.
- Interleaved quiz across all 6 modules (storage strength via mixed retrieval).
- Mock negotiation role-play (skills/wisdom).
- Per-module deep dives on request (e.g. DSCR calc, USD-linked strike modelling).
