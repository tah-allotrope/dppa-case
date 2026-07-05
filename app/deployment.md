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

| Date | Commit | Description |
|---|---|---|
| 2026-06-26 | `048ce2a`+ | Workshop chart realism (realistic load/solar/FMP curves, FMP constrained to deck side of strike) + multi-year relocated below daily graph + control-feedback notes |
| 2026-06-26 | `33d294f` | July scenario-training workshop presets, deck corrections, parity harness, UI integration deployed via Codex |
| 2026-06-23 | `29b91e4` | Sprint 1: Workshop Demo Safety — error handling, loading splash, touch feedback |

## CI Notes

GitHub Actions runs lint, unit tests, functional/visual Playwright tests, and the production build. Firebase deployment is commented out under the Q-001 fallback. Run the equivalent local gate with `npm run predeploy` before manual deployment.

- `.firebaserc` binds the `app/` directory to project `dppa-case`
- `firebase.json` uses `dist` as the public dir with SPA rewrite (`**` → `/index.html`)
- Firebase CLI v15.2.1 currently used; no `firebase-debug.log` should be committed
- The Firebase cache file `app/.firebase/hosting.ZGlzdA.cache` is auto-generated and can be safely ignored

## Runtime flags and tour

- `?present=1` forces the high-contrast presenter theme.
- `?teach=1` enables the six-step teaching banner and presenter theme.
- The bilingual tour runs once on an unflagged first visit; the `?` header button relaunches it.

## Quality commands

Run `npm run lint`, `npm test`, `npm run e2e`, and `npm run build`. The complete local Q-001 fallback gate is `npm run predeploy`. Run visual checks with `npm run e2e:visual`; update fixed-environment baselines with `npm run e2e:visual -- --update-snapshots`.

## Pre-workshop checklist

- [ ] Run the local predeploy gate.
- [ ] Verify 18px-or-larger presenter text and 4.5:1 contrast at 1280x720 on a low-brightness projector.
- [ ] Walk all six teach steps forward and backward.
- [ ] Complete the tour on physical iPhone Safari and a mid-size tablet.
- [ ] Test venue Wi-Fi and preload the production URL.
- [ ] Keep `npm run build && npm run preview -- --host 0.0.0.0` ready as the local fallback.
- [ ] Confirm the green release commit is tagged `v1.0-oct-workshop`.
