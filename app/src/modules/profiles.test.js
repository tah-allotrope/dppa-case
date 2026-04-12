import { describe, expect, it } from 'vitest'
import { deriveVolumes, scaleProfile, sumVolume } from './profiles'
import { buildFmpCurve } from '../data/default-scenarios'

describe('scaleProfile', () => {
  it('scales each value by the given factor and rounds to integer', () => {
    expect(scaleProfile([100, 200, 300], 1.5)).toEqual([150, 300, 450])
    expect(scaleProfile([100, 150], 0.5)).toEqual([50, 75])
  })

  it('returns an empty array for an empty input', () => {
    expect(scaleProfile([], 2)).toEqual([])
  })
})

describe('deriveVolumes', () => {
  it('derives matched, shortfall, and excess correctly for a shortfall hour', () => {
    const volumes = deriveVolumes([5000], [2000])
    expect(volumes).toHaveLength(1)
    expect(volumes[0]).toEqual({ hour: 0, load: 5000, generation: 2000, matched: 2000, shortfall: 3000, excess: 0 })
  })

  it('derives matched, shortfall, and excess correctly for an excess hour', () => {
    const volumes = deriveVolumes([3000], [5000])
    expect(volumes[0]).toEqual({ hour: 0, load: 3000, generation: 5000, matched: 3000, shortfall: 0, excess: 2000 })
  })

  it('derives matched, shortfall, and excess correctly for a balanced hour', () => {
    const volumes = deriveVolumes([4700], [4700])
    expect(volumes[0]).toEqual({ hour: 0, load: 4700, generation: 4700, matched: 4700, shortfall: 0, excess: 0 })
  })

  it('assigns hour index from the load profile position', () => {
    const volumes = deriveVolumes([100, 200, 300], [50, 250, 300])
    expect(volumes.map((v) => v.hour)).toEqual([0, 1, 2])
  })

  it('defaults generation to 0 when generation profile is shorter than load profile', () => {
    const volumes = deriveVolumes([1000, 2000], [500])
    expect(volumes[1].generation).toBe(0)
    expect(volumes[1].shortfall).toBe(2000)
    expect(volumes[1].matched).toBe(0)
  })
})

describe('sumVolume', () => {
  it('sums a named numeric field across an array of objects', () => {
    const items = [{ load: 100 }, { load: 200 }, { load: 300 }]
    expect(sumVolume(items, 'load')).toBe(600)
  })

  it('returns 0 for an empty array', () => {
    expect(sumVolume([], 'load')).toBe(0)
  })
})

describe('buildFmpCurve', () => {
  it('returns one value per FMP_SHAPE entry (25 entries for 24-hour shape array)', () => {
    const curve = buildFmpCurve(1700)
    // FMP_SHAPE has 25 multipliers — one per shaped segment as defined in default-scenarios.js
    expect(curve).toHaveLength(25)
  })

  it('scales proportionally: off-peak hours are well below the midpoint', () => {
    const curve = buildFmpCurve(1700)
    // Hours 0–4 use multipliers 0.72–0.74 → should be below midpoint
    for (let h = 0; h <= 4; h++) {
      expect(curve[h]).toBeLessThan(1700)
    }
  })

  it('produces evening peak hours well above the midpoint', () => {
    const curve = buildFmpCurve(1700)
    // Hours 17–19 use multipliers 1.38–1.44 → should be above midpoint
    for (let h = 17; h <= 19; h++) {
      expect(curve[h]).toBeGreaterThan(1700)
    }
  })

  it('scales linearly with midpoint: doubling midpoint doubles all values', () => {
    const base = buildFmpCurve(1000)
    const doubled = buildFmpCurve(2000)
    base.forEach((val, i) => {
      expect(doubled[i]).toBe(val * 2)
    })
  })

  it('returns integer values (rounded)', () => {
    const curve = buildFmpCurve(1700)
    curve.forEach((val) => {
      expect(Number.isInteger(val)).toBe(true)
    })
  })
})
