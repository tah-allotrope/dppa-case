// @vitest-environment jsdom
// PHASE-03 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): string values
// are HTML fragments (crossover_gt_prefix is literally '&gt;', control_hints carries
// '&amp;'), so runtime escaping would double-escape them into visible garbage. Validate
// the table instead: no raw angle brackets, no bare ampersands.
import { describe, expect, it } from 'vitest'
import { STRINGS } from './strings.js'
import { SPINE_FIGURES } from './spine-figures.js'
import { setLang } from '../modules/i18n.js'
import { formatNumber } from '../modules/formatters.js'

const ENTITY_RE = /&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g

export function findMarkupViolations(table) {
  const violations = []
  for (const [lang, keys] of Object.entries(table)) {
    for (const [key, value] of Object.entries(keys)) {
      if (typeof value !== 'string') continue
      if (/[<>]/.test(value)) {
        violations.push({ lang, key, reason: 'raw angle bracket' })
        continue
      }
      if (value.replace(ENTITY_RE, '').includes('&')) {
        violations.push({ lang, key, reason: 'bare ampersand' })
      }
    }
  }
  return violations
}

describe('strings markup contract', () => {
  it('has no raw angle brackets or bare ampersands in any language', () => {
    expect(findMarkupViolations(STRINGS)).toEqual([])
  })

  it('rejects a raw angle bracket', () => {
    expect(findMarkupViolations({ en: { k: 'Giá < FMP' } })).toEqual([
      { lang: 'en', key: 'k', reason: 'raw angle bracket' },
    ])
  })

  it('rejects a bare ampersand', () => {
    expect(findMarkupViolations({ en: { k: 'strike & FMP' } })).toEqual([
      { lang: 'en', key: 'k', reason: 'bare ampersand' },
    ])
  })

  it('accepts the real control_hints entity shape', () => {
    expect(findMarkupViolations({ en: { k: 'Strike &amp; FMP reshape the graph' } })).toEqual([])
  })

  it('accepts the real crossover_gt_prefix entity', () => {
    expect(findMarkupViolations({ en: { k: '&gt;' } })).toEqual([])
  })
})

describe('spine figure placeholders', () => {
  it('matches the generated spine export', () => {
    expect(SPINE_FIGURES.s1).toEqual({
      bauMillions: 11020,
      cEvnMillions: 8563,
      cfdMillions: 500,
      cKhMillions: 9063,
    })
  })

  it('renders locale-grouped under en', () => {
    setLang('en')
    expect(formatNumber(SPINE_FIGURES.s1.bauMillions)).toBe('11,020')
  })

  it('renders locale-grouped under vi', () => {
    setLang('vi')
    expect(formatNumber(SPINE_FIGURES.s1.bauMillions)).toBe('11.020')
    setLang('en')
  })
})
