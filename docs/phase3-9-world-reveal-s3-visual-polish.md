# Phase 3.9 - World Reveal S3 Visual Polish

Updated: 2026-09-30

Status: **accepted preview polish / production preview update**

This pass records visual feedback from the first production-hosted S3 preview.

## Feedback addressed

1. **Visible World should feel slightly narrower**
   - Keep the validated S1 camera framing.
   - Tighten the organic clear mask around the four published districts instead of zooming the camera.
   - This preserves responsive usability while reducing how much surrounding geography appears fully revealed.

2. **District names should sit inside their click areas**
   - Move all district labels to the district anchor.
   - Render two-line labels where the name contains a space.
   - Reduce label size so the rendered label bounds fit inside each hotspot bounding box at desktop, tablet and mobile widths.
   - Labels remain `pointer-events: none`; the hotspot polygon remains the actual interactive target.

3. **Clouds should be denser**
   - unpublished veil opacity: 0.42 -> 0.54
   - frontier opacity: 0.21 -> 0.30
   - unresolved banks:
     - northwest/northeast: 0.46 -> 0.58
     - south: 0.40 -> 0.52
     - west: 0.30 -> 0.42
     - east: 0.31 -> 0.43
   - decorative drift opacity: 0.32 -> 0.42

## Clear-zone adjustment

The Current W0 clear mask was reduced to more closely wrap the published cluster.

The J05 preview keeps the same tighter base clear zone and adds only an east/northeast local reveal lobe.

The preview still changes atmosphere only.

## Browser QA

Validated at:

- 1440 desktop
- 820 tablet
- 390 mobile

All widths pass:

- 4/4 labels inside hotspot bounding boxes
- all district labels remain inside the World viewport
- no label collisions
- no document horizontal overflow
- 4 hotspots preserved
- denser atmosphere values applied

J05 reveal regression check:

- camera unchanged
- hotspot count remains 4
- published count remains 4
- profile changes `w0 -> preview-j05`

## Production preview note

The production preview remains isolated under:

`/portfolio-city/previews/world-reveal-s3/`

It remains `noindex,nofollow` and does not replace `city.html`.
