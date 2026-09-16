# Phase 3.6-R6 Handoff

Updated: 2026-09-16

## Current position

Portfolio City is in **Phase 3.6-R6 Whole-City Terrain Scale Recalibration**.

- Draft PR: `#90 Phase 3.6-R6: recalibrate whole-city terrain scale`
- Branch: `phase3-6-r6-whole-city-scale-recalibration`
- PR state: Draft, unmerged
- Production deployment: not performed for R6
- GitHub Actions: not used
- Main already includes HoloScope release PR #89 and was merged into the R6 branch normally before continuing.

R6 exists because the 13-chunk rollout exposed a city-wide scale mismatch between terrain and buildings.
The user correctly identified that this was not only a North Crown problem. Middle Belt and South Belt also looked too zoomed out relative to the buildings.

## R6-A: runtime scale calibration

A second root cause was found before repainting terrain: full-terrain project buildings were still partly sized with viewport-fixed `rem` values.
Observatory pilot assets were especially oversized because an old `9.8rem` rule survived from Phase 3.5.
Tablet and mobile also enlarged buildings relative to terrain.

R6-A introduced a direct `.world-projects` layer for full-terrain mode.
All 14 project buildings now use authored world coordinates and widths from `map-layout.json` against the same world space as terrain chunks.
Legacy terrain mode keeps the previous district-local behavior.

### Exact R6-A browser QA

At CSS viewports 390 / 820 / 1440, all 14 building widths and bottom-center anchors were checked against terrain-derived world coordinates.

- 390 max error: `0.038 px`
- 820 max error: `0.029 px`
- 1440 max error: `0.000 px`
- horizontal overflow: `0`

HoloScope `270 world` is the primary scale anchor for all later terrain work.
After correcting building scale, all three terrain masters still read as too distant, confirming that a genuine terrain repaint is required.

## R6-B: repaint geometry contract

Do not change:

- world bounds / negative origin
- the 13-chunk topology
- all 14 project placements
- P0 gates, growth frontiers and expansion corridors
- HoloCa protected geometry and south split/rejoin logic

Target road widths:

- North central spine: `160 world`
- North west/east branches: `120 world`
- Middle east-west spine: `160 world`
- Middle north/south throat: `160 world`
- South HoloCa west/east bypass: `120 world`
- South south spine: `160 world`
- most other connectors: about `120 world`

Every project gets a large quiet forecourt / clearing based on roughly `building width + 120 world`.
The repaint goal is not to zoom the bitmap. Keep the same world and redraw roads, vegetation masses, landform edges and clearings at larger visual units.

## Current North visual candidate

Current strongest candidate: `水彩風ファンタジー草原の分岐路.png`.
It is a terrain-only image with no buildings and no labels.

Strengths:

- main road and branch roads finally feel large enough to support the buildings
- three project clearings are readable
- background no longer feels as severely zoomed out
- watercolor storybook language is close to the desired direction

Before approval, make only local corrections:

1. break the left/right symmetry slightly
2. make the upper-center HoloScope clearing feel like a natural hill clearing rather than a blank construction pad
3. reduce small individual trees and combine them into larger vegetation masses
4. soften cliff / stone micro-lines

Do **not** move the road centerlines, their target widths, or the three project clearings.

## Next chat start point

Read this file and `docs/phase3-6-r6-image-generation-lessons.md`, then inspect PR #90 and the latest branch head before editing.
Use the current North candidate as the parent image and perform local editing only.
After North is approved, transfer the same scale language to Middle Belt and South Belt.
Then regenerate 13 chunks, export WebP q90, run seam QA and 390 / 820 / 1440 browser QA.
Do not merge PR #90 or deploy to production without explicit user approval.
