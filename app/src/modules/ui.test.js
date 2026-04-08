// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { calculateSettlement, buildFormulaBreakdown, buildSelectedIntervalNarrative } from './settlement'
import { renderFormulas, renderSelectedHour, renderSelectedHourDetails } from './ui'

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
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('Cancellation shown in red')
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
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('Spot market reference')
    expect(document.querySelector('#selectedHourDetailsPanel').textContent).toContain('net retained energy slice')
    expect(document.querySelector('#cancellationResult').textContent).toContain('spot market price is shown first')
  })
})
