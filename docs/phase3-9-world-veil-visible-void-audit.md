# Phase 3.9 World Veil Pass — Visible-void audit

Updated: 2026-09-18  
Baseline: `main` at `7bdd31da65c507f3a3e5605449d9c0d175f04c23`  
Production runtime baseline: `35444da469696981090e415702c64e1225546ab9`

## Purpose

This audit identifies every visible unpainted region inside the existing Portfolio City world canvas before the World Veil Pass begins.

The audit does not approve any world-bound, terrain-topology, district, road, project-placement, clearing, or HoloCa geometry change.

The required direction remains:

`13-chunk authored city core + low-detail rectangular outer-world backfill + translucent illustrated veil`

The backfill must exist beneath the translucent veil. Fog over a truly blank canvas is not sufficient.

## Current world geometry

The existing world is a 5 × 5 chunk-sized rectangular canvas:

- world origin: `(-1024, -768)`
- world size: `5120 × 3840`
- chunk size: `1024 × 768`
- active terrain chunks: 13
- currently unpainted chunk-sized cells inside the world bounds: 12
## 5 × 5 coverage matrix

| row \ col | -1 | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- | --- |
| -1 | C | G | A | G | C |
| 0 | G | A | A | A | G |
| 1 | A | A | A | A | A |
| 2 | G | A | A | A | G |
| 3 | C | G | A | G | C |

Legend:

- **A** = current authored / active terrain
- **G** = currently blank cell that is an already documented future district Growth Frontier address
- **C** = currently blank outer-corner cell, not a documented district-extension address

The eight **G** cells are:

- Observatory: `0:-1`, `2:-1`
- Archive: `-1:0`, `-1:2`
- Workshop: `3:0`, `3:2`
- Waterside: `0:3`, `2:3`

The four **C** cells are:

- `-1:-1`
- `3:-1`
- `-1:3`
- `3:3`
## Expansion-corridor constraint

The city-scale new-district seed addresses remain outside the current rectangular world:

- north: `1:-2`
- west: `-2:1`
- east: `4:1`
- south: `1:4`

Their approaches pass through the existing active cardinal apron chunks `1:-1`, `-1:1`, `3:1`, and `1:3`.

World Veil backfill must therefore leave those four outward approaches visually and structurally readable. A road, path, stream, or open terrain transition may fade into mist there, but a permanent cliff, dense wall of trees, shoreline, or landmark must not seal the route.

## Production viewport audit

The production page was inspected at exact CSS viewport widths 390, 820, and 1440 using the live deployed runtime.

| viewport | map canvas | visible map viewport | initial scroll | initially visible blank area |
| --- | ---: | ---: | ---: | ---: |
| 390 | 768 × 576 | 372 × 576 | x=208, y=0 | ~23.5% |
| 820 | 1024 × 768 | 739 × 768 | x=155, y=0 | ~35.7% |
| 1440 | 1680 × 1260 | 1311 × 830 | x=206, y=0 | ~31.7% |

All three production audits retained:

- 14 project buttons
- 6 currently illustrated project buildings
- 13 active terrain chunks
- the existing `world-edge-frame`
- `pointer-events: none` on the edge frame
## Visible voids by breakpoint

### 390

Initial view exposes four inner north/south Growth Frontier cells:

- `0:-1` — about 64.6% of the cell
- `2:-1` — about 77.6%
- `0:3` — about 64.6%
- `2:3` — about 77.6%

The map is vertically fully visible at this breakpoint. Horizontal scrolling can expose the remaining side and corner voids.

### 820

The initial centered view exposes **all 12 blank cells** at least partially.

The two inner northern and two inner southern Growth Frontier cells are fully exposed. Side and corner voids are partially visible on both edges. This is the breakpoint where the cross-shaped terrain silhouette reads most clearly as unfinished background.

### 1440

The initial desktop view exposes eight blank cells:

- top: `-1:-1`, `0:-1`, `2:-1`, `3:-1`
- sides: `-1:0`, `3:0`, and partial `-1:2`, `3:2`

The bottom row is below the initial 830px-high map viewport, but desktop dragging exposes it. All 12 blank cells are reachable during normal map navigation.
## Existing edge treatment finding

Phase 3.8 currently provides:

- four corner paper-mist fields
- twelve narrow feather bands at exposed edges of the 13-chunk cross

Those elements sit above the map-level paper/terrain gradient, but the 12 missing cells have no actual low-detail terrain layer underneath them.

Therefore the visible-void problem is not a broken seam or a missing active chunk. It is a **visual-density collapse** from painted terrain directly into a mostly flat map background.

This confirms the adopted World Veil order:

1. backfill the 12 currently blank cells with deliberately low-detail outer-world scenery,
2. preserve all documented future connections,
3. place the stronger illustrated veil above that scenery,
4. keep active terrain, projects, and interactions visually dominant.

## Coverage tiers for the next phase

**Tier A — Growth Frontier backfill**

The eight **G** cells are highest constraint. They should receive sparse, removable-looking scenery with clear continuation space. Suitable motifs include grassland, minor paths, low tree clusters, small stone edges, continuation water, and terrain that visibly disappears into mist.

Do not place permanent focal landmarks, dense forests across sockets, hard cliffs across routes, or project-like architecture in these cells.

**Tier B — Outer-corner backfill**

The four **C** cells may be quieter and carry denser veil coverage. They can hold broader hills, sparse woods, water, or negative-space scenery because they are not current district-extension addresses.

They still remain peripheral world, not new authored districts.
## Audit gate

**Visible-void audit: COMPLETE**

The current runtime geometry is valid and must remain unchanged for the next step.

The visual audit confirms that low-detail rectangular backfill is necessary before a stronger translucent veil is applied.

No production implementation is approved by this audit alone.

## Next step

Proceed to **Rectangular backfill coverage plan**.

That plan should assign a low-detail scenery vocabulary and continuity intent to each of the 12 blank cells while explicitly preserving the eight Growth Frontier addresses and the four outward Expansion Corridor approaches.
