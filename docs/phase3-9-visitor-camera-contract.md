# Phase 3.9 CP-D4G - Visitor Crop + Camera Anchor Contract

Updated: 2026-09-20
Status: PASS / W0 camera baseline

Machine-readable contract:
- `prototype/phase3-9-world-data/world-camera.v1.json`

## Published W0 envelope

Projected district anchors currently occupy:
- x: 0.39500 .. 0.54250
- y: 0.36500 .. 0.55333
- center: approx. (0.46875, 0.45917)

The entry camera intentionally includes additional frontier context. It must not fit the entire 16x12 Master World.

## Entry cameras

### Desktop
- center: (0.475, 0.465)
- visible world fraction: approx. 0.42 x 0.42
- shows all W0 anchors plus meaningful frontier around the cluster.

### Tablet
- center: (0.475, 0.470)
- visible world fraction: approx. 0.38 x 0.46
- preserves all four anchors with a slightly taller composition.

### Mobile
- center: (0.470, 0.460)
- visible world fraction: approx. 0.27 x 0.42
- prioritizes district readability instead of shrinking the whole world.
- short horizontal pan is expected for edge context.

These are normalized world-space targets, not CSS pixel values.

## Pan bounds

Pan bounds are intentionally local to W0 and nearby frontier.

Desktop:
- x 0.27 .. 0.69
- y 0.25 .. 0.69

Tablet:
- x 0.29 .. 0.67
- y 0.23 .. 0.71

Mobile:
- x 0.32 .. 0.63
- y 0.24 .. 0.70

The bounds do not imply that everything inside them is published or interactive. Frontier scenery may be visible while remaining non-interactive.

## Camera invariants

1. Never reveal the entire 16x12 world at initial entry.
2. All breakpoints use the same world/district coordinates.
3. Responsive behavior changes camera framing, not geography.
4. Published districts remain the only district navigation targets.
5. Mobile may pan rather than miniaturize W0 into unreadability.
6. Camera bounds may expand later when new districts are published.
7. Existing district anchors do not move when bounds expand.

## Frontier behavior

Cloud/frontier treatment is presentation art, not the camera's source of truth.
The camera contract determines where users may look; the Visitor World determines how unfinished distance is visually softened.

## Result

CP-D4G: PASS.

Next checkpoint: CP-D4H World Reveal / Frontier Contract.
Define publication-driven reveal behavior for clean Visitor World art, cloud/frontier masks, and newly published cells without treating unrevealed space as disabled UI.
