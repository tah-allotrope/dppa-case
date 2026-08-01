import { test, expect } from "@playwright/test";
test("first visit completes tour", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#tourOverlay")).toBeVisible();
  await expect(page.locator(".tour-en")).not.toBeEmpty();
  for (let i = 0; i < 4; i += 1) await page.locator('[data-tour="next"]').click();
  await expect(page.locator("#tourOverlay")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#tourOverlay")).toHaveCount(0);
});
test("non-English tour shows the English line as a secondary caption", async ({ page }) => {
  await page.goto("/?lang=vi");
  await expect(page.locator("#tourOverlay")).toBeVisible();
  await expect(page.locator(".tour-vi")).not.toBeEmpty();
});
test("teach suppresses tour", async ({ page }) => {
  await page.goto("/?teach=1");
  await expect(page.locator("#tourOverlay")).toHaveCount(0);
});
