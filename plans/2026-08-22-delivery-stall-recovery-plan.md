---
title: "Delivery-Stall Recovery and Guard Hardening"
date: "2026-08-22"
status: "draft"
request: "Turn research/2026-08-22-delivery-stall-and-in-flight-redesign-brainstorm.md into a multi-phase implementation plan saved to plans/"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-08-22-delivery-stall-and-in-flight-redesign-brainstorm.md"
  - "research/2026-08-15-deploy-drift-and-unverifiable-status-brainstorm.md"
  - "research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md"
---

# Plan: Delivery-Stall Recovery and Guard Hardening

## Objective

Get the repository's three stalled delivery stages moving again — an uncommitted UI redesign,
three unpushed commits, and a 28-day-old production deploy — and then build the guard class that
would have caught the stall automatically. In the same pass, freeze and de-risk the translation
surface before an external translator is engaged, and convert the remaining checks that
structurally cannot fail into checks that can. A fixed-date teaching session is assumed for
2026-10-01, with a content freeze on 2026-09-15.

## Context Snapshot

- **Current state:**
  - `app/` working tree carries an uncommitted chart/legibility redesign: 11 modified files,
    +1,177 / −782 lines. It renders with zero console errors, but it fails the repository's
    coverage gate (`branches 69.82%` against a `71%` threshold) and contains one real defect.
  - Local `master` is **3 commits ahead of `origin/master`**; the newest of those commits adds a CI
    formatting gate that has therefore never run in CI.
  - The deployed app at `https://dppa-case.web.app` is **14 commits behind** local `master`
    (live build marker `22bae59`, deployed 2026-07-25).
  - Of the repository's automated checks, six are structurally incapable of failing for the reason
    they exist, and one is incapable of passing.
  - Translation surface: 352 outstanding units (`app/src/data/strings.js` vi 140/151 and zh 148/151
    `UNTRANSLATED`; `assets/teaching/terminology-map.json` 64/156). No Vietnamese or Chinese deck
    exists.
- **Desired state:**
  - The redesign is correct, tested, committed, pushed, CI-verified, and deployed.
  - A propagation guard reports uncommitted / unpushed / undeployed distances every Monday and can
    fail.
  - The translation surface is frozen behind a gate, locale-safe, and free of embedded figures.
  - Every check either can fail for its stated reason or has been deleted.
  - The Python deck pipeline is installable and exercised by CI.
  - The app's landing state matches the teaching canon.
- **Key repo surfaces:**
  `app/src/modules/chart.js`, `app/src/modules/ui.js`, `app/src/modules/formatters.js`,
  `app/src/data/default-scenarios.js`, `app/src/data/strings.js`, `app/vite.config.js`,
  `app/public/sw.js`, `app/index.html`, `app/package.json`,
  `tools/check_deploy_freshness.py`, `tools/check_human_blocked_register.py`,
  `tools/check_retired_figures.py`, `tools/verify_prose_figures.py`, `tools/retired_figures.json`,
  `verify_deck_numbers.py`, `audit_teaching_deck.py`, `build_teaching_visuals.py`,
  `build_oct_teaching_deck.py`, `app/scripts/export-sweep.mjs`,
  `.github/workflows/ci.yml`, `.github/workflows/freshness-checks.yml`.
- **Out of scope:**
  - Producing Vietnamese or Chinese translations (needs a qualified human translator; this plan
    only prepares and freezes the surface).
  - Recalibrating the lender/investor gate thresholds against real deal data (needs a human with
    Allotrope deal data).
  - Committing Linux visual-regression baselines (requires triggering a GitHub Actions
    `workflow_dispatch` job from a browser).
  - Rewriting git history to shrink the 137 MB `.git` directory.
  - Any redesign of the teaching content itself.

## Environment & Conventions

- **Stack:** Node.js 24 + npm (app), Vite 8, vanilla JS ES modules (no framework), Chart.js 4,
  Vitest 4 (unit), Playwright 1.53 (e2e), ESLint 9, Prettier 3. Python 3.12+ for the deck tooling
  (`python-pptx`, `python-docx`, `matplotlib`, `numpy`, `Pillow`). The repository root also has a
  vestigial `package.json` with no live scripts — **the app's `package.json` is the one that
  matters**.
- **Setup:**
  ```bash
  cd app && npm install
  ```
  **Use `npm install`, never `npm ci`.** `npm ci` fails in this project on optional-native-binary
  lockfile drift (`@emnapi/core` missing) caused by an npm-version mismatch when the lockfile was
  last regenerated. Both CI workflows carry the same note at the same step; if you change one you
  must change both, and you must first prove `npm ci` actually works.
- **Build / Run:**
  ```bash
  cd app && npm run dev      # local dev server, http://localhost:5173
  cd app && npm run build    # production build into app/dist
  cd app && npm run preview  # serve app/dist on http://localhost:4173
  ```
- **Test:**
  - Full unit suite: `cd app && npm test` (currently 73 tests across 9 files, ~13 s).
  - Single unit file: `cd app && npx vitest run src/modules/settlement.test.js`
  - Coverage: `cd app && npm run coverage`
  - Functional e2e: `cd app && npm run e2e` — **on Windows add `-- --workers=1`**; parallel WebKit
    on Windows intermittently fails with `Object with guid ... was not bound in the connection`,
    which is a driver transport flake, not an app bug.
  - Visual e2e: `cd app && npm run e2e:visual` (Chromium projects only).
  - Python guard tests: `python -m unittest discover -s tools/tests -v` (this is exactly what CI
    runs). On Windows, `PYTHONPATH= py -m unittest discover -s tools/tests -v`.
- **Conventions & traps:**
  - **Prettier** (`app/.prettierrc`, authoritative): `{ "semi": false, "singleQuote": true,
    "trailingComma": "all", "printWidth": 100 }`. Run `cd app && npm run format` rather than
    hand-formatting. CI runs `npx prettier --check src e2e scripts`.
  - **Every relative import in `app/src/**` and `app/scripts/**` must carry its `.js` extension**
    (`from './i18n.js'`, never `from './i18n'`). Vite tolerates extensionless specifiers; plain
    `node`, which runs `app/scripts/*.mjs`, does not. A previous loader shim was deleted once the
    imports were normalized — do not reintroduce extensionless imports.
  - **`assets/teaching/spine-s1.json`, `spine-s2.json`, `spine-s3.json` and `gate-sweep.json` are
    build outputs. Never hand-edit them.** CI regenerates them and runs `git diff --exit-code`.
    `assets/teaching/terminology-map.json` is the one exception: it is hand-maintained translation
    data.
  - **Retirement rule:** when a headline figure changes, add every superseded string form to the
    `retired` list in `tools/retired_figures.json` **in the same commit** as the change.
    `tools/check_retired_figures.py` then fails if the old value survives anywhere in living prose
    or in any live generator script.
  - **Retire with `git mv`, never `rm`.** Superseded scripts and documents move into `archive/`
    and get a row in `archive/README.md`. Nothing in `archive/` is ever executed.
  - **Windows Python invocation:** prefix with `PYTHONPATH= py` (for example
    `PYTHONPATH= py tools/check_retired_figures.py`). The empty `PYTHONPATH=` clears an inherited
    value that otherwise shadows the standard library, and `py` is the Windows launcher because a
    bare `python` is shadowed on the primary development machine. On Linux CI, plain `python` is
    used, which is why the workflow files carry no prefix. **Every Python command in this plan is
    written in the Linux form; prepend `PYTHONPATH= ` and substitute `py` for `python` on Windows.**
  - **Currency:** all internal arithmetic is in Vietnamese Dong (VND). USD is a display conversion
    only, at a single hardcoded rate in `app/src/modules/formatters.js`.
  - **Units:** energy volumes are kWh; prices are VND per kWh; bill totals are absolute VND;
    chart axes divide by `1e9` for VND (billions) and by `EXCHANGE_RATE * 1e6` for USD (millions).
  - Work is tracked in `plans/` (forward work), `reports/` (completed work),
    `learning-records/` (durable narrative), `corrections-log.md` (rules learned from mistakes).
    **Do not create `activeContext.md` at the repository root** — it was retired to `archive/`.
    Note the naming trap: the root `corrections-log.md` is the corrections log; the `lessons/`
    directory is course-handout HTML. They are unrelated.
- **Repo map:**
  ```
  app/                     Vite + vanilla-JS teaching app, deployed to https://dppa-case.web.app
    src/modules/           settlement.js (engine), chart.js, ui.js, formatters.js, i18n.js, …
    src/data/              default-scenarios.js (all input constants), strings.js (i18n table)
    scripts/               export-spine.mjs, export-sweep.mjs (write assets/teaching/*.json)
    e2e/                   Playwright specs; visual.spec.js-snapshots/ holds pixel baselines
    public/                sw.js (service worker), favicon, brand assets — copied verbatim
  assets/teaching/         GENERATED JSON + rendered PNG/GIF figures consumed by the deck builders
  tools/                   Python integrity guards + their unittest suite in tools/tests/
  ceba/                    The PowerPoint decks (source master and the built October deck)
  plans/ reports/ research/ learning-records/ lessons/ facilitator/ archive/
  *.py at repo root        Six live deck/worksheet/visual builders and two deck verifiers
  ```

## Research Inputs

- From `research/2026-08-22-delivery-stall-and-in-flight-redesign-brainstorm.md`:
  - Local `master` is 3 commits ahead of `origin/master` (verified via
    `git rev-list --left-right --count origin/master...master` → `0  3`); the newest unpushed
    commit is the one that added the CI Prettier gate, so that gate has never executed in CI.
  - The live site's build marker is `22bae59` (2026-07-25); `git rev-list --count 22bae59..master`
    is 14. The offline service worker and the entire trilingual mechanism are among the
    undeployed work.
  - The scheduled `deploy-freshness` GitHub Actions job logged `DEPLOY-FRESHNESS UNKNOWN: local
    build failed` and exited 0 on 2026-08-17 while the site was three weeks stale. Its workflow
    has no `setup-node` step and no `npm install`, so `npm run build` inside the checker can never
    succeed on the runner, and the checker's lenient path returns 0.
  - `npm run coverage` currently fails: branches 69.82% against a 71% threshold. Separately, the
    coverage denominator lists only 13 files — `app/src/modules/chart.js` (652 lines) and
    `app/src/main.js` (309 lines) are absent because no test imports them, so roughly 42% of the
    app's JavaScript is outside the reported percentage entirely.
  - Real defect in the uncommitted work: `app/src/modules/chart.js` line 36 declares
    `const profileChartState = { inputs: null }` (the `currency` property was removed in the same
    change) while line 415 still reads `profileChartState.currency`. `convertMoney` therefore falls
    back to VND, `getPixelForValue(2000)` lands far outside a USD axis spanning ≈0.036–0.077, the
    `y < chartArea.top` guard returns early, and the dashed strike line is never drawn — while the
    caption beneath it still reads `Dashed line = strike price 0.0755 USD`.
  - `app/index.html` now loads Inter from `https://fonts.googleapis.com` with a render-blocking
    `<link rel="stylesheet">`. `app/public/sw.js` returns early on cross-origin requests, so the
    font is never cached. A slow-but-not-dead venue network therefore delays first paint — the
    exact risk the service worker and the six embedded MP4 fallback slides exist to mitigate.
  - `app/docs/assumptions.md` line 33 states "USD display divides by 25,000" while
    `app/src/modules/formatters.js` line 1 is `EXCHANGE_RATE = 26500` — a 6% contradiction, in a
    directory that no guard scans.
  - The app's landing state is scenario `balanced` at strike 2,000 / FMP 1,427 VND per kWh, while
    the deck, spine exports, worksheets and facilitator guide are all built on `workshop1` at
    strike 1,250 / FMP 1,150 VND per kWh.
  - `verify_deck_numbers.py` reconciles four distinct figures (`11,020`, `9,063`, `5,947`,
    `2,617`) because it scans slide bodies only. The answer-key figures the presenter reads aloud
    — `8,563`, `1,800`, `817`, `5,000,000` — live in speaker notes and are verified by nothing.
  - No visual-regression baselines have ever been committed on any platform; the 24 local
    `-win32.png` files are untracked, and the CI step carries `continue-on-error: true`.
  - `tools/check_human_blocked_register.py` raises `UnicodeEncodeError` on a Windows cp1252 console
    when printing the register row containing `→`.
- From `research/2026-08-15-deploy-drift-and-unverifiable-status-brainstorm.md`:
  - `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md` is marked `complete` but has 80
    unticked tasks, no matching artifact in `reports/`, and four sampled tasks were verified as not
    done. It is a high-quality, fully-specified backlog that was mislabeled, not executed.
  - Extending the gate-sweep strike grid from `[1100 … 1450]` to `[1100 … 1550]` raises the
    all-three-gates pass count from 5 of 56 to 15 of 70. The current top of the grid, 1,450, is
    exactly the investor threshold constant, so the scarcity headline is an artifact of where the
    axis stops.
  - `app/src/data/default-scenarios.js` ships `evnEscalation: 0.04` and `strikeEscalation: 0.04`.
    Because the differential is zero, the multi-year projection shows no crossover inside a 20-year
    horizon and a 20-year loss of about 65.7 billion VND against doing nothing. At
    `strikeEscalation: 0.02` the crossover falls at year 14; at `0.015`, year 12; at `0`, year 9.
  - `app/src/data/strings.js` already contains keys for two unbuilt features:
    `controls_locked_strike` and `multiyear_differential_template`. Nothing in `app/src/`
    references either.
- From `research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md`:
  - `verify_deck_numbers.py` is hard-wired to the English deck path and ignores `sys.argv`; its
    `NUMBER_PATTERN` is comma-only, so pointed at a Vietnamese deck (which groups with `.`, as in
    `11.020`) it would match zero tokens and exit 0 — a vacuous pass.
  - `assets/teaching/terminology-map.json` is scanned by no guard, and its English snapshots
    already carry embedded literals such as `11,020` and `9,063`.
  - `lessons/0009-scenario-3-excess-vi.html` prints `5,000,000 × 1,100 × 1.026 × 1.008` in a
    Vietnamese-language worksheet; read with Vietnamese numeric conventions that reads as a
    1000-fold error on the two loss coefficients.

## Assumptions and Constraints

- **ASM-001:** The uncommitted working-tree changes are deliberate, wanted work by the repository
  owner rather than an accident. — **BINDING DEFAULT:** treat them as wanted; fix the defects
  identified in PHASE-01 and commit them rather than reverting anything. Do not use
  `git checkout --`, `git restore`, `git stash drop`, or `git reset --hard` on any tracked file at
  any point in this plan.
- **ASM-002:** The teaching session date is unconfirmed. — **BINDING DEFAULT:** assume 2026-10-01,
  with a content freeze on 2026-09-15, and treat every deadline in this plan as relative to those
  dates.
- **ASM-003:** The executor may not have Firebase deploy credentials or a browser session. —
  **BINDING DEFAULT:** implement and verify everything up to the deploy, run
  `npx firebase deploy --only hosting --project dppa-case` only if `npx firebase login:list`
  reports an authenticated account; otherwise stop at that task, leave TASK-02-09 and TASK-02-10
  unticked, and record in the phase's exit criteria that the deploy is pending credentials.
- **ASM-004:** The correct self-hosted webfont packaging is unspecified. — **BINDING DEFAULT:**
  install `@fontsource/inter` from npm and import the `latin-400`, `latin-500`, `latin-600`,
  `latin-700`, `vietnamese-400` and `vietnamese-600` CSS entry points. If that package cannot be
  installed in the executor's environment, instead delete the three font-related `<link>` tags from
  `app/index.html` and rely on the existing `system-ui, -apple-system, 'Segoe UI', sans-serif`
  fallback stack. Under no circumstances leave a remote `fonts.googleapis.com` stylesheet in the
  shipped HTML.
- **ASM-005:** The right default strike escalation is a negotiation input nobody in the repository
  has sourced. — **BINDING DEFAULT:** set `strikeEscalation: 0.02` (2.0% per year) in
  `app/src/data/default-scenarios.js`, documented in the same provenance-comment style as the
  neighbouring constants as an illustrative partially-indexed strike, explicitly not a sourced
  figure. This places the cumulative-savings crossover at year 14, inside the 20-year horizon.
- **ASM-006:** Whether importing `app/src/modules/chart.js` inside a jsdom unit test succeeds is
  untested. — **BINDING DEFAULT:** attempt it first; if the import throws because of a missing
  canvas implementation, extract `range`, `mergedBandChips` and `renderTariffCaption` verbatim into
  a new `app/src/modules/chart-caption.js`, re-export them from `chart.js`, and test the new
  module instead. Do not add a canvas polyfill dependency.
- **ASM-007:** Any local pixel baselines present under `app/e2e/visual.spec.js-snapshots/` are
  Windows-generated (`-win32.png`) and not valid for the Linux CI runner; the directory may also be
  absent entirely, since `npm run e2e:visual` recreates it on demand. — **BINDING DEFAULT:** if the
  directory exists, leave it untracked and uncommitted; either way do not add it to any
  `.gitignore`, because Linux baselines must be committable there later.
- **ASM-008:** `app/inspect-tmp.mjs` is a leftover ad-hoc debugging probe that may already have
  been removed. — **BINDING DEFAULT:** if it is present, delete it (it is untracked, so plain `rm`
  is correct here and the `git mv` retirement rule does not apply to never-committed scratch
  files); if it is absent, treat TASK-01-07 as already satisfied.
- **CON-001:** Changing any headline figure obliges a same-commit update to
  `tools/retired_figures.json`, and `tools/check_retired_figures.py` must pass before the commit.
- **CON-002:** `matplotlib` is not installed on the primary development machine and is not
  installed by CI, so `build_teaching_visuals.py` and `build_cfd_slide.py` currently run in neither
  environment. Any task that re-renders a figure depends on PHASE-05 landing first.
- **CON-003:** A qualified Vietnamese/Chinese translator has not been engaged. No task in this plan
  may invent, machine-translate, or guess a translation. `UNTRANSLATED` sentinels stay until a
  human replaces them.
- **DEC-001:** Neither `app/scripts/export-spine.mjs` nor `app/scripts/export-sweep.mjs` reads
  `evnEscalation` or `strikeEscalation` from `defaultInputs` — the sweep defines its own local
  `ESCALATION = 0.04` constant. **Changing the app's escalation defaults therefore does not change
  any file under `assets/teaching/` and does not require the deck regeneration chain.** Verify this
  with `git diff --exit-code` after re-running the exporters, as PHASE-06 instructs.
- **DEC-002:** Extending the gate-sweep strike grid *does* change `assets/teaching/gate-sweep.json`,
  the rendered M5 heatmap, and the headline pass count on slides, in the facilitator guide and in
  learner handouts. It therefore requires the full regeneration chain and the retirement rule.
- **DEC-003:** The deploy ritual is
  `cd app && npm run predeploy && npx firebase deploy --only hosting --project dppa-case`, followed
  by `python tools/check_deploy_freshness.py --write-log`. This plan makes it a single npm script
  rather than prose in three documents.
- **DEC-004:** The canonical teaching scenarios are S1 matched, S2 shortfall, S3 excess,
  implemented as `workshop1`, `workshop2`, `workshop3` in `app/src/data/default-scenarios.js`.

## Specification

### S1. Delivery-pipeline distance metric (PHASE-02)

Three integers, computed from git and from the live site, define how far work has propagated.

```
dirty_tracked   = | { f : f is tracked AND (staged OR unstaged modification) } |
untracked_files = | { f : f is untracked AND not ignored } |
unpushed        = count( commits reachable from HEAD but not from <upstream> )
undeployed      = count( commits reachable from HEAD but not from <live_marker_commit> )
```

Symbol meanings:

- `f` — a path in the working tree, as reported by `git status --porcelain=v1`.
- `dirty_tracked` — files git already tracks that differ from `HEAD`. Derived from porcelain
  status lines whose two-character status field is **not** `??` and not `!!`. This is the number
  that gates: uncommitted edits to tracked files are unshipped work.
- `untracked_files` — porcelain status `??`. Reported for information only and **never** gates,
  because the repository legitimately holds untracked local pixel baselines (ASM-007).
- `unpushed` — `git rev-list --count <upstream>..HEAD`, where `<upstream>` is the configured
  upstream of the current branch, falling back to `origin/<current-branch>`.
- `undeployed` — `git rev-list --count <live_marker_commit>..HEAD`, where `<live_marker_commit>`
  is the value of the `<meta name="build-commit">` tag in the HTML served by the live URL, with any
  trailing `-dirty` suffix stripped. If the marker is absent, is the literal string `unknown`, or
  names a commit that does not exist in the local object database, `undeployed` is reported as
  `None` and does not gate.

Exit-code logic, in order — the first matching rule wins:

1. If the live URL cannot be reached, or the marker is unusable: print `DELIVERY-PIPELINE UNKNOWN:
   <reason>` plus the two git-only counts, and exit `0`. Network flakiness must never fail a
   scheduled job.
2. Else if `dirty_tracked > 0` **or** `unpushed > 0` **or** `undeployed > 0`: print
   `DELIVERY-PIPELINE STALLED` followed by one line per non-zero stage, and exit `1`.
3. Else: print `DELIVERY-PIPELINE CLEAN (0 uncommitted, 0 unpushed, 0 undeployed)` and exit `0`.

`--max-age-days N` (default `0`, meaning "any non-zero count fails") relaxes rule 2: a stage only
fails when its oldest blocked commit is older than `N` days. For `dirty_tracked` there is no commit
to date, so it always counts as age `0` days and, with `N >= 1`, does not fail on its own.

### S2. Coverage re-baselining procedure (PHASE-01)

1. Set `test.coverage.all` to `true` and `test.coverage.include` to `['src/**/*.js']` in
   `app/vite.config.js`, so the denominator is the source tree rather than only the modules some
   test happens to import.
2. Run `cd app && npx vitest run --coverage` once with **all four global thresholds temporarily
   removed** to obtain an honest measurement.
3. For each of `lines`, `branches`, `functions`, `statements`, set the new global threshold to
   `floor(measured_percentage)` — the integer at or below the measurement, never above it. This
   matches the existing ratchet comment: thresholds are set from a real measurement, rounded down,
   raised deliberately and never lowered silently.
4. Add a per-file threshold entry for `src/modules/settlement.js` set to
   `floor(measured_settlement_branch_percentage)` for `branches` and likewise for the other three
   metrics, so the file every published number descends from cannot be silently de-covered by
   other files picking up the slack.
5. Re-run `cd app && npm run coverage` and confirm exit code `0`.

### S3. Speaker-notes parity extension (PHASE-04)

`verify_deck_numbers.py` currently walks only `shape.text_frame.text` for each slide. Extend the
extraction to also walk `slide.notes_slide.notes_text_frame.text` when `slide.has_notes_slide` is
true, tagging each token with its origin so failures name it:

```
tokens = [ (slide_index, "body",  token) … ] + [ (slide_index, "notes", token) … ]
```

The allow-set is unchanged: a token passes if it appears in the union of the spine-derived
numbers, the sweep-derived numbers, and `EXTRA_ALLOWED`. Every token in the notes of the currently
committed deck (`8,563`, `1,800`, `817`, `5,000,000`, `9,063`, `5,947`) must be present in that
union after the change, or the underlying figure genuinely disagrees with the engine and must be
investigated rather than added to `EXTRA_ALLOWED`.

### S4. Locale-aware number formatting (PHASE-03)

`app/src/modules/formatters.js` hardcodes `Intl.NumberFormat('en-US')` in two places. Replace the
literal with a resolved BCP-47 locale tag derived from the active interface language:

| Interface language (`i18n.js`) | Locale tag | Grouping | Decimal |
|---|---|---|---|
| `en` | `en-US` | `1,234,567` | `.` |
| `vi` | `vi-VN` | `1.234.567` | `,` |
| `zh` | `zh-CN` | `1,234,567` | `.` |

The mapping lives in `formatters.js` as an exported constant so tests can assert it directly, and
the resolution reads the language through the existing i18n module rather than through
`navigator.language`, so a `?lang=` override is honoured.

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Make the in-flight redesign correct, covered, offline-safe, and committed | None | Fixed USD strike line, self-hosted font, honest coverage gate, new unit tests, 2 commits |
| PHASE-02 | Propagate the work and build the guard that detects non-propagation | PHASE-01 | `tools/check_delivery_pipeline.py`, working Monday jobs, `npm run deploy`, pushed + deployed app |
| PHASE-03 | Freeze and de-risk the translation surface before the translator starts | PHASE-01 | String-freeze gate, locale-aware formatters, fixed VI handout, figure-free terminology map, translator brief |
| PHASE-04 | Convert the remaining un-failable checks into real gates | PHASE-02 | Notes-level deck parity, deleted no-op loop, widened guard scans, plan-status checker, corrected FX docs |
| PHASE-05 | Make the Python deck pipeline installable and CI-verified | PHASE-04 | `requirements.txt`, `tools/pipeline.py`, `tools/compare_deck.py`, `deck-build` CI job |
| PHASE-06 | Fix what the app teaches by default and make the gate story defensible | PHASE-05 | Canonical landing state, escalation differential UI, URL state, extended strike grid with retirement |

## Detailed Phases

### PHASE-01 - Stabilise and commit the in-flight redesign

**Goal**
Turn the 11-file uncommitted working tree into two clean, green, committed changes: the redesign
with its defect fixed and its offline risk removed, and an honest coverage configuration.

**Tasks**

- [ ] TASK-01-01: Fix the USD strike-reference-line defect. In `app/src/modules/chart.js`, restore
      the `currency` property on the shared state bag (`const profileChartState = { inputs: null,
      currency: 'VND' }`) and assign `profileChartState.currency = currency` immediately after the
      existing `profileChartState.inputs = inputs` assignment inside `renderProfileChart`. Do not
      change the `strikeLine` plugin's guard logic. `app/src/main.js` already calls
      `renderProfileChart` before `renderFmpStrip` in the same `updateView()` pass, so the state is
      always current when the strip draws.
- [ ] TASK-01-02: Remove the remote webfont. Delete the three font-related `<link>` elements from
      `app/index.html` (the two `preconnect` hints and the `fonts.googleapis.com` stylesheet).
      Install `@fontsource/inter` (`cd app && npm install --save @fontsource/inter`) and add the six
      subset imports listed in ASM-004 at the very top of `app/src/main.js`, above the existing
      `import './style.css'` line. Leave the inline `<style>` block's `font-family` declaration in
      `app/index.html` untouched — it is the pre-hydration splash and its fallback stack is correct.
- [ ] TASK-01-03: Confirm the font files are precached. Run `cd app && npm run build`, then confirm
      that `app/dist/sw-manifest.json` contains at least one `.woff2` entry. The
      `swManifestPlugin` in `app/vite.config.js` already emits every non-`.map` bundle entry, so
      fonts imported through CSS are included automatically; no change to `app/public/sw.js` is
      required. If no `.woff2` appears, add the emitted font paths to `STATIC_URLS` in
      `app/public/sw.js` instead.
- [ ] TASK-01-04: Make the coverage denominator honest and re-baseline it, following the numbered
      procedure in `## Specification` S2.
- [ ] TASK-01-05: Add unit tests for the new caption rendering (see Test Specs). Follow ASM-006 if
      importing `chart.js` under jsdom fails.
- [ ] TASK-01-06: Add unit tests for the two new collapsible-derivation markup helpers in
      `app/src/modules/ui.js` (see Test Specs), extending the existing
      `app/src/modules/ui.test.js`.
- [ ] TASK-01-07: Delete the untracked scratch probe if it is still present:
      `rm -f app/inspect-tmp.mjs`.
- [ ] TASK-01-08: Run the full local gate set and make it green:
      ```bash
      cd app && npm run lint && npx prettier --check src e2e scripts && npm test && npm run coverage && npm run build
      ```
- [ ] TASK-01-09: Run the functional e2e suite. First free port 4173 if a previous session left a
      preview server running — `playwright.config.js` deliberately sets `reuseExistingServer:
      false`, so a leftover listener aborts the run with `http://localhost:4173 is already used`:
      ```bash
      # Linux/macOS
      lsof -ti tcp:4173 | xargs -r kill
      # Windows (PowerShell)
      Get-NetTCPConnection -LocalPort 4173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
      ```
      then `cd app && npm run e2e -- --workers=1`.
- [ ] TASK-01-10: Write `reports/2026-08-22-chart-legibility-redesign.md` recording what the
      redesign changed and why, so the repository's largest change is legible to the next session.
      State plainly that the work was found uncommitted and was stabilised, not authored, by this
      phase.
- [ ] TASK-01-11: Commit in two commits, in this order, on the current `master` branch:
      1. `redesign: chart legibility pass — FMP strip, direct labels, collapsible derivations`
         (all 11 modified source files, the font change, the new tests, the deleted probe, the new
         report).
      2. `test: honest coverage denominator + per-file settlement.js threshold`
         (`app/vite.config.js` only).
      Do not push yet — pushing is TASK-02-09.

**File Changes**

- `app/src/modules/chart.js` (modify): restore `currency: 'VND'` on the `profileChartState` object
  literal at the top of the module; assign `profileChartState.currency = currency` inside
  `renderProfileChart` next to the existing `profileChartState.inputs = inputs`. Leave every other
  part of the module, including all plugin implementations, unchanged.
- `app/index.html` (modify): delete the `preconnect` links to `https://fonts.googleapis.com` and
  `https://fonts.gstatic.com` and the `fonts.googleapis.com/css2?family=Inter…` stylesheet link.
  Leave the `<style>` block, the `#app-loading` splash markup, and all meta tags alone.
- `app/src/main.js` (modify): add the six `@fontsource/inter` subset CSS imports as the first
  statements in the file, above `import './style.css'`. Change nothing else.
- `app/package.json` (modify): add `@fontsource/inter` to `dependencies` (npm does this).
- `app/vite.config.js` (modify): inside `test.coverage`, add `all: true` and
  `include: ['src/**/*.js']`; replace the four global threshold integers with the re-measured
  floors; add a per-file thresholds entry keyed on `src/modules/settlement.js`. Leave
  `buildCommitPlugin`, `swManifestPlugin`, `test.exclude`, `coverage.exclude` and
  `build.chunkSizeWarningLimit` unchanged.
- `app/src/modules/chart.test.js` (create): jsdom-environment unit tests for the tariff caption.
- `app/src/modules/ui.test.js` (modify): append a `describe` block for the collapsible derivation
  markup. Do not alter existing assertions.
- `app/inspect-tmp.mjs` (delete, if present): untracked scratch probe.
- `reports/2026-08-22-chart-legibility-redesign.md` (create): completed-work record.
- `app/src/modules/chart-caption.js` (create, **conditional** — only under ASM-006's fallback).

**Function Signatures**

- `renderProfileChart(canvas: HTMLCanvasElement, labels: string[], intervals: object[], selectedHour: number, onSelect: (hour: number) => void, inputs: object, currency: 'VND' | 'USD' = 'VND') -> Chart`
  — unchanged signature; now also writes `currency` into the module-level `profileChartState` bag.
- `renderTariffCaption(inputs: object, currency: 'VND' | 'USD' = 'VND') -> void` — unchanged
  signature; sets `innerHTML` on the `#tariffCaption` element and returns nothing.

**Test Specs**

All expected strings below were observed from the running application with the shipped
`defaultInputs` (scenario `balanced`, `marketPrice: 1427`, `strikePrice: 2000`,
`fmpCurve: buildFmpCurve(1427)`).

- Setup for every caption test: `document.body.innerHTML = '<div id="tariffCaption"></div>'`.
- `renderTariffCaption({ ...defaultInputs, fmpCurve: buildFmpCurve(1427) }, 'VND')` → the element's
  text content contains `Dashed line = strike price 2,000 VND`, `Off-peak`, `970`, `1,313`,
  `Standard`, `1,027`, `1,855`, `Peak`, `1,384`, `2,026`, and the unit string `VND/kWh`.
- `renderTariffCaption({ ...defaultInputs, fmpCurve: buildFmpCurve(1427) }, 'USD')` → the text
  contains `Dashed line = strike price 0.0755 USD` and `USD/kWh`, and contains neither the
  substring `VND` nor the substring `2,000`.
- `renderTariffCaption(inputs, 'VND')` with `#tariffCaption` absent from the document → returns
  `undefined` and throws nothing.
- `renderTariffCaption({ ...defaultInputs, fmpCurve: undefined, marketPrice: 1427 }, 'VND')` → the
  three band chips all render the single flat value `1,427` (the `min === max` branch), producing
  no en-dash range in the chip text.
- Regression guard for TASK-01-01: after
  `renderProfileChart(canvas, labels, intervals, 12, () => {}, inputs, 'USD')`, the module's
  exported or otherwise observable chart state reports currency `'USD'`. If the state bag is not
  exported, assert indirectly: `renderTariffCaption` is called by `renderProfileChart` with the same
  `currency`, so `#tariffCaption` must contain `USD` after that call and must not contain `VND`.
- `renderWalkthroughCases(container, selectedCase, 'VND', formulas)` with a case whose
  `shortfall > 0` → the container contains exactly one `<details class="walkthrough-derivation">`
  element, its `<summary>` text equals the English value of the `wt_derivation_summary` string key,
  and the element is **closed** by default (`details.open === false`).
- `renderWalkthroughCases(container, selectedCase, 'VND', formulas)` → the container contains three
  `.bill-line-row` elements whose `.bill-line-label` texts are the English values of
  `wt_row_evn`, `wt_row_developer` and `wt_row_net`, in that order.
- Coverage regression: `cd app && npm run coverage` exits `0`.

**Dependencies**

- New npm dependency `@fontsource/inter` (ASM-004).
- No dependency on other phases.

**Exit Criteria**

- [ ] `cd app && npm run lint` exits 0.
- [ ] `cd app && npx prettier --check src e2e scripts` prints `All matched files use Prettier code style!`.
- [ ] `cd app && npm test` exits 0 with strictly more than 73 passing tests.
- [ ] `cd app && npm run coverage` exits 0 and its file table lists `chart.js` and `main.js`.
- [ ] `cd app && npm run build` exits 0 and `app/dist/sw-manifest.json` contains at least one
      `.woff2` path.
- [ ] `grep -r "fonts.googleapis.com" app/index.html app/src app/public` returns no matches.
- [ ] `cd app && npm run e2e -- --workers=1` exits 0.
- [ ] `git status --porcelain` lists no modified tracked files (untracked pixel baselines may
      remain, per ASM-007).

**Phase Risks**

- **RISK-01-01:** Enabling `coverage.all` pulls previously-uncounted files into the denominator and
  the measured percentages drop sharply, tempting a threshold reduction that looks like a
  regression. Mitigation: S2 step 3 sets thresholds from the new measurement explicitly, and the
  commit message must state that the numbers changed because the denominator changed, not because
  coverage fell.
- **RISK-01-02:** `@fontsource/inter` adds files to the precache, enlarging the service worker's
  install payload. Mitigation: import subset-scoped entry points only (ASM-004), never the
  all-subset `index.css`, and confirm the built font total stays under 150 kB with
  `du -ch app/dist/assets/*.woff2`.
- **RISK-01-03:** Committing someone else's in-flight work with an inaccurate message misattributes
  it. Mitigation: TASK-01-10's report states plainly that the change was found uncommitted and
  stabilised here.

### PHASE-02 - Propagate the work and make propagation itself a guarded property

**Goal**
Ship the backlog to GitHub and to production, and add the guard class the repository lacks: one
that measures whether work reached anyone, not whether a number is right.

**Tasks**

- [ ] TASK-02-01: Create `tools/check_delivery_pipeline.py` implementing `## Specification` S1.
      Reuse `fetch_html` and `extract_build_commit` by importing them from
      `tools/check_deploy_freshness.py` rather than duplicating the HTTP and regex logic.
- [ ] TASK-02-02: Create `tools/tests/test_check_delivery_pipeline.py` following the existing
      conventions in `tools/tests/test_check_deploy_freshness.py`: prepend the `tools` directory to
      `sys.path`, import the module under test, and mock every network call — no test may touch the
      network.
- [ ] TASK-02-03: Add `--strict` to `tools/check_deploy_freshness.py`. With the flag, the two
      lenient `UNKNOWN` paths that today `return 0` — a failed local build, and a missing
      `app/dist/index.html` — instead `return 1`. Network unreachability continues to `return 0` in
      both modes, because that one really is transient. Keep the lenient behaviour as the default so
      laptop runs do not fail on an unrelated build breakage.
- [ ] TASK-02-04: Extend `tools/tests/test_check_deploy_freshness.py` with strict-mode cases. Keep
      the existing `test_failed_local_build_is_unknown` assertion, which documents the lenient
      default, and add its strict-mode counterpart alongside it.
- [ ] TASK-02-05: Fix `tools/check_human_blocked_register.py` for Windows consoles by reconfiguring
      standard output to UTF-8 with replacement at the top of `main()`, and add
      `--acknowledged-through YYYY-MM-DD`: rows whose `needed_by` is on or before that date are
      printed with the classification `ACKNOWLEDGED` and do not set the failure flag. Rows after
      that date classify and gate exactly as they do today.
- [ ] TASK-02-06: Extend `tools/tests/test_check_human_blocked_register.py` with acknowledgement
      cases (see Test Specs).
- [ ] TASK-02-07: Rewrite `.github/workflows/freshness-checks.yml`: give the `deploy-freshness` job
      `actions/setup-node@v4` (node 24, npm cache keyed on `app/package-lock.json`) plus an
      `npm install` step in `app/`, mirroring the `deck-parity` job in
      `.github/workflows/ci.yml`, and change its run step to
      `python tools/check_deploy_freshness.py --strict`. Add a third job, `delivery-pipeline`,
      that checks out with `fetch-depth: 0` (the distance counts need full history) and runs
      `python tools/check_delivery_pipeline.py`.
- [ ] TASK-02-08: Add a `deploy` script to `app/package.json` implementing DEC-003, and align
      `predeploy` with what the CI `quality` job actually runs by adding the Prettier check and the
      coverage run. Then correct the sentence in `CLAUDE.md` section 2 that calls `predeploy` "the
      local CI equivalent" so it is either true or no longer claimed.
- [ ] TASK-02-09: Push: `git push origin master`. Then wait for the `app-quality` workflow to
      complete and confirm all three jobs pass. This will be the first CI run in 20 days and the
      first ever execution of the Prettier gate.
- [ ] TASK-02-10: Deploy, subject to ASM-003: `cd app && npm run deploy`. Then confirm freshness:
      `python tools/check_deploy_freshness.py --skip-build` prints `DEPLOY-FRESHNESS PASS`, and
      `curl -sI https://dppa-case.web.app/sw.js | head -1` returns `HTTP/2 200` with a
      `content-type` of `application/javascript` rather than `text/html`.
- [ ] TASK-02-11: Perform the venue-offline drill by hand, because it is the risk this deploy
      unblocks: load `https://dppa-case.web.app` once in a browser, disable the network, reload,
      and confirm the app still renders with charts. Record the result in
      `app/deployment.md` under a new `## Offline drill` heading.

**File Changes**

- `tools/check_delivery_pipeline.py` (create): the S1 implementation, with a module docstring in
  the same style as the neighbouring guards, naming what runs it and how to run it on Windows.
- `tools/tests/test_check_delivery_pipeline.py` (create): unit tests, no network.
- `tools/check_deploy_freshness.py` (modify): add the `--strict` argparse flag and route the two
  `UNKNOWN` build/dist paths through it. Do not change the dirty-marker failure, the asset-equality
  comparison, or `write_deploy_log`.
- `tools/tests/test_check_deploy_freshness.py` (modify): add strict-mode cases; keep all existing
  cases.
- `tools/check_human_blocked_register.py` (modify): UTF-8 stdout reconfiguration and the
  `--acknowledged-through` flag with the `ACKNOWLEDGED` classification. Do not change
  `parse_register_table` or the 7-day `DUE_SOON_WINDOW_DAYS` constant.
- `tools/tests/test_check_human_blocked_register.py` (modify): add acknowledgement cases.
- `.github/workflows/freshness-checks.yml` (modify): node setup and `npm install` for
  `deploy-freshness`, `--strict`, and the new `delivery-pipeline` job. Leave the cron schedule
  (`0 9 * * 1`) and the `workflow_dispatch` trigger unchanged.
- `app/package.json` (modify): add the `deploy` script; extend `predeploy`. Leave every other
  script unchanged.
- `CLAUDE.md` (modify): correct the `predeploy` claim in section 2 and add `npm run deploy` to the
  command list.
- `app/deployment.md` (modify): add the `## Offline drill` section with the dated result.

**Function Signatures**

- `dirty_tracked_count(porcelain: str) -> int` — number of tracked files with staged or unstaged
  modifications, parsed from `git status --porcelain=v1` output.
- `untracked_count(porcelain: str) -> int` — number of `??` entries in the same output.
- `unpushed_count(upstream: str) -> int` — `git rev-list --count <upstream>..HEAD`, as an int.
- `undeployed_count(marker_commit: str) -> int | None` — `git rev-list --count
  <marker_commit>..HEAD`, or `None` when the commit is unknown to the local object database.
- `resolve_upstream() -> str` — the configured upstream ref for the current branch, falling back to
  `origin/<current-branch>`.
- `main(argv: list[str] | None = None) -> int` — process exit code per S1's ordered rules.
- `classify(needed_by: date, today: date, acknowledged_through: date | None = None) -> str` —
  extended existing function returning `"ACKNOWLEDGED"`, `"OVERDUE"`, `"DUE-SOON"` or `"OK"`.

**Test Specs**

- `dirty_tracked_count(" M app/src/main.js\n?? app/e2e/visual.spec.js-snapshots/\n")` → `1`.
- `untracked_count(" M app/src/main.js\n?? app/e2e/visual.spec.js-snapshots/\n")` → `1`.
- `dirty_tracked_count("")` → `0`.
- `dirty_tracked_count("A  new.py\nMM edited.py\n D deleted.py\n")` → `3` (staged adds, mixed
  staged-and-unstaged edits and unstaged deletions all count).
- `main([])` with `dirty_tracked = 0`, `unpushed = 0`, `undeployed = 0` and a reachable live URL →
  prints a line starting `DELIVERY-PIPELINE CLEAN` and returns `0`.
- `main([])` with `dirty_tracked = 0`, `unpushed = 3`, `undeployed = 14` → prints a line starting
  `DELIVERY-PIPELINE STALLED`, mentions both `3` and `14`, and returns `1`.
- `main([])` with all counts zero but `fetch_html` raising `urllib.error.URLError` → prints a line
  starting `DELIVERY-PIPELINE UNKNOWN` and returns `0`.
- `main([])` with `dirty_tracked = 0`, `unpushed = 0` and a live marker naming a commit absent from
  the object database → prints `DELIVERY-PIPELINE UNKNOWN` and returns `0`.
- `main(["--max-age-days", "7"])` with `unpushed = 1` whose commit is 2 days old → returns `0`.
- `main(["--max-age-days", "7"])` with `unpushed = 1` whose commit is 12 days old → returns `1`.
- `check_deploy_freshness.main(["--strict"])` with `run_local_build` mocked to return `False` →
  returns `1`.
- `check_deploy_freshness.main([])` with `run_local_build` mocked to return `False` → returns `0`
  (unchanged lenient default).
- `check_deploy_freshness.main(["--strict"])` with `fetch_html` raising `urllib.error.URLError` →
  returns `0` (network unreachability is transient in both modes).
- `classify(date(2026, 8, 15), date(2026, 8, 22), acknowledged_through=date(2026, 8, 31))` →
  `"ACKNOWLEDGED"`.
- `classify(date(2026, 9, 8), date(2026, 8, 22), acknowledged_through=date(2026, 8, 31))` → `"OK"`.
- `classify(date(2026, 8, 25), date(2026, 8, 22), acknowledged_through=None)` → `"DUE-SOON"`.
- `check_human_blocked_register.main(["--today", "2026-08-22", "--acknowledged-through",
  "2026-08-31"])` against the live checklist → returns `0` (H1 and H6 acknowledged, H2 at
  2026-08-25 also acknowledged, H3–H5 all `OK`).
- `check_human_blocked_register.main(["--today", "2026-08-22"])` against the live checklist →
  returns `1` (unchanged current behaviour).

**Dependencies**

- PHASE-01 must be committed first: pushing a tree whose coverage gate fails turns the first CI run
  in 20 days red.
- TASK-02-10 depends on ASM-003 (Firebase credentials).

**Exit Criteria**

- [ ] `python -m unittest discover -s tools/tests -v` exits 0 with strictly more tests than before.
- [ ] `python tools/check_delivery_pipeline.py` runs and prints all three counts.
- [ ] `python tools/check_human_blocked_register.py --today 2026-08-22 --acknowledged-through 2026-08-31`
      exits 0 and prints no traceback on a Windows console.
- [ ] `git rev-list --count origin/master..master` returns `0`.
- [ ] The `app-quality` workflow run for the pushed head is green on all three jobs.
- [ ] `python tools/check_deploy_freshness.py --skip-build` prints `DEPLOY-FRESHNESS PASS`
      (or, if ASM-003 blocks the deploy, this criterion is explicitly recorded as pending
      credentials and TASK-02-09's push criterion still holds).
- [ ] `curl -s https://dppa-case.web.app/sw.js | head -3` shows JavaScript, not `<!doctype html>`.

**Phase Risks**

- **RISK-02-01:** The first CI run in 20 days may fail on something unrelated to this plan — the
  Prettier gate has never executed remotely. Mitigation: TASK-01-08 runs the exact same commands
  locally first, so a remote failure indicates an environment difference, not unformatted code.
- **RISK-02-02:** A shallow CI checkout makes `git rev-list --count` wrong. Mitigation: the
  `delivery-pipeline` job pins `fetch-depth: 0`, and the counting helpers must return `None` rather
  than a wrong integer when `git rev-list` exits non-zero.
- **RISK-02-03:** Deploying from a dirty working tree stamps the build marker `-dirty`, which
  `check_deploy_freshness.py` treats as a hard failure. Mitigation: TASK-02-10 runs only after
  PHASE-01's commits, and `npm run deploy` chains `predeploy` first.

### PHASE-03 - Freeze and de-risk the translation surface

**Goal**
Hand a translator a surface that is fixed in size, free of embedded figures, and rendered with
correct locale typography — before the engagement begins, not after.

**Tasks**

- [ ] TASK-03-01: Generate `app/src/data/strings.baseline.json` containing the sorted array of
      English key names currently in `STRINGS.en` (151 keys), plus a `frozenOn` date field set to
      the date the file is created.
- [ ] TASK-03-02: Add a `--check` mode to `app/scripts/i18n-report.mjs`. Without the flag it keeps
      today's behaviour exactly: print per-language `UNTRANSLATED` counts and key lists, exit 0.
      With the flag it compares the current `STRINGS.en` key set against the baseline and exits 1
      if any key was added or removed, naming each difference. Also assert key-set parity across
      `en`, `vi` and `zh` and exit 1 on any mismatch.
- [ ] TASK-03-03: Wire `node scripts/i18n-report.mjs --check` into the `quality` job in
      `.github/workflows/ci.yml`, immediately after the Prettier step, and add an
      `i18n:check` script to `app/package.json`.
- [ ] TASK-03-04: Make `app/src/modules/formatters.js` locale-aware per `## Specification` S4.
      Export a `LOCALE_BY_LANG` constant and resolve the active language through the existing i18n
      module. Keep the existing exported function names and parameter shapes so no call site
      changes.
- [ ] TASK-03-05: Extend `app/src/modules/formatters.test.js` with locale cases (see Test Specs).
- [ ] TASK-03-06: Fix the Vietnamese worksheet typography defect. In
      `lessons/0009-scenario-3-excess-vi.html`, rewrite the two affected passages (around lines 46
      and 90) so numbers are grouped with `.` and decimals use `,` in Vietnamese convention:
      `5.000.000 × 1.100 × 1,026 × 1,008`. Check the whole file for the same pattern rather than
      only those two lines, and leave `lessons/0009-scenario-3-excess.html` (English) and
      `lessons/0009-scenario-3-excess-zh-cn.html` unchanged unless the same defect appears there.
- [ ] TASK-03-07: Remove embedded figures from the translation layer. In
      `assets/teaching/terminology-map.json`, replace every digit run of three or more characters
      inside a translatable string with a named `{placeholder}` token, and record the placeholder's
      source path within `assets/teaching/spine-s1.json` (or `spine-s2.json` / `spine-s3.json`) in
      a sibling `slots` object on the same entry. Update `build_oct_teaching_deck.py` to substitute
      each slot from the named spine field at build time.
- [ ] TASK-03-08: Create `tools/check_terminology_numbers.py`, which fails if any translatable
      string in `assets/teaching/terminology-map.json` contains a digit run of three or more
      characters, and add it to the `deck-parity` job in `.github/workflows/ci.yml`.
- [ ] TASK-03-09: Create `tools/tests/test_check_terminology_numbers.py` with a passing fixture and
      a planted-violation fixture.
- [ ] TASK-03-10: Write `facilitator/translation-brief.md`: exactly which two files the translator
      touches (`assets/teaching/terminology-map.json` and the `vi` / `zh` blocks of
      `app/src/data/strings.js`), the total unit count, the rule that `{placeholder}` tokens must be
      copied verbatim and never translated or reformatted, the rule that no figure may be typed,
      the frozen key set, and the acceptance check
      (`cd app && node scripts/i18n-report.mjs` reports zero untranslated).

**File Changes**

- `app/src/data/strings.baseline.json` (create): `{ "frozenOn": "YYYY-MM-DD", "keys": [ … ] }`.
- `app/scripts/i18n-report.mjs` (modify): add `--check`; keep the existing default output path and
  the exported `untranslatedKeys` helper byte-for-byte compatible.
- `app/package.json` (modify): add `"i18n:check": "node scripts/i18n-report.mjs --check"`.
- `.github/workflows/ci.yml` (modify): add the `i18n:check` step to `quality` and the terminology
  checker to `deck-parity`. Leave the `visual-bootstrap` job and the commented-out `deploy` job
  untouched.
- `app/src/modules/formatters.js` (modify): add `LOCALE_BY_LANG`, resolve the locale, replace both
  `'en-US'` literals. Do not change `EXCHANGE_RATE` in this phase (PHASE-04 owns it).
- `app/src/modules/formatters.test.js` (modify): add locale cases.
- `lessons/0009-scenario-3-excess-vi.html` (modify): Vietnamese numeric typography only. Do not
  touch layout, SVG geometry, or any other language's file.
- `assets/teaching/terminology-map.json` (modify): placeholder frames plus per-entry `slots`.
- `build_oct_teaching_deck.py` (modify): substitute slots from the spine when a consumed entry
  carries a `slots` object. Leave the `UNTRANSLATED` build gate behaviour intact.
- `tools/check_terminology_numbers.py` (create).
- `tools/tests/test_check_terminology_numbers.py` (create).
- `facilitator/translation-brief.md` (create).

**Function Signatures**

- `untranslatedKeys(lang: string) -> string[]` — unchanged existing export; sorted key names whose
  value is the literal `'UNTRANSLATED'`.
- `keySetDiff(current: string[], baseline: string[]) -> { added: string[], removed: string[] }` —
  new export in `app/scripts/i18n-report.mjs`; the two sorted difference lists.
- `LOCALE_BY_LANG: Record<'en' | 'vi' | 'zh', string>` — the S4 mapping.
- `resolveLocale(lang?: string) -> string` — BCP-47 tag for the active or supplied language,
  defaulting to `'en-US'` for an unknown language.
- `formatMoney(value: number, opts?: { currency?: 'VND' | 'USD', precise?: boolean, signed?: boolean, perKwh?: boolean }) -> string`
  — unchanged signature; now formats with the resolved locale.
- `formatNumber(value: number) -> string` — unchanged signature; now formats with the resolved
  locale.
- `check_terminology_numbers.find_violations(data: dict) -> list[tuple[str, str]]` — `(json path,
  offending string)` pairs for every translatable string containing a run of three or more digits.

**Test Specs**

- `keySetDiff(['a','b'], ['a','b'])` → `{ added: [], removed: [] }`.
- `keySetDiff(['a','b','c'], ['a','b'])` → `{ added: ['c'], removed: [] }`.
- `keySetDiff(['a'], ['a','b'])` → `{ added: [], removed: ['b'] }`.
- `node scripts/i18n-report.mjs --check` against an unmodified `strings.js` → exits `0`.
- `node scripts/i18n-report.mjs --check` after adding one key to `STRINGS.en` only → exits `1` and
  prints the added key name.
- `resolveLocale('vi')` → `'vi-VN'`; `resolveLocale('zh')` → `'zh-CN'`; `resolveLocale('en')` →
  `'en-US'`; `resolveLocale('xx')` → `'en-US'`.
- `formatNumber(1234567)` with language `en` → `'1,234,567'`.
- `formatNumber(1234567)` with language `vi` → `'1.234.567'`.
- `formatMoney(2204, { currency: 'VND', perKwh: true })` with language `en` → `'2,204 VND/kWh'`.
- `formatMoney(2204, { currency: 'VND', perKwh: true })` with language `vi` → `'2.204 VND/kWh'`.
- `formatMoney(2000, { currency: 'USD', precise: true, perKwh: true })` with language `en` →
  `'0.0755 USD/kWh'` (unchanged from today, guarding against a regression).
- `EXCHANGE_RATE` still equals `26500` (the existing assertion must keep passing in this phase).
- `find_violations({"entries": [{"en": "C_EVN is 11,020 million"}]})` → one violation naming
  `11,020`.
- `find_violations({"entries": [{"en": "C_EVN is {cEvnMillions} million"}]})` → `[]`.
- `find_violations({"entries": [{"en": "Decree 57"}]})` → `[]` (two digits is below the
  three-digit-run threshold, so ordinary legal references do not trip the guard).
- `python tools/check_terminology_numbers.py` against the migrated map → exits `0`.

**Dependencies**

- PHASE-01 (a committed, green baseline to build on).
- CON-003: no translations are produced here.

**Exit Criteria**

- [ ] `cd app && node scripts/i18n-report.mjs --check` exits 0.
- [ ] `cd app && npm test` exits 0.
- [ ] `python tools/check_terminology_numbers.py` exits 0.
- [ ] `grep -nE "[0-9]{3}" assets/teaching/terminology-map.json` returns matches only inside
      `slots` source paths and the `meta` block, never inside a translatable string.
- [ ] `python -m unittest discover -s tools/tests -v` exits 0.
- [ ] `facilitator/translation-brief.md` exists and names both files, the frozen key count, and the
      placeholder rule.
- [ ] `python audit_teaching_deck.py` and `python verify_deck_numbers.py` both still exit 0 (the
      English deck build path must be unaffected by the placeholder migration).

**Phase Risks**

- **RISK-03-01:** The placeholder migration can silently change what the English deck prints.
  Mitigation: rebuild nothing in this phase; the deck binary stays as committed, and the exit
  criteria re-run both deck verifiers against it. PHASE-05's `compare_deck.py` is what will later
  prove a rebuild is text-identical.
- **RISK-03-02:** Making `formatNumber` locale-aware changes strings that existing unit tests and
  Playwright specs assert on. Mitigation: the default language is `en`, whose output is byte-identical
  to today's; run the full unit and e2e suites before committing.
- **RISK-03-03:** Freezing the key set blocks PHASE-06, which needs new UI strings. Mitigation:
  PHASE-06 explicitly regenerates `strings.baseline.json` in the same commit that adds its keys,
  and the translator brief states that any key added after the freeze is the plan owner's
  responsibility to re-brief.

### PHASE-04 - Convert the remaining un-failable checks into real gates

**Goal**
Every automated check either fails for the reason it exists or is deleted. No green result should
be uninformative.

**Tasks**

- [ ] TASK-04-01: Extend `verify_deck_numbers.py` to reconcile speaker notes per `## Specification`
      S3, and give it a `--deck PATH` argument (defaulting to the current hard-coded English path)
      so it can be pointed at a translated build.
- [ ] TASK-04-02: Add locale-aware number matching to `verify_deck_numbers.py`: alongside the
      existing comma-grouped pattern, match dot-grouped tokens (`11.020`) and normalise both forms
      to a bare integer string before comparing against the allow-set. Add a `--lang {en,vi,zh}`
      argument that selects which grouping character is expected, defaulting to `en`.
- [ ] TASK-04-03: Delete the no-op number-reconciliation loop in `audit_teaching_deck.py` (the
      `for t in texts:` block whose body is `pass`), the now-unused `known_millions` computation,
      and the sentence in the module docstring that claims it reconciles numeric strings. Leave the
      word-budget and symbol-deferral checks completely alone — they are genuine and valuable.
- [ ] TASK-04-04: Bring the app's root configuration files under the Prettier gate. Run
      `cd app && npx prettier --write playwright.config.js vite.config.js eslint.config.js`, then
      widen both `app/package.json`'s `format` script and the CI check to
      `src e2e scripts *.config.js`. Re-read `playwright.config.js` afterwards and confirm every
      explanatory comment survived the reformat.
- [ ] TASK-04-05: Widen the integrity guards' scan surface. In `tools/retired_figures.json`, add
      `app/src/**/*.js`, `app/docs/**/*.md` and `assets/teaching/*.json` to the scanned sets, and
      make the corresponding change in `tools/verify_prose_figures.py`'s file list. Run both guards
      and resolve any violation the widened scan exposes.
- [ ] TASK-04-06: Fix the exchange-rate contradiction. Correct `app/docs/assumptions.md` line 33
      from `25,000` to `26,500`, add a dated provenance comment above
      `export const EXCHANGE_RATE = 26500` in `app/src/modules/formatters.js` in the same style as
      the constants in `app/src/data/default-scenarios.js`, and export
      `EXCHANGE_RATE_AS_OF = '2026-08-22'` (or the true rate date if one is known) beside it. Add a
      line to `app/docs/assumptions.md` recording the rate's date.
- [ ] TASK-04-07: Create `tools/check_plan_status.py`: for every file in `plans/` whose YAML
      `status` field begins with `complete`, fail if the file contains one or more unticked
      `- [ ]` task lines **and** no file in `reports/` mentions the plan's filename. Print one line
      per offending plan.
- [ ] TASK-04-08: Create `tools/tests/test_check_plan_status.py` with a compliant fixture, an
      unticked-tasks-without-report fixture, and an unticked-tasks-with-report fixture.
- [ ] TASK-04-09: Add `python tools/check_plan_status.py` to the `deck-parity` job in
      `.github/workflows/ci.yml`.
- [ ] TASK-04-10: Correct the status metadata the new checker exposes. Change
      `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`'s status to
      `open — never executed; retained as the specification for the gate-credibility and deck-build
      work`, and re-audit each of the nine plans bulk-corrected on 2026-07-31 by sampling three
      tasks per plan against the current code; downgrade any plan whose sampled tasks are not
      actually done.
- [ ] TASK-04-11: Split `plans/2026-october-readiness-checklist.md` into two artifacts: keep the
      coding-session items in `plans/` as an open plan, and move the human-only, date-bound items
      into a new `facilitator/october-run-plan.md`. Update
      `tools/check_human_blocked_register.py`'s `DEFAULT_CHECKLIST` constant and its tests to the
      register's new home, and update every path reference in
      `.github/workflows/freshness-checks.yml` and `CLAUDE.md`.

**File Changes**

- `verify_deck_numbers.py` (modify): notes extraction, `--deck`, `--lang`, dual grouping patterns
  and token normalisation. Keep `EXTRA_ALLOWED` and its explanatory comment; do not add entries to
  it in this phase.
- `audit_teaching_deck.py` (modify): delete the dead loop, the unused set, and the overstated
  docstring sentence.
- `app/playwright.config.js`, `app/vite.config.js`, `app/eslint.config.js` (modify): Prettier
  formatting only, no semantic change.
- `app/package.json` (modify): widen the `format` script's path list.
- `.github/workflows/ci.yml` (modify): widen the Prettier check's path list; add
  `check_plan_status.py` to `deck-parity`.
- `tools/retired_figures.json` (modify): widen `scan` and `scanScripts`.
- `tools/verify_prose_figures.py` (modify): widen the scanned-file list to match.
- `app/docs/assumptions.md` (modify): correct the exchange rate and add its date.
- `app/src/modules/formatters.js` (modify): provenance comment plus `EXCHANGE_RATE_AS_OF` export.
- `tools/check_plan_status.py` (create).
- `tools/tests/test_check_plan_status.py` (create).
- `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md` (modify): status only; do not edit
  its tasks.
- `plans/2026-october-readiness-checklist.md` (modify) and `facilitator/october-run-plan.md`
  (create): the split.
- `tools/check_human_blocked_register.py` (modify) and its test (modify): new default path.
- `CLAUDE.md` (modify): update the section 8 description of the freshness workflow and any path
  that moved.

**Function Signatures**

- `extract_slide_numbers(pptx_path: str, lang: str = "en") -> list[tuple[int, str, str]]` —
  `(slide_index, origin, token)` triples where `origin` is `"body"` or `"notes"`.
- `normalize_token(token: str, lang: str = "en") -> str` — the token with its grouping separators
  removed, so `"11,020"` and `"11.020"` both become `"11020"`.
- `check_plan_status.find_violations(plans_dir: Path, reports_dir: Path) -> list[tuple[str, int]]` —
  `(plan filename, unticked task count)` for every plan marked complete with unticked tasks and no
  referencing report.
- `EXCHANGE_RATE_AS_OF: string` — ISO date on which the VND-per-USD rate was recorded.

**Test Specs**

- `normalize_token("11,020", "en")` → `"11020"`; `normalize_token("11.020", "vi")` → `"11020"`;
  `normalize_token("5,000,000", "en")` → `"5000000"`.
- `python verify_deck_numbers.py` against the committed English deck → exits `0` and its output
  names strictly more tokens than the 5 it reports today, including at least `8,563`, `1,800` and
  `817` from notes.
- `python verify_deck_numbers.py --deck /nonexistent.pptx` → exits non-zero with a clear
  file-not-found message rather than a traceback.
- `python audit_teaching_deck.py` → still prints `PASS: word budget and symbol-deferral checks
  clean.` and exits `0`.
- `find_violations` on a fixture plan with `status: "complete"` and three `- [ ]` lines, with no
  report referencing it → one violation reporting `3`.
- `find_violations` on the same fixture with a `reports/` file containing the plan's filename →
  `[]`.
- `find_violations` on a fixture plan with `status: "open"` and three `- [ ]` lines → `[]`.
- `cd app && npx prettier --check src e2e scripts *.config.js` → prints `All matched files use
  Prettier code style!`.
- `python tools/check_retired_figures.py` → `RETIRED-FIGURES PASS` with a scanned-file count
  strictly greater than 42.
- `grep -n "25,000" app/docs/assumptions.md` → no matches.

**Dependencies**

- PHASE-02 (the CI workflows must already be correct before new jobs are added to them).

**Exit Criteria**

- [ ] `python verify_deck_numbers.py` exits 0 and reports notes-origin tokens.
- [ ] `python audit_teaching_deck.py` exits 0 and `grep -c "pass  #" audit_teaching_deck.py`
      returns `0`.
- [ ] `python tools/check_plan_status.py` exits 0.
- [ ] `python tools/check_retired_figures.py` and `python tools/verify_prose_figures.py` both exit 0
      with widened scan counts.
- [ ] `cd app && npx prettier --check src e2e scripts *.config.js` passes.
- [ ] `python -m unittest discover -s tools/tests -v` exits 0.
- [ ] `python tools/check_human_blocked_register.py --today 2026-08-22 --acknowledged-through 2026-08-31`
      exits 0 against the register's new location.

**Phase Risks**

- **RISK-04-01:** Widening the guards' scan surface may expose real violations in files never
  scanned before, expanding the phase unpredictably. Mitigation: run both guards immediately after
  the config change and before anything else in the phase, so the true size is known early; fix
  each violation at its source rather than by adding exclusions.
- **RISK-04-02:** Extending the deck verifier to notes may fail on a legitimately unreconcilable
  figure. Mitigation: investigate any failure as a genuine engine-versus-slide disagreement first;
  only add to `EXTRA_ALLOWED` with a comment naming the exact derivation, per that set's existing
  documented rule.
- **RISK-04-03:** Splitting the readiness checklist can orphan the register parser. Mitigation:
  TASK-04-11 updates the constant, its tests, the workflow and `CLAUDE.md` in the same commit, and
  the phase exit criteria re-run the parser against the new path.

### PHASE-05 - Make the Python deck pipeline installable and CI-verified

**Goal**
Two of the six live Python builders currently run in neither the local nor the CI environment, and
the deck builder is never executed by CI at all. Fix both.

**Tasks**

- [ ] TASK-05-01: Create `requirements.txt` at the repository root pinning every Python dependency
      the six live builders and the guards import: `python-pptx`, `python-docx`, `matplotlib`,
      `numpy`, `Pillow`. Determine each import by reading the six root-level `*.py` files and the
      four `tools/*.py` guards rather than by guessing; pin to the exact versions that install
      cleanly on Python 3.12.
- [ ] TASK-05-02: Change `pip install python-pptx` to `pip install -r requirements.txt` in the
      `deck-parity` job of `.github/workflows/ci.yml`.
- [ ] TASK-05-03: Create `tools/compare_deck.py`: extract all slide-body and speaker-notes text
      from two `.pptx` files and report the first structural difference, exiting 1 when the text
      differs and 0 when it matches. Binary `.pptx` files cannot be diffed directly; text-level
      comparison is the workable form.
- [ ] TASK-05-04: Create `tools/tests/test_compare_deck.py` including a planted-change test: build
      two in-memory presentations that differ by exactly one run of text and assert the comparison
      reports that difference.
- [ ] TASK-05-05: Add a `deck-build` job to `.github/workflows/ci.yml` that installs
      `requirements.txt`, runs `python build_oct_teaching_deck.py --lang en --out <tempdir>`, and
      then runs `python tools/compare_deck.py <tempdir>/<deck> "ceba/DPPA Presentation Oct 2026 To
      Teach.pptx"`. If `build_oct_teaching_deck.py` has no `--out` flag, add one that defaults to
      the current committed path so existing invocations are unaffected.
- [ ] TASK-05-06: Create `tools/pipeline.py` implementing the documented regeneration order as one
      command: `node scripts/export-spine.mjs` and `node scripts/export-sweep.mjs` from `app/`,
      then `build_teaching_visuals.py --lang L`, then `build_oct_teaching_deck.py --lang L`, then
      `audit_teaching_deck.py` and `verify_deck_numbers.py`. It must fail loudly and immediately on
      the first missing dependency or non-zero exit, naming the failed step and the exact command to
      re-run.
- [ ] TASK-05-07: Update `CLAUDE.md` section 5 so the documented regeneration order names
      `python tools/pipeline.py --lang en` as the single supported entry point, keeping the
      step-by-step chain beneath it as an explanation of what the command does.
- [ ] TASK-05-08: Verify locally that the previously unrunnable builders now run:
      `pip install -r requirements.txt` then `python build_teaching_visuals.py --lang en`. Confirm
      `git status --porcelain assets/teaching/` afterwards, and investigate rather than commit any
      figure that changed — an unexpected change means the committed figures were rendered from
      different inputs.

**File Changes**

- `requirements.txt` (create): pinned Python dependencies, with a header comment naming which
  scripts need which package.
- `.github/workflows/ci.yml` (modify): `pip install -r requirements.txt` in `deck-parity`, plus the
  new `deck-build` job. Leave `quality`, `visual-bootstrap` and the commented `deploy` job alone.
- `tools/compare_deck.py` (create).
- `tools/tests/test_compare_deck.py` (create).
- `tools/pipeline.py` (create).
- `build_oct_teaching_deck.py` (modify, conditional): add an `--out` argument defaulting to the
  existing committed output path. Change nothing about slide content or layout.
- `CLAUDE.md` (modify): section 5 regeneration order.

**Function Signatures**

- `compare_deck.extract_text(pptx_path: str) -> list[tuple[int, str, str]]` — `(slide_index,
  origin, text)` triples for every body shape and notes frame, in document order.
- `compare_deck.first_difference(a: list, b: list) -> tuple[int, str, str, str] | None` —
  `(slide_index, origin, text_a, text_b)` for the first differing entry, or `None` when identical.
- `pipeline.run_step(name: str, command: list[str], cwd: str | None = None) -> None` — runs one
  step, streaming output; raises `SystemExit(1)` with the step name and re-run command on failure.
- `pipeline.main(argv: list[str] | None = None) -> int` — runs the ordered chain for `--lang`;
  returns 0 only when every step succeeded.

**Test Specs**

- `extract_text` on a two-slide fixture with one notes frame → three triples, with origins
  `["body", "body", "notes"]`.
- `first_difference(x, x)` → `None`.
- `first_difference` on two fixtures differing only in slide 1's body text → a tuple whose first
  element is `1` and whose second is `"body"`.
- `python tools/compare_deck.py A.pptx A.pptx` → exits `0` and prints a line containing
  `IDENTICAL`.
- `python tools/compare_deck.py A.pptx B.pptx` where B has one changed run → exits `1` and names
  the slide index.
- `python tools/pipeline.py --lang en` on a machine without `matplotlib` installed → exits `1` with
  a message naming `build_teaching_visuals.py` and the missing module, not a bare traceback.
- `pip install -r requirements.txt && python -c "import matplotlib, numpy, pptx, docx, PIL"` →
  exits `0`.

**Dependencies**

- PHASE-04 (`verify_deck_numbers.py` and `audit_teaching_deck.py` must already be correct, because
  `tools/pipeline.py` invokes them as its final steps).
- CON-002 is resolved by this phase; PHASE-06 depends on that resolution.

**Exit Criteria**

- [ ] `pip install -r requirements.txt` succeeds on Python 3.12.
- [ ] `python build_teaching_visuals.py --lang en` completes with exit 0.
- [ ] `git status --porcelain assets/teaching/` is empty after that run, or every change is
      investigated and explained in the commit message.
- [ ] `python tools/compare_deck.py "ceba/DPPA Presentation Oct 2026 To Teach.pptx" "ceba/DPPA Presentation Oct 2026 To Teach.pptx"`
      exits 0.
- [ ] `python tools/pipeline.py --lang en` exits 0.
- [ ] `python -m unittest discover -s tools/tests -v` exits 0.
- [ ] The `deck-build` CI job passes on the pushed head.

**Phase Risks**

- **RISK-05-01:** Rebuilding the deck may produce a genuinely different binary, because the
  committed deck (2026-07-11) predates its builder (2026-07-25). Mitigation: the `deck-build` job
  builds to a temporary directory and compares text only; it never overwrites the committed
  binary. If text differs, that is a real finding to investigate and fix deliberately, in its own
  commit, before this phase's exit criteria are met.
- **RISK-05-02:** Pinning `matplotlib` may re-render figures with subtly different fonts or
  anti-aliasing, producing large binary churn in `assets/teaching/*.png`. Mitigation: TASK-05-08
  checks `git status` immediately after the first render and treats any change as a finding rather
  than a commit.

### PHASE-06 - Fix what the app teaches by default and make the gate story defensible

**Goal**
The landing state a participant reaches by scanning the QR code should demonstrate the mission's
central claim using the same numbers as the deck, and the headline gate figure should survive a
lender asking where the axis stops.

**Tasks**

- [ ] TASK-06-01: Change the app's landing scenario to the teaching canon. In
      `app/src/data/default-scenarios.js`, set `defaultInputs.scenarioId` to `'workshop1'`, and
      relabel the three workshop scenarios' `label` fields to `S1 Matched`, `S2 Shortfall` and
      `S3 Excess`. Leave the three curve scenarios (`higherLoad`, `balanced`, `higherGen`) and
      `scenarioOrder` unchanged.
- [ ] TASK-06-02: Set `strikeEscalation: 0.02` per ASM-005, with a provenance comment in the same
      style as the neighbouring constants that states explicitly that it is illustrative and
      unsourced.
- [ ] TASK-06-03: Confirm DEC-001 empirically: run `cd app && node scripts/export-spine.mjs &&
      node scripts/export-sweep.mjs`, then `git diff --exit-code assets/teaching/spine-s1.json
      assets/teaching/spine-s2.json assets/teaching/spine-s3.json assets/teaching/gate-sweep.json`.
      It must report no change. If it does report a change, stop: the escalation defaults do feed
      the exports after all, and the full regeneration chain plus the retirement rule apply.
- [ ] TASK-06-04: Build the escalation differential pill using the string key
      `multiyear_differential_template`, which already exists in `app/src/data/strings.js` and is
      referenced by nothing. Render it in the multi-year panel showing
      `evnEscalation − strikeEscalation` as a signed percentage with one decimal place.
- [ ] TASK-06-05: Build the "Locked strike" preset button using the existing unused string key
      `controls_locked_strike`. Clicking it sets `strikeEscalation` to `0`, re-syncs the input
      controls and re-renders, so the crossover year visibly moves.
- [ ] TASK-06-06: Serialize the scenario state into the URL. Encode `scenarioId`, `strikePrice`,
      `marketPrice`, `dppaCharge`, `lossFactor`, `settlementMode`, `evnEscalation`,
      `strikeEscalation`, `horizonYears`, `selectedHour` and `currency` as query parameters; read
      them at startup after `initI18n()`; update the URL with `history.replaceState` (never
      `pushState`, which would trap the presenter in the browser's back stack) whenever state
      changes. Then change the language selector in `app/src/main.js` so switching language no
      longer assigns to `window.location.search` and reloads the page — it must re-run `initI18n`
      and re-render in place, preserving the current state.
- [ ] TASK-06-07: Retarget the M4 teach-mode step in `app/src/data/teach-steps.js` to a
      configuration where the crossover question can actually fail. Today all six steps drive
      `workshop1` at strike 1,250 and FMP 1,150, where the DPPA line is below the BAU line from year
      one regardless of escalation, so the step demonstrates nothing.
- [ ] TASK-06-08: Extend the gate-sweep strike grid. In `app/scripts/export-sweep.mjs`, change
      `STRIKES` from `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450]` to
      `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]`, so both the lender threshold
      (1,380) and the investor threshold (1,450) are interior to the grid rather than at its edge.
      Update the module's header comment, which currently describes a 56-cell sweep.
- [ ] TASK-06-09: Regenerate and retire, all in one commit. Run
      `cd app && node scripts/export-sweep.mjs`, then `python tools/pipeline.py --lang en`. Add
      every superseded string form of the old headline to the `retired` list in
      `tools/retired_figures.json` — the file's own `notes` field already names the exact forms to
      add. Before adding them, `grep -rn` each form across the scanned prose and script sets and
      update every hit in the same commit: `NOTES.md`, `app/README.md`,
      `facilitator/dppa-workshop-facilitator-guide.md` (both the body and the checkpoint question),
      `facilitator/dppa-panel-guide.md`, `lessons/0005-module-5-canonical-cases.html`,
      `learning-records/0005-teaching-revamp-and-hardening-arc.md`, and the deck's M5 body and
      speaker notes. Then run `python tools/check_retired_figures.py` and require a pass.
- [ ] TASK-06-10: Publish the per-gate decomposition rather than only the combined count. Add the
      individual buyer, lender and investor pass counts to the M5 narrative in
      `facilitator/dppa-workshop-facilitator-guide.md`, and add a footnote to the M5 slide stating
      that the lender and investor gates are one-dimensional per-kWh proxies, not modelled debt
      schedules or equity IRRs — every one of those numbers is already present in
      `assets/teaching/gate-sweep.json`.
- [ ] TASK-06-11: Regenerate `app/src/data/strings.baseline.json` in the same commit as any new
      string key this phase introduces, and note the re-freeze date in
      `facilitator/translation-brief.md`.
- [ ] TASK-06-12: Redeploy and re-verify: `cd app && npm run deploy`, then
      `python tools/check_delivery_pipeline.py` must print `DELIVERY-PIPELINE CLEAN`.

**File Changes**

- `app/src/data/default-scenarios.js` (modify): `scenarioId`, the three workshop labels,
  `strikeEscalation` and its comment. Do not touch any price, fee, loss-factor or volume constant.
- `app/src/modules/ui.js` (modify): the differential pill and the locked-strike preset button.
- `app/src/main.js` (modify): URL state read/write; in-place language switching.
- `app/src/data/teach-steps.js` (modify): the M4 step's scenario and inputs.
- `app/src/data/strings.js` (modify, only if new keys are needed) and
  `app/src/data/strings.baseline.json` (modify): re-freeze.
- `app/scripts/export-sweep.mjs` (modify): the `STRIKES` array and the header comment.
- `assets/teaching/gate-sweep.json` (regenerate — never hand-edit).
- `assets/teaching/m5-gate-heatmap-{en,vi,zh}.png` (regenerate via the pipeline).
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (regenerate via the pipeline).
- `tools/retired_figures.json` (modify): add every superseded headline form.
- `NOTES.md`, `app/README.md`, `facilitator/dppa-workshop-facilitator-guide.md`,
  `facilitator/dppa-panel-guide.md`, `lessons/0005-module-5-canonical-cases.html`,
  `learning-records/0005-teaching-revamp-and-hardening-arc.md` (modify): the new headline figure.

**Function Signatures**

- `serializeState(state: object) -> string` — the query string (without a leading `?`) encoding the
  eleven listed state fields.
- `parseState(search: string, defaults: object) -> object` — a state object with every recognised
  parameter coerced to its correct type and every unrecognised or malformed parameter falling back
  to the corresponding default.
- `renderMultiYearPanel(multiYear: object, currency: 'VND' | 'USD') -> void` — existing export,
  extended to render the escalation-differential pill.

**Test Specs**

- `parseState('', defaultInputs)` → deep-equals `defaultInputs`.
- `parseState('strikeEsc=0', defaultInputs)` → `strikeEscalation === 0`, every other field equal to
  its default.
- `parseState('strikeEsc=abc', defaultInputs)` → `strikeEscalation` equals the default (malformed
  values never produce `NaN`).
- `parseState('scenarioId=nonexistent', defaultInputs)` → `scenarioId` equals the default (unknown
  scenario ids never select a missing profile).
- `serializeState(parseState('strikeEsc=0&hour=7', defaultInputs))` → a string containing both
  `strikeEsc=0` and `hour=7`.
- `projectMultiYear(inputs, { years: 20, evnEscalation: 0.04, strikeEscalation: 0.02 })` →
  `crossoverYear === 14`.
- `projectMultiYear(inputs, { years: 20, evnEscalation: 0.04, strikeEscalation: 0 })` →
  `crossoverYear === 9`.
- `projectMultiYear(inputs, { years: 20, evnEscalation: 0.04, strikeEscalation: 0.04 })` →
  `crossoverYear === null` (the pre-existing behaviour must remain reachable).
- The differential pill with `evnEscalation: 0.04` and `strikeEscalation: 0.02` → renders the text
  `+2.0`.
- After clicking the locked-strike preset, the rendered crossover text changes from the year-14
  value to the year-9 value.
- `node scripts/export-sweep.mjs` with the extended grid → `assets/teaching/gate-sweep.json` has
  `strikes.length === 10`, `cells.length === 70`, and a `passCount` strictly greater than 5.
- `python tools/check_retired_figures.py` after TASK-06-09 → `RETIRED-FIGURES PASS`.
- `python verify_deck_numbers.py` after the rebuild → exits 0.

**Dependencies**

- PHASE-05 (the regeneration chain needs `matplotlib` and `tools/pipeline.py`).
- PHASE-03 (the string-freeze gate must exist so TASK-06-11's re-freeze is meaningful).

**Exit Criteria**

- [ ] `cd app && npm test && npm run coverage && npm run build` all exit 0.
- [ ] `cd app && npm run e2e -- --workers=1` exits 0.
- [ ] Loading the app with no query string shows the `S1 Matched` scenario and a crossover year
      inside the 20-year horizon.
- [ ] `?strikeEsc=0` produces a visibly earlier crossover than the default landing state.
- [ ] Switching language mid-session preserves the selected hour and every slider value.
- [ ] `python tools/check_retired_figures.py`, `python verify_deck_numbers.py` and
      `python audit_teaching_deck.py` all exit 0.
- [ ] `git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json`
      reports no change (only `gate-sweep.json` should have moved).
- [ ] `python tools/check_delivery_pipeline.py` prints `DELIVERY-PIPELINE CLEAN`.

**Phase Risks**

- **RISK-06-01:** The retirement sweep is the highest-risk task in the plan: missing one occurrence
  of the old headline leaves a contradicted figure in a learner-facing artifact, and the guard will
  block the commit until every occurrence is found. Mitigation: grep for each string form *before*
  adding it to the retired list, fix every hit, and only then add the entries and run the checker.
- **RISK-06-02:** Changing the landing scenario invalidates the untracked local pixel baselines and
  will invalidate any Linux baselines committed later. Mitigation: this is expected; the visual
  suite is non-blocking today, and the Linux bootstrap should be run after this phase, not before.
- **RISK-06-03:** URL-state parsing can produce `NaN` inputs that propagate into the settlement
  engine and render `NaN` on screen in front of an audience. Mitigation: the Test Specs pin the
  malformed-value behaviour explicitly, and the existing Playwright specs already assert that
  `#fiveLineBill` never contains `NaN` or `Infinity`.

## Gotchas

- **Never hand-edit `assets/teaching/spine-s*.json` or `gate-sweep.json`.** They are generated from
  the settlement engine and CI regenerates them and runs `git diff --exit-code`. The one
  hand-maintained file in that directory is `terminology-map.json`.
- **`npm ci` fails in this repository.** Use `npm install`. This is deliberate; both workflows carry
  the reason at the same step.
- **Extensionless relative imports break the exporters.** `node app/scripts/export-*.mjs` runs under
  plain Node ESM, which requires the `.js` extension that Vite would let you omit.
- **On Windows, prefix Python commands with `PYTHONPATH= ` and use `py`, not `python`.** All Python
  commands in this plan are written in the Linux form.
- **Windows consoles are cp1252.** Any Python guard that prints `→`, `—` or Vietnamese diacritics
  will raise `UnicodeEncodeError` unless stdout is reconfigured to UTF-8; the same applies to
  `json.load` without an explicit `encoding="utf-8"`.
- **Local Playwright runs need `--workers=1`.** Parallel WebKit on Windows intermittently fails with
  `Object with guid ... was not bound in the connection`. That is a driver transport flake; do not
  "fix" the app in response to it.
- **A leftover preview server on port 4173 aborts the whole e2e suite** with a message that does not
  say what to do. `playwright.config.js` sets `reuseExistingServer: false` on purpose, so a stale
  build can never mask fresh source edits. Kill the listener first.
- **Vietnamese numeric convention inverts the separators:** `1.234.567,89` in `vi-VN` is
  `1,234,567.89` in `en-US`. In a settlement context this is not cosmetic — `1.026 × 1.008` read as
  Vietnamese means `1026 × 1008`, a 1000-fold error on the two loss coefficients.
- **All money is VND internally; USD is display-only.** Chart axes divide by `1e9` for VND and by
  `EXCHANGE_RATE * 1e6` for USD, so any new chart series must apply the same divisor or it will be
  off by roughly four orders of magnitude.
- **The five-line bill for S1 and S3 differs only in FMP** — both use
  `{ contracted: 5,000,000, total: 5,000,000 }`. The excess story lives in the daily chart and the
  narration, not in the bill. Do not "fix" the apparent duplication.
- **`app/e2e/visual.spec.js-snapshots/` will keep showing as untracked** and that is intended
  (ASM-007). The propagation guard must therefore gate on tracked-file dirtiness only.
- **The deploy build marker gets a `-dirty` suffix when `git status --porcelain` is non-empty at
  build time**, and `check_deploy_freshness.py` treats a dirty live marker as a hard failure. Always
  commit before deploying.
- **`plans/` and `lessons/` are not what their names suggest to a newcomer.** `lessons/` is course
  handout HTML; the corrections log is `corrections-log.md` at the repository root.
- **Retiring a figure is a two-sided operation:** the new value must be everywhere *and* the old
  value must be nowhere, in the same commit, or `check_retired_figures.py` blocks it.

## Verification Strategy

- **TEST-001:** `cd app && npm run lint` → exit 0, no output.
- **TEST-002:** `cd app && npx prettier --check src e2e scripts *.config.js` → prints
  `All matched files use Prettier code style!`.
- **TEST-003:** `cd app && npm test` → exit 0, strictly more than 73 tests passing.
- **TEST-004:** `cd app && npm run coverage` → exit 0, and the printed file table includes rows for
  `chart.js` and `main.js`.
- **TEST-005:** `cd app && npm run e2e -- --workers=1` → exit 0 across all three Playwright
  projects.
- **TEST-006:** `cd app && npm run build && grep -c woff2 dist/sw-manifest.json` → a count of 1 or
  more.
- **TEST-007:** `python -m unittest discover -s tools/tests -v` → exit 0, with new tests for
  `check_delivery_pipeline`, `check_terminology_numbers`, `check_plan_status` and `compare_deck`.
- **TEST-008:** `python tools/check_retired_figures.py` → `RETIRED-FIGURES PASS`.
- **TEST-009:** `python tools/verify_prose_figures.py` → `PROSE-FIGURES PASS`.
- **TEST-010:** `python audit_teaching_deck.py && python verify_deck_numbers.py` → both exit 0, and
  the second reports notes-origin tokens.
- **TEST-011:** `python tools/check_plan_status.py` → exit 0.
- **TEST-012:** `python tools/check_terminology_numbers.py` → exit 0.
- **TEST-013:** `cd app && node scripts/i18n-report.mjs --check` → exit 0.
- **TEST-014:** `cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && cd .. && git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json`
  → exit 0 (only `gate-sweep.json` legitimately changes, and only in PHASE-06).
- **TEST-015:** `pip install -r requirements.txt && python tools/pipeline.py --lang en` → exit 0.
- **TEST-016:** `git rev-list --count origin/master..master` → `0`.
- **TEST-017:** `python tools/check_deploy_freshness.py --skip-build` → `DEPLOY-FRESHNESS PASS`.
- **TEST-018:** `python tools/check_delivery_pipeline.py` → `DELIVERY-PIPELINE CLEAN`.
- **TEST-019:** `curl -s https://dppa-case.web.app/sw.js | head -1` → JavaScript source, not
  `<!doctype html>`.
- **MANUAL-001:** Venue-offline drill — load `https://dppa-case.web.app` once, disable networking,
  reload, and confirm the app renders with working charts. Record the date and result under
  `## Offline drill` in `app/deployment.md`.
- **MANUAL-002:** Currency check — open the app, switch to USD, and confirm the dashed strike
  reference line is visible on the FMP strip and that the caption's stated value matches the line's
  position. This is the specific defect PHASE-01 fixes.
- **MANUAL-003:** Language-switch state retention — select hour 07:00, move the strike slider,
  switch to `VI`, and confirm both the hour and the slider value survive.
- **MANUAL-004:** Deep-link check — open `?strikeEsc=0` and confirm the crossover year is visibly
  earlier than on the default landing state.
- **OBS-001:** Confirm the next scheduled `freshness-checks` run has three jobs, that
  `deploy-freshness` prints a `PASS` or `STALE` verdict rather than `UNKNOWN`, and that
  `delivery-pipeline` prints all three distance counts.
- **OBS-002:** Confirm the `app-quality` workflow run for the pushed head shows the Prettier,
  coverage and `i18n:check` steps actually executing, not skipped.

## Risks and Alternatives

- **RISK-001:** The plan spans six phases against a 2026-09-15 content freeze, and the
  translator deadline falls three days after this plan is written. Mitigation: PHASE-03 is
  deliberately independent of PHASE-02 (it depends only on PHASE-01), so it can be executed in
  parallel or pulled forward if the translator engagement lands first.
- **RISK-002:** Several phases change files the deck pipeline consumes, and the deck binary is 14.6
  MB. Committing it repeatedly grows an already 137 MB `.git`. Mitigation: rebuild the deck exactly
  once, in PHASE-06's single regeneration commit; the `deck-build` CI job always builds to a
  temporary directory.
- **RISK-003:** Six phases of guard-tightening could turn CI red for reasons unrelated to product
  correctness, blocking the deploy the project actually needs. Mitigation: PHASE-02 pushes and
  deploys *before* PHASE-04 tightens the remaining gates, so the audience-facing fix lands first.
- **RISK-004:** The propagation guard fails whenever a legitimate work-in-progress branch exists,
  making it noisy enough to be ignored — the failure mode of the register checker. Mitigation:
  `--max-age-days` exists precisely so a normal working day does not trip it, and the scheduled job
  should pass `--max-age-days 3`.
- **ALT-001:** Rather than a bespoke `check_delivery_pipeline.py`, a git `pre-push` hook or a
  session-end shell hook could report the same counts. Rejected because hooks are per-clone, easy
  to bypass, and invisible to a scheduled run — the observed failure was precisely that nobody
  noticed for three weeks, which is what a scheduled job fixes and a local hook does not.
- **ALT-002:** The redesign could be reverted rather than stabilised, restoring a known-green tree
  instantly. Rejected because the work directly addresses the documented teaching failure that
  motivates the whole project — the horizontal cancellation equation with stacked strikethroughs is
  exactly what lost the audience — and it renders cleanly today with zero console errors.
- **ALT-003:** The webfont could be dropped entirely instead of self-hosted, saving roughly 90 kB.
  Rejected as the default because the design depends on Inter's metrics and the fallback stack
  renders noticeably differently on Windows projectors; it remains the documented fallback in
  ASM-004 if the package cannot be installed.

## Suggested Next Step

Execute PHASE-01. It is self-contained, requires no credentials, and ends with a committed,
fully green working tree — which is the precondition for PHASE-02's push being safe. Verify every
PHASE-01 exit criterion before starting PHASE-02.
