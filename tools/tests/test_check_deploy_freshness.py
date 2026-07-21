"""Unit tests for tools/check_deploy_freshness.py (PHASE-02, no network)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_deploy_freshness as cdf  # noqa: E402

FULL_HASH_A = "abc1234def5678901234567890123456789012"
FULL_HASH_B = "def5678901234567890123456789012abc1234"


class TestExtractBuildCommit(unittest.TestCase):
    def test_extracts_full_hash(self):
        html = f'<head><meta name="build-commit" content="{FULL_HASH_A}"></head>'
        self.assertEqual(cdf.extract_build_commit(html), FULL_HASH_A)

    def test_missing_tag_returns_none(self):
        self.assertIsNone(cdf.extract_build_commit("<head></head>"))

    def test_extracts_unknown_literal(self):
        html = '<head><meta name="build-commit" content="unknown"></head>'
        self.assertEqual(cdf.extract_build_commit(html), "unknown")


class TestCompareCommits(unittest.TestCase):
    def test_identical_full_hashes_are_fresh(self):
        is_fresh, _ = cdf.compare_commits(FULL_HASH_A, FULL_HASH_A)
        self.assertTrue(is_fresh)

    def test_short_live_hash_prefix_match_is_fresh(self):
        is_fresh, _ = cdf.compare_commits(FULL_HASH_A[:7], FULL_HASH_A)
        self.assertTrue(is_fresh)

    def test_different_hashes_are_stale(self):
        is_fresh, message = cdf.compare_commits(FULL_HASH_A, FULL_HASH_B)
        self.assertFalse(is_fresh)
        self.assertIn(FULL_HASH_A[:7], message)
        self.assertIn(FULL_HASH_B[:7], message)

    def test_unknown_live_marker_is_stale(self):
        is_fresh, _ = cdf.compare_commits("unknown", FULL_HASH_A)
        self.assertFalse(is_fresh)


if __name__ == "__main__":
    unittest.main()
