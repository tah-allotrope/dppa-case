"""Unit tests for tools/check_human_blocked_register.py (PHASE-02)."""
from __future__ import annotations

import sys
import unittest
from datetime import date
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_human_blocked_register as chbr  # noqa: E402

FIXTURE_TABLE = """\
## Human-blocked register

| # | Item | Owner | Needed by | Blocks |
|---|---|---|---|---|
| H1 | Confirm session date | Presenter | 2026-08-15 | every date below |
| H2 | Engage translator | Presenter | 2026-08-25 | localization |

## Next section
Not part of the table.
"""


class TestParseRegisterTable(unittest.TestCase):
    def test_parses_two_rows(self):
        rows = chbr.parse_register_table(FIXTURE_TABLE)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["id"], "H1")
        self.assertEqual(rows[0]["needed_by"], date(2026, 8, 15))
        self.assertEqual(rows[1]["id"], "H2")
        self.assertEqual(rows[1]["needed_by"], date(2026, 8, 25))

    def test_malformed_date_raises_value_error_naming_row(self):
        bad_table = FIXTURE_TABLE.replace("2026-08-25", "TBD")
        with self.assertRaises(ValueError) as ctx:
            chbr.parse_register_table(bad_table)
        self.assertIn("H2", str(ctx.exception))

    def test_missing_heading_raises_value_error(self):
        with self.assertRaises(ValueError):
            chbr.parse_register_table("# Some other document\n\nNo register here.\n")


class TestClassify(unittest.TestCase):
    def test_ten_days_out_is_ok(self):
        self.assertEqual(chbr.classify(date(2026, 8, 1), today=date(2026, 7, 22)), "OK")

    def test_due_today_is_due_soon(self):
        self.assertEqual(chbr.classify(date(2026, 7, 22), today=date(2026, 7, 22)), "DUE-SOON")

    def test_exactly_seven_days_out_is_due_soon_boundary(self):
        self.assertEqual(chbr.classify(date(2026, 7, 29), today=date(2026, 7, 22)), "DUE-SOON")

    def test_eight_days_out_is_ok(self):
        self.assertEqual(chbr.classify(date(2026, 7, 30), today=date(2026, 7, 22)), "OK")

    def test_one_day_past_is_overdue(self):
        self.assertEqual(chbr.classify(date(2026, 7, 21), today=date(2026, 7, 22)), "OVERDUE")

    def test_acknowledged_through_covers_overdue_row(self):
        self.assertEqual(
            chbr.classify(
                date(2026, 8, 15), today=date(2026, 8, 22), acknowledged_through=date(2026, 8, 31)
            ),
            "ACKNOWLEDGED",
        )

    def test_acknowledged_through_does_not_cover_later_row(self):
        self.assertEqual(
            chbr.classify(
                date(2026, 9, 8), today=date(2026, 8, 22), acknowledged_through=date(2026, 8, 31)
            ),
            "OK",
        )

    def test_acknowledged_through_boundary_is_inclusive(self):
        self.assertEqual(
            chbr.classify(
                date(2026, 8, 31), today=date(2026, 8, 22), acknowledged_through=date(2026, 8, 31)
            ),
            "ACKNOWLEDGED",
        )

    def test_no_acknowledged_through_behaves_as_before(self):
        self.assertEqual(
            chbr.classify(date(2026, 8, 25), today=date(2026, 8, 22), acknowledged_through=None),
            "DUE-SOON",
        )


class TestMainAcknowledgement(unittest.TestCase):
    def _write_fixture(self, tmp_path: Path) -> Path:
        checklist = tmp_path / "checklist.md"
        checklist.write_text(FIXTURE_TABLE, encoding="utf-8")
        return checklist

    def test_all_rows_acknowledged_returns_zero(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            checklist = self._write_fixture(Path(tmp))
            exit_code = chbr.main(
                [
                    "--checklist",
                    str(checklist),
                    "--today",
                    "2026-08-22",
                    "--acknowledged-through",
                    "2026-08-31",
                ]
            )
        self.assertEqual(exit_code, 0)

    def test_without_acknowledgement_returns_one(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            checklist = self._write_fixture(Path(tmp))
            exit_code = chbr.main(["--checklist", str(checklist), "--today", "2026-08-22"])
        self.assertEqual(exit_code, 1)


if __name__ == "__main__":
    unittest.main()
