---
title: "Non-Degenerate Gate Model, Translator-Safe App Surface, and October Session Readiness"
date: "2026-09-05"
status: "draft"
request: "Turn research/2026-09-05-gate-degeneracy-and-unmeasured-mission-brainstorm.md into a multi-phase implementation plan saved to plans/"
plan_type: "multi-phase"
research_inputs:
  - "research/2026-09-05-gate-degeneracy-and-unmeasured-mission-brainstorm.md"
  - "research/2026-08-22-delivery-stall-and-in-flight-redesign-brainstorm.md"
---

# Plan: Non-Degenerate Gate Model, Translator-Safe App Surface, and October Session Readiness

## Objective

Fix the six defects that stand between this repository and the October 2026 teaching session: a
mathematically degenerate three-gate model whose headline slide advertises a constraint that can
never bind; a deck builder that will silently ship English charts inside the Vietnamese and Chinese
decks; hand-typed settlement figures in the one file no integrity guard scans; an unescaped HTML
string table about to receive ~290 translator-supplied strings; rendered PNG figures that no guard
can read; and a mission statement whose stated success criterion has no instrument at all. Each fix
is small; together they close the last gaps between "every number is provably correct" and "the
material is correct, complete, and deliverable in the room."

## Context Snapshot

- **Current state:** The repository is healthy and fully delivered — clean working tree, pushed,
  deployed (`https://dppa-case.web.app`), 104 JavaScript unit tests green, 104 Python guard tests
  green, all six integrity guards passing, deck parity reconciling 11 figures across 27 slides.
  Underneath that: `app/scripts/export-sweep.mjs` computes the deck's headline "three gates"
  analysis with two gates that are constant along the volume axis and one (the lender gate) that is
  strictly dominated by another and therefore binds in zero of 70 cells;
  `build_oct_teaching_deck.py` accepts `--lang vi|zh` and threads it through every text path but
  none of its 14 image paths; `app/src/data/strings.js` carries four hand-typed spine figures
  (`11,020`, `8,563`, `500`, `9,063`) and is in no guard's scan list; `app/src/modules/ui.js`
  renders exclusively through `innerHTML` with no escaping; `build_teaching_visuals.py` never runs
  in CI, so numbers baked into PNGs are invisible to every text guard; and nothing anywhere
  measures the presenter's own readiness.
- **Desired state:** The gate model is two-dimensional, uses its declared `DSCR_TARGET`, and each
  of its three gates is the sole binding constraint somewhere in the grid. The vi/zh deck builds
  emit language-matched figures or fail loudly. The app's spine figures are generated from the same
  export that feeds the deck and are therefore covered by CI's export-drift gate. A unit test
  rejects any string-table value that would corrupt the DOM. A figures manifest makes
  pixel-embedded numbers checkable by the existing guards. The app carries a live three-gate panel
  and a presenter drill mode.
- **Key repo surfaces:** `app/scripts/export-sweep.mjs`, `app/scripts/export-spine.mjs`,
  `app/src/modules/settlement.js`, `app/src/modules/ui.js`, `app/src/modules/teach.js`,
  `app/src/data/strings.js`, `app/src/data/strings.baseline.json`, `app/public/sw.js`,
  `build_oct_teaching_deck.py`, `build_teaching_visuals.py`, `tools/`,
  `assets/teaching/*.json`, `.github/workflows/ci.yml`, `facilitator/october-run-plan.md`.
- **Out of scope:** Engaging the VI/ZH translator (a person, not a coding task — tracked as H6/H2
  in `facilitator/october-run-plan.md`); triggering the `visual-bootstrap` GitHub Actions workflow
  and committing Linux pixel baselines (tracked as H6; requires a human to run a
  `workflow_dispatch`); confirming the session date and venue (H1); replacing the illustrative
  lender/investor constants with real Allotrope deal data (H3 — see ASM-004); migrating `.pptx`
  binaries to Git LFS; rewriting `app/src/main.js` or `app/src/modules/ui.js` into a component
  framework.

## Environment & Conventions

- **Stack:** Two projects sharing one dataset.
  - Web app in `app/`: Vite 8, vanilla JavaScript ES modules (no framework), Chart.js 4, Vitest 4,
    Playwright 1.53, ESLint 9, Prettier 3. Node 24 in CI. Package manager: npm.
  - Deck tooling at the repository root: Python 3.12 with pinned `python-pptx==1.0.2`,
    `python-docx==1.2.0`, `matplotlib==3.10.8`, `numpy==2.4.0`, `Pillow==12.3.0`.
- **Setup:**
  ```bash
  cd app && npm install          # NOT npm ci -- see Conventions & traps
  cd .. && pip install -r requirements.txt
  ```
- **Build / Run:**
  ```bash
  cd app && npm run dev          # local dev server on http://localhost:5173
  cd app && npm run build        # production build into app/dist
  cd app && npm run preview      # serve the built app on http://127.0.0.1:4173
  ```
- **Test:**
  - Full JS unit suite: `cd app && npm test`
  - Single JS unit file: `cd app && npx vitest run src/modules/settlement.test.js`
  - Coverage gate: `cd app && npm run coverage`
  - Full functional end-to-end suite: `cd app && npm run e2e`
  - Single end-to-end file (Windows requires `--workers=1`):
    `cd app && npx playwright test e2e/controls.spec.js --workers=1`
  - Visual pixel suite (currently non-blocking, no committed baselines):
    `cd app && npm run e2e:visual`
  - Full Python guard suite: `py -m pytest tools/tests`
  - Single Python guard test: `py -m pytest tools/tests/test_check_terminology_numbers.py -q`
  - Pre-deploy gate (lint + prettier + unit + coverage + e2e + build):
    `cd app && npm run predeploy`
- **Conventions & traps:**
  - **Use `npm install`, never `npm ci`.** `npm ci` fails in this project on optional-native-binary
    lockfile drift (`@emnapi/core` missing). The same note appears at the same step in
    `.github/workflows/ci.yml`; if one is changed the other must be changed too.
  - **Windows Python invocation is `PYTHONPATH= py <script>`.** The empty `PYTHONPATH=` clears an
    inherited value that otherwise shadows the standard library; `py` is the Windows launcher
    because a bare `python` is shadowed on the author's machine. Linux CI uses plain `python`,
    which is why `.github/workflows/*.yml` carries no prefix. Every Python command in this plan is
    written in the Windows form; drop the prefix and use `python` on Linux.
  - **Local Playwright on Windows must pass `--workers=1`.** Parallel WebKit on Windows
    intermittently fails with `Object with guid ... was not bound in the connection` — a driver
    transport flake, not an application bug.
  - **Prettier config is authoritative and CI-enforced:** `{ "semi": false, "singleQuote": true,
    "trailingComma": "all", "printWidth": 100 }` (`app/.prettierrc`). No semicolons, single quotes,
    trailing commas everywhere, 100 columns. Run `cd app && npm run format` rather than
    hand-formatting. Note that `app/src/modules/i18n.js` and `app/src/modules/theme.js`
    deliberately use semicolons and double quotes internally in places; do not "fix" them —
    Prettier does not reformat string contents.
  - **Every relative import in `app/src/**` and `app/scripts/**` must carry its `.js` extension.**
    `import { t } from './i18n.js'` is correct; `'./i18n'` is wrong. Vite tolerates the shorter
    form but plain `node` (which runs `app/scripts/*.mjs`) does not, and those scripts generate the
    JSON the deck is built from.
  - **`assets/teaching/spine-s1.json`, `spine-s2.json`, `spine-s3.json` and `gate-sweep.json` are
    build outputs. Never hand-edit them.** CI regenerates them and runs `git diff --exit-code`.
    `assets/teaching/terminology-map.json` is the one exception: it is hand-maintained translation
    data.
  - **Money is Vietnamese Dong (VND) internally, everywhere, always.** United States Dollars are a
    display-only conversion at `EXCHANGE_RATE = 26500` VND per USD
    (`app/src/modules/formatters.js`), pinned by `EXCHANGE_RATE_AS_OF = '2026-08-23'`. Never store
    or compute in USD.
  - **Energy volumes are kilowatt-hours (kWh); prices are VND per kWh.** The five-line bill settles
    on a *monthly* volume; the multi-year projection multiplies a *daily* representative-day cost
    by 365. The gate sweep multiplies a *monthly* bill by 12. Do not mix these periods.
  - **Number formatting is locale-dependent and this is a correctness issue, not cosmetics.**
    `en-US` and `zh-CN` group thousands with `,` and decimalize with `.`; `vi-VN` is the reverse.
    Use `formatNumber` / `formatMoney` from `app/src/modules/formatters.js` in the app and
    `format_number_for_lang` in `build_oct_teaching_deck.py`. A `vi-VN`-shaped number read under
    `en-US` convention silently becomes a 1000x error.
  - **When a headline figure changes, add the superseded string to `tools/retired_figures.json`'s
    `retired` list in the same commit.** `tools/check_retired_figures.py` then fails if the old
    value survives in living prose (`NOTES.md`, `RESOURCES.md`, `MISSION.md`, `corrections-log.md`,
    `facilitator/**/*.md`, `lessons/**/*.html`, `app/docs/**/*.md`, `assets/teaching/*.json`) or in
    any live generator script.
  - **Retire files with `git mv` into `archive/`, never `rm`.** Add a row to `archive/README.md`
    saying what the file was and what replaced it. Nothing in `archive/` is ever executed.
  - **Forward work goes in `plans/`; completed work in `reports/`; durable narrative in
    `learning-records/`; "I got this wrong, here is the rule" entries in the root
    `corrections-log.md`.** Do not create `activeContext.md` at the repository root. Note the
    naming trap: the root `corrections-log.md` is the corrections log; the `lessons/` directory is
    course handout HTML. They are unrelated.
- **Repo map:**
  ```
  app/                      Vite web app -- owns the settlement engine (the source of every number)
    src/modules/            settlement.js, chart.js, ui.js, formatters.js, i18n.js, teach.js, ...
    src/data/               default-scenarios.js, strings.js, strings.baseline.json, teach-steps.js
    scripts/                export-spine.mjs, export-sweep.mjs, i18n-report.mjs (Node, run bare)
    e2e/                    Playwright specs
    public/sw.js            offline service worker
  assets/teaching/          GENERATED bridge: spine-*.json, gate-sweep.json, and the PNG/GIF figures
  build_*.py                six root-level builders (deck, visuals, CfD animation, worksheet DOCX)
  audit_teaching_deck.py    deck word-budget + symbol-deferral auditor
  verify_deck_numbers.py    reconciles on-slide and speaker-notes VND figures against the exports
  tools/                    integrity guards + pipeline.py + their unittest suite in tools/tests/
  ceba/                     the .pptx decks (the October deck is the deliverable)
  facilitator/              run-of-show, panel guide, fresh-viewer kit (human-facing)
  lessons/                  course handout HTML + the Word worksheet
  ```

## Research Inputs

- From `research/2026-09-05-gate-degeneracy-and-unmeasured-mission-brainstorm.md`:
  - The lender and investor gates in `app/scripts/export-sweep.mjs` are strike-only step functions
    (`strike >= 1380` and `strike >= 1450`) that never read the `ratio` argument. Verified
    programmatically against the committed `assets/teaching/gate-sweep.json`: `lenderPass` and
    `investorPass` do not vary with ratio at any strike; only `buyerPass` does.
  - Because `1380 < 1450`, the set of lender-passing cells strictly contains the set of
    investor-passing cells. Measured: the lender gate is the sole blocker in **0** of 70 cells, and
    deleting it entirely leaves the published headline unchanged at **15 of 70**. `DSCR_TARGET =
    1.2` is written into `gate-sweep.json`'s `meta` block and is never used in any computation.
  - `build_oct_teaching_deck.py` contains **14** hardcoded `-en` image paths. Its `--lang` argument
    reaches the terminology map, the number-placeholder substitution, `format_number_for_lang`, the
    `UNTRANSLATED` refusal gate and the output filename — and no image path. The `-vi` and `-zh`
    variants of every referenced figure already exist in `assets/teaching/`. Once the translator
    delivers, `--lang vi` will pass every gate, report success, and produce a Vietnamese deck whose
    charts, breadcrumb strips and QR panel are all English.
  - `app/src/data/strings.js` lines 154 and 158 hand-type four S1 spine figures (`11,020`,
    `8,563`, `500`, `9,063`). They matched `assets/teaching/spine-s1.json` as of 2026-09-05. `app/src/**` is
    absent from both `tools/retired_figures.json`'s `scan` list and
    `tools/verify_prose_figures.py`'s `SCAN_PATTERNS`, and the prose guard's token regex
    (`\d{1,3}(?:,\d{3}){2,}`) requires seven digits, so four-digit figures would pass unseen even
    if the file were scanned. These strings are what the presenter reads aloud during teach mode.
  - `app/src/modules/ui.js` performs all rendering through nine `innerHTML` assignments with zero
    escaping, and `app/src/data/strings.js` already stores raw HTML entities (`&gt;` in
    `crossover_gt_prefix` for three languages; `&amp;` in `control_hints`). The existing contract
    is therefore "string values are HTML fragments," which means adding an `escapeHtml()` call at
    the interpolation sites would double-escape the existing entities.
  - `build_teaching_visuals.py`, `build_cfd_slide.py` and `build_worksheet_answer_docx.py` are
    never invoked by any GitHub Actions workflow. `build_teaching_visuals.py` renders numbers into
    pixels (the M5 heatmap's pass count, the Sankey flow values, the cold-open bill pair), and no
    guard in the repository can read a PNG.
  - `MISSION.md` defines success entirely in terms of presenter mastery ("draw the five-line bill
    from memory", "walk the three canonical cases and the three gates without notes", "teach each
    module at a whiteboard in under five minutes"). The repository has roughly fourteen automated
    checks that a figure is correct and none that the presenter can deliver it.
  - `app/public/sw.js` sets `CACHE_NAME` as module-scope state written only inside the `install`
    handler, and its navigation branch is network-first with no timeout — a slow (rather than dead)
    venue network therefore blocks first paint until the browser's own timeout even though a valid
    cached copy exists.
  - `facilitator/october-run-plan.md` names `plans/2026-october-readiness-checklist.md` as "the
    coding-session half" in its header and defers to it in three later sections. That file was
    closed with status `abandoned` on 2026-08-29.
- From `research/2026-08-22-delivery-stall-and-in-flight-redesign-brainstorm.md`:
  - The `strings.baseline.json` freeze exists specifically so a translator's quoted scope cannot
    change underneath them. `npm run i18n:check` fails when the English key set drifts from the
    baseline in either direction, and when `vi` or `zh` do not carry exactly the English key set.
  - The repository's recurring failure mode is guards that pass for reasons unrelated to the
    condition they exist to detect. Any new guard must be able to go red for the right reason.

## Assumptions and Constraints

- **ASM-001:** The October session date is assumed to be **2026-10-01** and the English content
  freeze **2026-09-15**. Item H1 in `facilitator/october-run-plan.md` (confirm session date and
  venue) is unresolved. **BINDING DEFAULT:** the executor treats PHASE-01 through PHASE-04 as
  pre-freeze work to complete before 2026-09-15, and PHASE-05 and PHASE-06 as post-freeze work.
  If the real date is confirmed later, shift both dates by the same offset; the phase ordering does
  not change.
- **ASM-002:** The VI/ZH translator (item H2) has not yet been engaged and has therefore not been
  quoted a string count. **BINDING DEFAULT:** PHASE-04 adds new English keys and re-freezes
  `app/src/data/strings.baseline.json` in the same commit, with a new `frozenOn` date. If the
  executor discovers that a translator has already been quoted the 151-key scope, they must instead
  implement PHASE-04's gate-panel labels as English literals at their call sites — the precedent
  already documented at the top of `app/src/data/strings.js` for Decree-57 symbols and units — and
  leave `strings.baseline.json` untouched.
- **ASM-003:** The annual debt-service figure used by the new lender gate is not sourced from a
  real financing model. **BINDING DEFAULT:** derive it inside `app/src/modules/gates.js` as
  `referenceMonthlyLoadKwh × 12 × investorLcoeVndPerKwh × DEBT_SHARE` with `DEBT_SHARE = 0.75`
  (a conventional project-finance gearing ratio for a Vietnamese solar independent power producer),
  and label it in `gate-sweep.json`'s `meta.note` as illustrative, exactly as the current
  constants are.
- **ASM-004:** Item H3 (recalibrate the lender and investor gate proxies against real Allotrope
  deal data) is four days overdue with no owner action. **BINDING DEFAULT:** proceed with the
  illustrative constants specified in `## Specification`. They are structurally correct — each gate
  is two-dimensional and each binds somewhere — and replacing the three constants
  (`DSCR_TARGET`, `DEBT_SHARE`, `INVESTOR_LCOE_VND_PER_KWH`) with real values later is a
  three-line change plus one regeneration run.
- **ASM-005:** The presenter drill mode added in PHASE-06 is presenter-private practice, not
  projected material. **BINDING DEFAULT:** implement it English-only with literal strings at the
  call sites, so it does not enlarge the translator's scope and does not require a second
  `strings.baseline.json` re-freeze.
- **ASM-006:** matplotlib PNG output is not byte-stable across operating systems and installed font
  sets. **BINDING DEFAULT:** PHASE-05's figure guard compares **input digests recorded in a
  manifest**, never image bytes or perceptual hashes. A guard that fails for platform reasons is
  worse than no guard.
- **CON-001:** The coverage ratchet in `app/vite.config.js` currently reads global thresholds
  `lines 49 / branches 49 / functions 51 / statements 49` plus a per-file gate on
  `src/modules/settlement.js` of `lines 92 / branches 75 / functions 85 / statements 91`. The
  measured values as of 2026-09-05 are `49.85 / 52.36 / 52.60 / 50.00` — a global margin of
  0.85 percentage points on lines. Any phase that adds source lines without tests can push this
  below the gate. Thresholds are a ratchet: raise them deliberately after a real measurement, never
  lower them to make a build pass.
- **CON-002:** `npm run i18n:check` runs in the `quality` CI job. Any commit that adds or removes a
  key in `STRINGS.en` must update `app/src/data/strings.baseline.json` in the same commit, and must
  keep `STRINGS.vi` and `STRINGS.zh` carrying exactly the same key set as `STRINGS.en`.
  `STRINGS.zh` is populated by a loop at the bottom of `app/src/data/strings.js` that copies the
  English key set and sets every value to `'UNTRANSLATED'`, so `zh` needs no manual edit; `vi` does.
- **CON-003:** `assets/teaching/spine-*.json` and `gate-sweep.json` are regenerated by the
  `deck-parity` CI job, which then runs `git diff --exit-code` on them. Any change to
  `app/src/modules/settlement.js`, `app/src/data/default-scenarios.js`, `app/scripts/export-spine.mjs`
  or `app/scripts/export-sweep.mjs` requires committing the regenerated JSON in the same commit.
- **DEC-001:** The gate-sweep grid stays at 10 strikes × 7 volume ratios = 70 cells
  (`STRIKES = [1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]`,
  `RATIOS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3]`). It was extended from 56 cells on 2026-08-23
  specifically so both developer-side thresholds sit interior to the grid rather than at its edge.
  Do not change the grid in this plan — changing the model and the grid at once makes the headline
  movement impossible to attribute.
- **DEC-002:** The buyer gate is not changed. It is already an exact lifetime-cost comparison
  computed through `buildFiveLineBill` and it already varies with both axes.
- **DEC-003:** String values in `app/src/data/strings.js` remain HTML fragments. PHASE-03 adds a
  *validating test*, not runtime escaping, because the table already contains deliberate entities
  (`&gt;`, `&amp;`) that runtime escaping would double-escape into visible garbage.

## Specification

### S1 — The replacement gate model

All three gates are evaluated per grid cell, where a cell is one `(strike, ratio)` pair.

**Symbols**

| Symbol | Meaning | Value / source |
|---|---|---|
| `strike` | Contract strike price, nominal (year-1) | one of `STRIKES`, VND per kWh |
| `ratio` | Contracted volume as a fraction of the reference monthly load | one of `RATIOS`, dimensionless |
| `L` | Reference monthly consumption | `scenarioProfiles.workshop1.monthlyVolumes.total` = 5,000,000 kWh per month |
| `Q` | Contracted monthly volume for this cell | `Q = round(L × ratio)`, kWh per month |
| `F` | Year-1 full market price (FMP) | `scenarioProfiles.workshop1.overrides.marketPrice` = 1,150 VND per kWh |
| `R` | Year-1 retail tariff | `defaultInputs.retailTariff` = 2,204 VND per kWh |
| `LCOE` | Illustrative full levelised cost of energy | `INVESTOR_LCOE_VND_PER_KWH` = 1,450 VND per kWh |
| `DSCR` | Target debt-service coverage ratio | `DSCR_TARGET` = 1.2, dimensionless |
| `g` | Assumed debt share of project cost (gearing) | `DEBT_SHARE` = 0.75, dimensionless (ASM-003) |
| `D` | Assumed annual debt service | `D = L × 12 × LCOE × g` VND per year |
| `H` | Projection horizon | `HORIZON_YEARS` = 20 years |
| `e` | Annual escalation applied to strike and retail | `ESCALATION` = 0.04 per year |
| `f` | Annual escalation applied to FMP | `FMP_ESCALATION` = 0.04 per year |

**Buyer gate — unchanged (DEC-002)**

```
lifetimeDppa = Σ(y = 1..H)  12 × cKh(strike × (1+e)^(y-1), Q, F × (1+f)^(y-1), R × (1+e)^(y-1))
lifetimeBau  = Σ(y = 1..H)  12 × L × R × (1+e)^(y-1)
buyerPass    = lifetimeDppa ≤ lifetimeBau
```

`cKh(...)` is `buildFiveLineBill(...).cKh` from `app/src/modules/settlement.js` — the customer's
total monthly payment in VND, that is, the four EVN lines plus the contract-for-difference
settlement.

**Lender gate — replaced**

The lender underwrites contracted (hedged) revenue only; uncontracted spot revenue does not count
toward debt service. This is why the lender gate must depend on volume.

```
annualContractRevenue = Q × 12 × strike            (VND per year, nominal year-1 strike)
D                     = L × 12 × LCOE × g          (VND per year)
lenderPass            = annualContractRevenue ≥ DSCR × D
```

With the values above this reduces algebraically to `ratio × strike ≥ 1305` VND per kWh, and
`D = 65,250,000,000` VND per year. Both are consequences of the constants, not separate constants —
do not hardcode either.

**Investor gate — replaced**

The equity investor is repaid out of *total* plant revenue over *total* generation, so uncontracted
output earning spot counts. The plant is assumed to be sized to the reference load, so generation
equals `L`.

```
contractedRevenue = min(Q, L) × strike             (VND per month)
spotRevenue       = max(L - Q, 0) × F              (VND per month)
blendedRevenuePerKwh = (contractedRevenue + spotRevenue) / L    (VND per kWh)
investorPass      = blendedRevenuePerKwh ≥ LCOE
```

For `ratio ≤ 1` this is `ratio × strike + (1 - ratio) × F ≥ LCOE`; for `ratio > 1` the contract
quantity exceeds physical generation, all generation settles at strike, and it reduces to
`strike ≥ LCOE`.

**Combined**

```
allPass = buyerPass AND lenderPass AND investorPass
```

### S2 — Expected results of S1 on the current 70-cell grid

These values were computed by running the formulas above against
`app/src/modules/settlement.js`'s `buildFiveLineBill` on 2026-09-05. The executor must reproduce
them exactly; any difference means the implementation diverges from this specification.

| Quantity | Current (degenerate) | After S1 |
|---|---|---|
| `cellCount` | 70 | 70 |
| `buyerPassCount` | 62 | **62** (unchanged, DEC-002) |
| `lenderPassCount` | 28 | **36** |
| `investorPassCount` | 21 | **15** |
| `passCount` (all three) | 15 | **8** |

Grid shape after S1 (columns are the seven ratios 0.7 → 1.3 left to right; `B`/`L`/`I` = that gate
passes; `#` = all three pass):

```
strike   buyer     lender    investor   all
1100    BBBBBBB   .....LL   .......   .......
1150    BBBBBBB   .....LL   .......   .......
1200    BBBBBBB   ....LLL   .......   .......
1250    BBBBBBB   ....LLL   .......   .......
1300    BBBBBBB   ....LLL   .......   .......
1350    BBBBBB.   ...LLLL   .......   .......
1400    BBBBBB.   ...LLLL   .......   .......
1450    BBBBB..   ..LLLLL   ...IIII   ...##..
1500    BBBBB..   ..LLLLL   ..IIIII   ..###..
1550    BBBBB..   ..LLLLL   .IIIIII   ..###..
```

Non-degeneracy properties the implementation must satisfy, each verifiable from the emitted
`gate-sweep.json`:

1. Each of `buyerPass`, `lenderPass`, `investorPass` varies with `ratio` for at least one strike.
2. Each gate is the **sole blocker** (that gate fails while the other two pass) in at least one
   cell. Expected counts: buyer **6** cells, lender **1** cell (strike 1,550 at ratio 0.8),
   investor **20** cells.
3. Deleting any single gate changes `passCount`.

If the author later wants the lender band more prominent on the heatmap, `DEBT_SHARE` is the tuning
knob: raising it raises the `ratio × strike` floor and widens the lender-blocked region. Do not tune
it in this plan.

### S3 — Retired-figure strings introduced by S1

Every string below is currently correct and becomes wrong the moment S1 lands. Each must be added
to `tools/retired_figures.json`'s `retired` array in the same commit as the model change, in the
existing entry shape `{"text": ..., "reason": ..., "replacedBy": ..., "retiredOn": "2026-09-XX"}`.

| `text` to retire | Where it currently appears |
|---|---|
| `15 of 70` | `NOTES.md:47`, `facilitator/dppa-panel-guide.md:80`, `lessons/0004-module-4-three-gates.html:190` |
| `15/70` | `RESOURCES.md:19`, `facilitator/dppa-panel-guide.md:120` |
| `15 / 70` | `lessons/0005-module-5-canonical-cases.html:138` (SVG text) |
| `15 of 70 scenarios` | `facilitator/dppa-workshop-facilitator-guide.md:106` |
| `lender 28` | `NOTES.md:48`, `facilitator/dppa-workshop-facilitator-guide.md:106` |
| `investor 21` | `NOTES.md:48`, `facilitator/dppa-workshop-facilitator-guide.md:106` |

`buyer 62` is **not** retired — the buyer gate is unchanged and its count stays 62. Do **not** add a
bare `15` or a bare `21` to the retired list: `15` becomes the new `investorPassCount` and a bare
two-digit token would fire on unrelated prose throughout the repository.

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Make the vi/zh deck builds emit language-matched figures, or fail loudly | None | `--lang`-aware asset resolution in `build_oct_teaching_deck.py`; asset-existence assertion; `tools/tests/test_deck_asset_paths.py` |
| PHASE-02 | Replace the degenerate gate model, regenerate every downstream artifact, retire the superseded headline | None | Rewritten gates in `app/scripts/export-sweep.mjs`; regenerated `gate-sweep.json`, figures and deck; six updated prose files; six new `retired_figures.json` entries |
| PHASE-03 | Stop the app from carrying hand-typed spine figures and from breaking on translator markup | None | Generated `app/src/data/spine-figures.js`; templated teach strings; `app/src/data/strings.test.js` markup validator |
| PHASE-04 | Put the gate model in the tested engine and give Module 5 a live demo | PHASE-02 | `app/src/modules/gates.js` + tests; `#gatePanel` in the app; re-frozen `strings.baseline.json` |
| PHASE-05 | Close the last unguarded artifact class and stop two guards from decaying into noise | PHASE-02 | `assets/teaching/figures-manifest.json`; `tools/check_figures_manifest.py` + tests; visuals build in CI; content-aware `check_delivery_pipeline.py`; successor-aware `check_plan_status.py` |
| PHASE-06 | Instrument the mission's own success criterion and harden the venue-day failure modes | PHASE-04 | `?drill=1` presenter drill; build-time service-worker cache version; navigation fetch timeout; repaired `facilitator/october-run-plan.md` cross-references |

## Detailed Phases

### PHASE-01 - Language-Correct Deck Assets

**Goal**

Make `build_oct_teaching_deck.py --lang vi` and `--lang zh` emit decks whose images match the deck's
language, and make a missing translated asset a loud build failure rather than a silent English
substitution. This must land before the translator delivers, because after delivery the vi/zh decks
will build clean and ship English charts with nothing to catch it.

**Tasks**

- [ ] TASK-01-01: Read `build_oct_teaching_deck.py` and locate all 14 hardcoded `-en` asset paths.
      They are at approximately lines 277, 289, 368, 369, 398, 406, 410 (a speaker-notes mention),
      413, 416, 417 (a speaker-notes mention), 418, 421, 427 and 443. Confirm the exact set with
      `grep -n '\-en\.' build_oct_teaching_deck.py`.
- [ ] TASK-01-02: Add a module-level suffix map that resolves the two distinct language-suffix
      naming conventions in this repository. Files under `assets/teaching/` use `-en` / `-vi` /
      `-zh`. The contract-for-difference animations directly under `assets/` use `-en` / `-vi` /
      `-zh-cn`. A single `f"-{lang}"` substitution will fix twelve paths and silently break the two
      that reference `assets/cfd-s1-*.gif`.
- [ ] TASK-01-03: Replace every hardcoded `-en` filename with a call to a new
      `asset_for_lang(basename, lang, family)` helper. Leave the speaker-notes *text* mentions of
      filenames (lines ~410 and ~417) resolving through the same helper so the presenter's note
      names the file that was actually embedded.
- [ ] TASK-01-04: Add an existence assertion inside `asset_for_lang` that raises `SystemExit` with
      the missing path and the exact regeneration command when the resolved file does not exist.
- [ ] TASK-01-05: Add `tools/tests/test_deck_asset_paths.py` covering the helper's resolution and
      failure behaviour.
- [ ] TASK-01-06: Decide and record the Chinese font question. `app/src/main.js` self-hosts Inter
      latin and vietnamese subsets only, and Inter has no CJK coverage. Add a short subsection to
      `facilitator/translation-brief.md` stating that the ZH build accepts the venue machine's
      system CJK font fallback, and that the deck aesthetic constraint in `NOTES.md` is knowingly
      relaxed for ZH. (This is a documentation decision, not a code change — do not add a CJK font
      subset in this plan.)
- [ ] TASK-01-07: Verify the English deck is byte-comparable before and after by rebuilding it to a
      scratch directory and running `tools/compare_deck.py` against the committed deck. The English
      path must be unchanged.

**File Changes**

- `build_oct_teaching_deck.py` (modify): add a `LANG_SUFFIX` dict and an `asset_for_lang` helper
  near the existing `ASSETS` constant (around line 27, where `gate-sweep.json` is opened); replace
  all 14 hardcoded `-en` filenames with helper calls. Leave the `TEXT` dictionaries, the
  terminology-map loading, `format_number_for_lang`, `substitute_slots`, the `UNTRANSLATED` refusal
  gate at line ~214, and the `--out` handling completely alone.
- `tools/tests/test_deck_asset_paths.py` (create): unit tests for `asset_for_lang`.
- `facilitator/translation-brief.md` (modify): append a "Chinese typography" subsection recording
  the system-font-fallback decision. Do not alter the existing translation instructions.

**Function Signatures**

- `asset_for_lang(basename: str, lang: str, family: str = "teaching") -> str` — returns an absolute
  or repository-relative path to the language-specific asset. `family="teaching"` resolves under
  `assets/teaching/` with suffixes `en`/`vi`/`zh`; `family="cfd"` resolves under `assets/` with
  suffixes `en`/`vi`/`zh-cn`. Raises `SystemExit` with a message naming the missing path and the
  command `PYTHONPATH= py build_teaching_visuals.py --lang <lang>` when the resolved file does not
  exist.
- `LANG_SUFFIX: dict[str, dict[str, str]]` — module constant mapping family name to
  `{lang: filename suffix}`; exactly
  `{"teaching": {"en": "en", "vi": "vi", "zh": "zh"}, "cfd": {"en": "en", "vi": "vi", "zh": "zh-cn"}}`.

**Test Specs**

- `asset_for_lang("m5-gate-heatmap", "en", "teaching")` → path ending
  `assets/teaching/m5-gate-heatmap-en.png` (file exists, no exception).
- `asset_for_lang("m5-gate-heatmap", "vi", "teaching")` → path ending
  `assets/teaching/m5-gate-heatmap-vi.png`.
- `asset_for_lang("m5-gate-heatmap", "zh", "teaching")` → path ending
  `assets/teaching/m5-gate-heatmap-zh.png` — **not** `-zh-cn`.
- `asset_for_lang("cfd-s1", "zh", "cfd")` → path ending `assets/cfd-s1-zh-cn.gif` — **not** `-zh`.
- `asset_for_lang("cfd-s1", "en", "cfd")` → path ending `assets/cfd-s1-en.gif`.
- `asset_for_lang("does-not-exist", "vi", "teaching")` → raises `SystemExit`; the exception message
  contains both the string `does-not-exist-vi` and the string `build_teaching_visuals.py`.
- `asset_for_lang("m5-gate-heatmap", "de", "teaching")` → raises `SystemExit` (unsupported language;
  the argument parser already restricts `--lang` to `en|vi|zh`, so this is a defence-in-depth case).

**Dependencies**

- None. `assets/teaching/*-vi.png`, `*-zh.png` and `assets/cfd-s*-vi.gif`, `*-zh-cn.gif` are already
  committed — verify with `ls assets/teaching/ | grep -c 'zh\.'` (expect at least 15).

**Exit Criteria**

- [ ] `grep -c '\-en\.\(png\|gif\|mp4\)' build_oct_teaching_deck.py` prints `0`.
- [ ] `PYTHONPATH= py build_oct_teaching_deck.py --lang en --out /tmp/deck-en` exits 0 and
      `PYTHONPATH= py tools/compare_deck.py "/tmp/deck-en/DPPA Presentation Oct 2026 To Teach.pptx" "ceba/DPPA Presentation Oct 2026 To Teach.pptx"`
      reports no differences.
- [ ] `PYTHONPATH= py build_oct_teaching_deck.py --lang vi --out /tmp/deck-vi` still exits non-zero
      with the existing `UNTRANSLATED` message (the translator has not delivered; this proves the
      text gate is untouched).
- [ ] `py -m pytest tools/tests -q` passes with at least 7 more tests than before.

**Phase Risks**

- **RISK-01-01:** The two speaker-notes strings that *name* a filename (`m2-sankey-build-en.gif`,
  `assets/cfd-s1-en.gif`) are prose the presenter reads, not `add_picture` arguments. Resolving
  them through the helper changes deck text and therefore changes `tools/compare_deck.py`'s output
  for the English deck. Mitigation: resolve them through the helper but confirm the English result
  is character-identical (`-en` in, `-en` out), so the English comparison in Exit Criteria still
  reports no differences. If it does differ, the helper is wrong.
- **RISK-01-02:** `assets/teaching/fallback/teach-m{1..6}.mp4` and their posters carry no language
  suffix at all. They are presenter-fallback recordings of the English app. Leave them
  unsuffixed and unchanged; add a one-line comment at their reference site saying so, or the next
  reader will assume the phase was done incompletely.

---

### PHASE-02 - Non-Degenerate Gate Model and Full Regeneration

**Goal**

Replace the two strike-only developer-side gates with the volume-dependent model in
`## Specification` S1, regenerate every artifact that descends from it, update the six prose files
that hand-type the headline, and retire the superseded strings. After this phase the M5 heatmap
describes a genuine two-dimensional feasible region and each of its three gates binds somewhere.

**Tasks**

- [ ] TASK-02-01: Rewrite `evaluateCell` in `app/scripts/export-sweep.mjs` to implement S1. Add
      `DEBT_SHARE = 0.75` and derive `ANNUAL_DEBT_SERVICE_VND` from it; do not hardcode
      `65250000000` or `1305`. Delete `LENDER_DEBT_SERVICE_VND_PER_KWH` — it no longer exists as a
      concept.
- [ ] TASK-02-02: Extend the emitted `meta` block with `debtShare`, `annualDebtServiceVnd`, and a
      rewritten `note` explaining that the lender gate tests contracted revenue against debt
      service at the target coverage ratio and the investor gate tests blended revenue per generated
      kWh against full LCOE, both illustrative. Keep `dscrTarget` and `investorLcoeVndPerKwh`.
      Remove `lenderDebtServiceVndPerKwh`.
- [ ] TASK-02-03: Add three self-check assertions to `main()` in `export-sweep.mjs`, alongside the
      existing anchor-cell check, that fail the export if the model is degenerate: each gate must
      vary with ratio for at least one strike, each gate must be the sole blocker in at least one
      cell, and `passCount` must change if any single gate is removed. This is the guard that makes
      the defect this phase fixes impossible to reintroduce silently.
- [ ] TASK-02-04: Keep the existing anchor assertion (`yearBill(1250, 1.0, 1).cKh === 9063196000`)
      untouched. It ties the sweep's inputs to `assets/teaching/spine-s1.json` and none of the S1
      changes touch bill construction.
- [ ] TASK-02-05: Regenerate the whole chain in the documented order:
      ```bash
      cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs
      cd .. && PYTHONPATH= py tools/pipeline.py --lang en
      ```
      Confirm `export-sweep.mjs` prints `passCount: 8 / 70`.
- [ ] TASK-02-06: Add the six entries from `## Specification` S3 to `tools/retired_figures.json`'s
      `retired` array. Also update the `replacedBy` field of the two pre-existing entries whose
      `replacedBy` reads `15 of 70` / `15/70` so the file's own audit trail stays accurate.
- [ ] TASK-02-07: Update the six prose locations that hand-type the headline:
      `NOTES.md:47-48`, `RESOURCES.md:19`, `facilitator/dppa-panel-guide.md:80` and `:120`,
      `facilitator/dppa-workshop-facilitator-guide.md:106`,
      `lessons/0004-module-4-three-gates.html:190` and `:228`,
      `lessons/0005-module-5-canonical-cases.html:135` (the SVG `aria-label`) and `:138` (the SVG
      `<text>` body).
- [ ] TASK-02-08: Correct the substantive claim in `facilitator/dppa-panel-guide.md:120`. It
      currently reads "DSCR ≥ 1.20× every year is the hardest gate" — under the old model the
      lender gate never bound at all, and under S1 it is the sole blocker in exactly one cell. The
      hardest gate under S1 is the investor gate (sole blocker in 20 cells). Rewrite the anchor
      accordingly rather than merely swapping the count.
- [ ] TASK-02-09: Add a `## 2026-09-XX` entry to the root `corrections-log.md` recording the rule
      this defect implies: *a guard that verifies a number's provenance does not verify that the
      computation producing it says anything; a model whose gates are constant along an axis, or
      whose gates are strictly ordered, passes every parity check while carrying no information.*

**File Changes**

- `app/scripts/export-sweep.mjs` (modify): replace the two constant declarations and the
  `lenderPass` / `investorPass` lines inside `evaluateCell`; add `DEBT_SHARE` and the derived
  `ANNUAL_DEBT_SERVICE_VND`; extend the `meta` block; add three degeneracy assertions to `main()`.
  Leave `STRIKES`, `RATIOS`, `yearBill`, `contractedForRatio`, `buyerPass`, the per-gate count
  aggregation and the existing anchor assertion alone.
- `assets/teaching/gate-sweep.json` (modify — **generated, never hand-edit**): regenerated by
  running the exporter.
- `assets/teaching/m5-gate-heatmap-{en,vi,zh}.png` (modify — generated): re-rendered by
  `build_teaching_visuals.py`.
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (modify — generated): rebuilt by
  `build_oct_teaching_deck.py`.
- `tools/retired_figures.json` (modify): six new `retired` entries; two `replacedBy` corrections.
- `NOTES.md`, `RESOURCES.md`, `facilitator/dppa-panel-guide.md`,
  `facilitator/dppa-workshop-facilitator-guide.md`, `lessons/0004-module-4-three-gates.html`,
  `lessons/0005-module-5-canonical-cases.html` (modify): update the headline figures and the
  panel-guide claim.
- `corrections-log.md` (modify): prepend a dated entry above the `## 2026-08-23` section.

**Function Signatures**

- `evaluateCell(strike: number, ratio: number) -> { strike: number, ratio: number, buyerPass: boolean, lenderPass: boolean, investorPass: boolean, allPass: boolean, lifetimeDppaVnd: number, lifetimeBauVnd: number, annualContractRevenueVnd: number, blendedRevenuePerKwh: number }`
  — one grid cell's gate outcomes plus the two new diagnostic quantities the heatmap caption and the
  app panel both need. All VND values are integers (`Math.round`); `blendedRevenuePerKwh` is a
  float.
- `assertNonDegenerate(cells: Array<Cell>) -> void` — throws (via `console.error` + `process.exit(1)`,
  matching the file's existing `assertAnchor` style) when any gate is constant in `ratio` at every
  strike, when any gate is never the sole blocker, or when removing any single gate leaves
  `passCount` unchanged.

**Test Specs**

- `evaluateCell(1250, 1.0)` → `buyerPass: true`, `lenderPass: false` (1.0 × 1250 = 1250, below the
  1,305 floor), `investorPass: false` (1250 < 1450), `allPass: false`. Cross-check against the S2
  grid: the strike-1250 row is `BBBBBBB ....LLL .......`, and ratio 1.0 is the fourth column
  (index 3), where the lender character is `.`.
- `evaluateCell(1550, 0.8)` → `buyerPass: true`, `lenderPass: false` (0.8 × 1550 = 1240 < 1305),
  `investorPass: true` (0.8 × 1550 + 0.2 × 1150 = 1240 + 230 = 1470 ≥ 1450), `allPass: false`.
  This is the single cell where the lender gate is the sole blocker.
- `evaluateCell(1400, 1.0)` → `buyerPass: true`, `lenderPass: true` (1400 ≥ 1305),
  `investorPass: false` (1400 < 1450), `allPass: false`. Investor is the sole blocker.
- `evaluateCell(1450, 1.2)` → `lenderPass: true` (1.2 × 1450 = 1740), `investorPass: true`
  (ratio > 1 → blended = strike = 1450 ≥ 1450), `buyerPass: false`, `allPass: false`. Buyer is the
  sole blocker.
- `evaluateCell(1500, 1.0)` → all three true, `allPass: true`.
- `buildSweep()` → `cellCount: 70`, `passCount: 8`, `buyerPassCount: 62`, `lenderPassCount: 36`,
  `investorPassCount: 15`.
- Sole-blocker counts across the full grid → buyer 6, lender 1, investor 20.
- Edge case, `ratio > 1`: `evaluateCell(1450, 1.3)` → `investorPass: true` because contracted
  volume exceeds generation, so `min(Q, L) = L` and `max(L - Q, 0) = 0`, giving
  `blendedRevenuePerKwh === strike` exactly. Assert no division by a changed denominator.
- Edge case, degeneracy guard: temporarily setting `INVESTOR_LCOE_VND_PER_KWH` to `1000` (so the
  investor gate passes everywhere and is never a sole blocker) must make `assertNonDegenerate`
  exit non-zero. Verify this by hand once; do not commit the modified constant.

**Dependencies**

- Node 24 and `cd app && npm install` for the exporters.
- `pip install -r requirements.txt` for `build_teaching_visuals.py` and
  `build_oct_teaching_deck.py`.
- PHASE-01 is **not** a dependency, but if PHASE-01 has landed, TASK-02-05's pipeline run will
  exercise the new asset resolution as a side effect — that is desirable.

**Exit Criteria**

- [ ] `cd app && node scripts/export-sweep.mjs` prints `passCount: 8 / 70` and exits 0.
- [ ] `py -c "import json;d=json.load(open('assets/teaching/gate-sweep.json'));print(d['passCount'],d['buyerPassCount'],d['lenderPassCount'],d['investorPassCount'])"`
      prints `8 62 36 15`.
- [ ] `PYTHONPATH= py tools/check_retired_figures.py` prints `RETIRED-FIGURES PASS` (this is the
      real test that TASK-02-07 found every occurrence — it will fail loudly on any missed one).
- [ ] `PYTHONPATH= py verify_deck_numbers.py --lang en` prints `PARITY PASS`.
- [ ] `PYTHONPATH= py audit_teaching_deck.py` prints `PASS: word budget and symbol-deferral checks clean.`
- [ ] `PYTHONPATH= py tools/verify_prose_figures.py` prints `PROSE-FIGURES PASS`.
- [ ] `git status --porcelain assets/teaching/` shows `gate-sweep.json` and the three
      `m5-gate-heatmap-*.png` files modified, and nothing under `assets/teaching/` unexpectedly
      unmodified.

**Phase Risks**

- **RISK-02-01:** Regenerating `assets/teaching/spine-*.json` in TASK-02-05 must produce **no**
  diff — S1 does not touch the spine. If `git diff assets/teaching/spine-s1.json` is non-empty,
  something unrelated has drifted and must be understood before proceeding, not committed.
- **RISK-02-02:** The heatmap's cell shading is `int(buyerPass) + int(lenderPass) +
  int(investorPass)` (a 0–3 count), rendered by `render_m5_heatmap` in `build_teaching_visuals.py`.
  Under S1 the shading pattern changes shape substantially. Open the regenerated
  `assets/teaching/m5-gate-heatmap-en.png` and confirm the feasible region reads as a legible
  diagonal band rather than noise before rebuilding the deck. If it does not, the slide is worse
  than before regardless of the model being correct.
- **RISK-02-03:** `tools/check_retired_figures.py` will fail on the first run after TASK-02-06 and
  before TASK-02-07 completes. That is correct behaviour, not a bug — work through the reported
  files until it passes.
- **RISK-02-04:** The `.git` directory is already 153 MB and the October deck is 14.9 MB;
  committing a rebuilt deck adds another full copy. Commit the rebuilt `.pptx` once at the end of
  this phase, not after each intermediate pipeline run.

---

### PHASE-03 - Translator-Safe Strings and Generated Spine Figures

**Goal**

Remove the last hand-typed settlement figures from the application, putting them under the same
export-drift gate that protects the deck, and add a unit test that rejects any string-table value
whose markup would corrupt the DOM — before ~290 translator-supplied strings arrive.

**Tasks**

- [ ] TASK-03-01: Extend `app/scripts/export-spine.mjs` to additionally write
      `app/src/data/spine-figures.js`, a generated ES module exporting the millions-rounded S1
      figures the teach strings need. Write it with the repository's Prettier style (no semicolons,
      single quotes, trailing commas) so `npx prettier --check src` passes on the generated file.
- [ ] TASK-03-02: Add a header comment to the generated file reading
      `// GENERATED by app/scripts/export-spine.mjs -- do not hand-edit. See CLAUDE.md section 4.`
- [ ] TASK-03-03: Convert `teach_m1_expected` and `teach_m2_expected` in all three languages of
      `app/src/data/strings.js` from literal figures to placeholder templates. The **keys must not
      change** (see CON-002) — only the values. Use `{bau}`, `{cEvn}`, `{cfd}`, `{cKh}` as the
      placeholder tokens, matching the existing `{index}` / `{total}` / `{years}` convention used
      elsewhere in the table.
- [ ] TASK-03-04: Substitute the placeholders in `app/src/modules/teach.js`'s `applyStep`, using
      `formatNumber` from `app/src/modules/formatters.js` so the figures are grouped per the active
      locale. This fixes a latent defect as a side effect: `11,020` is currently `en-US`-grouped
      even when the interface language is Vietnamese, where it should read `11.020`.
- [ ] TASK-03-05: Create `app/src/data/strings.test.js` asserting that no value in any language of
      `STRINGS` contains a raw `<` or `>`, and that every `&` in every value is part of a
      well-formed HTML entity. The current table passes this rule with zero violations — verified
      2026-09-05 — so it can be adopted with no string edits.
- [ ] TASK-03-06: Add `app/src/data/strings.js` to `SCAN_PATTERNS` in
      `tools/verify_prose_figures.py` and to the `scan` array in `tools/retired_figures.json`, so
      the file is covered by the retired-figure guard going forward even though TASK-03-03 removes
      its current figures.
- [ ] TASK-03-07: Add a note to `facilitator/translation-brief.md` stating the markup contract the
      translator must honour: values are HTML fragments; a literal less-than or greater-than sign
      must be written `&lt;` or `&gt;`; a literal ampersand must be written `&amp;`; placeholder
      tokens in braces (`{bau}`, `{years}`, `{index}`, `{total}`, `{scenario}`, `{sign}`,
      `{value}`) must be preserved verbatim and never translated.

**File Changes**

- `app/scripts/export-spine.mjs` (modify): add a `writeAppFigures(s1)` function and call it from
  `main()` after the three `writePack` calls. Leave `buildSpinePack`, `assertAnchor`, the anchor
  values and the three `writePack` calls unchanged.
- `app/src/data/spine-figures.js` (create — generated): the S1 millions-rounded figures.
- `app/src/data/strings.js` (modify): change the *values* of `teach_m1_expected` and
  `teach_m2_expected` in the `en` and `vi` blocks to placeholder templates. `zh` needs no edit —
  its values are generated by the `UNTRANSLATED` loop at the bottom of the file. Change no keys.
- `app/src/modules/teach.js` (modify): import `SPINE_FIGURES` and `formatNumber`, and substitute the
  four placeholders when setting `.teach-expected`'s `textContent` in `applyStep`. Leave
  `buildBanner`, `initTeachMode`, `setControlValue` and `selectScenario` alone.
- `app/src/data/strings.test.js` (create): the markup validator.
- `tools/verify_prose_figures.py` (modify): append `"app/src/data/strings.js"` to `SCAN_PATTERNS`.
- `tools/retired_figures.json` (modify): append `"app/src/data/strings.js"` to the `scan` array.
- `facilitator/translation-brief.md` (modify): append a "Markup and placeholder contract"
  subsection.

**Function Signatures**

- `writeAppFigures(s1: SpinePack) -> void` (in `app/scripts/export-spine.mjs`) — writes
  `app/src/data/spine-figures.js` containing
  `export const SPINE_FIGURES = { s1: { bauMillions: number, cEvnMillions: number, cfdMillions: number, cKhMillions: number } }`
  sourced from `s1.bau.monthlyVndMillionsRounded`, `s1.bill.cEvn.vndMillionsRounded`,
  `s1.bill.lines.cfd.vndMillionsRounded` and `s1.bill.cKh.vndMillionsRounded`. Returns nothing;
  logs the written path in the same style as `writePack`.
- `formatNumber(value: number) -> string` (existing, `app/src/modules/formatters.js`) — the active
  locale's grouped integer rendering; reused, not modified.

**Test Specs**

- `spine-figures.js` after regeneration → `SPINE_FIGURES.s1` deep-equals
  `{ bauMillions: 11020, cEvnMillions: 8563, cfdMillions: 500, cKhMillions: 9063 }`.
- Every `[lang, key, value]` triple in `STRINGS` → `/[<>]/.test(value)` is `false`. Expected result
  on the current table: **0 violations across all three languages.**
- Every `[lang, key, value]` triple in `STRINGS` →
  `value.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, '').includes('&')` is `false`.
  Expected result on the current table: **0 violations.**
- Deliberate negative case: a locally constructed object `{ en: { k: 'Giá < FMP' } }` passed to the
  validator's exported helper → reports exactly one violation for key `k` with reason
  `raw angle bracket`.
- Deliberate negative case: `{ en: { k: 'strike & FMP' } }` → reports one violation with reason
  `bare ampersand`.
- Positive control: `{ en: { k: 'Strike &amp; FMP reshape the graph' } }` → zero violations (this
  is the shape of the real `control_hints` value, which must keep passing).
- Positive control: `{ en: { k: '&gt;' } }` → zero violations (this is the real
  `crossover_gt_prefix` value in all three languages).
- Teach-mode substitution under `vi`: with `setLang('vi')` active,
  `t('teach_m1_expected')` with placeholders substituted → the rendered string contains `11.020`
  (period-grouped), not `11,020`.
- Teach-mode substitution under `en` → the rendered string contains `11,020`.

**Dependencies**

- None. `app/src/modules/formatters.js` already exports `formatNumber` and already resolves the
  active locale through `resolveLocale`.

**Exit Criteria**

- [ ] `cd app && node scripts/export-spine.mjs` exits 0 and writes both the three
      `assets/teaching/spine-*.json` files and `app/src/data/spine-figures.js`.
- [ ] `cd app && npx vitest run src/data/strings.test.js` passes.
- [ ] `cd app && npm run i18n:check` prints `I18N-CHECK PASS (151 keys, frozen 2026-08-23)` —
      unchanged, because this phase changes values, not keys.
- [ ] `cd app && npx prettier --check src e2e scripts *.config.js` passes, including the newly
      generated `src/data/spine-figures.js`.
- [ ] `grep -nE "[0-9]{1,3}(,[0-9]{3})+" app/src/data/strings.js` returns no match on the
      `teach_m1_expected` or `teach_m2_expected` lines.
- [ ] `PYTHONPATH= py tools/verify_prose_figures.py` still prints `PROSE-FIGURES PASS`, now with a
      higher scanned-file count.
- [ ] `cd app && npm test` passes with more tests than before.

**Phase Risks**

- **RISK-03-01:** Adding `app/src/data/strings.js` to `verify_prose_figures.py`'s `SCAN_PATTERNS`
  means the guard now parses a JavaScript file with a token regex designed for prose. Its existing
  `<script>` and HTML-comment stripping does not apply to a `.js` file. Run the guard immediately
  after TASK-03-06 and before committing; if it produces false positives on unrelated code, scope
  the pattern to the `STRINGS` object literal rather than the whole file, or revert TASK-03-06 and
  rely on TASK-03-03 having removed the figures.
- **RISK-03-02:** `app/src/data/spine-figures.js` is a generated file inside a linted, coverage-
  measured directory. Confirm it does not depress the coverage ratio (it is data with no
  executable branches, so it should count as fully covered statements) by running
  `cd app && npm run coverage` and checking the global lines figure has not fallen below 49.

---

### PHASE-04 - Extracted Gate Engine and a Live Three-Gate Panel

**Goal**

Move the gate model out of a build script and into a tested engine module imported by both the
exporter and the application, then give Module 5 the live demo it has never had: three indicator
lamps that respond to the strike, contracted-volume and escalation controls and name the binding
constraint. Module 5 is the one module the application currently abandons, and it is where a
lender's question lands.

**Tasks**

- [ ] TASK-04-01: Create `app/src/modules/gates.js` exporting the gate constants and a pure
      `evaluateGates(input)` implementing `## Specification` S1. It must take every quantity as an
      argument — no imports from `default-scenarios.js` — so it is testable in isolation and usable
      from both callers.
- [ ] TASK-04-02: Rewrite `app/scripts/export-sweep.mjs` to import `evaluateGates` from
      `../src/modules/gates.js` and delete its local copies of the gate logic and the loss
      constants. Keep the grid definition, the year-loop lifetime accumulation, the anchor
      assertion and the degeneracy assertions in the exporter — they are about the sweep, not the
      gates.
- [ ] TASK-04-03: Regenerate `assets/teaching/gate-sweep.json` and confirm it is **byte-identical**
      to the file PHASE-02 produced. This is the proof that the extraction is behaviour-preserving.
- [ ] TASK-04-04: Add `#gatePanel` to `renderAppShell` in `app/src/modules/ui.js`, inside the
      multi-year section immediately after `#multiYearRollups` (the multi-year chart is already
      described in the string table as "the buyer-gate check", so the three gates belong beside it).
- [ ] TASK-04-05: Add `renderGatePanel(container, gates, currency)` to `app/src/modules/ui.js`,
      reusing the existing `compactPill(label, value, tone)` helper for consistent styling. Tones:
      `'result'` for a passing gate, `'warning'` for a failing one.
- [ ] TASK-04-06: Call `renderGatePanel` from `updateView()` in `app/src/main.js`, wrapped in the
      same `try`/`catch` pattern the chart renderers use, and pass a user-visible fallback message
      into the container on failure rather than leaving it blank (see RISK-04-02).
- [ ] TASK-04-07: Add the eight new English string keys, their Vietnamese counterparts (set to
      `'UNTRANSLATED'` — do not machine-translate; this repository's ASM-004 forbids it), and
      regenerate `app/src/data/strings.baseline.json` with a new `frozenOn` of the current date.
      `STRINGS.zh` requires no manual edit. See ASM-002 for the alternative if a translator has
      already been quoted.
- [ ] TASK-04-08: Update `app/src/data/teach-steps.js`'s module-5 step to scroll to `#gatePanel`
      instead of `#fiveLineBill`, and set its controls to a cell where a gate visibly fails — use
      `{ marketPrice: 1150, strikePrice: 1400 }`, which under S1 gives buyer pass, lender pass,
      investor fail at ratio 1.0, so the presenter can drag the strike to 1,450 and watch the third
      lamp turn.
- [ ] TASK-04-09: Add an end-to-end assertion to `app/e2e/scenarios.spec.js` (or a new
      `app/e2e/gates.spec.js`) that `#gatePanel` renders three lamps on every scenario tab and
      never contains `NaN` or `Infinity`.

**File Changes**

- `app/src/modules/gates.js` (create): constants and `evaluateGates`.
- `app/src/modules/gates.test.js` (create): unit tests.
- `app/scripts/export-sweep.mjs` (modify): import from `../src/modules/gates.js`; delete the local
  gate arithmetic, `LOSS_FACTOR_PRECISE` and `LOSS_FACTOR_KPP_ONLY` local declarations in favour of
  the shared source. Keep `STRIKES`, `RATIOS`, `yearBill`, the lifetime loop, `assertAnchor` and
  `assertNonDegenerate`.
- `app/src/modules/ui.js` (modify): add the `#gatePanel` container to `renderAppShell`'s template
  and export `renderGatePanel`. Leave `renderFiveLineBill`, `renderMultiYearPanel`,
  `renderWalkthroughCases`, `renderFormulas`, `renderSelectedHourDetails`, `updateControlOutputs`,
  `setActiveScenario` and `setActiveCurrency` alone.
- `app/src/modules/ui.test.js` (modify): add cases for `renderGatePanel`.
- `app/src/main.js` (modify): import `evaluateGates` and `renderGatePanel`; call them inside
  `updateView()` after `renderMultiYearPanel`. Change nothing else.
- `app/src/data/strings.js` (modify): eight new keys in `en`, eight `'UNTRANSLATED'` values in `vi`.
- `app/src/data/strings.baseline.json` (modify): regenerated key list, new `frozenOn`.
- `app/src/data/teach-steps.js` (modify): module-5 step's `scrollTo` and `controls`.
- `app/src/style.css` (modify): styles for `.gate-panel` and its lamps, using the existing design
  tokens already defined in `app/src/theme.css`. Do not introduce new colour literals.
- `app/e2e/gates.spec.js` (create): the end-to-end assertion.

**Function Signatures**

- `evaluateGates(input: { strikeVndPerKwh: number, contractedKwhPerMonth: number, referenceLoadKwhPerMonth: number, fmpVndPerKwh: number, lifetimeDppaVnd: number, lifetimeBauVnd: number, dscrTarget?: number, debtShare?: number, investorLcoeVndPerKwh?: number }) -> { buyerPass: boolean, lenderPass: boolean, investorPass: boolean, allPass: boolean, bindingGate: 'buyer' | 'lender' | 'investor' | null, annualContractRevenueVnd: number, annualDebtServiceVnd: number, requiredContractRevenueVnd: number, blendedRevenuePerKwh: number, lenderHeadroomVnd: number, investorHeadroomVndPerKwh: number, buyerHeadroomVnd: number }`
  — evaluates all three gates for one `(strike, contracted volume)` combination.
  `bindingGate` is the single gate that fails when exactly one fails, and `null` when zero or more
  than one fail. The three `headroom` values are `actual − required` (negative when the gate fails)
  and exist so the panel can say *how far* from passing, not just pass/fail. Defaults:
  `dscrTarget = 1.2`, `debtShare = 0.75`, `investorLcoeVndPerKwh = 1450`.
- `DSCR_TARGET: number` = `1.2`, `DEBT_SHARE: number` = `0.75`,
  `INVESTOR_LCOE_VND_PER_KWH: number` = `1450` — exported constants in `app/src/modules/gates.js`,
  each carrying a comment naming it illustrative and pointing at item H3 in
  `facilitator/october-run-plan.md`.
- `renderGatePanel(container: HTMLElement | null, gates: ReturnType<typeof evaluateGates>, currency: 'VND' | 'USD') -> void`
  — renders three `compactPill` lamps plus a one-sentence binding-constraint line. Returns nothing;
  returns early when `container` is null, matching the file's existing guard style.

**Test Specs**

- `evaluateGates({ strikeVndPerKwh: 1500, contractedKwhPerMonth: 5000000, referenceLoadKwhPerMonth: 5000000, fmpVndPerKwh: 1150, lifetimeDppaVnd: 1, lifetimeBauVnd: 2 })`
  → `{ buyerPass: true, lenderPass: true, investorPass: true, allPass: true, bindingGate: null }`.
- `evaluateGates({ strikeVndPerKwh: 1550, contractedKwhPerMonth: 4000000, referenceLoadKwhPerMonth: 5000000, fmpVndPerKwh: 1150, lifetimeDppaVnd: 1, lifetimeBauVnd: 2 })`
  → `lenderPass: false`, `investorPass: true`, `buyerPass: true`, `bindingGate: 'lender'`.
  (`annualContractRevenueVnd = 4,000,000 × 12 × 1,550 = 74,400,000,000`;
  `requiredContractRevenueVnd = 1.2 × 5,000,000 × 12 × 1,450 × 0.75 = 78,300,000,000`.)
- `evaluateGates({ strikeVndPerKwh: 1400, contractedKwhPerMonth: 5000000, referenceLoadKwhPerMonth: 5000000, fmpVndPerKwh: 1150, lifetimeDppaVnd: 1, lifetimeBauVnd: 2 })`
  → `investorPass: false`, `bindingGate: 'investor'`, `blendedRevenuePerKwh === 1400`.
- `evaluateGates({ strikeVndPerKwh: 1450, contractedKwhPerMonth: 6000000, referenceLoadKwhPerMonth: 5000000, fmpVndPerKwh: 1150, lifetimeDppaVnd: 2, lifetimeBauVnd: 1 })`
  → `buyerPass: false`, `bindingGate: 'buyer'`, and `blendedRevenuePerKwh === 1450` exactly
  (contracted exceeds generation, so all generation settles at strike and no spot term appears).
- `evaluateGates({ ..., contractedKwhPerMonth: 0, ... })` → `annualContractRevenueVnd === 0`,
  `lenderPass: false`, `blendedRevenuePerKwh === 1150` (all generation at spot), no `NaN` in any
  returned field.
- `evaluateGates({ ..., referenceLoadKwhPerMonth: 0, ... })` → `blendedRevenuePerKwh === 0` (guard
  the division), no `NaN`, no thrown exception.
- Two gates failing simultaneously (`strikeVndPerKwh: 1100, contractedKwhPerMonth: 3500000`) →
  `bindingGate: null`, `lenderPass: false`, `investorPass: false`.
- `renderGatePanel(container, gatesWithAllPassing, 'VND')` → `container.innerHTML` contains three
  elements matching `.pill`, contains no `NaN`, and contains no `undefined`.
- `renderGatePanel(null, anyGates, 'VND')` → does not throw.
- `renderGatePanel(container, gatesWithLenderFailing, 'USD')` → the headroom figure renders in USD
  (divided by 26,500) and carries the `USD` suffix.
- After TASK-04-02, `cd app && node scripts/export-sweep.mjs` → `assets/teaching/gate-sweep.json`
  is byte-identical to the PHASE-02 output (`git diff --exit-code assets/teaching/gate-sweep.json`
  is silent).

**Dependencies**

- PHASE-02 must be complete and committed — `gates.js` implements the model PHASE-02 defined, and
  TASK-04-03's byte-identity check is meaningless otherwise.

**Exit Criteria**

- [ ] `cd app && npx vitest run src/modules/gates.test.js` passes.
- [ ] `cd app && node scripts/export-sweep.mjs && cd .. && git diff --exit-code assets/teaching/gate-sweep.json`
      exits 0 (extraction changed no output).
- [ ] `cd app && npm run i18n:check` prints `I18N-CHECK PASS (159 keys, frozen <new date>)`.
- [ ] `cd app && npm run coverage` passes; the global lines figure is at or above 49 and the
      `src/modules/settlement.js` per-file gate still passes.
- [ ] `cd app && npx playwright test e2e/gates.spec.js --workers=1` passes on all three projects.
- [ ] `cd app && npm run predeploy` completes without error.
- [ ] Manual: open `http://localhost:5173/?teach=1`, advance to step 5, drag the strike slider from
      1,400 to 1,450, and observe the investor lamp change from failing to passing.

**Phase Risks**

- **RISK-04-01:** Adding roughly 120 lines to `app/src/modules/ui.js` (currently 67.27% statement
  coverage) against a global lines ratchet with 0.85 percentage points of margin can turn
  `npm run coverage` red. Mitigation: write `gates.js` (pure, fully testable) before touching
  `ui.js`, and add the `renderGatePanel` cases to `ui.test.js` in the same commit as the renderer.
  If the gate still fails, raise the thresholds only after the coverage run reports a genuinely
  higher measured value, and never lower them.
- **RISK-04-02:** `updateView()` in `app/src/main.js` wraps five renderers in `try`/`catch` that
  log to the console and continue, leaving a blank element on the projector with no explanation.
  Only `#cancellationFlow` has a visible fallback. Give `#gatePanel` a visible fallback from the
  start rather than inheriting the pattern.
- **RISK-04-03:** Re-freezing `app/src/data/strings.baseline.json` changes the translator's quoted
  scope from 151 to 159 keys. Do this in one commit alongside every other key addition planned for
  this cycle, so the surface freezes once. See ASM-002 and ASM-005.

---

### PHASE-05 - Figure Parity and Guards That Can Still Go Red

**Goal**

Close the last artifact class with no parity gate — numbers rendered into PNG pixels — and stop the
two newest guards from decaying into signals nobody reads.

**Tasks**

- [ ] TASK-05-01: Extend `build_teaching_visuals.py` to write
      `assets/teaching/figures-manifest.json` at the end of `main()`, recording the SHA-256 of every
      input JSON it read, the SHA-256 of the builder script itself, and for each rendered figure its
      filename, language, the input files it depended on, and the literal number strings it rendered
      into the image.
- [ ] TASK-05-02: Create `tools/check_figures_manifest.py`. It recomputes the input and builder
      digests and compares them against the manifest; asserts every listed figure file exists; and
      asserts no rendered number string appears in `tools/retired_figures.json`'s `retired` list.
      That last check is the point of the whole phase: it makes pixel-embedded numbers visible to
      the retired-figure guard for the first time.
- [ ] TASK-05-03: Create `tools/tests/test_check_figures_manifest.py`.
- [ ] TASK-05-04: Add the visuals build and the manifest check to the `deck-build` job in
      `.github/workflows/ci.yml`. `matplotlib`, `numpy` and `Pillow` are already installed there by
      `pip install -r requirements.txt`, so this costs no new dependency.
- [ ] TASK-05-05: Give `tools/check_delivery_pipeline.py` a notion of deployable content. It
      currently reports `STALLED` when any commit sits undeployed — including documentation-only
      commits — which on 2026-09-05 made it report a stall for two `.md`-only commits. Count
      undeployed commits that touch a configured deployable path set (default: `app/`), and report
      documentation-only commits separately as informational without failing.
- [ ] TASK-05-06: Give `tools/check_plan_status.py` a successor requirement. A plan closed with a
      `status` beginning `superseded` or `abandoned` must name at least one successor plan file that
      exists in `plans/`, or the check fails. Both closures on 2026-08-29 explicitly stated that
      35+ named tasks became untracked, and the check passed.
- [ ] TASK-05-07: Add `sys.stdout.reconfigure(encoding='utf-8', errors='replace')` to every
      `tools/*.py` and root `*.py` entry point that prints non-ASCII, and pass
      `encoding='utf-8'` to every `open()` and `json.load()` of a repository file. Both failures
      were reproduced on 2026-09-05: `verify_deck_numbers.py` prints a mojibake character in its
      success banner, and reading
      `tools/retired_figures.json` without an explicit encoding raises `UnicodeEncodeError` on
      Vietnamese content under a Windows cp1252 console.
- [ ] TASK-05-08: Update `.github/workflows/freshness-checks.yml`'s `human-blocked-register` step
      to pass `--acknowledged-through` with a date the author maintains, so a known, accepted slip
      prints `ACKNOWLEDGED` and the next *new* slip is still loud. The flag already exists and is
      not currently passed.

**File Changes**

- `build_teaching_visuals.py` (modify): add `sha256_of(path)`, collect a `figures` list as each
  `render_*` function returns its path, and write the manifest at the end of `main()`. Leave every
  `render_*` function's drawing code alone except for returning the rendered number strings.
- `assets/teaching/figures-manifest.json` (create — generated).
- `tools/check_figures_manifest.py` (create).
- `tools/tests/test_check_figures_manifest.py` (create).
- `tools/check_delivery_pipeline.py` (modify): add deployable-path filtering.
- `tools/tests/test_check_delivery_pipeline.py` (modify): add cases for the new filtering.
- `tools/check_plan_status.py` (modify): add the successor requirement.
- `tools/tests/test_check_plan_status.py` (modify): add cases for the new rule.
- `verify_deck_numbers.py`, `audit_teaching_deck.py`, `tools/check_retired_figures.py`,
  `tools/verify_prose_figures.py`, `tools/check_terminology_numbers.py`,
  `tools/check_deploy_freshness.py`, `tools/pipeline.py` (modify): stdout reconfiguration and
  explicit `encoding='utf-8'` on file reads.
- `.github/workflows/ci.yml` (modify): add two steps to the `deck-build` job.
- `.github/workflows/freshness-checks.yml` (modify): add `--acknowledged-through` to the
  `human-blocked-register` step.

**Function Signatures**

- `sha256_of(path: str) -> str` (in `build_teaching_visuals.py`) — lowercase hexadecimal SHA-256 of
  the file's bytes.
- `build_manifest(figures: list[dict], inputs: list[str], builder_path: str) -> dict` (in
  `build_teaching_visuals.py`) — returns the manifest structure:
  `{"generatedBy": str, "builderSha256": str, "inputs": {path: sha256}, "figures": {filename: {"lang": str, "inputs": [str], "renderedNumbers": [str]}}}`.
- `check_manifest(repo_root: Path, manifest: dict, retired: list[str]) -> list[str]` (in
  `tools/check_figures_manifest.py`) — returns a list of human-readable violation strings; empty
  means pass. Violations: an input file whose current digest differs from the recorded one; a
  builder digest mismatch; a listed figure file that does not exist; a rendered number string that
  appears in the retired list.
- `deployable_commits(since_ref: str, paths: list[str]) -> list[str]` (in
  `tools/check_delivery_pipeline.py`) — commit hashes between `since_ref` and `HEAD` that touch at
  least one of `paths`.

**Test Specs**

- `check_manifest` with a manifest whose `inputs` digests match the on-disk files and whose figures
  all exist → `[]`.
- `check_manifest` with a manifest recording `gate-sweep.json` at a stale digest → exactly one
  violation whose text contains `gate-sweep.json` and the word `digest`.
- `check_manifest` with a manifest listing `m5-gate-heatmap-en.png` that has been deleted from disk
  → exactly one violation naming that filename.
- `check_manifest` with `renderedNumbers: ["15 / 70"]` and a retired list containing `"15 / 70"` →
  exactly one violation naming both.
- `check_manifest` with `renderedNumbers: ["8 / 70"]` and the same retired list → `[]`.
- `deployable_commits` where the only commits since the live marker touch `NOTES.md` and
  `reports/x.html` with a `paths` of `["app/"]` → `[]`, and the checker exits 0 while printing an
  informational line naming two documentation-only commits.
- `deployable_commits` where one commit touches `app/src/modules/ui.js` → that commit hash is
  returned, and with `--max-age-days 3` and an age of 5 days the checker exits 1.
- `check_plan_status` on a plan whose `status` is `"abandoned — ..."` and whose text names no file
  matching `plans/*.md` → one violation.
- `check_plan_status` on a plan whose `status` is `"superseded — ... in favor of plans/2026-08-22-delivery-stall-recovery-plan.md"`
  where that file exists → no violation.
- `check_plan_status` on a plan whose `status` is `"complete"` → unchanged behaviour (the existing
  unticked-task rule still applies).
- Encoding: `PYTHONPATH= py verify_deck_numbers.py --lang en` on a Windows console → the success
  banner renders its non-ASCII character correctly, with no `?` substitution and no
  `UnicodeEncodeError`.

**Dependencies**

- PHASE-02 must be complete, so the manifest records the post-fix figures rather than figures that
  are about to be regenerated.

**Exit Criteria**

- [ ] `PYTHONPATH= py build_teaching_visuals.py --lang en` writes
      `assets/teaching/figures-manifest.json`.
- [ ] `PYTHONPATH= py tools/check_figures_manifest.py` prints a `PASS` line naming the number of
      figures checked.
- [ ] Deliberate-failure check: `py -c "import json,pathlib;p=pathlib.Path('assets/teaching/gate-sweep.json');d=json.loads(p.read_text());d['cellCount']=71;p.write_text(json.dumps(d,indent=2))"`
      then `PYTHONPATH= py tools/check_figures_manifest.py` → exits **1** naming a digest mismatch.
      Restore with `cd app && node scripts/export-sweep.mjs`. This proves the guard can go red.
- [ ] `PYTHONPATH= py tools/check_delivery_pipeline.py` on the current tree → exits 0 and does
      **not** print `STALLED` for documentation-only commits.
- [ ] `py -m pytest tools/tests` passes with at least 12 more tests than before.
- [ ] `git diff .github/workflows/ci.yml` shows the two new `deck-build` steps.

**Phase Risks**

- **RISK-05-01:** Collecting `renderedNumbers` requires each `render_*` function to report the
  strings it drew. Do not attempt to infer them by re-reading the JSON — the whole point is to
  capture what was *rendered*, which is a formatted string (`f"{pass_count} / {cell_count}"`,
  `f"{v:,} tr VND"`), not the raw value. Have each `render_*` function return
  `(path, [rendered strings])` and adjust `main()` accordingly.
- **RISK-05-02:** `build_teaching_visuals.py` formats numbers with `f"{s:,}"` and
  `f"{round(r * 100)}%"` regardless of `--lang`, so the Vietnamese heatmap axis labels are
  comma-grouped where Vietnamese convention requires periods. This is a real localization defect
  but fixing it changes every `-vi` figure and therefore the vi deck. **Do not fix it in this
  phase.** Record it in the manifest work as a comment and raise it as a separate item after the
  content freeze.
- **RISK-05-03:** Making `check_plan_status.py` stricter will fail on the two plans closed on
  2026-08-29 unless PHASE-06's TASK-06-06 lands first, or unless those two `status` fields are
  edited to name the successor plan this document represents. Sequence TASK-05-06 after
  TASK-06-06, or edit the two status fields in the same commit.

---

### PHASE-06 - Presenter Drill, Venue Hardening, and Tracking Repair

**Goal**

Give the mission statement its first instrument, remove the two service-worker behaviours that fail
under the venue network conditions the whole offline apparatus exists for, and repair the hand-off
between the coding track and the presenter's run-of-show.

**Tasks**

- [ ] TASK-06-01: Add a `?drill=1` presenter drill mode in a new `app/src/modules/drill.js`,
      initialised from `app/src/main.js` alongside `initTeachMode()` and `initTour()`. It must be
      inert without the flag, exactly as teach mode is.
- [ ] TASK-06-02: The drill hides `#fiveLineBill`, presents five numeric inputs labelled for the
      five bill lines (market energy, system service, differential clearing, additional retail
      purchase, contract-for-difference settlement), grades the entry against `buildFiveLineBill`
      with a ±0.5% tolerance per line, shows which lines were wrong and by how much, and times the
      attempt from first keystroke to submission.
- [ ] TASK-06-03: Persist a per-scenario best time and a current streak in `localStorage` under the
      key `dppa-drill`, wrapped in `try`/`catch` — `app/src/modules/i18n.js` already demonstrates
      the pattern for storage being unavailable in private browsing.
- [ ] TASK-06-04: Implement the drill's labels as English literals at their call sites, not through
      the string table (ASM-005). Add a comment naming ASM-005 so the next reader does not "fix" it.
- [ ] TASK-06-05: Bake the service-worker cache version at build time. `app/vite.config.js` already
      computes the build commit for `sw-manifest.json`; extend `swManifestPlugin` (or add a sibling
      plugin) to replace a `__SW_VERSION__` token in `app/public/sw.js` during the build, and change
      `sw.js` to use that constant instead of the module-scope `let CACHE_NAME` that is written only
      inside the `install` handler. A terminated-and-restarted worker currently reverts to
      `'dppa-app-unknown'` and writes runtime cache entries into an orphan cache.
- [ ] TASK-06-06: Add a timeout race to the navigation branch of `app/public/sw.js`'s fetch handler:
      `Promise.race` between the network fetch and a 2,000 ms timer, falling back to the cached
      response. The current network-first branch has no timeout, so a slow-but-alive venue network
      blocks first paint until the browser's own timeout even though a valid cached copy exists.
      Keep the existing `response.ok` guard on both cache-write paths.
- [ ] TASK-06-07: Repair `facilitator/october-run-plan.md`. Its header names
      `plans/2026-october-readiness-checklist.md` as "the coding-session half" and three later
      sections defer to it; that file was closed with status `abandoned` on 2026-08-29. Repoint
      every reference at this plan file, and add a "Presenter self-drill" line to the mid-September
      section pointing at `https://dppa-case.web.app/?drill=1`.
- [ ] TASK-06-08: Add a `## 2026-09-XX` entry to `learning-records/` (next sequential number,
      `0006-`) narrating the gate-degeneracy finding and the shift from verifying provenance to
      verifying that a computation carries information.
- [ ] TASK-06-09: Fix `"main": "build-deck.js"` in the root `package.json` — it names a file that
      has been in `archive/` since July. Change it to remove the `main` field entirely; the root
      `package.json` has no live scripts and exists only because the archived builder depended on
      `pptxgenjs`.

**File Changes**

- `app/src/modules/drill.js` (create): the drill mode.
- `app/src/modules/drill.test.js` (create): grading and tolerance tests.
- `app/src/main.js` (modify): import and call `initDrillMode()` after `initTeachMode()`. Add
  `'drill'` to the `NON_STATE_PARAM_KEYS` array so `syncUrlFromState` does not strip the flag —
  this is the exact defect the existing comment on that array documents having already happened
  once with `?teach=1`.
- `app/src/style.css` (modify): styles for the drill overlay, using existing tokens.
- `app/public/sw.js` (modify): `__SW_VERSION__` constant; navigation timeout race. Leave the
  `STATIC_URLS` list, `loadManifest`, `precache`, `cleanupOldCaches` and the non-navigation branch
  alone except for the cache-name source.
- `app/vite.config.js` (modify): extend the build plugin to substitute `__SW_VERSION__`.
- `app/e2e/offline.spec.js` (modify): add an assertion that the built `dist/sw.js` contains the
  build commit and not the literal `__SW_VERSION__`.
- `facilitator/october-run-plan.md` (modify): repoint four dead cross-references; add the drill line.
- `learning-records/0006-gate-model-degeneracy-and-information-bearing-guards.md` (create).
- `package.json` (repository root, modify): remove the `main` field.

**Function Signatures**

- `initDrillMode(search?: string) -> void` — returns immediately unless the `drill` query parameter
  equals `'1'`; otherwise builds the drill overlay and attaches its handlers.
- `gradeBillEntry(entered: { marketEnergy: number, systemService: number, diffClearing: number, additionalPurchase: number, cfd: number }, expected: ReturnType<typeof buildFiveLineBill>, tolerance?: number) -> { lines: Record<string, { entered: number, expected: number, correct: boolean, deltaVnd: number }>, correctCount: number, allCorrect: boolean }`
  — grades five entered VND values against the computed bill. `tolerance` defaults to `0.005`
  (0.5%, relative). A line with an expected value of exactly `0` is correct only when the entered
  value is exactly `0`.
- `formatDrillDuration(ms: number) -> string` — `mm:ss` for durations under an hour.

**Test Specs**

- `gradeBillEntry` with all five values exactly equal to the S1 bill
  (`marketEnergy: 5945814600`-class figures taken from `buildFiveLineBill` at runtime, not
  hardcoded) → `allCorrect: true`, `correctCount: 5`, every `deltaVnd` is `0`.
- `gradeBillEntry` with `marketEnergy` 0.4% high and the rest exact → `allCorrect: true` (inside the
  0.5% tolerance), `correctCount: 5`.
- `gradeBillEntry` with `marketEnergy` 0.6% high and the rest exact → `allCorrect: false`,
  `correctCount: 4`, `lines.marketEnergy.correct === false`, `deltaVnd` positive.
- `gradeBillEntry` on the S1 scenario where `additionalPurchase` is exactly `0` and the presenter
  enters `1` → `lines.additionalPurchase.correct === false` (the zero line takes no tolerance).
- `gradeBillEntry` on a scenario where `cfd` is negative and the presenter enters the correct
  negative value → `correct: true` (the relative tolerance must use absolute values).
- `formatDrillDuration(65000)` → `'01:05'`. `formatDrillDuration(3599000)` → `'59:59'`.
- `initDrillMode('?teach=1')` → the drill overlay is not created (only `?drill=1` activates it).
- `initDrillMode('?drill=1')` → an element with id `drillOverlay` exists in the document.
- Service worker, built output: `dist/sw.js` contains a 40-character hexadecimal commit string and
  does not contain the literal `__SW_VERSION__` or the literal `dppa-app-unknown`.
- Service worker, navigation timeout: with the network stubbed to hang, a navigation request
  resolves from cache in under 3,000 ms rather than hanging.
- URL flag survival: load `?drill=1`, move any slider, and read `window.location.search` → it still
  contains `drill=1` (this is the `NON_STATE_PARAM_KEYS` regression the existing code comment
  warns about).

**Dependencies**

- PHASE-04 must be complete if the drill is to include a gate question; the five-line-bill drill
  itself depends only on `app/src/modules/settlement.js`, which is already stable and 92% covered.

**Exit Criteria**

- [ ] `cd app && npx vitest run src/modules/drill.test.js` passes.
- [ ] `cd app && npm run build && grep -c '__SW_VERSION__' dist/sw.js` prints `0`.
- [ ] `cd app && npx playwright test e2e/offline.spec.js --workers=1` passes on all three projects.
- [ ] `grep -c '2026-october-readiness-checklist' facilitator/october-run-plan.md` prints `0`.
- [ ] `PYTHONPATH= py tools/check_human_blocked_register.py` still parses the register table
      successfully (the repair must not break the table this checker reads).
- [ ] `cd app && npm run predeploy` completes without error.
- [ ] Manual: load `http://localhost:5173/?drill=1`, complete one drill on the S1 Matched scenario,
      and confirm the grading, the timer and the persisted best time across a page reload.

**Phase Risks**

- **RISK-06-01:** `tools/check_human_blocked_register.py` parses the exact markdown table in
  `facilitator/october-run-plan.md` every Monday. Editing that file's prose is safe; editing the
  table's column structure breaks the checker. Run the checker immediately after TASK-06-07.
- **RISK-06-02:** Adding a 2,000 ms navigation timeout means a genuinely slow but working network
  serves a *stale* cached shell instead of the fresh one. That is the correct trade for a live
  session, but it also means a redeploy may not be picked up on the first load at the venue.
  Mitigate by documenting in `app/deployment.md` that the presenter should load the app once on a
  good network before the session — which the run plan's venue offline drill already instructs.
- **RISK-06-03:** The drill adds source lines to a coverage-measured directory. Write
  `gradeBillEntry` and `formatDrillDuration` as pure exported functions with the DOM wiring kept
  thin, so the testable share is high and the ratchet in CON-001 is not endangered.

## Gotchas

- **The two language-suffix conventions.** `assets/teaching/` uses `-en` / `-vi` / `-zh`. The
  contract-for-difference animations directly under `assets/` use `-en` / `-vi` / `-zh-cn`. A
  single `f"-{lang}"` substitution across `build_oct_teaching_deck.py` will appear to work and will
  silently break the two `cfd-s1-*` references.
- **`assets/teaching/fallback/teach-m{1..6}.mp4`** carry no language suffix at all and must not
  gain one. They are recordings of the English application, used as presenter fallback when the
  live app fails.
- **Do not add a bare `15` or a bare `21` to `tools/retired_figures.json`.** Under the new model
  `15` becomes the investor pass count and both are common two-digit tokens; the guard does a plain
  substring match across 37 prose files and would fire constantly. Retire the *phrase* forms listed
  in `## Specification` S3.
- **`buyer 62` is not retired.** The buyer gate is unchanged and its count stays 62. Only the
  lender count (28 → 36), the investor count (21 → 15) and the combined headline (15 → 8) move.
- **`15` changes meaning rather than disappearing.** It was the all-three-gates count and becomes
  the investor-only count. Any prose that says "15" must be read, not pattern-replaced.
- **Adding a key to `STRINGS.en` fails CI unless `strings.baseline.json` is updated in the same
  commit**, and `STRINGS.vi` must carry exactly the English key set. `STRINGS.zh` is generated by a
  loop at the bottom of `app/src/data/strings.js` and needs no manual edit.
- **String values are HTML fragments, not plain text.** `crossover_gt_prefix` is literally `'&gt;'`
  in all three languages and `control_hints` contains `'&amp;'`. Adding runtime escaping would
  render those as visible `&gt;` and `&amp;` on screen. Validate instead of escaping (DEC-003).
- **`teach.js` sets `.teach-expected` with `textContent`, not `innerHTML`.** Placeholder
  substitution there is safe; the same substitution inside `ui.js` would not be.
- **`app/src/data/spine-figures.js` is generated but lives in a Prettier-checked, ESLint-linted,
  coverage-measured directory.** Emit it already formatted to the repository's style, or
  `npx prettier --check src` fails in CI.
- **The multi-year projection and the gate sweep use different periods.** `projectMultiYear`
  multiplies a representative *day* by 365; the gate sweep multiplies a *month* by 12. Both are
  correct in their own context. Never move a figure between them without converting.
- **`assets/teaching/*.json` is in the retired-figure scan list but `tools/retired_figures.json`
  itself is not**, which is why its own `replacedBy` fields can safely contain retired strings.
- **`npm run e2e` fails with `http://localhost:4173 is already used` if a preview or dev server
  from a prior session is still listening.** `playwright.config.js` sets `reuseExistingServer:
  false` deliberately, so that a stale `dist/` build can never mask fresh source edits. Kill the
  leftover process rather than changing the config.
- **Every command in this plan that runs Python is written for Windows** (`PYTHONPATH= py`). On
  Linux or in CI, drop the prefix and use `python`.
- **Commit the rebuilt `ceba/DPPA Presentation Oct 2026 To Teach.pptx` once per phase, not once per
  pipeline run.** It is 14.9 MB and `.git` is already 153 MB.

## Verification Strategy

- **TEST-001:** `cd app && npm test` → all unit tests pass; the count is higher than the 104 tests
  passing on 2026-09-05.
- **TEST-002:** `cd app && npm run coverage` → exits 0; global lines at or above 49, branches at or
  above 49, functions at or above 51, statements at or above 49; the `src/modules/settlement.js`
  per-file gate (92 / 75 / 85 / 91) still passes.
- **TEST-003:** `cd app && npm run lint && npx prettier --check src e2e scripts *.config.js` → both
  exit 0.
- **TEST-004:** `cd app && npm run i18n:check` → prints `I18N-CHECK PASS` with the key count and
  freeze date current as of PHASE-04.
- **TEST-005:** `cd app && npm run e2e` → all functional specs pass on `chromium-desktop`,
  `webkit-mobile` and `chromium-tablet`. On Windows, run
  `cd app && npx playwright test --grep-invert @visual --workers=1` instead.
- **TEST-006:** `cd app && node scripts/export-spine.mjs && node scripts/export-sweep.mjs && cd .. && git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json assets/teaching/gate-sweep.json`
  → exits 0, meaning the committed exports match what the engine produces.
- **TEST-007:** `py -c "import json;d=json.load(open('assets/teaching/gate-sweep.json'));print(d['passCount'],d['buyerPassCount'],d['lenderPassCount'],d['investorPassCount'],d['cellCount'])"`
  → prints `8 62 36 15 70`.
- **TEST-008:** Non-degeneracy, run against the committed sweep:
  ```bash
  py -c "
  import json
  d=json.load(open('assets/teaching/gate-sweep.json')); c=d['cells']
  gates=['buyerPass','lenderPass','investorPass']
  for g in gates:
      varies=any(len({x[g] for x in c if x['strike']==s})>1 for s in d['strikes'])
      sole=sum(1 for x in c if not x[g] and all(x[o] for o in gates if o!=g))
      print(g,'varies_with_ratio=',varies,'sole_blocker_cells=',sole)
  "
  ```
  → three lines, every `varies_with_ratio=True`, and `sole_blocker_cells` of 6 (buyer), 1 (lender),
  20 (investor). Any zero means the model is degenerate again.
- **TEST-009:** `PYTHONPATH= py audit_teaching_deck.py` → `PASS: word budget and symbol-deferral checks clean.`
- **TEST-010:** `PYTHONPATH= py verify_deck_numbers.py --lang en` → `PARITY PASS` with at least 11
  figures reconciled.
- **TEST-011:** `PYTHONPATH= py tools/check_retired_figures.py` → `RETIRED-FIGURES PASS`.
- **TEST-012:** `PYTHONPATH= py tools/verify_prose_figures.py` → `PROSE-FIGURES PASS`.
- **TEST-013:** `PYTHONPATH= py tools/check_terminology_numbers.py` → `TERMINOLOGY-NUMBERS PASS`.
- **TEST-014:** `PYTHONPATH= py tools/check_plan_status.py` → `PLAN-STATUS PASS`.
- **TEST-015:** `PYTHONPATH= py tools/check_figures_manifest.py` → a `PASS` line naming the number
  of figures checked.
- **TEST-016:** `py -m pytest tools/tests` → all pass; the count is higher than the 104 tests
  passing on 2026-09-05.
- **TEST-017:** `PYTHONPATH= py build_oct_teaching_deck.py --lang en --out /tmp/deck-check && PYTHONPATH= py tools/compare_deck.py "/tmp/deck-check/DPPA Presentation Oct 2026 To Teach.pptx" "ceba/DPPA Presentation Oct 2026 To Teach.pptx"`
  → reports no differences (the committed deck matches its builder).
- **TEST-018:** `grep -c '\-en\.\(png\|gif\|mp4\)' build_oct_teaching_deck.py` → `0`.
- **TEST-019:** `cd app && npm run build && grep -c '__SW_VERSION__' dist/sw.js` → `0`.
- **TEST-020:** Guard-can-fail proof for PHASE-05. Corrupt an input, confirm the guard exits 1,
  restore:
  ```bash
  py -c "import json,pathlib;p=pathlib.Path('assets/teaching/gate-sweep.json');d=json.loads(p.read_text());d['cellCount']=71;p.write_text(json.dumps(d,indent=2))"
  PYTHONPATH= py tools/check_figures_manifest.py; echo "exit=$?"   # expect exit=1
  cd app && node scripts/export-sweep.mjs && cd ..
  PYTHONPATH= py tools/check_figures_manifest.py; echo "exit=$?"   # expect exit=0
  ```
- **TEST-021:** `cd app && npm run predeploy` → completes without error. This is the closest local
  equivalent to the `quality` CI job; it differs only in not installing browsers and not running
  the non-blocking visual pass.
- **MANUAL-001:** Open the regenerated `assets/teaching/m5-gate-heatmap-en.png` and confirm the
  feasible region reads as a legible band rather than scattered cells. A correct model that
  produces an illegible slide is a failed phase.
- **MANUAL-002:** Open `ceba/DPPA Presentation Oct 2026 To Teach.pptx` in real PowerPoint after
  PHASE-02 and confirm slide M5 shows the new heatmap and the new pass count, and that the six
  hidden MP4 fallback slides still play.
- **MANUAL-003:** `cd app && npm run dev`, open `http://localhost:5173/?teach=1`, advance to step 5,
  and drag the strike slider from 1,400 to 1,450. The investor lamp must change from failing to
  passing while the other two stay put.
- **MANUAL-004:** `cd app && npm run dev`, open `http://localhost:5173/?drill=1`, complete one
  drill, reload, and confirm the persisted best time survives.
- **MANUAL-005:** Switch the application to Vietnamese and confirm the teach-mode expected line
  renders `11.020` (period-grouped) rather than `11,020`.
- **MANUAL-006:** After PHASE-06, load the deployed app once on a good network, enable airplane
  mode, and reload. The application must render the five-line bill within a few seconds rather
  than hanging.
- **OBS-001:** After deploying, run `PYTHONPATH= py tools/check_deploy_freshness.py --write-log` and
  confirm it reports the live build marker matching `git rev-parse HEAD`, then commit the updated
  log. Deployment requires Firebase credentials on the machine; the command is
  `cd app && npm run deploy`.
- **OBS-002:** After PHASE-05, confirm the next scheduled `freshness-checks` run reports
  `check_delivery_pipeline.py` as passing on a documentation-only commit and
  `check_human_blocked_register.py` printing `ACKNOWLEDGED` rather than failing for the already-known
  H1/H6 slips.

## Risks and Alternatives

- **RISK-001:** The content freeze is 2026-09-15 (ASM-001) and PHASE-02 changes taught content —
  the M5 headline, the panel guide's claim about which gate is hardest, and two lesson handouts.
  If PHASE-02 lands after the freeze it invalidates the fresh-viewer test that the freeze gates on.
  Mitigation: PHASE-01 through PHASE-04 are all pre-freeze; PHASE-05 and PHASE-06 change no taught
  content and can land after.
- **RISK-002:** The coverage ratchet has 0.85 percentage points of margin and three of six phases
  add source lines. Mitigation: every phase specifies its tests alongside its code, the pure
  functions (`evaluateGates`, `gradeBillEntry`, `formatDrillDuration`, the strings validator) are
  written before their DOM wiring, and `npm run coverage` is an exit criterion for every phase that
  touches `app/src/`.
- **RISK-003:** The `e2e:visual` pixel suite has zero committed baselines on any platform and
  carries `continue-on-error: true` in CI, so none of the visual changes in PHASE-02 (heatmap) or
  PHASE-04 (gate panel) can be caught by a regression gate. This is item H6 in
  `facilitator/october-run-plan.md`, is 21 days overdue, and requires a human to trigger the
  `visual-bootstrap` `workflow_dispatch` job and commit the resulting `*-linux.png` artifacts.
  Mitigation within this plan: MANUAL-001 and MANUAL-003 are mandatory manual visual checks.
- **RISK-004:** PHASE-02's regeneration touches a 14.9 MB binary deck in a repository whose `.git`
  is already 153 MB and growing roughly 16 MB per fortnight. Two more language builds are coming.
  Mitigation within this plan: commit the deck once per phase. Beyond this plan: decide between
  milestone-only deck commits and Git LFS before the vi/zh builds land.
- **RISK-005:** Four items in the human-blocked register (H1 date/venue, H2 translator, H3 gate
  recalibration, H6 visual baselines) are overdue and no phase of this plan can clear them. This
  plan makes the translator's delivery *safe to integrate* (PHASE-01, PHASE-03) and makes the gate
  model *defensible without* real deal data (PHASE-02); it does not produce either input.
- **ALT-001:** *Delete the lender gate rather than fix it.* Since it binds nowhere, removing it
  would make the analysis honest at zero cost and the headline would not move. Rejected: the deck's
  entire Module 5 framing is "three doors, three parties", the facilitator guide and the panel
  guide both anchor on debt-service coverage, and a lender in the audience is exactly who Module 5
  is for. A two-gate model would be honest and useless.
- **ALT-002:** *Wait for H3's real Allotrope deal data before changing the model.* Rejected per
  ASM-004: H3 is overdue with no owner action, the session is 26 days out, and a degenerate model
  in front of a financier is worse than a clearly-labelled illustrative one. Real constants can
  replace `DSCR_TARGET`, `DEBT_SHARE` and `INVESTOR_LCOE_VND_PER_KWH` later in a three-line change
  plus one regeneration.
- **ALT-003:** *Escape strings at the interpolation sites in `ui.js` rather than validating the
  table.* Rejected per DEC-003: the table deliberately contains `&gt;` and `&amp;` entities, which
  runtime escaping would render as visible garbage. Validation catches the translator's likely
  mistake without changing any rendering behaviour.
- **ALT-004:** *Hash the rendered PNGs to detect figure drift.* Rejected per ASM-006: matplotlib
  output is not byte-stable across platforms and font sets, so the guard would fail for reasons
  unrelated to correctness — the exact failure mode this repository has already hit twice (WebKit
  pixel instability, the `UNKNOWN → exit 0` deploy-freshness path). An input-digest manifest is
  deterministic everywhere.
- **ALT-005:** *Add the presenter drill as a separate static HTML handout rather than an app mode.*
  Rejected: the application already owns the settlement engine, the offline service worker, the
  scenario definitions and the localisation, and the presenter will have the app on the laptop they
  carry. A separate handout would duplicate the engine — the precise coupling failure this
  repository's whole export pipeline exists to prevent.

## Suggested Next Step

Execute PHASE-01. It is the smallest phase, has no dependencies, is the only phase whose value
evaporates if the translator delivers first, and its exit criteria (`grep` returns 0 hardcoded
`-en` paths; the English deck still compares clean; the Vietnamese build still refuses on
`UNTRANSLATED`) are verifiable in a single command each. Then execute PHASE-02, whose regeneration
run will exercise PHASE-01's new asset resolution as a side effect. PHASE-03 has no dependencies and
may be run in parallel with either.
