# Phase 3.9 CP-D5B - Published World View Interaction Blueprint

Updated: 2026-09-20
Status: PASS / direction locked from user visual reference

## Core decision

The default Portfolio City world screen should resemble a **zoomed local crop of the huge Master World**, not a full-world atlas.

The current four districts appear at their actual projected geography:
- Observatory H05, north / slightly east
- Archive G06, west
- Workshop I06, east
- Waterside H07, south

Visitors select a district directly from this geography.

## Important distinction from debug reference

The user reference correctly expresses spatial composition, but production must remove:
- visible 16 x 12 grid,
- cell IDs,
- debug crosshairs,
- red plus markers.

The background remains the clean Visitor World artwork.

## World View interaction model

Default state:
- camera opens on the W0 local cluster,
- all four current districts are discoverable,
- surrounding terrain is visible enough to imply a much larger world,
- distant areas may soften into frontier atmosphere.

District target:
- anchored to the CP-D4E projected coordinate,
- generous invisible hit area,
- small visual landmark/symbol,
- district name appears persistently at suitable desktop scale or on focus/hover depending on final QA,
- no implication that unpublished terrain is clickable.

Select district:
1. focus/highlight target,
2. camera eases toward the district,
3. transition into District View,
4. reveal district buildings,
5. building selection continues to Building Preview -> canonical Work route.

## Visual marker direction

Do not use generic red plus signs in production.

Preferred direction:
- small illustrated district emblem / landmark silhouette,
- visually subordinate to terrain,
- consistent family across all districts,
- accessible focus ring handled by UI layer,
- marker art is not baked into terrain master.

Candidate semantics:
- Observatory: observatory/dome motif
- Archive: archive/book/old-building motif
- Workshop: workshop/tool/atelier motif
- Waterside: wave/pier/harbor motif

These are UI/landmark semantics, not regenerated replacements for accepted project buildings.

## Desktop

- W0 cluster can be visible simultaneously.
- Terrain remains readable around targets.
- hover/focus may reveal secondary district information.
- click/Enter opens District View.

## Mobile

- same world coordinates,
- no miniaturized full-world map,
- short pan allowed,
- touch targets larger than visible markers,
- selecting a target recenters before/while entering District View,
- labels must not overlap excessively.

## World overview

A later optional World control may zoom farther out to show more of the huge Master World, but:
- it is not the default entry framing,
- only published districts remain interactive,
- distant geography remains scenery/frontier,
- full 16 x 12 debug grid is never exposed.

## Prototype acceptance

PASS when a prototype demonstrates:
- W0 local crop rather than full-world reveal,
- correct four-anchor spatial relationship,
- no visible grid,
- four district targets,
- district selection -> District View,
- District View -> Building Preview remains intact,
- mobile short-pan behavior,
- existing canonical project routes unchanged.

## Result

CP-D5B: PASS / interaction direction locked.

Next checkpoint: **CP-D5C W0 World View Prototype**.
Build the no-grid local World View using the existing Phase 3.9 prototype architecture, with the four projected district targets and the current District View flow. Keep production feature flag disabled.
