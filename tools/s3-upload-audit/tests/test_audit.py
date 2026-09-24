from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from s3_upload_audit.core import (
    AuditConfig,
    AuditError,
    TargetList,
    audit_targets,
    extract_date_from_filename,
    load_targets,
    rank_files,
    resolve_folders,
)
from s3_upload_audit.providers import AwsCliProvider, S3BrowserProvider


class FakeProvider:
    def __init__(self):
        self.root = ["001_ALPHA", "002_BETA", "003_BETA", "OTHER"]
        self.files = {
            "001_ALPHA": [
                "001_ALPHA/report_20260920.csv",
                "001_ALPHA/report_20260924.csv",
                "001_ALPHA/no_date.txt",
            ],
            "002_BETA": [],
            "003_BETA": ["003_BETA/beta_20261301.csv", "003_BETA/beta_20260923.csv"],
        }

    def list_root_folders(self):
        return self.root

    def list_files(self, folder):
        if folder == "BROKEN":
            raise RuntimeError("boom")
        return self.files.get(folder, [])


class CoreTests(unittest.TestCase):
    def cfg(self, **overrides):
        data = {
            "provider": "awscli",
            "executable": "aws",
            "bucket": "example-bucket",
            "profile": "read-only",
            "top_n": 1,
            "parallel": 2,
            "timeout_seconds": 10,
        }
        data.update(overrides)
        return AuditConfig.from_mapping(data)

    def test_config_rejects_credentials(self):
        with self.assertRaises(AuditError):
            AuditConfig.from_mapping({
                "provider": "awscli",
                "bucket": "x",
                "aws_access_key_id": "DO-NOT-STORE-THIS",
            })

    def test_config_rejects_unknown_key(self):
        with self.assertRaises(AuditError):
            self.cfg(arbitrary_command="rm")

    def test_target_loader_deduplicates_and_supports_cp932(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "targets.txt"
            p.write_bytes("ALPHA\nBETA\nALPHA\n".encode("cp932"))
            loaded = load_targets(p)
            self.assertEqual(loaded.targets, ("ALPHA", "BETA"))
            self.assertEqual(loaded.duplicates, ("ALPHA",))

    def test_valid_date_token_skips_invalid_token(self):
        value = extract_date_from_filename("x_20261301_y_20260924.csv")
        self.assertEqual(value.strftime("%Y%m%d"), "20260924")

    def test_resolve_folder_pattern(self):
        folders = resolve_folders(["001_ALPHA", "001_BETA", "ALPHA"], "ALPHA", r"^\d+_{target}$")
        self.assertEqual(folders, ["001_ALPHA"])

    def test_rank_files_dated_first(self):
        ranked, undated = rank_files([
            "a/no_date.txt", "a/x_20260920.csv", "a/x_20260924.csv"
        ], 2)
        self.assertEqual([r.filename for r in ranked], ["x_20260924.csv", "x_20260920.csv"])
        self.assertEqual(undated, 1)

    def test_audit_surfaces_missing_empty_and_multiple_matches(self):
        report = audit_targets(
            FakeProvider(),
            TargetList(("ALPHA", "BETA", "MISSING"), ()),
            self.cfg(),
        )
        statuses = [(r.target, r.status, r.resolved_folder) for r in report.rows]
        self.assertIn(("ALPHA", "ok", "001_ALPHA"), statuses)
        self.assertIn(("BETA", "no-files", "002_BETA"), statuses)
        self.assertIn(("BETA", "ok", "003_BETA"), statuses)
        self.assertIn(("MISSING", "missing-folder", ""), statuses)


class ProviderTests(unittest.TestCase):
    def test_s3browser_commands_are_read_only_list_commands(self):
        calls = []
        def runner(args, timeout):
            calls.append((list(args), timeout))
            if len(calls) == 1:
                return "001_ALPHA/\n002_BETA/\n"
            return "bucket/001_ALPHA/a_20260924.csv\n"
        cfg = AuditConfig.from_mapping({
            "provider": "s3browser",
            "executable": "s3browser-cli.exe",
            "account_name": "profile-name",
            "bucket": "example-bucket",
            "timeout_seconds": 9,
        })
        provider = S3BrowserProvider(cfg, runner)
        self.assertEqual(provider.list_root_folders(), ["001_ALPHA", "002_BETA"])
        self.assertEqual(provider.list_files("001_ALPHA"), ["bucket/001_ALPHA/a_20260924.csv"])
        for args, timeout in calls:
            self.assertEqual(args[1:3], ["/file", "list"])
            self.assertEqual(timeout, 9)

    def test_awscli_commands_are_s3api_list_only(self):
        calls = []
        def runner(args, timeout):
            calls.append(list(args))
            if "--delimiter" in args:
                return json.dumps(["001_ALPHA/", "002_BETA/"])
            return json.dumps(["001_ALPHA/a_20260924.csv"])
        cfg = AuditConfig.from_mapping({
            "provider": "awscli",
            "executable": "aws",
            "profile": "readonly",
            "bucket": "example-bucket",
        })
        provider = AwsCliProvider(cfg, runner)
        self.assertEqual(provider.list_root_folders(), ["001_ALPHA", "002_BETA"])
        self.assertEqual(provider.list_files("001_ALPHA"), ["001_ALPHA/a_20260924.csv"])
        for args in calls:
            self.assertIn("s3api", args)
            self.assertIn("list-objects-v2", args)
            self.assertNotIn("put-object", args)
            self.assertNotIn("delete-object", args)


if __name__ == "__main__":
    unittest.main()
