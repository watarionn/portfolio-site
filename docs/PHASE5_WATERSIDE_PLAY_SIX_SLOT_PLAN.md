# Phase 5 Waterside Play Six-Slot Plan

Status: ACTIVE / first six-slot district prototype
Date: 2026-09-22

## Purpose

Waterside Play is the first district designed around the Phase 5 maximum-capacity rule.

A district supports at most six project buildings. The street layout therefore starts with six genuine buildable slots even when fewer than six projects currently exist.

Vacant slots must never read as exposed empty lots. They are completed with independent filler assets and can later be replaced one-for-one by project-building assets.

## Layer model

Waterside Play uses three scenery layers:

1. background base
   - water
   - bridge
   - promenade
   - permanent paving / terraces
   - retaining walls
   - railings
   - distant skyline
   - permanent low vegetation outside buildable slots

2. filler assets
   - temporary visual occupants of currently unused slots
   - transparent assets
   - removable without repainting the background base

3. project-building assets
   - transparent interactive building art
   - occupies the exact slot that previously held a filler
   - replaces the filler, never stacks on top of it

Hotspots and popup UI remain a separate semantic/UI layer.

## Six-slot layout

Coordinates are normalized percentages of the 16:9 district canvas.
The coordinate is the bottom-center building anchor / baseline target.

| Slot | Depth | x | y | Visual width | Current occupant | Vacant-state filler |
| --- | --- | ---: | ---: | ---: | --- | --- |
| WP-S1 | foreground-left | 24 | 83 | 20 | aquarium | flower garden + low shade tree |
| WP-S2 | foreground-right | 77 | 83 | 18 | holoca | small fountain court |
| WP-S3 | middle-left | 21 | 63 | 15 | future | riverside kiosk + planters |
| WP-S4 | middle-right | 74 | 61 | 15 | future | small café / waterside house |
| WP-S5 | rear-left | 38 | 54 | 12 | word-generator | compact pavilion + shrubs |
| WP-S6 | rear-right | 64 | 52 | 12 | future | tiny townhouse + cypress cluster |

The current project assignment is intentionally asymmetric:
- aquarium -> WP-S1
- holoca -> WP-S2
- word-generator -> WP-S5

Do not move word-generator back to a centered over-water destination. Its rear-left placement preserves the central water corridor.

## Composition geometry

The revised background base must be designed around these six parcels before illustration polish begins.

Mandatory geometry:
- keep an uninterrupted open-water read through the central mobile-safe band
- keep one small stone bridge around the upper-middle water crossing
- keep a broad foreground approach that visually splits toward the left and right waterside terraces
- WP-S1 and WP-S2 are the two largest, closest parcels
- WP-S3 and WP-S4 sit one perspective tier behind the foreground parcels
- WP-S5 and WP-S6 are compact rear parcels and must remain visibly smaller
- no parcel may use bridge deck, water surface, stair flight, railing strip or primary promenade as its contact plane
- routes must still read when all six slots contain full building masses

The six slots should form an irregular waterfront neighborhood, not a radial six-node diagram.

## Mobile-safe requirement

The critical mobile band remains x 18..82.

All six slot centers are inside or on the practical edge of that band, while the most important visual identity remains the open water and bridge between them.

At exact 390px crop:
- water must remain visibly recognizable
- at least the Aquarium / Holoca route relationship must remain legible
- rear-slot silhouettes may simplify but must not collapse into one merged mass
- no filler may become more visually dominant than an occupied project slot

## Filler rules

Filler assets are not decorations painted onto the background base.

Each filler:
- is an independent transparent asset
- belongs to exactly one slot
- shares the same bottom-center anchor and approximate perspective envelope as a future project building
- may include restrained vegetation / furniture immediately attached to that filler
- must leave the underlying parcel believable when removed
- must not imply that the slot is intentionally vacant

Good filler types:
- small house
- small shop or kiosk
- flower garden
- fountain
- pavilion
- tree group
- compact terrace feature

Avoid:
- giant landmark fillers
- filler that spans two slots
- permanent walls crossing the parcel
- a dense tree canopy that makes a later building impossible
- filler painted into the background master

## Perspective / z-order

Render back-to-front:

1. WP-S5 / WP-S6
2. WP-S3 / WP-S4
3. WP-S1 / WP-S2

Within the same tier, baseline y decides local overlap.

A filler and a project building for the same slot always share the same depth order.

## Neutral-mass gate

Before producing final Waterside Play project buildings, test all six slots simultaneously with neutral building masses.

Required sizes:
- S1: 20%
- S2: 18%
- S3: 15%
- S4: 15%
- S5: 12%
- S6: 12%

PASS only when:
- all six masses have believable ground contact
- no mass sits on water / bridge / stairs
- the central water corridor remains readable
- the main foreground approach remains readable
- no two expanded touch targets become inseparable
- the scene still reads as Waterside Play at 1440 / 820 / exact 390

## Approved-master overlay audit

A six-mass overlay was tested directly on the approved Waterside Play master.

Result: FAIL as a direct-placement solution.

Observed:
- the two foreground parcels remain strong
- the middle-left parcel is recoverable by clearing movable props
- the current right quay needs a wider dry terrace for WP-S4
- rear slot candidates collide with bridge / water-edge geometry if the existing master is kept unchanged
- simply adding three more coordinates to the current painting would create floating or pasted-on buildings

Therefore the coordinates above are target coordinates for the revised six-slot blockout, not a claim that the current approved painting already contains six valid parcels.

The next background revision must reshape land geometry first:
- widen / formalize the right middle terrace for WP-S4
- create a compact dry rear-left bridge-landing parcel for WP-S5
- create a compact dry rear-right terrace for WP-S6
- keep the center water corridor and bridge readable between those rear parcels

The approved master remains the visual/style reference, not the final terrain geometry.

## Art-direction continuity

The approved Waterside Play master remains the only approved visual reference for the revision.
Rejected images remain prohibited references.

Preserve from the approved master:
- sunny storybook waterside identity
- stone promenade
- blue harbor / basin
- small stone bridge
- distant town and softened skyline
- warm Professor Layton series-inspired background-art feel

The revision is a geometry refit around six buildable parcels, not a style reset.

## Next production step

Create the Waterside Play six-slot blockout / neutral-mass composition using this plan.

Only after that blockout passes should the final revised background base be painted.


## Final neutral-mass audit v2

Result: BACKGROUND GEOMETRY PASS.

The adopted background was re-tested after fitting the six anchors to its actual left/right terrace geometry.

Final anchor pattern:
- left bank: WP-S1 foreground / WP-S3 middle / WP-S5 rear
- right bank: WP-S2 foreground / WP-S4 middle / WP-S6 rear
- the central water corridor and bridge remain permanent non-slot identity space

The previous v1 coordinates that placed WP-S5 / WP-S6 toward the bridge/water corridor are superseded.

Current project assignment:
- WP-S1: aquarium
- WP-S2: holoca
- WP-S5: word-generator
- WP-S3 / WP-S4 / WP-S6: filler

The next gate is filler-asset design and later interaction/hitbox tuning. Background geometry does not need another repaint for the current six-slot plan.

## Adopted background master

Persistent Library path:
- /Portfolio City/Phase5_DistrictScenery/Accepted/waterside-play-background-six-slot-approved.png

Library file id:
- libfile_7664216e2cb08191baba45bbd70bedc4

Backing file id at adoption:
- file_00000000a56c820cbf8aea096b6a6b79

This six-slot master supersedes the earlier Waterside Play master for runtime-design work. The older approved master remains historical only.
