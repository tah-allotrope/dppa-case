# Resources

Trusted sources grounding the lessons. Repo artifacts are first-class here because the
mission is to teach *this* deck, and the repo already encodes the verified mechanics.

## Primary (this repo)
- **Source deck** — `ceba/CEBA DPPA 2026.pptx` (44 slides, 6 modules). The thing being taught.
  Trust: HIGH (authored by Allotrope for the workshop).
- **Live app** — https://dppa-case.web.app. Interactive 3 canonical cases + multi-year
  crossover + Workshop 1/2 presets. Trust: HIGH (verified vs deck, penny-for-penny).
- **Settlement engine** — `app/src/modules/settlement.js`. The mechanics as executable
  code (five-line bill, CfD, multi-year). Trust: HIGH (tested).
- **Verified number basis** — `app/src/data/default-scenarios.js` + `deck-qa/consolidation-map.md`.
  Retail 2,204 · fees 523.3 · loss 1.0342 · strike 2,000 · FMP ~1,427 (illustrative).
- **Buyer guide** — `reports/2026-04-07-vietnam-dppa-buyer-guide.md`. Narrative companion.

## Primary (external / regulatory)
- **Decree 57/2025/ND-CP** — DPPA framework (eligibility ≥22 kV, ≥200,000 kWh/mo, fee
  structure). Trust: HIGH (primary law). *Cited in deck; obtain official text to verify.*
- **Circular 16/2025/TT-BCT** — settlement detail (FMP = SMP + CAN, 30-min intervals).
  Trust: HIGH (primary regulation).
- **EAVCED public training** — source of the Module 2 worked example. Trust: MEDIUM.
- **NSMO / ERAV** — system operator / regulator for actual FMP series. NOTE: FMP ~1,427
  is **illustrative**; primary FMP data is not publicly published. Trust: N/A (gap).

## Communities (wisdom)
- **CEBA / Clean Energy Buyers Association** network — buyer-side practitioners; good for
  pricing-assumption sanity checks. (Verify current Vietnam/APAC chapter or working group.)
- **Vietnam C&I renewables working groups** (e.g. via EuroCham/AmCham energy committees,
  RE100 members operating in VN) — developer + lender contacts to pressure-test the three gates.
- The deck's own **panel on risk allocation & bank financing** is the immediate live forum —
  bring Module 4's questions. (URLs to confirm before sharing.)

## Gaps to fill
- Official Decree 57 / Circular 16 source URLs (currently cited second-hand via the deck).
- A public or proxy FMP time series to replace the illustrative ~1,427 figure.
