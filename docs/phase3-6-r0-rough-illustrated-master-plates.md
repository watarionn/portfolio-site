# Portfolio City Phase 3.6-R0 — Rough Illustrated Master Plates

Date: 2026-09-15
Status: **PARTIALLY APPROVED / NORTH GEOMETRY PASS CANDIDATE / SOUTH GEOMETRY PASS / NOT RUNTIME ART**
Branch: `phase3-6-r0-whole-city-blueprint-reset`

## Purpose

This step translates the approved Master Plate Blockout into simplified color-and-material roughs for North Crown, Middle Belt and South Belt without changing runtime terrain.

The roughs are composition references only. They are not runtime terrain assets and must not yet be exported into `portfolio-city/assets/illustrated/`.

## Locked visual direction

Later painted terrain must stay close to the Professor Layton series in overall drawing character, color mood and storybook-map feeling while remaining original to Portfolio City.

Mandatory traits:

- muted warm watercolor palette
- soft ink-like contours rather than hard vector edges
- large readable landform masses
- grouped vegetation rather than leaf-by-leaf detail
- restrained texture and very low micro-detail
- no baked text, labels, legends, coordinates or UI in runtime terrain
- no decorative building detail during the rough terrain stage
- avoid dense AI-looking surface noise

## Geometry authority

Exact geometry remains authoritative in:

- `docs/phase3-6-r0-master-plate-blockout.json`
- `docs/phase3-6-r0-master-plate-blockout.md`
- `docs/phase3-6-r0-terrain-slicing-landform.json`
- `docs/phase3-6-r0-terrain-mask-contract.json`
- `docs/phase3-6-r0-terrain-mask-contract.md`
- `docs/phase3-6-r0-south-road-registration.json`
- `docs/phase3-6-r0-south-road-registration.md`
- `docs/phase3-6-r0-north-registration.json`
- `docs/phase3-6-r0-north-registration.md`

Visual roughs may soften edges, but they must not move locked roads, gates, reserve parcels, Growth Frontiers or Expansion Corridors.

## Current review / approval state

Stored in Google Drive under:

`Portfolio City_採用設計画像_20260913/02_IllustratedCity/01_DistrictConnections/03_RoughMasterPlates/`

Final three-plate review sheet:

- `phase3-6-r0_rough-master-plates_final-review_v2.png`
- Drive file id: `1KFBZfVLov7nq7hAKxzrj1myCLSpxsYP6`

### Middle Belt — APPROVED

- Approved rough: `phase3-6-r0_middle-belt_APPROVED.png`
- Drive file id: `1eGZVy39zhO8NMd1CdmtAkJBdojyAzkGy`
- Status: **APPROVED by user on 2026-09-15**
- Approved reading: a broad, mostly dry east-west civic terrace with water/cliff presence held to the outer fringe; Central Commons remains visually subordinate; no decorative building or text layer is baked into terrain.
- Approval locks visual composition, not runtime registration.

### South Belt — GEOMETRY QA PASS / VISUAL APPROVAL PENDING

South Belt uses a two-layer workflow:

1. road-neutral watercolor terrain/style base
2. coordinate-authoritative road layer

The route contract remains:

`G-SOUTH → split → outside HoloCa protected region → rejoin at (1600,2200) → one south continuation → EC-S`

Latest validated South route metrics:

- HoloCa protected road overlap: `0`
- minimum centerline clearance from HoloCa center: `241.81` world units
- required clearance including visual half-width: `190.00` world units
- road / dry-mask compliance: `99.74%`

The South Belt is structurally ready, but it remains **awaiting explicit user visual approval**.

### North Crown — GEOMETRY QA PASS / VISUAL APPROVAL PENDING

The earlier freeform watercolor North Crown reference remains style reference only because it reinterpreted the fixed geometry.

North geometry is separately registered in:

- `docs/phase3-6-r0-north-registration.json`
- `docs/phase3-6-r0-north-registration.md`

Latest final rough candidate:

- `phase3-6-r0_north-crown_FINAL-ROUGH-CANDIDATE_v4.png`
- Drive file id: `1QmbzFYNmqodsp7ph_X0SlNq7UglbF3oA`
- Status: **geometry QA PASS / visual approval pending**

Geometry checks for the latest candidate:

- `OBS-R1` centre lies inside H3 reserve crown: PASS
- `OBS-R2` centre lies inside H3 reserve crown: PASS
- `Sphere` centre lies inside H2 west terrace: PASS
- `HoloScope` centre lies inside H2 centre terrace: PASS
- `Prime Dot Art` centre lies inside H2 east terrace: PASS
- North spine and side-access routes remain derived from the registered route contract
- no city-scale water barrier is introduced around North Crown

The candidate intentionally stays rough and sparse. It prioritizes exact registered landform geometry, quiet reserve/project clearings and restrained watercolor massing over decorative detail.

## Superseded / rejected roughs

Earlier unconstrained generations that introduced poster layouts, titles, legends, coordinates, buildings, ships, docks, QA boards, ring roads or other premature detail are rejected and are not project references.

Freeform North watercolor generations that turned the registered highland into an island or introduced extra radial roads / roundabouts are rejected.

Programmatic North composites with visible tiling artifacts are also rejected as final visual candidates. Their masks remain useful geometry controls only.

The project must never treat attractive but structurally incorrect art as terrain authority.

## Review gate

Rough Illustrated Master Plates can close only when:

1. North Crown reads as the only clearly elevated mass and matches the North registration contract. **Geometry PASS / visual approval pending.**
2. Middle Belt remains the approved broad, mostly level dry civic terrace. **PASS / approved.**
3. Central Commons remains visually subordinate. **PASS / approved.**
4. South Belt introduces the first real water plane while keeping Aquarium, HoloCa, Word Generator and the south continuation dry. **Geometry PASS / visual approval pending.**
5. HoloCa bypass remains legible and is not a closed ring. **Geometry PASS / visual approval pending.**
6. Reserve parcels read as ordinary scenery rather than construction pads.
7. All three plates feel like one city under one muted storybook art direction.
8. North and South receive final user approval.
9. No detail pass or 13-chunk runtime export begins before this gate closes.
