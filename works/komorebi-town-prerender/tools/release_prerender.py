#!/usr/bin/env python3
"""One-directory-only FTPS release, with Git blobs and HTTPS exact-byte readback.

Safe to retry. No remote deletion, overwrites of unknown bytes, credentials in
output, GitHub Actions, or broad site deployment.
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

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'scripts'))
from deploy_production import connect_ftps,close_ftp,read_windows_generic_credential,remote_join

SRC='works/komorebi-town-prerender/public'
DEST='komorebi-town-prerender'
ROOT_REMOTE='/cf278796.cloudfree.jp/public_html'
SERVER='sv210.cloudfree.ne.jp'
SITE='https://cf278796.cloudfree.jp'
CREDENTIAL='portfolio-cloudfree-ftps'
THIS='works/komorebi-town-prerender/tools/release_prerender.py'
BAKER='works/komorebi-town-prerender/tools/bake_scene.py'
MAPPING='config/deployment-map.json'

def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT)

def digest(data):return hashlib.sha256(data).hexdigest()

def remote_read(ftp,path):
    dst=io.BytesIO()
    try:ftp.retrbinary('RETR '+path,dst.write)
    except ftplib.error_perm as exc:
        if str(exc).startswith(('550','450')):return None
        raise
    return dst.getvalue()

def make_dir(ftp,path,allow):
    if path not in allow:raise RuntimeError('Refusing directory outside scoped preview')
    try:ftp.mkd(path)
    except ftplib.error_perm as exc:
        # Existing dir error responses differ by FTP host. Verify via cwd.
        if not str(exc).startswith(('550','521')):raise
        prior=ftp.pwd()
        try:ftp.cwd(path)
        finally:ftp.cwd(prior)

def https_check(rel,data):
    url=f'{SITE}/{DEST}/{rel}?v={digest(data)[:14]}'
    req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity','User-Agent':'komorebi-prerender-scoped-release/1.0'})
    with urllib.request.urlopen(req,timeout=35) as response:
        if response.status!=200:raise RuntimeError('HTTPS not 200 for '+rel)
        live=response.read()
    if digest(live)!=digest(data):raise RuntimeError('HTTPS mismatch for '+rel)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--expected-main',required=True)
    parser.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    head=git('rev-parse','HEAD').decode().strip()
    if head!=args.expected_main or git('branch','--show-current').decode().strip()!='main':
        raise RuntimeError('Release requires exact main commit, not a work branch')
    manifest_raw=git('show',f'HEAD:{SRC}/assets/manifest.json')
    manifest=json.loads(manifest_raw)
    files=manifest.get('files',{})
    if manifest.get('schema')!=1 or len(files)!=12:raise RuntimeError('Unexpected manifest schema or asset count')
    mapping=json.loads(git('show',f'HEAD:{MAPPING}'))
    expected={'id':'komorebi-town-prerender-preview','sourceRoot':SRC,'productionRoot':DEST}
    if sum(item==expected for item in mapping.get('entries',[]))!=1:raise RuntimeError('Deployment mapping altered')
    scoped=[THIS,BAKER,MAPPING,f'{SRC}/index.html',f'{SRC}/assets/manifest.json']+[f'{SRC}/assets/{f}' for f in files]
    if git('status','--porcelain','--',*scoped):raise RuntimeError('Scoped files have uncommitted changes')
    payload={}
    for name,meta in files.items():
        if not name.endswith('.webp') or '/' in name or '\\' in name:raise RuntimeError('Unexpected asset path')
        content=git('show',f'HEAD:{SRC}/assets/{name}')
        if digest(content)!=meta['sha256'] or len(content)!=meta['bytes'] or content[:4]!=b'RIFF' or content[8:12]!=b'WEBP':
            raise RuntimeError('Asset does not match manifest: '+name)
        payload['assets/'+name]=content
    payload['assets/manifest.json']=manifest_raw
    html=git('show',f'HEAD:{SRC}/index.html')
    if not html.startswith(b'<!doctype html>') or b'const names=' not in html or b'drawWorld()' not in html:
        raise RuntimeError('Unexpected HTML source')
    payload['index.html']=html
    print('PRERENDER_SCOPE_PASS '+json.dumps({'main':head,'files':len(payload),'bytes':sum(map(len,payload.values())),'sha256':{k:digest(v) for k,v in payload.items()}},ensure_ascii=False))
    if not args.apply:
        print('PRERENDER_DRY_RUN_PASS (nothing uploaded)');return
    if os.name!='nt':raise RuntimeError('Use authorized owner Windows WinCred for apply')
    user,password=read_windows_generic_credential(CREDENTIAL)
    ftp=None
    uploads=[]
    try:
        ftp=connect_ftps(SERVER,user,password)
        destdir=remote_join(ROOT_REMOTE,DEST)
        make_dir(ftp,destdir,{destdir,remote_join(destdir,'assets')})
        make_dir(ftp,remote_join(destdir,'assets'),{destdir,remote_join(destdir,'assets')})
        # Images first, HTML last. Never overwrite unknown content.
        for rel,data in payload.items():
            path=remote_join(destdir,rel)
            old=remote_read(ftp,path)
            if old is not None and old!=data:raise RuntimeError('Refusing to overwrite unexpected preview file: '+rel)
            if old is None:
                ftp.storbinary('STOR '+path,io.BytesIO(data),blocksize=65536)
                uploads.append(rel)
            got=remote_read(ftp,path)
            if got is None or digest(got)!=digest(data):raise RuntimeError('FTPS readback mismatch: '+rel)
            https_check(rel,data)
    finally:
        close_ftp(ftp)
    receipt={'schema':'komorebi-prerender-scoped-release-v1','main':head,'url':SITE+'/'+DEST+'/','files':len(payload),'bytes':sum(map(len,payload.values())),'uploaded':uploads,'ftpsReadback':True,'httpsReadback':True,'verifiedUTC':datetime.now(timezone.utc).isoformat()}
    dst=Path(os.environ['LOCALAPPDATA'])/'PortfolioSite'/'komorebi-prerender-release-receipt.json'
    dst.parent.mkdir(parents=True,exist_ok=True)
    dst.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('KOMOREBI_PRERENDER_RELEASE_PASS '+json.dumps(receipt,ensure_ascii=False))

if __name__=='__main__':main()
