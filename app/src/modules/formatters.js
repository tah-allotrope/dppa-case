import { getActiveLang } from './i18n.js'

// Display-only conversion rate; every USD figure the app shows is this integer
// away from a live rate, and it is not sourced from a market feed. Recorded
// here (2026-08-23, PHASE-04 of plans/2026-08-22-delivery-stall-recovery-plan.md)
// because app/docs/assumptions.md previously stated a different rate (25,000)
// than this constant (26,500) -- a 6% discrepancy that had shipped unnoticed.
// If this value changes, update EXCHANGE_RATE_AS_OF and app/docs/assumptions.md
// in the same commit.
export const EXCHANGE_RATE = 26500
export const EXCHANGE_RATE_AS_OF = '2026-08-23'

// PHASE-03 (2026-08-23): vi-VN groups thousands with "." and decimalizes with
// ",", the reverse of en-US/zh-CN. Reading a vi-VN-shaped number under en-US
// convention silently corrupts it (1.100 reads as "one point one", not
// "1,100") -- the class of defect this map exists to prevent.
export const LOCALE_BY_LANG = {
  en: 'en-US',
  vi: 'vi-VN',
  zh: 'zh-CN',
}

export function resolveLocale(lang = getActiveLang()) {
  return LOCALE_BY_LANG[lang] || 'en-US'
}

export function convertMoney(value, currency = 'VND') {
  return currency === 'USD' ? value / EXCHANGE_RATE : value
}

export function formatMoney(
  value,
  { currency = 'VND', precise = false, signed = false, perKwh = false } = {},
) {
  const absolute = Math.abs(convertMoney(value, currency))
  const fractionDigits = precise ? (currency === 'USD' ? 4 : 2) : currency === 'USD' ? 2 : 0
  const formatted = new Intl.NumberFormat(resolveLocale(), {
    minimumFractionDigits: precise ? fractionDigits : 0,
    maximumFractionDigits: fractionDigits,
  }).format(absolute)
  const prefix = signed ? (value >= 0 ? '+' : '-') : ''

  return `${prefix}${formatted} ${currency}${perKwh ? '/kWh' : ''}`
}

export function formatNumber(value) {
  return new Intl.NumberFormat(resolveLocale()).format(Math.round(value))
}
