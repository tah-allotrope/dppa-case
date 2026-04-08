# Vietnam DPPA Neon CFO Calculator

Static browser-based explainer for Vietnam synthetic DPPA settlement.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually `http://127.0.0.1:5173/`.

## Validate

```bash
npm test
npm run build
```

## What it shows

- hourly factory load vs solar generation overlap;
- matched volume, shortfall, and excess generation;
- selected-hour `BAU without DPPA` versus `DPPA payment` using the weighted 22 kV to below 110 kV retail tariff basis;
- payment to EVN, payment to developer, and cancellation effect formulas for the clicked hour;
- cancellation effect that simplifies aligned matched-kWh intuition toward `strike price + DPPA charge + loss adjustment`;
- settlement quantity modes to demonstrate overgeneration risk.

## Scope notes

- This is a finance-facing teaching tool, not a legal settlement engine.
- Version 1 uses hourly intervals and flat slider-driven prices for clarity.
- Firebase Hosting is a natural next deployment target because the app builds to static files.
