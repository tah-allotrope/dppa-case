// PHASE-04 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): the live
// three-gate panel renders on every scenario tab with no NaN/Infinity.
import { test, expect } from '@playwright/test'
import { failOnConsoleErrors } from './helpers.js'

test('gate panel renders three lamps on every scenario tab', async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page)
  await page.goto('/?present=1')
  for (const tab of await page.locator('[data-scenario]').all()) {
    await tab.click()
    const panel = page.locator('#gatePanel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('.summary-pill')).toHaveCount(3)
    await expect(panel).not.toContainText(/NaN|Infinity/)
  }
  assertNoErrors()
})
