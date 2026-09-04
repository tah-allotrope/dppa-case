// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultInputs, buildFmpCurve } from '../data/default-scenarios.js'
import { chartAnimation, renderTariffCaption, takeOver } from './chart.js'
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

describe('takeOver', () => {
  it('keeps a live instance bound to the same canvas', () => {
    const canvas = {}
    const instance = { canvas, destroy: vi.fn() }
    expect(takeOver(instance, canvas)).toBe(instance)
    expect(instance.destroy).not.toHaveBeenCalled()
  })

  it('destroys a stale instance when the canvas changed underneath it', () => {
    const instance = { canvas: {}, destroy: vi.fn() }
    expect(takeOver(instance, {})).toBeUndefined()
    expect(instance.destroy).toHaveBeenCalledTimes(1)
  })

  it('tolerates an empty slot', () => {
    expect(takeOver(undefined, {})).toBeUndefined()
  })
})

describe('chartAnimation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps animation when motion is not reduced', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(chartAnimation({ duration: 200 })).toEqual({ duration: 200 })
  })

  it('disables animation under webdriver', () => {
    vi.stubGlobal('navigator', { webdriver: true })
    expect(chartAnimation({ duration: 350 })).toBe(false)
  })
  it('disables animation when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(chartAnimation({ duration: 350 })).toBe(false)
  })

  it('keeps animation when motion is not reduced', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(chartAnimation({ duration: 200 })).toEqual({ duration: 200 })
  })
})
