#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config/holoscope-release.json"
SHA40 = re.compile(r"^[a-f0-9]{40}$")
RELEASE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{2,80}$")
EXPECTED_FALLBACK = {
    "articles", "events", "games", "generations", "home.json", "learning",
    "manifest.json", "members", "phrases", "redirects.json", "search", "series",
    "site.json", "slang", "stats", "streams",
}
EXPECTED_SIDECARS = {
    ("feeds", "feeds"), ("sitemap.xml", "sitemap.xml"), ("sitemaps", "sitemaps"),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_rel(value: object, label: str) -> PurePosixPath:
    if not isinstance(value, str) or not value:
        raise RuntimeError(f"{label} must be a non-empty path")
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise RuntimeError(f"{label} is unsafe: {value}")
    return path


def validate_holoscope_release() -> list[str]:
    failures: list[str] = []
    try:
        data = json.loads(CONFIG.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        return [f"cannot load {CONFIG.relative_to(ROOT)}: {exc}"]

    release_id = data.get("releaseId")
    verified_sha = data.get("verifiedCommitSha")
    if data.get("schemaVersion") != 1:
        failures.append("HoloScope release config schemaVersion must be 1")
    if not isinstance(release_id, str) or RELEASE_ID.fullmatch(release_id) is None:
        failures.append("HoloScope releaseId is invalid")
        return failures
    if not isinstance(verified_sha, str) or SHA40.fullmatch(verified_sha) is None:
        failures.append("HoloScope verifiedCommitSha is invalid")

    expected_pointer = f"services/holoscope/release/state/current-release.json"
    expected_release = f"services/holoscope/release/releases/{release_id}"
    if data.get("pointerSource") != expected_pointer:
        failures.append("HoloScope pointerSource is not canonical")
    if data.get("releaseSource") != expected_release:
        failures.append("HoloScope releaseSource is not canonical")
    if data.get("fallbackSource") != expected_release:
        failures.append("HoloScope fallbackSource must be the immutable release")
    if set(data.get("fallbackEntries", [])) != EXPECTED_FALLBACK:
        failures.append("HoloScope fallbackEntries do not match the reviewed allowlist")
    sidecars = data.get("sidecars", [])
    sidecar_pairs = {(item.get("source"), item.get("artifact")) for item in sidecars if isinstance(item, dict)}
    if sidecar_pairs != EXPECTED_SIDECARS or len(sidecars) != len(EXPECTED_SIDECARS):
        failures.append("HoloScope sidecars do not match the reviewed allowlist")

    pointer_path = ROOT / expected_pointer
    release_root = ROOT / expected_release
    manifest_path = release_root / "release-manifest.json"
    public_manifest = release_root / "manifest.json"
    if not pointer_path.is_file():
        failures.append("HoloScope current-release pointer is missing")
        return failures
    if not manifest_path.is_file() or not public_manifest.is_file():
        failures.append("HoloScope immutable release is incomplete")
        return failures

    try:
        pointer = json.loads(pointer_path.read_text(encoding="utf-8"))
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        failures.append(f"HoloScope release JSON is invalid: {exc}")
        return failures

    if pointer.get("releaseId") != release_id:
        failures.append("HoloScope pointer releaseId does not match config")
    if pointer.get("verifiedCommitSha") != verified_sha:
        failures.append("HoloScope pointer verifiedCommitSha does not match config")
    if pointer.get("manifestSha256") != sha256(manifest_path):
        failures.append("HoloScope pointer manifestSha256 does not match release manifest")
    if manifest.get("releaseId") != release_id:
        failures.append("HoloScope release manifest releaseId does not match config")
    if manifest.get("verifiedCommitSha") != verified_sha:
        failures.append("HoloScope release manifest verifiedCommitSha does not match config")

    listed = manifest.get("files")
    if not isinstance(listed, list):
        failures.append("HoloScope release manifest files must be an array")
        return failures

    expected_files: dict[str, dict] = {}
    for item in listed:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            failures.append("HoloScope release manifest contains an invalid file entry")
            continue
        rel = safe_rel(item["path"], "release manifest path").as_posix()
        if rel in expected_files:
            failures.append(f"HoloScope release manifest has duplicate path: {rel}")
            continue
        expected_files[rel] = item

    actual_files = {
        path.relative_to(release_root).as_posix(): path
        for path in release_root.rglob("*")
        if path.is_file() and path.name != "release-manifest.json"
    }
    if set(actual_files) != set(expected_files):
        failures.append("HoloScope release manifest inventory does not match the immutable release")
    for rel, path in actual_files.items():
        item = expected_files.get(rel)
        if item is None:
            continue
        if item.get("sha256") != sha256(path) or item.get("bytes") != path.stat().st_size:
            failures.append(f"HoloScope release checksum/size mismatch: {rel}")

    if (release_root / "data/operations").exists():
        failures.append("HoloScope release must not contain data/operations")
    return failures


def main() -> int:
    failures = validate_holoscope_release()
    if failures:
        for failure in failures:
            print(f"[FAIL] {failure}")
        return 1
    print("HoloScope reviewed release validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
