"""Unit tests for tools/check_deploy_freshness.py (PHASE-01 of
plans/2026-07-25-guardrail-integrity-and-localization-plan.md). No network calls are made;
fetch_html and run_local_build are always mocked."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_deploy_freshness as cdf  # noqa: E402

FULL_HASH_A = "abc1234def5678901234567890123456789012"
FULL_HASH_B = "def5678901234567890123456789012abc1234"

LOCAL_HTML = (
    '<head><script type="module" crossorigin src="/assets/index-CpURIX_m.js"></script>'
    '<link rel="stylesheet" crossorigin href="/assets/index-Bev1tNA7.css"></head>'
)


class TestExtractBuildCommit(unittest.TestCase):
    def test_extracts_full_hash(self):
        html = f'<head><meta name="build-commit" content="{FULL_HASH_A}"></head>'
        self.assertEqual(cdf.extract_build_commit(html), FULL_HASH_A)

    def test_missing_tag_returns_none(self):
        self.assertIsNone(cdf.extract_build_commit("<head></head>"))

    def test_extracts_unknown_literal(self):
        html = '<head><meta name="build-commit" content="unknown"></head>'
        self.assertEqual(cdf.extract_build_commit(html), "unknown")

    def test_extracts_dirty_suffixed_hash(self):
        html = f'<head><meta name="build-commit" content="{FULL_HASH_A}-dirty"></head>'
        self.assertEqual(cdf.extract_build_commit(html), f"{FULL_HASH_A}-dirty")


class TestIsDirtyMarker(unittest.TestCase):
    def test_dirty_suffix_is_dirty(self):
        self.assertTrue(cdf.is_dirty_marker(f"{FULL_HASH_A}-dirty"))

    def test_clean_hash_is_not_dirty(self):
        self.assertFalse(cdf.is_dirty_marker(FULL_HASH_A))

    def test_none_is_not_dirty(self):
        self.assertFalse(cdf.is_dirty_marker(None))

    def test_unknown_is_not_dirty(self):
        self.assertFalse(cdf.is_dirty_marker("unknown"))


class TestLocalAssetPaths(unittest.TestCase):
    def test_extracts_script_and_link_assets(self):
        self.assertEqual(
            cdf.local_asset_paths(LOCAL_HTML),
            {"/assets/index-CpURIX_m.js", "/assets/index-Bev1tNA7.css"},
        )

    def test_ignores_non_asset_references(self):
        html = '<link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/favicon.svg">'
        self.assertEqual(cdf.local_asset_paths(html), set())

    def test_empty_html_returns_empty_set(self):
        self.assertEqual(cdf.local_asset_paths(""), set())


class TestWriteDeployLog(unittest.TestCase):
    def _fixture(self, first_row_date: str) -> str:
        return (
            "# Deployment\n\n"
            "## Last Deploy\n\n"
            "| Date | Commit | Description |\n"
            "|---|---|---|\n"
            f"| {first_row_date} | `f5fd22a` | Some earlier deploy |\n"
            "| 2026-07-05 | `ed21985`+ | App quality uplift |\n\n"
            "## CI Notes\n"
        )

    def test_inserts_new_row_when_top_date_differs(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "deployment.md"
            path.write_text(self._fixture("2026-07-22"), encoding="utf-8")
            changed = cdf.write_deploy_log(path, "2026-07-25", "090a50d", "Verified fresh")
            self.assertTrue(changed)
            content = path.read_text(encoding="utf-8")
            self.assertIn("| 2026-07-25 | `090a50d` | Verified fresh |", content)
            self.assertIn("| 2026-07-22 | `f5fd22a` | Some earlier deploy |", content)
            self.assertIn("| 2026-07-05 | `ed21985`+ | App quality uplift |", content)

    def test_updates_in_place_when_top_date_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "deployment.md"
            path.write_text(self._fixture("2026-07-25"), encoding="utf-8")
            cdf.write_deploy_log(path, "2026-07-25", "aaa1111", "First write")
            changed_again = cdf.write_deploy_log(path, "2026-07-25", "bbb2222", "Second write")
            self.assertTrue(changed_again)
            content = path.read_text(encoding="utf-8")
            self.assertEqual(content.count("2026-07-25"), 1)
            self.assertIn("| 2026-07-25 | `bbb2222` | Second write |", content)
            self.assertNotIn("aaa1111", content)

    def test_missing_file_returns_false(self):
        path = Path(tempfile.gettempdir()) / "definitely-does-not-exist-deployment.md"
        self.assertFalse(cdf.write_deploy_log(path, "2026-07-25", "090a50d", "x"))

    def test_missing_heading_returns_false(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "deployment.md"
            path.write_text("# Deployment\n\nNo table here.\n", encoding="utf-8")
            self.assertFalse(cdf.write_deploy_log(path, "2026-07-25", "090a50d", "x"))


class TestMain(unittest.TestCase):
    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmpdir.cleanup)
        self.dist_index = Path(self._tmpdir.name) / "index.html"
        self.dist_index.write_text(LOCAL_HTML, encoding="utf-8")

        patcher_dist = mock.patch.object(cdf, "DIST_INDEX", self.dist_index)
        patcher_dist.start()
        self.addCleanup(patcher_dist.stop)

        patcher_build = mock.patch.object(cdf, "run_local_build", return_value=True)
        patcher_build.start()
        self.addCleanup(patcher_build.stop)

    def _live_html(self, assets_html: str, marker: str | None) -> str:
        meta = f'<meta name="build-commit" content="{marker}">' if marker else ""
        return f"<head>{meta}{assets_html}</head>"

    def test_matching_assets_clean_marker_is_pass(self):
        live_html = self._live_html(
            '<script src="/assets/index-CpURIX_m.js"></script><link href="/assets/index-Bev1tNA7.css">',
            FULL_HASH_A,
        )
        with mock.patch.object(cdf, "fetch_html", return_value=live_html):
            exit_code = cdf.main([])
        self.assertEqual(exit_code, 0)

    def test_dirty_marker_fails_even_with_matching_assets(self):
        live_html = self._live_html(
            '<script src="/assets/index-CpURIX_m.js"></script><link href="/assets/index-Bev1tNA7.css">',
            f"{FULL_HASH_A}-dirty",
        )
        with mock.patch.object(cdf, "fetch_html", return_value=live_html):
            exit_code = cdf.main([])
        self.assertEqual(exit_code, 1)

    def test_mismatched_assets_is_stale(self):
        live_html = self._live_html('<script src="/assets/index-OLDHASH.js"></script>', FULL_HASH_A)
        with mock.patch.object(cdf, "fetch_html", return_value=live_html):
            exit_code = cdf.main([])
        self.assertEqual(exit_code, 1)

    def test_unreachable_network_is_unknown(self):
        import urllib.error

        with mock.patch.object(cdf, "fetch_html", side_effect=urllib.error.URLError("unreachable")):
            exit_code = cdf.main([])
        self.assertEqual(exit_code, 0)

    def test_missing_marker_but_matching_assets_is_pass(self):
        live_html = self._live_html(
            '<script src="/assets/index-CpURIX_m.js"></script><link href="/assets/index-Bev1tNA7.css">',
            None,
        )
        with mock.patch.object(cdf, "fetch_html", return_value=live_html):
            exit_code = cdf.main([])
        self.assertEqual(exit_code, 0)

    def test_failed_local_build_is_unknown(self):
        with mock.patch.object(cdf, "run_local_build", return_value=False):
            exit_code = cdf.main([])
        self.assertEqual(exit_code, 0)

    def test_strict_failed_local_build_is_hard_failure(self):
        with mock.patch.object(cdf, "run_local_build", return_value=False):
            exit_code = cdf.main(["--strict"])
        self.assertEqual(exit_code, 1)

    def test_strict_missing_dist_index_is_hard_failure(self):
        missing = Path(self._tmpdir.name) / "does-not-exist.html"
        with mock.patch.object(cdf, "DIST_INDEX", missing):
            exit_code = cdf.main(["--strict"])
        self.assertEqual(exit_code, 1)

    def test_strict_unreachable_network_stays_unknown(self):
        import urllib.error

        with mock.patch.object(cdf, "fetch_html", side_effect=urllib.error.URLError("unreachable")):
            exit_code = cdf.main(["--strict"])
        self.assertEqual(exit_code, 0)

    def test_write_log_updates_deployment_md_on_pass(self):
        deployment_md = Path(self._tmpdir.name) / "deployment.md"
        deployment_md.write_text(
            "# Deployment\n\n## Last Deploy\n\n| Date | Commit | Description |\n|---|---|---|\n"
            "| 2026-07-22 | `f5fd22a` | Old row |\n",
            encoding="utf-8",
        )
        live_html = self._live_html(
            '<script src="/assets/index-CpURIX_m.js"></script><link href="/assets/index-Bev1tNA7.css">',
            FULL_HASH_A,
        )
        with mock.patch.object(cdf, "DEPLOYMENT_MD", deployment_md), \
             mock.patch.object(cdf, "fetch_html", return_value=live_html):
            exit_code = cdf.main(["--write-log"])
        self.assertEqual(exit_code, 0)
        content = deployment_md.read_text(encoding="utf-8")
        self.assertIn(FULL_HASH_A[:7], content)


if __name__ == "__main__":
    unittest.main()
