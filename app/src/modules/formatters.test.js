import { describe, expect, it } from 'vitest'
import { EXCHANGE_RATE, convertMoney, formatMoney } from './formatters'

describe('formatters', () => {
  it('converts VND amounts to USD using the fixed display rate', () => {
    expect(EXCHANGE_RATE).toBe(26500)
    expect(convertMoney(26500, 'USD')).toBe(1)
  })

  it('formats per-kWh values in both currencies', () => {
    expect(formatMoney(2100, { currency: 'VND', precise: true, perKwh: true })).toContain('VND/kWh')
    expect(formatMoney(26500, { currency: 'USD', perKwh: true })).toContain('USD/kWh')
  })
})
