# Phase 5 Composable District Background Spec

Status: ACTIVE design rule after real compositing review

## Purpose
A district background is not runtime-ready merely because it is a strong standalone illustration. It must also support independent clickable project buildings without making them float, block routes, or ignore perspective.

## Two approval gates
1. Scenery gate: the district works as a Professor Layton-inspired storybook environment.
2. Compositing gate: current and future transparent building assets can be placed naturally without repainting the background.

Passing only the scenery gate is not enough.

## Composability rules
- Build the district as a real place first: terrain, ordinary streets, stairs, water, plazas, gardens, houses and environmental buildings.
- Include multiple genuine buildable parcels connected to visible circulation.
- A parcel needs a readable ground plane and believable contact edge for an overlaid building.
- Sidewalks, bridges, water surfaces, stairways and street-furniture strips are not building lots.
- Do not reserve exactly one obvious slot per current project.
- Avoid radial or perfectly symmetric project-slot layouts.
- Preserve at least one additional plausible parcel beyond the current project count where composition permits.
- Keep major routes readable after current buildings are overlaid.
- Foreground, middle-ground and rear parcels must follow scene perspective rather than percentage coordinates alone.
- The 390px mobile critical band must preserve district identity and the route connecting visible project buildings.
- Environmental facades may exist, but they must not occupy every viable frontage.

## Parcel checklist
Before runtime approval, verify every project site has:
- visible ground plane
- access from road, path, terrace or plaza
- enough width for intended silhouette
- no collision with water, stairs, retaining walls or foreground props
- believable scale relative to neighboring environmental buildings
- clear baseline/contact point
- primary circulation still readable
- popup/hitbox room
- at least one plausible future expansion site after current placement

## Mandatory neutral-mass test
Before final project art placement, overlay simple neutral building masses at proposed baselines and widths.

Test at:
- 1440 desktop
- 820 tablet
- exact 390 mobile crop

If the masses look pasted on, float, block circulation, or require hiding important scenery, revise the background first.

## District notes

### Observatory Hill
Needs terraced streets and real parcels, not only paths around a central plaza. Keep skyline/lookout identity while providing believable plots at more than three locations.

### Archive Street
The previously approved illustration remains an art reference, but the frontage is too complete for effortless overlay placement. Runtime status: HOLD until a parcel audit passes.

### Workshop Alley
Audit the approved illustration against four current buildings plus at least one future addition. Shared work-yard identity should remain, but environmental workshops must not consume every usable edge.

### Waterside Play
Best first composability prototype because its open promenade/plaza geometry gives more room for independent buildings. Water must remain visible on mobile. Aquarium, holoca and word-generator each need actual land parcels, plus at least one future site.

## Production sequence
1. Waterside Play neutral-mass composability test
2. revise background only if that test fails
3. lock Waterside Play parcel coordinates and perspective tiers
4. repeat for Workshop Alley
5. redesign Observatory Hill around real terraced parcels
6. decide whether Archive Street can be salvaged or needs a new background
7. produce/import missing transparent project-building art
8. assemble hotspots and popup behavior
9. run 1440 / 820 / exact 390 QA

## Continuity
- Professor Layton-inspired background-art feel remains mandatory.
- Project buildings remain separate transparent assets.
- Rejected images must not be used as references.
- Historical approved masters remain preserved; runtime suitability is a separate status.
- Master World topology and district anchors do not move.
- PR #105 remains Draft until scenery and district interaction are complete.
