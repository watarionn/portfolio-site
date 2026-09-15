# Portfolio City Phase 3.6-R1 — 13-Chunk Terrain Production & WebP Export QA

Date: 2026-09-15
Status: **FINAL TERRAIN QA CANDIDATE / WEBP EXPORT PASS CANDIDATE / NOT RUNTIME REGISTERED**
Branch: `phase3-6-r1-13chunk-terrain-production`
Base: `phase3-6-r0-whole-city-blueprint-reset`

## Purpose

This phase turns the approved R0 three-master handoff into 13 exact terrain chunks, verifies seam behavior and runtime-size readability, and produces a WebP export candidate without changing live runtime registration.

The R0 geometry contracts remain authoritative. This phase does not move project coordinates, reserve parcels, Growth Frontiers, Expansion Corridors, gates, or the HoloCa bypass.

## Final review source

Final PNG review chunks use:

- Pass 6 cross-master seam correction for the three Middle → South seams
- Pass 8 North texture-balance adjustment
- unchanged South dry/water geometry and HoloCa route from the validated production pass

North remains deliberately quieter than Middle and South, but receives macro watercolor texture so it no longer reads as a separate schematic art system.

## Locked chunk geometry

- chunk count: `13`
- world size per chunk: `1024 × 768`
- review/export pixels per chunk: `2048 × 1536`
- pixel scale: `2 px / world unit`
- planned runtime directory: `portfolio-city/assets/illustrated/terrain/chunks/`
- filename convention: `terrain_c{column}_r{row}.webp`

No chunk is independently redrawn, warped, or repositioned after slicing.

## Seam QA

All 14 registered seam contracts remain visually continuous at the review scale and at 25% runtime review scale.

Observed mean absolute RGB edge deltas for the final candidate:

| Seam | ΔRGB |
|---|---:|
| S-OBS-APRON-CORE | 1.76 |
| S-OBS-W | 2.98 |
| S-OBS-E | 3.06 |
| S-NORTH-MID | 5.79 |
| S-ARCHIVE-APRON | 11.63 |
| S-ARCHIVE-COMMONS | 7.24 |
| S-COMMONS-WORKSHOP | 8.19 |
| S-WORKSHOP-APRON | 12.64 |
| S-ARCHIVE-WATER | 0.79 |
| S-COMMONS-SOUTH | 0.65 |
| S-WORKSHOP-WATER | 0.65 |
| S-WAT-W | 9.42 |
| S-WAT-E | 7.92 |
| S-WAT-APRON | 15.05 |

These numbers are diagnostic only. The pass judgement remains visual plus structural because natural watercolor detail can legitimately differ across a seam while still reading continuously.

The three Middle → South cross-master seams were corrected only within a narrow 96 px color band; terrain shape and route geometry were not changed.

## South geometry preservation

The production candidate preserves the validated South rules:

- Aquarium / HoloCa / Word Generator project ground remains dry
- G-SOUTH enters the centre chunk before the bypass split
- route splits around the HoloCa protected region
- no route intrudes into HoloCa protected space
- bypass arms rejoin before the south apron
- the single south continuation reaches `1:3`
- `1:3` remains a dry reserve apron / future south corridor
- open water does not move north into Central Commons

## North visual-balance adjustment

The North geometry itself is unchanged.

Pass 8 adds only macro watercolor luminance/texture derived from the approved North style reference. Before transfer, the reference's blue-water identity is neutralized. Roads and the five quiet project/reserve clearings remain protected.

No buildings, labels, legends, UI, new roads, lakes, ring roads, or new landmarks are introduced.

## WebP export QA

The final PNG review chunks were encoded as opaque WebP with:

- quality: `90`
- method: `6`
- files: `13`
- total size: `2.56 MiB`
- maximum mean absolute RGB difference from PNG: `1.346`
- minimum PSNR: `42.97 dB`
- dimensions after decode: `2048 × 1536` for every asset

Full per-file sizes and SHA-256 hashes are recorded in:

`docs/phase3-6-r1-webp-export-manifest.json`

## Google Drive authorities

Folder:

`04_13ChunkTerrainProduction`

- final 13-chunk contact sheet: Drive `1-XNvk1yJLl-YDX-AIBZ7nkpmXBz1JEwu`
- final runtime-scale review: Drive `15jjzlU4YiSeajttvyi8LMGM9dTqOqYNc`
- PNG review package: Drive `1bZjinoV2BP0tM15J0ZNd-AdFab_ka3AU`
- WebP decoded contact sheet: Drive `1qBZZu-zLoWlhc-EFIoUmzoyjEy5ngnOK`
- WebP export QA summary: Drive `1InsnhT_x2qTHpsxxHEkBBvmtfmxHsl1F`
- WebP candidate package: Drive `1TLrtIzwzMGPzvfwHYtv_wOF7i7o1aDdh`

## Runtime boundary

This phase is still **not runtime registration**.

Do not yet modify:

- `portfolio-city/data/map-layout.json`
- world origin / bounds behavior in runtime code
- live 9-chunk fallback registration
- existing production terrain references

Before the WebP assets can be registered, the renderer must support the negative row / column footprint by normalizing world coordinates against explicit or derived `minX` / `minY`.

## Next gate

Next: **Renderer Negative-Origin Support & 13-Chunk Runtime Registration Design**.

That step should first change coordinate normalization and prove the 13-chunk footprint in a non-production review state. Only after 390 / 820 / 1440 QA passes should runtime terrain registration be considered for merge and deployment.
