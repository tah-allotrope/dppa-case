# Gap Analysis: In-Person Workshop Demo Readiness

**Date:** 2026-05-22
**Scope:** Use the DPPA CFO visual explainer web app in an in-person factory workshop — zero bugs on desktop projector, mobile-friendly for audience phones, all interactive features working flawlessly, professional CFO-grade appearance.
**Status:** Draft for Review

---

## Executive Summary

The app is **functionally mature**: all 35 tests pass, the calculation engine is correct, the build succeeds, and Firebase Hosting is configured. The main gaps are in **live-demo resilience** (no error handling, no loading states, mermaid can silently fail), **mobile touch UX** (chart tap target is too small, hover-only styles with no touch feedback, Mermaid requires horizontal scroll on phones), and **bundle weight** (3.1 MB JS — slow on workshop Wi-Fi). There are **0 CRITICAL** gaps, **3 HIGH** gaps, and **5 MEDIUM** gaps. A focused 2-sprint effort would make this workshop-ready.

---

## Current Capabilities (What We Have)

| Capability | Status | Key Surfaces |
|---|---|---|
| Settlement calculation engine | Mature — 10 tests | `app/src/modules/settlement.js`, `settlement.test.js` |
| Profile/volume decomposition | Mature — 14 tests | `app/src/modules/profiles.js`, `profiles.test.js` |
| Currency toggle (VND/USD) | Working | `app/src/modules/formatters.js`, `main.js:107-113` |
| Scenario tabs (3 presets) | Working | `app/src/data/default-scenarios.js`, `main.js:100-106` |
| Interactive chart (Chart.js) | Working | `app/src/modules/chart.js` — click-to-select-hour |
| Walkthrough card + FMP strip | Working — 11 UI tests | `app/src/modules/ui.js` |
| Mermaid cancellation flow | Working | `main.js:40-52` — async render |
| Slider controls (5 inputs) | Working | `main.js:81-119` |
| Desktop responsive layout | Working | `app/src/style.css` — breakpoints at 1280/900/520/390px |
| Mobile responsive layout | Partial | Breakpoints exist but UX gaps remain (see GAP-03, GAP-04) |
| Production build (Vite) | Working | `app/package.json` — `vite build` succeeds, `dist/` produced |
| Firebase Hosting config | Working | `app/firebase.json` — pointing to `dist/` |
| Error handling / resilience | Missing | No try/catch, no loading states, no fallbacks |
| Offline / PWA support | Missing | No service worker, no manifest |
| Deployment pipeline | Missing | No CI, manual `firebase deploy` assumed |

---

## Target State

> A polished, reliable web app that can be used live in an in-person factory workshop. The presenter projects the app on a screen and walks through DPPA settlement mechanics interactively. Audience members (factory CFO, procurement, engineers) follow along on their phones. Zero crashes, zero visual glitches, fast load on potentially spotty venue Wi-Fi. Professional enough that a CFO takes it seriously.

---

## Gap Analysis

### GAP-01: No Error Handling — Mermaid or Chart Failure Crashes the Demo

**Severity:** HIGH — A single mermaid render failure or Chart.js error during a live demo would leave a blank panel with no recovery path, requiring a page reload in front of the audience.

**Current state:** `main.js` calls `mermaid.render()` and `renderProfileChart()` with no try/catch. If mermaid fails to parse a definition (which can happen with certain edge-case slider values), the async function throws an unhandled rejection. Chart.js `getElementsAtEventForMode` can also throw if the canvas is in a bad state. There is zero error handling anywhere in `main.js`.

**What's needed:**
- Wrap `renderMermaidDiagram()` in try/catch with a graceful fallback (show the text definition or a "diagram unavailable" message)
- Wrap `updateView()` in try/catch so a single panel failure doesn't break the entire app
- Add a global `window.onerror` / `unhandledrejection` handler that logs to console but doesn't crash the UI
- Add a loading/placeholder state for the mermaid panel while it renders (it's async and can take 200-500ms)

**Existing assets to reuse:**
- `renderMermaidDiagram()` in `main.js:40-52` already has a render token pattern — extend it with error handling
- The `mermaid-card` CSS class in `style.css:828-843` can hold a fallback message

**Effort estimate:** Small — 1 phase, ~30 minutes of work

---

### GAP-02: Bundle Size Too Large for Workshop Wi-Fi (3.1 MB JS)

**Severity:** HIGH — At 3.1 MB of JavaScript (gzipped ~600 KB), the app will take 6-10 seconds to load on spotty venue Wi-Fi. Mobile users on 3G/4G will wait even longer. Mermaid alone brings in ~2 MB of diagram types (sankey, gantt, sequence, architecture, etc.) that this app never uses.

**Current state:** The build output shows 90+ JS chunks. Mermaid is the largest contributor — the app only uses `flowchart LR` definitions but ships every mermaid diagram type (gantt, sequence, class, ER, sankey, architecture, etc.). Chart.js is the other large dependency but is more justified. Cytoscape (434 KB) is pulled in by mermaid's architecture diagrams — completely unused.

**What's needed:**
- Configure mermaid to only register the `flowchart` diagram type (mermaid supports selective imports since v10)
- OR replace mermaid with a static SVG/HTML representation of the cancellation flow (the app only renders one flowchart pattern with dynamic values)
- Add `vite.config.js` if not present (currently using Vite defaults) to configure manual chunk splitting
- Consider preloading critical JS and lazy-loading the mermaid chunk

**Existing assets to reuse:**
- `renderFormulas()` in `ui.js:319-333` already builds the mermaid definition string — could be adapted to render an HTML/CSS version instead
- Vite is already configured as the bundler — just needs a `vite.config.js`

**Effort estimate:** Medium — 1 phase. Mermaid tree-shaking alone could cut 1.5-2 MB. Full replacement with HTML flow diagram is more work but eliminates the dependency entirely.

---

### GAP-03: Chart Tap Targets Too Small on Mobile — Hour Selection Frustrating

**Severity:** HIGH — The core interaction (tap a chart hour to see settlement details) relies on Chart.js `onClick` with `intersect: false`. On a phone, the 24 data points are ~13px apart, making precise hour selection difficult. Users will tap and hit the wrong hour repeatedly, creating a poor demo experience.

**Current state:** `chart.js:270-272` uses `getElementsAtEventForMode(event, 'index', { intersect: false })` — this picks the nearest index to the tap X coordinate, which is reasonable. But the chart point radius is only 1.5px (`chart.js:218`), and there's no visual feedback that the chart is tappable. The selected hour gets a 5px radius but the user doesn't know to tap until told.

**What's needed:**
- Increase mobile point radius to at least 4px (currently 1.5px) so touch targets are visible
- Add a visual hint that the chart is tappable (e.g., a subtle "tap any hour" label or pulsing selected point)
- Consider adding prev/next hour buttons below the chart on mobile as an alternative navigation method
- Add `:active` / touch feedback styles to interactive elements (currently hover-only at `style.css:174-179`)

**Existing assets to reuse:**
- `chart.js:217-220` already conditionally sets `pointRadius` per index — extend with a screen-width check or make the base radius larger on touch devices
- The `@media (max-width: 520px)` breakpoint in `style.css:1192` is the natural place for mobile-specific overrides

**Effort estimate:** Small-medium — 1 phase

---

### GAP-04: Mermaid Diagram Requires Horizontal Scroll on Mobile

**Severity:** MEDIUM — The mermaid flowchart has `min-width: 640px` (style.css:843) and `min-width: 700px` at 520px breakpoint (style.css:1257). On a 390px phone screen, this forces horizontal scrolling inside the card. The diagram is key to the cancellation story but becomes hard to read and navigate on mobile.

**What's needed:**
- Either reflow the mermaid diagram to use `flowchart TD` (top-down) on mobile, which fits narrow screens better
- Or replace with an HTML/CSS version of the cancellation flow that naturally reflows (ties into GAP-02)
- Or hide the mermaid panel on mobile and replace with a simplified text-based cancellation summary

**Existing assets to reuse:**
- `renderFormulas()` in `ui.js:319-333` builds two mermaid definitions (clean and partial cancellation) — could branch for mobile
- The `.mermaid-card` already has `overflow-x: auto` — the scrolling works, it's just a poor experience

**Effort estimate:** Medium — 1 phase

---

### GAP-05: No Loading State or Splash Screen

**Severity:** MEDIUM — On first load (especially mobile), there's a 2-5 second white/black screen while JS parses. During a workshop, if the presenter opens the URL and sees a blank screen for several seconds, it looks broken.

**What's needed:**
- Add a lightweight inline loading indicator to `index.html` (pure CSS spinner or skeleton) that shows immediately before JS loads
- Ideally show the Allotrope logo and "Loading DPPA Calculator..." text

**Existing assets to reuse:**
- `app/index.html` currently has just `<div id="app"></div>` — add static HTML inside that div as a loading placeholder
- Logo exists at `app/public/brand/allotrope-logo.png`

**Effort estimate:** Small — 15 minutes

---

### GAP-06: No `<meta>` Tags for Mobile Share / Social / PWA

**Severity:** MEDIUM — When workshop attendees share the URL or bookmark it, there's no Open Graph title, no `theme-color`, no `apple-touch-icon`, and no web app manifest. The URL will appear as a bare link with no preview in chat apps.

**What's needed:**
- Add `<meta name="theme-color" content="#050816">` to match the dark background
- Add `<meta property="og:title" content="Vietnam DPPA CFO Calculator">` and `og:description`
- Add an `apple-touch-icon` (can derive from the existing favicon)
- Optionally add a minimal `manifest.json` for "Add to Home Screen" capability

**Existing assets to reuse:**
- `app/index.html` already has viewport and description meta tags
- `app/public/favicon.svg` and `favicon.ico` exist

**Effort estimate:** Small — 20 minutes

---

### GAP-07: Hover-Only Interactive Feedback (No Touch States)

**Severity:** MEDIUM — Buttons (scenario tabs, currency toggle, reset) use `:hover` styles at `style.css:174-179` but have no `:active` or `:focus-visible` styles. On mobile, tapping a button gives zero visual feedback. Users won't know if their tap registered.

**What's needed:**
- Add `:active` styles mirroring the hover effect for touch devices
- Add `:focus-visible` outlines for accessibility
- Consider using `@media (hover: hover)` to gate hover-only effects and `@media (hover: none)` for touch-specific feedback

**Existing assets to reuse:**
- The hover styles at `style.css:174-179` can be duplicated to `:active` states
- The `.is-active` class styles at `style.css:181-185` show the pattern for active states

**Effort estimate:** Small — 20 minutes

---

### GAP-08: No Deployment URL — App Is Local-Only

**Severity:** MEDIUM — While `firebase.json` exists, there's no `.firebaserc` project binding and no evidence the app has been deployed. Workshop attendees need a URL to access on their phones. Running `vite preview` locally won't help mobile users unless they're on the same network.

**What's needed:**
- Run `firebase init` to bind a Firebase project (or create one)
- Run `vite build && firebase deploy` to publish
- Alternatively, deploy to any static host (Vercel, Netlify, GitHub Pages)
- Share the URL via QR code at the workshop

**Existing assets to reuse:**
- `firebase.json` is already configured correctly pointing to `dist/`
- `vite build` works and produces a clean `dist/` folder
- The `dist/` folder is ready to deploy as-is

**Effort estimate:** Small — 10 minutes if Firebase project exists, 30 minutes if new project setup needed

---

## Second-Tier Gaps

| Gap | Severity | Summary | Existing Assets |
|---|---|---|---|
| GAP-09 | LOW | No presenter mode / fullscreen toggle | Could add a simple CSS class toggle hiding controls panel |
| GAP-10 | LOW | No QR code on the page for audience to scan | Can generate at build time or add a small QR library |
| GAP-11 | LOW | Chart tariff band labels ("Illustrative retail") may confuse non-English CFOs | Text is in `chart.js:136` — could be localized |
| GAP-12 | LOW | The `nul` file in `app/` is a Windows artifact (git tracked) | Should be gitignored/removed |
| GAP-13 | LOW | No print stylesheet for attendees who want a PDF takeaway | CSS `@media print` could hide controls and linearize layout |
| GAP-14 | LOW | Log files (`vite.log`, `dev-server.log`, `vite-redesign.log`) tracked in git | Should be gitignored |

---

## Recommended Sprint Sequencing

| Priority | Gap | Rationale |
|---|---|---|
| Sprint 1 | GAP-01 (Error handling) | Prevents the single worst workshop scenario — a crash during live demo. Fast fix. |
| Sprint 1 | GAP-05 (Loading state) | 15-minute fix that prevents the "blank screen" impression on first load. |
| Sprint 1 | GAP-07 (Touch feedback) | 20-minute CSS fix that dramatically improves mobile feel. |
| Sprint 1 | GAP-06 (Meta tags) | 20-minute fix for professional URL sharing. |
| Sprint 1 | GAP-08 (Deploy) | Must happen before workshop. Depends on build working (it does). |
| Sprint 2 | GAP-02 (Bundle size) | Biggest mobile performance win. Mermaid tree-shaking or replacement. |
| Sprint 2 | GAP-03 (Chart tap targets) | Improves the core mobile interaction. |
| Sprint 2 | GAP-04 (Mermaid mobile) | Tied to GAP-02 — if mermaid is replaced with HTML, this is solved for free. |

**Sprint 1** is all small fixes (~2 hours total) that make the app deployable and demo-safe.
**Sprint 2** is the bigger mobile optimization pass (~4-6 hours) centered on bundle size and touch UX.

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Workshop Wi-Fi is slow/unreliable | App fails to load for mobile audience | HIGH | Deploy early + pre-cache on presenter laptop. Consider a local server fallback via `vite preview` on presenter's machine with a portable hotspot. |
| Mermaid render fails on edge slider values | Blank diagram panel during demo | MEDIUM | GAP-01 error handling + test all slider extremes before workshop |
| Audience phones have small screens (<375px) | Layout breaks or chart is unreadable | MEDIUM | Test on iPhone SE (375px) — the 390px breakpoint exists but needs verification |
| Firebase deployment quota or domain issues | No URL available for audience | LOW | Deploy 48+ hours before workshop. Have Vercel/Netlify as backup. |
| Presenter accidentally moves slider to extreme | Nonsensical numbers shown (e.g., negative savings) | LOW | Already handled — `getWarningText()` in `main.js:28-37` shows contextual warnings |

---

## Suggested Next Step

Review this report, then invoke `/plan` targeting Sprint 1 gaps (GAP-01, GAP-05, GAP-06, GAP-07, GAP-08) as a single implementation phase — these are all small, independent fixes that can be done in one session. Follow with a Sprint 2 `/plan` for the bundle size + mobile UX pass (GAP-02, GAP-03, GAP-04).
