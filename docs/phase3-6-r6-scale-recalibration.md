# Phase 3.6-R6 Whole-City Terrain Scale Recalibration

R6 corrects a whole-city scale mismatch discovered after the 13-chunk production rollout.

## Root cause

The problem was not terrain alone. Full-terrain runtime still inherited fixed-rem building sizes from older responsive layouts. Observatory Hill also retained a Phase 3.5 pilot enlargement.

This made project buildings appear much larger than the authored world scale, while terrain roads and vegetation were painted with comparatively tiny motifs.

## R6-A: building scale calibration

`map-layout.json` project placement width is the authoritative displayed width.

All full-terrain project buttons are moved into a direct `world-projects` layer under the map. Their x/y/width/height are resolved against the same world coordinate space as terrain chunks.

Legacy terrain mode keeps the previous district-local structure.

HoloScope remains the primary scale anchor at 270 world units wide.
## R6-A browser QA

The exact world-coordinate QA is run at 390, 820, and 1440 CSS pixels.

For every one of the 14 projects, the test derives the expected screen position and width from chunk `0:0`, then compares the building rectangle against the terrain world transform.

Maximum observed error after calibration:

- 390 px: 0.038 px
- 820 px: 0.029 px
- 1440 px: 0.000 px

Horizontal document overflow remains zero at all three widths.

## R6-B: terrain repaint contract

R6-B must repaint all three master plates. The 13-chunk topology and project coordinates stay fixed.

The terrain must look closer to the viewer by increasing the visual size of roads, groves, slopes, coast features, and local clearings. Do not scale or crop the world image itself.
Target visual widths in world units:

- primary roads: 150–180
- secondary roads: 105–135
- local paths: 70–90
- project forecourts / landing clearings: 360–460
- vegetation masses: 120–240 diameter
- avoid visually meaningful micro-features below roughly 35 world units

North Crown is calibrated first against HoloScope. Middle Belt and South Belt then use the same scale language.

The existing watercolor/storybook palette remains authoritative. R6-B should use fewer, larger forms rather than adding more tiny detail.

## Acceptance gate

R6-B passes only when 390 / 820 / 1440 browser review shows buildings, roads, terrain masses, and coast features belonging to the same apparent scale.

No runtime rollout or production deployment occurs in R6 until the repainted terrain passes that visual gate.
