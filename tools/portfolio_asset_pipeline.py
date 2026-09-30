#!/usr/bin/env python3
"""Reusable asset pipeline for Portfolio City World and District production.

The pipeline is deliberately deterministic and non-generative. It validates source
identity, produces runtime derivatives/composites, derives semantic hotspot geometry,
verifies manifests, and prepares explicit deployment packages.

Canonical source assets may be supplied either as repository files or immutable Git
objects. The pipeline never treats a temporary local file as canonical by default.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, features, __version__ as PILLOW_VERSION


class PipelineError(RuntimeError):
    pass


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def decoded_rgba_bytes(width: int, height: int) -> int:
    return width * height * 4


def file_mib(size: int) -> float:
    return round(size / 1024 / 1024, 3)


def decoded_mib(width: int, height: int) -> float:
    return round(decoded_rgba_bytes(width, height) / 1024 / 1024, 2)


def write_json(path: Path, data: Any) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def git_show_bytes(repo: Path, ref: str, path: str) -> bytes:
    try:
        return subprocess.check_output(
            ["git", "-C", str(repo), "show", f"{ref}:{path}"],
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        message = exc.stderr.decode("utf-8", errors="replace").strip()
        raise PipelineError(
            f"Could not read {path} from Git ref {ref}. "
            f"Fetch the ref first if necessary. Git said: {message}"
        ) from exc


def ensure_sha256(data: bytes, expected: str | None, label: str) -> str:
    actual = sha256_bytes(data)
    if expected and actual.lower() != expected.lower():
        raise PipelineError(f"{label} SHA-256 mismatch: expected {expected}, got {actual}")
    return actual


def ensure_size(actual: tuple[int, int], expected: list[int] | tuple[int, int] | None, label: str) -> None:
    if expected is None:
        return
    expected_tuple = (int(expected[0]), int(expected[1]))
    if actual != expected_tuple:
        raise PipelineError(f"{label} dimensions mismatch: expected {expected_tuple}, got {actual}")


def load_source_bytes(
    repo: Path,
    spec: dict[str, Any],
    label: str,
    external_input: Path | None = None,
) -> tuple[bytes, dict[str, Any]]:
    source_type = spec.get("type", "file")
    expected_sha = spec.get("expectedSha256")

    if source_type == "external":
        if external_input is None:
            raise PipelineError(
                f"{label}: external source requires --external-input; "
                "the pipeline does not fetch or authenticate external storage itself"
            )
        path = external_input.resolve()
        if not path.is_file():
            raise PipelineError(f"{label}: external input does not exist: {path}")
        data = path.read_bytes()
        resolved = {
            "type": "external",
            "canonicalId": spec.get("canonicalId"),
            "canonicalProvider": spec.get("canonicalProvider"),
            "inputFileName": path.name,
        }
    elif source_type == "file":
        rel = spec.get("path")
        if not rel:
            raise PipelineError(f"{label}: file source requires path")
        path = (repo / rel).resolve()
        try:
            path.relative_to(repo.resolve())
        except ValueError as exc:
            raise PipelineError(f"{label}: source path escapes repository: {path}") from exc
        if not path.is_file():
            raise PipelineError(f"{label}: source file does not exist: {path}")
        data = path.read_bytes()
        resolved = {"type": "file", "path": rel}
    elif source_type == "git":
        ref = spec.get("ref")
        rel = spec.get("path")
        if not ref or not rel:
            raise PipelineError(f"{label}: git source requires ref and path")
        data = git_show_bytes(repo, ref, rel)
        resolved = {"type": "git", "ref": ref, "path": rel}
    else:
        raise PipelineError(f"{label}: unsupported source type {source_type!r}")

    actual_sha = ensure_sha256(data, expected_sha, label)
    resolved["sha256"] = actual_sha
    resolved["fileBytes"] = len(data)
    return data, resolved


def open_source_image(
    repo: Path,
    spec: dict[str, Any],
    label: str,
    *,
    mode: str | None = None,
    external_input: Path | None = None,
) -> tuple[Image.Image, dict[str, Any]]:
    data, resolved = load_source_bytes(repo, spec, label, external_input)
    with Image.open(io.BytesIO(data)) as opened:
        image = ImageOps.exif_transpose(opened)
        ensure_size(image.size, spec.get("expectedSize"), label)
        resolved.update(
            {
                "width": image.width,
                "height": image.height,
                "format": opened.format,
                "mode": image.mode,
            }
        )
        if mode:
            image = image.convert(mode)
        else:
            image = image.copy()
    return image, resolved


def image_metadata(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise PipelineError(f"image does not exist: {path}")
    with Image.open(path) as opened:
        image = ImageOps.exif_transpose(opened)
        return {
            "path": str(path),
            "width": image.width,
            "height": image.height,
            "format": opened.format,
            "mode": image.mode,
            "fileBytes": path.stat().st_size,
            "fileMiB": file_mib(path.stat().st_size),
            "decodedRgbaBytes": decoded_rgba_bytes(image.width, image.height),
            "decodedRgbaMiB": decoded_mib(image.width, image.height),
            "sha256": sha256_file(path),
        }


def save_derivative(image: Image.Image, target: Path, fmt: str, quality: int, lossless: bool = False) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    fmt = fmt.lower()
    if fmt == "webp":
        image.save(target, "WEBP", quality=quality, method=6, lossless=lossless, exact=lossless)
        return
    if fmt == "avif":
        if lossless:
            raise PipelineError("AVIF lossless mode is not part of the Portfolio City pipeline contract")
        image.save(target, "AVIF", quality=quality, speed=6)
        return
    raise PipelineError(f"unsupported derivative format: {fmt}")


def validate_encoder(fmt: str) -> None:
    fmt = fmt.lower()
    if fmt == "webp" and not features.check("webp"):
        raise PipelineError("this Pillow build does not support WebP")
    if fmt == "avif" and not features.check("avif"):
        raise PipelineError("this Pillow build does not support AVIF")
    if fmt not in {"webp", "avif"}:
        raise PipelineError(f"unsupported format: {fmt}")


def run_derivatives(config: dict[str, Any], repo: Path, output_dir: Path, external_input: Path | None = None) -> dict[str, Any]:
    source_spec = config.get("source")
    if not isinstance(source_spec, dict):
        raise PipelineError("derivatives job requires source")

    source, source_info = open_source_image(repo, source_spec, "derivative source", mode="RGB", external_input=external_input)
    prefix = config.get("filenamePrefix", "portfolio-city-asset")
    sets = config.get("derivatives")
    if not isinstance(sets, list) or not sets:
        raise PipelineError("derivatives job requires at least one derivatives entry")

    manifest: dict[str, Any] = {
        "schemaVersion": 1,
        "kind": "responsive-derivatives",
        "id": config.get("id", "portfolio-city-derivatives"),
        "source": source_info,
        "pillowVersion": PILLOW_VERSION,
        "outputs": [],
    }

    for group in sets:
        fmt = str(group.get("format", "")).lower()
        validate_encoder(fmt)
        quality = int(group.get("quality", 84 if fmt == "webp" else 62))
        if not 1 <= quality <= 100:
            raise PipelineError(f"quality must be 1..100 for {fmt}")
        lossless = bool(group.get("lossless", False))
        sizes = group.get("sizes")
        if not isinstance(sizes, list) or not sizes:
            raise PipelineError(f"{fmt} derivative group requires sizes")

        for raw_size in sizes:
            if not isinstance(raw_size, list) or len(raw_size) != 2:
                raise PipelineError(f"invalid derivative size: {raw_size!r}")
            width, height = int(raw_size[0]), int(raw_size[1])
            if width <= 0 or height <= 0:
                raise PipelineError("derivative dimensions must be positive")
            if width > source.width or height > source.height:
                raise PipelineError(f"derivative {width}x{height} would upscale source {source.size}")
            expected_aspect = source.width / source.height
            if abs((width / height) - expected_aspect) > 1e-6:
                raise PipelineError(f"derivative {width}x{height} changes source aspect ratio")

            resized = source.resize((width, height), Image.Resampling.LANCZOS)
            suffix = "lossless" if lossless else f"q{quality}"
            filename = f"{prefix}-{width}x{height}-{suffix}.{fmt}"
            target = output_dir / filename
            save_derivative(resized, target, fmt, quality, lossless)

            manifest["outputs"].append(
                {
                    "file": filename,
                    "width": width,
                    "height": height,
                    "format": fmt,
                    "quality": quality,
                    "lossless": lossless,
                    "fileBytes": target.stat().st_size,
                    "fileMiB": file_mib(target.stat().st_size),
                    "decodedRgbaBytes": decoded_rgba_bytes(width, height),
                    "decodedRgbaMiB": decoded_mib(width, height),
                    "sha256": sha256_file(target),
                }
            )

    return manifest


def _placement_box(
    canvas: tuple[int, int],
    image: Image.Image,
    placement: dict[str, Any],
) -> tuple[int, int, int, int]:
    anchor = placement.get("anchor", "bottom-center")
    x_fraction = float(placement.get("xFraction", 0))
    y_fraction = float(placement.get("yFraction", 0))
    width_fraction = float(placement.get("widthFraction", 0))
    rotation = float(placement.get("rotationDegrees", 0))
    if rotation != 0:
        raise PipelineError("Phase 5 deterministic composite currently requires rotationDegrees = 0")
    if width_fraction <= 0:
        raise PipelineError("widthFraction must be positive")

    canvas_w, canvas_h = canvas
    target_w = round(canvas_w * width_fraction)
    target_h = round(image.height * target_w / image.width)
    anchor_x = canvas_w * x_fraction
    anchor_y = canvas_h * y_fraction

    if anchor == "bottom-center":
        left = round(anchor_x - target_w / 2)
        top = round(anchor_y - target_h)
    elif anchor == "center":
        left = round(anchor_x - target_w / 2)
        top = round(anchor_y - target_h / 2)
    elif anchor == "top-left":
        left = round(anchor_x)
        top = round(anchor_y)
    else:
        raise PipelineError(f"unsupported placement anchor: {anchor}")

    return left, top, target_w, target_h


def clamp_int(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def run_composite(config: dict[str, Any], repo: Path, output_dir: Path) -> dict[str, Any]:
    canvas_raw = config.get("canvas")
    if not isinstance(canvas_raw, dict):
        raise PipelineError("composite job requires canvas")
    canvas = (int(canvas_raw["width"]), int(canvas_raw["height"]))

    background_spec = config.get("background")
    if not isinstance(background_spec, dict):
        raise PipelineError("composite job requires background")
    background, background_info = open_source_image(repo, background_spec, "composite background", mode="RGB")
    if background.size != canvas:
        raise PipelineError(f"background size {background.size} does not match canvas {canvas}")

    scene = background.copy()
    layers_out: list[dict[str, Any]] = []
    hotspots: list[dict[str, Any]] = []

    layers = config.get("layers")
    if not isinstance(layers, list) or not layers:
        raise PipelineError("composite job requires at least one layer")

    for index, layer in enumerate(layers):
        layer_id = str(layer.get("id") or f"layer-{index + 1}")
        source_spec = layer.get("source")
        placement = layer.get("placement")
        if not isinstance(source_spec, dict) or not isinstance(placement, dict):
            raise PipelineError(f"{layer_id}: source and placement are required")

        overlay, source_info = open_source_image(repo, source_spec, f"layer {layer_id}", mode="RGBA")
        left, top, width, height = _placement_box(canvas, overlay, placement)
        resized = overlay.resize((width, height), Image.Resampling.LANCZOS)
        alpha_bbox = resized.getchannel("A").getbbox()
        if not alpha_bbox:
            raise PipelineError(f"{layer_id}: resized layer has no visible alpha content")

        scene.paste(resized, (left, top), resized)

        visible_bbox = [
            left + alpha_bbox[0],
            top + alpha_bbox[1],
            left + alpha_bbox[2],
            top + alpha_bbox[3],
        ]

        layer_out = {
            "id": layer_id,
            "source": source_info,
            "placement": {
                **placement,
                "rasterPlacement": {
                    "left": left,
                    "top": top,
                    "width": width,
                    "height": height,
                },
                "visibleAlphaBBox": visible_bbox,
            },
        }
        layers_out.append(layer_out)

        hotspot_spec = layer.get("hotspot")
        if isinstance(hotspot_spec, dict):
            hotspot_id = str(hotspot_spec.get("id") or layer_id)
            padding = int(hotspot_spec.get("paddingPx", 0))
            x1 = clamp_int(visible_bbox[0] - padding, 0, canvas[0])
            y1 = clamp_int(visible_bbox[1] - padding, 0, canvas[1])
            x2 = clamp_int(visible_bbox[2] + padding, 0, canvas[0])
            y2 = clamp_int(visible_bbox[3] + padding, 0, canvas[1])
            if x1 >= x2 or y1 >= y2:
                raise PipelineError(f"{layer_id}: derived hotspot is empty")
            hotspots.append(
                {
                    "id": hotspot_id,
                    "layerId": layer_id,
                    "paddingPx": padding,
                    "bbox": [x1, y1, x2, y2],
                    "polygon": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                }
            )

    output_spec = config.get("output")
    if not isinstance(output_spec, dict):
        raise PipelineError("composite job requires output")
    filename = output_spec.get("file")
    if not filename:
        raise PipelineError("composite output.file is required")
    fmt = str(output_spec.get("format", Path(filename).suffix.lstrip("."))).lower()
    quality = int(output_spec.get("quality", 100))
    lossless = bool(output_spec.get("lossless", fmt == "webp"))
    validate_encoder(fmt)
    target = output_dir / filename
    save_derivative(scene, target, fmt, quality, lossless)

    return {
        "schemaVersion": 1,
        "kind": "single-scene",
        "id": config.get("id", "portfolio-city-single-scene"),
        "canvas": {"width": canvas[0], "height": canvas[1]},
        "background": background_info,
        "layers": layers_out,
        "hotspots": hotspots,
        "output": {
            "file": filename,
            "width": canvas[0],
            "height": canvas[1],
            "format": fmt,
            "quality": quality,
            "lossless": lossless,
            "fileBytes": target.stat().st_size,
            "fileMiB": file_mib(target.stat().st_size),
            "decodedRgbaBytes": decoded_rgba_bytes(canvas[0], canvas[1]),
            "decodedRgbaMiB": decoded_mib(canvas[0], canvas[1]),
            "sha256": sha256_file(target),
        },
        "pillowVersion": PILLOW_VERSION,
    }


def run_job(config_path: Path, repo: Path, output_dir: Path, external_input: Path | None = None) -> Path:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if config.get("schemaVersion") != 1:
        raise PipelineError("pipeline config schemaVersion must be 1")

    job = config.get("job")
    output_dir.mkdir(parents=True, exist_ok=True)
    if job == "derivatives":
        manifest = run_derivatives(config, repo, output_dir, external_input)
    elif job == "composite":
        manifest = run_composite(config, repo, output_dir)
    else:
        raise PipelineError(f"unsupported pipeline job: {job!r}")

    manifest_name = config.get("manifestFile", f"{manifest['id']}.manifest.json")
    manifest_path = output_dir / manifest_name
    write_json(manifest_path, manifest)
    return manifest_path


def polygon_area(points: list[list[float]]) -> float:
    total = 0.0
    for index, point in enumerate(points):
        nxt = points[(index + 1) % len(points)]
        total += point[0] * nxt[1] - nxt[0] * point[1]
    return abs(total) / 2


def validate_manifest(manifest_path: Path, root: Path, metadata_path: Path | None = None) -> dict[str, Any]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    kind = manifest.get("kind")
    errors: list[str] = []
    checked_files: list[dict[str, Any]] = []

    def check_output(item: dict[str, Any], label: str) -> None:
        file_name = item.get("file")
        if not file_name:
            errors.append(f"{label}: missing file")
            return
        path = (root / file_name).resolve()
        try:
            path.relative_to(root.resolve())
        except ValueError:
            errors.append(f"{label}: file escapes root")
            return
        if not path.is_file():
            errors.append(f"{label}: missing output {file_name}")
            return
        actual_sha = sha256_file(path)
        if actual_sha != item.get("sha256"):
            errors.append(f"{label}: SHA-256 mismatch")
        try:
            with Image.open(path) as image:
                if image.size != (int(item.get("width", -1)), int(item.get("height", -1))):
                    errors.append(f"{label}: dimensions mismatch")
        except Exception as exc:
            errors.append(f"{label}: unreadable image: {exc}")
        if path.stat().st_size != item.get("fileBytes"):
            errors.append(f"{label}: fileBytes mismatch")
        checked_files.append({"file": file_name, "sha256": actual_sha, "fileBytes": path.stat().st_size})

    if kind == "responsive-derivatives":
        outputs = manifest.get("outputs")
        if not isinstance(outputs, list) or not outputs:
            errors.append("derivative manifest has no outputs")
        else:
            for index, item in enumerate(outputs):
                check_output(item, f"output[{index}]")
    elif kind == "single-scene":
        output = manifest.get("output")
        if not isinstance(output, dict):
            errors.append("single-scene manifest has no output")
        else:
            check_output(output, "output")

        canvas = manifest.get("canvas") or {}
        width, height = int(canvas.get("width", 0)), int(canvas.get("height", 0))
        hotspots = manifest.get("hotspots") or []
        metadata_ids: set[str] | None = None
        if metadata_path:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            values = metadata.get("projects") or metadata.get("districts") or []
            metadata_ids = {str(item.get("id")) for item in values if item.get("id")}

        for index, hotspot in enumerate(hotspots):
            points = hotspot.get("polygon")
            if not isinstance(points, list) or len(points) < 3:
                errors.append(f"hotspot[{index}]: polygon requires at least 3 points")
                continue
            if polygon_area(points) <= 1:
                errors.append(f"hotspot[{index}]: polygon area is too small")
            for point in points:
                if len(point) != 2 or not (0 <= point[0] <= width and 0 <= point[1] <= height):
                    errors.append(f"hotspot[{index}]: point outside canvas")
            if metadata_ids is not None and str(hotspot.get("id")) not in metadata_ids:
                errors.append(f"hotspot[{index}]: id {hotspot.get('id')!r} missing from metadata")
    else:
        errors.append(f"unsupported manifest kind: {kind!r}")

    return {
        "schemaVersion": 1,
        "manifest": str(manifest_path),
        "kind": kind,
        "pass": not errors,
        "errors": errors,
        "checkedFiles": checked_files,
    }


def build_package(config_path: Path, repo: Path, output_dir: Path) -> Path:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if config.get("schemaVersion") != 1 or config.get("job") != "package":
        raise PipelineError("package config must be schemaVersion 1 with job=package")
    files = config.get("files")
    if not isinstance(files, list) or not files:
        raise PipelineError("package config requires files")

    if output_dir.exists() and any(output_dir.iterdir()):
        raise PipelineError(f"package output directory must be empty: {output_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest_files: list[dict[str, Any]] = []
    repo_resolved = repo.resolve()
    for rel in files:
        source = (repo / rel).resolve()
        try:
            source.relative_to(repo_resolved)
        except ValueError as exc:
            raise PipelineError(f"package file escapes repository: {rel}") from exc
        if not source.is_file():
            raise PipelineError(f"package file is missing: {rel}")
        target = output_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        manifest_files.append(
            {
                "path": rel.replace("\\", "/"),
                "fileBytes": target.stat().st_size,
                "sha256": sha256_file(target),
            }
        )

    package_manifest = {
        "schemaVersion": 1,
        "kind": "deployment-package",
        "id": config.get("id", "portfolio-city-package"),
        "files": manifest_files,
        "totalFiles": len(manifest_files),
        "totalBytes": sum(item["fileBytes"] for item in manifest_files),
    }
    path = output_dir / "deployment-package.json"
    write_json(path, package_manifest)
    return path


def command_inspect(args: argparse.Namespace) -> int:
    path = args.input.resolve()
    data = image_metadata(path)
    if args.expect_width is not None and data["width"] != args.expect_width:
        raise PipelineError(f"expected width {args.expect_width}, got {data['width']}")
    if args.expect_height is not None and data["height"] != args.expect_height:
        raise PipelineError(f"expected height {args.expect_height}, got {data['height']}")
    if args.expect_sha256 and data["sha256"] != args.expect_sha256:
        raise PipelineError("SHA-256 mismatch")
    if args.output:
        write_json(args.output.resolve(), data)
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0


def command_run(args: argparse.Namespace) -> int:
    path = run_job(args.config.resolve(), args.repo.resolve(), args.output_dir.resolve(), args.external_input.resolve() if args.external_input else None)
    print(path)
    return 0


def command_validate(args: argparse.Namespace) -> int:
    result = validate_manifest(
        args.manifest.resolve(),
        args.root.resolve(),
        args.metadata.resolve() if args.metadata else None,
    )
    if args.output:
        write_json(args.output.resolve(), result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["pass"] else 1


def command_package(args: argparse.Namespace) -> int:
    path = build_package(args.config.resolve(), args.repo.resolve(), args.output_dir.resolve())
    print(path)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Portfolio City asset production pipeline")
    sub = parser.add_subparsers(dest="command", required=True)

    inspect = sub.add_parser("inspect", help="Inspect and optionally assert one image")
    inspect.add_argument("--input", type=Path, required=True)
    inspect.add_argument("--output", type=Path)
    inspect.add_argument("--expect-width", type=int)
    inspect.add_argument("--expect-height", type=int)
    inspect.add_argument("--expect-sha256")
    inspect.set_defaults(func=command_inspect)

    run = sub.add_parser("run", help="Execute a config-driven derivatives or composite job")
    run.add_argument("--config", type=Path, required=True)
    run.add_argument("--repo", type=Path, default=Path.cwd())
    run.add_argument("--output-dir", type=Path, required=True)
    run.add_argument("--external-input", type=Path, help="Pre-fetched external source; verified by config SHA/dimensions")
    run.set_defaults(func=command_run)

    validate = sub.add_parser("validate", help="Re-validate files described by a pipeline manifest")
    validate.add_argument("--manifest", type=Path, required=True)
    validate.add_argument("--root", type=Path, required=True)
    validate.add_argument("--metadata", type=Path)
    validate.add_argument("--output", type=Path)
    validate.set_defaults(func=command_validate)

    package = sub.add_parser("package", help="Create an explicit deployment package from repository files")
    package.add_argument("--config", type=Path, required=True)
    package.add_argument("--repo", type=Path, default=Path.cwd())
    package.add_argument("--output-dir", type=Path, required=True)
    package.set_defaults(func=command_package)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except PipelineError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
