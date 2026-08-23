---
title: "DPPA-Case: Nothing Moved in a Week, and the Largest Change in the Repo Is Invisible to Every Tracking Mechanism It Has"
date: "2026-08-22"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze this project's current state, codebase, documentation and architecture; brainstorm what improvements, features, refactors, architectural changes or optimizations would take it to the next level. Unattended run — no questions, adopt the recommended option and note the assumption."
slug: "delivery-stall-and-in-flight-redesign"
builds_on:
  - "research/2026-08-15-deploy-drift-and-unverifiable-status-brainstorm.md (all themes re-verified today; none actioned)"
  - "research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md"
  - "research/2026-07-16-post-hardening-next-level-brainstorm.md"
---

# Brainstorm: What a Fresh Pass Found on 2026-08-22

## 0. State of play — verified today by running things, not by reading docs

| Fact | Evidence |
|---|---|
| HEAD = `3636705`, master, **last commit 2026-08-10 (12 days ago)** | `git log -1 --date=iso` |
| **Working tree dirty: 11 modified files, +1,177 / −782** | `git diff --numstat` |
| **Local master is 3 commits AHEAD of `origin/master`** | `git rev-list --left-right --count origin/master...master` → `0  3` |
| **Last CI run of `app-quality`: 2026-08-02** | `gh run list` — the three unpushed commits have never been CI-verified |
| **Live app still stale, 28 days** | `check_deploy_freshness.py --skip-build` → `STALE`, live marker `22bae59` (2026-07-25) |
| Unit tests green | `npm test` → **73 passed (9 files)**, 12.8 s |
| Lint green · prettier green (on its scoped paths) | `npm run lint`; `npx prettier --check src e2e scripts` |
| **Coverage gate FAILS on the working tree** | `npm run coverage` → branches **69.82%** vs threshold **71%** → `ERROR` |
| Prose/figure guards green | `check_retired_figures.py` PASS (42 files) · `verify_prose_figures.py` PASS (377 tokens / 28 files) |
| Deck audits green | `audit_teaching_deck.py` PASS (27 slides) · `verify_deck_numbers.py` PARITY PASS (**5 figures**) |
| Human-blocked register **red and worse** | H1 and H6 now **OVERDUE −7d**; H2 (translator) **+3d** |
| Translation surface **grew again** | app: vi **140**/151 · zh **148**/151 `UNTRANSLATED`; `terminology-map.json` 64/156 → **352 units outstanding** |
| **No visual baselines have ever been committed, on any platform** | `git log -- app/e2e/visual.spec.js-snapshots` is empty; the 24 local `-win32.png` files are untracked |
| The in-flight redesign **works** | headless probe of the running dev server: 4 canvases render, **0 console errors**, no `NaN` in either currency |

**Calendar:** **40 days** to the assumed 2026-10-01 session · **24 days** to the 2026-09-15 content
freeze · **3 days** to H2 (translator) · H1 and H6 overdue by a week.

Last week's pass ended with a nine-item recommended sequence whose first line was *"Deploy, then make
the deploy guard able to fail (≈45 min, do first)."* **None of the nine happened.** What happened
instead was a large, competent, unrecorded UI redesign that is sitting in the working tree.

That is the story of this pass, and it is not the same story as last week's. Last week the finding
was *"work ships to master and doesn't reach the audience."* This week the finding is that the repo
has a **three-stage delivery pipeline — commit, push, deploy — and all three stages are stalled at
once**, while the project's entire guard apparatus measures the correctness of *content* and not one
byte of *propagation*.

---

## Theme A — The delivery pipeline is stalled at all three stages simultaneously ⭐ highest consequence

Three distinct gaps, each independently verified, compounding:

| Stage | Gap | Age | What is stuck there |
|---|---|---|---|
| **1. Commit** | 11 modified files, +1,177/−782, 2 untracked artifacts | today | The chart/legibility redesign: FMP strip chart, savings strip, direct line-end labels, crossover marker, tariff caption, collapsible derivations, topbar restructure |
| **2. Push** | 3 commits ahead of `origin/master` | 12 days | `12c9209` plan triage · `1497755` explicit `.js` extensions + shim deletion · `3636705` **the CI prettier gate itself**, eslint scripts coverage, and `CLAUDE.md` |
| **3. Deploy** | live marker `22bae59` | 28 days | **14 commits** (11 of them on GitHub): the whole trilingual mechanism, **the offline service worker**, the Chart.js tree-shake |

Read the middle row again. `3636705` is *"phase-6: CI prettier gate"* — **the commit that adds a CI
gate has never run in CI**, because it has never been pushed. The same commit rewrote `CLAUDE.md`
into the repo's authoritative entry point; the copy on GitHub is the old one. A second machine, a
cloud agent, or a collaborator cloning `origin/master` today gets a repo whose rules file predates
the rules.

Consequences that are not obvious from any one gap alone:

- **The three unpushed commits exist on exactly one Windows laptop.** No off-machine copy. The
  repo's proudest property is that its numbers cannot silently drift; its actual single point of
  failure is a hard drive.
- **`1497755` is the extensionless-import fix.** `CLAUDE.md` §3 documents that rule at length and
  warns that reintroducing an extensionless import breaks `node scripts/export-*.mjs`. The rule is
  documented in a file that only exists locally, enforced by nothing on the remote, and the CI job
  that would catch a regression (`deck-parity` runs the exporters) has not seen the fixed tree.
- **The stale-deploy guard's Monday run confirmed the diagnosis in production.** From the
  2026-08-17 scheduled run's log:

  ```
  deploy-freshness   python tools/check_deploy_freshness.py
  DEPLOY-FRESHNESS UNKNOWN: local build failed
  ```

  Exit 0. Job green ✓. The site was three weeks stale at that moment. This is the third consecutive
  Monday (`08-03`, `08-10`, `08-17`) that the job reported success while the condition it exists to
  detect was true. Last week this was an inference from reading `ci.yml`; it is now a log line.

**A1 — Push, then deploy, then log.** `git push origin master` (CI will run for the first time in
20 days, on a tree whose coverage gate currently fails — fix Theme B1 first), then
`cd app && npm run predeploy && npx firebase deploy --only hosting --project dppa-case`, then
`py tools/check_deploy_freshness.py --write-log`. *Not taken in this unattended session — see ASM-2.*

**A2 — Build the guard class the repo is missing: a propagation check.** Every existing guard
answers *"is this number right?"* None answers *"did this reach anyone?"* A
`tools/check_delivery_pipeline.py` that prints and gates three integers —

```
uncommitted files:     11   (threshold: 0 warn / fail after N days)
unpushed commits:       3   (oldest 2026-08-10, 12 days)
undeployed commits:    14   (live marker 22bae59, 2026-07-25, 28 days)
```

— is ~60 lines of `git` plumbing plus the deploy-marker fetch `check_deploy_freshness.py` already
implements. Wire it into the Monday job **and** print it at the end of every session. It is the
single artifact that would have caught this state on 2026-08-11 instead of 2026-08-22, and it
generalizes: it will catch the next stall too.

**A3 — Fix the Monday job's environment (carried, B1 of 2026-08-15, five lines).**
`freshness-checks.yml`'s `deploy-freshness` job still has no `setup-node` and no `npm install`, so
`check_deploy_freshness.py`'s first action — `npm run build` in `app/` — cannot succeed, and the
checker's lenient `UNKNOWN → exit 0` path fires every time. Add `actions/setup-node@v4` + `npm
install` mirroring `deck-parity`, and add a `--strict` mode that exits 1 on a failed build in CI
while keeping the lenient default for laptops.

**A4 — Give the register checker a way to be quiet about known slips (carried, B3).**
`check_human_blocked_register.py` has failed every Monday since 2026-08-03 and will fail every
Monday through October, because H1/H6 are overdue and no coding session can resolve them. One job
that cannot fail and one that cannot pass: the weekly notification carries zero bits. An
`--acknowledged-through DATE` column, or a distinct exit code for *known* vs *new* slippage, makes
the alarm mean something again.

---

## Theme B — The in-flight redesign: good work, four blockers, and no record anywhere ⭐ new

I probed it headless against the running dev server. It renders: four canvases (`profileChart`,
`fmpStrip`, `multiYearChart`, `savingsStrip`), **zero console errors**, no `NaN` in VND or USD, and
the new tariff caption reads correctly (`Off-peak 970–1,313 VND/kWh · Standard 1,027–1,855 · Peak
1,384–2,026`). The design direction is right and directly serves MISSION.md: the chart legend is
gone in favour of labels written at the line ends, and the horizontal cancellation equation with
stacked strikethroughs — *the exact symbol-overload pattern that lost the room in July* — is
replaced by a vertical net-first row with the term-by-term derivation behind a keyboard-accessible
`<details>`. That is the July failure being designed out, which is the highest-value thing anyone
could be doing to this app.

**It is also the largest change in the repo and no tracking mechanism knows it exists.** No entry in
`plans/`, no `research/` brief, no `reports/` artifact, no commit, no branch. `plans/` still reports
zero open forward work — while 1,177 lines of forward work sit uncommitted. Last week's Theme C said
the status metadata is *provably false*; this week it is also *provably incomplete*, in the other
direction.

Four concrete things stand between this tree and a commit.

### B1. The coverage gate fails right now

```
All files      |   78.06 |    69.82 |      80 |   78.44
ERROR: Coverage for branches (69.82%) does not meet global threshold (71%)
```

Measured branches were **71.39%** on 2026-08-15; the redesign consumed the entire margin and 1.57 pp
more. `ui.js` branch coverage is down to **53.93%**. Committing as-is turns the first CI run in 20
days red.

**And the denominator is a bigger problem than the number.** `coverage-summary.json` contains
**13 files**. `src/modules/chart.js` (652 lines) and `src/main.js` (309 lines) are **not among them** —
no test imports either, so v8 never instruments them and they are silently absent from the ratio.
That is ~961 of ~2,300 source lines, **~42% of the app's JavaScript, outside the coverage number
entirely** — including the one module this redesign rewrote. "78% coverage" describes only the files
the tests already touch. Fix in this order: (a) set `coverage.all: true` (or an explicit `include`)
so the denominator is the source tree, (b) re-baseline the ratchet honestly from that measurement,
(c) add a **per-file** threshold for `settlement.js`, the file every number on every slide descends
from, currently at 75.18% branch under a global gate that cannot see it.

### B2. A real bug: the strike reference line silently disappears in USD

`chart.js:36` now declares `const profileChartState = { inputs: null }` — the `currency` property
was removed in this same change. `chart.js:415` still reads it:

```js
const y = chart.scales.y.getPixelForValue(convertMoney(strike, profileChartState.currency))
```

`profileChartState.currency` is `undefined`, so `convertMoney` falls back to its `'VND'` default and
returns the raw **2,000**. In USD the FMP strip's y-axis spans ≈0.036–0.077, so `getPixelForValue(2000)`
lands far above the plot, the next line's `y < chartArea.top` guard returns early, and **the dashed
line is never drawn** — while the caption directly below it says, verbatim from today's probe:

```
USD: "Dashed line = strike price 0.0755 USD   Off-peak 0.037–0.05 USD/kWh …"
```

A caption that names a line that is not on the chart, in the currency a CFO is most likely to switch
to. One-line fix (pass the currency through, or restore it on the state object) — but note the
*class*: this is a caption and a plot reading the same fact from two places, exactly the
single-source-of-truth discipline the deck pipeline enforces and the app does not.

### B3. It adds 19 new keys × 2 locales, three days before the translator deadline

`strings.js` grows from 132 to **151** keys. Untranslated counts moved **121 → 140 (vi)** and
**129 → 148 (zh)**. With `terminology-map.json`'s 64, the translation surface is now **352 units**,
up from 314 last week, and H2 is **due in 3 days**. `scripts/i18n-report.mjs` prints all of this and
**exits 0** — it is a report, not a gate.

**The structural fix is a string freeze, mechanized:** commit a `strings.baseline.json` of key names
and have `i18n-report.mjs --check` fail when a key is added after the freeze date. Otherwise the
translator is quoted a scope that changes underneath them, which is the localization equivalent of a
stale figure.

### B4. It adds a render-blocking external font to the app whose #1 risk is venue wifi

`index.html` now carries:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

The service worker cannot help: `sw.js`'s fetch handler returns early on `url.origin !==
self.location.origin`, so neither the stylesheet nor the font files are ever cached. Offline, the
request fails fast and `display=swap` renders the system fallback — survivable. **The bad case is a
venue network that is slow rather than dead:** a render-blocking stylesheet on a hanging connection
delays first paint until the browser's own timeout, on the projector, in front of the room. This is
the *one* risk the repo has spent an entire ~6 MB apparatus of MP4 fallback slides and a whole
service worker mitigating.

**Fix:** self-host a subset Inter woff2 in `public/`, `@font-face` it locally, and add it to
`STATIC_URLS` in `sw.js`. Two files, ~30 KB, and the font becomes part of the offline guarantee
instead of a hole in it.

### B5. Also worth doing before the commit

- Write the plan/report the repo's own conventions require, retroactively — a short
  `plans/2026-08-22-chart-legibility-redesign-plan.md` listing the tasks actually done, so the
  tree's largest change is legible to the next session.
- `mergedBandChips()` adds two fresh `toLocaleString('en-US', …)` calls. The locale-hardcoding
  defect (`formatters.js:13,23`) is not just unfixed, it is **growing**, in the same week a
  Vietnamese translator is engaged.
- Decide the fate of `app/inspect-tmp.mjs` (untracked debug script) and the 24 untracked
  `-win32.png` snapshots before they become permanent working-tree noise.

---

## Theme C — An inventory of guards that cannot fail (and one that cannot pass) ⭐ the pattern, quantified

Sorting the repo's automated checks by *"can this ever go red for the reason it exists?"* was the
most useful thing I did today:

| Check | Can it fail? | Note |
|---|---|---|
| `npm run lint`, `npm test`, `npm run build`, `npm run e2e` | ✅ | genuine |
| `npm run coverage` | ✅ | genuine — **and red right now**; but see B1: ~42% of source is outside its denominator |
| `npx prettier --check src e2e scripts` | ⚠️ partial | **`playwright.config.js` and `eslint.config.js` both violate the "authoritative" `.prettierrc` and sit outside the checked paths** (verified today) |
| `git diff --exit-code` on the exports | ✅ | the repo's single best guard |
| `check_retired_figures.py` | ⚠️ partial | scans 28 prose files + 14 scripts. **`app/src/**` is not among them** — the app the QR code serves could display a retired figure and nothing would notice |
| `verify_prose_figures.py` | ⚠️ partial | ≥7-digit floor still excludes every millions-rounded headline the presenter says aloud (carried) |
| `verify_deck_numbers.py` | ⚠️ weak | see C1 |
| `audit_teaching_deck.py` word/symbol budget | ✅ | genuine, and valuable |
| `audit_teaching_deck.py` number reconciliation | ❌ | the `pass` loop at `:73-77` (carried, C3 of 2026-08-15) |
| `npm run e2e:visual` | ❌ | `continue-on-error: true` **and zero committed baselines on any platform**, so locally it writes and passes, and in CI it cannot block |
| `scripts/i18n-report.mjs` | ❌ | reports, exits 0 |
| `deploy-freshness` (Monday) | ❌ | proven in production on 2026-08-17 |
| `human-blocked-register` (Monday) | ❌ *inverted* | cannot pass until a human acts |

**C1 — `verify_deck_numbers.py` reconciles four distinct figures.** Today's run: `11,020`, `9,063`,
`5,947`, `2,617` (5 token instances) across a 27-slide deck. That is not a weakness of the
implementation so much as of the scope: the deck body is deliberately sparse (the
anti-symbol-overload redesign worked), so almost all the numbers live in **speaker notes** — which
the docstring explicitly excludes as *"intentionally carry exact answer-key numbers."*

Notes-only figures in the committed deck: **`8,563`, `1,800`, `817`, `5,000,000`, `9,063`, `5,947`.**
Those are the numbers the presenter **reads out loud to a room containing lenders**, and they are the
least-verified numbers in the entire pipeline — the one place where a stale figure is spoken rather
than merely displayed. They are all derivable from `spine-s1.json`. Extending the verifier to scan
`notes_slide` with the same allow-set is a ~10-line change that roughly triples the gate's reach.

**C2 — `EXTRA_ALLOWED` and set-membership** remain as described in 2026-07-16 §C1–C2: a token passes
if it appears *anywhere* in the spine, so a correct figure on the wrong slide reconciles happily.
Unchanged.

**C3 — Make the checks that cannot fail either fail or go away.** Every one of them was built in
good faith, passed review, and then quietly stopped carrying information. Two of the six (the
`audit_teaching_deck.py` loop, the visual gate) can be closed this week; one (`i18n-report`) becomes
B3's freeze gate; one is A3. That leaves the register inversion (A4) and the deck verifier's scope
(C1).

---

## Theme D — Translation: 352 units, still growing, 3 days out ⭐ hard deadline

| Surface | Units | Untranslated |
|---|---|---|
| `app/src/data/strings.js` — vi | 151 | **140** |
| `app/src/data/strings.js` — zh | 151 | **148** |
| `assets/teaching/terminology-map.json` | 156 | **64** |
| **Total outstanding** | | **352** (was 314 on 2026-08-15) |

There is still **no vi or zh deck** in `ceba/` — only the English `DPPA Presentation Oct 2026 To
Teach.pptx` — and `build_oct_teaching_deck.py --lang vi` correctly refuses to run while any consumed
key is `UNTRANSLATED`. Everything last week's Theme F said about the guards stopping at the language
boundary is unchanged and unactioned: `verify_deck_numbers.py` is hard-wired to the English deck path
with a comma-only `NUMBER_PATTERN` (it would find **zero** tokens in `11.020` and exit 0);
`terminology-map.json` is scanned by no guard at all; `formatters.js` is `en-US`-hardcoded; and the
VI worksheet typography defect at `lessons/0009-scenario-3-excess-vi.html:90,46` — `1,100` and
`1.026 × 1.008` printed in a form that reads as a 1000× error under Vietnamese conventions — is
**still shipped**, four weeks after it was first identified.

**D1 — The one thing to do before the translator is engaged, if only one thing happens:** freeze the
string table (B3's baseline gate) and adopt the **number-placeholder frame** contract for
`terminology-map.json` (F3 of 2026-08-15). Translators translate frames; the builder fills
`{placeholder}` slots from the spine. The translator never touches a figure, the vi/zh decks inherit
number-correctness by construction, and the guards' language-blindness stops mattering for the class
of error that matters most. One contract change retires an entire category of proofreading, and it is
*much* cheaper to adopt three days before the work starts than three weeks after.

---

## Theme E — New smaller findings a fresh read surfaced

- **E1. `app/docs/assumptions.md:33` contradicts the code by 6%.** It states *"Internal math stays in
  VND; USD display divides by **25,000**."* `formatters.js:1` is `EXCHANGE_RATE = 26500`, pinned by
  `formatters.test.js:6`. Every USD figure on screen is 6% away from the documented basis. Worse,
  `app/docs/**` is in **no guard's scan list** (`retired_figures.json`'s `scan` covers `NOTES.md`,
  `RESOURCES.md`, `MISSION.md`, `corrections-log.md`, `facilitator/**/*.md`, `lessons/**/*.html`), so
  this is a documented-figure surface entirely outside the integrity apparatus. Fix the number, add
  `app/docs/**` to the scan, and give `EXCHANGE_RATE` the dated provenance comment and
  `EXCHANGE_RATE_AS_OF` export that three brainstorms have now asked for.
- **E2. The QR code lands on numbers that appear nowhere in the taught material.** `defaultInputs`
  opens on scenario `balanced`, **strike 2,000 / FMP 1,427**. The deck, the spine exports, the
  worksheets, the facilitator guide and the gate sweep are all built on `workshop1` — **strike 1,250 /
  FMP 1,150**. A participant who scans the QR during the session sees a different number basis from
  the slide they are looking at, *and* (per Theme E of 2026-08-15, still shipped) a "Crossover: > 20
  yr" with a 20-year loss. Making `workshop1` the landing scenario is a one-line change with more
  teaching value per character than anything else in the app.
- **E3. Six tabs, two naming systems.** `Load > Gen · Load = Gen · Load < Gen · Workshop 1 · Workshop
  2 · Workshop 3`. The first three are synthetic hourly-curve cases; the last three are the canonical
  S1/S2/S3 (matched / shortfall / excess) that every other artifact in the project calls by those
  names. Relabel the workshop tabs `S1 Matched · S2 Shortfall · S3 Excess` so the app and the deck
  share a vocabulary.
- **E4. S3's teaching point is invisible in the panel the learner fills in.** `workshop1` and
  `workshop3` have **identical** `monthlyVolumes` (`{contracted: 5,000,000, total: 5,000,000}`) and
  differ only in FMP (1,150 vs 1,100). The five-line bill for "excess" is therefore structurally the
  same as "matched", and the actual crux — 1,500,000 kWh of excess earning spot only, with
  225,000,000 VND of CfD uplift foregone — exists only in narration and the daily chart. An explicit
  "excess → spot only, CfD = 0" row in the bill panel would put the distinction where the worksheet
  asks for it.
- **E5. `check_human_blocked_register.py` crashes on Windows.** Printing row H4 (which contains `→`)
  raises `UnicodeEncodeError: 'charmap' codec can't encode character '→'` under the cp1252
  console, so a local operator gets a traceback mid-table instead of the register. CI is UTF-8 and
  unaffected. One line: `sys.stdout.reconfigure(encoding='utf-8', errors='replace')`. The same class
  of bug bites `json.load` on `retired_figures.json` without an explicit `encoding='utf-8'` — worth a
  sweep of all six `tools/*.py`.
- **E6. `npm run e2e` cannot run on this machine right now.** Leftover dev (`:5173`) and preview
  (`:4173`) servers from an earlier session are still listening; `playwright.config.js` sets
  `reuseExistingServer: false` (deliberately, for a good documented reason), so the suite aborts with
  `http://localhost:4173 is already used` and no hint about what to do. A `predeploy` that fails this
  way looks like a broken test suite. Worth a line in `deployment.md`, or a local `--port` override.
- **E7. `.git` is 137 MB**, dominated by repeatedly-committed `.pptx` binaries (the Oct deck alone is
  14.6 MB; `ceba/` holds 8 decks totalling ~57 MB). Not urgent before October, but every committed
  deck rebuild adds another full copy. Worth a decision — Git LFS, or commit the deck only at tagged
  milestones — before the vi/zh builds triple the count.
- **E8. Root `package.json` still names an archived file** (`"main": "build-deck.js"`, in `archive/`
  since PHASE-02) and root `dev-server.log` is 12 KB of leftover Vite output. Carried, trivial.

---

## Theme F — Carried from 2026-08-15, re-verified today as still open

Compressed deliberately; the full reasoning is in that document and has not changed.

| Ref | Item | Status today |
|---|---|---|
| A1 | Deploy the app | **open**, 28 days stale |
| A2/A3 | `predeploy` ≠ CI (missing prettier/coverage/visual); no `deploy` npm script | open |
| A4 | `sw.js` degrades silently when `/sw-manifest.json` 200s as HTML | open |
| B1/B2 | Monday deploy-freshness job has no node; no `--strict` | open, **now with a production log proving the cost** |
| B4 | `--write-log` invoked by nothing | open |
| C1 | The 07-16 plan is marked complete, was never executed, has 80 unticked tasks — and is a **good backlog** | open |
| C1b | `check_plan_status.py` | open |
| C3 | `audit_teaching_deck.py`'s no-op reconciliation loop | open |
| D1–D3 | `STRIKES` stops exactly at the investor threshold; extending to 1,550 more than doubles the headline pass rate; `DSCR_TARGET` is exported but never compared | open |
| E1–E4 | `strikeEscalation: 0.04` = `evnEscalation: 0.04` → no crossover in 20 years and −65.7 bn VND on the landing screen; the "Locked strike" preset and differential pill whose **strings already exist** are still unbuilt | open |
| F1–F4 | Monolingual guards; `terminology-map.json` unscanned; VI typography defect shipped; language switch reloads and destroys demo state | open |
| G1/G2 | No `requirements.txt`; `matplotlib` absent, so `build_teaching_visuals.py` and `build_cfd_slide.py` run in **neither** environment; the deck builder is never exercised by CI; the committed deck (2026-07-11) is **6 weeks older** than its builder (2026-07-25) | open |
| H1–H11 | per-file coverage, a11y test naming, three app names, hero copy, `EXCHANGE_RATE`, loss-constant triplication, `spotFormulaText`, `.gitattributes`, stale logs | open |
| I1–I6 | rehearsal harness, URL state, one-command pipeline, `docs/pipeline-architecture.md`, generated crib cards, July-vs-October A/B | open |

---

## Theme G — Ideas that would raise the ceiling, ordered by value for October

**G1. The propagation guard (Theme A2).** New this pass, and the highest-leverage new idea in the
document. Everything in `tools/` asks whether a number is right. Nothing asks whether the work left
the laptop. Three integers, ~60 lines, in the Monday job and at session end. Had it existed on
2026-08-11, this brainstorm would be half its length.

**G2. Commit the redesign properly — this session's real deliverable (Theme B).** Fix B2 (one line),
fix the coverage denominator and re-baseline (B1), self-host the font (B4), write the retroactive
plan (B5), commit, push, deploy. That single sequence closes Themes A and B and puts 1,177 lines of
genuinely good anti-symbol-overload work in front of the audience it was designed for.

**G3. The string freeze gate (B3 / D1), before H2 in 3 days.** `strings.baseline.json` +
`i18n-report.mjs --check`. Protects the translator's scope; the number-placeholder frame contract
protects their output from carrying figures at all.

**G4. Extend the deck parity gate to speaker notes (C1).** ~10 lines, roughly triples what the gate
covers, and covers precisely the numbers a presenter says out loud.

**G5. A presenter rehearsal harness — still the missing measurement of the actual mission.** Carried
from 2026-07-26 and 2026-08-15, and now 40 days out with no rehearsal scheduled. MISSION.md defines
success as *the presenter's* mastery: draw the five-line bill from memory, walk three cases and three
gates without notes, whiteboard each module in under five minutes. The repo has an extraordinary
apparatus for producing artifacts and **nothing** that measures that. A self-contained HTML page or
`tools/rehearse.py` generating timed retrieval drills **from `spine-s{1,2,3}.json` and
`gate-sweep.json`** — "state line 3 for S2", "what is C_KH for S1", "which gate binds at strike
1,300" — with a five-minute whiteboard timer per module and an append-only attempt log. It cannot
drift from the numbers by construction, and it is the only artifact that would measure the thing the
whole project exists for.

**G6. Landing state = teaching canon, plus URL state (E2, E3, and I2 carried).** Default to
`workshop1`, rename the tabs to S1/S2/S3, and serialize the eight numeric inputs into the query
string. That last one is the delivery mechanism for three things the repo already wants: "open this
exact bill on your phone", a reproducible starting state for the fresh-viewer kit, and a second QR on
the deck pointing at `?strikeEsc=0` — which *is* the locked-strike story, one scan, no narration.

**G7. Name the pipeline as a product.** Carried from four brainstorms now. *Settlement engine → JSON
spine exports → deck builder → prose verifier → gate-sweep credibility check → trilingual terminology
gate → freshness and propagation guardrails* is an Allotrope capability, not a one-workshop deck; the
next case study costs "swap the engine and the terminology map." Today it is legible only by reading
eight `plans/*.md` and four brainstorms. A short `docs/pipeline-architecture.md` is also the natural
home for the numbers-never-enter-the-translation-layer contract.

---

## Recommended sequence

1. **Unblock the tree and ship it (≈2 h).** B2's one-line currency bug → B1's coverage denominator +
   honest re-baseline + per-file `settlement.js` threshold → B4's self-hosted font → B5's retroactive
   plan → commit → **push** (first CI run in 20 days) → **deploy** → `--write-log`. This clears all
   three stalled stages at once and is worth more than everything below it.
2. **Make the Monday job able to fail, and add the propagation guard (≈1 h).** A3 + A4 + G1. Until
   this lands, the next stall is found by the next brainstorm rather than by a machine.
3. **Freeze the strings and fix the translation contract (≈1.5 h; hard deadline 3 days).** G3 + D1 +
   the VI typography fix in `lessons/0009-*-vi.html` + locale-aware `formatters.js`. Then hand the
   translator both files at once, with the scope fixed.
4. **Restore trustworthy status (≈1 h).** Carried C1/C1b/C2a: un-mark the 07-16 plan and reopen it as
   the backlog it is, split the readiness checklist into a coding plan and a presenter run-plan, add
   `check_plan_status.py`, delete `audit_teaching_deck.py`'s no-op loop.
5. **Fix what the app teaches by default (≈1 h).** Carried E1–E3 plus this pass's E2/E3: the
   `strikeEscalation` default, the differential pill and locked-strike preset (**strings already
   written**), `workshop1` as the landing scenario, S1/S2/S3 tab labels.
6. **Make the gate story survive a lender's question (≈1 h).** Carried D1–D3: extend `STRIKES` past
   the investor threshold, re-run the sweep, retire the superseded count **in the same commit** per
   `CLAUDE.md` §6, publish the per-gate decomposition.
7. **Give the deck pipeline an executable environment (≈1.5 h).** Carried G1/G2: `requirements.txt`,
   a `deck-build` CI job, `tools/compare_deck.py`. Mostly transcription from the 07-16 plan.
8. **G4 (notes parity) and G5 (rehearsal harness), ≈2 h together.** The first triples the parity
   gate's reach; the second is the only measurement of MISSION.md's actual success criterion.
9. **Theme E sweep, then G6 and G7**, opportunistically before the 2026-09-15 freeze.

---

## Assumptions adopted (unattended run — no questions asked, per brief)

- **ASM-1 — Analysis only; the repo is unchanged.** I wrote exactly one file (this one). I ran no
  mutating command: no exporter, no build into the tracked tree, no formatter, no `git` write. The
  headless probe read the already-running dev server and wrote its screenshot to the session
  scratchpad. The uncommitted redesign is exactly as I found it.
- **ASM-2 — I did not commit, push, or deploy, despite Theme A being the top recommendation.**
  Committing someone else's in-flight work misattributes it and would bury a currently-failing
  coverage gate inside a commit; pushing and deploying are outward-facing and change what GitHub and
  the public QR code serve. All three are surfaced for a decision, consistent with this repo's
  standing practice.
- **ASM-3 — I did not kill the leftover dev/preview servers (E6),** so `npm run e2e` and
  `npm run e2e:visual` were **not** run this session; a browser session is attached to `:5173` and
  may be someone's live review of the redesign. Functional e2e status is therefore *unverified today*
  — unit tests, lint, prettier, coverage and all five Python guards were run, with their actual
  output reported above.
- **ASM-4 — Theme B2's "the line is never drawn in USD" is established by code reading plus the
  probe's caption output**, not by pixel inspection. The state object provably lacks `currency`, and
  the `y < chartArea.top` guard provably fires for a VND-magnitude value on a USD axis; I did not
  diff screenshots to confirm the absence visually.
- **ASM-5 — I attribute the uncommitted redesign to an earlier session on this machine**, based on
  file mtimes (all 2026-08-22) and the Vite HMR log at the repo root. If a human is mid-edit, item 1
  of the recommended sequence is their call, not an agent's.
- **ASM-6 — The 2026-10-01 session date remains assumed, not confirmed.** H1 has been open since
  2026-07-04 and is now **overdue by a week**. Every interval in this document moves with it, and it
  is by a wide margin the longest-running unresolved item in the project.
- **ASM-7 — Coverage's missing ~42% is measured from `coverage-summary.json`'s file list**, which
  contains 13 files and omits `chart.js` and `main.js`. I did not re-run with `coverage.all: true` to
  measure what the honest percentage would be; the claim is that the denominator excludes them, not a
  prediction of the resulting number.
- **ASM-8 — Recommendations carrying a figure I did not source** (the strike-escalation default, the
  extended strike grid, the exchange rate) inherit the assumptions of the brainstorms that proposed
  them and still need a human with real deal data — H3, due 2026-09-01.
