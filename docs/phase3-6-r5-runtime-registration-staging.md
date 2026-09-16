# Phase 3.6-R5 — 13-Chunk Runtime Registration

Status: **PASS — runtime registration and browser QA complete; merge/deploy pending approval**

## Registered runtime

- world: `minX=-1024`, `minY=-768`, `width=5120`, `height=3840`
- logical chunk: `1024 x 768`
- terrain: 13 WebP files, each `2048 x 1536`
- runtime asset root: `portfolio-city/assets/illustrated/terrain/`
- all 14 authored project coordinates remain unchanged
- all four district regions remain unchanged
- camera presets remain authored in `map-layout.json`

The exact Drive-fixed q90 package was re-read before registration. All 13 file byte sizes and SHA-256 hashes match `docs/phase3-6-r5-runtime-registration-fixture.json`. Total terrain payload is `2,682,986` bytes (`2.56 MiB`).

## Full terrain integration

The runtime now activates `data-terrain-mode="full"` only when all 13 illustrated chunks are present. In full terrain mode, chunk geometry uses the R2 negative-origin normalization and the old decorative map infrastructure is suppressed so it cannot compete with the painted terrain.

District rectangles and building anchors are derived from the existing authored world coordinates. No project placement was moved. Tablet/mobile building cards are flattened to independent map illustrations, and the initial horizontal camera position is derived from the existing camera preset.

## Actual runtime browser QA

Chromium was run against the actual staged runtime tree, not the earlier fixture page, at:

- `390 x 844`
- `820 x 1000`
- `1440 x 1000`

All three pass with 13 terrain resources loaded, 14 project coordinates present, negative-origin edges at 0%, east/south outer edges at 100%, and zero document horizontal overflow. The initial horizontal scroll is centered from the authored camera preset: 160 px at 390, 162 px at 820, and 214 px at 1440 in the current QA environment.

Desktop pointer-drag QA also passes and remains clamped. The 1440 run moved from scrollLeft 214 to the maximum 385 without document overflow.

Visual QA additionally confirmed that the 13-chunk terrain is visible at all three widths, legacy infrastructure does not cover the terrain, tablet legacy cards are removed, and mobile/tablet start centered on the city rather than at the west edge.

Detailed browser results are recorded in `docs/phase3-6-r5-browser-qa.json`.

## Gate result

R5 is ready for review after a final fresh-clone validation of the pushed head. GitHub Actions are not required and must not be used for this gate. No merge or production deployment is authorized by this document.
