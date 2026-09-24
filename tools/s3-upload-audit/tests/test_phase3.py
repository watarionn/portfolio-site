from __future__ import annotations

import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from s3_upload_audit.core import AuditReport, AuditRow
from s3_upload_audit.history import AuditHistoryStore, compare_reports
from s3_upload_audit.settings import AppSettings, AuditPreset, BUILTIN_PRESETS


def report(rows):
    return AuditReport(rows=list(rows), total_targets=len({r.target for r in rows}), duplicate_targets=())


class SettingsTests(unittest.TestCase):
    def test_preset_round_trip_and_onboarding(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/"settings.json"
            s=AppSettings(path)
            self.assertFalse(s.onboarding_seen)
            s.mark_onboarding_seen()
            s.save_preset("Custom", AuditPreset(3,2,20,14,r"^\d+_{target}$"))
            s.set_paths("c.json","t.txt")
            reloaded=AppSettings(path)
            self.assertTrue(reloaded.onboarding_seen)
            self.assertEqual(reloaded.presets()["Custom"].top_n,3)
            self.assertEqual(reloaded.last_paths(),("c.json","t.txt"))

    def test_builtin_presets_are_protected(self):
        with tempfile.TemporaryDirectory() as td:
            s=AppSettings(Path(td)/"settings.json")
            with self.assertRaises(ValueError):
                s.save_preset("Monthly", AuditPreset())
            with self.assertRaises(ValueError):
                s.delete_preset("Monthly")
            self.assertEqual(s.presets()["Monthly"],BUILTIN_PRESETS["Monthly"])


class HistoryTests(unittest.TestCase):
    def test_history_round_trip_and_limit(self):
        with tempfile.TemporaryDirectory() as td:
            store=AuditHistoryStore(Path(td)/"history.json",max_entries=3)
            for day in range(1,6):
                store.save_report(
                    report([AuditRow("A","ok",file_name=f"a{day}.csv")]),
                    "demo",
                    timestamp=datetime(2026,9,day,tzinfo=timezone.utc),
                )
            entries=store.list_entries()
            self.assertEqual(len(entries),3)
            self.assertEqual(entries[0].report.rows[0].file_name,"a3.csv")
            self.assertEqual(entries[-1].report.rows[0].file_name,"a5.csv")

    def test_compare_new_problem_recovered_changed_and_targets(self):
        previous=report([
            AuditRow("A","ok",file_name="a1.csv",date_in_filename="2026/09/20"),
            AuditRow("B","stale",file_name="b1.csv",date_in_filename="2026/08/01"),
            AuditRow("C","ok",file_name="c1.csv",date_in_filename="2026/09/20"),
            AuditRow("OLD","ok",file_name="old.csv"),
        ])
        current=report([
            AuditRow("A","stale",file_name="a1.csv",date_in_filename="2026/09/20"),
            AuditRow("B","ok",file_name="b2.csv",date_in_filename="2026/09/24"),
            AuditRow("C","ok",file_name="c2.csv",date_in_filename="2026/09/24"),
            AuditRow("NEW","ok",file_name="new.csv"),
        ])
        states={d.target:d.state for d in compare_reports(previous,current)}
        self.assertEqual(states["A"],"new-problem")
        self.assertEqual(states["B"],"recovered")
        self.assertEqual(states["C"],"changed")
        self.assertEqual(states["NEW"],"new-target")
        self.assertEqual(states["OLD"],"removed-target")

    def test_clear_history(self):
        with tempfile.TemporaryDirectory() as td:
            store=AuditHistoryStore(Path(td)/"history.json")
            store.save_report(report([AuditRow("A","ok")]),"demo")
            self.assertTrue(store.path.exists())
            store.clear()
            self.assertFalse(store.path.exists())


if __name__=="__main__":
    unittest.main()
