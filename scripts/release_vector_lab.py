#!/usr/bin/env python3
"""Scoped certificate-verified FTPS release of the independent Vector Lab PWA.

No site-wide mirror, no deletes and no credential logging. Imports the site's
existing WinCred / verified-FTPS primitives. Source must be a validated,
committed deployment artifact. Exact-byte FTPS + HTTPS readback is required.
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
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
sys.path.insert(0,str(ROOT/"tools"))
from deploy_production import connect_ftps,close_ftp,read_windows_generic_credential,remote_join
from build_deployment import render_sitemap
BUILD=ROOT/"build/public_html"
VERSION="vector-lab-vtracer10"
def hash_bytes(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def git_bytes(commit:str,path:str)->bytes:
    if not commit or any(ch not in "0123456789abcdefABCDEF" for ch in commit) or len(commit)<8:
        raise RuntimeError("Expected Git base commit SHA is required")
    return subprocess.check_output(["git","show",f"{commit}:{path}"],cwd=ROOT)

def remote_read(ftp,remote:str)->bytes|None:
    b=io.BytesIO()
    try: ftp.retrbinary("RETR "+remote,b.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(("550","450")):return None
        raise
    return b.getvalue()

def ensure_parent(ftp,path:str):
    current=""
    for part in path.strip("/").split("/")[:-1]:
        current+="/"+part
        try:ftp.mkd(current)
        except ftplib.error_perm as exc:
            if not str(exc).startswith(("550","521")):raise

def https_read(base:str,relative:str,sha:str)->bytes:
    url=base.rstrip("/")+"/"+relative+"?v="+sha[:12]
    req=urllib.request.Request(url,headers={"User-Agent":"vector-lab-release/1.0","Cache-Control":"no-cache","Accept-Encoding":"identity"})
    with urllib.request.urlopen(req,timeout=30)as result:
        if result.status!=200:raise RuntimeError(relative+" HTTP status "+str(result.status))
        return result.read()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--base-commit",required=True)
    parser.add_argument("--ftps-host",default="sv210.cloudfree.ne.jp")
    parser.add_argument("--root",default="/cf278796.cloudfree.jp/public_html")
    parser.add_argument("--site-url",default="https://cf278796.cloudfree.jp")
    parser.add_argument("--credential-target",default="portfolio-cloudfree-ftps")
    opts=parser.parse_args()
    if not BUILD.is_dir():raise RuntimeError("Deploy artifact missing; run tools/build_deployment.py first")
    if not (ROOT/"tools/vector-lab/index.html").is_file():raise RuntimeError("Vector Lab source missing")
    remote_root=opts.root.rstrip("/")
    if remote_root!="/cf278796.cloudfree.jp/public_html":
        raise RuntimeError("Unrecognized production root")
    if opts.ftps_host!="sv210.cloudfree.ne.jp" or opts.site_url.rstrip("/")!="https://cf278796.cloudfree.jp":
        raise RuntimeError("Unrecognized deployment destination")
    files=sorted(p for p in (BUILD/"vector-lab").rglob("*")if p.is_file())
    if not files or len(files)>30:raise RuntimeError("Unexpected Vector Lab file count")
    payload={}
    for p in files:
        rel=p.relative_to(BUILD).as_posix()
        if p.is_symlink()or ".." in p.parts:raise RuntimeError("Unsafe app path")
        payload[rel]=p.read_bytes()
    for rel in ("index.html","sitemap.xml"):
        payload[rel]=(BUILD/rel).read_bytes()
    # Recognize the previous Git baseline, not an arbitrary remote root file.
    base_index=git_bytes(opts.base_commit,"index.html")
    old_seo=json.loads(git_bytes(opts.base_commit,"config/seo.json").decode("utf-8"))
    base_sitemap=render_sitemap(old_seo["origin"],tuple(old_seo["sitemapRoutes"])).encode("utf-8")
    print(f"SCOPED_PLAN app_assets={len(files)} total_bytes={sum(len(payload[k]) for k in payload if k.startswith('vector-lab/'))}")
    if not opts.apply:
        print("SCOPED_DRY_RUN_PASS (nothing uploaded)");return
    user,password=read_windows_generic_credential(opts.credential_target)
    ftp=None
    published=[]
    report={"schema":"vector-lab-scoped-release-v1","sourceCommit":subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip(),
      "baseCommit":opts.base_commit,"datetimeUTC":datetime.now(timezone.utc).isoformat(),
      "files":{},"rootStatus":"unknown","ftpsReadback":False,"httpsReadback":False}
    try:
        ftp=connect_ftps(opts.ftps_host,user,password)
        root_originals={}
        for rel,base in (("index.html",base_index),("sitemap.xml",base_sitemap)):
            raw=remote_read(ftp,remote_join(remote_root,rel))
            root_originals[rel]=raw
        root_ok=all(root_originals[rel] is not None and hash_bytes(root_originals[rel])==hash_bytes(base)
            for rel,base in (("index.html",base_index),("sitemap.xml",base_sitemap)))
        report["rootStatus"]="baseline-match" if root_ok else "skipped-drift"
        if root_ok:
            location=Path(os.environ["LOCALAPPDATA"])/"PortfolioSite"/"vector-lab-release-backups"/report["datetimeUTC"].replace(":","-")
            location.mkdir(parents=True,exist_ok=False)
            for rel,raw in root_originals.items():(location/rel).write_bytes(raw)
        for rel in list(sorted(k for k in payload if k.startswith("vector-lab/")))+(["index.html","sitemap.xml"]if root_ok else []):
            target=remote_join(remote_root,rel)
            data=payload[rel]
            existing=remote_read(ftp,target)
            if existing is not None and existing!=data and rel.startswith("vector-lab/"):
                raise RuntimeError("Refusing to overwrite unrelated Vector Lab path: "+rel)
            if existing!=data:
                ensure_parent(ftp,target)
                ftp.storbinary("STOR "+target,io.BytesIO(data),blocksize=65536)
                published.append(rel)
            fetched=remote_read(ftp,target)
            if fetched is None or hash_bytes(fetched)!=hash_bytes(data):
                raise RuntimeError("FTPS readback failed for "+rel)
            report["files"][rel]={"sha256":hash_bytes(data),"bytes":len(data),"changed":existing!=data}
        report["ftpsReadback"]=True
    finally:close_ftp(ftp)
    for rel,info in report["files"].items():
        live=https_read(opts.site_url,rel,info["sha256"])
        if hash_bytes(live)!=info["sha256"]:
            raise RuntimeError("HTTPS exact-byte mismatch: "+rel)
    report["httpsReadback"]=True
    private=Path(os.environ["LOCALAPPDATA"])/"PortfolioSite"/"vector-lab-release-receipt.json"
    private.parent.mkdir(parents=True,exist_ok=True)
    private.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"SCOPED_VECTOR_LAB_PASS files={len(report['files'])} uploaded={len(published)} ftps_readback=True https_readback=True root_status={report['rootStatus']}")
if __name__=="__main__":main()
