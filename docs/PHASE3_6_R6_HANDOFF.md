# Phase 3.6-R6 Handoff

Updated: 2026-09-16

## Current position

Portfolio City is in **Phase 3.6-R6 Whole-City Terrain Scale Recalibration**.

- Draft PR: `#90 Phase 3.6-R6: recalibrate whole-city terrain scale`
- Branch: `phase3-6-r6-whole-city-scale-recalibration`
- PR state: Draft, unmerged
- Final 13-chunk WebP q90 package: integrated and browser-QA PASS
- Production deployment: not performed for R6
- GitHub Actions: not used
- Main already includes HoloScope release PR #89 and was merged into the R6 branch normally before continuing.

R6 exists because the 13-chunk rollout exposed a city-wide scale mismatch between terrain and buildings. The user identified that this was not only a North Crown problem. Middle Belt and South Belt also looked too zoomed out relative to the buildings.

## R6-A: runtime scale calibration

A second root cause was found before repainting terrain: full-terrain project buildings were still partly sized with viewport-fixed `rem` values. Observatory pilot assets were especially oversized because an old `9.8rem` rule survived from Phase 3.5. Tablet and mobile also enlarged buildings relative to terrain.

R6-A introduced a direct `.world-projects` layer for full-terrain mode. All 14 project buildings now use authored world coordinates and widths from `map-layout.json` against the same world space as terrain chunks. Legacy terrain mode keeps the previous district-local behavior.

### Exact R6-A browser QA

At CSS viewports 390 / 820 / 1440, all 14 building widths and bottom-center anchors were checked against terrain-derived world coordinates.

- 390 max error: `0.038 px`
- 820 max error: `0.029 px`
- 1440 max error: `0.000 px`
- horizontal overflow: `0`

HoloScope `270 world` is the primary scale anchor for all later terrain work. After correcting building scale, all three terrain masters still read as too distant, confirming that a genuine terrain repaint was required.

## R6-B: repaint geometry contract

Do not change:

- world bounds / negative origin
- the 13-chunk topology
- all 14 project placements
- P0 gates, growth frontiers and expansion corridors
- HoloCa protected geometry and south split/rejoin logic

Target road widths: North central spine `160 world`; North west/east branches `120 world`; Middle east-west spine and north/south throat `160 world`; South HoloCa west/east bypass `120 world`; South south spine `160 world`; most other connectors about `120 world`.

Every project gets a large quiet forecourt / clearing based on roughly `building width + 120 world`. The repaint goal is not to zoom the bitmap, but to redraw roads, vegetation masses, landform edges and clearings at larger visual units while keeping the same world.

## Final harmonized terrain masters

The earlier North-only candidate stage is complete. The approved final R6 working masters are:

- North: `north_r6_HARMONIZED_WORKING_MASTER.png` (`15jZe4j45vxJNj6UxS_XL4jl7aLioWu2Y`)
- Middle: `middle_r6_HARMONIZED_WORKING_MASTER.png` (`1Eta1rbIsUacIxgr5GOuV9ZsLrTNla7hH`)
- South: `south_r6_HARMONIZED_WORKING_MASTER.png` (`1eQ0TunZN1d7VphHwZ4DWhf_OgA0ATjuR`)

The exact final runtime package is preserved in Google Drive as `PortfolioCity_R6_FINAL_RuntimePackage_v1.zip` (`1Wa9CgDVzsAz9MoGpvvmpBM82cAjlZZd1`).

Final runtime authority:

- 13 WebP q90 terrain chunks
- 14/14 seam contracts PASS
- 2,247,098 total terrain bytes
- per-file byte sizes and SHA-256 hashes recorded in `docs/phase3-6-r6-final-runtime-manifest.json`

## Final browser QA

The final package was staged on the actual R6 branch and tested at 390 / 820 / 1440 CSS widths.

- 390: max anchor error `0.024084 px`, max width error `0.011744 px`, overflow `0`
- 820: max anchor error `0.020731 px`, max width error `0.011744 px`, overflow `0`
- 1440: max anchor error `0.001900 px`, max width error `0.000050 px`, overflow `0`
- terrain assets: `13/13`, all decoded at `2048 x 1536`
- project placements: `14/14`
- districts: `4/4`
- application console/page errors: `0`

The exact browser-QA summary is in `docs/phase3-6-r6-final-browser-qa.md` and `.json`.

Project anchor/width QA uses the authored layout boxes in `.world-projects` and intentionally excludes hover/selected transforms from placement geometry. A local `/favicon.ico` 404 is also excluded because it is outside Portfolio City application assets.

## Reusable image-generation lessons

The full failure/correction history remains in `docs/phase3-6-r6-image-generation-lessons.md`. The most important rule is that geometry authority and generated art stay separate. Locked roads, clearings, protected areas and seam contracts come from project data/masks; generated images provide visual language only.

## Current gate / next step

R6 is now at the **PR review gate**. PR #90 may be moved from Draft to Ready for review after confirming the branch contains the final runtime assets and QA records.

Do not merge PR #90 or deploy to production without explicit user approval. Do not use GitHub Actions for this closure.
