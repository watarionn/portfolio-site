# Phase 3.9 CP-D5G - Master World Runtime Assets

Updated: 2026-09-20
Status: PASS / runtime assets staged behind disabled hierarchy flag

## Formal asset build
- Master: `portfolio-city/assets/world/v1/master/portfolio-city-master-world-v1.jpg`
- Geometry: 8192 x 6144 (4:3)
- Runtime tiles: `portfolio-city/assets/world/v1/terrain/A01.webp` through `P12.webp`
- Grid: 16 x 12 / 192 tiles
- Tile geometry: 512 x 512
- Encoding: WebP quality 90
- Manifest: `portfolio-city/assets/world/v1/terrain/manifest.json`
- Re-running the deterministic slicer against the same Master reports 0 changed tiles.

## QA
`tools/world-tiles/qa-master-world.py` verifies exact cell coverage, tile count, dimensions,
SHA-256 values, source dimensions, and a decoded full-world reconstruction.
Current reconstruction PSNR against the normalized JPEG Master: 43.39 dB.
Total WebP payload: 3,833,926 bytes.
Existing Portfolio City contract/runtime checks and `git diff --check` pass.

## Runtime binding
The isolated Phase 3.9 prototype now reads the canonical runtime manifest/assets directly.
The production hierarchy shell has a manifest-driven Master terrain stage and exact W0 cell centers:
Observatory H05, Archive G06, Workshop I06, Waterside H07.
The old CSS H2 geometry remains only as a fallback when the real manifest cannot bind.
The production hierarchy feature flag remains OFF, so there is no visitor-visible cutover.

## Gate
CP-D5G runtime asset intake: PASS.
Next: CP-D5H visual/browser QA of real tiles at desktop/tablet/mobile, then cutover review.
No merge, deployment, or feature-flag flip is authorized by this checkpoint.
