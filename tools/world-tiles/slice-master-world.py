#!/usr/bin/env python3
"""Deterministically slice one Master World artwork into 16x12 runtime tiles."""

from __future__ import annotations
import argparse, hashlib, json, sys
from pathlib import Path
from PIL import Image

COLS, ROWS = 16, 12
SCHEMA_VERSION = 1

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def cell_id(col: int, row: int) -> str:
    return f"{chr(65 + col)}{row + 1:02d}"

def load_previous(path: Path | None) -> dict:
    if not path or not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("master", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--previous-manifest", type=Path)
    ap.add_argument("--format", choices=["webp", "png"], default="webp")
    ap.add_argument("--quality", type=int, default=90)
    args = ap.parse_args()

    if not args.master.exists():
        print(f"ERROR: master not found: {args.master}", file=sys.stderr); return 2

    with Image.open(args.master) as src:
        img = src.convert("RGBA")
    w, h = img.size
    if w % COLS or h % ROWS:
        print(f"ERROR: master dimensions {w}x{h} must be divisible by {COLS}x{ROWS}", file=sys.stderr)
        return 3

    tw, th = w // COLS, h // ROWS
    args.output.mkdir(parents=True, exist_ok=True)
    previous = load_previous(args.previous_manifest)
    previous_tiles = previous.get("tiles", {})
    tiles, changed = {}, []

    ext = args.format
    for row in range(ROWS):
        for col in range(COLS):
            cid = cell_id(col, row)
            out = args.output / f"{cid}.{ext}"
            tile = img.crop((col * tw, row * th, (col + 1) * tw, (row + 1) * th))
            if ext == "webp":
                tile.save(out, "WEBP", quality=args.quality, method=6, exact=True)
            else:
                tile.save(out, "PNG", optimize=True)
            digest = sha256(out)
            tiles[cid] = {"file": out.name, "sha256": digest, "width": tw, "height": th}
            if previous_tiles.get(cid, {}).get("sha256") != digest:
                changed.append(cid)

    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "grid": {"columns": COLS, "rows": ROWS, "cellCount": COLS * ROWS},
        "source": {"file": args.master.name, "width": w, "height": h},
        "tile": {"width": tw, "height": th, "format": ext, "quality": args.quality if ext == "webp" else None},
        "tiles": tiles,
        "changedTiles": changed,
        "changedTileCount": len(changed),
    }
    manifest_path = args.output / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    expected = {cell_id(c, r) for r in range(ROWS) for c in range(COLS)}
    if set(tiles) != expected or len(tiles) != 192:
        print("ERROR: tile coverage validation failed", file=sys.stderr); return 4

    print(f"PASS: {w}x{h} -> 192 tiles of {tw}x{th}")
    print(f"Changed tiles: {len(changed)}")
    if changed: print(" ".join(changed))
    print(f"Manifest: {manifest_path}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
