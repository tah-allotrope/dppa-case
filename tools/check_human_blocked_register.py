"""
check_human_blocked_register.py
================================

Freshness guard (PHASE-02 of plans/2026-07-21-deploy-drift-repo-hygiene-plan.md):
parses the "## Human-blocked register" table in
plans/2026-october-readiness-checklist.md and classifies each row's
"Needed by" date against today, so a deadline that has arrived or is
about to doesn't depend on someone remembering to re-open the
checklist.

Exits 1 (failing a scheduled CI run, which triggers GitHub's default
notification) if any row is OVERDUE or DUE-SOON (due within 7 days
inclusive); exits 0 otherwise.

Run:  python tools/check_human_blocked_register.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_human_blocked_register.py)
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CHECKLIST = REPO_ROOT / "plans" / "2026-october-readiness-checklist.md"
HEADING = "## Human-blocked register"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

DUE_SOON_WINDOW_DAYS = 7


def parse_register_table(markdown: str) -> list[dict]:
    """Parse the register table's data rows into dicts with a parsed `needed_by` date.

    Raises ValueError (naming the row's id) if a "Needed by" cell isn't YYYY-MM-DD.
    """
    lines = markdown.splitlines()
    try:
        heading_idx = next(i for i, line in enumerate(lines) if line.strip() == HEADING)
    except StopIteration:
        raise ValueError(f'heading "{HEADING}" not found')

    rows: list[dict] = []
    in_table = False
    for line in lines[heading_idx + 1 :]:
        stripped = line.strip()
        if not stripped.startswith("|"):
            if in_table:
                break
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if not cells or cells[0] in ("#", ""):
            # header row or separator row (e.g. "---")
            if cells and cells[0] == "#":
                in_table = True
            continue
        if set(cells[0]) <= {"-"}:
            continue
        in_table = True
        if len(cells) < 4:
            continue
        row_id, item, owner, needed_by_raw = cells[0], cells[1], cells[2], cells[3]
        blocks = cells[4] if len(cells) > 4 else ""
        if not DATE_RE.match(needed_by_raw):
            raise ValueError(f'row "{row_id}": unparseable "Needed by" date: "{needed_by_raw}"')
        needed_by = datetime.strptime(needed_by_raw, "%Y-%m-%d").date()
        rows.append(
            {"id": row_id, "item": item, "owner": owner, "needed_by": needed_by, "blocks": blocks}
        )
    return rows


def classify(needed_by: date, today: date, acknowledged_through: date | None = None) -> str:
    """Return "ACKNOWLEDGED", "OVERDUE", "DUE-SOON" (<=7 days out inclusive), or "OK".

    A row whose needed_by is on or before acknowledged_through is a known, accepted
    slip -- reported so it stays visible, but does not raise the failure flag. This
    exists so the weekly notification still carries a signal once every H-item has
    been triaged once: a *known* slip prints ACKNOWLEDGED; a *new* one still prints
    OVERDUE or DUE-SOON and fails the job.
    """
    if acknowledged_through is not None and needed_by <= acknowledged_through:
        return "ACKNOWLEDGED"
    days_remaining = (needed_by - today).days
    if days_remaining < 0:
        return "OVERDUE"
    if days_remaining <= DUE_SOON_WINDOW_DAYS:
        return "DUE-SOON"
    return "OK"


def main(argv: list[str] | None = None) -> int:
    # PHASE-02 (2026-08-23): stdout is reconfigured to UTF-8 because this file's
    # register rows contain "->" as a literal arrow (U+2192) and other non-ASCII
    # punctuation; a Windows cp1252 console otherwise raises UnicodeEncodeError
    # mid-table instead of printing the register. CI's runners are UTF-8 already,
    # so this is a no-op there.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checklist", default=str(DEFAULT_CHECKLIST), help="Path to the readiness checklist markdown file")
    parser.add_argument("--today", default=None, help="Override today's date (YYYY-MM-DD) for deterministic testing")
    parser.add_argument(
        "--acknowledged-through",
        default=None,
        help=(
            "YYYY-MM-DD. Rows whose needed_by is on or before this date print "
            "ACKNOWLEDGED and do not fail the job -- a known, accepted slip. Rows "
            "after this date classify and gate exactly as they do without the flag."
        ),
    )
    args = parser.parse_args(argv)

    checklist_path = Path(args.checklist)
    if not checklist_path.exists():
        print(f"HUMAN-BLOCKED-REGISTER: checklist not found at {checklist_path}")
        return 1

    today = datetime.strptime(args.today, "%Y-%m-%d").date() if args.today else date.today()
    acknowledged_through = (
        datetime.strptime(args.acknowledged_through, "%Y-%m-%d").date()
        if args.acknowledged_through
        else None
    )

    try:
        rows = parse_register_table(checklist_path.read_text(encoding="utf-8"))
    except ValueError as exc:
        print(f"HUMAN-BLOCKED-REGISTER: {exc}")
        return 1

    any_urgent = False
    for row in rows:
        classification = classify(row["needed_by"], today, acknowledged_through)
        days_remaining = (row["needed_by"] - today).days
        if classification not in ("OK", "ACKNOWLEDGED"):
            any_urgent = True
        print(
            f'{row["id"]} [{classification}] needed by {row["needed_by"].isoformat()} '
            f'({days_remaining:+d}d): {row["item"]}'
        )

    if any_urgent:
        return 1

    print(f"HUMAN-BLOCKED-REGISTER: all {len(rows)} item(s) OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
