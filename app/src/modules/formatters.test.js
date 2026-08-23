// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  EXCHANGE_RATE,
  convertMoney,
  formatMoney,
  formatNumber,
  resolveLocale,
} from './formatters.js'
import { setLang } from './i18n.js'

afterEach(() => {
  setLang('en')
})

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

describe('resolveLocale', () => {
  it('maps each supported language to its BCP-47 tag', () => {
    expect(resolveLocale('vi')).toBe('vi-VN')
    expect(resolveLocale('zh')).toBe('zh-CN')
    expect(resolveLocale('en')).toBe('en-US')
  })

  it('falls back to en-US for an unrecognised language', () => {
    expect(resolveLocale('xx')).toBe('en-US')
  })
})

describe('locale-aware number formatting', () => {
  it('formats large numbers with en-US grouping by default', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('formats large numbers with vi-VN grouping when the active language is vi', () => {
    setLang('vi')
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formats money with vi-VN grouping when the active language is vi', () => {
    setLang('vi')
    expect(formatMoney(2204, { currency: 'VND', perKwh: true })).toBe('2.204 VND/kWh')
  })

  it('formats money with en-US grouping by default', () => {
    expect(formatMoney(2204, { currency: 'VND', perKwh: true })).toBe('2,204 VND/kWh')
  })

  it('keeps the USD-per-kWh precise value unchanged (regression guard)', () => {
    expect(formatMoney(2000, { currency: 'USD', precise: true, perKwh: true })).toBe(
      '0.0755 USD/kWh',
    )
  })
})
