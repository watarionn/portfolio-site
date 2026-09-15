# Portfolio City Phase 3.6-P1 — Central Commons Connector Terrain Design

Date: 2026-09-15
Baseline main: `604a25cc482308fc11fa6b695da64ccb97a059fe`
Working branch: `phase3-6-central-commons-connector-terrain-design`
Status: **DRAFT / DESIGN REVIEW** — composition contract only; no runtime terrain asset or remaining-district production yet

## 1. Purpose

Phase 3.6-P1 converts the validated Phase 3.6-P0 connection graph into a paintable Central Commons terrain composition.

This stage defines only:

- Central Commons road geometry and hierarchy
- the quiet civic square composition
- four primary transition-zone treatments around `G-NORTH`, `G-ARCHIVE`, `G-WORKSHOP`, and `G-SOUTH`
- elevation and ground-contact rules
- the post-`G-SOUTH` split contract that protects the existing HoloCa placement
- the shared Portfolio City material vocabulary that later Archive Street, Workshop Alley, and Waterside Play terrain must meet

This stage does **not** create final Archive Street, Workshop Alley, or Waterside Play terrain, and does not create any of the remaining eleven project-building illustrations.

## 2. Canonical inputs

This design inherits without modification:

- `docs/phase3-6-district-connection-design.md`
- `docs/phase3-5-illustrated-city-architecture.md`
- `docs/phase3-5-art-bible.md`
- `docs/phase3-5-observatory-quality-master.md`
- `portfolio-city/data/map-layout.json`
- the approved P0 wireframe `phase3-6-p0_district-connection-wireframe_APPROVED.png`

Observatory Hill is the visual quality master. HoloScope and `observatory_terrain.webp` are the strongest direct references; the approved P2.5 Sphere and Prime Dot Art derivatives are comparison references for runtime-scale harmony.

The quality gate is not “beautiful in isolation”. The connector must look like the same Portfolio City when placed beside the approved Observatory Hill runtime art.

## 3. Fixed geometry

The following P0 geometry is locked for P1:

| Gate / anchor | Fixed contract |
| --- | --- |
| `G-NORTH` | `y=768`, `x=1600`, clear width `160` |
| `G-ARCHIVE` | `x=1440`, `y=1260`, clear width `120` |
| `G-WORKSHOP` | `x=1760`, `y=1260`, clear width `120` |
| `G-SOUTH` | `y=1536`, `x=1600`, clear width `160` |
| Archive internal anchor | `x=1024`, `y=1260` |
| Workshop internal anchor | `x=2048`, `y=1260` |
| Waterside west anchor | `x=1024`, `y=1840` |
| Waterside east anchor | `x=2048`, `y=1840` |

The current fourteen project placements remain fixed.

In particular, HoloCa remains at `x=1600`, `y=1820`.

## 4. Central Commons role

Central Commons is **not a fifth district**.

It is the quiet shared infrastructure that removes strong local motifs before the visitor enters another district.

Its visual identity must therefore be weaker than Observatory Hill, Archive Street, Workshop Alley, and Waterside Play.

The Commons may use:

- warm cream / pale sandstone paving
- restrained pale stone retaining edges
- ordinary dark metal lamps
- low benches
- clipped shrubs and small deciduous trees
- simple civic drainage / edging details
- one flat paving medallion as a low-priority centre marker

The Commons must not use:

- named project buildings
- a unique skyline landmark
- giant celestial, book, gear, workshop, boat, or water icons
- oversized signs or district labels
- a monumental fountain or sculpture that reads as a fifth-district attraction
- hard portal, gatehouse, archway, or theme-park boundary treatment

## 5. Proposed design envelope

The Commons core remains in the neutral `x=1440..1760` corridor, but P1 must also account for the required 80-world-unit transition reserve on both sides of each primary gate.

For composition planning, use this working envelope:

```text
x = 1360..1840
 y = 688..1616
```

This is a **design envelope**, not yet a runtime `renderRegion` commitment.

It deliberately contains the complete transition reserves for:

- `G-NORTH`: `y=688..848`
- `G-ARCHIVE`: `x=1360..1520`
- `G-WORKSHOP`: `x=1680..1840`
- `G-SOUTH`: `y=1456..1616`

No `map-layout.json` change is authorized in P1 design review.

## 6. Composition overview

The connector should read as one continuous civic surface with four distinct movements:

```text
             Observatory Hill
                    |
        broad stair + gentle ramp
                    |
            quiet arrival apron
                    |
Archive ---- modest civic square ---- Workshop
                    |
          greener southern throat
                    |
                 G-SOUTH
                  /   \
             west     east
                \     /
                HoloCa
```

The visual centre is approximately `x=1600, y=1260`, but the centre must stay low and quiet.

The strongest silhouette in this area should still be a project building outside the Commons, not Commons scenery.

## 7. North connector composition

### 7.1 Route

Use the locked centreline `x=1600` through `G-NORTH`.

At `G-NORTH`, preserve the full `160` world-unit clear width.

North of the Commons, the Observatory descent should arrive as a broad pale-stone stair paired with a gentler ramp / sloped walk. The pair should read as one civic connector, not two competing routes.

After the transition reserve, the paved route may gently narrow toward approximately `136–144` world units before opening again into the Commons square.

### 7.2 Elevation

`G-NORTH` is a high-to-mid transition.

Do not place a cliff wall directly on the gate.

Instead, step the descent across several shallow terrace changes between roughly `y=768` and `y=1040`, then arrive on a mostly level Commons terrace.

Retaining walls should terminate deliberately into planting or continue as low civic edges. They must not be cut by the asset boundary.

### 7.3 Motif fade

Celestial brass, star inlays, telescope props, and cobalt Observatory accents must become sparse before the route reaches the Commons square.

The intended transformation is:

```text
Observatory brass detail
→ ordinary warm metal fitting
→ plain dark civic lamp / railing
```

Do not stop Observatory motifs on a single line.

## 8. Commons square

Use a modest widened civic square centred near `x=1600, y=1260`.

Recommended quiet-square footprint:

```text
x ≈ 1460..1740
 y ≈ 1140..1380
```

This is a composition target, not a hard rectangle.

The square should feel softly rounded / irregular in the illustrated perspective rather than mechanically rectangular.

### 8.1 Centre treatment

Use a **flat paving medallion** approximately `90–120` world units across.

The medallion should be a simple four-way civic paving pattern, not an astronomical compass rose, clock, gear, book emblem, or water motif.

No tall centre object is preferred for P1.

This keeps the Commons subordinate and avoids creating a fifth-district landmark.

### 8.2 Furnishing

Keep furnishing sparse:

- at most a few ordinary lamps around the outer edge
- two or three benches placed off the road centreline
- low shrub masses at corners
- one or two small trees where they do not block routes

Vegetation must remain at least `32` world units clear of each road centreline.

## 9. East-west connector

The Archive and Workshop routes share centreline `y=1260`.

Preserve `120` world units of clear lane at `G-ARCHIVE` and `G-WORKSHOP`.

The east-west street should visually pass **through** the Commons square rather than terminate into it.

The road family remains warm pale paving across the square. Local district cues appear only gradually outside the shared core.

### Archive side

Moving west from the square:

- tree density may rise slightly
- paving may become a little warmer and more regular
- simple civic stone edges may begin to suggest future arcades
- no book iconography appears inside the shared band

### Workshop side

Moving east from the square:

- paving may become slightly more practical / coarse
- restrained timber or dark metal utility details may begin after the shared band
- no gears, machinery silhouette, or workshop prop cluster appears inside the shared band

The Commons side of the east-west connection should remain visibly balanced. Archive and Workshop must not pull the square into two unrelated halves.

## 10. South connector composition

From the square, preserve a broad central route on `x=1600` toward `G-SOUTH`.

At the gate, clear width remains `160` world units.

The route should become greener and visually more open toward the south:

- planting becomes looser
- low stone edges give way to simpler promenade edging
- the amount of hard civic furniture decreases
- sightlines widen

Do not introduce open water inside the Commons core. Waterside identity should begin as planting / railing / promenade vocabulary before actual shoreline or pier language dominates later terrain.

## 11. HoloCa protection and post-`G-SOUTH` split

The central road must **not** continue straight toward HoloCa.

Immediately after `G-SOUTH`, the continuation contract becomes a shallow Y split around the fixed HoloCa parcel.

Use the P0 route skeleton as authoritative:

- west continuation: `G-SOUTH -> (1420,1650) -> (1240,1740) -> (1180,1840) -> (1024,1840)`
- east continuation: `G-SOUTH -> (1780,1650) -> (1960,1740) -> (2020,1840) -> (2048,1840)`

P1 should visually imply the split beginning shortly after the seam, but must not paint final Waterside terrain.

A practical composition rule is:

- keep the central line intact only through the seam
- begin separating the left/right paving edges by approximately `y=1570..1600`
- do not leave a straight visual lane aimed at `x=1600, y=1820`

HoloCa must read later as a central landmark **between** the two promenade arms, not as an obstruction placed on a road.

## 12. Transition-zone bands

Every primary connector keeps the P0 minimum 80-world-unit reserve on both sides of its boundary.

P1 uses a three-band material transition rather than an alpha blur or hard colour gradient.

### `G-NORTH`, total reserve `y=688..848`

Suggested sequence moving south:

1. District band: `y=688..728`
2. Blend band: `y=728..808`
3. Shared Commons band: `y=808..848`

### `G-ARCHIVE`, total reserve `x=1360..1520`

Suggested sequence moving east:

1. Archive band: `x=1360..1400`
2. Blend band: `x=1400..1480`
3. Shared Commons band: `x=1480..1520`

### `G-WORKSHOP`, total reserve `x=1680..1840`

Suggested sequence moving east:

1. Shared Commons band: `x=1680..1720`
2. Blend band: `x=1720..1800`
3. Workshop band: `x=1800..1840`

### `G-SOUTH`, total reserve `y=1456..1616`

Suggested sequence moving south:

1. Shared Commons band: `y=1456..1496`
2. Blend band: `y=1496..1576`
3. Waterside-prep band: `y=1576..1616`

These sub-band dimensions are paint guidance, not new world-layout hard constraints. The locked gate centres and clear widths remain the authoritative geometry.

## 13. Surface-language transition

Transitions should be painted through **material substitution**, not by fading one finished district image into another.

Preferred substitutions:

| Strong local language | Blend language | Shared Commons result |
| --- | --- | --- |
| Observatory celestial brass | small warm metal fittings | ordinary dark lamp metal |
| Observatory cobalt accent | muted blue-grey detail | warm cream / pale stone dominates |
| Archive arcade rhythm | simple civic pilaster / wall edge | low plain stone edge |
| Workshop timber / utility metal | restrained bench / railing detail | plain civic furniture |
| Waterside rail / lush planting | lighter railing + looser shrubs | open green civic edge |

The boundary should be readable as a change in neighbourhood character, but never as a themed entrance gate.

## 14. Grounding and contact rules

### 14.1 Roads

Cross-seam road centrelines must meet exactly.

Cross-seam clear width must stay within the P0 tolerance of `8` world units.

Paving joints, curb directions, and stairs must lead through the seam rather than terminate at the crop edge.

### 14.2 Elevation

Use three broad elevation classes:

- Observatory approach: high-to-mid descent
- Commons square and side street: mid / level civic terrace
- south approach: mid-to-low gentle promenade descent

Do not create a new dramatic cliff or bridge in Central Commons.

### 14.3 Vegetation

Group foliage into painted masses compatible with Observatory Hill.

Keep project-like silhouettes out of the planting.

Do not place tall trees in the central square or directly on connector centrelines.

### 14.4 Shadows

Keep the Observatory master lighting:

- upper-left / left-front key light
- soft shadows toward lower-right
- no neutral-black shadow masses

Commons shadows should be especially restrained so the connector does not become visually heavier than nearby project art.

### 14.5 Edge treatment

Do not hide a seam with blur, fog, text, or decorative portal architecture.

The contact must work because road geometry, elevation, materials, and shadow direction agree.

## 15. Runtime-size art target

Central Commons must be judged at the same practical map scale as Observatory Hill.

Direct comparison set:

- `observatory_terrain.webp`
- `holoscope.webp`
- approved P2.5 `sphere.webp`
- approved P2.5 `prime-dot-art.webp`

Required shared qualities:

- warm storybook stone
- painted rather than vector-hard edges
- grouped vegetation masses
- compatible upper-left lighting
- restrained saturation in infrastructure
- enough texture to avoid flat-vector appearance
- no micro-detail that vanishes or turns noisy at 390 px viewport testing

The Commons should be **slightly quieter and lower-contrast** than the clickable buildings.

## 16. Proposed paint hierarchy

From strongest to weakest visual priority:

1. existing / future clickable project buildings
2. district-specific major terrain landmarks
3. main connector roads and square silhouette
4. Commons low stone edges and vegetation framing
5. benches, lamps, drains, minor civic props
6. paving microtexture

If Commons furniture competes with a project building at runtime scale, remove or simplify the furniture.

## 17. What P1 intentionally leaves for later

P1 does not decide final visual production for:

- Archive Street terrain west of the Commons transition contract
- Workshop Alley terrain east of the Commons transition contract
- Waterside shoreline, piers, water level, or final promenade scenery
- `G-ARCHIVE-WATER` terrain treatment
- `G-WORKSHOP-WATER` terrain treatment
- Archive / Workshop / Waterside project buildings

Those later stages must inherit the P1 connector surface rather than repaint Central Commons ad hoc.

## 18. Design acceptance criteria

P1 design is ready to close only when:

- all four primary gates remain at the P0 coordinates and widths
- the square reads as shared city infrastructure rather than a fifth district
- Observatory motifs visibly fade before the square
- Archive and Workshop cues enter gradually and symmetrically enough to preserve a single city vocabulary
- the south route becomes greener and begins a Y split after `G-SOUTH`
- no straight road is aimed through HoloCa
- transition zones keep at least 80 world units on both sides of each gate
- no project building or unique vertical landmark enters a connector reserve
- the proposed ground / elevation transitions can be painted without hiding seams
- the design can be compared against Observatory Hill at runtime size without looking like a separate illustration product
- `map-layout.json` and all fourteen project placements remain unchanged during design review

## 19. Stop condition

P1 stops at the approved Central Commons composition contract.

Do not begin final Archive Street, Workshop Alley, Waterside Play, or remaining project-building art until this design is explicitly approved.
