---
title: "Sprint 1: Workshop Demo Safety"
date: "2026-05-22"
status: "complete"
request: "Multi-phase plan covering GAP-01 (error handling), GAP-05 (loading state), GAP-06 (meta tags), GAP-07 (touch feedback), GAP-08 (Firebase deployment) from workshop readiness gap analysis"
plan_type: "multi-phase"
research_inputs:
  - "reports/2026-05-22-workshop-readiness-gap-analysis.md"
completed: "2026-06-23"
reports:
  - "reports/2026-06-23-sprint-1-phase-01.md"
  - "reports/2026-06-23-sprint-1-phase-02.md"
  - "reports/2026-06-23-sprint-1-phase-03.md"
  - "reports/2026-06-23-sprint-1-phase-04.md"
  - "reports/2026-06-23-sprint-1-completion.md"
---

# Plan: Sprint 1 — Workshop Demo Safety

## Objective
Make the DPPA CFO visual explainer app crash-proof, fast-loading, and deployable so it can survive a live in-person workshop on a projector and on audience phones. This sprint covers the five lowest-effort, highest-impact gaps identified in the gap analysis: error handling, loading state, meta tags, touch feedback, and Firebase deployment. Target: 2 hours total.

## Context Snapshot
- **Current state:** App is functionally complete (35/35 tests pass, build succeeds) but has no error handling, no loading indicator, no social meta tags, no touch feedback styles, and no deployed URL.
- **Desired state:** App handles mermaid/chart errors gracefully, shows a branded loading screen on first paint, has proper meta tags for link sharing, gives tactile feedback on mobile taps, and is live on a public URL.
- **Key repo surfaces:**
  - `app/index.html` — loading state + meta tags
  - `app/src/main.js` — error handling wrappers
  - `app/src/style.css` — touch feedback + loading CSS
  - `app/firebase.json` — deployment config (already exists)
  - `app/public/brand/allotrope-logo.png` — logo for splash
  - `app/public/favicon.svg`, `app/public/favicon.ico` — existing favicons
- **Out of scope:** Bundle size reduction (Sprint 2), chart tap target enlargement (Sprint 2), mermaid mobile reflow (Sprint 2), PWA service worker, offline mode, CI/CD pipeline.

## Research Inputs
- `reports/2026-05-22-workshop-readiness-gap-analysis.md` — Defines all five gaps with severity, current state, and specific file paths. Directly drives this plan's scope and task definitions.

## Assumptions and Constraints
- **ASM-001:** The presenter's laptop can run `npx vite build && npx firebase deploy` in the `app/` directory. Firebase CLI is installed or can be installed globally.
- **ASM-002:** A Firebase project either already exists (bound via `.firebaserc`) or the user will create one during PHASE-04. The plan includes both paths.
- **ASM-003:** The existing `app/public/brand/allotrope-logo.png` is suitable for the loading splash at small resolution.
- **CON-001:** All changes must preserve the existing 35 passing tests. No test regressions.
- **CON-002:** No new npm dependencies — all fixes use vanilla JS/CSS and the existing mermaid + chart.js stack.
- **DEC-001:** Firebase Hosting is the deployment target (config already exists at `app/firebase.json`).

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Error handling — catch mermaid/chart failures gracefully | None | Updated `main.js` with try/catch, fallback messages |
| PHASE-02 | Loading state + meta tags — instant first paint, professional link sharing | None | Updated `index.html` with splash + meta tags, loading CSS |
| PHASE-03 | Touch feedback — active/focus styles for mobile | None | Updated `style.css` with `:active` and `:focus-visible` rules |
| PHASE-04 | Build, verify, and deploy to Firebase Hosting | PHASE-01, PHASE-02, PHASE-03 | Production `dist/`, live public URL |

## Detailed Phases

### PHASE-01 — Error Handling for Live Demo Resilience
**Goal**
Prevent any single rendering failure (mermaid parse error, chart canvas error) from crashing the entire app during a live demo.

**Tasks**
- [ ] TASK-01-01: Wrap `renderMermaidDiagram()` body in try/catch. On error, set `node.innerHTML` to a styled fallback: `<p class="mermaid-fallback">Diagram updating…</p>` and log the error to console.
- [ ] TASK-01-02: Wrap the `renderProfileChart()` call inside `updateView()` in try/catch. On error, log to console but continue rendering the remaining panels (walkthrough, formulas, details, controls).
- [ ] TASK-01-03: Wrap the `await renderMermaidDiagram(mermaidDefinition)` call inside `updateView()` in its own try/catch so a mermaid failure doesn't prevent the rest of the view from updating.
- [ ] TASK-01-04: Add a global `window.addEventListener('unhandledrejection', (e) => { console.error('Unhandled:', e.reason); e.preventDefault() })` at the top of `main.js` to prevent unhandled promise rejections from surfacing as browser error dialogs.
- [ ] TASK-01-05: Add `.mermaid-fallback` CSS class in `style.css` — muted text, italic, centered inside the mermaid card area.

**Files / Surfaces**
- `app/src/main.js` — lines 40-52 (mermaid render), lines 54-79 (updateView)
- `app/src/style.css` — add new `.mermaid-fallback` class near the mermaid section (~line 843)

**Dependencies**
- None

**Exit Criteria**
- [ ] Manually test: set mermaid definition to an invalid string → fallback message appears, rest of app works
- [ ] Manually test: all 3 scenarios + slider extremes → no console errors, no blank panels
- [ ] All 35 existing tests still pass (`npx vitest run` in `app/`)

**Phase Risks**
- **RISK-01-01:** Overly broad try/catch could hide real bugs during development. Mitigation: always `console.error` the caught exception so devtools still shows it.

---

### PHASE-02 — Loading State and Meta Tags
**Goal**
Show a branded loading screen instantly on first paint (before JS loads) and add proper meta tags so the URL looks professional when shared via chat or bookmarked.

**Tasks**
- [ ] TASK-02-01: Add inline HTML inside `<div id="app">` in `index.html` — a centered Allotrope logo + "Loading DPPA Calculator…" text. This static content shows immediately and gets replaced when `renderAppShell()` sets `root.innerHTML`.
- [ ] TASK-02-02: Add inline `<style>` block in `<head>` of `index.html` for the loading state (dark background, centered flexbox, subtle pulse animation on the text). Keep it under 20 lines — it must be inlined to show before CSS bundle loads.
- [ ] TASK-02-03: Add `<meta name="theme-color" content="#050816">` to `<head>` — matches the `--bg` CSS variable so the browser chrome is dark on mobile.
- [ ] TASK-02-04: Add Open Graph meta tags to `<head>`:
  - `<meta property="og:title" content="Vietnam DPPA CFO Calculator">`
  - `<meta property="og:description" content="Visual explainer for Vietnam synthetic DPPA settlement — load matching, EVN payment, developer CfD, and the FMP cancellation effect.">`
  - `<meta property="og:type" content="website">`
- [ ] TASK-02-05: Add `<link rel="apple-touch-icon" href="/favicon.svg">` to `<head>` for iOS home screen bookmarks.

**Files / Surfaces**
- `app/index.html` — the only file modified in this phase

**Dependencies**
- None (can be done in parallel with PHASE-01 and PHASE-03)

**Exit Criteria**
- [ ] Open `index.html` via `npx vite dev` → loading splash appears for ~1s, then app renders over it
- [ ] Throttle network to Slow 3G in devtools → splash is visible for several seconds, looks professional
- [ ] Inspect page source → og:title, og:description, theme-color, apple-touch-icon all present
- [ ] Share URL in a chat tool → preview card shows title and description (test after deployment)

**Phase Risks**
- **RISK-02-01:** Inline styles in `<head>` could flash briefly on fast connections before the app shell replaces the content. Mitigation: use subtle styling (dark background matching the app) so the transition is nearly invisible.

---

### PHASE-03 — Touch Feedback for Mobile Interactions
**Goal**
Make all interactive elements (buttons, tabs, toggles) give immediate visual feedback when tapped on a phone, so users know their tap registered.

**Tasks**
- [ ] TASK-03-01: Add `:active` styles to `.toggle-button`, `.scenario-tab`, and `.ghost-button` that mirror the existing `:hover` effect (translateY + box-shadow at `style.css:174-179`). Use a slightly stronger effect for active: `transform: translateY(0); box-shadow: 0 0 24px rgba(71, 215, 255, 0.22)`.
- [ ] TASK-03-02: Add `:focus-visible` outlines to the same elements: `outline: 2px solid rgba(71, 215, 255, 0.5); outline-offset: 2px`.
- [ ] TASK-03-03: Add `:active` style to `.walkthrough-card.is-selected`: subtle scale or brightness bump so tapping the card feels responsive.
- [ ] TASK-03-04: Wrap the existing hover styles in `@media (hover: hover)` so they only apply on devices with a mouse. Keep `:active` styles outside the media query so they work on all devices.
- [ ] TASK-03-05: Add `cursor: pointer` to `.scenario-tab` and `.toggle-button` if not already present (it's only on `button` generically at line 43).

**Files / Surfaces**
- `app/src/style.css` — lines 156-185 (button/tab styles), add new rules after existing hover block

**Dependencies**
- None (can be done in parallel with PHASE-01 and PHASE-02)

**Exit Criteria**
- [ ] Desktop: hover effects still work on mouse-equipped devices
- [ ] Mobile (or devtools touch simulation): tapping a scenario tab shows visual feedback immediately
- [ ] Mobile: tapping the currency toggle shows visual feedback
- [ ] Tab key navigation shows focus-visible outlines on all interactive elements
- [ ] All 35 existing tests still pass

**Phase Risks**
- **RISK-03-01:** `@media (hover: hover)` wrapping could break hover on some hybrid devices (Surface, iPad with keyboard). Mitigation: test on a real tablet if available, or keep hover + active co-existing rather than mutually exclusive.

---

### PHASE-04 — Build, Verify, and Deploy
**Goal**
Produce a production build incorporating all Sprint 1 changes, verify everything works, and deploy to Firebase Hosting so workshop attendees have a public URL.

**Tasks**
- [ ] TASK-04-01: Run `npx vitest run` in `app/` — all 35 tests must pass.
- [ ] TASK-04-02: Run `npx vite build` in `app/` — build must succeed with no errors.
- [ ] TASK-04-03: Run `npx vite preview` in `app/` and manually verify:
  - Loading splash appears on initial load
  - All 3 scenarios render correctly
  - Slider extremes don't crash the app (move each slider to min and max)
  - Mermaid diagram renders for all 3 scenarios
  - Currency toggle works
  - Hour click updates the walkthrough card
- [ ] TASK-04-04: If `.firebaserc` does not exist, run `npx firebase init` (select Hosting, select or create project, set `dist` as public dir, configure as SPA). If it exists, skip.
- [ ] TASK-04-05: Run `npx firebase deploy --only hosting` from `app/` directory.
- [ ] TASK-04-06: Open the deployed URL on desktop and mobile — verify the loading splash, all interactive features, and meta tags work.
- [ ] TASK-04-07: Record the deployed URL in the project README or in a `deployment.md` file for reference.

**Files / Surfaces**
- `app/dist/` — the built output
- `app/.firebaserc` — Firebase project binding (may need to be created)
- `app/firebase.json` — already exists, no changes needed

**Dependencies**
- PHASE-01, PHASE-02, PHASE-03 (all changes must be in place before building)

**Exit Criteria**
- [ ] `npx vitest run` → 35/35 pass
- [ ] `npx vite build` → success, no errors
- [ ] Deployed URL loads correctly on desktop Chrome
- [ ] Deployed URL loads correctly on mobile Safari / Chrome
- [ ] Sharing the URL in a chat tool shows og:title and og:description preview

**Phase Risks**
- **RISK-04-01:** Firebase project may not exist or user may not have Firebase CLI installed. Mitigation: fall back to `npx firebase-tools` or deploy to Vercel/Netlify as an alternative (both support static sites with zero config).
- **RISK-04-02:** Build output may differ from dev server behavior. Mitigation: `vite preview` serves the production build locally first.

---

## Verification Strategy
- **TEST-001:** `cd app && npx vitest run` — all 35 tests pass (run after each phase)
- **TEST-002:** `cd app && npx vite build` — zero errors, `dist/` produced
- **MANUAL-001:** Open dev server, throttle to Slow 3G → loading splash visible and professional
- **MANUAL-002:** Move all 5 sliders to min and max positions → no blank panels, no console errors
- **MANUAL-003:** Test on Chrome mobile devtools (iPhone SE, Pixel 7) → tap scenario tabs → visual feedback appears
- **MANUAL-004:** Click each of the 24 hours on the chart → walkthrough card updates correctly
- **MANUAL-005:** Check deployed URL page source → og:title, theme-color, apple-touch-icon present
- **OBS-001:** After deployment, check Firebase Hosting console → site is live, SSL active

## Risks and Alternatives
- **RISK-001:** All Sprint 1 changes are cosmetic / defensive — zero risk of breaking calculation logic. Settlement engine (`settlement.js`) is not touched.
- **RISK-002:** If Firebase deployment fails, Vercel CLI (`npx vercel --prod`) can deploy the `dist/` folder in one command as a backup.
- **ALT-001:** Instead of Firebase, could deploy to GitHub Pages via `gh-pages` npm package. Not chosen because `firebase.json` already exists and is configured.

## Grill Me
1. **Q-001:** Do you have an existing Firebase project for this app, or should we create a new one?
   - **Recommended default:** Create a new Firebase project named `dppa-cfo-calculator`
   - **Why this matters:** PHASE-04 TASK-04-04 depends on this — determines whether we `firebase init` or just `firebase deploy`
   - **If answered differently:** If an existing project exists, we skip init and deploy directly (saves 10 minutes)

2. **Q-002:** Should the deployed URL be shared via a QR code embedded in the app itself, or will you generate/share the QR separately?
   - **Recommended default:** Share QR separately (print or slide deck) — no code change needed
   - **Why this matters:** Embedding a QR code would add a task to PHASE-02 and require knowing the URL before deployment
   - **If answered differently:** If embedded, we'd add a small QR generator to the footer area after deployment (Sprint 2 scope)

## Suggested Next Step
Answer Q-001 about the Firebase project, then begin PHASE-01 through PHASE-03 in parallel (they're independent). Run PHASE-04 after all three complete.
