# Portfolio City Phase 3.6-R0 — Terrain Mask Contract

Date: 2026-09-15
Status: **MASK AUTHORITY / NOT RUNTIME ART**
Branch: `phase3-6-r0-whole-city-blueprint-reset`

## Why this step exists

Repeated illustrated-generation attempts proved that freeform image generation can preserve the desired watercolor mood while still inventing buildings, ports, rings, labels and other geometry that conflicts with the approved city structure.

This contract removes that freedom before terrain painting resumes.

The next illustrated rough must be painted *inside* these masks, not composed from scratch.

## Geometry authority

The mask contract inherits geometry from:

- `docs/phase3-6-r0-master-plate-blockout.json`
- `docs/phase3-6-r0-terrain-slicing-landform.json`
- `docs/phase3-6-r0-growth-layout.json`

If an attractive image conflicts with these masks, the image is wrong.

## Allowed visual vocabulary

At this stage the rough may contain only:

- dry land masses
- primary and secondary roads
- broad terrace / cliff masses
- water masses
- grouped vegetation
- scenery-backed reserve parcel surfaces

Do not add buildings, houses, towers, domes, landmark bridges, boats, docks, piers, signs, text, coordinates, compass graphics, legends, UI or dense decorative detail.

## Middle Belt mask

Middle Belt must read first as **one continuous dry east-west urban terrace**.

The primary east-west spine stays centered around `y=1260` from the west reserve apron through Archive, Commons and Workshop to the east reserve apron.

The north-south connector at `x=1600` remains secondary and passes through a deliberately quiet Commons.

Central Commons is not a circular plaza. Its allowed paving footprint is a small irregular polygon approximately 230 world units across. It must not contain a fountain, tower, monument or other hero object.

Water is allowed only as two tiny outer-fringe hints near the far southwest and southeast edges. Internal water cuts and major internal cliffs are forbidden.

The six P0 gate points remain open and dry.

## South Belt mask

South Belt must read as a **low city terrace with water around the outer sides**, not as an island resort or harbor poster.

The HoloCa center at `(1600,1820)` has a protected road-free radius of 175 world units and a larger dry radius of 250 world units.

The circulation topology is locked:

`G-SOUTH -> split -> left/right bypass -> rejoin at (1600,2200) -> single south continuation -> EC-S`

A complete ring road is forbidden.

The left and right bypass arms must remain visibly distinct until the rejoin point. From there the route becomes one central southbound spine through the reserve apron.

Water may occupy outer west/east/lower fringes, but it must never erase the dry central continuation, reserve parcels or growth sockets.

## Art direction

The visual target remains the approved Whole-City Blueprint:

- muted warm watercolor
- soft ink contours
- broad readable shapes
- grouped vegetation
- restrained texture
- low micro-detail
- no AI-looking ornamental density

The Professor Layton-series influence remains a mood and illustration-language target, not a request to reproduce specific copyrighted artwork.

## Review gate

This mask step passes when:

1. Middle Belt is visibly continuous and predominantly dry.
2. Central Commons is small, irregular and subordinate.
3. South Belt contains no circular or polygonal ring-road artifact.
4. HoloCa is protected by two bypass arms that rejoin only to its south.
5. The south continuation stays dry through `1:3` to `EC-S`.
6. All gates, reserve parcels and growth sockets remain unobstructed.
7. No forbidden decorative object appears in the rough terrain.

Only after this gate passes should a new watercolor rough be produced.
