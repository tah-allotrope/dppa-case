import { test, expect } from "@playwright/test";
test("first visit completes bilingual tour",async({page})=>{await page.goto("/");await expect(page.locator("#tourOverlay")).toBeVisible();await expect(page.locator(".tour-vi")).not.toBeEmpty();for(let i=0;i<4;i+=1)await page.locator('[data-tour="next"]').click();await expect(page.locator("#tourOverlay")).toHaveCount(0);await page.reload();await expect(page.locator("#tourOverlay")).toHaveCount(0);});
test("teach suppresses tour",async({page})=>{await page.goto("/?teach=1");await expect(page.locator("#tourOverlay")).toHaveCount(0);});
