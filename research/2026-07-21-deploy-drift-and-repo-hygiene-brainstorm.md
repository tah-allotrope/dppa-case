---
title: "DPPA-Case: Deploy Drift, Repo Hygiene & the Agent-Platform Frontier"
date: "2026-07-21"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze the project's current state, codebase, documentation and architecture; brainstorm improvements, features, refactors, architectural changes or optimizations that would take it to the next level"
slug: "deploy-drift-and-repo-hygiene"
builds_on:
  - "research/2026-07-17-prose-parity-and-plan-gaps-brainstorm.md"
  - "research/2026-07-16-post-hardening-next-level-brainstorm.md"
  - "research/2026-07-10-next-level-improvements-brainstorm.md"
  - "plans/2026-07-17-prose-parity-second-pipeline-plan.md (5/5 phases complete, committed bd2632e)"
---

# Brainstorm: What a Fresh Pass Found on 2026-07-21

## 0. State of play (verified today)

- **Working tree clean, nothing executed since `bd2632e`** (2026-07-17). Four idle days.
  `origin/master` is up to date with local. No untracked files.
- The prior three brainstorms (07-10, 07-16, 07-17) exhaustively covered the **number-pipeline**
  problem — deck↔engine↔prose↔handout parity — and it is now genuinely hardened: three CI gates
  (`deck-parity` job: spine/sweep diff, `audit_teaching_deck.py`, `verify_deck_numbers.py`,
  `check_retired_figures.py`, `verify_prose_figures.py`, `tools/tests`) plus a five-item
  human-blocked register with dates. **This brainstorm does not re-litigate that work.** It looks
  at what a fresh pass over the *rest* of the repo — deployment state, root-level file hygiene,
  CI rigor outside the number pipeline, and the repo's own carried-forward TODOs — turns up, plus
  one idea that uses this Claude Code environment's own scheduling primitives rather than more
  build scripts.

**Headline finding:** the live demo site and the release tag are both frozen at the
**pre-October-redesign** commit. Every module of work described in NOTES.md since 2026-07-05 —
the entire visual-first Modules 1–6 rebuild, teach mode, the gate-sweep heatmap, QR code, fallback
recordings, translation prep — exists only in the repo. `https://dppa-case.web.app`, the URL on
the deck's closing QR code and the tool MISSION.md calls "a demo aid, not a crutch," is running
software from before that redesign started.

---

## Theme A — Deploy and release-tag drift ⭐ act now

**A1. The production site is 3+ weeks and ~18 commits stale.**
`app/deployment.md`'s "Last Deploy" table tops out at `ed21985` (2026-07-05, the pre-redesign
"app quality uplift"). Every commit after that — `9773440` (Modules 1–6 teaching revamp, the deck
+ teach-mode rebuild that *is* the October plan), the entire `2026-07-10` hardening plan (fallback
recordings, real gate sweep, QR code, deck-parity CI), and the `2026-07-17` prose-parity work — has
never been deployed. A visitor scanning the deck's QR code today reaches the old app: no teach-mode
banner, no six-step presenter walkthrough, no gate-sweep heatmap, none of the fixes this repo has
spent two weeks building and CI-proving. This is worse than "app is stale" — it is *the specific
artifact the redesign was built to fix* silently still showing the pre-redesign version.

**A2. The release tag says "oct-workshop" but predates the October workshop content.**
`git tag -l` shows `v1.0-oct-workshop` → commit `5787aad` (2026-07-05) — **17 commits behind
HEAD**, and specifically behind every commit with "teaching revamp," "gate sweep," or
"readiness hardening" in its message. Anyone trusting the tag name (a future session, a
teammate, the presenter re-reading `deployment.md`'s pre-workshop checklist item "Confirm the
green release commit is tagged `v1.0-oct-workshop`") would conclude the October work already
shipped. It didn't. The tag is a false positive dressed as a completed checklist item.

**A3. Root cause is process, not tooling.** `H4` in the human-blocked register already flags
"Firebase deploy credentials" as blocking *CI* deploy, correctly. But **manual** deploy
(`npm run build && npx firebase deploy`, documented and presumably still possible from this
machine) was also simply not re-run after 2026-07-05, and nothing in the repo would have caught
that — there is no check anywhere comparing "latest deployed commit" against "current HEAD." The
deck-parity CI job proves the deck agrees with the engine; nothing proves the *live site* agrees
with either.

**Recommendation:** run the manual deploy now (`cd app && npm run predeploy && npx firebase
deploy --only hosting --project dppa-case`), then move the `v1.0-oct-workshop` tag (or cut
`v1.1-oct-workshop-hardened`) to the deployed commit, and update `deployment.md`'s table. As a
durable fix, add a cheap CI step or a `tools/check_deploy_freshness.py` that fetches
`https://dppa-case.web.app` and compares an embedded build marker (e.g. a `data-build-commit`
attribute already achievable via a Vite `define` of `process.env.GIT_COMMIT` at build time)
against `git rev-parse HEAD` — turning "is the live site current" from a thing someone remembers
to check into a thing that's grep-able. This is a smaller, sharper version of the H4 gap and
doesn't need to wait for CI deploy credentials to be useful today.

---

## Theme B — Root-level file sprawl (repo hygiene, not yet in scope of any prior brainstorm)

The repo root carries **18 loose build/verify scripts** (`apply_corrections.py`,
`apply_deck_corrections.js`, `apply_deck_corrections.py`, `audit_teaching_deck.py`,
`build-deck.js`, `build_2026_from_ref.py`, `build_callouts.py`, `build_canonical_cases.py`,
`build_cfd_slide.py`, `build_oct_teaching_deck.py`, `build_policy_refresh.py`,
`build_teaching_visuals.py`, `build_worksheet_answer_docx.py`, `export-slides.ps1`,
`inspect_pptx.py`, `verify_deck_app_parity.js`, `verify_deck_app_parity.py`,
`verify_deck_numbers.py`) with no directory separating **live/current** (referenced by CI or
NOTES.md as still-run) from **one-off/historical** (executed once during a since-completed
consolidation phase, kept only for reproducibility).

Cross-referencing against NOTES.md, RESOURCES.md, and `.github/workflows/ci.yml`, the split is
roughly:

| Status | Scripts |
|---|---|
| **Live** (CI-run or NOTES-referenced as regenerable) | `audit_teaching_deck.py`, `verify_deck_numbers.py`, `build_oct_teaching_deck.py`, `build_teaching_visuals.py`, `build_cfd_slide.py`, `build_worksheet_answer_docx.py` |
| **One-off / historical** (last touched during a now-closed consolidation phase, June 2026, not mentioned in current NOTES/RESOURCES) | `apply_corrections.py`, `apply_deck_corrections.js/.py`, `build-deck.js`, `build_2026_from_ref.py`, `build_callouts.py`, `build_canonical_cases.py`, `build_policy_refresh.py`, `verify_deck_app_parity.js/.py`, `inspect_pptx.py`, `export-slides.ps1` |

Same pattern in tracked binary artifacts: `dppa-case-study.pptx`, `dppa-factory-presentation.pptx`,
`dppa-web-app-case-study.pptx` (all added `6f17970`, 2026-05-21, never touched since) and
`dppa-2026-factory-energy-proposal.pptx` (added `bc65a0c`, 2026-05-29, never touched since) plus
`ref/DPPA 2025 ref.pptx`. None of these five files is named in MISSION.md or RESOURCES.md as a
current teaching artifact — the canonical decks are `ceba/CEBA DPPA 2026.pptx` and
`ceba/DPPA Presentation Oct 2026 To Teach.pptx`. `current-app-screenshot.png` and
`desktop-current.png` at root read as scratch QA files that outlived their purpose (a prior
session already did one cleanup pass — commit `d24ed9b` "phase-6: remove obsolete root-level
manual-QA screenshots and probe files" — but these two survived it or were added after).

**B1.** Move the one-off scripts and orphaned decks/screenshots into `archive/` (git preserves
history either way; this is a `git mv`, not a delete, so it's reversible and non-destructive).
**B2.** Add a one-line header comment to each remaining root script stating whether it's
CI-invoked, NOTES-regenerable, or archived-do-not-run — cheap insurance against a future session
(including a future instance of me) re-running a stale one-off script against current data and
producing a plausible-looking but wrong deck. **B3.** This is squarely in scope for the
`CLAUDE.md` "Simplicity First" / "No Laziness" standards the user has set globally — a solo user
returning to this repo after a gap (as happened over these four idle days, and will happen again
before October) pays a real "which of these 18 scripts do I actually run" tax every time.

---

## Theme C — CI is rigorous on numbers, silent on everything else

**C1. The visual-regression gate is toothless by design and nobody has closed the loop.**
`ci.yml`'s `e2e:visual` step runs `continue-on-error: true` because no Linux baseline snapshots
are committed (`deployment.md` "Visual baseline bootstrap" section documents the exact
one-time steps and has since 2026-07-05). Every visual regression test currently *cannot fail the
build* — it's decorative. Given the CI budget already spent hardening the number pipeline, this is
the highest-leverage remaining CI gap: bootstrapping the baselines is a documented, ~15-minute,
one-time task (trigger the workflow once with `--update-snapshots`, commit the `-linux.png`
files, delete the `continue-on-error` line) that converts an inert check into a real one.

**C2. Zero accessibility testing despite a live trilingual audience.** Neither the Playwright
suite (`controls.spec.js`, `scenarios.spec.js`, `teach.spec.js`, `tour.spec.js`, `visual.spec.js`)
nor CI runs any accessibility audit (no `axe-core`, no `@axe-core/playwright`, confirmed by
grep — zero hits repo-wide). The audience is explicitly described in the facilitator materials as
Vietnamese/Chinese/English-speaking factory CFOs and lenders viewing a projector in a possibly
low-light room (`deployment.md`'s own pre-workshop checklist calls out "4.5:1 contrast at
1280x720 on a low-brightness projector" as a *manual* check). A 20-minute addition —
`@axe-core/playwright` wired into one existing spec, asserting zero serious/critical violations on
the main app shell and the teach-mode banner — would convert that manual contrast check into an
automated, CI-enforced one and catch anything else (missing labels, focus traps in the tour
overlay) the manual pass might miss.

**C3. No test-coverage measurement.** `vitest` runs 57+ tests green but nothing reports line/branch
coverage (`app/vite.config.js` has no `test.coverage` block; `package.json` has no `coverage`
script). This isn't a correctness bug — the settlement math is clearly well-tested by inspection —
but it means "well-tested" is currently a claim, not a number, and a genuinely untested corner
(e.g. an edge case in `buildWorkshopFmpCurve` or the multi-year crossover logic) could exist
without any signal. Adding `@vitest/coverage-v8` and a `coverage` script is a ~10-minute addition
that turns future "is X actually tested" questions into a report instead of a re-read of the test
file.

---

## Theme D — Debt that keeps getting flagged and keeps not getting fixed

Three separate brainstorms (07-16, 07-17, and now this one) have independently surfaced the same
two items. Re-flagging a fourth time without action is itself a signal worth naming rather than
silently repeating.

**D1. `MISSION.md` still frames the session as July 2026**, four sentences in: "I am preparing to
teach... at the in-person factory workshop in **July 2026**." That workshop already happened (and
per `facilitator/fresh-viewer-kit/README.md`, is the one that "failed... in symbol overload"). The
entire rest of the repo has since pivoted to an October 2026 target. MISSION.md — the file most
likely to be re-read cold by a future session to understand "why am I doing this" — currently
tells that future session the wrong date and implies the workshop hasn't happened yet. Two-line
fix.

**D2. `learning-records/0005` for the teaching-revamp + hardening arc still doesn't exist.**
`learning-records/` stops at `0004-worksheet-answer-docx.md` (2026-06-29); nothing documents the
July symbol-overload failure, its root cause, and the redesign response, despite that arc being
the single largest and most consequential body of work in the repo (the brainstorm →
plan → 6-phase implementation → hardening → prose-parity sequence spans `9773440` through
`bd2632e`, dozens of commits, five plan documents). This is exactly the kind of institutional
memory `learning-records/` exists to prevent from being re-derived from scratch next time
something breaks the same way.

**Recommendation:** do D1 now (trivial); do D2 as the first task of the next working session
(not a fourth brainstorm mention) — the raw material already exists across
`research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md`,
`reports/2026-07-04-modules-teaching-revamp-implementation.md`, and the fresh-viewer-kit README;
it needs synthesis, not new research.

---

## Theme E — Use the agent platform itself, not another script

This repo is worked from inside Claude Code, which has its own scheduling primitives
(`CronCreate`/`/schedule`, `/loop`) already available in this environment. The human-blocked
register (`plans/2026-october-readiness-checklist.md`) is exactly the kind of artifact those
primitives exist for: five dated items (H1 confirm date, needed by 2026-08-15; H2 translator
engagement, 2026-08-25; H3 gate-proxy recalibration, 2026-09-01; H4 Firebase credentials,
2026-09-08; H5 fresh-viewer scheduling, 2026-09-08) that currently rely on a human re-opening the
checklist file and doing date arithmetic against "today."

**E1.** A scheduled weekly (or biweekly) cron job — "read
`plans/2026-october-readiness-checklist.md`'s human-blocked register, compare each `Needed by`
date to today, and message the user if anything is within 7 days or overdue" — replaces "remember
to check the checklist" with an actual notification. Cheap to set up (`/schedule`), and unlike
another Python verifier, it directly targets the *human*-blocked gaps that no CI check can ever
close, which is precisely the category of risk this repo's tooling is otherwise blind to (every
existing gate checks machine-verifiable facts about numbers; nothing watches the calendar). This
is a genuinely different kind of "next level" than anything in the three prior brainstorms, which
all proposed more repo tooling for a problem class (human deadlines) that repo tooling can't solve
but the surrounding agent platform can.

**E2.** Same mechanism, smaller scope: a one-time scheduled reminder for "has the site been
redeployed since the last master commit" (Theme A), until `tools/check_deploy_freshness.py` (A3)
exists to make it self-checking.

---

## Theme F — The scoped-out frontier, still carried (unchanged assessment, listed for completeness)

These were correctly scoped out of the 07-17 plan and are still the right shape; no new evidence
changes their priority, so they're compressed here rather than re-argued:

- **F1 (was C3).** Presenter crib cards generated from the deck's own speaker notes via
  `python-pptx` (extraction logic already exists in `audit_teaching_deck.py`) — a same-source
  artifact that can't drift from the deck by construction.
- **F2 (was C4).** A July-vs-October A/B evidence report (words/symbols/visuals per module,
  both decks) — the audit tooling to produce it already exists; ~1 hour of work, and doubles as
  an Allotrope capability story beyond this one workshop.
- **F3 — new, strategic framing.** Zoom out one level: this repo has quietly built a **reusable
  teaching-case pipeline** (settlement-engine-as-source-of-truth → JSON spine exports → deck
  builder → prose verifier → gate-sweep credibility check → trilingual terminology map), not just
  a one-workshop deck. If Allotrope runs more of these sessions (other DPPA markets, other
  clean-energy financing mechanisms), the marginal cost of the *next* case study is now "swap the
  engine's formulas and the terminology map," not "rebuild the whole pipeline." Worth a short
  note in RESOURCES.md or a new `docs/pipeline-architecture.md` naming this pattern explicitly,
  so it's a decision the next session can consciously build on rather than something only visible
  by reading all six `plans/*.md` files.

---

## Recommended sequence

1. **A1/A2** — redeploy now and fix the release tag; this is the single highest-consequence
   finding (the live demo artifact is stale) and costs one command plus a documentation edit.
2. **D1** — fix MISSION.md's July→October framing (2 minutes, zero risk).
3. **C1** — bootstrap visual-regression baselines; the steps are already fully documented in
   `deployment.md`, just never executed.
4. **B1/B2** — archive the 10 one-off scripts + 5 orphaned decks/screenshots into `archive/`
   (git mv, reversible, immediate clarity gain for the next solo session).
5. **A3** — add the deploy-freshness check so Theme A cannot silently recur.
6. **C2/C3** — add `@axe-core/playwright` to one spec and `@vitest/coverage-v8`; both are small,
   both convert a manual/unknown check into an automated/measured one.
7. **E1/E2** — set up the scheduled human-blocked-register reminder; low effort, closes the one
   risk category (calendar drift) no amount of additional repo tooling can address.
8. **D2** — write `learning-records/0005` synthesizing the July-failure → October-redesign arc.
9. **F1–F3** opportunistically, post-content-freeze, as in prior brainstorms' sequencing.

## Assumptions adopted (unattended run — no questions asked, per brief)

- **Analysis only; no fixes applied**, including the two-minute MISSION.md date fix and the
  one-command redeploy — both are trivial but A1/A2 in particular changes what's live at a public
  URL, which the brief's own workflow rules (and standing practice in this repo, per
  `activeContext.md`) treat as an action to surface, not silently take.
- **The one-off vs. live split in Theme B** is inferred from cross-referencing `NOTES.md`,
  `RESOURCES.md`, and `.github/workflows/ci.yml` against each script's last-touched commit and
  message — a lower-confidence classification than the number-pipeline work's exact-figure greps.
  Treat the table as a starting point for a human confirm-before-archive pass, not a final verdict
  (per this repo's own `git mv`-not-`rm` convention for exactly this reason).
- **The deploy/tag drift finding (Theme A)** is inferred from `deployment.md`'s own "Last Deploy"
  table plus `git tag`/`git rev-list` — I did not attempt to fetch or diff the live site itself
  (no network browsing tool used this pass), so "the live site is stale" is a strong inference from
  the documented deploy history, not a direct observation of the served bundle. Worth a `curl`/
  browser confirmation before the redeploy, in case an out-of-band deploy happened that
  `deployment.md` simply wasn't updated to reflect.
- **E1/E2 (scheduling) is a novel category for this repo** — no prior brainstorm proposed using
  the agent platform's own cron/loop primitives rather than repo-local tooling. Flagged as a
  genuine new idea rather than a refinement of existing scope, per the brief's ask for what would
  take the project "to the next level," not only what completes the current plan.
