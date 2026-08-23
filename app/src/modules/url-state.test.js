import { describe, expect, it } from 'vitest'
import { defaultInputs } from '../data/default-scenarios.js'
import { parseState, serializeState } from './url-state.js'

describe('parseState', () => {
  it('returns the defaults unchanged for an empty search string', () => {
    expect(parseState('', defaultInputs)).toEqual(defaultInputs)
  })

  it('overrides strikeEscalation and leaves every other field at its default', () => {
    const result = parseState('strikeEsc=0', defaultInputs)
    expect(result.strikeEscalation).toBe(0)
    for (const key of Object.keys(defaultInputs)) {
      if (key === 'strikeEscalation') continue
      expect(result[key]).toEqual(defaultInputs[key])
    }
  })

  it('falls back to the default when a numeric param is malformed, never NaN', () => {
    const result = parseState('strikeEsc=abc', defaultInputs)
    expect(result.strikeEscalation).toBe(defaultInputs.strikeEscalation)
    expect(Number.isNaN(result.strikeEscalation)).toBe(false)
  })

  it('falls back to the default when scenarioId names an unknown scenario', () => {
    const result = parseState('scenarioId=nonexistent', defaultInputs)
    expect(result.scenarioId).toBe(defaultInputs.scenarioId)
  })

  it('falls back to the default when settlementMode is not a recognised value', () => {
    const result = parseState('mode=bogus', defaultInputs)
    expect(result.settlementMode).toBe(defaultInputs.settlementMode)
  })

  it('falls back to the default when currency is not VND or USD', () => {
    const result = parseState('currency=EUR', defaultInputs)
    expect(result.currency).toBe(defaultInputs.currency)
  })

  it('accepts a leading "?" the same as a bare query string', () => {
    expect(parseState('?strikeEsc=0', defaultInputs).strikeEscalation).toBe(0)
  })
})

describe('serializeState', () => {
  it('round-trips a parsed override back into the query string', () => {
    const result = serializeState(parseState('strikeEsc=0&hour=7', defaultInputs))
    expect(result).toContain('strikeEsc=0')
    expect(result).toContain('hour=7')
  })
})
