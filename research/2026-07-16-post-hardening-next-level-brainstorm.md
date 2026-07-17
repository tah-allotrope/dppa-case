---
title: "DPPA-Case: Next-Level Brainstorm (Post-Hardening)"
date: "2026-07-16"
type: "brainstorm"
depth: "deep"
source_request: "Thoroughly analyze the project's current state, codebase, documentation and architecture; brainstorm improvements, features, refactors, architectural changes or optimizations that would take it to the next level"
slug: "post-hardening-next-level"
supersedes_context: "research/2026-07-10-next-level-improvements-brainstorm.md (Themes A–C now implemented)"
---

# Brainstorm: DPPA-Case — What's Next After the October Hardening Sprint

## 0. Read this first: what changed since the last brainstorm

The 2026-07-10 brainstorm's entire critical path has been **executed** (commits `0e8350f`→`d24ed9b`,
plans `2026-07-10-october-readiness-hardening-plan.md`, checklist `plans/2026-october-readiness-checklist.md`):

| Prior idea | Status |
| --- | --- |
| A1 automated teach fallbacks | Done — `npm run record:demos`, 6 MP4 + posters embedded |
| A2 real gate sweep | Done — `export-sweep.mjs` → `gate-sweep.json`, **5 of 56** |
| A3 terminology map | Done — `terminology-map.json` + build refuses `UNTRANSLATED` |
| A4 QR + B4 parity gate | Done — `verify_deck_numbers.py` runs as CI job `deck-parity` |
| B1/B2 repo integrity | Done — template + July deck tracked, firebase cache untracked |
| B3 root cleanup | **Partial** — screenshots purged; 17 root scripts still un-homed |
| C1 fresh-viewer kit, C4 checklist | Done |
| D1–D4 (i18n, FMP, sensitivity, URL state), C3 PWA | Untouched — still the open frontier |

So this brainstorm deliberately does **not** re-litigate A–C. It reports what I found by reading the
code that sprint produced, and where the *next* order of risk and value actually sits.

**Headline:** the number pipeline is genuinely excellent — `build_oct_teaching_deck.py:23-27` and
`build_teaching_visuals.py:123-130` both load `spine-s1.json`/`gate-sweep.json`; I grepped for
hand-typed VND constants in both and found **none**. The engine really is the single source of truth
for figures. The remaining risks are of three different kinds: **(1) the numbers are traceable but the
assumptions under them are invented; (2) the pipeline is reproducible only on one laptop; (3) the
verifiers that guard it are weaker than their docstrings claim.**

---

## Theme A — The credibility layer: "5 of 56" is computed from constants we made up ⭐ highest stakes

This is the most important finding, and it's a *content* risk, not a code bug.

`app/scripts/export-sweep.mjs:36-40` defines the lender and investor gates as:

```js
const LENDER_DEBT_SERVICE_VND_PER_KWH = 1150 * 1.2 // 1,380
const INVESTOR_LCOE_VND_PER_KWH = 1450
const ESCALATION = 0.04 // retail + strike
```

Every one of those is an illustrative placeholder (honestly labelled ASM-003/ASM-005 in the file, and
the readiness checklist flags recalibration). But the deck now says, in `m5_body`, "**5 of 56**
combinations clear all three doors at once" — as a computed fact, on a slide, to a room of CFOs and
lenders. A2 upgraded the number from *asserted* to *derived*, which is real progress; it did not make
it *true*. It made the wrongness harder to see. The old "illustrative" label was at least honest;
"computed from the engine" now reads as authority the inputs don't support. The first sharp lender in
the room asks "where does 1,450 come from?" and the honest answer collapses the module's punchline.

Three complementary moves, in order of value:

### A1. Publish the sweep as a **band, not a point**
Re-run the sweep across a plausible range of lender/investor thresholds (e.g. LCOE 1,300–1,600,
DSCR 1.2–1.45) and report "**2–11 of 56 depending on developer economics; 5 at our central case**."
That is a *stronger* teaching point than a fake-precise 5: it shows the pass window is narrow and
*whose assumptions move it*. Mechanically small — wrap the existing sweep loop in an outer loop over
thresholds and emit `sensitivity` into `gate-sweep.json`; the heatmap renderer already reads that file.

### A2. Add a visible **assumptions provenance** line to the M5 slide and heatmap
The heatmap should carry its own footnote: strike grid, ratio grid, escalation, and the two proxy
thresholds with "illustrative — not a lender quote." This costs one text run and buys the presenter
the ability to answer the challenge *before* it's asked. Right now the assumptions live only in a code
comment no one in the room can see.

### A3. Fix the internal inconsistency the comment admits
The buyer gate escalates strike and retail (`priceFactor`), but the lender/investor gates compare the
**nominal, un-escalated** strike against a fixed threshold (`export-sweep.mjs:36-40` + `yearBill`).
A strike that escalates 4%/yr for 20 years is compared against a flat debt-service number — the gates
are measured in different units of time. Either escalate the thresholds too, or compare on a levelised
basis, or state explicitly that the developer gates are Year-1 tests. As written, the pass count is
partly an artifact of that mismatch, which makes A1's band the honest presentation either way.

### A4. Close the FMP gap (carried from D2, now more urgent)
`RESOURCES.md` still flags FMP ~1,427 as illustrative with "primary FMP data not publicly published."
The whole deck rests on FMP. Two tracks: **research** (hunt a public CGM/SMP proxy series, and while
you're there get the official Decree 57 / Circular 16 URLs — both are still cited second-hand, a real
exposure for a regulatory teaching session), and **product** (a CSV/paste-JSON import door in the app,
so the day Allotrope gets a client settlement statement, the same demo runs on real market shape).

---

## Theme B — Reproducibility: the build story is true on exactly one machine ⚠️ verified

`NOTES.md` promises "regenerate with `PYTHONPATH= py build_teaching_visuals.py --lang en`". I tested
the toolchain from a clean interpreter:

```
MISS pptx   MISS matplotlib   MISS numpy   MISS docx   MISS qrcode   OK PIL
```

There is **no `requirements.txt`, no `pyproject.toml`, no root README**. The Python side has ~4,600
lines across 17 root scripts depending on python-pptx, matplotlib, numpy, Pillow, python-docx and
qrcode — and that dependency set exists nowhere but in the user's shell history. CI installs exactly
one package (`pip install python-pptx`, `ci.yml:59`), which is enough for the two verifiers and
nothing else.

Consequences, in ascending severity:

### B1. **No generator runs in CI, so generator↔artifact drift is invisible**
The `deck-parity` job is smart in exactly one place: it regenerates `spine-s1.json`/`gate-sweep.json`
and does `git diff --exit-code` (`ci.yml:49-55`). That pattern — *re-derive and diff* — is the right
one, and it's applied to 2 of the ~65 generated artifacts in the repo. The 27-slide pptx and ~60
teaching PNGs are committed binaries whose generators are **never executed** by CI. Edit
`build_oct_teaching_deck.py`'s `TEXT["en"]` and the checked-in deck silently no longer matches its
source; `verify_deck_numbers.py` won't notice, because it audits the *committed* pptx, not a rebuild.
The declared content-freeze gate depends on the deck actually being the output of its script.
**Fix:** `requirements.txt` (pinned) + a `deck-build` CI job that rebuilds the deck and PNGs and
diffs. Note pptx/PNG bytes aren't deterministic byte-for-byte, so diff on **extracted text + slide
count + image dimensions**, not raw bytes — i.e. reuse `audit_teaching_deck.py`'s extractor against a
freshly built deck rather than the committed one.

### B2. The `PYTHONPATH= py` incantation is a smell worth 20 minutes
Every docstring carries it. It means the default interpreter is broken/shadowed on this machine and
the workaround got canonised into documentation. A `requirements.txt` + a one-line
`tools/README.md` ("`py -m pip install -r requirements.txt`") retires the folklore and makes a
collaborator — or the fresh-viewer volunteer, or Allotrope's next hire — able to rebuild anything.

### B3. Homeless scripts: finish B3 from last time
Root still holds 17 scripts including **duplicate pairs** (`apply_deck_corrections.py` *and* `.js`;
`verify_deck_app_parity.py` *and* `.js` — same job, two languages, unclear which is authoritative),
one-offs long since consumed (`apply_corrections.py`, `build_policy_refresh.py`,
`build_callouts.py`, `build_2026_from_ref.py`, `inspect_pptx.py`), and a legacy `build-deck.js` with a
root `node_modules/` that exists solely for it. Proposal: `tools/` for the **five living generators**
(`build_oct_teaching_deck`, `build_teaching_visuals`, `build_cfd_slide`, `build_worksheet_answer_docx`,
plus the two verifiers), `tools/archive/` or deletion for the rest, and a root README table mapping
**generator → artifact → when to re-run**. That table is the missing map of this repo: today the
knowledge of which script owns which of 65 artifacts lives only in NOTES.md prose and the user's head.

---

## Theme C — The verifiers are weaker than their docstrings claim

The parity gate is the repo's crown jewel; it should be held to its own standard.

### C1. `verify_deck_numbers.py` is a set-membership check, not a parity check
It collects every comma-grouped number on every slide and asserts each is **somewhere** in the spine
(`verify_deck_numbers.py:86`). It cannot detect a figure on the **wrong slide**, a line item swapped
with another (5,947 where 1,800 belongs — both are "allowed"), or any number that doesn't match
`\d{1,3}(?:,\d{3})+` (so "5 of 56", loss factors like 1.0342, and the fee 163.3 are all unchecked).
The failure mode it's designed to stop — a stale figure after an engine change — is precisely the case
where the stale value is *still a valid spine number from the old export*. Stronger design: assert
**per-slide expected figures** by having `build_oct_teaching_deck.py` emit a
`deck-figures.json` manifest (slide index → figures it placed, from the spine), then verify the pptx
against that manifest. The builder already knows the answer; it just throws it away.

### C2. `EXTRA_ALLOWED` is the escape hatch its comment warns about
It has one member (`2,617`, a legitimate sum of two spine lines) and a stern comment saying it mustn't
grow. It will grow — every derived figure on a slide needs an entry. Better: let the builder compute
and register derived figures into the manifest from C1, so sums are *derived*, not *allowlisted*.

### C3. `audit_teaching_deck.py` has dead code and a docstring that overstates it
Lines 72–76 loop over every number and execute `pass` with a comment saying "informational only" —
it does nothing, prints nothing. The module docstring says it "reconcile[s] every numeric string
against `spine-s1.json`" (line 2-3); it does not. That job moved to `verify_deck_numbers.py`. Delete
the loop, fix the docstring. Small, but this is the file CI trusts.

### C4. The verifiers have no tests
`settlement.js` has 350 lines of vitest; the Python guards that protect the deck have zero. A tiny
`tools/tests/` with a synthetic 2-slide pptx proving `verify_deck_numbers.py` **fails** on a planted
stale figure would be the cheapest possible proof the gate works. Right now we know it passes; we've
never seen it catch anything.

### C5. `e2e:visual` is `continue-on-error: true` — a permanently green non-test
`ci.yml:27-30` disables the visual suite pending Linux baselines. That comment has survived several
sprints. Either generate and commit the CI baselines (one workflow run with `--update-snapshots`) or
drop the job; a check that can't fail teaches the team to ignore checks.

---

## Theme D — Product moves for the actual audience (post-freeze)

### D1. App i18n — now genuinely unblocked ⭐ biggest audience mismatch
Lessons, worksheets, decks, visuals and even the QR codes are trilingual. The app that Vietnamese and
Chinese factory CFOs will hold in their hands is **English-only**. The terminology map (66
`UNTRANSLATED` markers across ~44 entries) was built for the deck but is exactly the vocabulary
carrier the app needs — `?lang=vi|zh` + a strings module reading the same JSON means the translation
budget is paid **once** for deck and app together. Do this in the same pass as the late-September
translation task, not after it; splitting them doubles the translator's work and guarantees the deck
and the app use different words for "strike price" in front of the room.
*Scope check:* strings are concentrated in `ui.js` (552 ln) and `default-scenarios.js` labels — a few
dozen strings plus chart legends. Tractable.

### D2. URL-encoded state + per-module deep-link QRs (carried D4, now higher value)
The close slide has one QR to the app root. If state lived in the query string
(`?s=workshop2&strike=1500`), each module's slide could carry a QR that lands a participant on
*exactly the app state the presenter is describing* — the single highest-leverage use of the QR work
already done. Secondary win: `teach-steps.js` could be defined **as** URLs, collapsing `teach.js`'s
imperative `setControlValue`/`dispatchEvent` DOM-poking (`teach.js:6-15`) into declarative navigation.
That's a real refactor payoff, not just a feature.

### D3. M6's missing app moment: the five-levers sensitivity view
M6 teaches five negotiation levers; the app proves M2–M5. A tornado panel (bill delta per lever:
strike ±50, FMP ±100, k/K_pp, fees, contract quantity) computed straight from `settlement.js` gives M6
its own demo and doubles as a real Allotrope advisory tool. It also feeds Theme A: the same machinery
produces the sensitivity band for the sweep.

### D4. PWA/offline for participants' phones (carried C3)
Still valid, still ~a day. CON-003 protects the presenter's laptop; participants on venue wifi are
unprotected. Lower priority than D1/D2 unless the venue is known-bad.

---

## Theme E — Knowledge base & process

- **E1. Learning record 0005 is missing.** Records stop at `0004-worksheet-answer-docx.md`; the two
  largest efforts in the repo (the teaching revamp, the hardening sprint) have implementation reports
  but no learning record. The distinction matters — reports say what was built, records say what was
  learned. The July symbol-overload failure that motivated everything deserves one.
- **E2. `NOTES.md`/`RESOURCES.md` are accreting, not being edited.** NOTES leads with an October
  hardening section, then describes "Workshop 1/2 presets" as current (pre-dates workshop3 and teach
  mode) and a July framing MISSION.md now contradicts (`MISSION.md:5-7` still says the session is
  July 2026 — it's October). A doc that says two things says nothing. One editing pass.
- **E3. `activeContext.md` is 45,000 bytes.** Per the global convention it's the working plan file; at
  this size it's an append-only log no one re-reads. Archive the completed phases into `reports/`
  (where their reports already live) and keep it a live checklist.
- **E4. July-vs-October A/B artifact** (carried E3 from last time): run `audit_teaching_deck.py` over
  both decks and publish word/symbol/visual counts per module. Cheap, and it's the evidence for the
  redesign method — useful to CEBA, and to Allotrope as a capability story.

---

## Recommended sequence

1. **A2 + A3** — put the sweep's assumptions on the slide and fix the escalation mismatch. *Before
   content freeze*, because both change slide text. (Days, not weeks.)
2. **B1 + B2** — `requirements.txt` + `deck-build` CI job (text-level diff, not bytes). This is what
   makes the freeze gate mean something.
3. **A1** — sweep as a band; strongest teaching upgrade available.
4. **C1 + C2 + C3** — builder-emitted figure manifest, retire `EXTRA_ALLOWED`, kill the dead audit
   loop. C4 (a test that proves the gate catches a planted error) alongside.
5. **B3** — `tools/` + the generator→artifact README table.
6. **Post-freeze:** D1 (i18n, *bundled with the translation task*), then D2, D3.
7. **Opportunistic:** A4 (FMP proxy + official decree URLs), C5, E1–E4.
8. **Deferred:** D4 (PWA).

## Assumptions adopted (unattended run — no questions asked, per brief)

- **No implementation performed**; analysis only, per the orchestrator's brief.
- **Session date still unconfirmed** (Q-001 open since 2026-07-04). Sequencing assumes the checklist's
  backward plan from ~October 1 and therefore treats "before content freeze" as the binding deadline
  for anything touching slide text — which is why Theme A ranks above Theme D.
- **I judged Theme A above Theme B** despite B being more code-shaped, because a wrong number
  delivered confidently to lenders costs more than a build that only runs on one laptop. If the user
  disagrees, B1/B2 are the cheaper first move and unblock A anyway.
- **"5 of 56" is treated as not-yet-defensible rather than wrong** — I did not attempt to source real
  Vietnamese developer LCOE/DSCR figures; that needs Allotrope's own deal data, which is a human input.
- **The duplicate `.py`/`.js` script pairs are assumed superseded** (the Python side is the one CI and
  NOTES reference), but I did not delete or verify each one's last real use; B3 should confirm before
  archiving.
- I did **not** open the .pptx files themselves (no python-pptx locally); deck claims here are grounded
  in the generators, the audit/verify scripts, and the committed JSON exports.
