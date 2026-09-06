"""
check_terminology_numbers.py
=============================

Guard (PHASE-03 of plans/2026-08-22-delivery-stall-recovery-plan.md): fails if any
translatable string in assets/teaching/terminology-map.json embeds a hand-typed
figure (a run of 3+ digits) instead of a {placeholder} slot.

Why: a translator working through this file should never need to type a number.
Embedded figures are the exact class of defect the settlement-engine pipeline
exists to prevent elsewhere (a stale/mistyped number on a slide) -- this file was
the one place in the repo that could carry one without any guard noticing. The
"slots" contract (documented in the file's own meta.slotsContract) lets
build_oct_teaching_deck.py substitute every figure from assets/teaching/spine-s1.json
at build time instead.

Run:  python tools/check_terminology_numbers.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_terminology_numbers.py)
"""
from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MAP = REPO_ROOT / "assets" / "teaching" / "terminology-map.json"

# A run of 3+ consecutive digits. Two-digit runs (Decree 57, VD-EVN, etc.) are not
# the class of error this guards against and would make the guard too noisy to
# trust; the figures this exists to catch are all 3+ digit VND/kWh quantities.
DIGIT_RUN_RE = re.compile(r"\d{3,}")

# Only these fields are translatable prose that a translator types. Every other
# field on an entry ("note", "slots", "source") is metadata/citation and is
# allowed to contain digits (e.g. a lesson filename like "0011-worksheets.html").
_TRANSLATABLE_FIELDS = ("en", "vi", "zh")


def find_violations(data: dict) -> list[tuple[str, str]]:
    """Return (json_path, offending_string) for every translatable string in
    data["entries"] containing a run of 3+ digits."""
    violations = []
    entries = data.get("entries", {})
    for entry_key, entry in entries.items():
        if not isinstance(entry, dict):
            continue
        for field_key in _TRANSLATABLE_FIELDS:
            value = entry.get(field_key)
            if not isinstance(value, str):
                continue
            match = DIGIT_RUN_RE.search(value)
            if match:
                violations.append((f"entries.{entry_key}.{field_key}", match.group()))
    return violations


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    map_path = Path(argv[0]) if argv else DEFAULT_MAP
    with io.open(map_path, encoding="utf-8") as f:
        data = json.load(f)

    violations = find_violations(data)

    if violations:
        print(f"TERMINOLOGY-NUMBERS FAIL: {len(violations)} hand-typed figure(s) in {map_path}")
        for path, token in violations:
            print(f"  {path}: {token!r}")
        print(
            '  Fix: replace the figure with a {placeholder} token and add a "slots" entry '
            "mapping it to a path in assets/teaching/spine-s1.json (see the file's "
            "meta.slotsContract)."
        )
        return 1

    entry_count = len(data.get("entries", {}))
    print(f"TERMINOLOGY-NUMBERS PASS ({entry_count} entries scanned, 0 embedded figures)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
