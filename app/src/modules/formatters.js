export const EXCHANGE_RATE = 26500

export function convertMoney(value, currency = 'VND') {
  return currency === 'USD' ? value / EXCHANGE_RATE : value
}

export function formatMoney(value, { currency = 'VND', precise = false, signed = false, perKwh = false } = {}) {
  const absolute = Math.abs(convertMoney(value, currency))
  const fractionDigits = precise ? (currency === 'USD' ? 4 : 2) : (currency === 'USD' ? 2 : 0)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precise ? fractionDigits : 0,
    maximumFractionDigits: fractionDigits,
  }).format(absolute)
  const prefix = signed ? (value >= 0 ? '+' : '-') : ''

  return `${prefix}${formatted} ${currency}${perKwh ? '/kWh' : ''}`
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}
