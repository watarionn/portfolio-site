# Phase 3.9 CP-D4K - Real Master Source Specification + Export Trial

Updated: 2026-09-20
Status: PASS / source-resolution baseline

## Decision

Adopt **8192 x 6144 px** as the first real Master World production baseline.

Why:
- exactly divisible by 16 x 12,
- produces **512 x 512 px** source tiles,
- preserves enough terrain detail for the illustrated world,
- keeps the authoring source manageable compared with extreme 12K/16K alternatives,
- maps cleanly to common image-processing and runtime tile workflows.

This is a production baseline, not a permanent ceiling. If later visual QA proves insufficient, the coordinate/tile architecture remains resolution-independent.

## Derived geometry

Master:
- width: 8192 px
- height: 6144 px
- aspect ratio: 4:3

Grid:
- 16 columns
- 12 rows
- 192 cells

Per source tile:
- 512 x 512 px

Examples:
- A01 source rect: x 0..511, y 0..511
- H05 source rect: x 3584..4095, y 2048..2559
- G06 source rect: x 3072..3583, y 2560..3071
- I06 source rect: x 4096..4607, y 2560..3071
- H07 source rect: x 3584..4095, y 3072..3583
- P12 source rect: x 7680..8191, y 5632..6143

## Runtime policy

The 8192 x 6144 authoring source is never required as a public runtime download.

Runtime consumes sliced/optimized tiles.

Initial runtime export target:
- 512 x 512 WebP tiles,
- quality baseline 90,
- exact 192-cell manifest,
- lazy loading from camera-visible neighborhood,
- small preload margin around the viewport.

A later performance checkpoint may generate lower-resolution derivatives without changing logical cell addresses.

## Authoring policy

Master World source must:
- contain terrain/environment only,
- have no visible 16x12 grid,
- have no cell labels,
- have no runtime hitboxes,
- have no debug zoning colors,
- avoid baking publication-state clouds when those need independent reveal control,
- avoid baking accepted project/building art when independent placement is required.

The source should be retained losslessly or at authoring quality. Runtime WebP exports are derivatives.

## Why not larger yet

12288 x 9216 would produce 768 x 768 tiles.
16384 x 12288 would produce 1024 x 1024 tiles.

Both remain compatible with the architecture, but they multiply authoring memory, storage, export time, and source-management cost before visual QA proves that 512 px per logical cell is insufficient.

Start at 8192 x 6144, evaluate real art, then upscale only with evidence.

## Export trial

The CP-D4J slicer contract has already passed a deterministic 16x12 smoke test.

CP-D4K adds a real-size geometry trial requirement:
- construct or use an 8192 x 6144 source,
- verify exact 512 x 512 slicing,
- verify 192 unique IDs,
- verify representative current-home source rectangles,
- do not treat synthetic trial art as production Visitor World art.

## Acceptance

PASS when:
- source dimensions are locked for first production art pass,
- every cell maps to an exact 512 x 512 source rectangle,
- current W0 cells map deterministically,
- runtime remains independent from giant source image,
- architecture can later accept higher-resolution source without changing world coordinates.

## Result

CP-D4K: PASS.

First production Master World baseline: **8192 x 6144 -> 16 x 12 -> 192 tiles @ 512 x 512**.

Next checkpoint: CP-D4L Master Artwork Production Blueprint.
Translate the zoning, W0 geography, reveal contract, and 8192x6144 source specification into the actual clean Master World art brief. This is the final blueprint before producing the real terrain artwork.
