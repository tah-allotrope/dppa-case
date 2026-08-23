"""
pipeline.py
============

Runs the documented regeneration order (CLAUDE.md §5) as one command, so
"skipping a step produces a deck whose figures disagree with its own charts"
becomes a testable property instead of a warning a human has to remember to
heed.

Order (PHASE-05 of plans/2026-08-22-delivery-stall-recovery-plan.md):
  1. node scripts/export-spine.mjs && node scripts/export-sweep.mjs   (from app/)
     -- writes assets/teaching/spine-*.json, gate-sweep.json
  2. build_teaching_visuals.py --lang L
     -- renders the PNG/GIF figures from that JSON
  3. build_oct_teaching_deck.py --lang L
     -- assembles the .pptx
  4. audit_teaching_deck.py  and  verify_deck_numbers.py --lang L
     -- parity checks; both must pass

Fails loudly and immediately on the first missing dependency or non-zero
exit, naming the failed step and the exact command to re-run it by hand.

Run:  python tools/pipeline.py --lang en
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/pipeline.py --lang en)
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = REPO_ROOT / "app"


def run_step(name: str, command: list[str], cwd: str | None = None) -> None:
    """Run one pipeline step, streaming its output. Raises SystemExit(1) naming
    the step and the exact command to re-run it, on any non-zero exit or if the
    command/interpreter cannot be found at all."""
    print(f"\n=== pipeline: {name} ===")
    print(f"$ {' '.join(command)}" + (f"  (in {cwd})" if cwd else ""))
    try:
        result = subprocess.run(command, cwd=cwd)
    except FileNotFoundError as exc:
        rerun = " ".join(command)
        raise SystemExit(
            f"pipeline: step {name!r} failed -- could not run {command[0]!r} ({exc}). "
            f"Re-run by hand: {rerun}" + (f" (from {cwd})" if cwd else "")
        )
    if result.returncode != 0:
        rerun = " ".join(command)
        raise SystemExit(
            f"pipeline: step {name!r} failed (exit {result.returncode}). "
            f"Re-run by hand: {rerun}" + (f" (from {cwd})" if cwd else "")
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--lang", default="en", choices=["en", "vi", "zh"])
    parser.add_argument(
        "--python",
        default=sys.executable,
        help="Python interpreter to use for the build/audit steps (default: the interpreter running this script)",
    )
    args = parser.parse_args(argv)

    run_step(
        "export-spine",
        ["node", "scripts/export-spine.mjs"],
        cwd=str(APP_DIR),
    )
    run_step(
        "export-sweep",
        ["node", "scripts/export-sweep.mjs"],
        cwd=str(APP_DIR),
    )
    run_step(
        "build_teaching_visuals",
        [args.python, "build_teaching_visuals.py", "--lang", args.lang],
        cwd=str(REPO_ROOT),
    )
    run_step(
        "build_oct_teaching_deck",
        [args.python, "build_oct_teaching_deck.py", "--lang", args.lang],
        cwd=str(REPO_ROOT),
    )
    suffix = "" if args.lang == "en" else f" {args.lang}"
    deck_path = str(REPO_ROOT / "ceba" / f"DPPA Presentation Oct 2026 To Teach{suffix}.pptx")
    run_step(
        "audit_teaching_deck",
        [args.python, "audit_teaching_deck.py", deck_path],
        cwd=str(REPO_ROOT),
    )
    run_step(
        "verify_deck_numbers",
        [args.python, "verify_deck_numbers.py", "--lang", args.lang, "--deck", deck_path],
        cwd=str(REPO_ROOT),
    )

    print(f"\npipeline: all steps passed for --lang {args.lang}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
