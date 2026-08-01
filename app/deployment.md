# Deployment

## Live URL

**Production:** https://dppa-case.web.app

Firebase project: `dppa-case` (project number 283885094758)

## Deploy Command

```bash
cd app
npm run build
npx firebase deploy --only hosting --project dppa-case
```

## Last Deploy

The top row of this table is maintained automatically by
`python tools/check_deploy_freshness.py --write-log` on every verified-fresh check — do not
hand-edit the top row; hand-edit only the "Description" text if you want a better one after
the fact.

| Date | Commit | Description |
|---|---|---|
| 2026-07-25 | `22bae59` | Verified fresh by tools/check_deploy_freshness.py --write-log |
| 2026-07-22 | `e55319e` (marker; built from an uncommitted tree — see the 2026-07-25 row for the corrected, honest deploy) | Redeploy after Oct teaching-revamp + readiness-hardening + prose-parity work (18 commits since the prior 2026-07-05 deploy) |
| 2026-07-05 | `ed21985`+ | App quality, visuals & testing uplift (PHASE-01..06): lint/CI, Playwright functional suite (scenarios/controls/teach mode), presenter theme + token system, bilingual guided tour, visual-snapshot scaffolding |
| 2026-06-26 | `048ce2a`+ | Workshop chart realism (realistic load/solar/FMP curves, FMP constrained to deck side of strike) + multi-year relocated below daily graph + control-feedback notes |
| 2026-06-26 | `33d294f` | July scenario-training workshop presets, deck corrections, parity harness, UI integration deployed via Codex |
| 2026-06-23 | `29b91e4` | Sprint 1: Workshop Demo Safety — error handling, loading splash, touch feedback |

Note: the tag `v1.0-oct-workshop` (commit `5787aad`) predates the October redesign despite its
name; `v1.1-oct-workshop-hardened` is the tag that actually reflects October-workshop content.

**2026-07-25 finding:** the 2026-07-22 deploy's `build-commit` marker named `e55319e`, but that
commit's `app/vite.config.js` contains no marker-injecting plugin at all (the plugin was added in
the following commit). The deployed HTML could only have come from a build made against an
uncommitted working tree, so it corresponds to no reviewable commit. The build marker now appends
`-dirty` whenever `git status --porcelain` is non-empty at build time
(`app/vite.config.js`'s `getBuildCommit()`), and `tools/check_deploy_freshness.py` treats a
`-dirty` live marker as a hard failure regardless of whether asset hashes match. The freshness
check itself no longer trusts the marker for its pass/fail decision — it compares the live app's
content-hashed asset filenames against a fresh local build's, which is immune to a wrong, missing,
or dirty marker (see "CI Notes" below).

## CI Notes

GitHub Actions runs lint, unit tests, functional/visual Playwright tests, and the production build. Firebase deployment is commented out under the Q-001 fallback. Run the equivalent local gate with `npm run predeploy` before manual deployment.

- `.firebaserc` binds the `app/` directory to project `dppa-case`
- `firebase.json` uses `dist` as the public dir with SPA rewrite (`**` → `/index.html`)
- `firebase.json` sets `Cache-Control: no-cache` on `**/*.html` (so a fresh deploy is visible on
  the very next reload) and `Cache-Control: public, max-age=31536000, immutable` on `/assets/**`
  (safe only because Vite content-hashes every asset filename — a filename never changes without
  its bytes changing, so a year-long cache can never serve stale content under an old name)
- Firebase CLI v15.2.1 currently used; no `firebase-debug.log` should be committed
- The Firebase cache file `app/.firebase/hosting.ZGlzdA.cache` is auto-generated and can be safely ignored
- Deploy freshness is machine-checkable: `python tools/check_deploy_freshness.py` (add
  `--write-log` to update the table above on a verified PASS). It builds the current working tree
  locally and compares the resulting `/assets/*` filenames against what `https://dppa-case.web.app`
  actually serves — not against a commit label — so it cannot be fooled by a stale, wrong, or
  missing `build-commit` marker. A live marker ending in `-dirty` always fails the check outright.

## Runtime flags and tour

- `?present=1` forces the high-contrast presenter theme.
- `?teach=1` enables the six-step teaching banner and presenter theme.
- The tour runs once on an unflagged first visit; the `?` header button relaunches it. In a
  non-English language it shows the resolved-language line first with the English line as a
  secondary caption; in English it shows only the single line.
- `?lang=en|vi|zh` selects the app language. The choice persists to `localStorage` under
  `dppa-lang` and is also picked up from the browser's language when no `?lang=` or stored value
  is present. A key with no translation yet falls back to English rather than showing a raw
  placeholder — the app never renders the literal token `UNTRANSLATED`. Run
  `npm run i18n:report` to see the per-language untranslated key count.

## Quality commands

Run `npm run lint`, `npm test`, `npm run e2e`, and `npm run build`. The complete local Q-001 fallback gate is `npm run predeploy`. Run visual checks with `npm run e2e:visual`; update baselines with `npm run e2e:visual -- --update-snapshots`.

### Offline resilience (PHASE-04)

The app registers `public/sw.js` as a service worker on every page (including under Playwright automation — it is not gated on `navigator.webdriver`, unlike the backdrop-filter workaround). On `install` it fetches `dist/sw-manifest.json` (written by a Vite plugin at build time; lists the current build's content-hashed `/assets/*` filenames plus the static app shell) and precaches every listed URL under a cache name that embeds the build marker, so a new deploy gets a fresh cache and `activate` deletes the old one. `index.html`/navigations are always network-first with a cache fallback; every other same-origin `GET` is cache-first with a network fallback. Once a visitor has loaded the app successfully, it keeps working — including all three `?lang=` values, since the string tables ship inside the single JS bundle rather than being fetched per language — with the network switched off entirely (venue wifi risk).

Explicit Chart.js registration (`LineController`, `LineElement`, `PointElement`, `LinearScale`, `CategoryScale`, `Tooltip`, `Legend`, `Filler` — both charts in this app are `type: 'line'`; no bar/pie/radar chart is used) replaced `chart.js/auto` in `src/modules/chart.js`, trimming the production gzip JS bundle from **84.87 kB to ~77 kB**.

`e2e/offline.spec.js` verifies the service-worker cache contents and a subresource `fetch()` while `context.setOffline(true)`, rather than a full `page.reload()` while offline — Chromium's CDP-level offline emulation blocks top-level navigation before the service worker's fetch handler ever runs (a documented Chromium/DevTools-Protocol limitation), and WebKit additionally blocks subresource `fetch()` under the same emulation regardless of a controlling service worker, so that one case is skipped on `webkit-mobile` with an inline comment. The real "does it survive airplane mode" check remains manual (see the Pre-workshop checklist).

Pixel-snapshot comparison runs on the two Chromium projects only (`chromium-desktop`, `chromium-tablet`). WebKit's headless text/anti-aliasing output was found not to be pixel-stable run-to-run even with identical input (2-4% diffs on a clean re-run), so `webkit-mobile` keeps full functional e2e coverage but is excluded from `@visual` via `testIgnore` in `playwright.config.js`.

Locally on Windows, running visual snapshots requires `--workers=1` — running the 3 Playwright projects in parallel produces enough CPU contention to intermittently blow the screenshot-stability window even on Chromium. CI runners are dedicated and should not need this, but if `npm run e2e:visual` is flaky in CI, add `--workers=1` there too before assuming a real regression.

### Visual baseline bootstrap (one-time)

No snapshot baselines are committed yet. Local Windows-generated (`-win32.png`) baselines are intentionally **not** committed — Playwright suffixes snapshot filenames by OS, so they wouldn't match CI's Linux run anyway, and cross-OS font rendering differs enough to produce false failures (this is why `npm run e2e:visual` is `continue-on-error: true` in `.github/workflows/ci.yml` for now). To bootstrap real baselines:

1. Trigger the `app-quality` workflow on a throwaway branch (or run it once manually).
2. Download the job's working tree, or add a one-off step that runs `npm run e2e:visual -- --update-snapshots` and uploads `app/e2e/visual.spec.js-snapshots/` as an artifact.
3. Commit the resulting `-linux.png` files to `app/e2e/visual.spec.js-snapshots/`.
4. Remove `continue-on-error: true` from the `e2e:visual` step in `ci.yml` once baselines are committed and green.

## Pre-workshop checklist

- [ ] Run the local predeploy gate.
- [ ] Verify 18px-or-larger presenter text and 4.5:1 contrast at 1280x720 on a low-brightness projector.
- [ ] Walk all six teach steps forward and backward.
- [ ] Complete the tour on physical iPhone Safari and a mid-size tablet.
- [ ] Test venue Wi-Fi and preload the production URL.
- [ ] Keep `npm run build && npm run preview -- --host 0.0.0.0` ready as the local fallback.
- [ ] Confirm the green release commit is tagged `v1.1-oct-workshop-hardened`.
