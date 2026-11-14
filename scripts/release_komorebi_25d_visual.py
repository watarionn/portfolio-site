#!/usr/bin/env python3
"""Publish only Komorebi 2.5D visual assets; verify main, FTPS and HTTPS bytes.

Release sequence: art JS first, then HTML. A failed HTML release restores the old
HTML in the same authorized FTPS session. No other production paths are touched.
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

REMOTE_ROOT = "/cf278796.cloudfree.jp/public_html"
FTPS_HOST = "sv210.cloudfree.ne.jp"
HOST = "https://cf278796.cloudfree.jp"
CRED = "portfolio-cloudfree-ftps"
DEST = "komorebi-town-25d"
SOURCES = {
    "index.html": "works/komorebi-town-25d/public/index.html",
    "art-layer.js": "works/komorebi-town-25d/public/art-layer.js",
}
SCRIPT = "scripts/release_komorebi_25d_visual.py"
# SHA-256 of the previously deployed, readback-verified prototype. This is the
# only old page version this one-time upgrade may overwrite.
PREVIOUS_HTML_SHA = "d5bf76d3736ac3273669722a17e123f02e81540e590e42d84a2132ac6743ab85"


def git_bytes(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT)


def git(*args: str) -> str:
    return git_bytes(*args).decode("utf-8").strip()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def get_remote(ftp: ftplib.FTP_TLS, path: str) -> bytes | None:
    output = io.BytesIO()
    try:
        ftp.retrbinary("RETR " + path, output.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(("550", "450")):
            return None
        raise
    return output.getvalue()


def upload(ftp: ftplib.FTP_TLS, path: str, data: bytes) -> None:
    ftp.storbinary("STOR " + path, io.BytesIO(data), blocksize=65536)
    readback = get_remote(ftp, path)
    if readback is None or sha(readback) != sha(data):
        raise RuntimeError("FTPS readback SHA mismatch for " + path)


def https_readback(name: str, data: bytes) -> None:
    url = f"{HOST}/{DEST}/{name}?v={sha(data)[:16]}"
    req = urllib.request.Request(url, headers={
        "Cache-Control": "no-cache", "Accept-Encoding": "identity",
        "User-Agent": "komorebi-25d-scoped-visual-release/1.0"
    })
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTPS {name} returned {response.status}")
        published = response.read()
    if sha(published) != sha(data):
        raise RuntimeError(f"HTTPS exact-byte readback mismatch: {name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-main", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    head = git("rev-parse", "HEAD")
    if head != args.expected_main or git("branch", "--show-current") != "main":
        raise RuntimeError("Not the exact reviewed main commit on main branch")
    scoped = list(SOURCES.values()) + [SCRIPT, "config/deployment-map.json"]
    if git("status", "--porcelain", "--", *scoped):
        raise RuntimeError("Scoped release files have uncommitted modifications")
    for source in scoped:
        if not (ROOT / source).is_file():
            raise RuntimeError("Release file missing from checkout: " + source)
    # Use canonical Git blobs, not Windows checkout bytes (CRLF may differ).
    payload = {name: git_bytes("show", "HEAD:" + source) for name, source in SOURCES.items()}
    if not payload["index.html"].startswith(b"<!doctype html>"):
        raise RuntimeError("HTML source gate failed")
    if b'<script src="./art-layer.js"></script>' not in payload["index.html"]:
        raise RuntimeError("Art layer script linkage missing")
    if b"window.KomorebiArt" not in payload["art-layer.js"]:
        raise RuntimeError("Art layer export gate failed")
    mapping = json.loads((ROOT / "config" / "deployment-map.json").read_text(encoding="utf-8"))
    expected = {"id": "komorebi-town-25d-preview", "sourceRoot": "works/komorebi-town-25d/public", "productionRoot": DEST}
    if sum(entry == expected for entry in mapping.get("entries", [])) != 1:
        raise RuntimeError("Preview mapping differs from approved scope")
    print("VISUAL_SCOPE_PASS " + json.dumps({"main": head, "assets": {key: sha(value) for key, value in payload.items()}}, ensure_ascii=False))
    if not args.apply:
        print("VISUAL_SCOPED_DRY_RUN_PASS (no upload)")
        return
    if os.name != "nt":
        raise RuntimeError("Apply requires owner Windows WinCred, never command-line credentials")

    user, password = read_windows_generic_credential(CRED)
    ftp = None
    old_html = None
    html_uploaded = False
    js_uploaded = False
    try:
        ftp = connect_ftps(FTPS_HOST, user, password)
        html_path = remote_join(REMOTE_ROOT, DEST + "/index.html")
        js_path = remote_join(REMOTE_ROOT, DEST + "/art-layer.js")
        old_html = get_remote(ftp, html_path)
        old_js = get_remote(ftp, js_path)
        if old_html is None or sha(old_html) not in {PREVIOUS_HTML_SHA, sha(payload["index.html"])}:
            raise RuntimeError("Live HTML is not the known verified prototype; refusing overwrite")
        if old_js is not None and sha(old_js) != sha(payload["art-layer.js"]):
            raise RuntimeError("Live art-layer.js differs; refusing overwrite")
        if old_js is None:
            upload(ftp, js_path, payload["art-layer.js"])
            js_uploaded = True
        else:
            upload_readback = get_remote(ftp, js_path)
            if upload_readback is None or sha(upload_readback) != sha(payload["art-layer.js"]):
                raise RuntimeError("Existing live art JS readback mismatch")
        https_readback("art-layer.js", payload["art-layer.js"])
        if old_html != payload["index.html"]:
            html_uploaded = True
            upload(ftp, html_path, payload["index.html"])
        https_readback("index.html", payload["index.html"])
    except Exception:
        if ftp is not None and html_uploaded and old_html is not None:
            try:
                upload(ftp, remote_join(REMOTE_ROOT, DEST + "/index.html"), old_html)
                print("VISUAL_HTML_ROLLBACK_PASS")
            except Exception as rollback_error:
                print("VISUAL_HTML_ROLLBACK_FAILED " + str(rollback_error), file=sys.stderr)
        raise
    finally:
        close_ftp(ftp)

    receipt = {
        "schema": "komorebi-25d-visual-scoped-release-v1",
        "main": head,
        "url": HOST + "/" + DEST + "/",
        "assets": {key: {"sha256": sha(value), "bytes": len(value), "ftpsReadback": True, "httpsReadback": True} for key, value in payload.items()},
        "htmlUploaded": html_uploaded,
        "jsUploaded": js_uploaded,
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
    }
    dest = Path(os.environ["LOCALAPPDATA"]) / "PortfolioSite" / "komorebi-town-25d-visual-release-receipt.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KOMOREBI_25D_VISUAL_RELEASE_PASS " + json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()