# Archive

Everything in this directory is **retired**: it is not run by CI, not invoked by any command in
`app/package.json` or `.github/workflows/*.yml`, and not named as a current artifact in `NOTES.md`
or `RESOURCES.md`. It is kept here (via `git mv`, never deleted) for history and reproducibility —
several files document, or were used to produce, artifacts that are still committed elsewhere in
the repo.

**Do not run anything in this directory against current data.** Some of these scripts hard-code
numbers that were correct when they were retired and are wrong now (see the `build_callouts.py`
warning below). If you need similar functionality today, use the live equivalent listed in the
table below, or treat a script here as a reference for logic, not as something to re-execute.

The live/one-off classification below was produced by cross-referencing `NOTES.md`, `RESOURCES.md`,
and `.github/workflows/ci.yml` against each file's git history and content — see
`research/2026-07-21-deploy-drift-and-repo-hygiene-brainstorm.md` (Theme B) and
`research/2026-07-25-guardrail-integrity-and-audience-localization-brainstorm.md` (Theme D) for the
original analysis. Treat this as a confirmed classification, not a guess: every file's live status
was checked (see PHASE-02 of `plans/2026-07-25-guardrail-integrity-and-localization-plan.md`).

## Scripts (moved from the repo root, original path was the bare filename)

| File | What it did | Live equivalent, if any |
|---|---|---|
| `apply_corrections.py` | One-off deck text corrections during the June 2026 consolidation. | `build_oct_teaching_deck.py` builds the current deck from source data; no correction-patching step is needed against it. |
| `apply_deck_corrections.js` | JS sibling of the above, same June 2026 phase. | Same as above. |
| `apply_deck_corrections.py` | Python sibling of the above. | Same as above. |
| `build-deck.js` | Original Node/`pptxgenjs`-based deck builder, superseded by the Python pipeline. Its dependency (`pptxgenjs`) is why a root `node_modules/` and `package.json` exist. | `build_oct_teaching_deck.py` (`python-pptx`-based). |
| `build_2026_from_ref.py` | Built the 2026 deck from `DPPA 2025 ref.pptx` (see below). References `ref/DPPA 2025 ref.pptx` internally (`ROOT / "ref" / "DPPA 2025 ref.pptx"`); that path no longer exists — the reference deck now lives flat at `archive/DPPA 2025 ref.pptx`, not `archive/ref/DPPA 2025 ref.pptx`. Do not "fix" this path and re-run it; it is retired. | `build_oct_teaching_deck.py`. |
| `build_callouts.py` | Built financing-summary callout slides. **Still hard-codes the retired figure `"0 of 56"` at 48pt bold red (lines 9, 156, 166)** — the real, current figure is `5 of 56` (`assets/teaching/gate-sweep.json`'s `passCount`). Running this script today would render a wrong number onto a slide. This is exactly why `tools/check_retired_figures.py` now also scans root/`tools`/`app/scripts` generator files, not just prose. | `build_oct_teaching_deck.py` + `build_teaching_visuals.py`, both of which read `PASS_COUNT` from the generated `gate-sweep.json`. |
| `build_canonical_cases.py` | Built the three canonical-case slides during the June 2026 consolidation. | Superseded by the Modules 1-6 teaching deck and `lessons/0007`-`0009`. |
| `build_policy_refresh.py` | One-off policy-slide text refresh. | N/A — folded into the current deck's source text. |
| `verify_deck_app_parity.js` / `.py` | Pre-dated the current `verify_deck_numbers.py` + `deck-parity` CI job. | `verify_deck_numbers.py`, run in CI's `deck-parity` job. |
| `inspect_pptx.py` | Ad hoc slide-shape inspection helper. | `audit_teaching_deck.py` covers structural/word-budget auditing of the live deck. |
| `export-slides.ps1` | PowerPoint-COM-based slide-to-image export; `build_policy_refresh.py`'s own comment records this was "blocked on this machine." | N/A. |

## Non-script artifacts

| File | Why it's here |
|---|---|
| `dppa-case-study.pptx` | Added 2026-05-21, never referenced again; not named in `MISSION.md` or `RESOURCES.md` as a current teaching artifact. |
| `dppa-factory-presentation.pptx` | Same — output of `factory-presentation-instructions.md` (below). |
| `dppa-web-app-case-study.pptx` | Same — the 14-slide reference deck `factory-presentation-instructions.md` was built from. |
| `dppa-2026-factory-energy-proposal.pptx` | Added 2026-05-29, never referenced again. |
| `DPPA 2025 ref.pptx` | Originally at `ref/DPPA 2025 ref.pptx`; the reference deck `build_2026_from_ref.py` (also archived) was built from. The now-empty `ref/` directory was removed (git does not track empty directories). |
| `current-app-screenshot.png`, `desktop-current.png` | Manual QA screenshots from 2026-07-11; a prior cleanup pass (commit `d24ed9b`, "phase-6: remove obsolete root-level manual-QA screenshots and probe files") removed similar files but these were added after or survived it. |
| `factory-presentation-instructions.md` | Build brief for the three `.pptx` files above; not referenced by any other current document. Archived alongside the artifacts it describes so it doesn't dangle at the repo root pointing at files that no longer exist there. |

## The six scripts that are NOT here (still live at the repo root)

`audit_teaching_deck.py`, `verify_deck_numbers.py`, `build_oct_teaching_deck.py`,
`build_teaching_visuals.py`, `build_cfd_slide.py`, `build_worksheet_answer_docx.py` — each carries
a `# LIVE:` header comment stating what runs it and how to regenerate its output. See `NOTES.md`'s
"Repo layout" note for the current regeneration order.

## Open question for a human (not resolved by this archival pass)

The animated CfD charts in `assets/` are committed as **both** `.gif` and `.mp4` per scenario per
language (e.g. `assets/cfd-s1-vi.gif` and `assets/cfd-s1-vi.mp4`), roughly 10 MB of duplication.
NOTES.md records that the MP4s exist because Google Slides needs video, but whether the `.gif`
copies are still consumed by anything was not fully determined during this pass. They have **not**
been moved or deleted here — that decision is left to a human. If you determine they are unused,
`git mv` them into `archive/` (or remove them) in their own commit, separate from this one.
