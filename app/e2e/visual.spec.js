import { test, expect } from "@playwright/test";

for (const theme of ["default", "present"]) {
  test(`@visual ${theme} scenarios`, async ({ page }) => {
    await page.goto(theme === "present" ? "/?present=1" : "/?test=1");
    await page.evaluate(() => localStorage.setItem("dppa-tour-done", "1"));
    await page.reload();
    for (const tab of await page.locator("[data-scenario]").all()) {
      await tab.click();
      await expect(page).toHaveScreenshot(`${theme}-${await tab.getAttribute("data-scenario")}.png`, {
        fullPage: true,
      });
    }
  });
}
