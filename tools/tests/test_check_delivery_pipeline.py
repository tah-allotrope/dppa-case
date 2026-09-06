"""Unit tests for tools/check_delivery_pipeline.py (PHASE-02 of
plans/2026-08-22-delivery-stall-recovery-plan.md). No network or git calls are made;
every seam function is mocked."""
from __future__ import annotations

import contextlib
import io
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
    def _mock_all(self, *, dirty=0, untracked=0, unpushed=0, undeployed=0, unpushed_age=0, undeployed_age=0,
                  deployable=None, deployable_age=0):
        hashes = deployable if deployable is not None else [f"hash{i:02d}" for i in range(undeployed)]
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
            mock.patch.object(cdp, "deployable_commits", return_value=list(hashes)),
            mock.patch.object(cdp, "commit_age_days", return_value=deployable_age),
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

    def test_documentation_only_commits_do_not_gate(self):
        self._apply(self._mock_all(dirty=0, unpushed=0, undeployed=2, deployable=[]))
        with contextlib.redirect_stdout(io.StringIO()) as output:
            exit_code = cdp.main([])
        self.assertEqual(exit_code, 0)
        self.assertIn("documentation-only commits: 2", output.getvalue())

    def test_old_deployable_commit_still_fails(self):
        self._apply(
            self._mock_all(
                dirty=0, unpushed=0, undeployed=3, deployable=["abc123"], deployable_age=5
            )
        )
        exit_code = cdp.main(["--max-age-days", "3"])
        self.assertEqual(exit_code, 1)

    def test_recent_deployable_commit_is_suppressed_by_max_age(self):
        self._apply(
            self._mock_all(
                dirty=0, unpushed=0, undeployed=1, deployable=["abc123"], deployable_age=1
            )
        )
        exit_code = cdp.main(["--max-age-days", "3"])
        self.assertEqual(exit_code, 0)


class TestDeployableCommits(unittest.TestCase):
    def test_returns_hashes_touching_deploy_paths(self):
        with mock.patch.object(cdp, "_run_git", return_value="abc123\ndef456\n") as run:
            self.assertEqual(cdp.deployable_commits("marker", ["app/"]), ["abc123", "def456"])
        run.assert_called_once_with(["rev-list", "marker..HEAD", "--", "app/"])

    def test_empty_when_only_docs_touched(self):
        with mock.patch.object(cdp, "_run_git", return_value=""):
            self.assertEqual(cdp.deployable_commits("marker", ["app/"]), [])

    def test_none_from_git_is_empty(self):
        with mock.patch.object(cdp, "_run_git", return_value=None):
            self.assertEqual(cdp.deployable_commits("marker", ["app/"]), [])


if __name__ == "__main__":
    unittest.main()
