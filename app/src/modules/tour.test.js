// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { shouldAutoStartTour } from './tour'
describe('tour gating', () => {
  beforeEach(() => localStorage.clear())
  it('honors first visit and mode flags', () => {
    expect(shouldAutoStartTour('', localStorage)).toBe(true)
    expect(shouldAutoStartTour('?teach=1', localStorage)).toBe(false)
    expect(shouldAutoStartTour('?present=1', localStorage)).toBe(false)
    localStorage.setItem('dppa-tour-done', '1')
    expect(shouldAutoStartTour('', localStorage)).toBe(false)
  })
})
