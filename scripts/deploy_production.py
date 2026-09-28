from __future__ import annotations

import argparse
import ftplib
import json
import os
import posixpath
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
BUILD_ROOT = ROOT / "build" / "public_html"
MAPPING_PATH = ROOT / "config" / "deployment-map.json"
REQUIRED_ENV = ("FTP_HOST", "FTP_USER", "FTP_PASSWORD", "FTP_PATH", "SITE_URL")
EXCLUDED_NAMES = {"config.php", "user.ini", "admin.local.php"}


def clean_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if "\n" in value or "\r" in value:
        raise SystemExit(f"{name} must be a single line")
    return value


def normalize_host(value: str) -> str:
    host = value
    for prefix in ("ftp://", "ftps://"):
        if host.lower().startswith(prefix):
            host = host[len(prefix):]
            break
    return host.rstrip("/")


def normalize_remote_root(value: str) -> str:
    remote = value or "/"
    if not remote.startswith("/"):
        remote = "/" + remote
    return remote.rstrip("/") or "/"


def load_retired_paths() -> list[str]:
    data = json.loads(MAPPING_PATH.read_text(encoding="utf-8"))
    retired = data.get("retiredRemotePaths", [])
    if not isinstance(retired, list):
        raise SystemExit("retiredRemotePaths must be an array")
    result: list[str] = []
    for index, value in enumerate(retired):
        if not isinstance(value, str) or not value:
            raise SystemExit(f"retiredRemotePaths[{index}] must be a non-empty string")
        path = PurePosixPath(value)
        if path.is_absolute() or "." in path.parts or ".." in path.parts:
            raise SystemExit(f"unsafe retired remote path: {value}")
        result.append(path.as_posix())
    return result


def preflight(require_credentials: bool = False) -> None:
    if not BUILD_ROOT.is_dir():
        raise SystemExit("build/public_html is missing; run tools/build_deployment.py first")
    load_retired_paths()
    if require_credentials:
        missing = [name for name in REQUIRED_ENV if not clean_env(name)]
        if missing:
            raise SystemExit("Missing local deployment environment variables: " + ", ".join(missing))
    print("LOCAL_DEPLOY_PREFLIGHT_PASS")


def ensure_remote_dir(ftp: ftplib.FTP_TLS, remote_dir: str) -> None:
    if remote_dir in ("", "/"):
        return
    current = ""
    for part in PurePosixPath(remote_dir).parts:
        if part == "/":
            current = "/"
            continue
        current = posixpath.join(current, part)
        try:
            ftp.mkd(current)
        except ftplib.error_perm as exc:
            if not str(exc).startswith("550"):
                raise


def remote_join(root: str, relative: str) -> str:
    if root == "/":
        return "/" + relative.lstrip("/")
    return root.rstrip("/") + "/" + relative.lstrip("/")


def upload_tree(ftp: ftplib.FTP_TLS, remote_root: str) -> int:
    uploaded = 0
    for local in sorted(BUILD_ROOT.rglob("*")):
        if not local.is_file() or local.name in EXCLUDED_NAMES:
            continue
        relative = local.relative_to(BUILD_ROOT).as_posix()
        remote = remote_join(remote_root, relative)
        ensure_remote_dir(ftp, posixpath.dirname(remote))
        with local.open("rb") as handle:
            ftp.storbinary(f"STOR {remote}", handle)
        uploaded += 1
    return uploaded


def remove_remote_tree(ftp: ftplib.FTP_TLS, remote_path: str) -> None:
    try:
        entries = ftp.nlst(remote_path)
    except ftplib.error_perm:
        try:
            ftp.delete(remote_path)
        except ftplib.error_perm:
            pass
        return

    children = [item for item in entries if item.rstrip("/") != remote_path.rstrip("/")]
    if not children:
        try:
            ftp.delete(remote_path)
            return
        except ftplib.error_perm:
            try:
                ftp.rmd(remote_path)
            except ftplib.error_perm:
                pass
            return

    for child in children:
        try:
            ftp.delete(child)
        except ftplib.error_perm:
            remove_remote_tree(ftp, child)
    try:
        ftp.rmd(remote_path)
    except ftplib.error_perm:
        pass


def http_get(url: str) -> tuple[int, bytes]:
    request = urllib.request.Request(url, headers={"User-Agent": "portfolio-local-deploy/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return int(response.status), response.read()
    except urllib.error.HTTPError as exc:
        return int(exc.code), exc.read()


def verify_site(site_url: str) -> None:
    base = site_url.rstrip("/")
    for path in ("/", "/portfolio-city/", "/holoscope/", "/SHISHA/"):
        status, body = http_get(base + path)
        if status != 200 or not body:
            raise SystemExit(f"Published page verification failed: {path} HTTP {status}")
        lowered = body.lower()
        if any(marker in lowered for marker in (b"fatal error", b"parse error", b"uncaught error", b"uncaught exception")):
            raise SystemExit(f"Published page contains failure signature: {path}")

    status, body = http_get(base + "/__portfolio_missing_page_probe_404__")
    if status != 404 or not body or "頁不在".encode("utf-8") not in body:
        raise SystemExit(f"Root 404 verification failed: HTTP {status}")

    for path in ("/CHARACTER/character-index.html", "/HOLOCA/scraper_runner.php", "/HOLOCA/ability_repair.php"):
        status, _ = http_get(base + path)
        if status not in (403, 404, 410):
            raise SystemExit(f"Retired path remains reachable: {path} HTTP {status}")


def deploy() -> None:
    preflight(require_credentials=True)
    host = normalize_host(clean_env("FTP_HOST"))
    user = clean_env("FTP_USER")
    password = clean_env("FTP_PASSWORD")
    remote_root = normalize_remote_root(clean_env("FTP_PATH"))
    site_url = clean_env("SITE_URL")

    context = ssl.create_default_context()
    with ftplib.FTP_TLS(context=context, timeout=45) as ftp:
        ftp.connect(host)
        ftp.login(user, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        uploaded = upload_tree(ftp, remote_root)
        for relative in load_retired_paths():
            remove_remote_tree(ftp, remote_join(remote_root, relative))
        ftp.quit()

    verify_site(site_url)
    print(f"LOCAL_PRODUCTION_DEPLOY_PASS uploaded={uploaded}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preflight", action="store_true")
    args = parser.parse_args()
    if args.preflight:
        preflight(require_credentials=False)
    else:
        deploy()
    return 0


if __name__ == "__main__":
    sys.exit(main())
