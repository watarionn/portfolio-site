#!/usr/bin/env python3
"""Deploy only the approved /komorebi-town/index.html visual upgrade.

Gate on the previously verified production SHA-256; verify exact canonical Git
blob using FTPS and HTTPS. Restore the old HTML if any upload/verification fails.
"""
from __future__ import annotations

import argparse
import ftplib
import hashlib
import io
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from deploy_production import connect_ftps, close_ftp, read_windows_generic_credential, remote_join

SOURCE = "works/komorebi-town/public/index.html"
SCRIPT = "scripts/release_komorebi_town_visual.py"
REMOTE_ROOT = "/cf278796.cloudfree.jp/public_html"
RELATIVE = "komorebi-town/index.html"
SERVER = "sv210.cloudfree.ne.jp"
SITE = "https://cf278796.cloudfree.jp"
CREDENTIAL_TARGET = "portfolio-cloudfree-ftps"
# Initial 3D version, previously verified by both FTPS and HTTPS readback.
PREVIOUS_SHA = "fced6b28e108220f2229b4937fcc24152ae26a36af0bd6dadbbc433c7ac81c37"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_remote(ftp: ftplib.FTP_TLS, path: str) -> bytes | None:
    buffer = io.BytesIO()
    try:
        ftp.retrbinary("RETR " + path, buffer.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(("550", "450")):
            return None
        raise
    return buffer.getvalue()


def upload_and_check(ftp: ftplib.FTP_TLS, path: str, data: bytes) -> None:
    ftp.storbinary("STOR " + path, io.BytesIO(data), blocksize=65536)
    copied = read_remote(ftp, path)
    if copied is None or sha256(copied) != sha256(data):
        raise RuntimeError("FTPS readback differed from canonical source")


def https_check(data: bytes) -> None:
    digest = sha256(data)
    url = f"{SITE}/{RELATIVE}?v={digest[:16]}"
    request = urllib.request.Request(url, headers={
        "Cache-Control": "no-cache", "Accept-Encoding": "identity",
        "User-Agent": "komorebi-3d-scoped-visual-release/1.0"
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTPS returned {response.status}")
        actual = response.read()
    if sha256(actual) != digest:
        raise RuntimeError("HTTPS readback differed from canonical source")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-main", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    head = git("rev-parse", "HEAD")
    if head != args.expected_main or git("branch", "--show-current") != "main":
        raise RuntimeError("Release requires exact reviewed main commit")
    scope = [SOURCE, SCRIPT, "config/deployment-map.json"]
    if git("status", "--porcelain", "--", *scope):
        raise RuntimeError("Scoped files must be clean")
    for name in scope:
        if not (ROOT / name).is_file():
            raise RuntimeError("Required sparse-checkout file missing: " + name)
    # Use canonical Git bytes, never Windows worktree bytes subject to CRLF.
    source = subprocess.check_output(["git", "show", "HEAD:" + SOURCE], cwd=ROOT)
    for marker in [b"<!doctype html>", b"three@0.169.0", b"InstancedMesh", b"time-button", b"nearestTarget"]:
        if marker not in source:
            raise RuntimeError("Visual-upgrade source gate missing: " + repr(marker))
    deployment = json.loads((ROOT / "config" / "deployment-map.json").read_text(encoding="utf-8"))
    mapping = {"id": "komorebi-town-preview", "sourceRoot": "works/komorebi-town/public", "productionRoot": "komorebi-town"}
    if sum(item == mapping for item in deployment.get("entries", [])) != 1:
        raise RuntimeError("Production mapping differs from reviewed scope")
    digest = sha256(source)
    print(f"KOMOREBI_3D_VISUAL_SCOPE_PASS main={head} sha256={digest} bytes={len(source)}")
    if not args.apply:
        print("KOMOREBI_3D_VISUAL_DRY_RUN_PASS (no upload)")
        return
    if os.name != "nt":
        raise RuntimeError("Apply requires approved owner Windows WinCred")

    user, password = read_windows_generic_credential(CREDENTIAL_TARGET)
    ftp = None
    prior = None
    attempted = False
    remote = remote_join(REMOTE_ROOT, RELATIVE)
    try:
        ftp = connect_ftps(SERVER, user, password)
        prior = read_remote(ftp, remote)
        if prior is None or sha256(prior) not in {PREVIOUS_SHA, digest}:
            raise RuntimeError("Unknown production HTML version: refusing overwrite")
        if prior != source:
            attempted = True
            upload_and_check(ftp, remote, source)
        else:
            verified = read_remote(ftp, remote)
            if verified is None or sha256(verified) != digest:
                raise RuntimeError("Idempotent FTP readback mismatch")
        https_check(source)
    except Exception:
        if attempted and prior is not None and ftp is not None:
            try:
                upload_and_check(ftp, remote, prior)
                https_check(prior)
                print("KOMOREBI_3D_VISUAL_ROLLBACK_PASS")
            except Exception as rollback_error:
                print("KOMOREBI_3D_VISUAL_ROLLBACK_FAIL " + str(rollback_error), file=sys.stderr)
        raise
    finally:
        close_ftp(ftp)

    receipt = {
        "schema": "komorebi-3d-visual-scoped-release-v1", "main": head,
        "url": SITE + "/komorebi-town/", "sha256": digest,
        "bytes": len(source), "uploaded": attempted,
        "ftpsReadback": True, "httpsReadback": True,
        "verifiedUTC": datetime.now(timezone.utc).isoformat()
    }
    path = Path(os.environ["LOCALAPPDATA"]) / "PortfolioSite" / "komorebi-town-3d-visual-release-receipt.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KOMOREBI_3D_VISUAL_RELEASE_PASS " + json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()