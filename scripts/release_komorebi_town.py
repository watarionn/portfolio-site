#!/usr/bin/env python3
"""Release only the new /komorebi-town/ HTML, with exact FTPS/HTTPS readback.

No site-wide uploads, remote deletion, or credential logging.
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
RELATIVE = "komorebi-town/index.html"
REMOTE_ROOT = "/cf278796.cloudfree.jp/public_html"
SERVER = "sv210.cloudfree.ne.jp"
SITE = "https://cf278796.cloudfree.jp"
CREDENTIAL_TARGET = "portfolio-cloudfree-ftps"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_remote(ftp: ftplib.FTP_TLS, path: str) -> bytes | None:
    output = io.BytesIO()
    try:
        ftp.retrbinary("RETR " + path, output.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(("550", "450")):
            return None
        raise
    return output.getvalue()


def ensure_new_directory(ftp: ftplib.FTP_TLS, path: str) -> None:
    # Only this exact new directory is eligible for creation.
    if path != remote_join(REMOTE_ROOT, "komorebi-town"):
        raise RuntimeError("Refusing to create a directory outside preview scope")
    try:
        ftp.mkd(path)
    except ftplib.error_perm as exc:
        if not str(exc).startswith(("550", "521")):
            raise


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-main", required=True, help="Exact merged main commit SHA")
    parser.add_argument("--apply", action="store_true", help="Perform the scoped FTPS upload")
    args = parser.parse_args()

    head = git("rev-parse", "HEAD")
    if args.expected_main != head or git("branch", "--show-current") != "main":
        raise RuntimeError("Checkout is not the expected main commit")
    if git("status", "--porcelain", "--", SOURCE, "config/deployment-map.json", "scripts/release_komorebi_town.py"):
        raise RuntimeError("Scoped source or deployment files have uncommitted modifications")

    source = (ROOT / SOURCE).read_bytes()
    committed = subprocess.check_output(["git", "show", "HEAD:" + SOURCE], cwd=ROOT)
    if source != committed:
        raise RuntimeError("Working source does not match the signed Git commit")
    if not source.startswith(b"<!doctype html>") or b"three@0.169.0" not in source:
        raise RuntimeError("Unexpected preview source")

    mapping = json.loads((ROOT / "config" / "deployment-map.json").read_text(encoding="utf-8"))
    expected = {"id": "komorebi-town-preview", "sourceRoot": "works/komorebi-town/public", "productionRoot": "komorebi-town"}
    if sum(entry == expected for entry in mapping.get("entries", [])) != 1:
        raise RuntimeError("Expected deployment mapping is missing or changed")
    digest = sha256(source)
    print(f"PREVIEW_SCOPE_PASS relative={RELATIVE} bytes={len(source)} sha256={digest} main={head}")

    if not args.apply:
        print("SCOPED_DRY_RUN_PASS (nothing uploaded)")
        return

    if os.name != "nt":
        raise RuntimeError("Apply requires the authorized Windows credential store")
    user, password = read_windows_generic_credential(CREDENTIAL_TARGET)
    remote = remote_join(REMOTE_ROOT, RELATIVE)
    ftp = None
    changed = False
    try:
        ftp = connect_ftps(SERVER, user, password)
        previous = read_remote(ftp, remote)
        if previous is not None and previous != source:
            raise RuntimeError("Refusing to overwrite different existing preview content")
        if previous is None:
            ensure_new_directory(ftp, remote.rsplit("/", 1)[0])
            ftp.storbinary("STOR " + remote, io.BytesIO(source), blocksize=65536)
            changed = True
        fetched = read_remote(ftp, remote)
        if fetched is None or sha256(fetched) != digest:
            raise RuntimeError("FTPS readback mismatch")
    finally:
        close_ftp(ftp)

    url = SITE + "/" + RELATIVE
    req = urllib.request.Request(
        url + "?v=" + digest[:12],
        headers={"Cache-Control": "no-cache", "Accept-Encoding": "identity", "User-Agent": "komorebi-town-release/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError("HTTPS returned " + str(response.status))
        published = response.read()
    if sha256(published) != digest:
        raise RuntimeError("HTTPS exact-byte readback mismatch")

    receipt = {
        "schema": "komorebi-town-scoped-release-v1",
        "sourceMainCommit": head,
        "url": SITE + "/komorebi-town/",
        "sha256": digest,
        "bytes": len(source),
        "uploaded": changed,
        "ftpsReadback": True,
        "httpsReadback": True,
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
    }
    dest = Path(os.environ["LOCALAPPDATA"]) / "PortfolioSite" / "komorebi-town-release-receipt.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KOMOREBI_TOWN_RELEASE_PASS " + json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()
