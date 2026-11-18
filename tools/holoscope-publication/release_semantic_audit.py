"""Read-only semantic comparison of two HoloScope full release snapshots.

This is a provenance-UNTRUSTED, in-memory audit, NOT a publication skip,
rollback selection, retention decision, FTPS reader, or deletion permission.
It may be used only after independently authenticating source material.
"""
from __future__ import annotations

from datetime import datetime
from email.utils import parsedate_to_datetime
import hashlib
import json
import re

SCHEMA = "holoscope-release-semantic-audit-source-only-v1"
AUTO = re.compile(r"20[0-9]{6}-[0-9]{6}-auto-[0-9]{1,7}\Z")
SHA40 = re.compile(r"[a-f0-9]{40}\Z")
SHA64 = re.compile(r"[a-f0-9]{64}\Z")
PATH = re.compile(r"[^\x00-\x1f\\]+\Z")
LAST_BUILD = re.compile(rb"<lastBuildDate>([^<>]{1,128})</lastBuildDate>")
FEEDS = frozenset({"feeds/all.xml", "feeds/articles.xml", "feeds/streams.xml"})
GENERATED_JSON = frozenset({
    "stats/index.json", "stats/games.json", "stats/learning.json",
    "stats/members.json", "operations/status.json",
})
CHANGING = FEEDS | GENERATED_JSON | {"manifest.json"}
MAX_MANIFEST_BYTES = 2_000_000
MAX_PAYLOAD_BYTES = 2_000_000
MAX_FILES = 3000


class EvidenceInvalid(ValueError):
    pass


def _result(reason: str, *, equivalent: bool = False,
            unchanged_files: int = 0, volatile_files: int = 0) -> dict:
    return {
        "schema": SCHEMA,
        "status": "SEMANTICALLY_EQUIVALENT_NO_DELETE_AUTHORITY"
                  if equivalent else "HOLD",
        "reason": reason,
        "same_meaning_observed": equivalent,
        "unchanged_file_hashes": unchanged_files,
        "volatile_fields_verified": volatile_files,
        "source_authenticated": False,
        "owner_authenticated": False,
        "ftps_connected": False,
        "live_release_verified": False,
        "deletion_authorized": False,
        "files_deleted": 0,
        "mutations": 0,
    }


def _unique(pairs):
    out = {}
    for k, v in pairs:
        if k in out:
            raise EvidenceInvalid("DUPLICATE_JSON_KEY")
        out[k] = v
    return out


def _json(raw: bytes, cap: int):
    if type(raw) is not bytes or not 0 < len(raw) <= cap:
        raise EvidenceInvalid("INVALID_DOCUMENT_BYTES")
    try:
        return json.loads(raw.decode("utf-8-sig"), object_pairs_hook=_unique)
    except (UnicodeError, ValueError, TypeError) as exc:
        raise EvidenceInvalid("INVALID_JSON_DOCUMENT") from exc


def _stamp(value) -> bool:
    if type(value) is not str or len(value) > 40:
        return False
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).tzinfo is not None
    except ValueError:
        return False


def _path(value) -> bool:
    return (type(value) is str and 1 <= len(value) <= 512
            and not value.startswith("/")
            and PATH.fullmatch(value) is not None
            and all(p not in ("", ".", "..") for p in value.split("/"))
            and value != "release-manifest.json")


def _file_rows(value):
    if type(value) is not list or not 10 <= len(value) <= MAX_FILES:
        raise EvidenceInvalid("INVALID_FILE_INVENTORY")
    rows = {}
    for row in value:
        if (type(row) is not dict or set(row) != {"path", "bytes", "sha256"}
                or not _path(row["path"]) or row["path"] in rows
                or type(row["bytes"]) is not int or not 0 <= row["bytes"] <= 30_000_000
                or type(row["sha256"]) is not str
                or SHA64.fullmatch(row["sha256"]) is None):
            raise EvidenceInvalid("INVALID_FILE_ROW")
        rows[row["path"]] = (row["bytes"], row["sha256"])
    return rows


def _release(raw: bytes):
    j = _json(raw, MAX_MANIFEST_BYTES)
    if (type(j) is not dict or
            set(j) != {"schemaVersion", "releaseId", "verifiedCommitSha",
                       "checksReportSha256", "createdAt", "files"} or
            j["schemaVersion"] != "1.0.0" or
            type(j["releaseId"]) is not str or
            AUTO.fullmatch(j["releaseId"]) is None or
            type(j["verifiedCommitSha"]) is not str or
            SHA40.fullmatch(j["verifiedCommitSha"]) is None or
            type(j["checksReportSha256"]) is not str or
            SHA64.fullmatch(j["checksReportSha256"]) is None or
            not _stamp(j["createdAt"])):
        raise EvidenceInvalid("INVALID_RELEASE_PROOF")
    return j, _file_rows(j["files"])


def _normalized(path: str, raw: bytes, manifest_rows: dict):
    if path in FEEDS:
        matches = list(LAST_BUILD.finditer(raw))
        if len(matches) != 1:
            raise EvidenceInvalid("RSS_TIMESTAMP_NOT_UNIQUE")
        try:
            date = parsedate_to_datetime(matches[0].group(1).decode("ascii"))
        except (ValueError, TypeError, UnicodeError) as exc:
            raise EvidenceInvalid("RSS_TIMESTAMP_INVALID") from exc
        if date.tzinfo is None:
            raise EvidenceInvalid("RSS_TIMESTAMP_WITHOUT_TZ")
        return LAST_BUILD.sub(b"<lastBuildDate>VOLATILE</lastBuildDate>", raw, count=1)
    j = _json(raw, MAX_PAYLOAD_BYTES)
    if type(j) is not dict or not _stamp(j.get("generatedAt")):
        raise EvidenceInvalid("GENERATED_TIMESTAMP_INVALID")
    j = dict(j)
    j.pop("generatedAt")
    if path == "manifest.json":
        child = _file_rows(j.get("files"))
        expected = {k: v for k, v in manifest_rows.items() if k != "manifest.json"}
        if child != expected:
            raise EvidenceInvalid("NESTED_MANIFEST_NOT_BOUND")
        j["files"] = [
            ({"path": k, "bytes": v[0], "sha256": "VOLATILE"}
             if k in FEEDS | GENERATED_JSON else
             {"path": k, "bytes": v[0], "sha256": v[1]})
            for k, v in sorted(child.items())
        ]
    return json.dumps(j, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode("ascii")


def compare_release_semantics(
    release_manifest_a: bytes, release_manifest_b: bytes,
    changing_bytes_a: dict[str, bytes], changing_bytes_b: dict[str, bytes],
) -> dict:
    """Compare supplied Git/source bytes only. NEVER consume as delete authority.

    All nine volatile files must be supplied for both immutable source releases.
    Valid provenance, real FTPS presence, PUBLISHED, current pointer, owner
    fixed action, signer/nonce and protected rollback set are NOT checked here.
    """
    try:
        a, files_a = _release(release_manifest_a)
        b, files_b = _release(release_manifest_b)
        if a["releaseId"] == b["releaseId"]:
            return _result("NOT_DISTINCT_RELEASES")
        if (a["verifiedCommitSha"] != b["verifiedCommitSha"] or
                a["checksReportSha256"] != b["checksReportSha256"]):
            return _result("SOURCE_OR_CHECKS_CHANGED")
        if set(files_a) != set(files_b):
            return _result("FILE_SET_CHANGED")
        if not CHANGING.issubset(files_a):
            return _result("REQUIRED_VOLATILE_FILES_ABSENT")
        stable = sorted(set(files_a) - CHANGING)
        if any(files_a[p] != files_b[p] for p in stable):
            return _result("STABLE_SOURCE_CONTENT_CHANGED")
        if (type(changing_bytes_a) is not dict or
                type(changing_bytes_b) is not dict or
                set(changing_bytes_a) != CHANGING or
                set(changing_bytes_b) != CHANGING):
            return _result("VOLATILE_EVIDENCE_INCOMPLETE")
        normalized = []
        for path in sorted(CHANGING):
            pair = []
            for provided, manifest in ((changing_bytes_a, files_a),
                                       (changing_bytes_b, files_b)):
                raw = provided[path]
                if (type(raw) is not bytes or
                        not 0 < len(raw) <= MAX_PAYLOAD_BYTES or
                        len(raw) != manifest[path][0] or
                        hashlib.sha256(raw).hexdigest() != manifest[path][1]):
                    return _result("VOLATILE_BYTES_NOT_BOUND")
                pair.append(_normalized(path, raw, manifest))
            normalized.append((path, pair[0] == pair[1]))
        if not all(same for _, same in normalized):
            return _result("VOLATILE_NON_TIMESTAMP_CONTENT_CHANGED")
        return _result("NONE", equivalent=True,
                       unchanged_files=len(stable),
                       volatile_files=len(CHANGING))
    except (EvidenceInvalid, ValueError, TypeError, OverflowError,
            UnicodeError, KeyError):
        return _result("INVALID_OR_UNTRUSTED_EVIDENCE")
