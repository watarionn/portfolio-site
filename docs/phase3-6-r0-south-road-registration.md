# Phase 3.6-R0 — South Belt Road Registration

Date: 2026-09-15
Status: **ROAD GEOMETRY AUTHORITY REFINED / SOUTH V5 FINAL REVIEW CANDIDATE**

## Why this layer exists

Repeated paint-over attempts preserved the desired watercolor mood but drifted away from the fixed HoloCa bypass geometry. South Belt therefore separates visual terrain from road geometry authority.

The current review candidate uses a road-neutral watercolor base plus an independently registered road layer.

## Locked route

The route remains:

`G-SOUTH → split → west/east bypass outside HoloCa → rejoin at (1600,2200) → one south continuation → EC-S`

The Archive/Workshop-to-Waterside links remain separately registered at their existing P0 anchors.

## Final-review road hierarchy

The final-review registration deliberately avoids a visually dominant closed ring:

- west/left bypass: primary road
- east/right bypass: narrower, quieter secondary road
- north entry and south continuation: primary spine
- Archive/Workshop side links: subordinate connector paths

The route still preserves both bypass arms geometrically, but the visual hierarchy prevents the central HoloCa zone from reading as a hero roundabout or park ring.

## Geometry QA

At the 1536 × 768 review resolution:

- HoloCa protected center: `(1600,1820)`
- protected radius: `175` world units
- minimum bypass centerline distance from HoloCa center: `241.81` world units
- required distance including primary visual half-width: `190.00` world units
- road / dry-mask compliance: `99.74%`
- HoloCa protected overlap: `0`

## Current visual review artifact

- South v5 final-review candidate: `phase3-6-r0_south-belt_FINAL-REVIEW-CANDIDATE_v5.png`
- Drive file id: `1RrJmfEbS31FFp2robOga56CF3lm3fZKW`

This image is still rough art only. It is not runtime terrain and is awaiting final user adoption.

## Production rule

The final South terrain must continue to be produced as road-neutral/road-compatible watercolor terrain with road registration applied separately. Generated or painted roads must never override the coordinate contract.

Buildings, ships, towers, labels, UI and decorative landmarks remain forbidden during this rough terrain stage.

## Current approval state

- Middle Belt rough: **APPROVED**
- South Belt v5: **GEOMETRY QA PASS / awaiting user final adoption**
- North Crown rough: **final review candidate retained**
- Runtime terrain: **UNCHANGED**
