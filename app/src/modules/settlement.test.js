import { describe, expect, it } from 'vitest'
import { buildFormulaBreakdown, buildSelectedWalkthroughCase, buildWalkthroughCases, calculateSettlement, classifyInterval } from './settlement'

describe('calculateSettlement', () => {
  it('reproduces the simple matched case from the report logic', () => {
    const result = calculateSettlement({
      loadProfile: [5000],
      generationProfile: [2000],
      settlementMode: 'matched',
      strikePrice: 2100,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    })

    expect(result.totals.evnTotal).toBeCloseTo(10038374.2, 4)
    expect(result.totals.developerTotal).toBeCloseTo(800000, 5)
    expect(result.totals.totalCost).toBeCloseTo(10838374.2, 4)
    expect(result.totals.matchedPrice).toBeCloseTo(2669.6871, 4)
  })

  it('flags excess risk when contract quantity is based on generation beyond matched consumption', () => {
    const result = calculateSettlement({
      loadProfile: [5000],
      generationProfile: [7500],
      settlementMode: 'generation',
      strikePrice: 2100,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 3398,
    })

    expect(result.totals.contractTotal).toBe(7500)
    expect(result.totals.excessRisk).toBe(true)
    expect(result.totals.blendedPrice).toBeCloseTo(2869.6871, 4)
  })

  it('builds a cancellation explanation with the implied matched price', () => {
    const inputs = {
      strikePrice: 2100,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
    }
    const breakdown = buildFormulaBreakdown(inputs, { impliedCancellation: 2669.6871 })

    expect(breakdown.impliedCancellation).toBeCloseTo(2669.6871, 4)
  })

  it('computes BAU versus DPPA comparison fields for a selected hour', () => {
    const result = calculateSettlement({
      loadProfile: [5000],
      generationProfile: [2000],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    })

    const breakdown = buildFormulaBreakdown({
      strikePrice: 1741.35,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }, result.intervals[0])

    expect(breakdown.bauCost).toBe(9165000)
    expect(breakdown.dppaCost).toBeCloseTo(result.intervals[0].total, 5)
    expect(breakdown.savingsVsBau).toBeCloseTo(-956074.2, 4)
    expect(breakdown.bauUnitCost).toBeCloseTo(1833, 4)
    expect(breakdown.dppaUnitCost).toBeCloseTo(result.intervals[0].total / 5000, 6)
    expect(breakdown.evnUnitCost).toBeCloseTo(result.intervals[0].evnTotal / 5000, 6)
    expect(breakdown.developerUnitCost).toBeCloseTo(result.intervals[0].developer / 5000, 6)
  })

  it('exposes explicit spot-price cancellation fields for clean matched hours', () => {
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

    const result = calculateSettlement(inputs)
    const breakdown = buildFormulaBreakdown(inputs, result.intervals[0])

    expect(breakdown.cleanCancellation).toBe(true)
    expect(breakdown.spotMarketVisibleRate).toBeCloseTo(1700, 6)
    expect(breakdown.cancellationViaSwapRate).toBeCloseTo(-1700, 6)
    expect(breakdown.retainedEnergyRate).toBeCloseTo(breakdown.impliedCancellation, 4)
  })

  it('computes cancellation mismatch details when contract exceeds matched volume', () => {
    const result = calculateSettlement({
      loadProfile: [5000],
      generationProfile: [7500],
      settlementMode: 'generation',
      strikePrice: 1741.35,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    })

    const breakdown = buildFormulaBreakdown({
      strikePrice: 1741.35,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }, result.intervals[0])

    expect(breakdown.cleanCancellation).toBe(false)
    expect(breakdown.mismatchVolume).toBe(2500)
    expect(breakdown.uncancelledContractVolume).toBe(2500)
    expect(breakdown.cleanCancelledEnergy).toBe(5000)
  })

  it('classifies selected intervals for point-in-time storytelling', () => {
    expect(classifyInterval({ load: 5, generation: 2 }).key).toBe('shortfall')
    expect(classifyInterval({ load: 2, generation: 5 }).key).toBe('excess')
    expect(classifyInterval({ load: 4, generation: 4 }).key).toBe('balanced')
  })

  it('builds CFO walkthrough cases for shortfall, balanced, and excess intervals', () => {
    const inputs = {
      loadProfile: [5000, 4700, 3600],
      generationProfile: [2400, 4700, 5200],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const result = calculateSettlement(inputs)
    const cases = buildWalkthroughCases(inputs, result.intervals)

    expect(cases).toHaveLength(3)
    expect(cases.map((item) => item.classification.key)).toEqual(['shortfall', 'balanced', 'excess'])
    expect(cases[0].caseLabel).toBe('Load > Gen')
    expect(cases[1].caseLabel).toBe('Load = Gen')
    expect(cases[2].caseLabel).toBe('Load < Gen')
    expect(cases[0].headline).toContain('Under-supply')
    expect(cases[1].headline).toContain('Balanced')
    expect(cases[2].headline).toContain('Over-supply')
  })

  it('builds the single walkthrough card for the currently selected hour', () => {
    const inputs = {
      loadProfile: [5000, 4700, 3600],
      generationProfile: [2400, 4700, 5200],
      settlementMode: 'matched',
      strikePrice: 1741.35,
      marketPrice: 1700,
      dppaCharge: 523.34,
      lossFactor: 1.027263,
      retailTariff: 1833,
    }

    const result = calculateSettlement(inputs)
    const selectedCase = buildSelectedWalkthroughCase(inputs, result.intervals[2])

    expect(selectedCase.caseLabel).toBe('Load < Gen')
    expect(selectedCase.headline).toContain('Over-supply')
    expect(selectedCase.hour).toBe(2)
    expect(selectedCase.totalNoDppa).toBe(result.intervals[2].baseline)
  })

  it('keeps the default strike price at 5% below the weighted retail tariff basis', async () => {
    const { defaultInputs } = await import('../data/default-scenarios')

    expect(defaultInputs.strikePrice).toBeCloseTo(defaultInputs.retailTariff * 0.95, 2)
  })
})
