"""Closed article -> validated release -> GitHub -> Cloudfree -> live verification."""
from __future__ import annotations
import datetime as dt
import hashlib
import importlib.util
import json
import msvcrt
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / "runtime"
PORT = Path(r"C:\Users\watar\Documents\GitHub\portfolio-site")
TARGET = Path(r"C:\Work\Projects\HoloScope_ホロライブEN観測所\cf278796-cloudfree-site-publish-20261005")
SCRIPTS = TARGET / "holoscope" / "scripts"
CONTENT = TARGET / "holoscope" / "content"
STATE = PORT / "services" / "holoscope" / "release" / "state" / "current-release.json"
CONFIG = PORT / "config" / "holoscope-release.json"
RELEASES = PORT / "services" / "holoscope" / "release" / "releases"
STAGING = RUNTIME / "automatic-release"
URL = "https://cf278796.cloudfree.jp"
DEPLOY_MODULE = PORT / "scripts" / "deploy_production.py"
RECEIPTS = ROOT / "publication-receipts"


def call(args, cwd=None, timeout=3600):
    p = subprocess.run([str(x) for x in args], cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout, shell=False)
    if p.returncode:
        raise RuntimeError(f"command failed rc={p.returncode}: {args[0]}: {p.stderr[-1500:]} {p.stdout[-500:]}")
    return p.stdout


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def deploy_and_verify(slugs, expected):
    spec = importlib.util.spec_from_file_location("holoscope_deployer", DEPLOY_MODULE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.BUILD_ROOT = PORT / "build" / "public_html" / "holoscope"
    user, password = module.read_windows_generic_credential("portfolio-cloudfree-ftps")
    module.upload_tree("sv210.cloudfree.ne.jp", user, password, "/cf278796.cloudfree.jp/public_html/holoscope", reconnect_every=40, max_attempts=8)
    status, body = module.http_get(URL + "/holoscope/streams/")
    if status != 200 or f"{expected}件".encode() not in body:
        raise RuntimeError(f"live stream count verification failed: {status}")
    for slug in slugs:
        status, body = module.http_get(URL + "/holoscope/streams/" + slug + "/")
        if status != 200 or len(body) < 500 or b"fatal error" in body.lower():
            raise RuntimeError(f"live article verification failed: {slug}, HTTP {status}")


def run():
    import publication_gate
    markers = sorted((publication_gate.SPOOL / "editorial-closure").glob("batch-*.json"))
    approved = [m.stem for m in markers if publication_gate.check(m.stem)["eligible"]]
    if not approved:
        return {"status": "NO_ELIGIBLE_BATCHES"}
    before = {p.name for p in (CONTENT / "streams").iterdir() if p.is_dir()}
    call([sys.executable, RUNTIME / "publish_closed_batches.py"])
    new_ids = sorted({p.name for p in (CONTENT / "streams").iterdir() if p.is_dir()} - before)
    if not new_ids:
        return {"status": "NO_NEW_PUBLISHABLE_ARTICLES", "eligible_batches": approved}
    slugs = [read(CONTENT / "streams" / vid / "metadata.json")["slug"] for vid in new_ids]
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    work = STAGING / stamp
    work.mkdir(parents=True)
    db, public = work / "holoscope.sqlite", work / "public"
    report, checks = work / "build.json", work / "checks.json"
    call([sys.executable, SCRIPTS / "run_phase1.py", "--content-dir", CONTENT, "--database", db, "--public-export", public, "--report", report])
    call([sys.executable, SCRIPTS / "phase6_checks.py", public, "--database", db, "--report", checks])
    check = read(checks)
    if check.get("status") != "PASS" or check.get("deploymentBlocked") is not False:
        raise RuntimeError("public checks did not pass")
    count = read(public / "manifest.json")["counts"]["streams"]
    source_sha = call(["git", "-C", str(publication_gate.CONFIG["holoscope_repo"]), "rev-parse", "HEAD"]).strip()
    release_id = f"{stamp}-auto-{count}"
    pointer_tmp = work / "current-release.json"
    call([sys.executable, SCRIPTS / "build_release.py", "--public-export", public, "--release-root", work / "releases", "--release-id", release_id, "--pointer", pointer_tmp, "--commit-sha", source_sha, "--checks-report", checks, "--no-activate"])
    source = work / "releases" / release_id
    manifest = read(source / "release-manifest.json")
    for item in manifest["files"]:
        if sha(source / item["path"]) != item["sha256"]:
            raise RuntimeError("release checksum mismatch")
    shutil.copytree(source, RELEASES / release_id)
    config = read(CONFIG)
    config["releaseId"] = release_id
    config["verifiedCommitSha"] = source_sha
    config["releaseSource"] = f"services/holoscope/release/releases/{release_id}"
    config["fallbackSource"] = config["releaseSource"]
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    pointer = read(STATE)
    pointer.update({"releaseId": release_id, "verifiedCommitSha": source_sha, "manifestSha256": sha(source / "release-manifest.json")})
    STATE.write_text(json.dumps(pointer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    call([sys.executable, PORT / "tools" / "build_deployment.py"])
    call(["git", "-C", PORT, "add", "config/holoscope-release.json", "services/holoscope/release/state/current-release.json", f"services/holoscope/release/releases/{release_id}"])
    call(["git", "-C", PORT, "commit", "-m", f"Publish HoloScope {len(new_ids)} reviewed articles ({release_id})"])
    call(["git", "-C", PORT, "fetch", "origin", "main"])
    call(["git", "-C", PORT, "rebase", "origin/main"])
    call([sys.executable, PORT / "tools" / "build_deployment.py"])
    call(["git", "-C", PORT, "push", "origin", "main"])
    deploy_and_verify(slugs, count)
    RECEIPTS.mkdir(exist_ok=True)
    receipt = {"status": "PUBLISHED", "release": release_id, "count": count, "articles": dict(zip(new_ids, slugs)), "source_sha": source_sha}
    (RECEIPTS / (release_id + ".json")).write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding="utf-8")
    return receipt


if __name__ == "__main__":
    lock_path = ROOT / "publication-auto.lock"
    with lock_path.open("a+b") as lock:
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            print('{"status":"ALREADY_RUNNING"}')
            sys.exit(0)
        try:
            print(json.dumps(run(), ensure_ascii=False))
        except Exception as exc:
            print(json.dumps({"status":"FAILED_RETRYABLE","error":str(exc)},ensure_ascii=False),file=sys.stderr)
            sys.exit(1)
