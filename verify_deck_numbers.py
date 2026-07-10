"""PHASE-04 (October readiness hardening plan): reconciles every comma-grouped
VND-millions figure shown on a slide BODY (never speaker notes, which
intentionally carry exact answer-key numbers) against the canonical
assets/teaching/spine-s1.json and assets/teaching/gate-sweep.json exports, so a
future scenario or engine change cannot silently leave a stale number on a
slide. Mirrors ASM-001 in the Oct 2026 teaching-revamp plan: no slide figure is
hand-typed without reconciling to the settlement engine's exports.

Run: PYTHONPATH= py verify_deck_numbers.py
Exit 0 + "PARITY PASS" on success; exit 1 + offending (slide, token) pairs on
mismatch.
"""
import json
import os
import re
import sys

from pptx import Presentation

DECK = os.path.join("ceba", "DPPA Presentation Oct 2026 To Teach.pptx")
ASSETS = os.path.join("assets", "teaching")

NUMBER_PATTERN = re.compile(r"\d{1,3}(?:,\d{3})+")

# Pedagogical constants shown on-slide that are not raw spine/sweep export
# fields. Each entry must carry a comment explaining exactly where it comes
# from, so this set cannot silently grow into an escape hatch for typos.
EXTRA_ALLOWED = {
    # M2 Sankey slide body: "fees {systemService + diffClearing}" — the sum of
    # two spine line items (1,800 + 817), not a field of its own.
    "2,617",
}


def collect_spine_numbers(spine):
    numbers = set()

    def walk(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if key.lower().endswith("vndmillionsrounded") and isinstance(value, (int, float)):
                    numbers.add(f"{round(value):,}")
                else:
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(spine)
    return numbers


def collect_sweep_numbers(sweep):
    numbers = set()
    for strike in sweep.get("strikes", []):
        numbers.add(f"{round(strike):,}")
    numbers.add(f"{sweep.get('passCount', 0)}")
    return numbers


def allowed_numbers(spine, sweep, extra):
    return collect_spine_numbers(spine) | collect_sweep_numbers(sweep) | extra


def extract_slide_numbers(pptx_path):
    prs = Presentation(pptx_path)
    tokens = []
    for slide_index, slide in enumerate(prs.slides):
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for match in NUMBER_PATTERN.finditer(shape.text_frame.text):
                tokens.append((slide_index, match.group()))
    return tokens


def main():
    with open(os.path.join(ASSETS, "spine-s1.json"), encoding="utf-8") as f:
        spine = json.load(f)
    with open(os.path.join(ASSETS, "gate-sweep.json"), encoding="utf-8") as f:
        sweep = json.load(f)

    allowed = allowed_numbers(spine, sweep, EXTRA_ALLOWED)
    tokens = extract_slide_numbers(DECK)

    violations = [(slide_index, token) for slide_index, token in tokens if token not in allowed]

    for slide_index, token in tokens:
        verdict = "OK" if token in allowed else "MISMATCH"
        print(f"slide {slide_index}: {token} -> {verdict}")

    if violations:
        print("\nPARITY FAIL — unreconciled figures found:")
        for slide_index, token in violations:
            print(f"  slide {slide_index}: {token!r} not in spine-s1.json, gate-sweep.json, or EXTRA_ALLOWED")
        sys.exit(1)

    print(f"\nPARITY PASS — {len(tokens)} figures across {DECK} all reconcile.")


if __name__ == "__main__":
    main()
