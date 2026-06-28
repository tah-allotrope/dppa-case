import { describe, expect, it } from 'vitest'
import { buildFiveLineBill, buildFormulaBreakdown, buildSelectedWalkthroughCase, buildWalkthroughCases, calculateSettlement, classifyInterval, projectMultiYear } from './settlement'

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

  it('projectMultiYear with zero escalation equals 365 × single-day settlement', () => {
    const inputs = {
      loadProfile: [5000],
      generationProfile: [5000],
      settlementMode: 'matched',
      strikePrice: 2000,
      marketPrice: 1427,
      dppaCharge: 523.34,
      lossFactor: 1.0342,
      retailTariff: 2204,
    }
    const singleDay = calculateSettlement(inputs)
    const result = projectMultiYear(inputs, { years: 5, evnEscalation: 0, strikeEscalation: 0 })

    // Each year should equal 365 × single day, and cumulative should compound cleanly
    expect(result.yearlyData[0].bau).toBeCloseTo(singleDay.totals.baselineCost * 365, 0)
    expect(result.yearlyData[0].dppa).toBeCloseTo(singleDay.totals.totalCost * 365, 0)
    expect(result.yearlyData[4].cumBau).toBeCloseTo(singleDay.totals.baselineCost * 365 * 5, 0)
    expect(result.yearlyData[4].cumDppa).toBeCloseTo(singleDay.totals.totalCost * 365 * 5, 0)
    expect(result.years).toBe(5)
    expect(result.evnEscalation).toBe(0)
    expect(result.strikeEscalation).toBe(0)
  })

  it('projectMultiYear compounds retailTariff and strikePrice correctly by year', () => {
    const inputs = {
      loadProfile: [5000],
      generationProfile: [5000],
      settlementMode: 'matched',
      strikePrice: 2000,
      marketPrice: 1427,
      dppaCharge: 523.34,
      lossFactor: 1.0342,
      retailTariff: 2204,
    }
    const result = projectMultiYear(inputs, { years: 3, evnEscalation: 0.04, strikeEscalation: 0.04 })

    // Year 1: factor = 1.0^0 = 1, so no change
    expect(result.yearlyData[0].retailTariff).toBeCloseTo(2204, 4)
    expect(result.yearlyData[0].strikePrice).toBeCloseTo(2000, 4)
    // Year 2: factor = 1.04^1
    expect(result.yearlyData[1].retailTariff).toBeCloseTo(2204 * 1.04, 4)
    expect(result.yearlyData[1].strikePrice).toBeCloseTo(2000 * 1.04, 4)
    // Year 3: factor = 1.04^2
    expect(result.yearlyData[2].retailTariff).toBeCloseTo(2204 * 1.04 ** 2, 4)
    expect(result.yearlyData[2].strikePrice).toBeCloseTo(2000 * 1.04 ** 2, 4)
    // Rollup structures present
    expect(result.rollups.year1).toBeDefined()
    expect(result.rollups.year10).toBeNull()
    expect(result.rollups.lifetime.savings).toBeCloseTo(result.yearlyData[2].cumSavings, 0)
  })

  it('projectMultiYear detects crossover year when cumulative savings first turns positive', () => {
    // BAU rises faster than DPPA cost when EVN escalation > strike escalation
    // Strike held flat (0%) means DPPA cost compounds slower → crossover eventually
    const inputs = {
      loadProfile: [5000],
      generationProfile: [5000],
      settlementMode: 'matched',
      strikePrice: 2000,
      marketPrice: 1427,
      dppaCharge: 523.34,
      lossFactor: 1.0342,
      retailTariff: 2204,
    }
    const result = projectMultiYear(inputs, { years: 20, evnEscalation: 0.06, strikeEscalation: 0 })

    // With 6% EVN escalation and 0% strike escalation BAU compound costs must
    // eventually overtake the fixed DPPA cost — crossover must exist
    expect(result.crossoverYear).not.toBeNull()
    expect(result.crossoverYear).toBeGreaterThan(0)
    expect(result.crossoverYear).toBeLessThanOrEqual(20)
    // cumSavings at crossoverYear - 1 should be ≤ 0, at crossoverYear > 0
    if (result.crossoverYear > 1) {
      expect(result.yearlyData[result.crossoverYear - 2].cumSavings).toBeLessThanOrEqual(0)
    }
    expect(result.yearlyData[result.crossoverYear - 1].cumSavings).toBeGreaterThan(0)
  })

  it('keeps the default pricing basis aligned with verified 2026 reference values', async () => {
    const { defaultInputs, settlementModes } = await import('../data/default-scenarios')

    // Strike: deck Case 6 reference offer (illustrative teaching value)
    expect(defaultInputs.strikePrice).toBe(2000)
    // Retail: Decision 599/QD-EVN 10 May 2025 (+4.8% to 2,204.07 VND/kWh)
    expect(defaultInputs.retailTariff).toBe(2204)
    // Fixed DPPA fees: 360 service + 163.3 balancing per EVN annual notice
    expect(defaultInputs.dppaServiceFee).toBe(360)
    expect(defaultInputs.dppaClearingFee).toBe(163.3)
    expect(defaultInputs.dppaCharge).toBe(523.3)
    // Loss factor: k × K_pp = 1.026 × 1.008 = 1.0342 (Decree 57/2025)
    expect(defaultInputs.lossFactor).toBe(1.0342)
    expect(settlementModes.map((mode) => mode.label)).toEqual([
      'Matched consumption only',
      'Demo: generation volume',
      'Demo: contracted allocation',
    ])
  })

  it('reproduces corrected July deck Workshop 1 five-line bill', () => {
    const bill = buildFiveLineBill({
      fmp: 1150,
      strikePrice: 1250,
      serviceFee: 360,
      clearingFee: 163.3,
      lossFactorPrecise: 1.026 * 1.008,
      retailTariff: 2204,
    }, {
      contracted: 5000000,
      total: 5000000,
    })

    expect(bill.lines.marketEnergy).toBe(5946696000)
    expect(bill.lines.systemService).toBe(1800000000)
    expect(bill.lines.diffClearing).toBe(816500000)
    expect(bill.lines.additionalPurchase).toBe(0)
    expect(bill.cEvn).toBe(8563196000)
    expect(bill.lines.cfd).toBe(500000000)
    expect(bill.cKh).toBe(9063196000)
    expect(bill.plantRevenue.market).toBe(5796000000)
    expect(bill.plantRevenue.total).toBe(6296000000)
  })

  it('reproduces corrected July deck Workshop 2 five-line bill', () => {
    const bill = buildFiveLineBill({
      fmp: 1600,
      strikePrice: 1500,
      serviceFee: 360,
      clearingFee: 163.3,
      lossFactorPrecise: 1.026 * 1.008,
      retailTariff: 2204,
    }, {
      contracted: 8000000,
      total: 9000000,
    })

    expect(bill.lines.marketEnergy).toBe(13237862400)
    expect(bill.lines.systemService).toBe(2880000000)
    expect(bill.lines.diffClearing).toBe(1306400000)
    expect(bill.lines.additionalPurchase).toBe(2204000000)
    expect(bill.cEvn).toBe(19628262400)
    expect(bill.lines.cfd).toBe(-800000000)
    expect(bill.cKh).toBe(18828262400)
    expect(bill.plantRevenue.market).toBe(12902400000)
    expect(bill.plantRevenue.total).toBe(12102400000)
  })

  it('reproduces Workshop 3 excess/over-generation five-line bill', () => {
    const bill = buildFiveLineBill({
      fmp: 1100,
      strikePrice: 1250,
      serviceFee: 360,
      clearingFee: 163.3,
      lossFactorPrecise: 1.026 * 1.008,
      retailTariff: 2204,
    }, {
      contracted: 5000000,
      total: 5000000,
    })

    expect(bill.lines.marketEnergy).toBe(5688144000)
    expect(bill.lines.systemService).toBe(1800000000)
    expect(bill.lines.diffClearing).toBe(816500000)
    expect(bill.lines.additionalPurchase).toBe(0)
    expect(bill.cEvn).toBe(8304644000)
    expect(bill.lines.cfd).toBe(750000000)
    expect(bill.cKh).toBe(9054644000)
    expect(bill.plantRevenue.market).toBe(5544000000)
    expect(bill.plantRevenue.total).toBe(6294000000)
  })
})
