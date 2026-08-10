// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  buildFmpCurve,
  defaultInputs,
  scenarioOrder,
  scenarioProfiles,
  settlementModes,
} from '../data/default-scenarios.js'
import { formatMoney } from './formatters.js'
import {
  buildFiveLineBill,
  buildSelectedWalkthroughCase,
  calculateSettlement,
  buildFormulaBreakdown,
} from './settlement.js'
import {
  renderAppShell,
  renderFiveLineBill,
  renderFormulas,
  renderSelectedHourDetails,
  renderWalkthroughCases,
} from './ui.js'

function normalizedText(selector) {
  return document.querySelector(selector).textContent.replace(/\s+/g, ' ').trim()
}

describe('storytelling shell', () => {
  it('renders chart canvas and walkthrough cases section with correct DOM order', () => {
    document.body.innerHTML = '<div id="app"></div>'

    renderAppShell(
      document.querySelector('#app'),
      scenarioOrder.map((id) => scenarioProfiles[id]),
      settlementModes,
    )

    // Tariff overlay is now drawn on canvas by a Chart.js plugin — no HTML overlay element.
    expect(document.querySelector('#profileChart')).not.toBeNull()
    expect(document.querySelector('#walkthroughCases')).not.toBeNull()
    expect(document.querySelector('[data-scenario="workshop1"]')).not.toBeNull()
    expect(document.querySelector('[data-scenario="workshop2"]')).not.toBeNull()
    expect(document.querySelector('#fiveLineBill')).not.toBeNull()
    expect(document.querySelector('#app').textContent).toContain('Load-vs-generation cases')
    // Chart canvas must be inside .chart-wrap
    expect(document.querySelector('.chart-wrap #profileChart')).not.toBeNull()
    // Chart panel and walkthrough panel must both be inside the side-by-side row
    expect(document.querySelector('.chart-walkthrough-row .chart-panel')).not.toBeNull()
    expect(document.querySelector('.chart-walkthrough-row .walkthrough-panel')).not.toBeNull()
    expect(document.querySelector('.story-grid + .lower-grid')).not.toBeNull()
    expect(document.querySelector('#cancellationFlow')).not.toBeNull()
    // Multi-year projection now sits inside the focus column, before the cancellation flow
    expect(document.querySelector('.focus-column .multi-year-panel')).not.toBeNull()
    const order = document.querySelector('#app').innerHTML
    expect(order.indexOf('id="multiYearChart"')).toBeLessThan(
      order.indexOf('id="cancellationFlow"'),
    )
    expect(order.indexOf('id="multiYearChart"')).toBeLessThan(
      order.indexOf('class="controls-grid"'),
    )
    expect(document.querySelector('#app').textContent).toContain('reshape the daily graph')
    expect(document.querySelector('#dailyTotals')).toBeNull()
    expect(document.querySelector('#app').textContent).not.toContain('Cancellation effect')
    expect(document.querySelector('#retailTariff')).toBeNull()
    expect(document.querySelector('#app').textContent).toContain('2025 teaching assumptions')
    expect(document.querySelector('#app').textContent).toContain('Illustrative tariff blocks')
    expect(document.querySelector('#app').textContent).toContain('Synthetic FMP curve')
    expect(document.querySelector('#app').textContent).not.toContain(
      'weighted 22 kV to below 110 kV retail tariff',
    )
    expect(document.querySelector('#app').textContent).not.toContain('Savings vs BAU')
  })

  it('renders workshop five-line bill totals and clears it for curve scenarios', () => {
    document.body.innerHTML = '<div id="fiveLineBill"></div>'
    const node = document.querySelector('#fiveLineBill')
    const bill = buildFiveLineBill(
      {
        fmp: 1150,
        strikePrice: 1250,
        serviceFee: 360,
        clearingFee: 163.3,
        lossFactorPrecise: 1.026 * 1.008,
        retailTariff: 2204,
      },
      scenarioProfiles.workshop1.monthlyVolumes,
    )

    renderFiveLineBill(node, bill, 'VND', scenarioProfiles.workshop1)

    expect(normalizedText('#fiveLineBill')).toContain('Workshop 1 deck bill')
    expect(normalizedText('#fiveLineBill')).toContain('5,946,696,000 VND')
    expect(normalizedText('#fiveLineBill')).toContain('8,563,196,000 VND')
    expect(normalizedText('#fiveLineBill')).toContain('9,063,196,000 VND')
    expect(normalizedText('#fiveLineBill')).toContain('RE GENCO mirror')

    renderFiveLineBill(node, null, 'VND', scenarioProfiles.balanced)

    expect(node.innerHTML).toBe('')
  })
})

describe('selected-hour layout', () => {
  it('renders walkthrough card with FMP strip and payment equations below in details panel', () => {
    document.body.innerHTML = `
      <div id="walkthroughCases"></div>
      <div id="selectedHourDetailsPanel"></div>
    `

    const inputs = {
      loadProfile: [4700],
      generationProfile: [4700],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      fmpCurve: buildFmpCurve(1700),
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const settlement = calculateSettlement(inputs)
    const interval = settlement.intervals[0]
    const formulas = buildFormulaBreakdown(inputs, interval)
    const selectedCase = buildSelectedWalkthroughCase(inputs, interval)

    renderWalkthroughCases(
      document.querySelector('#walkthroughCases'),
      selectedCase,
      'VND',
      formulas,
    )

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    expect(document.querySelector('#walkthroughCases').textContent).toContain(
      'Net = EVN + Developer',
    )
    expect(document.querySelector('#walkthroughCases').textContent).toContain('FMP cancellation')
    // Payment build-up is in the details panel
    expect(document.querySelector('#selectedHourDetailsPanel .settlement-grid')).not.toBeNull()
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain(
      'Payment to EVN per kWh of factory load',
    )
  })

  it('renders only the selected-hour load-vs-gen case card', () => {
    document.body.innerHTML = `
      <div id="walkthroughCases"></div>
    `

    const inputs = {
      ...defaultInputs,
      loadProfile: [5200, 4700, 3600],
      generationProfile: [2500, 4700, 5200],
    }

    const settlement = calculateSettlement(inputs)
    const selectedCase = buildSelectedWalkthroughCase(inputs, settlement.intervals[1])
    const formulas = buildFormulaBreakdown(inputs, settlement.intervals[1])
    const interval = settlement.intervals[1]
    const fmpText = formatMoney(interval.fmp, { currency: 'VND', precise: true, perKwh: true })
    const strikeText = formatMoney(inputs.strikePrice, {
      currency: 'VND',
      precise: true,
      perKwh: true,
    })

    renderWalkthroughCases(
      document.querySelector('#walkthroughCases'),
      selectedCase,
      'VND',
      formulas,
    )

    const text = normalizedText('#walkthroughCases')

    expect(text).toContain('Load = Gen')
    expect(text).toContain('EVN =')
    expect(text).toContain('Net = EVN + Developer')
    const kppText = inputs.lossFactor.toFixed(3)
    expect(text).toContain(`FMP (${fmpText}) × Kpp (${kppText}) × 4,700 kWh`)
    expect(text).toContain('Developer =')
    expect(text).toContain(`− FMP (${fmpText}) × 4,700 kWh + Strike (${strikeText}) × 4,700 kWh`)
    expect(text).toContain(
      `EVN = FMP (${fmpText}) × Kpp (${kppText}) × 4,700 kWh + CDPPA (523.30 VND/kWh) × 4,700 kWh =`,
    )
    expect(text).toContain('FMP cancellation')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-cancelled-term')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-retained-term')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('cancel-term-cancel')
    expect(document.querySelectorAll('#walkthroughCases .walkthrough-card')).toHaveLength(1)
  })

  it('shows FMP cancellation terms explicitly for a CFO reader', () => {
    document.body.innerHTML = `
      <div id="walkthroughCases"></div>
      <div id="selectedHourDetailsPanel"></div>
      <div id="cancellationFlowNote"></div>
      <div id="cancellationFlow"></div>
    `

    const inputs = {
      loadProfile: [4700],
      generationProfile: [4700],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      fmpCurve: buildFmpCurve(1700),
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const settlement = calculateSettlement(inputs)
    const interval = settlement.intervals[0]
    const breakdown = buildFormulaBreakdown(inputs, interval)
    const selectedCase = buildSelectedWalkthroughCase(inputs, interval)
    const fmpText = formatMoney(interval.fmp, { currency: 'VND', precise: true, perKwh: true })
    const strikeText = formatMoney(inputs.strikePrice, {
      currency: 'VND',
      precise: true,
      perKwh: true,
    })

    renderWalkthroughCases(
      document.querySelector('#walkthroughCases'),
      selectedCase,
      'VND',
      breakdown,
    )

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    const flowResult = renderFormulas(breakdown, '', 'VND')

    const text = normalizedText('#walkthroughCases')

    expect(normalizedText('#selectedHourDetailsPanel')).not.toContain('FMP cancellation')
    expect(text).toContain(
      `EVN = FMP (${fmpText}) × Kpp (1.027) × 4,700 kWh + CDPPA (523.34 VND/kWh) × 4,700 kWh`,
    )
    expect(text).toContain('Developer =')
    expect(text).toContain(`− FMP (${fmpText}) × 4,700 kWh + Strike (1,741.35 VND/kWh) × 4,700 kWh`)
    expect(text).toContain('FMP cancellation')
    expect(text).toContain('per kWh on factory load')
    expect(text).toContain(`Selected graph FMP: ${fmpText}`)
    expect(text).toContain('FMP ref × matched/load')
    expect(text).toContain('FMP ref × aligned/load')
    expect(text).toContain('EVN')
    expect(text).toContain('Developer')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-cancelled-term')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain(
      'net-retained-term default',
    )
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('cancel-term-cancel')
    expect(document.querySelector('#walkthroughCases').innerHTML).not.toContain(
      'net-retained-term result">CDPPA',
    )
    expect(document.querySelector('#walkthroughCases').innerHTML).not.toContain(
      'net-retained-term warning',
    )
    expect(document.querySelector('#walkthroughCases').innerHTML).not.toContain(
      'net-retained-term accent',
    )
    expect(flowResult.kind).toBe('clean')
    expect(flowResult.flowHtml).toContain('flow-clean')
    expect(flowResult.flowHtml).toContain('Spot reference shown on EVN')
    expect(flowResult.flowHtml).toContain('Canceled on aligned volume')
    expect(flowResult.flowHtml).toContain(
      `+ ${interval.contractQuantity.toLocaleString()} kWh × ${strikeText}`,
    )
    expect(flowResult.flowHtml).toContain(
      `− ${interval.cleanCancelledEnergy ? interval.cleanCancelledEnergy.toLocaleString() : interval.contractQuantity.toLocaleString()} kWh × ${fmpText}`,
    )
    expect(document.querySelector('#cancellationFlow').innerHTML).toContain('flow-clean')
    expect(
      document.querySelector('#cancellationFlow').classList.contains('cancellation-flow'),
    ).toBe(true)
  })

  it('keeps the cancellation strip and neutral retained terms in a shortfall hour', () => {
    document.body.innerHTML = '<div id="walkthroughCases"></div>'

    const inputs = {
      loadProfile: [6100],
      generationProfile: [4200],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      fmpCurve: buildFmpCurve(1700),
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const settlement = calculateSettlement(inputs)
    const interval = settlement.intervals[0]
    const breakdown = buildFormulaBreakdown(inputs, interval)
    const selectedCase = buildSelectedWalkthroughCase(inputs, interval)
    const fmpText = formatMoney(interval.fmp, { currency: 'VND', precise: true, perKwh: true })

    renderWalkthroughCases(
      document.querySelector('#walkthroughCases'),
      selectedCase,
      'VND',
      breakdown,
    )

    const text = normalizedText('#walkthroughCases')
    const html = document.querySelector('#walkthroughCases').innerHTML

    expect(text).toContain('Load > Gen')
    expect(text).toContain('Retail (1,833.00 VND/kWh) × 1,900 kWh')
    expect(text).toContain('Loss adj.')
    expect(text).toContain('FMP cancellation — per kWh on factory load')
    expect(text).toContain(`Selected graph FMP: ${fmpText}`)
    expect(text).toContain('FMP ref × matched/load')
    expect(text).toContain('FMP ref × aligned/load')
    expect(html).toContain('cancel-term-retail')
    expect(html).toContain('cancel-term-loss')
    expect(html).toContain('net-cancelled-term')
    expect(html).toContain('net-retained-term default')
    expect(html).not.toContain('net-retained-term result')
    expect(html).not.toContain('net-retained-term warning')
    expect(html).not.toContain('net-retained-term accent')
  })

  it('avoids repeating the same retail-only net formula twice', () => {
    document.body.innerHTML = '<div id="walkthroughCases"></div>'

    const inputs = {
      loadProfile: [2600],
      generationProfile: [0],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      fmpCurve: buildFmpCurve(1700),
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const settlement = calculateSettlement(inputs)
    const interval = settlement.intervals[0]
    const breakdown = buildFormulaBreakdown(inputs, interval)
    const selectedCase = buildSelectedWalkthroughCase(inputs, interval)

    renderWalkthroughCases(
      document.querySelector('#walkthroughCases'),
      selectedCase,
      'VND',
      breakdown,
    )

    const netLines = document.querySelectorAll('#walkthroughCases .net-formula-line')
    const text = normalizedText('#walkthroughCases')

    expect(netLines).toHaveLength(1)
    expect(text).toContain(
      'Net = EVN + Developer = =Retail (1,833.00 VND/kWh) × 2,600 kWh=4,765,800 VND',
    )
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain(
      'cancel-term-shown cancel-term-crossed',
    )
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain(
      'cancel-term-cancel cancel-term-crossed',
    )
  })

  it('keeps a matched below-strike hour visible in the settlement story', () => {
    document.body.innerHTML = `
      <div id="walkthroughCases"></div>
      <div id="cancellationFlowNote"></div>
      <div id="cancellationFlow"></div>
    `

    const scenario = scenarioProfiles.balanced
    const inputs = {
      ...defaultInputs,
      loadProfile: scenario.loadProfile,
      generationProfile: scenario.generationProfile,
    }

    const settlement = calculateSettlement(inputs)
    const belowStrikeMatchedHours = settlement.intervals.filter(
      (iv) => iv.matched > 0 && iv.fmp < inputs.strikePrice,
    )
    const interval = settlement.intervals.find(
      (iv) => iv.matched > 0 && iv.fmp < inputs.strikePrice,
    )

    expect(belowStrikeMatchedHours.length).toBeGreaterThanOrEqual(4)
    expect(interval).toBeTruthy()
    expect(interval.developer).toBeGreaterThan(0)

    const breakdown = buildFormulaBreakdown(inputs, interval)
    const selectedCase = buildSelectedWalkthroughCase(inputs, interval)
    const fmpText = formatMoney(interval.fmp, { currency: 'VND', precise: true, perKwh: true })
    const strikeText = formatMoney(inputs.strikePrice, {
      currency: 'VND',
      precise: true,
      perKwh: true,
    })

    renderWalkthroughCases(
      document.querySelector('#walkthroughCases'),
      selectedCase,
      'VND',
      breakdown,
    )
    const flowResult = renderFormulas(breakdown, '', 'VND')

    expect(normalizedText('#walkthroughCases')).toContain(
      `Strike (${strikeText}) × ${interval.contractQuantity.toLocaleString()} kWh`,
    )
    expect(normalizedText('#walkthroughCases')).toContain(
      formatMoney(interval.developer, { currency: 'VND', signed: true }),
    )
    expect(flowResult.flowHtml).toContain('Developer CfD swap')
    expect(flowResult.flowHtml).toContain(
      `− ${interval.contractQuantity.toLocaleString()} kWh × ${fmpText}`,
    )
  })

  it('uses the clicked interval FMP in selected-hour detail formulas', () => {
    document.body.innerHTML = '<div id="selectedHourDetailsPanel"></div>'

    const inputs = {
      loadProfile: [4700],
      generationProfile: [4700],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      fmpCurve: buildFmpCurve(1700),
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const settlement = calculateSettlement(inputs)
    const interval = settlement.intervals[0]

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    const text = normalizedText('#selectedHourDetailsPanel')

    expect(interval.fmp).toBe(buildFmpCurve(1700)[0])
    expect(text).toContain(
      formatMoney(interval.fmp * inputs.lossFactor, {
        currency: 'VND',
        precise: true,
        perKwh: true,
      }),
    )
    expect(text).toContain(
      `(1,741.35 VND/kWh - ${formatMoney(interval.fmp, { currency: 'VND', precise: true, perKwh: true })})`,
    )
    expect(text).not.toContain('(1,741.35 VND/kWh - 1,700.00 VND/kWh)')
  })
})
