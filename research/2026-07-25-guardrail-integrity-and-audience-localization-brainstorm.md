---
title: "DPPA-Case: Guardrail Integrity, Audience Localization & the Last 68 Days"
date: "2026-07-25"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze the project's current state, codebase, documentation and architecture; brainstorm improvements, features, refactors, architectural changes or optimizations that would take it to the next level"
slug: "guardrail-integrity-and-audience-localization"
builds_on:
  - "research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md"
  - "research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md"
  - "research/2026-07-16-post-hardening-next-level-brainstorm.md"
  - "plans/2026-07-21-deploy-drift-repo-hygiene-plan.md (2 of 5 phases executed: PHASE-01, PHASE-02)"
---

# Brainstorm: What a Fresh Pass Found on 2026-07-25

## 0. State of play (verified today, not assumed)

Everything in this section was checked directly against the repo, the live site, or a
command run this session — not inferred from documentation.

| Fact | Evidence |
|---|---|
| Working tree clean; HEAD = `090a50d` (2026-07-22), 3 commits since the last session | `git status --porcelain` empty; `git log` |
| Unit tests green | `npm test` → **57 passed (8 files)**, 8.3s |
| Lint green | `npm run lint` → clean exit |
| Production build clean | `npm run build` → 258.00 kB JS / 84.88 kB gzip, 25.80 kB CSS, 622 ms |
| Live site is up and **byte-identical to HEAD's bundle** | `sha256` of live `/assets/index-CpURIX_m.js` == local `dist/` build: `6629fc74…33cb5f` |
| Human-blocked register: all 5 items OK, none due within 7 days | `python tools/check_human_blocked_register.py` → exit 0 |
| **Deploy-freshness check is RED right now** | `python tools/check_deploy_freshness.py` → `DEPLOY-FRESHNESS STALE: live=e55319e local=090a50d` **exit 1** |
| 3 of the last plan's 5 phases were never executed | no `archive/`, no `app/e2e/a11y.spec.js`, no `learning-records/0005`, no snapshot baselines |

**Calendar:** 68 days to the assumed 2026-10-01 session; **52 days to the 2026-09-15 content
freeze** (`plans/2026-october-readiness-checklist.md`). The translation path (H2, needed by
2026-08-25) is the first hard external dependency and it is 31 days out.

**Headline finding:** the deploy-freshness guardrail built three days ago is simultaneously
**failing** and **wrong about why** — and the reason it is wrong reveals that the production
bundle was built from an uncommitted working tree. The mechanism designed to make deploy state
machine-checkable currently reports a commit that could not have produced the served HTML. Details
in Theme A. This brainstorm does not re-litigate the number pipeline (hardened, and I verified its
gates still pass); it looks at guardrail *integrity*, the app's fitness for its actual audience,
and what is genuinely left before the freeze.

---

## Theme A — The freshness guardrail is self-refuting ⭐ act first

### A1. The live bundle was built from a tree that matches no commit

`tools/check_deploy_freshness.py` reads a `<meta name="build-commit">` tag that
`app/vite.config.js` injects from `git rev-parse HEAD` at build time. The live site serves:

```
<meta name="build-commit" content="e55319ef25c92a9b85957433b9a31373fad13027">
```

But `git show e55319e:app/vite.config.js` has **no plugin at all** — the marker plugin first
appears in `7329b58` (PHASE-02), the *next* commit. A build at `e55319e` therefore could not have
emitted that meta tag. The only consistent explanation: the deploy ran from a working tree holding
uncommitted PHASE-02 edits while `HEAD` was still `e55319e`.

Consequence: **the production artifact corresponds to no reviewable commit.** The one number the
guardrail exists to report — "what is live?" — is the one number it gets wrong. Nothing in CI, the
predeploy gate, or the checker itself notices, because the checker trusts the marker unconditionally.

*Fix:* have the marker plugin refuse to emit a bare commit when the tree is dirty — append `-dirty`
(`git status --porcelain` non-empty → `${commit}-dirty`), and make `check_deploy_freshness.py`
treat any `-dirty` marker as a hard failure with its own message. Then redeploy from a clean tree
so the marker becomes true. Fifteen minutes; converts an unfalsifiable claim into a checkable one.

### A2. The check will fire its first scheduled run as a false positive

`.github/workflows/freshness-checks.yml` runs Mondays 09:00 UTC. Its first-ever run is
**Monday 2026-07-27**, and it will fail — while the live JS bundle is byte-identical to HEAD's
(verified above). The check compares the marker against `git rev-parse HEAD`, so *any* commit
makes it red, including the two that caused this: `7329b58` (tooling + `vite.config.js`) and
`090a50d` (**a report `.md` file only**).

This is the classic alarm-fatigue setup: a weekly red for a docs-only commit teaches the reader to
ignore it, and the one week it means something is the week it gets dismissed. Every future
`research/`, `plans/`, or `reports/` commit — the majority of this repo's commits — will trip it.

*Fix (pick one, they compose):*
- **Scope the comparison to app-affecting history:** `git log -1 --format=%H -- app/` instead of
  `HEAD`. A docs commit no longer makes the site "stale," which is correct — it isn't.
- **Better: compare the artifact, not the label.** The checker already has network access; fetch
  the live `index.html`, extract the hashed asset filename, and compare it to the filename in a
  fresh local `vite build`. Content-hashed bundles make this an exact equality test that cannot be
  fooled by a dirty tree, a wrong marker, or a docs commit. The marker then becomes provenance
  metadata rather than the load-bearing signal.

### A3. `app/deployment.md`'s "Last Deploy" table is already wrong

It records `f5fd22a` for the 2026-07-22 deploy; the live marker says `e55319e`; the served bytes
match `090a50d`. Three sources, three answers. A hand-maintained deploy log is exactly the artifact
this repo has repeatedly proven cannot stay true (this is the third drift finding against
`deployment.md` in four weeks).

*Fix:* stop hand-maintaining the top row. Have `check_deploy_freshness.py` gain a `--write-log`
mode that appends/updates the table from what it actually observed, and make the human-authored
"Description" column the only thing a person types.

### A4. CDN caching can make any of this lie for an hour

`curl -I https://dppa-case.web.app` → `Cache-Control: max-age=3600` on `index.html`, and the same
`max-age=3600` on the content-hashed `/assets/*.js`. Two problems, opposite directions:

- **`index.html` cached an hour** means a post-deploy freshness check (or an attendee reloading
  after a fix) can read stale HTML — the checker's answer is up to 60 minutes behind reality.
- **Hashed assets cached only an hour** wastes a revalidation round-trip on exactly the network
  this project has flagged as a top risk (venue wifi), and blocks any long-lived offline cache.

*Fix:* add a `headers` block to `app/firebase.json` — `index.html` → `no-cache`, `/assets/**` →
`max-age=31536000, immutable`. Standard, five lines, and it makes A1–A3's fixes actually observable.

---

## Theme B — The app is English-only for a Vietnamese-and-Chinese audience ⭐ biggest product gap

This is, in my judgement, the highest-value *unbuilt* thing in the repo, and no prior brainstorm
has named it.

The deck pipeline is trilingual by construction: `build_oct_teaching_deck.py --lang vi|zh` refuses
to build while any consumed key is `UNTRANSLATED`, backed by `assets/teaching/terminology-map.json`
(**66 `UNTRANSLATED` entries remaining**). The lessons ship in en/vi/zh-cn. The worksheets are
bilingual. The facilitator guide plans for a per-language print run.

The **app** — the thing the deck's closing QR code sends people to, the thing MISSION.md calls the
demo aid — is:

- `<html lang="en">` (`app/index.html:2`), title *"Vietnam DPPA Neon CFO Calculator"*;
- every teach-mode annotation English-only (`app/src/data/teach-steps.js`);
- every UI label, five-line-bill row, formula caption, and chart axis English-only
  (`app/src/modules/ui.js`, 552 lines, all literals inline);
- the sole exception: a **4-step** EN/VI tour (`app/src/data/tour-steps.js`) — no Chinese, and it
  covers 4 nouns out of an interface with dozens.

So a Vietnamese plant CFO scans the QR code at the end of a Vietnamese-language session and lands
on an English tool. The repo has already paid for the hard part of localization — an approved
terminology map, a translation gate, a translator line-item in the human-blocked register — and the
app is simply not wired into it.

**B1 (the work).** Extract the ~80–120 UI strings from `ui.js` / `teach-steps.js` into
`src/data/strings.{en,vi,zh}.js` keyed by the *same keys* as `terminology-map.json`, resolve
language from `?lang=vi` (plus `navigator.language` fallback), and set `document.documentElement.lang`.
Non-trivial but bounded — one focused session — and `ui.test.js` (363 lines) already asserts on
rendered text, so it gives you the red/green harness for free.

**B2 (the leverage).** Once the app consumes the terminology map, **one** translator engagement
(H2, due 2026-08-25) covers deck + lessons + app instead of deck-only, and `build_oct_teaching_deck.py`'s
existing `UNTRANSLATED` refusal becomes a gate on the app too. Do B1 *before* H2 lands or the
translator gets briefed twice.

**B3 (the sequencing risk).** This must land before the **2026-09-15 content freeze**, because
freezing English content while the app is monolingual freezes the mismatch in place. 52 days.

---

## Theme C — Carried debt: 3 of 5 phases of the last plan were never executed

`plans/2026-07-21-deploy-drift-repo-hygiene-plan.md` is a five-phase plan; PHASE-01 and PHASE-02
were executed and committed. PHASE-03/04/05 were not, and are not tracked anywhere as open. Each is
independently valuable and explicitly designed to be parallelizable:

- **PHASE-03 (CI rigor).** No `app/e2e/visual.spec.js-snapshots/` directory exists, so
  `e2e:visual` is still `continue-on-error: true` in `.github/workflows/ci.yml` — the visual-regression
  gate remains decorative, as flagged on 07-16 and 07-21. Still no accessibility test (zero
  `axe-core` hits repo-wide) despite the projector-contrast requirement being a *manual* checklist
  item. Still no coverage reporting.
- **PHASE-04 (repo hygiene).** No `archive/` directory; the 18 root-level scripts and 5 orphaned
  decks are exactly as they were. See Theme D for why this one is no longer cosmetic.
- **PHASE-05 (`learning-records/0005`).** Now flagged by **four** consecutive brainstorms without
  action. `learning-records/` still ends at `0004` (2026-06-29) while the largest arc in the repo
  — July failure → October redesign → three hardening plans — remains undocumented.

**Observation worth naming:** the pattern across the last three sessions is *plan five phases,
execute the two urgent ones, brainstorm again*. The un-executed tail is accumulating faster than
it is being burned down. Either the remaining phases get executed as the *next* session's whole
scope, or they should be explicitly de-scoped — carrying them silently is the worst of both.

---

## Theme D — The number-pipeline guards have a blind spot: the generators themselves

This is new, concrete, and reachable.

`tools/check_retired_figures.py` and `tools/verify_prose_figures.py` both scan a fixed list of
*prose* targets (`NOTES.md`, `RESOURCES.md`, `MISSION.md`, `lessons.md`, `facilitator/**/*.md`,
`lessons/**/*.html` — see `tools/retired_figures.json`'s `scan` array). Neither scans the Python
scripts that **produce** slides.

And there is a live instance:

```
build_callouts.py:9    - Financing summary: "0 of 56 scenarios passed all three gates" +
build_callouts.py:166  add_text(slide, 0.4, 1.55, 4.0, 0.95, "0 of 56", size=48, color=RED, bold=True,
```

`"0 of 56"` is the **first entry in `tools/retired_figures.json`'s retired list** ("placeholder
before the real gate sweep", retired 2026-07-11, replaced by the computed `5 of 56`). A guard exists
specifically to stop that string reappearing — and a script that would render it at **48pt bold
red onto a slide** sits unguarded in the repo root, indistinguishable at a glance from the six
scripts that are still live. `build_oct_teaching_deck.py` and `build_teaching_visuals.py` correctly
read `PASS_COUNT` from `gate-sweep.json`; `build_callouts.py` does not.

This is the concrete failure mode PHASE-04's "label every root script" task was hypothesising, now
evidenced. **D1:** add `*.py`/`*.js` build scripts to the retired-figures scan (cheap, ~3 lines of
config). **D2:** execute PHASE-04's archive+label pass, prioritising `build_callouts.py`.

---

## Theme E — Code-health items a fresh read surfaced

None of these are urgent; all are cheap, and two of them are actively misleading.

**E1. `.prettierrc` contradicts the house style, so `npm run format` is a loaded gun.**
`app/.prettierrc` is `{semi: true, singleQuote: false, trailingComma: "all"}`. But `settlement.js`,
`ui.js`, `main.js`, `chart.js`, `formatters.js`, `profiles.js` are all written **without semicolons
and with single quotes**. `npx prettier --check src e2e` fails on **26 files**. Running the
documented `npm run format` today would rewrite the entire core engine to the opposite style in one
unreviewable diff. Either flip `.prettierrc` to match the dominant style (`semi: false,
singleQuote: true`) and then run it once, or delete the `format` script. Leaving it as-is is the
one option that is actively hazardous.

**E2. Five source files are minified into unreadable one-liners.** `src/modules/tour.js`,
`src/modules/tour.test.js` (4 lines total), `e2e/tour.spec.js` (3 lines), `e2e/visual.spec.js`
(**2 lines** containing a full nested loop), and `src/theme.css` are single dense lines, while the
rest of the codebase is conventionally formatted. `visual.spec.js` in particular is the spec that
PHASE-03 needs to be *edited* to bootstrap baselines. Reformat these five (this is what E1's
prettier pass is actually for).

**E3. Split-brain module-import style.** `settlement.js` uses explicit `./profiles.js` — NOTES.md
records *why* (plain Node ESM in `scripts/export-*.mjs` can't resolve extensionless paths). But
**21 other imports** across `main.js`, `ui.js`, `chart.js`, `flow-diagram.js`, `teach.js`,
`tour.js`, and every `*.test.js` are still extensionless, kept alive by
`scripts/js-resolve-loader.mjs`. One `sed`-scale change removes the need for the loader shim and
the class of bug entirely. (Also: `eslint.config.js` **ignores `scripts/**`** — the three scripts
that generate CI-verified JSON are the only unlinted JS in the app.)

**E4. `import Chart from 'chart.js/auto'`** (`src/modules/chart.js:1`) pulls every controller,
scale, and element. The app draws two chart types. Switching to explicit `Chart.register(...)`
typically cuts 30–40% off a 258 kB bundle. Low priority as a number — but see Theme F, where bundle
size stops being cosmetic.

**E5. Eight stale `*.log` files** sit in `app/` (`vite.log`, `vite-redesign.log`, `preview-test-err.log`,
…). Gitignored, so harmless to the repo, but they're the debris of debugging sessions and one of
them (`dev-server.log`) is three months old.

---

## Theme F — Ideas that would genuinely raise the ceiling

Ordered by (my estimate of) value-per-hour for the October session specifically.

**F1. Make the app work offline — a service worker.** The single most-repeated risk in this repo is
venue connectivity: `deployment.md`'s checklist says "Test venue Wi-Fi and preload the production
URL"; the readiness checklist says "Confirm venue wifi is not required"; the entire six-MP4
fallback-slide apparatus (`assets/teaching/fallback/`, ~6 MB of recordings, a whole plan phase)
exists as insurance against the app not loading. The app's **total production payload is 340 kB**.
A ~30-line service worker precaching that payload means: load it once at the hotel, and it runs
from cache at the venue with the wifi off — on the presenter's laptop *and* on every attendee phone
that scanned the QR code before the room's bandwidth collapsed. That is a more complete answer to
the risk than the fallback recordings, at roughly 2% of the effort already spent on them. (Pairs
directly with Theme A4's caching headers.) The fallback slides stay as the belt to this suspenders.

**F2. Encode scenario state in the URL.** `main.js` reads only `?present=1` / `?teach=1` / `?lang`;
all slider state lives in a module-local `state` object with no serialization. So a presenter cannot
say *"open this exact bill on your phone"*, cannot deep-link a teach step, cannot bookmark the
configuration a CFO asked about, and the fresh-viewer kit cannot specify a reproducible starting
state. Serializing the ~8 numeric inputs into a query string (and restoring from it) is perhaps 40
lines, makes every scenario shareable and citable, and turns the teach-mode steps into six
addressable URLs — which the deck's fallback slides could then link to directly.

**F3. Presenter crib cards generated from the deck's own speaker notes.** Carried unchanged from
07-17/07-21 (`F1` there). The `python-pptx` extraction already exists in `audit_teaching_deck.py`;
the artifact cannot drift from the deck by construction. Still the best remaining same-source
artifact.

**F4. Name the pipeline as a product.** Carried from 07-21 (`F3`). This repo has built a reusable
teaching-case pipeline — *settlement engine as single source of truth → JSON spine exports → deck
builder → prose verifier → gate-sweep credibility check → trilingual terminology gate → freshness
guardrails*. That is an Allotrope capability, not a one-workshop deck: the next case study (another
DPPA market, another financing mechanism) costs "swap the engine and the terminology map." It is
currently only legible by reading seven `plans/*.md`. A short `docs/pipeline-architecture.md`
makes it a thing the next session can deliberately extend. **New angle:** it is also the natural
home for the app-localization contract from Theme B, which is precisely the pipeline's missing
sixth stage.

**F5. July-vs-October A/B evidence report.** Carried from 07-17/07-21 (`F2` there). Words, symbols,
and visuals per module across both decks, using tooling that already exists. ~1 hour. Doubles as
the evidence that the redesign worked — which is otherwise resting entirely on a single
fresh-viewer test that has not yet been scheduled (H5).

---

## Theme G — Documentation architecture: five overlapping memory systems, no `CLAUDE.md`

The repo has **no root `CLAUDE.md`**, despite being an almost entirely agent-driven codebase with
strong, hard-won, non-obvious conventions:

- `PYTHONPATH= py` prefix on Windows for every Python tool (documented in six separate docstrings);
- `npm run predeploy` as the mandatory gate before any Firebase deploy;
- `git mv`, never `rm`, for retiring artifacts;
- regenerate spine + sweep whenever `settlement.js` changes, *then* rebuild visuals, *then* the deck
  — a strict ordering documented only in `app/README.md` prose;
- add the old value to `tools/retired_figures.json` **in the same commit** whenever a headline
  number changes;
- `--workers=1` for local Windows visual snapshots.

Every one of these is a rule a fresh session must obey and will not discover before breaking
something. They are currently spread across `NOTES.md`, `app/README.md`, `app/deployment.md`, six
Python docstrings, and `plans/*.md`. The user's global `CLAUDE.md` explicitly instructs *"Read
`CLAUDE.md` first on every session to understand project laws"* — and this project has none, so
that instruction currently resolves to nothing. **This is the cheapest high-leverage doc in the
repo: one file, ~60 lines, consolidating rules that already exist.**

Meanwhile there are **five** institutional-memory systems with unclear boundaries:
`activeContext.md` (45 kB, **last updated 2026-06-29** — it does not mention the teaching revamp,
the hardening plans, the prose-parity work, or the deploy recovery, i.e. it has been abandoned in
favour of `plans/` + `reports/` for four weeks while the global workflow still mandates it),
`lessons.md` (also last touched 2026-06-29), `learning-records/` (ends at 0004), `NOTES.md`
(current), and `plans/` + `reports/` (current). Add the naming collision between root `lessons.md`
(corrections log) and `lessons/` (the HTML course), and a returning session has to reverse-engineer
which files are alive.

**G1.** Write `CLAUDE.md`. **G2.** Explicitly retire `activeContext.md` (archive it, note the
successor is `plans/` + `reports/`) or restart it — but stop leaving a stale 45 kB file that
contradicts the standing workflow. **G3.** Rename root `lessons.md` → `corrections-log.md`.

---

## Theme H — Repo weight and tracked-file hygiene

- **`.git` is 252 MB with 1,411 loose objects and zero packfiles** (`git count-objects -v`:
  `in-pack: 0`). `git gc --aggressive` has apparently never run. A clone of this repo currently
  transfers a quarter-gigabyte of unpacked objects. One command, large win, zero risk.
- **Three gitignored files are tracked anyway** — `.gitignore` lists `background/`, but
  `background/Ecoplexus_ DPPA Presentation_Fof CEBA Workshop.pdf`, `background/Simplified DPPA CfD
  Settlement Scenario .pptx`, and `background/synthetic DPPA Vietnam policy and regulation.pdf`
  are all in `git ls-files` (added before the ignore rule). ~2 MB, and the contradiction itself is
  the confusing part — either untrack them or drop the ignore line.
- **Every CfD chart is committed twice**, as `.gif` *and* `.mp4` of the same animation — 12 pairs in
  `assets/`, with the GIFs ~4.5× larger (`cfd-s1-vi.gif` 953 kB vs `cfd-s1-vi.mp4` 211 kB).
  ~10 MB of duplicated content. `build_cfd_slide.py` regenerates both; NOTES.md records that the
  MP4s exist because Google Slides needs video. If the GIFs are no longer consumed, they are the
  single largest cheap reduction available.
- **Root `node_modules/` (7.5 MB) + root `package.json`** exist solely for `build-deck.js` +
  `pptxgenjs` — a script on PHASE-04's archive list. Archiving the script should retire the root
  Node install with it.

---

## Recommended sequence

Grouped so each block is a coherent session, ordered by consequence-per-hour.

1. **A1 + A2 + A3 + A4 — guardrail integrity (≈1.5 h).** Dirty-tree marker, artifact-hash comparison
   (or `-- app/` scoping), self-writing deploy log, `firebase.json` cache headers, then redeploy
   from a clean tree. Do this **before Monday 2026-07-27**, so the first scheduled run is a true
   green rather than a false red that trains everyone to ignore it.
2. **B1/B2 — app localization (one focused session).** The largest audience-facing gap, and it must
   precede the translator engagement (H2, 2026-08-25) and the content freeze (2026-09-15). This is
   the item most likely to be regretted if deferred again.
3. **G1 — write `CLAUDE.md` (≈45 min).** Every subsequent session gets cheaper. Do it early, not
   last.
4. **D1 + C/PHASE-04 — archive + extend the retired-figures scan to build scripts (≈1.5 h).**
   `build_callouts.py`'s live "0 of 56" is a loaded gun aimed at a deck.
5. **C/PHASE-03 — visual baselines, `@axe-core/playwright`, coverage (≈2 h).** Fully specified in
   the existing plan; three inert or absent checks become real ones.
6. **F1 — service worker (≈1 h).** Retires the top operational risk of the actual event.
7. **E1 + E2 + E3 — prettier config, reformat the five minified files, normalize imports (≈1 h).**
8. **C/PHASE-05 — `learning-records/0005` (≈1 h).** Fifth flag. Either write it or de-scope it.
9. **H — `git gc`, untrack `background/`, decide on the GIF duplicates (≈30 min).**
10. **F2 → F4 → F3 → F5** opportunistically, post-freeze.

## Assumptions adopted (unattended run — no questions asked, per brief)

- **ASM-1 — Analysis only; nothing changed.** No fix applied, no redeploy run, no file archived.
  Theme A's fix changes what is served at a public URL and Theme E1's would rewrite the whole
  engine's formatting — both are surfaced, not silently taken, consistent with this repo's standing
  practice.
- **ASM-2 — The "built from a dirty tree" conclusion (A1) is inferred**, not observed: I verified
  that `e55319e`'s `vite.config.js` contains no marker plugin while the live HTML carries a marker
  naming `e55319e`, which no clean build of that commit could produce. An alternative explanation
  (e.g. a hand-edited `dist/index.html`) would be worse, not better. Either way the marker is not
  trustworthy provenance.
- **ASM-3 — "The live app is functionally current" is a direct observation**, not an inference:
  the served `/assets/index-CpURIX_m.js` is byte-identical (sha256) to a fresh local build at HEAD.
  So Theme A is a *metadata and process* failure, not a stale-content failure. This is a materially
  better situation than 2026-07-21's, and I have not overstated it.
- **ASM-4 — Localization scope (B1)** is assumed to be **UI strings + teach annotations only** — not
  chart-rendered figures, not the settlement engine, not number formatting/locale separators. VND
  grouping is identical across the three locales in question, so formatter changes are assumed out
  of scope. If per-locale number formatting is wanted, that is a separate, larger change.
- **ASM-5 — The October 1 session date remains unconfirmed** (H1, open since 2026-07-04). Every
  interval in this document is computed from that assumption and moves with it. At 68 days out with
  a 31-day translator deadline, H1 is now the schedule's binding constraint, not merely an
  open question.
- **ASM-6 — Theme F1's offline claim is scoped to the app shell and its 340 kB payload.** The
  ~6 MB of fallback MP4s in `assets/teaching/` are deck assets, not app assets, and are assumed to
  stay out of any precache manifest.
