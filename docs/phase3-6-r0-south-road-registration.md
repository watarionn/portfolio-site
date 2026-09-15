# Phase 3.6-R0 — South Belt Road Registration

Date: 2026-09-15
Status: **ROAD GEOMETRY AUTHORITY LOCKED / SOUTH ROUGH ART STILL PENDING**

## Why this layer exists

Repeated paint-over attempts preserved the desired watercolor mood but kept drifting away from the fixed HoloCa bypass geometry. South Belt therefore separates visual terrain reference from road geometry authority.

- `phase3-6-r0_south-belt_STYLE-REFERENCE.png` defines only color, watercolor handling, coast shape language and restrained detail.
- `phase3-6-r0_south-road-layer_AUTHORITATIVE.png` defines the road geometry and registration.
- The road layer has zero pixel overlap with the HoloCa protected region at the registered 1536 × 768 review resolution.

## Locked route

The South route is:

`G-SOUTH → split → west/east bypass outside HoloCa → rejoin at (1600,2200) → one south continuation → EC-S`

The west/east Archive/Workshop-to-Waterside links remain separately registered at their existing P0 anchors.

## Production rule

The final South terrain must be produced as a road-neutral or road-compatible background, then registered against the authoritative road layer. A visually attractive generated road is never allowed to override the coordinate contract.

A closed ring road around HoloCa is forbidden. HoloCa remains centered at `(1600,1820)` with a protected radius of `175` world units.

## Drive artifacts

Stored under `03_RoughMasterPlates`:

- style reference: `phase3-6-r0_south-belt_STYLE-REFERENCE.png` — `1anVfkEMRpA9wjapfHodK92XT2qBvjBD0`
- authoritative road layer: `phase3-6-r0_south-road-layer_AUTHORITATIVE.png` — `1K_-mjB9hX1fKVTRO2IRrHO62_M-nTT2v`
- road registration preview: `phase3-6-r0_south-road-registration-preview.png` — `1MqGfIXQGuyIjMNn8RJAg0allF-0AdQbV`

## Current approval state

- Middle Belt rough: **APPROVED**
- South Belt visual style / landform reference: **RETAINED**
- South Belt road geometry layer: **LOCKED**
- South Belt complete painted rough: **NOT YET APPROVED**
- Runtime terrain: **UNCHANGED**
