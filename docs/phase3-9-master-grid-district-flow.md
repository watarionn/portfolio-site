# Phase 3.9 - 16x12 Master Grid: Published Cluster / District Flow

Updated: 2026-09-19
Status: CP-D1 working blueprint
Scope: logical topology only; no final geography art, feature-flag flip, merge, or deployment

## Locked world contract

- Master Grid: 16 columns x 12 rows = 192 logical district cells.
- One logical cell is the stable home of one district.
- Grid coordinates are internal and visitor-invisible.
- Publishing a new district claims one previously unpublished cell.
- Adding a project to an existing district does not claim another world cell.
- Camera framing derives from published cells plus nearby frontier context, never the full 16x12 world.
- The old H2 100x64 plane remains composition-study evidence only.

## Coordinate convention

Columns: A-P, west to east.
Rows: 01-12, north to south.

The launch cluster is intentionally placed slightly west/north of the geometric center. This preserves generous reserve to the east, south, and offshore directions while avoiding a suspiciously centered four-cell stamp.

## W0 published cluster

Stable working homes:

- Observatory Hill: H05
- Archive Street: G06
- Workshop Alley: I06
- Waterside Play: H07

Topology:

```
          H05
           |
    G06 -- + -- I06
           |
          H07
```

The '+' is connective geography / Central Commons study space, not a fifth district cell and not a clickable district.

This preserves the existing semantic relationships:
- Observatory is uphill / northward.
- Archive and Workshop remain land-connected on opposite sides.
- Waterside remains southward toward water.
- no current district is forced onto an island.
- every current district keeps multiple future adjacency choices.

## Central Commons contract

Central Commons is connective public realm, not a district home cell.

It may visually overlap the seams among G06 / H05 / I06 / H07, but it must not:
- consume one of the 192 district addresses,
- become a required navigation stop,
- block future adjacency,
- imply that the four launch districts are four quadrants of a rigid square.

Its geometry should be irregular and subordinate to the districts.

## Expansion fronts

The launch cluster retains three semantically different expansion fronts.

### F-A Inland / west-northwest
Primary candidate cells:
- F05
- F06
- G05
- G07

Purpose:
- land-connected district growth,
- archive/civic/old-town style continuations if future semantics fit,
- easy short-pan expansion.

### F-B Coastal / south-southeast
Primary candidate cells:
- I07
- G07
- H08
- I08

Purpose:
- coastal or waterside growth,
- river-mouth / harbor / leisure-adjacent geography,
- opens the world downward without forcing offshore travel.

### F-C Offshore / east
Primary candidate cells:
- J05
- J06
- J07
- K06

Purpose:
- island / channel-separated district growth,
- visually communicates that the Master World continues beyond the mainland,
- should not be used as the first automatic expansion unless a future district theme genuinely benefits from separation.

Cells listed above are reserves, not preassigned district identities.

## District 5 / District 6 growth simulation

No theme is assigned yet.

Preferred topology rule:
- District 5 opens on either F-A or F-B.
- District 6 opens on a different front from District 5.
- F-C remains available as a distinct later reveal unless an actual project family calls for offshore geography.

This avoids producing a single directional strip and makes the published world feel discovered rather than appended.

Example topology A:
- D5 -> G07 (coastal transition)
- D6 -> G05 or F06 (inland)

Example topology B:
- D5 -> G05 (inland)
- D6 -> I07 or H08 (coastal)

These are simulation examples only, not reserved addresses.

## Published bounds / camera rule

W0 published cells: G06, H05, I06, H07.

Logical published bounding box:
- columns G-I
- rows 05-07

Camera composition must add a frontier context band around this box rather than expose all 192 cells.

Working framing:
- desktop: current 3x3 published footprint plus approximately 1-2 cell-equivalents of irregular frontier context,
- mobile: readable district scale first; use short pan instead of fitting the entire published footprint,
- frontier reveal is organic scenery and may be asymmetric,
- unpublished cells never render as empty grid squares.

When a new district is published:
1. claim its stable cell,
2. reveal connective geography required to reach it,
3. recompute published bounds,
4. expand/recenter entry framing only if readability requires it,
5. never relocate previously published district homes.

## Anti-grid visual rules

The 16x12 system must not leak into the illustrated map.

Production geography should:
- cross cell boundaries freely,
- use curved roads, coastlines, ridges, vegetation, and waterways,
- offset district focal points within their home cells,
- avoid four equal quadrants around Central Commons,
- avoid roads that trace cell edges,
- allow cloud/frontier silhouettes to cut across many cells.

The cell is an address, not a visible tile.

## Capacity check

W0 uses 4 / 192 cells.
A 9-district world uses 9 / 192 cells.
A 10+ district world still leaves the overwhelming majority of the master world undeveloped.

Therefore world scale is no longer constrained by near-term district count. The design problem shifts from capacity to readable local reveal.

## Decision status

CP-D1 result: READY FOR COMPOSITION TEST.

The launch topology uses:
- H05 Observatory
- G06 Archive
- I06 Workshop
- H07 Waterside

Central Commons remains non-address connective geography.

No future district cell is permanently assigned yet.

## Next checkpoint

CP-D2 - Published Cluster Composition Test

Create a non-final visual/blockout that:
1. places the four district homes on the 16x12 address system,
2. hides the grid in visitor view,
3. shows irregular mainland/coast/highland relationships,
4. demonstrates F-A / F-B / F-C reveal directions,
5. compares desktop and mobile W0 camera framing,
6. verifies the result does not read as a four-quadrant cross.

Do not create final production illustration or enable the new hierarchy during CP-D2.
