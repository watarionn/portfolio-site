# Phase 3.9 Master World Tile Export Prototype

Run locally with Pillow installed:

```bash
python tools/world-tiles/slice-master-world.py MASTER.png OUTPUT_DIR
```

To compare against an earlier export:

```bash
python tools/world-tiles/slice-master-world.py MASTER.png OUTPUT_DIR \
  --previous-manifest PREVIOUS/manifest.json
```

Default output is WebP quality 90. Use `--format png` for lossless debug/export tests.

The slicer:
- rejects source dimensions not divisible by 16 x 12,
- emits exactly A01-P12,
- computes SHA-256 per emitted tile,
- writes `manifest.json`,
- reports tiles whose emitted bytes differ from the previous manifest.

This is an isolated authoring tool. It is not wired to production runtime.
