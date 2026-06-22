# Core formulas

## Volume logic

- `Q_match[t] = min(Q_load[t], Q_gen[t])`
- `Q_shortfall[t] = max(Q_load[t] - Q_gen[t], 0)`
- `Q_excess[t] = max(Q_gen[t] - Q_load[t], 0)`

## EVN payment

`EVN = sum(Q_match[t] * FMP[t] * lossFactor + Q_match[t] * CDPPA + Q_shortfall[t] * Retail)`

Where `lossFactor = k × K_pp = 1.026 × 1.008 = 1.0342` (Decree 57/2025).
k converts generator-meter FMP to buyer-side price; K_pp converts generator-meter output to buyer-side volume. Both are folded into one coefficient in the app.

## Developer payment (CfD)

`Developer = sum(Q_contract[t] * (Strike - FMP[t]))`

Two-way: positive when Strike > FMP (buyer tops up); negative when Strike < FMP (developer pays back).

## Total buyer cost

`Total = EVN + Developer`

## Baseline (no DPPA)

`No DPPA = sum(Q_load[t] * Retail)`

## Cancellation intuition

If `Q_contract ≈ Q_match` and `FMP[t] ≈ FMP_avg`, the matched-kWh cost trends toward:

`Strike + DPPA charge + loss adjustment`

where `loss adjustment = FMP * lossFactor - FMP`.

## Multi-year projection

```
for year n in [1 .. years]:
  retailTariff_n = retailTariff_base * (1 + evnEscalation)^(n-1)
  strikePrice_n  = strikePrice_base  * (1 + strikeEscalation)^(n-1)
  annual_bau_n   = sum(Q_load * retailTariff_n) * 365
  annual_dppa_n  = calculateSettlement(inputs with _n values).totalCost * 365

cumulative savings at horizon H = sum(annual_bau_n - annual_dppa_n) for n in [1..H]
```

FMP is held flat across years (teaching simplification; no market escalation forecast).
