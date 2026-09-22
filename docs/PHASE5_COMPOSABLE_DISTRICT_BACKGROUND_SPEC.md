# Phase 5 Composable District Background Spec

Status: ACTIVE design rule after real compositing review

## Purpose
A district background is not runtime-ready merely because it is a strong standalone illustration. It must also support independent clickable project buildings without making them float, block routes, or ignore perspective.

## Two approval gates
1. Scenery gate: the district works as a Professor Layton-inspired storybook environment.
2. Compositing gate: current and future transparent building assets can be placed naturally without repainting the background.

Passing only the scenery gate is not enough.

## Six-slot district architecture

Latest adopted district rule:

- each district supports a maximum of six project buildings
- all six buildable slots are designed before the final background is painted
- a slot must be a real parcel with a believable ground plane and circulation access
- unused slots are not shown as obvious empty lots
- every unused slot is occupied by a removable filler asset such as planting, a fountain, kiosk, tiny house, small shop, tree group or similar ordinary city element
- adding a project means removing that slot's filler and inserting the transparent project-building asset
- the base background must not need repainting for that swap

Final visual stack:

1. background base
2. filler assets
3. project building assets

The filler and project layers are mutually exclusive per slot.

## Composability rules
- Build the district as a real place first: terrain, ordinary streets, stairs, water, plazas, gardens, houses and environmental buildings.
- Include six genuine buildable slots connected to visible circulation.
- A slot needs a readable ground plane and believable contact edge for an overlaid building.
- Sidewalks, bridges, water surfaces, stairways and street-furniture strips are not building lots.
- Do not reserve only the current project count. Design the full six-slot capacity from the beginning.
- Avoid radial or perfectly symmetric project-slot layouts.
- Keep major routes readable after all six neutral building masses are overlaid.
- Foreground, middle-ground and rear slots must follow scene perspective rather than percentage coordinates alone.
- The 390px mobile critical band must preserve district identity and the route connecting visible project buildings.
- Environmental facades may exist, but they must not occupy every viable frontage.
- Filler assets must be removable without changing fixed terrain, walls, stairs, roads, water or other background-base geometry.

## Parcel checklist
Before runtime approval, verify every one of the six slots has:
- visible ground plane
- access from road, path, terrace or plaza
- enough width for its intended silhouette envelope
- no collision with water, stairs, retaining walls or foreground props
- believable scale relative to neighboring environmental buildings
- clear baseline/contact point
- primary circulation still readable
- popup/hitbox room
- a filler asset that can be removed cleanly
- no requirement to repaint the base background when filler is replaced by a project building

## Mandatory neutral-mass test
Before final project art placement, overlay simple neutral building masses at all six proposed slot baselines and widths, including currently unused future slots.

Test at:
- 1440 desktop
- 820 tablet
- exact 390 mobile crop

If the masses look pasted on, float, block circulation, hide district identity, or require hiding important scenery, revise the background first.

## District notes

### Observatory Hill
Needs terraced streets and real parcels, not only paths around a central plaza. Redesign around six believable terraced slots while keeping skyline/lookout identity.

### Archive Street
The previously approved illustration remains an art reference, but the frontage is too complete for effortless overlay placement. Runtime status: HOLD until a six-slot parcel audit passes.

### Workshop Alley
Audit the approved illustration against six total slots. Shared work-yard identity should remain, but environmental workshops must not consume every usable edge. Current projects occupy four slots; two slots remain filler-backed capacity.

### Waterside Play
First six-slot composability prototype because its open promenade/plaza geometry gives more room for independent buildings. Water must remain visible on mobile. Aquarium, holoca and word-generator occupy three slots; three additional slots remain filler-backed future capacity.

Authoritative Waterside slot plan:
- docs/PHASE5_WATERSIDE_PLAY_6_SLOT_PLAN.md

## Production sequence
1. lock Waterside Play six-slot geometry
2. revise Waterside Play background around those six slots
3. run six-mass neutral composability test
4. lock Waterside Play slot coordinates and perspective tiers
5. repeat six-slot audit for Workshop Alley
6. redesign Observatory Hill around six real terraced slots
7. decide whether Archive Street can be salvaged or needs a new six-slot background
8. produce/import missing transparent project-building art and filler art
9. assemble scene layers, hotspots and popup behavior
10. run 1440 / 820 / exact 390 QA

## Continuity
- Professor Layton-inspired background-art feel remains mandatory.
- Project buildings remain separate transparent assets.
- Filler assets remain separate from the base background.
- Rejected images must not be used as references.
- Historical approved masters remain preserved; runtime suitability is a separate status.
- Master World topology and district anchors do not move.
- PR #105 remains Draft until scenery and district interaction are complete.
