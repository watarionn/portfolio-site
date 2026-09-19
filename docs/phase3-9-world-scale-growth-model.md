# Phase 3.9 — World Scale & Growth Model

Updated: 2026-09-18
Status: design checkpoint / no runtime implementation

## Purpose

Define how Portfolio City's new World Map can grow before choosing a final world-map image size, aspect ratio, or logical grid dimensions.

This document intentionally avoids locking a number such as 8 × 6. Scale must follow growth behavior, not the other way around.

## Inputs

Current published content:

- 4 districts
- 14 projects
- Observatory Hill: 3 projects
- Archive Street: 4 projects
- Workshop Alley: 4 projects
- Waterside Play: 3 projects

The Phase 3.6 growth exercise also proved a useful planning assumption: two additional project slots per current district provide comfortable near-term capacity before a district itself needs to expand.

That old chunk geometry is no longer binding, but the capacity lesson remains useful.

## Growth has two independent axes

World growth and project growth must not be coupled one-to-one.

### Axis A — project growth inside a district

A new work normally enters an existing district if its theme fits.

This should change the District View, not the World Map footprint.

### Axis B — district growth on the World Map

A new district appears only when a genuinely new thematic neighborhood is useful, or when an existing district has become too broad / crowded to remain coherent.

This changes World Map topology and reveal state.

Therefore:

**new project ≠ new World Map cell**

and:

**new district = meaningful World Map expansion event**

## Near-term capacity model

Use the current 14 projects as the baseline.

The four current districts should each be able to absorb at least two more projects without requiring a new district:

- Observatory: 3 → 5
- Archive: 4 → 6
- Workshop: 4 → 6
- Waterside: 3 → 5

This gives an immediate planning capacity of **22 projects** across the current four districts.

This is not a hard maximum. District View design may support more. It is the threshold used to make sure the new architecture is not forced to expand the World Map for ordinary portfolio updates.

## District creation triggers

Do not create a new district merely because an empty logical cell exists.

A new district is justified when one or more of these conditions are true:

1. a new work family has a distinct theme that does not fit the four existing district identities,
2. an existing district would become conceptually confusing if the work were added there,
3. a district's visual density would become uncomfortable even after District View layout expansion,
4. a body of related works is strong enough to deserve its own place identity.

The trigger is semantic first, spatial second.

## Planning horizon

The first World Map should not be sized only for four districts.

Design it to remain compositionally healthy through at least these stages:

### Stage W0 — launch composition

4 published districts.

The current district cluster is the clear visual focus.

### Stage W1 — first expansion

5–6 published districts.

One or two clouded neighboring regions become fully revealed.

The map should not require a new base illustration or a global repositioning of the original four districts.

### Stage W2 — established city-world

7–9 published districts.

The published region now has multiple routes / neighborhood relationships rather than a single center with four arms.

The initial camera may widen modestly.

### Stage W3 — long-range reserve

10+ districts.

This stage is a capacity target, not a promise that all regions are already illustrated in detail.

The logical world should still have outward addresses available without changing its coordinate system.

## Scale rule

The logical world should provide **at least roughly twice the district capacity of the initial published set before its outer boundary becomes relevant**.

With four starting districts, the initial composition should therefore have comfortable address space for at least 8–10 districts.

This does **not** mean the final logical grid has 8–10 cells. Empty connective cells, sea, mountains, decorative regions, and multi-cell district footprints may all consume logical space.

Therefore final grid dimensions remain undecided.

## District footprint model

Use a hybrid rule:

### Default

A district has one **home logical cell**.

This gives it a stable address for:

- reveal state,
- camera targeting,
- adjacency,
- keyboard / arrow navigation,
- analytics / deep-link state.

### Optional footprint expansion

A district may visually or interactively extend into neighboring logical cells when geography or District View composition needs more room.

The home cell does not change.

This avoids forcing every district into identical visible rectangles while retaining simple topology.

## Logical cells are not visible tiles

The hidden grid is an authoring and runtime coordinate system.

The World Map artwork should cross logical boundaries freely:

- rivers can flow across cells,
- mountains can span cells,
- coastlines can curve through several cells,
- forests can bridge district and non-district regions.

District hit areas may be polygons or authored masks associated with one or more logical cells.

No visible checkerboard is required.

## Initial published cluster

Do not lock exact coordinates yet.

Compositionally, the first four districts should form a **compact connected cluster**, not four isolated islands.

Desired properties:

- every current district has at least one meaningful neighbor,
- at least two directions remain available for future district growth,
- no current district is trapped against the final world boundary,
- Central Commons may serve as a visual connector / landmark without necessarily consuming a district slot,
- the cluster should leave enough surrounding geography for clouds to imply continuation.

The old north / west / east / south thematic relationship may be used as inspiration, but it is not a coordinate lock.

## Reveal margin

Use three visual states rather than a binary visible / hidden map.

### Published core

Current districts and the geography required to understand their connections.

- clear
- interactive
- full intended World Map contrast

### Peripheral reveal band

Immediately surrounding world.

- geography visible
- lower contrast
- cloud / fog partially obscures it
- not presented as a published district unless one exists there
- communicates that the map continues

### Unrevealed world

Farther geography.

- outside the initial camera, strongly clouded, or both
- may exist in the master artwork without being interactively exposed

The initial camera should normally include the published core plus approximately **one logical-cell-equivalent peripheral band** around it.

"One cell" here is a design unit, not a final pixel measurement.

## Reveal growth rule

When a new district is published:

1. reveal its district footprint,
2. reveal enough connecting geography to make the route from the existing published region legible,
3. preserve a peripheral cloud band beyond the new published edge,
4. leave unrelated distant world obscured.

The cloud frontier therefore moves outward locally rather than disappearing globally.

## Camera growth rule

Do not zoom out every time a project or district is added.

Keep the initial camera framing while the published cluster still fits inside the safe presentation region.

Expand or shift the initial camera only when:

- a published district would be clipped or visually cramped,
- the peripheral reveal band can no longer be shown on an important growth edge,
- the current district labels / landmarks become too dense at the existing scale.

Prefer **camera pan / modest framing expansion** over shrinking the whole world aggressively.

A new district should feel like more world became available, not like the existing city suddenly became tiny.

## Desktop and mobile framing

The same logical published region should drive both.

Desktop:
- can show more peripheral geography,
- drag / pan remains appropriate.

Mobile:
- may show a tighter camera crop,
- must keep the active district cluster discoverable,
- clouded world may appear through edge glimpses rather than a full surrounding ring.

Do not choose world dimensions from one breakpoint alone.

## Growth simulation

### Simulation A — projects 15–22

Assume each current district receives up to two additional fitting projects.

Result: **PASS**.

World Map footprint does not need to change. Only District Views gain buildings.

### Simulation B — fifth district

A new thematic work family justifies District 5.

Result: **PASS by model**.

Reveal one neighboring district footprint and its connecting geography. Keep cloud beyond it. No existing district moves.

### Simulation C — sixth district on another edge

Result: **PASS by model**.

The published cluster can grow asymmetrically. The reveal frontier moves locally in the second direction.

### Simulation D — 7–9 districts

Result: **PASS as target condition**.

Camera framing may widen, but the coordinate system and original district home cells remain stable.

### Simulation E — 10+ districts

Result: **RESERVE REQUIREMENT**.

The future logical grid selected in the next scale-design phase must leave enough address space that this stage does not require coordinate migration.

## What this phase deliberately does not decide

- exact logical grid rows / columns
- exact world aspect ratio
- exact district coordinates
- exact Central Commons role
- exact biome layout
- exact master-map pixel dimensions
- exact fog artwork
- exact district hit polygons
- exact transition animation

## Growth-model gate

World Scale & Growth Model: **COMPLETE**

Working rules:

- ordinary project growth stays inside District View,
- current four districts plan comfortably through 22 projects,
- World Map expansion is district-driven,
- new districts are semantic expansion events,
- each district has one stable home logical cell,
- visible district footprint may span multiple logical cells,
- initial camera shows the published cluster plus roughly one peripheral logical-cell-equivalent band,
- reveal grows locally,
- camera expands only when composition requires it,
- the logical world must support at least the 7–9 district stage comfortably and retain reserve for 10+.

## Next step

**World Topology Candidate Study**

Now that growth behavior is defined, compare a small set of candidate logical world shapes / aspect ratios and initial four-district compositions.

This next study may use abstract diagrams. It should still avoid final illustrated World Map production until one topology passes the growth simulations.
