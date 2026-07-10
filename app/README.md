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
npm run lint
npm run e2e
npm run build
```

Use `?present=1` for the high-contrast projector theme and `?teach=1` for the six-step presenter flow. New participants receive a four-step bilingual EN/VN tour.

## Regenerate teach-mode fallback recordings

```bash
npm run record:demos
```

Records all six `?teach=1` presenter demos as MP4s (with poster frames) via
Playwright + ffmpeg-static, writing to `../assets/teaching/fallback/teach-m{1..6}.mp4`
and `teach-m{1..6}-poster.png`. `build_oct_teaching_deck.py` embeds these on the
deck's hidden fallback slides automatically when present. Re-run this whenever
`src/data/teach-steps.js` or the underlying scenario numbers change, then rebuild
the deck (`PYTHONPATH= py build_oct_teaching_deck.py --lang en` from the repo root).

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
