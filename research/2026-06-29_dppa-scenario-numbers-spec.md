---
title: "DPPA Scenario Numbers — Canonical Spec (S1/S2/S3)"
date: "2026-06-29"
type: "reference"
source_request: "PHASE-01 of plans/2026-06-29-dppa-scenario-group-workshop-plan.md"
basis: "Decree 57/2025/ND-CP coefficients; verified 2025 fee/retail basis; reconciled to app/src/modules/settlement.js buildFiveLineBill"
---

# DPPA Scenario Numbers — Canonical Spec

**This is the single source of truth** for the group-workshop module. Every number in the
lessons, worksheets, answer keys, app presets, and visuals derives from here. Every figure below
is reproduced by `buildFiveLineBill()` in `app/src/modules/settlement.js`
(`lossFactorPrecise = 1.026 × 1.008 = 1.034208`).

## Shared constants (Decree 57/2025 + verified 2025 basis)
| Symbol | Value | Meaning |
|---|---|---|
| k | 1.026 | price-conversion coefficient |
| K_pp | 1.008 | loss conversion (110 kV) |
| k × K_pp | 1.034208 | combined loss factor used in line 1 (precise) |
| C_dppa_dv (service) | 360 VND/kWh | power-system service fee (line 2) |
| P_cl (clearing) | 163.30 VND/kWh | differential clearing fee (line 3) |
| fees (service+clearing) | 523.30 VND/kWh | fixed DPPA fees on every matched kWh |
| P1 (retail) | 2,204 VND/kWh | residual retail price (line 4) |

## Five-line bill formula (the spine)
1. **Market energy** `C_DN = Q_khc × FMP × k × K_pp`
2. **Service fee** `C_dppa = Q_khc × 360`
3. **Clearing fee** `C_cl = Q_khc × 163.30`
4. **Additional retail** `C_bl = (Q_KH − Q_khc) × 2,204`  *(shortfall only)*
5. **CfD** `C_CfD = (P_c − FMP) × Q_c`  *(signed: + = factory pays developer; − = developer pays factory)*
- `C_EVN = line1 + line2 + line3 + line4`
- `C_KH = C_EVN + C_CfD`
- Plant market revenue `= Q_c × K_pp × FMP`; plant total `= plant market + C_CfD`.

Notation: `Q_khc` = matched/settled volume billed on lines 1–3 and the CfD; `Q_KH` = total
consumption; shortfall `= Q_KH − Q_khc` (≥ 0).

---

## Scenario 1 — Matched (Load = Gen)
**Source:** deck S1 (Scenario Training slides 4–7); app `workshop1`; lesson `0007`.
**Story:** consumption exactly equals delivered RE; no residual EVN purchase (line 4 = 0). FMP just below strike → CfD positive, factory tops up developer.

- Inputs: `Q_c = Q_KH = 5,000,000` kWh · shortfall `0` · FMP `1,150` · strike `1,250`.

| # | Line | Calculation | VND/month |
|---|---|---|---:|
| 1 | Market energy | 5,000,000 × 1,150 × 1.034208 | 5,946,696,000 |
| 2 | Service fee | 5,000,000 × 360 | 1,800,000,000 |
| 3 | Clearing fee | 5,000,000 × 163.30 | 816,500,000 |
| 4 | Additional retail | 0 × 2,204 | 0 |
| | **C_EVN** | lines 1–4 | **8,563,196,000** |
| 5 | CfD | (1,250 − 1,150) × 5,000,000 | +500,000,000 |
| | **C_KH** | C_EVN + CfD | **9,063,196,000** |

- Effective ≈ **1,813 VND/kWh** (9,063,196,000 ÷ 5,000,000).
- Plant: market 5,796,000,000 (5,000,000 × 1.008 × 1,150) + CfD 500,000,000 = **6,296,000,000**.
- CfD direction: **FMP < strike → factory tops up developer (+)**.

## Scenario 2 — Shortfall (Load > Gen)
**Source:** deck S2 (Scenario Training slides 8–11); app `workshop2`; lesson `0008`.
**Story:** consumption exceeds contracted volume → residual 1M bought at retail (line 4 reappears). FMP above strike → CfD negative, developer pays factory.

- Inputs: `Q_c = 8,000,000` · `Q_KH = 9,000,000` · shortfall `1,000,000` · FMP `1,600` · strike `1,500`.

| # | Line | Calculation | VND/month |
|---|---|---|---:|
| 1 | Market energy | 8,000,000 × 1,600 × 1.034208 | 13,237,862,400 |
| 2 | Service fee | 8,000,000 × 360 | 2,880,000,000 |
| 3 | Clearing fee | 8,000,000 × 163.30 | 1,306,400,000 |
| 4 | Additional retail | 1,000,000 × 2,204 | 2,204,000,000 |
| | **C_EVN** | lines 1–4 | **19,628,262,400** |
| 5 | CfD | (1,500 − 1,600) × 8,000,000 | −800,000,000 |
| | **C_KH** | C_EVN + CfD | **18,828,262,400** |

- Effective ≈ **2,092 VND/kWh** (18,828,262,400 ÷ 9,000,000 consumed).
- Plant: market 12,902,400,000 (8,000,000 × 1.008 × 1,600) + CfD (−800,000,000) = **12,102,400,000**.
- CfD direction: **FMP > strike → developer pays factory (−)**.

## Scenario 3 — Excess / Over-generation (Load < Gen)  **[NEW]**
**Source:** Decision Q-001 fallback — neither July 2026 deck contains a third worked scenario, so S3 is the **third canonical case** the deck names explicitly (To Teach slide 14: *"Over-contract (Q_c > consumption) → CfD caps at consumed volume; excess earns nothing"*) and the app already models as `higherGen`. New app preset = `workshop3`; new lesson = `0009`.
**Story:** overbuilt solar / a sunny month — generation exceeds consumption. The factory consumes all matched RE (no shortfall, line 4 = 0), FMP is soft and below strike (CfD positive). The **excess generation settles nothing**: it earns the generator spot-only revenue and no CfD — the over-contracting/over-sizing risk.

- Consumption `Q_KH = 5,000,000` kWh · settled `Q_khc = 5,000,000` · shortfall `0` · FMP `1,100` · strike `1,250`.
- **Excess:** generation credited `6,500,000` kWh → excess `1,500,000` kWh (settles nothing).

| # | Line | Calculation | VND/month |
|---|---|---|---:|
| 1 | Market energy | 5,000,000 × 1,100 × 1.034208 | 5,688,144,000 |
| 2 | Service fee | 5,000,000 × 360 | 1,800,000,000 |
| 3 | Clearing fee | 5,000,000 × 163.30 | 816,500,000 |
| 4 | Additional retail | 0 × 2,204 | 0 |
| | **C_EVN** | lines 1–4 | **8,304,644,000** |
| 5 | CfD | (1,250 − 1,100) × 5,000,000 | +750,000,000 |
| | **C_KH** | C_EVN + CfD | **9,054,644,000** |

- Effective ≈ **1,811 VND/kWh** (9,054,644,000 ÷ 5,000,000 consumed).
- Plant (settled 5M): market 5,544,000,000 (5,000,000 × 1.008 × 1,100) + CfD 750,000,000 = **6,294,000,000**.
- **Excess analysis (the teaching crux):** 1,500,000 kWh excess → at generator meter 1,512,000 kWh → spot revenue 1,663,200,000 VND at FMP only, **no CfD**. Foregone CfD uplift on the excess = (1,250 − 1,100) × 1,500,000 = **225,000,000 VND** that the strike does *not* capture. Over-contracting buys terms for volume that cannot settle.
- CfD direction: **FMP < strike → factory tops up developer (+)**, same sign as S1 but the volume axis (excess) is the contrast.

---

## Three-case contrast (the negotiation/debrief anchor)
| | S1 Matched | S2 Shortfall | S3 Excess |
|---|---|---|---|
| Volume axis | Q_c = Q_KH | Q_c < Q_KH | gen > Q_KH (over-contract) |
| Line 4 (retail) | 0 | 2,204,000,000 | 0 |
| FMP vs strike | 1,150 < 1,250 | 1,600 > 1,500 | 1,100 < 1,250 |
| CfD | +500,000,000 | −800,000,000 | +750,000,000 |
| Who pays CfD | factory → developer | developer → factory | factory → developer |
| C_EVN | 8,563,196,000 | 19,628,262,400 | 8,304,644,000 |
| C_KH | 9,063,196,000 | 18,828,262,400 | 9,054,644,000 |
| Effective VND/kWh | ~1,813 | ~2,092 | ~1,811 |
| Risk lesson | strike must be bankable | shortfall always retail | excess earns nothing |

## Multi-year crossover
Crossover (year cumulative DPPA savings turn positive vs BAU at ~4%/yr EVN escalation) is computed
per scenario by `projectMultiYear()` and shown in the app's multi-year panel. It depends on the
daily load/solar curves, not the monthly bill, so it is **illustrative and read from the live app**
(not hand-computed in the worksheets). The monthly five-line bill above is the authoritative,
hand-checkable core.

## Reconciliation status
- S1, S2 reproduced by existing tests in `app/src/modules/settlement.test.js` (lines 279–325).
- S3 to be locked by a new test (PHASE-02) asserting C_EVN 8,304,644,000 / CfD +750,000,000 / C_KH 9,054,644,000 / plant total 6,294,000,000.
