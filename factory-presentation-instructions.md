# Factory DPPA Presentation — PowerPoint Build Instructions

## Context

This repo (`dppa-case`) contains a **Vietnam synthetic DPPA CFO visual explainer** web app. The app teaches factory CFOs how DPPA settlement works: load vs solar matching, EVN + developer payments, and the FMP cancellation effect.

You need to build a polished PowerPoint (`.pptx`) that mirrors the web app's content and can be presented to a factory's finance/procurement team. The audience is a **non-technical CFO or factory energy buyer** in Vietnam considering a synthetic DPPA.

## Existing reference material

- **Existing case-study deck**: `dppa-web-app-case-study.pptx` — a 14-slide deck already exists. Use it as a starting template/reference for the Allotrope brand style (teal/dark-blue section dividers, green accents, white content slides with green header rule, confidential footer).
- **Slide screenshots**: `deck-qa/slide-01.png` through `slide-14.png` show the current deck visually.
- **Web app screenshots**: `desktop-current.png`, `current-app-screenshot.png` show the live app.
- **Logo**: `app/logo/allotrope logo.png` and `app/public/brand/allotrope-logo.png`.
- **Background PPTX**: `background/Simplified DPPA CfD Settlement Scenario .pptx` — an earlier simplified version.

## Source data (from the web app code)

All numbers below come from `app/src/data/default-scenarios.js` and `app/src/modules/settlement.js`. Use these exact values.

### Default pricing inputs

| Parameter | Value | Unit |
|-----------|-------|------|
| Strike price (Pc) | 2,100 | VND/kWh |
| Market price / FMP midpoint | 1,700 | VND/kWh |
| DPPA charge (C_DPPA) | 523.34 | VND/kWh |
| Loss factor (Kpp) | 1.027263 | dimensionless |
| Retail tariff | 2,100 | VND/kWh |
| Settlement mode | Matched consumption | — |

### Three scenarios (same prices, different load/solar profiles)

**Scenario A — Load > Gen (higherLoad)**
- Load: 4,300–6,100 kWh/h (night low to daytime peak)
- Solar peak: 4,200 kWh @ 12:00
- Risk: High shortfall volume bought at retail tariff

**Scenario B — Load = Gen (balanced)**
- Load: 3,000–4,700 kWh/h
- Solar peak: 4,700 kWh @ 12:00
- Risk: Best match, minimal shortfall/excess

**Scenario C — Load < Gen (higherGen)**
- Load: 2,600–3,600 kWh/h
- Solar peak: 6,200 kWh @ 12:00
- Risk: Overgeneration creates settlement quantity risk

### Hourly FMP curve shape

The web app uses a synthetic daily FMP shape with multipliers on the midpoint (1,700):
- Off-peak (00–04): ~0.68–0.72x → ~1,156–1,224 VND/kWh
- Morning ramp (05–09): ~0.78–0.97x → ~1,326–1,649 VND/kWh
- Midday (10–14): ~1.00–1.15x → ~1,700–1,955 VND/kWh
- Afternoon/evening peak (15–19): ~1.18–1.42x → ~2,006–2,414 VND/kWh
- Evening decline (20–23): ~0.80–1.30x → ~1,360–2,210 VND/kWh

### Core formulas

**Volume decomposition (per hour t):**
```
Matched[t]   = min(Load[t], Gen[t])
Shortfall[t] = max(Load[t] - Gen[t], 0)
Excess[t]    = max(Gen[t] - Load[t], 0)
```

**EVN payment:**
```
EVN = Matched x FMP x Kpp  +  Matched x C_DPPA  +  Shortfall x Retail
```

**Developer CfD payment:**
```
Developer = ContractQty x (Strike - FMP)
```

**Total DPPA cost:**
```
Total = EVN + Developer
```

**Cancellation insight (when contract qty = matched volume):**
```
EVN Market + EVN DPPA + CfD
= Q x FMP + Q x C_DPPA + Q x (Strike - FMP)
= Q x FMP + Q x C_DPPA + Q x Strike - Q x FMP
= Q x Strike + Q x C_DPPA          ← FMP cancels out
```

**Implied cost per matched kWh:**
```
Strike + DPPA charge + loss adjustment = 2,100 + 523.34 + ~46 = ~2,670 VND/kWh
```

**BAU baseline:**
```
No-DPPA cost = Load x Retail tariff
```

### Worked example numbers (Scenario B, hour 12:00, balanced)

| Component | Formula | Amount (VND) |
|-----------|---------|-------------|
| EVN Market | 4,700 kWh x 1,836 x 1.027 | 8,866,517 |
| EVN DPPA Charge | 4,700 kWh x 523.34 | 2,459,698 |
| EVN Retail Shortfall | 0 kWh x 2,100 | 0 |
| **EVN Total** | Market + DPPA + Retail | **11,326,215** |
| Developer CfD | 4,700 kWh x (2,100 - 1,836) | 1,240,800 |
| **Net DPPA Payment** | EVN + Developer | **12,567,015** |
| BAU Retail Baseline | 4,700 kWh x 2,100 | 9,870,000 |
| **Savings vs BAU** | BAU - DPPA | **-2,697,015** |

### Worked example (Scenario B, hour 07:00, shortfall)

| Component | Formula | Amount (VND) |
|-----------|---------|-------------|
| EVN Market | 833 kWh x 1,496 x 1.027 | 1,280,293 |
| EVN DPPA Charge | 833 kWh x 523.34 | 435,942 |
| EVN Retail Shortfall | 3,167 kWh x 2,100 | 6,650,700 |
| **EVN Total** | | **8,366,935** |
| Developer CfD | 833 kWh x (2,100 - 1,496) | 503,132 |
| **Net DPPA Payment** | | **8,870,067** |
| BAU Baseline | 4,000 kWh x 2,100 | 8,400,000 |
| **Savings vs BAU** | | **-470,067** |

### Worked example (Scenario C, hour 12:00, excess/overgen)

| Component | Formula | Amount (VND) |
|-----------|---------|-------------|
| EVN Market | 3,600 kWh x 1,836 x 1.027 | 6,782,251 |
| EVN DPPA Charge | 3,600 kWh x 523.34 | 1,884,024 |
| EVN Retail Shortfall | 0 kWh x 2,100 | 0 |
| **EVN Total** | | **8,666,275** |
| Developer CfD (matched mode) | 3,600 kWh x (2,100 - 1,836) | 950,400 |
| **Net DPPA Payment** | | **9,616,675** |
| BAU Baseline | 3,600 kWh x 2,100 | 7,560,000 |
| **Savings vs BAU** | | **-2,056,675** |

Note: In generation-mode settlement, contract quantity = 6,200 kWh so CfD rises to 1,636,800 VND. Factory pays more despite excess solar.

## Slide deck structure

Build **~18-20 slides** using the `/pptx` skill. Follow the existing deck's visual language: teal (#1e4d5c) section dividers with green (#4CAF50) numbered headers, white content slides with a green top rule, and a confidential footer on every content slide.

### Slide 1 — Title
- "Vietnam Synthetic DPPA — Factory Energy Proposal"
- Subtitle: "Hourly Matching, Settlement Mechanics & Cost Transparency"
- Date: May 2026
- Allotrope branding

### Slide 2 — Agenda
- Numbered list: (1) What is a Synthetic DPPA? (2) How Load & Solar Match (3) Three Factory Scenarios (4) Hour-by-Hour Settlement Math (5) The FMP Cancellation Effect (6) Daily Cost Comparison (7) Key Risks & Mitigations (8) Next Steps

### Slide 3 — What is a Synthetic DPPA?
- Brief explanation: factory stays connected to EVN grid, separately signs a CfD swap with a solar developer
- Two payment streams: (1) EVN for grid electricity, (2) Developer for CfD settlement
- Renewable energy certificates (RECs) transfer to factory
- Simple diagram: Factory <-> EVN (grid payment) and Factory <-> Developer (CfD swap)

### Slide 4 — Section Divider: "01 — Daily Load & Solar Profile"

### Slide 5 — Load vs Solar Overlap Chart
- Create a chart showing the 24-hour profile for Scenario B (balanced)
- Factory load (cyan/teal area), Solar generation (amber/gold area), matched overlap region
- Label: "Factory load (cyan), Solar generation (amber), Matched volume (overlap)"
- Include the FMP curve as a secondary axis line (magenta)

### Slide 6 — Three Synthetic Scenarios Table
- Table with columns: Scenario | Label | Daytime Load Range | Peak Solar | Risk Highlight
- A: Load > Gen | 5,200-6,100 kWh | 4,200 kWh @ 12:00 | High shortfall -> retail tariff exposure
- B: Load = Gen | 3,900-4,700 kWh | 4,700 kWh @ 12:00 | Best match -> minimal shortfall/excess
- C: Load < Gen | 3,100-3,600 kWh | 6,200 kWh @ 12:00 | Overgeneration -> settlement quantity risk

### Slide 7 — Section Divider: "02 — Hour-by-Hour Matching"

### Slide 8 — Matching, Shortfall & Excess
- Bullet definitions:
  - Matched volume = min(Load, Generation)
  - Shortfall = max(Load - Generation, 0) -> bought at retail tariff
  - Excess = max(Generation - Load, 0) -> not credited under matched-mode settlement
  - Contract quantity (matched mode) = matched volume
  - Contract quantity (generation mode) = generation volume -> overgeneration risk
- Three KPI cards: Scenario B daily matched 33.1k kWh | Shortfall 58.2k kWh | Excess 0 kWh

### Slide 9 — Section Divider: "03 — Per-Hour Settlement Arithmetic"

### Slide 10 — Pricing Assumptions
- KPI cards row: Strike 2,100 VND/kWh | Market/FMP 1,700 VND/kWh | DPPA Charge 523 VND/kWh
- Additional: Loss factor Kpp = 1.027 | Retail tariff = 2,100 VND/kWh | Settlement mode: Matched consumption
- Note: "2025 teaching model — synthetic FMP curve, flat retail tariff"

### Slide 11 — Settlement Walkthrough: Balanced Hour (12:00)
- Full table from the worked example above (Scenario B, hour 12:00)
- Header: "Scenario B | Load 4,700 kWh | Solar 4,700 kWh | Perfect match | FMP 1,836 VND/kWh"
- Highlight Net DPPA Payment in green, Savings vs BAU in red

### Slide 12 — Settlement Walkthrough: Shortfall Hour (07:00)
- Full table from worked example (Scenario B, hour 07:00)
- Header: "Scenario B | Load 4,000 kWh | Solar 833 kWh | Shortfall 3,167 kWh | FMP 1,496 VND/kWh"

### Slide 13 — Settlement Walkthrough: Excess Hour (12:00, Scenario C)
- Full table from worked example (Scenario C, hour 12:00)
- Header: "Scenario C | Load 3,600 kWh | Solar 6,200 kWh | Excess 2,600 kWh | FMP 1,836 VND/kWh"
- Footnote: "In generation-mode settlement, contract quantity = 6,200 kWh -> CfD rises to 1,636,800 VND. Factory pays more despite excess solar."

### Slide 14 — Section Divider: "04 — The FMP Cancellation Effect"

### Slide 15 — Why FMP Mostly Cancels Out
- Step-by-step algebra:
  ```
  Total cost per matched kWh (ignoring loss factor):
  EVN Market + EVN DPPA + CfD
  = (Q x FMP) + (Q x C_DPPA) + Q x (Strike - FMP)
  = Q x FMP + Q x C_DPPA + Q x Strike - Q x FMP
  = Q x Strike + Q x C_DPPA
  ```
- Bullet points:
  - FMP terms cancel exactly when contract quantity equals matched volume
  - Loss factor adds a tiny residual: FMP x (Kpp - 1)
  - Shortfall hours break the clean cancellation (retail tariff replaces strike on unmatched kWh)
  - Overgeneration breaks it (contract quantity exceeds matched volume)
- Two KPI cards: Implied cost/kWh (Strike + DPPA) = 2,623 VND | With loss factor @ avg FMP = 2,670 VND

### Slide 16 — Section Divider: "05 — Scenario Comparison — Daily Totals"

### Slide 17 — Daily Cost Comparison Table
- Table with columns: Metric | Scenario A (Load>Gen) | Scenario B (Balanced) | Scenario C (Load<Gen)
- Rows: Daily Load | Daily Matched | Daily Shortfall | Daily Excess | EVN Total | Developer CfD | Net DPPA Cost | BAU Baseline | Savings vs BAU | Matched kWh Price | Blended Price
- Run the settlement engine mentally for all three scenarios using the profiles from `default-scenarios.js` with the default inputs — or use placeholder "calculate from app" markers and note that the presenter should fill from the live app

### Slide 18 — Key Risks & Mitigations
- Table or two-column layout:
  - Risk 1: Overgeneration -> settlement quantity exceeds consumption -> Mitigation: Use matched-consumption settlement mode
  - Risk 2: FMP volatility -> affects CfD cash flow timing -> Mitigation: FMP cancellation means net cost converges to strike + DPPA charge
  - Risk 3: Shortfall exposure -> unmatched kWh at retail tariff -> Mitigation: Right-size solar capacity to factory load profile
  - Risk 4: Regulatory change -> DPPA framework is still evolving -> Mitigation: Contract should include regulatory change clauses

### Slide 19 — Why This Matters for Your Factory
- 3-4 bullets:
  - Predictable renewable energy cost: ~2,670 VND/kWh on matched volume regardless of FMP
  - RECs for sustainability reporting and ESG compliance
  - No capital investment — solar is developer-owned
  - Interactive tool available for your team to model your actual load profile

### Slide 20 — Next Steps & Contact
- Numbered steps: (1) Share your factory's hourly load data (2) We model your specific DPPA economics (3) Review term sheet with your legal/finance team (4) Execute and begin settlement
- Allotrope contact info
- Confidential footer

## Design and formatting requirements

1. **Use the `/pptx` skill** to generate the file
2. **Widescreen 16:9** format
3. **Section dividers**: Teal/dark-blue background (#1e4d5c), green (#4CAF50) large section number, white title text
4. **Content slides**: White background, green horizontal rule under the title, dark navy text
5. **Tables**: Light blue header row (#d6e8f0), alternating white rows, bold total/summary rows
6. **KPI cards**: Light blue rounded rectangles with large green numbers and small grey labels beneath
7. **Footer on every content slide**: "Confidential — For Internal Use by Allotrope & Key Partners — Not for Further Circulation"
8. **Font**: Use a clean sans-serif (Calibri or similar)
9. **Charts**: If the skill supports chart insertion, create a 24-hour area chart for Slide 5. Otherwise, describe the chart shape in a text box or use a placeholder image.

## Output

Save the generated file as `dppa-factory-presentation.pptx` in the repo root.

## Important notes

- All numbers must match the web app's calculation engine exactly. The formulas and worked examples above are taken directly from the source code.
- This is a **teaching/proposal deck**, not a legal document. Label assumptions clearly.
- The tone should be confident but transparent — show the math, don't hide it.
- Emphasize the cancellation effect as the key CFO insight: "your matched energy cost converges to strike + DPPA charge, regardless of where FMP lands."
