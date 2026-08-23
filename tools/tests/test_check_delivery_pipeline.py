"""Unit tests for tools/check_delivery_pipeline.py (PHASE-02 of
plans/2026-08-22-delivery-stall-recovery-plan.md). No network or git calls are made;
every seam function is mocked."""
from __future__ import annotations

import sys
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_delivery_pipeline as cdp  # noqa: E402

LIVE_HTML = '<head><meta name="build-commit" content="abc1234def5678901234567890123456789012"></head>'


class TestDirtyTrackedCount(unittest.TestCase):
    def test_counts_tracked_modifications_only(self):
        porcelain = " M app/src/main.js\n?? app/e2e/visual.spec.js-snapshots/\n"
        self.assertEqual(cdp.dirty_tracked_count(porcelain), 1)

    def test_counts_untracked_only(self):
        porcelain = " M app/src/main.js\n?? app/e2e/visual.spec.js-snapshots/\n"
        self.assertEqual(cdp.untracked_count(porcelain), 1)

    def test_empty_status_is_zero(self):
        self.assertEqual(cdp.dirty_tracked_count(""), 0)

    def test_mixed_statuses(self):
        porcelain = "A  new.py\nMM edited.py\n D deleted.py\n"
        self.assertEqual(cdp.dirty_tracked_count(porcelain), 3)


class TestMain(unittest.TestCase):
    def _mock_all(self, *, dirty=0, untracked=0, unpushed=0, undeployed=0, unpushed_age=0, undeployed_age=0):
        return [
            mock.patch.object(cdp, "git_status_porcelain", return_value=""),
            mock.patch.object(cdp, "dirty_tracked_count", return_value=dirty),
            mock.patch.object(cdp, "untracked_count", return_value=untracked),
            mock.patch.object(cdp, "resolve_upstream", return_value="origin/master"),
            mock.patch.object(cdp, "unpushed_count", return_value=unpushed),
            mock.patch.object(cdp, "undeployed_count", return_value=undeployed),
            mock.patch.object(cdp, "fetch_html", return_value=LIVE_HTML),
            mock.patch.object(
                cdp,
                "oldest_commit_age_days",
                side_effect=lambda rev_range: unpushed_age if "origin/master" in rev_range else undeployed_age,
            ),
        ]

    def _apply(self, patches):
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

    def test_all_clean_returns_zero(self):
        self._apply(self._mock_all(dirty=0, unpushed=0, undeployed=0))
        exit_code = cdp.main([])
        self.assertEqual(exit_code, 0)

    def test_stalled_all_three_stages(self):
        self._apply(self._mock_all(dirty=0, unpushed=3, undeployed=14, unpushed_age=12, undeployed_age=28))
        exit_code = cdp.main([])
        self.assertEqual(exit_code, 1)

    def test_network_unreachable_is_unknown(self):
        patches = self._mock_all(dirty=0, unpushed=0, undeployed=0)
        for p in patches:
            if p.attribute == "fetch_html":
                continue
            p.start()
            self.addCleanup(p.stop)
        with mock.patch.object(cdp, "fetch_html", side_effect=urllib.error.URLError("unreachable")):
            exit_code = cdp.main([])
        self.assertEqual(exit_code, 0)

    def test_unusable_marker_is_unknown(self):
        patches = self._mock_all(dirty=0, unpushed=0)
        for p in patches:
            if p.attribute == "undeployed_count":
                continue
            p.start()
            self.addCleanup(p.stop)
        with mock.patch.object(cdp, "undeployed_count", return_value=None):
            exit_code = cdp.main([])
        self.assertEqual(exit_code, 0)

    def test_max_age_days_suppresses_recent_unpushed_commit(self):
        self._apply(self._mock_all(dirty=0, unpushed=1, undeployed=0, unpushed_age=2))
        exit_code = cdp.main(["--max-age-days", "7"])
        self.assertEqual(exit_code, 0)

    def test_max_age_days_still_fails_old_unpushed_commit(self):
        self._apply(self._mock_all(dirty=0, unpushed=1, undeployed=0, unpushed_age=12))
        exit_code = cdp.main(["--max-age-days", "7"])
        self.assertEqual(exit_code, 1)


if __name__ == "__main__":
    unittest.main()
