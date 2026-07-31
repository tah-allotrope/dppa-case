---
title: "Guardrail Repair, Locale-Aware Number Integrity, and Honest Teaching Defaults"
date: "2026-07-26"
status: "draft"
request: "Turn research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md into a multi-phase execution plan saved to plans/"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md"
  - "research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md"
  - "research/dppa-terminology-map.md"
---

# Plan: Guardrail Repair, Locale-Aware Number Integrity, and Honest Teaching Defaults

## Objective

Repair three defects that make this repository's central quality claims untrue, and close them
before the two hard external deadlines. (1) The scheduled deploy-freshness workflow cannot fail —
it exits 0 without comparing anything, because the job never installs Node. (2) The entire
number-integrity apparatus (four CI guards) only understands English text and English digit
grouping, so it is structurally blind to the Vietnamese and Chinese artifacts that a translator will
begin producing within 30 days — and one Vietnamese lesson already prints loss coefficients that a
Vietnamese reader parses as a 1000x error. (3) The web app's shipped default configuration
demonstrates the *opposite* of the project's stated teaching claim, showing "no crossover in 20
years" and a 65.7 billion VND lifetime loss to anyone who scans the QR code on the deck's closing
slide.

## Context Snapshot

- **Current state:** A Vietnamese DPPA (Direct Power Purchase Agreement) teaching project. A
  JavaScript settlement engine (`app/src/modules/settlement.js`) is the single source of truth for
  every number; Node export scripts emit JSON "spine" packs; Python scripts build a PowerPoint deck,
  PNG/GIF teaching visuals, and a bilingual Word worksheet from those packs; four Python guards run
  in CI to stop hand-typed or stale figures reaching an artifact. As verified on 2026-07-26: 57 unit
  tests pass, 27 Playwright end-to-end tests pass, lint passes, production build is 257.99 kB
  (84.87 kB gzip), and all four guards report PASS. The defects below are all *scope* defects — the
  machinery works, but it does not cover what it claims to cover.
- **Desired state:** The weekly freshness workflow genuinely compares the live site to a fresh build
  and fails when it should. All four guards are locale-aware and cover the translation artifact, so
  numbers can never enter the vi/zh pipeline by hand. The deck's translatable text carries numeric
  placeholders instead of literal digits. The app's defaults teach the mechanism the project exists
  to teach, and the "N of 56" gate-sweep headline survives a lender's question. Project laws are
  written down in a root `CLAUDE.md`, and the presenter has a rehearsal harness generated from the
  same exports as the deck.
- **Key repo surfaces:**
  - Engine + data: `app/src/modules/settlement.js`, `app/src/data/default-scenarios.js`
  - Exports: `app/scripts/export-spine.mjs`, `app/scripts/export-sweep.mjs` →
    `assets/teaching/spine-s{1,2,3}.json`, `assets/teaching/gate-sweep.json`
  - Generators (repo root): `build_oct_teaching_deck.py`, `build_teaching_visuals.py`,
    `build_cfd_slide.py`, `build_worksheet_answer_docx.py`
  - Verifiers: `audit_teaching_deck.py`, `verify_deck_numbers.py`, `tools/check_retired_figures.py`,
    `tools/verify_prose_figures.py`, `tools/check_deploy_freshness.py`,
    `tools/check_human_blocked_register.py`
  - Translation carrier: `assets/teaching/terminology-map.json` (64 `UNTRANSLATED` values: 31 `vi`,
    33 `zh`)
  - App UI: `app/src/main.js`, `app/src/modules/ui.js`, `app/src/data/teach-steps.js`
  - CI: `.github/workflows/ci.yml` (jobs `quality`, `deck-parity`),
    `.github/workflows/freshness-checks.yml` (jobs `deploy-freshness`, `human-blocked-register`)
- **Out of scope:**
  - **Full app string extraction / trilingual UI.** That work is already fully specified as PHASE-03
    of `plans/2026-07-25-guardrail-integrity-and-localization-plan.md` and must not be forked into
    two plans editing `app/src/modules/ui.js` simultaneously. This plan delivers the shared locale
    primitive that work will consume (see DEC-006).
  - **Service worker / offline mode, Chart.js tree-shaking, visual-regression baselines,
    accessibility test, coverage thresholds, Prettier config repair, reformatting the five
    single-line files, extensionless-import normalization.** All are PHASE-04, PHASE-05 and PHASE-06
    of `plans/2026-07-25-guardrail-integrity-and-localization-plan.md` and remain owned there.
  - **Deleting the 12 duplicated `.gif` animations in `assets/`** (see ASM-009).
  - **Any Firebase deploy.** No phase here deploys; PHASE-01 only repairs the checker that reports
    on deploys.
  - **Recalibrating the lender/investor gate thresholds with real deal data.** That is a
    human-blocked item (H3, due 2026-09-01) in `plans/2026-october-readiness-checklist.md`.
    PHASE-04 fixes the *structural* defect in the sweep without inventing new thresholds.

## Environment & Conventions

- **Stack:**
  - Node.js 24 (CI pins `node-version: 24`; local verified `v24.12.0`), npm, ES modules
    (`app/package.json` has `"type": "module"`). Vite 8 build, Vitest 4 unit tests, Playwright 1.53
    end-to-end, ESLint 9, Chart.js 4.
  - Python 3.12 in CI (`actions/setup-python@v5`, `python-version: "3.12"`); local shell verified
    Python 3.11.15. Both are acceptable; write code compatible with 3.11+ (the guards already use
    `from __future__ import annotations`).
  - Python packages actually imported by the repo: `python-pptx` (verified 1.0.2 locally),
    `python-docx` (1.2.0), `numpy` (2.4.3), `Pillow` (12.2.0), and **`matplotlib`, which is NOT
    installed in the local shell** — `build_teaching_visuals.py` will fail with
    `ModuleNotFoundError: No module named 'matplotlib'` until it is installed. There is no
    `requirements.txt`; PHASE-01 creates one.
- **Setup:**
  ```bash
  cd app && npm install && cd ..
  python -m pip install -r requirements.txt   # requirements.txt is created in PHASE-01
  ```
  Do not use `npm ci` locally: CI deliberately uses `npm install` because `npm ci` previously failed
  on optional-native-binary lockfile drift (`@emnapi/core` missing) — the reason is recorded as a
  comment in `.github/workflows/ci.yml`. Follow the same choice in any new CI step.
- **Build / Run:**
  ```bash
  cd app && npm run dev          # local dev server, http://127.0.0.1:5173/
  cd app && npm run build        # production build into app/dist/
  cd app && npm run preview      # serve app/dist/ on http://127.0.0.1:4173/
  ```
- **Test:**
  - Full JS unit suite: `cd app && npm test` (expect `57 passed (8)` before this plan's additions).
  - Single JS unit file: `cd app && npx vitest run src/modules/settlement.test.js`
  - Single JS unit test by name: `cd app && npx vitest run -t "builds the five-line bill"`
  - Full end-to-end suite: `cd app && npm run e2e` (expect `27 passed`; excludes `@visual`).
  - Single end-to-end file: `cd app && npx playwright test e2e/teach.spec.js`
  - Full Python guard suite: `python -m unittest discover -s tools/tests -v`
  - Single Python guard test:
    `python -m unittest tools.tests.test_check_deploy_freshness -v`
  - Lint: `cd app && npm run lint`
- **Conventions & traps:**
  - **Currency is VND (Vietnamese dong) throughout.** All engine math stays in VND; USD is a display
    conversion only, at a hard-coded rate in `app/src/modules/formatters.js`. Deck figures are
    quoted in "tr VND" = *triệu VND* = **millions of VND**, exported as the
    `vndMillionsRounded` fields.
  - **Digit grouping is locale-dependent and this is the crux of PHASE-02.** `en-US` and `zh-CN`
    group thousands with `,` and use `.` as the decimal mark. `vi-VN` is the reverse: `.` groups
    thousands, `,` is the decimal mark. Verified:
    `new Intl.NumberFormat('vi-VN').format(9063456789)` → `9.063.456.789`, and
    `new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2}).format(1427.35)` → `1.427,35`.
  - **On Windows, prefix Python invocations with `PYTHONPATH= `** (e.g.
    `PYTHONPATH= py build_oct_teaching_deck.py --lang en`). Every generator's docstring documents
    this. On Linux/macOS/CI, plain `python` is correct. Both forms are given where it matters.
  - **All Python generators and verifiers must be run from the repository root**, because they build
    paths like `os.path.join("ceba", ...)` and `os.path.join("assets", "teaching", ...)` relative to
    the current working directory.
  - **Strict regeneration order** whenever `app/src/modules/settlement.js`,
    `app/src/data/default-scenarios.js`, or any escalation assumption changes:
    ```bash
    cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && cd ..
    PYTHONPATH= py build_teaching_visuals.py --lang en
    PYTHONPATH= py build_oct_teaching_deck.py --lang en
    PYTHONPATH= py audit_teaching_deck.py
    PYTHONPATH= py verify_deck_numbers.py
    ```
  - **Retirement rule (mandatory).** Whenever a headline figure changes, add the superseded string to
    the `retired` array in `tools/retired_figures.json` **in the same commit**. `check_retired_figures.py`
    then permanently forbids that string in living prose and in generator scripts.
  - **Retire with `git mv`, never `rm`.** `archive/` holds retired scripts and binaries with a
    README explaining each one's live equivalent.
  - **Two code styles coexist in `app/`.** `main.js`, `ui.js`, `chart.js`, `settlement.js`,
    `formatters.js`, `profiles.js`, `flow-diagram.js`, `teach.js` and the files they import use
    **no semicolons and single quotes**. `theme.js`, `tour.js`, `tour-steps.js`, `eslint.config.js`,
    `playwright.config.js` and everything in `e2e/` use **semicolons and double quotes**.
    `app/.prettierrc` currently contradicts the first group, and `npx prettier --check src e2e`
    fails on 26 files. **Do not run `npm run format`** — it would rewrite the engine in one
    unreviewable diff. Match the style of the file you are editing.
  - **Explicit `.js` extensions are required** in any module that the plain-Node export scripts
    reach. `settlement.js` imports `'./profiles.js'` for exactly this reason
    (`scripts/export-*.mjs` run under plain Node ESM, which does not resolve extensionless paths).
    Files reached only by Vite may use extensionless imports; new modules in this plan must use
    explicit extensions.
  - Python: 4-space indent, `from __future__ import annotations`, type hints on new public
    functions, module docstring naming the plan and phase that introduced the file (follow
    `tools/verify_prose_figures.py` as the model).
- **Repo map:**
  ```
  app/                      Vite web app (the live demo aid at https://dppa-case.web.app)
    src/modules/            settlement engine, chart, ui, teach, tour, theme, formatters
    src/data/               default-scenarios.js (the number basis), teach-steps.js, tour-steps.js
    scripts/                export-spine.mjs, export-sweep.mjs (engine -> JSON), record-teach-demos.mjs
    e2e/                    Playwright specs (controls, scenarios, teach, tour, visual)
  assets/teaching/          generated JSON exports, PNG/GIF visuals, terminology-map.json
  ceba/                     PowerPoint decks (master + built teaching decks)
  facilitator/              run-of-show and panel guides (living prose, guard-scanned)
  lessons/                  HTML course pages incl. -vi and -zh-cn variants (guard-scanned)
  tools/                    Python CI guards + tools/tests/ unit tests
  plans/ research/ reports/ planning and historical records (never guard-scanned)
  archive/                  retired scripts and binaries (excluded from guard scans)
  *.py at repo root         the 6 live generator/verifier scripts, each with a "# LIVE:" header
  ```

## Research Inputs

- From `research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md`:
  - `.github/workflows/freshness-checks.yml`'s `deploy-freshness` job installs **Python only**, but
    `tools/check_deploy_freshness.py` shells out to `npm run build` in `app/` as its first action.
    With no `app/node_modules` on a fresh runner the build fails, `run_local_build()` returns
    `False`, the script prints `DEPLOY-FRESHNESS UNKNOWN: local build failed` and **returns 0**
    without ever fetching the live site. The job has never compared anything.
    `tools/tests/test_check_deploy_freshness.py::test_failed_local_build_is_unknown` asserts exactly
    this behaviour, so the suite passes and nothing signals the problem.
  - `verify_deck_numbers.py` hard-codes `DECK = ceba/DPPA Presentation Oct 2026 To Teach.pptx` and
    `NUMBER_PATTERN = \d{1,3}(?:,\d{3})+`. The deck builder writes
    `ceba/DPPA Presentation Oct 2026 To Teach {lang}.pptx`, so the vi/zh decks are never checked —
    and the comma-only regex would find zero tokens in correctly typeset Vietnamese, producing a
    vacuous pass.
  - `assets/teaching/terminology-map.json` carries spine figures as frozen literals (e.g.
    `"cold_open_body"` `en` contains `11,020` and `9,063`, which are `spine-s1.json`'s
    `bauMonthlyVndMillionsRounded` and `cKh.vndMillionsRounded`) and matches **no** guard's scan
    list: `tools/retired_figures.json`'s `scan` is prose only and its `scanScripts` is
    `*.py`, `*.js`, `tools/*.py`, `app/scripts/*.mjs`. 64 values are about to be written by a
    translator into a file no guard reads.
  - `lessons/0009-scenario-3-excess-vi.html` line 90 prints
    `<code>5,000,000 × 1,100 × 1.026 × 1.008</code>` in a Vietnamese-language worksheet; under
    Vietnamese conventions `1.026 × 1.008` reads as `1026 × 1008`. Line 46 repeats the pair in a
    summary card.
  - `tools/verify_prose_figures.py`'s `TOKEN_RE = \d{1,3}(?:,\d{3}){2,}` requires two or more comma
    groups (>= 7 digits) and its canonical set only admits values `>= 1_000_000`, so the
    millions-rounded figures the deck actually displays (`11,020`, `9,063`, `8,563`, `5,947`,
    `1,800`, `817`, `500`) are unguarded in prose — and they appear roughly 20 times in
    `facilitator/dppa-workshop-facilitator-guide.md`.
  - `app/src/data/default-scenarios.js` ships `evnEscalation: 0.04` and `strikeEscalation: 0.04`.
    Running the shipped `projectMultiYear` at the shipped defaults gives **crossover: none
    (`> 20 yr`)** and **20-year savings −65,695 million VND**. At `strikeEscalation: 0.02` the
    crossover is **year 14** (+66,656 m); at `0` it is **year 9** (+170,430 m). The teaching
    scenario `workshop1` crosses over in **year 1** at both `0.04` and `0`, so the M4 teach step
    cannot fail either.
  - `assets/teaching/gate-sweep.json` decomposes to buyer 52 / lender 14 / investor 7 / all-three 5
    of 56 cells. All five passing cells are `(1450, 0.7) (1450, 0.8) (1450, 0.9) (1450, 1.0)
    (1450, 1.1)` — one column — because `INVESTOR_LCOE_VND_PER_KWH = 1450` is exactly
    `max(STRIKES)`. Two of the three gates (`lenderPass = strike >= 1380`,
    `investorPass = strike >= 1450`) ignore the volume-ratio axis entirely, and `DSCR_TARGET = 1.2`
    is exported to metadata but never used in a comparison.
  - `1.026 * 1.008` (the Decree-57 loss coefficients `k` and `K_pp`) is independently redefined in
    `app/src/main.js:107`, `app/scripts/export-spine.mjs:13-14`, and
    `app/scripts/export-sweep.mjs:21-22`, with a `?? 1.008` fallback in
    `app/src/modules/settlement.js:131` and a comment-only mention in `default-scenarios.js:165`.
    CI's `git diff --exit-code` on the generated JSON cannot detect a partial update because the
    export scripts regenerate self-consistently from their own copies.
  - `app/scripts/export-spine.mjs:149` hand-types `spotFormulaText: '1,500,000 × 1.008 × 1,100'`
    inside the export whose docstring promises numbers are "never hand-typed downstream". It is
    consumed by `build_worksheet_answer_docx.py:174` and printed into the bilingual learner
    worksheet, and `tools/verify_prose_figures.py:100` verifies the sibling numeric fields but
    skips this string.
  - `app/src/modules/formatters.js:1` sets `EXCHANGE_RATE = 26500` with no provenance, no date, and
    no entry in any guard; `app/src/modules/formatters.test.js:6` asserts
    `expect(EXCHANGE_RATE).toBe(26500)`, pinning the value rather than validating a contract.
  - Three naming variants for one app: `<title>Vietnam DPPA Neon CFO Calculator` in
    `app/index.html:20`, `og:title` "Vietnam DPPA CFO Calculator" at `app/index.html:8`, and
    `<h1>DPPA CFO visual explainer` in `app/src/modules/ui.js:189`. "Neon" is an internal codename
    that appears in the projected browser tab and in every QR-code scan.
  - Root `package.json:5` declares `"main": "build-deck.js"`, but that file was moved to
    `archive/build-deck.js`; the root `node_modules/` (7.5 MB, `pptxgenjs`) now exists only for an
    archived script.
- From `research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md`:
  - That brief assumed per-locale number formatting was out of scope because "VND grouping is
    identical across the three locales." That assumption is false for Vietnamese and is corrected
    here (see DEC-006).
  - Its PHASE-01 and PHASE-02 landed (dirty-aware build marker, artifact-hash freshness comparison,
    Firebase cache headers, `archive/` with 12 scripts and 7 binaries, generator-side retired-figure
    scanning, packed `.git`). Its PHASE-03 (trilingual app), PHASE-04 (service worker), PHASE-05
    (real CI gates) and PHASE-06 (style + docs) did not land and remain owned by that plan.
- From `research/dppa-terminology-map.md`:
  - The approved English→Vietnamese→Chinese vocabulary already sourced from existing repo artifacts.
    Translations must be added to `assets/teaching/terminology-map.json`, never by hand-editing
    `build_oct_teaching_deck.py`.

## Assumptions and Constraints

- **ASM-001:** The workshop date is assumed to be **2026-10-01** (unconfirmed; item H1 in
  `plans/2026-october-readiness-checklist.md`, open since 2026-07-04). Every interval below derives
  from it: 67 days to the session, 51 days to the 2026-09-15 English content freeze, 30 days to the
  2026-08-25 translator engagement (H2). — **BINDING DEFAULT:** treat 2026-10-01 as the date and do
  not re-plan if it changes; only the urgency ordering would move, not the work.
- **ASM-002:** The recommended new `strikeEscalation` default is **0.02 (2.0% per year)**. There is
  no sourced Vietnamese market index for a DPPA strike escalator in this repository. — **BINDING
  DEFAULT:** use `0.02`, and add the provenance comment
  `// Strike escalation: 2.0%/yr illustrative partial indexation — deliberately BELOW evnEscalation
  so the escalation differential (the mechanism MISSION.md teaches) is visible on first load. Not a
  sourced market index; replace with a negotiated index when one exists.`
- **ASM-003:** Extending the gate-sweep strike grid past the investor threshold changes the headline
  pass count and the total cell count. The new values cannot be predicted without running the
  script. — **BINDING DEFAULT:** extend `STRIKES` to
  `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]` (10 values x 7 ratios = **70
  cells**), read the resulting `passCount` and `gateCounts` from the regenerated
  `assets/teaching/gate-sweep.json`, and propagate those literal values into every text location
  listed in PHASE-04. Never hard-code a predicted count.
- **ASM-004:** Lowering `tools/verify_prose_figures.py`'s token floor from 7 digits to 4 digits will
  surface previously invisible tokens across the scanned prose, and the volume of triage is unknown
  until the checker runs. — **BINDING DEFAULT:** first expand the canonical set as specified in
  PHASE-02 (spine `inputs` scalars, all `vndMillionsRounded` fields, `gate-sweep.json` strikes and
  `passCount`), then run the checker and triage. If more than **40** genuinely-justified new
  literals would be required, keep the 4-digit floor for `NOTES.md`, `RESOURCES.md`, `MISSION.md`,
  `lessons.md` and `facilitator/**/*.md` (the presenter-facing prose) and keep the 7-digit floor for
  `lessons/**/*.html`, recording the split in the module docstring and in `NOTES.md`.
- **ASM-005:** The Vietnamese and Chinese teaching decks do not exist yet (only
  `ceba/DPPA Presentation Oct 2026 To Teach.pptx` is present) because 64 terminology entries are
  still `UNTRANSLATED`. — **BINDING DEFAULT:** PHASE-02's vi/zh deck-parity CI steps must **skip
  cleanly with exit 0 and a printed "deck not present, skipping" message** when the language deck
  file is absent, and must fail normally when it is present.
- **ASM-006:** No translator is engaged yet, so no `UNTRANSLATED` value may be filled in by this
  plan. — **BINDING DEFAULT:** never invent, machine-translate, or guess a Vietnamese or Chinese
  string. Every `UNTRANSLATED` value stays `UNTRANSLATED`. The only vi/zh text this plan may write
  is the digit-grouping repair in PHASE-02 TASK-02-09, which changes punctuation inside existing
  numbers and does not translate words.
- **ASM-007:** `matplotlib` is not installed in the current local environment, so
  `build_teaching_visuals.py` cannot run until it is. — **BINDING DEFAULT:** PHASE-01 creates
  `requirements.txt` pinning the four Python packages the repo imports; PHASE-04 installs from it
  before re-rendering the M5 heatmap.
- **ASM-008:** `app/src/data/default-scenarios.js`'s `lossFactor: 1.0342` is the deliberately
  *rounded* slider default (the slider step is `0.001`), distinct from the precise product
  `1.026 * 1.008 = 1.034208`. — **BINDING DEFAULT:** PHASE-05 must **not** change `lossFactor`; it
  only centralizes the precise pair. The proof is `git diff --exit-code` reporting no change to the
  four generated JSON files.
- **ASM-009:** The 12 `.gif`/`.mp4` duplicate pairs in `assets/` (~11 MB of GIFs) may still be
  consumed as a fallback by `build_oct_teaching_deck.py` when an `.mp4` is missing. — **BINDING
  DEFAULT:** do not delete them. PHASE-05 records the reason in `NOTES.md` and closes the question.
- **CON-001:** Nothing in this plan may be deployed to Firebase. Deploy credentials are a
  human-blocked item (H4, due 2026-09-08) and the `deploy` job in `.github/workflows/ci.yml` stays
  commented out.
- **CON-002:** The English content freeze is 2026-09-15. Any change to English audience-facing copy
  (PHASE-03's app header and hero text, PHASE-04's M5 slide wording) must land before it, because
  late English edits triple the translation rework.
- **CON-003:** `app/src/modules/ui.js` is the largest and most test-covered file in the app
  (552 lines, exercised by a 363-line `ui.test.js` and four Playwright specs). Only PHASE-03 and
  PHASE-05 may edit it, and each must re-run both suites.
- **CON-004:** Do not run `npm run format` or `npx prettier --write` anywhere in this plan.
- **DEC-001:** Deploy provenance is decided by **artifact hashes, not commit labels**.
  `tools/check_deploy_freshness.py` compares the content-hashed `/assets/*` filenames in the live
  HTML against a fresh local build's. The `<meta name="build-commit">` marker is human-readable
  provenance only, except that a `-dirty` suffix is always a hard failure. PHASE-01 preserves this
  design and only fixes the environment and the strictness contract.
- **DEC-002:** Numbers must never be typed into a translation. The deck's English templates carry
  named placeholders; a substitution step fills them per language from the generated exports. A new
  guard enforces that no `vi` or `zh` value in `assets/teaching/terminology-map.json` contains a
  digit group, and that every placeholder present in an entry's `en` template is present in its
  translations.
- **DEC-003:** Locale digit grouping is: `en` → `,` thousands separator; `zh` → `,` thousands
  separator; `vi` → `.` thousands separator. Decimal marks are `.` for en/zh and `,` for vi. One
  shared Python helper owns this rule so the deck builder and all three verifiers cannot disagree.
- **DEC-004:** The gate sweep's strike grid must extend **past** the investor threshold so the
  headline is a finding rather than a grid-clipping artifact, and the hard-coded literal `56` must be
  replaced everywhere by the computed cell count.
- **DEC-005:** `DSCR_TARGET` becomes load-bearing in the lender-gate comparison rather than
  decorative metadata. The rewrite is algebraically identical to today's threshold, so it changes no
  result — it changes only whether the exported metadata is honest.
- **DEC-006:** When the trilingual app work (PHASE-03 of
  `plans/2026-07-25-guardrail-integrity-and-localization-plan.md`) is executed, it **must** use
  locale-aware number formatting: `vi` renders `9.063.456.789` and `1.427,35`, not the `en-US` forms
  that `app/src/modules/formatters.js` currently hard-codes. PHASE-06 of this plan records that
  requirement in the root `CLAUDE.md` so it cannot be lost between plans.

## Specification

### S1. Locale digit grouping (owned by the new `figure_format.py`)

For an integer `v >= 0` and a language `lang in {"en", "vi", "zh"}`:

```
group_en(v) = decimal digits of v, split into groups of 3 from the right, joined with ","
group_vi(v) = same grouping, joined with "."
group_zh(v) = group_en(v)
```

Symbol annotations: `v` is a whole number of either **VND** or **millions of VND** (the plan never
formats a fractional figure through this helper); `lang` is the deck build language, matching
`build_oct_teaching_deck.py --lang`.

Implementation rule: compute `f"{v:,}"` (Python's built-in comma grouping) and, for `vi` only,
replace every `,` with `.`. Negative numbers keep a leading `-` before the grouped digits.

The matching detection pattern for finding grouped numbers in text:

```
pattern_en = pattern_zh = \d{1,3}(?:,\d{3})+
pattern_vi =              \d{1,3}(?:\.\d{3})+
```

Note the deliberate asymmetry with `tools/verify_prose_figures.py`'s historical `{2,}` quantifier:
after PHASE-02 both verifiers use `+` (one or more groups), so a 4-digit figure such as `11,020` is
detected. See ASM-004 for the triage escape valve.

### S2. Placeholder substitution in the deck text layer

1. `build_oct_teaching_deck.py` keeps a module-level `TEXT` dictionary whose `"en"` entries are
   **templates** using `string.Template` explicit-brace syntax: `${bau}`, `${ckh}`, and so on. No
   English template may contain a literal grouped digit run.
2. A module-level `FIGURES` dictionary maps each placeholder name to a raw Python `int` read from
   `assets/teaching/spine-s1.json` and `assets/teaching/gate-sweep.json`. Minimum required keys,
   with their sources (values shown are today's, for orientation only — always read them from the
   JSON):
   | placeholder | source | today |
   |---|---|---|
   | `bau` | `spine-s1.comparison.bauMonthlyVndMillionsRounded` | 11020 |
   | `ckh` | `spine-s1.bill.cKh.vndMillionsRounded` | 9063 |
   | `cevn` | `spine-s1.bill.cEvn.vndMillionsRounded` | 8563 |
   | `market_energy` | `spine-s1.bill.lines.marketEnergy.vndMillionsRounded` | 5947 |
   | `system_service` | `spine-s1.bill.lines.systemService.vndMillionsRounded` | 1800 |
   | `diff_clearing` | `spine-s1.bill.lines.diffClearing.vndMillionsRounded` | 817 |
   | `additional_purchase` | `spine-s1.bill.lines.additionalPurchase.vndMillionsRounded` | 0 |
   | `cfd` | `spine-s1.bill.lines.cfd.vndMillionsRounded` | 500 |
   | `fees` | `system_service + diff_clearing` | 2617 |
   | `pass_count` | `gate-sweep.passCount` | 5 |
   | `cell_count` | `len(gate-sweep.cells)` | 56 |
3. `load_text(lang)` behaves exactly as today (English is the literal `TEXT["en"]`; vi/zh overlay
   `terminology-map.json` and abort on any `UNTRANSLATED` or missing key).
4. A **new** step runs immediately after `load_text` for **every** language including English:
   `apply_figures(text_layer, lang)` walks every string value (including every element of the list
   values `divider`, `checkpoint`, `appendix_titles`, `appendix_takeaways`, and the `plain` member of
   each `m6_decoder_rows` tuple) and calls
   `string.Template(value).substitute(**{k: format_figure(v, lang) for k, v in FIGURES.items()})`.
   `substitute` (not `safe_substitute`) is required so an unknown placeholder raises `KeyError`
   loudly rather than shipping a literal `${typo}` onto a slide.
5. Because `string.Template` treats `$` specially, no `TEXT` value and no translation may contain a
   bare `$`. Escape a literal dollar sign as `$$`.

### S3. Escalation differential (the mechanism PHASE-03 makes visible)

```
differential = evnEscalation - strikeEscalation          [per year, decimal fraction]
```

- `evnEscalation` — annual escalation applied to the EVN retail tariff, which drives the
  do-nothing (BAU, "business as usual") cost. Default `0.04` = 4.0%/yr.
- `strikeEscalation` — annual escalation applied to the contracted strike price, which drives the
  DPPA cost. Default becomes `0.02` = 2.0%/yr (ASM-002).

`projectMultiYear` in `app/src/modules/settlement.js` computes, for year `n` from 1 to `years`:

```
evnFactor(n)    = (1 + evnEscalation)    ^ (n - 1)
strikeFactor(n) = (1 + strikeEscalation) ^ (n - 1)
retailTariff(n) = retailTariff(base) * evnFactor(n)
strikePrice(n)  = strikePrice(base)  * strikeFactor(n)
cumSavings(n)   = sum over years 1..n of (annualBau - annualDppa)
crossoverYear   = the smallest n where cumSavings(n) > 0, else null
```

FMP (the *full market price*, i.e. spot reference price) is deliberately **not** escalated here; the
app labels this "FMP flat". `app/scripts/export-sweep.mjs` **does** escalate FMP at 4%/yr. The
divergence is real and out of scope to resolve; PHASE-04 TASK-04-08 documents it in the facilitator
guide so it is stated rather than discovered by a questioner.

Verified behaviour at scenario `balanced` (strike 2,000 VND/kWh, FMP 1,427 VND/kWh, 20-year
horizon, `evnEscalation = 0.04`):

| `strikeEscalation` | `differential` | `crossoverYear` | 20-yr `cumSavings` |
|---|---|---|---|
| 0.04 (today's default) | 0.00 | `null` (rendered `> 20 yr`) | −65,695 million VND |
| 0.02 (new default) | 0.02 | 14 | +66,656 million VND |
| 0.00 ("Locked strike") | 0.04 | 9 | +170,430 million VND |

### S4. Lender-gate rewrite (algebraic identity, DEC-005)

Today, in `app/scripts/export-sweep.mjs`:

```
LENDER_DEBT_SERVICE_VND_PER_KWH = 1150 * 1.2   // = 1380
DSCR_TARGET = 1.2                              // exported but never used
lenderPass = strike >= LENDER_DEBT_SERVICE_VND_PER_KWH
```

Replace with the DSCR (debt-service coverage ratio) form:

```
LENDER_BASE_DEBT_SERVICE_VND_PER_KWH = 1150     // per-kWh debt service the project must cover
DSCR_TARGET = 1.2                               // minimum coverage ratio lenders require
dscr(strike) = strike / LENDER_BASE_DEBT_SERVICE_VND_PER_KWH
lenderPass   = dscr(strike) >= DSCR_TARGET
```

Because `strike / 1150 >= 1.2` is equivalent to `strike >= 1380`, **no cell result changes**. Export
`lenderBaseDebtServiceVndPerKwh` and keep `dscrTarget` in `meta`; drop the now-redundant
`lenderDebtServiceVndPerKwh`, or keep it as a derived echo — either is acceptable provided the
exported metadata matches the code.

### S5. `spotFormulaText` generation (PHASE-05, replaces a hand-typed string)

```
spotFormulaText = group_en(excessKwh) + " × " + str(lossFactorKppOnly) + " × " + group_en(fmp)
spotValueVnd    = round(excessKwh * lossFactorKppOnly * fmp)
```

- `excessKwh` = `EXCESS_GENERATION_KWH - profile.monthlyVolumes.total` = `6,500,000 - 5,000,000` =
  `1,500,000` kWh.
- `lossFactorKppOnly` = `K_pp` = `1.008` (the meter-side loss coefficient only, not the full
  `k x K_pp` product).
- `fmp` = `scenarioProfiles.workshop3.overrides.marketPrice` = `1,100` VND/kWh.

The generated string must be byte-identical to today's hand-typed
`'1,500,000 × 1.008 × 1,100'`, including the U+00D7 MULTIPLICATION SIGN `×` and the single spaces
around it. `group_en` here is the JavaScript equivalent of S1's English grouping
(`v.toLocaleString('en-US')`).

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Make the scheduled freshness workflow able to fail, and pin the Python toolchain | None | Node setup + `npm install` in `freshness-checks.yml`, `--strict` mode in `tools/check_deploy_freshness.py`, environment-capability guard, new strict-mode tests, `requirements.txt`, corrected `app/deployment.md` |
| PHASE-02 | Make the number-integrity apparatus locale-aware and extend it over the translation carrier | None (parallel with PHASE-01) | `figure_format.py`, placeholder-templated deck text, `tools/check_terminology_map.py` + tests, locale-aware `verify_deck_numbers.py` and `tools/verify_prose_figures.py`, extended guard scans, repaired Vietnamese lesson typography, new CI steps |
| PHASE-03 | Make the app's default state teach the mechanism the project exists to teach | None (parallel; must land before the 2026-09-15 English freeze) | `strikeEscalation` default 0.02, escalation-differential readout, "Locked strike" preset, retargeted M4 teach step + regenerated recordings, single app name, relocated hero caveat |
| PHASE-04 | Make the gate-sweep headline a finding rather than a grid artifact | PHASE-02 | Extended strike grid, DSCR-form lender gate, `gateCounts` in the export, computed cell count replacing every literal `56`, re-rendered M5 heatmap, rebuilt deck, retired old figures, per-gate decomposition in the facilitator guide |
| PHASE-05 | Turn "single source of truth" from a convention into a mechanism | None (coordinate with PHASE-04 on regenerated JSON) | `app/src/data/constants.js`, deduplicated loss coefficients, generated `spotFormulaText` + its verifier check, dated `EXCHANGE_RATE` provenance and UI note, root `package.json` repair, log cleanup |
| PHASE-06 | Write down the project laws and give the presenter a rehearsal harness | PHASE-01 through PHASE-05 | Root `CLAUDE.md`, `tools/rehearse.py` + tests + CI check, `learning-records/0005`, archived and restarted `activeContext.md`, updated `NOTES.md` and `RESOURCES.md` |

## Detailed Phases

### PHASE-01 - Deploy-Freshness Guardrail Repair and Python Toolchain Pinning

**Goal**
Make `.github/workflows/freshness-checks.yml`'s `deploy-freshness` job capable of failing. Today it
exits 0 every Monday without fetching the live site, because the job installs Python but the checker
needs Node to build. Add the missing toolchain, add a strict mode so a missing capability is an
error rather than a shrug, add a capability guard so the class of bug is caught for future checkers,
and pin the Python dependencies the repo actually imports.

**Tasks**
- [ ] TASK-01-01: Reproduce the defect before fixing it. Run
      `cd app && rm -rf node_modules && cd .. && python tools/check_deploy_freshness.py; echo "exit=$?"`
      and confirm the output is `DEPLOY-FRESHNESS UNKNOWN: local build failed` with `exit=0`. Then
      restore the environment with `cd app && npm install && cd ..`. Record the observed output in
      the phase report.
- [ ] TASK-01-02: Add a `--strict` flag to `tools/check_deploy_freshness.py`. In strict mode, the
      two `UNKNOWN` conditions that indicate a broken environment must return `1` instead of `0`:
      the failed local build (`main`'s `if not run_local_build()` branch) and the missing
      `app/dist/index.html` branch. Their printed messages must change prefix from
      `DEPLOY-FRESHNESS UNKNOWN:` to `DEPLOY-FRESHNESS FAIL (strict):` and must name `--strict` as
      the reason the condition is fatal.
- [ ] TASK-01-03: Leave the network-unreachability branch lenient **even in strict mode** — it
      returns `0` with the existing `DEPLOY-FRESHNESS UNKNOWN: could not reach ...` message. A
      transient outage must never turn a scheduled job red. Add an inline comment stating this is
      deliberate and distinguishing it from the two environment conditions.
- [ ] TASK-01-04: Update the module docstring's `Flags:` block to document `--strict` alongside
      `--url`, `--skip-build` and `--write-log`, and state in prose that strict mode is intended for
      continuous-integration runners where a failed build is a configuration bug, not a flake.
- [ ] TASK-01-05: Add a `node --version` / `npm --version` capability step to the
      `deploy-freshness` job, plus `actions/setup-node@v4` with `node-version: 24`, `cache: npm`,
      `cache-dependency-path: app/package-lock.json`, and an `npm install` step with
      `working-directory: app`. Mirror the existing `deck-parity` job in
      `.github/workflows/ci.yml`, including its `npm install` (not `npm ci`) choice, and copy the
      explanatory comment about optional-native-binary lockfile drift.
- [ ] TASK-01-06: Change the job's final step to `python tools/check_deploy_freshness.py --strict`.
- [ ] TASK-01-07: Create `requirements.txt` at the repository root pinning the four Python packages
      the repo imports, with a comment naming which script needs each:
      `python-pptx` (deck build/audit/verify), `python-docx` (worksheet build), `matplotlib`
      (teaching visuals), `numpy` (teaching visuals). Use `>=` floors matching the versions verified
      locally (`python-pptx>=1.0.2`, `python-docx>=1.2.0`, `matplotlib>=3.8`, `numpy>=2.0`).
- [ ] TASK-01-08: Replace the bare `pip install python-pptx` step in `.github/workflows/ci.yml`'s
      `deck-parity` job with `pip install -r requirements.txt`, so CI installs the same set a local
      contributor does.
- [ ] TASK-01-09: Correct the `--write-log` claim in `app/deployment.md`. The lines currently
      asserting the top table row "is maintained automatically ... on every verified-fresh check"
      describe an automation that no workflow and no npm script invokes. Rewrite them to state that
      the row is written by running
      `python tools/check_deploy_freshness.py --write-log` **manually after each deploy**, and add
      that command to the "Deploy Command" block as a third line. Do not wire `--write-log` into
      CI — a scheduled job cannot commit to the repository.
- [ ] TASK-01-10: Add a `## CI Notes` subsection entry to `app/deployment.md` recording that the
      scheduled `deploy-freshness` job runs with `--strict` and requires Node, and that it was
      previously incapable of failing.
- [ ] TASK-01-11: Extend `tools/tests/test_check_deploy_freshness.py` with the strict-mode cases
      listed under **Test Specs**. Keep every existing lenient assertion — including
      `test_failed_local_build_is_unknown`, which now documents the *default* contract by contrast.

**File Changes**
- `tools/check_deploy_freshness.py` (modify): add `--strict` to the `argparse` parser; thread the
  flag into the failed-build and missing-`dist` branches so they return `1` with a
  `DEPLOY-FRESHNESS FAIL (strict):` prefix; leave the network branch, the `-dirty` marker check, the
  asset-set comparison and `write_deploy_log` untouched; update the docstring `Flags:` block.
- `.github/workflows/freshness-checks.yml` (modify): in the `deploy-freshness` job only, insert
  `actions/setup-node@v4` (node 24, npm cache on `app/package-lock.json`), an `npm install` step with
  `working-directory: app`, and a `node --version && npm --version` capability step before the
  Python step; change the final run to `python tools/check_deploy_freshness.py --strict`. Leave the
  `human-blocked-register` job exactly as it is — it is genuinely Python-only.
- `requirements.txt` (create): the four pinned Python packages with per-package comments.
- `.github/workflows/ci.yml` (modify): in the `deck-parity` job, replace `pip install python-pptx`
  with `pip install -r requirements.txt`. Change nothing else in this file during this phase.
- `app/deployment.md` (modify): correct the `--write-log` paragraph under `## Last Deploy`, add the
  manual command to the `## Deploy Command` block, and add the strict-mode note under `## CI Notes`.
  Do not touch the historical table rows.
- `tools/tests/test_check_deploy_freshness.py` (modify): add a `StrictModeTests` class; keep all
  existing tests.

**Function Signatures**
- `main(argv: list[str] | None = None) -> int` — unchanged name and return contract (0 = pass or
  tolerated-unknown, 1 = failure); now honours `--strict` for the two environment-failure branches.

**Test Specs**
- `main(["--url", "http://example.invalid", "--skip-build"])` with `app/dist/index.html` present and
  a patched fetch raising `urllib.error.URLError` → returns `0`, stdout contains
  `DEPLOY-FRESHNESS UNKNOWN: could not reach`.
- `main(["--strict", "--url", "http://example.invalid", "--skip-build"])` with the same patched
  network failure → still returns `0` (network leniency survives strict mode).
- `main(["--strict", "--skip-build"])` with `app/dist/index.html` absent → returns `1`, stdout
  contains `DEPLOY-FRESHNESS FAIL (strict):` and the substring `--strict`.
- `main(["--strict"])` with `run_local_build` patched to return `False` → returns `1`, stdout
  contains `DEPLOY-FRESHNESS FAIL (strict):`.
- `main([])` with `run_local_build` patched to return `False` → returns `0`, stdout contains
  `DEPLOY-FRESHNESS UNKNOWN: local build failed` (the pre-existing lenient default is preserved).
- `main(["--strict", "--skip-build"])` with a live HTML fixture whose asset set equals
  `app/dist/index.html`'s and a clean 40-hex-character marker → returns `0`, stdout contains
  `DEPLOY-FRESHNESS PASS`.
- `main(["--strict", "--skip-build"])` with a live HTML fixture whose marker is
  `22bae592e7f01165658087185875a5f973500e34-dirty` and matching asset sets → returns `1`, stdout
  contains `was produced from a dirty working tree` (the `-dirty` rule outranks everything).

**Dependencies**
- None.

**Exit Criteria**
- [ ] `python -m unittest tools.tests.test_check_deploy_freshness -v` passes, with at least six new
      strict-mode tests.
- [ ] `python tools/check_deploy_freshness.py` (no flags, from repo root, with `app/node_modules`
      present) prints `DEPLOY-FRESHNESS PASS (assets match local build; live marker …)` and exits 0.
- [ ] `python tools/check_deploy_freshness.py --strict` exits 0 in the same conditions.
- [ ] `cd app && rm -rf node_modules && cd .. && python tools/check_deploy_freshness.py --strict; echo "exit=$?"`
      prints a `DEPLOY-FRESHNESS FAIL (strict):` line and `exit=1`; then
      `cd app && npm install` restores the environment.
- [ ] `grep -c "setup-node" .github/workflows/freshness-checks.yml` returns `1`.
- [ ] `grep -q -- "--strict" .github/workflows/freshness-checks.yml && echo present` prints
      `present`.
- [ ] `python -m pip install -r requirements.txt` completes, and afterwards
      `python -c "import pptx, docx, matplotlib, numpy; print('deps ok')"` prints `deps ok`.
- [ ] `python -m unittest discover -s tools/tests -v` passes in full.

**Phase Risks**
- **RISK-01-01:** Adding `npm install` makes the weekly job slower and able to fail for unrelated
  dependency reasons. Mitigation: the npm cache keyed on `app/package-lock.json` keeps it to a few
  seconds after the first run, and a dependency-install failure in a *freshness* job is real
  information, not noise.
- **RISK-01-02:** The first genuinely-capable scheduled run may report `STALE` if the live site has
  drifted since 2026-07-25. That is the guard working. Mitigation: run
  `python tools/check_deploy_freshness.py --strict` locally at the end of this phase and record the
  result; if it reports `STALE`, note it as a finding for a human to action with a deploy (CON-001
  forbids deploying here).
- **RISK-01-03:** `matplotlib` is a large wheel and pinning it in `requirements.txt` slows the
  `deck-parity` CI job. Mitigation: acceptable — that job already needs a Python toolchain, and
  PHASE-04 requires `matplotlib` to re-render the heatmap, so CI parity with local is worth the
  seconds.

### PHASE-02 - Locale-Aware Number Integrity Across All Three Languages

**Goal**
Extend the number-integrity apparatus over the language boundary it currently stops at. Give the
repository one shared locale-grouping helper; convert the deck's English text to numeric placeholders
so a translator never types a figure; add a guard over `assets/teaching/terminology-map.json`; make
`verify_deck_numbers.py` and `tools/verify_prose_figures.py` locale-aware and able to see 4-digit
figures; and repair the Vietnamese lesson that currently prints its loss coefficients in a form a
Vietnamese reader parses as a 1000x error.

**Tasks**
- [ ] TASK-02-01: Create `figure_format.py` at the repository root implementing S1: `format_figure`,
      `grouped_number_pattern`, `THOUSANDS_SEPARATOR`, `DECIMAL_SEPARATOR`, and `lang_for_path`.
      Give it the `# LIVE:` header comment convention used by the six root scripts, marked as a
      shared library rather than a runnable script:
      `# LIVE: shared library imported by build_oct_teaching_deck.py, verify_deck_numbers.py, tools/verify_prose_figures.py and tools/check_terminology_map.py. Not runnable on its own.`
- [ ] TASK-02-02: Create `tools/tests/test_figure_format.py` covering the cases under **Test
      Specs**. In this file and in the other new `tools/` modules, reach the root-level library with
      the two explicit lines
      `sys.path.insert(0, str(Path(__file__).resolve().parents[2]))` followed by
      `from figure_format import format_figure, grouped_number_pattern, lang_for_path` (adjust
      `parents[N]` per file depth: `parents[2]` from `tools/tests/`, `parents[1]` from `tools/`).
- [ ] TASK-02-03: In `build_oct_teaching_deck.py`, add the `FIGURES` dictionary from S2 step 2,
      reading every value from the already-loaded `SPINE` and `SWEEP` objects. Keep the existing
      module-level `L`, `CEVN`, `CKH`, `BAU`, `FACTORY`, `PASS_COUNT` bindings — other code paths and
      speaker notes use them.
- [ ] TASK-02-04: In `build_oct_teaching_deck.py`, convert every `TEXT["en"]` value that currently
      interpolates a number via an f-string into a `string.Template` template using the S2
      placeholder names. Affected keys, verified present today: `cold_open_body` (`${bau}`,
      `${ckh}`), `m2b_body` (`${market_energy}`, `${fees}`, `${ckh}`), `m5_body` (`${pass_count}`,
      `${cell_count}`), and `checkpoint[4]` (`${cell_count}`). Leave `m1_body` and
      `cold_open_title` as f-strings on `FACTORY` — a factory name is not a figure and must not be
      routed through `format_figure`. **Speaker-note strings built at the call sites of
      `content_slide(...)` (around lines 350, 375-378, 380-383) must keep using the existing
      `f"{...:,}"` interpolation and must NOT become templates** — speaker notes are English-only by
      design and intentionally carry exact answer-key numbers.
- [ ] TASK-02-05: In `build_oct_teaching_deck.py`, implement
      `apply_figures(text_layer: dict, lang: str) -> dict` per S2 step 4 and call it on the result of
      `load_text(lang)` inside `build(lang)`, before any slide is written. Walk plain string values,
      every element of the list values (`divider`, `checkpoint`, `appendix_titles`,
      `appendix_takeaways`) and the first element of each `m6_decoder_rows` tuple. Use
      `string.Template(...).substitute(...)`, never `safe_substitute`.
- [ ] TASK-02-06: Create `tools/check_terminology_map.py`, a new CI guard over
      `assets/teaching/terminology-map.json`. It must fail with a clear, actionable message when any
      of the following holds:
      1. a `vi` or `zh` value other than the literal `UNTRANSLATED` contains a grouped-number token
         matching either locale pattern from S1, or a bare run of four or more digits;
      2. the set of `${...}` placeholder names in a `vi` or `zh` value differs from the set in the
         same entry's `en` value (only checked when the translation is not `UNTRANSLATED`);
      3. an entry's `en` value differs from the corresponding live template in
         `build_oct_teaching_deck.py`'s `TEXT["en"]` (the snapshot has drifted);
      4. an `en` value contains a grouped-number token (numbers belong in `FIGURES`, not in the
         snapshot).
      Add a `--sync-en` mode that rewrites every `en` value from the live `TEXT["en"]` templates,
      preserving the file's 2-space JSON indentation and key order, and prints each key it changed.
      Import the live templates with
      `sys.path.insert(0, str(REPO_ROOT))` then `import build_oct_teaching_deck`; document in the
      docstring that the script must be run from the repository root because that module reads
      `assets/teaching/*.json` at import time.
- [ ] TASK-02-07: Run `python tools/check_terminology_map.py --sync-en` once to bring the 20 simple
      keys, the four list-key families and the decoder rows into placeholder form, then run
      `python tools/check_terminology_map.py` and confirm it exits 0. Every `vi` and `zh` value must
      still read exactly `UNTRANSLATED` afterwards (ASM-006) — verify with
      `grep -c UNTRANSLATED assets/teaching/terminology-map.json`, which must still report `66`
      (64 entry values plus 2 mentions inside the `meta` prose).
- [ ] TASK-02-08: Add a `translatorContract` key to `assets/teaching/terminology-map.json`'s `meta`
      object stating, in one paragraph: translations must preserve every `${placeholder}` exactly as
      written; must never contain a digit; a literal dollar sign must be written `$$`; and
      `python tools/check_terminology_map.py` is the acceptance check.
- [ ] TASK-02-09: Repair the Vietnamese digit grouping in `lessons/0009-scenario-3-excess-vi.html`.
      Convert every number inside a Vietnamese-language numeric context to `vi` grouping (`.` for
      thousands, `,` for decimals). The two known sites are line 46
      (`<div class="k">k×K_pp = 1.0342</div><div class="v">1.026 × 1.008</div>`) and line 90
      (`<code>5,000,000 × 1,100 × 1.026 × 1.008</code>` with `<td class="num">5,688,144,000</td>`).
      Under `vi` conventions these become `1,0342`, `1,026 × 1,008`, `5.000.000 × 1.100 × 1,026 ×
      1,008` and `5.688.144.000`. Sweep the whole file with
      `grep -nE "[0-9]{1,3}(,[0-9]{3})+|[0-9]+\.[0-9]{3}[^0-9]" lessons/0009-scenario-3-excess-vi.html`
      and convert every remaining hit. Do **not** touch `lessons/0009-scenario-3-excess-zh-cn.html`
      or any `-vi` file other than this one in this task — see RISK-02-04 for why the rest are
      deferred.
- [ ] TASK-02-10: Make `verify_deck_numbers.py` multilingual. Add `argparse` with `--deck PATH`
      (default `ceba/DPPA Presentation Oct 2026 To Teach.pptx`) and
      `--lang {en,vi,zh}` (default `en`). Derive `NUMBER_PATTERN` from
      `grouped_number_pattern(lang)` and build the `allowed` set with `format_figure(value, lang)`
      instead of `f"{value:,}"` in both `collect_spine_numbers` and `collect_sweep_numbers`. Format
      the `EXTRA_ALLOWED` entry (`"2,617"`) through `format_figure` too, by storing it as the
      integer `2617` with its existing explanatory comment. If `--deck` names a file that does not
      exist, print `DECK NOT PRESENT: <path> — skipping` and exit **0** (ASM-005).
- [ ] TASK-02-11: Make `tools/verify_prose_figures.py` locale-aware and lower its floor. Replace
      `TOKEN_RE` with a per-file pattern chosen by `lang_for_path(path)`; change the quantifier from
      `{2,}` to `+` so 4-digit grouped figures are seen; lower `_add_if_large`'s threshold from
      `1_000_000` to `1_000`; extend `canonical_figures` to also admit every
      `*VndMillionsRounded` field, the spine `inputs` scalars `fmp`, `strikePrice`, `retailTariff`,
      `serviceFee`, `clearingFee`, and — from a newly loaded `assets/teaching/gate-sweep.json` — the
      `strikes` array and `passCount`. Format every canonical figure through `format_figure` for the
      file's language so a `-vi.html` file is compared against dot-grouped forms.
- [ ] TASK-02-12: Run `python tools/verify_prose_figures.py` and triage every new violation. For each
      hit, decide: **stale** (fix the prose to the current figure) or **justified** (add an entry to
      `tools/prose_figure_literals.json` with a `reason` naming the file and why the figure is not a
      spine export, following the existing entries' style). Apply ASM-004's escape valve if the
      justified count would exceed 40. Record the final tally (violations found, prose fixes,
      literals added) in the phase report.
- [ ] TASK-02-13: Extend the guard scan lists in `tools/retired_figures.json`. Add
      `"assets/teaching/*.json"` to the `scan` array and `"app/src/data/*.js"` to the `scanScripts`
      array. **Do not add `tools/*.json`** — `retired_figures.json`'s own `notes` field quotes
      retired strings as examples and would self-trip (see Gotchas). Update the
      `scanScriptsNote` text to mention `app/src/data/*.js` and explain that
      `app/src/data/teach-steps.js` carries hand-typed answer-key figures in its `expected` strings.
- [ ] TASK-02-14: Mirror the same two additions in `tools/verify_prose_figures.py`'s
      `SCAN_PATTERNS` for `assets/teaching/*.json` only (not the `.js` data files — those are code,
      covered by the retired-figures generator scan).
- [ ] TASK-02-15: Create `tools/tests/test_check_terminology_map.py` covering the cases under
      **Test Specs**.
- [ ] TASK-02-16: Wire the new and changed checks into `.github/workflows/ci.yml`'s `deck-parity`
      job, after the existing `python verify_deck_numbers.py` step:
      `python tools/check_terminology_map.py`, then
      `python verify_deck_numbers.py --lang vi --deck "ceba/DPPA Presentation Oct 2026 To Teach vi.pptx"`,
      then the equivalent `--lang zh` line. The latter two exit 0 today because the decks do not
      exist yet (ASM-005) and become real checks the moment a translated deck is committed.
- [ ] TASK-02-17: Rebuild the English deck and re-run the full verification chain to prove the
      placeholder refactor is output-neutral:
      ```bash
      PYTHONPATH= py build_oct_teaching_deck.py --lang en
      PYTHONPATH= py audit_teaching_deck.py
      PYTHONPATH= py verify_deck_numbers.py
      ```
      All three must exit 0, and `verify_deck_numbers.py` must report the same `PARITY PASS — N
      figures` count as before the refactor.
- [ ] TASK-02-18: Update `NOTES.md`'s "Repo layout" section: the root now carries the six live
      scripts **plus** `figure_format.py`, a shared library. Add a short "Locale rule" subsection
      stating DEC-003's grouping rule, naming `figure_format.py` as its single owner, and stating
      DEC-002 (numbers never enter a translation).

**File Changes**
- `figure_format.py` (create): the shared locale helper described in S1.
- `tools/tests/test_figure_format.py` (create): unit tests for the helper.
- `build_oct_teaching_deck.py` (modify): add `FIGURES`; convert the four numeric `TEXT["en"]` values
  to `string.Template` form; add `apply_figures` and call it in `build(lang)` after `load_text`;
  import `format_figure` from `figure_format`. Leave `load_text`'s `UNTRANSLATED` abort logic, the
  slide-construction helpers, and every speaker-note f-string untouched.
- `tools/check_terminology_map.py` (create): the new guard plus `--sync-en`.
- `tools/tests/test_check_terminology_map.py` (create): unit tests for the new guard.
- `assets/teaching/terminology-map.json` (modify): `en` values synced to placeholder form by
  `--sync-en`; new `meta.translatorContract` paragraph. Every `vi`/`zh` value stays `UNTRANSLATED`.
- `verify_deck_numbers.py` (modify): add `--deck` and `--lang`; locale-aware pattern and allowed
  set; missing-deck skip path; store `EXTRA_ALLOWED` as integers.
- `tools/verify_prose_figures.py` (modify): per-file locale pattern; `+` quantifier; `1_000`
  threshold; expanded canonical set including `gate-sweep.json`; `assets/teaching/*.json` added to
  `SCAN_PATTERNS`.
- `tools/prose_figure_literals.json` (modify): new justified literals from TASK-02-12 triage only.
  Do not remove or reword existing entries.
- `tools/retired_figures.json` (modify): `scan` gains `assets/teaching/*.json`; `scanScripts` gains
  `app/src/data/*.js`; `scanScriptsNote` updated. Leave the `retired` array untouched in this phase.
- `lessons/0009-scenario-3-excess-vi.html` (modify): Vietnamese digit grouping only. Do not change
  any Vietnamese wording, any HTML structure, or any figure's value.
- `.github/workflows/ci.yml` (modify): three new steps in `deck-parity` as listed in TASK-02-16.
- `NOTES.md` (modify): repo-layout line count and a new "Locale rule" subsection.

**Function Signatures**
- `format_figure(value: int, lang: str = "en") -> str` — the integer grouped per DEC-003 for `lang`
  (`format_figure(9063456789, "vi")` → `"9.063.456.789"`); raises `ValueError` on a non-integer or
  an unknown `lang`.
- `grouped_number_pattern(lang: str = "en") -> re.Pattern[str]` — a compiled pattern matching one or
  more thousands groups in that locale's convention.
- `lang_for_path(path: str | Path) -> str` — `"vi"` when the filename stem ends `-vi`, `"zh"` when it
  ends `-zh` or `-zh-cn`, otherwise `"en"`.
- `THOUSANDS_SEPARATOR: dict[str, str]` — `{"en": ",", "vi": ".", "zh": ","}`.
- `DECIMAL_SEPARATOR: dict[str, str]` — `{"en": ".", "vi": ",", "zh": "."}`.
- `apply_figures(text_layer: dict, lang: str) -> dict` (in `build_oct_teaching_deck.py`) — the same
  dictionary shape with every `${placeholder}` substituted by its locale-formatted figure.
- `check_map(map_path: Path, live_text: dict) -> list[str]` (in `tools/check_terminology_map.py`) —
  the list of violation strings; empty means clean.
- `sync_en(map_path: Path, live_text: dict) -> list[str]` (in `tools/check_terminology_map.py`) —
  the list of keys whose `en` value was rewritten.
- `main(argv: list[str] | None = None) -> int` (in `tools/check_terminology_map.py`) — `0` clean,
  `1` violations found.
- `verify_deck_numbers.main(argv: list[str] | None = None) -> None` (modify) — parses `--deck` and
  `--lang`; exits 0 on pass or missing deck, 1 on unreconciled figures.

**Test Specs**
- `format_figure(9063456789, "en")` → `"9,063,456,789"`; `format_figure(9063456789, "vi")` →
  `"9.063.456.789"`; `format_figure(9063456789, "zh")` → `"9,063,456,789"`.
- `format_figure(11020, "vi")` → `"11.020"`; `format_figure(500, "vi")` → `"500"` (no separator
  below 1,000); `format_figure(0, "en")` → `"0"`; `format_figure(-500000, "vi")` → `"-500.000"`.
- `format_figure(1427.35, "en")` → raises `ValueError`; `format_figure(100, "fr")` → raises
  `ValueError`.
- `grouped_number_pattern("vi").findall("Hôm nay: 11.020 tr VND")` → `["11.020"]`;
  `grouped_number_pattern("en").findall("Hôm nay: 11.020 tr VND")` → `[]`.
- `lang_for_path("lessons/0009-scenario-3-excess-vi.html")` → `"vi"`;
  `lang_for_path("lessons/0010-group-workshop-zh-cn.html")` → `"zh"`;
  `lang_for_path("NOTES.md")` → `"en"`.
- `apply_figures({"a": "Today: ${bau} tr VND"}, "vi")` with `FIGURES["bau"] == 11020` →
  `{"a": "Today: 11.020 tr VND"}`.
- `apply_figures({"a": "${nosuchkey}"}, "en")` → raises `KeyError`.
- `check_map` on a map whose `vi` value is `"Hôm nay: 11.020 tr VND"` → one violation containing
  `must not contain a digit`.
- `check_map` on a map whose `en` value is `"Today: ${bau} tr VND"` and whose `vi` value is
  `"Hôm nay: tr VND"` (placeholder dropped) → one violation containing `placeholder`.
- `check_map` on a map whose `vi` value is exactly `UNTRANSLATED` → no violation from rules 1 and 2.
- `check_map` on a map whose `en` value is `"Today: 11,020 tr VND"` → one violation containing
  `numbers belong in FIGURES`.
- `check_map` on a map whose `en` value differs from the live template → one violation containing
  `snapshot has drifted` and naming the key.
- `sync_en` on that drifted map → returns the drifted key name, and a subsequent `check_map` on the
  written file returns `[]`.
- `verify_deck_numbers.main(["--lang", "vi", "--deck", "ceba/does-not-exist.pptx"])` → exits 0,
  stdout contains `DECK NOT PRESENT`.
- `verify_deck_numbers.main([])` against the committed English deck → exits 0, stdout contains
  `PARITY PASS`.

**Dependencies**
- None. Independent of PHASE-01 (no shared files) and safely parallel with it.

**Exit Criteria**
- [ ] `python -m unittest discover -s tools/tests -v` passes, including the two new test modules.
- [ ] `python tools/check_terminology_map.py` exits 0 and prints a clean summary.
- [ ] `grep -c UNTRANSLATED assets/teaching/terminology-map.json` still reports `66`.
- [ ] `python -c "import json,re;m=json.load(open('assets/teaching/terminology-map.json',encoding='utf-8'))['entries'];bad=[k for k,v in m.items() if re.search(r'\d{1,3}([.,]\d{3})+', v.get('en',''))];print(bad)"`
      prints `[]`.
- [ ] `PYTHONPATH= py build_oct_teaching_deck.py --lang en` exits 0 and the rebuilt deck passes both
      `PYTHONPATH= py audit_teaching_deck.py` and `PYTHONPATH= py verify_deck_numbers.py`.
- [ ] `PYTHONPATH= py build_oct_teaching_deck.py --lang vi` still aborts with the
      `ERROR: cannot build --lang vi — 31 terminology-map.json entries are UNTRANSLATED` message
      (the translation gate is intact).
- [ ] `python verify_deck_numbers.py --lang vi --deck "ceba/DPPA Presentation Oct 2026 To Teach vi.pptx"`
      exits 0 with `DECK NOT PRESENT`.
- [ ] `python tools/verify_prose_figures.py` exits 0 and its printed token count is **greater** than
      the pre-change 377 (proving the lowered floor sees more).
- [ ] `python tools/check_retired_figures.py` exits 0 and its printed file count is greater than the
      pre-change 42.
- [ ] `grep -nE "[0-9]{1,3},[0-9]{3}" lessons/0009-scenario-3-excess-vi.html` returns no matches.

**Phase Risks**
- **RISK-02-01:** `string.Template.substitute` raises on any stray `$` in deck text or a translation.
  Mitigation: TASK-02-06's guard rule set does not currently check for bare `$`; add a fifth rule
  failing on a `$` that is not part of `${name}` and not doubled as `$$`, and state the rule in
  `meta.translatorContract`.
- **RISK-02-02:** `--sync-en` could silently reorder or reformat `terminology-map.json` and produce
  an enormous diff. Mitigation: write with `json.dump(..., indent=2, ensure_ascii=False)` and confirm
  with `git diff --stat assets/teaching/terminology-map.json` that only the intended `en` lines plus
  the new `meta` key changed; if unrelated lines moved, fix the writer before committing.
- **RISK-02-03:** Lowering the prose-figure floor could produce a large violation list that blocks
  the phase. Mitigation: ASM-004's binding default caps the triage and gives an explicit split-floor
  fallback.
- **RISK-02-04:** Repairing only one Vietnamese lesson leaves the other `-vi` and `-zh-cn` files in
  `en` grouping, so `lang_for_path` will classify them as `vi`/`zh` and the locale-aware prose
  verifier will stop seeing their comma-grouped figures — silently reducing coverage on those files.
  Mitigation: in TASK-02-11, when a file's language is not `en`, run **both** the file's locale
  pattern and the `en` pattern and validate hits against the corresponding canonical formatting; a
  file may legitimately be mid-migration. Record in `NOTES.md` that
  `lessons/0009-scenario-3-excess-vi.html` is the only file converted so far and that the remaining
  `-vi`/`-zh-cn` lessons are a follow-up item.
- **RISK-02-05:** Importing `build_oct_teaching_deck` inside a `tools/` guard executes its
  module-level JSON reads, which use paths relative to the current working directory. Mitigation:
  document "run from the repository root" in the guard's docstring, and have the guard `os.chdir` to
  `REPO_ROOT` before the import so it works from any directory.

### PHASE-03 - Honest Teaching Defaults in the App

**Goal**
Make the web app's shipped default state demonstrate the escalation-differential mechanism the
project exists to teach, instead of showing a 20-year loss with no crossover to anyone who scans the
QR code. Make the differential itself visible, give the presenter a one-click "locked strike"
contrast, retarget the M4 teach step so the buyer-gate demo can actually fail, and settle the app's
name and hero copy before the English content freeze.

**Tasks**
- [ ] TASK-03-01: Record the "before" behaviour so the change is provable. From `app/`, run:
      ```bash
      node -e "import('./src/data/default-scenarios.js').then(async(d)=>{const s=await import('./src/modules/settlement.js');const sc=d.scenarioProfiles[d.defaultInputs.scenarioId];const inp={...d.defaultInputs,loadProfile:sc.loadProfile,generationProfile:sc.generationProfile,fmpCurve:d.buildFmpCurve(d.defaultInputs.marketPrice),monthlyVolumes:sc.monthlyVolumes};const r=s.projectMultiYear(inp,{years:20,evnEscalation:d.defaultInputs.evnEscalation,strikeEscalation:d.defaultInputs.strikeEscalation});console.log('crossover',r.crossoverYear,'lifetimeSavingsMillions',Math.round(r.rollups.lifetime.savings/1e6));})"
      ```
      Expected before the change: `crossover null lifetimeSavingsMillions -65695`.
- [ ] TASK-03-02: In `app/src/data/default-scenarios.js`, change `strikeEscalation` from `0.04` to
      `0.02` and replace its trailing comment with ASM-002's provenance text. Leave `evnEscalation`,
      `lossFactor`, `retailTariff`, `strikePrice`, `marketPrice`, `dppaServiceFee`,
      `dppaClearingFee`, `dppaCharge` and `horizonYears` untouched.
- [ ] TASK-03-03: Re-run TASK-03-01's command and confirm it now prints
      `crossover 14 lifetimeSavingsMillions 66656`.
- [ ] TASK-03-04: Prove the change is app-only and does not move any generated figure:
      ```bash
      cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && cd ..
      git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json assets/teaching/gate-sweep.json
      ```
      The `git diff` must exit 0. If it does not, stop and investigate before continuing — a spine
      change would mean the deck needs rebuilding and the retirement rule applies.
- [ ] TASK-03-05: In `app/src/modules/ui.js`'s `renderMultiYearPanel`, add an escalation-differential
      entry as the **first** child of the `paramsEl` inline-assumptions row, formatted
      `Differential +X.X%/yr` where `X.X` is `((evnEscalation - strikeEscalation) * 100).toFixed(1)`.
      Keep the existing `EVN …`, `Strike …`, `FMP flat`, `Rep. day × 365` spans and their order after
      it. Match the file's existing style (single quotes, no semicolons).
- [ ] TASK-03-06: In `app/src/modules/ui.js`'s `renderAppShell`, add a second button to the
      controls-panel header beside `#resetButton`:
      `<button class="ghost-button" id="lockedStrikeButton" type="button">Locked strike</button>`.
      Do not restructure the panel header or change `#resetButton`.
- [ ] TASK-03-07: In `app/src/main.js`'s `syncControls`, add a click handler for
      `#lockedStrikeButton` that sets `state.strikeEscalation = 0`, then calls `syncInputsFromState()`
      and `updateView()`. Place it immediately after the existing `#resetButton` handler and match
      that handler's shape exactly.
- [ ] TASK-03-08: Retarget the M4 teach step in `app/src/data/teach-steps.js` so the buyer gate can
      fail. Change its `controls` to
      `{ marketPrice: 1150, strikePrice: 1350, horizonYears: 20 }` and rewrite `annotation` and
      `expected` to describe a failing-then-passing demo: the annotation instructs the presenter to
      read the crossover at strike 1,350, then drag the strike down and watch the gate close; the
      expected line states that at strike 1,350 the buyer gate fails on the 20-year cumulative and
      that lowering the strike restores it. Keep the step's `module: 4`, `scenarioId: 'workshop1'`
      and `scrollTo: '#multiYearChart'`. Do not put any VND figure in the new strings — the other
      steps' figures are hand-typed and `app/src/data/*.js` becomes guard-scanned in PHASE-02
      TASK-02-13.
- [ ] TASK-03-09: Verify the retargeted step actually demonstrates a failure. Run the TASK-03-01
      command with `scenarioId: 'workshop1'`, `strikePrice: 1350`, `marketPrice: 1150`,
      `evnEscalation: 0.04`, `strikeEscalation: 0.02`, `years: 20` and record the resulting
      `crossoverYear` and lifetime savings. If the crossover is year 1 (the gate cannot fail), raise
      the step's `strikePrice` in 50-VND increments up to 1,550 until the crossover is either `null`
      or greater than 5, then use that value and record it in the phase report.
- [ ] TASK-03-10: Regenerate the six teach-mode fallback recordings, because M4's step changed:
      `cd app && npm run record:demos`. Confirm all six
      `assets/teaching/fallback/teach-m{1..6}.mp4` and `teach-m{1..6}-poster.png` files are rewritten
      (check `git status --porcelain assets/teaching/fallback/`).
- [ ] TASK-03-11: Rebuild the deck so the refreshed M4 recording is embedded, and re-verify:
      ```bash
      PYTHONPATH= py build_oct_teaching_deck.py --lang en
      PYTHONPATH= py audit_teaching_deck.py
      PYTHONPATH= py verify_deck_numbers.py
      ```
- [ ] TASK-03-12: Settle the app's name. In `app/index.html`, change `<title>` from
      `Vietnam DPPA Neon CFO Calculator` to `Vietnam DPPA CFO Calculator`, matching the existing
      `og:title`. In `app/README.md`, change the `# Vietnam DPPA Neon CFO Calculator` heading to
      `# Vietnam DPPA CFO Calculator`. Leave the in-page `<h1>DPPA CFO visual explainer` in
      `app/src/modules/ui.js` unchanged — it is a descriptive subtitle, not the product name, and is
      referenced by tests.
- [ ] TASK-03-13: Relocate the hero caveat. In `app/src/modules/ui.js`'s `renderAppShell`, shorten
      the `.hero-copy` paragraph to
      `Click any hour to compare the 2025 teaching-model baseline against DPPA payment.` and move the
      substance of the removed clause into the existing `.assumptions-inline` row in the controls
      panel as a new final span:
      `<span>Illustrative FMP — no primary NSMO/ERAV series</span>`. Keep every other span in that
      row.
- [ ] TASK-03-14: Update `app/src/modules/ui.test.js` for the three UI changes: the new
      `Differential` span, the new `#lockedStrikeButton`, and the shortened hero copy. Add a positive
      assertion for the differential text at known inputs rather than only fixing broken assertions.
- [ ] TASK-03-15: Add an end-to-end assertion for the preset. In `app/e2e/controls.spec.js`, add a
      test that loads `/?test=1`, dismisses the tour via
      `localStorage.setItem("dppa-tour-done","1")` and a reload (copy the pattern from
      `e2e/visual.spec.js`), reads the `#multiYearRollups` crossover pill, clicks
      `#lockedStrikeButton`, and asserts the crossover pill's text changed and the
      `#multiYearParams` row shows `Differential +4.0%/yr`. Match the file's style (semicolons,
      double quotes).
- [ ] TASK-03-16: Update `NOTES.md` to record the new default (`strikeEscalation` 0.02), the
      escalation-differential readout, the "Locked strike" preset, and the retargeted M4 teach step
      with its chosen strike value.

**File Changes**
- `app/src/data/default-scenarios.js` (modify): `strikeEscalation: 0.04` → `0.02` plus the provenance
  comment. Nothing else.
- `app/src/modules/ui.js` (modify): differential span in `renderMultiYearPanel`; `#lockedStrikeButton`
  in `renderAppShell`'s controls-panel header; shortened `.hero-copy`; new final span in
  `.assumptions-inline`. Leave every other render function untouched.
- `app/src/main.js` (modify): a `#lockedStrikeButton` click handler in `syncControls`, immediately
  after the `#resetButton` handler. Nothing else.
- `app/src/data/teach-steps.js` (modify): the M4 entry's `controls`, `annotation` and `expected`
  only. Leave steps 1, 2, 3, 5, 6 exactly as they are.
- `app/index.html` (modify): the `<title>` text only.
- `app/README.md` (modify): the H1 heading only.
- `app/src/modules/ui.test.js` (modify): assertions for the three UI changes plus a new positive
  differential test.
- `app/e2e/controls.spec.js` (modify): one new test for the "Locked strike" preset.
- `assets/teaching/fallback/teach-m{1..6}.mp4`, `teach-m{1..6}-poster.png` (modify): regenerated
  binaries from `npm run record:demos`.
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (modify): rebuilt by the deck builder.
- `NOTES.md` (modify): a dated subsection recording the four app changes.

**Function Signatures**
- `renderMultiYearPanel(multiYear: object, currency: string) -> void` (modify) — unchanged signature;
  now also renders the escalation differential. `multiYear` already carries `evnEscalation` and
  `strikeEscalation`, so no new parameter is needed.
- `renderAppShell(root: Element, scenarios: object[], settlementModes: object[]) -> void` (modify) —
  unchanged signature; markup gains `#lockedStrikeButton` and one assumptions span.

**Test Specs**
- `projectMultiYear` at scenario `balanced`, `strikePrice: 2000`, `marketPrice: 1427`,
  `{years: 20, evnEscalation: 0.04, strikeEscalation: 0.02}` → `crossoverYear === 14` and
  `Math.round(rollups.lifetime.savings / 1e6) === 66656`.
- `projectMultiYear` at the same scenario with `strikeEscalation: 0` → `crossoverYear === 9` and
  `Math.round(rollups.lifetime.savings / 1e6) === 170430`.
- `renderMultiYearPanel({rollups, crossoverYear: 14, years: 20, evnEscalation: 0.04, strikeEscalation: 0.02}, 'VND')`
  → `#multiYearParams` text contains `Differential +2.0%/yr`.
- Same call with `strikeEscalation: 0` → text contains `Differential +4.0%/yr`.
- Same call with `strikeEscalation: 0.04` → text contains `Differential +0.0%/yr` (the zero case must
  render, not be hidden — it is the honest label for a fully indexed strike).
- End-to-end: load `/?test=1`, set `dppa-tour-done`, reload, click `#lockedStrikeButton` →
  `#multiYearParams` contains `Differential +4.0%/yr` and the crossover pill text differs from its
  pre-click value.
- `#resetButton` after clicking `#lockedStrikeButton` → `#multiYearParams` returns to
  `Differential +2.0%/yr` (reset restores `defaultInputs`).
- Hero copy: `renderAppShell` output does **not** contain `NSMO`, and the controls panel's
  `.assumptions-inline` **does** contain `NSMO`.

**Dependencies**
- None. Parallel with PHASE-01 and PHASE-02. **Must land before the 2026-09-15 English content
  freeze** (CON-002) because TASK-03-12 and TASK-03-13 change audience-facing English copy.

**Exit Criteria**
- [ ] `cd app && npm test` passes with at least three new unit assertions (57 baseline plus
      additions).
- [ ] `cd app && npm run e2e` passes with 28 or more tests (27 baseline plus the preset test).
- [ ] `cd app && npm run lint` exits 0.
- [ ] `cd app && npm run build` exits 0.
- [ ] The TASK-03-01 command prints `crossover 14 lifetimeSavingsMillions 66656`.
- [ ] `git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json assets/teaching/gate-sweep.json`
      exits 0 after re-running both export scripts.
- [ ] `grep -c "Neon" app/index.html app/README.md` returns `0` for both files.
- [ ] `PYTHONPATH= py audit_teaching_deck.py && PYTHONPATH= py verify_deck_numbers.py` both exit 0
      against the rebuilt deck.
- [ ] All six `assets/teaching/fallback/teach-m*.mp4` files appear as modified in
      `git status --porcelain`.

**Phase Risks**
- **RISK-03-01:** `npm run record:demos` needs Playwright browsers and `ffmpeg-static`, and produces
  six MP4s plus six posters. If it fails, the deck's fallback slides keep the previous M4 recording,
  which would then contradict the retargeted teach step. Mitigation: run
  `cd app && npx playwright install --with-deps chromium` first; if recording still fails, revert
  TASK-03-08's teach-step change and complete the rest of the phase, recording the deferral
  explicitly — a stale recording contradicting a live step is worse than an unchanged step.
- **RISK-03-02:** `ui.test.js` (363 lines) and four Playwright specs assert on rendered text, so the
  hero-copy and markup changes will break assertions. Mitigation: this is expected; TASK-03-14
  budgets for it. Run `cd app && npx vitest run src/modules/ui.test.js` after each edit rather than
  the full suite, for a fast loop.
- **RISK-03-03:** Changing `strikeEscalation` alters the presenter's rehearsed M4 narrative from
  July. Mitigation: TASK-03-16 records the change in `NOTES.md`, and PHASE-04 TASK-04-08 updates the
  facilitator guide's M4/M5 rows in the same pass.
- **RISK-03-04:** The differential span is added to a row rendered on every `updateView()` call; a
  malformed template string would break the whole multi-year panel. Mitigation: the unit tests in
  **Test Specs** cover all three differential cases including zero.

### PHASE-04 - Gate-Sweep Credibility: A Grid Wider Than Its Thresholds

**Goal**
Today's headline "5 of 56 scenarios pass all three gates" is decided entirely by the single strike
column at 1,450 VND/kWh, because the investor threshold is exactly the maximum strike in the grid.
Extend the grid past both developer-side thresholds so the result is a finding rather than a
clipping artifact, make `DSCR_TARGET` load-bearing, export the per-gate decomposition, and replace
every hard-coded literal `56` with the computed cell count across all three languages of generator
text and all living prose.

**Tasks**
- [ ] TASK-04-01: Record the "before" decomposition for the phase report:
      ```bash
      python -c "import json;d=json.load(open('assets/teaching/gate-sweep.json',encoding='utf-8'));c=d['cells'];print('cells',len(c),'buyer',sum(x['buyerPass'] for x in c),'lender',sum(x['lenderPass'] for x in c),'investor',sum(x['investorPass'] for x in c),'all',d['passCount']);print('passing',[(x['strike'],x['ratio']) for x in c if x['allPass']])"
      ```
      Expected: `cells 56 buyer 52 lender 14 investor 7 all 5` and all five passing cells at strike
      `1450`.
- [ ] TASK-04-02: In `app/scripts/export-sweep.mjs`, extend `STRIKES` to
      `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]` (ASM-003). Leave `RATIOS`
      unchanged at seven values. Update the file's header comment, which currently says "56-cell",
      to describe the grid as `STRIKES.length × RATIOS.length` rather than a literal.
- [ ] TASK-04-03: In the same file, rewrite the lender gate into DSCR form per S4: rename
      `LENDER_DEBT_SERVICE_VND_PER_KWH` to `LENDER_BASE_DEBT_SERVICE_VND_PER_KWH = 1150`, compute
      `lenderPass = (strike / LENDER_BASE_DEBT_SERVICE_VND_PER_KWH) >= DSCR_TARGET`, and export
      `lenderBaseDebtServiceVndPerKwh` in `meta` alongside the existing `dscrTarget`. Add a `dscr`
      field to each cell (the computed ratio, rounded to 3 decimals) so the exported data can back a
      question about any cell. Keep the `ASM-003` illustrative-proxy comment and extend it to state
      that the grid now extends past both thresholds deliberately.
- [ ] TASK-04-04: In the same file's `buildSweep`, add a `gateCounts` object to the returned JSON:
      `{ buyer, lender, investor, all, total }`, each an integer count over all cells. Keep
      `passCount` for backward compatibility with `build_teaching_visuals.py` and
      `build_oct_teaching_deck.py`.
- [ ] TASK-04-05: Keep the existing anchor self-check intact — `yearBill(1250, 1.0, 1).cKh` must
      still equal `9063196000`. Confirm the script still prints its anchor line and no
      `Anchor mismatch` error.
- [ ] TASK-04-06: Regenerate and read the new truth:
      ```bash
      cd app && node scripts/export-sweep.mjs && cd ..
      python -c "import json;d=json.load(open('assets/teaching/gate-sweep.json',encoding='utf-8'));print(d['gateCounts']);print('passCount',d['passCount'],'cells',len(d['cells']))"
      ```
      Record the printed `passCount` and cell count. Every text substitution below uses **these**
      values, never a predicted one.
- [ ] TASK-04-07: Replace every hard-coded `56` in live generator text with the computed cell count.
      - `build_teaching_visuals.py`: `TEXTS["en"]["m5_title"]`, `TEXTS["en"]["m5_caption"]`,
        `TEXTS["vi"]["m5_title"]`, `TEXTS["vi"]["m5_caption"]`, `TEXTS["zh"]["m5_title"]`,
        `TEXTS["zh"]["m5_caption"]` — convert each to a `str.format` template with a `{total}` field
        alongside the existing `{n}`, and pass `total=len(sweep["cells"])` at both call sites in
        `render_m5_heatmap`. Change the centred label from `f"{pass_count} / 56"` to
        `f"{pass_count} / {len(strikes) * len(ratios)}"`. Update the
        `# ---------- M5: 56-scenario gate heatmap ----------` section comment and the `strikes`
        inline comment that says "8 values".
      - `build_oct_teaching_deck.py`: define `CELL_COUNT = len(SWEEP["cells"])` next to
        `PASS_COUNT`; use `${cell_count}` (already registered in PHASE-02's `FIGURES`) in
        `TEXT["en"]["m5_title"]`, `TEXT["en"]["m5_body"]` and `TEXT["en"]["checkpoint"][4]`; use
        `CELL_COUNT` in the two speaker-note f-strings around lines 380 and 383.
- [ ] TASK-04-08: Update living prose. In `facilitator/dppa-workshop-facilitator-guide.md` (the
      lines currently reading "only **5 of 56 scenarios**" and the `M5 reveal` run-of-show row) and
      `facilitator/dppa-panel-guide.md` (the "narrow-window finding" line), replace the counts with
      the new values. In the workshop guide's M5 section, add the per-gate decomposition as a short
      table using the new `gateCounts` values — "buyer N, lender N, investor N, all three N" — with
      one sentence naming which gate binds. Add one sentence recording the FMP-path divergence from
      S3: the app's multi-year projection holds FMP flat while the gate sweep escalates it at 4%/yr,
      and the presenter should state that if asked.
- [ ] TASK-04-09: Apply the retirement rule. Add these entries to `tools/retired_figures.json`'s
      `retired` array **in the same commit** as TASK-04-07, each with `reason`,
      `replacedBy` (the new computed string) and `retiredOn: "2026-07-26"`:
      `"5 of 56"`, `"5/56"`, `"5 / 56"`, `"of 56"`, `"56 scenarios"`, `"56 kịch bản"`,
      `"56种情景"`. The `notes` field of that file already pre-writes this exact list — follow it.
      Then run `python tools/check_retired_figures.py` and fix every file it flags until it exits 0.
- [ ] TASK-04-10: Update `NOTES.md`'s "October readiness hardening" subsection (which states
      "Current computed result: **5 of 56**") and `RESOURCES.md`'s October-deck entry (which states
      "56-scenario gate sweep, current result 5/56") to the new values. These two files are
      guard-scanned, so TASK-04-09 will fail until they are updated.
- [ ] TASK-04-11: Install the Python visual dependencies and re-render the M5 heatmap in all three
      languages:
      ```bash
      python -m pip install -r requirements.txt
      PYTHONPATH= py build_teaching_visuals.py --lang en
      PYTHONPATH= py build_teaching_visuals.py --lang vi
      PYTHONPATH= py build_teaching_visuals.py --lang zh
      ```
      Confirm `assets/teaching/m5-gate-heatmap-{en,vi,zh}.png` are all rewritten and that the centred
      label reads the new `passCount / cellCount`.
- [ ] TASK-04-12: Re-sync the terminology map's `en` snapshots, because `m5_title`, `m5_body` and
      `checkpoint.4` changed: `python tools/check_terminology_map.py --sync-en`, then
      `python tools/check_terminology_map.py` must exit 0. Any `vi`/`zh` value for those keys that was
      already translated and contains `56` must be reset to `UNTRANSLATED` and listed in the phase
      report so the translator retranslates it — check with
      `python -c "import json;e=json.load(open('assets/teaching/terminology-map.json',encoding='utf-8'))['entries'];print([k for k,v in e.items() if any('56' in str(v.get(l,'')) for l in ('vi','zh'))])"`.
- [ ] TASK-04-13: Rebuild and re-verify the deck:
      ```bash
      PYTHONPATH= py build_oct_teaching_deck.py --lang en
      PYTHONPATH= py audit_teaching_deck.py
      PYTHONPATH= py verify_deck_numbers.py
      ```
      `verify_deck_numbers.py` must reconcile the new strike values, which it will because they come
      from `gate-sweep.json`'s `strikes` array via `collect_sweep_numbers`.

**File Changes**
- `app/scripts/export-sweep.mjs` (modify): extended `STRIKES`; DSCR-form lender gate with
  `LENDER_BASE_DEBT_SERVICE_VND_PER_KWH`; per-cell `dscr`; `gateCounts` in the output; updated
  header and inline comments. Keep the anchor self-check and `RATIOS` unchanged.
- `assets/teaching/gate-sweep.json` (modify): regenerated.
- `build_teaching_visuals.py` (modify): six `m5_*` text entries become `{total}`-aware templates; the
  heatmap's centred label and section comments use the computed count. Change no other visual.
- `build_oct_teaching_deck.py` (modify): add `CELL_COUNT`; use `${cell_count}` in the three
  translatable M5 strings and `CELL_COUNT` in the two M5 speaker notes.
- `assets/teaching/m5-gate-heatmap-en.png`, `-vi.png`, `-zh.png` (modify): re-rendered.
- `assets/teaching/terminology-map.json` (modify): `en` snapshots re-synced; any `56`-bearing
  translation reset to `UNTRANSLATED`.
- `facilitator/dppa-workshop-facilitator-guide.md` (modify): new counts, the per-gate decomposition
  table, and the FMP-path sentence.
- `facilitator/dppa-panel-guide.md` (modify): the narrow-window finding's counts.
- `tools/retired_figures.json` (modify): seven new `retired` entries.
- `NOTES.md`, `RESOURCES.md` (modify): the two stated pass-count figures.
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (modify): rebuilt.

**Function Signatures**
- `evaluateCell(strike: number, ratio: number) -> { strike, ratio, dscr, buyerPass, lenderPass, investorPass, allPass, lifetimeDppaVnd, lifetimeBauVnd }`
  (modify) — adds `dscr`, the strike-to-base-debt-service ratio rounded to 3 decimals.
- `buildSweep() -> { meta, strikes, ratios, cells, passCount, gateCounts }` (modify) — adds
  `gateCounts: { buyer: number, lender: number, investor: number, all: number, total: number }`.
- `render_m5_heatmap(lang: str, spine: dict, sweep: dict) -> str` (modify) — unchanged signature and
  return (the written PNG path); now derives the total cell count from the sweep instead of the
  literal 56.

**Test Specs**
- After TASK-04-06, `len(gate-sweep.json["cells"]) == 70` and
  `gateCounts["total"] == 70`.
- `gateCounts["buyer"] + (cells where not buyerPass)` equals `70` (the counts partition the grid).
- `gateCounts["all"] <= min(gateCounts["buyer"], gateCounts["lender"], gateCounts["investor"])`.
- Every cell with `strike >= 1380` has `lenderPass === true`; every cell with `strike < 1380` has
  `lenderPass === false` (proves S4's rewrite is the claimed algebraic identity):
  ```bash
  cd app && node -e "import('./scripts/export-sweep.mjs').then(m=>{const s=m.buildSweep();const bad=s.cells.filter(c=>c.lenderPass!==(c.strike>=1380));console.log('mismatches',bad.length)})"
  ```
  → prints `mismatches 0`.
- `yearBill(1250, 1.0, 1).cKh === 9063196000` — the anchor self-check still passes, so the extended
  grid did not disturb the S1 basis.
- `passCount` after the change is strictly greater than 5 and strictly less than 70 (a headline that
  is neither vacuous nor universal). If it is 0 or 70, stop and report — the thresholds or the grid
  need rethinking, and that is a human decision (H3).
- `python tools/check_retired_figures.py` after TASK-04-09 and TASK-04-10 → exits 0.
- `grep -rn "5 of 56\|5/56" NOTES.md RESOURCES.md facilitator/ build_teaching_visuals.py build_oct_teaching_deck.py`
  → no matches.

**Dependencies**
- PHASE-02, for three reasons: `${cell_count}` must already exist in `FIGURES`;
  `tools/check_terminology_map.py --sync-en` is needed by TASK-04-12; and
  `verify_deck_numbers.py`'s locale-aware allowed-set construction must be in place before the deck
  is rebuilt.
- `matplotlib` and `numpy` installed (PHASE-01's `requirements.txt`).

**Phase Risks**
- **RISK-04-01:** The new `passCount` might be large enough to weaken the teaching punchline ("the
  window is narrow"). Mitigation: the **Test Specs** bound it to `0 < passCount < 70` and require a
  stop-and-report outside that range. A wider window that is honestly computed beats a narrow one
  that is an artifact — and TASK-04-08's per-gate decomposition carries the teaching point either
  way.
- **RISK-04-02:** `check_retired_figures.py` matches case-insensitive substrings, so adding
  `"of 56"` to the retired list will flag any sentence containing that substring anywhere in the
  scanned prose — including historical-sounding sentences a writer wants to keep. Mitigation: fix
  every flagged line to the new figure; if a line genuinely must recount history, move it to
  `plans/` or `reports/`, which are never scanned.
- **RISK-04-03:** Extending `STRIKES` changes the heatmap's aspect ratio from 8x7 to 10x7, which may
  crowd the rotated x-axis tick labels at `figsize=(9, 6)`. Mitigation: after TASK-04-11, open
  `assets/teaching/m5-gate-heatmap-en.png` and confirm the ten strike labels are legible; if not,
  reduce the tick `fontsize` from 8 to 7 — do not change `figsize`, which is shared with the deck
  layout.
- **RISK-04-04:** `build_teaching_visuals.py --lang vi|zh` may fail on font availability for
  Vietnamese diacritics or Chinese glyphs on a machine without the fonts named in the script's `FONT`
  map. Mitigation: if a language render fails, complete `--lang en`, record the failure with the
  exact matplotlib warning, and leave the other two PNGs stale rather than committing a
  wrong-glyph image; note it as a follow-up.

### PHASE-05 - Single Source of Truth as a Mechanism

**Goal**
The loss coefficients `k = 1.026` and `K_pp = 1.008` are independently redefined in three runtime
locations, so a partial update would pass CI. A hand-typed formula string sits inside the export
whose docstring forbids hand-typed numbers and is printed into a learner worksheet. The USD exchange
rate that scales every USD figure a CFO reads has no provenance and a test that pins its value.
Fix all three, plus two small hygiene items.

**Tasks**
- [ ] TASK-05-01: Create `app/src/data/constants.js` exporting the three Decree-57 loss coefficients
      with a provenance comment naming Decree 57/2025/NĐ-CP:
      `LOSS_FACTOR_K = 1.026`, `LOSS_FACTOR_KPP = 1.008`,
      `LOSS_FACTOR_PRECISE = LOSS_FACTOR_K * LOSS_FACTOR_KPP`. Use single quotes and no semicolons
      (the style of the modules that will import it). This module must import nothing, so no cycle is
      possible.
- [ ] TASK-05-02: In `app/src/data/default-scenarios.js`, import from `'./constants.js'` (explicit
      extension) and re-export the three constants so downstream consumers may take them from either
      module. **Do not change `lossFactor: 1.0342`** (ASM-008); instead extend its comment to state
      that it is the deliberately rounded slider default and that `LOSS_FACTOR_PRECISE` in
      `constants.js` is the precise product used by the bill builders.
- [ ] TASK-05-03: In `app/src/main.js`, replace the literal `lossFactorPrecise: 1.026 * 1.008` with
      the imported `LOSS_FACTOR_PRECISE`, adding it to the existing import from
      `'./data/default-scenarios'` (keep that import extensionless — `main.js` is reached only by
      Vite).
- [ ] TASK-05-04: In `app/src/modules/settlement.js`, replace the magic `?? 1.008` fallback on the
      `lossFactorKppOnly` line with the imported `LOSS_FACTOR_KPP`, importing from
      `'../data/constants.js'` with the explicit extension (this module is reached by the plain-Node
      export scripts). Keep the `??` fallback structure so an explicit caller value still wins.
- [ ] TASK-05-05: In `app/scripts/export-spine.mjs`, delete the local
      `const lossFactorKppOnly = 1.008` and `const lossFactorPrecise = 1.026 * 1.008` and import
      both from `'../src/data/constants.js'`. Do the same in `app/scripts/export-sweep.mjs` for
      `LOSS_FACTOR_PRECISE` and `LOSS_FACTOR_KPP_ONLY` (rename the local uses to the imported
      names).
- [ ] TASK-05-06: In `app/scripts/export-spine.mjs`, replace the hand-typed
      `spotFormulaText: '1,500,000 × 1.008 × 1,100'` with a generated string per S5, using
      `Number.prototype.toLocaleString('en-US')` for the two grouped figures and the U+00D7
      multiplication sign with single spaces. Add a one-line assertion immediately after
      constructing it that the parsed product of its three factors equals `spotValueVnd`, exiting 1
      with a clear message if not (mirror the existing `assertAnchor` style).
- [ ] TASK-05-07: Prove the refactor is output-neutral:
      ```bash
      cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && cd ..
      git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json
      ```
      The `git diff` must exit 0 — including `spine-s3.json`, whose `spotFormulaText` must be
      byte-identical to before. (`gate-sweep.json` is expected to differ if PHASE-04 has already
      run; check it separately and only against PHASE-04's committed state.)
- [ ] TASK-05-08: Add a `spotFormulaText` consistency check to `tools/verify_prose_figures.py`: when
      a spine has an `excess` block, parse the three `×`-separated factors out of `spotFormulaText`
      (stripping locale grouping via the `en` separator), multiply them, round, and fail with a clear
      message if the result differs from `spotValueVnd`. Add the corresponding unit test to
      `tools/tests/test_verify_prose_figures.py`.
- [ ] TASK-05-09: Give `EXCHANGE_RATE` provenance. In `app/src/modules/formatters.js`, add above it
      a comment naming it as an illustrative reference rate and not a sourced daily fix, and export
      `EXCHANGE_RATE_AS_OF = '2026-07-01'` (an ISO-8601 date string, `YYYY-MM-DD`).
- [ ] TASK-05-10: Surface the rate in the UI. In `app/src/modules/ui.js`'s `renderAppShell`, add a
      span to the `.assumptions-inline` row reading
      `USD at 26,500 VND (as of 2026-07-01)`, built from the imported `EXCHANGE_RATE` and
      `EXCHANGE_RATE_AS_OF` rather than hard-coded text, so it can never drift from the constant.
- [ ] TASK-05-11: Rewrite the pinning test. In `app/src/modules/formatters.test.js`, replace
      `expect(EXCHANGE_RATE).toBe(26500)` with contract assertions: `convertMoney(EXCHANGE_RATE,
      'USD')` equals `1`; `EXCHANGE_RATE` is a finite number greater than `1000`; and
      `EXCHANGE_RATE_AS_OF` matches `/^\d{4}-\d{2}-\d{2}$/`. Keep every other test in the file.
- [ ] TASK-05-12: Repair the root `package.json`. Remove the dangling `"main": "build-deck.js"` field
      (the file now lives at `archive/build-deck.js`) and set `"description"` to
      `"Root Node install exists only for archive/build-deck.js (pptxgenjs); the live deck pipeline is Python — see build_oct_teaching_deck.py."`.
      Leave `dependencies`, `repository`, `bugs` and `homepage` untouched.
- [ ] TASK-05-13: Delete the eight stale gitignored log files in `app/`:
      ```bash
      rm -f app/dev-server.log app/preview-test-err.log app/preview-test.log app/preview.err.log app/preview.log app/vite-redesign.log app/vite-review.log app/vite.log
      ```
      Confirm with `ls app/*.log 2>/dev/null | wc -l` returning `0`. These are gitignored, so this
      produces no repository diff.
- [ ] TASK-05-14: Close the GIF-duplication question (ASM-009). Add a short subsection to `NOTES.md`
      recording that the 12 `.gif`/`.mp4` pairs in `assets/` are both retained deliberately: the
      `.mp4` files are for Google Slides embedding and the `.gif` files are the fallback path in
      `build_oct_teaching_deck.py` when an `.mp4` is absent. State that they are regenerated together
      by `PYTHONPATH= py build_cfd_slide.py` and are not to be deleted without changing that
      fallback.

**File Changes**
- `app/src/data/constants.js` (create): the three loss coefficients with provenance.
- `app/src/data/default-scenarios.js` (modify): import and re-export the constants; extend the
  `lossFactor` comment. Do not change any numeric value.
- `app/src/main.js` (modify): use `LOSS_FACTOR_PRECISE` instead of the inline product.
- `app/src/modules/settlement.js` (modify): use `LOSS_FACTOR_KPP` instead of the `?? 1.008` magic
  number; add the explicit-extension import. Change no formula.
- `app/scripts/export-spine.mjs` (modify): import the constants; generate `spotFormulaText`; add its
  product assertion.
- `app/scripts/export-sweep.mjs` (modify): import the constants in place of the two local
  definitions.
- `tools/verify_prose_figures.py` (modify): add the `spotFormulaText` consistency check.
- `tools/tests/test_verify_prose_figures.py` (modify): add a passing case and a mismatching case for
  the new check.
- `app/src/modules/formatters.js` (modify): provenance comment and `EXCHANGE_RATE_AS_OF` export.
- `app/src/modules/formatters.test.js` (modify): replace the pinning assertion with contract
  assertions.
- `app/src/modules/ui.js` (modify): one new `.assumptions-inline` span built from the two constants.
- `package.json` (modify, repository root): remove `main`, set `description`.
- `NOTES.md` (modify): the GIF-retention subsection.
- Deleted (untracked, gitignored): the eight `app/*.log` files.

**Function Signatures**
- `LOSS_FACTOR_K: number` = `1.026` — Decree-57 coefficient `k`, the transmission loss factor.
- `LOSS_FACTOR_KPP: number` = `1.008` — Decree-57 coefficient `K_pp`, the meter-side loss factor.
- `LOSS_FACTOR_PRECISE: number` = `LOSS_FACTOR_K * LOSS_FACTOR_KPP` = `1.034208` — the full product
  used by `buildFiveLineBill`.
- `EXCHANGE_RATE_AS_OF: string` = `'2026-07-01'` — the ISO-8601 date the illustrative VND-per-USD
  rate refers to.

**Test Specs**
- `LOSS_FACTOR_PRECISE` equals `1.026 * 1.008` exactly (`1.034208`), and
  `defaultInputs.lossFactor` still equals `1.0342` (they are deliberately different — ASM-008).
- `buildFiveLineBill` with `{ fmp: 1150, strikePrice: 1250, serviceFee: 360, clearingFee: 163.3,
  lossFactorPrecise: LOSS_FACTOR_PRECISE, retailTariff: 2204, lossFactorKppOnly: LOSS_FACTOR_KPP }`
  and `{ contracted: 5000000, total: 5000000 }` → `cKh === 9063196000` (unchanged from today).
- `buildSpinePack('s3').excess.spotFormulaText` → exactly `'1,500,000 × 1.008 × 1,100'`.
- `buildSpinePack('s3').excess.spotValueVnd` → `1663200000`, and the three factors parsed out of
  `spotFormulaText` multiply to that value after rounding.
- Artificially setting `scenarioProfiles.workshop3.overrides.marketPrice` to `1200` and rebuilding
  the pack → `spotFormulaText` becomes `'1,500,000 × 1.008 × 1,200'` (the string tracks the input;
  revert the edit afterwards).
- `tools/verify_prose_figures.py`'s new check on a synthetic spine whose `spotFormulaText` says
  `'1,500,000 × 1.008 × 1,100'` but whose `spotValueVnd` is `1` → one violation naming
  `spotFormulaText`.
- `convertMoney(EXCHANGE_RATE, 'USD')` → `1`; `EXCHANGE_RATE > 1000` → `true`;
  `EXCHANGE_RATE_AS_OF` matches `/^\d{4}-\d{2}-\d{2}$/` → `true`.
- `renderAppShell` output contains `USD at 26,500 VND (as of 2026-07-01)`.
- `git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json`
  after re-running `export-spine.mjs` → exits 0.

**Dependencies**
- None strictly. If executed after PHASE-04, `assets/teaching/gate-sweep.json` will already carry
  PHASE-04's regenerated content — compare it against PHASE-04's committed state, not against an
  older one. If executed before PHASE-04, no coordination is needed.

**Exit Criteria**
- [ ] `cd app && npm test` passes (including the rewritten `formatters.test.js` and the unchanged
      `settlement.test.js`).
- [ ] `cd app && npm run lint` exits 0.
- [ ] `cd app && node scripts/export-spine.mjs` exits 0 and prints no `Anchor mismatch` or
      `spotFormulaText` error.
- [ ] `git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json`
      exits 0.
- [ ] `grep -rn "1\.026 \* 1\.008" app/src app/scripts` returns matches only in
      `app/src/data/constants.js` and in test files.
- [ ] `grep -n '"main"' package.json` returns no matches.
- [ ] `ls app/*.log 2>/dev/null | wc -l` returns `0`.
- [ ] `python -m unittest tools.tests.test_verify_prose_figures -v` passes with the two new cases.

**Phase Risks**
- **RISK-05-01:** Importing `app/src/data/constants.js` into `app/src/modules/settlement.js`
  introduces the first data-directory import into the engine. If the extension is omitted, the plain
  Node export scripts will fail with `ERR_MODULE_NOT_FOUND`. Mitigation: use `'../data/constants.js'`
  with the explicit extension, and verify immediately with `cd app && node scripts/export-spine.mjs`
  rather than relying on the Vite dev server, which tolerates the omission.
- **RISK-05-02:** Floating-point differences. `1.026 * 1.008` evaluated once in a shared module is
  bit-identical to the same expression evaluated in three places, so no spine value should move.
  Mitigation: TASK-05-07's `git diff --exit-code` is the proof; if any byte changes, stop and
  investigate before committing.
- **RISK-05-03:** Adding a span to `.assumptions-inline` will break any `ui.test.js` assertion that
  counts that row's children. Mitigation: run `cd app && npx vitest run src/modules/ui.test.js`
  immediately after the edit and prefer content assertions over count assertions when fixing.

### PHASE-06 - Project Laws, Presenter Rehearsal Harness, and Memory Hygiene

**Goal**
This repository is almost entirely agent-driven and has strong, hard-won, non-obvious conventions
spread across `NOTES.md`, `app/README.md`, `app/deployment.md` and six Python docstrings, with no
root `CLAUDE.md` to consolidate them. It also has no artifact that measures the thing `MISSION.md`
defines as success — the presenter's own recall — while `learning-records/` stopped at `0004` and
`activeContext.md` has been stale since 2026-06-29. Fix all three.

**Tasks**
- [ ] TASK-06-01: Create a root `CLAUDE.md` (target 60-90 lines) with these sections, written as
      imperative laws rather than description:
      1. **What this repo is** — one paragraph: a Vietnamese DPPA teaching project whose settlement
         engine is the single source of truth for every number in a deck, a worksheet, three
         language lessons and a live app.
      2. **Commands** — the exact install, build, test, lint, end-to-end, export, generate and verify
         commands from this plan's Environment & Conventions section, including the `PYTHONPATH= py`
         Windows prefix and the "run from the repository root" rule.
      3. **The regeneration order** — the five-step chain, verbatim, with the trigger conditions.
      4. **The retirement rule** — add the superseded string to `tools/retired_figures.json` in the
         same commit.
      5. **The locale rule** — DEC-003's grouping table and DEC-002 (numbers never enter a
         translation; use `${placeholder}` and `figure_format.py`), plus DEC-006's requirement that
         any future app localization must use `vi-VN` grouping.
      6. **Style** — the two coexisting JS styles and which files belong to which; the standing
         prohibition on `npm run format` until `app/.prettierrc` is fixed; explicit `.js` extensions
         in anything the export scripts reach; Python conventions.
      7. **Never do** — deploy without `npm run predeploy`; `rm` a retired artifact (use `git mv` to
         `archive/`); invent a Vietnamese or Chinese translation; hand-type a figure that an export
         already carries; edit `build_oct_teaching_deck.py`'s `TEXT["en"]` after the content freeze
         without re-running the fresh-viewer test.
      8. **Where things live** — the repo map, plus which directories are guard-scanned
         (`NOTES.md`, `RESOURCES.md`, `MISSION.md`, `lessons.md`, `facilitator/**/*.md`,
         `lessons/**/*.html`, `assets/teaching/*.json`) and which are never scanned (`plans/`,
         `research/`, `reports/`, `learning-records/`, `deck-qa/`, `archive/`).
- [ ] TASK-06-02: Create `tools/rehearse.py`, a standard-library-only presenter drill generator. It
      loads `assets/teaching/spine-s1.json`, `spine-s2.json`, `spine-s3.json` and
      `gate-sweep.json`, and builds a deterministic question bank in which **every expected answer is
      read from those files** — never hard-coded. Question families:
      1. one numeric question per bill line, per scenario (`marketEnergy`, `systemService`,
         `diffClearing`, `additionalPurchase`, `cfd`), phrased "S1 line 2 (DPPA service fee), in
         millions of VND?";
      2. `cEvn`, `cKh` and `bau` per scenario, in millions of VND;
      3. the S1 effective rate in VND/kWh (`comparison.effectiveVndPerKwh`);
      4. the S3 excess questions (`generationKwh`, `excessKwh`, `spotValueVnd`);
      5. gate questions from the sweep: how many cells pass all three gates; how many pass each
         individual gate (from `gateCounts` once PHASE-04 has run, else computed from `cells`);
         which gate binds at a given strike;
      6. six whiteboard prompts, one per module, each with a 5-minute target and no numeric answer.
      Modes: `--check` (build the bank, validate every numeric expected answer traces to a loaded
      JSON field, print a summary, exit 0/1 — this is the CI-safe mode and must never read stdin);
      `--list` (print the whole bank as `id | question | expected`); `--drill N` (ask `N`
      pseudo-randomly selected numeric questions on stdin, compare exactly after stripping grouping
      separators and whitespace, print a score); `--whiteboard` (print the six module prompts with
      their targets); `--seed S` (make `--drill` reproducible); `--lang {en,vi,zh}` (format expected
      answers through `figure_format.format_figure`, defaulting to `en`).
      Append one JSON object per answered question to `learning-records/rehearsal-log.jsonl` with
      keys `timestamp` (UTC ISO-8601), `questionId`, `given`, `expected`, `correct`, `elapsedSeconds`.
- [ ] TASK-06-03: Create `tools/tests/test_rehearse.py` covering the cases under **Test Specs**.
- [ ] TASK-06-04: Add `python tools/rehearse.py --check` as a step in `.github/workflows/ci.yml`'s
      `deck-parity` job, after the terminology-map check. This makes the drill bank a CI-verified
      artifact that cannot drift from the exports.
- [ ] TASK-06-05: Create `learning-records/0005-guardrail-locale-integrity-and-teaching-defaults.md`
      following the shape of `learning-records/0004-worksheet-answer-docx.md`. Cover the arc this
      plan closes: the vacuous scheduled guardrail and why a "never flake" rule became a "never
      check" rule; the discovery that the number-integrity apparatus was monolingual; the Vietnamese
      digit-grouping defect and the general lesson that a guard written in one locale is blind in
      another; and the finding that the app's defaults argued against the mission. Include the
      verified before/after numbers from PHASE-03 and PHASE-04.
- [ ] TASK-06-06: Retire and restart `activeContext.md`. Run
      `git mv activeContext.md archive/activeContext-2026-06-29.md`, add a row to
      `archive/README.md`'s table describing it (a 45 kB running log superseded by `plans/` +
      `reports/` on 2026-06-29), then create a fresh short `activeContext.md` containing: a one-line
      statement that the live planning record is `plans/` plus `reports/` and that this file now
      holds only the **current** plan's checklist; a link line to
      `plans/2026-07-26-guardrail-locale-integrity-and-teaching-defaults-plan.md`; and the six phase
      names as checkable items with their status.
- [ ] TASK-06-07: Update `NOTES.md`'s repo-layout section to name `CLAUDE.md` as the entry point a
      new session reads first, and to record that `tools/rehearse.py --check` is a CI gate. Update
      `RESOURCES.md` to add `CLAUDE.md` and `tools/rehearse.py` to the "Primary (this repo)" list
      with a one-line description each.
- [ ] TASK-06-08: Update `plans/2026-october-readiness-checklist.md`: mark the app-deploy and
      freshness items against their true current state, and add a line under "Early September"
      requiring `python tools/check_deploy_freshness.py --strict` to be green before the content
      freeze. Do not alter the human-blocked register's five rows or their dates — they are
      person-blocked, and `tools/check_human_blocked_register.py` parses that table.

**File Changes**
- `CLAUDE.md` (create, repository root): the eight sections in TASK-06-01.
- `tools/rehearse.py` (create): the drill generator.
- `tools/tests/test_rehearse.py` (create): its unit tests.
- `learning-records/0005-guardrail-locale-integrity-and-teaching-defaults.md` (create).
- `learning-records/rehearsal-log.jsonl` (create on first `--drill` run; do not commit an empty
  file — add it to the repository only once it has real entries).
- `activeContext.md` (modify via `git mv` then create): historical body moved to
  `archive/activeContext-2026-06-29.md`; new short pointer file in its place.
- `archive/README.md` (modify): one new table row for the archived context log.
- `.github/workflows/ci.yml` (modify): one new `python tools/rehearse.py --check` step in
  `deck-parity`.
- `NOTES.md`, `RESOURCES.md`, `plans/2026-october-readiness-checklist.md` (modify): as described in
  TASK-06-07 and TASK-06-08.

**Function Signatures**
- `load_exports(root: Path) -> dict[str, dict]` — the four parsed JSON exports keyed
  `"s1"`, `"s2"`, `"s3"`, `"sweep"`.
- `build_question_bank(exports: dict[str, dict], lang: str = "en") -> list[Question]` — the
  deterministic ordered bank; `Question` is a `dataclass` with fields
  `id: str`, `prompt: str`, `expected: str | None`, `source: str`, `kind: str`
  (`"numeric"` or `"whiteboard"`), `target_seconds: int | None`.
- `validate_bank(bank: list[Question], exports: dict[str, dict]) -> list[str]` — violation strings;
  empty means every numeric expected answer traces to a loaded export field named by `source`.
- `normalize_answer(text: str, lang: str = "en") -> str` — the answer with grouping separators,
  spaces and a trailing unit stripped, for exact comparison.
- `log_attempt(log_path: Path, question_id: str, given: str, expected: str, correct: bool, elapsed_seconds: float) -> None`
  — appends one JSON line; creates the file if absent.
- `main(argv: list[str] | None = None) -> int` — `0` on success, `1` on `--check` violations.

**Test Specs**
- `len(build_question_bank(load_exports(REPO_ROOT))) >= 25`.
- `validate_bank(build_question_bank(exports), exports)` → `[]`.
- Every `Question` with `kind == "numeric"` has a non-`None` `expected`; every
  `kind == "whiteboard"` has `expected is None` and `target_seconds == 300`.
- The bank contains exactly six `kind == "whiteboard"` questions, one per module, with ids
  `wb-m1` … `wb-m6`.
- The S1 `cKh` question's `expected` equals `format_figure(9063, "en")` = `"9,063"` and its `source`
  names `spine-s1.bill.cKh.vndMillionsRounded`.
- `build_question_bank(exports, "vi")` → the same S1 `cKh` question's `expected` is `"9.063"`.
- `normalize_answer("9,063 tr VND")` → `"9063"`; `normalize_answer("9.063", "vi")` → `"9063"`;
  `normalize_answer(" 9063 ")` → `"9063"`.
- `validate_bank` on a bank with one question whose `expected` was tampered to `"1"` → one violation
  naming that question's id.
- `main(["--check"])` → returns `0` and prints a line containing `REHEARSE-BANK OK` with the
  question count.
- `main(["--list"])` → returns `0` and prints one line per question; reads no stdin.
- `log_attempt` called twice on a temporary path → the file has exactly two lines, each parsing as
  JSON with all six keys.
- `main(["--drill", "2", "--seed", "1"])` twice with identical piped stdin → selects the same two
  question ids both times (reproducibility).

**Dependencies**
- PHASE-01 through PHASE-05, because `CLAUDE.md` documents their outcomes (the `--strict` flag, the
  locale rule, the `${placeholder}` contract, the new defaults, the constants module) and
  `learning-records/0005` narrates them. `tools/rehearse.py` additionally reads
  `assets/teaching/gate-sweep.json`, so PHASE-04 should be committed first for `gateCounts` to
  exist — the script must fall back to computing the counts from `cells` if `gateCounts` is absent.

**Exit Criteria**
- [ ] `python tools/rehearse.py --check` exits 0 and prints `REHEARSE-BANK OK` with a count of 25 or
      more.
- [ ] `python tools/rehearse.py --list | wc -l` returns the same count as `--check` reports
      (plus any header lines, which must be stated in the script's output format).
- [ ] `python -m unittest tools.tests.test_rehearse -v` passes.
- [ ] `python -m unittest discover -s tools/tests -v` passes in full.
- [ ] `wc -l CLAUDE.md` reports between 60 and 120 lines, and
      `grep -c "PYTHONPATH= py" CLAUDE.md` is at least 1.
- [ ] `ls archive/activeContext-2026-06-29.md` succeeds and `wc -l activeContext.md` reports fewer
      than 40 lines.
- [ ] `ls learning-records/0005-*.md` succeeds.
- [ ] `python tools/check_retired_figures.py` and `python tools/verify_prose_figures.py` both exit 0
      after all documentation edits (both scan `NOTES.md` and `RESOURCES.md`).

**Phase Risks**
- **RISK-06-01:** `CLAUDE.md` becomes guard-relevant prose containing figures. It is **not** in
  either guard's scan list, so a figure written into it can go stale silently. Mitigation: write
  `CLAUDE.md` with **no** VND figures at all — refer to the exports by field path instead. State
  that rule inside the file itself.
- **RISK-06-02:** Retiring `activeContext.md` conflicts with a standing workflow instruction to keep
  a plan checklist at the project root. Mitigation: TASK-06-06 does not delete the file — it archives
  the stale 45 kB body and re-initialises the same path as a short live checklist, satisfying both
  the instruction and the hygiene goal.
- **RISK-06-03:** `tools/rehearse.py --drill` reads stdin, which would hang a continuous-integration
  runner. Mitigation: only `--check` is wired into CI, and a unit test asserts that `--check` and
  `--list` never read stdin (patch `sys.stdin` to an object whose `read` raises, and confirm both
  modes still succeed).
- **RISK-06-04:** `learning-records/rehearsal-log.jsonl` will accumulate personal practice data.
  Mitigation: it is a plain append-only JSONL file under `learning-records/`, which is never
  guard-scanned; commit it only when it has entries worth keeping, and note in `CLAUDE.md` that it
  is a log, not a source of truth.

## Gotchas

- **Do not add `tools/*.json` to `tools/retired_figures.json`'s `scan` array.** That file's own
  `notes` field quotes retired strings (`"5 of 56"`, `"0 of 56"`) as documentation examples, so
  scanning `tools/` would make the guard fail against its own configuration. PHASE-02 adds only
  `assets/teaching/*.json`.
- **`check_retired_figures.py` matches case-insensitive substrings, not regular expressions.** Adding
  a short string like `"of 56"` to the `retired` array will match far more than intended. Prefer the
  longest unambiguous forms, and be prepared for PHASE-04 TASK-04-09 to flag lines you did not
  expect.
- **Vietnamese digit grouping inverts both separators.** `1.026 × 1.008` in a Vietnamese document
  reads as `1026 × 1008`, and `1,427.35` reads as `1` followed by a fractional `42735`. When
  converting a number to `vi`, both separators change, not just the thousands mark.
- **`string.Template.substitute` treats a bare `$` as a placeholder start** and raises
  `ValueError: Invalid placeholder`. No deck text and no translation may contain an unescaped `$`;
  write `$$` for a literal dollar sign.
- **`verify_deck_numbers.py` reads slide bodies only, never speaker notes**, deliberately: notes
  intentionally carry exact answer-key numbers that are not millions-rounded. Do not "fix" this by
  widening its extraction.
- **`tr VND` means millions of VND** (*triệu*), not thousands. The `vndMillionsRounded` fields are
  already divided by 1,000,000 and rounded; the `vnd` fields are raw. Mixing them by a factor of
  1,000,000 is the easiest catastrophic error in this codebase.
- **The engine is buyer-side only.** It does not model debt schedules or equity internal rate of
  return, so the lender and investor gates in `export-sweep.mjs` are per-kWh strike proxies. Do not
  present them as computed project finance; PHASE-04's DSCR rewrite makes the metadata honest but
  does not make the model real.
- **Two of the three gates ignore the volume-ratio axis.** `lenderPass` and `investorPass` depend
  only on `strike`, so the M5 heatmap's y-axis moves only the buyer gate. Say so on the slide or in
  the guide rather than letting a questioner find it.
- **`app/src/data/teach-steps.js` contains hand-typed answer-key figures** in its `expected` strings
  and was unguarded until PHASE-02 TASK-02-13 adds `app/src/data/*.js` to the generator scan. After
  that change, any stale figure there becomes a CI failure — which is the point, but it may surface
  immediately.
- **`app/scripts/export-*.mjs` run under plain Node ESM**, which does not resolve extensionless
  imports. Any module in their import graph — which now includes `app/src/data/constants.js` — must
  be imported with an explicit `.js` extension. `app/scripts/js-resolve-loader.mjs` exists as a shim
  for the files that still lack them; do not rely on it for new code.
- **Re-running `npm run record:demos` rewrites six MP4s and six PNGs (~6 MB of binaries).** Always
  rebuild the deck afterwards, because `build_oct_teaching_deck.py` embeds those files; a stale
  recording paired with a changed teach step is worse than either alone.
- **`matplotlib` is not installed in the default local Python environment.**
  `build_teaching_visuals.py` will fail with `ModuleNotFoundError` until
  `python -m pip install -r requirements.txt` has run.
- **`git diff --exit-code` on the four generated JSON files is the repository's drift proof** and is
  a CI step in the `deck-parity` job. Any phase that touches the engine, the data module or an export
  script must re-run both export scripts and confirm the intended diff — an unintended one means the
  refactor changed a number.
- **Never fill in an `UNTRANSLATED` value.** 31 Vietnamese and 33 Chinese entries are deliberately
  blocked pending a qualified translator (item H2, due 2026-08-25). The build's refusal to proceed is
  a feature.

## Verification Strategy

- **TEST-001:** `cd app && npm test` → all tests pass; count is at least `57` before PHASE-03/05
  additions and higher after (`Test Files 8 passed` grows only if new test files are added).
- **TEST-002:** `cd app && npm run e2e` → `27 passed` before PHASE-03, `28 passed` or more after.
- **TEST-003:** `cd app && npm run lint` → exits 0 with no output.
- **TEST-004:** `cd app && npm run build` → exits 0; reported gzip JS size stays within 5 kB of the
  84.87 kB baseline (this plan adds no dependency, so a large jump means something unintended was
  bundled).
- **TEST-005:** `python -m unittest discover -s tools/tests -v` → all pass, including the new
  `test_figure_format`, `test_check_terminology_map` and `test_rehearse` modules.
- **TEST-006:** `python tools/check_retired_figures.py` → exits 0; the printed file count is greater
  than the pre-plan `42 files scanned: 28 prose, 14 scripts`.
- **TEST-007:** `python tools/verify_prose_figures.py` → exits 0; the printed token count is greater
  than the pre-plan `377 tokens across 28 files`.
- **TEST-008:** `python tools/check_terminology_map.py` → exits 0.
- **TEST-009:** `python tools/check_human_blocked_register.py` → exits 0 with all five items listed
  (this plan must not disturb the register).
- **TEST-010:** `python tools/check_deploy_freshness.py --strict` → exits 0 with
  `DEPLOY-FRESHNESS PASS`, or exits 0 with `DEPLOY-FRESHNESS UNKNOWN: could not reach` if offline.
  If it reports `STALE`, record it — a deploy is human-blocked (CON-001).
- **TEST-011:** `PYTHONPATH= py audit_teaching_deck.py` → exits 0.
- **TEST-012:** `PYTHONPATH= py verify_deck_numbers.py` → exits 0 with a `PARITY PASS` line.
- **TEST-013:**
  `python verify_deck_numbers.py --lang vi --deck "ceba/DPPA Presentation Oct 2026 To Teach vi.pptx"`
  → exits 0 with `DECK NOT PRESENT` until a translated deck exists.
- **TEST-014:** `PYTHONPATH= py build_oct_teaching_deck.py --lang vi` → exits **1** with the
  `31 terminology-map.json entries are UNTRANSLATED` message (the translation gate must remain
  closed).
- **TEST-015:**
  `cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && cd .. && git status --porcelain assets/teaching/*.json`
  → after each phase's commit, reports nothing (the committed exports match a fresh regeneration).
- **TEST-016:** `python tools/rehearse.py --check` → exits 0 with `REHEARSE-BANK OK` and a count of
  25 or more.
- **TEST-017:** The escalation change is provable end to end:
  ```bash
  cd app && node -e "import('./src/data/default-scenarios.js').then(async(d)=>{const s=await import('./src/modules/settlement.js');const sc=d.scenarioProfiles[d.defaultInputs.scenarioId];const inp={...d.defaultInputs,loadProfile:sc.loadProfile,generationProfile:sc.generationProfile,fmpCurve:d.buildFmpCurve(d.defaultInputs.marketPrice),monthlyVolumes:sc.monthlyVolumes};const r=s.projectMultiYear(inp,{years:20,evnEscalation:d.defaultInputs.evnEscalation,strikeEscalation:d.defaultInputs.strikeEscalation});console.log(r.crossoverYear, Math.round(r.rollups.lifetime.savings/1e6));})"
  ```
  → prints `14 66656`.
- **MANUAL-001:** After PHASE-03, run `cd app && npm run build && npm run preview`, open
  `http://127.0.0.1:4173/`, and confirm on first load: the crossover pill reads `Year 14`, the
  multi-year assumptions row starts with `Differential +2.0%/yr`, and clicking `Locked strike`
  changes the pill to `Year 9` and the differential to `+4.0%/yr`.
- **MANUAL-002:** After PHASE-03, confirm the browser tab title reads
  `Vietnam DPPA CFO Calculator` with no "Neon", and that the hero paragraph no longer contains the
  NSMO/ERAV caveat while the controls panel's assumptions row does.
- **MANUAL-003:** After PHASE-04, open `assets/teaching/m5-gate-heatmap-en.png` and confirm all ten
  strike tick labels are legible and the centred figure reads the new `passCount / cellCount`.
- **MANUAL-004:** After PHASE-04, open `ceba/DPPA Presentation Oct 2026 To Teach.pptx` and confirm
  the M5 slide, its checkpoint question and the M5 speaker notes all state the same new counts.
- **MANUAL-005:** After PHASE-02, open `lessons/0009-scenario-3-excess-vi.html` in a browser and
  confirm every number reads correctly under Vietnamese conventions and that no value was altered —
  only its punctuation.
- **MANUAL-006:** After PHASE-06, read `CLAUDE.md` start to finish as if arriving with no context,
  and confirm every command in it runs as written from a clean checkout.
- **OBS-001:** On the Monday following PHASE-01, check the repository's Actions tab for the
  `freshness-checks` run and confirm the `deploy-freshness` job's log shows a `node --version` line,
  an `npm install` step, and either `DEPLOY-FRESHNESS PASS` or a genuine `STALE`/`FAIL` — never
  `UNKNOWN: local build failed`.
- **OBS-002:** After PHASE-02 and PHASE-06, confirm a pushed commit's `deck-parity` job runs the four
  original guard steps plus `check_terminology_map.py`, the two language deck-parity steps and
  `rehearse.py --check`, and that all exit 0.

## Risks and Alternatives

- **RISK-001:** Scope. Six phases against a 67-day runway with a 51-day English content freeze and a
  30-day translator deadline. The last three planning cycles executed two of five or six phases and
  re-brainstormed. Mitigation: the phases are ordered by consequence and PHASE-01, PHASE-02 and
  PHASE-03 are mutually independent, so they can be executed in any order or in parallel. If time
  runs short, the priority is **PHASE-01** (a guardrail that cannot fail is worse than no
  guardrail), then **PHASE-02** (it must precede any translation work), then **PHASE-03** (it must
  precede the English freeze). PHASE-04, PHASE-05 and PHASE-06 improve credibility and durability
  but are not deadline-bound.
- **RISK-002:** File contention. `app/src/modules/ui.js` is edited by PHASE-03 and PHASE-05;
  `build_oct_teaching_deck.py` by PHASE-02 and PHASE-04; `tools/verify_prose_figures.py` by PHASE-02
  and PHASE-05; `tools/retired_figures.json` by PHASE-02 and PHASE-04; `NOTES.md` by five of six
  phases. Mitigation: execute one phase to completion and commit before starting another, or if
  parallelising, keep PHASE-01 (workflow + `tools/check_deploy_freshness.py`) and PHASE-03 (app
  source) apart from PHASE-02/04 (Python generators and guards) — those two groups share no file.
- **RISK-003:** PHASE-04 changes a headline number that the presenter has already rehearsed and that
  appears in two facilitator guides, three PNG visuals, a PowerPoint deck and two prose documents.
  Mitigation: the retirement rule plus `check_retired_figures.py` mechanically finds every stale
  occurrence; the phase is not complete until that guard exits 0.
- **RISK-004:** PHASE-02's placeholder refactor touches the file that produces the deck 67 days
  before the session. A silent substitution bug could put `${bau}` on a slide. Mitigation:
  `substitute` (not `safe_substitute`) raises loudly on any unknown placeholder, and
  `audit_teaching_deck.py` plus `verify_deck_numbers.py` both run against the rebuilt deck in
  TASK-02-17. Additionally, `grep` the rebuilt deck's extracted text for `${` as a final check:
  `python -c "from pptx import Presentation;p=Presentation('ceba/DPPA Presentation Oct 2026 To Teach.pptx');print([s.shape_id for sl in p.slides for s in sl.shapes if s.has_text_frame and '\${' in s.text_frame.text])"`
  must print `[]`.
- **RISK-005:** ASM-002's `strikeEscalation = 0.02` is an invented figure. Presenting it as a market
  assumption would be a credibility risk of exactly the kind PHASE-04 exists to remove. Mitigation:
  the provenance comment states plainly that it is illustrative partial indexation and not a sourced
  index, and the same wording goes into the assumptions row a viewer can read.
- **ALT-001:** *Delete the freshness workflow instead of repairing it.* Rejected: the check is
  cheap, the failure mode it guards (a QR code pointing at a stale build during the session) is
  real, and a repaired check costs 30 minutes against the recurring cost of manual verification.
- **ALT-002:** *Add a full internationalization library and locale files to the app now.* Rejected:
  the app has exactly one runtime dependency today, and full string extraction is already specified
  as PHASE-03 of `plans/2026-07-25-guardrail-integrity-and-localization-plan.md`. Forking that work
  into two plans editing `ui.js` simultaneously would guarantee a conflict. This plan delivers the
  locale primitive and records the `vi-VN` grouping requirement (DEC-006) so that work inherits it.
- **ALT-003:** *Keep numbers in the terminology map and proofread the translated decks instead.*
  Rejected: proofreading three decks in three languages against four export files, repeatedly, is
  exactly the manual process this repository has spent five planning cycles mechanising. A
  placeholder contract makes the property structural.
- **ALT-004:** *Fix the app default by changing the landing scenario from `balanced` to `workshop1`
  instead of changing `strikeEscalation`.* Rejected: `workshop1` crosses over in year 1 regardless of
  escalation, so it hides the mechanism rather than showing it, and it would put a workshop-specific
  factory case in front of every unattended visitor.
- **ALT-005:** *Raise the investor threshold instead of widening the strike grid.* Rejected: the
  thresholds are illustrative proxies pending real deal data (item H3, human-blocked, due
  2026-09-01). Moving a threshold to change a headline is the failure mode; widening the grid so the
  threshold is interior to it is the fix.

## Suggested Next Step

Execute **PHASE-01**. It is the smallest phase, it is fully independent, and its subject — a weekly
scheduled job that has never compared anything — is the only item here with a recurring deadline
already in motion: the job fires every Monday at 09:00 UTC and reports green regardless of reality.
Start with TASK-01-01, which reproduces the defect before fixing it, so the phase report can show
the `exit=0` on a failed build that this plan removes.

Then take **PHASE-02** and **PHASE-03** in either order — PHASE-02 must precede the 2026-08-25
translator engagement and PHASE-03 must precede the 2026-09-15 English content freeze, and both
windows are open now. PHASE-04 requires PHASE-02. PHASE-05 is independent. PHASE-06 goes last,
because `CLAUDE.md` and `learning-records/0005` document what the other five phases actually did.
