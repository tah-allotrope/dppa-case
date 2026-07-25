"""
check_retired_figures.py
=========================

CI guard (PHASE-02 of plans/2026-07-17-prose-parity-second-pipeline-plan.md):
fails if a retired headline figure (see tools/retired_figures.json) reappears
in any "living" prose file — a document that is supposed to always state the
*current* answer, as opposed to a plan/report/research brief that is a
legitimate historical record.

This is the permanent version of a one-off grep: whenever a headline number
changes (e.g. the M5 gate-sweep pass count), the old value is added to
retired_figures.json's "retired" list in the same commit, and this script
then guarantees no living document is ever again caught stating it.

Run:  python tools/check_retired_figures.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/check_retired_figures.py)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = REPO_ROOT / "tools" / "retired_figures.json"

# Directories excluded from the scanScripts sweep: test fixtures and archived
# (never-run) scripts legitimately contain retired strings on purpose.
_EXCLUDED_DIRS = ("tools/tests", "archive", "node_modules", ".git")


def load_config(path: Path) -> dict:
    """Parse retired_figures.json; exits with a clear message if missing or invalid."""
    if not path.exists():
        raise SystemExit(f"check_retired_figures: config not found at {path}")
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"check_retired_figures: invalid JSON in {path}: {exc}")


def _is_excluded(path: Path, root: Path) -> bool:
    """Return True when path lies under tools/tests/, archive/, node_modules/, or .git/."""
    rel = path.relative_to(root).as_posix()
    return any(rel == d or rel.startswith(d + "/") for d in _EXCLUDED_DIRS)


def _scanned_files(root: Path, patterns: list[str]) -> list[Path]:
    files: list[Path] = []
    seen: set[Path] = set()
    for pattern in patterns:
        for match in sorted(root.glob(pattern)):
            if match.is_file() and match not in seen and not _is_excluded(match, root):
                seen.add(match)
                files.append(match)
    return files


def _scan_files_with_prefix(root: Path, files: list[Path], retired: list[dict], prefix: str) -> list[str]:
    violations: list[str] = []
    for file_path in files:
        rel = file_path.relative_to(root).as_posix()
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        lines = text.splitlines()
        for line_no, line in enumerate(lines, start=1):
            lowered = line.lower()
            for entry in retired:
                needle = entry["text"].lower()
                if needle in lowered:
                    replaced_by = entry.get("replacedBy", "?")
                    violations.append(
                        f'{prefix} {rel}:{line_no}: "{entry["text"]}" '
                        f"(replaced by {replaced_by})"
                    )
    return violations


def scan_files(root: Path, config: dict) -> list[str]:
    """Expand config['scan'] globs under root; return violation strings, empty means clean."""
    retired = config.get("retired", [])
    files = _scanned_files(root, config.get("scan", []))
    return _scan_files_with_prefix(root, files, retired, "RETIRED-FIGURE")


def scan_scripts(root: Path, config: dict) -> list[str]:
    """Expand config['scanScripts'] globs under root (excluding tools/tests/, archive/,
    node_modules/, .git/); return violation strings prefixed to flag that the offending
    file is a generator, not prose -- fixing the prose alone would not fix this."""
    retired = config.get("retired", [])
    files = _scanned_files(root, config.get("scanScripts", []))
    return _scan_files_with_prefix(root, files, retired, "RETIRED-FIGURE IN GENERATOR:")


def main(argv: list[str] | None = None) -> int:
    config = load_config(CONFIG_PATH)
    violations = scan_files(root=REPO_ROOT, config=config) + scan_scripts(root=REPO_ROOT, config=config)

    if violations:
        for v in violations:
            print(v)
        print(f"RETIRED-FIGURES FAIL ({len(violations)} violation(s))")
        return 1

    n_prose = len(_scanned_files(REPO_ROOT, config.get("scan", [])))
    n_scripts = len(_scanned_files(REPO_ROOT, config.get("scanScripts", [])))
    print(f"RETIRED-FIGURES PASS ({n_prose + n_scripts} files scanned: {n_prose} prose, {n_scripts} scripts)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
