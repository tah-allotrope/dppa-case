// @vitest-environment jsdom
// PHASE-06 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): grading and
// tolerance tests for the presenter drill, plus DOM-wiring coverage so the overlay code
// does not endanger the coverage ratchet.
import { beforeEach, describe, expect, it } from 'vitest'
import { buildFiveLineBill } from './settlement.js'
import { defaultInputs, scenarioProfiles } from '../data/default-scenarios.js'
import { formatDrillDuration, gradeBillEntry, initDrillMode, loadDrillRecords } from './drill.js'

function s1Bill() {
  const profile = scenarioProfiles.workshop1
  return buildFiveLineBill(
    {
      fmp: profile.overrides.marketPrice,
      strikePrice: profile.overrides.strikePrice,
      serviceFee: defaultInputs.dppaServiceFee,
      clearingFee: defaultInputs.dppaClearingFee,
      lossFactorPrecise: 1.026 * 1.008,
      lossFactor: defaultInputs.lossFactor,
      retailTariff: defaultInputs.retailTariff,
    },
    profile.monthlyVolumes,
  )
}

function enteredFrom(bill, mutate = {}) {
  const entered = {}
  for (const key of [
    'marketEnergy',
    'systemService',
    'diffClearing',
    'additionalPurchase',
    'cfd',
  ]) {
    entered[key] = bill.lines[key]
  }
  return { ...entered, ...mutate }
}

describe('gradeBillEntry', () => {
  it('grades an exact entry as fully correct', () => {
    const bill = s1Bill()
    const grading = gradeBillEntry(enteredFrom(bill), bill)
    expect(grading.allCorrect).toBe(true)
    expect(grading.correctCount).toBe(5)
    for (const line of Object.values(grading.lines)) {
      expect(line.deltaVnd).toBe(0)
    }
  })

  it('accepts a 0.4% deviation inside the 0.5% tolerance', () => {
    const bill = s1Bill()
    const grading = gradeBillEntry(
      enteredFrom(bill, { marketEnergy: Math.round(bill.lines.marketEnergy * 1.004) }),
      bill,
    )
    expect(grading.allCorrect).toBe(true)
    expect(grading.correctCount).toBe(5)
  })

  it('rejects a 0.6% deviation outside the tolerance', () => {
    const bill = s1Bill()
    const entered = Math.round(bill.lines.marketEnergy * 1.006)
    const grading = gradeBillEntry(enteredFrom(bill, { marketEnergy: entered }), bill)
    expect(grading.allCorrect).toBe(false)
    expect(grading.correctCount).toBe(4)
    expect(grading.lines.marketEnergy.correct).toBe(false)
    expect(grading.lines.marketEnergy.deltaVnd).toBeGreaterThan(0)
  })

  it('takes no tolerance on a zero-expected line', () => {
    const bill = s1Bill()
    expect(bill.lines.additionalPurchase).toBe(0)
    const grading = gradeBillEntry(enteredFrom(bill, { additionalPurchase: 1 }), bill)
    expect(grading.lines.additionalPurchase.correct).toBe(false)
  })

  it('grades a correct negative CfD with absolute tolerance', () => {
    const bill = s1Bill()
    const negative = { ...bill, lines: { ...bill.lines, cfd: -500000000 } }
    const grading = gradeBillEntry(enteredFrom(negative), negative)
    expect(grading.lines.cfd.correct).toBe(true)
  })
})

describe('formatDrillDuration', () => {
  it('formats 65 seconds as 01:05', () => {
    expect(formatDrillDuration(65000)).toBe('01:05')
  })

  it('formats just under an hour as 59:59', () => {
    expect(formatDrillDuration(3599000)).toBe('59:59')
  })
})

describe('initDrillMode', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.localStorage.clear()
  })

  it('stays inert without the drill flag', () => {
    initDrillMode('?teach=1')
    expect(document.querySelector('#drillOverlay')).toBe(null)
  })

  it('builds the overlay with the drill flag', () => {
    initDrillMode('?drill=1')
    expect(document.querySelector('#drillOverlay')).not.toBe(null)
    expect(document.querySelectorAll('[data-drill-line]').length).toBe(5)
  })

  it('grades a perfect attempt and persists the best time', () => {
    document.body.innerHTML = `
      <div id="fiveLineBill"></div>
      <input id="marketPrice" value="1150">
      <input id="strikePrice" value="1250">
      <input id="lossFactor" value="1.0342">
    `
    initDrillMode('?drill=1')
    expect(document.querySelector('#fiveLineBill').hidden).toBe(true)
    const bill = s1Bill()
    for (const key of Object.keys(bill.lines)) {
      const input = document.querySelector(`[data-drill-line="${key}"]`)
      input.value = String(bill.lines[key] / 1e6)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    document.querySelector('#drillSubmit').click()
    expect(document.querySelector('.drill-result').textContent).toContain('5 of 5 lines correct')
    const records = loadDrillRecords(window.localStorage)
    expect(records.workshop1.streak).toBe(1)
    expect(records.workshop1.bestMs).not.toBe(null)

    document.body.innerHTML = `
      <div id="fiveLineBill"></div>
      <input id="marketPrice" value="1150">
      <input id="strikePrice" value="1250">
      <input id="lossFactor" value="1.0342">
    `
    initDrillMode('?drill=1')
    expect(document.querySelector('.drill-best').textContent).toContain('Best on workshop1')
  })

  it('marks a wrong line and resets the streak', () => {
    document.body.innerHTML = `
      <div id="fiveLineBill"></div>
      <input id="marketPrice" value="1150">
      <input id="strikePrice" value="1250">
      <input id="lossFactor" value="1.0342">
    `
    initDrillMode('?drill=1')
    const bill = s1Bill()
    for (const key of Object.keys(bill.lines)) {
      document.querySelector(`[data-drill-line="${key}"]`).value = String(bill.lines[key] / 1e6)
    }
    document.querySelector('[data-drill-line="marketEnergy"]').value = '1'
    document.querySelector('#drillSubmit').click()
    expect(document.querySelector('.drill-result').textContent).toContain('4 of 5 lines correct')
    expect(loadDrillRecords(window.localStorage).workshop1.streak).toBe(0)
    document.querySelector('#drillReset').click()
    expect(document.querySelector('.drill-result').textContent).toBe('')
  })
})
