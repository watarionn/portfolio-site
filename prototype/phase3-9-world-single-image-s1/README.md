# World Single-Image Prototype S1

Status: isolated prototype / no production cutover

This harness implements Phase 1 of `docs/PORTFOLIO_CITY_SINGLE_IMAGE_ROADMAP.md` against the existing real Master World.

## What S1 proves

- one browser image instead of the 192-tile presentation layer
- source-coordinate SVG hotspot overlay (`0 0 8192 6144`)
- shared desktop/tablet/mobile camera coordinate system
- pointer/touch pan
- arrow-key pan
- four keyboard-reachable district targets
- independent organic atmosphere / frontier layer
- district focus without image slicing
- saved World camera restoration on return

## Canonical inputs

- Master image: `portfolio-city/assets/world/v1/master/portfolio-city-master-world-v1.jpg`
- Camera baseline: `prototype/phase3-9-world-data/world-camera.v1.json`
- Projection offsets: `prototype/phase3-9-world-data/world-projection.v1.json`
- District homes: H05 / G06 / I06 / H07

`world-single-scene.s1.json` copies only the minimum prototype values needed for the isolated harness. It does not replace the canonical planning contracts.

## Intentionally not included

- production feature flag changes
- production route changes
- removal of tile assets
- new World artwork
- final cloud art
- performance verdict
- full District View implementation

The existing tile-based Phase 3.9 prototype remains untouched so S2 can compare both architectures.

## Run

Serve the repository root over HTTP and open:

`/prototype/phase3-9-world-single-image-s1/`

Do not open the HTML directly with `file://` because S1 loads its JSON contract with `fetch()`.

## Static validation

From repository root:

`node tools/check_portfolio_city_single_image_s1.mjs`

Browser QA target widths remain 1440 / 820 / 390.
