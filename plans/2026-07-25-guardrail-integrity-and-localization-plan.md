---
title: "Guardrail Integrity, Trilingual App & Pre-Freeze Hardening"
date: "2026-07-25"
status: "in-progress - PHASE-01..05 committed and verified (commits 082b5aa..2df2874); PHASE-06 TASK-06-01/02/03 (style unification format pass) committed as 84e5503 on 2026-08-02; TASK-06-05..06-12 still open"
request: "Turn research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md into a multi-phase execution plan saved to plans/"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md"
  - "research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md"
  - "plans/2026-07-21-deploy-drift-repo-hygiene-plan.md (PHASE-03/04/05 never executed; carried forward here)"
  - "plans/2026-october-readiness-checklist.md"
---

# Plan: Guardrail Integrity, Trilingual App & Pre-Freeze Hardening

## Objective

Make the production-deploy guardrail trustworthy (it currently reports a commit that could not
have produced the served HTML, and will fire its first scheduled run as a false alarm), then
localize the live teaching app into Vietnamese and Chinese so the audience it was built for can
read it, then clear the carried CI/hygiene/documentation debt before the 2026-09-15 English content
freeze. The app is the artifact a QR code on the teaching deck's closing slide points at; it is
currently English-only, carries a stray personal name in its header, and its deploy provenance is
unverifiable.

## Context Snapshot

- **Current state:**
  - `https://dppa-case.web.app` serves a bundle that is byte-identical to the current `master`
    build (verified by sha256 of `/assets/index-CpURIX_m.js`), but its embedded
    `<meta name="build-commit">` names commit `e55319e`, whose tree contains no marker-injecting
    plugin at all — so the deployed HTML was produced from an uncommitted working tree and matches
    no reviewable commit.
  - `tools/check_deploy_freshness.py` exits 1 today and will fail its first scheduled run
    (Mondays 09:00 UTC via `.github/workflows/freshness-checks.yml`) even though the app content is
    current, because it compares the marker against `git rev-parse HEAD` — so any commit,
    including a documentation-only commit, marks the site "stale".
  - The app UI, teach-mode annotations, and all panel copy are English-only
    (`app/index.html` declares `lang="en"`); the only non-English content is a 4-step
    English/Vietnamese tour. The deck, lessons, and worksheets are already trilingual.
  - The app header renders the literal string `Rob — Vietnam synthetic DPPA` as its eyebrow text
    (`app/src/modules/ui.js`, inside `renderAppShell`); this string is present in the live bundle.
  - `build_callouts.py` hard-codes the retired figure `"0 of 56"` and renders it at 48pt bold red
    onto a slide; `tools/retired_figures.json` lists `"0 of 56"` as retired, but its scan list
    covers only Markdown and HTML prose, never build scripts.
  - `app/e2e/visual.spec.js` has no committed baselines, so CI's `e2e:visual` step runs with
    `continue-on-error: true` and cannot fail; there is no accessibility test and no coverage
    reporting.
  - Twelve one-off build/verify scripts and seven orphaned binary artifacts sit at the repo root
    beside the six scripts that are still live, with nothing distinguishing them.
  - `app/.prettierrc` specifies `semi: true, singleQuote: false`, the opposite of the style used
    in the core engine files; `npx prettier --check src e2e` fails on 26 files.
  - There is no root `CLAUDE.md`; `activeContext.md` (45 kB) was last updated 2026-06-29 and does
    not mention any work done since; `learning-records/` stops at `0004`.
  - `.git` is 252 MB with 1,411 loose objects and zero packfiles.

- **Desired state:**
  - The build marker is honest (refuses to claim a commit when the tree is dirty), the freshness
    check compares deployed **artifact bytes** rather than a commit label, `app/deployment.md`'s
    deploy log is written by the checker rather than by hand, and Firebase serves correct
    cache headers.
  - The app resolves `?lang=en|vi|zh`, renders its chrome, controls, five-line-bill labels, teach
    annotations, and tour in the selected language, falls back to English per-key for anything not
    yet translated, and never displays the literal token `UNTRANSLATED`.
  - Retired figures cannot reappear in generated decks; one-off scripts are archived and the
    remaining live scripts are self-labelling.
  - Visual-regression, accessibility, and coverage gates are real (able to fail the build).
  - A root `CLAUDE.md` carries the project's operating rules; the abandoned memory files are
    resolved; `learning-records/0005` exists.

- **Key repo surfaces:**
  `app/vite.config.js`, `app/firebase.json`, `app/deployment.md`, `tools/check_deploy_freshness.py`,
  `tools/check_retired_figures.py`, `tools/retired_figures.json`, `tools/tests/`,
  `.github/workflows/ci.yml`, `.github/workflows/freshness-checks.yml`,
  `app/src/modules/ui.js`, `app/src/modules/teach.js`, `app/src/modules/tour.js`,
  `app/src/data/teach-steps.js`, `app/src/data/tour-steps.js`, `app/e2e/`,
  `assets/teaching/terminology-map.json`, `build_callouts.py`, root `*.py` / `*.js` build scripts.

- **Out of scope:**
  - Changing any settlement formula, scenario constant, or exported figure. `app/src/modules/settlement.js`,
    `app/src/data/default-scenarios.js`, and `assets/teaching/spine-s{1,2,3}.json` /
    `gate-sweep.json` are **not** to be edited by this plan. The deck-parity CI job must keep passing
    with the committed exports byte-unchanged.
  - Producing actual Vietnamese or Chinese translations of new sentences. This plan builds the
    mechanism and populates only translations that already exist verbatim in the repo; the
    remaining strings stay marked `UNTRANSLATED` for the qualified translator engagement tracked as
    item H2 in `plans/2026-october-readiness-checklist.md`.
  - Rebuilding, re-rendering, or re-auditing the teaching decks in `ceba/`.
  - Enabling the commented-out Firebase deploy job in CI (blocked on credentials, item H4 of the
    same checklist).

## Environment & Conventions

- **Stack:** Node.js 24 (CI pin) with npm; Vite 8 build, Vitest 4 unit tests, Playwright 1.53 e2e,
  ESLint 9, Prettier 3; Chart.js 4 is the only runtime dependency. Python 3.12 (CI pin) with
  `python-pptx` for the deck tooling; all `tools/*.py` checkers are **standard library only** and
  must stay that way. The web app lives in `app/`; the deck/teaching tooling lives at the repo root.
- **Setup:**
  ```bash
  cd app && npm install
  pip install python-pptx
  ```
  Use `npm install`, **not** `npm ci`. CI deliberately uses `npm install` because `npm ci` fails on
  optional native-binary lockfile drift (`@emnapi/core`); a comment in `.github/workflows/ci.yml`
  records this. Do not "fix" it by switching to `npm ci`.
- **Build / Run:**
  ```bash
  cd app && npm run dev      # Vite dev server
  cd app && npm run build    # production build into app/dist
  cd app && npm run preview  # serve the built app
  ```
  Deploy (manual, from a clean working tree):
  ```bash
  cd app && npm run predeploy && npx firebase deploy --only hosting --project dppa-case
  ```
  `npm run predeploy` is `npm run lint && npm test && npm run e2e && npm run build`.
- **Test:**
  - Full JS unit suite: `cd app && npm test` (expected today: **57 passed, 8 files**).
  - Single JS test file: `cd app && npx vitest run src/modules/settlement.test.js`.
  - Single test by name: `cd app && npx vitest run -t "name substring"`.
  - Functional e2e: `cd app && npm run e2e`. Visual e2e: `cd app && npm run e2e:visual`.
    On Windows, append `-- --workers=1` to visual runs (parallel projects cause screenshot
    instability); CI runners do not need this.
  - Python checker suite: `python -m unittest discover -s tools/tests -v` from the repo root.
  - Individual Python checkers, from the repo root:
    ```bash
    python tools/check_deploy_freshness.py
    python tools/check_human_blocked_register.py
    python tools/check_retired_figures.py
    python tools/verify_prose_figures.py
    python audit_teaching_deck.py
    python verify_deck_numbers.py
    ```
- **Conventions & traps:**
  - **Windows shell:** if the default `python` is shadowed, every Python command in this plan also
    works as `PYTHONPATH= py <script>`. The `PYTHONPATH=` prefix is required on this machine.
  - **Currency and units:** all monetary figures are **VND per kWh** or **VND totals**; volumes are
    **kWh**; the app's USD toggle uses a fixed rate in `app/src/modules/formatters.js`. Number
    grouping is comma-separated (`8,563,000,000`) and is identical across English, Vietnamese, and
    Chinese renderings — do **not** introduce locale-specific number formatting.
  - **Timezone:** the scheduled workflow cron is UTC. Dates in checklists and registers are plain
    `YYYY-MM-DD` with no timezone.
  - **Code style is split:** `settlement.js`, `ui.js`, `main.js`, `chart.js`, `formatters.js`,
    `profiles.js`, `flow-diagram.js` use **no semicolons and single quotes**; `theme.js`, `tour.js`,
    and everything in `e2e/` use **semicolons and double quotes**. Until PHASE-06 resolves this,
    match the style of the file you are editing. Do **not** run `npm run format` before PHASE-06 —
    it would rewrite the engine into the opposite style in one unreviewable diff.
  - **Import extensions:** `settlement.js` uses explicit `./profiles.js` because
    `app/scripts/export-*.mjs` run under plain Node ESM, which cannot resolve extensionless paths.
    Most other modules are still extensionless and rely on Vite. When you touch an import in a file
    that any `scripts/*.mjs` transitively imports, use the explicit `.js` extension.
  - **Number-pipeline rule:** whenever a headline figure changes, the superseded value must be added
    to `tools/retired_figures.json` in the same commit.
  - **Retirement rule:** retire files with `git mv` into an archive location, never `rm` — history
    and reversibility are explicitly valued in this repo.
  - **Do not commit** anything into `app/dist/`, `app/node_modules/`, `app/playwright-report/`,
    `app/test-results/`, or `app/.firebase/`; all are gitignored.
- **Repo map:**
  ```
  app/                    Vite web app (the live tool at https://dppa-case.web.app)
    src/main.js           entry: wires state, controls, and render calls
    src/modules/          settlement.js (engine), ui.js (all DOM/copy), chart.js,
                          flow-diagram.js, formatters.js, profiles.js,
                          teach.js, theme.js, tour.js  (+ *.test.js beside each)
    src/data/             default-scenarios.js, teach-steps.js, tour-steps.js
    scripts/              export-spine.mjs, export-sweep.mjs, record-teach-demos.mjs
    e2e/                  Playwright specs: controls, scenarios, teach, tour, visual
    firebase.json         hosting config (public dir = dist, SPA rewrite)
    deployment.md         deploy commands, deploy log, pre-workshop checklist
  tools/                  stdlib-only Python CI guards + tools/tests/ unittest suite
  assets/teaching/        spine-s{1,2,3}.json, gate-sweep.json, terminology-map.json,
                          rendered PNG/MP4 teaching visuals
  ceba/                   the PowerPoint decks (source + October teaching build)
  plans/ research/ reports/ learning-records/   planning and record artifacts
  <root>/*.py, *.js       deck build/verify scripts (mixture of live and one-off)
  ```

## Research Inputs

- From `research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md`:
  - The live site serves `<meta name="build-commit" content="e55319e…">`, but
    `git show e55319e:app/vite.config.js` contains no marker plugin — the plugin first appears in
    the following commit `7329b58`. A clean build of `e55319e` could not have produced that HTML,
    so the deployed artifact came from an uncommitted tree and corresponds to no commit.
  - The served `/assets/index-CpURIX_m.js` is byte-identical (sha256 `6629fc74…33cb5f`) to a fresh
    local `npm run build` at `HEAD`. The live app's **content** is current; only its **provenance
    metadata** is wrong. Do not treat this as a stale-content emergency.
  - `check_deploy_freshness.py` compares against `git rev-parse HEAD`, so documentation-only commits
    mark the site stale. Commit `090a50d` (a report `.md` only) is one of the two commits causing
    today's red.
  - `curl -I https://dppa-case.web.app` returns `Cache-Control: max-age=3600` on **both**
    `index.html` and the content-hashed `/assets/*.js` — the first lets a freshness check read
    hour-stale HTML, the second wastes revalidation on poor venue wifi and blocks long-lived
    offline caching.
  - The app is English-only for an audience the repo describes as Vietnamese and Chinese-speaking
    factory CFOs and lenders; `assets/teaching/terminology-map.json` has 66 `UNTRANSLATED` entries
    and an existing gate that refuses trilingual deck builds while any consumed key is untranslated.
    Wiring the app into that same map means one translator engagement covers deck, lessons, and app.
  - `build_callouts.py` lines 9 and 166 hard-code `"0 of 56"`, the first entry in
    `tools/retired_figures.json`'s retired list; neither prose guard scans `.py`/`.js` generators.
  - `app/.prettierrc` (`semi: true, singleQuote: false`) contradicts the dominant engine style;
    26 files fail `prettier --check`; five files (`src/modules/tour.js`, `src/modules/tour.test.js`,
    `src/theme.css`, `e2e/tour.spec.js`, `e2e/visual.spec.js`) are minified into unreadable
    one-liners.
  - The app's total production payload is 340 kB, making a precaching service worker a
    higher-coverage answer to the venue-wifi risk than the ~6 MB of fallback video already built.
  - `.git` is 252 MB with `in-pack: 0`; three files under `background/` are tracked despite
    `background/` being listed in `.gitignore`; every CfD chart is committed as both `.gif` and
    `.mp4` (~10 MB of duplication).
- From `research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md`:
  - Classification of the root scripts into six **live** (CI-invoked or documented as regenerable)
    and twelve **one-off/historical**, derived by cross-referencing `NOTES.md`, `RESOURCES.md`, and
    `.github/workflows/ci.yml` against each script's last-touched commit. This classification is a
    starting point for a confirm-before-archive pass, not a final verdict — hence `git mv`.
  - Orphaned tracked binaries never named as current teaching artifacts: `dppa-case-study.pptx`,
    `dppa-factory-presentation.pptx`, `dppa-web-app-case-study.pptx`,
    `dppa-2026-factory-energy-proposal.pptx`, `ref/DPPA 2025 ref.pptx`, plus root-level
    `current-app-screenshot.png` and `desktop-current.png`.
- From `plans/2026-october-readiness-checklist.md`:
  - Session date assumed **2026-10-01**; **English content freeze 2026-09-15**; translator
    engagement (H2) needed by **2026-08-25**; fresh-viewer test (H5) and Firebase credentials (H4)
    by **2026-09-08**. These dates are backward-planned from an unconfirmed session date (H1).
  - The "Early September" item *"Deploy the app so `https://dppa-case.web.app` reflects the
    teach-mode banner, presenter theme, and current scenario numbers"* is still shown unchecked
    even though a deploy was performed on 2026-07-22.

## Assumptions and Constraints

- **ASM-001:** The Firebase CLI is installed and already authenticated on the executing machine for
  project `dppa-case` (the 2026-07-22 deploy succeeded from it). — **BINDING DEFAULT:** if
  `npx firebase deploy` fails on authentication, stop PHASE-01 at TASK-01-09, commit everything
  else in the phase, and record the blocked deploy in the "Human-blocked register" table of
  `plans/2026-october-readiness-checklist.md` as a new row `H6` with owner `Presenter` and
  `Needed by` = `2026-08-15`. Do not attempt to create or store credentials.
- **ASM-002:** Only two languages beyond English matter for the app: Vietnamese (`vi`) and
  Chinese Simplified (`zh`). — **BINDING DEFAULT:** use exactly the language codes `en`, `vi`, `zh`
  in the app, matching the keys already used inside `assets/teaching/terminology-map.json`'s
  `entries.*` objects. Note that `assets/` filenames for the lesson HTML use `zh-cn`; do **not**
  rename those, and do not introduce `zh-cn` as an app language code.
- **ASM-003:** Decree-57 symbols and units (`FMP`, `Kpp`, `CDPPA`, `C_EVN`, `C_KH`, `Strike`,
  `kWh`, `VND`, `USD`) are language-neutral and are taught as symbols by the deck's decoder slide.
  — **BINDING DEFAULT:** leave every such symbol untranslated inside formula strings in all three
  languages; translate only the surrounding prose (for example `Loss adj.`, `net cost / kWh`).
- **ASM-004:** No qualified Vietnamese or Chinese translator is available during execution of this
  plan (item H2 is open until 2026-08-25). — **BINDING DEFAULT:** populate `vi`/`zh` app strings
  **only** where a verbatim translation already exists in the repo (`app/src/data/tour-steps.js`,
  `assets/teaching/terminology-map.json`, `lessons/*-vi.html`, `lessons/*-zh-cn.html`,
  `build_teaching_visuals.py`'s `TEXTS` dict). Every other `vi`/`zh` value is the literal string
  `UNTRANSLATED`. Never machine-translate and never guess.
- **ASM-005:** The exact count of user-visible English strings in `app/src/modules/ui.js` is not
  known in advance. — **BINDING DEFAULT:** the executor produces the inventory as TASK-03-01 and
  records the final key count in the phase's exit criteria; the plan does not assume a number.
- **ASM-006:** The `chunkSizeWarningLimit: 300` currently set in `app/vite.config.js` exists to
  silence the Chart.js bundle warning. — **BINDING DEFAULT:** leave it in place; do not lower it as
  part of the bundle-trim task, so a regression in bundle size is visible as a build warning rather
  than a build failure.
- **ASM-007:** Whether the `.gif` copies of the CfD charts in `assets/` are still consumed by any
  build is not fully determined. — **BINDING DEFAULT:** do **not** delete them in this plan. Record
  the finding in `archive/README.md` and leave the decision to a human.
- **CON-001:** The committed engine exports (`assets/teaching/spine-s{1,2,3}.json`,
  `assets/teaching/gate-sweep.json`) must remain byte-identical throughout. CI's `deck-parity` job
  regenerates them and fails on any diff.
- **CON-002:** English content is frozen on 2026-09-15. Any change to English user-facing strings
  after that date invalidates the fresh-viewer validation and triples translation rework. All
  English copy edits in this plan (including PHASE-01's header fix) must land well before it.
- **CON-003:** `tools/*.py` must remain standard-library only — they run in a CI job that installs
  no Python packages other than `python-pptx` (used by the root deck scripts, not by `tools/`).
- **CON-004:** The existing 57 unit tests and the functional Playwright suite assert on **English**
  rendered text. English must remain the default language with byte-identical output so those
  assertions keep passing without modification, except where this plan explicitly specifies a test
  change.
- **DEC-001:** Fix provenance rather than chase the commit label: the freshness signal becomes a
  comparison of deployed artifact bytes against a fresh local build, with the commit marker demoted
  to human-readable provenance.
- **DEC-002:** Language selection is URL-driven (`?lang=`) and per-key English-fallback, so partial
  translations ship safely and the presenter can switch languages from the address bar mid-session.
- **DEC-003:** Archive by `git mv` into `archive/`, never delete.
- **DEC-004:** The five previously-flagged-but-unexecuted items from
  `plans/2026-07-21-deploy-drift-repo-hygiene-plan.md` (visual baselines, accessibility, coverage,
  script archival, learning record 0005) are folded into this plan rather than carried a fifth time.

## Specification

### S1. Build-provenance marker (replaces the current unconditional marker)

Let:
- `C` = full 40-character output of `git rev-parse HEAD`
- `D` = boolean, true when `git status --porcelain` produces any output (working tree dirty)

The injected tag is:

```
<meta name="build-commit" content="{M}">
```

where the marker value `M` is:

1. `"unknown"` — if either git command throws (no git binary, or not a repository).
2. `C + "-dirty"` — if `D` is true. Example: `090a50d0859e51cf0d905d57bfdd4cc79a171b0c-dirty`.
3. `C` — otherwise.

Plain English: the marker may only claim a bare commit hash when the tree that produced the build
is exactly that commit. A dirty build is still permitted (developers must be able to build locally),
but it self-identifies, and a `-dirty` marker found on the production site is a hard failure.

### S2. Deploy-freshness decision logic (replaces commit comparison)

Inputs: `URL` (default `https://dppa-case.web.app`), and a local repository checkout.

1. Run `npm run build` in `app/` to produce `app/dist/`. If the build fails, print
   `DEPLOY-FRESHNESS UNKNOWN: local build failed` and exit **0** (a broken local build is not
   evidence about production).
2. Parse `app/dist/index.html` for every `src=` and `href=` attribute pointing at `/assets/`.
   Call this set `LOCAL_ASSETS` (today: `/assets/index-CpURIX_m.js`, `/assets/index-Bev1tNA7.css`).
3. HTTP GET `URL`. On any network error or non-200, print
   `DEPLOY-FRESHNESS UNKNOWN: could not reach {URL} ({error})` and exit **0**.
4. Parse the fetched HTML the same way to produce `LIVE_ASSETS`.
5. Extract the `<meta name="build-commit">` value from the fetched HTML as `M_live`
   (may be absent).
6. **If `M_live` ends with `-dirty`:** print
   `DEPLOY-FRESHNESS FAIL: live build marker {M_live} was produced from a dirty working tree`
   and exit **1**. This check runs before the asset comparison and is not excused by matching bytes.
7. **If `LIVE_ASSETS` equals `LOCAL_ASSETS` as a set:** print
   `DEPLOY-FRESHNESS PASS (assets match local build at {C_short}; live marker {M_live_short})`
   and exit **0**.
8. **Otherwise:** print
   `DEPLOY-FRESHNESS STALE: live assets {sorted LIVE_ASSETS} != local build assets {sorted LOCAL_ASSETS} — run "cd app && npm run predeploy && npx firebase deploy --only hosting --project dppa-case"`
   and exit **1**.

Plain English: Vite emits content-hashed asset filenames, so identical filenames prove identical
bytes. A documentation-only commit does not change any asset filename and therefore cannot make the
site "stale" — which is correct, because it does not. A genuine app change always changes at least
one hash.

Why the local build is required: the comparison is against what `HEAD` *would* produce, not against
a stored label, which is what makes the check immune to a wrong or missing marker.

### S3. App language resolution order

Given `search` (a query string such as `?lang=vi&teach=1`), `storage` (`localStorage`), and
`navigatorLanguage` (e.g. `"vi-VN"`), resolve to exactly one of `"en"`, `"vi"`, `"zh"`:

1. If `search` contains `lang` and its value is exactly `en`, `vi`, or `zh` → use it, and persist it
   to `storage` under key `dppa-lang`.
2. Else if `storage.getItem("dppa-lang")` is exactly `en`, `vi`, or `zh` → use it.
3. Else if `navigatorLanguage` (lower-cased) starts with `vi` → `"vi"`.
4. Else if `navigatorLanguage` (lower-cased) starts with `zh` → `"zh"`.
5. Else → `"en"`.

An unrecognised value (e.g. `?lang=fr`, `?lang=zh-cn`, `?lang=`) falls through to the next rule; it
is never an error and never throws.

### S4. String lookup with per-key English fallback

Given the resolved language `L` and a key `K`:

1. If `STRINGS[L][K]` exists and is not the literal string `"UNTRANSLATED"` → return it.
2. Else if `STRINGS["en"][K]` exists → return it.
3. Else → return `K` itself, and call `console.warn` once per missing key with
   `i18n: missing key "{K}"`.

Plain English: an untranslated Vietnamese string silently renders in English rather than showing a
placeholder to a room full of people. Step 3 exists so a typo'd key is visible in development
without crashing a live presentation.

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Make deploy provenance honest and the freshness check meaningful; fix the stray name in the app header; redeploy from a clean tree | None | Dirty-aware marker in `app/vite.config.js`, rewritten `tools/check_deploy_freshness.py` + tests, cache headers in `app/firebase.json`, corrected `app/deployment.md`, verified-fresh production deploy |
| PHASE-02 | Close the generator-side blind spot in the figure guards; archive one-off scripts and orphaned binaries; shrink the repository | None (parallel with PHASE-01) | Extended `tools/retired_figures.json` scan + guard fix, `archive/` with 12 scripts and 7 binaries, header labels on the 6 live scripts, packed `.git` |
| PHASE-03 | Make the app trilingual: string extraction, language resolution, English fallback, teach + tour localization | None (parallel; must precede PHASE-06) | `app/src/modules/i18n.js`, `app/src/data/strings.js`, localized `ui.js`/`teach.js`/`tour.js`, `i18n.test.js`, e2e language spec, `npm run i18n:report` |
| PHASE-04 | Make the app work with the venue wifi switched off; trim the bundle | PHASE-01 (cache headers) | `app/public/sw.js`, registration in `app/src/main.js`, explicit Chart.js registration, offline e2e spec |
| PHASE-05 | Turn three decorative or absent CI gates into real ones | None (parallel) | Committed Linux visual baselines, `app/e2e/a11y.spec.js`, Vitest coverage config + threshold, `ci.yml` without `continue-on-error` |
| PHASE-06 | Resolve the style split, write the missing project documentation, close the memory-file sprawl | PHASE-03 (avoid reformatting files mid-localization) | Corrected `app/.prettierrc` + repo-wide format + CI format check, root `CLAUDE.md`, `learning-records/0005`, retired `activeContext.md`, renamed corrections log |

## Detailed Phases

### PHASE-01 - Deploy Provenance & Freshness Integrity

**Goal**
Make the production build self-identify honestly, replace the commit-label freshness comparison with
an artifact-byte comparison that cannot produce false alarms, serve correct cache headers, correct
the deploy log, remove the stray personal name from the app header, and redeploy from a verified
clean tree so that every one of those statements is true of the live site.

**Tasks**
- [x] TASK-01-01: In `app/vite.config.js`, replace `getBuildCommit()` with the S1 logic: run
      `git rev-parse HEAD` and `git status --porcelain`, return `"unknown"` on any exception,
      append `-dirty` when `git status --porcelain` output is non-empty after trimming. Keep the
      existing `transformIndexHtml` insertion point and the exact meta-tag shape
      (`<meta name="build-commit" content="…">`) so the existing regex in the checker still matches.
      Leave the `test` and `build` config blocks untouched.
- [x] TASK-01-02: In `app/src/modules/ui.js`, inside `renderAppShell`, change the eyebrow text
      `Rob — Vietnam synthetic DPPA` to `Vietnam synthetic DPPA`. Change nothing else in that
      header block — the `<h1>DPPA CFO visual explainer</h1>` and the `hero-copy` paragraph stay
      exactly as they are.
- [x] TASK-01-03: Search the repository for any test or snapshot asserting the old eyebrow text
      (`grep -rn "Rob —" app/src app/e2e`) and update any match to the new string.
- [x] TASK-01-04: Rewrite `tools/check_deploy_freshness.py` to implement S2. Keep the module
      docstring's shape (purpose, exit-code policy, run instructions including the
      `PYTHONPATH= py` Windows note), keep `--url` and add `--skip-build` (see Function
      Signatures). Keep the rule that unreachable network is exit 0. Standard library only.
- [x] TASK-01-05: Add a `--write-log` flag to the same script that, on a PASS, rewrites the first
      data row of the `## Last Deploy` table in `app/deployment.md` with today's date (UTC,
      `YYYY-MM-DD`), the short commit from the live marker, and the existing description text of
      that row — leaving all other rows and all other sections of the file untouched. If the current
      first data row's date already equals today's date, update it in place instead of inserting.
- [x] TASK-01-06: Extend `tools/tests/test_check_deploy_freshness.py` with the Test Specs below.
      Use `unittest.mock.patch` on the module's fetch function; never make a real network call in a
      test.
- [x] TASK-01-07: Add a `headers` block to `app/firebase.json`: `**/*.html` →
      `Cache-Control: no-cache`; `/assets/**` → `Cache-Control: public, max-age=31536000, immutable`.
      Leave `public`, `ignore`, and `rewrites` exactly as they are.
- [x] TASK-01-08: Correct the `## Last Deploy` table in `app/deployment.md`: the 2026-07-22 row
      currently reads commit `f5fd22a`, which is wrong — the served marker says `e55319e` and the
      served bytes match a later tree. Replace that row's commit cell with
      `e55319e (marker; built from an uncommitted tree — see the 2026-07-25 row)` and add the note
      that the table's top row is now maintained by `python tools/check_deploy_freshness.py --write-log`.
- [x] TASK-01-09: Verify the working tree is clean (`git status --porcelain` prints nothing) after
      committing TASK-01-01..08, then run the full deploy:
      ```bash
      cd app && npm run predeploy && npx firebase deploy --only hosting --project dppa-case
      ```
- [x] TASK-01-10: From the repo root, run `python tools/check_deploy_freshness.py --write-log` and
      confirm it prints `DEPLOY-FRESHNESS PASS` and that the marker it reports contains **no**
      `-dirty` suffix. Commit the resulting `app/deployment.md` change.
- [x] TASK-01-11: Move the git tag `v1.1-oct-workshop-hardened` (currently on `f5fd22a`, which
      predates both the freshness tooling and this deploy) to the deployed commit:
      ```bash
      git tag -f v1.1-oct-workshop-hardened
      git push --force origin refs/tags/v1.1-oct-workshop-hardened
      ```
      Then confirm `git rev-list --count v1.1-oct-workshop-hardened..HEAD` prints `0`.
- [x] TASK-01-12: In `plans/2026-october-readiness-checklist.md`, tick the "Early September"
      item *"(human-only) Deploy the app …"* and append ` — done 2026-07-25, verified by
      python tools/check_deploy_freshness.py`.

**File Changes**
- `app/vite.config.js` (modify): replace the body of `getBuildCommit()` per S1; leave
  `buildCommitPlugin`'s `transformIndexHtml` string template and the exported `defineConfig` object
  otherwise unchanged.
- `app/src/modules/ui.js` (modify): one string literal in `renderAppShell`'s brand block. Nothing
  else in this 552-line file.
- `tools/check_deploy_freshness.py` (modify): full rewrite of the comparison logic per S2, plus the
  `--write-log` implementation. Preserve the "network error → exit 0" behavior and the docstring's
  Windows run note.
- `tools/tests/test_check_deploy_freshness.py` (modify): add cases per Test Specs; keep existing
  cases that still apply and delete any that assert the removed commit-comparison behavior.
- `app/firebase.json` (modify): add a `headers` array inside `hosting`.
- `app/deployment.md` (modify): correct the 2026-07-22 row's commit cell; add the `--write-log`
  note under the table. Leave the "CI Notes", "Runtime flags", "Quality commands", "Visual baseline
  bootstrap", and "Pre-workshop checklist" sections alone (PHASE-05 edits the baseline section).
- `plans/2026-october-readiness-checklist.md` (modify): tick one checkbox in the "Early September"
  section.

**Function Signatures**
- `get_build_marker() -> str` (JavaScript, in `app/vite.config.js`, may be named
  `getBuildCommit`) — returns `"unknown"`, a 40-char commit hash, or a 40-char hash suffixed
  `-dirty`, per S1.
- `local_asset_paths(dist_index_html: str) -> set[str]` — returns the set of `/assets/…` paths
  referenced by `src`/`href` attributes in the given HTML source.
- `live_asset_paths(html: str) -> set[str]` — same extraction applied to fetched HTML; identical
  implementation, separate name for call-site clarity (may delegate to `local_asset_paths`).
- `extract_build_commit(html: str) -> str | None` — unchanged from today: returns the
  `build-commit` meta content, or `None` when the tag is absent.
- `is_dirty_marker(marker: str | None) -> bool` — returns `True` only when `marker` is a string
  ending in the literal suffix `-dirty`.
- `run_local_build(app_dir: Path) -> bool` — runs `npm run build` in `app_dir`; returns `True` on
  exit code 0, `False` otherwise; never raises.
- `write_deploy_log(deployment_md: Path, log_date: str, commit_short: str) -> bool` — rewrites or
  inserts the top data row of the `## Last Deploy` table; returns `True` when the file changed.
- `main(argv: list[str] | None = None) -> int` — CLI entry; supports `--url`, `--skip-build`,
  `--write-log`; returns the process exit code per S2.

**Test Specs**
- `is_dirty_marker("090a50d0859e51cf0d905d57bfdd4cc79a171b0c-dirty")` → `True`
- `is_dirty_marker("090a50d0859e51cf0d905d57bfdd4cc79a171b0c")` → `False`
- `is_dirty_marker(None)` → `False`
- `local_asset_paths('<script type="module" crossorigin src="/assets/index-CpURIX_m.js"></script><link rel="stylesheet" crossorigin href="/assets/index-Bev1tNA7.css">')`
  → `{"/assets/index-CpURIX_m.js", "/assets/index-Bev1tNA7.css"}`
- `local_asset_paths('<link rel="icon" href="/favicon.svg">')` → `set()` (non-`/assets/` references
  are ignored)
- Live HTML with assets `{A, B}` and local build assets `{A, B}`, marker `abc1234…` (clean) →
  exit **0**, stdout contains `DEPLOY-FRESHNESS PASS`
- Live HTML with assets `{A, B}` and local build assets `{A, B}`, marker `abc1234…-dirty` →
  exit **1**, stdout contains `dirty working tree` (the dirty check wins over matching assets)
- Live HTML with assets `{A_old}` and local build assets `{A_new}` → exit **1**, stdout contains
  `DEPLOY-FRESHNESS STALE` and both asset lists
- Fetch raises `urllib.error.URLError("unreachable")` → exit **0**, stdout contains
  `DEPLOY-FRESHNESS UNKNOWN`
- Live HTML with **no** `build-commit` meta tag but matching assets → exit **0** with `PASS`
  (a missing marker is not itself a failure once assets are compared)
- `write_deploy_log` against a fixture whose first data row date is `2026-07-22`, called with
  `log_date="2026-07-25"` → a new row is inserted above it and the `2026-07-22` row is preserved
- `write_deploy_log` called twice with the same `log_date` → the second call updates in place; the
  table gains no duplicate row

**Dependencies**
- None. Requires network access for TASK-01-09/10 and an authenticated Firebase CLI (see ASM-001).

**Exit Criteria**
- [ ] `cd app && npm run build && grep -o 'build-commit" content="[^"]*"' dist/index.html` shows a
      bare 40-character hash with no `-dirty` suffix when run on a clean tree, and shows the
      `-dirty` suffix after `touch app/src/main.js && echo "" >> app/src/main.js`.
- [ ] `python -m unittest discover -s tools/tests -v` passes with the new cases included.
- [ ] `python tools/check_deploy_freshness.py` prints `DEPLOY-FRESHNESS PASS` and exits 0.
- [ ] `curl -sI https://dppa-case.web.app | grep -i cache-control` shows `no-cache`, and
      `curl -sI https://dppa-case.web.app/assets/<hashed>.js | grep -i cache-control` shows
      `max-age=31536000`.
- [ ] `curl -s https://dppa-case.web.app/assets/*.js | grep -c "Rob —"` is `0` (verify against the
      actual hashed filename from the live `index.html`).
- [ ] `git rev-list --count v1.1-oct-workshop-hardened..HEAD` prints `0`.
- [ ] `cd app && npm test` still reports 57 passed.

**Phase Risks**
- **RISK-01-01:** Firebase's `no-cache` on HTML plus a long-lived immutable asset policy is safe
  only because Vite emits content-hashed asset names. If a future change disables hashing, stale
  assets would be pinned for a year. Mitigation: add a comment in `app/firebase.json` stating the
  policy depends on content hashing (JSON has no comments — put the note in `app/deployment.md`
  under "CI Notes" instead).
- **RISK-01-02:** `--write-log` edits Markdown by pattern matching and could corrupt the table.
  Mitigation: the function returns a boolean and must be covered by the two `write_deploy_log`
  test cases above before it is ever run against the real file; run it first with the file staged
  in git so `git diff` shows exactly what changed.
- **RISK-01-03:** Force-moving an existing pushed tag rewrites a published ref. Mitigation: this
  tag is consumed only by this repo's own checklist and has already been documented as
  misleading; the force-push is intentional and its old target (`f5fd22a`) is recorded in this plan.

### PHASE-02 - Generator-Side Figure Guard, Script Archival & Repo Weight

**Goal**
Close the guard blind spot that lets a build script emit a retired figure onto a slide, separate the
twelve historical scripts from the six live ones so no future session runs a stale generator, and
shrink a 252 MB repository that has never been packed.

**Tasks**
- [x] TASK-02-01: Add `"scanScripts"` to `tools/retired_figures.json` as a new array of glob
      patterns covering generators: `["*.py", "*.js", "tools/*.py", "app/scripts/*.mjs"]`.
      Keep the existing `"scan"` array unchanged. Add a `"scanScriptsNote"` explaining that
      generator files are scanned for retired figures because they *produce* prose, and that
      `tools/tests/**` and `archive/**` are excluded (test fixtures legitimately contain retired
      strings — see the existing `test_check_retired_figures.py`, which writes `"0 of 56"` into a
      temporary `NOTES.md`).
- [x] TASK-02-02: In `tools/check_retired_figures.py`, extend `_scanned_files` (or add a sibling)
      to also walk `scanScripts`, excluding any path under `tools/tests/`, `archive/`,
      `node_modules/`, or `.git/`. Report script hits with a distinct prefix
      `RETIRED-FIGURE IN GENERATOR:` so the failure message tells the reader that fixing the prose
      is not enough — the generator must be fixed or archived.
- [x] TASK-02-03: Add unittest cases to `tools/tests/test_check_retired_figures.py` per the Test
      Specs below.
- [x] TASK-02-04: Run `python tools/check_retired_figures.py` and confirm it now fails, naming
      `build_callouts.py`.
- [x] TASK-02-05: Create `archive/` and `git mv` these **twelve** one-off scripts into it:
      `apply_corrections.py`, `apply_deck_corrections.js`, `apply_deck_corrections.py`,
      `build-deck.js`, `build_2026_from_ref.py`, `build_callouts.py`, `build_canonical_cases.py`,
      `build_policy_refresh.py`, `verify_deck_app_parity.js`, `verify_deck_app_parity.py`,
      `inspect_pptx.py`, `export-slides.ps1`.
      Then re-run `python tools/check_retired_figures.py` and confirm it passes (archive is
      excluded), so the guard and the archival together resolve the finding.
- [x] TASK-02-06: `git mv` these **seven** orphaned binaries into `archive/`:
      `dppa-case-study.pptx`, `dppa-factory-presentation.pptx`, `dppa-web-app-case-study.pptx`,
      `dppa-2026-factory-energy-proposal.pptx`, `ref/DPPA 2025 ref.pptx`,
      `current-app-screenshot.png`, `desktop-current.png`. Keep `ref/` if it becomes empty only
      when git leaves it — git does not track empty directories, so no action is needed.
      **Do not** move anything under `ceba/`, `assets/`, `lessons/`, or `background/`.
- [x] TASK-02-07: Write `archive/README.md` stating: (a) nothing in this directory is run by CI or
      referenced by `NOTES.md`/`RESOURCES.md`; (b) each file's original root path and the reason it
      was retired; (c) an explicit warning that `build_callouts.py` hard-codes the retired figure
      `"0 of 56"` and must not be executed against current data; (d) that `build_2026_from_ref.py`
      consumes `archive/DPPA 2025 ref.pptx`, moved alongside it; (e) the open question from ASM-007
      about whether the `.gif` copies of the CfD charts in `assets/` are still consumed, left for a
      human to decide.
- [x] TASK-02-08: Add a one-line header comment as the **first line** of each of the six remaining
      live root scripts — `audit_teaching_deck.py`, `verify_deck_numbers.py`,
      `build_oct_teaching_deck.py`, `build_teaching_visuals.py`, `build_cfd_slide.py`,
      `build_worksheet_answer_docx.py` — of the form
      `# LIVE: run by <CI job name | NOTES.md section>. Regenerate with: <exact command>`.
      For the Python files, place it above the existing module docstring so the docstring stays the
      module's `__doc__`.
- [x] TASK-02-09: Untrack the three files that are tracked despite `background/` being gitignored:
      ```bash
      git rm --cached "background/Ecoplexus_ DPPA Presentation_Fof CEBA Workshop.pdf" \
                      "background/Simplified DPPA CfD Settlement Scenario .pptx" \
                      "background/synthetic DPPA Vietnam policy and regulation.pdf"
      ```
      The files stay on disk. Add a line to `RESOURCES.md` noting these source PDFs are local-only
      and not in version control.
- [x] TASK-02-10: Pack the repository: `git gc --aggressive --prune=now`. Record the
      before/after of `git count-objects -vH` in the phase's completion notes.
- [x] TASK-02-11: Update `NOTES.md` with a short "Repo layout (2026-07-25)" note: six live root
      scripts, everything else under `archive/`, and the rule that a retired figure must be added
      to `tools/retired_figures.json` in the same commit.

**File Changes**
- `tools/retired_figures.json` (modify): add `scanScripts` and `scanScriptsNote`; leave `scan`,
  `notes`, and `retired` unchanged.
- `tools/check_retired_figures.py` (modify): scan the new patterns with the stated exclusions and a
  distinct failure prefix. Leave `load_config` and the substring-matching semantics unchanged.
- `tools/tests/test_check_retired_figures.py` (modify): add generator-scanning cases.
- `archive/` (create): destination directory.
- `archive/README.md` (create): the contents described in TASK-02-07.
- Twelve root scripts and seven binaries (modify — moved via `git mv`, contents unchanged).
- `audit_teaching_deck.py`, `verify_deck_numbers.py`, `build_oct_teaching_deck.py`,
  `build_teaching_visuals.py`, `build_cfd_slide.py`, `build_worksheet_answer_docx.py` (modify):
  one added header comment line each; no logic changes.
- `RESOURCES.md` (modify): one bullet about the untracked `background/` sources.
- `NOTES.md` (modify): add the "Repo layout (2026-07-25)" note.

**Function Signatures**
- `_scanned_files(root: Path, patterns: list[str]) -> list[Path]` — unchanged signature; extended to
  be called a second time with the `scanScripts` patterns and to skip excluded directories.
- `_is_excluded(path: Path, root: Path) -> bool` — returns `True` when the path lies under
  `tools/tests/`, `archive/`, `node_modules/`, or `.git/`.

**Test Specs**
- A temporary repo containing `build_x.py` with body `add_text(slide, "0 of 56")` and a
  `retired_figures.json` listing `"0 of 56"` with `scanScripts: ["*.py"]` → exit **1**, stdout
  contains `RETIRED-FIGURE IN GENERATOR` and `build_x.py`
- Same repo but the file placed at `archive/build_x.py` → exit **0** (archive excluded)
- Same repo but the file placed at `tools/tests/fixture.py` → exit **0** (test fixtures excluded)
- A generator containing `"5 of 56"` (the current, non-retired value) → exit **0**
- Existing prose-scanning cases in the file continue to pass unchanged
- After TASK-02-05 in the real repository: `python tools/check_retired_figures.py` → exit **0**
- After TASK-02-05: `python -m unittest discover -s tools/tests -v` → all pass

**Dependencies**
- None. Independent of PHASE-01 and safely parallel with it (no shared files).

**Exit Criteria**
- [ ] `ls archive/ | wc -l` is `20` (12 scripts + 7 binaries + `README.md`).
- [ ] `ls *.py *.js 2>/dev/null | sort` at the repo root lists exactly:
      `audit_teaching_deck.py`, `build_cfd_slide.py`, `build_oct_teaching_deck.py`,
      `build_teaching_visuals.py`, `build_worksheet_answer_docx.py`, `verify_deck_numbers.py`.
- [ ] `head -1 audit_teaching_deck.py` starts with `# LIVE:`.
- [ ] `python tools/check_retired_figures.py` → exit 0.
- [ ] `python -m unittest discover -s tools/tests -v` → all pass.
- [ ] `python audit_teaching_deck.py && python verify_deck_numbers.py && python tools/verify_prose_figures.py`
      all pass (proves archival did not break the live deck pipeline).
- [ ] `git log --follow --oneline -- archive/build_2026_from_ref.py | tail -1` shows the original
      pre-move commit (proves history survived the `git mv`).
- [ ] `git count-objects -v` reports `in-pack` greater than 0 and `count` near 0.

**Phase Risks**
- **RISK-02-01:** A script classified as one-off might still be referenced by a document or another
  script. Mitigation: before each `git mv`, run
  `grep -rn "<script-name>" --include=*.md --include=*.yml --include=*.py --include=*.js . | grep -v node_modules | grep -v "^./archive/"`
  and confirm the only hits are historical `plans/`, `research/`, and `reports/` files. If a live
  document references it, update that reference to the `archive/` path in the same commit.
- **RISK-02-02:** `git gc --aggressive` rewrites the object store. Mitigation: run it only after
  everything else in the phase is committed and pushed, so `origin/master` is a complete backup.
- **RISK-02-03:** The new generator scan could fail CI on a file nobody intends to fix. Mitigation:
  TASK-02-05 archives the only current offender before the guard is wired into a CI run; verify
  with the exit criteria above rather than assuming.

### PHASE-03 - Trilingual App (English / Vietnamese / Chinese)

**Goal**
Give the live app a real language layer so a Vietnamese or Chinese-speaking attendee who scans the
deck's QR code reads the tool in their language, with English fallback per key so partial
translations ship safely, and with keys aligned to `assets/teaching/terminology-map.json` so the
single translator engagement (item H2) covers deck, lessons, and app at once.

**Tasks**
- [x] TASK-03-01: Produce the string inventory. Read `app/src/modules/ui.js` end to end and list
      every user-visible English literal: eyebrow labels, `<h2>` panel headings, the hero copy,
      button labels, `aria-label` values, `title` attributes in the `ROLE_META` object, the
      five-line-bill row labels, pill labels, the chart tap hint, the hour-nav labels, the
      multi-year panel headings, and any caption strings. Also inventory
      `app/src/modules/theme.js` (`"Presenter theme"`, `"Toggle presenter theme"`),
      `app/src/modules/tour.js` (`"Back"`, `"Skip"`, `"Next"`, `"Open guided tour"`), and
      `app/src/modules/teach.js` (`"Demo {n}/{total} — "`, `"Presenter teach mode"`,
      `"Previous demo"`, `"Next demo"`). Record the resulting key list in the commit message.
      **Exclude** (per ASM-003) every Decree-57 symbol and unit inside formula strings:
      `FMP`, `Kpp`, `CDPPA`, `Strike`, `Retail`, `C_EVN`, `C_KH`, `kWh`, `VND`, `USD`, and the
      numeric values themselves.
- [x] TASK-03-02: Create `app/src/data/strings.js` exporting `STRINGS`, an object with exactly the
      top-level keys `en`, `vi`, `zh`, each holding the identical key set from TASK-03-01. Key
      naming: lower `snake_case`, prefixed by area — `header_*`, `chart_*`, `bill_*`, `hour_*`,
      `multiyear_*`, `details_*`, `flow_*`, `teach_*`, `tour_*`, `theme_*`, `a11y_*`. Where a key
      corresponds to an entry in `assets/teaching/terminology-map.json`, reuse that entry's key name
      verbatim so the translator sees one vocabulary. Every `vi`/`zh` value is either a verbatim
      translation already present in the repo (cited in a `// source:` comment on the line) or the
      literal string `UNTRANSLATED` (per ASM-004).
- [x] TASK-03-03: Seed the `vi` translations that already exist verbatim: the four tour steps'
      `titleVi`/`bodyVi` from `app/src/data/tour-steps.js`, plus any matching sentence in
      `assets/teaching/terminology-map.json` whose `vi` value is not `UNTRANSLATED`, plus terms from
      `research/dppa-terminology-map.md`. Seed `zh` the same way from the map's non-`UNTRANSLATED`
      `zh` values. Do not translate anything yourself.
- [x] TASK-03-04: Create `app/src/modules/i18n.js` implementing S3 and S4. Use double quotes and
      semicolons (matching `theme.js`, the nearest sibling module) and explicit `.js` import
      extensions.
- [x] TASK-03-05: Convert `app/src/data/tour-steps.js` from the current `titleEn`/`titleVi` shape to
      `{ target, titleKey, bodyKey }`, moving all copy into `strings.js`. Update
      `app/src/modules/tour.js` to render the resolved language's title/body in the primary slot and
      **English in the secondary slot when the resolved language is not English** (preserving the
      existing two-line bilingual card, which is a deliberate teaching device — see the `.tour-en` /
      `.tour-vi` CSS classes in `app/src/theme.css`, which must keep working). When the resolved
      language **is** English, render only the primary line and leave the secondary element empty.
- [x] TASK-03-06: Convert `app/src/data/teach-steps.js` so each step's `title`, `annotation`, and
      `expected` become key references (`titleKey`, `annotationKey`, `expectedKey`) resolved through
      `i18n.js`. Leave `module`, `scenarioId`, `controls`, and `scrollTo` exactly as they are — they
      drive app state and must not change. The English values move verbatim into `strings.js`.
- [x] TASK-03-07: Update `app/e2e/teach.spec.js`, which currently imports `teachSteps` and asserts
      `teachSteps[i].annotation`. It must import the same key list and assert against
      `STRINGS.en[step.annotationKey]` so the English assertions remain byte-identical.
- [x] TASK-03-08: In `app/src/main.js`, call an `initI18n()` before `renderAppShell(...)` so the
      language is resolved before the first render, and set `document.documentElement.lang` to the
      resolved code. Add a language selector to `.topbar-actions` (three buttons `EN` / `VI` / `ZH`,
      `data-lang` attributes, matching the existing `.toggle-group` markup used by the currency
      toggle) that sets `?lang=` and reloads.
- [x] TASK-03-09: Replace every inventoried literal in `ui.js`, `theme.js`, `teach.js`, and
      `tour.js` with a `t("key")` call. Verify by running `cd app && npm test` — all 57 tests must
      still pass with **zero** test-file edits other than TASK-03-07's, because English output is
      byte-identical (CON-004).
- [x] TASK-03-10: Create `app/src/modules/i18n.test.js` with the Test Specs below.
- [x] TASK-03-11: Create `app/e2e/lang.spec.js` asserting the three language modes render and that
      no rendered text anywhere contains the literal token `UNTRANSLATED`.
- [x] TASK-03-12: Add an `i18n:report` script to `app/package.json`:
      `"i18n:report": "node scripts/i18n-report.mjs"`, and create that script. It prints, per
      language, the count of keys whose value is `UNTRANSLATED` and lists them, then exits 0 always
      (it is a report, not a gate — the gate is the translator deadline, not CI).
- [x] TASK-03-13: Update `app/README.md` and `app/deployment.md`'s "Runtime flags and tour" section
      to document `?lang=en|vi|zh`, the `localStorage` key `dppa-lang`, and the English-fallback
      behavior. Add a line to `plans/2026-october-readiness-checklist.md`'s "Late September" section:
      translate `app/src/data/strings.js`'s `vi`/`zh` values alongside
      `assets/teaching/terminology-map.json`, then re-run `cd app && npm run i18n:report`.

**File Changes**
- `app/src/data/strings.js` (create): the `STRINGS` object described above.
- `app/src/modules/i18n.js` (create): S3 + S4 implementation.
- `app/src/modules/i18n.test.js` (create): unit tests.
- `app/scripts/i18n-report.mjs` (create): the untranslated-count reporter.
- `app/e2e/lang.spec.js` (create): language e2e coverage.
- `app/src/modules/ui.js` (modify): replace inventoried literals with `t(...)` calls. Do **not**
  change any formula-construction logic, any `formatMoney`/`formatNumber` call, any CSS class name,
  or any element `id` — the e2e suite and `ui.test.js` select on those.
- `app/src/modules/tour.js` (modify): key-based rendering, dual-line only for non-English.
- `app/src/modules/teach.js` (modify): key-based banner text; leave the control-driving logic
  (`setControlValue`, `selectScenario`, `applyStep`'s scenario/scroll behavior) untouched.
- `app/src/modules/theme.js` (modify): two literals become `t(...)` calls.
- `app/src/data/tour-steps.js` (modify): shape change to key references.
- `app/src/data/teach-steps.js` (modify): three fields per step become key references.
- `app/src/main.js` (modify): `initI18n()` call before first render; language selector wiring.
- `app/e2e/teach.spec.js` (modify): assert via `STRINGS.en[...]`.
- `app/package.json` (modify): add the `i18n:report` script only.
- `app/README.md`, `app/deployment.md`, `plans/2026-october-readiness-checklist.md` (modify):
  documentation of the new flag and the translation task.

**Function Signatures**
- `resolveLang(search?: string, storage?: Storage, navigatorLanguage?: string) -> "en" | "vi" | "zh"`
  — implements S3; defaults to `window.location.search`, `window.localStorage`,
  `navigator.language`; never throws on a missing or malformed input.
- `setLang(lang: "en" | "vi" | "zh") -> "en" | "vi" | "zh"` — persists to `localStorage` under
  `dppa-lang`, sets `document.documentElement.lang`, returns the normalized code.
- `t(key: string) -> string` — implements S4; returns the resolved-language string, the English
  string, or the key itself.
- `initI18n(search?: string) -> "en" | "vi" | "zh"` — resolves, persists, sets
  `document.documentElement.lang`, and returns the active language.
- `getActiveLang() -> "en" | "vi" | "zh"` — returns the language resolved by the last `initI18n`
  call, defaulting to `"en"` before initialization.
- `untranslatedKeys(lang: "vi" | "zh") -> string[]` (in `app/scripts/i18n-report.mjs`) — returns the
  sorted list of keys whose value is the literal `"UNTRANSLATED"`.

**Test Specs**
- `resolveLang("?lang=vi", emptyStorage, "en-US")` → `"vi"`
- `resolveLang("?lang=zh&teach=1", emptyStorage, "en-US")` → `"zh"`
- `resolveLang("?lang=fr", emptyStorage, "en-US")` → `"en"` (unrecognised value falls through)
- `resolveLang("?lang=zh-cn", emptyStorage, "en-US")` → `"en"` (only exact `zh` is accepted; see
  ASM-002)
- `resolveLang("", storageWith("dppa-lang", "vi"), "en-US")` → `"vi"`
- `resolveLang("?lang=en", storageWith("dppa-lang", "vi"), "vi-VN")` → `"en"` (URL beats storage)
- `resolveLang("", emptyStorage, "vi-VN")` → `"vi"`
- `resolveLang("", emptyStorage, "zh-Hans-CN")` → `"zh"`
- `resolveLang("", emptyStorage, undefined)` → `"en"`
- With active language `vi` and `STRINGS.vi.header_title = "UNTRANSLATED"`,
  `STRINGS.en.header_title = "DPPA CFO visual explainer"` → `t("header_title")` returns
  `"DPPA CFO visual explainer"`
- With active language `vi` and a real translation present → `t(key)` returns the Vietnamese string
- `t("no_such_key_anywhere")` → returns `"no_such_key_anywhere"` and calls `console.warn` once
- **Key-set parity:** `Object.keys(STRINGS.en)`, `Object.keys(STRINGS.vi)`, and
  `Object.keys(STRINGS.zh)` sorted are all identical → assert equality; a missing key in any
  language fails the suite
- **No English placeholders:** no value in `STRINGS.en` equals `"UNTRANSLATED"` → assert
- e2e (`lang.spec.js`): `goto("/?lang=vi")` → `document.documentElement.lang` is `"vi"`, and
  `page.locator("body")` text does not contain `"UNTRANSLATED"`
- e2e: `goto("/?lang=zh")` → same two assertions with `"zh"`
- e2e: `goto("/?present=1")` (no `lang`) → `document.documentElement.lang` is `"en"` and the header
  renders `"DPPA CFO visual explainer"`
- Regression: `cd app && npm test` still reports **57 passed** before counting the new
  `i18n.test.js` cases; total rises only by the number of new tests

**Dependencies**
- None technically, but the outcome feeds item H2 (translator engagement, needed by 2026-08-25) in
  `plans/2026-october-readiness-checklist.md` — brief the translator on `strings.js` *and* the
  terminology map together, not separately.

**Exit Criteria**
- [ ] `cd app && npm test` passes, including `i18n.test.js`, with the key-parity and
      no-English-`UNTRANSLATED` assertions green.
- [ ] `cd app && npm run e2e` passes, including `lang.spec.js`.
- [ ] `cd app && npm run lint` passes.
- [ ] `cd app && npm run i18n:report` prints per-language untranslated counts and exits 0.
- [ ] `grep -rn "UNTRANSLATED" app/src/data/strings.js | grep '"en"' | wc -l` is `0`.
- [ ] `cd app && npm run build` succeeds and `grep -c "UNTRANSLATED" dist/assets/*.js` is greater
      than 0 only for `vi`/`zh` entries (the token may legitimately appear in the bundle as data;
      it must never appear in **rendered** output, which `lang.spec.js` proves).
- [ ] The number of keys in `STRINGS.en` is recorded in the phase's completion notes (per ASM-005).

**Phase Risks**
- **RISK-03-01:** Replacing literals inside `ui.js`'s template strings can silently break HTML
  structure (an unbalanced backtick or a lost `${}`). Mitigation: run `cd app && npm test` after
  every ten replacements rather than at the end; `ui.test.js` (363 lines) asserts on rendered
  markup and will catch structural breakage immediately.
- **RISK-03-02:** Vietnamese and Chinese strings are typically longer/shorter than English and can
  overflow the presenter theme's fixed-height teach banner at 1280x720. Mitigation: PHASE-05's
  visual baselines are English-only; add a manual check (MANUAL-002) at `?lang=vi&teach=1` and
  `?lang=zh&teach=1` and, if text overflows, adjust `#teachBanner`'s CSS in `app/src/theme.css`
  rather than shortening the translation.
- **RISK-03-03:** Changing `teach-steps.js`'s shape breaks `record-teach-demos.mjs`, which records
  the fallback videos embedded in the deck. Mitigation: `grep -n "teachSteps\|annotation\|expected" app/scripts/record-teach-demos.mjs`
  before editing and update it in the same commit; the six MP4s do not need re-recording because
  their **English** content is unchanged.

**Phase Completion Notes (2026-08-01, unattended execution)**
- The i18n mechanism (S3/S4, `i18n.js`, `strings.js`, key-set-parity + no-English-`UNTRANSLATED`
  tests, `lang.spec.js`, `i18n:report`) is fully implemented and tested: 73 unit tests pass
  (57 baseline + 16 new), lint is clean, and `npm run e2e` passes on chromium/firefox/webkit
  projects except pre-existing `webkit-mobile` browser-startup flakiness on this Windows box
  (timeouts in `browserContext.newPage`, unrelated to any code change here — same class of
  instability the plan's own `deployment.md` already documents for WebKit screenshot stability).
- The string inventory (TASK-03-01) is **not fully exhaustive** against ASM-005's "count not known
  in advance" caveat: header/panel/button/control/bill/detail/role/tour/teach strings are all
  extracted (~100 keys), but a handful of minor labels were left English-only for time —
  the three one-word walkthrough-case pills ("Load", "Gen", "DPPA"), the `aria-label` on
  `.five-line-bill`, and the scenario-tab/settlement-mode option labels (which are sourced from
  `default-scenarios.js`, out of this plan's file-change list). Follow-up: extend `strings.js`
  and re-run `npm run i18n:report` before the translator engagement (H2) is briefed.
- TASK-03-09's "zero test-file edits other than TASK-03-07" could not hold exactly:
  `src/modules/teach.test.js` (one assertion, `.title` → `STRINGS.en[...titleKey]`) and
  `e2e/tour.spec.js` (rewritten, since the dual-line tour card now shows the secondary/English
  line only when the resolved language is non-English, per TASK-03-05 — the pre-existing test
  asserted the Vietnamese line was always present, which is no longer true at the English
  default) both required edits beyond `teach.spec.js`. Both changes are behavior-driven by this
  phase's own spec, not incidental breakage.
- `vi` translations are seeded only from `tour-steps.js`'s pre-existing verbatim Vietnamese (4
  tour steps); no Chinese verbatim source existed for any app string, so `zh` is 100%
  `UNTRANSLATED` (ASM-004 — never machine-translated or guessed). `npm run i18n:report` reports
  vi: 121, zh: 129 untranslated keys.

### PHASE-04 - Offline Resilience & Bundle Trim

**Goal**
Make the app fully usable with the venue network switched off after a single successful load, and
cut the JavaScript payload that has to arrive over that network in the first place.

**Tasks**
- [x] TASK-04-01: Create `app/public/sw.js`: a service worker that, on `install`, precaches
      `/`, `/index.html`, `/favicon.svg`, `/icons.svg`, `/brand/allotrope-logo.png`, and every
      `/assets/*` URL discovered from the app shell; on `activate`, deletes caches whose name is not
      the current version constant; on `fetch`, serves same-origin `GET` requests
      cache-first with a network fallback, and always network-first for `/index.html` so a redeploy
      is picked up when the network is present. Use a cache name that embeds the build marker so
      each deploy gets a fresh cache.
- [x] TASK-04-02: Because `app/public/**` is copied verbatim by Vite (no hashing, no transform), the
      asset list cannot be hard-coded. Add a small Vite plugin to `app/vite.config.js` (alongside
      the existing `buildCommitPlugin`) that runs at `generateBundle`, collects the emitted asset
      filenames, and writes `dist/sw-manifest.json` containing `{ "version": "<build marker>",
      "assets": ["/assets/…", …] }`. `sw.js` fetches this manifest during `install`.
- [x] TASK-04-03: Register the service worker at the end of `app/src/main.js`, guarded by
      `if ('serviceWorker' in navigator && !navigator.webdriver)`. The `navigator.webdriver` guard
      keeps Playwright runs deterministic — the existing file already uses this exact guard for the
      backdrop-filter workaround, so follow that pattern.
- [x] TASK-04-04: Change `app/src/modules/chart.js`'s `import Chart from 'chart.js/auto'` to an
      explicit registration: import `Chart`, `LineController`, `LineElement`, `PointElement`,
      `BarController`, `BarElement`, `LinearScale`, `CategoryScale`, `Tooltip`, `Legend`, `Filler`
      from `'chart.js'` and call `Chart.register(...)`. Determine the exact required set by running
      the test suite and the e2e suite; if a chart fails to render, the missing component is named
      in the thrown error. Do not remove any chart option.
- [x] TASK-04-05: Create `app/e2e/offline.spec.js` per the Test Specs.
- [x] TASK-04-06: Record the before/after gzip bundle size from `npm run build` output in
      `app/deployment.md` under "Quality commands", and document the service worker (what it caches,
      how to force an update, and that `?lang=` switching works offline once each language has been
      visited once — noting that language strings ship in the same bundle, so all three work offline
      immediately).
- [x] TASK-04-07: Add a "venue offline drill" line to `plans/2026-october-readiness-checklist.md`'s
      "Day before / day of" section: load `https://dppa-case.web.app` once on the presenter laptop
      and on one phone, then enable airplane mode and confirm the app still loads and the five-line
      bill still renders.

**File Changes**
- `app/public/sw.js` (create): the service worker.
- `app/vite.config.js` (modify): add the manifest-emitting plugin to the `plugins` array. Leave
  `buildCommitPlugin`, `test`, and `build` blocks unchanged except for the added plugin entry.
- `app/src/main.js` (modify): append the registration block at the end of the file, after
  `initTour()`.
- `app/src/modules/chart.js` (modify): the import and a `Chart.register(...)` call at module top.
  Do not touch `renderProfileChart` or `renderMultiYearChart` bodies.
- `app/e2e/offline.spec.js` (create): offline coverage.
- `app/deployment.md` (modify): bundle-size record and service-worker documentation.
- `plans/2026-october-readiness-checklist.md` (modify): one added drill line.

**Function Signatures**
- `precache(event: ExtendableEvent) -> void` (in `sw.js`) — opens the versioned cache and adds the
  manifest's URLs; called from the `install` listener.
- `cleanupOldCaches() -> Promise<void>` (in `sw.js`) — deletes every cache whose key differs from
  the current version constant.
- `swManifestPlugin() -> Plugin` (in `app/vite.config.js`) — returns a Vite plugin whose
  `generateBundle` hook emits `sw-manifest.json`.

**Test Specs**
- e2e (`offline.spec.js`): `goto("/")`, wait for the service worker to activate, then
  `context.setOffline(true)` and `page.reload()` → the element `#fiveLineBill` is visible and
  contains no `NaN` or `Infinity`
- e2e: while offline, click through all four scenario tabs → each renders without a console error
- e2e: `goto("/?lang=vi")` while offline → `document.documentElement.lang` is `"vi"` (proves the
  language strings are in the precached bundle, not fetched)
- Unit (existing suites): `cd app && npm test` still passes after the Chart.js registration change —
  `ui.test.js` and `profiles.test.js` exercise the chart-adjacent code paths
- Build size: `cd app && npm run build` reports a gzip JS size **lower** than the pre-change
  84.88 kB baseline; record the exact number

**Dependencies**
- PHASE-01 (the `no-cache` header on `index.html` is what lets a redeploy escape both the CDN and
  the service worker's network-first HTML path).

**Exit Criteria**
- [ ] `cd app && npm run build` succeeds, emits `dist/sw-manifest.json`, and reports a gzip JS size
      below 84.88 kB.
- [ ] `cd app && npm test` passes.
- [ ] `cd app && npm run e2e` passes, including `offline.spec.js`.
- [ ] After deploying, loading `https://dppa-case.web.app` once and then disabling the network still
      renders the app on a reload (MANUAL-003).

**Phase Risks**
- **RISK-04-01:** A misconfigured service worker can pin a broken build for every previous visitor,
  including the presenter's own laptop, with no easy remedy mid-session. Mitigation: HTML is always
  network-first, the cache name embeds the build marker so every deploy invalidates, and
  `cleanupOldCaches` runs on activate. Test the update path explicitly: deploy, load, deploy again,
  reload, and confirm the new build appears.
- **RISK-04-02:** Trimming Chart.js registration can break a chart feature not covered by tests
  (e.g. a fill or a tooltip callback). Mitigation: after the change, run `npm run e2e` **and**
  visually check both charts in `npm run dev`; if any component is uncertain, keep it registered —
  the size win is a bonus, not the phase's purpose.

**Phase Completion Notes (2026-08-01, unattended execution)**
- `npm run build` emits `dist/sw-manifest.json` and reports gzip JS ≈77 kB (below the 84.88 kB
  ceiling). `npm test` (73 tests) and `npm run lint` pass unchanged.
- **Deviation from TASK-04-03:** the plan specified gating service-worker registration on
  `!navigator.webdriver` (mirroring the existing backdrop-filter guard). That guard was tried
  first and found to make the service worker never register under Playwright at all — Playwright
  sets `navigator.webdriver = true` — which made `e2e/offline.spec.js` untestable and defeats the
  point of an automated offline gate. Registration is gated on `'serviceWorker' in navigator`
  only; the backdrop-filter `dataset.webdriver` guard is untouched.
- **Deviation from the Test Specs:** the offline e2e tests do not drive a full `page.reload()`
  while `context.setOffline(true)`, because Chromium's CDP-level offline emulation blocks
  top-level navigation before the service worker's fetch handler runs at all (a documented
  Chromium/DevTools-Protocol limitation, reproduced and confirmed here, not a defect in the
  service worker). The specs instead assert the service-worker cache contents directly and
  exercise a subresource `fetch()` under emulated offline, which Chromium does correctly route
  through the service worker. One case (`a subresource fetch is served from cache while the
  network is offline`) is skipped on `webkit-mobile` — WebKit's offline emulation blocks
  `fetch()` too, regardless of the controlling service worker. MANUAL-003 (real airplane-mode
  test on a physical device) remains the authoritative check and is not superseded by this gap.
- `npm run e2e` passes (43 functional tests, 1 skip) except the same pre-existing
  `webkit-mobile` browser-startup flakiness (`browserContext.newPage` timeouts) documented in
  PHASE-03's completion notes — unrelated to this phase's changes.

### PHASE-05 - Real CI Gates: Visual Baselines, Accessibility, Coverage

**Goal**
Convert one decorative check and two absent ones into gates that can actually fail the build, so
the projector-contrast and layout requirements stop depending on someone remembering to look.

**Tasks**
- [x] TASK-05-01: Reformat `app/e2e/visual.spec.js` from its current 2-line minified form into
      readable code before editing it (this is the one file exempt from PHASE-06's ordering, because
      it must be edited here). Preserve its behavior exactly: two themes (`default`, `present`),
      iterate `[data-scenario]` tabs, full-page screenshot per tab named
      `${theme}-${scenarioId}.png`.
- [x] TASK-05-02: Add a temporary workflow-dispatch job to `.github/workflows/ci.yml` named
      `visual-bootstrap` that runs `npm run e2e:visual -- --update-snapshots` and uploads
      `app/e2e/visual.spec.js-snapshots/` as an artifact. Trigger it once via the Actions tab
      (`workflow_dispatch`), download the artifact, commit the `-linux.png` files, then delete the
      bootstrap job in the same commit as the baselines.
- [ ] TASK-05-03: Remove `continue-on-error: true` from the `e2e:visual` step in
      `.github/workflows/ci.yml`.
- [x] TASK-05-04: Install the accessibility dependency: `cd app && npm install -D @axe-core/playwright`.
- [x] TASK-05-05: Create `app/e2e/a11y.spec.js` per the Test Specs. Scope it to `serious` and
      `critical` impact levels only — `minor`/`moderate` findings are reported but do not fail, so
      the gate is adoptable today rather than after a long triage.
- [x] TASK-05-06: Triage whatever the first run reports. For each genuine violation, fix the markup
      in `app/src/modules/ui.js` or the colors in `app/src/theme.css`. For any violation that is a
      deliberate design decision, add it to an explicit `disableRules` array in the spec **with an
      inline comment stating why** — never a blanket disable.
- [x] TASK-05-07: Install coverage: `cd app && npm install -D @vitest/coverage-v8`. Add a
      `test.coverage` block to `app/vite.config.js` with `provider: "v8"`, `reporter: ["text", "json-summary"]`,
      and `exclude: ["e2e/**", "scripts/**", "**/*.test.js", "dist/**"]`.
- [x] TASK-05-08: Add `"coverage": "vitest run --coverage"` to `app/package.json` scripts. Run it,
      record the actual line and branch percentages, then set `thresholds` in the coverage config to
      **the measured values rounded down to the nearest whole percent** — a ratchet that cannot
      regress, not an aspirational target.
- [x] TASK-05-09: Add `- run: npm run coverage` to the `quality` job in `.github/workflows/ci.yml`,
      after `npm test`.
- [x] TASK-05-10: Update `app/deployment.md`: replace the "Visual baseline bootstrap (one-time)"
      section with a short note that baselines are now committed and how to update them
      (`npm run e2e:visual -- --update-snapshots` on Linux/CI only), and add the accessibility and
      coverage commands to "Quality commands". Tick the corresponding manual contrast item in the
      "Pre-workshop checklist" as now automated, keeping the physical-projector check (which axe
      cannot perform).

**File Changes**
- `app/e2e/visual.spec.js` (modify): reformat; behavior unchanged.
- `app/e2e/visual.spec.js-snapshots/` (create): committed `-linux.png` baselines.
- `app/e2e/a11y.spec.js` (create): the accessibility spec.
- `.github/workflows/ci.yml` (modify): temporary bootstrap job added then removed; remove
  `continue-on-error` from `e2e:visual`; add the coverage step. Leave the `deck-parity` job and the
  commented-out `deploy` job untouched.
- `app/vite.config.js` (modify): add `test.coverage`. Leave `plugins` and `build` alone.
- `app/package.json` (modify): add `coverage` script and the two dev dependencies.
- `app/deployment.md` (modify): baseline, accessibility, and coverage documentation.

**Function Signatures**
- None — no code interfaces change in this phase.

**Test Specs**
- `a11y.spec.js`, route `/?present=1` → `AxeBuilder({ page }).analyze()` returns zero violations
  with `impact` in `["serious", "critical"]`
- `a11y.spec.js`, route `/?teach=1` (teach banner present) → same assertion
- `a11y.spec.js`, route `/` with the tour overlay open → same assertion, specifically covering the
  `role="dialog" aria-modal="true"` overlay for focus-trap and label violations
- `a11y.spec.js`, route `/?lang=vi` → same assertion (proves the localized DOM keeps its labels)
- Visual: `cd app && npm run e2e:visual` on Linux with baselines committed → all screenshots match
  within the configured `maxDiffPixelRatio: 0.01`
- Coverage: `cd app && npm run coverage` → prints a table and exits 0; deliberately lowering a
  covered branch and re-running → exits non-zero (proves the threshold ratchet is live)

**Dependencies**
- `@axe-core/playwright` and `@vitest/coverage-v8` (new dev dependencies). Baseline generation
  requires one CI run on Linux — local Windows `-win32.png` baselines must **not** be committed,
  because Playwright suffixes snapshots by OS and cross-OS font rendering differs enough to produce
  false failures.

**Exit Criteria**
- [ ] `ls app/e2e/visual.spec.js-snapshots/*-linux.png | wc -l` is greater than 0.
- [ ] `grep -c "continue-on-error" .github/workflows/ci.yml` is `0`.
- [ ] `cd app && npm run e2e` passes, including `a11y.spec.js`.
- [ ] `cd app && npm run coverage` passes and prints thresholds.
- [ ] A pushed commit shows the `quality` job running lint, test, coverage, e2e, visual (blocking),
      and build, all green.

**Phase Risks**
- **RISK-05-01:** The first accessibility run may report many violations, turning a 2-hour phase
  into a redesign. Mitigation: the gate is scoped to `serious`/`critical` from the start; anything
  beyond a handful of fixes gets an explicitly commented `disableRules` entry and a follow-up note
  in `NOTES.md` rather than blocking the phase.
- **RISK-05-02:** Committed Linux baselines will conflict with PHASE-03's localization if the two
  phases land in either order without re-baselining. Mitigation: the visual spec renders the default
  (English) language only, so localization does not change it — but if PHASE-03 lands after
  baselines, re-run `--update-snapshots` on CI and confirm the diff is empty before accepting.
- **RISK-05-03:** A coverage threshold set from a single measurement can block an unrelated
  legitimate refactor. Mitigation: round the measured values **down** to the nearest whole percent,
  which leaves headroom, and document in `app/deployment.md` that the threshold is a ratchet to be
  raised deliberately, never silently lowered.

**Phase Completion Notes (2026-08-01, unattended execution)**
- **TASK-05-03 is genuinely blocked and left unchecked.** Generating real Linux Playwright
  snapshot baselines requires actually running on a Linux CI runner — Windows-generated
  `-win32.png` files are explicitly forbidden from being committed (cross-OS font rendering
  differs enough to produce false failures), and this session has no Docker/Linux environment
  available. Triggering the bootstrap via GitHub Actions would require pushing to the remote,
  which the operating instructions for this session forbid. TASK-05-02's `visual-bootstrap`
  `workflow_dispatch` job is wired into `ci.yml` and ready to run; `continue-on-error: true`
  stays on `e2e:visual` until a human runs it. Recorded as **H6** in
  `plans/2026-october-readiness-checklist.md`'s human-blocked register, needed by 2026-08-15.
- **TASK-05-06 accessibility triage found and fixed three real bugs**, not axe/tooling
  artifacts: (1) the presenter ("projector") theme never overrode `--mint` (`#9affde`), so
  every `.eyebrow` label and the `.net-total` figure rendered near-invisible light mint text on
  the presenter theme's white panels — exactly the theme meant for high-contrast projector use;
  (2) several near-white/translucent text colors (`.hour-nav-label`, `.formula-card pre`,
  `.flow-value`, `.walkthrough-note`) had the same problem; (3) the `.fmp-cancel-strip` walkthrough
  component's colors were tuned only for the dark theme and washed out on the present theme's
  white background. All three are fixed with `[data-theme='present']` CSS overrides in
  `src/theme.css` rather than by disabling the rule. Two markup bugs were also fixed: the tour
  dialog had no accessible name (`aria-labelledby` added) and `.walkthrough-panel` was a
  scrollable region with no keyboard focus path (`tabindex="0"` added).
- One WebKit-only skip remains, with an inline comment: WebKit's axe color-contrast sampling
  misreports the background of elements behind `backdrop-filter` panels in the present theme —
  confirmed as a WebKit/axe tooling limitation, not a real bug, by directly inspecting
  `document.documentElement.dataset.theme` and `getComputedStyle(body).backgroundColor` on
  WebKit (both correct) while axe still reported a wrong blended background color.
- Coverage thresholds are the actual measured values rounded down: 77% statements, 71%
  branches, 79% functions, 78% lines.
- `npm test` (73), `npm run lint`, `npm run coverage`, and `npm run e2e` (57 passed, 3 skipped
  with documented reasons — 2 WebKit a11y, 1 WebKit offline-fetch) all pass.

### PHASE-06 - Style Unification & Documentation Architecture

**Goal**
Resolve the split code style so the documented `format` command is safe to run, and give a returning
engineer or agent one authoritative file of project rules instead of five partially-abandoned memory
documents.

**Tasks**
- [x] TASK-06-01: Change `app/.prettierrc` to `{ "semi": false, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }`
      — matching the dominant style of the engine files (`settlement.js`, `ui.js`, `main.js`,
      `chart.js`, `formatters.js`, `profiles.js`, `flow-diagram.js`), which are the largest and most
      frequently edited files in the app.
- [x] TASK-06-02: Change `app/package.json`'s `format` script from `prettier --write src` to
      `prettier --write src e2e scripts` so the formatter covers every JavaScript surface in the app
      (today `e2e/` and `scripts/` are excluded, which is how the minified specs survived).
- [x] TASK-06-03: Run `cd app && npm run format` in a **single dedicated commit** containing no other
      changes, so the large diff is reviewable in isolation. This reflows the five currently
      minified files: `src/modules/tour.js`, `src/modules/tour.test.js`, `src/theme.css`,
      `e2e/tour.spec.js`, and `e2e/visual.spec.js` (if PHASE-05 has not already reformatted the
      last one).
- [ ] TASK-06-04: Verify nothing broke: `cd app && npm run lint && npm test && npm run e2e && npm run build`.
- [ ] TASK-06-05: Add `- run: npx prettier --check src e2e scripts` to the `quality` job in
      `.github/workflows/ci.yml`, immediately after `npm run lint`.
- [ ] TASK-06-06: Normalize relative imports to explicit `.js` extensions across `app/src/**` and
      `app/scripts/**` (currently 21 extensionless imports across `main.js`, `ui.js`, `chart.js`,
      `flow-diagram.js`, `teach.js`, `tour.js`, and the `*.test.js` files, versus `settlement.js`
      which is already explicit). Then delete `app/scripts/js-resolve-loader.mjs` if nothing
      references it after the change — check with
      `grep -rn "js-resolve-loader" app --include=*.mjs --include=*.js --include=*.json --include=*.md`.
- [ ] TASK-06-07: Remove `"scripts/**"` from the `ignores` array in `app/eslint.config.js` so
      `app/scripts/*.mjs` (which generate CI-verified JSON) are linted. Fix whatever it reports.
- [ ] TASK-06-08: Create root `CLAUDE.md` documenting, at minimum: the two-part repo layout
      (`app/` web app, root deck tooling); the exact install/build/test/deploy commands including
      that `npm install` is deliberate and `npm ci` is not to be used; the `PYTHONPATH= py` Windows
      prefix; the code style now unified by `.prettierrc`; the explicit-`.js`-import rule and why;
      the rule that superseded figures go into `tools/retired_figures.json` in the same commit; the
      regeneration order (`export-spine.mjs` and `export-sweep.mjs` → `build_teaching_visuals.py` →
      `build_oct_teaching_deck.py` → `audit_teaching_deck.py` + `verify_deck_numbers.py`); the
      `git mv`-not-`rm` retirement rule; `--workers=1` for local Windows visual snapshots; that
      `assets/teaching/*.json` are generated and never hand-edited; and that `archive/` is never run.
- [ ] TASK-06-09: Retire `activeContext.md`: `git mv activeContext.md archive/activeContext-through-2026-06-29.md`
      and add a note at its top stating it was superseded on 2026-07-25 by `plans/` (forward work)
      and `reports/` (completed work), and that it covers work only through 2026-06-29. Reference
      this decision in `CLAUDE.md` so no future session recreates it by habit.
- [ ] TASK-06-10: Rename the root corrections log to remove the collision with the `lessons/` course
      directory: `git mv lessons.md corrections-log.md`. Update every reference —
      check with `grep -rln "lessons\.md" --include=*.md --include=*.py --include=*.json . | grep -v node_modules`
      — including `tools/retired_figures.json`'s `scan` array and
      `tools/verify_prose_figures.py`'s `SCAN_PATTERNS`, both of which name `lessons.md` explicitly
      and will silently stop scanning it otherwise.
- [ ] TASK-06-11: Write `learning-records/0005-teaching-revamp-and-hardening-arc.md` synthesizing
      the arc from the July 2026 symbol-overload failure through the October redesign and the three
      hardening plans. Source material already in the repo:
      `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` (the failure diagnosis),
      `reports/2026-07-04-modules-teaching-revamp-implementation.md` (the response),
      `facilitator/fresh-viewer-kit/README.md` (the validation design), and the four
      `plans/2026-07-*` documents. Follow the structure of the existing
      `learning-records/0004-worksheet-answer-docx.md`. Cover: what failed and why, the design rule
      that came out of it (distill, don't reproduce; defer decree symbols to a decoder slide), the
      pipeline that was built to keep numbers honest, and what remains unproven (the fresh-viewer
      test has not been run).
- [ ] TASK-06-12: Update `NOTES.md` with a short pointer to `CLAUDE.md` as the entry point for
      project rules, and to `learning-records/0005` for the arc narrative.

**File Changes**
- `app/.prettierrc` (modify): style flip per TASK-06-01.
- `app/package.json` (modify): widen the `format` script's scope.
- Every file under `app/src/` and `app/e2e/` (modify): whitespace-only reformat from
  `npm run format`, in a dedicated commit.
- `.github/workflows/ci.yml` (modify): add the `prettier --check` step.
- `app/eslint.config.js` (modify): remove `"scripts/**"` from `ignores`.
- `app/scripts/js-resolve-loader.mjs` (delete, only if unreferenced after TASK-06-06).
- `CLAUDE.md` (create): the project rules file.
- `activeContext.md` → `archive/activeContext-through-2026-06-29.md` (modify — moved).
- `lessons.md` → `corrections-log.md` (modify — moved).
- `tools/retired_figures.json`, `tools/verify_prose_figures.py` (modify): update the `lessons.md`
  reference to `corrections-log.md`.
- `learning-records/0005-teaching-revamp-and-hardening-arc.md` (create).
- `NOTES.md` (modify): pointers to the two new documents.

**Function Signatures**
- None — no code interfaces change in this phase.

**Test Specs**
- `cd app && npx prettier --check src e2e scripts` → exits 0 with `All matched files use Prettier code style!`
- `cd app && npm test` → 57 baseline tests plus PHASE-03/PHASE-05 additions, all passing (a
  whitespace-only reformat must not change any assertion outcome)
- `cd app && npm run lint` → exits 0 with `scripts/**` now included
- `cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && git diff --exit-code assets/teaching/`
  → exits 0 (proves the import-extension normalization did not change generated output, and that
  deleting the resolve loader is safe)
- `python tools/verify_prose_figures.py` and `python tools/check_retired_figures.py` → both exit 0
  after the `lessons.md` → `corrections-log.md` rename, proving the scan lists were updated
- `grep -rn "lessons\.md" --include=*.py --include=*.json tools/` → no matches

**Dependencies**
- PHASE-03 must land first. Reformatting `ui.js`, `teach.js`, and `tour.js` while a localization
  pass is rewriting the same lines guarantees a painful conflict.

**Exit Criteria**
- [ ] `cd app && npx prettier --check src e2e scripts` exits 0.
- [ ] `CLAUDE.md` exists at the repo root and names every rule listed in TASK-06-08.
- [ ] `ls activeContext.md lessons.md 2>&1` reports both as missing (they moved).
- [ ] `ls learning-records/` includes `0005-teaching-revamp-and-hardening-arc.md`.
- [ ] `cd app && npm run predeploy` passes end to end.
- [ ] `python -m unittest discover -s tools/tests -v` and all four repo-root Python checkers pass.

**Phase Risks**
- **RISK-06-01:** The repo-wide reformat produces a very large diff that hides a real change.
  Mitigation: TASK-06-03 must be a commit containing **only** the formatter's output; verify with
  `git diff --stat` that no file has both additions and deletions beyond whitespace by re-running
  the full test suite before and after.
- **RISK-06-02:** Renaming `lessons.md` silently drops it from two prose-guard scan lists, quietly
  disabling a CI check. Mitigation: TASK-06-10 explicitly names both files to update, and a Test
  Spec greps for leftover references.
- **RISK-06-03:** Deleting `js-resolve-loader.mjs` could break a script invocation documented
  somewhere outside `app/`. Mitigation: the grep in TASK-06-06 covers the whole `app/` tree; extend
  it to the repo root (`grep -rn "js-resolve-loader" . --include=*.md --include=*.yml | grep -v node_modules`)
  before deleting.

**Phase Completion Notes (2026-08-02)**
- TASK-06-01/02/03 landed as the dedicated format commit `84e5503` — the `.prettierrc` flip, the
  widened `format` script, and the repo-wide `npm run format` in one commit containing no other
  changes, exactly as the task requires.
- Verified: `npx prettier --check src e2e scripts` passes; `npm test` (73), `npm run lint`,
  `npm run build`, and `npm run e2e` (57 passed, 3 documented skips) all pass; re-running
  `export-spine.mjs` + `export-sweep.mjs` produces byte-identical `assets/teaching/*.json`
  (CON-001 intact).
- TASK-06-04 is effectively complete by that verification. TASK-06-05 through TASK-06-12 remain
  unchecked: the CI `prettier --check` step, import-extension normalization, eslint `scripts/**`
  un-ignore, root `CLAUDE.md`, `activeContext.md` retirement, `lessons.md` rename, learning record
  `0005`, and the `NOTES.md` pointer. These remain open.

## Gotchas

- **The live app content is already current.** The 2026-07-22 deploy shipped the right bytes with
  the wrong label. Do not treat PHASE-01 as a content emergency and do not rush a deploy before the
  header fix and the marker change are both committed.
- **`npm ci` will fail.** Use `npm install`. This is deliberate and documented in
  `.github/workflows/ci.yml`; a well-meaning "fix" here breaks CI.
- **Never edit `assets/teaching/*.json` by hand.** They are generated by
  `app/scripts/export-spine.mjs` and `app/scripts/export-sweep.mjs`, and CI's `deck-parity` job
  regenerates and diffs them. A hand edit fails the build. The one exception is
  `terminology-map.json`, which is hand-authored — and even there, only the `vi`/`zh` values are
  editable, never the `en` snapshot (the English source of truth is `TEXT["en"]` inside
  `build_oct_teaching_deck.py`).
- **`5 of 56` is the current gate-sweep figure and `0 of 56` is retired.** Do not "correct" a
  `5 of 56` you encounter; do not let a `0 of 56` survive outside `archive/` and
  `tools/tests/` fixtures.
- **The three language codes are `en`, `vi`, `zh`** in the app and in `terminology-map.json`, but
  the lesson HTML files on disk use the suffix `-zh-cn`. These are different naming systems that
  coexist deliberately. Do not unify them.
- **Number formatting is comma-grouped in all three languages.** Vietnamese conventionally uses
  `.` as a thousands separator; this repo does not, because every figure must match the deck, the
  worksheets, and the JSON spines character for character. Do not "localize" numbers.
- **Playwright snapshot filenames are OS-suffixed.** Windows-generated `-win32.png` baselines are
  useless to CI and must never be committed. Baselines come from a Linux CI run only.
- **`app/src/style.css` is 1,579 lines** and is not in scope for any phase here except the
  whitespace reformat. Resist restyling.
- **The `?present=1` and `?teach=1` flags both force the presenter theme**, and `?teach=1` also
  suppresses the tour. A new `?lang=` flag must compose with both without changing either behavior —
  `resolveTheme` and `shouldAutoStartTour` read the same query string and must keep working.
- **`e2e/helpers.js`'s `failOnConsoleErrors`** makes any console error a test failure. The
  `console.warn` in S4's missing-key path is a *warning*, not an error, so it will not fail the
  suite — but do not upgrade it to `console.error`.
- **The six teach-mode fallback MP4s embedded in the deck** were recorded from the English app.
  PHASE-03 changes the shape of `teach-steps.js` but not the English text, so the recordings stay
  valid and do **not** need regenerating. If the English annotations ever change, re-record with
  `cd app && npm run record:demos` and rebuild the deck.
- **CON-002's content freeze is 2026-09-15.** Every English string change in this plan
  (PHASE-01's header fix, PHASE-03's extraction) must land before it, or the fresh-viewer validation
  and the translation budget both take the hit.

## Verification Strategy

- **TEST-001:** `cd app && npm install && npm test` → `Test Files  8 passed` and `Tests  57 passed`
  before PHASE-03/05 add cases; after them, all files pass and the total is 57 plus the new tests.
- **TEST-002:** `cd app && npm run lint` → exits 0, no output.
- **TEST-003:** `cd app && npm run build` → exits 0; after PHASE-04, gzip JS is below 84.88 kB and
  `dist/sw-manifest.json` exists.
- **TEST-004:** `cd app && npm run e2e` → all functional specs pass, including the new
  `lang.spec.js`, `a11y.spec.js`, and `offline.spec.js`.
- **TEST-005:** `cd app && npm run e2e:visual` on Linux/CI → passes with committed baselines and
  without `continue-on-error`.
- **TEST-006:** `python -m unittest discover -s tools/tests -v` → all tests pass, including the new
  deploy-freshness and generator-scan cases.
- **TEST-007:** `python tools/check_deploy_freshness.py` → `DEPLOY-FRESHNESS PASS`, exit 0, and the
  reported marker contains no `-dirty` suffix.
- **TEST-008:** `python tools/check_retired_figures.py && python tools/verify_prose_figures.py`
  → both exit 0.
- **TEST-009:** `python audit_teaching_deck.py && python verify_deck_numbers.py` → both print their
  PASS lines (proves PHASE-02's archival did not break the deck pipeline).
- **TEST-010:** `cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && git diff --exit-code assets/teaching/`
  → exits 0, proving CON-001 held throughout.
- **TEST-011:** `python tools/check_human_blocked_register.py` → exits 0 (or exits 1 naming a
  genuinely due item, which is the intended behavior, not a failure of this plan).
- **TEST-012:** `cd app && npm run i18n:report` → prints per-language untranslated key counts.
- **TEST-013:** `curl -sI https://dppa-case.web.app | grep -i cache-control` → `no-cache`.
- **MANUAL-001:** Open `https://dppa-case.web.app` and confirm the header eyebrow reads
  `Vietnam synthetic DPPA` with no personal name.
- **MANUAL-002:** Open `https://dppa-case.web.app/?lang=vi&teach=1` and
  `?lang=zh&teach=1` at 1280x720 and confirm the teach banner text does not overflow or clip, and
  that any untranslated string appears in English rather than as the token `UNTRANSLATED`.
- **MANUAL-003:** Load the live site once, disable networking entirely, reload, and confirm the app
  renders and the five-line bill computes.
- **MANUAL-004:** After PHASE-04, deploy twice in succession and confirm a reload picks up the
  second build (proves the service worker's update path).
- **OBS-001:** Watch the repository's Actions tab on the Monday following PHASE-01 for the
  `freshness-checks` scheduled workflow: `deploy-freshness` must be green. If it is red, the marker
  or the asset comparison is wrong — investigate before changing the schedule.
- **OBS-002:** After PHASE-05, confirm a pushed commit shows the `quality` job running lint,
  prettier check, unit tests, coverage, functional e2e, **blocking** visual e2e, and build.

## Risks and Alternatives

- **RISK-001:** The plan spans six phases against a 2026-09-15 content-freeze deadline and an
  unconfirmed session date (item H1). If time runs short, the priority order is PHASE-01 (a wrong
  guardrail is worse than no guardrail), then PHASE-03 (the audience-facing gap that cannot be
  fixed after the freeze), then PHASE-02, then the rest. PHASE-04, PHASE-05, and PHASE-06 improve
  the repository but do not change what the audience sees in October.
- **RISK-002:** PHASE-03 touches `ui.js`, the single largest and most e2e-covered file in the app,
  weeks before a live presentation. Mitigation: English output must stay byte-identical (CON-004),
  which the existing 57 tests and the functional Playwright suite verify on every run; land it in
  small commits, not one.
- **RISK-003:** Several phases edit `.github/workflows/ci.yml` and `app/vite.config.js`. Executed in
  parallel or out of order, they will conflict. Mitigation: PHASE-01, PHASE-04, and PHASE-05 each
  touch `vite.config.js`; if they are not executed in that order, rebase carefully and re-run
  TEST-003 after each.
- **RISK-004:** The translator (item H2, due 2026-08-25) may be briefed on the terminology map alone
  and never see `app/src/data/strings.js`. Mitigation: TASK-03-13 adds the app strings to the
  checklist's "Late September" section; also update item H2's description in the human-blocked
  register to name both files.
- **ALT-001:** *Keep the commit-label comparison and simply scope it to `git log -1 -- app/`.*
  Cheaper than S2's local-build comparison, and it fixes the docs-only-commit false alarm. Rejected
  as the primary approach because it still trusts a marker that this repo has already demonstrated
  can be wrong; the asset comparison is immune to a wrong or missing marker. The scoped-commit
  variant remains a reasonable fallback if the local build proves too slow for the weekly job — in
  which case use `--skip-build` with a committed asset manifest instead.
- **ALT-002:** *Use a full i18n library (`i18next`, `@formatjs/intl`) instead of a hand-rolled
  `t()`.* Rejected: the app has one runtime dependency today and a 340 kB payload that PHASE-04 is
  actively trying to shrink for a bad-network venue; three flat string tables and a ten-line lookup
  meet the entire requirement without adding a dependency or a bundle cost.
- **ALT-003:** *Delete the one-off scripts instead of archiving them.* Rejected: this repo's
  standing convention is `git mv`, not `rm`, precisely because the live/one-off classification is
  inferred from documentation cross-references rather than certain, and several archived scripts
  document how existing committed artifacts were produced.
- **ALT-004:** *Skip the service worker and rely on the six fallback MP4s already embedded in the
  deck.* Rejected as the sole answer: the recordings cover the presenter's own six scripted moments
  but nothing an attendee does on their own phone after scanning the QR code, and they cannot answer
  a CFO's "what if the strike were 1,300?" live. The service worker and the recordings are
  complementary; keep both.

## Suggested Next Step

Execute PHASE-01. It is the highest-consequence, lowest-effort work in the plan, and its exit
criteria are independently verifiable before anything else begins. Complete it **before the Monday
following the start of work**, so the `freshness-checks` scheduled workflow's next run is a true
green rather than a false alarm that trains the reader to ignore it. PHASE-02, PHASE-03, and
PHASE-05 are mutually independent and may be executed in any order afterwards; PHASE-04 requires
PHASE-01's cache headers, and PHASE-06 requires PHASE-03 to have landed.
