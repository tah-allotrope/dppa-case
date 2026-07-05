---
title: "DPPA App Quality, Visuals & Testing Uplift"
date: "2026-07-05"
type: "brainstorm"
depth: "standard"
source_request: "Take the web app to the next level in terms of quality, visuals, and testing"
slug: "app-quality-visuals-testing"
---

# Brainstorm: DPPA App Quality, Visuals & Testing Uplift

## Problem & Why Now
The DPPA settlement app (`app/`, live at https://dppa-case.web.app) is the core interactive tool for the **October 2026 Modules 1–6 workshop**. It must perform flawlessly on stage (projector + presenter laptop) and in participants' hands (mostly iPhones) — but today:

- The **neon dark theme** (deep navy, glows, glassmorphism) is risky on bright conference-room projectors; there is no alternate theme.
- Visual cohesion is uneven — panels, Chart.js charts, the flow diagram, and the teach banner don't fully read as one designed system.
- **First-time participants get no in-app guidance** — self-serve use on their own devices requires hand-holding.
- Real-world flows are untested: Vitest/jsdom covers the engine and rendering logic, but nobody has systematically exercised the full click-through (all scenarios × sliders × teach mode) in real browsers/viewports. Visual QA is a manual screenshot trail. There is **no CI, no lint, and deploys are manual** — last-minute content edits before October have no safety net.

Success = zero on-stage failures, visually credible/legible on a projector, and participants self-serving smoothly on their phones.

## Current vs Desired State
- **Current state:** Vite vanilla-ES-module SPA (~4,600 source lines). `settlement.js` (476 ln) is the tested numeric source of truth; `ui.js` (552 ln) renders the shell; `style.css` (1,564 ln) carries a dark-only neon design system with CSS custom properties in `:root` and 7 media queries; Chart.js drives two charts; `flow-diagram.js` is pure HTML/CSS; `teach.js` + `data/teach-steps.js` provide the `?teach=1` presenter walkthrough. Vitest suites (~900 test lines) cover formatters, profiles, settlement, ui, teach. No ESLint/Prettier, no `.github/workflows`, manual Firebase Hosting deploys, `node_modules` and `app/dist` committed.
- **Desired state:** Dual-theme app (neon default + high-contrast presenter/light mode), token-driven visual system spanning panels/charts/diagram/banner, first-visit bilingual guided tour, Playwright smoke + visual-snapshot suite across Chromium/WebKit at 3 viewports, GitHub Actions CI (lint → unit → e2e → build) with auto-deploy to Firebase on green master, and a cleaned repo.
- **Key repo surfaces:** `app/src/style.css`, `app/src/modules/ui.js`, `app/src/modules/chart.js`, `app/src/modules/flow-diagram.js`, `app/src/modules/teach.js`, `app/src/data/teach-steps.js`, `app/src/main.js`, `app/package.json`, `app/firebase.json`, new `.github/workflows/`, new `app/e2e/` (Playwright), `.gitignore`.

## Resolved Decisions
- **DEC-001:** The driver is the **October 2026 workshop** — all quality/visual/testing work serves that deadline, not open-ended product improvement.
- **DEC-002:** Success criteria: zero on-stage failures, projector-legible and visually credible, participants self-serve on their own devices. (Regression safety net is a means, not the headline goal.)
- **DEC-003:** All four weak spots are in scope: projector legibility, visual cohesion, untested real-world flows, participant onboarding.
- **DEC-004:** **Add a presenter/light mode** alongside the neon dark default — high-contrast light background, larger type, no glow/blur — rather than reworking dark-only or going light-first. The neon identity stays for participants.
- **DEC-005:** Presenter mode activation: **visible header toggle + `?present=1` URL flag; `?teach=1` auto-enables presenter theme** (teach mode implies projector context); preference persisted to localStorage.
- **DEC-006:** **Full token-driven cohesion pass** — consolidate colors/spacing/type into CSS custom properties both themes implement; restyle Chart.js (fonts, gridlines, tooltips, palette) and the flow diagram from the same tokens.
- **DEC-007:** Onboarding = **first-visit guided tour** (3–5 dismissible overlay steps: scenario tabs → sliders → bill panel), localStorage-remembered, reusing the teach-mode stepping machinery.
- **DEC-008:** E2E layer = **Playwright smoke + visual snapshots**: click every scenario tab, drive each slider, step all 6 teach steps, toggle presenter mode; screenshot snapshots per scenario/theme/viewport replace the manual screenshot QA trail.
- **DEC-009:** Add **GitHub Actions CI + ESLint (flat config) + Prettier** — lint, Vitest, Playwright, and production build on every push.
- **DEC-010:** Device matrix: **Chromium + WebKit at 3 viewports** — 1280×720 desktop (projector), ~390×844 mobile (participants' iPhones/Safari), mid-size tablet. WebKit is essential (backdrop-filter and Safari rendering quirks).
- **DEC-011:** **Auto-deploy to Firebase Hosting on green master** — the live app is always the tested version.
- **DEC-012:** Priority order if time-boxed: **tests/CI first, then visuals, then onboarding** — the safety net lands before the visual rework it protects; the tour can slip worst-case (facilitate live).
- **DEC-013:** **Repo hygiene**: add `.gitignore`, untrack `node_modules` (both copies) and `app/dist` — CI builds `dist` anyway once auto-deploy exists.
- **DEC-014:** New tour/hint strings are **bilingual EN/VN** (English with Vietnamese beneath, mirroring the bilingual handouts) — not a full app i18n effort.

## Assumptions & Constraints
- **ASM-001:** October participants are largely on iPhones/Safari; the presenter runs Chrome on a laptop driving a standard 16:9 projector.
- **ASM-002:** The teach-mode stepping machinery in `teach.js` is generalizable enough to power the participant tour without a third-party tour library.
- **ASM-003:** Firebase deploy credentials can be provisioned as a GitHub Actions secret (service account) for auto-deploy.
- **CON-001:** `settlement.js` numeric behavior must not change — it is the answer-key engine for the workshop worksheets; existing Vitest suites must keep passing.
- **CON-002:** Teach mode must remain hidden from the normal participant UX path (`?teach=1` only).
- **CON-003:** The neon dark theme remains the default participant-facing identity; presenter mode is additive, not a replacement.
- **CON-004:** Visual-snapshot tests must tolerate Chart.js animation/rendering nondeterminism (disable animations in test mode).

## Approaches Considered
- **Chosen:** Dual-theme token system + Playwright e2e/visual suite + CI/auto-deploy + tour — layered so the regression net lands before the visual rework it protects.
- **ALT-001:** Rework the dark theme alone for projector contrast — less work, but dark themes on weak projectors remain inherently risky; rejected.
- **ALT-002:** Go light-first as the only theme — safest for projectors but discards the established neon identity participants see; rejected.
- **ALT-003:** Deeper jsdom integration tests instead of Playwright — no new tooling but can't catch real rendering/layout/Safari issues; rejected.
- **ALT-004:** Playwright smoke without snapshots — misses visual regressions, keeping manual screenshot QA; rejected.
- **ALT-005:** Full app VN language toggle — much larger scope touching every label/chart; deferred (only new tour strings are bilingual).

## Out of Scope
- Any change to settlement math, scenario presets, or worksheet answer keys.
- Full app internationalization (VN toggle for all UI labels).
- New scenarios, modules, or teach-mode content (owned by the Oct 2026 teaching-revamp plan).
- Framework migration (stays vanilla ES modules + Vite).
- Firefox coverage in the test matrix.

## Open Questions
1. **Q-001:** Does a GitHub remote with Actions enabled exist for this repo (currently local git, branch `master`), and can a Firebase service-account key be created for the `dppa-case` project?
   - **Recommended default:** Create/confirm a private GitHub repo, generate a Firebase Hosting service account via `firebase init hosting:github`, store as a repo secret.
   - **Why this matters:** DEC-009/DEC-011 (CI + auto-deploy) are blocked without it; fallback is local-only test scripts and manual deploys.
2. **Q-002:** Is there a real venue/projector spec (resolution, brightness) to calibrate presenter-mode type sizes against?
   - **Recommended default:** Design for worst case — 1280×720, low-brightness projector, legible from ~10 m (≥18px body, ≥4.5:1 contrast).
   - **Why this matters:** Sets the minimum type scale and contrast targets for the presenter theme.

## Suggested Next Step
Run `/plan app-quality-visuals-testing` to turn this into a multi-phase implementation plan.
