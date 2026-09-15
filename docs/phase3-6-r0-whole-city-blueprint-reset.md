# Portfolio City Phase 3.6-R0 — Whole-City Blueprint Reset

Date: 2026-09-15
Baseline main: `cf8e074d0f8f2012820a31bdceb78f9a56bdd110`
Working branch: `phase3-6-r0-whole-city-blueprint-reset`
Status: **ADOPTED RESET / BLUEPRINT DESIGN ONLY**

## 1. Decision

Portfolio City will temporarily withdraw the current Observatory Hill terrain from final runtime-art approval and restart terrain composition from a whole-city master blueprint.

This is not a rejection of the Observatory Hill art quality. The current terrain remains an important visual reference for storybook rendering, material warmth, vegetation grouping, lighting and detail density.

The reset exists because district-by-district terrain completion created a risk that later districts would need to bend around already-finished art instead of reading as one coherent expandable city.

The new order is:

1. whole-city master blueprint
2. growth-capacity validation
3. chunk and district-boundary planning
4. terrain production from the approved blueprint
5. runtime integration and responsive QA

Do not resume final district terrain production before the whole-city blueprint passes its growth tests.

## 2. What is withdrawn and what remains approved

### Temporarily withdrawn from final terrain approval

- `observatory_terrain.webp` as the final authoritative Observatory Hill terrain composition
- any assumption that the current Observatory Hill terrain silhouette fixes future neighbouring terrain
- the in-progress Central Commons terrain image as final runtime terrain

These images remain usable as art-direction references.

### Still approved

- HoloScope project-building asset
- Sphere P2.5 project-building asset
- Prime Dot Art P2.5 project-building asset
- current fourteen project identities and routes
- current fourteen project anchor positions as the starting placement set for blueprint planning
- Phase 3.5 illustrated-city architecture
- Phase 3.5 art bible
- Observatory Hill quality-master rendering rules, except that its terrain composition is no longer locked as final geography
- Phase 3.6-P0 connection philosophy and six connector gates as design inputs
- Phase 3.6-P1 principle that Central Commons is neutral shared infrastructure, not a fifth district

## 3. Core reset principle

The city must be designed as a growing system before it is painted as finished scenery.

The blueprint must answer two separate growth questions:

1. How does an existing district accept more projects of the same thematic family?
2. How does Portfolio City accept an entirely new district in the future?

A blueprint that only fits the current fourteen projects is a failure even if it looks beautiful.

## 4. District growth model

Every district must support **both** immediate internal growth and outward geographic growth.

Do not choose only one mechanism.

### 4.1 Reserve project parcels

Each current district must begin with at least **two future-ready reserve project parcels** beyond its currently occupied projects.

Initial capacity target:

| District | Current projects | Minimum reserve parcels | Initial planned capacity |
| --- | ---: | ---: | ---: |
| Observatory Hill | 3 | 2 | at least 5 |
| Archive Street | 4 | 2 | at least 6 |
| Workshop Alley | 4 | 2 | at least 6 |
| Waterside Play | 3 | 2 | at least 5 |

This gives the initial four districts room for at least eight additional projects without requiring immediate district expansion.

Reserve parcels must not look like empty developer lots. While unused they should read as ordinary scenery such as:

- lawn or garden terrace
- small civic courtyard
- grove or overlook
- quiet side street pocket
- workshop yard
- small warehouse court
- promenade pocket
- pier garden or waterside terrace

When a future project occupies the parcel, only local scenery or props should need replacement. The surrounding district terrain should not need to be repainted.

### 4.2 Reserve parcel sizing

Reserve parcels should support the current project-building scale family.

Design target per parcel:

- usable building width target: roughly `250–300` world units
- surrounding quiet envelope: enough room for contact shadow, entrance, vegetation and hit-area separation
- practical parcel envelope target: approximately `320–380` world units wide and `240–320` world units deep where terrain permits

These are planning targets, not rigid rectangles. A district may use irregular parcels if the same replacement freedom is preserved.

### 4.3 District expansion frontier

Every district must also retain at least one explicit **Growth Frontier** toward an adjacent or future chunk.

A Growth Frontier is not decorative dead space. It is a planned continuation point for:

- a primary or secondary street
- elevation continuity
- vegetation continuity
- optional utilities, promenade or retaining edge
- future terrain chunks containing more project parcels

No district may be surrounded on every side by irreplaceable landmarks, cliffs, water barriers or other districts with no planned continuation path.

Where possible, each district should also retain a secondary fallback frontier so one future design decision does not permanently trap the district.

## 5. Growth Socket contract

A district Growth Frontier terminates in one or more **Growth Sockets** at a chunk or blueprint edge.

A Growth Socket should reserve:

- a road / promenade continuation lane, usually `120–160` world units clear depending on route class
- at least `80` world units of quiet transition depth around the future seam
- compatible elevation class
- compatible paving or surface family
- vegetation that can continue or terminate naturally
- no unique landmark directly across the socket

A Growth Socket may remain visually closed in the initial city through removable scenery such as trees, a garden edge, low wall, temporary overlook or ordinary fence. It must not be blocked by terrain that would require repainting the existing district when expansion begins.

## 6. Observatory Hill specific correction

The former Observatory Hill terrain effectively planned for the current three projects only.

The reset blueprint must instead show:

- three current Observatory projects
- at least two additional future Observatory parcels
- at least one outward Growth Frontier for a sixth project and beyond
- a route structure that makes those future parcels feel like a natural extension of the same hill district

The district must not become a fixed three-building diorama.

HoloScope, Sphere and Prime Dot Art remain valid project-building references and may move only if the future whole-city blueprint explicitly proves that a small placement adjustment improves long-term growth without harming the current interaction model.

The default preference remains to preserve the current project placements.

## 7. New district growth model

Portfolio City must also be able to gain a fifth, sixth or later district.

The whole-city blueprint must therefore preserve **city-scale expansion corridors** beyond the initial four districts.

Requirements:

- the initial city must not seal all outer edges with permanent scenery
- at least two outer directions should remain plausible for future district attachment
- future districts should connect through roads, bridges, stairs, promenades or other shared infrastructure rather than teleporting into isolated islands
- Central Commons does not need to connect directly to every future district
- outer districts may become stepping stones to later districts
- adding a district should require new chunks and connection scenery, not repainting the whole existing city

The logical world remains sparse and expandable. New chunks may extend beyond the current `3200 × 2304` initial bounds, including negative chunk coordinates if useful.

## 8. Whole-city blueprint layers

The new master blueprint should be drawn and reviewed in layers before final art production.

### Layer A — Landform

- hill / terrace masses
- cliffs and retaining edges
- lowland
- water and shoreline
- major elevation changes

### Layer B — City network

- main roads
- secondary roads
- stairs and ramps
- bridges
- promenades
- Central Commons
- existing P0 connector gates
- district Growth Sockets
- future district expansion corridors

### Layer C — District envelopes

- Observatory Hill
- Archive Street
- Workshop Alley
- Waterside Play
- neutral transition areas
- future expansion edges

District envelopes must be allowed to span additional chunks later.

### Layer D — Project capacity

Show separately:

- current fourteen project parcels
- minimum two reserve parcels in every current district
- additional candidate parcels if space permits
- no-build connector zones
- major district scenery / landmark zones

### Layer E — Production slicing

Only after Layers A–D pass:

- determine terrain chunk/render regions
- determine district scenery assets
- determine seam contracts
- plan runtime WebP exports

Do not let chunk boundaries dictate city composition before the blueprint works as a city.

## 9. Empty-space rule

Unoccupied capacity is intentional infrastructure, not wasted space.

The city should contain breathing room in the form of gardens, courtyards, terraces, groves, alleys, service yards and promenades that can later become project parcels.

Do not maximize current building density.

A district that visually appears completely finished and full at fourteen projects has failed the growth objective.

## 10. Landmark rule

Major scenery must not consume all future growth locations.

A landmark may define district identity, but it must leave:

- routes around it
- at least two reserve project parcels
- at least one outward Growth Frontier

Avoid designing a beautiful landmark composition that can only ever support the current project count.

## 11. Connection contracts inherited from P0/P1

The following remain useful whole-city planning anchors unless R0 review demonstrates a compelling reason to revise them explicitly:

- `G-NORTH`: `y=768`, `x=1600`, width `160`
- `G-ARCHIVE`: `x=1440`, `y=1260`, width `120`
- `G-WORKSHOP`: `x=1760`, `y=1260`, width `120`
- `G-SOUTH`: `y=1536`, `x=1600`, width `160`
- `G-ARCHIVE-WATER`: `y=1536`, `x=760`, width `120`
- `G-WORKSHOP-WATER`: `y=1536`, `x=2440`, width `120`
- HoloCa should not have a straight road driven through its parcel
- connector zones remain neutral shared infrastructure
- hard theme-park-style district gates remain prohibited

Unlike P0, R0 may revise exact terrain shape around these anchors because the entire geography is now being reconsidered together.

## 12. Rendering language carried forward

The reset does not discard the established visual quality work.

Keep:

- elevated three-quarter storybook-map view
- warm European illustrated-town feeling
- upper-left / left-front light
- soft lower-right shadows
- painted / hand-authored edges rather than vector-hard geometry
- grouped vegetation masses
- warm cream / pale sandstone civic materials
- restrained saturation in shared infrastructure
- readable project silhouettes at runtime size

The former Observatory terrain remains a reference for these qualities, not a fixed geographic template.

## 13. Blueprint growth simulation

Before the blueprint can be approved, perform four explicit simulations.

### Simulation A — Observatory fourth project

Place a hypothetical fourth Observatory-themed project into a reserve parcel.

Pass condition: no terrain repaint and no movement of existing projects.

### Simulation B — Observatory fifth project

Place another hypothetical project into the second reserve parcel.

Pass condition: no terrain repaint and the district still has legible circulation and breathing room.

### Simulation C — Observatory sixth project

Assume both reserve parcels are occupied and add one more project by extending Observatory Hill through its Growth Frontier into a new terrain chunk.

Pass condition: existing terrain remains unchanged except removable seam scenery; only the new chunk and new project asset are required.

### Simulation D — Fifth district

Attach a hypothetical fifth district to one preserved city-scale expansion corridor.

Pass condition: the new district can connect to the walking network without moving the current fourteen projects or repainting the entire four-district city.

## 14. R0 acceptance criteria

R0 passes only when:

- the whole initial city reads as one coherent place before terrain is sliced into production assets
- Observatory Hill is no longer constrained to three project sites
- every existing district has at least two reserve project parcels
- every existing district has at least one Growth Frontier
- unused reserve parcels read as natural scenery rather than blank pads
- at least two city-scale outward expansion directions remain available for future districts
- current projects remain independently replaceable building assets
- Central Commons remains shared infrastructure and does not become a fifth district
- P0/P1 connection lessons are preserved even if local geography is redrawn
- Simulation A, B, C and D all pass
- no final Archive, Workshop, Waterside or replacement Observatory terrain is produced before blueprint approval

## 15. Production sequence after R0

After the blueprint passes:

1. lock whole-city geography and growth sockets
2. define initial terrain render regions / chunk slicing
3. recreate Observatory terrain from the shared blueprint
4. create Central Commons terrain from the same blueprint
5. create Archive terrain
6. create Workshop terrain
7. create Waterside terrain
8. runtime consistency QA at 1440 / 820 / 390
9. only then continue remaining project-building production as required

District production may still be reviewed incrementally, but no district is allowed to redefine the city network independently.

## 16. Stop condition

R0 is a blueprint stage.

Do not generate final terrain for any district during R0.

Do not generate the remaining eleven project-building assets during R0.

The next artifact is the **Whole-City Master Blueprint**, including current parcels, reserve parcels, Growth Frontiers and future district expansion corridors.