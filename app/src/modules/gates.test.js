// PHASE-04 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): unit tests for
// the shared gate engine. Vectors cross-checked against ## Specification S1/S2 of the plan.
import { describe, expect, it } from 'vitest'
import { DEBT_SHARE, DSCR_TARGET, INVESTOR_LCOE_VND_PER_KWH, evaluateGates } from './gates.js'

const BASE = {
  strikeVndPerKwh: 1500,
  contractedKwhPerMonth: 5000000,
  referenceLoadKwhPerMonth: 5000000,
  fmpVndPerKwh: 1150,
  lifetimeDppaVnd: 1,
  lifetimeBauVnd: 2,
}

describe('evaluateGates', () => {
  it('passes all three gates on a strong cell', () => {
    const gates = evaluateGates(BASE)
    expect(gates.buyerPass).toBe(true)
    expect(gates.lenderPass).toBe(true)
    expect(gates.investorPass).toBe(true)
    expect(gates.allPass).toBe(true)
    expect(gates.bindingGate).toBe(null)
  })

  it('names the lender as the sole blocker at strike 1550 ratio 0.8', () => {
    const gates = evaluateGates({
      ...BASE,
      strikeVndPerKwh: 1550,
      contractedKwhPerMonth: 4000000,
    })
    expect(gates.annualContractRevenueVnd).toBe(74400000000)
    expect(gates.requiredContractRevenueVnd).toBe(78300000000)
    expect(gates.lenderPass).toBe(false)
    expect(gates.investorPass).toBe(true)
    expect(gates.buyerPass).toBe(true)
    expect(gates.bindingGate).toBe('lender')
  })

  it('names the investor as the sole blocker at strike 1400 ratio 1.0', () => {
    const gates = evaluateGates({ ...BASE, strikeVndPerKwh: 1400 })
    expect(gates.investorPass).toBe(false)
    expect(gates.bindingGate).toBe('investor')
    expect(gates.blendedRevenuePerKwh).toBe(1400)
  })

  it('names the buyer as the sole blocker when lifetime cost exceeds BAU', () => {
    const gates = evaluateGates({
      ...BASE,
      strikeVndPerKwh: 1450,
      contractedKwhPerMonth: 6000000,
      lifetimeDppaVnd: 2,
      lifetimeBauVnd: 1,
    })
    expect(gates.buyerPass).toBe(false)
    expect(gates.bindingGate).toBe('buyer')
    expect(gates.blendedRevenuePerKwh).toBe(1450)
  })

  it('handles zero contracted volume without NaN', () => {
    const gates = evaluateGates({ ...BASE, contractedKwhPerMonth: 0 })
    expect(gates.annualContractRevenueVnd).toBe(0)
    expect(gates.lenderPass).toBe(false)
    expect(gates.blendedRevenuePerKwh).toBe(1150)
    for (const value of Object.values(gates)) {
      if (typeof value === 'number') expect(Number.isNaN(value)).toBe(false)
    }
  })

  it('guards the division on zero reference load', () => {
    const gates = evaluateGates({ ...BASE, referenceLoadKwhPerMonth: 0 })
    expect(gates.blendedRevenuePerKwh).toBe(0)
    for (const value of Object.values(gates)) {
      if (typeof value === 'number') expect(Number.isNaN(value)).toBe(false)
    }
  })

  it('reports no binding gate when two gates fail at once', () => {
    const gates = evaluateGates({
      ...BASE,
      strikeVndPerKwh: 1100,
      contractedKwhPerMonth: 3500000,
    })
    expect(gates.lenderPass).toBe(false)
    expect(gates.investorPass).toBe(false)
    expect(gates.bindingGate).toBe(null)
  })

  it('keeps the illustrative constants at their specified values', () => {
    expect(DSCR_TARGET).toBe(1.2)
    expect(DEBT_SHARE).toBe(0.75)
    expect(INVESTOR_LCOE_VND_PER_KWH).toBe(1450)
  })
})
