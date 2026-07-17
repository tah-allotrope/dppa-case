import { describe, expect, it } from 'vitest'
import { buildSpinePack } from './export-spine.mjs'

describe('buildSpinePack', () => {
  it('s1: reproduces the existing committed anchor', () => {
    expect(buildSpinePack('s1').bill.cKh.vnd).toBe(9063196000)
  })

  it('s2: shortfall anchors match the specification', () => {
    const s2 = buildSpinePack('s2')
    expect(s2.bill.cEvn.vnd).toBe(19628262400)
    expect(s2.bill.cKh.vnd).toBe(18828262400)
    expect(s2.bill.lines.additionalPurchase.vnd).toBe(2204000000)
    expect(s2.bill.lines.cfd.vnd).toBe(-800000000)
  })

  it('s3: excess anchors match the specification', () => {
    const s3 = buildSpinePack('s3')
    expect(s3.bill.cEvn.vnd).toBe(8304644000)
    expect(s3.bill.cKh.vnd).toBe(9054644000)
    expect(s3.bill.lines.cfd.vnd).toBe(750000000)
    expect(s3.bill.lines.additionalPurchase.vnd).toBe(0)
  })

  it('s3: excess block is computed from the named constant, not typed', () => {
    const excess = buildSpinePack('s3').excess
    expect(excess).toEqual({
      generationKwh: 6500000,
      excessKwh: 1500000,
      spotValueVnd: 1663200000,
      spotFormulaText: '1,500,000 × 1.008 × 1,100',
      note: 'Narrative only — the excess settles at spot with no CfD; it is not a bill line.',
    })
  })

  it('s2/s3: effective VND/kWh replicates s1 rounding to one decimal', () => {
    expect(buildSpinePack('s2').comparison.effectiveVndPerKwh).toBe(2092)
    expect(buildSpinePack('s3').comparison.effectiveVndPerKwh).toBe(1810.9)
  })

  it('rejects an unknown scenario key', () => {
    expect(() => buildSpinePack('s4')).toThrow()
  })
})
