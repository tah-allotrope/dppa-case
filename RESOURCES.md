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
- **October 2026 teaching deck** — `ceba/DPPA Presentation Oct 2026 To Teach.pptx`
  (27 slides, visual-first rebuild from the master). Numbers trace to
  `assets/teaching/spine-s1.json` (five-line bill) and `assets/teaching/gate-sweep.json`
  (56-scenario gate sweep, current result 5/56). Trust: HIGH (audited + parity-checked in CI).
- **Terminology map** — `assets/teaching/terminology-map.json` +
  `research/dppa-terminology-map.md`. The approved EN→VI→ZH vocabulary carrier for
  PHASE-06 (vi/zh-cn deck cloning) — translate here, not by hand-editing the deck script.

## Primary (external / regulatory)
- **Decree 57/2025/NĐ-CP** — DPPA framework (eligibility ≥22 kV, ≥200,000 kWh/mo, fee
  structure). Issued 2025-03-03 by the Government. Trust: HIGH (primary law, official
  text confirmed). Official text: https://vanban.chinhphu.vn/?pageid=27160&docid=213012
  (accessed 2026-07-17; see `research/2026-07-17_fmp-and-decree-sources.md`).
- **Circular 16/2025/TT-BCT** — settlement detail (FMP = SMP + CAN, 30-min intervals).
  Issued 2025-02-01 by MOIT, amended by Circular 36/2025/TT-BCT (2025-06-03). Trust:
  HIGH (primary regulation, official text confirmed). Official text:
  https://chinhphu.vn/?pageid=27160&docid=212947&classid=1&orggroupid=4 (accessed
  2026-07-17; consolidated text with the amendment:
  https://minhbach.moit.gov.vn/upload/2005517/20250610/VBHN_so_11_TT16TT36_quy_dinh_van_hanh_thi_truong_dien__clean___1__d56c8.pdf).
- **EAVCED public training** — source of the Module 2 worked example. Trust: MEDIUM.
- **NSMO / ERAV** — system operator / regulator for actual FMP series. FMP ~1,427 in
  `app/src/data/default-scenarios.js` remains **illustrative** (ASM-007 of
  `plans/2026-07-17-prose-parity-second-pipeline-plan.md`: never replaced by this
  research). NSMO/ERAV do not publish a raw per-interval FMP dataset, but periodic
  averages are reportable: 1,423.5 VND/kWh (first 7 months of 2024) and 1,255 VND/kWh
  (Q1 2026) — see `research/2026-07-17_fmp-and-decree-sources.md` for sources, dates,
  and a "how to cite on a slide" note. Trust: MEDIUM (press-reported NSMO-sourced
  averages, not a raw published series).

## Communities (wisdom)
- **CEBA / Clean Energy Buyers Association** network — buyer-side practitioners; good for
  pricing-assumption sanity checks. (Verify current Vietnam/APAC chapter or working group.)
- **Vietnam C&I renewables working groups** (e.g. via EuroCham/AmCham energy committees,
  RE100 members operating in VN) — developer + lender contacts to pressure-test the three gates.
- The deck's own **panel on risk allocation & bank financing** is the immediate live forum —
  bring Module 4's questions. (URLs to confirm before sharing.)

## Local-only source material

- `background/*.pdf`, `background/*.pptx` — early source PDFs/decks (Ecoplexus workshop deck,
  synthetic policy summary, a simplified CfD scenario deck) used while drafting this project.
  `background/` is gitignored; these files were tracked anyway by accident until 2026-07-25 and
  have since been untracked (`git rm --cached`, contents left on disk). They are not version
  controlled — do not rely on them being present in a fresh clone.

## Gaps to fill
- **Closed (2026-07-17):** Official Decree 57 / Circular 16 source URLs — see the
  "Primary (external / regulatory)" entries above and
  `research/2026-07-17_fmp-and-decree-sources.md`.
- **Bounded, not closed (2026-07-17):** No official NSMO/ERAV raw FMP dataset was found
  and confirmed accessible; two press-reported period averages exist instead (see
  above). The illustrative FMP 1,427 in the app is **not** replaced by this research
  (ASM-007). Re-check NSMO's own site (nsmo.vn) for a published series if this becomes
  load-bearing for a specific slide claim.
