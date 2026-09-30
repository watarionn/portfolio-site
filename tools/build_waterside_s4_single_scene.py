#!/usr/bin/env python3
"""Build the Waterside Play S4 Aquarium single-scene proof from locked GitHub history.

This script performs deterministic compositing only. It does not generate or alter
artwork. The accepted background and Production Locked Aquarium are read from an
immutable Git commit and placed with the locked S1 geometry.
"""

from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

from PIL import Image, __version__ as pillow_version

from portfolio_asset_pipeline import git_show_bytes, sha256_bytes, sha256_file

SOURCE_COMMIT = "fa398ce5db39cdcce242b0fa7bb9881c99d5f02a"
BACKGROUND_PATH = "portfolio-city/assets/districts/waterside-play/background-approved.png"
AQUARIUM_PATH = "portfolio-city/assets/districts/waterside-play/aquarium-s1-final.png"

EXPECTED_BACKGROUND_SHA256 = "838797151c9c557af97ffb84e30940f1afee3e1603208a3ec9620d1bb2f95789"
EXPECTED_AQUARIUM_SHA256 = "228fbc8366d6e5cbdd9ef02a2a948bd5cb24cc9b5bf658f951a68d0eadef9ea1"

SCENE_SIZE = (1672, 941)
LOCKED_X = 0.199606
LOCKED_Y = 0.571039
LOCKED_WIDTH = 0.25
HOTSPOT_PADDING = 12


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def build(repo: Path, output_dir: Path) -> tuple[Path, Path]:
    background_bytes = git_show_bytes(repo, SOURCE_COMMIT, BACKGROUND_PATH)
    aquarium_bytes = git_show_bytes(repo, SOURCE_COMMIT, AQUARIUM_PATH)

    if sha256_bytes(background_bytes) != EXPECTED_BACKGROUND_SHA256:
        raise RuntimeError("Locked Waterside background hash mismatch")
    if sha256_bytes(aquarium_bytes) != EXPECTED_AQUARIUM_SHA256:
        raise RuntimeError("Locked Aquarium hash mismatch")

    background = Image.open(io.BytesIO(background_bytes)).convert("RGB")
    aquarium = Image.open(io.BytesIO(aquarium_bytes)).convert("RGBA")

    if background.size != SCENE_SIZE:
        raise RuntimeError(f"Expected background {SCENE_SIZE}, got {background.size}")
    if aquarium.size != (1536, 1024):
        raise RuntimeError(f"Expected Aquarium 1536x1024, got {aquarium.size}")

    scene_width, scene_height = SCENE_SIZE
    target_width = round(scene_width * LOCKED_WIDTH)
    target_height = round(aquarium.height * target_width / aquarium.width)
    anchor_x = scene_width * LOCKED_X
    anchor_y = scene_height * LOCKED_Y
    left = round(anchor_x - target_width / 2)
    top = round(anchor_y - target_height)

    resized = aquarium.resize((target_width, target_height), Image.Resampling.LANCZOS)
    alpha_bbox = resized.getchannel("A").getbbox()
    if not alpha_bbox:
        raise RuntimeError("Aquarium has no visible alpha content after resize")

    scene = background.copy()
    scene.paste(resized, (left, top), resized)

    visible_bbox = [
        left + alpha_bbox[0],
        top + alpha_bbox[1],
        left + alpha_bbox[2],
        top + alpha_bbox[3],
    ]
    hotspot_bbox = [
        clamp(visible_bbox[0] - HOTSPOT_PADDING, 0, scene_width),
        clamp(visible_bbox[1] - HOTSPOT_PADDING, 0, scene_height),
        clamp(visible_bbox[2] + HOTSPOT_PADDING, 0, scene_width),
        clamp(visible_bbox[3] + HOTSPOT_PADDING, 0, scene_height),
    ]
    x1, y1, x2, y2 = hotspot_bbox
    hotspot_polygon = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

    output_dir.mkdir(parents=True, exist_ok=True)
    scene_path = output_dir / "waterside-s4-aquarium-scene.webp"
    manifest_path = output_dir.parent / "waterside-s4-aquarium-scene.json"

    scene.save(scene_path, "WEBP", lossless=True, method=6, exact=True)

    manifest = {
        "schemaVersion": 1,
        "district": {
            "id": "waterside-play",
            "name": "Waterside Play",
            "sourceSize": {"width": scene_width, "height": scene_height},
        },
        "scene": {
            "asset": "./assets/waterside-s4-aquarium-scene.webp",
            "width": scene_width,
            "height": scene_height,
            "format": "webp",
            "lossless": True,
            "sha256": sha256_file(scene_path),
            "fileBytes": scene_path.stat().st_size,
        },
        "sourceLock": {
            "commit": SOURCE_COMMIT,
            "background": {
                "path": BACKGROUND_PATH,
                "sha256": EXPECTED_BACKGROUND_SHA256,
            },
            "aquarium": {
                "path": AQUARIUM_PATH,
                "sha256": EXPECTED_AQUARIUM_SHA256,
            },
            "placement": {
                "anchor": "bottom-center",
                "xFraction": LOCKED_X,
                "yFraction": LOCKED_Y,
                "widthFraction": LOCKED_WIDTH,
                "rotationDegrees": 0,
                "rasterPlacement": {
                    "left": left,
                    "top": top,
                    "width": target_width,
                    "height": target_height,
                },
                "visibleAlphaBBox": visible_bbox,
            },
        },
        "projects": [
            {
                "id": "aquarium",
                "hotspot": hotspot_polygon,
                "hotspotBBox": hotspot_bbox,
            }
        ],
        "build": {
            "method": "deterministic locked-source alpha composite",
            "pillowVersion": pillow_version,
            "hotspotPaddingPx": HOTSPOT_PADDING,
        },
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return scene_path, manifest_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("prototype/phase3-9-district-single-scene-s4/assets"),
    )
    args = parser.parse_args()
    scene, manifest = build(args.repo.resolve(), args.output_dir.resolve())
    print(scene)
    print(manifest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
