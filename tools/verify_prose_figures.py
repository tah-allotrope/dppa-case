"""
verify_prose_figures.py
========================

CI guard (PHASE-04 of plans/2026-07-17-prose-parity-second-pipeline-plan.md):
fails if any large (>=7-digit, comma-grouped) figure in "living" prose is
neither an engine-exported canonical figure (assets/teaching/spine-s{1,2,3}.json)
nor an explicitly justified literal (tools/prose_figure_literals.json).

Also fails if a literal entry "shadows" a canonical figure — i.e. someone
allowlisted a number that the engine already exports, which would mask
future drift on that exact figure.

Run:  python tools/verify_prose_figures.py
      (Windows, if the default python is shadowed: PYTHONPATH= py tools/verify_prose_figures.py)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SPINE_KEYS = ("s1", "s2", "s3")
SPINE_PATHS = {key: REPO_ROOT / "assets" / "teaching" / f"spine-{key}.json" for key in SPINE_KEYS}
LITERALS_PATH = REPO_ROOT / "tools" / "prose_figure_literals.json"

# Living prose = documents that must always state the current answer.
# Historical records (plans/, research/, reports/, learning-records/,
# archive/, deck-qa/) are never scanned (ASM-003).
SCAN_PATTERNS = [
    "NOTES.md", "RESOURCES.md", "MISSION.md", "corrections-log.md",
    "facilitator/**/*.md", "lessons/**/*.html",
    "app/docs/**/*.md", "assets/teaching/*.json",
    "app/src/data/strings.js",
]

TOKEN_RE = re.compile(r"\d{1,3}(?:,\d{3}){2,}")

# Chart-data arrays (<script>) and layout notes (HTML comments) routinely
# contain comma-separated number runs (SVG coordinates, Chart.js datasets)
# that the token regex would otherwise misread as one grouped VND figure —
# these are code/annotations, not prose a human reads as a claim.
_SCRIPT_RE = re.compile(r"<script\b[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL)
_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)


def _blank_preserving_newlines(match: re.Match) -> str:
    return "\n" * match.group(0).count("\n")


def strip_non_prose_html(text: str) -> str:
    """Remove <script> bodies and HTML comments, preserving line numbers."""
    text = _SCRIPT_RE.sub(_blank_preserving_newlines, text)
    text = _COMMENT_RE.sub(_blank_preserving_newlines, text)
    return text


def load_spines(root: Path) -> dict[str, dict]:
    spines: dict[str, dict] = {}
    for key, path in SPINE_PATHS.items():
        if not path.exists():
            raise FileNotFoundError(f"Missing spine export: {path}")
        spines[key] = json.loads(path.read_text(encoding="utf-8"))
    return spines


def _add_if_large(figures: set[str], value) -> None:
    if isinstance(value, (int, float)) and not isinstance(value, bool) and abs(value) >= 1_000_000:
        figures.add(f"{abs(round(value)):,}")


def canonical_figures(spines: dict[str, dict]) -> set[str]:
    """Every integer field value whose absolute value >= 1,000,000, from
    each spine's inputs (volumes), bill (vnd fields, cEvn, cKh, plantRevenue),
    bau, and (S3) the excess block."""
    figures: set[str] = set()
    for spine in spines.values():
        inputs = spine.get("inputs", {})
        for key in ("contractedKwh", "totalConsumptionKwh"):
            if key in inputs:
                _add_if_large(figures, inputs[key])

        bau = spine.get("bau", {})
        if "monthlyVnd" in bau:
            _add_if_large(figures, bau["monthlyVnd"])

        bill = spine.get("bill", {})
        for line in bill.get("lines", {}).values():
            if "vnd" in line:
                _add_if_large(figures, line["vnd"])
        for key in ("cEvn", "cKh"):
            if key in bill:
                _add_if_large(figures, bill[key]["vnd"])
        for entry in bill.get("plantRevenue", {}).values():
            if "vnd" in entry:
                _add_if_large(figures, entry["vnd"])

        excess = spine.get("excess")
        if excess:
            for key in ("generationKwh", "excessKwh", "spotValueVnd"):
                if key in excess:
                    _add_if_large(figures, excess[key])

    return figures


def load_literals(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"verify_prose_figures: invalid JSON in {path}: {exc}")
    return data.get("literals", [])


def _scanned_files(root: Path, patterns: list[str]) -> list[Path]:
    files: list[Path] = []
    seen: set[Path] = set()
    for pattern in patterns:
        for match in sorted(root.glob(pattern)):
            if match.is_file() and match not in seen:
                seen.add(match)
                files.append(match)
    return files


def extract_tokens(text: str) -> list[tuple[int, str]]:
    tokens: list[tuple[int, str]] = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        for match in TOKEN_RE.finditer(line):
            tokens.append((line_no, match.group(0)))
    return tokens


def verify(root: Path) -> list[str]:
    """All violations (unknown tokens + shadowed literals); empty means clean."""
    violations: list[str] = []
    spines = load_spines(root)
    canonical = canonical_figures(spines)
    literals_config = load_literals(root / "tools" / "prose_figure_literals.json")
    literal_figures = {entry["figure"] for entry in literals_config}

    for figure in sorted(literal_figures & canonical):
        violations.append(
            f"SHADOWED-LITERAL {figure}: remove from prose_figure_literals.json (it is an engine export)"
        )

    allowed = canonical | literal_figures
    files = _scanned_files(root, SCAN_PATTERNS)
    for file_path in files:
        rel = file_path.relative_to(root).as_posix()
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if file_path.suffix == ".html":
            text = strip_non_prose_html(text)
        for line_no, token in extract_tokens(text):
            if token not in allowed:
                violations.append(f"PROSE-FIGURE {rel}:{line_no}: {token} not in canonical set or literals")

    return violations


def _token_and_file_counts(root: Path) -> tuple[int, int]:
    files = _scanned_files(root, SCAN_PATTERNS)
    n_tokens = 0
    for file_path in files:
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if file_path.suffix == ".html":
            text = strip_non_prose_html(text)
        n_tokens += len(extract_tokens(text))
    return n_tokens, len(files)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    violations = verify(REPO_ROOT)

    if violations:
        for v in violations:
            print(v)
        print(f"PROSE-FIGURES FAIL ({len(violations)} violation(s))")
        return 1

    n_tokens, n_files = _token_and_file_counts(REPO_ROOT)
    print(f"PROSE-FIGURES PASS ({n_tokens} tokens across {n_files} files)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
