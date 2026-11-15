#!/usr/bin/env python3
"""Release only the newly created /komorebi-town-2d/ page via WinCred FTPS.

Fail closed on unknown destination contents; verify FTPS and HTTPS bytes.
No site-wide deployment, old-page overwrite, credentials in files, or deletion.
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

SOURCE = "works/komorebi-town-2d/public/index.html"
SCRIPT = "scripts/release_komorebi_town_2d.py"
RELATIVE = "komorebi-town-2d/index.html"
REMOTE_ROOT = "/cf278796.cloudfree.jp/public_html"
SERVER = "sv210.cloudfree.ne.jp"
SITE = "https://cf278796.cloudfree.jp"
CREDENTIAL_TARGET = "portfolio-cloudfree-ftps"
MAPPING = {"id":"komorebi-town-2d-preview","sourceRoot":"works/komorebi-town-2d/public","productionRoot":"komorebi-town-2d"}


def sha256(data:bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git(*args:str) -> str:
    return subprocess.check_output(["git",*args],cwd=ROOT,text=True).strip()


def get_remote(ftp:ftplib.FTP_TLS,path:str) -> bytes | None:
    output=io.BytesIO()
    try:
        ftp.retrbinary("RETR "+path,output.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(("550","450")):
            return None
        raise
    return output.getvalue()


def verify_http(data:bytes) -> None:
    url=SITE+"/"+RELATIVE+"?v="+sha256(data)[:16]
    req=urllib.request.Request(url,headers={
        "Cache-Control":"no-cache","Accept-Encoding":"identity",
        "User-Agent":"komorebi-2d-scoped-release/1.0"
    })
    with urllib.request.urlopen(req,timeout=30) as resp:
        if resp.status!=200:
            raise RuntimeError("HTTPS returned "+str(resp.status))
        live=resp.read()
    if sha256(live)!=sha256(data):
        raise RuntimeError("HTTPS exact-byte readback mismatch")


def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--expected-main",required=True)
    parser.add_argument("--apply",action="store_true")
    args=parser.parse_args()
    head=git("rev-parse","HEAD")
    if head!=args.expected_main or git("branch","--show-current")!="main":
        raise RuntimeError("Not the exact expected main commit on main branch")
    paths=(SOURCE,SCRIPT,"config/deployment-map.json")
    if git("status","--porcelain","--",*paths):
        raise RuntimeError("Scoped source or release config has uncommitted changes")
    for path in paths:
        if not (ROOT/path).is_file():
            raise RuntimeError("Required checkout file is missing: "+path)
    # Windows Git checkout may silently produce CRLF; use exact Git main blob.
    source=subprocess.check_output(["git","show","HEAD:"+SOURCE],cwd=ROOT)
    if not source.startswith(b"<!doctype html>") or b"__komorebi2dDiagnostics" not in source:
        raise RuntimeError("Invalid 2D game source")
    config=json.loads((ROOT/"config/deployment-map.json").read_text(encoding="utf-8"))
    if sum(item==MAPPING for item in config.get("entries",[]))!=1:
        raise RuntimeError("Missing or changed deployment mapping")
    digest=sha256(source)
    print("KOMOREBI_2D_SCOPE_PASS "+json.dumps({"main":head,"relative":RELATIVE,"sha256":digest,"bytes":len(source)}))
    if not args.apply:
        print("KOMOREBI_2D_DRY_RUN_PASS (no upload)")
        return
    if os.name!="nt":
        raise RuntimeError("Apply requires the authorized owner Windows Credential Manager")
    user,password=read_windows_generic_credential(CREDENTIAL_TARGET)
    remote=remote_join(REMOTE_ROOT,RELATIVE)
    directory=remote_join(REMOTE_ROOT,"komorebi-town-2d")
    ftp=None
    uploaded=False
    try:
        ftp=connect_ftps(SERVER,user,password)
        previous=get_remote(ftp,remote)
        if previous is not None and previous!=source:
            raise RuntimeError("Refusing to overwrite unknown existing 2D page")
        if previous is None:
            try:
                ftp.mkd(directory)
            except ftplib.error_perm as exc:
                if not str(exc).startswith(("550","521")):
                    raise
            ftp.storbinary("STOR "+remote,io.BytesIO(source),blocksize=65536)
            uploaded=True
        fetched=get_remote(ftp,remote)
        if fetched is None or sha256(fetched)!=digest:
            raise RuntimeError("FTPS readback hash mismatch")
    finally:
        close_ftp(ftp)
    verify_http(source)
    receipt={
        "schema":"komorebi-2d-scoped-release-v1",
        "main":head,"url":SITE+"/komorebi-town-2d/",
        "sha256":digest,"bytes":len(source),"uploaded":uploaded,
        "ftpsReadback":True,"httpsReadback":True,
        "verifiedUTC":datetime.now(timezone.utc).isoformat()
    }
    dest=Path(os.environ["LOCALAPPDATA"])/"PortfolioSite"/"komorebi-town-2d-release-receipt.json"
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KOMOREBI_2D_RELEASE_PASS "+json.dumps(receipt,ensure_ascii=False))


if __name__=="__main__":
    main()