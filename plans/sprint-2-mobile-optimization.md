---
title: "Sprint 2: Mobile Optimization & Bundle Performance"
date: "2026-05-22"
status: "draft"
request: "Multi-phase plan covering GAP-02 (bundle size — mermaid 3.1MB), GAP-03 (chart tap targets — 1.5px), GAP-04 (mermaid mobile horizontal scroll — min-width 640px) from workshop readiness gap analysis"
plan_type: "multi-phase"
research_inputs:
  - "reports/2026-05-22-workshop-readiness-gap-analysis.md"
---

# Plan: Sprint 2 — Mobile Optimization & Bundle Performance

## Objective
Cut the app's JavaScript bundle from 3.1 MB to under 500 KB, make the chart hour-selection usable on phone touchscreens, and eliminate the forced horizontal scroll on the mermaid cancellation diagram for mobile users. These three changes together make the app fast and functional for workshop attendees on their phones.

## Context Snapshot
- **Current state:** The app ships 3.1 MB of JS (90+ chunks). Mermaid alone contributes ~2 MB (cytoscape 434 KB, katex 257 KB, architecture 147 KB, sequence 116 KB — all unused). Chart.js point radius is 1.5px for non-selected hours — nearly invisible tap targets on mobile. The mermaid `.mermaid` div has `min-width: 640px` forcing horizontal scroll on any screen under 640px.
- **Desired state:** JS bundle under 500 KB total. Chart points large enough for finger taps (~4px base, ~6px on mobile). Mermaid cancellation flow either reflowing vertically on narrow screens or replaced with an HTML/CSS equivalent that wraps naturally.
- **Key repo surfaces:**
  - `app/src/main.js` — mermaid import and render (lines 2, 8, 40-52)
  - `app/src/modules/chart.js` — pointRadius config (lines 216-218, 229-231, 254), onClick handler (lines 270-286)
  - `app/src/modules/ui.js` — mermaid definition builder (lines 319-333), mermaid DOM (`#cancellationMermaid`)
  - `app/src/style.css` — `.mermaid` min-width (lines 843, 1257, 1296)
  - `app/package.json` — `mermaid: ^11.14.0` dependency
  - No `vite.config.js` exists — the app uses Vite defaults
- **Out of scope:** Error handling and loading states (Sprint 1), Firebase deployment (Sprint 1), PWA/offline, CSV upload, additional scenarios, localization.

## Research Inputs
- `reports/2026-05-22-workshop-readiness-gap-analysis.md` — Identifies three gaps addressed here: GAP-02 (bundle size, severity HIGH), GAP-03 (chart tap targets, severity HIGH), GAP-04 (mermaid mobile scroll, severity MEDIUM). Recommends replacing mermaid with HTML/CSS as the most impactful single change since it solves both GAP-02 and GAP-04 simultaneously.

## Assumptions and Constraints
- **ASM-001:** The app uses only `flowchart LR` mermaid definitions with 6-8 nodes and dynamic VND/kWh values. No other diagram types (gantt, sequence, class, etc.) are used anywhere.
- **ASM-002:** The two mermaid definition patterns (clean cancellation and partial cancellation) in `ui.js:320-322` are the only mermaid definitions in the app — verified by grep.
- **ASM-003:** Chart.js `getElementsAtEventForMode(event, 'index', { intersect: false })` already picks the nearest X-index to a touch, so the underlying hit detection works — the problem is visual (users can't see what to tap).
- **CON-001:** All 35 existing tests must pass after changes. Several UI tests in `ui.test.js` assert on mermaid definition strings (lines 155-179, 284-288) — these must be updated if the mermaid approach changes.
- **CON-002:** No new npm runtime dependencies. Build-only tooling (e.g., `vite.config.js`) is fine.
- **DEC-001:** Replace mermaid with a pure HTML/CSS cancellation flow diagram rather than tree-shaking mermaid. Rationale: tree-shaking mermaid v11 is unreliable (the core still pulls in dagre, katex for math labels, and lazy-registration overhead ~300 KB minimum), while the app only renders one fixed-structure flowchart. An HTML/CSS replacement eliminates the entire 2+ MB dependency, solves the mobile scroll problem (GAP-04) for free, and renders instantly (no async parse).

## Phase Summary
| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Replace mermaid with HTML/CSS cancellation flow | None | New `app/src/modules/flow-diagram.js`, updated `ui.js`, updated `main.js`, mermaid removed from `package.json` |
| PHASE-02 | Enlarge chart tap targets and add mobile hour navigation | None | Updated `chart.js`, new prev/next hour buttons in `ui.js`, CSS for mobile chart UX |
| PHASE-03 | Bundle verification and cleanup | PHASE-01, PHASE-02 | `vite.config.js`, verified build under 500 KB, updated tests |

## Detailed Phases

### PHASE-01 — Replace Mermaid with HTML/CSS Cancellation Flow
**Goal**
Remove the mermaid dependency entirely and replace it with a purpose-built HTML/CSS flow diagram that renders the same cancellation logic story, works on all screen sizes without horizontal scroll, and loads instantly.

**Tasks**
- [ ] TASK-01-01: Create `app/src/modules/flow-diagram.js` with a function `renderCancellationFlow(result, currency)` that returns an HTML string representing the cancellation flow. The function takes the same `result` (formula breakdown) and `currency` parameters that `renderFormulas()` currently uses to build the mermaid definition string. The HTML should use a CSS flexbox/grid layout with connected boxes and arrows (using CSS borders or `::before`/`::after` pseudo-elements).
- [ ] TASK-01-02: Design two flow layouts matching the two existing mermaid patterns:
  - **Clean cancellation** (8 nodes): BAU retail → Selected hour comparison; Spot reference on EVN → Canceled on aligned volume ← Developer CfD swap; Canceled → Keep strike + DPPA + loss → DPPA payment → comparison → Savings vs BAU
  - **Partial cancellation** (9 nodes): BAU retail → comparison; Matched volume → Cancellation applies here ← Contracted volume; → Volume mismatch → Uncancelled exposure → DPPA payment → comparison → Savings vs BAU
- [ ] TASK-01-03: Style the HTML flow diagram to match the existing neon theme. Use the same color tokens from `style.css` (cyan, magenta, mint, amber). Apply responsive CSS: `flowchart LR`-style horizontal layout on desktop (≥900px), top-down vertical flow on mobile (<900px).
- [ ] TASK-01-04: Update `renderFormulas()` in `ui.js` to call `renderCancellationFlow()` instead of building a mermaid definition string. Instead of setting `#cancellationMermaid.textContent`, set `#cancellationMermaid.innerHTML` to the HTML output. Remove the mermaid definition return value — return `null` or a status flag instead.
- [ ] TASK-01-05: Update `main.js` to remove: `import mermaid from 'mermaid'` (line 2), `mermaid.initialize(...)` (line 8), the `mermaidRenderToken` variable (line 11), the entire `renderMermaidDiagram()` function (lines 40-52), and the `await renderMermaidDiagram(mermaidDefinition)` call in `updateView()` (line 78). The flow diagram now renders synchronously inside `renderFormulas()`.
- [ ] TASK-01-06: Remove `mermaid` from `app/package.json` dependencies: `cd app && npm uninstall mermaid`.
- [ ] TASK-01-07: Update the mermaid-related CSS in `style.css`: remove `.mermaid { min-width: 640px; zoom: 0.82; }` (line 843) and the mobile overrides at lines 1254-1258 and 1296-1299. Add new CSS for the HTML flow diagram.
- [ ] TASK-01-08: Update UI tests in `ui.test.js` — the tests at lines 155-179 and 284-288 that assert on mermaid definition strings need to instead assert on the HTML output of the new flow diagram (check for key text content like "Canceled on aligned volume", "Savings vs BAU", etc.).
- [ ] TASK-01-09: Remove the mermaid-fallback CSS class added in Sprint 1 (if Sprint 1 runs first) since there's no more async mermaid rendering to fail.

**Files / Surfaces**
- `app/src/modules/flow-diagram.js` — NEW file: HTML/CSS flow diagram renderer
- `app/src/modules/ui.js` — lines 319-333: replace mermaid definition builder with flow diagram call
- `app/src/main.js` — lines 2, 8, 11, 40-52, 78: remove all mermaid references
- `app/src/style.css` — lines 828-843, 1254-1258, 1296-1299: replace mermaid CSS with flow diagram CSS
- `app/src/modules/ui.test.js` — lines 155-179, 284-288: update mermaid definition assertions
- `app/package.json` — remove mermaid dependency

**Dependencies**
- None

**Exit Criteria**
- [ ] `npm ls mermaid` in `app/` returns empty (dependency fully removed)
- [ ] `npx vite build` in `app/` succeeds
- [ ] Build output total JS is under 500 KB (from 3.1 MB)
- [ ] Flow diagram renders correctly for all 3 scenarios on desktop
- [ ] Flow diagram reflows to vertical layout on mobile (test at 390px viewport)
- [ ] No horizontal scroll needed on mobile for the cancellation flow
- [ ] All updated tests pass (`npx vitest run`)

**Phase Risks**
- **RISK-01-01:** The HTML/CSS flow diagram may not look as polished as mermaid's SVG rendering. Mitigation: use the existing neon CSS variables and box-shadow effects to create a professional look. The mermaid diagrams were already small text in compressed boxes — an HTML version can actually be more readable.
- **RISK-01-02:** Mermaid removal may break something subtle if any other code references it. Mitigation: grep confirmed mermaid is only used in `main.js` and `ui.js`. No other files import or reference it.

---

### PHASE-02 — Chart Tap Targets and Mobile Hour Navigation
**Goal**
Make the Chart.js hour-selection interaction reliable on phone touchscreens by increasing point sizes and adding explicit prev/next hour buttons as a secondary navigation method.

**Tasks**
- [ ] TASK-02-01: In `chart.js`, increase the base (non-selected) `pointRadius` from `1.5` to `4` for the Factory load and Solar generation datasets (lines 216, 229). Increase the selected hour radius from `5` to `8`. Increase `pointHoverRadius` from `4/7` to `6/10`. This makes touch targets visible and finger-friendly.
- [ ] TASK-02-02: In `chart.js`, increase the FMP dataset's base `pointRadius` from `1` to `3` and selected from `4` to `7` (line 254). This keeps the FMP curve tappable too.
- [ ] TASK-02-03: Add a "Tap any hour bar" hint subtitle below the chart title in `ui.js` `renderAppShell()`, inside the `.chart-headline` div. Use a `<p class="chart-tap-hint">` element. On desktop, show "Click any hour to inspect". On mobile, show "Tap any hour to inspect". Use the same `hero-copy` muted style.
- [ ] TASK-02-04: Add prev/next hour navigation buttons below the chart canvas in `ui.js` `renderAppShell()`. HTML: `<div class="hour-nav" id="hourNav"><button class="hour-nav-btn" id="prevHour">← Prev hour</button><span class="hour-nav-label" id="hourNavLabel">12:00</span><button class="hour-nav-btn" id="nextHour">Next hour →</button></div>`. These provide an alternative to imprecise chart taps on mobile.
- [ ] TASK-02-05: Wire the prev/next buttons in `main.js` `syncControls()`: `#prevHour` decrements `state.selectedHour` (wrapping 0→23), `#nextHour` increments (wrapping 23→0), both call `updateView()`. Update the `#hourNavLabel` text in `updateView()`.
- [ ] TASK-02-06: Add CSS for `.hour-nav`: flex row, justify-content space-between, centered inside the chart panel. Style `.hour-nav-btn` with the same pill/ghost button aesthetic. On desktop (≥900px), optionally hide the nav buttons or make them smaller since desktop users can click precisely.
- [ ] TASK-02-07: Update `updateView()` in `main.js` to also update the `#hourNavLabel` text: `document.querySelector('#hourNavLabel').textContent = hours[state.selectedHour] formatted as HH:00`.

**Files / Surfaces**
- `app/src/modules/chart.js` — lines 216-218, 229-231, 254: increase pointRadius values
- `app/src/modules/ui.js` — `renderAppShell()`: add chart tap hint and hour-nav buttons
- `app/src/main.js` — `syncControls()`: wire prev/next buttons; `updateView()`: update hour label
- `app/src/style.css` — add `.hour-nav`, `.hour-nav-btn`, `.hour-nav-label`, `.chart-tap-hint` styles

**Dependencies**
- None (can be done in parallel with PHASE-01)

**Exit Criteria**
- [ ] On mobile viewport (390px): chart points are clearly visible and tappable
- [ ] Tapping prev/next buttons cycles through hours 0-23 and updates walkthrough card
- [ ] On desktop: chart click still works, prev/next buttons are available but subtle
- [ ] The hour label between prev/next matches the selected hour in the walkthrough card
- [ ] All existing tests pass (no chart tests exist, but settlement/UI tests must not regress)

**Phase Risks**
- **RISK-02-01:** Larger point radii may visually overlap on narrow mobile charts (24 points at 4px each = 96px of points in ~300px of chart width). Mitigation: use a smaller mobile-specific radius of 3px via `window.matchMedia('(max-width: 520px)')` check in `buildDatasets()`. Even 3px is much better than 1.5px.
- **RISK-02-02:** The prev/next buttons add DOM elements that must survive `renderAppShell()` being called once. Since `renderAppShell()` only runs at init (line 130), this is safe — the buttons won't be re-created on slider changes.

---

### PHASE-03 — Bundle Verification and Cleanup
**Goal**
Verify the production bundle is under the 500 KB target, add a `vite.config.js` for future build control, run the full test suite, and clean up any leftover mermaid references.

**Tasks**
- [ ] TASK-03-01: Create `app/vite.config.js` with basic config: `import { defineConfig } from 'vite'; export default defineConfig({ build: { chunkSizeWarningLimit: 300 } })`. This ensures future regressions in chunk size are flagged during build.
- [ ] TASK-03-02: Run `cd app && npx vite build` and record the total JS size. Target: under 500 KB uncompressed, under 150 KB gzipped. The main contributors should be Chart.js (~200 KB) and app code (~50 KB).
- [ ] TASK-03-03: If any mermaid-related chunks still appear in the build output (files matching `*mermaid*`, `*cytoscape*`, `*katex*`, `*dagre*`), investigate and remove the import chain causing them.
- [ ] TASK-03-04: Run `npx vitest run` — all tests must pass.
- [ ] TASK-03-05: Run `npx vite preview` and manually verify: all 3 scenarios work, chart interaction works, cancellation flow diagram renders, currency toggle works, all sliders work.
- [ ] TASK-03-06: Test on mobile viewport sizes in Chrome devtools: 375px (iPhone SE), 390px (iPhone 14), 412px (Pixel 7). Verify: cancellation flow reflows vertically, chart points are tappable, prev/next buttons work, no horizontal scroll anywhere.
- [ ] TASK-03-07: Remove the `app/node_modules/mermaid` directory reference from any lockfile regeneration if needed (normally handled by `npm uninstall` in PHASE-01).
- [ ] TASK-03-08: Clean up any dead CSS classes related to mermaid that no longer have HTML targets (e.g., `.mermaid-card .metric-label` if the mermaid card structure changed).

**Files / Surfaces**
- `app/vite.config.js` — NEW file: Vite build configuration
- `app/dist/` — verify build output
- `app/package-lock.json` — verify mermaid is gone from the lockfile

**Dependencies**
- PHASE-01 (mermaid removal must be complete)
- PHASE-02 (chart changes must be in place for full verification)

**Exit Criteria**
- [ ] `npx vite build` output total JS < 500 KB
- [ ] No files matching `*mermaid*`, `*cytoscape*`, `*katex*`, `*dagre*` in `dist/assets/`
- [ ] `npx vitest run` → all tests pass
- [ ] Manual verification on 3 mobile viewport sizes — no horizontal scroll, chart tappable, flow diagram vertical
- [ ] `vite.config.js` exists and sets `chunkSizeWarningLimit: 300`

**Phase Risks**
- **RISK-03-01:** Chart.js alone may exceed 300 KB in a single chunk, triggering the warning. Mitigation: the 300 KB limit is a warning, not an error. Chart.js at ~200 KB is acceptable and can't be easily tree-shaken.

---

## Verification Strategy
- **TEST-001:** `cd app && npx vitest run` — all tests pass (run after each phase)
- **TEST-002:** `cd app && npx vite build` — zero errors, total JS < 500 KB
- **TEST-003:** `ls -la app/dist/assets/*mermaid* app/dist/assets/*cytoscape* app/dist/assets/*katex*` — should return "no such file"
- **MANUAL-001:** Open `vite preview` on desktop → all 3 scenarios render, chart click works, cancellation flow visible
- **MANUAL-002:** Open `vite preview` on Chrome devtools mobile 390px → cancellation flow is vertical, no horizontal scroll
- **MANUAL-003:** On mobile viewport, tap 5 different hours on the chart → correct hour selected each time
- **MANUAL-004:** On mobile viewport, use prev/next buttons to cycle through hours → walkthrough card updates correctly
- **MANUAL-005:** Throttle network to Fast 3G → page loads in under 3 seconds (vs 6-10 seconds currently)
- **OBS-001:** After deployment (post Sprint 1 PHASE-04 or re-deploy), check Chrome Lighthouse performance score on mobile — target ≥ 80

## Risks and Alternatives
- **RISK-001:** Replacing mermaid with custom HTML/CSS means losing the automatic graph layout engine. Since the two flow patterns are fixed-structure (always the same node count and connections), this is not a real limitation — but if a new flow pattern is added in the future, it would need manual HTML layout. Mitigation: document the two patterns clearly in code comments.
- **RISK-002:** If the mermaid removal turns out harder than expected (e.g., hidden transitive dependencies), the fallback is mermaid tree-shaking via `import { mermaid } from 'mermaid/dist/mermaid.core.mjs'` + only registering the flowchart diagram. This would cut ~1.5 MB but not reach the 500 KB target.
- **ALT-001:** Keep mermaid but lazy-load it after first paint. Rejected because: it still downloads 2+ MB eventually, and the diagram is visible on initial scroll — lazy loading would show a blank space then pop in, which looks worse than a static HTML version.
- **ALT-002:** Use a lighter flowchart library (e.g., elkjs, dagre standalone). Rejected because: the diagram structure is simple enough for pure CSS, and any graph library adds unnecessary weight.

## Grill Me
1. **Q-001:** Should the HTML cancellation flow diagram preserve the exact same node labels and wording as the current mermaid flowcharts, or is this a good opportunity to simplify the language?
   - **Recommended default:** Keep the same labels for consistency with the existing deck screenshots and workshop materials
   - **Why this matters:** Changing labels means updating test assertions, the PowerPoint deck, and potentially the presenter's script
   - **If answered differently:** If simplified, TASK-01-02 and TASK-01-08 scope expands to include label redesign and test rewrite

2. **Q-002:** On mobile, should the prev/next hour buttons be always visible or only appear after first chart interaction?
   - **Recommended default:** Always visible — they serve as a discovery affordance for the tap interaction
   - **Why this matters:** If hidden until interaction, users may never discover them; if always visible, they take up vertical space on mobile
   - **If answered differently:** If hidden-until-tap, TASK-02-05 needs a visibility toggle triggered by the chart's first `onClick`

## Suggested Next Step
Begin PHASE-01 and PHASE-02 in parallel (they're independent). Run PHASE-03 after both complete. Total estimated time: 4-6 hours. If Sprint 1 has already been deployed, re-deploy after Sprint 2 is verified.
