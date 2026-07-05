---
title: "DPPA App Quality, Visuals & Testing Uplift"
date: "2026-07-05"
status: "draft"
request: "app-quality-visuals-testing"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-05_app-quality-visuals-testing-brainstorm.md"
---

# Plan: DPPA App Quality, Visuals & Testing Uplift

## Objective
Harden the DPPA settlement app (`app/`, live at https://dppa-case.web.app) for the October 2026 Modules 1–6 workshop: a regression safety net (Playwright e2e + visual snapshots + CI + auto-deploy), a projector-legible presenter theme built on a token-driven visual system, and a bilingual first-visit guided tour for participants. Safety net lands first so the visual rework happens under protection.

## Context Snapshot
- **Current state:** Vite vanilla-ES-module SPA (~4,600 source lines). `settlement.js` is the tested numeric answer-key engine; `style.css` (1,564 ln) is a dark-only neon theme with partial tokens in `:root` (`--bg`, `--panel`, `--cyan`, etc.); `chart.js` module hardcodes 36 color literals; `flow-diagram.js` is already class-based/themable; `teach.js` (`?teach=1`) injects its banner styles inline. Vitest/jsdom suites (~900 lines) cover engine + UI. No ESLint/Prettier, no CI, manual Firebase deploys, `node_modules` (×2) and `app/dist` committed.
- **Desired state:** Lint + unit + Playwright (Chromium/WebKit × 3 viewports, functional + screenshot snapshots) running in GitHub Actions with auto-deploy to Firebase on green master; dual-theme token system (neon default + high-contrast presenter mode via toggle/`?present=1`/auto-on with `?teach=1`); Chart.js and teach banner styled from tokens; first-visit bilingual EN/VN guided tour; clean git tree.
- **Key repo surfaces:** `app/src/style.css`, `app/src/main.js`, `app/src/modules/{ui,chart,teach,flow-diagram}.js`, `app/src/data/teach-steps.js`, `app/package.json`, `app/firebase.json`, new `app/e2e/`, new `app/playwright.config.js`, new `.github/workflows/ci.yml`, new `.gitignore`, new `app/src/modules/theme.js`, new `app/src/modules/tour.js` + `app/src/data/tour-steps.js`.
- **Out of scope:** Any change to settlement math / scenario presets / worksheet answer keys; full app i18n (only new tour strings are bilingual); new scenarios or teach-mode content; framework migration; Firefox in the test matrix.

## Research Inputs
- `research/2026-07-05_app-quality-visuals-testing-brainstorm.md` — source of all DEC-* decisions, priority order (tests → visuals → onboarding), device matrix, and the two open questions carried into Grill Me.
- `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` — teach mode is presenter-only via `?teach=1`; must stay off the participant path (CON-002 below).

## Assumptions and Constraints
- **ASM-001:** October participants are largely on iPhones/Safari; presenter runs Chrome on a laptop driving a 16:9 projector (worst case 1280×720).
- **ASM-002:** The teach-mode stepping pattern (apply step → scroll → update banner) generalizes to the participant tour without a third-party library.
- **ASM-003:** A GitHub remote and a Firebase Hosting service-account secret can be provisioned (Grill Me Q-001); until then CI/deploy tasks run locally only.
- **ASM-004:** Playwright visual-snapshot baselines are generated and compared only in Linux CI (or a fixed local environment) to avoid cross-OS font-rendering churn; local runs default to functional tests only (`--grep-invert @visual`).
- **CON-001:** `settlement.js` numeric behavior must not change; existing Vitest suites keep passing untouched.
- **CON-002:** Teach mode remains hidden without `?teach=1`; the tour must never auto-run when `teach=1` or `present=1` is active.
- **CON-003:** Neon dark stays the default participant identity; presenter mode is additive.
- **CON-004:** Chart.js animations must be disabled under test (e.g. when `navigator.webdriver` or a `?test=1` flag is set) so screenshots are deterministic.
- **DEC-001..DEC-014:** All fourteen decisions in the brainstorm are fixed inputs; key ones inline: presenter mode = header toggle + `?present=1` + auto-on with `?teach=1` + localStorage (DEC-005); full token-driven cohesion pass (DEC-006); tour reuses teach machinery, 3–5 steps, localStorage-remembered (DEC-007); Playwright smoke + snapshots, Chromium+WebKit at 1280×720 / 390×844 / 834×1112 (DEC-008/010); GitHub Actions + ESLint flat config + Prettier (DEC-009); auto-deploy on green master (DEC-011); untrack `node_modules` and `app/dist` (DEC-013); bilingual EN/VN tour strings (DEC-014).

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Repo hygiene + lint/format toolchain | None | `.gitignore`, untracked deps/dist, ESLint+Prettier configs, clean `npm run lint` |
| PHASE-02 | Playwright functional smoke suite | PHASE-01 | `app/playwright.config.js`, `app/e2e/*.spec.js` covering scenarios, sliders, teach mode |
| PHASE-03 | CI + auto-deploy to Firebase | PHASE-02, Q-001 | `.github/workflows/ci.yml` (lint → unit → e2e → build → deploy) |
| PHASE-04 | Token system + presenter theme + chart/banner cohesion | PHASE-02 | Two-theme `style.css`, `theme.js`, token-driven `chart.js`, de-inlined teach banner |
| PHASE-05 | Visual snapshots + bilingual guided tour | PHASE-03, PHASE-04 | `@visual` snapshot specs per scenario/theme/viewport; `tour.js` + `tour-steps.js` |
| PHASE-06 | Workshop readiness pass | PHASE-05 | Real-device QA checklist run, updated `app/deployment.md`, tagged release |

## Detailed Phases

### PHASE-01 - Repo Hygiene and Lint Toolchain
**Goal**
A clean git tree and a consistent-code baseline before any new code lands.

**Tasks**
- [ ] TASK-01-01: Create root `.gitignore` covering `node_modules/`, `app/node_modules/`, `app/dist/`, `app/test-results/`, `app/playwright-report/`, `.firebase/`.
- [ ] TASK-01-02: `git rm -r --cached node_modules app/node_modules app/dist` and commit (working copies stay on disk).
- [ ] TASK-01-03: Add ESLint (flat config, `eslint:recommended` for browser ES modules + vitest globals in `*.test.js`) and Prettier as devDependencies in `app/package.json`; add `lint`, `lint:fix`, and `format` scripts.
- [ ] TASK-01-04: Run `npm run lint:fix` + `npm run format` across `app/src`; fix remaining warnings by hand without behavior change; confirm `npm test` still passes (CON-001).

**Files / Surfaces**
- `.gitignore` (new, repo root) - untrack generated artifacts.
- `app/package.json` - devDeps + scripts.
- `app/eslint.config.js`, `app/.prettierrc` (new) - toolchain config.
- `app/src/**/*.js` - format-only churn.

**Dependencies**
- None.

**Exit Criteria**
- [ ] `git status` shows no tracked `node_modules` or `dist`; fresh clone + `npm install` + `npm test` works.
- [ ] `npm run lint` exits 0; `npm test` passes unchanged (5 suites).

**Phase Risks**
- **RISK-01-01:** Format churn pollutes future diffs — do formatting as one dedicated commit before any functional change.

### PHASE-02 - Playwright Functional Smoke Suite
**Goal**
Automated real-browser click-throughs that catch crashes and broken states across the projector, phone, and tablet viewports — the safety net for everything after.

**Tasks**
- [ ] TASK-02-01: Add `@playwright/test` devDependency; create `app/playwright.config.js` with projects: `chromium-desktop` (1280×720), `webkit-mobile` (390×844), `chromium-tablet` (834×1112); `webServer` = `npm run dev` (or `vite preview` against a build); `npm run e2e` script.
- [ ] TASK-02-02: `app/e2e/scenarios.spec.js` — for each scenario tab in `default-scenarios.js` (matched / shortfall / excess / workshop presets): click tab, assert five-line bill panel renders non-empty numbers, no console errors, both charts have a canvas with nonzero size.
- [ ] TASK-02-03: `app/e2e/controls.spec.js` — drive each slider/select (strike, market price, DPPA charge, loss factor, settlement mode, escalation, horizon, hour selector, currency toggle) to min/mid/max; assert bill values change and remain finite (no `NaN`/`Infinity` text anywhere).
- [ ] TASK-02-04: `app/e2e/teach.spec.js` — load `/?teach=1`, step all 6 demos forward and back via buttons and arrow keys; assert banner text matches each entry in `teach-steps.js` and target panels scroll into view. Also assert the banner is absent without the flag (CON-002).
- [ ] TASK-02-05: Add a console-error listener helper failing any spec on uncaught page errors.

**Files / Surfaces**
- `app/playwright.config.js`, `app/e2e/*.spec.js` (new).
- `app/package.json` - `e2e` script.
- `app/src/data/default-scenarios.js`, `app/src/data/teach-steps.js` - read-only sources for test parametrization.

**Dependencies**
- PHASE-01 (lint applies to new specs).

**Exit Criteria**
- [ ] `npm run e2e` green locally on all 3 projects; deliberately breaking a scenario id makes it fail.

**Phase Risks**
- **RISK-02-01:** WebKit on Windows can be flaky — if blocking, run WebKit project in CI only and document it.
- **RISK-02-02:** Slider `input` events vs Playwright `fill` mismatch — reuse the `dispatchEvent(new Event('input', {bubbles:true}))` pattern from `teach.js:setControlValue` via `page.evaluate` if native fill doesn't trigger recalc.

### PHASE-03 - CI and Auto-Deploy
**Goal**
Every push runs lint → unit → e2e → build; green master auto-deploys to dppa-case.web.app so the live app is always the tested version.

**Tasks**
- [ ] TASK-03-01: Confirm/create GitHub remote and push `master` (Grill Me Q-001).
- [ ] TASK-03-02: Provision Firebase deploy credentials (`firebase init hosting:github` or manual service account) as repo secret `FIREBASE_SERVICE_ACCOUNT_DPPA_CASE`.
- [ ] TASK-03-03: `.github/workflows/ci.yml` — on push/PR: checkout, setup-node 22, `npm ci` in `app/`, `npm run lint`, `npm test`, `npx playwright install --with-deps chromium webkit`, `npm run e2e`, `npm run build`; upload `playwright-report` on failure.
- [ ] TASK-03-04: Deploy job gated on `github.ref == 'refs/heads/master'` and all checks green: `FirebaseExtended/action-hosting-deploy@v0` with `channelId: live`, `projectId: dppa-case`.
- [ ] TASK-03-05: Update `app/deployment.md`: manual deploy becomes the fallback path; document CI flow and secret rotation.

**Files / Surfaces**
- `.github/workflows/ci.yml` (new).
- `app/deployment.md` - deployment docs.
- `app/firebase.json`, `app/.firebaserc` - referenced by the deploy action (no changes expected).

**Dependencies**
- PHASE-02; external: GitHub remote + Firebase service account (Q-001).

**Exit Criteria**
- [ ] A pushed commit shows a green Actions run through all steps; a master merge updates https://dppa-case.web.app (verify a visible change).
- [ ] A commit with a deliberately failing test blocks the deploy job.

**Phase Risks**
- **RISK-03-01:** Q-001 unanswered blocks the phase — fallback: land `ci.yml` with the deploy job commented out and a `predeploy` npm script (`lint && test && e2e && build`) enforcing the same gate locally; proceed to PHASE-04.

### PHASE-04 - Token System, Presenter Theme, and Visual Cohesion
**Goal**
One token-driven design system implemented by two themes: neon dark (default) and a high-contrast presenter/light theme; Chart.js, flow diagram, and teach banner all read from the same tokens.

**Tasks**
- [ ] TASK-04-01: Audit `style.css` for hardcoded colors/spacing/type outside `:root`; extend the token set (add `--font-size-base`, `--space-*`, `--chart-grid`, `--chart-tooltip-bg`, semantic series tokens `--series-load`, `--series-solar`, etc.). Restructure so tokens live under `:root` (dark defaults) and `[data-theme="present"]` overrides (light bg ≥4.5:1 contrast, body ≥18px, `--shadow: none`, no glow).
- [ ] TASK-04-02: Neutralize decorative effects in presenter theme: `body` radial-gradient glows, `.glow-frame::after`, `backdrop-filter: blur(18px)` on `.panel` → flat panels with visible borders.
- [ ] TASK-04-03: New `app/src/modules/theme.js`: read `?present=1` → `?teach=1` auto-on → localStorage (`dppa-theme`) in that precedence; set `data-theme` on `<html>`; render a header toggle button in the topbar; persist manual choice. Wire from `main.js`.
- [ ] TASK-04-04: Refactor `app/src/modules/chart.js`: replace the 36 color literals with values read from `getComputedStyle(document.documentElement).getPropertyValue(...)`; expose a `refreshChartTheme()` that re-reads tokens and calls `chart.update()` on theme switch; set global `Chart.defaults.font` from tokens; disable animation when `navigator.webdriver` is true (CON-004).
- [ ] TASK-04-05: Move `teach.js` inline `<style>` block into `style.css` using tokens; verify `flow-diagram.js` classes render correctly under both themes and adjust its CSS rules to tokens where they hardcode colors.
- [ ] TASK-04-06: Legibility pass at 1280×720: type scale, panel spacing, chart label sizes readable from the back of a room (Grill Me Q-002 default: ≥18px body, ≥4.5:1 contrast in presenter theme).
- [ ] TASK-04-07: Unit tests: `theme.test.js` (flag precedence, localStorage persistence, `data-theme` attribute, teach auto-on); extend `app/e2e/controls.spec.js` with a theme-toggle smoke (toggle → panel background changes → charts re-render without console errors).

**Files / Surfaces**
- `app/src/style.css` - token restructure + `[data-theme="present"]` block + teach banner styles.
- `app/src/modules/theme.js` + `theme.test.js` (new).
- `app/src/modules/chart.js` - tokens + `refreshChartTheme()` + animation-off-under-test.
- `app/src/modules/teach.js` - remove inline style injection; call presenter auto-on via `theme.js`.
- `app/src/modules/ui.js`, `app/src/main.js` - topbar toggle + init wiring.

**Dependencies**
- PHASE-02 (smoke suite protects the refactor). Not blocked by PHASE-03.

**Exit Criteria**
- [ ] All Vitest suites (including new `theme.test.js`) and the full e2e suite pass in both themes.
- [ ] `?teach=1` renders presenter theme automatically; toggle persists across reloads; no console errors on switch.
- [ ] Grep of `app/src/modules/chart.js` finds zero hardcoded hex/rgba literals.

**Phase Risks**
- **RISK-04-01:** 1,564-line CSS refactor breaks subtle mobile layouts — rely on the PHASE-02 mobile-viewport specs plus manual spot-check against the existing `mobile-*.png` screenshot trail before/after.
- **RISK-04-02:** `getComputedStyle` token reads at module-load time race the stylesheet — read tokens lazily inside chart-build functions, not at import.

### PHASE-05 - Visual Snapshots and Bilingual Guided Tour
**Goal**
Screenshot regression coverage across scenario × theme × viewport, and a first-visit EN/VN tour so participants self-serve.

**Tasks**
- [ ] TASK-05-01: `app/e2e/visual.spec.js` tagged `@visual`: `expect(page).toHaveScreenshot()` for each scenario tab × both themes × the 3 viewports, plus teach banner and tour overlay states; animations disabled via CON-004 hook; mask any timestamp-like regions.
- [ ] TASK-05-02: Generate baselines in CI (Linux) via an update job or first-run commit (ASM-004); document the `--update-snapshots` workflow in `app/deployment.md`; exclude `@visual` from default local `npm run e2e` (`e2e:visual` script for CI).
- [ ] TASK-05-03: `app/src/data/tour-steps.js`: 4 steps — scenario tabs → price sliders → five-line bill panel → hour selector/chart — each `{ target, titleEn, titleVi, bodyEn, bodyVi }` (DEC-014; reuse handout phrasing where possible).
- [ ] TASK-05-04: `app/src/modules/tour.js`: first-visit overlay (dimmed backdrop, highlighted target via cloned teach-mode scroll/step pattern, Next/Back/Skip). Auto-runs once when `localStorage['dppa-tour-done']` is unset AND neither `teach=1` nor `present=1` is present (CON-002); re-launchable from a small header "?" button. Styles in `style.css` via tokens (both themes).
- [ ] TASK-05-05: Tests: `tour.test.js` (first-visit gating, localStorage, flag suppression); `app/e2e/tour.spec.js` (overlay appears on fresh context, absent on second visit, absent under `?teach=1`; full step-through on the mobile viewport).

**Files / Surfaces**
- `app/e2e/visual.spec.js`, `app/e2e/tour.spec.js` (new).
- `app/src/modules/tour.js` + `tour.test.js`, `app/src/data/tour-steps.js` (new).
- `app/src/main.js`, `app/src/style.css`, `app/src/modules/ui.js` - tour init, styles, "?" relaunch button.
- `.github/workflows/ci.yml` - add `e2e:visual` step.

**Dependencies**
- PHASE-04 (themes must be final before baselining screenshots); PHASE-03 for CI baselines (fallback: fixed local baseline environment per RISK-03-01).

**Exit Criteria**
- [ ] `@visual` suite green in CI; an intentional 1-token color change fails it.
- [ ] Fresh incognito visit on a 390px viewport shows the bilingual tour; completing or skipping it never shows it again; `?teach=1` never shows it.

**Phase Risks**
- **RISK-05-01:** Snapshot flake from fonts/animation erodes trust — disable animations, use `maxDiffPixelRatio` ~0.01, baseline only in CI.
- **RISK-05-02:** Vietnamese diacritics render poorly in system font stack — verify `Segoe UI`/system fallbacks on iOS; add an explicit fallback stack if needed.

### PHASE-06 - Workshop Readiness Pass
**Goal**
Prove the whole system on real hardware and freeze a known-good release for October.

**Tasks**
- [ ] TASK-06-01: Real-device QA: presenter laptop + actual/borrowed projector at venue resolution (Q-002), a physical iPhone (Safari) and mid-size tablet against the live URL — walk all 6 teach steps in presenter theme and the tour on mobile; log issues as checklist items and fix.
- [ ] TASK-06-02: Failure-mode drill: offline/venue-wifi test of the deployed app (assets cached after first load?), and a documented fallback (local `vite preview` on the presenter laptop).
- [ ] TASK-06-03: Update `app/deployment.md` + README with theme flags, tour behavior, test commands, and the pre-workshop checklist; tag `v1.0-oct-workshop` on the green commit.

**Files / Surfaces**
- `app/deployment.md`, `README*` - operator docs.
- Git tag - release freeze.

**Dependencies**
- PHASE-05.

**Exit Criteria**
- [ ] Checklist executed on real projector + iPhone with zero unresolved blocking issues; tag pushed; live URL serves the tagged build.

**Phase Risks**
- **RISK-06-01:** Venue hardware unavailable until late — do a dry run on any external display/TV early, keep the venue check as a final gate.

## Verification Strategy
- **TEST-001:** `npm run lint && npm test` in `app/` — unit gate (existing 5 suites + `theme.test.js` + `tour.test.js`), every phase.
- **TEST-002:** `npm run e2e` — functional Playwright suite on 3 projects (PHASE-02 onward); `npm run e2e:visual` in CI for snapshots (PHASE-05).
- **TEST-003:** Settlement invariance: `app/src/modules/settlement.test.js` must pass byte-identical (no edits to it or `settlement.js`) — enforces CON-001 across all phases.
- **MANUAL-001:** After PHASE-04, side-by-side visual diff of both themes against the committed `mobile-*.png`/`desktop-*.png` screenshot trail.
- **MANUAL-002:** PHASE-06 real-device checklist (projector, iPhone Safari, tablet).
- **OBS-001:** GitHub Actions history green on master; Firebase Hosting release list shows CI-driven deploys; a failing test demonstrably blocks deploy (PHASE-03 exit criterion).

## Risks and Alternatives
- **RISK-001:** No GitHub remote/Firebase secret (Q-001) stalls PHASE-03/05 CI baselines — mitigation: local `predeploy` script gate + fixed-environment local snapshot baselines; re-enable CI when provisioned.
- **RISK-002:** The CSS token refactor (PHASE-04) is the largest change surface right before content-edit season — mitigation: it runs entirely under the PHASE-02 functional net, and PHASE-05 snapshots freeze the result.
- **ALT-001:** Third-party tour library (driver.js/shepherd) — rejected: adds a dependency for 4 steps the teach-mode pattern already covers.
- **ALT-002:** Separate presenter build/URL instead of runtime theme — rejected: doubles deploy surface; runtime toggle keeps one artifact.

## Grill Me
1. **Q-001:** Does a GitHub remote with Actions exist (repo is local-only, branch `master`), and can you create a Firebase service account for project `dppa-case`?
   - **Recommended default:** Create a private GitHub repo, push, run `firebase init hosting:github` to mint the secret.
   - **Why this matters:** PHASE-03 entirely, and PHASE-05 snapshot baselining location.
   - **If answered differently:** CI/deploy jobs are replaced by a local `predeploy` npm gate and local snapshot baselines; PHASE-03 shrinks to docs.
2. **Q-002:** Do you know the venue projector spec (resolution/brightness) for October?
   - **Recommended default:** Design worst-case: 1280×720, low brightness — presenter theme ≥18px body, ≥4.5:1 contrast.
   - **Why this matters:** PHASE-04 type/contrast targets and the PHASE-06 QA viewport.
   - **If answered differently:** Higher-res venue (1080p+) allows denser layouts; adjust `chromium-desktop` project viewport and legibility pass accordingly.

## Suggested Next Step
Answer Q-001 (GitHub remote + Firebase secret) so PHASE-03 isn't blocked, then begin PHASE-01. Each phase ends with `TEST-001`/`TEST-002` green before the next starts.
