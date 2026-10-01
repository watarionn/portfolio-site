from __future__ import annotations

import argparse
import ftplib
import json
import os
import posixpath
import socket
import ssl
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
BUILD_ROOT = ROOT / "build" / "public_html"
MAPPING_PATH = ROOT / "config" / "deployment-map.json"
REQUIRED_ENV = ("FTP_HOST", "FTP_USER", "FTP_PASSWORD", "FTP_PATH", "SITE_URL")
EXCLUDED_NAMES = {"config.php", "user.ini", "admin.local.php"}
RETRYABLE_FTP_ERRORS = (
    ConnectionResetError,
    ConnectionAbortedError,
    BrokenPipeError,
    TimeoutError,
    socket.timeout,
    ssl.SSLError,
    ftplib.error_temp,
)


def clean_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if "\n" in value or "\r" in value:
        raise SystemExit(f"{name} must be a single line")
    return value


def read_windows_generic_credential(target: str) -> tuple[str, str]:
    if os.name != "nt":
        raise SystemExit("Windows Credential Manager is only available on Windows")

    import ctypes
    from ctypes import wintypes

    class FileTime(ctypes.Structure):
        _fields_ = [("dwLowDateTime", wintypes.DWORD), ("dwHighDateTime", wintypes.DWORD)]

    class Credential(ctypes.Structure):
        _fields_ = [
            ("Flags", wintypes.DWORD),
            ("Type", wintypes.DWORD),
            ("TargetName", wintypes.LPWSTR),
            ("Comment", wintypes.LPWSTR),
            ("LastWritten", FileTime),
            ("CredentialBlobSize", wintypes.DWORD),
            ("CredentialBlob", ctypes.POINTER(ctypes.c_ubyte)),
            ("Persist", wintypes.DWORD),
            ("AttributeCount", wintypes.DWORD),
            ("Attributes", ctypes.c_void_p),
            ("TargetAlias", wintypes.LPWSTR),
            ("UserName", wintypes.LPWSTR),
        ]

    pcredential = ctypes.POINTER(Credential)
    credential = pcredential()
    advapi = ctypes.WinDLL("Advapi32.dll")
    advapi.CredReadW.argtypes = [
        wintypes.LPCWSTR,
        wintypes.DWORD,
        wintypes.DWORD,
        ctypes.POINTER(pcredential),
    ]
    advapi.CredReadW.restype = wintypes.BOOL
    advapi.CredFree.argtypes = [ctypes.c_void_p]

    if not advapi.CredReadW(target, 1, 0, ctypes.byref(credential)):
        raise SystemExit(f"Windows credential target is unavailable: {target}")

    try:
        item = credential.contents
        username = item.UserName or ""
        blob = ctypes.string_at(item.CredentialBlob, item.CredentialBlobSize)
        try:
            password = blob.decode("utf-16-le").rstrip("\x00")
        except UnicodeDecodeError:
            password = blob.decode("utf-8").rstrip("\x00")
    finally:
        advapi.CredFree(credential)

    if not username or not password:
        raise SystemExit(f"Windows credential target is incomplete: {target}")
    return username, password


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


def ensure_remote_dir(
    ftp: ftplib.FTP_TLS,
    remote_dir: str,
    known_dirs: set[str] | None = None,
) -> None:
    if remote_dir in ("", "/"):
        return
    known_dirs = known_dirs if known_dirs is not None else set()
    current = ""
    for part in PurePosixPath(remote_dir).parts:
        if part == "/":
            current = "/"
            continue
        current = posixpath.join(current, part)
        if current in known_dirs:
            continue
        try:
            ftp.mkd(current)
        except ftplib.error_perm as exc:
            if not str(exc).startswith("550"):
                raise
        known_dirs.add(current)


def remote_join(root: str, relative: str) -> str:
    if root == "/":
        return "/" + relative.lstrip("/")
    return root.rstrip("/") + "/" + relative.lstrip("/")


def connect_ftps(host: str, user: str, password: str) -> ftplib.FTP_TLS:
    ftp = ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=45)
    ftp.connect(host)
    ftp.login(user, password)
    ftp.prot_p()
    ftp.set_pasv(True)
    return ftp


def close_ftp(ftp: ftplib.FTP_TLS | None) -> None:
    if ftp is None:
        return
    try:
        ftp.quit()
    except Exception:
        try:
            ftp.close()
        except Exception:
            pass


def upload_tree(
    host: str,
    user: str,
    password: str,
    remote_root: str,
    *,
    reconnect_every: int = 40,
    max_attempts: int = 8,
) -> int:
    files = [
        local
        for local in sorted(BUILD_ROOT.rglob("*"))
        if local.is_file() and local.name not in EXCLUDED_NAMES
    ]
    uploaded = 0
    ftp: ftplib.FTP_TLS | None = None
    known_dirs: set[str] = set()

    try:
        for local in files:
            relative = local.relative_to(BUILD_ROOT).as_posix()
            remote = remote_join(remote_root, relative)
            for attempt in range(1, max_attempts + 1):
                try:
                    if ftp is None:
                        ftp = connect_ftps(host, user, password)
                    ensure_remote_dir(ftp, posixpath.dirname(remote), known_dirs)
                    with local.open("rb") as handle:
                        ftp.storbinary(f"STOR {remote}", handle, blocksize=262144)
                    uploaded += 1
                    if reconnect_every > 0 and uploaded % reconnect_every == 0:
                        close_ftp(ftp)
                        ftp = None
                    break
                except RETRYABLE_FTP_ERRORS:
                    close_ftp(ftp)
                    ftp = None
                    if attempt >= max_attempts:
                        raise
                    time.sleep(min(2 * attempt, 10))
    finally:
        close_ftp(ftp)

    return uploaded


def is_missing_remote_path_error(exc: BaseException) -> bool:
    message = str(exc).lower()
    missing_markers = ("no such file", "not found", "does not exist")
    return message.startswith(("450", "550")) and any(
        marker in message for marker in missing_markers
    )


def normalize_remote_path(path: str) -> str:
    normalized = posixpath.normpath(path.replace("\\", "/"))
    if path.startswith("/") and not normalized.startswith("/"):
        normalized = "/" + normalized
    return normalized


def remote_path_within(candidate: str, allowed_root: str) -> bool:
    candidate_norm = normalize_remote_path(candidate)
    root_norm = normalize_remote_path(allowed_root).rstrip("/") or "/"
    return candidate_norm == root_norm or candidate_norm.startswith(root_norm + "/")


def normalize_remote_child(remote_path: str, listed_item: str) -> str | None:
    raw = listed_item.strip().replace("\\", "/")
    if not raw:
        return None

    trimmed = raw.rstrip("/")
    basename = posixpath.basename(trimmed)
    if basename in {".", ".."}:
        return None

    parent = normalize_remote_path(remote_path)
    if raw.startswith("/"):
        child = normalize_remote_path(raw)
    else:
        parent_without_slash = parent.lstrip("/")
        raw_norm = posixpath.normpath(raw)
        if raw_norm == parent_without_slash or raw_norm.startswith(parent_without_slash + "/"):
            child = normalize_remote_path("/" + raw_norm)
        else:
            child = normalize_remote_path(posixpath.join(parent, raw))

    if child == parent:
        return None
    return child


def remove_remote_tree(
    ftp: ftplib.FTP_TLS,
    remote_path: str,
    *,
    allowed_root: str | None = None,
) -> None:
    current = normalize_remote_path(remote_path)
    root = normalize_remote_path(allowed_root or remote_path)

    if not remote_path_within(current, root):
        raise RuntimeError(f"Refusing to delete outside retired root: {current} not within {root}")

    try:
        entries = ftp.nlst(current)
    except (ftplib.error_perm, ftplib.error_temp) as exc:
        if not is_missing_remote_path_error(exc):
            raise
        try:
            ftp.delete(current)
        except (ftplib.error_perm, ftplib.error_temp) as delete_exc:
            if not is_missing_remote_path_error(delete_exc):
                raise
        return

    children: list[str] = []
    for item in entries:
        child = normalize_remote_child(current, item)
        if child is None:
            continue
        if not remote_path_within(child, root):
            raise RuntimeError(
                f"FTP listing escaped retired root: {child} not within {root}"
            )
        children.append(child)

    if not children:
        try:
            ftp.delete(current)
            return
        except (ftplib.error_perm, ftplib.error_temp) as delete_exc:
            if is_missing_remote_path_error(delete_exc):
                return
            try:
                ftp.rmd(current)
            except (ftplib.error_perm, ftplib.error_temp) as rmdir_exc:
                if not is_missing_remote_path_error(rmdir_exc):
                    raise
            return

    for child in children:
        try:
            ftp.delete(child)
        except (ftplib.error_perm, ftplib.error_temp) as delete_exc:
            if is_missing_remote_path_error(delete_exc):
                continue
            remove_remote_tree(ftp, child, allowed_root=root)
    try:
        ftp.rmd(current)
    except (ftplib.error_perm, ftplib.error_temp) as rmdir_exc:
        if not is_missing_remote_path_error(rmdir_exc):
            raise


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


def deploy(args: argparse.Namespace) -> None:
    preflight(require_credentials=False)

    host = normalize_host(args.ftp_host or clean_env("FTP_HOST"))
    remote_root = normalize_remote_root(args.ftp_path or clean_env("FTP_PATH"))
    site_url = args.site_url or clean_env("SITE_URL")
    user = clean_env("FTP_USER")
    password = clean_env("FTP_PASSWORD")

    if (not user or not password) and args.credential_target:
        user, password = read_windows_generic_credential(args.credential_target)

    missing: list[str] = []
    if not host:
        missing.append("FTP host")
    if not user:
        missing.append("FTP user")
    if not password:
        missing.append("FTP password")
    if not remote_root:
        missing.append("FTP path")
    if not site_url:
        missing.append("site URL")
    if missing:
        raise SystemExit("Missing local deployment settings: " + ", ".join(missing))

    uploaded = upload_tree(
        host,
        user,
        password,
        remote_root,
        reconnect_every=args.reconnect_every,
        max_attempts=args.max_attempts,
    )

    ftp = connect_ftps(host, user, password)
    try:
        for relative in load_retired_paths():
            remove_remote_tree(ftp, remote_join(remote_root, relative))
    finally:
        close_ftp(ftp)

    verify_site(site_url)
    print(f"LOCAL_PRODUCTION_DEPLOY_PASS uploaded={uploaded}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preflight", action="store_true")
    parser.add_argument("--credential-target", default="")
    parser.add_argument("--ftp-host", default="")
    parser.add_argument("--ftp-path", default="")
    parser.add_argument("--site-url", default="")
    parser.add_argument("--reconnect-every", type=int, default=40)
    parser.add_argument("--max-attempts", type=int, default=8)
    args = parser.parse_args()
    if args.preflight:
        preflight(require_credentials=False)
    else:
        deploy(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
