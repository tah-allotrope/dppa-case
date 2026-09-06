"""Unit tests for build_oct_teaching_deck.asset_for_lang (PHASE-01 of
plans/2026-09-05-gate-model-and-october-readiness-plan.md)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    import build_oct_teaching_deck as deck
except ImportError:
    deck = None


@unittest.skipIf(deck is None, 'python-pptx is not installed')
class TestAssetForLang(unittest.TestCase):
    def test_teaching_en_resolves(self):
        path = deck.asset_for_lang('m5-gate-heatmap', 'en', 'teaching')
        self.assertTrue(path.endswith('m5-gate-heatmap-en.png'), path)
        self.assertTrue(Path(path).exists())

    def test_teaching_vi_resolves(self):
        path = deck.asset_for_lang('m5-gate-heatmap', 'vi', 'teaching')
        self.assertTrue(path.endswith('m5-gate-heatmap-vi.png'), path)

    def test_teaching_zh_uses_plain_zh_suffix(self):
        path = deck.asset_for_lang('m5-gate-heatmap', 'zh', 'teaching')
        self.assertTrue(path.endswith('m5-gate-heatmap-zh.png'), path)
        self.assertNotIn('zh-cn', path)

    def test_cfd_zh_uses_zh_cn_suffix(self):
        path = deck.asset_for_lang('cfd-s1', 'zh', 'cfd')
        self.assertTrue(path.endswith('cfd-s1-zh-cn.gif'), path)

    def test_cfd_en_resolves(self):
        path = deck.asset_for_lang('cfd-s1', 'en', 'cfd')
        self.assertTrue(path.endswith('cfd-s1-en.gif'), path)
        self.assertTrue(Path(path).exists())

    def test_mid_stem_placeholder(self):
        path = deck.asset_for_lang('m2-sankey-{lang}-5', 'vi', 'teaching')
        self.assertTrue(path.endswith('m2-sankey-vi-5.png'), path)

    def test_missing_asset_raises_system_exit(self):
        with self.assertRaises(SystemExit) as ctx:
            deck.asset_for_lang('does-not-exist', 'vi', 'teaching')
        message = str(ctx.exception.code)
        self.assertIn('does-not-exist-vi', message)
        self.assertIn('build_teaching_visuals.py', message)

    def test_unsupported_language_raises_system_exit(self):
        with self.assertRaises(SystemExit):
            deck.asset_for_lang('m5-gate-heatmap', 'de', 'teaching')

    def test_suffix_map_shape(self):
        self.assertEqual(
            deck.LANG_SUFFIX,
            {
                'teaching': {'en': 'en', 'vi': 'vi', 'zh': 'zh'},
                'cfd': {'en': 'en', 'vi': 'vi', 'zh': 'zh-cn'},
            },
        )


if __name__ == '__main__':
    unittest.main()
