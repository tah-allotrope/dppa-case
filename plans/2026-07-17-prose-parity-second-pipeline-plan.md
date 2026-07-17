---
title: "Prose Parity & Second-Pipeline Hardening"
date: "2026-07-17"
status: "draft"
request: "Fix the live stale '0 of 56' references, commit/prune repo hygiene items, add a retired-figures denylist, extend the number-parity net to S2/S3 spine exports and the worksheet docx builder plus a prose-figures verifier, close the FMP/decree research gaps, and add a human-blocked register. Complements (does not replace) plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md."
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md"
  - "research/2026-06-29_dppa-scenario-numbers-spec.md"
---

# Plan: Prose Parity & Second-Pipeline Hardening

## Objective

The repo's deck pipeline is engine-traced and CI-checked, but its **prose artifacts** — lesson
HTML pages, facilitator guides, the printed Word handout builder — carry ~76 hand-typed canonical
figures, and **four of them are wrong today**: three files still state the retired "0 of 56" gate
result six days after the computed answer became "5 of 56". This plan fixes the live errors,
builds two lightweight verifiers (a retired-figures denylist and a prose-figures parity check)
so this class of drift fails CI, extends the engine's JSON exports to scenarios S2/S3 so the
printed handout is generated rather than hand-typed, and closes the two open sourcing gaps
(official decree URLs, FMP proxy series) plus the missing human-blocked register.

## Context Snapshot

- **Current state:** `app/scripts/export-spine.mjs` exports engine numbers for scenario S1 only
  (`assets/teaching/spine-s1.json`). The deck builders read that JSON and are guarded by the CI
  `deck-parity` job. But `build_worksheet_answer_docx.py` hand-types every figure it prints
  (S1/S2/S3 totals, lines 80–150), lesson HTML and facilitator guides hand-type the same totals,
  and nothing checks any of them. Three living documents still carry the "0 of 56" placeholder
  that was superseded on 2026-07-11: `facilitator/dppa-panel-guide.md:80`,
  `lessons/0004-module-4-three-gates.html:190` and `:228`, and
  `lessons/0005-module-5-canonical-cases.html:135`. Two planning documents
  (`plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`,
  `research/2026-07-16-post-hardening-next-level-brainstorm.md`) and one brainstorm
  (`research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md`) are untracked. An empty branch
  `cc-nightly/20260710-213046` exists locally and on origin with zero unique commits.
- **Desired state:** No living document states a retired figure (enforced by
  `tools/check_retired_figures.py` in CI); every ≥7-digit VND figure in living prose is either an
  engine export or an explicitly justified literal (enforced by `tools/verify_prose_figures.py`
  in CI); `spine-s1/s2/s3.json` all exist and are diffed by CI; the Word handout's numbers are
  generated from those spines with exact anchor assertions; RESOURCES.md's two "Gaps to fill"
  bullets are closed or explicitly bounded; and the readiness checklist carries a dated
  human-blocked register.
- **Key repo surfaces:** `app/scripts/export-spine.mjs`, `app/src/modules/settlement.js`,
  `app/src/data/default-scenarios.js`, `build_worksheet_answer_docx.py`,
  `facilitator/dppa-panel-guide.md`, `lessons/0004-module-4-three-gates.html`,
  `lessons/0005-module-5-canonical-cases.html`, `.github/workflows/ci.yml`,
  `assets/teaching/spine-s1.json`, `RESOURCES.md`, `plans/2026-october-readiness-checklist.md`.
- **Out of scope:** Everything owned by the companion plan
  `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md` — the gate-sweep band rework,
  `requirements.txt`, the deck-build CI job, the per-slide deck manifest, the `tools/` migration
  of existing root scripts, localization, and app URL state. This plan must not edit
  `app/scripts/export-sweep.mjs`, `build_oct_teaching_deck.py`, `build_teaching_visuals.py`,
  `verify_deck_numbers.py`, or `audit_teaching_deck.py`. Sourcing real developer LCOE/DSCR
  figures (needs private Allotrope deal data) is also out of scope.

## Environment & Conventions

- **Stack:** Two toolchains. **JavaScript** (`app/`): Node 24 (pinned in
  `.github/workflows/ci.yml`), npm, ES modules (`"type": "module"`), Vite 8, Vitest 4 — vanilla
  JS, no framework, no TypeScript. **Python** (repo root): CPython 3.12 (pinned in CI via
  `actions/setup-python@v5`). There is **no `requirements.txt` yet** (the companion plan creates
  it); therefore **every new Python file in this plan must use only the standard library**, except
  `build_worksheet_answer_docx.py` which already depends on `python-docx` (installed on the
  author's machine, undeclared).
- **Setup:** `cd app && npm install` — **never `npm ci`** (the lockfile has known
  optional-native-binary drift; `ci.yml:18-22` documents this deliberately).
- **Build / Run:**
  - Spine export: `cd app && node scripts/export-spine.mjs` — writes to
    `assets/teaching/` at the **repo root** (`../../assets/teaching/` relative to the script).
  - Handout: `PYTHONPATH= py build_worksheet_answer_docx.py` (Windows) /
    `PYTHONPATH= python3 build_worksheet_answer_docx.py` (Linux/CI). The `PYTHONPATH= ` prefix is
    load-bearing on the author's Windows machine (a stale `PYTHONPATH` shadows imports); it is
    harmless elsewhere — keep it in documented commands.
- **Test:** Full JS suite: `cd app && npm test` (Vitest). Single file:
  `cd app && npx vitest run scripts/export-spine.test.js`. Python tests (created by this plan):
  `PYTHONPATH= py -m unittest discover -s tools/tests -v` (Windows) /
  `python3 -m unittest discover -s tools/tests -v` (CI). Lint: `cd app && npm run lint` — note
  `app/eslint.config.js:6` **ignores `scripts/**`**, so files under `app/scripts/` are unlinted;
  match style by hand (no semicolons, single quotes, 2-space indent).
- **Conventions & traps:**
  - **Currency is always VND.** Raw JSON fields end `Vnd` (e.g. `9063196000`); slide/handout
    display uses comma thousand separators (`9,063,196,000`). Prices are VND/kWh (unrounded,
    e.g. `163.3`); volumes are kWh/month. Never mix magnitudes.
  - The Word handout uses typographic characters: **U+2212 minus** (`−800,000,000`, not the
    ASCII hyphen), **U+00D7 multiply** (`5,000,000 × 1,150`), and a leading `+` on positive CfD
    values (`+750,000,000`). Generated strings must preserve these exactly.
  - Generated artifacts (JSON packs, the `.docx`) are **committed to git**; a regeneration diff
    is expected and is what CI checks. Do not gitignore them.
  - Python style: 4-space indent, stdlib `argparse`, module docstring naming the plan phase that
    introduced the file. New scripts resolve paths against
    `Path(__file__).resolve().parent.parent` (location-independent), never the CWD.
- **Repo map:**
  ```
  app/                          Vite app (live tool at https://dppa-case.web.app)
    src/modules/settlement.js       THE engine — buildFiveLineBill, CfD, multi-year
    src/data/default-scenarios.js   presets: workshop1/2/3 = deck scenarios S1/S2/S3
    scripts/export-spine.mjs        engine -> assets/teaching/spine-s1.json (S1 only, today)
  assets/teaching/              generated JSON number packs + PNGs
  build_worksheet_answer_docx.py   -> lessons/DPPA_Worksheets_and_Answers.docx (hand-typed today)
  lessons/*.html                hand-authored lesson pages (carry canonical figures in prose)
  facilitator/*.md              presenter guides (carry canonical figures in prose)
  .github/workflows/ci.yml      jobs: quality (app), deck-parity (exports diff + deck verifiers)
  plans/2026-october-readiness-checklist.md   the session run-up checklist
  ```

## Research Inputs

- From `research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md`:
  - Three living documents still state the retired "0 of 56" figure (locations in Context
    Snapshot); the 2026-07-11 fix updated the deck, visuals, and one facilitator guide but
    stopped there. The panel guide anchors a lender-panel answer on a number false since then.
  - ~76 hand-typed canonical figures exist across 15 prose files (grep of the six canonical
    totals over `facilitator/`, `lessons/`, `learning-records/`) — a lower bound.
  - `build_worksheet_answer_docx.py` copies numbers "verbatim from
    research/2026-06-29_dppa-scenario-numbers-spec.md" (its own docstring) — the printed handout
    is the least-verified artifact and cannot be hot-fixed once printed.
  - The branch `cc-nightly/20260710-213046` has zero unique commits vs master.
  - The stale-figure failure mode is systematic: whenever a headline changes, its old value
    should join a denylist that CI greps living prose for ("parity proves the right number;
    the denylist proves nothing still says the old one").
- From `research/2026-06-29_dppa-scenario-numbers-spec.md` (via the worksheet builder's
  hand-typed values, re-derived from the engine during planning):
  - S2 (shortfall): contracted 8,000,000 / total 9,000,000 kWh, FMP 1,600, strike 1,500 →
    C_EVN 19,628,262,400 · CfD −800,000,000 · C_KH 18,828,262,400 · effective ≈ 2,092 VND/kWh.
  - S3 (excess): matched 5,000,000 kWh, FMP 1,100, strike 1,250 → C_EVN 8,304,644,000 ·
    CfD +750,000,000 · C_KH 9,054,644,000 · effective ≈ 1,811 VND/kWh; excess narrative:
    generation ≈ 6,500,000 kWh → excess 1,500,000 kWh, spot value 1,500,000 × 1.008 × 1,100.
  - These match `scenarioProfiles.workshop2` / `workshop3` in
    `app/src/data/default-scenarios.js` exactly — the engine can generate them.

## Assumptions and Constraints

- **ASM-001:** The "0 of 56" references in the panel guide and lessons are stale, not
  intentional historical framing (the panel guide predates the real sweep; the 2026-07-11 fix
  report claims completeness it didn't achieve; no document frames "0" as a July-era figure). —
  **BINDING DEFAULT:** Update them to the current computed value ("5 of 56") with the
  narrow-window framing, per PHASE-01. Do not delete the surrounding teaching narrative.
- **ASM-002:** The companion plan (`plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`)
  has **not** been executed when this plan runs (as of 2026-07-17 the working tree matches commit
  `d24ed9b` and root scripts have not moved to `tools/`). — **BINDING DEFAULT:** All paths in this
  plan target the current layout. If the companion plan's PHASE-04 has already moved root scripts
  into `tools/`, apply this plan's `build_worksheet_answer_docx.py` changes at
  `tools/build_worksheet_answer_docx.py` instead; everything else is unaffected.
- **ASM-003:** Which prose files count as "living" (subject to the checkers) vs "historical
  record" (exempt). — **BINDING DEFAULT:** Living = `NOTES.md`, `RESOURCES.md`, `MISSION.md`,
  `lessons.md` at the root, plus `facilitator/**/*.md` and `lessons/**/*.html`. Historical =
  `plans/`, `research/`, `reports/`, `learning-records/`, `activeContext.md`, `deck-qa/` — these
  legitimately record superseded figures and are **never scanned**.
- **ASM-004:** The prose-figures check's number scope. — **BINDING DEFAULT:** Only tokens
  matching `\d{1,3}(?:,\d{3}){2,}` (comma-grouped, ≥ 1,000,000 — i.e. the VND totals and kWh
  volumes). Four-digit prices (`2,204`, `1,150`) and decimals are out of scope for this plan;
  they are stable and the noise cost outweighs the drift risk.
- **ASM-005:** The S3 excess-generation volume (≈ 6,500,000 kWh/month) exists nowhere in the app
  data model (the bill settles on matched volume only; the excess is chart narrative). —
  **BINDING DEFAULT:** Declare `EXCESS_GENERATION_KWH = 6_500_000` as a named constant in
  `export-spine.mjs` with a provenance comment citing
  `research/2026-06-29_dppa-scenario-numbers-spec.md`, and compute the excess block from it.
- **ASM-006:** Retired-figure matching semantics. — **BINDING DEFAULT:** Case-insensitive
  substring match on each configured string, applied line-by-line so violations report
  `file:line`. No regex in the config file — plain strings only, to keep entries auditable.
- **ASM-007:** Where the FMP/decree research lands if primary sources cannot be found. —
  **BINDING DEFAULT:** The deliverable is a research note recording what was searched, what was
  found, and access dates. If no official decree URL or public FMP series is found, update
  `RESOURCES.md` to say so explicitly with the search trail — a bounded gap beats an open one.
  Never replace the illustrative FMP 1,427 in `app/src/data/default-scenarios.js` as part of
  this plan.
- **ASM-008:** Human-blocked register dates derive from the unconfirmed session date. —
  **BINDING DEFAULT:** Backward-plan from an October 1, 2026 session with content freeze
  2026-09-15 (the same assumption the readiness checklist and companion plan already use).
- **CON-001:** `assets/teaching/spine-s1.json` is diffed byte-for-byte by the CI `deck-parity`
  job (`ci.yml:55`). The `export-spine.mjs` refactor must leave its output **byte-identical**.
- **CON-002:** New Python tools must be stdlib-only (no `requirements.txt` exists yet;
  CI's `deck-parity` job installs only `python-pptx`).
- **CON-003:** Do not modify `app/src/modules/settlement.js` or any number, formula, or engine
  call. This plan reads the engine; it never changes it.
- **DEC-001:** The engine is the single source of truth for every figure (established project
  law). This plan extends that law from the deck to the handout and prose.
- **DEC-002:** Regenerate-and-diff (the existing `deck-parity` pattern) is the repo's chosen
  integrity mechanism; PHASE-03 extends the same diff line rather than inventing a new job.

## Specification

### S1. Canonical anchor values (all raw VND or kWh/month; must hold exactly)

Engine inputs common to all three scenarios (from `defaultInputs` in
`app/src/data/default-scenarios.js`): serviceFee 360, clearingFee 163.3, retailTariff 2204,
lossFactorPrecise = 1.026 × 1.008 = 1.034208, lossFactorKppOnly = 1.008.

| Scenario | preset | FMP | strike | contracted | total | C_EVN (VND) | CfD (VND) | C_KH (VND) | effective (VND/kWh) |
|---|---|---|---|---|---|---|---|---|---|
| S1 matched | `workshop1` | 1,150 | 1,250 | 5,000,000 | 5,000,000 | 8,563,196,000 | +500,000,000 | 9,063,196,000 | ≈ 1,813 |
| S2 shortfall | `workshop2` | 1,600 | 1,500 | 8,000,000 | 9,000,000 | 19,628,262,400 | −800,000,000 | 18,828,262,400 | ≈ 2,092 |
| S3 excess | `workshop3` | 1,100 | 1,250 | 5,000,000 | 5,000,000 | 8,304,644,000 | +750,000,000 | 9,054,644,000 | ≈ 1,811 |

Derivations (buyer bill, per `buildFiveLineBill`):
- `marketEnergy = contracted × FMP × 1.034208` — matched volume at market price, grossed for
  losses (k × K_pp).
- `systemService = contracted × 360`; `diffClearing = contracted × 163.3`.
- `additionalPurchase = (total − contracted) × 2204` — shortfall bought at retail (S2 only:
  1,000,000 × 2,204 = 2,204,000,000; zero in S1/S3).
- `cfd = contracted × (strike − FMP)` — positive when strike > FMP (buyer pays), negative when
  FMP > strike (buyer receives).
- `cEvn = marketEnergy + systemService + diffClearing + additionalPurchase`; `cKh = cEvn + cfd`.
- `effective = round(cKh / total)` VND/kWh (S1: 9,063,196,000 / 5,000,000 = 1,812.64 → 1,813).

S3 excess block (narrative only, not a bill line): `excessKwh = 6,500,000 − 5,000,000 =
1,500,000`; `excessSpotValueVnd = 1,500,000 × 1.008 × 1,100 = 1,663,200,000`.

### S2. Prose-figures decision logic

1. Load `assets/teaching/spine-s1.json`, `spine-s2.json`, `spine-s3.json`. Collect the
   **canonical set**: every integer field value whose absolute value ≥ 1,000,000, from `inputs`
   (volumes), `bill` (all `vnd` fields, `cEvn`, `cKh`, `plantRevenue`), `bau`, and (S3) the
   `excess` block — each formatted as a comma-grouped absolute-value string (e.g.
   `"9,063,196,000"`, `"5,000,000"`, `"800,000,000"`).
2. Load `tools/prose_figure_literals.json` — the **justified-literals set**: figures that are
   legitimately not engine exports (each entry carries a `reason`).
3. Scan every living file (ASM-003) for tokens matching `\d{1,3}(?:,\d{3}){2,}`.
4. Every token must be in canonical ∪ literals. Otherwise report `file:line: token` and exit 1.
5. A literal entry whose figure IS in the canonical set is itself an error ("shadowing") — it
   would mask future engine drift. Report and exit 1.

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Fix the four live stale "0 of 56" references; commit untracked planning docs; prune the empty nightly branch | None | Corrected panel guide + 2 lesson pages; clean `git status`; branch deleted |
| PHASE-02 | Retired-figures denylist checker, wired into CI | PHASE-01 | `tools/check_retired_figures.py`, `tools/retired_figures.json`, CI step, tests |
| PHASE-03 | Extend engine exports to S2/S3 spines with exact anchors; CI diffs all three | PHASE-02 | Refactored `export-spine.mjs`, `spine-s2.json`, `spine-s3.json`, vitest anchors |
| PHASE-04 | Generate the Word handout's numbers from the spines; prose-figures verifier in CI | PHASE-03 | Rewired `build_worksheet_answer_docx.py`, regenerated `.docx`, `tools/verify_prose_figures.py`, tests |
| PHASE-05 | Close the FMP/decree sourcing gaps; add the human-blocked register | None (parallelizable) | Research note, updated `RESOURCES.md`, register table in the readiness checklist |

## Detailed Phases

### PHASE-01 - Stale-Reference Hotfix & Repo Hygiene

**Goal**
No living document states the retired "0 of 56" figure; the untracked planning documents are
committed; the empty nightly branch is gone. This phase is prose + git only — no code.

**Tasks**
- [ ] TASK-01-01: Commit the untracked planning docs
      (`research/2026-07-16-post-hardening-next-level-brainstorm.md`,
      `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`,
      `research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md`, and this plan file) as one
      commit before touching anything else, so the planning state is preserved independently of
      execution.
- [ ] TASK-01-02: Verify the nightly branch is empty, then delete it locally and on origin:
      `git log master..cc-nightly/20260710-213046 --oneline` must print nothing; then
      `git branch -d cc-nightly/20260710-213046 && git push origin --delete cc-nightly/20260710-213046`.
- [ ] TASK-01-03: Fix `facilitator/dppa-panel-guide.md:80`. Replace the clause
      `and the empty-window finding (**0 of 56** strike×volume scenarios passed all three at current prices)`
      with
      `and the narrow-window finding (**5 of 56** strike×volume scenarios pass all three at current prices — the computed \`passCount\` in \`assets/teaching/gate-sweep.json\`; regenerate via \`cd app && node scripts/export-sweep.mjs\`)`.
      Adjust the sentence's following clause ("Volume/tenor is exactly where the window closes.")
      only if it no longer reads correctly — the window is now narrow, not closed.
- [ ] TASK-01-04: Fix `lessons/0004-module-4-three-gates.html`. Line 190: change
      `found <b>0 of 56</b> passed all three gates at current prices` to
      `found only <b>5 of 56</b> pass all three gates at current prices`, and reread the full
      sentence/paragraph, adjusting verbs so the narrative teaches a *narrow* window rather than
      an *empty* one. Line 228: change `"why did 0 of 56 scenarios pass?"` to
      `"why do only 5 of 56 scenarios pass?"`.
- [ ] TASK-01-05: Fix `lessons/0005-module-5-canonical-cases.html` line 135: the SVG
      `aria-label="Zero of 56 scenarios passed; right-size the battery"` becomes
      `aria-label="Only 5 of 56 scenarios pass all three gates; right-size the battery"`.
      Inspect the SVG body below it for any visible `0 of 56` / `Zero` text nodes and update them
      to match (keep the layout; change only the figure and its verb).
- [ ] TASK-01-06: Repo-wide confirmation sweep:
      `grep -rniE "0 of 56|zero of 56|0-of-56|0 ?/ ?56" NOTES.md RESOURCES.md MISSION.md lessons.md facilitator lessons`
      must return no matches. (`plans/`, `reports/`, `research/`, `learning-records/` are
      historical records and keep their references — see ASM-003.)
- [ ] TASK-01-07: Commit the prose fixes as a second commit.

**File Changes**
- `facilitator/dppa-panel-guide.md` (modify): the single stale clause at line 80 per TASK-01-03;
  leave the rest of the panel guide untouched.
- `lessons/0004-module-4-three-gates.html` (modify): the two references per TASK-01-04; no
  structural/markup changes.
- `lessons/0005-module-5-canonical-cases.html` (modify): the aria-label and any matching visible
  SVG text per TASK-01-05; no other changes.

**Function Signatures**
None — no code interfaces change in this phase.

**Test Specs**
None — no testable behavior changes in this phase (the TASK-01-06 grep is the check; PHASE-02
turns it into a permanent CI gate).

**Dependencies**
- None.

**Exit Criteria**
- [ ] `git status --porcelain` shows a clean tree (planning docs and fixes committed).
- [ ] `git branch -a | grep -c cc-nightly` → `0`.
- [ ] The TASK-01-06 grep returns no matches.

**Phase Risks**
- **RISK-01-01:** The "5 of 56" value written here will itself be retired when the companion
  plan's gate-sweep rework lands (expected to move to a band out of 70 cells). *Mitigation:*
  that is by design — PHASE-02's denylist is the mechanism that will then flag these exact
  spots; the companion plan's own exit criteria cover the rewrite. Do not pre-emptively write
  band language the sweep does not yet compute.

### PHASE-02 - Retired-Figures Denylist

**Goal**
A stdlib-only checker that fails CI whenever a retired headline figure reappears in living
prose — the permanent version of PHASE-01's one-off grep.

**Tasks**
- [ ] TASK-02-01: Create `tools/retired_figures.json`:
      ```json
      {
        "notes": "Strings that were once correct and are now superseded. check_retired_figures.py fails if any appears in a scanned file. When a headline changes (e.g. the gate-sweep pass count), ADD the old value here in the same commit. Matching is case-insensitive substring (no regex). When the gate-credibility plan retires '5 of 56', add: '5 of 56', '5/56', 'of 56', '56 scenarios', '56 kịch bản', '56种情景'.",
        "scan": [
          "NOTES.md", "RESOURCES.md", "MISSION.md", "lessons.md",
          "facilitator/**/*.md", "lessons/**/*.html"
        ],
        "retired": [
          { "text": "0 of 56",   "reason": "placeholder before the real gate sweep", "replacedBy": "5 of 56 (gate-sweep.json passCount)", "retiredOn": "2026-07-11" },
          { "text": "zero of 56","reason": "same, spelled out",                       "replacedBy": "5 of 56", "retiredOn": "2026-07-11" },
          { "text": "0-of-56",   "reason": "same, hyphenated",                        "replacedBy": "5 of 56", "retiredOn": "2026-07-11" },
          { "text": "0/56",      "reason": "same, slash form",                        "replacedBy": "5/56",    "retiredOn": "2026-07-11" },
          { "text": "0 / 56",    "reason": "same, spaced slash form",                 "replacedBy": "5/56",    "retiredOn": "2026-07-11" }
        ]
      }
      ```
- [ ] TASK-02-02: Create `tools/check_retired_figures.py` (stdlib only: `json`, `pathlib`,
      `glob`, `sys`, `argparse`). Resolve the repo root as
      `Path(__file__).resolve().parent.parent`; expand the `scan` globs relative to it; read each
      file as UTF-8; for each line, test each retired `text` case-insensitively; print every hit
      as `RETIRED-FIGURE {file}:{line_no}: "{text}" (replaced by {replacedBy})`; exit 1 on any
      hit, else print `RETIRED-FIGURES PASS ({n_files} files scanned)` and exit 0.
- [ ] TASK-02-03: Create `tools/tests/test_check_retired_figures.py` using stdlib `unittest`:
      build a temp directory with a planted file and run the checker's scan function against it
      (import the module; do not shell out).
- [ ] TASK-02-04: Add two steps to the `deck-parity` job in `.github/workflows/ci.yml`, after the
      `python verify_deck_numbers.py` step:
      ```yaml
      - run: python tools/check_retired_figures.py
      - run: python -m unittest discover -s tools/tests -v
      ```
      (The unittest step also covers PHASE-04's tests once they exist.)
- [ ] TASK-02-05: Planted-failure drill: temporarily add `0 of 56` to `NOTES.md`, run the
      checker, confirm exit 1 naming `NOTES.md` and the line; **revert the change**. A gate never
      seen failing is not known to work.

**File Changes**
- `tools/retired_figures.json` (create): per TASK-02-01. (`tools/` does not exist yet; create
  it. The companion plan later moves other scripts into the same directory — no conflict, file
  names are disjoint.)
- `tools/check_retired_figures.py` (create): per TASK-02-02.
- `tools/tests/__init__.py` (create): empty file so `unittest discover` treats it as a package.
- `tools/tests/test_check_retired_figures.py` (create): per TASK-02-03.
- `.github/workflows/ci.yml` (modify): the two new steps in `deck-parity` only; leave the
  `quality` job and the commented-out `deploy` job untouched.

**Function Signatures**
- `load_config(path: Path) -> dict` — parsed `retired_figures.json`; raises `SystemExit` with a
  clear message if the file is missing or invalid JSON.
- `scan_files(root: Path, config: dict) -> list[str]` — expands `scan` globs under `root`,
  returns violation strings (`"{relpath}:{line_no}: {text}"`); empty list means clean.
- `main(argv: list[str] | None = None) -> int` — runs the scan from the repo root, prints
  violations or the PASS line, returns the exit code.

**Test Specs**
- Temp file containing `The result was 0 of 56 here.` scanned with the real config's `retired`
  list → one violation naming line 1.
- Case-insensitivity: `ZERO OF 56` → one violation.
- Temp file containing `5 of 56` (the current, non-retired value) → no violation.
- Temp file containing `10 of 56`? — contains the substring `0 of 56` → **is** a violation;
  document this as intended strictness in the test name (any future "N0 of 56" phrasing should
  use the computed figure anyway).
- Empty `retired` list → `scan_files` returns `[]` and `main` exits 0.
- Missing config file → `main` exits nonzero with a message containing the expected path.

**Dependencies**
- PHASE-01 (the scan must pass on the fixed tree; running it before the hotfix would correctly
  fail on the three stale files).

**Exit Criteria**
- [ ] `PYTHONPATH= py tools/check_retired_figures.py` (Windows) exits 0 printing
      `RETIRED-FIGURES PASS`.
- [ ] `PYTHONPATH= py -m unittest discover -s tools/tests -v` passes.
- [ ] The TASK-02-05 planted drill failed the checker and was reverted
      (`git diff --stat NOTES.md` shows no residue).
- [ ] CI `deck-parity` is green with the new steps.

**Phase Risks**
- **RISK-02-01:** Overly broad retired strings (e.g. a bare `56`) would false-positive on
  unrelated prose. *Mitigation:* entries are multi-word phrases; the config `notes` field warns;
  the "5 of 56" test spec pins the boundary.

### PHASE-03 - S2/S3 Spine Exports

**Goal**
The engine exports canonical number packs for all three workshop scenarios, with exact anchor
assertions, and CI diffs all three files — giving downstream consumers (the handout in PHASE-04,
prose verification, future lesson work) a machine source of truth for S2/S3.

**Tasks**
- [ ] TASK-03-01: Refactor `app/scripts/export-spine.mjs`: extract the pack-building logic into
      an exported `buildSpinePack(scenarioKey)` covering `'s1' | 's2' | 's3'` (mapping to
      `scenarioProfiles.workshop1/2/3`). **The S1 output must remain byte-identical** (CON-001):
      keep the S1 pack's exact field set and ordering, including the `factory`, `gates`, and
      `levers` sections and the existing `meta` strings.
- [ ] TASK-03-02: S2/S3 packs contain `meta` (scenario name, source, generatedBy), `inputs`,
      `bau`, `bill`, and `comparison` — the same shapes as S1 — and omit `factory`/`gates`/
      `levers` (S1-only narrative sections). `meta.scenario` values:
      `'S2 shortfall (contracted below consumption)'`, `'S3 excess (over-generation, matched settlement)'`.
- [ ] TASK-03-03: S3 additionally gets an `excess` block (ASM-005):
      `{ generationKwh: 6500000, excessKwh: 1500000, spotValueVnd: 1663200000, spotFormulaText: '1,500,000 × 1.008 × 1,100', note: 'Narrative only — the excess settles at spot with no CfD; it is not a bill line.' }`
      computed from `EXCESS_GENERATION_KWH` and the S3 inputs, not typed.
- [ ] TASK-03-04: Add anchor self-checks to `main()` mirroring S1 (raw VND, exact equality):
      S2 `cEvn === 19628262400`, `cKh === 18828262400`, `lines.additionalPurchase === 2204000000`;
      S3 `cEvn === 8304644000`, `cKh === 9054644000`, `lines.cfd === 750000000`. On any mismatch,
      print the failing anchor and `process.exit(1)`.
- [ ] TASK-03-05: `main()` writes `assets/teaching/spine-s1.json` (existing name), `spine-s2.json`,
      `spine-s3.json` and logs each path.
- [ ] TASK-03-06: Create `app/scripts/export-spine.test.js` (vitest; auto-discovered — the vite
      config excludes only `e2e/**`, `node_modules/**`, `dist/**`). Cover the Test Specs below.
      Note this directory is NOT linted (`app/eslint.config.js:6`); match style by hand.
- [ ] TASK-03-07: Run the exporter, commit the three JSON files, and extend the `deck-parity` CI
      diff line (`ci.yml:55`) to:
      `git diff --exit-code assets/teaching/spine-s1.json assets/teaching/spine-s2.json assets/teaching/spine-s3.json assets/teaching/gate-sweep.json`.

**File Changes**
- `app/scripts/export-spine.mjs` (modify): refactor per TASK-03-01→05. Do not change any S1
  computation, the output directory (`../../assets/teaching/`), or the console output contract
  beyond adding the new files' log lines.
- `app/scripts/export-spine.test.js` (create): per TASK-03-06.
- `assets/teaching/spine-s2.json`, `assets/teaching/spine-s3.json` (create): generated, committed.
- `assets/teaching/spine-s1.json` (unchanged): must show **no diff** after the refactor.
- `.github/workflows/ci.yml` (modify): the one diff line per TASK-03-07.

**Function Signatures**
- `buildSpinePack(scenarioKey: 's1' | 's2' | 's3') -> object` — the full pack for that scenario
  (S1: existing shape including factory/gates/levers; S2/S3: meta/inputs/bau/bill/comparison,
  S3 plus `excess`). Throws on an unknown key.
- `main() -> void` — builds all three packs, runs the six anchor checks plus the existing S1
  behavior, writes the three JSON files, exits nonzero on any anchor failure.

**Test Specs**
- `buildSpinePack('s1').bill.cKh.vnd` → `9063196000` (the existing S1 anchor, now unit-tested).
- `buildSpinePack('s2').bill.cEvn.vnd` → `19628262400`; `.bill.cKh.vnd` → `18828262400`;
  `.bill.lines.additionalPurchase.vnd` → `2204000000`; `.bill.lines.cfd.vnd` → `-800000000`.
- `buildSpinePack('s3').bill.cEvn.vnd` → `8304644000`; `.bill.cKh.vnd` → `9054644000`;
  `.bill.lines.cfd.vnd` → `750000000`; `.bill.lines.additionalPurchase.vnd` → `0`.
- `buildSpinePack('s3').excess` → `{ generationKwh: 6500000, excessKwh: 1500000, spotValueVnd: 1663200000, ... }`.
- `buildSpinePack('s2').comparison.effectiveVndPerKwh` → `2092` and `('s3')` → `1811` **if** the
  S1 pack rounds `effective` to an integer at this field; S1's existing field rounds to one
  decimal (`Math.round(x*10)/10` → `1812.6`) — replicate S1's exact rounding for S2/S3
  (→ `2092` for S2 since 2092.029 rounds to 2092.0, serialized `2092`; assert the serialized
  value, not a re-derivation).
- `buildSpinePack('s4')` → throws.
- Byte-identity (run outside vitest): after `node scripts/export-spine.mjs`,
  `git diff --exit-code assets/teaching/spine-s1.json` → exit 0.

**Dependencies**
- PHASE-02 (CI job structure in place; strictly, only the commit ordering matters).

**Exit Criteria**
- [ ] `cd app && npx vitest run scripts/export-spine.test.js` passes.
- [ ] `cd app && node scripts/export-spine.mjs` prints all six anchors passing and writes three
      files; `git diff --exit-code assets/teaching/spine-s1.json` → exit 0.
- [ ] `spine-s2.json` and `spine-s3.json` are committed and covered by the CI diff line.
- [ ] CI `deck-parity` green.

**Phase Risks**
- **RISK-03-01:** JSON key ordering or number serialization changes during the refactor would
  break CON-001 (byte-identical S1). *Mitigation:* build the S1 object with the identical literal
  structure as today (same insertion order); the byte-identity check is in the exit criteria and
  runs in CI on every push thereafter.
- **RISK-03-02:** Floating-point drift in `marketEnergy` (e.g. `8e6 × 1600 × 1.034208`) could
  make an anchor fail by ±1 VND. *Mitigation:* the engine already produces the exact S1 anchor
  through the same code path; if an S2/S3 anchor misses, the *anchor table in S1 of the
  Specification* is authoritative — investigate the engine call inputs (wrong preset field),
  never "fix" by adjusting the anchor.

### PHASE-04 - Handout Generation & Prose-Figures Verifier

**Goal**
The printed Word handout's numbers are generated from the spine JSONs (with the same anchor
guarantees as the deck), and a CI verifier proves every large figure in living prose is either
an engine export or a justified literal.

**Tasks**
- [ ] TASK-04-01: Rewire `build_worksheet_answer_docx.py`: load the three spine JSONs
      (`assets/teaching/spine-s{1,2,3}.json`, resolved from `Path(__file__).resolve().parent`)
      at module top; replace every hand-typed numeric string in the `SCENARIOS` list (lines
      ~80–150: the `given_*` lines, per-line formulas, `C_EVN`/`CfD`/`C_KH` totals, effective
      rates, and the S3 excess block) with values formatted from the spines. Keep all static
      prose (titles, labels, section text, the negotiation block's hypothetical worked example)
      hand-authored as today. Preserve the typographic conventions exactly: U+00D7 `×` in
      formulas, U+2212 `−` for negative amounts, leading `+` for positive CfD.
- [ ] TASK-04-02: Add formatting helpers (see Function Signatures) and module-level anchor
      assertions: `assert spine_s1["bill"]["cKh"]["vnd"] == 9_063_196_000`, and the S2/S3
      equivalents from the Specification table — the builder refuses to produce a handout from
      drifted spines.
- [ ] TASK-04-03: Regenerate `lessons/DPPA_Worksheets_and_Answers.docx` and verify the output is
      content-identical to the committed version (the numbers were verified equal during
      planning): extract and compare text, e.g.
      `PYTHONPATH= py -c "from docx import Document; print('\n'.join(p.text for p in Document('lessons/DPPA_Worksheets_and_Answers.docx').paragraphs))" > after.txt`
      against the same extraction from the pre-change file (`git stash` / `git show` the old
      binary to a temp file). Table cell text must be compared too (iterate
      `document.tables`). Any difference beyond whitespace is a wiring bug. Commit the
      regenerated `.docx`.
- [ ] TASK-04-04: Create `tools/verify_prose_figures.py` (stdlib only) implementing S2 of the
      Specification. Output format mirrors the retired checker: violations as
      `PROSE-FIGURE {file}:{line}: {token} not in canonical set or literals`, shadowing errors as
      `SHADOWED-LITERAL {token}: remove from prose_figure_literals.json (it is an engine export)`,
      success as `PROSE-FIGURES PASS ({n_tokens} tokens across {n_files} files)`.
- [ ] TASK-04-05: Create `tools/prose_figure_literals.json` by running the verifier and triaging
      every hit: each surviving entry gets `{ "figure": "...", "reason": "..." }`. Expected
      entries include the negotiation hypothetical `250,000,000`
      (`(1,200 − 1,150) × 5,000,000` — a strike the spines don't use) and any regulatory or
      historical figures in living prose. **Triage rule:** if a hit differs from a canonical
      figure by a few digits, it is a stale figure — fix the prose, do not allowlist it.
- [ ] TASK-04-06: Create `tools/tests/test_verify_prose_figures.py` (unittest) covering the Test
      Specs below.
- [ ] TASK-04-07: Add `- run: python tools/verify_prose_figures.py` to the `deck-parity` CI job
      after the retired-figures step (the unittest discover step from PHASE-02 already picks up
      the new tests).
- [ ] TASK-04-08: Planted-failure drill: change one digit of a canonical total in a living file,
      confirm the verifier exits 1 naming it, revert.

**File Changes**
- `build_worksheet_answer_docx.py` (modify): spine loading, helpers, anchors, `SCENARIOS`
  rewiring per TASK-04-01/02. Leave the template-copy mechanism, style constants, table
  construction, and `python-docx` XML helpers untouched.
- `lessons/DPPA_Worksheets_and_Answers.docx` (modify): regenerated, content-identical.
- `tools/verify_prose_figures.py` (create): per TASK-04-04.
- `tools/prose_figure_literals.json` (create): per TASK-04-05.
- `tools/tests/test_verify_prose_figures.py` (create): per TASK-04-06.
- `.github/workflows/ci.yml` (modify): one added step per TASK-04-07.

**Function Signatures**
- `fmt_vnd(value: int) -> str` — comma-grouped absolute value with U+2212 prefix when negative
  (`-800000000` → `"−800,000,000"`), plain digits otherwise (`19628262400` → `"19,628,262,400"`).
- `fmt_signed_vnd(value: int) -> str` — like `fmt_vnd` but with an explicit `+` for positives
  (CfD lines: `750000000` → `"+750,000,000"`).
- `fmt_effective(c_kh_vnd: int, total_kwh: int) -> str` — `"≈ {round(c_kh/total):,} VND/kWh"`
  (S1 → `"≈ 1,813 VND/kWh"`).
- `load_spines(root: Path) -> dict[str, dict]` — `{"s1": ..., "s2": ..., "s3": ...}` from
  `assets/teaching/`; raises `FileNotFoundError` naming the missing file.
- In `tools/verify_prose_figures.py`:
  - `canonical_figures(spines: dict[str, dict]) -> set[str]` — the formatted canonical set per
    S2 step 1.
  - `extract_tokens(text: str) -> list[tuple[int, str]]` — `(line_no, token)` for every match of
    `\d{1,3}(?:,\d{3}){2,}`.
  - `verify(root: Path) -> list[str]` — all violations (unknown tokens + shadowed literals);
    empty means clean.
  - `main(argv: list[str] | None = None) -> int` — prints and returns exit code.

**Test Specs**
- `fmt_vnd(-800000000)` → `"−800,000,000"` (U+2212, assert `"−" in result`).
- `fmt_signed_vnd(750000000)` → `"+750,000,000"`; `fmt_signed_vnd(-800000000)` → `"−800,000,000"`.
- `fmt_effective(9063196000, 5000000)` → `"≈ 1,813 VND/kWh"`; `fmt_effective(18828262400, 9000000)`
  → `"≈ 2,092 VND/kWh"`; `fmt_effective(9054644000, 5000000)` → `"≈ 1,811 VND/kWh"`.
- `extract_tokens("costs 9,063,196,000 and 2,204 dong")` → `[(1, "9,063,196,000")]` — the
  four-digit price is out of scope (ASM-004).
- `extract_tokens("volume 5,000,000 kWh")` → `[(1, "5,000,000")]` (volumes are in scope and
  canonical via `inputs`).
- Synthetic root with a file containing `9,063,196,001` (one digit off canonical) → `verify`
  returns one violation naming it.
- Literals shadowing: a literals entry for `9,063,196,000` → `verify` reports a
  `SHADOWED-LITERAL` violation.
- Real-repo negative control: `verify(repo_root)` on the finished tree → `[]` (this is the CI
  invariant).
- Handout content parity (TASK-04-03): extracted paragraph+table text of the regenerated docx
  equals the pre-change extraction (whitespace-normalized).

**Dependencies**
- PHASE-03 (`spine-s2.json`/`spine-s3.json` must exist).

**Exit Criteria**
- [ ] `grep -nE "8,563,196,000|19,628,262,400|18,828,262,400|8,304,644,000|9,054,644,000|9,063,196,000" build_worksheet_answer_docx.py`
      returns **no matches** (no hand-typed totals survive; they arrive via the spines).
- [ ] `PYTHONPATH= py build_worksheet_answer_docx.py` runs clean; the regenerated docx is
      content-identical (TASK-04-03) and committed.
- [ ] `PYTHONPATH= py tools/verify_prose_figures.py` exits 0 printing `PROSE-FIGURES PASS`.
- [ ] Every entry in `tools/prose_figure_literals.json` has a non-empty `reason`.
- [ ] The TASK-04-08 planted drill failed the verifier and was reverted.
- [ ] `PYTHONPATH= py -m unittest discover -s tools/tests -v` passes; CI `deck-parity` green.

**Phase Risks**
- **RISK-04-01:** The docx regeneration could differ subtly (font runs, spacing) even with
  identical text, producing a noisy binary diff. *Mitigation:* binary diff noise is acceptable —
  the committed artifact is expected to change bytes; the TASK-04-03 *text* comparison is the
  correctness gate.
- **RISK-04-02:** The prose scan surfaces more unknown figures than expected (the 76-occurrence
  count was a lower bound). *Mitigation:* the triage rule in TASK-04-05 is mechanical: matches
  spine → fix nothing; near-miss → fix the prose; genuinely external → allowlist with reason.
  Budget the triage; do not weaken the regex to pass.

### PHASE-05 - Sourcing Gaps & Human-Blocked Register

**Goal**
The two "Gaps to fill" in `RESOURCES.md` (official Decree 57/2025/ND-CP and Circular
16/2025/TT-BCT URLs; a public FMP proxy series) are closed or explicitly bounded, and the
readiness checklist gains a single dated register of every human-blocked item on the October
critical path. Runs independently of PHASES 01–04.

**Tasks**
- [ ] TASK-05-01: Locate the official (or best-available authoritative) full text of **Decree
      57/2025/ND-CP** (direct PPA / DPPA framework) and **Circular 16/2025/TT-BCT** (settlement
      detail). Search, in order: `vanban.chinhphu.vn` (official gazette),
      `thuvienphapluat.vn`, `luatvietnam.vn`, `moit.gov.vn` (MOIT). Record for each: title,
      issuing body, date, URL, access date, and whether it is the official text or a portal copy.
- [ ] TASK-05-02: Hunt a public FMP proxy: NSMO/ERAV/EVN publications of SMP/CGM (spot market
      price / can-based full market price) series or periodic market reports. Any of: a monthly
      average series, a published band, or an official statement that the series is not public.
      Record the observed range vs the illustrative FMP 1,427 VND/kWh if a series is found.
- [ ] TASK-05-03: Write `research/2026-07-17_fmp-and-decree-sources.md` with the findings: a
      sources table (URL, publisher, access date, trust level), the FMP range comparison (or the
      explicit negative result per ASM-007), and a short "how to cite on a slide" note.
- [ ] TASK-05-04: Update `RESOURCES.md`: replace the two "Gaps to fill" bullets with sourced
      entries (or bounded-gap statements), and add the official URLs to the "Primary (external /
      regulatory)" section. Do not touch the illustrative values in the app (ASM-007).
- [ ] TASK-05-05: Add a `## Human-blocked register` section to
      `plans/2026-october-readiness-checklist.md`, directly after the intro paragraph, with this
      table (dates per ASM-008; edit if the session date is confirmed):

      | # | Item | Owner | Needed by | Blocks |
      |---|---|---|---|---|
      | H1 | Confirm session date & venue (Q-001, open since 2026-07-04) | Presenter | 2026-08-15 | every date below |
      | H2 | Engage qualified VI/ZH translator for `assets/teaching/terminology-map.json` | Presenter | 2026-08-25 | localization (deck + app), late-Sept print run |
      | H3 | Recalibrate lender/investor gate proxies with real Allotrope deal data — or accept the illustrative band | Presenter + Allotrope | 2026-09-01 | gate-sweep credibility work, M5 rehearsal |
      | H4 | Firebase deploy credentials → enable the commented `deploy` job in `.github/workflows/ci.yml` | Presenter | 2026-09-08 | QR codes pointing at a current build |
      | H5 | Schedule fresh-viewer volunteer (kit: `facilitator/fresh-viewer-kit/`) | Presenter | 2026-09-08 | content freeze (gate for 2026-09-15) |
- [ ] TASK-05-06: Cross-link: add one line to `NOTES.md`'s October-readiness section pointing at
      the register (`See the human-blocked register in plans/2026-october-readiness-checklist.md`).

**File Changes**
- `research/2026-07-17_fmp-and-decree-sources.md` (create): per TASK-05-03.
- `RESOURCES.md` (modify): the "Gaps to fill" section and the regulatory entries only.
- `plans/2026-october-readiness-checklist.md` (modify): insert the register section; leave every
  existing checklist item untouched.
- `NOTES.md` (modify): the single cross-link line only.

**Function Signatures**
None — no code interfaces change in this phase.

**Test Specs**
None — no testable behavior changes in this phase (verification is MANUAL-002/003 below).

**Dependencies**
- None (parallelizable with PHASES 01–04). Requires internet access for TASK-05-01/02.

**Exit Criteria**
- [ ] `research/2026-07-17_fmp-and-decree-sources.md` exists with at least the two decree/circular
      rows (each with URL + access date) or an explicit documented negative result per source.
- [ ] `grep -n "Gaps to fill" RESOURCES.md` → the section exists but contains no unbounded gap:
      every remaining gap line names what was searched and when.
- [ ] `grep -n "Human-blocked register" plans/2026-october-readiness-checklist.md` → the section
      exists with the five rows.

**Phase Risks**
- **RISK-05-01:** Legal-portal copies (thuvienphapluat etc.) may be paywalled or unofficial.
  *Mitigation:* record trust level per source; an unofficial full text plus the official gazette
  citation is acceptable for a teaching footnote — say which is which.
- **RISK-05-02:** The register's dates could be read as commitments rather than derived
  defaults. *Mitigation:* the section header must state they are backward-planned from an
  assumed 2026-10-01 session (ASM-008) and move with the confirmed date.

## Gotchas

- **VND millions vs raw VND.** `vndMillionsRounded` fields are display values (`9,063`); `vnd`
  fields are raw (`9063196000`). All anchors in this plan compare **raw**. Mixing them by 10⁶ is
  the single easiest catastrophic error in this repo.
- **Typographic characters in the handout:** U+2212 `−` (minus), U+00D7 `×` (multiply), `≈`.
  Using ASCII `-` or `x` in generated strings changes the document and fails the TASK-04-03
  content-parity check. Keep files UTF-8.
- **`spine-s1.json` must not change** (CON-001) — CI byte-diffs it. The PHASE-03 refactor is
  behavior-preserving for S1 by construction; verify with `git diff` before committing.
- **`npm install`, never `npm ci`** (`ci.yml:18-22` documents why). **`PYTHONPATH= ` prefix** in
  local commands is deliberate (author's machine has a shadowing PYTHONPATH); harmless elsewhere.
- **`settlement.js` imports carry explicit `.js` extensions** — plain Node ESM (which runs
  `export-spine.mjs`) requires them; Vite tolerates their absence. Do not "tidy" them.
- **`app/eslint.config.js` ignores `scripts/**`** — a green `npm run lint` says nothing about
  `export-spine.mjs` or its test. Match style by hand: no semicolons, single quotes, 2-space
  indent.
- **Historical documents keep stale figures on purpose** (ASM-003). Never extend the checkers'
  scan set to `plans/`, `research/`, `reports/`, `learning-records/`, or `activeContext.md` —
  they are records of what was believed at the time.
- **Companion-plan coordination:** this plan and
  `plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md` both create `tools/` and
  `tools/tests/`; file names are disjoint, so whichever executes first creates the directories.
  When the companion plan's gate rework retires "5 of 56", its executor must add the strings
  listed in `tools/retired_figures.json`'s `notes` field to the `retired` array **in the same
  commit** — that is the contract this plan establishes. If the companion plan's PHASE-04 has
  already moved root scripts, see ASM-002.
- **S3's bill has no shortfall line and no excess line** — consumption is fully matched
  (`additionalPurchase = 0`) and the over-generation is narrative (`excess` block), not a bill
  line. Do not "add" it to the five-line bill.
- **The `10 of 56` substring trap:** the retired checker matches substrings, so any future
  phrase ending in `0 of 56` trips it. Intended — computed phrasing should never hand-type the
  grid size anyway.

## Verification Strategy

- **TEST-001 (PHASE-01):**
  `grep -rniE "0 of 56|zero of 56|0-of-56|0 ?/ ?56" NOTES.md RESOURCES.md MISSION.md lessons.md facilitator lessons; echo $?`
  → `1` (no matches).
- **TEST-002 (PHASE-02):** `python3 tools/check_retired_figures.py` (CI) /
  `PYTHONPATH= py tools/check_retired_figures.py` (Windows) → exit 0, `RETIRED-FIGURES PASS`.
- **TEST-003 (PHASE-02/04):** `PYTHONPATH= py -m unittest discover -s tools/tests -v` → all pass.
- **TEST-004 (PHASE-03):** `cd app && npx vitest run scripts/export-spine.test.js` → all pass,
  including the six S2/S3 anchors.
- **TEST-005 (PHASE-03):** `cd app && node scripts/export-spine.mjs && cd .. && git diff --exit-code assets/teaching/spine-s1.json`
  → exit 0 (S1 byte-identical; s2/s3 written).
- **TEST-006 (PHASE-04):**
  `grep -cE "19,628,262,400|18,828,262,400|8,304,644,000|9,054,644,000" build_worksheet_answer_docx.py`
  → `0`.
- **TEST-007 (PHASE-04):** `PYTHONPATH= py tools/verify_prose_figures.py` → exit 0,
  `PROSE-FIGURES PASS`.
- **TEST-008 (planted drills, PHASE-02 + PHASE-04):** temporarily plant `0 of 56` in `NOTES.md`
  and a one-digit-off total in a lesson file → each checker exits 1 naming the file; revert both.
  A gate never seen failing is not known to work.
- **TEST-009 (CI):** push → `deck-parity` job green with four new steps (retired figures, prose
  figures, unittest, extended diff line); `quality` job unaffected.
- **MANUAL-001 (PHASE-01):** Read the rewritten panel-guide clause and lesson paragraphs aloud —
  the narrative must teach a *narrow* window (5 pass) rather than an *empty* one (0 pass);
  a number swap that leaves "the window is closed" prose is a failed fix.
- **MANUAL-002 (PHASE-04):** Open the regenerated `lessons/DPPA_Worksheets_and_Answers.docx` in
  Word/LibreOffice: banner styling intact, three scenario blocks, negotiation block, comparison
  table; spot-check S2's `−800,000,000` renders with a true minus sign.
- **MANUAL-003 (PHASE-05):** Each URL in the research note opens and shows the cited document;
  access dates recorded.
- **OBS-001:** After each phase, `git status --porcelain` shows only intended changes; an
  unexpected regenerated artifact means a generator is non-deterministic and will trip CI.

## Risks and Alternatives

- **RISK-001:** This plan and the companion plan touch overlapping surfaces (`ci.yml`, `tools/`,
  the "5 of 56" figure). Executing them interleaved could conflict. *Mitigation:* this plan is
  scoped to files the companion plan does not modify (except one `ci.yml` job, where changes are
  additive steps), ASM-002 defines the path fallback, and the retired-figures contract (Gotchas)
  defines the hand-off at the moment the headline changes.
- **RISK-002:** The prose-figures verifier could ossify prose editing (every new example number
  needs an allowlist entry). *Mitigation:* scope is deliberately narrow (ASM-004: ≥2 comma
  groups); teaching examples below 1,000,000 are unaffected, and an allowlist entry with a
  reason is a feature — it forces provenance at write time.
- **ALT-001:** *One combined mega-verifier instead of two tools.* Rejected: the denylist
  (retired strings) and the parity check (unknown figures) fail for different reasons, at
  different times, with different fixes; separate PASS/FAIL lines make CI triage unambiguous.
- **ALT-002:** *Generate the lesson HTML pages from the spines too.* Rejected for this plan: the
  lessons are hand-authored teaching prose with layout; generating them is a rewrite project.
  The prose verifier gives them drift protection without a rewrite.
- **ALT-003:** *Skip the S2/S3 spine exports and have the docx builder call Node or duplicate
  the arithmetic in Python.* Rejected: duplicating settlement arithmetic in a second language is
  the exact drift risk this repo's architecture exists to prevent; a committed JSON pack is the
  established interface (DEC-001/DEC-002).
- **ALT-004:** *Point the checkers at every `.md`/`.html` in the repo.* Rejected per ASM-003:
  historical documents legitimately record superseded figures; scanning them would force either
  mass edits of the project's own history or a per-file ignore system that erodes the gate.

## Suggested Next Step

Execute PHASE-01 — it corrects figures that are wrong in facilitator-facing documents *today*
and costs minutes. Then PHASE-02 immediately, so the class of error PHASE-01 fixed cannot
recur silently. PHASE-05 can run in parallel at any time; PHASES 03–04 follow in order.
