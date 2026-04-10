// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { buildFmpCurve, defaultInputs, scenarioOrder, scenarioProfiles, settlementModes } from '../data/default-scenarios'
import { buildSelectedWalkthroughCase, calculateSettlement, buildFormulaBreakdown, buildSelectedIntervalNarrative } from './settlement'
import { renderAppShell, renderFormulas, renderSelectedHour, renderSelectedHourDetails, renderWalkthroughCases } from './ui'

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
    expect(document.querySelector('.focus-column > .chart-panel + .walkthrough-panel')).not.toBeNull()
    expect(document.querySelector('.story-grid + .lower-grid')).not.toBeNull()
  })
})

describe('selected-hour layout', () => {
  it('keeps the top selected-hour panel compact and moves payment equations below', () => {
    document.body.innerHTML = `
      <div id="selectedHourPanel"></div>
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

    renderSelectedHour(
      document.querySelector('#selectedHourPanel'),
      interval,
      buildSelectedIntervalNarrative(interval, inputs),
      'VND',
      'flow',
      inputs,
    )

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    expect(document.querySelector('#selectedHourPanel .settlement-grid')).toBeNull()
    expect(document.querySelector('#selectedHourPanel').textContent).toContain('DPPA total this hour')
    expect(document.querySelector('#selectedHourDetailsPanel .settlement-grid')).not.toBeNull()
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('Payment to EVN per kWh of factory load')
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('FMP cancellation')
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

    expect(document.querySelector('#walkthroughCases').textContent).toContain('Load = Gen')
    expect(document.querySelector('#walkthroughCases').textContent).toContain('Total (No-DPPA)')
    expect(document.querySelectorAll('#walkthroughCases .walkthrough-card')).toHaveLength(1)
  })

  it('shows spot market price and its cancellation explicitly for a CFO reader', () => {
    document.body.innerHTML = `
      <div id="selectedHourPanel"></div>
      <div id="selectedHourDetailsPanel"></div>
      <div id="cancellationFigures"></div>
      <pre id="evnExpression"></pre>
      <pre id="developerExpression"></pre>
      <pre id="cancellationResult"></pre>
      <div id="cancellationMermaid"></div>
      <ul id="explainList"></ul>
      <div id="warningBanner"></div>
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

    renderSelectedHour(
      document.querySelector('#selectedHourPanel'),
      interval,
      buildSelectedIntervalNarrative(interval, inputs),
      'VND',
      'flow',
      inputs,
    )

    renderSelectedHourDetails(
      document.querySelector('#selectedHourDetailsPanel'),
      interval,
      'VND',
      inputs,
    )

    renderFormulas(breakdown, '', 'VND')

    expect(document.querySelector('#selectedHourPanel').textContent).toContain('Spot market reference')
    expect(document.querySelector('#selectedHourPanel').textContent).toContain('Cancellation via developer swap')
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('FMP × matched')
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('− FMP × aligned')
    expect(document.querySelector('#cancellationResult').textContent).toContain('spot market price is shown first')
  })
})
