from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
TARGET = HERE / "export_jev_geo_candidates.py"
spec = importlib.util.spec_from_file_location("export_jev_geo_candidates", TARGET)
assert spec is not None and spec.loader is not None
MOD = importlib.util.module_from_spec(spec)
spec.loader.exec_module(MOD)


class JevGeoAdvisoryTests(unittest.TestCase):
    def test_station_facts_keep_large_terminal_inside_one_geography(self):
        rows = [
            {
                "station_name": "東京",
                "station_reading": "トウキョウ",
                "latitude": "35.6812",
                "longitude": "139.7671",
                "line_names": "山手線/中央線",
            },
            {
                "station_name": "東京",
                "station_reading": "トウキョウ",
                "latitude": "35.6815",
                "longitude": "139.7673",
                "line_names": "東海道線",
            },
        ]
        facts = MOD.station_facts_from_rows("東京", rows)
        self.assertEqual(1, facts["reading_variant_count"])
        self.assertEqual(1, facts["distinct_geography_count"])
        self.assertEqual(3, facts["line_count"])

    def test_export_contract_is_zero_authority(self):
        original = MOD.fetch_station_facts
        try:
            MOD.fetch_station_facts = lambda name, api_base=MOD.DEFAULT_API_BASE: {
                "name": name,
                "reading": "テスト",
                "record_count": 1,
                "reading_variant_count": 1,
                "reading_variants": ["テスト"],
                "physical_location_count_150m": 1,
                "distinct_geography_count": 1,
                "line_count": 1,
                "line_names": ["テスト線"],
            }
            out = MOD.build_export(["A", "B"])
        finally:
            MOD.fetch_station_facts = original
        self.assertEqual("geo-discovery-jev-advisory-v1", out["contract"])
        self.assertEqual(2, len(out["candidates"]))
        self.assertTrue(all(v is False for v in out["authority"].values()))
        self.assertEqual("existing Geo API / MariaDB", out["source_truth"])


if __name__ == "__main__":
    unittest.main()
