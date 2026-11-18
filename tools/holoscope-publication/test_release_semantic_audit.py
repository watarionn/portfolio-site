"""Proof that same-count HoloScope releases are not blindly declared duplicate.

All fixtures are local, synthetic, do not use FTPS or owner resources, and
never exercise publication skip/deletion. Real Git source pairs are separate.
"""
from __future__ import annotations

from copy import deepcopy
import hashlib
import json
import unittest

import release_semantic_audit as audit


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"),
                      sort_keys=True).encode("utf-8")


def digest(value):
    return hashlib.sha256(value).hexdigest()


class SemanticAuditTests(unittest.TestCase):
    def setUp(self):
        self.ids = ["20261114-025813-auto-766", "20261114-030138-auto-766"]
        self.times = ["2026-11-14T02:58:50Z", "2026-11-14T03:02:00Z"]
        self.rss_times = ["Sat, 14 Nov 2026 02:58:50 +0000",
                          "Sat, 14 Nov 2026 03:02:00 +0000"]
        self.records = [
            {"streams/test.json": b'{"article":"stable","streamId":"test"}', "articles/index.json": b'{"articles":0}'},
            {"streams/test.json": b'{"article":"stable","streamId":"test"}', "articles/index.json": b'{"articles":0}'},
        ]
        for idx in range(2):
            for path in audit.FEEDS:
                self.records[idx][path] = (
                    "<rss><channel><title>HoloScope</title><lastBuildDate>" +
                    self.rss_times[idx] +
                    "</lastBuildDate><item>unchanged</item></channel></rss>"
                ).encode("utf-8")
            for path in audit.GENERATED_JSON:
                self.records[idx][path] = encoded({
                    "schemaVersion": "1.0.0",
                    "generatedAt": self.times[idx],
                    "counts": {"streams": 766},
                    "item": "unchanged"
                })
        self.make()

    def make(self):
        self.manifests = []
        self.evidence = []
        for idx, release_id in enumerate(self.ids):
            records = dict(self.records[idx])
            nested = {
                "schemaVersion": "1.0.0",
                "generatedAt": self.times[idx],
                "counts": {"streams": 766, "articles": 0},
                "files": [
                    {"path": p, "bytes": len(raw), "sha256": digest(raw)}
                    for p, raw in sorted(records.items())
                ],
            }
            records["manifest.json"] = encoded(nested)
            self.evidence.append({p: raw for p, raw in records.items()
                                  if p in audit.CHANGING})
            rows = [{"path": p, "bytes": len(raw), "sha256": digest(raw)}
                    for p, raw in sorted(records.items())]
            outer = {
                "schemaVersion": "1.0.0", "releaseId": release_id,
                "verifiedCommitSha": "a"*40, "checksReportSha256": "b"*64,
                "createdAt": self.times[idx], "files": rows,
            }
            self.manifests.append(encoded(outer))

    def compare(self):
        return audit.compare_release_semantics(
            self.manifests[0], self.manifests[1],
            self.evidence[0], self.evidence[1])

    def assert_hold(self, reason=None):
        report = self.compare()
        self.assertEqual(report["status"], "HOLD", report)
        if reason:
            self.assertEqual(report["reason"], reason)
        self.assertFalse(report["same_meaning_observed"])
        self.assertFalse(report["source_authenticated"])
        self.assertFalse(report["owner_authenticated"])
        self.assertFalse(report["ftps_connected"])
        self.assertFalse(report["live_release_verified"])
        self.assertFalse(report["deletion_authorized"])
        self.assertEqual(report["files_deleted"], 0)
        self.assertEqual(report["mutations"], 0)

    def test_timestamp_only_snapshots_equal_but_never_authorize_delete(self):
        report = self.compare()
        self.assertEqual(report["status"],
                         "SEMANTICALLY_EQUIVALENT_NO_DELETE_AUTHORITY")
        self.assertTrue(report["same_meaning_observed"])
        self.assertEqual(report["unchanged_file_hashes"], 2)
        self.assertEqual(report["volatile_fields_verified"], 9)
        self.assertFalse(report["source_authenticated"])
        self.assertFalse(report["owner_authenticated"])
        self.assertFalse(report["deletion_authorized"])
        self.assertEqual(report["files_deleted"], 0)

    def test_same_stream_count_but_article_json_changed_is_not_duplicate(self):
        self.records[1]["streams/test.json"] = b'{"article":"changed","streamId":"test"}'
        self.make()
        self.assert_hold("STABLE_SOURCE_CONTENT_CHANGED")

    def test_changed_feed_item_is_not_timestamp_only(self):
        self.records[1]["feeds/all.xml"] = self.records[1]["feeds/all.xml"].replace(
            b"<item>unchanged</item>", b"<item>new-content</item>")
        self.make()
        self.assert_hold("VOLATILE_NON_TIMESTAMP_CONTENT_CHANGED")

    def test_changed_statistics_are_not_timestamp_only(self):
        self.records[1]["stats/index.json"] = encoded({
            "schemaVersion":"1.0.0", "generatedAt":self.times[1],
            "counts":{"streams":765}, "item":"unchanged"})
        self.make()
        self.assert_hold("VOLATILE_NON_TIMESTAMP_CONTENT_CHANGED")

    def test_missing_or_extra_volatile_evidence_refused(self):
        self.evidence[0].pop("stats/members.json")
        self.assert_hold("VOLATILE_EVIDENCE_INCOMPLETE")
        self.make()
        self.evidence[0]["untrusted.json"] = b"hi"
        self.assert_hold("VOLATILE_EVIDENCE_INCOMPLETE")

    def test_tampered_volatile_blob_refused(self):
        self.evidence[1]["feeds/articles.xml"] += b"!"
        self.assert_hold("VOLATILE_BYTES_NOT_BOUND")

    def test_unsigned_hash_match_from_wrong_source_sha_refused(self):
        m = json.loads(self.manifests[1])
        m["verifiedCommitSha"] = "f"*40
        self.manifests[1] = encoded(m)
        self.assert_hold("SOURCE_OR_CHECKS_CHANGED")

    def test_changed_checks_report_digest_refused(self):
        m = json.loads(self.manifests[1])
        m["checksReportSha256"] = "0"*64
        self.manifests[1] = encoded(m)
        self.assert_hold("SOURCE_OR_CHECKS_CHANGED")

    def test_same_release_name_cannot_self_match(self):
        m = json.loads(self.manifests[1])
        m["releaseId"] = self.ids[0]
        self.manifests[1] = encoded(m)
        self.assert_hold("NOT_DISTINCT_RELEASES")

    def test_missing_payload_or_extra_payload_refused(self):
        m = json.loads(self.manifests[1])
        m["files"] = m["files"][:-1]
        self.manifests[1] = encoded(m)
        self.assert_hold("FILE_SET_CHANGED")

    def test_stale_nested_manifest_inventory_refused(self):
        nested = json.loads(self.evidence[1]["manifest.json"])
        nested["files"][0]["sha256"] = "f"*64
        modified = encoded(nested)
        self.evidence[1]["manifest.json"] = modified
        m = json.loads(self.manifests[1])
        for row in m["files"]:
            if row["path"] == "manifest.json":
                row["sha256"],row["bytes"] = digest(modified),len(modified)
        self.manifests[1] = encoded(m)
        self.assert_hold()

    def test_unsafe_payload_path_not_accepted(self):
        m = json.loads(self.manifests[1])
        m["files"][0]["path"] = "../escape.json"
        self.manifests[1] = encoded(m)
        self.assert_hold("INVALID_OR_UNTRUSTED_EVIDENCE")

    def test_duplicate_json_key_not_accepted(self):
        self.manifests[1] = b'{"schemaVersion":"1.0.0","schemaVersion":"1.0.0"}'
        self.assert_hold("INVALID_OR_UNTRUSTED_EVIDENCE")

    def test_invalid_generated_timestamp_not_accepted(self):
        j = json.loads(self.evidence[1]["stats/games.json"])
        j["generatedAt"] = "not a date"
        modified = encoded(j)
        self.records[1]["stats/games.json"] = modified
        self.make()
        self.assert_hold("INVALID_OR_UNTRUSTED_EVIDENCE")

    def test_invalid_rss_timestamp_not_accepted(self):
        self.records[1]["feeds/streams.xml"] = (
            self.records[1]["feeds/streams.xml"]
            .replace(self.rss_times[1].encode(), b"not-a-valid-date"))
        self.make()
        self.assert_hold("INVALID_OR_UNTRUSTED_EVIDENCE")

    def test_duplicate_rss_lastbuilddate_not_accepted(self):
        self.records[1]["feeds/all.xml"] += (
            b"<lastBuildDate>Sat, 14 Nov 2026 03:02:00 +0000</lastBuildDate>")
        self.make()
        self.assert_hold("INVALID_OR_UNTRUSTED_EVIDENCE")

    def test_missing_volatility_path_fail_closed(self):
        self.records[1].pop("operations/status.json")
        self.make()
        self.assert_hold("FILE_SET_CHANGED")

    def test_malformed_manifest_boolean_bytes_fail_closed(self):
        m = json.loads(self.manifests[1])
        m["files"][0]["bytes"] = True
        self.manifests[1] = encoded(m)
        self.assert_hold("INVALID_OR_UNTRUSTED_EVIDENCE")

    def test_no_ftps_or_publication_side_effect(self):
        import inspect
        src = inspect.getsource(audit)
        for token in ("ftplib", "subprocess", "socket", "urlopen",
                      "os.remove", "shutil.rmtree", "os.replace",
                      "os.unlink", "Popen(", "write_text", "write_bytes",
                      "REMOTE_DELETE", "release_status.php"):
            self.assertNotIn(token, src)


if __name__ == "__main__":
    unittest.main()
