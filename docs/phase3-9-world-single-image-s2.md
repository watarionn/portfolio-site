# Phase 3.9 - World Single-Image vs Tile Measurement S2

Updated: 2026-09-30

Status: **PASS / architecture selected / no production cutover**

## Goal

Choose the Portfolio City World delivery architecture from measured evidence rather than intuition.

S2 compares the existing 192-tile runtime with the S1 Single-Image architecture at the required 1440 / 820 / 390 viewport widths.

The production runtime is not switched in this checkpoint.

## Test basis

Canonical authoring source:

- 8192 x 6144 Master World
- source JPEG: 13.617 MiB

Existing tile delivery:

- 16 x 12 logical grid
- 192 WebP tiles
- 512 x 512 per tile
- 3.656 MiB total tile assets

Temporary responsive derivatives were generated with:

- `tools/portfolio_city_world_derivatives.py`
- WebP quality 84
- AVIF quality 62
- Lanczos resize
- no mutation of the canonical Master World

Temporary derivative images were **not committed** during S2.

## Browser benchmark

Network profile:

- 30 ms latency
- 20 Mbps download
- cache disabled for cold runs
- Microsoft Edge headless
- exact CSS viewport emulation

Average across 1440 / 820 / 390:

| Runtime | Image bytes | Requests | Decoded RGBA upper bound | DOM nodes | Last image response | Pan p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| current 192 tiles | 3.601 MiB | 188 | 188 MiB | 273 | 2582 ms | 16.87 ms |
| raw Master JPEG 8192 | 13.617 MiB | 1 | 192 MiB | 59 | 6450 ms | 16.81 ms |
| WebP 4096 | 1.215 MiB | 1 | 48 MiB | 59 | 795 ms | 16.80 ms |
| WebP 3072 | 0.872 MiB | 1 | 27 MiB | 59 | 639 ms | 16.81 ms |
| WebP 2048 | 0.553 MiB | 1 | 12 MiB | 59 | 516 ms | 16.85 ms |
| AVIF 4096 | 0.785 MiB | 1 | 48 MiB | 59 | 608 ms | 16.81 ms |
| AVIF 3072 | 0.583 MiB | 1 | 27 MiB | 59 | 507 ms | 16.84 ms |
| AVIF 2048 | 0.378 MiB | 1 | 12 MiB | 59 | 415 ms | 16.83 ms |

The tile runtime loaded 180 images at 1440 and all 192 images at both 820 and 390 in the measured runs.

This means the current lazy tile structure does not produce a meaningful mobile request-count or decoded-memory advantage for the published cluster.

## Interaction-ready interpretation

The current tile UI can become interactive before all terrain tiles have arrived, so its interaction-ready timestamp was not worse than Single-Image.

Average measured interaction-ready values:

- tiles: 172 ms
- AVIF 4096: 201 ms
- AVIF 3072: 193 ms

This is not treated as a tile win because the visible terrain continues streaming for roughly 2.6 seconds on average, while the AVIF Single-Image terrain finishes around 0.5 to 0.6 seconds.

The S2 decision therefore separates **control readiness** from **complete World visual readiness**.

## Cold image load + decode

A separate cold benchmark loaded image resources with cache disabled and awaited `img.decode()`.

Median results:

| Runtime | Network + decode complete | Last response | Post-response decode |
| --- | ---: | ---: | ---: |
| 192 tiles | 3125 ms | 3124 ms | 1.6 ms |
| raw 8192 JPEG | 7604 ms | 7433 ms | 171 ms |
| WebP 4096 | 698 ms | 591 ms | 107 ms |
| WebP 3072 | 502 ms | 439 ms | 64 ms |
| AVIF 4096 | 454 ms | 400 ms | 54 ms |
| AVIF 3072 | 335 ms | 304 ms | 30 ms |

The small post-response tile value is expected because many 512 x 512 tiles decode while later tile requests are still in flight.

The relevant end-to-end completion remains about 3.1 seconds under the measured network profile.

## Visual-quality gate

Image quality was evaluated separately from browser overlays.

For every candidate, the exact S1 normalized camera crop was applied to:

- entry framing
- Workshop Alley district focus
- Waterside Play district focus

The same crop was rendered to validated desktop / tablet / mobile map viewport pixels.

Clouds, SVG labels, hotspot UI and vignette were excluded so they could not inflate similarity scores.

### Overall quality against the 8192 Master

| Candidate | Mean SSIM | Minimum SSIM | Mean edge correlation |
| --- | ---: | ---: | ---: |
| WebP 4096 | 0.9640 | 0.9504 | 0.9785 |
| WebP 3072 | 0.9464 | 0.9151 | 0.9618 |
| WebP 2048 | 0.9264 | 0.9148 | 0.9567 |
| AVIF 4096 | **0.9726** | **0.9645** | **0.9817** |
| AVIF 3072 | 0.9554 | 0.9286 | 0.9645 |
| AVIF 2048 | 0.9285 | 0.9181 | 0.9530 |

At the tested encoder settings, AVIF was both smaller and visually closer to the Master than the corresponding WebP candidate.

### Responsive interpretation

Desktop district focus is the most demanding state.

AVIF desktop mean / minimum SSIM:

- 4096: 0.9665 / 0.9645
- 3072: 0.9435 / 0.9286
- 2048: 0.9235 / 0.9181

The extra 4096 quality is visible in fine roads, cliff edges and small vegetation, while the transfer increase over 3072 AVIF is only about 0.20 MiB.

Tablet:

- 4096: 0.9761 / 0.9753
- 3072: 0.9567 / 0.9395
- 2048: 0.9224 / 0.9137

Mobile:

- 4096: 0.9778 / 0.9732
- 3072: 0.9635 / 0.9603
- 2048: 0.9325 / 0.9253

2048 is lightweight, but district-focus crops on the tall mobile viewport require upscaling from the derivative. Fine roads, trees and cliff contours visibly soften.

3072 retains useful source-pixel headroom while remaining only 0.583 MiB and 27 MiB decoded.

## Pan, touch and resize

Pan p95 remained approximately 16.8 ms for both tile and Single-Image candidates. No material Single-Image pan regression was measured.

Mobile touch pan passes for both architectures.

An initial automated Single-Image touch probe reported false because its start point landed on a district hotspot, where S1 intentionally suppresses camera drag. Re-running from an empty SVG area changed camera center from:

```text
(0.4700, 0.4600)
to
(0.4415, 0.4793)
```

so the touch path is valid.

Resize was tested without page reload:

```text
1440 -> 820 -> 390 -> 1440
```

Single-Image:

- no document overflow
- four hotspots remain present
- normalized camera center is preserved
- breakpoint changes desktop -> tablet -> mobile -> desktop

Tile runtime:

- no document overflow
- 192 tile nodes remain present
- four district nodes remain present
- desktop camera returns to its initial state after the round trip

## S2 decision

**Single-Image architecture: PASS.**

Adopt the following runtime-candidate policy for subsequent phases:

### Primary delivery

- format: **AVIF**
- desktop (> 1000 CSS px): **4096 x 3072**
- tablet/mobile (<= 1000 CSS px): **3072 x 2304**

### Compatibility fallback

- format: **WebP**
- desktop: 4096 x 3072
- tablet/mobile: 3072 x 2304

### 2048 derivative

Do not use 2048 x 1536 as the normal primary World image.

It may remain an optional future reduced-data candidate, but S2 does not adopt it because district-focus quality loss is measurable and visible.

## Why desktop keeps 4096

4096 AVIF costs about:

- 0.785 MiB transferred
- 48 MiB decoded

That is still far below the current tile runtime's measured:

- about 3.6 MiB transferred
- about 188 MiB decoded

The additional quality over 3072 is therefore worth the roughly 0.20 MiB transfer increase on desktop.

## Why mobile keeps 3072

2048 would save about 0.20 MiB and 15 MiB decoded versus 3072, but it is the first candidate that visibly loses district-focus detail because the mobile focus crop must be enlarged.

3072 is still dramatically smaller than the current tile runtime while avoiding that quality cliff.

## Architectural invariants

S2 does **not** remove:

- the logical 16 x 12 grid
- cell IDs
- district home cells
- source-coordinate hotspots
- reveal-state semantics
- future edit targeting
- the tile runtime rollback path

The grid remains authoring metadata rather than visible browser composition.

## Production boundary

S2 does not:

- switch the production feature flag
- delete the 192 tiles
- commit temporary benchmark derivatives as production assets
- change production routes
- finalize cloud art

Those remain later migration work.

## Next checkpoint

**Phase 3 - World Reveal / Cloud prototype**

Use the selected Single-Image architecture and keep publication-state atmosphere independent from geography.

Machine-readable evidence:

- `docs/phase3-9-world-single-image-s2-results.json`
