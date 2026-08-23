# CLAUDE.md — project rules for this repository

Authoritative entry point for anyone (human or agent) working in `dppa-case`. Read this before
touching anything. It supersedes the older per-topic memory documents; where this file and a
`research/` or `plans/` document disagree, this file wins.

Narrative background — why the teaching material looks the way it does — is in
`learning-records/0005-teaching-revamp-and-hardening-arc.md`. Current teaching facts and
figures live in `NOTES.md`, `MISSION.md`, and `RESOURCES.md`.

---

## 1. Repo layout: two parts, one dataset

This repository is **two projects that share one set of generated numbers**.

| Part | Where | What it is |
|---|---|---|
| Web app | `app/` | A Vite + vanilla-JS teaching app deployed to `https://dppa-case.web.app`. The QR code on the deck's closing slide points at it. Owns the settlement engine. |
| Deck tooling | repo root | Six Python scripts that build the PowerPoint deck, worksheets, and teaching visuals via `python-pptx` / `matplotlib`. |

The bridge between them is **`assets/teaching/*.json`**, exported *from* the app's settlement
engine and consumed *by* the Python deck builders. That is why a change to
`app/src/modules/settlement.js` can silently invalidate a slide — see §5.

Supporting directories: `tools/` (integrity guards + their Python tests), `plans/` (forward work),
`reports/` (completed work), `research/` (pre-planning briefs), `learning-records/` (durable
narrative), `lessons/` (course HTML handouts — **not** a corrections log), `facilitator/`
(run-of-show and the fresh-viewer kit), `archive/` (retired, never run).

The root `package.json` exists only because the archived `build-deck.js` depended on `pptxgenjs`.
It has no live scripts. **The app's `package.json` is the one that matters.**

## 2. Commands

All app commands run from `app/`:

```bash
cd app
npm install          # see the npm ci warning below
npm run dev          # local dev server
npm run lint         # eslint, covers src/ e2e/ scripts/
npx prettier --check src e2e scripts
npm test             # vitest, unit
npm run e2e          # playwright, functional (excludes @visual)
npm run e2e:visual   # playwright, pixel snapshots (Chromium projects only)
npm run build        # vite production build
npm run coverage     # vitest with the v8 coverage gate (thresholds in vite.config.js)
npm run predeploy    # lint + prettier --check + test + coverage + e2e + build
npm run deploy       # predeploy, then firebase deploy --only hosting --project dppa-case
py ../tools/check_deploy_freshness.py --write-log   # confirm + log the deploy (see below for the py/python split)
```

`predeploy` mirrors every step of the `quality` CI job except installing browsers and the
non-blocking `e2e:visual` pixel-snapshot pass — it is close to but not literally "the local CI
equivalent"; if you change one, check whether the other needs the matching change.

**Use `npm install`, never `npm ci`.** This is deliberate, not sloppiness. `npm ci` fails in this
project on optional-native-binary lockfile drift (`@emnapi/core` missing) caused by an npm-version
mismatch when the lockfile was last regenerated. `npm install` tolerates that class of
platform-optional-dependency difference. The CI workflow carries the same note at the same step —
if you "fix" one, you must fix both, and you must first prove `npm ci` actually works.

Python (deck tooling) runs from the repo root. **On Windows, prefix with `PYTHONPATH= py`:**

```bash
PYTHONPATH= py build_oct_teaching_deck.py --lang en
PYTHONPATH= py tools/check_retired_figures.py
```

The empty `PYTHONPATH=` clears an inherited value that otherwise shadows the standard library;
`py` is the Windows launcher, because a bare `python` is shadowed on this machine. On Linux CI,
plain `python` is used — that is why the workflows do not carry the prefix.

Python guard tests: `py -m pytest tools/tests`.

## 3. Code style

`app/.prettierrc` is authoritative and is enforced in CI:

```json
{ "semi": false, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

No semicolons, single quotes, trailing commas everywhere, 100 columns. This matches the dominant
style of the largest and most-edited engine files. Run `npm run format` (which covers
`src e2e scripts`) rather than hand-formatting. `npx prettier --check src e2e scripts` runs in the
`quality` job immediately after lint, so a style drift fails the build.

`eslint.config.js` ignores only build output — `dist/`, `node_modules/`, `test-results/`,
`playwright-report/`. **`scripts/` is deliberately linted**, because those scripts generate
CI-verified JSON; a bug there corrupts the deck's numbers.

### Explicit `.js` import extensions — required

Every relative import in `app/src/**` and `app/scripts/**` must carry its file extension:

```js
import { t } from './i18n.js'          // correct
import { t } from './i18n'             // wrong — do not add these back
```

**Why:** Vite's resolver tolerates extensionless specifiers, but plain `node` (which runs
`scripts/*.mjs`, the exporters that produce `assets/teaching/*.json`) follows the ESM spec and does
not. The repo previously papered over this with a `scripts/js-resolve-loader.mjs` shim; that shim
was deleted once the imports were normalized. Reintroducing an extensionless import means the next
person to run an exporter under bare `node` gets `ERR_MODULE_NOT_FOUND`.

## 4. Generated files — never hand-edit

**`assets/teaching/*.json` are build outputs.** `spine-s1/s2/s3.json`, `gate-sweep.json` — all
generated from the app's settlement engine. Editing one by hand puts a number on a slide that the
engine does not actually produce, which is the exact failure the pipeline exists to prevent. The
`deck-parity` CI job regenerates them and runs `git diff --exit-code`, so a hand-edit fails CI.

`terminology-map.json` is the one exception: it is hand-maintained translation data, and its
`UNTRANSLATED` sentinels are a build gate (the deck build refuses to run while a consumed key is
still untranslated). It still needs a qualified VI/ZH speaker — do not guess translations.

## 5. Regeneration order

When `app/src/modules/settlement.js`, `app/src/data/default-scenarios.js`, or the escalation
assumptions change, regenerate **in this order**:

```
cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs
        ↓        (writes assets/teaching/spine-*.json, gate-sweep.json)
PYTHONPATH= py build_teaching_visuals.py --lang en
        ↓        (renders the PNG/GIF figures from that JSON)
PYTHONPATH= py build_oct_teaching_deck.py --lang en
        ↓        (assembles the .pptx)
PYTHONPATH= py audit_teaching_deck.py  +  PYTHONPATH= py verify_deck_numbers.py
                 (parity checks — must both pass)
```

Skipping a step produces a deck whose figures disagree with its own charts. For `vi` / `zh`, repeat
the last three with the matching `--lang`.

## 6. Integrity rules

### Retired figures
When a headline figure changes (e.g. the gate-sweep pass count), **add the superseded string to
`tools/retired_figures.json`'s `retired` list in the same commit as the change.**
`tools/check_retired_figures.py` then fails if the old value survives anywhere in living prose
(`NOTES.md`, `RESOURCES.md`, `MISSION.md`, `corrections-log.md`, `facilitator/**/*.md`,
`lessons/**/*.html`) or in any live generator script. Scanning scripts as well as prose is not
paranoia: an archived builder was found still hard-coding a retired pass count at 48pt bold red.

### Retire with `git mv`, never `rm`
Superseded scripts, decks, and documents move into `archive/` with `git mv` and get a row in
`archive/README.md` saying what they were and what replaced them. They are never deleted — several
document how a still-committed artifact was produced. The one exception is a file whose entire
purpose was to work around something that no longer exists (the resolve-loader shim in §3); that
gets deleted, and the reason is recorded in the plan that removed it.

**Nothing in `archive/` is ever run.** Several archived scripts hard-code figures that were correct
when retired and are wrong now. Treat them as reference for logic, not as executables.

### Where work is tracked
`plans/` for forward work, `reports/` for completed work, `learning-records/` for durable narrative,
`corrections-log.md` for "I got this wrong, here's the rule that prevents it" entries.

**Do not recreate `activeContext.md` at the repo root.** It was a rolling scratchpad that went stale
after 2026-06-29 and is now `archive/activeContext-through-2026-06-29.md`. Plans and reports replaced
it. Note the naming trap: root `corrections-log.md` is the corrections log; the `lessons/` directory
is course handout HTML. They are unrelated, which is why the log is no longer called `lessons.md`.

## 7. Testing notes

- **Local Windows Playwright: use `--workers=1`.** Parallel WebKit on Windows intermittently fails
  with `Object with guid ... was not bound in the connection` — a driver transport flake, not an app
  bug. The same specs pass serially and pass in CI on Linux. Do not "fix" the app in response to it.
  This applies to visual snapshots especially, where a flake looks like a pixel regression.
- Visual snapshots are scoped to Chromium projects; `webkit-mobile` carries
  `testIgnore: /visual\.spec\.js/`.
- **No Linux visual baselines are committed yet.** The `e2e:visual` step in the `quality` job
  therefore carries `continue-on-error: true`, so it cannot currently catch a regression. Closing
  this needs a human: run the `visual-bootstrap` `workflow_dispatch` job, commit the `*-linux.png`
  artifacts into `app/e2e/visual.spec.js-snapshots/`, then delete the bootstrap job and remove
  `continue-on-error` in the same commit. Tracked as **H6** in
  `facilitator/october-run-plan.md`.

## 8. CI

`.github/workflows/ci.yml`
- `quality` — install, lint, prettier check, `i18n:check` (string-table freeze, see §3), unit
  tests, coverage, functional e2e, visual e2e (non-blocking, see §7), build.
- `deck-parity` — regenerates the spine/sweep exports and fails if the committed JSON drifted from
  the engine, then runs `audit_teaching_deck.py`, `verify_deck_numbers.py`,
  `check_retired_figures.py`, `verify_prose_figures.py`, `check_terminology_numbers.py`,
  `check_plan_status.py`, and the `tools/tests` unit suite.
- The Firebase `deploy` job is commented out pending credentials (**H4**); `npm run deploy` works
  today from a machine with Firebase credentials (see §2).

`.github/workflows/freshness-checks.yml` — Mondays 09:00 UTC.
- `check_deploy_freshness.py --strict` — compares the deployed build marker against the repo; the
  job now installs Node first, so a build failure is a hard failure here instead of a silently
  green `UNKNOWN`.
- `check_delivery_pipeline.py --max-age-days 3` — reports uncommitted / unpushed / undeployed
  commit distances and fails if any has sat that way for more than 3 days. This is the guard class
  the repo lacked before 2026-08-23: every other check asks "is this number right", this one asks
  "did the work reach anyone."
- `check_human_blocked_register.py` — parses the human-blocked register table in
  `facilitator/october-run-plan.md` (moved from `plans/2026-october-readiness-checklist.md` on
  2026-08-23 — that file now holds only coding-session tasks) and **exits 1 when a dated item is
  overdue or due within 7 days**. A failing scheduled run here is usually a real deadline, not a
  broken build. `--acknowledged-through DATE` (not currently passed by the scheduled job) prints a
  covered row as `ACKNOWLEDGED` instead of failing on it — use it by hand when a slip is already
  known and accepted, so the next *new* slip is still loud.
