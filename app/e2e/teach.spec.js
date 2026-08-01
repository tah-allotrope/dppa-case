import { test, expect } from "@playwright/test";
import { failOnConsoleErrors } from "./helpers.js";
import { teachSteps } from "../src/data/teach-steps.js";
import { STRINGS } from "../src/data/strings.js";

test("teach banner is absent without the flag", async ({ page }) => {
  await page.goto("/?present=1");
  await expect(page.locator("#teachBanner")).toHaveCount(0);
});

test("teach mode steps forward through all six demos via buttons", async ({ page }) => {
  const assertNoErrors = failOnConsoleErrors(page);
  await page.goto("/?teach=1");

  const counter = page.locator("#teachBanner .teach-step-counter");
  const annotation = page.locator("#teachBanner .teach-annotation");

  for (let i = 0; i < teachSteps.length; i += 1) {
    await expect(counter).toHaveText(`Demo ${i + 1}/${teachSteps.length} — ${STRINGS.en[teachSteps[i].titleKey]}`);
    await expect(annotation).toHaveText(STRINGS.en[teachSteps[i].annotationKey]);
    if (i < teachSteps.length - 1) await page.locator("#teachNext").click();
  }

  assertNoErrors();
});

test("teach mode steps backward via arrow keys and wraps", async ({ page }) => {
  await page.goto("/?teach=1");
  const counter = page.locator("#teachBanner .teach-step-counter");

  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText(`Demo ${teachSteps.length}/${teachSteps.length} — ${STRINGS.en[teachSteps[teachSteps.length - 1].titleKey]}`);

  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText(`Demo 1/${teachSteps.length} — ${STRINGS.en[teachSteps[0].titleKey]}`);
});
