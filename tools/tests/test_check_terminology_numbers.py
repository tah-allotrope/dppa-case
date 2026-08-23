"""Unit tests for tools/check_terminology_numbers.py (PHASE-03 of
plans/2026-08-22-delivery-stall-recovery-plan.md)."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_terminology_numbers as ctn  # noqa: E402


class TestFindViolations(unittest.TestCase):
    def test_embedded_figure_is_flagged(self):
        data = {"entries": {"cold_open_body": {"en": "C_EVN is 500 tr VND"}}}
        violations = ctn.find_violations(data)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0][0], "entries.cold_open_body.en")
        self.assertEqual(violations[0][1], "500")

    def test_comma_grouped_figure_is_flagged(self):
        data = {"entries": {"cold_open_body": {"en": "C_EVN is 11,020 million"}}}
        violations = ctn.find_violations(data)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0][0], "entries.cold_open_body.en")

    def test_placeholder_token_is_not_flagged(self):
        data = {"entries": {"cold_open_body": {"en": "C_EVN is {cEvnMillions} million"}}}
        self.assertEqual(ctn.find_violations(data), [])

    def test_two_digit_run_is_below_threshold(self):
        data = {"entries": {"decree_ref": {"en": "Decree 57"}}}
        self.assertEqual(ctn.find_violations(data), [])

    def test_note_and_slots_and_source_fields_are_never_scanned(self):
        data = {
            "entries": {
                "m2b_body": {
                    "en": "Market energy {marketEnergy} tr VND.",
                    "note": "see lesson 0011-worksheets.html for context",
                    "source": "lessons/0009-scenario-3-excess.html:90",
                    "slots": {"marketEnergy": "/bill/lines/marketEnergy/vndMillionsRounded"},
                }
            }
        }
        self.assertEqual(ctn.find_violations(data), [])

    def test_flags_vi_and_zh_fields_too(self):
        data = {
            "entries": {
                "cold_open_body": {
                    "en": "{bau} tr VND",
                    "vi": "Hôm nay: 11.020 tr VND",
                    "zh": "UNTRANSLATED",
                }
            }
        }
        violations = ctn.find_violations(data)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0][0], "entries.cold_open_body.vi")

    def test_untranslated_sentinel_is_not_flagged(self):
        data = {"entries": {"cold_open_body": {"en": "{bau} tr VND", "vi": "UNTRANSLATED"}}}
        self.assertEqual(ctn.find_violations(data), [])


class TestMain(unittest.TestCase):
    def _write(self, content: str) -> Path:
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        tmp.write(content)
        tmp.close()
        self.addCleanup(lambda: Path(tmp.name).unlink(missing_ok=True))
        return Path(tmp.name)

    def test_passing_fixture_exits_zero(self):
        path = self._write(
            '{"entries": {"a": {"en": "no figures here, only {placeholder}", "vi": "UNTRANSLATED"}}}'
        )
        self.assertEqual(ctn.main([str(path)]), 0)

    def test_planted_violation_exits_one(self):
        path = self._write('{"entries": {"a": {"en": "the value is 11,020 million"}}}')
        self.assertEqual(ctn.main([str(path)]), 1)

    def test_real_repo_file_passes(self):
        self.assertEqual(ctn.main([str(ctn.DEFAULT_MAP)]), 0)


if __name__ == "__main__":
    unittest.main()
