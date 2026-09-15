# Portfolio City Phase 3.6-R0 — Master Plate Blockout

Date: 2026-09-15
Status: **BLOCKOUT CONTRACT / NOT RUNTIME DATA**
Coordinate source: `docs/phase3-6-r0-master-plate-blockout.json`

## Purpose

This stage turns the approved 13-chunk slicing plan into three large landform compositions before any final terrain illustration begins.

The three production masters are:

- North Crown
- Middle Belt
- South Belt

The blockout is intentionally coarse. It fixes only major land masses, elevation relationships, roads, dry circulation, shoreline placement, cliff / retaining-edge logic and growth openings.

Do not add final architecture, small props, dense vegetation detail or decorative micro-texture at this stage.

## Global composition rule

Portfolio City must read as one continuous place rather than three unrelated paintings.

The broad vertical progression is:

`H3 / H2 Observatory highland → M1 / M0 civic middle city → L1 / L0 waterside lowland`

The transition is gradual. Hard theme-park gates, sealed cliffs and abrupt biome swaps remain prohibited.

The adopted art direction still applies later: Professor Layton-series-inspired storybook character, muted colour mood, simplified readable forms and restrained detail. The blockout itself is geometric and functional, not final art.

## North Crown

North Crown establishes the only clearly elevated district mass.

### Primary form

- `1:-1` is the H3 reserve crown.
- `0:0`, `1:0`, `2:0` form three H2 shoulders / terraces.
- HoloScope occupies the central high terrace.
- Sphere and Prime Dot Art occupy separate side shoulders.
- The north-south route remains centered on `x=1600` from `EC-N` through the reserve crown and into `G-NORTH`.

### Descent

The southern Observatory edge must not become one continuous cliff wall.

Use broad terracing and one dominant central stair / ramp descent around `x=1600`.

The side shoulders may have softened retaining edges, but they must visually taper into the Middle Belt rather than looking like isolated floating islands.

### Growth protection

The north reserve crown keeps:

- `OBS-R1`
- `OBS-R2`
- `GF-OBS-W`
- `GF-OBS-E`
- `EC-N`

open and free of irreplaceable terrain.

## Middle Belt

Middle Belt is the city's stable horizontal platform.

It must feel much flatter than North Crown and quieter than South Belt.

### Archive and Workshop

Archive and Workshop both sit on M1 urban terraces.

The east-west city street remains continuous near `y=1260` from `EC-W` to `EC-E`.

Do not use major cliffs inside the current project fields.

### Central Commons

Central Commons is M0, but the height difference from M1 is intentionally small.

The grade change should read through low curbs, shallow ramps, slight paving level changes and planting edges rather than a visible canyon or sunken plaza.

Central Commons remains shared infrastructure and must not become the strongest landmark on the plate.

### South departures

Three southbound descents leave the Middle Belt:

- Archive to Waterside at `x=760`
- Central Commons to `G-SOUTH` at `x=1600`
- Workshop to Waterside at `x=2440`

These descents may begin visually near the southern edge but must not consume the project fields above them.

## South Belt

South Belt introduces the first true water plane.

Water is a district feature here, not a whole-city background texture.

### Dry land structure

South Belt uses three L1 dry land masses:

- west promenade / Aquarium terrace
- central HoloCa protected terrace
- east promenade / Word Generator terrace

The lower `1:3` reserve apron is L0 and remains a dry central peninsula / continuation terrace.

### HoloCa bypass

The `G-SOUTH` route remains central only for a short throat after the seam.

It then splits into west and east arms around HoloCa.

The arms rejoin around `y=2200`, before the `1:2 → 1:3` seam, so the south reserve apron receives one clean central continuation.

A straight road through HoloCa is prohibited.

### Water and shoreline

Water begins mainly after about `y=1850`.

The west and east water bodies sit outside the central peninsula.

Keep these dry:

- Aquarium project ground
- Word Generator project ground
- HoloCa terrace
- west/east anchor routes at `y=1840`
- the full `1:3` reserve apron corridor between `x=1024..2048`

The shoreline may be irregular and picturesque later, but it cannot block Growth Frontiers or the south Expansion Corridor.

## Blockout hierarchy

At this stage, visual priority is functional:

1. land / water split
2. elevation masses
3. primary roads and gates
4. current project ground envelopes
5. reserve project envelopes
6. growth sockets

Decorative scenery is deliberately absent.

## Production rule

The three blockouts are production masters, not runtime assets.

Final terrain will still be exported as one WebP per exact `1024 × 768` chunk rectangle.

The existing `96` world-unit paint overlap remains required around master boundaries so the painted source can be compared before slicing.

## Acceptance gate

This blockout passes only when:

- all 14 current projects remain on dry, usable ground,
- all 8 reserve parcels remain on dry, usable ground,
- all 6 P0 connector gates remain open,
- all 8 district Growth Frontiers remain open,
- all 4 new-district Expansion Corridors remain open,
- North Crown is recognizably higher than the Middle Belt,
- Middle Belt remains predominantly level,
- water is confined to the South Belt,
- HoloCa is bypassed rather than pierced by a road,
- no final decorative art has been allowed to dictate geography.

## Stop condition

Do not generate final terrain after this document alone.

The next review artifact is a three-panel blockout QA sheet showing North Crown, Middle Belt and South Belt at the same world-space scale.

Only after the blockout geometry is approved should the project move into rough illustrated master-plate production.
