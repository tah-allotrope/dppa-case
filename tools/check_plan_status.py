"""
check_plan_status.py
=====================

Guard (PHASE-04 of plans/2026-08-22-delivery-stall-recovery-plan.md): fails if a
plan in plans/ carries a `status` starting with "complete" while it still has
unticked `- [ ]` tasks AND no file in reports/ mentions the plan's filename.

Why: this repository has an extraordinary apparatus for making claims about
*numbers* falsifiable (spine exports, prose-figure verification, retired-figures
denylist). It has none for claims about *work* -- a plan's `status` field is
free text that nothing checks against its own task list. A 2026-07-31 bulk
correction marked nine plans "complete -- presumed fully implemented (NOT
individually verified)"; sampling one of them
(plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md) against current
code found 4 of 4 sampled tasks not actually done, with 80 of 80 tasks unticked
and no reports/ artifact. This guard makes that class of drift visible on every
run instead of requiring a manual audit to notice it.

A ticked task list with no report is fine (small plans sometimes skip a
separate report). An unticked task list with a matching report is fine (the
report is presumably where completion was recorded, and ticking every box in
the plan itself is not always the last thing anyone did). The failure mode this
targets is specifically: nothing anywhere records that the work happened, yet
the status field asserts it did.

Run:  python tools/check_plan_status.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_plan_status.py)
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PLANS_DIR = REPO_ROOT / "plans"
DEFAULT_REPORTS_DIR = REPO_ROOT / "reports"

STATUS_RE = re.compile(r'^status:\s*"?([^"\n]*)"?\s*$', re.MULTILINE)
UNTICKED_TASK_RE = re.compile(r"^\s*-\s\[ \]", re.MULTILINE)
SUCCESSOR_RE = re.compile(r"plans/[\w\-.]+?\.md")

def extract_status(text: str) -> str | None:
    """Return the YAML frontmatter `status` value, or None if absent."""
    match = STATUS_RE.search(text)
    return match.group(1).strip() if match else None


def count_unticked_tasks(text: str) -> int:
    """Count `- [ ]` task lines (any leading indentation)."""
    return len(UNTICKED_TASK_RE.findall(text))


def plan_referenced_in_reports(plan_filename: str, reports_dir: Path) -> bool:
    """Return True if any file under reports_dir mentions plan_filename.

    Deliberately a filename substring match, not a claim that the mentioning
    report is *about* completing this plan -- a report for a different plan can
    cite this one in passing (e.g. "carried forward from ..."). That is a known
    false-negative risk: plans/2026-07-16-gate-credibility-pipeline-hardening-plan.md
    is cited this way by two 2026-07-17 reports despite having 80/80 tasks
    unticked and none of its own work done, which is why that plan's status
    field was corrected by hand (see corrections-log.md) rather than relying on
    this function to catch it. This guard is a floor, not a substitute for
    reading the plan.
    """
    if not reports_dir.exists():
        return False
    for report_path in reports_dir.iterdir():
        if not report_path.is_file():
            continue
        try:
            text = report_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if plan_filename in text:
            return True
    return False


def find_violations(plans_dir: Path, reports_dir: Path) -> list[tuple[str, int]]:
    """Return (plan filename, unticked task count) for every plan marked complete
    with unticked tasks and no reports/ artifact referencing it."""
    violations = []
    if not plans_dir.exists():
        return violations
    for plan_path in sorted(plans_dir.glob("*.md")):
        text = plan_path.read_text(encoding="utf-8")
        status = extract_status(text)
        if status is None or not status.startswith("complete"):
            continue
        unticked = count_unticked_tasks(text)
        if unticked == 0:
            continue
        if plan_referenced_in_reports(plan_path.name, reports_dir):
            continue
        violations.append((plan_path.name, unticked))
    return violations


def find_successor_violations(plans_dir: Path) -> list[str]:
    """Return plan filenames closed as superseded/abandoned that name no
    successor plan file existing in plans_dir."""
    violations = []
    if not plans_dir.exists():
        return violations
    for plan_path in sorted(plans_dir.glob("*.md")):
        text = plan_path.read_text(encoding="utf-8")
        status = extract_status(text)
        if status is None:
            continue
        lowered = status.lower()
        if not (lowered.startswith("superseded") or lowered.startswith("abandoned")):
            continue
        if any((plans_dir / Path(match).name).exists() for match in SUCCESSOR_RE.findall(text)):
            continue
        violations.append(plan_path.name)
    return violations


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    argv = argv or []
    plans_dir = Path(argv[0]) if len(argv) > 0 else DEFAULT_PLANS_DIR
    reports_dir = Path(argv[1]) if len(argv) > 1 else DEFAULT_REPORTS_DIR

    violations = find_violations(plans_dir, reports_dir)
    successor_violations = find_successor_violations(plans_dir)

    if violations:
        print(f"PLAN-STATUS FAIL: {len(violations)} plan(s) marked complete with no evidence of completion")
        for filename, unticked in violations:
            print(f"  {filename}: {unticked} unticked task(s), no reports/ file mentions it")
        print(
            "  Fix: either the plan is genuinely done (tick the tasks and/or add a reports/ "
            "artifact), or it isn't (correct the status field to \"open\" or \"superseded\")."
        )
    if successor_violations:
        print(
            f"PLAN-STATUS FAIL: {len(successor_violations)} plan(s) closed as superseded/abandoned "
            "without naming an existing successor plan in plans/"
        )
        for filename in successor_violations:
            print(f"  {filename}: names no successor plan file that exists in plans/")
        print("  Fix: name the successor plan (e.g. plans/2026-09-05-....md) in the status field.")
    if violations or successor_violations:
        return 1

    scanned = len(list(plans_dir.glob("*.md"))) if plans_dir.exists() else 0
    print(f"PLAN-STATUS PASS ({scanned} plan(s) scanned)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
