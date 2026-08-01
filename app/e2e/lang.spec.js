import { test, expect } from "@playwright/test";

test("?lang=vi resolves and renders without the UNTRANSLATED token", async ({ page }) => {
  await page.goto("/?lang=vi");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("vi");
  await expect(page.locator("body")).not.toContainText("UNTRANSLATED");
});

test("?lang=zh resolves and renders without the UNTRANSLATED token", async ({ page }) => {
  await page.goto("/?lang=zh");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("zh");
  await expect(page.locator("body")).not.toContainText("UNTRANSLATED");
});

test("no lang param defaults to English", async ({ page }) => {
  await page.goto("/?present=1");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("en");
  await expect(page.locator("h1")).toHaveText("DPPA CFO visual explainer");
});
