from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from s3_upload_audit import cli
from s3_upload_audit.core import AuditConfig, ProviderError
from s3_upload_audit.providers import default_runner


class FixtureProvider:
    def list_root_folders(self):
        return ["001_ALPHA"]

    def list_files(self, folder):
        return [
            "001_ALPHA/report_20260924.csv",
            "001_ALPHA/report_20260920.csv",
        ]


class CliTests(unittest.TestCase):
    def test_cli_writes_json_and_tsv(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            config = root / "config.json"
            targets = root / "targets.txt"
            out_tsv = root / "result.tsv"
            out_json = root / "result.json"
            config.write_text(json.dumps({
                "provider": "awscli",
                "executable": "aws",
                "profile": "readonly",
                "bucket": "example-bucket",
                "top_n": 1,
            }), encoding="utf-8")
            targets.write_text("ALPHA\nMISSING\n", encoding="utf-8")
            with patch("s3_upload_audit.cli.create_provider", return_value=FixtureProvider()):
                code = cli.main([
                    "--config", str(config),
                    "--targets", str(targets),
                    "--tsv", str(out_tsv),
                    "--json", str(out_json),
                    "--strict",
                ])
            self.assertEqual(code, 3)
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual(payload["summary"]["total_targets"], 2)
            self.assertEqual(payload["summary"]["matched_targets"], 1)
            self.assertEqual(payload["summary"]["problem_targets"], 1)
            self.assertIn("missing-folder", out_tsv.read_text(encoding="utf-8-sig"))

    def test_default_runner_timeout_is_bounded(self):
        with self.assertRaises(ProviderError):
            default_runner(
                [sys.executable, "-c", "import time; time.sleep(2)"],
                0.1,
            )


if __name__ == "__main__":
    unittest.main()
