---
title: "The Deck's Three-Gate Punchline Has Two Gates That Don't Move and One That Never Binds — and the Mission Itself Is Still the Only Thing Nobody Measures"
date: "2026-09-05"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze this project's current state, codebase, documentation and architecture; brainstorm what improvements, features, refactors, architectural changes or optimizations would take it to the next level. Unattended run — no questions, adopt the recommended option and note the assumption."
slug: "gate-degeneracy-and-unmeasured-mission"
builds_on:
  - "research/2026-08-22-delivery-stall-and-in-flight-redesign-brainstorm.md (Themes A/B closed; C/D/E/G re-verified today)"
  - "research/2026-08-15-deploy-drift-and-unverifiable-status-brainstorm.md"
  - "research/2026-07-16-post-hardening-next-level-brainstorm.md"
---

# Brainstorm: What a Fresh Pass Found on 2026-09-05

## 0. State of play — verified by running things today, not by reading docs

| Fact | Evidence |
|---|---|
| HEAD = `58e31b8`, master, **clean tree, 0 ahead / 0 behind `origin/master`** | `git status`, `git rev-list --left-right --count` |
| Live app marker `b6c54e2`; 2 commits ahead of it, **both documentation-only** | `tools/check_delivery_pipeline.py` |
| Unit tests green | `npm test` → **104 passed (11 files)** |
| Python guard tests green | `py -m pytest tools/tests` → **104 passed** |
| Coverage gate **passes with 0.85 pp of margin** | 49.85 / 52.36 / 52.60 / 50.00 vs 49 / 49 / 51 / 49 |
| Deck audits green | `audit_teaching_deck.py` PASS (27 slides) · `verify_deck_numbers.py` **PARITY PASS, 11 figures (body + notes)** |
| Prose/figure/terminology guards green | retired-figures PASS (82 files) · prose-figures PASS (341 tokens / 37 files) · terminology-numbers PASS (43 entries) |
| Plan-status guard green | `check_plan_status.py` PASS (18 plans) — **and see Theme G for why that is now meaningless** |
| Human-blocked register **red on four rows** | H1 −21d · H6 −21d · H2 −11d · H3 −4d; H4/H5 due in 3d |
| Translation surface | app vi **140**/151 · zh **148**/151 untranslated · terminology-map **66** → **~354 units outstanding** |
| Settlement engine is fast | measured: `calculateSettlement` 0.053 ms, `projectMultiYear(20)` 0.35 ms — **perf is not a problem** |
| Production bundle | `dist` 592 KB total; JS 234 KB (Chart.js) |
| `.git` | **153 MB**, up from 137 MB on 2026-08-22 |

**Calendar:** **26 days** to the assumed 2026-10-01 session · **10 days** to the 2026-09-15 content
freeze · H2 (translator) **11 days overdue** · H1 (date/venue) and H6 (visual baselines) **21 days
overdue**.

### This is a genuinely different starting position from the last three passes

The last three brainstorms all opened on the same finding in different clothes: *work is not
reaching anyone.* That finding is closed. The tree is clean, pushed, deployed, CI-verified, and the
2026-09-05 pixel sweep found and fixed ten real defects with a regression test each. Every guard I
could run, I ran, and every one passed. There is no delivery story to tell today.

So this pass went looking somewhere else: at whether the things the guards *say* are true are the
things that actually matter, and at what a person in the October room could ask that the repo cannot
answer. Two findings dominate, and neither has appeared in any prior brainstorm:

1. **The deck's headline "three gates" analysis is mathematically degenerate.** Two of its three
   gates are constant along one of the heatmap's two axes, and one of the three is *strictly
   dominated* — deleting the lender gate entirely changes the headline number from 15 to 15. Every
   guard in the repo passes on this, because every guard checks that the number was *computed*, not
   that the computation *says anything*.
2. **MISSION.md's own definition of success still has zero instrumentation**, 26 days out. The repo
   has roughly fourteen automated checks that a figure is correct and not one that the presenter can
   deliver it. That gap has been named in three consecutive brainstorms and is now the largest
   unhedged risk to the October session.

---

## Theme A — The three-gate model is degenerate, and the lender gate can never bind ⭐ highest consequence

`app/scripts/export-sweep.mjs` computes the 70-cell strike × volume-ratio grid behind the M5 gate
heatmap — the deck's most quantitative slide, the one built to survive a lender's question. Its
buyer gate is a real lifetime-cost comparison through `buildFiveLineBill`. Its other two gates are
these two lines (`export-sweep.mjs:83-84`):

```js
const lenderPass  = strike >= LENDER_DEBT_SERVICE_VND_PER_KWH   // 1150 * 1.2 = 1,380
const investorPass = strike >= INVESTOR_LCOE_VND_PER_KWH        // 1,450
```

Neither reads `ratio`. Printed as a grid (`B`/`L`/`I` = that gate passes; columns are the seven
volume ratios 0.7 → 1.3):

```
strike   buyer     lender    investor
1100    BBBBBBB   .......   .......
1250    BBBBBBB   .......   .......
1350    BBBBBB.   .......   .......
1400    BBBBBB.   LLLLLLL   .......
1450    BBBBB..   LLLLLLL   IIIIIII
1550    BBBBB..   LLLLLLL   IIIIIII
```

Three verified consequences:

- **Two of three gates are constant in volume.** Programmatically confirmed: `lenderPass` and
  `investorPass` never vary with ratio at any strike; only `buyerPass` does. A two-axis heatmap
  whose two developer-side gates ignore one axis entirely is not a two-dimensional finding — it is a
  one-dimensional finding drawn in two dimensions.
- **The lender gate is strictly dominated and binds in zero of 70 cells.** Because 1,380 < 1,450,
  `{investorPass} ⊂ {lenderPass}`. Measured: cells where the lender gate is the sole blocker = **0**;
  all-three-pass count with the lender gate deleted entirely = **15**, identical to the published
  headline. The slide advertises three constraints; two of them determine the answer.
- **`DSCR_TARGET = 1.2` is exported into `meta` and never used in any computation.** It appears in
  `gate-sweep.json`'s metadata — where it reads as provenance for a coverage test that is not
  performed — and is only ever multiplied inline to produce the 1,380 constant. This was flagged in
  2026-07-16 (D3) and is unchanged.

This is not a numerical error and no existing guard could have caught it. `git diff --exit-code` on
the exports proves the JSON matches the engine. `verify_deck_numbers.py` proves the slide matches the
JSON. Both are true and both are irrelevant to whether the model is degenerate. **The repo's
integrity apparatus verifies provenance, not meaning** — that is the class of gap, and A is its
sharpest instance.

**A1 — Make the developer-side gates depend on volume (recommended; do not wait for H3).** The
smallest honest change keeps the gates illustrative but restores their two-dimensionality:

- Lender: annual contracted revenue at the nominal strike must cover an assumed annual debt service
  by `DSCR_TARGET`. `contractedKwh × 12 × strike ≥ DSCR_TARGET × ANNUAL_DEBT_SERVICE_VND`. Volume now
  matters, `DSCR_TARGET` is finally used for what its name says, and the gate can bind independently
  of the investor gate at high strike / low volume.
- Investor: LCOE recovery over *actual dispatched* volume rather than a bare strike comparison, so a
  0.7-ratio contract at a high strike does not automatically clear.

That yields a heatmap with a genuine interior feasible region, a nameable binding constraint per
cell, and an answer to "which of us is the constraint here?" — the actual question M5 exists to
provoke. **ASM-4: I recommend doing this without waiting for H3's real Allotrope deal data.** H3 is
four days overdue with no owner action; a non-degenerate illustrative model, clearly labelled as
illustrative, is strictly better in the room than a degenerate one, and swapping real constants in
later is a two-line change either way.

**A2 — Whatever the model, the headline count will move.** Any change here retires `15 of 70` and the
per-gate counts `62 / 28 / 21`. Per CLAUDE.md §6 those strings go into `tools/retired_figures.json`
in the *same commit*, and the full §5 chain (`tools/pipeline.py --lang en`) has to run so the heatmap
PNG, the deck, `NOTES.md` and `RESOURCES.md` all move together. Budget the regeneration, not just the
edit.

**A3 — State the binding constraint on the slide, not just the pass count.** "15 of 70 clear all
three" is a weaker sentence than "below 1,450 the investor is the binding constraint; above ratio
1.0 the buyer is; the lender binds in the high-strike / low-volume corner." The per-cell data to say
that already exists in `gate-sweep.json`. This is the single highest-value teaching change available
to M5 and it costs a caption.

---

## Theme B — M5 is the only module with no live demo, and the app has no gate view at all ⭐ new

Grepping the whole app for `lender`, `investor`, `gate` or `DSCR` returns exactly one hit: a string
describing the multi-year chart as "the buyer-gate check." There is no seller gate, no lender gate,
no investor gate, and no gate panel anywhere in the app. `teach-steps.js`'s M5 step (`module: 5`)
sets the workshop-1 prices and scrolls to `#fiveLineBill` — the same target as M6 — because there is
nothing else for it to point at.

So the module built specifically to survive a financier's question is the one module where the
presenter cannot move a slider and show the answer. MISSION.md's stated goal is to "field hard
CFO/lender questions live"; M5 is exactly where those questions land, and it is the module the app
abandons.

**B1 — Extract `src/modules/gates.js` and give M5 a live panel (recommended headline feature).**
Move the gate evaluation out of `scripts/export-sweep.mjs` into a tested engine module, then import
it from *both* the exporter and the app. Three things fall out of one change:

- **The app gets a gate panel** — three lamps (buyer / lender / investor) that respond live to the
  strike, contracted-volume and escalation sliders, with the binding constraint named in a sentence.
  A lender asks "what strike do I need?"; the presenter drags until the lamp flips and reads it off.
- **A duplication dies.** The gate logic currently lives only in a build script, outside the
  coverage gate, outside the unit suite, and outside every runtime path anyone exercises.
- **Theme A becomes self-evident.** A degenerate gate is very hard to see in a static PNG and
  impossible to miss when a slider moves and one lamp never changes. Building B1 first is arguably
  the cheapest way to *validate* A1's fix.

**B2 — It also closes the sweep's constant duplication.** `export-sweep.mjs` re-declares
`LOSS_FACTOR_PRECISE`, `LOSS_FACTOR_KPP_ONLY`, the escalations and the horizon that
`default-scenarios.js` already owns (see I4). A `gates.js` that takes inputs rather than re-deriving
them removes that copy on the way past.

---

## Theme C — Hand-typed spine figures live in the one file no guard scans, and the presenter reads them aloud ⭐ new

`app/src/data/strings.js:154,158`:

```js
teach_m1_expected: 'Baseline BAU bill: ~11,020 million VND/month.',
teach_m2_expected: 'C_EVN 8,563m + CfD 500m = C_KH 9,063 million VND/month.',
```

Those four figures are the S1 spine, hand-typed. They match `spine-s1.json` today (11,020 / 8,563 /
500 / 9,063 — verified). They are also:

- **In no guard's scan list.** `retired_figures.json`'s `scan` covers `NOTES.md`, `RESOURCES.md`,
  `MISSION.md`, `corrections-log.md`, `facilitator/**/*.md`, `lessons/**/*.html`, `app/docs/**/*.md`
  and `assets/teaching/*.json`. `verify_prose_figures.py` scans the same set. **`app/src/**` appears
  in neither.**
- **Below the prose guard's floor anyway.** `TOKEN_RE = \d{1,3}(?:,\d{3}){2,}` requires two comma
  groups — seven digits. `11,020` and `9,063` are four. Even if the file were scanned, these would
  pass unseen.
- **What the presenter reads off the screen during teach mode**, in front of the room, as the
  expected answer.

This is precisely the class of gap the August work closed on the deck side: speaker notes carried
the numbers said aloud and were excluded from the parity gate, so `verify_deck_numbers.py` was
extended to `notes_slide` (it now reconciles 11 figures, up from 5). **The same gap is open on the
app side and nobody has noticed because the app is not prose and not a deck.**

**C1 — Generate them (recommended).** Have `export-spine.mjs` additionally emit a tiny
`app/src/data/spine-figures.js` (or JSON) with the millions-rounded values, and interpolate them
into the teach strings at render time. The exports are already under `git diff --exit-code` in CI, so
the numbers inherit the strongest guard in the repo for free, and the translator never sees a figure.

**C2 — Or, minimally, widen the guards.** Add `app/src/data/strings.js` to both scan lists and lower
`verify_prose_figures.py`'s token floor to four digits behind a curated allow-set. Cheaper, weaker,
and leaves the figures hand-typed. C1 is better and is barely more work.

**C3 — The floor is a general problem, not a local one (carried from 2026-07-16 and 2026-08-22).**
The ≥7-digit floor excludes *every millions-rounded headline in the project* — which is to say every
number a human actually says out loud. The exact-VND figures the floor does catch are the ones
displayed, not spoken.

---

## Theme D — The rendered figures are the only artifact class with no parity gate ⭐ new

CI has grown well: `quality`, `deck-parity`, and `deck-build` (which rebuilds the deck to a scratch
directory and text-compares it). Grepping the workflows for the other builders returns nothing:

| Root script (all six marked `# LIVE:`) | Exercised by CI? |
|---|---|
| `build_oct_teaching_deck.py` | ✅ `deck-build` |
| `audit_teaching_deck.py`, `verify_deck_numbers.py` | ✅ `deck-parity` |
| **`build_teaching_visuals.py`** | ❌ never |
| **`build_cfd_slide.py`** | ❌ never |
| **`build_worksheet_answer_docx.py`** | ❌ never |

Half the live build surface is unexercised, and the omission is not evenly harmful.
`build_teaching_visuals.py` renders **numbers into pixels** — the M5 heatmap's pass count, the
Sankey's flow values, the cold-open bill pair. `check_retired_figures.py` scans prose and scripts;
`verify_prose_figures.py` scans prose; `verify_deck_numbers.py` reads the deck's *text* frames.
**None of them can read a PNG.** A superseded figure baked into `m5-gate-heatmap-en.png` survives
every guard the repo has, and lands on the projector at 40 pt.

They happen to be in sync right now — the heatmap PNG, `gate-sweep.json` and the builder were all
committed together in `9c85512`, and the Sankey PNGs and `spine-s1.json` in `9773440`. That is
discipline, not a mechanism. Theme A guarantees this coupling is about to be tested.

**D1 — A figures manifest, not an image diff (recommended).** matplotlib output is not byte-stable
across platforms and font sets, so hashing PNGs will produce a guard that fails for the wrong
reasons — the exact "check that cannot carry information" pattern this repo keeps rediscovering.
Instead have `build_teaching_visuals.py` write `assets/teaching/figures-manifest.json` recording, per
figure: the SHA of each input JSON it read, the literal caption/number strings it rendered, and the
SHA of the builder itself. A ~40-line `tools/check_figures_manifest.py` recomputes those digests and
fails on drift. Byte-stable, platform-independent, and it makes the pixel-baked numbers greppable by
the *existing* text guards for the first time.

**D2 — Run `tools/pipeline.py --lang en` in CI (or at least the visuals step).** `matplotlib`,
`numpy` and `Pillow` are already installed in the `deck-build` job by `requirements.txt`. Adding the
visuals step costs a minute of CI and closes the "three of six live scripts never run" gap outright.

---

## Theme E — The vi/zh decks will build clean and ship with English figures ⭐ hard deadline

`build_oct_teaching_deck.py` takes `--lang` and threads it correctly through every text path: the
terminology map, the number-placeholder slots, `format_number_for_lang`, the output filename suffix,
and the `UNTRANSLATED` refusal gate. It threads it through **zero** asset paths. Fourteen hardcoded
`-en` filenames (verified by count):

```python
add_picture_fit(s, os.path.join(ASSETS, "cold-open-bill-pair-en.png"), ...)
breadcrumb = os.path.join(ASSETS, f"breadcrumb-strip-m{module_num}-en.png")
content_slide(..., os.path.join(ASSETS, "m5-gate-heatmap-en.png"), ...)
qr_path = os.path.join(ASSETS, "qr-app-en.png")
...
```

The `-vi` and `-zh` variants of all of them already exist and are already rendered. So the moment the
translator delivers, `--lang vi` will pass the UNTRANSLATED gate, build cleanly, report success, and
produce a Vietnamese deck in which **every chart, every breadcrumb strip, and the QR panel are
English**. The gate that exists to protect the translated build protects the text layer only.

Two traps in the fix:

- **`-zh` vs `-zh-cn`.** `assets/teaching/*` uses `-zh`; the CfD animations in `assets/` use `-zh-cn`
  (`cfd-s1-zh-cn.gif`). A naive `f"-{lang}"` substitution fixes twelve paths and silently breaks the
  two that reference `assets/cfd-s1-en.gif`. Needs an explicit per-family suffix map.
- **No CJK font ships anywhere.** The app self-hosts Inter latin + vietnamese subsets only. Inter has
  no CJK coverage, so once real ZH strings land the app falls back to whatever the venue laptop has —
  and the deck aesthetic that NOTES.md treats as a hard constraint breaks on the ZH build.

**E1 — Do the asset-path fix and add an existence assertion, this week, before H2 delivers.** A
build-time check that every asset path resolves turns a silent English-figure deck into a loud
failure. This is the single highest-value pre-translation task and it does not need a translator.

**E2 — Decide the ZH font story now.** Either subset a CJK face into `public/` and add it to
`STATIC_URLS` in `sw.js`, or write down explicitly that ZH accepts system-font fallback. Deciding it
after the translator delivers means deciding it under deadline.

---

## Theme F — Translation is the critical path, and `ui.js` will break on the translator's first `<`

H2 is **11 days overdue** with ~354 units outstanding (140 vi + 148 zh app keys, 66 terminology
entries), against a 2026-09-15 content freeze in 10 days. The structural protections that exist —
the frozen `strings.baseline.json`, the number-placeholder frames, `check_terminology_numbers.py`
(PASS, 0 embedded figures) — are good and were the right things to build. One structural hole
remains, and it is in the app.

**F1 — `ui.js` renders entirely through `innerHTML` with zero escaping.** Nine `innerHTML`
assignments, ~640 lines of template-literal HTML, and every `t('key')` result is interpolated
straight into markup. Today all strings are English and safe. The next change to this repo is a
translator delivering ~290 strings in two languages. A perfectly reasonable Vietnamese or Chinese
string containing `<`, `>` or a bare `&` will silently corrupt the DOM — and the corruption will
appear only in the locale nobody on the team reads, discovered on the projector.

This is not a security finding (there is no untrusted input at runtime). It is a **robustness
finding about the next scheduled change to the repo**, and there are two cheap fixes, ideally both:

- An `escapeHtml()` helper applied at every `t()` interpolation site in `ui.js`.
- A unit test asserting that no value in `strings.js` contains an unescaped `<`, `>` or `&` — which
  turns a translator's mistake into a red CI run instead of a broken slide.

**F2 — `spotFormulaText` is a hand-typed en-US string in the exporter.** `export-spine.mjs:193`:

```js
spotFormulaText: '1,500,000 × 1.008 × 1,100',
```

All three numbers are computed on the adjacent lines (`excessKwh`, `lossFactorKppOnly`, `fmp`). If
any input moves, the string lies, and the `git diff --exit-code` guard will happily bless it because
the exporter reproduces the same wrong string deterministically. It is also comma-grouped en-US, so
it reads as a 1000× error under Vietnamese convention — the exact defect class the repo spent a whole
phase eliminating from `lessons/0009-scenario-3-excess-vi.html` (verified fixed there today). Build
the string from its parts, through `format_number_for_lang`'s JS equivalent. Carried since 2026-08-15
as H7.

---

## Theme G — The tracking system now reports "nothing open" while ~35 named tasks are orphaned

`check_plan_status.py` returns **PASS (18 plans scanned)**. Every plan in `plans/` is `complete`,
`superseded`, or `abandoned`. Zero open forward work.

That is not what happened. Reading the two closures:

- `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`, closed 2026-08-29, states in its
  own status field that its successor implemented **12 of 47** tasks and that the remaining **35** —
  "the sensitivity band/computeBand and derived lender threshold, the deck-figures.json manifest and
  positional verifier, EXTRA_ALLOWED removal, the tools/ reorganization and root README, the 14
  hardcoded `-en` deck asset paths, the 66 remaining UNTRANSLATED terminology-map entries, and the M6
  sensitivity panel — are NOT covered by any plan as of this closure and are not tracked anywhere
  going forward."
- `plans/2026-october-readiness-checklist.md`, abandoned the same day, says its remaining scope
  (vi/zh deck builds, gate recalibration follow-through, close-to-session build/preview
  re-verification) "is no longer tracked here or anywhere else."

The closures are honest — remarkably so; they name exactly what they are dropping. But the *guard*
reads only the status field, so an explicitly-orphaned backlog and a genuinely finished project are
indistinguishable to it. `check_plan_status.py` was built (correctly) to catch the opposite failure:
a plan claiming `complete` with unticked tasks. It has no concept of work that was closed while
undone on purpose.

And this pass independently rediscovered three of those 35 items from the code — **A (derived lender
threshold), D (the figures manifest), E (the 14 hardcoded `-en` paths)**. They were not stale
backlog; they were live defects that stopped being visible when the file that named them was closed.

**G1 — Open one plan for the orphans.** Not the old 47-task file; a fresh, short plan naming the
handful that still matter 26 days out. Themes A, B, C, D, E and F below give the ordering.

**G2 — `facilitator/october-run-plan.md` points at a dead file.** Its header says "The coding-session
half is `plans/2026-october-readiness-checklist.md`," and three later sections defer to it
("see the corresponding section of…", "see … 'Once the translator (H2) delivers both files'"). That
file was abandoned on 2026-08-29. The presenter's own run-of-show — the artifact that governs the
actual session — routes four decisions to a document that no longer holds them. Repointing it is a
five-minute edit and it is the only surviving hand-off between the human and coding tracks.

**G3 — Teach `check_plan_status.py` the third state.** A plan closed as `superseded`/`abandoned`
whose own text says the remainder is untracked should require a named successor plan, or fail. That
is a ~15-line change to a checker that already parses these files, and it is the guard that would
have kept A, D and E visible.

---

## Theme H — Updated inventory of guards that cannot fail (and the newest one that cries wolf)

The 2026-08-22 pass produced this table and it earned its keep, so here it is re-run against today's
repo. Most rows improved. Two did not, and one is new.

| Check | Can it fail for the right reason? | Note |
|---|---|---|
| lint · prettier (now incl. `*.config.js`) · unit · build · e2e · coverage | ✅ | genuine; coverage denominator fixed (`all: true`), margin now **0.85 pp** |
| `git diff --exit-code` on spine/sweep exports | ✅ | still the repo's best guard |
| `verify_deck_numbers.py` | ✅ improved | now scans notes: **11 figures**, up from 5. `EXTRA_ALLOWED` / set-membership weakness unchanged (carried) |
| `audit_teaching_deck.py` | ✅ | the no-op loop is gone |
| `deck-build` + `compare_deck.py` | ✅ new | generator/artifact drift now caught |
| `check_delivery_pipeline.py` | ⚠️ **new: cries wolf** | reports `STALLED` today on **two documentation-only commits**. It has no notion of whether a commit changes deployable content, so from now on every prose commit ages into a Monday failure. This is the sixth guard to drift toward uninformative, and it is the one built five weeks ago to fix exactly that problem |
| `check_plan_status.py` | ❌ | passes on a deliberately-orphaned 35-task backlog (Theme G) |
| `npm run e2e:visual` | ❌ | `continue-on-error: true`, **zero committed baselines on any platform**, H6 **21 days overdue** |
| `human-blocked-register` | ❌ *inverted* | four overdue rows; cannot pass without a human. `--acknowledged-through` exists but the scheduled job still does not pass it, so the weekly signal is a constant red |
| `check_retired_figures.py` / `verify_prose_figures.py` | ⚠️ partial | `app/src/**` in neither scan list; ≥7-digit floor (Theme C) |
| — | ❌ **absent** | nothing verifies rendered figures (Theme D) or the semantic content of the gate model (Theme A) |

**H1 — Give `check_delivery_pipeline.py` a content filter.** Count undeployed commits that touch
`app/**` (or a configured deployable path set), and report doc-only commits separately as
informational. Otherwise the newest guard in the repo becomes the next one everyone learns to ignore,
and the pattern the last three brainstorms diagnosed reasserts itself in the tool built to prevent
it.

**H2 — H6 is the one overdue item a human can clear in ten minutes**, and it unlocks the only
regression gate the app's visual layer will ever have. It needs a `workflow_dispatch` trigger and a
commit of the artifacts. Twenty-one days overdue with 26 days to go.

---

## Theme I — Code-level findings

**I1 — `main.js`: 377 lines, 0% unit coverage, and the app's whole composition root.** Not a
criticism of the e2e suite (which does exercise it) but of where the risk sits: `updateView()` is a
~90-line function that recomputes everything and renders eight panels, five of them wrapped in
individual `try/catch` blocks that `console.error` and continue. In front of a room, a chart that
throws leaves a **blank canvas with no visible explanation** — only `#cancellationFlow` has a user-
visible fallback (`showCancellationFlowFallback`). Give the other four the same treatment: a short
"chart unavailable" caption is infinitely better on a projector than an empty rectangle nobody can
explain.

**I2 — The control list is written three times.** Adding a slider means editing
`renderAppShell`'s markup in `ui.js`, the `mappings` array in `syncControls()`, and the eight
explicit `document.querySelector(...).value = ...` lines in `syncInputsFromState()`. One declarative
control descriptor consumed by all three would remove a whole class of "I added the control and it
doesn't reset" bug.

**I3 — `chart.js`: 683 lines at 19.34% statement coverage.** It is the largest module, the one the
August redesign rewrote, the one the September sweep found two of its ten bugs in, and the one that
paints everything the audience sees. It is now visible in the coverage denominator (good — that was
the August fix) but essentially untested. Its pure helpers (`mergedBandChips`, `renderTariffCaption`,
`range`, the label-plugin geometry) are testable without a canvas and would raise the floor
meaningfully. Same argument, smaller, for `tour.js` at 6.97%.

**I4 — The loss constants are quadruplicated.** `1.026 × 1.008` appears in `main.js:208`,
`export-spine.mjs:14`, `export-sweep.mjs:34`, and as a default in `settlement.js:136`
(`lossFactorKppOnly ?? 1.008`), plus a comment in `default-scenarios.js:199`. They are Decree
57/2025 reference coefficients — a regulatory input that can change. Export `LOSS_K`, `LOSS_KPP` and
`LOSS_FACTOR_PRECISE` from `default-scenarios.js` and import them everywhere. Carried through three
brainstorms.

**I5 — `sw.js`: `CACHE_NAME` is module state written only during `install`.** A service worker can be
terminated and restarted between events; on restart `install` does not re-run, so `CACHE_NAME`
reverts to `'dppa-app-unknown'` and runtime cache writes land in an orphan cache that the next
`activate` deletes. Reads are unaffected (`caches.match` searches all caches), so this degrades
quietly rather than breaking. Fix: bake the version in at build time — `vite.config.js` already
computes the commit for `sw-manifest.json`, so templating it into `sw.js` is a few lines in the
existing plugin.

**I6 — `sw.js` navigation is network-first with no timeout — the realistic venue failure is *slow*,
not *dead*.** On a hanging network the shell waits for the browser's own timeout before falling back
to cache: a white projector screen for tens of seconds, with a perfectly good cached copy sitting
one line away. This is the same failure mode as the render-blocking Google font that was correctly
removed in August (fonts are now self-hosted — verified in `main.js`), reappearing one layer down.
`Promise.race([fetch(request), timeout(2000)])` with a cache fallback makes the offline story
actually hold under the failure mode the venue will produce.

**I7 — ~162 KB of the 592 KB bundle is dead legacy font format.** `@fontsource` emits both `.woff`
and `.woff2`; every browser that will ever open this app supports `woff2`. Excluding the `.woff`
files trims ~27% of the bundle. Marginal on a good network, meaningful on a venue one.

**I8 — Perf is genuinely fine; do not "optimize" the engine.** Measured today:
`calculateSettlement` 0.053 ms, `projectMultiYear(20)` 0.35 ms. A full `updateView()` costs well
under a millisecond of computation. If slider drag ever feels heavy it will be Chart.js `update()`
and `innerHTML` rebuilds, not arithmetic — and coalescing renders into a `requestAnimationFrame`
would be the fix. **I did not measure in-browser frame timing, so I am not claiming a jank problem
exists.** Noted so a future pass does not go looking in the wrong place.

**I9 — Windows console encoding, still leaking.** `verify_deck_numbers.py`'s success banner prints
`PARITY PASS ?` (mojibake) under cp1252, and reading `tools/retired_figures.json` without
`encoding='utf-8'` raises `UnicodeEncodeError` on Vietnamese content — I hit it live today.
`check_human_blocked_register.py` was fixed; the sweep across the other tools was not. One
`sys.stdout.reconfigure(encoding='utf-8', errors='replace')` per entry point.

---

## Theme J — Repository scale, before the vi/zh decks triple it

`.git` is **153 MB**, up from 137 MB two weeks ago; the pack is 135 MB against 15.75 MB of loose
objects. `ceba/` holds eight decks; the October deck alone is 14.9 MB and is committed afresh on
every rebuild. Theme A forces at least one more rebuild; H2 forces two more (vi, zh); the run plan
implies at least one more after the fresh-viewer test. That is plausibly +60 MB before October, on a
repository whose entire source is under 6,000 lines.

The `deck-build` CI job now proves the deck is **derivable** from the builder plus committed assets.
That is the strongest possible argument for not versioning every intermediate rebuild.

**J1 — Commit the `.pptx` at milestones only** (content freeze, each translated build, the final
pre-session version), tagged, with the intermediate rebuilds left to CI and the local pipeline. **J2
— Add `.gitattributes`** marking `*.pptx`, `*.docx`, `*.mp4`, `*.gif` as binary so tooling stops
attempting diffs. Git LFS is the heavier alternative and probably not worth the setup cost 26 days
out. Not urgent; genuinely cheaper to decide before the vi/zh builds than after.

---

## Theme K — The mission's own success criterion is still the only thing with no instrumentation ⭐ carried three times, now 26 days out

MISSION.md defines success in four sentences, and every one of them is about **the presenter**:

> I can draw the five-line bill from memory · explain why a virtual DPPA is rarely a Year-1 discount
> · walk the three canonical cases and the three gates **without notes** · answer "what sets my
> price?" with the right levers. I can teach each module at a whiteboard in **under five minutes**
> using only the mental model, and the live tool becomes a demo aid, **not a crutch**.

The repo contains roughly fourteen automated checks that a figure is correct, three CI jobs, a
104-test Python guard suite, a 104-test JS suite, 69 e2e tests, an a11y gate, an offline suite, a
deck word-budget auditor, and a symbol-deferral auditor. It contains **zero** instruments that
measure any sentence above. The fresh-viewer kit (H5) is excellent and measures the *audience*'s
comprehension — a different criterion (DEC-003), and itself unscheduled with 3 days to its own
deadline.

Every prior pass has recommended a rehearsal harness and every prior pass has deferred it, because
"rehearsal" sounds like a calendar item rather than a buildable artifact. It is buildable, and the
engine to build it against already exists and is 92% covered.

**K1 — `?drill=1`: a presenter self-test mode in the app (recommended; ~150 lines).** The app
already has the scenarios, the engine, the localisation, the offline shell and the teach-mode
scaffolding. A drill mode would:

- pick a scenario (or randomise strike / FMP / contracted volume within the taught ranges),
- **hide** the five-line bill and present five empty inputs,
- grade the entry against `buildFiveLineBill` with a tolerance band, showing which line was wrong
  and the driver behind it,
- time the attempt, and keep a streak in `localStorage`.

That is MISSION.md criterion #1 — *draw the five-line bill from memory* — converted from an aspiration
into a number the presenter can watch improve, on the laptop they will actually carry, working
offline. Add a second drill for the three cases and (once Theme A/B land) the three gates, and three
of the four criteria are instrumented.

**K2 — It is also the best possible use of Theme B's gate panel.** "Which gate binds at strike 1,400,
ratio 1.1?" is a drill question with a computable answer the moment `gates.js` exists.

**K3 — Whatever else happens, put the timed solo dry-run on a date.** It is the mid-September item in
`facilitator/october-run-plan.md`, it is unticked, it is gated on nothing, and it is the only listed
activity that directly tests the mission. Twenty-six days.

---

## Theme L — Smaller findings

- **L1.** `app/docs/` contains only `assumptions.md` and `formulas.md` and is now inside the guard
  scan lists (the 25,000-vs-26,500 contradiction is fixed, and `EXCHANGE_RATE_AS_OF` exists —
  verified). No open finding; recorded so a future pass does not re-raise it.
- **L2.** `predeploy` now matches the `quality` job closely; CLAUDE.md §2 is honest about the two
  remaining differences (browser install, non-blocking visual pass). Also no open finding.
- **L3.** Root `package.json` still names `"main": "build-deck.js"`, archived since July. Trivial,
  carried since 2026-08-15, still there.
- **L4.** `settlement.js`'s `determineContractQuantity` hard-codes `Math.round(generation * 0.88)`
  for the `allocated` mode with no comment explaining the 0.88. It is the only unexplained magic
  number in the engine, and it appears in a demo-labelled settlement mode the presenter can select
  live.
- **L5.** `buildFormulaBreakdown` returns a **57-key object**. It is the widest interface in the
  codebase and it exists because the UI needed each of those values somewhere. It is well tested and
  works; it is also the module that will be hardest to change next. If Theme B adds a gate panel,
  resist widening it further — give `gates.js` its own narrow return.
- **L6.** `EXCESS_GENERATION_KWH = 6500000` is hardcoded in `export-spine.mjs` while every other S3
  volume comes from `scenarioProfiles.workshop3`. It is sourced (the numbers spec) but it is the one
  spine input that does not travel with its scenario.
- **L7.** The `strikeEscalation: 0.02` comment block in `default-scenarios.js` is 20 lines long and
  ends with an instruction to "verify that is still true after any change here" — a hand-maintained
  invariant with no test. It asserts that `export-spine.mjs` / `export-sweep.mjs` read their own
  constants rather than `defaultInputs`. I4's shared-constants change would make that comment
  obsolete, which is the better outcome than testing it.

---

## Recommended sequence

Ordered for 26 days to the session and 10 days to content freeze, and split by who can do it.

### Coding sessions — before the 2026-09-15 content freeze

1. **E1 — Thread `--lang` through the deck builder's 14 asset paths, with a suffix map for the
   `-zh`/`-zh-cn` split and a build-time existence assertion.** (~1 h.) Highest value per minute in
   the document: it is the difference between a translated deck and a translated deck full of
   English charts, and it must land *before* H2 delivers, not after.
2. **A1 + A2 — Fix the degenerate gate model, regenerate the full §5 chain, retire `15 of 70`.**
   (~half a day incl. regeneration.) Pre-freeze because it changes taught content.
3. **F1 — Escape `t()` output in `ui.js` and add the `strings.js` character-content test.** (~1 h.)
   Also pre-translator: it turns the translator's most likely mistake into a red build.
4. **C1 — Generate the teach-mode figures from the spine instead of hand-typing them.** (~1 h.)
   Removes the last hand-typed spine numbers in the repo and puts them under the export-drift gate.

### Coding sessions — after the freeze, before the session

5. **B1 — Extract `gates.js`; add the live three-lamp gate panel with a named binding constraint.**
   The headline feature: it gives M5 its missing demo, moves untested build-script logic into the
   tested engine, and makes A1's fix visible on a slider.
6. **K1 — `?drill=1` presenter self-test.** The first instrument the repo has ever had for its own
   mission statement.
7. **D1 + D2 — The figures manifest guard, and run the visuals build in CI.** Closes the last
   unguarded artifact class and the "three of six live scripts never run" gap.
8. **H1 + G3 — Teach `check_delivery_pipeline.py` about deployable paths; teach
   `check_plan_status.py` about deliberately-orphaned scope.** Two small changes that stop the
   repo's two newest guards from decaying into noise.
9. **I5 + I6 — Bake the SW cache version at build time; add a navigation-fetch timeout.** Small,
   and they harden the one risk the venue will actually produce.
10. **G1 + G2 — Open one plan for the surviving orphans; repoint the run plan's dead cross-reference.**

### Human-only, and the sequence above does not substitute for any of it

- **H1 (date/venue) — 21 days overdue.** Every date in this document is derived from an assumption.
- **H6 (visual baselines) — 21 days overdue, ~10 minutes of work**, and it is the only regression
  gate the visual layer can ever have.
- **H2 (translator) — 11 days overdue, ~354 units.** Steps 1 and 3 above make the delivery safe to
  integrate; they do not produce it.
- **H3 (gate proxies) — 4 days overdue.** A1 proceeds without it by design (ASM-4); real deal data
  would upgrade the constants afterwards.
- **H5 (fresh-viewer volunteer) and the timed solo dry-run (K3)** — the two activities that test
  whether any of this worked.

---

## Assumptions adopted in this unattended session

- **ASM-1.** The session date remains the assumed **2026-10-01**; H1 is 21 days overdue and
  unconfirmed. Every interval in this document derives from it.
- **ASM-2.** I did not push, deploy, or trigger any workflow. The tree is clean and already pushed;
  H6 explicitly states a human must trigger the `workflow_dispatch`.
- **ASM-3.** I ran the unit suite, the coverage gate, the Python guard suite, and all six integrity
  guards myself. I did **not** re-run the full Playwright e2e or visual suites — they are long, and
  the tree is byte-identical to the one the 2026-09-05 report verified green (69/69). Every other
  claim here was reproduced today.
- **ASM-4.** For Theme A, I adopt "fix the model now as explicitly illustrative" over "wait for H3's
  real deal data," because H3 is overdue with no owner action and a degenerate model in front of a
  lender is worse than an illustrative non-degenerate one.
- **ASM-5.** For Theme D, I adopt an input-manifest guard over image hashing or perceptual diffing,
  because matplotlib output is not byte-stable across platforms and a flaky guard is worse than none
  — a lesson this repo has already learned twice (WebKit pixel instability, the `UNKNOWN → exit 0`
  freshness path).
- **ASM-6.** For Theme J, I adopt milestone-only deck commits plus `.gitattributes` over Git LFS,
  because LFS setup cost 26 days from a session is a poor trade for a problem that is not yet acute.
