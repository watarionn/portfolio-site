# Portfolio City Phase 3.6-R0 — Coordinate Growth Layout

Date: 2026-09-15
Status: **REVIEW READY / NOT RUNTIME DATA**
Source image: `phase3-6-r0_whole-city-structural-blueprint_APPROVED.png`
Coordinate source: `docs/phase3-6-r0-growth-layout.json`
Latest validated head: `a80e58c895447faee0e251f3500fcc8934d134e7`

## Purpose

This step converts the approved whole-city structural blueprint into a numeric growth plan without changing runtime `map-layout.json`.

The goal is not to freeze finished terrain. It is to prove that the city can accept more projects and more districts before terrain production restarts.

## Core structural decision

Do not place all future capacity inside the current 3 × 3 runtime core.

Instead, give each current district one adjacent **Reserve Apron chunk**:

- Observatory Hill: `1:-1`
- Archive Street: `-1:1`
- Workshop Alley: `3:1`
- Waterside Play: `1:3`

Each Reserve Apron contains two future-ready project parcels from the first production version of the redesigned city.

Because the reserve terrain is painted from the start, filling either parcel later requires only a new project-building asset and local removable scenery changes, not a terrain repaint.

## Why the Reserve Apron sits outside the current core

Trying to force two additional parcels into every current district region would either crowd existing project buildings or consume connector roads.

The approved blueprint explicitly prefers breathing room and outward growth over maximum initial density.

The Reserve Apron therefore becomes part of the district before the first replacement terrain is painted.

The current 14 project coordinates remain the baseline and are not moved during this coordinate exercise.

## Four-level growth hierarchy

The coordinate plan separates four levels that must never collapse into one another.

1. Current project parcel
   - occupied by one of the current fourteen projects
2. Reserve project parcel
   - already supported by initial terrain and ready for a future project
3. District Growth Frontier
   - extends the same district into a new adjacent chunk once reserve parcels are full
4. New District Expansion Corridor
   - continues outward beyond the existing district toward a future fifth, sixth or later district

A district Growth Frontier and a New District Expansion Corridor must not use the same only exit.

## Reserve capacity

The redesign starts with eight explicit reserve parcels:

| District | Reserve parcels | Planned immediate capacity |
| --- | --- | ---: |
| Observatory Hill | `OBS-R1`, `OBS-R2` | 3 current + 2 reserve = 5 |
| Archive Street | `ARC-R1`, `ARC-R2` | 4 current + 2 reserve = 6 |
| Workshop Alley | `WRK-R1`, `WRK-R2` | 4 current + 2 reserve = 6 |
| Waterside Play | `WAT-R1`, `WAT-R2` | 3 current + 2 reserve = 5 |

Reserve parcels use planning envelopes around `340 × 280` world units and support project-building widths around `260–270` world units.

The parcel is scenery while empty. It must never appear as a blank construction pad in final art.

## Observatory Hill growth structure

The Observatory reserve apron is the north cap `1:-1`.

- `OBS-R1`: `(1320, -220)`
- `OBS-R2`: `(1860, -220)`

These positions keep both `340`-world-unit envelopes fully inside the reserve apron while preserving the separate north corridor around `x=1600`.

Once both are occupied, Observatory Hill grows sideways instead of consuming the northward new-district route:

- primary district frontier: `GF-OBS-W` into `0:-1`
- fallback district frontier: `GF-OBS-E` into `2:-1`

The separate city-scale north corridor remains centered at `x=1600` and continues into `1:-2`.

This separation is intentional: adding Observatory project 6 must not remove the option to attach a future district farther north.

## Archive Street growth structure

Archive receives west reserve apron `-1:1`.

- `ARC-R1`: `(-320, 1020)`
- `ARC-R2`: `(-320, 1390)`

District growth continues vertically from that apron:

- fallback: `GF-ARC-N` into `-1:0`
- primary: `GF-ARC-S` into `-1:2`

The city-scale westward new-district corridor remains separate at `y=1260`, continuing into `-2:1`.

## Workshop Alley growth structure

Workshop mirrors the Archive logic on east reserve apron `3:1`.

- `WRK-R1`: `(3520, 1020)`
- `WRK-R2`: `(3520, 1390)`

District growth:

- fallback: `GF-WRK-N` into `3:0`
- primary: `GF-WRK-S` into `3:2`

The city-scale east corridor remains at `y=1260`, continuing into `4:1`.

## Waterside Play growth structure

Waterside receives south reserve apron `1:3`.

- `WAT-R1`: `(1320, 2520)`
- `WAT-R2`: `(1860, 2520)`

These positions mirror the Observatory spacing and leave the future southward city corridor centered around `x=1600`.

District growth spreads sideways:

- primary: `GF-WAT-W` into `0:3`
- fallback: `GF-WAT-E` into `2:3`

The city-scale south corridor remains centered at `x=1600` and continues into `1:4`.

This lets HoloCa remain a central landmark while later Waterside projects can spread left or right without blocking future city growth to the south.

## Initial production footprint implication

The redesign no longer treats the current 3 × 3 core as the complete initial city.

The structural production target becomes:

- current 9 core chunks
- 4 Reserve Apron chunks

Total initial structural footprint: **13 chunks**.

This does not mean all 13 chunks must be loaded eagerly at runtime. The modular architecture already allows distant chunks to be lazy-loaded.

The extra four chunks buy long-term project capacity before the city is repainted.

## Future frontier chunks are not initial terrain

The following chunks are deliberately *not* part of the first terrain-production requirement. They are reserved addresses for later growth:

- Observatory district extension: `0:-1`, `2:-1`
- Archive district extension: `-1:0`, `-1:2`
- Workshop district extension: `3:0`, `3:2`
- Waterside district extension: `0:3`, `2:3`
- future new district seeds: `1:-2`, `-2:1`, `4:1`, `1:4`

No final scenery may make these future connections impossible.

## Growth simulation results

### Simulation A — Observatory fourth project

Place the hypothetical project in `OBS-R1`.

Result: **PASS by structure**.

The reserve apron is part of initial terrain, so only the project-building asset and removable local scenery change.

### Simulation B — Observatory fifth project

Place the hypothetical project in `OBS-R2`.

Result: **PASS by structure**.

The current three Observatory projects remain untouched and circulation remains separated from the north expansion corridor.

### Simulation C — Observatory sixth project

Both reserve parcels are occupied. Extend Observatory through `GF-OBS-W` into chunk `0:-1` and place a candidate sixth project near `(640, -360)`.

Result: **PASS by structure**.

Only the new terrain chunk, its seam scenery and the new building asset are required. Existing Observatory terrain does not need repainting.

### Simulation D — Fifth district

Use `EC-E` from the Workshop reserve apron and attach the future district seed chunk `4:1`.

Result: **PASS by structure**.

The east corridor is not the Workshop district-growth socket, so Workshop can continue to grow independently while a new district connects farther east.

## Machine validation result

Latest-head validation confirms:

- 14 / 14 baseline project coordinates match runtime `map-layout.json`
- 8 / 8 reserve parcel envelopes fit fully inside their designated Reserve Apron chunks
- each of the 4 current districts has exactly 2 reserve parcels
- 8 district Growth Frontier sockets are distinct from the 4 new-district Expansion Corridor sockets
- simulations `SIM-A` through `SIM-D` are present and require no movement of current projects
- `git diff --check` passes
- public repository boundary validation passes
- Portfolio City contract validation remains `14 works / 4 districts / 9 runtime chunks`
- runtime `map-layout.json` blob SHA remains identical to `main`

## Connector preservation

The six P0 connector gates remain recorded exactly as the current planning anchors.

No reserve parcel occupies those gates.

The HoloCa rule also remains: a straight north-south road must not pass through its parcel. The future southward city corridor may rejoin only after routes have passed around HoloCa.

## Runtime stop condition

`portfolio-city/data/map-layout.json` remains unchanged during R0.

Do not register the four Reserve Apron chunks in runtime data until:

1. the coordinate plan is approved,
2. the new terrain slicing plan is approved,
3. the replacement terrain art is ready for the same world geometry.

## Gate for the next step

The Coordinate Growth Layout is ready for review when:

- all current fourteen positions are preserved as the baseline,
- eight reserve parcels are plausible,
- no reserve parcel blocks a P0 connector,
- each district has primary/fallback extension options where practical,
- district extension and new-district expansion use distinct sockets,
- simulations A–D remain possible without repainting existing terrain,
- the 13-chunk initial footprint is acceptable as a modular, lazy-loadable production target.

These conditions are now mechanically satisfied; visual/planning approval remains the final gate before terrain slicing begins.
