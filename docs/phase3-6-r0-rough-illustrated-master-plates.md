# Portfolio City Phase 3.6-R0 — Rough Illustrated Master Plates

Date: 2026-09-15
Status: **MIDDLE BELT APPROVED / SOUTH ROAD GEOMETRY LOCKED / NORTH + SOUTH ROUGH REVIEW CONTINUES / NOT RUNTIME ART**
Branch: `phase3-6-r0-whole-city-blueprint-reset`

## Purpose

This step translates the approved Master Plate Blockout into simplified color-and-material roughs for North Crown, Middle Belt and South Belt without changing runtime terrain.

The roughs are composition references only. They are not approved final terrain assets and must not be exported into `portfolio-city/assets/illustrated/`.

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

The exact geometry remains authoritative in:

- `docs/phase3-6-r0-master-plate-blockout.json`
- `docs/phase3-6-r0-master-plate-blockout.md`
- `docs/phase3-6-r0-terrain-slicing-landform.json`
- `docs/phase3-6-r0-terrain-mask-contract.json`
- `docs/phase3-6-r0-terrain-mask-contract.md`
- `docs/phase3-6-r0-south-road-registration.json`
- `docs/phase3-6-r0-south-road-registration.md`

Visual roughs may soften edges, but they must not move locked roads, gates, reserve parcels, Growth Frontiers or Expansion Corridors.

## Current review / approval state

Stored in Google Drive under:

`Portfolio City_採用設計画像_20260913/02_IllustratedCity/01_DistrictConnections/03_RoughMasterPlates/`

### North Crown

- Existing constrained rough reference: `phase3-6-r0_rough-illustrated_north-crown_v2.png`
- Drive file id: `1MqglOflwlQcU03JpNhgCo_04NLK5Wn0Y`
- Status: **review candidate retained**

### Middle Belt — APPROVED

- Approved rough: `phase3-6-r0_middle-belt_APPROVED.png`
- Drive file id: `1eGZVy39zhO8NMd1CdmtAkJBdojyAzkGy`
- Status: **APPROVED by user on 2026-09-15**
- Approved reading: a broad, mostly dry east-west civic terrace with water/cliff presence held to the outer fringe; Central Commons remains visually subordinate; no decorative building or text layer is baked into terrain.
- The approved rough may still require exact master-ratio export / slicing preparation later. Approval locks visual composition, not runtime registration.

### South Belt — SPLIT AUTHORITY

- Visual style / landform reference: `phase3-6-r0_south-belt_STYLE-REFERENCE.png`
- Drive file id: `1anVfkEMRpA9wjapfHodK92XT2qBvjBD0`
- Authoritative road layer: `phase3-6-r0_south-road-layer_AUTHORITATIVE.png`
- Drive file id: `1K_-mjB9hX1fKVTRO2IRrHO62_M-nTT2v`
- Registration preview: `phase3-6-r0_south-road-registration-preview.png`
- Drive file id: `1MqGfIXQGuyIjMNn8RJAg0allF-0AdQbV`
- Status: **visual reference retained / road geometry locked / complete painted rough not yet approved**
- The generated painted road is no longer treated as coordinate authority.
- Required route: `G-SOUTH → split → outside HoloCa protected region → rejoin at (1600,2200) → one south continuation → EC-S`.
- The authoritative transparent road layer has zero overlap with the registered HoloCa protected region at 1536 × 768.
- A closed ring road around HoloCa is explicitly forbidden.

## Superseded / rejected roughs

The earlier `phase3-6-r0_rough-illustrated_middle-belt_v2.png` and `phase3-6-r0_rough-illustrated_south-belt_v2.png` remain useful color/style comparisons only. They are superseded as geometry candidates by the constrained workflow.

Automatic image-generation attempts that produced poster layouts, labels, coordinates, buildings, ships, docks, QA boards or other premature detail are rejected and are not project references.

The project must never treat attractive but structurally incorrect generated art as terrain authority.

## Terrain Mask Contract

The constrained candidates are governed by the mask and registration contracts added in Phase 3.6-R0:

- Middle Belt: dry terrain is dominant; east-west road continuity is primary; Central Commons is a small, quiet connector and never a hero plaza.
- South Belt: the HoloCa protected area is road-free; west/east bypass arms remain separate until the approved rejoin point; no closed ring road is permitted.
- South road geometry is now maintained as a separate authoritative transparent layer rather than inferred from generated terrain art.
- Buildings, towers, ships, piers, labels, UI and decorative landmarks are forbidden during this rough terrain stage.

## Review gate

Before Rough Illustrated Master Plates can close:

1. North Crown must read as the only clearly elevated mass.
2. Middle Belt must remain a broad, mostly level dry civic terrace. **PASS / approved.**
3. Central Commons must stay visually subordinate. **PASS for the approved Middle Belt rough.**
4. South Belt must introduce the first real water plane while keeping Aquarium, HoloCa, Word Generator and the south continuation dry.
5. HoloCa bypass must remain legible and must not become a closed ring. **PASS for the authoritative road layer; painted integration still pending.**
6. Reserve parcels must read as ordinary scenery rather than construction pads.
7. All three plates must feel like one city under one muted storybook art direction.
8. No detail pass may begin until all three rough compositions are approved.
