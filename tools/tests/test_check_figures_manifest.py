"""Unit tests for tools/check_figures_manifest.py (PHASE-05 of
plans/2026-09-05-gate-model-and-october-readiness-plan.md)."""
from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import check_figures_manifest as cfm  # noqa: E402


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class TestCheckManifest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'build_teaching_visuals.py').write_bytes(b'builder')
        (self.root / 'assets' / 'teaching').mkdir(parents=True)
        self.input_path = self.root / 'assets' / 'teaching' / 'gate-sweep.json'
        self.input_path.write_bytes(b'{"passCount": 8}')
        self.figure_path = self.root / 'assets' / 'teaching' / 'm5-gate-heatmap-en.png'
        self.figure_path.write_bytes(b'png')

    def _manifest(self, **overrides):
        manifest = {
            'generatedBy': 'build_teaching_visuals.py',
            'builderSha256': _digest(b'builder'),
            'inputs': {'assets/teaching/gate-sweep.json': _digest(b'{"passCount": 8}')},
            'figures': {
                'assets/teaching/m5-gate-heatmap-en.png': {
                    'lang': 'en',
                    'inputs': ['assets/teaching/gate-sweep.json'],
                    'renderedNumbers': ['8 / 70'],
                }
            },
        }
        manifest.update(overrides)
        return manifest

    def test_clean_manifest_passes(self):
        self.assertEqual(cfm.check_manifest(self.root, self._manifest(), ['15 / 70']), [])

    def test_stale_input_digest_is_a_violation(self):
        manifest = self._manifest()
        manifest['inputs'] = {'assets/teaching/gate-sweep.json': _digest(b'stale')}
        violations = cfm.check_manifest(self.root, manifest, [])
        self.assertEqual(len(violations), 1)
        self.assertIn('gate-sweep.json', violations[0])
        self.assertIn('digest', violations[0])

    def test_missing_figure_file_is_a_violation(self):
        self.figure_path.unlink()
        violations = cfm.check_manifest(self.root, self._manifest(), [])
        self.assertEqual(len(violations), 1)
        self.assertIn('m5-gate-heatmap-en.png', violations[0])

    def test_retired_rendered_number_is_a_violation(self):
        manifest = self._manifest()
        manifest['figures']['assets/teaching/m5-gate-heatmap-en.png']['renderedNumbers'] = [
            '15 / 70'
        ]
        violations = cfm.check_manifest(self.root, manifest, ['15 / 70'])
        self.assertEqual(len(violations), 1)
        self.assertIn('15 / 70', violations[0])
        self.assertIn('m5-gate-heatmap-en.png', violations[0])

    def test_current_rendered_number_is_not_flagged(self):
        self.assertEqual(cfm.check_manifest(self.root, self._manifest(), ['15 / 70']), [])

    def test_builder_mismatch_is_a_violation(self):
        manifest = self._manifest(builderSha256=_digest(b'other builder'))
        violations = cfm.check_manifest(self.root, manifest, [])
        self.assertEqual(len(violations), 1)
        self.assertIn('builder', violations[0])


if __name__ == '__main__':
    unittest.main()
