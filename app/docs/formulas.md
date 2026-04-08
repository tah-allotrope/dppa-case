# Core formulas

## Volume logic

- `Q_match[t] = min(Q_load[t], Q_gen[t])`
- `Q_shortfall[t] = max(Q_load[t] - Q_gen[t], 0)`
- `Q_excess[t] = max(Q_gen[t] - Q_load[t], 0)`

## EVN payment

`EVN = sum(Q_match[t] * CFMP * KPP + Q_match[t] * CDPPA + Q_shortfall[t] * Retail)`

## Developer payment

`Developer = sum(Q_contract[t] * (Strike - FMP))`

## Total buyer cost

`Total = EVN + Developer`

## Baseline

`No DPPA = sum(Q_load[t] * Retail)`

## Intuition

If `Q_contract ~= Q_match` and `CFMP ~= FMP`, then the matched kWh cost trends toward:

`Strike + DPPA charge + loss adjustment`
