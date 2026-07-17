"""Tests for verify_prose_figures.py (PHASE-04)."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOLS_DIR))

import verify_prose_figures as vpf  # noqa: E402

REPO_ROOT = TOOLS_DIR.parent


class TestExtractTokens(unittest.TestCase):
    def test_finds_large_grouped_number(self):
        tokens = vpf.extract_tokens("costs 9,063,196,000 and 2,204 dong")
        self.assertEqual(tokens, [(1, "9,063,196,000")])

    def test_volume_in_scope(self):
        tokens = vpf.extract_tokens("volume 5,000,000 kWh")
        self.assertEqual(tokens, [(1, "5,000,000")])

    def test_four_digit_price_out_of_scope(self):
        tokens = vpf.extract_tokens("strike 1,250 and FMP 1,150")
        self.assertEqual(tokens, [])

    def test_line_numbers(self):
        text = "no figure here\nbut 9,063,196,000 is on line 2"
        tokens = vpf.extract_tokens(text)
        self.assertEqual(tokens, [(2, "9,063,196,000")])


class TestStripNonProseHtml(unittest.TestCase):
    def test_strips_script_block_preserving_line_numbers(self):
        text = "before\n<script>var a=[1,833,1935,2999];</script>\nafter 9,063,196,000"
        stripped = vpf.strip_non_prose_html(text)
        tokens = vpf.extract_tokens(stripped)
        self.assertEqual(tokens, [(3, "9,063,196,000")])

    def test_strips_html_comment_preserving_line_numbers(self):
        text = "<!-- row helper y: 20,72,124,176,228 height 46 -->\nreal 9,063,196,000"
        stripped = vpf.strip_non_prose_html(text)
        tokens = vpf.extract_tokens(stripped)
        self.assertEqual(tokens, [(2, "9,063,196,000")])


class TestCanonicalFigures(unittest.TestCase):
    def test_includes_known_anchor(self):
        spines = vpf.load_spines(REPO_ROOT)
        canonical = vpf.canonical_figures(spines)
        self.assertIn("9,063,196,000", canonical)
        self.assertIn("18,828,262,400", canonical)
        self.assertIn("8,304,644,000", canonical)

    def test_excludes_sub_million_values(self):
        spines = vpf.load_spines(REPO_ROOT)
        canonical = vpf.canonical_figures(spines)
        self.assertNotIn("500,000", canonical)


class TestVerify(unittest.TestCase):
    def _write(self, root: Path, rel: str, content: str) -> None:
        path = root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def _seed_spines(self, root: Path) -> None:
        assets = root / "assets" / "teaching"
        assets.mkdir(parents=True, exist_ok=True)
        for key, ckh in (("s1", 9_063_196_000), ("s2", 18_828_262_400), ("s3", 9_054_644_000)):
            (assets / f"spine-{key}.json").write_text(
                json.dumps({"inputs": {"contractedKwh": 5_000_000, "totalConsumptionKwh": 5_000_000},
                            "bau": {}, "bill": {"lines": {}, "cEvn": {"vnd": ckh}, "cKh": {"vnd": ckh},
                                                 "plantRevenue": {}}}),
                encoding="utf-8",
            )

    def test_unknown_figure_is_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._seed_spines(root)
            self._write(root, "NOTES.md", "The total is 9,063,196,001 this month.")
            violations = vpf.verify(root)
            self.assertEqual(len(violations), 1)
            self.assertIn("9,063,196,001", violations[0])

    def test_canonical_figure_is_not_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._seed_spines(root)
            self._write(root, "NOTES.md", "The total is 9,063,196,000 this month.")
            self.assertEqual(vpf.verify(root), [])

    def test_shadowed_literal_is_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._seed_spines(root)
            self._write(root, "tools/prose_figure_literals.json",
                        json.dumps({"literals": [{"figure": "9,063,196,000", "reason": "test"}]}))
            self._write(root, "NOTES.md", "no figures here")
            violations = vpf.verify(root)
            self.assertEqual(len(violations), 1)
            self.assertTrue(violations[0].startswith("SHADOWED-LITERAL"))

    def test_real_repo_is_clean(self):
        self.assertEqual(vpf.verify(REPO_ROOT), [])


if __name__ == "__main__":
    unittest.main()
