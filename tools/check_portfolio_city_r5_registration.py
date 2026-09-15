#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "docs/phase3-6-r5-runtime-registration-fixture.json"
EXPECTED_IDS = {
    "1:-1", "0:0", "1:0", "2:0", "-1:1", "0:1", "1:1", "2:1", "3:1",
    "0:2", "1:2", "2:2", "1:3",
}
EXPECTED_WORLD = {
    "chunkWidth": 1024,
    "chunkHeight": 768,
    "minX": -1024,
    "minY": -768,
    "width": 5120,
    "height": 3840,
}


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: R5 registration fixture: {message}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path)
    parser.add_argument("--require-assets", action="store_true")
    args = parser.parse_args()

    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    if data.get("world") != EXPECTED_WORLD:
        fail("future world bounds differ from the locked R2 contract")

    chunks = data.get("chunks")
    if not isinstance(chunks, list) or len(chunks) != 13:
        fail("exactly 13 chunks are required")
    ids = [chunk.get("id") for chunk in chunks]
    if set(ids) != EXPECTED_IDS or len(ids) != len(set(ids)):
        fail("chunk IDs differ from the locked 13-chunk topology")

    world = data["world"]
    total_bytes = 0
    seen_hashes: set[str] = set()
    for chunk in chunks:
        x = chunk["column"] * world["chunkWidth"]
        y = chunk["row"] * world["chunkHeight"]
        left = (x - world["minX"]) / world["width"] * 100
        top = (y - world["minY"]) / world["height"] * 100
        width = world["chunkWidth"] / world["width"] * 100
        height = world["chunkHeight"] / world["height"] * 100
        if min(left, top) < 0 or left + width > 100.000001 or top + height > 100.000001:
            fail(f"chunk {chunk['id']} escapes normalized world bounds")
        if chunk.get("width") != 2048 or chunk.get("height") != 1536:
            fail(f"chunk {chunk['id']} has wrong review dimensions")
        total_bytes += chunk["bytes"]
        if chunk["sha256"] in seen_hashes:
            fail(f"duplicate binary hash at {chunk['id']}")
        seen_hashes.add(chunk["sha256"])

    if total_bytes != data["webpExport"]["totalBytes"]:
        fail("asset byte total differs from WebP export manifest")

    asset_root = args.asset_root
    if asset_root is None and args.require_assets:
        asset_root = ROOT / data["assetRoot"]
    if asset_root is not None:
        for chunk in chunks:
            path = asset_root / Path(chunk["image"]).name
            if not path.is_file():
                fail(f"missing staged asset: {path}")
            if path.stat().st_size != chunk["bytes"]:
                fail(f"byte-size mismatch: {path.name}")
            if sha256(path) != chunk["sha256"]:
                fail(f"sha256 mismatch: {path.name}")

    print("R5 registration fixture passed: 13 chunks / negative origin / 13 unique WebPs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
