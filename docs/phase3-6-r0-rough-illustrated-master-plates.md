# Portfolio City Phase 3.6-R0 — Rough Illustrated Master Plates

Date: 2026-09-15
Status: **CLOSED / ALL THREE MASTER PLATES APPROVED / NOT RUNTIME ART**
Branch: `phase3-6-r0-whole-city-blueprint-reset`

## Purpose

This step translates the approved Master Plate Blockout into simplified color-and-material roughs for North Crown, Middle Belt and South Belt without changing runtime terrain.

The Rough Illustrated Master Plates gate is now closed. The three approved roughs are composition/style authorities for production; exact geometry remains authoritative in the R0 machine-readable contracts.

## Locked visual direction

Later painted terrain must stay close to the Professor Layton series in overall drawing character, color mood and storybook-map feeling while remaining original to Portfolio City.

Mandatory traits:

- muted warm watercolor palette
- soft ink-like contours rather than hard vector edges
- large readable landform masses
- grouped vegetation rather than leaf-by-leaf detail
- restrained texture and very low micro-detail
- no baked text, labels, legends, coordinates or UI in runtime terrain
- no decorative building detail during the terrain stage
- avoid dense AI-looking surface noise

## Geometry authority

Exact geometry remains authoritative in:

- `docs/phase3-6-r0-master-plate-blockout.json`
- `docs/phase3-6-r0-terrain-slicing-landform.json`
- `docs/phase3-6-r0-terrain-mask-contract.json`
- `docs/phase3-6-r0-north-registration.json`
- `docs/phase3-6-r0-south-road-registration.json`

The next production contract is:

- `docs/phase3-6-r0-13chunk-production-handoff.json`
- `docs/phase3-6-r0-13chunk-production-handoff.md`

Visual terrain may soften edges, but it must not move locked roads, gates, reserve parcels, Growth Frontiers or Expansion Corridors.

## Approved master plates

Stored in Google Drive under:

`Portfolio City_採用設計画像_20260913/02_IllustratedCity/01_DistrictConnections/03_RoughMasterPlates/`

### North Crown — APPROVED

- Approved rough: `phase3-6-r0_north-crown_APPROVED.png`
- Drive file id: `1TlAKQsh-NwJZfEnb_QfKGD7Tw2hZhOvu`
- Status: **APPROVED on 2026-09-15**
- `OBS-R1`, `OBS-R2`, Sphere, HoloScope and Prime Dot Art registered anchor checks: PASS
- North spine / side access remain governed by the North registration contract
- no city-scale water barrier is introduced around the Crown

### Middle Belt — APPROVED

- Approved rough: `phase3-6-r0_middle-belt_APPROVED.png`
- Drive file id: `1eGZVy39zhO8NMd1CdmtAkJBdojyAzkGy`
- Status: **APPROVED on 2026-09-15**
- broad, mostly dry east-west civic terrace
- Central Commons remains quiet and visually subordinate
- water/cliff presence stays at the outer fringe

### South Belt — APPROVED

- Approved rough: `phase3-6-r0_south-belt_APPROVED.png`
- Drive file id: `1I9uytZItj5WDwjpLzfiYnbV0O-EREsNN`
- Status: **APPROVED on 2026-09-15**
- route contract: `G-SOUTH → split → outside HoloCa protected region → rejoin at (1600,2200) → one south continuation → EC-S`
- minimum validated centreline clearance from HoloCa centre: `241.81` world units
- required clearance including visual half-width: `190.00` world units
- road / dry-mask compliance: `99.74%`
- HoloCa protected road overlap: `0`

## Closure judgement

The Rough Illustrated Master Plates gate passes because:

1. North Crown is the only clearly elevated district mass and respects the North registration contract.
2. Middle Belt remains the approved broad, mostly level dry civic terrace.
3. Central Commons remains visually subordinate.
4. South Belt introduces the first real water plane without turning the whole city into an island map.
5. HoloCa remains protected by a split/rejoin route rather than a through-road.
6. Reserve/project clearings stay visually quiet enough for independent building assets.
7. All three master plates use the same muted storybook watercolor direction and restrained detail density.
8. The user approved the final visual gate and requested progression to production handoff.

## Superseded / rejected outputs

Earlier unconstrained generations that introduced poster layouts, titles, legends, coordinates, buildings, ships, docks, QA boards, ring roads, island reinterpretations or other premature detail remain rejected and are not project references.

Programmatic intermediate images with visible tiling or patch artifacts also remain rejected as final visual authorities. Their masks may still be used as geometry controls.

## Next gate

Proceed to **13-Chunk Terrain Production & Seam QA** using the approved three-master set and the exact handoff contract.

No runtime asset registration or `map-layout.json` update occurs until all 13 terrain chunks pass seam and runtime-size QA.
