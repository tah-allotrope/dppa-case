import { test, expect } from "@playwright/test";
import { failOnConsoleErrors } from "./helpers.js";

const sliders = [
  { id: "strikePrice", min: "1200", max: "3200" },
  { id: "marketPrice", min: "900", max: "2600" },
  { id: "dppaCharge", min: "250", max: "800" },
  { id: "lossFactor", min: "1", max: "1.08" },
  { id: "evnEscalation", min: "0", max: "0.10" },
  { id: "strikeEscalation", min: "0", max: "0.10" },
  { id: "horizonYears", min: "5", max: "25" },
];

test("sliders drive the bill without NaN/Infinity", async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page);
  await page.goto("/?present=1");

  for (const { id, min, max } of sliders) {
    for (const value of [min, max]) {
      await page.locator(`#${id}`).evaluate((el, v) => {
        el.value = v;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
      await expect(page.locator("#fiveLineBill")).not.toContainText(/NaN|Infinity/);
    }
  }

  assertNoErrors();
});

test("settlement mode and currency toggle stay finite", async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page);
  await page.goto("/?present=1");

  const select = page.locator("#settlementMode");
  for (const value of await select.locator("option").evaluateAll((options) => options.map((o) => o.value))) {
    await select.selectOption(value);
    await expect(page.locator("#fiveLineBill")).not.toContainText(/NaN|Infinity/);
  }

  await page.locator('[data-currency="USD"]').click();
  await expect(page.locator('[data-currency="USD"]')).toHaveClass(/is-active/);
  await expect(page.locator("#fiveLineBill")).not.toContainText(/NaN|Infinity/);
  await page.locator('[data-currency="VND"]').click();

  assertNoErrors();
});

test("hour navigation steps forward and back", async ({ page }) => {
  await page.goto("/?present=1");

  await expect(page.locator("#hourNavLabel")).toHaveText("12:00");
  await page.locator("#nextHour").click();
  await expect(page.locator("#hourNavLabel")).not.toHaveText("12:00");
  await page.locator("#prevHour").click();
  await expect(page.locator("#hourNavLabel")).toHaveText("12:00");
});
