# Phase 3.9 - H2 Spatial Blueprint

Updated: 2026-09-19
Status: superseded composition study; logical grid locked separately

## Purpose

Translate the selected H2 Mainland + Archipelago geography family into a coordinate-level composition without locking the production grid, final coastlines, or final illustrated terrain.

All coordinates below use the earlier normalized 100 x 64 composition study. They remain useful as visual-composition evidence, but they are no longer the logical world model.

## Locked logical world model (2026-09-19)

- Master Grid: **16 columns x 12 rows = 192 district cells**.
- **1 cell = 1 district**.
- The logical grid is internal and is not drawn for visitors.
- Unpublished / undeveloped cells may occupy most of the Master Grid without creating a UX problem because visitors only receive the Published World / clickable vicinity.
- Publishing a new district reveals one district cell; ordinary project growth stays inside that district's District View.
- The Master Grid and visitor camera remain separate concepts. Camera framing derives from published cells plus frontier context, never from the full 16 x 12 extent.
- The previous 100 x 64 H2 coordinates are retained only to guide geography and composition while migration moves to cell coordinates.

## Master canvas

- normalized extent: x 0-100, y 0-64
- landscape bias: 1.5625:1 study ratio
- this ratio is a composition test, not the final asset ratio
- north is up for design discussion only; future art may rotate local roads and terrain freely

## Primary geography masses

### G1 Main connected land system

Approximate envelope: x 14-84, y 9-56.

Use an asymmetric body rather than an oval island. The west side should carry older/inland texture, the northeast should rise into highland, the east should provide an active land corridor, and the south should break into water-facing projections.

### G2 Southern inlet / bay

Approximate influence: x 38-66, y 40-62.

This water system cuts into the mainland enough to shape Waterside and nearby routes. It must read as geography, not decorative blue space.

### G3 Offshore reserve

Approximate region: x 72-98, y 28-57.

Use several irregular islands or a larger island plus satellites. At W0 most of this remains R2/R3 and is not a current district.

### G4 Western / northwestern inland reserve

Approximate region: x 0-28, y 8-38.

This continues beyond the published city through land, forest, valley, or older road geography.

### G5 Highland belt

Approximate region: x 42-75, y 5-27.

A broken ridge / elevated terrain system rather than one central mountain. It supports Observatory while leaving multiple passes and visual corridors.

## Current district home regions

Home regions are stable anchors. Their visible footprints may later extend beyond these boxes.

### D1 Archive Street

Center target: (35, 33)
Study envelope: x 27-43, y 26-40

Role: older connected inland urban fabric. Strong land relationship toward Workshop and at least one route toward the highland foothills.

### D2 Observatory Hill

Center target: (55, 20)
Study envelope: x 47-64, y 12-27

Role: elevated region overlooking part of the city. Deliberately offset from the world center.

### D3 Workshop Alley

Center target: (63, 34)
Study envelope: x 55-72, y 27-42

Role: active connected terrain with room for roads, yards, infrastructure, and an eastward transition.

### D4 Waterside Play

Center target: (49, 47)
Study envelope: x 40-59, y 40-55

Role: district silhouette directly shaped by the southern inlet / bay.

## Relationship check

The four homes form an irregular quadrilateral, not a cross:

- Archive sits west and slightly south of Observatory,
- Observatory sits north of the published cluster,
- Workshop sits east of Archive and southeast of Observatory,
- Waterside sits south between Archive and Workshop but is pulled toward water.

This preserves intuitive district relationships while avoiding legacy chunk geometry.

## Future expansion fronts

### F-A Inland frontier

Anchor corridor: x 18-30, y 20-34.

Connects west/northwest from Archive-side geography into G4. Suitable for a future land-based district without predetermining its theme.

### F-B Coastal frontier

Anchor corridor: x 58-75, y 43-55.

Runs around the eastern/southeastern edge of the inlet and can continue onto a peninsula or coast. It can connect naturally from Workshop and Waterside.

### F-C Offshore frontier

Anchor corridor: x 73-90, y 31-48.

Connects the mainland/coastal system toward G3 islands. The final visual connector may be bridge, ferry implication, stepping islands, causeway, or another world-specific device.

F-A, F-B, and F-C are route opportunities, not guaranteed District 5/6 positions.

## Central Commons study zone

Reserve a small connective zone around x 45-54, y 31-38.

This is intentionally not a district home. It overlaps the natural connective space between Archive, Workshop, Observatory approach, and Waterside approach.

Possible later roles remain: landmark, civic connector, route junction, or District View shared location.

## Reveal bands

### R0

Current district home regions and immediately authored district geography.

### R1

Main connections among the four districts plus the readable parts of the inlet, foothills, and central connective terrain.

### R2

A nonuniform frontier belt approximately 7-14 normalized units beyond the R0/R1 composition. It should expose fragments of F-A, F-B, and preferably the near side of F-C.

### R3

The rest of the Master World, including most deep offshore reserve and distant inland/highland continuation.

Do not implement reveal as concentric rectangles.

## Initial desktop camera

Study crop: x 20-80, y 9-58.

Intent:
- all four current districts readable at once,
- Central Commons study zone inside frame,
- F-A and F-B visibly hinted through frontier cloud,
- near offshore geography can appear at the right edge,
- master-world boundaries remain outside view.

Normalized crop ratio: 60:49. Runtime viewport may letterbox/crop this composition responsively rather than copy the ratio literally.

## Initial mobile camera

Mobile should not shrink the entire desktop composition until districts become tiny.

Study behavior:
- begin near the current cluster center around (50, 34),
- show roughly 2-3 district homes at useful visual scale depending on viewport,
- make the remaining current district(s) reachable by short pan,
- preserve cloud/frontier cues at one or more edges,
- provide explicit World Map orientation/navigation so discoverability does not depend on seeing all four simultaneously.

A fixed mobile crop box is deliberately not locked until interaction wireframes are tested.

## W1 / W2 camera simulation

### W1

When District 5 opens, shift the Published World Bound toward the selected front. Desktop camera may widen or recenter modestly; it should not automatically expose the entire master world.

### W2

District 6 preferably opens a different front type. Recompute entry framing from published content bounds plus a frontier margin rather than from a hard-coded world center.

## Spatial invariants

Carry these into implementation:

1. District home anchors remain stable after publication.
2. Camera framing derives from published content, not full master extent.
3. New projects inside an existing district do not expand World Map geography.
4. Cloud frontier moves locally when geography is published.
5. At least two qualitatively different expansion fronts remain viable after the first new district opens.
6. Mobile and desktop share world coordinates but may use different entry framing.
7. Logical grid dimensions are locked at 16 x 12, with exactly one district per cell. The grid remains an implementation structure rather than a visible art constraint.

## Blueprint gate

H2 Spatial Blueprint: **PASS FOR WIREFRAME**

This coordinate plan is specific enough to test navigation and camera behavior while still allowing the final illustrated geography to be designed organically.

## Next step

**World Map Interaction & Camera Wireframe**

Prototype the navigation states without final art:

- World Map entry,
- district hover/focus/tap,
- transition into District View,
- left/right adjacent-district navigation,
- building intro popup,
- full work route,
- return to World Map with camera restoration,
- desktop pan constraints,
- mobile orientation and short-pan behavior,
- cloud/frontier interaction rules.

Do not replace production runtime yet. Build the interaction contract first.
