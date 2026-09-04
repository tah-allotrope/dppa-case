import { test, expect } from '@playwright/test'
import { failOnConsoleErrors } from './helpers.js'

const sliders = [
  { id: 'strikePrice', min: '1200', max: '3200' },
  { id: 'marketPrice', min: '900', max: '2600' },
  { id: 'dppaCharge', min: '250', max: '800' },
  { id: 'lossFactor', min: '1', max: '1.08' },
  { id: 'evnEscalation', min: '0', max: '0.10' },
  { id: 'strikeEscalation', min: '0', max: '0.10' },
  { id: 'horizonYears', min: '5', max: '25' },
]

test('sliders drive the bill without NaN/Infinity', async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page)
  await page.goto('/?present=1')

  for (const { id, min, max } of sliders) {
    for (const value of [min, max]) {
      await page.locator(`#${id}`).evaluate((el, v) => {
        el.value = v
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
      await expect(page.locator('#fiveLineBill')).not.toContainText(/NaN|Infinity/)
    }
  }

  assertNoErrors()
})

test('settlement mode and currency toggle stay finite', async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page)
  await page.goto('/?present=1')

  const select = page.locator('#settlementMode')
  for (const value of await select
    .locator('option')
    .evaluateAll((options) => options.map((o) => o.value))) {
    await select.selectOption(value)
    await expect(page.locator('#fiveLineBill')).not.toContainText(/NaN|Infinity/)
  }

  await page.locator('[data-currency="USD"]').click()
  await expect(page.locator('[data-currency="USD"]')).toHaveClass(/is-active/)
  await expect(page.locator('#fiveLineBill')).not.toContainText(/NaN|Infinity/)
  await page.locator('[data-currency="VND"]').click()

  assertNoErrors()
})

test('hour navigation steps forward and back', async ({ page }) => {
  await page.goto('/?present=1')

  await expect(page.locator('#hourNavLabel')).toHaveText('12:00')
  await page.locator('#nextHour').click()
  await expect(page.locator('#hourNavLabel')).not.toHaveText('12:00')
  await page.locator('#prevHour').click()
  await expect(page.locator('#hourNavLabel')).toHaveText('12:00')
})

test('strike slider moves a whole dong per arrow-key press', async ({ page }) => {
  await page.goto('/?present=1')
  await page.locator('#strikePrice').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#strikePrice')).toHaveValue('1251')
  await expect(page.locator('#fiveLineBill')).not.toContainText(/NaN|Infinity/)
})

test('settlement select keeps text contrast in both themes', async ({ page }) => {
  await page.goto('/?present=1')

  // Relative-luminance contrast (WCAG formula); the present theme once paired
  // near-black text with a near-black fill here (2026-09 fix).
  const ratioOf = (selector) =>
    page.locator(selector).evaluate((el) => {
      const lum = (css) => {
        const [r, g, b] = css
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
        const f = (v) => {
          const s = v / 255
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const cs = getComputedStyle(el)
      const [a, b] = [lum(cs.color), lum(cs.backgroundColor)].sort((x, y) => y - x)
      return (a + 0.05) / (b + 0.05)
    })

  expect(await ratioOf('#settlementMode')).toBeGreaterThanOrEqual(4.5)
  await page.locator('#themeToggle').click()
  expect(await ratioOf('#settlementMode')).toBeGreaterThanOrEqual(4.5)
})
