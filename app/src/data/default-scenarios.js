const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

// Synthetic daily FMP shape multipliers relative to the midpoint (marketPrice).
// Values < 1 produce hours below strike; values > 1 produce hours above strike.
// This is demo data for teaching the cancellation effect, not a published Vietnam
// market curve or a tariff-rule input.
const FMP_SHAPE = [
  0.70, 0.69, 0.68, 0.69, 0.72, // 00–04  off-peak: well below strike
  0.78, 0.84, 0.88, 0.92, 0.97, // 05–09  matched hours stay below strike longer
  1.00, 1.04, 1.08, 1.11, 1.15, // 10–14  crossing through strike into midday
  1.18, 1.22, 1.28, 1.36, 1.42, // 15–19  afternoon to evening peak
  1.30, 1.08, 0.92, 0.80,       // 20–23  easing back toward off-peak
]

export function buildFmpCurve(midpoint) {
  return FMP_SHAPE.map((mult) => Math.round(midpoint * mult))
}

// Workshop FMP curve: a lively daily shape centered on `midpoint` (so the
// market-price slider still reshapes it) whose amplitude is bounded by the
// midpoint↔strike gap so the curve never crosses strike while the midpoint
// stays on the correct side. side 'below' keeps it under strike (deck S1),
// side 'above' keeps it over strike (deck S2). This removes the dead-flat
// workshop FMP line while preserving the S1-below / S2-above teaching contrast.
const FMP_SHAPE_CENTER = FMP_SHAPE.reduce((sum, m) => sum + m, 0) / FMP_SHAPE.length
const FMP_SHAPE_MAX_DEV = Math.max(...FMP_SHAPE.map((m) => Math.abs(m - FMP_SHAPE_CENTER)))

export function buildWorkshopFmpCurve(midpoint, strike, side) {
  const gap = Math.abs(strike - midpoint)
  const amp = Math.min(midpoint * 0.15, gap * 0.8)
  const margin = strike * 0.02
  return FMP_SHAPE.map((m) => {
    const norm = (m - FMP_SHAPE_CENTER) / FMP_SHAPE_MAX_DEV // ~[-1, 1]
    let value = midpoint + norm * amp
    if (side === 'below') value = Math.min(value, strike - margin)
    else value = Math.max(value, strike + margin)
    return Math.round(value)
  })
}

function solarCurve(scale = 1, shoulder = 0.35) {
  return HOURS.map((hour) => {
    if (hour < 6 || hour > 18) return 0
    const normalized = Math.sin(((hour - 6) / 12) * Math.PI)
    const shaped = Math.max(0, normalized) ** (1 + shoulder)
    return Math.round(shaped * scale)
  })
}

export const scenarioProfiles = {
  higherLoad: {
    id: 'higherLoad',
    kind: 'curve',
    label: 'Load > Gen',
    description: 'Factory load stays above solar generation for most intervals.',
    loadProfile: HOURS.map((hour) => {
      if (hour < 6) return 4300
      if (hour < 10) return 5200
      if (hour < 17) return 6100
      if (hour < 22) return 5000
      return 4400
    }),
    generationProfile: solarCurve(4200, 0.42),
  },
  balanced: {
    id: 'balanced',
    kind: 'curve',
    label: 'Load = Gen',
    description: 'Solar is sized to closely track daytime demand.',
    loadProfile: HOURS.map((hour) => {
      if (hour < 6) return 3000
      if (hour < 9) return 4000
      if (hour < 16) return 4700
      if (hour < 20) return 3900
      return 3200
    }),
    generationProfile: solarCurve(4700, 0.28),
  },
  higherGen: {
    id: 'higherGen',
    kind: 'curve',
    label: 'Load < Gen',
    description: 'Overbuilt solar creates midday excess and highlights settlement risk.',
    loadProfile: HOURS.map((hour) => {
      if (hour < 7) return 2600
      if (hour < 10) return 3200
      if (hour < 16) return 3600
      if (hour < 20) return 3100
      return 2700
    }),
    generationProfile: solarCurve(6200, 0.22),
  },
  workshop1: {
    id: 'workshop1',
    kind: 'workshop',
    label: 'Workshop 1',
    description: 'July deck Scenario 1: contracted quantity matches factory consumption.',
    overrides: { strikePrice: 1250, marketPrice: 1150 },
    monthlyVolumes: { contracted: 5000000, total: 5000000 },
    fmpSide: 'below',
    // Illustrative daily shape (load≈solar overlap → matched story). The exact
    // monthly settlement is the 5-line bill (monthlyVolumes), not this curve.
    loadProfile: HOURS.map((hour) => {
      if (hour < 6) return 5200
      if (hour < 9) return 6800
      if (hour < 16) return 8200
      if (hour < 20) return 6800
      return 5600
    }),
    generationProfile: solarCurve(8500, 0.28),
  },
  workshop2: {
    id: 'workshop2',
    kind: 'workshop',
    label: 'Workshop 2',
    description: 'July deck Scenario 2: contracted quantity falls short of factory consumption.',
    overrides: { strikePrice: 1500, marketPrice: 1600 },
    monthlyVolumes: { contracted: 8000000, total: 9000000 },
    fmpSide: 'above',
    // Illustrative daily shape (load clearly above solar → shortfall story).
    loadProfile: HOURS.map((hour) => {
      if (hour < 6) return 10000
      if (hour < 9) return 13000
      if (hour < 17) return 15000
      if (hour < 21) return 12500
      return 10500
    }),
    generationProfile: solarCurve(11000, 0.25),
  },
  workshop3: {
    id: 'workshop3',
    kind: 'workshop',
    label: 'Workshop 3',
    description: 'Workshop Scenario 3 (excess): overbuilt solar generates more than the factory consumes. Consumption is fully matched (line 4 = 0); the excess settles nothing — spot only, no CfD.',
    overrides: { strikePrice: 1250, marketPrice: 1100 },
    // Bill settles on consumed/matched volume only (5,000,000). The over-generation
    // excess is a daily-chart + narrative story, not a monthly-bill line.
    monthlyVolumes: { contracted: 5000000, total: 5000000 },
    fmpSide: 'below',
    // Illustrative daily shape (solar clearly above load midday → excess story).
    loadProfile: HOURS.map((hour) => {
      if (hour < 6) return 4200
      if (hour < 9) return 5200
      if (hour < 16) return 6000
      if (hour < 20) return 5200
      return 4400
    }),
    generationProfile: solarCurve(9000, 0.22),
  },
}

export const scenarioOrder = ['higherLoad', 'balanced', 'higherGen', 'workshop1', 'workshop2', 'workshop3']

export const defaultInputs = {
  scenarioId: 'balanced',
  // Strike: deck Case 6 reference offer — illustrative teaching value that shows "Year 1 ≥ BAU"
  strikePrice: 2000,
  // FMP: deck ~1,427 VND/kWh 2025 reference — illustrative; no NSMO/ERAV primary source yet
  marketPrice: 1427,
  fmpCurve: buildFmpCurve(1427),
  // Fixed DPPA fees: 360 (service) + 163.3 (balancing) = 523.3 VND/kWh per EVN annual notice
  dppaServiceFee: 360,
  dppaClearingFee: 163.3,
  dppaCharge: 523.3,
  // Loss factor: k × K_pp = 1.026 × 1.008 = 1.0342 (Decree 57/2025 reference coefficients)
  lossFactor: 1.0342,
  // Retail: Decision 599/QD-EVN, 10 May 2025 — +4.8% to 2,204.07 VND/kWh (excl. VAT)
  retailTariff: 2204,
  settlementMode: 'matched',
  currency: 'VND',
  detailView: 'flow',
  selectedHour: 12,
  // Multi-year horizon defaults (used by projectMultiYear in settlement.js)
  evnEscalation: 0.04,      // 4%/yr EVN tariff escalation (historical trend 2015-2024)
  strikeEscalation: 0.04,   // 4%/yr strike escalation (fixed-VND index; negotiate separately)
  horizonYears: 20,         // default lifetime horizon in years
}

export const settlementModes = [
  { value: 'matched', label: 'Matched consumption only' },
  { value: 'generation', label: 'Demo: generation volume' },
  { value: 'allocated', label: 'Demo: contracted allocation' },
]

export const hours = HOURS
