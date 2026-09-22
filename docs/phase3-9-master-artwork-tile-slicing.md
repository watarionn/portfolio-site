# Phase 3.9 CP-D4I - Single Master Artwork / Deterministic Tile Slicing

Updated: 2026-09-20
Status: PASS / asset architecture locked

## Decision

Portfolio City adopts:

**Single Master Artwork -> deterministic 16 x 12 slicing -> 192 runtime terrain tiles**

The world is authored as one continuous illustration. It is not painted as 192 independent pieces.

The 192-cell grid is used to derive runtime assets and addresses, not to constrain visible brushwork or geography.

## Why

The Visitor World must read as one illustrated world:
- coastlines remain continuous,
- roads cross boundaries naturally,
- ridges and forests retain visual rhythm,
- lighting/palette/perspective remain coherent,
- no tile-by-tile style drift.

At runtime, the site should not need to download one enormous source image.

## Asset pipeline

1. Author one high-resolution clean Master World artwork.
2. Keep grid/debug marks outside the artwork.
3. Slice it deterministically into 16 columns x 12 rows.
4. Export exactly 192 terrain tiles using canonical IDs A01-P12.
5. Optimize runtime tiles (WebP or later approved web format).
6. Generate a manifest containing source version, dimensions, tile dimensions, hashes, and file mapping.
7. Runtime loads only tiles needed by the current camera plus a small preload margin.

## Canonical naming

Example:
- `A01.webp`
- `H05.webp`
- `G06.webp`
- `P12.webp`

Suggested runtime tree:

```
assets/world/
  v1/
    terrain/
      A01.webp
      ...
      P12.webp
    manifest.json
```

The original high-resolution Master World source should be retained separately from runtime exports.

## Seam rule

Slicing is pixel-exact from one source image.

No tile may be independently resized, repainted, sharpened, or color-corrected after slicing in a way that creates seams.

Any terrain change is made against the Master World source first, then affected runtime tiles are regenerated.

## Incremental update rule

A new Master World revision does not require committing all 192 runtime tiles if most pixels are unchanged.

Export process should:
1. slice the revised master,
2. hash each output tile,
3. compare hashes to the previous manifest,
4. replace only changed tile files,
5. update manifest/version metadata.

This preserves a single visual source of truth while keeping Git/runtime updates local.

## Separate layers

Do not bake these into terrain tiles:
- debug grid,
- cell labels,
- zoning colors,
- interaction hitboxes,
- district labels,
- cloud/frontier reveal state,
- accepted project/building assets when they need independent placement.

Recommended stack:
1. terrain tiles from Master World,
2. frontier/cloud atmosphere layer,
3. published district/building art,
4. runtime interaction/UI.

## Master source dimensions

The slicing contract requires dimensions divisible by 16 horizontally and 12 vertically.

Final pixel dimensions are not locked at CP-D4I. They should be selected after quality/performance tests.

The exporter must reject non-divisible dimensions unless an explicit crop/pad policy is approved.

## Coordinate consistency

Tile IDs map directly to Master Grid addresses:
- A01 = north-west tile,
- P01 = north-east tile,
- A12 = south-west tile,
- P12 = south-east tile.

World projection and camera contracts continue to use normalized 0..1 coordinates, independent of source resolution.

## Production policy

The Master source is an authoring asset.
The 192 optimized tiles are runtime assets.

Production must not depend on the authoring source file being downloadable.

## Result

CP-D4I: PASS.

Asset architecture is locked to Single Master Artwork -> deterministic 16x12 slicing.

Next checkpoint: CP-D4J Tile Export Contract + Prototype Slicer.
Define the manifest schema and implement an isolated deterministic slicer that verifies dimensions, emits A01-P12, computes hashes, and reports changed tiles. Do not bind to production runtime yet.
