// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { defaultInputs, buildFmpCurve } from '../data/default-scenarios.js'
import { renderTariffCaption } from './chart.js'

function setup() {
  document.body.innerHTML = '<div id="tariffCaption"></div>'
}

describe('renderTariffCaption', () => {
  it('renders the strike reference and band chips in VND', () => {
    setup()
    renderTariffCaption({ ...defaultInputs, fmpCurve: buildFmpCurve(1427) }, 'VND')
    const text = document.getElementById('tariffCaption').textContent
    expect(text).toContain('Dashed line = strike price 2,000 VND')
    expect(text).toContain('Off-peak')
    expect(text).toContain('970')
    expect(text).toContain('1,313')
    expect(text).toContain('Standard')
    expect(text).toContain('1,027')
    expect(text).toContain('1,855')
    expect(text).toContain('Peak')
    expect(text).toContain('1,384')
    expect(text).toContain('2,026')
    expect(text).toContain('VND/kWh')
  })

  it('renders the strike reference and band chips in USD, not VND', () => {
    setup()
    renderTariffCaption({ ...defaultInputs, fmpCurve: buildFmpCurve(1427) }, 'USD')
    const text = document.getElementById('tariffCaption').textContent
    expect(text).toContain('Dashed line = strike price 0.0755 USD')
    expect(text).toContain('USD/kWh')
    expect(text).not.toContain('VND')
    expect(text).not.toContain('2,000')
  })

  it('does nothing when #tariffCaption is absent', () => {
    document.body.innerHTML = ''
    expect(() => renderTariffCaption(defaultInputs, 'VND')).not.toThrow()
  })

  it('collapses a flat FMP curve to a single value per band chip', () => {
    setup()
    renderTariffCaption({ ...defaultInputs, fmpCurve: undefined, marketPrice: 1427 }, 'VND')
    const text = document.getElementById('tariffCaption').textContent
    expect(text).toContain('1,427')
    expect(text).not.toContain('–')
  })
})
