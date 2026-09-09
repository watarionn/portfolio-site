#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config/deployment-map.json"
SEO_CONFIG_PATH = ROOT / "config/seo.json"
DENIED_EXACT = {".env", "config.php", "user.ini", "admin.local.php", "config.local.php"}
DENIED_PARTS = {".git", "runtime", "operator"}


class BuildError(RuntimeError):
    pass


def safe_rel(value: object, label: str) -> PurePosixPath:
    if not isinstance(value, str) or not value:
        raise BuildError(f"{label} must be a non-empty path")
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise BuildError(f"{label} is unsafe: {value}")
    return path


def load_config() -> dict:
    try:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        raise BuildError(f"cannot load {CONFIG_PATH.relative_to(ROOT)}: {exc}") from exc
    if data.get("schemaVersion") != 1:
        raise BuildError("deployment map schemaVersion must be 1")
    return data


def load_retired_paths(config: dict) -> tuple[PurePosixPath, ...]:
    raw = config.get("retiredRemotePaths", [])
    if not isinstance(raw, list):
        raise BuildError("retiredRemotePaths must be an array")

    retired: list[PurePosixPath] = []
    seen: set[str] = set()
    for index, value in enumerate(raw):
        path = safe_rel(value, f"retiredRemotePaths[{index}]")
        text = path.as_posix()
        if text in seen:
            raise BuildError(f"duplicate retired remote path: {text}")
        seen.add(text)
        retired.append(path)
    return tuple(retired)


def load_seo_config(retired: tuple[PurePosixPath, ...]) -> tuple[str, tuple[str, ...]]:
    try:
        data = json.loads(SEO_CONFIG_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        raise BuildError(f"cannot load {SEO_CONFIG_PATH.relative_to(ROOT)}: {exc}") from exc
    if data.get("schemaVersion") != 1:
        raise BuildError("SEO config schemaVersion must be 1")

    origin = data.get("origin")
    if not isinstance(origin, str) or not origin.startswith("https://"):
        raise BuildError("SEO origin must be an https:// URL")
    origin = origin.rstrip("/")
    if "/" in origin.removeprefix("https://"):
        raise BuildError("SEO origin must not include a path")

    raw_routes = data.get("sitemapRoutes")
    if not isinstance(raw_routes, list) or not raw_routes:
        raise BuildError("SEO sitemapRoutes must be a non-empty array")

    routes: list[str] = []
    seen: set[str] = set()
    retired_prefixes = tuple(f"/{path.as_posix()}/" for path in retired)
    retired_exact = {f"/{path.as_posix()}" for path in retired}
    for index, route in enumerate(raw_routes):
        if not isinstance(route, str) or not route.startswith("/"):
            raise BuildError(f"sitemapRoutes[{index}] must be an absolute site path")
        if "?" in route or "#" in route or "://" in route or "\\" in route:
            raise BuildError(f"sitemapRoutes[{index}] is unsafe: {route}")
        if route in retired_exact or route.startswith(retired_prefixes):
            raise BuildError(f"retired production path must not appear in sitemap: {route}")
        if route in seen:
            raise BuildError(f"duplicate sitemap route: {route}")
        seen.add(route)
        routes.append(route)
    return origin, tuple(routes)


def ensure_source_allowed(source: Path) -> None:
    try:
        rel = source.relative_to(ROOT)
    except ValueError as exc:
        raise BuildError(f"source escapes repository: {source}") from exc
    if source.is_symlink():
        raise BuildError(f"symlinks are not deployable: {rel}")
    if any(part in DENIED_PARTS for part in rel.parts):
        raise BuildError(f"private/runtime source path is not deployable: {rel}")
    if source.name in DENIED_EXACT or source.name.startswith(".env."):
        raise BuildError(f"server-only file is not deployable: {rel}")


def ensure_destination_allowed(build_root: Path, destination: Path) -> str:
    try:
        rel = destination.relative_to(build_root).as_posix()
    except ValueError as exc:
        raise BuildError(f"destination escapes build root: {destination}") from exc
    pure = PurePosixPath(rel)
    if any(part in DENIED_PARTS for part in pure.parts):
        raise BuildError(f"private/runtime destination is forbidden: {rel}")
    if pure.name in DENIED_EXACT or pure.name.startswith(".env."):
        raise BuildError(f"server-only destination is forbidden: {rel}")
    return rel


def copy_file(
    source: Path,
    destination: Path,
    build_root: Path,
    emitted: dict[str, dict],
    owner: str,
) -> None:
    ensure_source_allowed(source)
    if not source.is_file():
        raise BuildError(f"missing source file: {source.relative_to(ROOT)}")
    rel = ensure_destination_allowed(build_root, destination)
    content = source.read_bytes()
    digest = hashlib.sha256(content).hexdigest()

    previous = emitted.get(rel)
    if previous is not None:
        if previous["sha256"] != digest:
            raise BuildError(f"artifact collision at {rel}: {previous['owner']} vs {owner}")
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    emitted[rel] = {
        "path": rel,
        "owner": owner,
        "source": source.relative_to(ROOT).as_posix(),
        "sha256": digest,
        "size": len(content),
    }


def emit_generated_text(
    destination: Path,
    build_root: Path,
    emitted: dict[str, dict],
    owner: str,
    source: str,
    text: str,
) -> None:
    rel = ensure_destination_allowed(build_root, destination)
    if rel in emitted:
        raise BuildError(f"generated artifact collision at {rel}: {emitted[rel]['owner']} vs {owner}")
    content = text.encode("utf-8")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    emitted[rel] = {
        "path": rel,
        "owner": owner,
        "source": source,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size": len(content),
    }


def copy_tree(
    source_root: Path,
    destination_root: Path,
    build_root: Path,
    emitted: dict[str, dict],
    owner: str,
) -> None:
    ensure_source_allowed(source_root)
    if not source_root.is_dir():
        raise BuildError(f"missing source directory: {source_root.relative_to(ROOT)}")
    for source in sorted(source_root.rglob("*")):
        if source.is_symlink():
            raise BuildError(f"symlinks are not deployable: {source.relative_to(ROOT)}")
        if not source.is_file():
            continue
        copy_file(
            source,
            destination_root / source.relative_to(source_root),
            build_root,
            emitted,
            owner,
        )


def render_robots(origin: str) -> str:
    return (
        "# Generated from config/seo.json. Do not edit the artifact directly.\n"
        "User-agent: *\n"
        "Allow: /\n"
        f"Sitemap: {origin}/sitemap.xml\n"
    )


def render_sitemap(origin: str, routes: tuple[str, ...]) -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for route in routes:
        lines.append(f"  <url><loc>{escape(origin + route)}</loc></url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def ensure_sitemap_routes_exist(build_root: Path, routes: tuple[str, ...]) -> None:
    for route in routes:
        if route == "/":
            candidates = (build_root / "index.html", build_root / "index.php")
        elif route.endswith("/"):
            directory = build_root / route.lstrip("/")
            candidates = (directory / "index.html", directory / "index.php")
        else:
            candidates = (build_root / route.lstrip("/"),)
        if not any(candidate.is_file() for candidate in candidates):
            raise BuildError(f"sitemap route does not resolve inside deployment artifact: {route}")


def ensure_retired_paths_absent(
    retired: tuple[PurePosixPath, ...],
    emitted: dict[str, dict],
) -> None:
    homepage = (ROOT / "index.html").read_text(encoding="utf-8")

    for path in retired:
        text = path.as_posix()
        prefix = text + "/"
        for emitted_path in emitted:
            if emitted_path == text or emitted_path.startswith(prefix):
                raise BuildError(f"retired path is still emitted by production artifact: {text}")

        public_href_prefix = f"/{text}/"
        if public_href_prefix in homepage:
            raise BuildError(f"homepage still links to retired production surface: {public_href_prefix}")


def build() -> dict:
    config = load_config()
    retired = load_retired_paths(config)
    seo_origin, sitemap_routes = load_seo_config(retired)
    build_rel = safe_rel(config.get("buildRoot"), "buildRoot")
    build_root = ROOT / build_rel
    expected = ROOT / "build/public_html"
    if build_root.resolve() != expected.resolve():
        raise BuildError(f"unexpected build root: {build_root}")

    build_parent = ROOT / "build"
    if build_root.exists():
        shutil.rmtree(build_root)
    build_root.mkdir(parents=True, exist_ok=True)

    manifest_path = build_parent / "deployment-manifest.json"
    if manifest_path.exists():
        manifest_path.unlink()

    emitted: dict[str, dict] = {}

    for index, item in enumerate(config.get("siteFiles", [])):
        if not isinstance(item, dict):
            raise BuildError(f"siteFiles[{index}] must be an object")
        source_rel = safe_rel(item.get("source"), f"siteFiles[{index}].source")
        dest_rel = safe_rel(item.get("destination"), f"siteFiles[{index}].destination")
        copy_file(ROOT / source_rel, build_root / dest_rel, build_root, emitted, "portfolio")

    entry_summaries: list[dict] = []
    for index, entry in enumerate(config.get("entries", [])):
        if not isinstance(entry, dict):
            raise BuildError(f"entries[{index}] must be an object")
        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not entry_id:
            raise BuildError(f"entries[{index}].id must be a non-empty string")
        source_rel = safe_rel(entry.get("sourceRoot"), f"entries[{index}].sourceRoot")
        production_rel = safe_rel(entry.get("productionRoot"), f"entries[{index}].productionRoot")
        before = len(emitted)
        destination_root = build_root / production_rel
        copy_tree(ROOT / source_rel, destination_root, build_root, emitted, entry_id)
        if not (destination_root / "index.html").is_file() and not (destination_root / "index.php").is_file():
            raise BuildError(f"{entry_id} does not emit index.html or index.php")
        entry_summaries.append(
            {
                "id": entry_id,
                "sourceRoot": source_rel.as_posix(),
                "productionRoot": production_rel.as_posix(),
                "fileCount": len(emitted) - before,
            }
        )

    for index, alias in enumerate(config.get("aliases", [])):
        if not isinstance(alias, dict):
            raise BuildError(f"aliases[{index}] must be an object")
        source_rel = safe_rel(alias.get("source"), f"aliases[{index}].source")
        dest_rel = safe_rel(alias.get("destination"), f"aliases[{index}].destination")
        copy_file(ROOT / source_rel, build_root / dest_rel, build_root, emitted, "legacy-alias")

    ensure_sitemap_routes_exist(build_root, sitemap_routes)
    emit_generated_text(
        build_root / "robots.txt",
        build_root,
        emitted,
        "seo-generated",
        "config/seo.json",
        render_robots(seo_origin),
    )
    emit_generated_text(
        build_root / "sitemap.xml",
        build_root,
        emitted,
        "seo-generated",
        "config/seo.json",
        render_sitemap(seo_origin, sitemap_routes),
    )

    if not (build_root / "index.html").is_file():
        raise BuildError("portfolio root index.html was not emitted")

    ensure_retired_paths_absent(retired, emitted)

    payload = {
        "schemaVersion": 1,
        "source": "watarionn/portfolio-site",
        "buildRoot": build_rel.as_posix(),
        "retiredRemotePaths": [path.as_posix() for path in retired],
        "seo": {
            "origin": seo_origin,
            "sitemapRoutes": list(sitemap_routes),
            "generatedRootFiles": ["robots.txt", "sitemap.xml"],
        },
        "entries": entry_summaries,
        "files": [emitted[path] for path in sorted(emitted)],
    }
    manifest_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the FTPS production artifact from the public repository.")
    parser.parse_args()
    try:
        payload = build()
    except (BuildError, OSError) as exc:
        print(f"production artifact build failed: {exc}")
        return 1
    print(
        "production artifact build passed: "
        f"{len(payload['entries'])} mapped entries, {len(payload['files'])} files, "
        f"{len(payload['retiredRemotePaths'])} retired remote paths"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
