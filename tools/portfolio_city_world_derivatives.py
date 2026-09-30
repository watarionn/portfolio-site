#!/usr/bin/env python3
"""Build temporary responsive derivatives for Portfolio City World runtime benchmarking.

This tool never edits the canonical Master World. It writes derived benchmark assets
to an explicitly supplied output directory and records a deterministic manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps, features


DEFAULT_SIZES = ((4096, 3072), (3072, 2304), (2048, 1536))
EXPECTED_SOURCE = (8192, 6144)


def parse_sizes(raw: str) -> list[tuple[int, int]]:
    result: list[tuple[int, int]] = []
    for item in raw.split(","):
        token = item.strip().lower()
        if not token:
            continue
        try:
            width_raw, height_raw = token.split("x", 1)
            width, height = int(width_raw), int(height_raw)
        except (ValueError, TypeError) as exc:
            raise argparse.ArgumentTypeError(f"invalid size: {item!r}") from exc
        if width <= 0 or height <= 0:
            raise argparse.ArgumentTypeError(f"size must be positive: {item!r}")
        if width * 3 != height * 4:
            raise argparse.ArgumentTypeError(f"Portfolio City World derivatives must stay 4:3: {item!r}")
        result.append((width, height))
    if not result:
        raise argparse.ArgumentTypeError("at least one size is required")
    return result


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def save_candidate(image: Image.Image, target: Path, fmt: str, quality: int) -> None:
    if fmt == "webp":
        image.save(target, "WEBP", quality=quality, method=6, lossless=False)
        return
    if fmt == "avif":
        image.save(target, "AVIF", quality=quality, speed=6)
        return
    raise ValueError(f"unsupported format: {fmt}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True, help="Canonical Master World image.")
    parser.add_argument("--output", type=Path, required=True, help="Temporary derivative output directory.")
    parser.add_argument("--format", choices=("webp", "avif"), default="webp")
    parser.add_argument("--quality", type=int, default=None)
    parser.add_argument(
        "--sizes",
        type=parse_sizes,
        default=list(DEFAULT_SIZES),
        help="Comma-separated 4:3 sizes, e.g. 4096x3072,3072x2304,2048x1536.",
    )
    args = parser.parse_args()

    quality = args.quality if args.quality is not None else (84 if args.format == "webp" else 62)
    if not 1 <= quality <= 100:
        parser.error("--quality must be between 1 and 100")
    if args.format == "webp" and not features.check("webp"):
        parser.error("this Pillow build does not support WebP")
    if args.format == "avif" and not features.check("avif"):
        parser.error("this Pillow build does not support AVIF")

    source = args.input.resolve()
    output = args.output.resolve()
    if not source.is_file():
        parser.error(f"input does not exist: {source}")
    output.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        if image.size != EXPECTED_SOURCE:
            parser.error(f"expected source geometry {EXPECTED_SOURCE}, got {image.size}")

        manifest = {
            "schemaVersion": 1,
            "purpose": "Portfolio City World Single-Image S2 temporary benchmark derivatives",
            "source": {
                "path": str(source),
                "width": image.width,
                "height": image.height,
                "fileBytes": source.stat().st_size,
                "sha256": sha256(source),
            },
            "encoder": {
                "format": args.format,
                "quality": quality,
                "resample": "LANCZOS",
            },
            "candidates": [],
        }

        for width, height in args.sizes:
            if width > image.width or height > image.height:
                parser.error(f"candidate {width}x{height} would upscale the source")
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            filename = f"portfolio-city-master-world-{width}x{height}-q{quality}.{args.format}"
            target = output / filename
            save_candidate(resized, target, args.format, quality)
            file_bytes = target.stat().st_size
            manifest["candidates"].append(
                {
                    "file": filename,
                    "width": width,
                    "height": height,
                    "fileBytes": file_bytes,
                    "fileMiB": round(file_bytes / 1024 / 1024, 3),
                    "decodedRgbaBytes": width * height * 4,
                    "decodedRgbaMiB": round(width * height * 4 / 1024 / 1024, 2),
                    "sha256": sha256(target),
                }
            )

    manifest_path = output / f"manifest-{args.format}-q{quality}.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
