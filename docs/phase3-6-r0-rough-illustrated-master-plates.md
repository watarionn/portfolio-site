# Portfolio City Phase 3.6-R0 — Rough Illustrated Master Plates

Date: 2026-09-15
Status: **CONSTRAINED WATERCOLOUR REVIEW CANDIDATES / NOT RUNTIME ART**
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

Visual roughs may soften edges, but they must not move locked roads, gates, reserve parcels, Growth Frontiers or Expansion Corridors.

## Current review candidates

Stored in Google Drive under:

`Portfolio City_採用設計画像_20260913/02_IllustratedCity/01_DistrictConnections/03_RoughMasterPlates/`

### North Crown

- Existing constrained rough reference: `phase3-6-r0_rough-illustrated_north-crown_v2.png`
- Drive file id: `1MqglOflwlQcU03JpNhgCo_04NLK5Wn0Y`
- Status: **review candidate retained**

### Middle Belt

- New mask-constrained candidate: `phase3-6-r0_middle-belt_constrained-watercolor_candidate.png`
- Drive file id: `19i-OZs9Q798F5jZcj5iRpkwpejk11lxS`
- Status: **review candidate**
- Required reading: a broad, mostly dry east-west civic terrace with only tiny fringe water/cliff hints; Central Commons remains small, quiet and subordinate.

### South Belt

- New mask-constrained candidate: `phase3-6-r0_south-belt_constrained-watercolor_candidate.png`
- Drive file id: `159HGEaB2OFyyarTZEaij9Jq4e8EIcOd0`
- Status: **review candidate**
- Required reading: `G-SOUTH → split → pass outside HoloCa protected region → rejoin → one south continuation`; the waterfront remains secondary to the city route.

## Superseded roughs

The earlier `phase3-6-r0_rough-illustrated_middle-belt_v2.png` and `phase3-6-r0_rough-illustrated_south-belt_v2.png` remain useful color/style comparisons only. They are superseded as geometry candidates by the mask-constrained versions above.

Several automatic image-generation attempts also produced poster layouts, labels, coordinates, buildings, ships, docks and other premature detail. Those outputs are rejected and are not project references.

The project must never treat attractive but structurally incorrect poster art as terrain authority.

## Terrain Mask Contract

The constrained candidates are governed by the mask contract added in Phase 3.6-R0:

- Middle Belt: dry terrain is dominant; east-west road continuity is primary; Central Commons is a small irregular paving patch, not a circular hero plaza.
- South Belt: the HoloCa protected area is road-free; west/east bypass arms remain separate until the approved rejoin point; no closed ring road is permitted.
- Buildings, towers, ships, piers, labels, UI and decorative landmarks are forbidden during this rough terrain stage.

The generated binary masks and mask review image are stored outside Git in Google Drive; Git stores the machine-readable contract.

## Review gate

Before Rough Illustrated Master Plates can close:

1. North Crown must read as the only clearly elevated mass.
2. Middle Belt must remain a broad, mostly level dry civic terrace.
3. Central Commons must stay visually subordinate.
4. South Belt must introduce the first real water plane while keeping Aquarium, HoloCa, Word Generator and the south continuation dry.
5. HoloCa bypass must remain legible and must not become a closed ring.
6. Reserve parcels must read as ordinary scenery rather than construction pads.
7. All three plates must feel like one city under one muted storybook art direction.
8. No detail pass may begin until these three rough compositions are approved.
