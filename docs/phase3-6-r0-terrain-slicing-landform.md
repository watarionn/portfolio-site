# Portfolio City Phase 3.6-R0 — Terrain Slicing / Landform Blockout

Date: 2026-09-15
Status: **PLANNING CONTRACT / NOT RUNTIME DATA**
Coordinate source: `docs/phase3-6-r0-growth-layout.json`
Machine-readable slicing source: `docs/phase3-6-r0-terrain-slicing-landform.json`

## Purpose

This step converts the approved Whole-City Structural Blueprint and Coordinate Growth Layout into a terrain-production structure.

It does **not** create final terrain art and does not yet modify `portfolio-city/data/map-layout.json`.

The goals are:

1. give all 13 initial structural chunks a clear job,
2. define three coherent painting masters so terrain is not generated as thirteen unrelated pictures,
3. lock coarse elevation / landform logic before illustration,
4. make chunk seams technical slices rather than visible district borders,
5. preserve all reserve parcels, Growth Frontiers and New District Expansion Corridors.

## 1. Runtime slicing rule

The future runtime unit remains one terrain asset per chunk.

One chunk is:

- `1024 × 768 world units`
- recommended runtime derivative: `2048 × 1536 px` WebP
- render region: exactly the chunk rectangle

Do not return to the old Observatory pattern where one irregular large terrain image owns an arbitrary world-space render region.

The new terrain assets should map cleanly one-to-one with their chunk coordinates.

### Structural world bounds

The 13-chunk initial structure extends beyond the current runtime bounds:

```text
x = -1024 .. 4096
y =  -768 .. 3072
```

Structural bounding size:

```text
5120 × 3840 world units
```

The current renderer cannot safely register negative chunks by merely dividing raw `x/y` by a fixed positive width/height.

A later runtime migration must therefore derive world bounds or store an explicit world origin / `minX`, `minY` and normalize positions against those bounds.

R0 only records this requirement; runtime code is unchanged here.

## 2. Production masters

Runtime assets remain chunk-sized, but terrain is painted in three larger masters and sliced afterward.

This prevents thirteen independently generated images from drifting in perspective, palette, lighting or line density.

### North Crown Master

Contains:

- `1:-1`
- `0:0`
- `1:0`
- `2:0`

Nominal world bounds:

```text
x = 0 .. 3072
y = -768 .. 768
```

Role:

- Observatory Hill as one coherent highland mass
- two Observatory reserve parcels
- north district / future-district growth sockets
- the entire descent into `G-NORTH`

### Middle Belt Master

Contains:

- `-1:1`
- `0:1`
- `1:1`
- `2:1`
- `3:1`

Nominal bounds:

```text
x = -1024 .. 4096
y = 768 .. 1536
```

Role:

- Archive reserve apron and core
- Central Commons
- Workshop core and reserve apron
- one continuous east-west civic terrace

### South Belt Master

Contains:

- `0:2`
- `1:2`
- `2:2`
- `1:3`

Nominal bounds:

```text
x = 0 .. 3072
y = 1536 .. 3072
```

Role:

- Archive / Workshop descents to the water district
- HoloCa bypass and route rejoin
- Waterside west / centre / east terrain
- two Waterside reserve parcels
- district-growth sockets and the future south city corridor

## 3. Paint overlap and seam safety

Each master is painted with `96 world units` of working overlap beyond its nominal boundary where another master touches it.

Final chunk derivatives are trimmed back to the exact chunk rectangle.

Every chunk seam also reserves at least `80 world units` on both sides as a seam-safe band.

Inside a seam-safe band, do not place:

- a unique landmark,
- a named project building,
- an irreplaceable cliff terminus,
- a one-off giant prop,
- a hard district gate,
- text baked into terrain.

District identity changes use approximately `160–240 world units` of material / planting / density transition where appropriate.

## 4. Relative elevation model

The blockout uses relative classes rather than final metre heights.

| Class | Role |
| --- | --- |
| `H3` | highest Observatory reserve / crown terrace |
| `H2` | upper Observatory project terraces |
| `M1` | Archive / Workshop urban terrace |
| `M0` | Central Commons / shared transition terrace |
| `L1` | Waterside urban / promenade terrace |
| `L0` | south reserve / coastal expansion terrace |
| `W` | water plane; shoreline remains adjustable during terrain art |

The city should read as one broad progression:

```text
north highland
→ Observatory terraces
→ middle civic terrace
→ lower Waterside terraces
→ south coastal expansion
```

Do not create several unrelated dramatic cliff systems merely because individual chunks permit them.

## 5. 13-chunk purpose matrix

| Chunk | Master | Primary role | Projects / reserve capacity | Landform blockout |
| --- | --- | --- | --- | --- |
| `1:-1` | North Crown | Observatory reserve cap | `OBS-R1`, `OBS-R2` | broad `H3` plateau; side reserve terraces; open north saddle; centre route stays free |
| `0:0` | North Crown | Observatory west shoulder | Sphere | `H2` shoulder; softened cliff / retaining descent toward west and south |
| `1:0` | North Crown | Observatory core | HoloScope | `H2` core descending to `M1`; broad centre stair/ramp reaches `G-NORTH` |
| `2:0` | North Crown | Observatory east shoulder | Prime Dot Art | `H2` shoulder; same elevation logic as west without copy-paste scenery |
| `-1:1` | Middle Belt | Archive reserve apron | `ARC-R1`, `ARC-R2` | mostly level `M1`; reserve courtyards/gardens; west corridor stays open |
| `0:1` | Middle Belt | Archive core | YOREI, Cheatsheet | dry `M1` urban terrace; Archive street remains continuous |
| `1:1` | Middle Belt | Shared core / Commons + Archive inner edge | Actress Finder, SHISHA | mostly level `M0`; Commons stays quiet; four main gates remain readable |
| `2:1` | Middle Belt | Workshop core | DQB2, MADORI, Maze Maker, Anagram | dry `M1` practical terrace; no dramatic grade break inside project field |
| `3:1` | Middle Belt | Workshop reserve apron | `WRK-R1`, `WRK-R2` | mostly level `M1`; reserve yards; east corridor stays open |
| `0:2` | South Belt | Waterside west inner | Aquarium | `L1`; Archive-water descent; dry project terrace with water pushed toward outer edges |
| `1:2` | South Belt | Waterside centre / HoloCa bypass | HoloCa | `L1`; road splits after `G-SOUTH`, passes both sides of HoloCa, then rejoins south of it |
| `2:2` | South Belt | Waterside east inner | Word Generator | `L1`; Workshop-water descent; dry project terrace with water pushed toward outer edges |
| `1:3` | South Belt | Waterside reserve apron / south continuation | `WAT-R1`, `WAT-R2` | `L0`; side reserve terraces; centre south corridor kept free |

## 6. North Crown blockout

### `1:-1` — Observatory reserve cap

This chunk is part of Observatory Hill from the first replacement-terrain release, not a future optional add-on.

It must support:

- `OBS-R1`
- `OBS-R2`
- `GF-OBS-W`
- `GF-OBS-E`
- `EC-N`
- a dry centre route into `1:0`

The two reserve parcels sit on side terraces.

The north-centre must remain visibly unfinished / extendable enough that a future city route can continue through `EC-N` without demolishing a landmark.

### `0:0` / `2:0` — Observatory shoulders

These are high shoulder terraces, not independent scenic islands.

The west/east edges may use cliffs or retaining faces, but the seam toward `1:0` must remain one continuous ground family.

Avoid excessive tiny observatory props. Sphere and Prime Dot Art should remain the readable foreground identities.

### `1:0` — Observatory core

HoloScope remains the visual project focus.

The terrain provides:

- a high central civic terrace,
- one broad descending route,
- shallow terrace steps rather than a single giant wall,
- an exact `160 world-unit` clear route through `G-NORTH`.

## 7. Middle Belt blockout

The whole middle row should feel much flatter than Observatory Hill.

Archive, Commons and Workshop differ through material, architecture and density, not through large disconnected elevation jumps.

### Archive side

`-1:1` and `0:1` share one level street family around `y=1260`.

The reserve apron must make `ARC-R1` and `ARC-R2` look like ordinary scholarly courtyards / gardens while empty.

`EC-W` remains a true outward city route.

### Central Commons

The neutral shared core sits mainly around `x≈1440..1760` in `1:1`.

It remains subordinate to project buildings.

Terrain should be quiet enough that future project art still leads visually.

No giant fountain, tower, compass monument or other fifth-district centrepiece is permitted.

### Workshop side

`2:1` and `3:1` remain one practical urban terrace.

The Workshop reserve apron uses removable yards / ordinary service scenery rather than blank lots.

`EC-E` remains open for a future district independently of Workshop's own vertical Growth Frontiers.

## 8. South Belt blockout

Water begins here, not in Central Commons.

The exact shoreline is intentionally not frozen yet, but dry circulation and project-ground contact are locked first.

### West / east inner chunks

`0:2` and `2:2` each provide:

- a dry project terrace,
- one mid-to-low descent from the Middle Belt,
- a traversable connection at the existing Waterside anchor (`x=1024` or `2048`, `y=1840`),
- water mainly toward the outside / lower areas rather than under the project parcels.

### HoloCa centre

`1:2` must visually prove the no-through-road rule.

Required route logic:

```text
G-SOUTH
   |
 split
 /   \
HoloCa
 \   /
 rejoin
   |
1:3 centre route
```

The two arms may rejoin south of HoloCa before the `y=2304` seam.

This is preferable to carrying two separate roads through the reserve apron, where they would compete with `WAT-R1` and `WAT-R2`.

### South reserve apron

`1:3` is a low coastal terrace / peninsula rather than a water-filled chunk.

It must simultaneously support:

- `WAT-R1`
- `WAT-R2`
- `GF-WAT-W`
- `GF-WAT-E`
- the central `EC-S` route

The reserve parcels occupy side wings, leaving the central southward corridor structurally free.

## 9. Critical seam contracts

The following seams are not arbitrary crop lines.

### North → Middle

- `1:0` → `1:1`: `G-NORTH`, `x=1600`, clear width `160`
- west/east Observatory shoulder seams may descend visually but do not gain competing primary roads

### Archive / Commons / Workshop

One east-west street family crosses:

```text
-1:1 → 0:1 → 1:1 → 2:1 → 3:1
```

with its dominant path around `y=1260`.

No chunk boundary may look like a district entrance gate.

### Middle → South

- `0:1` → `0:2`: `G-ARCHIVE-WATER`, `x=760`, width `120`
- `1:1` → `1:2`: `G-SOUTH`, `x=1600`, width `160`
- `2:1` → `2:2`: `G-WORKSHOP-WATER`, `x=2440`, width `120`

### Waterside internal

- `0:2` ↔ `1:2`: dry connection around `y=1840`
- `1:2` ↔ `2:2`: dry connection around `y=1840`
- `1:2` → `1:3`: HoloCa bypass has already rejoined into a central dry route around `x=1600`

## 10. Art-direction lock

All later blockout-to-art work must preserve the adopted direction:

- Professor Layton-series-inspired storybook character and colour mood,
- muted warm palette,
- simplified readable masses,
- restrained line/detail density,
- no dense micro-detail merely to make the image look expensive,
- no AI-looking clutter,
- no text baked into terrain.

At runtime size, terrain must support project buildings rather than compete with them.

## 11. Acceptance gate

Terrain Slicing / Landform Blockout is ready to close when review confirms:

- all 13 initial chunks have distinct responsibilities,
- three master plates can be painted as coherent scenes,
- runtime extraction stays one chunk = one exact render region,
- the negative-coordinate world-bounds requirement is explicitly understood,
- North Crown / Middle Belt / South Belt read as one elevation progression,
- all eight reserve parcels remain dry and usable,
- no Growth Frontier or Expansion Corridor is sealed by terrain,
- Central Commons remains subordinate,
- the HoloCa bypass can split and rejoin without entering reserve parcels,
- final terrain art has not yet been generated.

## Stop condition

Stop at coarse terrain geometry and seam contracts.

Do not yet create replacement Observatory terrain, Archive terrain, Workshop terrain, Waterside terrain or remaining project-building illustrations.