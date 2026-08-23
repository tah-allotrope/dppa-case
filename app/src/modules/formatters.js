import { getActiveLang } from './i18n.js'

export const EXCHANGE_RATE = 26500

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
