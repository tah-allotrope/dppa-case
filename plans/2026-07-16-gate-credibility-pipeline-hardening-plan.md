---
title: "Gate Credibility & Pipeline Hardening"
date: "2026-07-16"
status: "draft"
request: "Multi-phase implementation plan from research/2026-07-16-post-hardening-next-level-brainstorm.md: make the M5 gate sweep defensible before content freeze, declare the Python toolchain, close generator↔artifact drift in CI, strengthen the deck verifiers, reorganize the root scripts, then complete localization and app evolution."
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-16-post-hardening-next-level-brainstorm.md"
  - "research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md"
  - "plans/2026-october-readiness-checklist.md"
---

# Plan: Gate Credibility & Pipeline Hardening

## Objective

The October 2026 DPPA teaching deck states, as a computed fact to a room of factory CFOs and
lenders, that "5 of 56" strike×volume combinations clear all three gates. That number is real
output from the settlement engine, but it rests on two invented developer-economics constants and
on a strike grid that stops exactly at one of them — making the headline an artifact of grid
choice rather than a finding. This plan makes the M5 claim defensible **before English content
freeze**, then hardens the pipeline that produces every deck artifact (declared Python
dependencies, rebuild-and-diff in CI, verifiers that can actually fail), and finally completes
localization and the remaining app work.

## Context Snapshot

- **Current state:** The number pipeline is sound — `build_oct_teaching_deck.py` and
  `build_teaching_visuals.py` both read `assets/teaching/spine-s1.json` and
  `assets/teaching/gate-sweep.json`; no VND figures are hand-typed in either. CI has an
  `app-quality` job and a `deck-parity` job that regenerates the two JSON exports and
  `git diff --exit-code`s them. But: the sweep's lender/investor thresholds are illustrative
  placeholders; the strike grid's maximum equals the investor threshold; "56" is a hardcoded
  literal in 14 places across 3 languages while `passCount` is dynamic; there is no
  `requirements.txt`; CI installs only `python-pptx`, so no generator ever runs in CI; the deck
  builder hardcodes `-en` in all 14 asset paths so `--lang vi` would emit an English-visual deck;
  and `verify_deck_numbers.py` is a set-membership check that cannot detect a figure on the wrong
  slide.
- **Desired state:** The M5 claim is reported as an assumption-driven band with its provenance
  visible on the slide; grid size is derived, never literal; a pinned `requirements.txt` plus a
  `deck-build` CI job proves the committed deck is the output of its generator; the verifiers are
  positional and have tests proving they catch a planted error; living generators live under
  `tools/` behind a README map; the vi/zh decks use vi/zh visuals; and the app speaks the same
  three languages as everything else.
- **Key repo surfaces:** `app/scripts/export-sweep.mjs`, `app/scripts/export-spine.mjs`,
  `app/src/modules/settlement.js`, `app/src/data/default-scenarios.js`,
  `build_oct_teaching_deck.py`, `build_teaching_visuals.py`, `verify_deck_numbers.py`,
  `audit_teaching_deck.py`, `.github/workflows/ci.yml`, `assets/teaching/*.json`,
  `assets/teaching/terminology-map.json`, `app/src/modules/ui.js`, `app/src/modules/teach.js`,
  `app/src/data/teach-steps.js`.
- **Out of scope:** Sourcing real Vietnamese developer LCOE/DSCR figures or a real FMP time series
  (needs Allotrope deal data and a human decision — see ASM-002); obtaining official Decree
  57/2025/ND-CP and Circular 16/2025/TT-BCT source URLs; a PWA/service worker; performing the
  VI/ZH translation itself (a qualified speaker does that — this plan only makes the pipeline
  correct and ready); the human-only items in `plans/2026-october-readiness-checklist.md`
  (PowerPoint autoplay check, dry-run, fresh-viewer test, print test, Firebase deploy).

## Environment & Conventions

- **Stack:** Two toolchains in one repo.
  - **JavaScript (`app/`):** Node 24 (pinned in `.github/workflows/ci.yml`), npm, ES modules
    (`"type": "module"`), Vite 8, Vitest 4, Playwright 1.53, Chart.js 4.5. Vanilla JS — no
    framework, no TypeScript.
  - **Python (repo root):** CPython 3.12 (pinned in CI via `actions/setup-python@v5`).
    Dependencies are currently **undeclared** — PHASE-02 creates `requirements.txt`.
- **Setup:**
  - JS: `cd app && npm install` (use `npm install`, **not** `npm ci` — the lockfile has known
    optional-native-binary drift; `ci.yml:18-22` documents this and deliberately uses
    `npm install`).
  - Python (after PHASE-02): Windows `py -m pip install -r requirements.txt`; Linux/CI
    `python3 -m pip install -r requirements.txt`.
- **Build / Run:**
  - App: `cd app && npm run build` (Vite → `app/dist/`); `npm run dev`; `npm run preview`.
  - Exports: `cd app && node scripts/export-spine.mjs` and `node scripts/export-sweep.mjs` —
    these write to `assets/teaching/spine-s1.json` and `assets/teaching/gate-sweep.json` at the
    **repo root**, not under `app/`.
  - Visuals: `PYTHONPATH= py build_teaching_visuals.py --lang en` (Windows) /
    `PYTHONPATH= python3 build_teaching_visuals.py --lang en` (Linux).
  - Deck: `PYTHONPATH= py build_oct_teaching_deck.py --lang en`.
  - **The `PYTHONPATH= ` prefix is load-bearing on the author's Windows machine** (a stale
    `PYTHONPATH` shadows imports). It is harmless elsewhere. Keep it in documented commands.
- **Test:**
  - Full JS unit suite: `cd app && npm test` (Vitest). Single file:
    `cd app && npx vitest run src/modules/settlement.test.js`.
  - E2E: `cd app && npm run e2e` (Playwright, excludes `@visual`). Visual:
    `cd app && npm run e2e:visual`.
  - Lint: `cd app && npm run lint` (ESLint 9 flat config, `app/eslint.config.js`). Format:
    `cd app && npm run format` (Prettier — **no semicolons**, single quotes; match surrounding
    style).
  - Deck guards: `PYTHONPATH= py audit_teaching_deck.py` and `PYTHONPATH= py verify_deck_numbers.py`
    (both run from the repo root, exit 0 on pass).
  - Python tests do not exist yet — PHASE-03 introduces them under `tools/tests/` using
    `unittest` from the standard library (see ASM-009).
- **Conventions & traps:**
  - **Currency is always VND.** Slide-facing figures are in **millions of VND**, labelled
    `tr VND` (Vietnamese *triệu*), and rounded — carried in JSON as fields whose names end
    `vndMillionsRounded`. Raw fields end `Vnd`. Prices are **VND per kWh** (unrounded, e.g.
    `163.3`). Volumes are **kWh per month**. Never mix the two magnitudes.
  - Deck figures use comma thousand separators (`9,063`). `verify_deck_numbers.py` matches only
    `\d{1,3}(?:,\d{3})+`, so plain integers and decimals are invisible to it today.
  - Language codes are inconsistent by design and must not be "fixed" blindly: the deck and
    visuals scripts use `en|vi|zh`; the lesson HTML files use `en|vi|zh-cn`; `spine-s1.json` uses
    `nameVi`/`nameZh`.
  - Generated artifacts are **committed to git** (the 27-slide pptx, ~60 PNGs, the JSON exports).
    Regenerating them is expected to produce a diff; that is the point of the CI gates.
  - JS style: no semicolons, single quotes, 2-space indent. Python style: 4-space indent, stdlib
    `argparse`, module-level docstring naming the plan phase that introduced the file.
- **Repo map:**
  ```
  app/                      Vite app (the live tool at https://dppa-case.web.app)
    src/modules/settlement.js   THE engine — five-line bill, CfD, multi-year. Buyer-side only.
    src/modules/ui.js           552 ln, hand-rolled DOM rendering; most English strings live here
    src/data/default-scenarios.js  verified 2025 basis: retail 2204, fees 360+163.3, strike, FMP
    scripts/export-spine.mjs    engine -> assets/teaching/spine-s1.json
    scripts/export-sweep.mjs    engine -> assets/teaching/gate-sweep.json (the 56-cell sweep)
  assets/teaching/          generated PNGs + the two JSON number packs + terminology-map.json
  ceba/                     source + generated .pptx decks
  build_oct_teaching_deck.py    spine+sweep -> "ceba/DPPA Presentation Oct 2026 To Teach.pptx"
  build_teaching_visuals.py     spine+sweep -> assets/teaching/*.png (7 visual families x 3 langs)
  audit_teaching_deck.py        word-budget + symbol-deferral guard  (CI: deck-parity)
  verify_deck_numbers.py        slide figures vs spine/sweep          (CI: deck-parity)
  .github/workflows/ci.yml      jobs: app-quality, deck-parity
  ```

## Research Inputs

- From `research/2026-07-16-post-hardening-next-level-brainstorm.md`:
  - The number pipeline is genuinely clean: both Python generators load the JSON packs and no
    hand-typed VND constants exist in either. Do not "fix" what is already sound — the risk has
    moved from *traceability* to *the assumptions underneath*.
  - `export-sweep.mjs:36-40` defines `LENDER_DEBT_SERVICE_VND_PER_KWH = 1150 * 1.2` (1,380) and
    `INVESTOR_LCOE_VND_PER_KWH = 1450` as illustrative proxies, and `ESCALATION = 0.04`. The deck
    presents the resulting pass count as computed authority. Upgrading it from *asserted* to
    *derived* did not make it true; it made the softness harder to see.
  - The buyer gate escalates strike and retail via `priceFactor`; the lender/investor gates
    compare a **nominal, un-escalated** strike against flat thresholds. The gates are measured on
    different time bases.
  - Verified toolchain gap: `pptx`, `matplotlib`, `numpy`, `docx`, `qrcode` are all missing from a
    clean interpreter; there is no `requirements.txt`, no `pyproject.toml`, no root README. CI
    installs one package. The "regenerate with one command" story is true on exactly one machine.
  - `deck-parity`'s regenerate-and-diff pattern (`ci.yml:49-55`) is the right pattern and covers 2
    of ~65 generated artifacts. The pptx and PNGs are committed binaries whose generators never
    run in CI.
  - `verify_deck_numbers.py:86` is set-membership, not parity: it cannot catch a figure on the
    wrong slide or two line items swapped, because both values are "allowed". `EXTRA_ALLOWED` is
    an escape hatch its own comment warns will grow.
  - `audit_teaching_deck.py:72-76` is a loop that executes `pass`; its docstring (lines 2-3)
    claims it reconciles numbers against the spine. It does not.
  - App i18n is the biggest audience mismatch: everything is trilingual except the app the
    Vietnamese/Chinese CFOs actually touch. Bundle it with the translation task so the vocabulary
    is paid for once.
- From `plans/2026-october-readiness-checklist.md`:
  - Content freeze is gated on the fresh-viewer test and the timed dry-run passing. After freeze,
    editing `TEXT["en"]` or English captions requires re-running the fresh-viewer test — late
    edits triple translation rework (CON-004 of the teaching-revamp plan). **Anything that changes
    slide text must land before freeze.** This is why PHASE-01 is first.
  - The checklist already flags the lender/investor proxy constants for recalibration and names
    the exact downstream chain: re-run the sweep → re-render visuals → rebuild the deck → update
    the two pass-count references in `facilitator/dppa-workshop-facilitator-guide.md`.
  - 31 VI / 33 ZH `UNTRANSLATED` entries remain in `assets/teaching/terminology-map.json`;
    `build_oct_teaching_deck.py --lang vi|zh` refuses to build while any consumed key is
    `UNTRANSLATED`, so a clean run is itself the completeness check.
- From `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md`:
  - DEC-003: the session's success criterion is a fresh viewer computing the five-line bill
    unaided. M5's exercise is that criterion; its punchline slide must survive scrutiny.
  - CON-002: ≤30 words per content slide, Decree-57 symbols deferred until the M6 decoder. Any
    text added to a slide in PHASE-01 is subject to this budget and is enforced by
    `audit_teaching_deck.py`.

## Assumptions and Constraints

- **ASM-001:** The 4% annual escalation (`ESCALATION`/`FMP_ESCALATION` in `export-sweep.mjs`) is
  an inflation proxy applied equally to strike, retail and FMP. Under that reading, a nominal
  Year-1 strike compared against a flat threshold **is** a real-terms comparison, so the existing
  gate math is defensible once its basis is stated — the defect is undeclared basis, not wrong
  arithmetic. — **BINDING DEFAULT:** Do not re-derive the gates on a discounted-levelised basis.
  Declare the basis explicitly in code comments, in `gate-sweep.json`'s `meta`, and on the slide
  (PHASE-01), and treat the thresholds as **real, constant-2026 VND/kWh**. Rationale for not
  levelising: discounting an escalating strike at a ~10% nominal WACC yields a levelised strike
  ~32% above nominal (1,450 → ~1,914), which would pass every cell and flip the headline for a
  purely notational reason. That is a bigger distortion than the one being fixed.
- **ASM-002:** Real Vietnamese developer LCOE and DSCR figures are unavailable to an autonomous
  executor; they require Allotrope deal data. — **BINDING DEFAULT:** Keep the central values
  (`investorLcoe` 1,450; `dscrTarget` 1.20) as the central case, but make them named,
  band-swept, and labelled illustrative on-slide. Do not invent "more realistic" numbers.
- **ASM-003:** The strike grid's maximum (1,450) coinciding exactly with the investor threshold
  (1,450) is an accident of authoring, not a modelling choice. Every passing cell today sits in
  that single column, so the headline is clipped by the grid edge. — **BINDING DEFAULT:** Extend
  `STRIKES` to `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]` (10 columns × 7
  ratios = **70 cells**) so the pass region is bounded by economics, not by the axis. Expect the
  headline to move from "5 of 56" to roughly "12 of 70" — the exact value is whatever the sweep
  computes and must never be hardcoded.
- **ASM-004:** Because `INVESTOR_LCOE_VND_PER_KWH` (1,450) > `LENDER_DEBT_SERVICE_VND_PER_KWH`
  (1,380) and both gates are simple `strike >= threshold` tests, the investor gate strictly
  subsumes the lender gate — the lender door can never be the binding constraint, which hollows
  out the "all three doors" narrative M4/M5 teaches. — **BINDING DEFAULT:** Do not tune the
  constants to manufacture independence. Surface it honestly: the M5 provenance footnote states
  that under the central case the investor door is the binding one, and the heatmap's 0–3 gate
  shading already shows the lender/investor boundary. Record it as a finding for the human
  recalibration decision in ASM-002.
- **ASM-005:** The October session date is still unconfirmed (Q-001, open since 2026-07-04). —
  **BINDING DEFAULT:** Backward-plan from an October 1 session with **content freeze on
  2026-09-15**. PHASE-01 must be merged before that date because it changes slide text; PHASE-02
  through PHASE-04 touch no slide text and may land either side of it.
- **ASM-006:** `.pptx` and matplotlib `.png` outputs are not byte-reproducible across runs (zip
  member ordering, timestamps, font rasterization), so a CI rebuild cannot `git diff --exit-code`
  the binaries the way `deck-parity` does for JSON. — **BINDING DEFAULT:** The `deck-build` job
  rebuilds into a **temporary directory** and compares **extracted slide text, slide count, and
  image dimensions** against the committed artifacts — never raw bytes.
- **ASM-007:** `build_oct_teaching_deck.py` hardcodes the `-en` suffix in all 14 asset references
  (lines 214, 226, 305, 306, 335, 343, 347, 350, 353, 354, 355, 358, 364, 380); `build(lang)` uses
  `lang` only for the `TEXT` dict and the output filename suffix (line 394). A `--lang vi` build
  would therefore emit Vietnamese text over **English visuals**, and the `UNTRANSLATED` guard
  would pass, giving false confidence. This is latent today only because no vi/zh build has been
  run. — **BINDING DEFAULT:** Fix in PHASE-05 (localization) by threading `lang` through every
  asset path, with a build-time existence assertion per asset.
- **ASM-008:** The lesson HTML files use the language code `zh-cn` while the deck/visuals scripts
  use `zh`. — **BINDING DEFAULT:** The app's `?lang=` parameter accepts `en|vi|zh` (matching the
  deck/visuals/terminology-map convention, since the terminology map is the shared vocabulary
  source). Do not rename existing lesson files.
- **ASM-009:** The repo has no Python test framework or runner configured. — **BINDING DEFAULT:**
  Use the standard-library `unittest` module (no new dependency) with tests under `tools/tests/`,
  run via `PYTHONPATH= py -m unittest discover -s tools/tests -v`.
- **ASM-010:** Root scripts `apply_corrections.py`, `apply_deck_corrections.{py,js}`,
  `verify_deck_app_parity.{py,js}`, `build_callouts.py`, `build_policy_refresh.py`,
  `build_2026_from_ref.py`, `build_canonical_cases.py`, `inspect_pptx.py`, `build-deck.js` and the
  root `node_modules/` are one-offs consumed by completed sprints (the `.py`/`.js` pairs do the
  same job twice; CI and `NOTES.md` reference only the Python side). — **BINDING DEFAULT:** Move
  them to `tools/archive/` rather than deleting — git history preserves them either way, but an
  archive directory is reversible without archaeology. Do **not** archive the five living
  generators or the two verifiers.
- **CON-001:** English content freeze (ASM-005). PHASE-01 changes slide text and is therefore
  hard-gated to land before it.
- **CON-002:** ≤30 words per non-exempt content slide, enforced by `audit_teaching_deck.py`
  (`WORD_BUDGET = 30`, `EXEMPT_TITLES`). The PHASE-01 provenance text must fit that budget or its
  slide must be added to `EXEMPT_TITLES` with a justification comment.
- **CON-003:** `settlement.js` is **buyer-side only** — it models no debt schedule and no equity
  IRR. The lender/investor gates are therefore necessarily proxies, not model outputs. This is a
  permanent property of the engine, not a bug to fix in this plan.
- **CON-004:** The anchor self-check in `export-sweep.mjs:110-118` (strike=1250, ratio=1.00,
  Year-1 `cKh` must equal exactly `9063196000`) must keep passing through every PHASE-01 change.
  It is the tripwire proving the sweep's inputs still match the canonical S1 spine.
- **DEC-001:** The engine (`app/src/modules/settlement.js`) is the single source of truth for every
  figure. Python generators read JSON exports; they never hand-type numbers. Preserve this.
- **DEC-002:** The regenerate-and-diff pattern already used by the `deck-parity` job is the
  repo's chosen mechanism for artifact integrity. PHASE-02 extends that same pattern rather than
  inventing a new one.
- **DEC-003:** The session's success criterion is a fresh viewer computing the five-line bill
  unaided. M5's exercise **is** that test; changes to M5 must not add cognitive load to the
  exercise itself — the provenance work targets the setup and reveal slides only.

## Specification

### S1. Gate definitions after PHASE-01 (the declared basis)

All prices are **VND per kWh**. All volumes are **kWh per month**. `LOAD` = 5,000,000 kWh/month
(`scenarioProfiles.workshop1.monthlyVolumes.total`).

For a grid cell `(strike, ratio)`:

- **contracted volume:** `contracted = round(LOAD × ratio)`
  — `ratio` is contracted volume as a fraction of monthly load; the grid sweeps 0.7 … 1.3.

- **Buyer gate** (exact, engine-computed, nominal lifetime VND):
  ```
  lifetimeDppa = Σ_{y=1..20} [ 12 × cKh(strike·f_y, fmp·f_y, retail·f_y, contracted) ]
  lifetimeBau  = Σ_{y=1..20} [ 12 × LOAD × retail · f_y ]
  buyerPass    = lifetimeDppa ≤ lifetimeBau
  ```
  - `f_y = (1 + 0.04)^(y-1)` — the escalation factor for year `y`; year 1 is unescalated.
  - `cKh(...)` — the customer's total monthly bill, returned by `buildFiveLineBill` in
    `app/src/modules/settlement.js`. This is the real five-line bill, not an approximation.
  - `retail` = 2,204 VND/kWh (`defaultInputs.retailTariff`); `fmp` = 1,150 VND/kWh
    (`scenarioProfiles.workshop1.overrides.marketPrice`).
  - Both sides escalate identically, so this is a like-for-like nominal comparison.

- **Lender gate** (Year-1 binding, real 2026 VND — see ASM-001):
  ```
  lenderThreshold = fmp × dscrTarget            (central case: 1,150 × 1.20 = 1,380)
  lenderPass      = strike ≥ lenderThreshold
  ```
  - `dscrTarget` — the debt-service coverage ratio the lender requires (central case 1.20).
  - Year 1 is the binding year because the strike escalates while nominal debt service is flat:
    if the project covers debt service in year 1, it covers it in every later year.
  - **Change from today:** the threshold currently duplicates the literal `1150 * 1.2` instead of
    deriving from `FMP1` and `DSCR_TARGET`; `DSCR_TARGET` is declared and exported into `meta` but
    never actually drives a gate. PHASE-01 makes it drive the gate.

- **Investor gate** (real 2026 VND — see ASM-001):
  ```
  investorPass = strike ≥ investorLcoe          (central case: 1,450)
  ```
  - `investorLcoe` — the developer's full levelised cost of energy, i.e. the strike below which
    the project does not earn its required return. Illustrative (ASM-002).

- **Cell result:** `allPass = buyerPass ∧ lenderPass ∧ investorPass`

### S2. The sensitivity band (PHASE-01)

The headline is reported as a range across a threshold grid, with the central case named:

```
for each (investorLcoe, dscrTarget) in LCOE_BAND × DSCR_BAND:
    passCount(investorLcoe, dscrTarget) = |{ cells where allPass }|

bandMin     = min over the grid
bandMax     = max over the grid
passCount   = the central case (investorLcoe = 1450, dscrTarget = 1.20)
```

- `LCOE_BAND = [1300, 1350, 1400, 1450, 1500, 1550, 1600]` (7 values, VND/kWh)
- `DSCR_BAND = [1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45]` (7 values, dimensionless)
- The band grid is 49 threshold pairs; each evaluates all 70 cells. 3,430 `buildFiveLineBill`
  calls over 20 years — trivially fast, no optimization needed.
- The buyer gate is independent of both threshold parameters, so `bandMax ≤ |{buyerPass}|`. This
  is a useful invariant to assert in tests.

### S3. Grid-size derivation (PHASE-01)

The literal `56` appears in 14 places (`build_teaching_visuals.py` lines 54, 56, 82, 84, 110, 112,
307, 338; `build_oct_teaching_deck.py` lines 46, 60, 61, 379, 382; plus two English snapshots in
`assets/teaching/terminology-map.json` lines 78, 148) while `passCount` is already dynamic.
Extending the grid (ASM-003) makes every one of those literals wrong.

Decision logic for every downstream consumer:

1. Read `cellCount` from `gate-sweep.json` (new field, = `cells.length`).
2. Never write a grid-size literal in a caption, title, slide body, speaker note, or checkpoint
   question. Format strings take `{n}` (pass count) and `{total}` (cell count).
3. The three-language caption strings in `build_teaching_visuals.py` (`TEXTS.{en,vi,zh}.m5_title`
   and `.m5_caption`) become `{total}`-parameterized. The VI and ZH strings already exist and are
   approved vocabulary — reuse them verbatim, substituting only the number token.
4. `assets/teaching/terminology-map.json`'s `en` values are **review snapshots**, not the live
   source (its own `meta.purpose` says so). Update the two affected snapshots to match the new
   `TEXT["en"]` so reviewers are not misled, but do not wire the build to read `en` from the map.

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Make the M5 gate claim defensible: declared basis, extended grid, sensitivity band, on-slide provenance, zero grid-size literals | None | Reworked `export-sweep.mjs`, richer `gate-sweep.json`, updated heatmap + M5 slides, updated facilitator guide |
| PHASE-02 | Declare the Python toolchain and prove the committed deck is its generator's output | PHASE-01 | `requirements.txt`, `deck-build` CI job, `tools/compare_deck.py` |
| PHASE-03 | Make the verifiers positional and prove they can fail | PHASE-02 | `deck-figures.json` manifest, rewritten `verify_deck_numbers.py`, `tools/tests/` |
| PHASE-04 | Give every generator a home and a documented owner | PHASE-03 | `tools/` layout, `tools/archive/`, root `README.md` with the generator→artifact table |
| PHASE-05 | Complete localization: vi/zh decks use vi/zh visuals, and the app speaks all three languages | PHASE-04 (+ human translation of the terminology map) | `lang`-threaded deck builder, `app/src/i18n/`, `?lang=vi\|zh` |
| PHASE-06 | Close the two remaining app gaps: shareable state and M6's missing demo | PHASE-05 | URL-encoded state, per-module deep-link QRs, five-levers sensitivity panel |

## Detailed Phases

### PHASE-01 - Gate Credibility (pre-freeze, hard-gated)

**Goal**
Turn "5 of 56" from a grid artifact into a defensible, assumption-labelled range. After this
phase the deck states a central case with a band, the slide shows where the thresholds come from,
the grid is bounded by economics rather than by its own axis, and no grid-size literal survives.
This phase changes slide text and **must merge before content freeze (ASM-005: 2026-09-15)**.

**Tasks**
- [ ] TASK-01-01: In `app/scripts/export-sweep.mjs`, derive the lender threshold from its inputs
      instead of duplicating a literal: replace `const LENDER_DEBT_SERVICE_VND_PER_KWH = 1150 * 1.2`
      with a value computed as `FMP1 * DSCR_TARGET`, so `DSCR_TARGET` actually drives the gate it
      documents. Keep the resulting central value at 1,380.
- [ ] TASK-01-02: Extend `STRIKES` to `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]`
      (ASM-003). Leave `RATIOS` unchanged at `[0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3]`.
- [ ] TASK-01-03: Refactor `evaluateCell(strike, ratio)` to `evaluateCell(strike, ratio, thresholds)`
      where `thresholds = { investorLcoe, dscrTarget }`, so the gate logic can be swept. Preserve
      the exact buyer-gate math — it must not change.
- [ ] TASK-01-04: Add `computeBand(cells)` implementing S2. Emit `sensitivity` into
      `gate-sweep.json`: `{ lcoeBand, dscrBand, bandMin, bandMax, central: {...}, grid: [...] }`.
- [ ] TASK-01-05: Add `cellCount` (= `cells.length`) to `gate-sweep.json` and extend `meta` with
      the declared basis (ASM-001): `basis: "real-2026-VND; escalation 4%/yr applied equally to
      strike, retail and FMP, so a nominal Year-1 strike is a real-terms comparison"`,
      `lenderGateBindingYear: 1`, plus a `bindingGate` field naming which door binds in the central
      case (expected: `"investor"`, per ASM-004).
- [ ] TASK-01-06: Verify the anchor self-check (CON-004) still passes unchanged — strike=1250,
      ratio=1.00, Year-1 `cKh === 9063196000`. Do not modify the expected value; if it fails, the
      buyer-gate math was altered and TASK-01-03 is wrong.
- [ ] TASK-01-07: Add unit tests for the sweep (see Test Specs). `export-sweep.mjs` already exports
      `buildSweep()`, so it is importable from a test without running `main()`.
- [ ] TASK-01-08: Parameterize the grid-size literals per S3 in `build_teaching_visuals.py`:
      `TEXTS.{en,vi,zh}.m5_title` and `.m5_caption` take `{total}`; the big centre label at line 338
      becomes `f"{pass_count} / {total}"` where `total = sweep["cellCount"]`. Reuse the existing
      approved VI/ZH wording verbatim — substitute only the number token.
- [ ] TASK-01-09: Add a provenance footnote to the heatmap in `render_m5_heatmap`: a single small
      caption line below the axis reading (EN) `Illustrative developer proxies: LCOE {lcoe} · DSCR
      {dscr} · 4%/yr escalation · {bandMin}–{bandMax} pass across the assumption band.` Source every
      number from `gate-sweep.json` — no literals. Use `GRAY` at fontsize 8 to match the existing
      axis-label treatment.
- [ ] TASK-01-10: Update `build_oct_teaching_deck.py`'s M5 strings (lines 46, 60, 61, 379, 382) to
      derive the grid size from `SWEEP["cellCount"]` and to state the band. Suggested `m5_body`
      (23 words, within CON-002): `f"Sweep strike x volume: {PASS_COUNT} of {CELL_COUNT} clear all
      three doors. Change the developer's assumptions and it moves {BAND_MIN}-{BAND_MAX}."`
- [ ] TASK-01-11: Extend the M5 reveal slide's **speaker notes** (not the slide body — CON-002 and
      DEC-003) with the answer to the challenge this phase anticipates: where 1,450 and 1.20 come
      from, that they are illustrative, that the investor door is the binding one in the central
      case (ASM-004), and what the band means.
- [ ] TASK-01-12: Regenerate all three languages and rebuild the deck; update the two pass-count
      references in `facilitator/dppa-workshop-facilitator-guide.md` to the new central value and
      add the band.
- [ ] TASK-01-13: Update the two English review snapshots in `assets/teaching/terminology-map.json`
      (lines 78, 148) to match the new `TEXT["en"]` per S3 step 4. Leave every `vi`/`zh` value and
      every `UNTRANSLATED` marker untouched — retranslation is PHASE-05's concern, and the `m5_body`
      entry's existing note already warns that the figure is computed and needs re-verification
      after translation.

**File Changes**
- `app/scripts/export-sweep.mjs` (modify): rework per TASK-01-01→01-05. Preserve `buildSweep()`'s
  export, the `main()` anchor self-check, and the output path
  (`../../assets/teaching/gate-sweep.json`). Do not touch the buyer-gate math in `yearBill`.
- `app/scripts/export-sweep.test.js` (create): colocated with `app/scripts/`. Vitest picks it up via
  its default include glob — `app/vite.config.js` only excludes `e2e/**`, `node_modules/**` and
  `dist/**`, so no config change is needed. Note that `app/eslint.config.js:6` ignores `scripts/**`,
  so this file (and `export-sweep.mjs` itself) is **not linted**; match the surrounding style by hand
  (no semicolons, single quotes, 2-space indent). Covers Test Specs below.
- `assets/teaching/gate-sweep.json` (modify): regenerated output — new `cellCount`, `sensitivity`,
  extended `meta`, 70 cells. Commit the regenerated file; `deck-parity` will diff it.
- `build_teaching_visuals.py` (modify): `TEXTS` m5 strings parameterized (lines 54, 56, 82, 84,
  110, 112); `render_m5_heatmap` (lines 308-345) reads `cellCount` and renders the provenance
  footnote. Leave the other six visual families untouched.
- `build_oct_teaching_deck.py` (modify): M5 strings and the reveal slide's notes (lines 46, 60-61,
  364-382). Leave the `-en` asset hardcoding alone — that is PHASE-05 (ASM-007).
- `assets/teaching/m5-gate-heatmap-{en,vi,zh}.png` (modify): regenerated.
- `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (modify): rebuilt.
- `facilitator/dppa-workshop-facilitator-guide.md` (modify): the two pass-count references.
- `assets/teaching/terminology-map.json` (modify): two `en` review snapshots only.

**Function Signatures**
- `evaluateCell(strike: number, ratio: number, thresholds: { investorLcoe: number, dscrTarget: number }) -> { strike, ratio, buyerPass, lenderPass, investorPass, allPass, lifetimeDppaVnd, lifetimeBauVnd }`
  — one grid cell's gate results; VND fields are rounded integers.
- `countPasses(cells: Cell[], thresholds: { investorLcoe: number, dscrTarget: number }) -> number`
  — how many cells clear all three gates at those thresholds.
- `computeBand(cells: Cell[]) -> { lcoeBand: number[], dscrBand: number[], bandMin: number, bandMax: number, central: { investorLcoe: number, dscrTarget: number, passCount: number }, grid: Array<{ investorLcoe: number, dscrTarget: number, passCount: number }> }`
  — the S2 sensitivity band across all 49 threshold pairs.
- `buildSweep() -> { meta, strikes, ratios, cells, passCount, cellCount, sensitivity }`
  — the full export object (signature unchanged; return shape extended).
- `render_m5_heatmap(lang: str, spine: dict, sweep: dict) -> str` — writes
  `assets/teaching/m5-gate-heatmap-{lang}.png`, returns the path (signature unchanged).

**Test Specs**
- `buildSweep().cells.length` → `70`
- `buildSweep().cellCount` → `70` (must equal `cells.length` — guards S3)
- `buildSweep().strikes` → `[1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]`
- Anchor (CON-004): year-1 bill at `strike=1250, ratio=1.0` → `cKh === 9063196000` exactly.
- `evaluateCell(1450, 1.0, { investorLcoe: 1450, dscrTarget: 1.20 }).investorPass` → `true`
  (boundary: `>=` is inclusive — a strike exactly at the threshold passes).
- `evaluateCell(1449, 1.0, { investorLcoe: 1450, dscrTarget: 1.20 }).investorPass` → `false`
- `evaluateCell(1380, 1.0, { investorLcoe: 1450, dscrTarget: 1.20 }).lenderPass` → `true`
  (boundary: `1150 × 1.20 = 1380` exactly; assert the derived threshold equals 1380 to prove
  TASK-01-01 preserved the central value).
- Subsumption invariant (ASM-004): for the central thresholds, every cell with `investorPass === true`
  also has `lenderPass === true`. This test documents the finding; if a future recalibration makes the
  gates independent it will fail loudly and should then be updated deliberately.
- Band invariant (S2): `computeBand(cells).bandMax <= cells.filter(c => c.buyerPass).length`
  — the buyer gate is threshold-independent and therefore caps the band.
- Band monotonicity: `countPasses(cells, { investorLcoe: 1300, dscrTarget: 1.15 }) >= countPasses(cells, { investorLcoe: 1600, dscrTarget: 1.45 })`
  — looser thresholds can never pass fewer cells.
- `computeBand(cells).central.passCount === buildSweep().passCount` — the headline is the central
  case, not a band endpoint.
- Regression: `buildSweep().cells.filter(c => c.allPass)` must **not** be confined to a single
  strike column. (Today all 5 sit at `strike === 1450`; after ASM-003 the pass region must be
  interior to the grid. Assert `new Set(passing.map(c => c.strike)).size >= 2`.)

**Dependencies**
- None (Node + the existing app toolchain; `matplotlib`/`python-pptx` must be installed locally to
  regenerate the visuals and deck — PHASE-02 declares them, but this phase can run first on the
  author's machine where they are already present).

**Exit Criteria**
- [ ] `cd app && npx vitest run scripts/export-sweep.test.js` passes.
- [ ] `cd app && node scripts/export-sweep.mjs` prints the anchor check passing and a `passCount`
      out of 70.
- [ ] `grep -rn "of 56\|/ 56\|56 scenarios\|56 kịch bản\|56种情景" build_teaching_visuals.py build_oct_teaching_deck.py` returns **no matches**.
- [ ] `PYTHONPATH= py audit_teaching_deck.py` exits 0 (the new M5 body is within the 30-word budget).
- [ ] `PYTHONPATH= py verify_deck_numbers.py` exits 0.
- [ ] The rebuilt heatmap shows a provenance footnote naming the LCOE, DSCR, escalation and band,
      with every number sourced from `gate-sweep.json`.
- [ ] `grep -rn "5 of 56\|5/56" facilitator/dppa-workshop-facilitator-guide.md` returns no matches.

**Phase Risks**
- **RISK-01-01:** The new pass count could land at 0 or at 70, either of which destroys M5's
  teaching point ("the window is narrow"). *Mitigation:* the band exists precisely to absorb this —
  if the central case degenerates, report the band as the headline instead and record the outcome
  for the ASM-002 recalibration decision. Do **not** tune the grid or thresholds to manufacture a
  pleasing number; that is the exact failure this phase is correcting.
- **RISK-01-02:** The provenance footnote pushes the M5 slide over CON-002's 30-word budget.
  *Mitigation:* the footnote lives on the **heatmap image**, not in the slide's text frame, so it is
  invisible to `audit_teaching_deck.py`'s word count by construction. Keep it there.
- **RISK-01-03:** Changing the headline invalidates the July→October A/B comparison and any
  rehearsal the presenter has already done against "5 of 56". *Mitigation:* PHASE-01 is gated
  before freeze and before the dry-run for exactly this reason (ASM-005).

### PHASE-02 - Reproducibility: Declare the Toolchain, Close Generator Drift

**Goal**
Make every artifact rebuildable from a clean checkout, and make CI prove that the committed deck
and PNGs are actually the output of their generators. Today the `deck-parity` job's
regenerate-and-diff pattern covers 2 of ~65 generated artifacts; this phase extends it to the deck.

**Tasks**
- [ ] TASK-02-01: Create `requirements.txt` pinning every Python dependency used by the root
      scripts. Derived from the import survey: `python-pptx` (all deck scripts), `matplotlib` +
      `numpy` (`build_teaching_visuals.py`, `build_cfd_slide.py`), `Pillow`
      (`build_teaching_visuals.py`, `build_cfd_slide.py`), `python-docx`
      (`build_worksheet_answer_docx.py`), `qrcode[pil]` (QR generation). Pin to exact versions
      resolved at authoring time (`pip freeze | grep -iE 'pptx|matplotlib|numpy|pillow|docx|qrcode'`).
- [ ] TASK-02-02: Create `tools/compare_deck.py` implementing ASM-006 — a text-level deck
      comparator, since `.pptx` is not byte-reproducible.
- [ ] TASK-02-03: Add a `deck-build` job to `.github/workflows/ci.yml` that installs
      `requirements.txt`, rebuilds the deck into a temp directory, and runs `tools/compare_deck.py`
      against the committed deck. Model it on the existing `deck-parity` job's structure.
- [ ] TASK-02-04: Change the existing `deck-parity` job's `pip install python-pptx` to
      `pip install -r requirements.txt` so both jobs share one declared dependency set.
- [ ] TASK-02-05: Extend `build_oct_teaching_deck.py` with an `--out DIR` argument (default: the
      current `ceba/` behaviour) so CI can build to a temp directory without touching the working
      tree. Preserve the existing `--lang` behaviour and the `suffix` logic at line 394 exactly.
- [ ] TASK-02-06: Resolve the `e2e:visual` non-test (`ci.yml:27-30`, permanently
      `continue-on-error: true` pending Linux baselines). Generate the CI baselines by running the
      visual suite once with `--update-snapshots` in a Linux container, commit them, and remove
      `continue-on-error`. If the baselines prove unstable across two consecutive CI runs, delete
      the job instead — a check that cannot fail teaches the team to ignore checks.

**File Changes**
- `requirements.txt` (create): pinned dependencies, with a header comment naming which script needs
  each package.
- `tools/compare_deck.py` (create): the ASM-006 comparator.
- `.github/workflows/ci.yml` (modify): add the `deck-build` job; change `deck-parity`'s pip line;
  resolve `e2e:visual`. Leave the `app-quality` job's `npm install` (not `npm ci`) alone — the
  comment at lines 18-22 documents why.
- `build_oct_teaching_deck.py` (modify): add `--out`. Leave everything else alone.

**Function Signatures**
- `extract_deck_fingerprint(pptx_path: str) -> dict` — returns
  `{ "slideCount": int, "slides": [ { "index": int, "text": list[str], "images": [ { "widthEmu": int, "heightEmu": int } ] } ] }`;
  the comparable, reproducible projection of a deck (text runs + image geometry, never bytes).
- `compare_decks(committed_path: str, rebuilt_path: str) -> list[str]` — human-readable difference
  descriptions; empty list means the committed deck matches its generator's output.
- `main() -> int` — exit 0 when the lists match, 1 with a printed diff otherwise.

**Test Specs**
- `extract_deck_fingerprint("ceba/DPPA Presentation Oct 2026 To Teach.pptx")["slideCount"]` → `27`
- `compare_decks(committed, committed)` → `[]` (a deck always matches itself — the reflexivity
  guard that proves the comparator is not vacuously passing).
- Rebuild the deck unchanged into a temp dir → `compare_decks(committed, rebuilt)` → `[]`,
  demonstrating the fingerprint is stable across runs despite the `.pptx` bytes differing. If this
  fails, the fingerprint is capturing something non-reproducible and must be narrowed.
- Plant a change: edit `TEXT["en"]["m1_title"]` to `"CHANGED"`, rebuild → `compare_decks` returns a
  non-empty list naming slide 1. **This is the test that proves the job can fail.**
- Edge case: a deck with a different slide count → the comparator reports the count mismatch and
  does not raise `IndexError`.

**Dependencies**
- PHASE-01 (the deck must be rebuilt with final M5 text before its fingerprint is pinned in CI).

**Exit Criteria**
- [ ] `py -m pip install -r requirements.txt` succeeds in a clean virtualenv, and afterwards
      `PYTHONPATH= py build_teaching_visuals.py --lang en` runs to completion.
- [ ] `PYTHONPATH= py tools/compare_deck.py` exits 0 against the committed deck.
- [ ] The planted-change test (Test Specs) makes `tools/compare_deck.py` exit 1.
- [ ] CI shows three jobs — `app-quality`, `deck-parity`, `deck-build` — all green, with no
      `continue-on-error` remaining in the workflow.

**Phase Risks**
- **RISK-02-01:** Matplotlib font rendering differs between the author's Windows machine and CI's
  Linux, so a PNG rebuilt in CI will not match the committed PNG. *Mitigation:* this phase
  fingerprints the **deck** (text + image geometry), not PNG pixels. Do not attempt to diff PNG
  bytes or pixels in CI — the deck fingerprint's image-dimension check is the intended level of
  coverage, and PNG content is already guarded upstream by the `gate-sweep.json`/`spine-s1.json`
  diff.
- **RISK-02-02:** `pip freeze` on the author's machine may pin Windows-specific wheels that fail to
  resolve on CI's Linux. *Mitigation:* pin package versions only (`matplotlib==3.9.2`), never
  platform-specific build tags; verify by letting the `deck-build` job install them on Linux.

### PHASE-03 - Verifier Soundness

**Goal**
Make `verify_deck_numbers.py` a real parity check rather than a set-membership check, retire the
`EXTRA_ALLOWED` escape hatch, remove the dead code in `audit_teaching_deck.py`, and prove — with a
test — that the guards actually catch a planted error. Today we know they pass; we have never seen
them catch anything.

**Tasks**
- [ ] TASK-03-01: Extend `build_oct_teaching_deck.py` to emit a figure manifest as it builds. The
      builder already knows which spine figure it places on which slide and currently throws that
      knowledge away; capture it into `assets/teaching/deck-figures.json` keyed by slide index.
- [ ] TASK-03-02: Register **derived** figures into the manifest at the point of derivation — the
      M2 Sankey body's `fees` value is `systemService + diffClearing` (1,800 + 817 = 2,617), which
      is exactly the sole current member of `EXTRA_ALLOWED`. Deriving it removes the need to
      allowlist it.
- [ ] TASK-03-03: Rewrite `verify_deck_numbers.py` to verify **per-slide** against the manifest
      rather than against a flat allowed-set. Delete `EXTRA_ALLOWED` entirely (C2).
- [ ] TASK-03-04: Widen `NUMBER_PATTERN`. It currently matches only `\d{1,3}(?:,\d{3})+`, so
      `163.3` (the clearing fee), `1.0342` (the loss factor) and bare integers like the pass count
      are invisible. Match comma-grouped integers, bare integers ≥ 3 digits, and decimals.
- [ ] TASK-03-05: Delete the dead loop at `audit_teaching_deck.py:72-76` (a `for` loop whose body is
      `pass`) and correct the module docstring at lines 2-3, which claims the script "reconcile[s]
      every numeric string against `assets/teaching/spine-s1.json`" — it does not; that job now
      belongs to `verify_deck_numbers.py`. Leave the word-budget and symbol-deferral checks alone.
- [ ] TASK-03-06: Create `tools/tests/` with `unittest` tests (ASM-009) that build a synthetic
      2-slide `.pptx` in a temp directory and prove the verifier **fails** on a planted stale figure.
- [ ] TASK-03-07: Add the test run to the `deck-parity` CI job.

**File Changes**
- `build_oct_teaching_deck.py` (modify): manifest emission (TASK-03-01/02). The `TEXT` dict and
  slide layout stay as-is.
- `assets/teaching/deck-figures.json` (create): generated manifest, committed like the other packs.
- `verify_deck_numbers.py` (modify): rewritten verification core; `EXTRA_ALLOWED` deleted;
  `NUMBER_PATTERN` widened. Keep the CLI contract (run from repo root, exit 0/1, `PARITY PASS` /
  `PARITY FAIL` output) — CI depends on it.
- `audit_teaching_deck.py` (modify): delete lines 72-76; fix the docstring.
- `tools/tests/test_verify_deck_numbers.py` (create).
- `tools/tests/test_audit_teaching_deck.py` (create).
- `.github/workflows/ci.yml` (modify): add the unittest step to `deck-parity`.

**Function Signatures**
- `register_figure(manifest: dict, slide_index: int, value: int | float, source: str) -> None` —
  records that `value` was placed on slide `slide_index`, with `source` naming its provenance
  (e.g. `"spine.bill.lines.marketEnergy.vndMillionsRounded"` or
  `"derived: systemService + diffClearing"`).
- `write_manifest(manifest: dict, path: str) -> None` — writes `deck-figures.json` sorted by slide
  index for a stable diff.
- `load_manifest(path: str) -> dict[int, set[str]]` — slide index → the set of formatted figure
  strings expected on that slide.
- `verify_slide(slide_index: int, tokens: list[str], expected: set[str]) -> list[str]` — the
  violations for one slide; empty means clean.

**Test Specs**
- Manifest round-trip: build the deck → `load_manifest("assets/teaching/deck-figures.json")` has an
  entry for every slide index that carries a figure, and `9,063` (`cKh`) maps to the M5 reveal
  slide's index.
- Derived-figure registration: `2,617` appears in the manifest with `source` starting `"derived:"`,
  and `grep -c "EXTRA_ALLOWED" verify_deck_numbers.py` → `0`.
- **The planted-error test (the point of this phase):** construct a synthetic deck where slide 1
  carries `5,947` and slide 2 carries `1,800`; verify against a manifest expecting the reverse
  (slide 1 → `1,800`, slide 2 → `5,947`) → `verify_deck_numbers` exits **1** and names both slides.
  The current implementation passes this input, because both values are in the flat allowed-set —
  that is precisely the bug being fixed.
- Stale-figure test: manifest expects `9,063` on slide N; deck carries `9,062` → exit 1 naming
  slide N.
- Widened pattern: a slide carrying `163.3` → the token is extracted and checked (today it is
  silently skipped).
- Negative control: the real deck against its real manifest → exit 0, `PARITY PASS`.
- `audit_teaching_deck.py` after the dead-loop deletion → still exits 0 on the real deck, and
  still exits 1 on a deck with a 31-word non-exempt slide.

**Dependencies**
- PHASE-02 (`requirements.txt` must exist so the tests can run in CI).

**Exit Criteria**
- [ ] `PYTHONPATH= py -m unittest discover -s tools/tests -v` passes.
- [ ] `grep -c "EXTRA_ALLOWED" verify_deck_numbers.py` → `0`.
- [ ] `grep -n "pass  # informational" audit_teaching_deck.py` returns no matches.
- [ ] The planted-swap test fails the verifier (proving the gate catches what it previously missed).
- [ ] `PYTHONPATH= py verify_deck_numbers.py` exits 0 on the real deck.
- [ ] CI `deck-parity` runs the unittest suite and is green.

**Phase Risks**
- **RISK-03-01:** The widened `NUMBER_PATTERN` will start catching numbers that are legitimately not
  spine figures — years (`2026`), slide numbers, module numbers (`1`–`6`), the horizon (`20`).
  *Mitigation:* the manifest is per-slide and positive, so a number the builder never registered is
  a violation by definition. Register non-figure numerals explicitly (e.g. `source: "literal: session
  year"`) rather than reintroducing a global ignore-list — that would rebuild `EXTRA_ALLOWED` under a
  new name.
- **RISK-03-02:** Building a synthetic `.pptx` in tests may drift from how the real builder emits
  text frames, making the test pass while the real path breaks. *Mitigation:* the negative control
  (real deck → `PARITY PASS`) runs in the same suite and catches that divergence.

### PHASE-04 - Give Every Generator a Home

**Goal**
A newcomer — the fresh-viewer volunteer, a collaborator, or the author in six months — can open the
repo and learn which script owns which of ~65 generated artifacts, and when to re-run it. Today
that knowledge exists only in `NOTES.md` prose and the author's head, and the root holds 17 scripts
including duplicate `.py`/`.js` pairs doing the same job.

**Tasks**
- [ ] TASK-04-01: Create `tools/` and move the five living generators plus the two verifiers into
      it: `build_oct_teaching_deck.py`, `build_teaching_visuals.py`, `build_cfd_slide.py`,
      `build_worksheet_answer_docx.py`, `audit_teaching_deck.py`, `verify_deck_numbers.py`, and
      `compare_deck.py` (already created there in PHASE-02).
- [ ] TASK-04-02: Move the consumed one-offs to `tools/archive/` per ASM-010:
      `apply_corrections.py`, `apply_deck_corrections.py`, `apply_deck_corrections.js`,
      `verify_deck_app_parity.py`, `verify_deck_app_parity.js`, `build_callouts.py`,
      `build_policy_refresh.py`, `build_2026_from_ref.py`, `build_canonical_cases.py`,
      `inspect_pptx.py`, `build-deck.js`. Add `tools/archive/README.md` stating that nothing here is
      run by CI or by any documented workflow, and naming the sprint each script belongs to.
- [ ] TASK-04-03: Delete the root `node_modules/`, `package.json` and `package-lock.json` — they
      exist solely for the archived `build-deck.js`. `app/` has its own independent npm project.
      Verify first: `grep -rn "require\|import" build-deck.js | head` confirms its dependencies, and
      `git ls-files | grep -c "^node_modules/"` → `0` confirms the directory was never tracked.
- [ ] TASK-04-04: Fix every path reference broken by the moves. The scripts resolve paths relative
      to the **current working directory** (e.g. `DECK = os.path.join("ceba", "...")` in
      `verify_deck_numbers.py:20`), not to `__file__`, so they must either keep being invoked from
      the repo root or be updated to resolve against `Path(__file__).resolve().parent.parent`.
      **Adopt the latter** — it makes the scripts location-independent and removes a class of
      "works only from the root" bugs.
- [ ] TASK-04-05: Update every command reference to the new paths: `.github/workflows/ci.yml`,
      `NOTES.md`, `plans/2026-october-readiness-checklist.md`, `RESOURCES.md`,
      `facilitator/dppa-workshop-facilitator-guide.md`.
- [ ] TASK-04-06: Create the root `README.md` with the generator→artifact table (see below) — the
      missing map of this repo.
- [ ] TASK-04-07: Reconcile the docs that now contradict each other (brainstorm E2): `MISSION.md:5-7`
      still says the session is **July 2026** when it is October; `NOTES.md` describes "Workshop 1/2
      presets" as current, predating `workshop3` and teach mode. One editing pass; a doc that says
      two things says nothing.

**File Changes**
- `tools/*.py` (create, via `git mv`): the seven living scripts. Use `git mv` so history follows.
- `tools/archive/` (create): the eleven consumed one-offs + `README.md`.
- `README.md` (create): repo orientation + the generator→artifact table:

  | Generator | Produces | Re-run when |
  |---|---|---|
  | `app/scripts/export-spine.mjs` | `assets/teaching/spine-s1.json` | `settlement.js` or `default-scenarios.js` changes |
  | `app/scripts/export-sweep.mjs` | `assets/teaching/gate-sweep.json` | the engine or the gate thresholds change |
  | `tools/build_teaching_visuals.py` | `assets/teaching/*.png` (7 families × 3 langs) | the JSON packs or captions change |
  | `tools/build_cfd_slide.py` | `assets/cfd-s{1,2,3}-{en,vi,zh-cn}.{gif,mp4}` | scenario numbers change |
  | `tools/build_oct_teaching_deck.py` | `ceba/DPPA Presentation Oct 2026 To Teach.pptx`, `assets/teaching/deck-figures.json` | visuals, JSON packs or `TEXT` change |
  | `tools/build_worksheet_answer_docx.py` | `lessons/DPPA_Worksheets_and_Answers.docx` | scenario numbers change |
  | `app/scripts/record-teach-demos.mjs` | `assets/teaching/fallback/teach-m{1..6}.mp4` + posters | the app UI or teach steps change |
  | `tools/audit_teaching_deck.py` | *(verifier)* | CI, and before any deck hand-off |
  | `tools/verify_deck_numbers.py` | *(verifier)* | CI, and before any deck hand-off |
  | `tools/compare_deck.py` | *(verifier)* | CI |

- `.github/workflows/ci.yml` (modify): script paths.
- `NOTES.md`, `MISSION.md`, `RESOURCES.md`, `plans/2026-october-readiness-checklist.md`,
  `facilitator/dppa-workshop-facilitator-guide.md` (modify): paths + the TASK-04-07 reconciliation.
- Root `node_modules/`, `package.json`, `package-lock.json` (delete).

**Function Signatures**
- `repo_root() -> pathlib.Path` — added to each moved script; returns
  `Path(__file__).resolve().parent.parent`, the anchor for all artifact paths (TASK-04-04).

**Test Specs**
- Location independence: `cd /tmp && PYTHONPATH= py /full/path/to/repo/tools/verify_deck_numbers.py`
  → exits 0. (Today the equivalent invocation fails, because paths resolve against the cwd.)
- `PYTHONPATH= py -m unittest discover -s tools/tests -v` → still passes after the moves.
- `git log --follow tools/build_oct_teaching_deck.py | head -5` → shows pre-move history, proving
  `git mv` preserved it.
- Every command in the new `README.md` table is copy-paste runnable from the repo root.

**Dependencies**
- PHASE-03 (move the files once, after their contents have stopped changing).

**Exit Criteria**
- [ ] `ls *.py *.js 2>/dev/null | wc -l` at the repo root → `0`.
- [ ] CI is green with the new paths.
- [ ] `PYTHONPATH= py -m unittest discover -s tools/tests -v` passes.
- [ ] `README.md` exists and every command in it runs from a clean checkout.
- [ ] `grep -n "July 2026" MISSION.md` returns only historically-correct references (the July
      session that already happened), not the upcoming session.

**Phase Risks**
- **RISK-04-01:** A moved script silently breaks because a path reference was missed, and nothing
  notices until the October rebuild. *Mitigation:* PHASE-02's `deck-build` job now rebuilds the deck
  in CI, so a broken generator fails the build immediately. This is why PHASE-04 is sequenced after
  PHASE-02, not before.

### PHASE-05 - Localization Completion

**Goal**
Close the two localization defects at once: the deck builder that would emit English visuals under
`--lang vi` (ASM-007), and the English-only app that Vietnamese and Chinese CFOs actually hold.
Bundling them means the translated vocabulary is paid for **once** and the deck and the app use the
same word for "strike price" in front of the room.

**Tasks**
- [ ] TASK-05-01: Thread `lang` through every asset path in `build_oct_teaching_deck.py`. All 14
      references hardcode `-en` (lines 214, 226, 305, 306, 335, 343, 347, 350, 353, 354, 355, 358,
      364, 380) while `build(lang)` varies only `TEXT` and the output suffix. Add an `asset(name,
      lang, ext)` helper and route every reference through it.
- [ ] TASK-05-02: Add a build-time assertion that every resolved asset path exists, failing with the
      missing path named. Without this, a missing `m5-gate-heatmap-vi.png` would either crash
      obscurely inside python-pptx or silently produce a deck with a gap.
- [ ] TASK-05-03: Handle the assets that genuinely have no localized variant. `assets/cfd-s1-*.gif`
      uses the `zh-cn` code, not `zh` (ASM-008), and the fallback MP4s under
      `assets/teaching/fallback/` are language-neutral recordings. Map `zh → zh-cn` for the `cfd-s*`
      family specifically, and let language-neutral assets bypass `asset()`.
- [ ] TASK-05-04: **(human-only)** Translate the remaining `UNTRANSLATED` entries in
      `assets/teaching/terminology-map.json` (31 VI / 33 ZH as of the readiness checklist; note
      PHASE-01 may have added M5 entries). A qualified VI/ZH speaker does this — not a guess, not
      machine translation. `research/dppa-terminology-map.md` carries the already-sourced vocabulary
      to reuse.
- [ ] TASK-05-05: Create `app/src/i18n/strings.js` — an `en`/`vi`/`zh` string table whose VI/ZH
      values are populated **from the same terminology map**, so the app and the deck cannot drift
      apart vocabulary-wise.
- [ ] TASK-05-06: Add `?lang=vi|zh` handling to `app/src/main.js` (default `en`), and route the
      hardcoded English strings in `app/src/modules/ui.js` (lines 33-36, 356-359, 447, 463 and
      similar) and the scenario labels in `app/src/data/default-scenarios.js` through the string
      table. The surface is a few dozen strings plus chart legends.
- [ ] TASK-05-07: Add a Playwright e2e spec asserting `?lang=vi` renders Vietnamese labels and that
      the numbers are **identical** across languages — translation must never touch arithmetic.
- [ ] TASK-05-08: Build and verify all three deck languages.

**File Changes**
- `tools/build_oct_teaching_deck.py` (modify): `asset()` helper + the 14 call sites + existence
  assertion. The `TEXT` dict and slide layout stay as-is.
- `assets/teaching/terminology-map.json` (modify): `UNTRANSLATED` → real translations (human).
- `app/src/i18n/strings.js` (create): the string table.
- `app/src/i18n/strings.test.js` (create): completeness tests.
- `app/src/main.js` (modify): `?lang=` parsing + threading. Leave the existing `?teach=1` and
  `?present=1` flag handling alone.
- `app/src/modules/ui.js`, `app/src/data/default-scenarios.js` (modify): route strings through the
  table. **Do not touch any number, formula, or `settlement.js` call.**
- `app/e2e/i18n.spec.js` (create).
- `ceba/DPPA Presentation Oct 2026 To Teach vi.pptx`, `... zh.pptx` (create): generated.

**Function Signatures**
- `asset(name: str, lang: str, ext: str = "png") -> str` — the localized asset path
  (`assets/teaching/{name}-{lang}.{ext}`), raising `FileNotFoundError` naming the missing path if it
  does not exist.
- `t(key: string, lang: string = 'en') -> string` — the localized string; falls back to `en` and
  logs a console warning on a missing key, never throws (a missing label must not break a live demo
  in front of a room).
- `getLang() -> 'en' | 'vi' | 'zh'` — parses `?lang=` from `window.location.search`, defaulting to
  `'en'` for absent or unrecognized values.

**Test Specs**
- `asset("m5-gate-heatmap", "vi")` → `"assets/teaching/m5-gate-heatmap-vi.png"` (exists).
- `asset("m5-gate-heatmap", "xx")` → raises `FileNotFoundError` naming the path.
- **The ASM-007 regression test:** build with `--lang vi`, then assert **no** embedded image in the
  output resolves to a `-en` asset. This is the defect: today the vi deck would embed 14 English
  images while reporting success.
- `getLang()` with `?lang=vi` → `'vi'`; with `?lang=fr` → `'en'`; with no param → `'en'`.
- `t('scenarioLabel.higherLoad', 'vi')` → the Vietnamese label; `t('nonexistent.key', 'vi')` →
  returns the key's `en` value and warns, does not throw.
- String-table completeness: every key present in `en` is present in `vi` and `zh`, with no value
  equal to `'UNTRANSLATED'`.
- **The invariant that matters:** in `app/e2e/i18n.spec.js`, load `?lang=en` and `?lang=vi`, and
  assert the five-line-bill figures are byte-identical between them. Translation changes words, never
  arithmetic.
- `PYTHONPATH= py tools/verify_deck_numbers.py` against the vi and zh decks → exit 0 (figures are
  language-invariant).

**Dependencies**
- PHASE-04 (`tools/` paths).
- **TASK-05-04 is human-blocked.** TASK-05-01/02/03 (the deck asset fix) do **not** depend on it and
  should land first — they are pure code and are what make the eventual translated build correct.

**Exit Criteria**
- [ ] `PYTHONPATH= py tools/build_oct_teaching_deck.py --lang vi` succeeds and the ASM-007
      regression test confirms zero `-en` assets in the output.
- [ ] Same for `--lang zh`.
- [ ] `grep -c "UNTRANSLATED" assets/teaching/terminology-map.json` → `0`.
- [ ] `cd app && npm test && npm run e2e` pass, including `i18n.spec.js`.
- [ ] `PYTHONPATH= py tools/verify_deck_numbers.py` exits 0 against all three decks.

**Phase Risks**
- **RISK-05-01:** TASK-05-04 is human-blocked and sits on the late-September critical path; if the
  translator is unavailable the whole phase stalls. *Mitigation:* the code tasks are independent and
  land first, so the moment translations arrive the build is a fill-in-the-blanks pass. Ordering is
  deliberate.
- **RISK-05-02:** Vietnamese and Chinese strings are longer/wider than English and overflow the
  app's hand-rolled layout. *Mitigation:* the visual e2e suite (PHASE-02's now-blocking
  `e2e:visual`) catches layout regressions; add `?lang=vi` snapshots.
- **RISK-05-03:** The `zh` vs `zh-cn` split (ASM-008) causes a wrong-path lookup for the `cfd-s*`
  family. *Mitigation:* TASK-05-03 maps it explicitly; TASK-05-02's existence assertion turns any
  miss into a loud build failure rather than a silent gap.

### PHASE-06 - App Evolution: Shareable State and M6's Missing Demo

**Goal**
Close the last two gaps from the brainstorm: state that lives in the URL (making the QR work
already done far more valuable, and simplifying teach mode as a side effect), and a five-levers
sensitivity panel that finally gives Module 6 its own scripted app moment.

**Tasks**
- [ ] TASK-06-01: Encode app state in the query string: `?s=<scenarioId>&strike=<n>&fmp=<n>`. Parse
      on load, update on change via `history.replaceState` (not `pushState` — the presenter must not
      have to press Back 30 times after a demo).
- [ ] TASK-06-02: Refactor `app/src/data/teach-steps.js` so each step is defined **as a URL**.
      `app/src/modules/teach.js:6-15` currently pokes the DOM (`setControlValue` writing `el.value`
      then dispatching a synthetic `input` event, `selectScenario` calling `.click()`), which is
      fragile and couples teach mode to control IDs. With URL state, a step is a navigation.
- [ ] TASK-06-03: Generate per-module deep-link QR codes pointing at each module's exact app state,
      and place each on its module slide. The close slide's single root QR stays.
- [ ] TASK-06-04: Build the five-levers sensitivity panel — a tornado chart of bill delta per lever
      (strike ±50, FMP ±100, k/K_pp, fees, contract quantity), computed straight from
      `settlement.js`.
- [ ] TASK-06-05: Wire the panel into M6's slide as its app moment, and add a teach step for it
      (teach mode currently has six steps; M6's is the weakest).
- [ ] TASK-06-06: Add e2e coverage for URL state round-tripping and the sensitivity panel.

**File Changes**
- `app/src/modules/url-state.js` (create): encode/decode.
- `app/src/main.js` (modify): read URL state on load, write on change. Compose with PHASE-05's
  `?lang=` and the existing `?teach=1` / `?present=1` flags — all four must coexist.
- `app/src/data/teach-steps.js` (modify): steps become URLs.
- `app/src/modules/teach.js` (modify): replace DOM-poking with navigation.
- `app/src/modules/sensitivity.js` (create): the lever computation.
- `app/src/modules/ui.js` (modify): render the tornado panel.
- `tools/build_teaching_visuals.py` (modify): per-module QR generation.
- `tools/build_oct_teaching_deck.py` (modify): place per-module QRs.
- `app/e2e/url-state.spec.js`, `app/src/modules/sensitivity.test.js` (create).

**Function Signatures**
- `encodeState(state: { scenarioId: string, strikePrice: number, marketPrice: number }) -> string` —
  the query string (leading `?`), omitting values equal to the scenario's defaults so URLs stay
  short and readable.
- `decodeState(search: string) -> Partial<{ scenarioId, strikePrice, marketPrice }>` — parsed
  state; unknown or out-of-range params are ignored, never thrown on.
- `computeLevers(inputs: SettlementInputs) -> Array<{ id: string, label: string, deltaVnd: number, deltaPct: number }>` —
  each lever's effect on `cKh`, sorted by `|deltaVnd|` descending (tornado order).

**Test Specs**
- `encodeState({ scenarioId: 'workshop2', strikePrice: 1500, marketPrice: 1150 })` →
  `'?s=workshop2&strike=1500'` (`marketPrice` equals the scenario default and is omitted).
- `decodeState('?s=workshop2&strike=1500')` → `{ scenarioId: 'workshop2', strikePrice: 1500 }`
- `decodeState('?s=nonexistent')` → `{}` (unknown scenario ignored, app loads the default rather
  than crashing — a bad QR scan in a live room must never white-screen).
- `decodeState('?strike=abc')` → `{}` (non-numeric ignored).
- Round-trip: `decodeState(encodeState(s))` → `s` for every scenario in `scenarioOrder`.
- `computeLevers` at the S1 base case → returns exactly 5 levers, sorted by `|deltaVnd|` descending.
- Sign check: raising the strike by 50 VND/kWh **increases** `cKh` (the buyer pays more) → the
  `strike` lever's `deltaVnd` is positive. *(This is the exact class of error the deck-corrections
  sprint had to fix once already — commit `6154331`, "P0 inverted savings".)*
- Zero check: a lever with no effect in the current scenario → `deltaVnd === 0`, and it still appears
  in the list (a lever that does nothing here is itself the teaching point).
- E2E: load `?s=workshop2&strike=1500`, assert the strike control reads 1500 and the bill matches a
  manual `settlement.js` computation.

**Dependencies**
- PHASE-05 (`?lang=` must already compose with the other params).

**Exit Criteria**
- [ ] Loading a deep link restores the exact app state.
- [ ] `app/src/data/teach-steps.js` defines steps as URLs; `teach.js` no longer calls
      `setControlValue` or `selectScenario`.
- [ ] Each module slide carries a QR that lands on that module's app state.
- [ ] The sensitivity panel renders 5 levers and updates live with the controls.
- [ ] `cd app && npm test && npm run e2e` pass.
- [ ] `cd app && npm run lint` passes.

**Phase Risks**
- **RISK-06-01:** Rewriting teach mode risks the presenter's most-rehearsed path weeks before the
  session. *Mitigation:* PHASE-06 is post-freeze and last for exactly this reason. If the calendar
  tightens, ship TASK-06-04/05 (the sensitivity panel — additive, low risk) and defer TASK-06-02 (the
  teach refactor) until after October. The refactor is a maintainability win, not a session need.
- **RISK-06-02:** Per-module QRs encode a deployed URL; if the app is not deployed (the Firebase
  deploy is still a human-only checklist item, and `ci.yml:62-75` has the deploy job commented out
  pending credentials), every QR points at a stale build. *Mitigation:* generate QRs against
  `https://dppa-case.web.app` and make the deploy a hard prerequisite in the readiness checklist
  before printing anything.

## Gotchas

- **The pass count must never be hardcoded anywhere, in any language.** It is `passCount` in
  `gate-sweep.json`. The grid size must never be hardcoded either — that is the bug PHASE-01 fixes
  (14 literal `56`s against a dynamic `passCount`). If you find yourself typing a number that the
  engine could compute, stop.
- **`export-spine.mjs` and `export-sweep.mjs` write to the repo root, not `app/`.** They are run
  from `app/` but their output path is `../../assets/teaching/`. The `deck-parity` CI job
  `git diff --exit-code`s exactly those two paths.
- **`settlement.js` imports must carry the `.js` extension.** Vite tolerates `from './profiles'`;
  plain Node ESM does not, and the `scripts/export-*.mjs` runners are plain Node. This exact bug was
  found and fixed during the gate-sweep work (`NOTES.md`, PHASE-03 notes). Do not "tidy" extensions
  away.
- **`npm install`, never `npm ci`.** The lockfile has optional-native-binary drift (`@emnapi/core`);
  `ci.yml:18-22` documents the decision. A well-meaning "fix" to `npm ci` will break CI.
- **VND millions vs VND.** `vndMillionsRounded` fields are what appear on slides (`9,063`); `Vnd`
  fields are raw (`9063196000`). The anchor check compares raw. Mixing them by a factor of 10⁶ is
  the single easiest catastrophic error in this repo.
- **The lender gate's threshold is `FMP × DSCR`, not a free constant** after PHASE-01. Changing
  `FMP1` therefore moves the lender gate. That is intentional and correct — debt service scales with
  the revenue base — but it is a non-obvious coupling.
- **`audit_teaching_deck.py`'s `EXEMPT_TITLES` matches on the exact title string.** Rewording an
  exempt slide's title silently re-imposes the 30-word budget on it and fails CI with a confusing
  message.
- **Speaker notes are exempt from the word budget and intentionally carry exact answer-key
  numbers.** `verify_deck_numbers.py` reads slide **bodies** only. Do not "helpfully" extend it to
  notes — you will flood it with the answer key.
- **`build(lang)` currently varies only text and the output filename.** Every asset is hardcoded
  `-en` (ASM-007). Until PHASE-05, treat any `--lang vi|zh` build output as English-visual and do not
  hand it to a reviewer as a translation sample.
- **Language codes are inconsistent by design**: `en|vi|zh` in deck/visuals/terminology-map,
  `en|vi|zh-cn` in lesson HTML and the `cfd-s*` assets, `nameVi`/`nameZh` in the spine. Normalizing
  them is out of scope and would break committed filenames.
- **Generated artifacts are committed.** A regeneration diff is expected and correct — that is what
  the CI gates check. Do not add them to `.gitignore`.
- **The `PYTHONPATH= ` prefix in documented commands is deliberate** (a stale `PYTHONPATH` on the
  author's Windows machine shadows imports). Harmless elsewhere; leave it in.
- **`app/eslint.config.js:6` ignores `scripts/**`.** Everything under `app/scripts/` —
  `export-sweep.mjs`, `export-spine.mjs`, `record-teach-demos.mjs` — is unlinted, so `npm run lint`
  passing tells you nothing about those files. Match style by hand there, and do not read a green
  lint as coverage.
- **Do not tune the gate constants to make the headline prettier.** ASM-002 fixes them pending real
  Allotrope deal data. The band exists so the answer can be honest about its own uncertainty; a
  hand-tuned threshold would recreate the exact problem this plan is correcting, one layer deeper.

## Verification Strategy

- **TEST-001:** `cd app && npx vitest run scripts/export-sweep.test.js` → all pass, including the
  subsumption invariant and the "passing cells span ≥2 strike columns" regression.
- **TEST-002:** `cd app && node scripts/export-sweep.mjs` → prints the anchor check passing and
  `passCount: <n> / 70`; `git diff --stat assets/teaching/gate-sweep.json` shows the regenerated
  pack.
- **TEST-003:** `grep -rn "of 56\|/ 56\|56 scenarios\|56 kịch bản\|56种情景" tools/ build_*.py 2>/dev/null`
  → no matches (PHASE-01 exit gate; adjust the path after the PHASE-04 move).
- **TEST-004:** `py -m venv /tmp/vtest && /tmp/vtest/bin/pip install -r requirements.txt && PYTHONPATH= /tmp/vtest/bin/python tools/build_teaching_visuals.py --lang en`
  → completes, writing the seven EN visual families. Proves a clean machine can rebuild.
- **TEST-005:** `PYTHONPATH= py tools/compare_deck.py` → exit 0, `DECK MATCHES GENERATOR`.
- **TEST-006:** Planted-failure drill (PHASE-02): change one word in `TEXT["en"]["m1_title"]`, run
  `tools/compare_deck.py` → exit 1 naming slide 1. **Revert the change.** A gate never seen failing
  is not known to work.
- **TEST-007:** `PYTHONPATH= py -m unittest discover -s tools/tests -v` → all pass, including the
  planted slide-swap that the current verifier misses.
- **TEST-008:** `PYTHONPATH= py tools/audit_teaching_deck.py && PYTHONPATH= py tools/verify_deck_numbers.py`
  → both exit 0, `PASS` and `PARITY PASS`.
- **TEST-009:** `cd /tmp && PYTHONPATH= py $REPO/tools/verify_deck_numbers.py` → exit 0 (location
  independence, PHASE-04).
- **TEST-010:** `cd app && npm run lint && npm test && npm run e2e && npm run e2e:visual` → all pass
  with no `continue-on-error` in the workflow.
- **TEST-011:** `PYTHONPATH= py tools/build_oct_teaching_deck.py --lang vi` → succeeds; the ASM-007
  regression test reports zero `-en` assets embedded.
- **TEST-012:** `grep -c "UNTRANSLATED" assets/teaching/terminology-map.json` → `0` (PHASE-05 exit).
- **TEST-013:** `cd app && npm run build` → succeeds; bundle size stays within ~10% of the current
  ~255 kB (i18n adds strings, not libraries).
- **MANUAL-001:** After PHASE-01, read the rebuilt M5 slides aloud and answer, from the slide alone:
  "where does 1,450 come from?" If the slide does not answer it, the provenance footnote has failed
  its purpose.
- **MANUAL-002:** After PHASE-01, confirm the new central pass count still supports M5's teaching
  point (a *narrow* window). If it does not (RISK-01-01), report the band as the headline instead —
  and do not adjust the constants to force it.
- **MANUAL-003:** After PHASE-05, a native VI and a native ZH speaker each confirm the deck and the
  app use the **same** word for each key term. Vocabulary drift between the two is the specific
  failure bundling them is meant to prevent.
- **MANUAL-004:** After PHASE-01, re-run the timed dry-run for M5 only — the reveal's wording
  changed, and the presenter has rehearsed "5 of 56".
- **OBS-001:** After each phase, `git status --porcelain` should show only intended changes.
  Regenerated artifacts appearing unexpectedly mean a generator is non-deterministic in a way the
  CI gates will trip on.

## Risks and Alternatives

- **RISK-001:** PHASE-01 changes a headline the presenter has rehearsed, weeks before a session
  whose date is unconfirmed (ASM-005). *Mitigation:* PHASE-01 is first and pre-freeze precisely so
  the change lands before rehearsal hardens. If the session date lands earlier than October 1,
  PHASE-01 still ships and PHASE-05/06 defer.
- **RISK-002:** The pass count changing from "5 of 56" to a band may read as backpedalling to anyone
  who saw the earlier number. *Mitigation:* it is the opposite, and the framing should say so — the
  band is a *stronger* claim because it shows which assumptions move the answer and by how much. A
  lender who hears "5 of 56, and here is what moves it" trusts the presenter more than one who hears
  a bare number and then discovers the constants were guesses.
- **RISK-003:** This plan touches the deck's generation path repeatedly across six phases; a
  mid-sequence break could leave the deck unbuildable close to the session. *Mitigation:* PHASE-02's
  `deck-build` job makes a broken generator fail CI immediately rather than in October, which is why
  it precedes the reorganization in PHASE-04. Every phase's exit criteria include a clean deck build.
- **RISK-004:** ASM-001 (declaring the basis rather than levelising) could be judged wrong by a real
  project-finance reviewer. *Mitigation:* the basis is stated in `meta`, in code comments, and on the
  slide, so it is *inspectable and challengeable* rather than buried. That is the actual goal — a
  stated assumption a lender can argue with beats a hidden one they cannot see.
- **ALT-001:** *Levelise the strike against a discount rate* (the brainstorm's A3 option b). Rejected
  per ASM-001: at a ~10% nominal WACC, levelising a 4%-escalating strike inflates it ~32% (1,450 →
  ~1,914), passing every cell and flipping the headline for a notational reason. It would also
  require inventing a discount rate — a *third* unsourced constant, compounding the problem this plan
  exists to fix.
- **ALT-002:** *Delete the M5 heatmap and teach the gates qualitatively.* Rejected: M5's exercise is
  the session's success criterion (DEC-003), and the sweep is what connects the hand-computed
  worksheet to a lifetime view. The heatmap is the payoff for the exercise, not decoration.
- **ALT-003:** *Keep the 8-strike grid and note the clipping in a footnote.* Rejected: the clipping
  is not a caveat, it is the result. Every passing cell sits in the grid's last column because that
  column *is* the investor threshold; a footnote would document an artifact rather than remove it.
- **ALT-004:** *Byte-diff the rebuilt deck in CI* (the obvious reading of "regenerate and diff").
  Rejected per ASM-006: `.pptx` zips and matplotlib PNGs are not byte-reproducible, so the job would
  fail on every run and be disabled within a week — recreating the `e2e:visual` `continue-on-error`
  problem TASK-02-06 exists to clean up.
- **ALT-005:** *Do app i18n after the deck translation, as a separate project.* Rejected: it doubles
  the translator's work and invites the deck and app to use different words for the same term in
  front of the same room. Bundling is the whole point of PHASE-05.
- **ALT-006:** *Delete the archived one-off scripts outright rather than moving them to
  `tools/archive/`.* Rejected per ASM-010: git history preserves them either way, but an archive
  directory makes a mistaken judgement reversible without archaeology. The cost is one directory.

## Suggested Next Step

Execute **PHASE-01**. It is the only phase gated on a calendar deadline (content freeze, ASM-005:
2026-09-15) because it is the only one that changes slide text, and it is the phase that converts the
session's most challengeable claim into a defensible one. Its exit criteria are fully verifiable
before PHASE-02 begins.

Start with TASK-01-01 through TASK-01-07 (the sweep rework and its tests) and confirm the anchor
self-check at `export-sweep.mjs:110-118` still passes — that is the tripwire proving the buyer-gate
math was not disturbed. Then regenerate the visuals and deck (TASK-01-08 through TASK-01-13).

Expect the headline to move from "5 of 56" to roughly "12 of 70". That movement is the deliverable,
not a side effect: the old number was measuring where the grid stopped, not where the economics do.
