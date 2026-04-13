const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

// Synthetic daily FMP shape multipliers relative to the midpoint (marketPrice).
// Values < 1 produce hours below strike; values > 1 produce hours above strike.
// The pattern mirrors Vietnamese tariff bands so CFO can see cancellation working
// in both directions across the 24-hour settlement window.
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
}

export const scenarioOrder = ['higherLoad', 'balanced', 'higherGen']

export const defaultInputs = {
  scenarioId: 'balanced',
  strikePrice: 1741.35,
  marketPrice: 1700,
  fmpCurve: buildFmpCurve(1700),
  dppaCharge: 523.34,
  lossFactor: 1.027263,
  retailTariff: 1833,
  settlementMode: 'matched',
  currency: 'VND',
  detailView: 'flow',
  selectedHour: 12,
}

export const settlementModes = [
  { value: 'matched', label: 'Matched consumption only' },
  { value: 'allocated', label: 'Allocated generation' },
  { value: 'generation', label: 'Generation regardless of consumption' },
  { value: 'minimum', label: 'Minimum of load and generation' },
]

export const hours = HOURS
