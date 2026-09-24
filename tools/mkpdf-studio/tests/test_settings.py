from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mkpdf_safe.settings import BUILTIN_PRESETS, PdfPreset, SettingsStore


class SettingsStoreTests(unittest.TestCase):
    def test_builtin_presets_and_round_trip_custom_preset(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "settings.json"
            store = SettingsStore(path)
            self.assertIn("Balanced", store.presets())
            store.save_preset("My A4", PdfPreset(88, "a4-landscape"))
            loaded = SettingsStore(path)
            self.assertEqual(loaded.presets()["My A4"], PdfPreset(88, "a4-landscape"))
            self.assertEqual(loaded.last_preset, "My A4")

    def test_onboarding_flag_round_trip(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "settings.json"
            store = SettingsStore(path)
            self.assertFalse(store.onboarding_seen)
            store.mark_onboarding_seen()
            self.assertTrue(SettingsStore(path).onboarding_seen)

    def test_builtin_preset_cannot_be_deleted_or_overwritten(self):
        with tempfile.TemporaryDirectory() as td:
            store = SettingsStore(Path(td) / "settings.json")
            with self.assertRaises(ValueError):
                store.save_preset("Balanced", PdfPreset(80, "original"))
            with self.assertRaises(ValueError):
                store.delete_preset("Balanced")
            self.assertEqual(store.presets()["Balanced"], BUILTIN_PRESETS["Balanced"])


if __name__ == "__main__":
    unittest.main()
