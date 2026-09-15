# Phase 3.6-R4: 13-Chunk Runtime Registration Fixture & Browser QA

Status: browser QA PASS candidate. Production runtime registration is not yet performed.

## Scope

This phase validates the approved 13-chunk terrain pack in a real browser viewport before changing the production `map-layout.json` or production terrain asset paths.

The fixture uses the future world bounds established by R2/R3:

- `minX = -1024`
- `minY = -768`
- `width = 5120`
- `height = 3840`
- chunk size `1024 x 768`
- 13 terrain chunks
- 14 existing project coordinates

## Browser method

The QA page used the actual Phase 3.6-R0 Pass 8 WebP candidate terrain files at quality 90. The files were embedded into the local QA document as data URIs so browser navigation policy could not affect asset loading.

Chromium 144 was driven through Chrome DevTools Protocol. Panning was tested with actual mouse press/move/release events rather than by directly mutating the final pan state.

The fixture itself is not production UI. Project markers are neutral QA silhouettes whose only job is to verify the existing authored bottom-center coordinates against the future world bounds.

## Tested viewports

### 390 x 844

- 13 terrain images loaded
- 14 project anchors inside world bounds
- `column=-1` starts at `left: 0%`
- `row=-1` starts at `top: 0%`
- east and south outer chunks end at `100%`
- real drag changed pan state and remained clamped
- no horizontal page overflow before or after drag

### 820 x 1000

All checks above passed. The fixture rendered at zoom 1.6 and accepted a real drag to approximately `(-176.88, -117.0)` without exposing content outside the viewport container.

### 1440 x 1000

All checks above passed. The fixture rendered at zoom 1.25 and accepted a real drag to the horizontal clamp limit without document overflow.

## Visual review

Middle Belt remains the strongest visual master and requires no further terrain editing at this gate.

South Belt remains visually distinct and readable. Its coastal water, dry project areas, HoloCa avoidance, south reserve apron, and south continuation remain understandable after chunk registration.

North Crown remains intentionally quieter and less dense than the other belts. At all three tested browser scales it no longer reads as an empty placeholder. No blocking visual defect was found in this phase.

The North/Middle and Middle/South transitions are visible because the district language changes, but they do not read as missing chunks or hard broken seams in the tested browser views.

## Pass criteria

R4 passes the browser-fixture gate when all of the following are true:

1. all 13 terrain images load;
2. all 14 project anchors stay inside the normalized world;
3. negative-origin chunks remain inside 0–100% CSS space;
4. east/south outer edges resolve to exactly 100%;
5. drag input changes pan state;
6. pan cannot move beyond the clamped world extent;
7. 390 / 820 / 1440 produce no document-level horizontal overflow;
8. no browser-scale terrain defect requires returning to terrain production.

All eight conditions passed.

## Explicitly unchanged

This phase does **not** change:

- `portfolio-city/data/map-layout.json`
- production terrain assets or asset paths
- production project positions
- district geometry
- deployed production site

No GitHub Actions are required for this QA phase.

## Next gate

The next implementation gate is **13-Chunk Runtime Registration with Staged Assets**.

That gate may add the final WebP terrain assets and a 13-chunk production layout on a new stacked branch, but it must still complete 390 / 820 / 1440 browser QA before any merge or production deployment.
