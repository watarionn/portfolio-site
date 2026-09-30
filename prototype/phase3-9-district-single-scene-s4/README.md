# Waterside Play District Single-Scene S4

Status: isolated Phase 4 formalization / no production cutover

## Goal

Prove the District View version of the Portfolio City presentation rule:

```text
finished district illustration
+ semantic project hotspots
+ canonical project metadata/navigation
```

S4 uses the previously accepted Waterside background and the Production Locked Aquarium S1.

No new artwork is generated.

## Source lock

Historical source commit:

`fa398ce5db39cdcce242b0fa7bb9881c99d5f02a`

Locked inputs:

- `portfolio-city/assets/districts/waterside-play/background-approved.png`
- `portfolio-city/assets/districts/waterside-play/aquarium-s1-final.png`

Locked geometry:

- scene: 1672 x 941
- Aquarium anchor: bottom-center
- x: 19.9606%
- y: 57.1039%
- width: 25%
- rotation: 0 degrees

The builder validates SHA-256 before compositing.

## Scope

S4 intentionally formalizes **Aquarium only**.

HoloCa and Word Generator remain canonical Waterside projects, but their building art is not Production Locked in the recovered accepted workflow. S4 does not invent, promote, or fake those buildings.

## Runtime contract

Browser presentation contains:

- exactly one district scene image
- zero independent building images
- one SVG Aquarium hotspot
- project preview populated from current `portfolio-city/data/projects.json`
- canonical route `/AQUARIUM/aquarium.php`

The Aquarium remains visually part of the scene pixels while remaining semantically interactive.

## Build

Ensure the historical commit exists locally:

`git fetch --depth=1 origin fa398ce5db39cdcce242b0fa7bb9881c99d5f02a`

Then:

`python tools/build_waterside_s4_single_scene.py --repo .`

The builder writes:

- `assets/waterside-s4-aquarium-scene.webp`
- `waterside-s4-aquarium-scene.json`

## Browser QA targets

- 1440 desktop
- 820 tablet
- 390 mobile
- single image only
- hotspot alignment
- keyboard activation
- Escape / close focus restoration
- project preview metadata
- canonical route
- no document horizontal overflow
- internal mobile scene scrolling only

This prototype does not replace the production District runtime.
