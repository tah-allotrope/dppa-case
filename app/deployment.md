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
| 2026-07-25 | `b69efc3` | Verified fresh by tools/check_deploy_freshness.py --write-log |
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
- The bilingual tour runs once on an unflagged first visit; the `?` header button relaunches it.

## Quality commands

Run `npm run lint`, `npm test`, `npm run e2e`, and `npm run build`. The complete local Q-001 fallback gate is `npm run predeploy`. Run visual checks with `npm run e2e:visual`; update baselines with `npm run e2e:visual -- --update-snapshots`.

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
