"""check_figures_manifest.py
============================

Guard (PHASE-05 of plans/2026-09-05-gate-model-and-october-readiness-plan.md):
numbers baked into PNG/GIF pixels are invisible to every text guard, so
build_teaching_visuals.py records an input-digest manifest
(assets/teaching/figures-manifest.json) at render time. This checker
recomputes the input and builder digests, asserts every listed figure file
exists, and asserts no rendered number string appears in
tools/retired_figures.json's retired list -- making pixel-embedded numbers
visible to the retired-figure guard for the first time.

The manifest compares input digests, never image bytes: matplotlib output is
not byte-stable across platforms and font sets, so a byte/perceptual hash
would fail for platform reasons (ASM-006).

Run:  PYTHONPATH= py tools/check_figures_manifest.py
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO_ROOT / "assets" / "teaching" / "figures-manifest.json"
RETIRED_PATH = REPO_ROOT / "tools" / "retired_figures.json"
BUILDER_PATH = REPO_ROOT / "build_teaching_visuals.py"


def sha256_of(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_retired(repo_root: Path) -> list[str]:
    data = json.loads((repo_root / "tools" / "retired_figures.json").read_text(encoding="utf-8"))
    return [entry["text"] for entry in data.get("retired", [])]


def check_manifest(repo_root: Path, manifest: dict, retired: list[str]) -> list[str]:
    """Return human-readable violations; empty means pass."""
    violations: list[str] = []

    builder_path = repo_root / "build_teaching_visuals.py"
    try:
        current_builder = sha256_of(builder_path)
    except OSError:
        current_builder = None
    if current_builder != manifest.get("builderSha256"):
        violations.append(
            "builder digest mismatch: build_teaching_visuals.py changed since the manifest "
            "was written (re-run PYTHONPATH= py build_teaching_visuals.py --lang en)"
        )

    for input_path, recorded_digest in (manifest.get("inputs") or {}).items():
        on_disk = repo_root.joinpath(*input_path.split("/"))
        try:
            current_digest = sha256_of(on_disk)
        except OSError:
            violations.append(f"input {input_path} is listed in the manifest but missing on disk")
            continue
        if current_digest != recorded_digest:
            violations.append(
                f"input {input_path} digest mismatch: the JSON changed since the figures "
                "were rendered (re-run the visuals build)"
            )

    for filename, entry in (manifest.get("figures") or {}).items():
        on_disk = repo_root.joinpath(*filename.split("/"))
        if not on_disk.exists():
            violations.append(f"listed figure {filename} does not exist on disk")
        for number in entry.get("renderedNumbers", []):
            folded = number.casefold()
            for retired_text in retired:
                if retired_text.casefold() in folded or folded in retired_text.casefold():
                    violations.append(
                        f"rendered number {number!r} in {filename} matches retired figure "
                        f"{retired_text!r}"
                    )

    return violations


def main(argv: list[str] | None = None) -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"FIGURES-MANIFEST FAIL: cannot read {MANIFEST_PATH} ({exc})")
        return 1
    try:
        retired = load_retired(REPO_ROOT)
    except (OSError, ValueError) as exc:
        print(f"FIGURES-MANIFEST FAIL: cannot read {RETIRED_PATH} ({exc})")
        return 1

    violations = check_manifest(REPO_ROOT, manifest, retired)
    if violations:
        print(f"FIGURES-MANIFEST FAIL ({len(violations)} violation(s))")
        for violation in violations:
            print(f"  - {violation}")
        return 1
    print(f"FIGURES-MANIFEST PASS ({len(manifest.get('figures', {}))} figures checked)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
