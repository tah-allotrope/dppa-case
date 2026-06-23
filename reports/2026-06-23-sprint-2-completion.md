# Sprint 2 — Completion Summary: Mobile Optimization & Bundle Performance

**Date:** 2026-06-23
**Sprint:** Sprint 2 — Mobile Optimization & Bundle Performance
**Plan:** `plans/sprint-2-mobile-optimization.md`
**Status:** ✅ **COMPLETE** — all 3 phases shipped and live
**Live URL:** https://dppa-case.web.app

## One-Line Summary
Replaced 2 MB mermaid dependency with a 108-line HTML/CSS flow diagram, enlarged chart tap targets from 1.5px to 4-8px, and added prev/next hour navigation. Bundle dropped 92% (3.1 MB → 245 KB), zero horizontal scroll on mobile, and 38/38 tests still pass.

## Phase Summary

| Phase | Scope | Status | Commit | Live? |
|---|---|---|---|---|
| PHASE-01 | Replace Mermaid with HTML/CSS flow diagram | ✅ | `3f55863` | yes |
| PHASE-02 | Chart tap targets + mobile hour nav | ✅ | `b3691f8` | yes |
| PHASE-03 | Vite config + cleanup + mobile verify | ✅ | `2905211` | yes |
| Reports | 3 phase reports + 1 final summary | ✅ | `87e70ff`, `1426e54`, `bfbf685`, this file | n/a |
| Deploy | Firebase Hosting | ✅ | (this session) | yes |

## Gaps Closed (from `reports/2026-05-22-workshop-readiness-gap-analysis.md`)

| Gap ID | Severity | Title | Closed by |
|---|---|---|---|
| **GAP-02** | HIGH | Bundle size 3.1 MB (mermaid) | PHASE-01 (HTML/CSS replacement) |
| **GAP-03** | HIGH | Chart tap targets 1.5px (mobile) | PHASE-02 (radius 4-8px) |
| **GAP-04** | MEDIUM | Mermaid mobile horizontal scroll (min-width 640px) | PHASE-01 (no min-width, flex column on mobile) |

## Test Suite Status
- **Before sprint:** 38/38 passing
- **After each phase:** 38/38 passing (no regressions)
- **Final:** 38/38 passing

```
Test Files  4 passed (4)
     Tests  38 passed (38)
```

## Build Status
- `npm run build` succeeds in ~0.8-1.1s (3.4s pre-sprint)
- Main bundle: 245 KB (gzip 80.7 KB) — **52% under the 500 KB target**
- Zero warnings (the new `chunkSizeWarningLimit: 300` would surface regressions)
- Only 3 files in `dist/`: `index.html` + `index-*.js` + `index-*.css`
- No mermaid/cytoscape/katex/dagre in `dist/assets/`

## Bundle Size Comparison

| Metric | Pre-Sprint | Post-Sprint | Reduction |
|---|---|---|---|
| Total JS in dist | 3.1 MB (90+ chunks) | 245 KB (1 chunk) | **92%** |
| Main bundle (uncompressed) | 318 KB | 245 KB | 23% |
| Main bundle (gzip) | 107 KB | 80.7 KB | 25% |
| node_modules packages | 215 | 86 | 60% |
| `dist/` files | 95 | 3 | 97% |
| Build time | 3.4s | 0.8-1.1s | 70% faster |
| Chunk-size warnings | 3 | 0 | 100% |

## Live Site Verification

Verified at https://dppa-case.web.app via playwright browser:
- All 4 flow rows render (BAU, EVN+Cancellation, Developer+Keep, Final)
- `flowNode-bau` shows "BAU retail payment" with `10,358,800 VND` total
- Hour nav: 12:00 → 13:00 → 14:00 → 13:00 (prev/next both directions)
- 0 console errors
- Mobile (390px): flow direction = column, document width = 375px, no horizontal scroll
- All previous Sprint 1 features (loading splash, meta tags, touch feedback) still work

## Files Touched

| File | Phases | Change |
|---|---|---|
| `app/src/modules/flow-diagram.js` | 01 | NEW: 108-line HTML/CSS cancellation flow renderer |
| `app/src/main.js` | 01, 02, 03 | −25 / +13 lines: removed mermaid, added hour nav, updated IDs |
| `app/src/modules/ui.js` | 01, 03 | −28 / +12 lines: flow diagram call, ID renames, removed mermaid divs |
| `app/src/modules/ui.test.js` | 01, 03 | updated 2 test blocks for HTML assertions + 3 ID renames |
| `app/src/style.css` | 01, 02, 03 | −28 / +177 lines: removed mermaid CSS, added flow diagram + hour nav CSS |
| `app/src/modules/chart.js` | 02 | +14 lines: viewport detection, conditional point radii |
| `app/package.json` | 01 | removed `"mermaid": "^11.14.0"` |
| `app/package-lock.json` | 01 | auto-updated, 129 packages removed |
| `app/vite.config.js` | 03 | NEW: 5 lines, `chunkSizeWarningLimit: 300` |
| `reports/2026-06-23-sprint-2-phase-{01,02,03}.md` | 01, 02, 03 | NEW: 3 phase reports |
| `reports/2026-06-23-sprint-2-completion.md` | final | NEW: this file |

## Design Patterns Established

### 1. Pure HTML/CSS flow diagram with semantic class names
Replacing a graph library with a fixed-structure HTML layout:
- `<ol class="flow-diagram">` with `role="list"`
- `.flow-row` flex containers (column on mobile, row on desktop)
- Per-node color tokens: `.flow-node-bau`, `.flow-node-evn`, `.flow-node-cancel`, etc.
- Returns `{flowHtml, kind}` instead of an opaque graph definition

### 2. Mobile-aware chart point sizing via `matchMedia`
```js
const isNarrowViewport = window.matchMedia('(max-width: 520px)').matches
const basePoint = isNarrowViewport ? 3 : 4
```
Avoids hardcoded narrow-only radii; uses the same breakpoint as the CSS media query for consistency.

### 3. Hour navigation as a discovery affordance
Prev/next buttons always visible (not hidden until first chart interaction):
- Always discoverable on first load
- Keyboard accessible (`aria-label` + `:focus-visible`)
- Wrap-around behavior (0→23→0)
- Updates the centered HH:00 label and re-renders walkthrough

## Risks and Open Items

### Closed Risks
- All 7 risk IDs from the original plan (RISK-01-01 through RISK-03-01) were either not triggered or mitigated during implementation.

### New Observations (informational, not blockers)
- Chart radii are set once at init; window resize during a session won't update them. Acceptable for workshop use case where device orientation doesn't change.
- The 2-3 pre-existing large deps in node_modules (Chart.js ~200KB, jsdom test dep) are necessary and not part of this sprint's scope.

## Out-of-Scope Items (Future)
- Service worker / PWA offline support
- CI/CD pipeline
- Lazy-loading chart.js (could save another ~50KB gzipped)
- Tree-shaking Chart.js (would require manual chart type registration)

## Reproducibility
To redeploy:
```bash
cd app
npm install
npm test
npm run build
npx firebase deploy --only hosting --project dppa-case
```

## Lessons Learned (for `lessons.md`)

1. **Graph libraries have huge fixed overhead** — even a 6-node flowchart pulls cytoscape, katex, and dagre. For fixed-structure diagrams, HTML/CSS is faster, smaller, and more accessible.

2. **`matchMedia` for JS-side viewport detection matches CSS breakpoints naturally** — using the same `max-width: 520px` string in both JS and CSS makes the two layers stay in sync without a config file.

3. **Chart.js `getElementsAtEventForMode(event, 'index', { intersect: false })` works on touchscreens, but the points need to be visible** — 1.5px dots are essentially invisible to a finger, regardless of hit detection.

## Next Steps
- Deck consolidation plan (`plans/2026-06-22-dppa-deck-consolidation-plan.md`) is the only remaining unimplemented plan
- Possible sprint 3 candidates: PWA offline, chart tree-shaking, CI/CD
