from __future__ import annotations

import unittest
from datetime import date
from pathlib import Path

from s3_upload_audit.core import AuditConfig, audit_targets
from s3_upload_audit.demo import load_demo


class Phase2Tests(unittest.TestCase):
    def test_demo_covers_dashboard_statuses(self):
        root = Path(__file__).resolve().parents[1]
        scenario = load_demo(root / "fixtures" / "demo_s3.json")
        report = audit_targets(
            scenario.provider,
            scenario.targets,
            scenario.config,
            reference_date=scenario.reference_date,
        )
        by_target = {}
        for row in report.rows:
            by_target.setdefault(row.target, set()).add(row.status)
        self.assertEqual(by_target["ALPHA"], {"ok"})
        self.assertEqual(by_target["BETA"], {"stale"})
        self.assertEqual(by_target["GAMMA"], {"no-files"})
        self.assertEqual(by_target["DELTA"], {"missing-folder"})
        self.assertEqual(by_target["EPSILON"], {"ok-undated"})
        self.assertEqual(by_target["ZETA"], {"provider-error"})
        self.assertEqual(report.stale_targets, 1)
        self.assertEqual(report.problem_targets, 4)

    def test_stale_threshold_is_optional(self):
        root = Path(__file__).resolve().parents[1]
        scenario = load_demo(root / "fixtures" / "demo_s3.json")
        cfg = AuditConfig.from_mapping({
            "provider": "awscli",
            "bucket": "demo",
            "top_n": 1,
        })
        report = audit_targets(
            scenario.provider,
            scenario.targets,
            cfg,
            reference_date=date(2026, 9, 24),
        )
        beta = next(r for r in report.rows if r.target == "BETA")
        self.assertEqual(beta.status, "ok")
        self.assertEqual(beta.age_days, 54)


if __name__ == "__main__":
    unittest.main()
