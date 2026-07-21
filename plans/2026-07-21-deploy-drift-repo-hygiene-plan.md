---
title: "Deploy Recovery, Freshness Guardrails & Repo Hygiene"
date: "2026-07-21"
status: "draft"
request: "Turn the 2026-07-21 deploy-drift-and-repo-hygiene brainstorm into a multi-phase execution plan: recover the stale production deploy and mislabeled release tag, add automated freshness guardrails for both the live site and the human-blocked readiness-checklist deadlines, close the CI rigor gaps (toothless visual regression, no accessibility testing, no coverage measurement), archive root-level one-off scripts and orphaned deck artifacts, and write the missing learning-record documenting the July symbol-overload failure -> October redesign -> hardening arc."
plan_type: "multi-phase"
research_inputs:
  - "research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md"
---

# Plan: Deploy Recovery, Freshness Guardrails & Repo Hygiene

## Objective

The repo's number-pipeline (deck ↔ engine ↔ prose ↔ handout) is already hardened by three CI
gates from an earlier plan. This plan fixes what a fresh pass found *outside* that pipeline: the
live demo site and its release tag are frozen at a pre-redesign commit (the QR code on the deck's
closing slide currently points people at software from before the entire October rebuild), CI is
silent on visual regressions/accessibility/coverage, root-level scripts and decks have drifted
into unsorted clutter, and a documentation debt item (a missing learning record) has been flagged
by three prior analysis passes without ever being fixed. This plan makes the live site match
`master`, adds automated guardrails so that specific drift can't silently recur, closes three CI
rigor gaps, archives stale root-level files non-destructively, and writes the overdue learning
record.

## Context Snapshot

- **Current state:**
  - `https://dppa-case.web.app` (the URL on the deck's closing-slide QR code) is deployed from
    commit `ed21985` (2026-07-05) per `app/deployment.md`'s "Last Deploy" table — **18 commits
    behind** the current `master` tip (`bd2632e`, 2026-07-17). Every commit implementing the
    October Modules 1–6 teaching-revamp, the readiness-hardening arc, and the prose-parity
    hardening has never been deployed.
  - The git tag `v1.0-oct-workshop` points at commit `5787aad` (2026-07-05) — **17 commits
    behind** `master` — despite its name implying it captures the October workshop content. It
    predates the October rebuild entirely.
  - `MISSION.md` line 5–9 still reads "I am preparing to teach... at the in-person factory
    workshop in **July 2026**" — that session already happened and, per
    `facilitator/fresh-viewer-kit/README.md`, is the one that "failed because the audience got
    lost in symbol overload."
  - CI's `e2e:visual` step (`.github/workflows/ci.yml`) runs with `continue-on-error: true`
    because no Linux snapshot baselines are committed — the step can never fail the build.
  - No accessibility testing exists anywhere in the repo (`@axe-core/playwright` is not
    installed; zero references to `axe` in any spec file).
  - No test-coverage measurement exists (`app/vite.config.js` has no `test.coverage` block; no
    `coverage` npm script).
  - The repo root carries 18 loose build/verify scripts with no separation between the 6 still
    "live" (CI-invoked or NOTES.md-regenerable) and 12 one-off scripts last touched during a
    closed June 2026 consolidation phase, plus 6 orphaned `.pptx`/`.png` files not referenced by
    any current teaching document.
  - `learning-records/` stops at `0004-worksheet-answer-docx.md` (2026-06-29); no record
    documents the July 2026 symbol-overload failure and the subsequent October
    redesign/hardening arc, despite that arc being the largest body of work in the repo. Three
    prior analysis passes (`research/2026-07-16-post-hardening-next-level-brainstorm.md`,
    `research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md`,
    `research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md`) have each flagged this gap
    without it being closed.
- **Desired state:** The live site and a correctly-named release tag reflect current `master`;
  a build-commit marker is embedded in every future build so deploy drift is mechanically
  detectable rather than relying on memory; a scheduled, portable (no proprietary tooling)
  GitHub Actions workflow checks weekly whether the live site has drifted and whether any
  human-blocked-register deadline is due soon or overdue, failing (and thus emailing repo
  watchers, GitHub's default notification for a failed scheduled workflow) when it finds either;
  CI enforces real visual-regression, accessibility, and (reported) coverage checks; the repo
  root contains only the 6 still-active build/verify scripts, with the rest preserved
  non-destructively under `archive/`; `MISSION.md` correctly frames the session as October 2026;
  and `learning-records/0005` exists, closing the three-times-flagged documentation gap.
- **Key repo surfaces:** `app/deployment.md`, `app/vite.config.js`, `app/eslint.config.js`,
  `app/playwright.config.js`, `app/package.json`, `.github/workflows/ci.yml`, `tools/`,
  `tools/tests/`, `MISSION.md`, `NOTES.md`, `plans/2026-october-readiness-checklist.md`,
  repo-root `*.py`/`*.js`/`*.ps1`/`*.pptx`/`*.png` files, `ref/`, `learning-records/`.
- **Out of scope:** Rewriting the settlement engine or any deck-numbers/prose-parity check
  already built by prior plans (`plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md`,
  `plans/2026-07-17-prose-parity-second-pipeline-plan.md`); enabling automated Firebase deploy in
  CI (blocked on credentials — tracked as `H4` in the human-blocked register, unaffected by this
  plan); translating `assets/teaching/terminology-map.json`; fixing every accessibility
  violation `@axe-core/playwright` might ever find in future app changes (this plan establishes
  the gate and fixes what the first real run reports, per `ASM-004`); presenter crib cards, a
  July-vs-October A/B evidence report, and a `docs/pipeline-architecture.md` write-up (all
  explicitly carried forward as opportunistic, post-content-freeze work by the source brainstorm
  — not scheduled here).

## Environment & Conventions

- **Stack:** Two toolchains in one repo.
  - **JavaScript** (`app/`): Node 24 (pinned in `.github/workflows/ci.yml`), npm, ES modules
    (`app/package.json` has `"type": "module"`), Vite 8, Vitest 4, Playwright 1.53 — vanilla JS,
    no framework, no TypeScript.
  - **Python** (repo root + `tools/`): CPython 3.12 (pinned via `actions/setup-python@v5` in
    CI). **No `requirements.txt` exists.** New Python files created by this plan must be
    stdlib-only.
- **Setup:** `cd app && npm install` — **do not run `npm ci`**; a comment in
  `.github/workflows/ci.yml` (lines 18–20) documents that the committed lockfile has known
  optional-native-binary drift that `npm ci` rejects but `npm install` tolerates.
- **Build / Run:**
  - App build: `cd app && npm run build` (outputs to `app/dist/`).
  - App local preview: `cd app && npm run preview` (serves `dist/`).
  - Manual production deploy: `cd app && npm run build && npx firebase deploy --only hosting --project dppa-case`
    (requires the Firebase CLI to be authenticated on the executing machine and
    `app/.firebaserc` to exist locally — see `ASM-001`/`ASM-002`, both files/state are
    gitignored and not part of a fresh checkout).
- **Test:**
  - Full JS suite: `cd app && npm test` (Vitest).
  - Single JS test file: `cd app && npx vitest run src/modules/settlement.test.js`.
  - Full e2e (functional): `cd app && npm run e2e`.
  - Full e2e (visual only): `cd app && npm run e2e:visual`.
  - Full Python tools suite: `PYTHONPATH= py -m unittest discover -s tools/tests -v` (Windows) /
    `python3 -m unittest discover -s tools/tests -v` (Linux/CI).
  - Single Python test module: `PYTHONPATH= py -m unittest tools.tests.test_check_retired_figures -v`
    (Windows) / `python3 -m unittest tools.tests.test_check_retired_figures -v` (Linux/CI).
  - Lint: `cd app && npm run lint`. Note `app/eslint.config.js:6` **ignores `scripts/**`** —
    files under `app/scripts/` are not linted by this command; match the surrounding style by
    hand (no semicolons, single quotes, 2-space indent, per the existing files in that
    directory).
- **Conventions & traps:**
  - **Currency is always VND**; raw JSON fields end `Vnd`; display strings use comma thousand
    separators. Do not introduce new currency-formatted literals in this plan's scripts — none
    of this plan's phases touch settlement figures.
  - Generated/committed artifacts (spine JSON, visual-snapshot PNGs) are **committed to git**, not
    gitignored — a regeneration diff is what CI checks. This plan's new visual baselines follow
    the same rule (`app/e2e/visual.spec.js-snapshots/*-linux.png` get committed).
  - Python style already established in `tools/`: `from __future__ import annotations`, a module
    docstring naming the plan/phase that introduced the file, `REPO_ROOT = Path(__file__).resolve().parent.parent`
    for location-independent path resolution (never the CWD), pure logic functions plus a thin
    `main(argv: list[str] | None = None) -> int` entry point, and
    `if __name__ == "__main__": sys.exit(main(sys.argv[1:]))` at the bottom. New files in this
    plan must follow this exact shape — see `tools/check_retired_figures.py` as the reference
    example.
  - `app/.firebaserc` and root `.firebaserc`-style Firebase project bindings are excluded by
    `.gitignore` (`.firebaserc` entry) — a fresh clone will not have this file even though
    `app/deployment.md` describes it as binding the app to Firebase project `dppa-case`.
- **Repo map:**
  ```
  app/                              Vite app — the live tool at https://dppa-case.web.app
    vite.config.js                     build config (this plan adds a build-commit HTML plugin)
    eslint.config.js                   lint config (ignores app/scripts/**)
    playwright.config.js               e2e config: chromium-desktop, webkit-mobile, chromium-tablet
    e2e/*.spec.js                      Playwright specs (controls, scenarios, teach, tour, visual)
    deployment.md                      deploy history, live URL, pre-workshop checklist
  tools/                            stdlib-only Python CI checkers (this plan adds 2 more)
    check_retired_figures.py           existing — style reference for new scripts
    verify_prose_figures.py            existing — unrelated to this plan, do not touch
    tests/                             unittest suite, auto-discovered by `-s tools/tests`
  .github/workflows/ci.yml          jobs: quality (app), deck-parity (number-pipeline checks)
  MISSION.md, NOTES.md              living docs read at the start of every session
  plans/2026-october-readiness-checklist.md   dated human-blocked register (5 rows, H1-H5)
  learning-records/                 numbered institutional-memory files, 0001-0004 exist
  (repo root)                       18 loose *.py/*.js/*.ps1 scripts + 6 orphaned *.pptx/*.png
  ref/                              one file: "DPPA 2025 ref.pptx" (orphaned template)
  ```

## Research Inputs

- From `research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md`:
  - **Theme A:** the live site (`ed21985`, 2026-07-05) and release tag `v1.0-oct-workshop`
    (`5787aad`, 2026-07-05) are both frozen before the October redesign; nothing in the repo
    currently checks whether the deployed site matches `master`.
  - **Theme B:** 18 root-level files (12 one-off scripts, 6 orphaned decks/screenshots) are not
    referenced by any current doc; classification table cross-references `NOTES.md`,
    `RESOURCES.md`, and `.github/workflows/ci.yml` against each file's last-touched commit.
  - **Theme C:** `e2e:visual` in CI is `continue-on-error: true` (inert by construction, steps
    already documented in `app/deployment.md`'s "Visual baseline bootstrap" section but never
    executed); zero accessibility testing exists despite a live trilingual, projector-viewed
    audience; zero coverage measurement exists.
  - **Theme D:** `MISSION.md` still frames the session as "July 2026" (factually wrong — that
    session already happened and failed); `learning-records/0005` has been flagged as missing by
    three separate analysis passes without action.
  - **Theme E:** the human-blocked register (`plans/2026-october-readiness-checklist.md`, rows
    H1–H5 with `Needed by` dates) has no mechanism watching its dates; the brainstorm proposed
    using scheduling, but this plan implements that as a **portable GitHub Actions scheduled
    workflow** (not a proprietary agent-platform primitive) so the plan can be executed by any
    engineer or coding agent with only a repo checkout.
  - Exact commit hashes and dates for the deploy/tag drift (`ed21985`, `5787aad`, `bd2632e`) and
    the full classification table of live-vs-archivable root scripts were independently
    re-verified against the current repo during this planning pass (see Phase 1 and Phase 4).

## Assumptions and Constraints

- **ASM-001:** Firebase CLI authentication state on the machine that executes Phase 1's deploy
  task is unknown to this plan. — **BINDING DEFAULT:** attempt `npx firebase deploy --only hosting --project dppa-case`
  directly first (prior deploys from this repo succeeded without an explicit login step
  documented, per `app/deployment.md`'s deploy history). If it fails with an authentication
  error, run `npx firebase login` interactively (this is a human-in-the-loop step no plan can
  script) and retry. If credentials are genuinely unavailable, skip only TASK-01-04 through
  TASK-01-08 (the deploy and its tag/doc bookkeeping), note the skip in
  `app/deployment.md`, and continue with every other phase — none of them depend on the deploy
  having happened.
- **ASM-002:** `app/.firebaserc` is excluded by `.gitignore` and will not exist in a fresh
  checkout. — **BINDING DEFAULT:** if `app/.firebaserc` is missing, create it with:
  ```json
  {
    "projects": {
      "default": "dppa-case"
    }
  }
  ```
  before running the deploy command (this matches the project binding `app/deployment.md`
  already documents in prose).
- **ASM-003:** Whether to force-move the existing `v1.0-oct-workshop` tag to the new commit or
  create a new tag. — **BINDING DEFAULT:** create a new tag, `v1.1-oct-workshop-hardened`, at the
  freshly deployed commit. Do not delete or force-move `v1.0-oct-workshop` — it is a pushed ref
  other clones may have fetched, and this repo's established convention favors non-destructive,
  reversible operations (`git mv` over `rm` elsewhere in this plan) over rewriting shared history.
  Document the supersession in `app/deployment.md` prose so a future reader is not misled by the
  old tag's name.
- **ASM-004:** The first real `@axe-core/playwright` run (Phase 3) may report genuine
  pre-existing accessibility violations; their number and severity are unknown until the check
  runs. — **BINDING DEFAULT:** triage every `critical`/`serious` violation found. Fix trivial
  ones in this phase (missing `alt`/`aria-label`, insufficient color contrast on a token in
  `app/src/theme.css`, missing form-field labels). For any violation whose fix would require a
  larger redesign decision, leave the underlying issue unfixed but add the specific rule ID to
  the axe check's `.disableRules([...])` call with an inline code comment citing the violation
  and add a one-line follow-up bullet to `NOTES.md`. Never disable rules speculatively before the
  first real run's output is known.
- **ASM-005:** Whether to enforce a minimum coverage threshold in CI. — **BINDING DEFAULT:**
  report-only for this plan (no `thresholds` block in the Vitest coverage config, no CI failure
  on low coverage). A future plan can set a threshold once a baseline percentage is observed from
  this plan's first report.
- **ASM-006:** Bootstrapping Linux visual-regression baselines (Phase 3) requires triggering the
  GitHub Actions workflow with a temporary snapshot-upload step, which needs a throwaway branch
  push. — **BINDING DEFAULT:** name the branch `bootstrap/visual-baselines`; delete it (locally
  and on `origin`) once the baseline PNGs are downloaded and committed to the working branch.
- **ASM-007:** The human-blocked register's markdown table format
  (`plans/2026-october-readiness-checklist.md`, columns `# | Item | Owner | Needed by | Blocks`)
  is assumed stable for parsing. — **BINDING DEFAULT:** the parser in
  `tools/check_human_blocked_register.py` targets exactly that 5-column header under the
  `## Human-blocked register` heading. If a future edit reorders or renames the columns, the
  parser must be updated in the same commit — document this requirement in the script's module
  docstring.
- **ASM-008:** "Today," for the scheduled freshness-check workflow, is evaluated in whatever
  timezone the CI runner uses. — **BINDING DEFAULT:** accept `datetime.date.today()` in the
  GitHub Actions runner's default UTC timezone; the register's granularity is whole days, so a
  same-day UTC-vs-local discrepancy does not change any classification in practice.
- **ASM-009:** Which of the 18 root-level `*.py`/`*.js`/`*.ps1`/`*.pptx`/`*.png` files are "live"
  (must stay at root) versus "archivable." — **BINDING DEFAULT:** exactly the classification in
  Phase 4's task list, derived by cross-referencing `.github/workflows/ci.yml` (CI-invoked) and
  `NOTES.md` (documented as manually regenerable) against every file's last-touched commit. The
  6 live files are `audit_teaching_deck.py`, `verify_deck_numbers.py`,
  `build_oct_teaching_deck.py`, `build_teaching_visuals.py`, `build_cfd_slide.py`,
  `build_worksheet_answer_docx.py`. Everything else at root matching those extensions, plus
  `ref/`, is archived.
- **ASM-010:** Deploying to `https://dppa-case.web.app` changes what is live at a public URL — a
  higher-consequence action than most of this plan's file edits. — **BINDING DEFAULT:** treat
  Phase 1's deploy (TASK-01-04) as a deliberate, first-priority action, not an incidental side
  effect; verify its result immediately (TASK-01-05) and record the outcome in
  `app/deployment.md` before proceeding to later phases.
- **CON-001:** All new Python files must be stdlib-only (`json`, `re`, `datetime`, `pathlib`,
  `urllib.request`, `subprocess`, `unittest`, `argparse`) — no `requirements.txt` exists in this
  repo.
- **CON-002:** `tools/check_deploy_freshness.py` must never fail (nonzero exit) purely because
  the live URL was unreachable (venue wifi, transient DNS, etc.) — it must only fail on a
  confirmed reachable-but-stale deploy. A network failure prints an `UNKNOWN` result and exits 0.
- **CON-003:** This plan must not modify `app/src/modules/settlement.js` or any settlement
  formula/engine call — the engine is read-only in this plan, matching the established repo law
  that the engine is the single source of truth for every teaching figure.
- **DEC-001:** Archiving is always `git mv`, never `git rm` — this repo's established convention
  (seen in prior deck-consolidation work, e.g. `ceba/CEBA DPPA 2026.backup-2026-06-23.pptx`) for
  preserving history while decluttering the working tree.
- **DEC-002:** Calendar-based reminders (deploy freshness, human-blocked-register deadlines) are
  implemented as scheduled GitHub Actions workflows (`on: schedule`), not any proprietary
  scheduling service — this repo already runs GitHub Actions for every other CI job, so this adds
  no new infrastructure, credentials, or vendor dependency.

## Specification

### S1. Deploy-freshness comparison logic (`tools/check_deploy_freshness.py`)

1. Fetch the live URL's HTML (default `https://dppa-case.web.app`, overridable via `--url`).
2. If the fetch raises any network error (timeout, DNS failure, non-2xx status): print
   `DEPLOY-FRESHNESS UNKNOWN: could not reach {url} ({error})` and exit `0` (per `CON-002` — this
   is not a drift finding).
3. Extract the build-commit marker from the fetched HTML using the pattern
   `<meta name="build-commit" content="([0-9a-f]{7,40}|unknown)">`. If no match is found, print
   `DEPLOY-FRESHNESS UNKNOWN: no build-commit marker in {url} (site predates the Phase 2 build marker)`
   and exit `0`.
4. If the extracted value is the literal string `unknown` (the marker's own fallback for a build
   environment where `git rev-parse` failed): print
   `DEPLOY-FRESHNESS UNKNOWN: live build marker is 'unknown' (build ran without git metadata)`
   and exit `0`.
5. Resolve the local reference commit via `git rev-parse {ref}` (default `ref=HEAD`, overridable
   via `--ref`).
6. Compare: if the live marker equals the local commit, or the local commit starts with the live
   marker (short-hash case), print `DEPLOY-FRESHNESS PASS (commit {short_hash})` and exit `0`.
7. Otherwise, the deploy is confirmed stale: run `git rev-list --count {live}..{local}` if `live`
   resolves in the local history (else state it does not); print
   `DEPLOY-FRESHNESS STALE: live={live_short} local={local_short} ({n} commit(s) apart — run "cd app && npm run build && npx firebase deploy --only hosting --project dppa-case")`
   and exit `1`.

### S2. Human-blocked-register classification logic (`tools/check_human_blocked_register.py`)

1. Read `plans/2026-october-readiness-checklist.md`; locate the markdown table immediately
   following the line containing the heading `## Human-blocked register`.
2. Parse each data row (skip the header row and the `|---|---|---|---|---|` separator row) into
   `{id, item, owner, needed_by, blocks}` using `|`-split, stripping whitespace from each cell.
   The `needed_by` cell must match `\d{4}-\d{2}-\d{2}`; if it does not, raise `ValueError`
   containing the row's `id` (e.g. `"H3"`) and the unparseable text.
3. Let `today` be `datetime.date.today()` (overridable via `--today YYYY-MM-DD` for deterministic
   testing).
4. For each row, compute `days_remaining = (needed_by - today).days`:
   - `days_remaining < 0` → classification `OVERDUE`.
   - `0 <= days_remaining <= 7` → classification `DUE-SOON` (inclusive boundary at exactly 7
     days out).
   - `days_remaining > 7` → classification `OK`.
5. Print one line per row: `{id} [{classification}] needed by {needed_by} ({days_remaining:+d}d): {item}`.
6. If any row's classification is `OVERDUE` or `DUE-SOON`, exit `1`; otherwise print
   `HUMAN-BLOCKED-REGISTER: all N item(s) OK` and exit `0`.

## Phase Summary

| Phase | Goal | Dependencies | Primary outputs |
|---|---|---|---|
| PHASE-01 | Fix `MISSION.md`'s stale session date, redeploy the live app from current `master`, and correct the release tag | None | Corrected `MISSION.md`, redeployed `https://dppa-case.web.app`, new tag `v1.1-oct-workshop-hardened`, updated `app/deployment.md` |
| PHASE-02 | Embed a build-commit marker in every build; add two stdlib freshness checkers and a scheduled workflow watching deploy drift and the human-blocked register | PHASE-01 | `app/vite.config.js` plugin, `tools/check_deploy_freshness.py`, `tools/check_human_blocked_register.py`, `.github/workflows/freshness-checks.yml`, tests |
| PHASE-03 | Bootstrap real visual-regression baselines, add accessibility testing, add coverage reporting | None (parallelizable with PHASE-02) | Committed Linux snapshot baselines, `app/e2e/a11y.spec.js`, Vitest coverage config, `deployment.md` updates |
| PHASE-04 | Archive 12 one-off scripts and 6 orphaned decks/screenshots into `archive/`; label the 6 remaining live root scripts | None (parallelizable) | `archive/` directory, `archive/README.md`, header comments on the 6 live scripts, updated root `package.json` |
| PHASE-05 | Write the overdue `learning-records/0005` documenting the July failure → October redesign → hardening arc | None (parallelizable) | `learning-records/0005-teaching-revamp-and-hardening-arc.md`, `NOTES.md` cross-link |

## Detailed Phases

### PHASE-01 - Deploy Recovery & Mission Framing Fix

**Goal**
`MISSION.md` correctly states the session is October 2026 (not a still-upcoming July 2026), and
`https://dppa-case.web.app` — the URL on the deck's closing-slide QR code — is redeployed from
current `master` so it reflects the entire October teaching-revamp and hardening arc, with a
correctly-named release tag and an updated deploy log.

**Tasks**
- [ ] TASK-01-01: In `MISSION.md`, replace the paragraph at lines 5–9 (starting "I am preparing
      to **teach and facilitate the Vietnam DPPA pricing session**...") with:
      > I taught and facilitated the Vietnam DPPA pricing session (CEBA "Session 5.2: Off-Site
      > Solutions Deep Dive") at the in-person factory workshop in **July 2026** — the session
      > exposed a symbol-overload failure in Module 2 that lost the audience for the rest of the
      > walkthrough (see `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md`). I am
      > now rebuilding the materials and preparing to teach the corrected version at the
      > **October 2026** session. I work at Allotrope on clean-energy advisory, so I know
      > solar/wind and project development — but I need to *own* the DPPA settlement mechanics
      > cold so I can present them clearly and field hard CFO/lender questions live.
      Leave the rest of `MISSION.md` (the "What success looks like," "How I'll know it worked,"
      and "Constraints / preferences" sections) untouched.
- [ ] TASK-01-02: Commit the `MISSION.md` fix alone: `git add MISSION.md && git commit -m "docs: correct MISSION.md session framing from upcoming-July to completed-July/upcoming-October"`.
- [ ] TASK-01-03: Run the full local predeploy gate: `cd app && npm install && npm run predeploy`
      (this runs lint, the full Vitest suite, the full Playwright e2e suite, and the production
      build in sequence — see `app/package.json`'s `predeploy` script). Confirm it exits `0`.
- [ ] TASK-01-04: Deploy: `cd app && npx firebase deploy --only hosting --project dppa-case`. See
      `ASM-001`/`ASM-002` for the authentication/`.firebaserc` fallback if this fails.
- [ ] TASK-01-05: Verify the deployed content changed: fetch the live site and confirm it now
      contains October-redesign-only markers absent from the pre-redesign build, e.g.
      `curl -s https://dppa-case.web.app/ | grep -c 'teach-mode\|Teach mode'` should be `>= 1`
      wherever the teach-mode banner's class/copy appears in the served HTML/inline script. If
      the served `index.html` doesn't directly expose that string (it may be injected by JS at
      runtime), instead confirm via `curl -s https://dppa-case.web.app/assets/*.js | grep -c teachMode`
      against the actual hashed asset filename from the served HTML's `<script type="module" src="...">`
      tag. Either check confirms the October `teach.js` module (`app/src/modules/teach.js`) is
      present in the deployed bundle.
- [ ] TASK-01-06: Record the exact deployed commit: `git rev-parse HEAD` (this is the commit that
      includes TASK-01-01's `MISSION.md` fix, since it was committed before deploying — the app
      bundle itself is unaffected by that doc change, so the deployed *code* is unchanged from
      `bd2632e` regardless of exactly which commit `HEAD` is at deploy time).
- [ ] TASK-01-07: Create the corrected release tag at the current commit:
      `git tag -a v1.1-oct-workshop-hardened -m "Live deploy after Oct teaching-revamp + readiness-hardening + prose-parity work; supersedes v1.0-oct-workshop, which predates the October redesign despite its name." && git push origin v1.1-oct-workshop-hardened`.
      Do **not** delete or move `v1.0-oct-workshop` (see `ASM-003`).
- [ ] TASK-01-08: Update `app/deployment.md`'s "Last Deploy" table: add a new row at the top with
      today's date, the `git rev-parse HEAD` short hash from TASK-01-06, and the description
      "Redeploy after Oct teaching-revamp + readiness-hardening + prose-parity work (18 commits
      since the prior 2026-07-05 deploy)." Immediately below the table, add one sentence:
      "Note: the tag `v1.0-oct-workshop` (commit `5787aad`) predates the October redesign despite
      its name; `v1.1-oct-workshop-hardened` is the tag that actually reflects October-workshop
      content." Update the "Pre-workshop checklist" item "Confirm the green release commit is
      tagged `v1.0-oct-workshop`" to say `v1.1-oct-workshop-hardened` instead.
- [ ] TASK-01-09: Commit: `git add app/deployment.md && git commit -m "docs: record redeploy and correct release-tag reference in deployment.md"`.

**File Changes**
- `MISSION.md` (modify): the single paragraph replacement per TASK-01-01; no other changes.
- `app/deployment.md` (modify): new "Last Deploy" row, one clarifying sentence about the tag,
  and the pre-workshop-checklist tag-name correction per TASK-01-08; no other changes.

**Function Signatures**
None — no code interfaces change in this phase.

**Test Specs**
None — no testable behavior changes in this phase; TASK-01-03 and TASK-01-05 are the
verification steps for this phase specifically.

**Dependencies**
- None.

**Exit Criteria**
- [ ] `grep -c "in-person factory workshop in \*\*July 2026\*\*\." MISSION.md` returns `0` (the
      old present-tense claim is gone).
- [ ] `npm run predeploy` (from `app/`) exited `0` in TASK-01-03.
- [ ] The TASK-01-05 curl check confirms October-redesign content is present in the deployed
      bundle.
- [ ] `git tag -l v1.1-oct-workshop-hardened` prints the tag name, and
      `git log -1 --format=%H v1.1-oct-workshop-hardened` matches the `HEAD` recorded in
      TASK-01-06.
- [ ] `app/deployment.md`'s "Last Deploy" table's top row shows today's date.

**Phase Risks**
- **RISK-01-01:** Firebase CLI credentials may not be available on the executing machine.
  *Mitigation:* `ASM-001` gives an explicit fallback (interactive `firebase login`, or skip the
  deploy sub-tasks entirely and continue with later phases, which don't depend on it).
- **RISK-01-02:** The TASK-01-05 verification grep pattern may not exactly match the deployed
  bundle's actual string content (minified class names, hashed asset filenames). *Mitigation:*
  the task offers two alternative check strategies; either succeeding is sufficient, and Phase 2's
  build-commit marker makes this verification exact and repeatable going forward.

### PHASE-02 - Deploy & Human-Blocked-Register Freshness Guardrails

**Goal**
Every future build embeds a machine-readable build-commit marker; two new stdlib Python checkers
detect (a) a live site that has fallen behind the checked-out commit and (b) any human-blocked
register deadline that is due within 7 days or overdue; a scheduled, portable GitHub Actions
workflow runs both weekly so drift surfaces automatically instead of relying on someone
remembering to check.

**Tasks**
- [ ] TASK-02-01: Modify `app/vite.config.js` to inject a build-commit `<meta>` tag into the
      built `index.html` via a Vite plugin using the `transformIndexHtml` hook:
      ```js
      import { defineConfig } from 'vite'
      import { execSync } from 'node:child_process'

      function getBuildCommit() {
        try {
          return execSync('git rev-parse HEAD').toString().trim()
        } catch {
          return 'unknown'
        }
      }

      function buildCommitPlugin() {
        const commit = getBuildCommit()
        return {
          name: 'inject-build-commit',
          transformIndexHtml(html) {
            return html.replace('</head>', `  <meta name="build-commit" content="${commit}">\n  </head>`)
          },
        }
      }

      export default defineConfig({
        plugins: [buildCommitPlugin()],
        test: {
          exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
        },
        build: {
          chunkSizeWarningLimit: 300,
        },
      })
      ```
      This runs only at build time (`vite build`), not in the Vitest test environment, so no
      test-side changes are needed.
- [ ] TASK-02-02: Rebuild and redeploy so the *live* site actually carries the new marker (Phase
      1's deploy predates this plugin): `cd app && npm run build && npx firebase deploy --only hosting --project dppa-case`.
      Confirm locally first with `cd app && npm run build && grep -o '<meta name="build-commit"[^>]*>' dist/index.html`
      — expect one line containing the current `git rev-parse HEAD` value.
- [ ] TASK-02-03: Create `tools/check_deploy_freshness.py` (stdlib only: `argparse`, `re`,
      `subprocess`, `sys`, `urllib.request`, `urllib.error`), following the style of
      `tools/check_retired_figures.py` (module docstring naming this phase,
      `from __future__ import annotations`, pure functions plus a `main` entry point). Implement
      exactly the logic in Specification `S1`.
- [ ] TASK-02-04: Create `tools/tests/test_check_deploy_freshness.py` (stdlib `unittest`) that
      imports the module directly (no network, no subprocess in the tests — construct the pure
      functions to accept plain strings and mock `subprocess.run`/`urllib.request.urlopen` where
      unavoidable via `unittest.mock.patch`). Cover the Test Specs below.
- [ ] TASK-02-05: Create `tools/check_human_blocked_register.py` (stdlib only: `argparse`,
      `datetime`, `pathlib`, `re`, `sys`), same style convention. Implement exactly the logic in
      Specification `S2`. Default checklist path:
      `Path(__file__).resolve().parent.parent / "plans" / "2026-october-readiness-checklist.md"`,
      overridable via `--checklist`.
- [ ] TASK-02-06: Create `tools/tests/test_check_human_blocked_register.py` (stdlib `unittest`).
      Do not read the real checklist file in the tests (its dates will change over time as
      register items are resolved) — construct a small synthetic markdown table string as an
      in-memory fixture for each test case. Cover the Test Specs below.
- [ ] TASK-02-07: Create `.github/workflows/freshness-checks.yml`:
      ```yaml
      name: freshness-checks
      on:
        schedule:
          - cron: '0 9 * * 1'
        workflow_dispatch:
      jobs:
        deploy-freshness:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-python@v5
              with:
                python-version: "3.12"
            - run: python tools/check_deploy_freshness.py
        human-blocked-register:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-python@v5
              with:
                python-version: "3.12"
            - run: python tools/check_human_blocked_register.py
      ```
      Note: `.github/workflows/ci.yml`'s existing `deck-parity` job already runs
      `python -m unittest discover -s tools/tests -v` on every push, which will automatically
      pick up the two new test files created in TASK-02-04/TASK-02-06 without any edit to
      `ci.yml` — do not duplicate that step in the new workflow file.
- [ ] TASK-02-08: Local dry run of both checkers against real current state:
      `python tools/check_deploy_freshness.py` (expect `DEPLOY-FRESHNESS PASS` once TASK-02-02's
      redeploy has happened) and `python tools/check_human_blocked_register.py` (expect
      `HUMAN-BLOCKED-REGISTER: all 5 item(s) OK` unless a register date is genuinely within 7
      days of today, in which case that is a true finding, not a bug).
- [ ] TASK-02-09: Commit: `git add app/vite.config.js tools/check_deploy_freshness.py tools/check_human_blocked_register.py tools/tests/test_check_deploy_freshness.py tools/tests/test_check_human_blocked_register.py .github/workflows/freshness-checks.yml && git commit -m "feat: build-commit marker + deploy/human-blocked-register freshness checkers, scheduled weekly"`.

**File Changes**
- `app/vite.config.js` (modify): add the `buildCommitPlugin` and register it in `plugins`, per
  TASK-02-01. Leave the existing `test`/`build` keys' values unchanged.
- `tools/check_deploy_freshness.py` (create): per TASK-02-03 and Specification `S1`.
- `tools/tests/test_check_deploy_freshness.py` (create): per TASK-02-04.
- `tools/check_human_blocked_register.py` (create): per TASK-02-05 and Specification `S2`.
- `tools/tests/test_check_human_blocked_register.py` (create): per TASK-02-06.
- `.github/workflows/freshness-checks.yml` (create): per TASK-02-07.

**Function Signatures**
- `extract_build_commit(html: str) -> str | None` — returns the value of the `<meta name="build-commit" content="...">` attribute found in `html`, or `None` if the tag is absent/malformed.
- `fetch_html(url: str, timeout: int = 10) -> str` — performs an HTTP GET and returns the decoded response body; lets `urllib.error.URLError`/`TimeoutError` propagate to the caller.
- `local_head_commit(ref: str = "HEAD") -> str` — runs `git rev-parse {ref}` and returns the trimmed stdout (a 40-character hex string).
- `compare_commits(live: str, local: str) -> tuple[bool, str]` — returns `(True, message)` when `live == local` or `local` starts with `live` (short-hash case); otherwise `(False, message)` where `message` names both short hashes.
- `check_deploy_freshness.main(argv: list[str] | None = None) -> int` — orchestrates fetch → extract → compare → print → returns the exit code described in Specification `S1`.
- `parse_register_table(markdown: str) -> list[dict]` — returns one dict per data row (`id`, `item`, `owner`, `needed_by: datetime.date`, `blocks`) found in the `## Human-blocked register` table; raises `ValueError` naming the row's `id` on an unparseable date.
- `classify(needed_by: datetime.date, today: datetime.date) -> str` — returns `"OVERDUE"`, `"DUE-SOON"`, or `"OK"` per the boundary rules in Specification `S2`.
- `check_human_blocked_register.main(argv: list[str] | None = None) -> int` — reads the checklist file, parses, classifies every row, prints per-row results, returns the exit code described in Specification `S2`.

**Test Specs**
- `extract_build_commit('<head><meta name="build-commit" content="abc1234def5678901234567890123456789012"></head>')` → returns `"abc1234def5678901234567890123456789012"`.
- `extract_build_commit('<head></head>')` → returns `None`.
- `compare_commits("abc1234def5678901234567890123456789012", "abc1234def5678901234567890123456789012")` → `(True, ...)`.
- `compare_commits("abc1234", "abc1234def5678901234567890123456789012")` (short-hash live value) → `(True, ...)` (prefix match).
- `compare_commits("abc1234def5678901234567890123456789012", "def5678901234567890123456789012abc1234")` (different) → `(False, ...)` and the message contains both 7-character short forms.
- `compare_commits("unknown", "abc1234def5678901234567890123456789012")` → `(False, ...)` with a message indicating the live build marker is `unknown`.
- `parse_register_table(...)` on a fixture 2-row table with `Needed by` values `2026-08-15` and `2026-09-08` → returns 2 dicts with `needed_by` as `datetime.date(2026, 8, 15)` and `datetime.date(2026, 9, 8)` respectively.
- `parse_register_table(...)` on a fixture row with `Needed by` = `"TBD"` → raises `ValueError` whose message contains the row's `id`.
- `classify(datetime.date(2026, 8, 1), today=datetime.date(2026, 7, 22))` (10 days out) → `"OK"`.
- `classify(datetime.date(2026, 7, 22), today=datetime.date(2026, 7, 22))` (due today, 0 days) → `"DUE-SOON"`.
- `classify(datetime.date(2026, 7, 29), today=datetime.date(2026, 7, 22))` (exactly 7 days out, boundary) → `"DUE-SOON"`.
- `classify(datetime.date(2026, 7, 30), today=datetime.date(2026, 7, 22))` (8 days out) → `"OK"`.
- `classify(datetime.date(2026, 7, 21), today=datetime.date(2026, 7, 22))` (1 day past) → `"OVERDUE"`.

**Dependencies**
- PHASE-01 (the build-commit marker is meaningless to verify end-to-end — TASK-02-08's
  `DEPLOY-FRESHNESS PASS` check — until Phase 1's redeploy has established a real deployed
  baseline to compare against; TASK-02-02 performs the necessary second redeploy once the marker
  plugin exists).

**Exit Criteria**
- [ ] `PYTHONPATH= py -m unittest discover -s tools/tests -v` (Windows) /
      `python3 -m unittest discover -s tools/tests -v` (Linux) passes, including the two new test
      files.
- [ ] `cd app && npm run build && grep -o '<meta name="build-commit"[^>]*>' dist/index.html`
      prints one matching line.
- [ ] `python tools/check_deploy_freshness.py` (after TASK-02-02's redeploy) prints
      `DEPLOY-FRESHNESS PASS`.
- [ ] `python tools/check_human_blocked_register.py` runs to completion and prints one line per
      register row plus a final summary line.
- [ ] `.github/workflows/freshness-checks.yml` appears in the repository's Actions tab after
      pushing, with no workflow-parse error shown by GitHub (or, if PyYAML is available locally:
      `python -c "import yaml; yaml.safe_load(open('.github/workflows/freshness-checks.yml', encoding='utf-8'))"`
      exits without raising).

**Phase Risks**
- **RISK-02-01:** GitHub's default notification for a failed scheduled workflow goes to the
  repository owner/watchers by email, which the presenter (this repo's sole maintainer) may not
  check as often as a chat notification. *Mitigation:* out of scope to build a second delivery
  channel in this plan; the weekly cadence combined with `H1`'s earliest deadline (2026-08-15)
  gives multiple weekly runs of margin before any register deadline is truly time-critical.
- **RISK-02-02:** `check_deploy_freshness.py`'s HTML-scraping approach breaks if the deployed
  `index.html`'s `<head>` structure changes in a way that moves or removes the injected meta tag
  (e.g. a future redesign strips the `</head>` replacement target). *Mitigation:* `CON-002`
  already ensures this fails soft (`UNKNOWN`, exit `0`) rather than raising an unhandled
  exception, because a missing/malformed tag is treated identically to "no marker found."

### PHASE-03 - CI Rigor Hardening: Visual Baselines, Coverage, Accessibility

**Goal**
The `e2e:visual` CI step can actually fail the build (real Linux baselines exist); an
accessibility check using `@axe-core/playwright` runs as part of the standard e2e suite; test
coverage is measured and reported (not yet threshold-enforced).

**Tasks**
- [ ] TASK-03-01 (visual baselines — bootstrap trigger): On a new branch `bootstrap/visual-baselines`,
      temporarily add a step to the `quality` job in `.github/workflows/ci.yml`, immediately after
      the existing `- run: npm run e2e:visual` step:
      ```yaml
      - run: cd app && npm run e2e:visual -- --update-snapshots
      - uses: actions/upload-artifact@v4
        with:
          name: visual-baselines
          path: app/e2e/visual.spec.js-snapshots/
      ```
      Push the branch to trigger the workflow.
- [ ] TASK-03-02: Once the workflow run completes, download the `visual-baselines` artifact from
      the GitHub Actions run, extract it, and copy every `*-linux.png` file it contains into
      `app/e2e/visual.spec.js-snapshots/` in the local working tree (on the `master` branch, not
      the throwaway branch).
- [ ] TASK-03-03: Delete the throwaway branch: `git branch -d bootstrap/visual-baselines` (local)
      and `git push origin --delete bootstrap/visual-baselines` (remote) — the two temporary CI
      lines from TASK-03-01 never existed on `master`, so no revert is needed there.
- [ ] TASK-03-04 (visual baselines — enforce): In `.github/workflows/ci.yml`, remove the line
      `continue-on-error: true` from the existing `- run: npm run e2e:visual` step (the step
      itself stays; only the toleration flag is removed).
- [ ] TASK-03-05 (coverage): `cd app && npm install --save-dev @vitest/coverage-v8`. Modify
      `app/vite.config.js`'s `test` block to add:
      ```js
      test: {
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html'],
          exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'scripts/**', '**/*.test.js'],
        },
      },
      ```
      Add `"test:coverage": "vitest run --coverage"` to `app/package.json`'s `scripts` block.
- [ ] TASK-03-06: Add `- run: cd app && npm run test:coverage` to the `quality` job in
      `.github/workflows/ci.yml`, immediately after the existing `- run: npm test` step (report
      only — no threshold is configured, so this step can only fail if a test itself fails, which
      `npm test` already caught one step earlier).
- [ ] TASK-03-07 (accessibility): `cd app && npm install --save-dev @axe-core/playwright`.
- [ ] TASK-03-08: Create `app/e2e/a11y.spec.js`:
      ```js
      import { test, expect } from '@playwright/test'
      import AxeBuilder from '@axe-core/playwright'

      const SEVERE_IMPACTS = new Set(['critical', 'serious'])

      function severeViolations(results) {
        return results.violations.filter((v) => SEVERE_IMPACTS.has(v.impact))
      }

      test.describe('accessibility', () => {
        test('default scenario has no critical/serious violations', async ({ page }) => {
          await page.goto('/')
          const results = await new AxeBuilder({ page }).analyze()
          const severe = severeViolations(results)
          await test.info().attach('axe-violations.json', {
            body: JSON.stringify(severe, null, 2),
            contentType: 'application/json',
          })
          expect(severe, `${severe.length} critical/serious violation(s): ${severe.map((v) => v.id).join(', ')}`).toEqual([])
        })

        test('teach mode banner has no critical/serious violations', async ({ page }) => {
          await page.goto('/?teach=1')
          const results = await new AxeBuilder({ page }).analyze()
          const severe = severeViolations(results)
          await test.info().attach('axe-violations.json', {
            body: JSON.stringify(severe, null, 2),
            contentType: 'application/json',
          })
          expect(severe, `${severe.length} critical/serious violation(s): ${severe.map((v) => v.id).join(', ')}`).toEqual([])
        })
      })
      ```
      This spec is not tagged `@visual`, so it is automatically included in the existing
      `npm run e2e` script (`playwright test --grep-invert @visual`) with no config changes
      needed, and runs on all three configured Playwright projects
      (`chromium-desktop`, `webkit-mobile`, `chromium-tablet`).
- [ ] TASK-03-09: Run `cd app && npm run e2e -- a11y.spec.js` locally/in CI and inspect the
      result. Apply `ASM-004`'s triage rule to whatever `@axe-core/playwright` actually reports:
      fix trivial issues directly in `app/src/*.css`/`app/src/modules/ui.js`/`app/index.html` as
      needed; for anything non-trivial, add `.disableRules(['rule-id'])` to the relevant
      `AxeBuilder` call with a comment citing the finding, and add one bullet to `NOTES.md` under
      a new "Accessibility follow-ups" note.
- [ ] TASK-03-10: Update `app/deployment.md`: replace the "Visual baseline bootstrap (one-time)"
      section's content with a short note that baselines are committed and the CI gate is
      enforced (no longer `continue-on-error`); add one line under "Quality commands" mentioning
      `npm run test:coverage` and the new `a11y.spec.js` coverage in `npm run e2e`.
- [ ] TASK-03-11: Commit: `git add app/e2e/a11y.spec.js app/e2e/visual.spec.js-snapshots app/vite.config.js app/package.json app/package-lock.json .github/workflows/ci.yml app/deployment.md NOTES.md && git commit -m "test: enforce visual-regression baselines, add accessibility gate, add coverage reporting"`.

**File Changes**
- `.github/workflows/ci.yml` (modify): remove `continue-on-error: true` from the `e2e:visual`
  step; add the `test:coverage` step after `npm test`; no changes to the `deck-parity` job.
- `app/vite.config.js` (modify): add the `coverage` block inside `test`, per TASK-03-05.
- `app/package.json` (modify): add `@vitest/coverage-v8` and `@axe-core/playwright` to
  `devDependencies`; add the `test:coverage` script.
- `app/package-lock.json` (modify): regenerated automatically by `npm install`.
- `app/e2e/a11y.spec.js` (create): per TASK-03-08, adjusted per TASK-03-09's real findings.
- `app/e2e/visual.spec.js-snapshots/*-linux.png` (create): the bootstrapped baseline images from
  TASK-03-02 — exact filenames are determined by Playwright's snapshot naming convention
  (test title + project name + `-linux.png`) and cannot be enumerated before the bootstrap run.
- `app/deployment.md` (modify): per TASK-03-10.
- `NOTES.md` (modify, conditionally): only if TASK-03-09 finds non-trivial violations requiring
  a disabled-rule follow-up note.

**Function Signatures**
None — no code interfaces change in this phase (test/config files only).

**Test Specs**
- `page.goto('/')` (default scenario, no query params) → `new AxeBuilder({ page }).analyze()`
  returns zero violations with `impact` in `{critical, serious}`.
- `page.goto('/?teach=1')` (teach-mode banner active) → same zero-severe-violations expectation.
- Visual regression: any pixel diff exceeding `maxDiffPixelRatio: 0.01` (already configured in
  `app/playwright.config.js`) against a committed `*-linux.png` baseline now fails the `quality`
  CI job (previously always passed regardless, due to `continue-on-error: true`).
- Coverage: `npm run test:coverage` exits `0` when all Vitest tests pass, regardless of the
  percentage reported (no threshold enforced per `ASM-005`), and prints a text summary table to
  stdout plus writes an HTML report to `app/coverage/`.

**Dependencies**
- None (independent of PHASE-01/PHASE-02; can run in parallel).

**Exit Criteria**
- [ ] `app/e2e/visual.spec.js-snapshots/` contains at least one `*-linux.png` file per visual
      test scenario defined in `app/e2e/visual.spec.js`.
- [ ] `.github/workflows/ci.yml`'s `e2e:visual` step no longer contains `continue-on-error: true`.
- [ ] `cd app && npm run e2e -- a11y.spec.js` passes (after TASK-03-09's triage is applied).
- [ ] `cd app && npm run test:coverage` exits `0` and prints a coverage summary.
- [ ] A subsequent CI run of the `quality` job (triggered by pushing this phase's commit) is
      green end-to-end, including the now-enforced `e2e:visual` step.

**Phase Risks**
- **RISK-03-01:** Real accessibility violations may exist and require nontrivial redesign work
  outside a single planning cycle. *Mitigation:* `ASM-004`'s triage rule bounds this phase's
  scope — trivial fixes now, everything else explicitly deferred and tracked, never silently
  ignored.
- **RISK-03-02:** Committed Linux baseline PNGs will need periodic regeneration as the UI
  legitimately changes (e.g., future scenario/copy edits). *Mitigation:* this is expected,
  ongoing maintenance identical to any snapshot-testing setup — `deployment.md`'s existing
  `npm run e2e:visual -- --update-snapshots` instructions (TASK-03-10's updated section) cover
  the regeneration workflow going forward.

### PHASE-04 - Repo Hygiene: Archive One-Off Scripts & Orphaned Decks

**Goal**
The repo root contains only the 6 build/verify scripts still in active use (CI-invoked or
NOTES.md-documented as regenerable); the 12 one-off scripts and 6 orphaned deck/screenshot files
are preserved under `archive/` via `git mv` (fully reversible, full history retained); the 6
remaining live scripts each carry a one-line header stating why they must not be archived.

**Tasks**
- [ ] TASK-04-01: Create `archive/README.md`:
      ```markdown
      # Archive

      One-off scripts and superseded deck artifacts, kept for reproducibility and history.
      Nothing in this directory is invoked by CI or referenced by any current teaching document
      (`NOTES.md`, `RESOURCES.md`, `MISSION.md`). Each file's `git log -- archive/<file>` shows
      when it was last active before being moved here.

      The 6 scripts still in active use remain at the repo root:
      `audit_teaching_deck.py`, `verify_deck_numbers.py`, `build_oct_teaching_deck.py`,
      `build_teaching_visuals.py`, `build_cfd_slide.py`, `build_worksheet_answer_docx.py`.
      ```
- [ ] TASK-04-02: `git mv` the 12 one-off scripts into `archive/` (flat, no subdirectory):
      `apply_corrections.py`, `apply_deck_corrections.js`, `apply_deck_corrections.py`,
      `build-deck.js`, `build_2026_from_ref.py`, `build_callouts.py`, `build_canonical_cases.py`,
      `build_policy_refresh.py`, `verify_deck_app_parity.js`, `verify_deck_app_parity.py`,
      `inspect_pptx.py`, `export-slides.ps1`.
- [ ] TASK-04-03: `git mv` the 6 orphaned deck/screenshot files into `archive/` (flat):
      `dppa-case-study.pptx`, `dppa-factory-presentation.pptx`, `dppa-web-app-case-study.pptx`,
      `dppa-2026-factory-energy-proposal.pptx`, `current-app-screenshot.png`,
      `desktop-current.png`.
- [ ] TASK-04-04: `git mv ref archive/ref` (moves the whole `ref/` directory, currently containing
      only `ref/DPPA 2025 ref.pptx`, to `archive/ref/`).
- [ ] TASK-04-05: Update the root `package.json`'s `"main"` field from `"build-deck.js"` to
      `"archive/build-deck.js"` so it still points at a real path (this field is otherwise unused
      metadata — no script in the repo requires this package as a module — but should not dangle).
- [ ] TASK-04-06: Add a one-line comment as the first line of each of the 6 remaining live root
      scripts (a `#` comment as line 1 is always valid before a Python module docstring — it does
      not affect the docstring being the first *statement*):
      - `audit_teaching_deck.py`: `# LIVE: invoked by CI (.github/workflows/ci.yml, "deck-parity" job) via "python audit_teaching_deck.py". Do not move to archive/.`
      - `verify_deck_numbers.py`: `# LIVE: invoked by CI (.github/workflows/ci.yml, "deck-parity" job) via "python verify_deck_numbers.py". Do not move to archive/.`
      - `build_oct_teaching_deck.py`: `# LIVE: regenerate manually after data/text changes via "PYTHONPATH= py build_oct_teaching_deck.py --lang en|vi|zh" (see NOTES.md). Not CI-invoked; do not move to archive/.`
      - `build_teaching_visuals.py`: `# LIVE: regenerate manually via "PYTHONPATH= py build_teaching_visuals.py --lang en|vi|zh" whenever settlement.js or escalation assumptions change (see NOTES.md). Not CI-invoked; do not move to archive/.`
      - `build_cfd_slide.py`: `# LIVE: regenerate manually via "py build_cfd_slide.py" whenever per-scenario CfD chart assets need refreshing (see NOTES.md). Not CI-invoked; do not move to archive/.`
      - `build_worksheet_answer_docx.py`: `# LIVE: regenerate manually via "py build_worksheet_answer_docx.py" whenever assets/teaching/spine-s{1,2,3}.json change (see NOTES.md). Reads spine exports; does not hand-type figures. Not CI-invoked; do not move to archive/.`
- [ ] TASK-04-07: Confirm no currently-active document references an archived path:
      `git grep -n -E "apply_corrections\.py|apply_deck_corrections|build-deck\.js|build_2026_from_ref\.py|build_callouts\.py|build_canonical_cases\.py|build_policy_refresh\.py|verify_deck_app_parity|inspect_pptx\.py|export-slides\.ps1" -- '*.md' '*.yml' '*.json' | grep -v -E '^(plans/|research/|reports/|learning-records/|activeContext\.md|archive/)'`
      must return no matches (historical records in `plans/`, `research/`, `reports/`,
      `learning-records/`, and `activeContext.md` legitimately keep references to what was true
      when they were written, and are excluded).
- [ ] TASK-04-08: Commit: `git add -A && git commit -m "chore: archive one-off deck-build scripts and superseded pptx/screenshot artifacts (git mv, no deletions)"`.

**File Changes**
- `archive/README.md` (create): per TASK-04-01.
- `archive/apply_corrections.py`, `archive/apply_deck_corrections.js`,
  `archive/apply_deck_corrections.py`, `archive/build-deck.js`, `archive/build_2026_from_ref.py`,
  `archive/build_callouts.py`, `archive/build_canonical_cases.py`,
  `archive/build_policy_refresh.py`, `archive/verify_deck_app_parity.js`,
  `archive/verify_deck_app_parity.py`, `archive/inspect_pptx.py`, `archive/export-slides.ps1`
  (create via `git mv` from the repo root, per TASK-04-02): file contents unchanged, path only.
- `archive/dppa-case-study.pptx`, `archive/dppa-factory-presentation.pptx`,
  `archive/dppa-web-app-case-study.pptx`, `archive/dppa-2026-factory-energy-proposal.pptx`,
  `archive/current-app-screenshot.png`, `archive/desktop-current.png` (create via `git mv` from
  the repo root, per TASK-04-03): unchanged, path only.
- `archive/ref/DPPA 2025 ref.pptx` (create via `git mv ref archive/ref`, per TASK-04-04):
  unchanged, path only.
- `package.json` (modify, repo root): `"main"` field value only, per TASK-04-05.
- `audit_teaching_deck.py`, `verify_deck_numbers.py`, `build_oct_teaching_deck.py`,
  `build_teaching_visuals.py`, `build_cfd_slide.py`, `build_worksheet_answer_docx.py` (modify):
  insert one `#` comment line at line 1 each, per TASK-04-06; no other changes to any of these
  6 files.

**Function Signatures**
None — no code interfaces change in this phase (file moves and a comment line only).

**Test Specs**
None — no testable behavior changes; TASK-04-07's grep sweep is this phase's verification.

**Dependencies**
- None (independent of all other phases — touches only root-level file locations, never
  `app/`).

**Exit Criteria**
- [ ] `ls *.py *.js *.ps1 2>/dev/null | sort` at the repo root prints exactly 6 lines:
      `audit_teaching_deck.py`, `build_cfd_slide.py`, `build_oct_teaching_deck.py`,
      `build_teaching_visuals.py`, `build_worksheet_answer_docx.py`, `verify_deck_numbers.py`.
- [ ] `git ls-files archive/ | wc -l` prints `20` (12 scripts + 6 decks/screenshots + 1 README +
      1 file under `archive/ref/`).
- [ ] `test -d ref` (repo root) is false — the directory no longer exists at its old location.
- [ ] The TASK-04-07 grep sweep returns no matches.
- [ ] `head -1 verify_deck_numbers.py` starts with `# LIVE:`.

**Phase Risks**
- **RISK-04-01:** A currently-untracked or hidden reference to one of the archived paths (e.g. in
  a local, uncommitted script or a teammate's personal notes) could break after the move.
  *Mitigation:* `git mv` preserves full history at the new path, so `git log --follow -- archive/<file>`
  still finds it; the move is trivially reversible with `git mv archive/<file> <file>` if a hidden
  dependency surfaces later.

### PHASE-05 - Institutional Memory: Learning Record 0005

**Goal**
`learning-records/0005-teaching-revamp-and-hardening-arc.md` exists, synthesizing (not
re-researching) the July 2026 symbol-overload failure, the October redesign response, the
subsequent readiness-hardening arc, and the prose-parity second-pipeline hardening — closing a
documentation gap three prior analysis passes flagged without any of them fixing it.

**Tasks**
- [ ] TASK-05-01: Read the following source material (all already exist in the repo; this task
      is synthesis, not new research):
      `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md`,
      `plans/2026-07-04-dppa-modules-teaching-revamp-plan.md`,
      `reports/2026-07-04-modules-teaching-revamp-implementation.md`,
      `plans/2026-07-10-october-readiness-hardening-plan.md`,
      `plans/2026-07-17-prose-parity-second-pipeline-plan.md`,
      `facilitator/fresh-viewer-kit/README.md`, and the commit log range
      `git log --oneline 332a4c2^..bd2632e`.
- [ ] TASK-05-02: Create `learning-records/0005-teaching-revamp-and-hardening-arc.md` following
      the exact structural pattern already used by `learning-records/0004-worksheet-answer-docx.md`
      (a `# 0005 — {title}` heading, then `**Date:**`/`**Status:**` lines, then `## Context`,
      `## What shipped`, `## Decisions`, `## Verification`, `## Status` sections — read
      `learning-records/0004-worksheet-answer-docx.md` directly for the exact formatting
      conventions, e.g. `✅` bullet markers under "What shipped," inline code spans for file
      paths and figures). The content must cover, at minimum:
      1. **Root cause** — the July 2026 CEBA session failed due to symbol overload in Module 2:
         slides 6–7 introduced 5 symbols (`Q_Khc`, `k`, `K_pp`, `C_dppa_dv`, `P_cl`) and three
         `min()` volume formulas simultaneously; ~100–165 words per content slide; 20+ symbols
         across the deck; raw 10-digit VND arithmetic on-slide; formula-first (not
         intuition-first) sequencing — audience never recovered for Modules 3–6. Cite
         `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md`'s DEC-002.
      2. **Response** — the October rebuild: a visual-first trilingual (en/vi/zh-cn) deck built
         from the 44-slide master, a presenter "teach mode" step-through in the app, a slimmed M5
         hand-compute worksheet, a double-sided A4 reference card. Cite commit `332a4c2`
         (brainstorm + plan) and `9773440` (implementation).
      3. **Hardening** — the subsequent readiness-hardening arc: teach-mode fallback recordings,
         a real 56-scenario gate sweep behind the M5 heatmap, a QR code linking to the live app,
         a deck-parity CI gate proving deck numbers match the engine, translation-map scaffolding,
         and the fresh-viewer test kit. Cite `plans/2026-07-10-october-readiness-hardening-plan.md`
         and commits `0e8350f` through `d24ed9b`.
      4. **Second-pipeline hardening** — closing the gap between the deck's verified numbers and
         every other prose/handout artifact that had been hand-typing the same figures
         unverified (facilitator guides, lesson HTML, the printed Word handout). Cite
         `plans/2026-07-17-prose-parity-second-pipeline-plan.md` and commits `50536d4` through
         `bd2632e`.
      5. **The generalizable lesson** (the actual point of a learning record) — state explicitly:
         a single verified number pipeline is not sufficient if downstream prose/handout
         artifacts copy from it once and are never re-checked; verification has to extend to
         every artifact a participant can physically hold (a printed handout cannot be
         hot-fixed on session day), not only the one rendered live on a screen. Note this as the
         rule future teaching-case work (in this repo or a future similar case study) should
         carry forward.
- [ ] TASK-05-03: Add a cross-link in `NOTES.md`: insert a new dated section near the top (above
      the existing "## October readiness hardening (2026-07-11)" section, consistent with
      `NOTES.md`'s existing pattern of newest-first dated sections) titled with today's date,
      containing one sentence pointing to the new learning record, e.g. "## Learning record 0005
      (added {today's date}) — `learning-records/0005-teaching-revamp-and-hardening-arc.md`
      synthesizes the July symbol-overload failure through the prose-parity hardening arc; read
      it for the full narrative before starting new teaching-case work." Do not edit any existing
      `NOTES.md` content.
- [ ] TASK-05-04: Commit: `git add learning-records/0005-teaching-revamp-and-hardening-arc.md NOTES.md && git commit -m "docs: add learning-records/0005 for the July failure -> October redesign -> hardening arc"`.

**File Changes**
- `learning-records/0005-teaching-revamp-and-hardening-arc.md` (create): per TASK-05-02.
- `NOTES.md` (modify): one new dated section inserted near the top, per TASK-05-03; no existing
  content changed or removed.

**Function Signatures**
None — this phase produces documentation only.

**Test Specs**
None — no testable behavior changes; the Exit Criteria below are this phase's verification.

**Dependencies**
- None (independent of all other phases — pure documentation synthesis of already-completed,
  already-committed work).

**Exit Criteria**
- [ ] `test -f learning-records/0005-teaching-revamp-and-hardening-arc.md` (file exists).
- [ ] `grep -ci "symbol overload" learning-records/0005-teaching-revamp-and-hardening-arc.md`
      returns `>= 1`.
- [ ] `grep -c "332a4c2\|9773440" learning-records/0005-teaching-revamp-and-hardening-arc.md`
      returns `>= 1` (at least one of the redesign commit hashes is cited).
- [ ] `grep -c "0005" NOTES.md` returns `>= 1` (the cross-link is present).

**Phase Risks**
- **RISK-05-01:** This is the fourth time this gap has been identified (twice in prior
  brainstorms, once in this plan's own source brainstorm); a fourth non-execution would be a
  process signal worth escalating rather than re-planning again. *Mitigation:* none needed within
  this plan — flagged here only so a future session that finds this phase still incomplete
  understands the pattern and prioritizes it accordingly rather than writing a fifth brainstorm
  mention.

## Gotchas

- **Windows vs. Linux command forms:** this repo's existing Python tooling is invoked as
  `PYTHONPATH= py <script>.py` on the author's Windows machine (a stale `PYTHONPATH` env var
  shadows imports otherwise) and as `python3 <script>.py` in CI/Linux. Both forms are given
  side-by-side wherever this plan specifies a Python command; use whichever matches the
  executing environment.
- **`npm install`, never `npm ci`, in `app/`** — the committed lockfile has known
  optional-native-binary drift (`ci.yml` comment, lines 18–20) that `npm ci` rejects.
- **`.firebaserc` and Firebase CLI auth are both outside version control** — a fresh checkout of
  this repo cannot deploy without the human-in-the-loop steps in `ASM-001`/`ASM-002`. This is
  expected and pre-existing, not something this plan is meant to fix (that would require secrets
  management this repo doesn't have — see the out-of-scope note re: CI deploy credentials, `H4`
  in the human-blocked register).
- **`tools/tests/` is auto-discovered** by the existing `deck-parity` CI job's
  `python -m unittest discover -s tools/tests -v` step — new test files placed there (Phase 2)
  are picked up automatically; do not add a redundant explicit test-run step to `ci.yml` for
  them.
- **A `#` comment as the very first line of a Python file does not break a module docstring** —
  the docstring only needs to be the first *statement*, and a leading comment line is not a
  statement. This is why Phase 4's header-comment task can safely target "line 1" uniformly
  across all 6 live scripts regardless of whether each currently opens with a docstring, an
  import, or a shebang-less script body.
- **Currency/number formatting law (VND, comma-grouped, unrounded intermediate prices) is
  established by prior plans and must not be reintroduced or altered by this plan** — none of
  this plan's phases touch settlement figures, but Phase 5's learning record will quote figures
  from earlier plans; quote them exactly as already published (e.g. `8,563,196,000`), never
  re-derive or re-round them.
- **Tag names are permanent-ish social contracts, not just labels** — `ASM-003`'s decision to add
  a new tag rather than force-move `v1.0-oct-workshop` is deliberate: a force-moved pushed tag
  can silently break anything (a CI job, a teammate's local clone, a deploy script) that already
  resolved the old tag to its old commit.

## Verification Strategy

- **TEST-001:** `cd app && npm run predeploy` → exits `0` (lint, full Vitest suite, full
  Playwright e2e suite, and production build all pass) — required before PHASE-01's deploy.
- **TEST-002:** `PYTHONPATH= py -m unittest discover -s tools/tests -v` (Windows) /
  `python3 -m unittest discover -s tools/tests -v` (Linux) → all tests pass, including the 2 new
  test files from PHASE-02.
- **TEST-003:** `python tools/check_deploy_freshness.py` (after PHASE-01's deploy and PHASE-02's
  marker-plugin redeploy) → prints `DEPLOY-FRESHNESS PASS (commit ...)` and exits `0`.
- **TEST-004:** `python tools/check_human_blocked_register.py` → exits `0` with
  `HUMAN-BLOCKED-REGISTER: all 5 item(s) OK`, unless a register date has genuinely become due
  within 7 days by the time this plan executes (a true finding, not a defect).
- **TEST-005:** `cd app && npm run e2e -- a11y.spec.js` → passes with zero `critical`/`serious`
  axe-core violations (after PHASE-03's TASK-03-09 triage).
- **TEST-006:** `cd app && npm run e2e:visual` → passes with the `continue-on-error` toleration
  removed from CI (PHASE-03).
- **TEST-007:** `cd app && npm run test:coverage` → exits `0` and prints a coverage summary
  table.
- **MANUAL-001:** After PHASE-01's deploy, open `https://dppa-case.web.app?teach=1` in a browser
  and confirm the six-step teach-mode banner is visible (it did not exist in the pre-redesign
  build that was live before this plan executed).
- **MANUAL-002:** After PHASE-04, run `git log --follow --oneline -- archive/build_2026_from_ref.py`
  (or any other archived file) and confirm its full pre-archive commit history is still visible —
  proving the archive step preserved history rather than losing it.
- **OBS-001:** After PHASE-02, watch the repository's Actions tab for the first scheduled
  `freshness-checks` run (or trigger it manually via `workflow_dispatch` rather than waiting up
  to a week) and confirm both jobs (`deploy-freshness`, `human-blocked-register`) complete and
  report a result (pass or a genuine finding) rather than erroring out on a code defect.

## Risks and Alternatives

- **RISK-001:** This plan's Phase 1 deploy changes what is publicly served at
  `https://dppa-case.web.app`. If the redesigned app has an undiscovered regression that only
  manifests in production (not caught by the local `predeploy` gate or e2e suite), the live demo
  tool could be worse, not better, immediately before use. *Mitigation:* TASK-01-03 requires the
  full local predeploy gate to pass first, and MANUAL-001 requires a live manual smoke check
  immediately after deploying; PHASE-03's later CI hardening (visual regression, accessibility)
  further reduces the chance of an undetected regression on the *next* deploy, though it does not
  retroactively cover this first one.
- **RISK-002:** Archiving root scripts (Phase 4) is judged non-destructive because `git mv`
  preserves history, but the plan's own classification (`ASM-009`) could be wrong for a script
  this planning pass didn't fully trace every reference for (e.g. a personal, uncommitted local
  workflow). *Mitigation:* TASK-04-07's grep sweep is the guard; `git mv` remains trivially
  reversible if a false-positive classification surfaces later.
- **ALT-001:** Instead of a scheduled GitHub Actions workflow for freshness checks (PHASE-02),
  the checkers could be wired directly into the existing `deck-parity` job so they run on every
  push. *Not chosen* because both checks are fundamentally about *time passing* (has the live
  site drifted since the last deploy; has a calendar deadline arrived) rather than about *code
  changing* — running them on every push would either be redundant (deploy freshness doesn't
  change between two commits that both predate any redeploy) or noisy (the human-blocked
  register's classification is identical across many consecutive pushes until a date boundary is
  crossed). A weekly schedule matches the actual rate of change of what's being checked.
- **ALT-002:** Instead of creating a new tag (`v1.1-oct-workshop-hardened`) in PHASE-01, the
  existing `v1.0-oct-workshop` tag could be force-moved to the new commit. *Not chosen* — `DEC-001`
  and `ASM-003` establish that this repo's convention favors non-destructive operations, and a
  force-moved pushed tag risks breaking anything that already resolved the old tag to its old
  commit.

## Suggested Next Step

Execute PHASE-01 first — it is the single highest-consequence, lowest-effort fix (the live demo
artifact the deck's QR code points to is currently stale) and every later phase's exit criteria
can be verified independently before moving on. PHASE-02 through PHASE-05 are mutually
independent once PHASE-01 is done (PHASE-02 has a soft dependency on PHASE-01's deploy having
happened) and can proceed in any order, including in parallel across multiple contributors.
