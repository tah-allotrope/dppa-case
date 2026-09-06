// PHASE-06 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): the presenter
// drill activates on ?drill=1 and the flag survives slider moves (the NON_STATE_PARAM_KEYS
// regression that once stripped ?teach=1).
import { test, expect } from '@playwright/test'
import { failOnConsoleErrors } from './helpers.js'

test('drill overlay activates on ?drill=1 and the flag survives input', async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page)
  await page.goto('/?drill=1')
  await expect(page.locator('#drillOverlay')).toBeVisible()
  await expect(page.locator('#fiveLineBill')).toBeHidden()
  await page.locator('#strikePrice').fill('1400')
  expect(page.url()).toContain('drill=1')
  await expect(page.locator('#drillOverlay')).toBeVisible()
  assertNoErrors()
})

test('no drill overlay without the flag', async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page)
  await page.goto('/')
  await expect(page.locator('#drillOverlay')).toHaveCount(0)
  assertNoErrors()
})
