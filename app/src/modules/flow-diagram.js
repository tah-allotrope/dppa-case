import { formatMoney, formatNumber } from './formatters.js'

function money(value, opts) {
  return formatMoney(value, opts)
}

function number(value) {
  return formatNumber(value)
}

function cleanFlow(result, currency) {
  const bau = money(result.bauCost, { currency })
  const dppa = money(result.dppaCost, { currency })
  const savings = money(result.savingsVsBau, { currency, signed: true })
  const fmp = money(result.marketPrice, { currency, precise: true, perKwh: true })
  const strike = money(result.strikePrice, { currency, precise: true, perKwh: true })
  const retail = money(result.retailTariff, { currency, precise: true, perKwh: true })
  return `
    <ol class="flow-diagram flow-clean" role="list">
      <li class="flow-row flow-bau">
        <div class="flow-node flow-node-bau">
          <span class="flow-label">BAU retail payment</span>
          <span class="flow-value">${number(result.load)} kWh × ${retail}</span>
          <span class="flow-total">${bau}</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-compare">
          <span class="flow-label">Selected hour comparison</span>
        </div>
      </li>
      <li class="flow-row flow-cancel">
        <div class="flow-node flow-node-evn">
          <span class="flow-label">Spot reference shown on EVN</span>
          <span class="flow-value">${number(result.matched)} kWh × ${fmp}</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-cancel">
          <span class="flow-label">Canceled on aligned volume</span>
          <span class="flow-value">${number(result.cleanCancelledEnergy)} kWh</span>
        </div>
      </li>
      <li class="flow-row flow-developer">
        <div class="flow-node flow-node-developer">
          <span class="flow-label">Developer CfD swap</span>
          <span class="flow-value">− ${number(result.cleanCancelledEnergy)} kWh × ${fmp}</span>
          <span class="flow-value">+ ${number(result.contractQuantity)} kWh × ${strike}</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-keep">
          <span class="flow-label">Keep strike + DPPA charge + loss</span>
        </div>
      </li>
      <li class="flow-row flow-final">
        <div class="flow-node flow-node-dppa">
          <span class="flow-label">DPPA payment</span>
          <span class="flow-total">${dppa}</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-compare">
          <span class="flow-label">Selected hour comparison</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-savings">
          <span class="flow-label">Savings vs BAU</span>
          <span class="flow-total">${savings}</span>
        </div>
      </li>
    </ol>
  `
}

function partialFlow(result, currency) {
  const bau = money(result.bauCost, { currency })
  const dppa = money(result.dppaCost, { currency })
  const savings = money(result.savingsVsBau, { currency, signed: true })
  const mismatch = number(Math.abs(result.mismatchVolume))
  return `
    <ol class="flow-diagram flow-partial" role="list">
      <li class="flow-row flow-bau">
        <div class="flow-node flow-node-bau">
          <span class="flow-label">BAU retail payment</span>
          <span class="flow-total">${bau}</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-compare">
          <span class="flow-label">Selected hour comparison</span>
        </div>
      </li>
      <li class="flow-row flow-cancel">
        <div class="flow-node flow-node-evn">
          <span class="flow-label">Matched volume</span>
          <span class="flow-value">${number(result.matched)} kWh</span>
        </div>
        <div class="flow-node flow-node-contract">
          <span class="flow-label">Contracted volume</span>
          <span class="flow-value">${number(result.contractQuantity)} kWh</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-cancel">
          <span class="flow-label">Cancellation only applies here</span>
        </div>
      </li>
      <li class="flow-row flow-mismatch">
        <div class="flow-node flow-node-mismatch">
          <span class="flow-label">Volume mismatch</span>
          <span class="flow-value">${mismatch} kWh</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-exposure">
          <span class="flow-label">Uncancelled exposure stays</span>
        </div>
      </li>
      <li class="flow-row flow-final">
        <div class="flow-node flow-node-dppa">
          <span class="flow-label">DPPA payment</span>
          <span class="flow-total">${dppa}</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-compare">
          <span class="flow-label">Selected hour comparison</span>
        </div>
        <span class="flow-arrow" aria-hidden="true">→</span>
        <div class="flow-node flow-node-savings">
          <span class="flow-label">Savings vs BAU</span>
          <span class="flow-total">${savings}</span>
        </div>
      </li>
    </ol>
  `
}

export function renderCancellationFlow(result, currency) {
  if (!result) return ''
  return result.cleanCancellation ? cleanFlow(result, currency) : partialFlow(result, currency)
}
