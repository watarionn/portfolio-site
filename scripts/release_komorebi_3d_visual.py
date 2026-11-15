#!/usr/bin/env python3
"""Release only original Komorebi 3D scene plus new scenery; verify FTPS/HTTPS bytes.

Release sequence: art JS first, then HTML. On failure, restore both previous
assets in the same authorized FTPS session. No other production paths are touched.
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
DEST = "komorebi-town"
SOURCES = {
    "index.html": "works/komorebi-town/public/index.html",
    "scenery.js": "works/komorebi-town/public/scenery.js",
}
SCRIPT = "scripts/release_komorebi_3d_visual.py"
# SHA-256 of the readback-verified original 3D prototype. Only that HTML or
# an idempotent re-run of this exact release may be overwritten.
# Only this pair or a fully verified idempotent re-run may be updated.
PREVIOUS_HTML_SHA = "fced6b28e108220f2229b4937fcc24152ae26a36af0bd6dadbbc433c7ac81c37"



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
        "User-Agent": "komorebi-3d-scoped-visual-release/1.0"
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
    if b"three@0.169.0" not in payload["index.html"] or b"scenery.js?v=20261115-v1" not in payload["index.html"]:
        raise RuntimeError("3D scene extension linkage missing")
    if b"export function createScenery" not in payload["scenery.js"]:
        raise RuntimeError("Scenery module export missing")
    if b"const flowerBatches=" not in payload["index.html"]:
        raise RuntimeError("Mobile instancing optimization missing")
    mapping = json.loads((ROOT / "config" / "deployment-map.json").read_text(encoding="utf-8"))
    expected = {"id": "komorebi-town-preview", "sourceRoot": "works/komorebi-town/public", "productionRoot": DEST}
    if sum(entry == expected for entry in mapping.get("entries", [])) != 1:
        raise RuntimeError("Preview mapping differs from approved scope")
    print("SCENERY_SCOPE_PASS " + json.dumps({"main": head, "assets": {key: sha(value) for key, value in payload.items()}}, ensure_ascii=False))
    if not args.apply:
        print("SCENERY_SCOPED_DRY_RUN_PASS (no upload)")
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
        js_path = remote_join(REMOTE_ROOT, DEST + "/scenery.js")
        old_html = get_remote(ftp, html_path)
        old_js = get_remote(ftp, js_path)
        if old_html is None or sha(old_html) not in {PREVIOUS_HTML_SHA, sha(payload["index.html"])}:
            raise RuntimeError("Live HTML differs from the readback-verified prior version")
        if old_js is not None and sha(old_js) != sha(payload["scenery.js"]):
            raise RuntimeError("Live scenery JS differs; refusing to overwrite")
        if old_js != payload["scenery.js"]:
            js_uploaded = True  # Mark before upload to cover a partial write.
            upload(ftp, js_path, payload["scenery.js"])
        https_readback("scenery.js", payload["scenery.js"])
        if old_html != payload["index.html"]:
            html_uploaded = True
            upload(ftp, html_path, payload["index.html"])
        https_readback("index.html", payload["index.html"])
    except Exception:
        # Recover both files, not only HTML: the JS is also an overwrite now.
        if ftp is not None:
            if html_uploaded and old_html is not None:
                try:
                    upload(ftp, remote_join(REMOTE_ROOT, DEST + "/index.html"), old_html)
                    print("SCENERY_HTML_ROLLBACK_PASS")
                except Exception as rollback_error:
                    print("SCENERY_HTML_ROLLBACK_FAILED " + str(rollback_error), file=sys.stderr)
            if js_uploaded and old_js is not None:
                try:
                    upload(ftp, remote_join(REMOTE_ROOT, DEST + "/scenery.js"), old_js)
                    print("SCENERY_JS_ROLLBACK_PASS")
                except Exception as rollback_error:
                    print("SCENERY_JS_ROLLBACK_FAILED " + str(rollback_error), file=sys.stderr)
        raise
    finally:
        close_ftp(ftp)

    receipt = {
        "schema": "komorebi-3d-scenery-scoped-release-v1",
        "main": head,
        "url": HOST + "/" + DEST + "/",
        "assets": {key: {"sha256": sha(value), "bytes": len(value), "ftpsReadback": True, "httpsReadback": True} for key, value in payload.items()},
        "htmlUploaded": html_uploaded,
        "jsUploaded": js_uploaded,
        "verifiedUTC": datetime.now(timezone.utc).isoformat(),
    }
    dest = Path(os.environ["LOCALAPPDATA"]) / "PortfolioSite" / "komorebi-town-3d-scenery-release-receipt.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KOMOREBI_3D_SCENERY_RELEASE_PASS " + json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()