# Phase 5 Waterside Play — S1 Aquarium Production Lock / S2 Handoff

Date: 2026-09-24

## Status

Waterside Play S1 Aquarium is **Production Locked**.

Do not move, rescale, redraw, regenerate, or replace S1 while working on S2+ unless the user explicitly reopens S1.

## Production-locked S1 facts

- Building: Aquarium
- Runtime asset: `portfolio-city/assets/districts/waterside-play/aquarium-s1-final.png`
- Runtime background: `portfolio-city/assets/districts/waterside-play/background-approved.png`
- Shared scene coordinate system: 1672 × 941
- Anchor: bottom-center
- x: 19.9606%
- y: 57.1039%
- width: 25%
- rotation: 0°
- Building asset contains architecture only. No stairs, entrance stone, forecourt, planting, fence, or ground-attached scenery.
- Background and buildings must remain in the same scene coordinate system. Responsive layout scales/crops the scene as one unit.

## QA closure

- Runtime Aquarium asset: HTTP 200, PNG, 1,969,382 bytes.
- Runtime background: HTTP 200, PNG, 2,491,865 bytes.
- Production JS verified to reference the accepted background and Aquarium asset with the measured x/y geometry.
- Mobile canvas alignment bug was fixed without changing Aquarium placement.
- Mobile production display: user-confirmed PASS.
- PC production display: user-confirmed PASS.
- S1 is therefore Production Locked.

## Mobile canvas fix

The mobile rule that forced the scene to `100vw` with `margin-left: calc(50% - 50vw)` made the whole background canvas appear left-aligned. This was replaced with a centered gutter-aware scene width. Aquarium coordinates were intentionally unchanged.

Relevant main commits:
- `bdcd614f1cce6b8ffdbca745e667359fcb924b0f` — center Waterside scene canvas on mobile
- `78085b6644915a2ccc2c5bf094ca663b0ed9de05` — cache bust for the mobile centering fix

## Persistent QA files

Google Drive folder:
`/Portfolio City/Phase5_DistrictScenery/QA/WatersidePlay/S1_Aquarium/`

Saved:
- `mobile-before-canvas-centering.jpg`
- `mobile-production-pass.jpg`

The accepted Aquarium master also exists persistently in the file Library as:
`/Portfolio City/Phase5_DistrictScenery/Accepted/aquarium-s1-final-approved.png`

## Locked production workflow for project buildings

For S2 and later:
1. Create/edit **BUILDING ONLY**.
2. Never send the Waterside background to image generation.
3. No stairs, entrance stones, forecourts, planting, fences, or ground-attached scenery in project-building assets.
4. Place the building with the placement tool and use the measured bottom-center coordinates.
5. Composite/verify placement deterministically. Do not use image generation for placement/comparison.
6. Persist an adopted asset before runtime integration: Adopt → Accepted persistent save → read-back verification → persistent ID/path record → runtime → production verify → Production Lock.
7. Verify both mobile and PC before Production Lock.

## Important rejected behavior

Never regenerate a whole Waterside scene while creating/editing a building. Generated fake district scenes, generated placement boards, and invented scale/coordinate claims are reference-prohibited.

## Branch warning

Draft PR #105 / `phase5-district-pages` is older than current production main in important areas. Do **not** merge it or mechanically rebase/resolve it over current production.

Before implementation:
- locate the actual worktree;
- verify remote, branch, HEAD, and working-tree state;
- `git fetch origin main`;
- compare the working branch with `origin/main`;
- inspect main for existing production implementation before retransmitting/reimplementing assets.

## Next task

Resume with **Waterside Play S2 Holoca**.

Candidate Library asset:
`/Portfolio City/Phase5_DistrictScenery/Candidates/WatersidePlayProjectBuildings/holoca-s2-v1.png`

Treat it as a candidate, not an adopted asset. Apply the same building-only → measured placement → deterministic verification → mobile/PC QA → Production Lock workflow used for S1.
