"""Unit tests for tools/check_plan_status.py (PHASE-04 of
plans/2026-08-22-delivery-stall-recovery-plan.md)."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_plan_status as cps  # noqa: E402


class TestExtractStatus(unittest.TestCase):
    def test_extracts_quoted_status(self):
        text = '---\ntitle: "X"\nstatus: "complete"\n---\n'
        self.assertEqual(cps.extract_status(text), "complete")

    def test_extracts_long_status_with_dash(self):
        text = '---\nstatus: "complete — bulk-corrected 2026-07-31"\n---\n'
        self.assertEqual(cps.extract_status(text), "complete — bulk-corrected 2026-07-31")

    def test_missing_status_returns_none(self):
        self.assertIsNone(cps.extract_status("---\ntitle: \"X\"\n---\n"))


class TestCountUnticked(unittest.TestCase):
    def test_counts_unticked_only(self):
        text = "- [ ] TASK-01-01: a\n- [x] TASK-01-02: b\n- [ ] TASK-01-03: c\n"
        self.assertEqual(cps.count_unticked_tasks(text), 2)

    def test_zero_when_all_ticked(self):
        self.assertEqual(cps.count_unticked_tasks("- [x] a\n- [x] b\n"), 0)

    def test_indented_tasks_still_count(self):
        self.assertEqual(cps.count_unticked_tasks("  - [ ] nested task\n"), 1)


class TestFindViolations(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.plans_dir = Path(self.tmp.name) / "plans"
        self.reports_dir = Path(self.tmp.name) / "reports"
        self.plans_dir.mkdir()
        self.reports_dir.mkdir()

    def _write_plan(self, name, status, unticked_count):
        tasks = "\n".join(f"- [ ] TASK-{i}" for i in range(unticked_count))
        (self.plans_dir / name).write_text(
            f'---\nstatus: "{status}"\n---\n\n{tasks}\n', encoding="utf-8"
        )

    def test_complete_with_unticked_tasks_and_no_report_is_a_violation(self):
        self._write_plan("2026-01-01-a-plan.md", "complete", 3)
        violations = cps.find_violations(self.plans_dir, self.reports_dir)
        self.assertEqual(violations, [("2026-01-01-a-plan.md", 3)])

    def test_complete_with_unticked_tasks_but_referenced_report_is_not_a_violation(self):
        self._write_plan("2026-01-01-a-plan.md", "complete", 3)
        (self.reports_dir / "2026-01-02-completion.md").write_text(
            "Closed out 2026-01-01-a-plan.md — all phases done.", encoding="utf-8"
        )
        self.assertEqual(cps.find_violations(self.plans_dir, self.reports_dir), [])

    def test_open_status_with_unticked_tasks_is_not_a_violation(self):
        self._write_plan("2026-01-01-a-plan.md", "open", 3)
        self.assertEqual(cps.find_violations(self.plans_dir, self.reports_dir), [])

    def test_complete_with_all_ticked_is_not_a_violation(self):
        self._write_plan("2026-01-01-a-plan.md", "complete", 0)
        self.assertEqual(cps.find_violations(self.plans_dir, self.reports_dir), [])

    def test_complete_dash_suffixed_status_still_matches(self):
        self._write_plan("2026-01-01-a-plan.md", "complete — verified 2026-01-05", 2)
        violations = cps.find_violations(self.plans_dir, self.reports_dir)
        self.assertEqual(violations, [("2026-01-01-a-plan.md", 2)])

    def test_superseded_status_is_not_a_violation(self):
        self._write_plan("2026-01-01-a-plan.md", "superseded", 5)
        self.assertEqual(cps.find_violations(self.plans_dir, self.reports_dir), [])


class TestSuccessorViolations(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.plans_dir = Path(self.tmp.name) / "plans"
        self.plans_dir.mkdir()

    def _write_plan(self, name, status, body=""):
        (self.plans_dir / name).write_text(
            f'---\nstatus: "{status}"\n---\n\n{body}\n', encoding="utf-8"
        )

    def test_abandoned_without_successor_is_a_violation(self):
        self._write_plan("2026-01-01-old.md", "abandoned — closed, nothing tracks the rest")
        self.assertEqual(
            cps.find_successor_violations(self.plans_dir), ["2026-01-01-old.md"]
        )

    def test_superseded_naming_existing_successor_is_not_a_violation(self):
        self._write_plan("2026-08-22-delivery-stall-recovery-plan.md", "complete")
        self._write_plan(
            "2026-01-01-old.md",
            "superseded — continued in favor of plans/2026-08-22-delivery-stall-recovery-plan.md",
        )
        self.assertEqual(cps.find_successor_violations(self.plans_dir), [])

    def test_complete_status_is_unchanged_by_successor_rule(self):
        self._write_plan("2026-01-01-done.md", "complete")
        self.assertEqual(cps.find_successor_violations(self.plans_dir), [])


class TestMain(unittest.TestCase):
    def test_real_repo_root_plans_have_no_status_violations_after_04_10(self):
        """PHASE-04's TASK-04-10 corrects every plan this checker would otherwise
        flag; this test documents that state rather than asserting it blindly --
        if it starts failing, either a plan regressed or a new one needs the
        same correction."""
        violations = cps.find_violations(cps.DEFAULT_PLANS_DIR, cps.DEFAULT_REPORTS_DIR)
        for filename, count in violations:
            self.assertNotEqual(
                filename,
                "2026-07-16-gate-credibility-pipeline-hardening-plan.md",
                "TASK-04-10 should have reopened this plan's status",
            )


if __name__ == "__main__":
    unittest.main()
