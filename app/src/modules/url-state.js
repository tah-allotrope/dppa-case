// PHASE-06 (2026-08-23, plans/2026-08-22-delivery-stall-recovery-plan.md):
// serializes the app's numeric/scenario state into the URL query string, so a
// presenter can share "open this exact bill on your phone" as a link, the
// fresh-viewer kit can specify a reproducible starting state, and a second
// deck QR code can point at ?strikeEsc=0 -- the locked-strike story, one
// scan, no narration.
//
// Kept out of main.js deliberately: main.js executes side effects (DOM
// rendering, initI18n) at module load time, which makes it unsafe to import
// from a unit test. These two functions are pure.
import { scenarioProfiles, settlementModes } from '../data/default-scenarios.js'

const PARAM_BY_KEY = {
  scenarioId: 'scenarioId',
  strikePrice: 'strike',
  marketPrice: 'fmp',
  dppaCharge: 'charge',
  lossFactor: 'loss',
  settlementMode: 'mode',
  evnEscalation: 'evnEsc',
  strikeEscalation: 'strikeEsc',
  horizonYears: 'years',
  selectedHour: 'hour',
  currency: 'currency',
}

const NUMERIC_KEYS = new Set([
  'strikePrice',
  'marketPrice',
  'dppaCharge',
  'lossFactor',
  'evnEscalation',
  'strikeEscalation',
  'horizonYears',
  'selectedHour',
])

const SETTLEMENT_MODE_VALUES = new Set(settlementModes.map((mode) => mode.value))
const CURRENCY_VALUES = new Set(['VND', 'USD'])

/**
 * Parse `search` (a location.search-style string, with or without a leading
 * "?") into a state object seeded from `defaults`. Every recognised
 * parameter that fails to parse or validate falls back to the corresponding
 * value in `defaults` -- malformed or unknown input never produces NaN or an
 * invalid scenario/mode/currency selection.
 */
export function parseState(search, defaults) {
  const params = new URLSearchParams(search)
  const state = { ...defaults }

  for (const [key, param] of Object.entries(PARAM_BY_KEY)) {
    if (!params.has(param)) continue
    const raw = params.get(param)

    if (NUMERIC_KEYS.has(key)) {
      const value = Number(raw)
      if (!Number.isFinite(value)) continue
      // An out-of-range hour renders as 12:00 via the ?? fallback but keeps
      // poisoning the URL (and the next/prev wrap arithmetic), so clamp it at
      // parse time instead of papering over it at render time.
      if (key === 'selectedHour') {
        state[key] = Math.min(23, Math.max(0, Math.floor(value)))
        continue
      }
      state[key] = value
      continue
    }

    if (key === 'scenarioId') {
      if (Object.prototype.hasOwnProperty.call(scenarioProfiles, raw)) state[key] = raw
      continue
    }

    if (key === 'settlementMode') {
      if (SETTLEMENT_MODE_VALUES.has(raw)) state[key] = raw
      continue
    }

    if (key === 'currency') {
      if (CURRENCY_VALUES.has(raw)) state[key] = raw
      continue
    }
  }

  return state
}

/**
 * Serialize `state`'s recognised fields into a query string (no leading "?").
 */
export function serializeState(state) {
  const params = new URLSearchParams()
  for (const [key, param] of Object.entries(PARAM_BY_KEY)) {
    if (state[key] === undefined || state[key] === null) continue
    params.set(param, String(state[key]))
  }
  return params.toString()
}
