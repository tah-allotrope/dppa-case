---
title: "DPPA-Case: A Vacuous Guardrail, a Monolingual Integrity Apparatus, and an App That Argues Against Its Own Mission"
date: "2026-07-26"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze the project's current state, codebase, documentation and architecture; brainstorm improvements, features, refactors, architectural changes or optimizations that would take it to the next level"
slug: "localization-integrity-and-teaching-defaults"
builds_on:
  - "research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md"
  - "research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md"
  - "research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md"
  - "plans/2026-07-25-guardrail-integrity-and-localization-plan.md (2 of 6 phases executed: PHASE-01, PHASE-02)"
---

# Brainstorm: What a Fresh Pass Found on 2026-07-26

## 0. State of play (verified today by running things, not by reading docs)

| Fact | Evidence |
|---|---|
| Working tree clean; HEAD = `ef41484`; 99 commits total | `git status --porcelain` empty, `git log` |
| Unit tests green | `cd app && npm test` → **57 passed (8 files)**, 7.8 s |
| e2e green across all three projects | `npm run e2e` → **27 passed (45.3 s)**, chromium-desktop / webkit-mobile / chromium-tablet |
| Lint green | `npm run lint` → clean exit |
| Build clean | `npm run build` → 257.99 kB JS / **84.87 kB gzip**, 25.80 kB CSS, 243 ms |
| Deck/prose guards green | `check_retired_figures.py` PASS (42 files: 28 prose, **14 scripts**) · `verify_prose_figures.py` PASS (377 tokens / 28 files) |
| Human-blocked register green | all 5 items OK, nearest is H1 at **+20 d** |
| **Deploy freshness now PASSES locally** | `check_deploy_freshness.py` → `PASS (assets match local build; live marker 22bae59)` |
| Cache headers landed and are live | `curl -I /` → `Cache-Control: no-cache`; `/assets/index-D8mQ4Yxn.js` → `max-age=31536000, immutable` |
| `.git` packed | `git count-objects -vH` → `in-pack: 1296`, `packs: 1`, `size-pack: 134.89 MiB` (was 1,411 loose / 0 packs / 252 MB) |
| `background/` untracked | `git ls-files | grep -c '^background/'` → **0** |
| Prettier still fails | `npx prettier --check src e2e` → **26 files** |
| No visual baselines, no a11y test | `app/e2e/` has 6 specs, no `*-snapshots/` dir, zero `axe` hits |

**Calendar:** **67 days** to the assumed 2026-10-01 session · **51 days** to the 2026-09-15 content
freeze · **30 days** to H2 (translator engagement) · **20 days** to H1 (confirm date/venue, open
since 2026-07-04 and now the binding constraint on everything below it).

**PHASE-01 and PHASE-02 of the current plan were executed well.** Everything the last brainstorm
called out in its Themes A, D and H is genuinely closed: the marker is dirty-aware, the checker
compares artifact hashes instead of commit labels, the cache headers are live, `archive/` exists with
a careful README, the retired-figures scan now covers 14 generator scripts, and the repo is packed.
That is not the story of this pass. **The story is that four of the six phases were again not
executed — the fourth consecutive session with an un-burned tail — and that a fresh look at what
*was* built surfaces three problems none of the prior five brainstorms named.**

---

## Theme A — The weekly freshness job cannot fail. It has never compared anything. ⭐ act before 09:00 UTC tomorrow

`.github/workflows/freshness-checks.yml`'s `deploy-freshness` job:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
    with: { python-version: "3.12" }
  - run: python tools/check_deploy_freshness.py
```

There is **no Node setup and no `npm install`.** But the checker's first action (without
`--skip-build`) is `subprocess.run(["npm", "run", "build"], cwd="app")`
(`tools/check_deploy_freshness.py:83-95`). On a bare ubuntu runner `app/node_modules` does not
exist, so `vite` is not on the path, the build exits non-zero, `run_local_build()` returns `False`,
and the checker prints:

```
DEPLOY-FRESHNESS UNKNOWN: local build failed
```

…and **returns 0** (`:146-148`). No fetch happens. No hash comparison happens. The marker is never
read. The job goes green.

So the guardrail that exists specifically to answer "is the live site stale?" answers "yes, fine"
every Monday without looking. Its **first scheduled run is tomorrow, Monday 2026-07-27 09:00 UTC**,
and it will report a green that carries zero information.

The bitter detail: `tools/tests/test_check_deploy_freshness.py:178`
(`test_failed_local_build_is_unknown`) *asserts* this behaviour. The never-flake design rule is
correct for a laptop with a broken node_modules; it is exactly wrong for the only environment where
the check runs unattended. The test locks in the behaviour that makes the CI job inert, and the
suite passes, so nothing anywhere signals the problem.

**A1 — Give the job the environment its checker needs.** Add `actions/setup-node@v4` (node 24, npm
cache keyed on `app/package-lock.json`) plus `npm ci` in `app/`, mirroring `ci.yml`'s `deck-parity`
job. Five lines.

**A2 — Make UNKNOWN a failure where UNKNOWN is impossible.** Add `--strict` (or
`--require-build`): in strict mode, a failed build or an absent `dist/index.html` exits 1 instead of
0, because in CI those are configuration bugs, not transient flakes. Keep the lenient default for
local runs. Network unreachability should stay exit-0 even in strict mode — that one really is
transient. Extend `tools/tests/test_check_deploy_freshness.py` with the strict-mode cases; the
existing lenient assertions stay valid and become the documented contrast.

**A3 — Assert the workflow's own capability.** The deeper class of bug is "a checker scheduled in
an environment that cannot run it." One `- run: node --version && npm --version` guard step in the
job, or a tiny `tools/check_workflow_env.py`, makes the mismatch loud instead of silent. Cheap, and
it generalises to every future scheduled checker this repo adds.

**A4 — `--write-log` is never invoked anywhere.** `app/deployment.md:19-22` states the top row of
the Last Deploy table "is maintained automatically by `check_deploy_freshness.py --write-log` on
every verified-fresh check." No workflow and no npm script passes that flag — it ran once, by hand,
on 2026-07-25. The documentation describes an automation that does not exist, which is the same
class of unfalsifiable claim PHASE-01 set out to eliminate. Either wire `--write-log` into the
(fixed) scheduled job, or soften the wording to "run this command after each deploy."

---

## Theme B — The entire number-integrity apparatus stops at the language boundary ⭐ biggest structural risk, and the clock is 30 days

This repo's central invariant is stated everywhere: *every number is generated from the settlement
engine and never hand-typed downstream.* Four mechanisms enforce it — `verify_deck_numbers.py`,
`verify_prose_figures.py`, `check_retired_figures.py`, and the CI `git diff --exit-code` on the
spine/sweep exports. **All four are monolingual.** The next 30 days of scheduled work (H2: hire a
VI/ZH translator, due 2026-08-25) is precisely the work that crosses the boundary where they stop.

### B1. `verify_deck_numbers.py` is hard-wired to the English deck and to English typography

```python
DECK = os.path.join("ceba", "DPPA Presentation Oct 2026 To Teach.pptx")   # :21
NUMBER_PATTERN = re.compile(r"\d{1,3}(?:,\d{3})+")                        # :24
```

`build_oct_teaching_deck.py` writes `ceba/DPPA Presentation Oct 2026 To Teach {lang}.pptx`
(`:395`). The verifier will never open the vi or zh deck — no `--lang`, no glob, no argv path (it
ignores `sys.argv` entirely despite `audit_teaching_deck.py`'s docstring showing a path argument).
And even if pointed at them, the comma-only regex finds **nothing** in correctly-typeset Vietnamese
(`11.020`), so it would exit 0 having validated zero tokens — a vacuous pass, the same failure shape
as Theme A. The October checklist line "Re-run `verify_deck_numbers.py` against each language build"
is currently unexecutable.

### B2. `terminology-map.json` is a number-carrying artifact that **no guard scans**

The vi/zh build does not translate words inside a generated sentence — it **replaces the whole
sentence** from `terminology-map.json` (`build_oct_teaching_deck.py:98-152`). So a translated slide's
numbers are typed by hand, by a translator, into a JSON file. Look at what is already in there:

```json
"cold_open_body": {
  "en": "Today: 11,020 tr VND. With a DPPA: 9,063 tr VND. Where did the gap come from? …",
  "vi": "UNTRANSLATED", "zh": "UNTRANSLATED"
}
```

`11,020` and `9,063` are `spine-s1.json`'s `bauMonthlyVndMillionsRounded` and
`cKh.vndMillionsRounded` — frozen as literals in a file whose own `meta` admits the `en` entries are
"a snapshot for review only." When the engine moves, that snapshot goes stale silently, and the vi/zh
sentences the translator writes from it inherit the stale number.

And nothing scans it. `tools/retired_figures.json`'s `scan` is prose (`*.md`, `lessons/**/*.html`)
and `scanScripts` is `*.py`, `*.js`, `tools/*.py`, `app/scripts/*.mjs`. `verify_prose_figures.py`'s
`SCAN_PATTERNS` is the same prose list. **`assets/teaching/terminology-map.json` matches neither.**
64 entries (31 vi, 33 zh) are about to be filled in with numbers, in a file outside every guard.

*Fix:* add `assets/teaching/*.json` to both scan lists **before** the translator starts, and add a
generated-figure check specific to the map: for every entry whose `en` snapshot contains a
comma-grouped token, assert the token is in the canonical spine set — and better, stop storing
numbers in the map at all. Split each sentence into a translatable frame plus a `{numbers}`
placeholder the builder fills from the spine, so the translator never touches a figure and the vi/zh
decks inherit number-correctness by construction rather than by proofreading. That is the one change
that makes localization safe instead of merely gated.

### B3. A locale-typography defect is **already shipped** in a learner artifact

`lessons/0009-scenario-3-excess-vi.html:90` — a Vietnamese-language worksheet row:

```html
<code>5,000,000 × 1,100 × 1.026 × 1.008</code>    <td class="num">5,688,144,000</td>
```

Read by a Vietnamese reader using Vietnamese conventions (`.` groups thousands, `,` is the decimal
mark — verified: `Intl.NumberFormat('vi-VN').format(1427.35)` → `1.427,35`), that formula says
`1,100` = one point one, and `1.026 × 1.008` = **1026 × 1008**. The loss coefficients — the single
most confusable pair of numbers in the whole settlement — are printed in a form that reads as a
1000× error to the audience the file was made for. Line 46 repeats it in a summary card
(`k×K_pp = 1.0342` / `1.026 × 1.008`). The zh-cn lessons have the same shape (zh-CN happens to share
EN grouping, so those are merely un-localized, not ambiguous).

This is a *teaching-integrity* bug of exactly the class the guard apparatus was built to prevent,
sitting in a shipped file, invisible to every guard because the guards only see EN typography.

### B4. The prose guard's floor excludes every headline figure the deck actually shows

`verify_prose_figures.py`'s `TOKEN_RE = \d{1,3}(?:,\d{3}){2,}` requires **two or more** comma groups
(≥7 digits), and `_add_if_large` only admits canonical values `>= 1_000_000`. So the guard covers
`8,563,196,000` but is blind to `11,020`, `9,063`, `8,563`, `5,947`, `1,800`, `817`, `500`, `1,427`,
`2,204` — the *millions-rounded* figures that the deck displays and the presenter says out loud, and
which appear ~20 times in `facilitator/dppa-workshop-facilitator-guide.md` alone. A stale `9,063` in
the facilitator guide passes CI today. (The slide-side `verify_deck_numbers.py` does catch these,
because its regex accepts one group — so the coverage hole is prose-only, which is where the
presenter's script lives.) Lower the floor to a 4-digit-with-group token and expand the canonical
set with the `vndMillionsRounded` fields the spine already exports.

### B5. `formatters.js` is locale-hardcoded — this corrects ASM-4 of the 2026-07-25 brainstorm

`app/src/modules/formatters.js:11` calls `new Intl.NumberFormat('en-US', …)` unconditionally, for
every figure in the app. The prior brainstorm assumed per-locale number formatting was out of scope
because "VND grouping is identical across the three locales in question." That is **not true for
Vietnamese**: `9,063,456,789` (en-US / zh-CN) vs `9.063.456.789` (vi-VN). Any i18n phase that ships
translated labels around en-US numerals reproduces B3's ambiguity in the app, in front of the
audience that scanned the QR code. Locale-aware formatting belongs *in* the localization scope, not
adjacent to it — one parameter threaded through `formatMoney`/`formatNumber`, plus a decision (mine:
follow the UI locale, and state the convention once in the header) about which convention wins when
a Vietnamese slide and the app are side by side.

**Net:** B1–B5 mean the repo's proudest property — machine-checked number integrity — is a property
of the English artifacts only, and the schedule sends the project across that boundary in 30 days.
Fixing the guards *before* the translator is engaged costs a fraction of proofreading three decks
afterwards.

---

## Theme C — The app's default state demonstrates the opposite of MISSION.md's core claim ⭐ new, verified numerically

MISSION.md's second success criterion: *"I can explain **why a virtual DPPA is rarely a Year-1
discount** and where the value actually comes from (**EVN escalation vs a locked strike**)."*

The mechanism named there is an **escalation differential**. `app/src/data/default-scenarios.js`
ships:

```js
evnEscalation: 0.04,      // 4%/yr EVN tariff escalation
strikeEscalation: 0.04,   // 4%/yr strike escalation
```

Equal rates. Differential zero. The mechanism is switched off in the default state. I ran
`projectMultiYear` at the shipped defaults (`scenarioId: 'balanced'`, strike 2,000, FMP 1,427,
20-year horizon):

| strikeEscalation | crossover year | Year-1 savings | 20-yr lifetime savings |
|---|---|---|---|
| **0.04 (shipped default)** | **none** (`> 20 yr`) | −4,489 m | **−65,695 m VND** |
| 0.02 | year 14 | −4,489 m | +66,656 m |
| 0.00 (a genuinely locked strike) | **year 9** | −4,489 m | +170,430 m |

So a CFO who scans the QR code on the close slide lands on the app in its default state and reads
**"Crossover: > 20 yr"** and a **65.7 billion VND 20-year loss versus doing nothing.** The tool
built to make the case argues against it, out of the box, unattended, to the audience most likely to
open it alone after the session. And the one lever that turns that into "crossover year 9" is
sitting in the controls panel labelled "Strike escalation" with no indication that it is *the* lever.

Two aggravating details:

- **The teach-mode demo can't fail either way.** M4's step
  (`app/src/data/teach-steps.js`) selects `workshop1` and asks *"does the DPPA line ever cross below
  the BAU line?"* — at those settings the crossover is **year 1** regardless of escalation
  (verified: year 1 at both 0.04 and 0.00, Year-1 savings +8,439 m). The gate demo passes
  trivially, so it teaches nothing about the gate. The default scenario says "never," the teaching
  scenario says "always, immediately," and neither shows the interesting middle where the
  differential decides.
- **The differential is never displayed.** `ui.js:534-537` prints `EVN 4.0%/yr`, `Strike 4.0%/yr`,
  `FMP flat`, `Rep. day × 365` as four independent facts. The quantity that determines the entire
  crossover story — `evnEscalation − strikeEscalation` — appears nowhere.

**C1.** Change the shipped `strikeEscalation` default so the differential is non-zero and the
mechanism is visible on first load. My recommendation: **1.5–2%/yr**, which is both a defensible
negotiating assumption (a partially indexed strike) and produces a crossover inside the horizon
(year 14 at 2%). Note it as an assumption in `default-scenarios.js` with the same provenance-comment
discipline the neighbouring constants already have, and — per NOTES.md's regeneration rule — re-run
the spine and sweep exports, because this is an escalation-assumption change.

**C2.** Add a **"Escalation differential: +X.X%/yr"** pill to the multi-year params row, and a
one-click **"Locked strike"** preset (`strikeEscalation → 0`) beside it. That turns MISSION's
sentence into a two-second live demonstration: click, watch crossover jump from "> 20 yr" to
"year 9." This is the single highest-value 30-line change available in the app.

**C3.** Retarget teach-mode M4 at a configuration where the buyer gate is genuinely close, so the
step demonstrates a gate rather than announcing one.

**C4 (accept or fix, but decide).** `projectMultiYear` holds FMP flat for 20 years while
`export-sweep.mjs` escalates FMP at 4%/yr (`FMP_ESCALATION = 0.04`). Two artifacts in the same deck
— M4's crossover and M5's heatmap — assume different paths for the same variable, and the app's own
label ("FMP flat") advertises the assumption a lender will challenge first. Either align them or
state the divergence explicitly in the facilitator guide. Silence is the option that loses the room.

---

## Theme D — "5 of 56" is one column wide, and the column is an artifact of the grid

`assets/teaching/gate-sweep.json` decomposed:

| gate | passing cells / 56 | depends on |
|---|---|---|
| buyer | 52 | strike **and** ratio (real lifetime-cost comparison via `buildFiveLineBill`) |
| lender | 14 | **strike only** (`strike >= 1380`) |
| investor | **7** | **strike only** (`strike >= 1450`) |
| all three | **5** | — |

The 5 passing cells are `(1450, 0.7) (1450, 0.8) (1450, 0.9) (1450, 1.0) (1450, 1.1)` — **every one
of them in the single right-most strike column.** And `INVESTOR_LCOE_VND_PER_KWH = 1450` is *exactly*
`max(STRIKES)`. The heatmap is presented as a two-dimensional strike × volume feasibility map, but
two of its three gates are one-dimensional in strike, and the headline is decided by one constant
that happens to sit on the grid's boundary. Extend `STRIKES` by one step to 1,500 and the investor
column doubles; the punchline changes materially without a single modelling insight changing.

This matters because "5 of 56" is M5's punchline *and* M5's checkpoint question ("in the
56-scenario sweep, how many pass all three gates at once?"), and because the audience contains
lenders. The first question is "what's your investor threshold?" and the honest answer is currently
"a round number equal to the top of my x-axis."

**D1.** Extend `STRIKES` past the investor threshold (e.g. …1450, 1500, 1550) so the boundary is
interior to the grid and the result is a finding, not a clipping artifact. Re-run the sweep, re-render
the M5 heatmap, and — per the retirement rule in NOTES.md — add the superseded pass count to
`tools/retired_figures.json` in the same commit (the notes field already pre-writes the exact strings
to add).

**D2.** Make the ratio axis matter to more than one gate, or relabel it. A lender gate that is
DSCR-shaped in name but a flat per-kWh strike floor in code (`lenderPass = strike >= 1380`, with
`DSCR_TARGET` exported to metadata but never used in the comparison) will not survive a question. If
recalibration waits for H3 (real Allotrope deal data, due 2026-09-01), at minimum put the
one-dimensionality on the slide's own footnote rather than only in the JSON's `note` field.

**D3.** Print the decomposition on the facilitator guide's M5 page — "52 pass buyer, 14 lender, 7
investor, 5 all three" is a *better* teaching story than the bare 5, because it shows which gate
binds. Free: the numbers are already in the JSON.

---

## Theme E — Single-source-of-truth is a convention here, not a mechanism

The pipeline's integrity rests on CI diffing *generated JSON*. It does not check that the
generators agree on their inputs, and they don't share them.

**E1. `1.026 × 1.008` is defined independently in three runtime places.**
`app/src/main.js:107` (`lossFactorPrecise: 1.026 * 1.008`), `app/scripts/export-spine.mjs:13-14`,
`app/scripts/export-sweep.mjs:21-22` — plus a fallback `?? 1.008` buried in
`settlement.js:131`, a comment in `default-scenarios.js:165`, and four test files. `default-scenarios.js`
exports `lossFactor: 1.0342` but **not** the precise pair, so every consumer re-derives it. If the
Decree-57 coefficients are ever revised, the export scripts would regenerate self-consistently and
CI's `git diff --exit-code` would pass while the app disagreed with the deck. Export
`LOSS_FACTOR_K`, `LOSS_FACTOR_KPP`, and a derived `LOSS_FACTOR_PRECISE` from
`default-scenarios.js`, import them in all three, and delete the duplicates. ~20 minutes, and it
closes the one drift path the CI diff structurally cannot see.

**E2. A hand-typed formula string lives inside the "never hand-typed" export.**
`export-spine.mjs:149`: `spotFormulaText: '1,500,000 × 1.008 × 1,100'`. The adjacent
`spotValueVnd` is computed; the string is not. `verify_prose_figures.py:100` verifies
`generationKwh`, `excessKwh`, `spotValueVnd` — and skips `spotFormulaText`. That string is consumed
by `build_worksheet_answer_docx.py:174` and printed into the bilingual worksheet learners fill in.
Change S3's FMP and the printed formula silently lies while every gate stays green. Build it from the
same three values that produce `spotValueVnd`. (It is also the file that renders `1,100` into a
Vietnamese column — see B3.)

**E3. `EXCHANGE_RATE = 26500` is unsourced, undated, and locked by its own test.**
`formatters.js:1` sets it; `chart.js:345` divides by it; `formatters.test.js:6` asserts
`expect(EXCHANGE_RATE).toBe(26500)`. Every USD figure a CFO reads off the app — the currency toggle
is a headline feature — scales by one integer that has no provenance comment, no date, no entry in
`prose_figure_literals.json`, and no place in the retirement rule. It is the only load-bearing
number in the project outside the integrity apparatus, and the test that mentions it pins the stale
value rather than validating it. Minimum fix: a dated provenance comment in the house style the
neighbouring constants already use (`// Decision 599/QD-EVN, 10 May 2025 — …`), an
`EXCHANGE_RATE_AS_OF` date exported alongside it, and a one-line "USD at 26,500 VND (as of …)" note
in the app wherever USD is shown. Better: surface it as a control, so a challenge in the room is
answered by moving a slider.

---

## Theme F — Four of six phases un-executed, for the fourth consecutive session

`plans/2026-07-25-guardrail-integrity-and-localization-plan.md` has six phases. PHASE-01 and
PHASE-02 landed. Verified still open today:

| Phase | Scope | Evidence it did not run |
|---|---|---|
| **PHASE-03** | Trilingual app (`i18n.js`, `strings.js`, localized ui/teach/tour) | no `src/modules/i18n.js`; zero `lang` references in `src/` (`grep` finds only `URLSearchParams` for `teach`/`present`); `<html lang="en">` |
| **PHASE-04** | Service worker + Chart.js tree-shake | no `app/public/sw.js`; `chart.js:1` still `import Chart from 'chart.js/auto'`; gzip still 84.87 kB |
| **PHASE-05** | Visual baselines, a11y spec, coverage | no `*-snapshots/` dir; `e2e:visual` still `continue-on-error: true`; zero `axe` hits |
| **PHASE-06** | Prettier fix, `CLAUDE.md`, `learning-records/0005`, retire `activeContext.md` | prettier fails 26 files; **no root `CLAUDE.md`**; `learning-records/` ends at `0004`; `activeContext.md` last touched 2026-06-29 |

The last brainstorm named this pattern ("plan N phases, execute the two urgent ones, brainstorm
again") and it repeated in the very next session. Two observations worth acting on rather than
re-observing:

- **PHASE-03 is now schedule-critical, not merely valuable.** It must precede H2 (30 days) or the
  translator is briefed twice, and it must precede the 2026-09-15 freeze (51 days) or the
  English-only app is frozen in place. Theme B has also *grown* its scope (locale number formatting,
  B5; the map-as-number-carrier contract, B2), which argues for doing it now while the scope is
  merely large rather than later when it is large and rushed.
- **The tail should be explicitly re-scoped, not silently re-carried.** `learning-records/0005` has
  now been flagged by **five** consecutive brainstorms. Either it gets written or it gets deleted
  from the plan; a sixth flag is worth less than either decision. Same for
  `activeContext.md`, which the user's global workflow mandates keeping current and which has been
  27 days stale — the honest move is to archive it and record that `plans/` + `reports/` superseded
  it.

**F1 — the cheapest doc in the repo, still unwritten.** No root `CLAUDE.md`, in a repo that is
almost entirely agent-driven and full of hard-won non-obvious laws: `PYTHONPATH= py` on Windows;
`npm run predeploy` before any deploy; `git mv`, never `rm`; the strict spine→sweep→visuals→deck
regeneration order; add the retired value to `tools/retired_figures.json` **in the same commit**;
`--workers=1` for local visual snapshots; match the file's existing quote/semicolon style until the
prettier config is fixed. The user's global `CLAUDE.md` instructs "read `CLAUDE.md` first on every
session to understand project laws" — and that instruction currently resolves to nothing. ~60 lines,
consolidating rules that already exist in `NOTES.md`, `app/README.md`, `app/deployment.md`, and six
Python docstrings.

---

## Theme G — Cheap items a fresh read surfaced

- **G1. Root `package.json:5` is dangling.** `"main": "build-deck.js"` — PHASE-02 `git mv`d that
  file to `archive/build-deck.js`. The root Node install (7.5 MB `node_modules`, `pptxgenjs`) now
  exists solely for an archived script. Retire both, or point `main` at nothing and say why.
- **G2. Three names for one app.** `<title>Vietnam DPPA **Neon** CFO Calculator`
  (`index.html:20`), `og:title` "Vietnam DPPA CFO Calculator" (`:8`), `<h1>` "DPPA CFO visual
  explainer" (`ui.js:189`). "Neon" is an internal codename that will be projected on the browser tab
  in front of the room and is the tab title for every QR-code scan. Pick one name; the link-preview
  card and the tab should agree.
- **G3. The hero paragraph ships a caveat as its headline.** `ui.js:190` opens with
  "…using documented example inputs and an illustrative FMP curve (no primary NSMO/ERAV source
  available)." Honesty is right and `RESOURCES.md` earns it — but a parenthetical negative source
  claim is the wrong first sentence for a CFO landing from a QR code. Move it to the assumptions
  row, keep the hero about what the tool shows.
- **G4. The guided tour auto-starts, is EN+VI simultaneously, and has no Chinese.**
  `tour.js` shows `titleEn`/`titleVi` stacked for all four steps, `shouldAutoStartTour` fires it on
  first visit, and `tour-steps.js` has no `zh` field at all. So a first-time Chinese-speaking
  attendee gets a modal in two languages, neither of them theirs. It is also a `role="dialog"
  aria-modal="true"` with no focus trap and no Escape handler.
- **G5. Prettier is still a loaded gun.** `app/.prettierrc` (`semi: true, singleQuote: false`)
  contradicts the dominant style of `settlement.js`/`ui.js`/`main.js`/`chart.js`; `npm run format`
  today rewrites the engine in one unreviewable diff. 26 files fail `--check`. Flip the config to
  match reality, then run it once. Unchanged since 07-25.
- **G6. Five files are single-line minified**, including `e2e/visual.spec.js` (2 lines containing a
  nested loop) — the exact file PHASE-05 must edit to bootstrap baselines — and `e2e/tour.spec.js`
  (3 lines). `eslint.config.js` also **ignores `scripts/**`**, leaving the three scripts that
  generate CI-verified JSON as the only unlinted JS in the app.
- **G7. 21 extensionless imports** persist across `main.js`, `ui.js`, `chart.js`, `flow-diagram.js`,
  `teach.js`, `tour.js` and the tests, kept alive by `scripts/js-resolve-loader.mjs`, while
  `settlement.js` uses explicit `./profiles.js` because plain Node ESM required it. One mechanical
  pass retires the shim and the bug class.
- **G8. Eight stale `*.log` files** in `app/`, oldest ~3 months. Gitignored, harmless, still debris.
- **G9. 11 MB of duplicated animation.** 12 `.gif`/`.mp4` pairs of the same charts in `assets/`,
  GIFs ~4.5× larger. `build_cfd_slide.py` regenerates both; if nothing consumes the GIFs anymore
  (the deck builder falls back to `.gif` only when the `.mp4` is missing), they are the largest
  remaining cheap reduction now that `.git` is packed.

---

## Theme H — Ideas that would genuinely raise the ceiling

Ordered by my estimate of value-per-hour **for the October session**.

**H1 (new). A presenter rehearsal harness — the missing measurement of the actual mission.**
MISSION.md defines success in terms of *the presenter's* mastery: draw the five-line bill from
memory, walk the three cases and three gates without notes, whiteboard each module in under five
minutes. The repo has built an extraordinary apparatus for producing *artifacts* and exactly nothing
for measuring *that*. `learning-records/` stopped at 0004 four weeks ago; `assets/quiz.js` exists but
only inside lesson HTML; the fresh-viewer kit measures the audience, not the presenter. A small
`tools/rehearse.py` (or a single self-contained HTML page) that generates timed retrieval drills
**from `spine-s{1,2,3}.json` and `gate-sweep.json`** — "state line 3 for S2", "what's C_KH for S1",
"which gate binds at strike 1,300", with a 5-minute whiteboard timer per module and an append-only
log of attempts — costs an hour, cannot drift from the numbers by construction, and is the only
artifact that would measure the thing the whole project is for. With 67 days left and no rehearsal
scheduled until "mid-September," this is the gap I would close first if the guardrails were green.

**H2. Make the app work with the venue wifi off — a service worker.** Carried (PHASE-04). The
single most-repeated risk in the repo; the entire ~6 MB six-MP4 fallback apparatus exists as
insurance against it; the app's whole payload is **340 kB**. ~30 lines of precache means load it once
at the hotel and it runs at the venue offline — on the presenter's laptop *and* on every attendee
phone that scanned the QR before the room's bandwidth collapsed. Now unblocked: PHASE-01's
`no-cache` on `index.html` and `immutable` on `/assets/**` are live, which is exactly the header
pair a service worker needs.

**H3. Encode scenario state in the URL.** Carried. The presenter cannot say "open this exact bill
on your phone"; the fresh-viewer kit cannot specify a reproducible starting state; the deck's six
fallback slides cannot deep-link their app moment. ~40 lines to serialize the eight numeric inputs.
**New angle:** it is also the delivery mechanism for Theme C — a `?strikeEsc=0` link *is* the
"locked strike" demo, and the deck can carry it as a QR code.

**H4. Presenter crib cards generated from the deck's own speaker notes.** Carried unchanged from
07-17/07-21/07-25. `python-pptx` extraction already exists in `audit_teaching_deck.py`; the artifact
cannot drift from the deck by construction. Pairs naturally with H1.

**H5. Name the pipeline as a product.** Carried from 07-21/07-25. *Settlement engine → JSON spine
exports → deck builder → prose verifier → gate-sweep credibility check → trilingual terminology gate
→ freshness guardrails* is an Allotrope capability, not a one-workshop deck; the next case study
costs "swap the engine and the terminology map." It is currently legible only by reading eight
`plans/*.md`. A short `docs/pipeline-architecture.md` is also the natural home for Theme B2's
"numbers never enter the translation layer" contract — the stage the pipeline is missing.

**H6. July-vs-October A/B evidence report.** Carried from 07-17/07-21/07-25. Words, symbols and
visuals per module across both decks (`ceba/DPPA Presentation July 2026 To Teach.pptx` vs the October
build), using tooling that exists. ~1 hour, and it is the only evidence the redesign worked that
does not depend on the single unscheduled fresh-viewer test (H5 in the human-blocked register).

---

## Recommended sequence

Grouped into coherent sessions, ordered by consequence-per-hour.

1. **Theme A — un-break the weekly guardrail (≈30 min).** Node + `npm ci` in
   `freshness-checks.yml`, `--strict` mode, strict-mode tests, decide `--write-log`. Do it **today**:
   the first scheduled run is tomorrow 09:00 UTC and will otherwise establish "green means nothing"
   as the baseline reading.
2. **Theme B — make the integrity apparatus multilingual, then PHASE-03 (one full session, possibly
   two).** In this order: add `assets/teaching/*.json` to both guard scans; convert
   `terminology-map.json` sentences to number-placeholder frames; teach `verify_deck_numbers.py`
   `--lang`/locale-aware regexes; lower `verify_prose_figures.py`'s floor; fix the VI typography in
   `lessons/0009-*-vi.html`; then execute PHASE-03 **with locale-aware `formatters.js` folded in**.
   This has a hard deadline: 30 days to H2, 51 to the freeze.
3. **Theme C — fix what the app teaches by default (≈1 h).** `strikeEscalation` default, the
   differential pill, the "Locked strike" preset, an M4 teach step that can fail. Highest
   teaching-value-per-line in the repo, and it is the state the QR code delivers.
4. **Theme D — make "5 of 56" survive a lender's question (≈1 h).** Extend `STRIKES` past the
   investor threshold, re-run the sweep, retire the old count in the same commit, put the
   per-gate decomposition in the facilitator guide.
5. **Theme E — turn the single-source convention into a mechanism (≈45 min).** Export the loss
   constants once; generate `spotFormulaText`; give `EXCHANGE_RATE` provenance.
6. **F1 — write `CLAUDE.md` (≈45 min).** Every later session gets cheaper; do it early.
7. **H1 — the presenter rehearsal harness (≈1 h).** The only artifact that measures MISSION's
   actual success criterion.
8. **PHASE-04 (service worker, H2) → PHASE-05 (real CI gates) → PHASE-06 (style + docs + records).**
   Fully specified in the existing plan; PHASE-06 needs PHASE-03 to land first.
9. **Theme G sweep (≈45 min).** Root `package.json`, app naming, hero copy, tour ZH + focus trap,
   prettier config, the five minified files, `scripts/**` linting, extensionless imports, stale
   logs, GIF duplicates.
10. **H3 → H5 → H4 → H6** opportunistically, post-freeze.

---

## Assumptions adopted (unattended run — no questions asked, per brief)

- **ASM-1 — Analysis only; nothing was changed.** No file edited, no deploy run, no workflow
  touched. Theme A's fix alters CI behaviour, Theme C's alters what the public app shows, and Theme
  D's changes a headline figure in a shipped deck — all three are surfaced for a decision, not taken
  silently, consistent with this repo's standing practice.
- **ASM-2 — Theme A's conclusion is inferred from the workflow definition plus the checker's code
  path, not from an observed CI run.** `freshness-checks.yml` installs Python only; the checker
  shells out to `npm run build`; no `app/node_modules` exists on a fresh runner; the code returns 0
  on build failure (`:146-148`) and a unit test asserts that behaviour. I did not have a Monday run
  to read. If ubuntu-latest's preinstalled Node somehow satisfied the build without `node_modules`,
  the conclusion would weaken — but `vite` is a devDependency, so it cannot.
- **ASM-3 — Theme C's numbers are direct observations**, computed by importing the shipped
  `projectMultiYear` and `defaultInputs` and running them (three escalation settings, plus
  `workshop1`). The interpretation — that this contradicts MISSION.md's stated mechanism — is my
  judgement, not a measurement. A defensible counter-reading is that the multi-year panel is a
  sensitivity toy meant to be driven by the presenter; I weight the unattended QR-code visitor more
  heavily, and note that neither reading makes "> 20 yr / −65.7 bn" a good default first impression.
- **ASM-4 — Theme C1's recommended 1.5–2%/yr strike escalation is my choice, not a sourced
  figure.** It is adopted here (per the brief) as the option I would have recommended: non-zero so
  the mechanism shows, below EVN's 4% so a crossover exists inside the horizon, and defensible as a
  partially-indexed strike. A real negotiated index should replace it, and doing so requires the
  full regeneration chain in NOTES.md because it is an escalation-assumption change.
- **ASM-5 — This brainstorm corrects ASM-4 of the 2026-07-25 brainstorm** ("VND grouping is
  identical across the three locales"). Verified false for `vi-VN` via `Intl.NumberFormat`. Per-locale
  number formatting is therefore treated here as *inside* the localization scope, which makes
  PHASE-03 larger than that plan estimated.
- **ASM-6 — The 2026-10-01 session date remains unconfirmed** (H1, open since 2026-07-04, now
  20 days from its own deadline). Every interval here is computed from it and moves with it. At 67
  days out with a 30-day translator deadline, H1 is the schedule's binding constraint.
- **ASM-7 — Theme D's "grid artifact" claim is structural, not a re-derivation of the sweep.** I
  read the committed `gate-sweep.json` and counted per-gate passes; I did not re-run
  `export-sweep.mjs` with an extended `STRIKES` array to confirm how much the pass count would move.
  The claim made is only that `INVESTOR_LCOE_VND_PER_KWH == max(STRIKES)` and that all 5 passing
  cells lie in that column — both directly observed.
- **ASM-8 — "The B3 typography defect is a real defect" assumes the VI lessons are read by
  Vietnamese-convention readers.** If the intended audience reads EN-convention numerals (plausible
  for finance professionals in Vietnam, who often work in English), the severity drops from "wrong
  by 1000×" to "inconsistent." I have not assumed that, because the file exists specifically to
  serve readers who need Vietnamese.
