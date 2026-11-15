#!/usr/bin/env python3
"""Publish only /komorebi-town/ index.html and town-details.js with FTPS/HTTPS readback.

This script will not alter other sites, create directories, or run GitHub Actions.
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

SOURCE_DIR = "works/komorebi-town/public"
RELEASE_SCRIPT = "scripts/release_komorebi_3d_visual.py"
REMOTE_ROOT = "/cf278796.cloudfree.jp/public_html"
REMOTE_DIR = "komorebi-town"
SERVER = "sv210.cloudfree.ne.jp"
SITE = "https://cf278796.cloudfree.jp"
CREDENTIAL_TARGET = "portfolio-cloudfree-ftps"
# Canonical Git bytes of the last readback-verified initial 3D page.
PREVIOUS_HTML_SHA = "fced6b28e108220f2229b4937fcc24152ae26a36af0bd6dadbbc433c7ac81c37"
PREVIOUS_VISUAL_BLOB = "bca448bba1c7a2a96c5974c876d76626eeede4fc"
SOURCES = {
    "index.html": f"{SOURCE_DIR}/index.html",
    "town-details.js": f"{SOURCE_DIR}/town-details.js",
}


def git_bytes(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT)


def git(*args: str) -> str:
    return git_bytes(*args).decode("utf-8").strip()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_remote(ftp: ftplib.FTP_TLS, path: str) -> bytes | None:
    result = io.BytesIO()
    try:
        ftp.retrbinary("RETR " + path, result.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(("550", "450")):
            return None
        raise
    return result.getvalue()


def write_verified(ftp: ftplib.FTP_TLS, path: str, data: bytes) -> None:
    ftp.storbinary("STOR " + path, io.BytesIO(data), blocksize=65536)
    readback = read_remote(ftp, path)
    if readback is None or sha(readback) != sha(data):
        raise RuntimeError("FTPS readback mismatch: " + path)


def verify_https(filename: str, expected: bytes) -> None:
    url = f"{SITE}/{REMOTE_DIR}/{filename}?v={sha(expected)[:16]}"
    req = urllib.request.Request(url, headers={
        "Cache-Control": "no-cache", "Accept-Encoding": "identity",
        "User-Agent": "komorebi-3d-visual-release/1.0",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTPS readback returned {resp.status} for {filename}")
        published = resp.read()
    if sha(published) != sha(expected):
        raise RuntimeError("HTTPS byte mismatch: " + filename)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-main", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    head = git("rev-parse", "HEAD")
    if head != args.expected_main or git("branch", "--show-current") != "main":
        raise RuntimeError("Refusing to publish a non-reviewed main revision")
    scope = [*SOURCES.values(), RELEASE_SCRIPT, "config/deployment-map.json"]
    if git("status", "--porcelain", "--", *scope):
        raise RuntimeError("Scoped release sources are dirty")
    if any(not (ROOT / source).is_file() for source in scope):
        raise RuntimeError("Required scoped source missing from checkout")
    payload = {name: git_bytes("show", "HEAD:" + source) for name, source in SOURCES.items()}
    html = payload["index.html"]
    if not html.startswith(b"<!doctype html>") or b"three@0.169.0" not in html:
        raise RuntimeError("Three.js page gate failed")
    if b"town-details.js?v=20261115-3d-v3" not in html:
        raise RuntimeError("Versioned enhancement link is absent")
    if b"export function buildTownDetails" not in payload["town-details.js"]:
        raise RuntimeError("Enhancement export missing")
    mapping = json.loads((ROOT / "config/deployment-map.json").read_text(encoding="utf-8"))
    expected = {"id": "komorebi-town-preview", "sourceRoot": SOURCE_DIR, "productionRoot": REMOTE_DIR}
    if sum(entry == expected for entry in mapping.get("entries", [])) != 1:
        raise RuntimeError("Production mapping mismatch")
    print("KOMOREBI_3D_SCOPE_PASS " + json.dumps({"main": head,
        "assets": {name: sha(data) for name, data in payload.items()}}, ensure_ascii=False))
    if not args.apply:
        print("KOMOREBI_3D_SCOPED_DRY_RUN_PASS (nothing uploaded)")
        return
    if os.name != "nt":
        raise RuntimeError("Apply requires authorized Windows WinCred")
    user, password = read_windows_generic_credential(CREDENTIAL_TARGET)
    ftp = None
    updated_html = False
    old_html = None
    uploaded_js = False
    try:
        ftp = connect_ftps(SERVER, user, password)
        html_path = remote_join(REMOTE_ROOT, f"{REMOTE_DIR}/index.html")
        js_path = remote_join(REMOTE_ROOT, f"{REMOTE_DIR}/town-details.js")
        old_html = read_remote(ftp, html_path)
        old_js = read_remote(ftp, js_path)
        live_blob = subprocess.check_output(["git", "hash-object", "--stdin"],
            input=old_html).decode("ascii").strip() if old_html is not None else ""
        if old_html is None or (sha(old_html) not in {PREVIOUS_HTML_SHA, sha(html)}
            and live_blob != PREVIOUS_VISUAL_BLOB):
            raise RuntimeError("Live 3D HTML diverged from known reviewed versions")
        if old_js is not None and old_js != payload["town-details.js"]:
            raise RuntimeError("Live 3D JS differs; refusing overwrite")
        if old_js is None:
            uploaded_js = True
            write_verified(ftp, js_path, payload["town-details.js"])
        verify_https("town-details.js", payload["town-details.js"])
        if old_html != html:
            updated_html = True
            write_verified(ftp, html_path, html)
        verify_https("index.html", html)
    except Exception:
        if ftp is not None and updated_html and old_html is not None:
            try:
                write_verified(ftp, remote_join(REMOTE_ROOT, f"{REMOTE_DIR}/index.html"), old_html)
                print("KOMOREBI_3D_HTML_ROLLBACK_PASS")
            except Exception as rollback_error:
                print("KOMOREBI_3D_HTML_ROLLBACK_FAILED " + str(rollback_error), file=sys.stderr)
        raise
    finally:
        close_ftp(ftp)

    receipt = {
        "schema": "komorebi-3d-visual-scoped-release-v1", "main": head,
        "url": SITE + "/" + REMOTE_DIR + "/",
        "assets": {name: {"sha256": sha(data), "bytes": len(data), "ftpsReadback": True,
            "httpsReadback": True} for name, data in payload.items()},
        "htmlUploaded": updated_html, "jsUploaded": uploaded_js,
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
    }
    dest = Path(os.environ["LOCALAPPDATA"]) / "PortfolioSite" / "komorebi-town-3d-visual-release-receipt.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KOMOREBI_3D_VISUAL_RELEASE_PASS " + json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()
