# Phase 5 Waterside Play — Six-Slot Layout Plan

Status: ACTIVE / layout candidate for the next background revision

## Source constraint

This plan may use only the approved Waterside Play master as visual reference:

- Library: `/Portfolio City/Phase5_DistrictScenery/Accepted/waterside-play-background-approved.png`
- library file id: `libfile_ee1250c8c6ec8191b5a96618d423b69d`

Rejected Waterside images remain reference-prohibited.

The approved master remains a scenery reference, not the final runtime background. Its compositing audit was `SCENERY PASS / COMPOSITING REVISE`.

## District model

Waterside Play is designed as a six-slot district from the beginning.

Runtime visual layers:

1. background base
   - water, bridge, fixed terrain, retaining walls, permanent paths, distant town and non-removable edge scenery
2. filler assets
   - removable ordinary city elements placed in unused slots
3. project building assets
   - transparent clickable project buildings replacing the filler assigned to the same slot

A slot is never shown as a bare reserved lot. When no project occupies it, its filler makes the district look finished.

Maximum project capacity is six buildings.

## Composition principle

Keep the central approach, bridge and open water as the district identity.

The six slots sit around that identity in a loose left/right zig-zag across three depth tiers. They must not form a radial hub or a perfect mirrored grid.

Normalized coordinates use the 16:9 scene canvas and a bottom-center building anchor.

## Slot plan

| Slot | Depth | Anchor x | Baseline y | Max visual width | Current use | Default filler | Required background geometry |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| WP-01 | foreground-left | 22 | 83 | 20 | aquarium | low garden pavilion + planters | broad flat paved terrace; move benches/planters outside the building contact edge |
| WP-02 | foreground-right | 74 | 80 | 18 | holoca | small fountain + low planting group | preserve the strong circular plaza; keep the circle readable when either filler or project building is present |
| WP-03 | middle-left | 31 | 61 | 15 | word-generator | small waterside kiosk + flower bed | formalize a dry terrace left of the bridge approach; clear/shift existing benches and lamps from the contact zone |
| WP-04 | middle-right | 77 | 57 | 14 | future | tiny café / market stall | create a dry quay pocket above and behind the right circular plaza; do not consume the visible water corridor |
| WP-05 | rear-left | 20 | 46 | 12 | future | small house + tree cluster | keep an upper-promenade parcel with a clear ground plane and path access |
| WP-06 | rear-right | 69 | 49 | 12 | future | small harbor office / boathouse facade | create a small far-quay parcel on dry land to the right of the bridge; boats/dock furniture remain below or beside the parcel |

## Current project assignment

- aquarium -> WP-01
- holoca -> WP-02
- word-generator -> WP-03
- WP-04 / WP-05 / WP-06 remain future-capacity slots and display fillers

The previous draft placement of word-generator at the rear center is superseded for the revision target because it competes with the bridge/water sightline.

## Protected no-build space

The following visual space must remain free of slot buildings:

### Central approach
- approximate x: 38 to 59
- approximate y: 58 to 94
- purpose: preserve the foreground route toward the water and bridge

### Bridge readability
- approximate x: 34 to 57
- approximate y: 43 to 58
- purpose: the bridge must remain legible as circulation, not become a building platform

### Mobile water window
- approximate x: 42 to 63
- approximate y: 50 to 70
- purpose: preserve unmistakable visible water inside the exact 390px central crop

These are composition constraints, not necessarily runtime hitboxes.

## Filler rules

- filler assets belong to the filler layer, never the background base
- every unused slot has one removable filler group
- filler footprint must stay inside the slot envelope
- filler silhouette should be lower and quieter than a project building
- filler may be a garden, fountain, kiosk, tiny house, small shop, tree group or similar ordinary city element
- do not use a filler that changes fixed terrain when removed
- when a project is added, remove that slot's filler and insert the project building without repainting the base background
- filler must not be visually coded as an obvious placeholder

## Background revision instructions

Preserve from the approved master:
- visible water basin/channel
- small stone bridge
- strong right circular plaza
- curved promenade language
- warm Professor Layton-inspired simplified storybook rendering
- distant town / skyline softness

Revise:
- turn WP-01, WP-03, WP-04, WP-05 and WP-06 into explicit but natural dry parcels
- keep WP-02's circular plaza usable as a project contact plane
- move removable benches, lamps, café furniture, planter groups and dock clutter out of project contact edges
- keep central foreground-to-water circulation continuous
- keep water visible through the mobile critical band
- do not bake any of the three current project buildings into the background

## Neutral-mass gate for the revised background

Before final art approval, place neutral masses at all six slots, not only the three current projects.

Test:
- 1440 desktop
- 820 tablet
- exact 390 mobile crop

PASS requires:
- all six masses have believable ground contact
- no mass floats over water, stairs, walls or furniture
- central route remains readable
- bridge remains readable
- water remains visible on mobile
- six buildings do not read as a symmetric grid
- replacing any one filler with a project building does not require repainting the background

## Next step

Create the Waterside Play background revision around this six-slot geometry, then repeat the six-mass test before producing final transparent Waterside project-building art.

PR #105 remains Draft and must not be merged during this work.
