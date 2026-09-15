# Portfolio City Phase 3.6-R0 — Rough Illustrated Master Plates

Date: 2026-09-15
Status: **FINAL ROUGH MASTER REVIEW / MIDDLE APPROVED / NORTH + SOUTH AWAIT USER FINAL ADOPTION / NOT RUNTIME ART**
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
- Status: **final review candidate retained**

### Middle Belt — APPROVED

- Approved rough: `phase3-6-r0_middle-belt_APPROVED.png`
- Drive file id: `1eGZVy39zhO8NMd1CdmtAkJBdojyAzkGy`
- Status: **APPROVED by user on 2026-09-15**
- Approved reading: a broad, mostly dry east-west civic terrace with water/cliff presence held to the outer fringe; Central Commons remains visually subordinate; no decorative building or text layer is baked into terrain.
- Approval locks visual composition, not runtime registration.

### South Belt — FINAL REVIEW CANDIDATE

- Final review candidate: `phase3-6-r0_south-belt_FINAL-REVIEW-CANDIDATE_v5.png`
- Drive file id: `1RrJmfEbS31FFp2robOga56CF3lm3fZKW`
- Status: **geometry QA PASS / awaiting user final adoption**
- Road model: left/west bypass is the primary road; right/east bypass is intentionally narrower and visually subordinate so the composition reads as a bypass pair rather than a hero ring.
- Required route remains `G-SOUTH → split → outside HoloCa protected region → rejoin at (1600,2200) → one south continuation → EC-S`.
- Minimum road centerline clearance from HoloCa center: `241.81` world units.
- Required clearance including primary visual half-width: `190.00` world units.
- Road / dry-mask compliance at 1536 × 768 review resolution: `99.74%`.
- HoloCa protected region remains road-free.
- This candidate is still rough art only and does not change runtime terrain.

### Final review sheet

- `phase3-6-r0_rough-master-plates_final-review-sheet.png`
- Drive file id: `11zc5sXr12zZfGiWcVZ5iyx3LxJ4nfqL9`
- Contains the North review candidate, approved Middle Belt and South v5 final review candidate for one-screen comparison.

## Superseded / rejected roughs

The earlier `phase3-6-r0_rough-illustrated_middle-belt_v2.png` and `phase3-6-r0_rough-illustrated_south-belt_v2.png` remain useful color/style comparisons only. They are superseded as geometry candidates by the constrained workflow.

Automatic image-generation attempts that produced poster layouts, labels, coordinates, buildings, ships, docks, QA boards or other premature detail are rejected and are not project references.

Programmatic compositing attempts that created visible tiling, hard patches or geometric ring emphasis are also rejected. Only the v5 South final review candidate above is current.

## Terrain Mask Contract

- Middle Belt: dry terrain is dominant; east-west road continuity is primary; Central Commons is a small, quiet connector and never a hero plaza.
- South Belt: the HoloCa protected area is road-free; west/east bypass arms remain separate until the approved rejoin point; no visually dominant closed ring road is permitted.
- South road geometry is maintained separately from watercolor terrain and registered after the road-neutral base.
- Buildings, towers, ships, piers, labels, UI and decorative landmarks are forbidden during this rough terrain stage.

## Review gate

Before Rough Illustrated Master Plates can close:

1. North Crown must read as the only clearly elevated mass.
2. Middle Belt must remain a broad, mostly level dry civic terrace. **PASS / approved.**
3. Central Commons must stay visually subordinate. **PASS / approved.**
4. South Belt must introduce the first real water plane while keeping Aquarium, HoloCa, Word Generator and the south continuation dry. **PASS for v5 final review candidate.**
5. HoloCa bypass must remain legible and not read as a hero ring. **PASS for v5 final review candidate.**
6. Reserve parcels must read as ordinary scenery rather than construction pads.
7. All three plates must feel like one city under one muted storybook art direction.
8. No detail pass may begin until North and South receive final user adoption.
