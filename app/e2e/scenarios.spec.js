import { test, expect } from '@playwright/test'
import { failOnConsoleErrors } from './helpers.js'

test('scenario tabs render bills and charts', async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page)
  await page.goto('/?present=1')
  for (const tab of await page.locator('[data-scenario]').all()) {
    await tab.click()
    await expect(page.locator('#fiveLineBill')).not.toContainText(/NaN|Infinity/)
    await expect(page.locator('#profileChart')).toBeVisible()
    await expect(page.locator('#multiYearChart')).toBeVisible()
  }
  assertNoErrors()
})
