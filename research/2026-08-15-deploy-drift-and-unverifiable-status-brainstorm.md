---
title: "DPPA-Case: The Work Shipped, the Deploy Didn't, and the Status Metadata Can't Be Trusted"
date: "2026-08-15"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze this project's current state, codebase, documentation and architecture; brainstorm what improvements, features, refactors, architectural changes or optimizations would take it to the next level. Unattended run — no questions, adopt the recommended option and note the assumption."
slug: "deploy-drift-and-unverifiable-status"
builds_on:
  - "research/2026-07-26-localization-integrity-and-teaching-defaults-brainstorm.md"
  - "research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md"
  - "plans/2026-07-25-guardrail-integrity-and-localization-plan.md (all 6 phases executed, commits d443009…3636705)"
  - "plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md (marked complete; verified NOT executed — see Theme C)"
---

# Brainstorm: What a Fresh Pass Found on 2026-08-15

## 0. State of play — verified today by running things, not by reading docs

| Fact | Evidence |
|---|---|
| Working tree clean; HEAD = `3636705`; master | `git status --porcelain` empty |
| Unit tests green | `cd app && npm test` → **73 passed (9 files)**, 12.6 s |
| Lint green | `npm run lint` → clean exit |
| **Prettier now green** | `npx prettier --check src e2e scripts` → "All matched files use Prettier code style!" |
| Prose/figure guards green | `check_retired_figures.py` PASS (42 files: 28 prose, 14 scripts) · `verify_prose_figures.py` PASS (377 tokens / 28 files) |
| Committed exports match the engine | ran `node scripts/export-spine.mjs && node scripts/export-sweep.mjs`; `git diff` **empty** (byte-identical, nothing changed) |
| **The live app is stale** | `check_deploy_freshness.py --skip-build` → **`DEPLOY-FRESHNESS STALE`**; live marker `22bae59` (2026-07-25) |
| **`/sw.js` is not on the live host** | `GET https://dppa-case.web.app/sw.js` → **200, 2073 bytes = index.html** (the catch-all rewrite), not the service worker |
| Human-blocked register **red** | `check_human_blocked_register.py` → exit 1; **H1 and H6 both `[DUE-SOON] +0d`** (due *today*) |
| `matplotlib` is not installed | `py -c "import matplotlib"` → **ModuleNotFoundError**; no `requirements.txt` anywhere in the repo |
| Committed deck older than its builder | deck last committed `01775b4` **2026-07-11**; `build_oct_teaching_deck.py` last committed `f524218` **2026-07-25** |
| App i18n is scaffolding, not translation | `vi` **121 / 132** keys `UNTRANSLATED`; `zh` **129 / 132** |
| Every plan in `plans/` is closed | 17 plans: complete / superseded / abandoned. **Zero open forward work.** |

**Calendar:** **47 days** to the assumed 2026-10-01 session · **31 days** to the 2026-09-15 content
freeze · **10 days** to H2 (translator) · **H1 and H6 are due today and will be overdue tomorrow.**

**The last session executed well.** PHASE-03 through PHASE-06 of the 2026-07-25 plan all landed:
`i18n.js` + `strings.js`, a real service worker with a build-hash manifest, an axe accessibility
spec, a coverage ratchet, the corrected `.prettierrc` applied repo-wide, explicit `.js` import
extensions with the resolve-loader shim deleted, and a root `CLAUDE.md` that is genuinely good. The
four-consecutive-sessions-with-an-un-burned-tail pattern that the last three brainstorms named is
**broken**. That is real progress and it should be said plainly.

**The story of this pass is what happened next.** Four phases of work shipped to `master` and
**none of it reached the audience** — the QR code on the deck's closing slide still serves the
2026-07-25 build. The single guardrail built to notice exactly this cannot fail. And the project's
own status metadata now asserts things that are provably false, which means the repo's proudest
property — machine-checked, unfalsifiable claims about numbers — stops at the boundary of claims
about *work*.

---

## Theme A — Everything built in the last three weeks is invisible to the audience ⭐ highest consequence, ~20 minutes to fix

`tools/check_deploy_freshness.py --skip-build`, run today:

```
DEPLOY-FRESHNESS STALE: live assets ['/assets/index-Bev1tNA7.css', '/assets/index-D8mQ4Yxn.js']
!= local build assets ['/assets/index-DAb2bQ32.js', '/assets/index-DYe5Sj4c.css']
(live marker 22bae59)
```

`22bae59` is *"phase-1: fix cache-header glob"*, committed **2026-07-25**. Everything after it is
in git and not on the internet:

| Commit | What is not live |
|---|---|
| `d443009` | the entire trilingual mechanism — the language selector does not exist on the live site |
| `3ec2db2` | **the offline service worker** and the Chart.js tree-shake |
| `2df2874` | (CI only, no user impact) |
| `84e5503`, `1497755`, `3636705` | (style/imports/docs, no user impact) |

The service worker is the one that hurts. It is the mitigation for **the single most-repeated risk
in this repo** — venue wifi failing mid-session — and the entire ~6 MB apparatus of six embedded
MP4 fallback slides exists as insurance against that same risk. It was designed, implemented,
tested (`app/e2e/offline.spec.js`, three specs, with careful documented notes about Chromium and
WebKit offline-emulation limits), reviewed, merged… and then not deployed. Today:

```
GET https://dppa-case.web.app/sw.js  →  200 OK, 2073 bytes
GET https://dppa-case.web.app/       →  200 OK, 2069 bytes
```

Those are the same document. `app/firebase.json:9-14` rewrites `**` to `/index.html`, so a missing
`/sw.js` is served as HTML with a **200**, not a 404. `main.js:280` calls
`navigator.serviceWorker.register('/sw.js')`, the browser gets `text/html`, registration throws,
and the `.catch()` at `:280-282` writes a console error nobody is watching. The venue-offline drill
in `plans/2026-october-readiness-checklist.md` ("load the app once, enable airplane mode, confirm
it still loads") **fails today**, silently, and would have been discovered on the day.

**A1 — Deploy.** `cd app && npm run predeploy && npx firebase deploy --only hosting --project
dppa-case`, then `py tools/check_deploy_freshness.py --write-log`. This is the highest
value-per-minute action available in the repo right now. *Not taken in this unattended session —
see ASM-2.*

**A2 — `predeploy` is not "the local CI equivalent", and `CLAUDE.md` says it is.**
`app/package.json:14` defines `predeploy` as `lint && test && e2e && build`. The `quality` job in
`.github/workflows/ci.yml:52-62` also runs `npx prettier --check src e2e scripts`, `npm run
coverage`, and `npm run e2e:visual`. `CLAUDE.md` §2 calls `predeploy` "the local CI equivalent."
Either add the three missing steps or change the sentence. The gap is small; the claim being
wrong is the problem, in a repo whose whole thesis is that claims must be checkable.

**A3 — There is no `deploy` script at all.** The deploy command lives in prose in three places
(`CLAUDE.md`, `app/deployment.md`, the readiness checklist). A `"deploy": "npm run predeploy &&
firebase deploy --only hosting --project dppa-case && node -e ..."` script, plus `--write-log`
chained onto it, makes the documented ritual a single executable, and makes "was the log updated?"
a property of the command rather than of the operator's memory.

**A4 — The service worker degrades silently when its manifest is missing.**
`app/public/sw.js:9-15`: `loadManifest()` returns `null` on any failure, `precache()` then caches
`STATIC_URLS` only, and `CACHE_NAME` becomes `dppa-app-unknown`. Because of the catch-all rewrite,
a missing `/sw-manifest.json` returns **200 with HTML**, `res.json()` throws, and the app ends up
with a cache that exists, is named plausibly, contains `/` — and contains **none of the hashed JS
that the app needs to run**. Offline then fails while every observable signal says "cached." The
e2e spec catches this locally (it asserts a `.js` is in the cache), but the failure mode is
production-shaped. Make `precache()` throw when the manifest is unreadable so `install` fails
loudly, or validate that the parsed manifest has a non-empty `assets` array.

---

## Theme B — The guard that exists to catch Theme A has never compared anything, and now we know what that cost ⭐ carried unfixed from 2026-07-26

`.github/workflows/freshness-checks.yml` is unchanged since 2026-07-22:

```yaml
deploy-freshness:
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
    - run: python tools/check_deploy_freshness.py     # :14
```

No `setup-node`, no `npm install`. The checker's first action is `subprocess.run(["npm", "run",
"build"], cwd="app")` (`tools/check_deploy_freshness.py:83-95`). `vite` is a devDependency; on a
bare runner `app/node_modules` does not exist; the build exits non-zero; `run_local_build()`
returns `False`; the checker prints `DEPLOY-FRESHNESS UNKNOWN: local build failed` and **returns
0** (`:145-148`). The job goes green. `tools/tests/test_check_deploy_freshness.py:178` *asserts*
this behaviour, so the test suite green-lights the design that makes the job inert.

The 2026-07-26 brainstorm called this out with "⭐ act before 09:00 UTC tomorrow." Three weeks
later it is still there — and it is no longer a hypothetical. **Between 2026-07-27 and 2026-08-10
the site went stale, and four consecutive Monday runs of the job that exists to detect exactly that
reported nothing.** The same checker, run by hand today, found it in 4 seconds. This is now the
repo's cleanest documented case of a guard whose green is uninformative, and it is worth writing
into `corrections-log.md` as a rule, not just fixing.

**B1 — Give the job the environment its checker needs.** `actions/setup-node@v4` (node 24, npm
cache on `app/package-lock.json`) + `npm install` in `app/`, mirroring `deck-parity`. Five lines.

**B2 — `--strict`.** In CI, a failed build or an absent `dist/index.html` is a configuration bug,
not a flake: exit 1. Keep the lenient default for laptops. Network unreachability stays exit-0 in
both modes — that one really is transient. Extend `tools/tests/test_check_deploy_freshness.py` with
strict-mode cases; the existing lenient assertions stay and become the documented contrast.

**B3 — The *other* freshness job cries wolf permanently.** `check_human_blocked_register.py` exits
1 when any item is overdue **or due within 7 days**. H1 and H6 hit that window on 2026-08-08 and
are due today; both will be overdue tomorrow, with no owner action possible from a coding session.
So `freshness-checks` has been red every Monday for two weeks and will stay red every Monday
through October. One job that can never fail, one that can never pass — between them, the weekly
notification now carries zero bits. Give the register checker a distinct exit code or a
`--acknowledged-through DATE` field so a *known, accepted* slip is quiet and a *new* one is loud.

**B4 — `--write-log` is still invoked by nothing.** `app/deployment.md:19-22` says the Last Deploy
table "is maintained automatically by `check_deploy_freshness.py --write-log` on every
verified-fresh check." No workflow and no npm script passes that flag. It has been run by hand
exactly once, on 2026-07-25. Wire it into A3's deploy script, or soften the wording.

---

## Theme C — The project's status metadata is provably false ⭐ new, and it invalidates "what's left to do"

The repo has extraordinary machinery for making claims about *numbers* falsifiable. It has none
for claims about *work*, and those claims have now drifted badly.

### C1. A plan titled "Gate Credibility & Pipeline Hardening" is marked complete and was never started

`plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`:

```
status: "complete — bulk-corrected 2026-07-31 per directive: plan predates 2026-07-20 and is
         presumed fully implemented (NOT individually verified against git/code)"
```

Its 80 task checkboxes are **80 unticked, 0 ticked**. No report exists for it in `reports/`. I
verified four of its tasks against current code:

| Task | Claim | Reality today |
|---|---|---|
| TASK-01-02 | extend `STRIKES` to `[…, 1500, 1550]` | `export-sweep.mjs:35` is still `[1100 … 1450]` |
| TASK-02-01 | create `requirements.txt` | no such file anywhere in the repo |
| TASK-03-05 | delete the dead loop at `audit_teaching_deck.py:72-76` | still there, `:73-77` |
| TASK-03 verification | `grep -c "EXTRA_ALLOWED" verify_deck_numbers.py` → `0` | still present, `verify_deck_numbers.py:29` |

The 2026-07-31 bulk correction applied this same "presumed fully implemented (NOT individually
verified)" status to **nine** plans. Across five of them: **254 unticked tasks, 19 ticked.** Some of
that work genuinely was done under later plans (the 07-17 prose-parity guards demonstrably exist;
the 07-10 hardening deliverables are itemized in the readiness checklist's "Already done" section),
so the tallies are not all real debt. But the metadata no longer distinguishes the two, which means
**there is currently no reliable answer to "what is left."** For a project 47 days from a
fixed-date public commitment, that is the most expensive kind of unknown.

**C1a.** Un-mark the 07-16 plan (`status: "open — never executed; superseded in part by …"`) and
treat it as what it actually is: **a fully-specified, high-quality backlog for most of Themes D, F
and G below.** The work of specifying `compare_deck.py`, `requirements.txt`, the `deck-build` CI
job, the widened `NUMBER_PATTERN`, the per-slide figure manifest and the extended strike grid is
*already done*. It was mislabeled, not missing. Recovering it is the cheapest capability gain
available.

**C1b.** Add a `tools/check_plan_status.py` to the weekly job: for any plan whose `status` starts
with `complete`, fail if it has unticked `- [ ]` tasks **and** no matching `reports/*` artifact. The
repo already accepts this exact pattern for prose figures; extending it to plan status costs an
afternoon and makes the status field mean something again.

### C2. There is no open plan, and six human-blocked items are outstanding

`plans/2026-october-readiness-checklist.md` — the only artifact tracking the actual session — was
closed on 2026-08-10 as **"abandoned … by owner directive to unblock nightly planning,"** with its
own status text listing everything still outstanding: all six H-items, and every Mid-September,
content-freeze, late-September and day-of item. All 17 plans are now complete / superseded /
abandoned.

The directive is understandable — a permanently-open checklist blocks nightly triage. But the net
effect is that the repo's forward-work surface is empty while the actual forward work is not.
**C2a:** split the checklist in two — a `plans/` item for the coding-session work (which nightly
sessions can burn down and close honestly) and a `facilitator/october-run-plan.md` for the
human-only, date-bound items (which is a *presenter's* artifact, not a coding plan, and should
never have been in `plans/` competing for "is this done" semantics).

### C3. `audit_teaching_deck.py`'s number reconciliation is a literal no-op

Docstring (`:2-5`): *"…and reconcile every numeric string against `assets/teaching/spine-s1.json`."*

Code (`:73-77`):

```python
for t in texts:
    for num in re.findall(r"\b\d{1,3}(?:,\d{3})+\b", t):
        normalized = num.replace(",", "")
        if len(normalized) >= 3 and normalized not in known_millions:
            pass  # informational only; large numbers not in spine are flagged for manual review
```

`known_millions` is computed at `:38-43` and used nowhere else. The loop runs, finds mismatches, and
discards them. This is a third instance of the same species as Theme B — a guard that reports
success for a check it does not perform — and it is in a script that CI runs on every push. Either
make it fail (it would be redundant with `verify_deck_numbers.py`, which does the job properly) or
**delete the loop and the docstring sentence together**. The 07-16 plan already specified deleting
it (TASK-03-05).

---

## Theme D — "5 of 56" is 3.6× sensitive to a grid choice nobody defends ⭐ this closes ASM-7 of 2026-07-26 with hard numbers

The prior brainstorm observed that `INVESTOR_LCOE_VND_PER_KWH = 1450` is *exactly* `max(STRIKES)`
and that all five passing cells sit in that one column, but explicitly did **not** re-run the sweep
to see how much the headline would move. I did, by replicating `evaluateCell`'s arithmetic inline
against the shipped `buildFiveLineBill` (no file edited):

| Grid | cells | buyer | lender | investor | **all three** | headline |
|---|---|---|---|---|---|---|
| shipped `[1100…1450]` × 7 ratios | 56 | 52 | 14 | 7 | **5** | **5 of 56 — 8.9%** |
| `[1100…1550]` (two more steps) × 7 | 70 | 62 | 28 | 21 | **15** | **15 of 70 — 21.4%** |
| `[1100…1800]` step 100 × 7 | 56 | 45 | 35 | 28 | **18** | **18 of 56 — 32.1%** |

And the buyer gate, at ratio 1.0, does not fail until the strike passes **~1,850**:

```
strike 1400 →true  1500 →true  1600 →true  1700 →true  1800 →true  1900 →false
```

So the scarcity story is not a finding about DPPA economics. It is a finding about where the x-axis
was stopped — one step past the investor threshold and the pass rate more than doubles; three steps
past and it nearly quadruples. `assets/teaching/gate-sweep.json` is byte-identical to what the
engine produces today (I verified), so this is not drift; the *model* is honest and the *framing*
is not.

This matters more than a modelling nitpick because "5 of 56" is M5's punchline **and** its
checkpoint question — `facilitator/dppa-workshop-facilitator-guide.md:150`: *"In the 56-scenario
sweep, how many pass all three gates at once?"* — asked to a room that contains lenders. The first
follow-up is "what's your investor threshold?", and the honest answer today is "a round number
equal to the top of my x-axis."

**D1 — Extend `STRIKES` so the thresholds are interior to the grid** (the 07-16 plan's TASK-01-02
already specifies `[1100 … 1550]`). Re-run `export-sweep.mjs`, re-render the M5 heatmap, and — per
`CLAUDE.md` §6 — add the superseded strings to `tools/retired_figures.json` in the **same commit**.
`retired_figures.json`'s own `notes` field already pre-writes the exact strings to add: `'5 of 56'`,
`'5/56'`, `'of 56'`, `'56 scenarios'`, `'56 kịch bản'`, `'56种情景'`. Note that the guide's `:150`
and `:106` both need updating, and the deck's M5 body and speaker notes with them.

**D2 — Derive the thresholds from inputs, not from round numbers.** `DSCR_TARGET = 1.2` is exported
into `gate-sweep.json`'s `meta` and **used in no comparison**; `lenderPass` is `strike >= 1380`,
where `1380 = 1150 × 1.2`. A gate that is DSCR-shaped in its metadata and a flat per-kWh floor in
its code will not survive one question from the audience it is aimed at. H3 (recalibrate with real
Allotrope deal data) is due 2026-09-01 and may not land; if it doesn't, put the one-dimensionality
in the slide's own footnote, not only in the JSON's `note`.

**D3 — Teach the decomposition, it's a better story and it's free.** "52 pass buyer · 14 lender · 7
investor · 5 all three" shows *which gate binds*, which is the actual teaching point, and every
number is already in the committed JSON.

---

## Theme E — The app still argues against MISSION.md's core claim, and the strings for the fix are already written ⭐ carried, with a new twist

Re-verified today by importing the shipped `projectMultiYear` and `defaultInputs`:

| `strikeEscalation` | crossover | Year-1 savings | 20-yr lifetime |
|---|---|---|---|
| **0.04 (shipped default)** | **none (> 20 yr)** | −4,489 m | **−65,695 m VND** |
| 0.02 | year 14 | −4,489 m | +66,656 m |
| 0.015 | year 12 | −4,489 m | +94,999 m |
| 0.00 (locked strike) | **year 9** | −4,489 m | +170,430 m |

`app/src/data/default-scenarios.js:198-199` ships `evnEscalation: 0.04` and `strikeEscalation:
0.04`. MISSION.md's second success criterion is *"why a virtual DPPA is rarely a Year-1 discount and
where the value actually comes from (EVN escalation vs a locked strike)"* — a **differential**. The
shipped differential is zero. A CFO who scans the QR code lands on "Crossover: > 20 yr" and a
**65.7 billion VND 20-year loss versus doing nothing.**

**The new finding: the fix was half-built and then abandoned.** PHASE-03 added these keys to
`app/src/data/strings.js` — and nothing in `src/` references any of them:

```
controls_locked_strike          ← the "Locked strike" preset button (Theme C2 of 2026-07-26)
multiyear_differential_template ← the "Escalation differential: +X.X%/yr" pill
assumptions_fmp_source
theme_presenter_toggle          (only used by theme.js — see below)
theme_presenter_toggle_aria
```

`ui.js:583-584` still prints `EVN 4.0%/yr` and `Strike 4.0%/yr` as two independent facts; the
quantity that decides the entire crossover story appears nowhere. So the string table promises a UI
that does not exist — and the translator engaged in 10 days (H2) will be asked to translate labels
for **features that were never built**. That is the localization equivalent of a stale figure.

**E1.** Set `strikeEscalation` to a non-zero default so the mechanism is visible on first load.
Recommendation: **1.5–2%/yr** — defensible as a partially indexed strike, and it puts the crossover
at year 12–14, inside the horizon. Document it with the same provenance-comment discipline as the
neighbouring constants, and run the full `CLAUDE.md` §5 regeneration chain, because this is an
escalation-assumption change.

**E2.** Build the two features whose strings already exist: the differential pill and the
one-click "Locked strike" preset. ~30 lines, and it turns MISSION.md's sentence into a two-second
live demonstration — click, watch crossover jump from "> 20 yr" to "year 9."

**E3.** Retarget teach-mode M4. All six steps in `app/src/data/teach-steps.js` drive `workshop1` at
strike 1250 / FMP 1150; M4 asks *"does the DPPA line ever cross below the BAU line?"* where the
answer is year 1 regardless of escalation. The step demonstrates nothing. Point it at a
configuration where the gate is genuinely close.

**E4 (decide, don't carry).** `projectMultiYear` holds FMP flat for 20 years; `export-sweep.mjs:24`
escalates FMP at 4%/yr. M4's crossover and M5's heatmap assume different paths for the same
variable, in the same deck, and the app's own label says "FMP flat" — advertising the assumption a
lender challenges first. Align them or state the divergence in the facilitator guide.

---

## Theme F — PHASE-03 shipped a language switcher that is 92% English, and the guards still stop at the language boundary ⭐ 10 days to the translator

The trilingual mechanism is real and well-built: `i18n.js` resolves `?lang=` → `localStorage` →
`navigator.language` → `en`, with per-key English fallback and a one-time console warning. But:

```
vi: 121 / 132 keys UNTRANSLATED
zh: 129 / 132 keys UNTRANSLATED
```

A visitor who taps **VI** gets an English app with a Vietnamese `<html lang>`. That is arguably
worse than no switcher, because it looks like a broken translation rather than an
English-only tool. Combined with the 66 `UNTRANSLATED` entries still in
`assets/teaching/terminology-map.json`, the translation surface has **grown from 64 entries to
~130** since the last brainstorm, and H2's deadline has moved 20 days closer.

**F1 — Brief the translator once, on both files, with the number contract already fixed.** The
guards are still monolingual, exactly as the last pass described, and none of it has been addressed:

- `verify_deck_numbers.py:21` is hard-wired to `ceba/DPPA Presentation Oct 2026 To Teach.pptx` and
  ignores `sys.argv`; `build_oct_teaching_deck.py` writes `… To Teach {lang}.pptx`. The verifier
  can never open the vi or zh deck. Its `NUMBER_PATTERN` (`:24`) is comma-only, so even if pointed
  at them it would find **zero** tokens in correct Vietnamese typography (`11.020`) and exit 0 — a
  vacuous pass. The checklist line "re-run `verify_deck_numbers.py` against each language build" is
  unexecutable.
- `assets/teaching/terminology-map.json` is scanned by **nothing**. `tools/retired_figures.json`'s
  `scan` is prose and `scanScripts` is `*.py *.js tools/*.py app/scripts/*.mjs`;
  `verify_prose_figures.py:32-35` has the same prose list. The map's `en` snapshots already carry
  literals like `11,020` and `9,063` frozen out of the spine, and 66 entries are about to be filled
  in with numbers by a translator, in a file outside every guard.
- `verify_prose_figures.py:37` requires **two or more** comma groups (≥7 digits) and `:68` admits
  only canonical values `>= 1_000_000`. So `11,020`, `9,063`, `8,563`, `5,947`, `1,800`, `817`,
  `1,427`, `2,204` — the millions-rounded figures the deck shows and the presenter says out loud,
  appearing ~20 times in the facilitator guide — are invisible to it.
- `app/src/modules/formatters.js:13,23` hardcode `Intl.NumberFormat('en-US')`. `vi-VN` groups with
  `.` and decimalizes with `,`. Shipping translated labels around en-US numerals reproduces the
  defect below, in the app, in front of the room.

**F2 — There is a locale-typography defect already shipped in a learner artifact.**
`lessons/0009-scenario-3-excess-vi.html:90`, a Vietnamese worksheet row:

```html
<code>5,000,000 × 1,100 × 1.026 × 1.008</code>   →  5,688,144,000
```

Read with Vietnamese conventions, `1,100` is *one point one* and `1.026 × 1.008` is **1026 × 1008**.
The loss coefficients — the most confusable pair in the whole settlement — are printed in a form
that reads as a 1000× error to the audience the file exists for. `:46` repeats it in a summary card.
Unfixed since it was first identified three weeks ago; it is a two-line fix in a shipped handout.

**F3 — The right structural answer, before the translator starts: stop putting numbers in the
translation layer.** Split each `terminology-map.json` sentence into a translatable frame plus
`{placeholder}` slots the builder fills from the spine. The translator never touches a figure, the
vi/zh decks inherit number-correctness by construction, and the guards' language-blindness stops
mattering for the class of error that matters most. This is one contract change that retires an
entire category of proofreading.

**F4 — Small but real: switching language reloads the page and destroys the demo state.**
`main.js:263` does `window.location.search = params.toString()`. A presenter who switches language
mid-demo loses the selected hour and every slider adjustment, back to defaults. `initI18n` +
re-render would keep state; or, better, fold it into Theme H2's URL-state work so the language is
just one more serialized parameter.

---

## Theme G — The deck half of the pipeline cannot run anywhere, and nothing notices ⭐ new

`CLAUDE.md` §5 documents a strict regeneration order. Step 2 of it is
`PYTHONPATH= py build_teaching_visuals.py --lang en`. On this machine:

```
py -c "import matplotlib"  →  ModuleNotFoundError: No module named 'matplotlib'
```

There is **no `requirements.txt`, `pyproject.toml`, or `environment.yml`** anywhere in the repo, and
CI installs exactly one Python package (`ci.yml:90`: `pip install python-pptx`). Auditing the six
scripts `NOTES.md` calls "live":

| Script | Needs | Runs locally? | Runs in CI? |
|---|---|---|---|
| `audit_teaching_deck.py` | pptx | ✅ | ✅ |
| `verify_deck_numbers.py` | pptx | ✅ | ✅ |
| `build_worksheet_answer_docx.py` | docx | ✅ | ❌ |
| `build_oct_teaching_deck.py` | pptx | ✅ | ❌ never executed |
| **`build_teaching_visuals.py`** | **matplotlib**, numpy, PIL | ❌ | ❌ |
| **`build_cfd_slide.py`** | **matplotlib**, PIL, ffmpeg | ❌ | ❌ |

**Two of the six can run in neither environment.** `build_teaching_visuals.py` renders every figure
on every slide — the Sankey build, the M5 heatmap, the seesaw, the three-doors, the TOU strip, in
three languages. If a number changes tomorrow, `CLAUDE.md`'s documented regeneration order stops
dead at step 2 until someone installs matplotlib, and nothing in the repo says which version.

Worse, the deck builder is **never exercised by CI at all**. The `deck-parity` job verifies the
*committed binary* against the JSON; it never runs `build_oct_teaching_deck.py`. So the committed
deck (`01775b4`, **2026-07-11**) is two weeks older than its builder (`f524218`, **2026-07-25**),
and there is no mechanism that can tell you whether rebuilding would produce the same deck. This is
structurally identical to Theme A — a generated artifact silently diverging from its source — in
the half of the repo that has no freshness guard at all.

**G1 — `requirements.txt`, pinned** (07-16 TASK-02-01, already specified). Change `deck-parity`'s
`pip install python-pptx` to `pip install -r requirements.txt` in the same commit.

**G2 — A `deck-build` CI job** (07-16 TASK-02-03) that installs the requirements, runs the builder
to a temp `--out` dir, and diffs the rendered text against the committed deck via a
`tools/compare_deck.py` (07-16 TASK-02-02, fully specified there, including a planted-change test).
Binary `.pptx` cannot be diffed directly; the text-level comparison is the workable form and the
plan already worked that out.

**G3 — Correction to a prior brainstorm's G9.** The 2026-07-26 pass suggested the 12 `.gif` files
(10.9 MB, vs 3.59 MB for the matching `.mp4`s) might be deletable "if nothing consumes them
anymore." **They are consumed, load-bearingly:** `build_oct_teaching_deck.py:320,351,356` uses them
for the hidden fallback slides — the wifi-failure insurance — and five lesson handouts embed them
directly (`lessons/0007…0009-*.html`). Do **not** delete them. If size matters, re-encode; the GIFs
are the artifact that works when everything else doesn't.

---

## Theme H — Cheaper items a fresh read surfaced

- **H1. The coverage gate is a global average, so it does not protect the one file that matters.**
  `vite.config.js:57-62` sets `lines 78 / branches 71 / functions 79 / statements 77`; measured
  totals are `77.63 / 71.39 / 79.09`. Per file: `settlement.js` is at **75.18% branch**, `tour.js`
  at **6.97% statements**, `ui.js` at 67%. `settlement.js` is the file every number on every slide
  descends from; a refactor could halve its branch coverage and CI would stay green as long as
  `ui.js` picked up the slack. Add a per-file threshold for `settlement.js` (and ideally
  `export-spine.mjs`/`export-sweep.mjs`, currently excluded from coverage entirely at `:55`). Also
  note the global margins are **<1 pp on three of four** — that is a ratchet tight enough to fail on
  noise.
- **H2. The a11y spec's "default view" test does not test the default view.**
  `app/e2e/a11y.spec.js:29-33` — `test('…on the default view')` navigates to `/?present=1`. Of the
  four scans, two use `present`, one uses `teach`, and only the `?lang=vi` one (`:49`) exercises the
  dark default theme that every QR-code visitor actually lands on. Rename the test and add a real
  default-theme scan.
- **H3. The app's visual identity contradicts `NOTES.md`'s "MUST match the deck."** NOTES.md
  mandates white `#FFFFFF`, ink `#212121`, teal `#0097A7`, Arial/Helvetica. The app's default theme
  is dark neon (`index.html:14` `background: #050816`, Inter), and even the `present` theme
  (`theme.css:1-13`) uses `#f3f4f6` / `#005a78`, not the deck tokens. The app and the deck will be
  side by side on a projector. Either update NOTES.md to acknowledge the app's own identity as
  deliberate, or bring `present` onto the deck tokens — but the current state is a documented
  requirement being silently violated in the artifact the audience is invited to open.
- **H4. Three names for one app, and one of them is an internal codename.** `index.html:20`
  `<title>Vietnam DPPA **Neon** CFO Calculator</title>` — that string is the browser tab for every
  QR scan and every projected demo; `og:title` (`:8`) says "Vietnam DPPA CFO Calculator"; the `<h1>`
  (`strings.js` `header_title`) says "DPPA CFO visual explainer." Pick one.
- **H5. The hero paragraph leads with a caveat.** `header_hero` opens with "…using documented
  example inputs and an illustrative FMP curve (no primary NSMO/ERAV source available)." The honesty
  is right and `RESOURCES.md` earns it, but a parenthetical negative source claim is the wrong first
  sentence for a CFO landing cold. Move it to the assumptions row — there is even an unused
  `assumptions_fmp_source` key already sitting in `strings.js` waiting for it.
- **H6. `EXCHANGE_RATE = 26500` is still unsourced and pinned by its own test.**
  `formatters.js:1`; `chart.js` divides by it; `formatters.test.js:6` asserts `toBe(26500)`. Every
  USD figure a CFO reads scales by one integer with no provenance comment, no date, no entry in
  `prose_figure_literals.json`, and no place in the retirement rule — the only load-bearing number
  in the project outside the integrity apparatus. Minimum: a dated provenance comment in the house
  style and an exported `EXCHANGE_RATE_AS_OF`. Better: make it a control, so a challenge in the room
  is answered by moving a slider.
- **H7. `1.026 × 1.008` is still defined independently in three runtime places** —
  `main.js:146`, `export-spine.mjs:13-14`, `export-sweep.mjs:21-22` — plus a `?? 1.008` fallback in
  `settlement.js:136` and a comment in `default-scenarios.js:192`. `default-scenarios.js` exports
  `lossFactor: 1.0342` but not the precise pair, so every consumer re-derives it. Revise the Decree
  coefficients and the exporters regenerate self-consistently while the app disagrees — the one
  drift path CI's `git diff --exit-code` structurally cannot see. Export `LOSS_FACTOR_K`,
  `LOSS_FACTOR_KPP`, `LOSS_FACTOR_PRECISE` once; import them in all three. ~20 minutes.
- **H8. A hand-typed formula string lives inside the "never hand-typed" export.**
  `export-spine.mjs:193`: `spotFormulaText: '1,500,000 × 1.008 × 1,100'`. The adjacent
  `spotValueVnd` is computed; the string is not, and `verify_prose_figures.py:100` verifies the
  numeric siblings but not it. It is consumed by `build_worksheet_answer_docx.py:174` and printed
  into the bilingual worksheet learners fill in. Build it from the same three values.
- **H9. Root `package.json:5` still points at an archived file** (`"main": "build-deck.js"`, moved to
  `archive/` in PHASE-02). `CLAUDE.md` §1 already explains the root install exists only for that
  archived script — which is a good reason to retire it, not to keep documenting it.
- **H10. No `.gitattributes`.** `deck-parity`'s `git diff --exit-code` on the regenerated JSON works
  today only because this machine has `core.autocrlf=true`. A contributor with `autocrlf=false`
  makes that job fail on every run for reasons unrelated to the engine. `* text=auto` plus
  `*.json text eol=lf` is a one-line insurance policy.
- **H11. Eight stale `*.log` files in `app/`**, oldest from April. Gitignored, harmless, still debris
  in the directory every session starts in.

---

## Theme I — Ideas that would raise the ceiling

Ordered by estimated value-per-hour **for the October session**.

**I1. A presenter rehearsal harness — still the missing measurement of the actual mission.**
Carried from 2026-07-26, and now more urgent: MISSION.md defines success as *the presenter's*
mastery (draw the five-line bill from memory, walk three cases and three gates without notes,
whiteboard each module in under five minutes). The repo has an extraordinary apparatus for producing
artifacts and **nothing** that measures that. The fresh-viewer kit measures the audience. A small
self-contained HTML page or `tools/rehearse.py` generating timed retrieval drills **from
`spine-s{1,2,3}.json` and `gate-sweep.json`** — "state line 3 for S2", "what's C_KH for S1", "which
gate binds at strike 1,300" — with a 5-minute whiteboard timer per module and an append-only attempt
log, costs about an hour, cannot drift from the numbers by construction, and is the only artifact
that would measure the thing the whole project is for. 47 days out, with no rehearsal scheduled
before "mid-September," this is what I would build first once Themes A and B are green.

**I2. Encode scenario state in the URL.** Carried, still absent (`main.js` reads only `lang`,
`present`, `teach`, `test`). It is the delivery mechanism for three separate things the repo already
wants: the presenter saying "open this exact bill on your phone"; the fresh-viewer kit specifying a
reproducible starting state; and Theme E's demo — a `?strikeEsc=0` link *is* the locked-strike
story, and the deck can carry it as a second QR code. ~40 lines to serialize eight numeric inputs,
and it subsumes F4.

**I3. One command for the regeneration order.** `CLAUDE.md` §5's four-step chain is documented in
prose in three files and, per Theme G, currently unexecutable. A `tools/pipeline.py --lang en`
that runs export → visuals → deck → both audits, failing loudly at the first missing dependency,
turns a documented ritual into a testable artifact — and is the natural place to enforce the order
that "skipping a step produces a deck whose figures disagree with its own charts" warns about.

**I4. Name the pipeline as a product.** Carried from three prior brainstorms. *Settlement engine →
JSON spine exports → deck builder → prose verifier → gate-sweep credibility check → trilingual
terminology gate → freshness guardrails* is an Allotrope capability, not a one-workshop deck; the
next case study costs "swap the engine and the terminology map." It is legible today only by reading
eight `plans/*.md`. A short `docs/pipeline-architecture.md` is also the natural home for F3's
"numbers never enter the translation layer" contract — the stage the pipeline is missing.

**I5. Presenter crib cards generated from the deck's own speaker notes.** Carried unchanged from
07-17 / 07-21 / 07-25 / 07-26. The `python-pptx` extraction already exists in
`audit_teaching_deck.py`; the artifact cannot drift from the deck by construction. Pairs naturally
with I1.

**I6. July-vs-October A/B evidence report.** Carried. Words, symbols and visuals per module across
`ceba/DPPA Presentation July 2026 To Teach.pptx` and the October build, using tooling that already
exists. ~1 hour, and it is the only evidence the redesign worked that does not depend on the single
unscheduled fresh-viewer test (H5 in the human-blocked register, still unscheduled).

---

## Recommended sequence

Grouped into coherent sessions, ordered by consequence-per-hour.

1. **Deploy, then make the deploy guard able to fail (≈45 min, do first).** Theme A1–A4 + B1–B2.
   Three weeks of merged work is invisible to the audience, including the offline service worker
   that mitigates the session's biggest risk, and the guard that should have caught it reported
   green four Mondays running. Everything else in this document is worth less than this.
2. **Restore trustworthy status (≈1 h).** Theme C: un-mark the 07-16 plan and reopen it as the
   backlog it is; split the readiness checklist into a coding plan and a presenter run-plan; delete
   or fix `audit_teaching_deck.py`'s no-op loop; add `check_plan_status.py` to the weekly job. Until
   this lands, every later prioritization is guesswork.
3. **Make the guards multilingual, then brief the translator once (one session; hard deadline 10
   days).** Theme F, in order: add `assets/teaching/*.json` to both guard scans; convert the
   terminology map to number-placeholder frames (F3); teach `verify_deck_numbers.py` `--lang` and
   locale-aware regexes; lower `verify_prose_figures.py`'s floor; fix the VI typography in
   `lessons/0009-*-vi.html`; make `formatters.js` locale-aware. Then hand the translator both files
   at once.
4. **Fix what the app teaches by default (≈1 h).** Theme E: the `strikeEscalation` default, the
   differential pill and locked-strike preset (**the strings are already written**), an M4 teach step
   that can fail. Highest teaching-value-per-line in the repo, and it is the state the QR code
   delivers.
5. **Make "5 of 56" survive a lender's question (≈1 h).** Theme D: extend `STRIKES` past the
   investor threshold, re-run the sweep, retire the old count **in the same commit**, put the
   per-gate decomposition in the facilitator guide, footnote the gates' one-dimensionality.
6. **Give the deck pipeline an executable environment (≈1.5 h).** Theme G: `requirements.txt`, the
   `deck-build` job, `tools/compare_deck.py`. Mostly transcription from the 07-16 plan.
7. **I1 — the rehearsal harness (≈1 h).** The only artifact that measures MISSION's stated success
   criterion, and the calendar is 47 days.
8. **Theme H sweep (≈1 h).** Per-file coverage threshold on `settlement.js`, the a11y test rename,
   app naming, hero copy, `EXCHANGE_RATE` provenance, the loss-constant export, `spotFormulaText`,
   root `package.json`, `.gitattributes`, stale logs.
9. **I2 → I3 → I4 → I5 → I6** opportunistically, before the 2026-09-15 freeze where possible.

---

## Assumptions adopted (unattended run — no questions asked, per brief)

- **ASM-1 — Analysis only; the repo is byte-identical to how I found it.** The one mutating command
  I ran was `node scripts/export-spine.mjs && node scripts/export-sweep.mjs`, precisely because it is
  what CI's `deck-parity` job runs; `git diff` afterwards was **empty**, confirming the committed
  exports match the engine and leaving nothing to revert. No other file was written, no workflow
  triggered, no deploy performed.
- **ASM-2 — I did not deploy, despite Theme A being the top recommendation.** A deploy is
  outward-facing, irreversible in the sense that it changes what the public and the QR code serve,
  and requires the presenter's Firebase credentials. It is surfaced for a decision, consistent with
  this repo's standing practice for changes that alter what the audience sees.
- **ASM-3 — Theme D's counterfactual is a direct computation, not a re-run of the exporter.** I
  replicated `evaluateCell`'s arithmetic inline against the shipped `buildFiveLineBill` and
  `defaultInputs`, with the same escalation, horizon and threshold constants, rather than editing
  `export-sweep.mjs`. The shipped grid reproduced `buyer 52 / lender 14 / investor 7 / all 5`
  exactly, which validates the replication. This closes ASM-7 of the 2026-07-26 brainstorm, which
  explicitly left the magnitude untested.
- **ASM-4 — Theme C's "provably false" claim is scoped to what I verified.** I checked four
  specific tasks of the 07-16 plan against current code and found all four undone, and confirmed no
  `reports/*` artifact exists for that plan. I did **not** verify all 254 unticked tasks across the
  nine bulk-corrected plans; some of that work demonstrably was done under later plans. The claim
  made is that the status field is unreliable, not that all 254 tasks are outstanding.
- **ASM-5 — The 2026-10-01 session date remains assumed, not confirmed.** H1 has been open since
  2026-07-04 and is due today. Every interval in this document moves with it. At 47 days out with a
  10-day translator deadline, H1 is still the schedule's binding constraint, and it is now the
  longest-running unresolved item in the project.
- **ASM-6 — Theme E's recommended 1.5–2%/yr strike escalation is my choice, not a sourced figure**
  (carried unchanged from ASM-4 of 2026-07-26). Non-zero so the mechanism shows, below EVN's 4% so a
  crossover exists inside the horizon, defensible as a partially indexed strike. A real negotiated
  index should replace it, and doing so requires the full `CLAUDE.md` §5 regeneration chain.
- **ASM-7 — Theme F2's severity assumes the VI lessons are read with Vietnamese conventions.** If
  the intended readers use EN-convention numerals (plausible for finance professionals in Vietnam),
  the defect drops from "wrong by 1000×" to "inconsistent." I have not assumed that, because the
  file exists specifically to serve readers who need Vietnamese.
- **ASM-8 — Theme G's "runs nowhere" claim is about this machine plus CI as configured.**
  `matplotlib` is absent locally (verified) and absent from CI's install step (verified in
  `ci.yml:90`). Someone with a different local environment may be able to run the visual builders;
  the point stands that nothing in the repo declares or verifies that environment.
- **ASM-9 — I did not run `build_oct_teaching_deck.py` to test the committed-deck-vs-builder drift
  hypothesis**, because the script writes to the tracked deck path and would have modified a 15 MB
  committed binary. The drift *risk* is established from commit dates and the absence of any
  rebuild-and-compare mechanism; whether the current builder would actually produce a different deck
  is untested, and `tools/compare_deck.py` (G2) is precisely the artifact that would answer it.
