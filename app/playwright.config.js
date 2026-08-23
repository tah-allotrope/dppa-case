import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // CI-only retry for a transient browser-launch flake ("Target page, context
  // or browser has been closed"), observed under CI's parallel workers on
  // teach.spec.js — reproduced 2026-08-23: failed under `npm run e2e` with 2
  // parallel workers, then passed cleanly re-run in isolation with the exact
  // same code. Local runs stay at 0 retries so a real regression fails loudly
  // and immediately instead of being masked by a retry.
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  // Visual specs take up to 6 sequential full-page screenshots per test; the
  // default 30s test timeout can be exceeded even when each shot individually
  // stabilizes well within its own expect timeout.
  timeout: 90000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, timeout: 30000 } },
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", deviceScaleFactor: 1 },
  // reuseExistingServer stays off: the command always rebuilds before serving,
  // and a leftover process from a prior run must never mask fresh source edits
  // with a stale dist/ build (this bit us locally — see deployment.md).
  webServer: { command: "npm run build && npm run preview -- --host 127.0.0.1", port: 4173, reuseExistingServer: false },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 }, launchOptions: { args: ["--disable-gpu"] } } },
    // WebKit's headless text/anti-aliasing output is not pixel-stable run-to-run
    // (observed 2-4% diffs with identical input); functional coverage runs here
    // fully, but pixel-snapshot comparison is scoped to Chromium projects only.
    { name: "webkit-mobile", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }, testIgnore: /visual\.spec\.js/ },
    { name: "chromium-tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 834, height: 1112 }, launchOptions: { args: ["--disable-gpu"] } } },
  ],
});
