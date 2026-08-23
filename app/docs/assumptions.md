# CFO calculator assumptions

## Purpose
The calculator is a buyer explainer and live workshop tool, not a legal settlement engine.
It teaches the five-line Vietnam virtual-DPPA settlement and the FMP cancellation effect.
Version 1 uses hourly intervals and flat slider-driven prices for clarity.

## Verified 2026 reference values
Source: `research/2026-06-22_vietnam-dppa-2026.md`

| Parameter | Value | Source |
|---|---|---|
| EVN retail average (excl. VAT) | **2,204.07 VND/kWh** | Decision 599/QD-EVN, 10 May 2025 (+4.8% from 2,103.12) |
| Fixed DPPA service fee (C_DPPA_đv) | **360 VND/kWh** | EVN annual notice (Decree 57/2025 basis) |
| Difference/balancing fee (P_cl) | **163.3 VND/kWh** | EVN annual notice (VWEM rules) |
| Combined fixed fees | **523.3 VND/kWh** | 360 + 163.3 |
| Price conversion factor (k) | **1.026** | Decree 57/2025 reference |
| Loss conversion factor (K_pp, ≥22–<110 kV) | **1.008** | Decree 57/2025 reference |
| Combined loss/price factor (k × K_pp) | **1.0342** | Used as `lossFactor` in code |
| EVN tariff escalation (historical) | **~4%/yr** | 2015-2024 trend |

## Illustrative values (not publicly sourced)
| Parameter | App default | Notes |
|---|---|---|
| Average FMP / market price | **1,427 VND/kWh** | Deck 2025 reference; FMP = SMP + CAN (Circular 16/2025); no NSMO/ERAV primary source available — **treat as illustrative** |
| Developer strike price | **2,000 VND/kWh** | Deck Case 6 reference offer; illustrative teaching value showing "Year 1 ≥ BAU" |
| FMP curve shape | Synthetic bell | Demo data; not a published Vietnam market curve |

## Architecture notes
- Settlement interval: app uses **hourly** for teaching clarity; VWEM operates on **30-minute** intervals (Circular 16/2025/TT-BCT, amended by 36/2025).
- Retail tariff: flat slider in v1 (not full TOU table). The 2,204 VND/kWh represents the weighted average basis.
- FMP is held flat across years in the multi-year projection; escalation only applies to retail tariff (→ BAU + shortfall) and strike price.
- Internal math stays in VND; USD display divides by 26,500 (`EXCHANGE_RATE` in
  `app/src/modules/formatters.js`, as of 2026-08-23 — not a live/sourced rate; see the provenance
  comment on the constant).
- Loss factor is folded into one coefficient (`k × K_pp`). The underlying split is k (price conversion) = 1.026 and K_pp (grid loss, ≥22–<110 kV) = 1.008.
