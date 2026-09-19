# Phase 3.9 CP-D4J - Tile Export Contract + Prototype Slicer

Updated: 2026-09-20
Status: PASS

Implemented:
- `tools/world-tiles/slice-master-world.py`
- `tools/world-tiles/manifest-contract.v1.json`
- `tools/world-tiles/README.md`

The slicer validates Master dimensions, performs exact 16 x 12 cropping, emits A01-P12, computes SHA-256 hashes, writes a manifest, and compares against a previous manifest to report changed tiles.

## Smoke test

A synthetic 1600 x 1200 Master was sliced using the same 16 x 12 geometry.

Observed:
- 192 output cells,
- 100 x 100 per tile,
- first address A01,
- last address P12,
- 192 unique emitted hashes.

This confirms complete deterministic address coverage for the slicing geometry.

## Safety

The tool is isolated authoring infrastructure. Production runtime is unchanged and the Phase 3.9 hierarchy feature flag remains disabled.

## Next

CP-D4K Real Master Source Specification + Export Trial:
- choose practical source resolution candidates divisible by 16 x 12,
- evaluate tile pixel density and runtime weight,
- define source/version retention,
- run the slicer against the first real Master World artwork when available.
