import { test, expect } from '@playwright/test'

test('?lang=vi resolves and renders without the UNTRANSLATED token', async ({ page }) => {
  await page.goto('/?lang=vi')
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('vi')
  await expect(page.locator('body')).not.toContainText('UNTRANSLATED')
})

test('?lang=zh resolves and renders without the UNTRANSLATED token', async ({ page }) => {
  await page.goto('/?lang=zh')
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('zh')
  await expect(page.locator('body')).not.toContainText('UNTRANSLATED')
})

test('no lang param defaults to English', async ({ page }) => {
  await page.goto('/?present=1')
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en')
  await expect(page.locator('h1')).toHaveText('DPPA CFO visual explainer')
})

test('charts stay live after a language switch and hour nav still works', async ({ page }) => {
  await page.goto('/?present=1')
  await page.locator('[data-lang="vi"]').click()
  // A Chart.js instance sizes its canvas past the 300x150 default; a blank
  // canvas here means the renderer updated a detached instance (2026-09 fix).
  const width = await page.locator('#profileChart').evaluate((c) => c.width)
  expect(width).toBeGreaterThan(300)
  await expect(page.locator('#hourNavLabel')).toHaveText('12:00')
  await page.locator('#nextHour').click()
  await expect(page.locator('#hourNavLabel')).toHaveText('13:00')
})
