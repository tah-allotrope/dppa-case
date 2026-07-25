"""Unit tests for tools/check_retired_figures.py (PHASE-02)."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_retired_figures as crf  # noqa: E402

REAL_CONFIG = crf.load_config(crf.CONFIG_PATH)


def _write(root: Path, name: str, content: str) -> Path:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path


class TestScanFiles(unittest.TestCase):
    def test_planted_stale_figure_is_caught(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "NOTES.md", "The result was 0 of 56 here.\n")
            config = {"scan": ["NOTES.md"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_files(root, config)
            self.assertEqual(len(violations), 1)
            self.assertIn("NOTES.md:1", violations[0])

    def test_case_insensitive_match(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "NOTES.md", "ZERO OF 56 scenarios passed.\n")
            config = {"scan": ["NOTES.md"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_files(root, config)
            self.assertEqual(len(violations), 1)

    def test_current_value_is_not_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "NOTES.md", "The current result is 5 of 56.\n")
            config = {"scan": ["NOTES.md"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_files(root, config)
            self.assertEqual(violations, [])

    def test_ten_of_56_is_flagged_by_design(self):
        # Intentional strictness: "10 of 56" contains the substring "0 of 56".
        # Any future headline phrasing should use the computed figure, not a
        # hand-typed number that happens to end the same way.
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "NOTES.md", "Consider 10 of 56 as a hypothetical.\n")
            config = {"scan": ["NOTES.md"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_files(root, config)
            self.assertEqual(len(violations), 1)

    def test_empty_retired_list_yields_no_violations(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "NOTES.md", "0 of 56 appears here but the list is empty.\n")
            config = {"scan": ["NOTES.md"], "retired": []}
            violations = crf.scan_files(root, config)
            self.assertEqual(violations, [])

    def test_main_exits_zero_when_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "NOTES.md", "The current result is 5 of 56.\n")
            config_path = root / "retired_figures.json"
            import json
            config_path.write_text(
                json.dumps({"scan": ["NOTES.md"], "retired": REAL_CONFIG["retired"]}),
                encoding="utf-8",
            )
            old_root, old_config = crf.REPO_ROOT, crf.CONFIG_PATH
            crf.REPO_ROOT, crf.CONFIG_PATH = root, config_path
            try:
                self.assertEqual(crf.main([]), 0)
            finally:
                crf.REPO_ROOT, crf.CONFIG_PATH = old_root, old_config


class TestScanScripts(unittest.TestCase):
    def test_retired_figure_in_root_script_is_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "build_x.py", 'add_text(slide, "0 of 56")\n')
            config = {"scanScripts": ["*.py"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_scripts(root, config)
            self.assertEqual(len(violations), 1)
            self.assertIn("RETIRED-FIGURE IN GENERATOR:", violations[0])
            self.assertIn("build_x.py", violations[0])

    def test_archived_script_is_excluded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "archive/build_x.py", 'add_text(slide, "0 of 56")\n')
            config = {"scanScripts": ["archive/*.py"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_scripts(root, config)
            self.assertEqual(violations, [])

    def test_test_fixture_is_excluded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "tools/tests/fixture.py", 'x = "0 of 56"\n')
            config = {"scanScripts": ["tools/tests/*.py"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_scripts(root, config)
            self.assertEqual(violations, [])

    def test_current_value_in_generator_is_not_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, "build_x.py", 'add_text(slide, "5 of 56")\n')
            config = {"scanScripts": ["*.py"], "retired": REAL_CONFIG["retired"]}
            violations = crf.scan_scripts(root, config)
            self.assertEqual(violations, [])

    def test_real_repo_generators_are_clean(self):
        config = REAL_CONFIG
        violations = crf.scan_scripts(crf.REPO_ROOT, config)
        self.assertEqual(violations, [], f"unexpected retired figures in generators: {violations}")


class TestLoadConfig(unittest.TestCase):
    def test_missing_config_raises_system_exit(self):
        with tempfile.TemporaryDirectory() as tmp:
            missing = Path(tmp) / "does-not-exist.json"
            with self.assertRaises(SystemExit) as ctx:
                crf.load_config(missing)
            self.assertIn(str(missing), str(ctx.exception))

    def test_real_config_loads(self):
        config = crf.load_config(crf.CONFIG_PATH)
        self.assertIn("scan", config)
        self.assertIn("retired", config)
        self.assertTrue(len(config["retired"]) >= 1)


if __name__ == "__main__":
    unittest.main()
