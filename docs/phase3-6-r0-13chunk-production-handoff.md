# Portfolio City Phase 3.6-R0 — 13-Chunk Production Handoff

Date: 2026-09-15
Status: **APPROVED MASTER PLATES / PRODUCTION HANDOFF / NOT RUNTIME YET**
Branch: `phase3-6-r0-whole-city-blueprint-reset`

## Purpose

This handoff closes the Rough Illustrated Master Plates gate and converts the approved three-master composition into an exact 13-chunk production plan.

The approved rough masters are visual/composition authorities. Geometry remains authoritative in the R0 JSON contracts. Runtime registration is still intentionally deferred.

## Approved master plates

### North Crown — APPROVED

- File: `phase3-6-r0_north-crown_APPROVED.png`
- Drive file id: `1TlAKQsh-NwJZfEnb_QfKGD7Tw2hZhOvu`
- Geometry: North registration contract PASS
- Chunks: `1:-1`, `0:0`, `1:0`, `2:0`

### Middle Belt — APPROVED

- File: `phase3-6-r0_middle-belt_APPROVED.png`
- Drive file id: `1eGZVy39zhO8NMd1CdmtAkJBdojyAzkGy`
- Chunks: `-1:1`, `0:1`, `1:1`, `2:1`, `3:1`

### South Belt — APPROVED

- File: `phase3-6-r0_south-belt_APPROVED.png`
- Drive file id: `1I9uytZItj5WDwjpLzfiYnbV0O-EREsNN`
- Geometry: South road registration QA PASS
- Chunks: `0:2`, `1:2`, `2:2`, `1:3`

## Production resolution

One world chunk remains exactly `1024 × 768` world units.

Working production scale is fixed at **2 px / world unit**:

- one runtime terrain asset: `2048 × 1536 px`
- North working canvas including paint overlap: `6528 × 3456 px`
- Middle working canvas including paint overlap: `10624 × 1920 px`
- South working canvas including paint overlap: `6528 × 3456 px`

Each master keeps the approved `96` world-unit overlap (`192 px`) outside its nominal content bounds. The overlap exists only for continuous painting and seam QA. It is not exported as extra runtime area.

## Runtime asset convention

Planned directory:

`portfolio-city/assets/illustrated/terrain/chunks/`

Filename pattern:

`terrain_c{column}_r{row}.webp`

WebP remains the runtime baseline and terrain should be opaque where practical. Working masters may remain PNG or layered source files outside Git.

## Exact chunk export matrix

| Chunk | Master | Working-master crop px `(x, y, w, h)` | Planned runtime asset |
|---|---|---:|---|
| `1:-1` | North | `2240, 192, 2048, 1536` | `terrain_c1_r-1.webp` |
| `0:0` | North | `192, 1728, 2048, 1536` | `terrain_c0_r0.webp` |
| `1:0` | North | `2240, 1728, 2048, 1536` | `terrain_c1_r0.webp` |
| `2:0` | North | `4288, 1728, 2048, 1536` | `terrain_c2_r0.webp` |
| `-1:1` | Middle | `192, 192, 2048, 1536` | `terrain_c-1_r1.webp` |
| `0:1` | Middle | `2240, 192, 2048, 1536` | `terrain_c0_r1.webp` |
| `1:1` | Middle | `4288, 192, 2048, 1536` | `terrain_c1_r1.webp` |
| `2:1` | Middle | `6336, 192, 2048, 1536` | `terrain_c2_r1.webp` |
| `3:1` | Middle | `8384, 192, 2048, 1536` | `terrain_c3_r1.webp` |
| `0:2` | South | `192, 192, 2048, 1536` | `terrain_c0_r2.webp` |
| `1:2` | South | `2240, 192, 2048, 1536` | `terrain_c1_r2.webp` |
| `2:2` | South | `4288, 192, 2048, 1536` | `terrain_c2_r2.webp` |
| `1:3` | South | `2240, 1728, 2048, 1536` | `terrain_c1_r3.webp` |

The machine-readable source for this table is `docs/phase3-6-r0-13chunk-production-handoff.json`.

## Non-negotiable production rules

1. Paint or upscale the full master first. Never create a runtime chunk as an isolated illustration.
2. Crop each chunk from the exact registered master pixel rectangle.
3. Never independently warp, rescale or color-grade one chunk after cropping.
4. Chunk boundaries are technical slices, never visible district borders.
5. Preserve the 80-world-unit seam-safe bands and all P0 connector contracts.
6. Preserve all current project pads, eight reserve parcels, district Growth Frontiers and new-district Expansion Corridors.
7. Keep the adopted muted storybook watercolor character and restrained detail. Do not introduce dense AI-looking micro-detail.
8. No baked titles, labels, coordinates, legends or UI in terrain.
9. Verify all 14 seam contracts both at 100% and at runtime scale.
10. Do not modify `portfolio-city/data/map-layout.json` until all 13 exported WebP assets pass seam QA.

## Renderer handoff requirement

The future footprint contains negative coordinates (`row=-1`, `column=-1`). Before runtime registration, percentage positioning must be normalized against derived world bounds / explicit `minX` and `minY`; the old positive-origin-only assumption is not sufficient.

Each final chunk `renderRegion` must equal its exact world chunk rectangle, not a large shared crop.

## Next production gate

The next gate is **13-Chunk Terrain Production & Seam QA**:

1. build the three high-resolution working masters with their 192 px paint overlaps;
2. crop the 13 exact PNG review chunks;
3. assemble a seam-contact sheet and check all 14 contracts;
4. compare at runtime scale;
5. only after PASS, encode the 13 WebP runtime assets;
6. then begin the separate runtime-registration PR work.

Until that gate passes, the live site and `map-layout.json` remain unchanged.
