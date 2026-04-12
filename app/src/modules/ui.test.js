// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { buildFmpCurve, defaultInputs, scenarioOrder, scenarioProfiles, settlementModes } from '../data/default-scenarios'
import { buildSelectedWalkthroughCase, calculateSettlement, buildFormulaBreakdown } from './settlement'
import { renderAppShell, renderFormulas, renderSelectedHourDetails, renderWalkthroughCases } from './ui'

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
    expect(document.querySelector('#app').textContent).toContain('Load-vs-generation cases')
    // Chart canvas must be inside .chart-wrap
    expect(document.querySelector('.chart-wrap #profileChart')).not.toBeNull()
    // Chart panel and walkthrough panel must both be inside the side-by-side row
    expect(document.querySelector('.chart-walkthrough-row .chart-panel')).not.toBeNull()
    expect(document.querySelector('.chart-walkthrough-row .walkthrough-panel')).not.toBeNull()
    expect(document.querySelector('.story-grid + .lower-grid')).not.toBeNull()
    expect(document.querySelector('#cancellationMermaid')).not.toBeNull()
    expect(document.querySelector('#dailyTotals')).toBeNull()
    expect(document.querySelector('#app').textContent).not.toContain('Cancellation effect')
    expect(document.querySelector('#retailTariff')).toBeNull()
    expect(document.querySelector('#app').textContent).not.toContain('Weighted EVN tariff')
    expect(document.querySelector('#app').textContent).not.toContain('Savings vs BAU')
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

    renderWalkthroughCases(document.querySelector('#walkthroughCases'), selectedCase, 'VND', formulas)

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    expect(document.querySelector('#walkthroughCases').textContent).toContain('Net = EVN + Developer')
    // Payment build-up is in the details panel
    expect(document.querySelector('#selectedHourDetailsPanel .settlement-grid')).not.toBeNull()
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('Payment to EVN per kWh of factory load')
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

    renderWalkthroughCases(document.querySelector('#walkthroughCases'), selectedCase, 'VND')

    const text = normalizedText('#walkthroughCases')

    expect(text).toContain('Load = Gen')
    expect(text).toContain('EVN =')
    expect(text).toContain('Net = EVN + Developer')
    expect(text).toContain('FMP (1,190.00 VND/kWh) × Kpp (1.027) × 4,700 kWh')
    expect(text).toContain('Developer =')
    expect(text).toContain('− FMP (1,190.00 VND/kWh) × 4,700 kWh + Strike (1,741.35 VND/kWh) × 4,700 kWh')
    expect(text).toContain('EVN = FMP (1,190.00 VND/kWh) × Kpp (1.027) × 4,700 kWh + CDPPA (523.34 VND/kWh) × 4,700 kWh =')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-cancelled-term')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-retained-term')
    expect(document.querySelectorAll('#walkthroughCases .walkthrough-card')).toHaveLength(1)
  })

  it('shows FMP cancellation terms explicitly for a CFO reader', () => {
    document.body.innerHTML = `
      <div id="walkthroughCases"></div>
      <div id="selectedHourDetailsPanel"></div>
      <div id="mermaidInlineNote"></div>
      <div id="cancellationMermaid"></div>
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

    renderWalkthroughCases(document.querySelector('#walkthroughCases'), selectedCase, 'VND', breakdown)

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    renderFormulas(breakdown, '', 'VND')

    const text = normalizedText('#walkthroughCases')

    expect(normalizedText('#selectedHourDetailsPanel')).not.toContain('FMP cancellation')
    expect(text).toContain('EVN = FMP (1,224.00 VND/kWh) × Kpp (1.027) × 4,700 kWh + CDPPA (523.34 VND/kWh) × 4,700 kWh')
    expect(text).toContain('Developer =')
    expect(text).toContain('− FMP (1,224.00 VND/kWh) × 4,700 kWh + Strike (1,741.35 VND/kWh) × 4,700 kWh')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-cancelled-term')
    expect(document.querySelector('#walkthroughCases').innerHTML).toContain('net-retained-term result')
    expect(document.querySelector('#cancellationMermaid').textContent).toContain('flowchart LR')
  })
})
