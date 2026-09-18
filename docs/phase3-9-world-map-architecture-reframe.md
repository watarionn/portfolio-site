# Phase 3.9 — World Map Architecture Reframe

Updated: 2026-09-18
Status: architecture comparison / no implementation approval

## Why this reframe exists

The previous World Veil Backfill direction tried to make the current 13-chunk cross-shaped city read as a rectangular world by painting the 12 empty cells around it.

The backfill experiments were useful, especially the repeated `0:-1` seam tests. They showed that extending the current runtime terrain cell-by-cell creates a high visual-matching cost and makes the "outside world" depend too strongly on the present 13-chunk geometry.

The adopted concept changes the hierarchy instead:

**World Map → District → Building / Work**

The world is larger than the currently published Portfolio City. Only the currently relevant part of that world is revealed at first.

The example world-map images and example grid counts discussed during ideation are references only. They do not define the final geography, aspect ratio, grid count, biome layout, or art.

## Confirmed concept

- A large continuous illustrated world map exists conceptually beyond the current districts.
- The world has an internal spatial partition so districts and adjacency can be addressed.
- The partition does not need to be visibly drawn as a grid.
- Some spatial units become districts.
- Selecting a district enters a dedicated District View.
- A District View contains the district's project buildings.
- Selecting a building opens a compact project introduction.
- The user can continue to the full work page from that introduction.
- District View supports movement to neighboring districts, including left/right navigation where meaningful.
- The initial World Map reveals only the current city and a limited surrounding area.
- Unrevealed neighboring world remains faintly visible through cloud / fog.
- As the portfolio grows, new districts can be revealed and the visible map extent can expand.
- Existing accepted project identities, routes, and building illustrations remain reusable.

## Explicitly undecided

Do not treat any of these as locked yet:

- total world-map dimensions
- world-map aspect ratio
- number of rows / columns
- whether every logical cell has equal dimensions
- final district coordinates
- initial camera rectangle
- land / sea ratio
- biome arrangement
- mountain / river / coast placement
- cloud thickness
- exact reveal radius
- final World Map art
- exact District View composition
- transition animation
- whether Central Commons remains a visible district, a hub cell, or a world-map landmark

## Architecture candidates

### Candidate A — Fixed regular world grid

The world uses a predetermined regular grid such as N × M. Districts occupy grid cells.

Strengths:
- simplest adjacency model
- easiest keyboard / arrow navigation
- predictable reveal expansion
- easy to serialize and validate

Weaknesses:
- choosing N × M too early creates arbitrary constraints
- can encourage board-game-like composition
- irregular coastlines and differently sized districts may fight the model

Use if the final world art naturally resolves into similarly sized district regions.

### Candidate B — Continuous illustrated world + hidden logical grid

The user sees one continuous hand-painted world. Internally, a regular coordinate grid exists only for addressing, reveal state, camera framing, and coarse adjacency. A district can occupy one or more logical cells.

Strengths:
- preserves simple coordinates without exposing a tiled look
- supports organic geography
- a large district can span multiple cells
- future expansion remains easy to reason about
- cloud reveal can operate by logical cells while visually remaining organic

Weaknesses:
- requires a mapping between logical cells and visible district hit areas
- adjacency is not always identical to "one cell left/right"
- slightly more authoring metadata

### Candidate C — Region graph without a fixed grid

The world is continuous and districts are arbitrary polygons / regions connected by an adjacency graph.

Strengths:
- maximum artistic freedom
- geography can be entirely organic
- districts can have any shape

Weaknesses:
- harder reveal logic
- harder camera expansion rules
- more complex hit testing and authoring
- left/right district navigation needs explicit graph metadata
- less useful for long-term predictable growth

## Current architecture preference

**Candidate B is the working architecture candidate.**

This is not a final grid-count decision.

It separates three things that should not be forced to match:

1. **World art** — one continuous illustrated map
2. **Logical world coordinates** — hidden cells used for growth and reveal
3. **District footprints** — visible interactive regions that may occupy one or more logical cells

This preserves the user's "large world map divided into areas" idea without making the final artwork look like a checkerboard.

## Proposed data model direction

The future data model should distinguish world topology from current runtime terrain.

Conceptually:

```text
world
  logicalGrid: undecided
  revealWindow: derived from published districts
  districts[]
    id
    logicalFootprint[]
    worldHitArea
    neighbors[]
    districtView
      projects[]
```

No concrete grid dimensions are assigned in this phase.

## Current content mapped into the new hierarchy

The existing four project districts remain the first published district set:

- Observatory Hill — 3 projects
- Archive Street — 4 projects
- Workshop Alley — 4 projects
- Waterside Play — 3 projects

Total remains 14 projects.

The current Central Commons terrain can be reinterpreted during World Map composition. Its future role is deliberately left open.

## Reveal model

The initial camera should be content-driven rather than tied to a hard-coded example rectangle.

Recommended rule:

1. Compute the bounding region containing all currently published district footprints.
2. Add a small surrounding reveal margin.
3. Keep that core region clear and readable.
4. Render one surrounding peripheral band through cloud / fog where possible.
5. Keep farther world outside the initial viewport or much more strongly obscured.

When a district is added beyond the current published bound:

- expand the published bound,
- reveal the required neighboring world,
- update the initial camera framing only when necessary,
- do not redraw unrelated existing districts.

This makes portfolio growth itself visible as world expansion.

## District View direction

World Map and District View should intentionally use different visual densities.

### World Map

- low / medium detail
- geography-first
- district identity readable at a glance
- buildings represented only if useful as tiny landmarks
- cloud / fog communicates unrevealed world
- no need to expose logical grid lines

### District View

- higher detail
- district-specific architecture
- accepted illustrated project buildings
- project building tap / click opens compact project popover
- explicit route to full project page
- neighboring district navigation
- touch-friendly interaction

The accepted building illustrations therefore move naturally into District View rather than being discarded.

## What happens to the current 13-chunk map

The current 13-chunk implementation becomes a **legacy spatial composition and reference source**, not the required shape of the future World Map.

Keep from it:

- four district identities
- relative thematic relationships
- accepted building art
- project routes
- district visual language
- terrain lessons and palette references
- accessibility / drag / responsive QA knowledge

Do not require the new World Map to preserve:

- the 13-chunk cross silhouette
- the current 5 × 5 canvas
- the 12 blank-cell backfill problem
- exact current chunk boundaries

Exact project x/y positions are not automatically carried into the new District View. Their reuse or remapping will be decided when District View composition is designed.

## World Veil Backfill status

The previous rectangular backfill plan is now:

**SUPERSEDED FOR IMPLEMENTATION / RETAINED AS RESEARCH**

The `0:-1` prototypes and seam tests are useful evidence for why a separate World Map layer is preferable. No further `0:-1` production iteration should continue under the old architecture.

## Reframe gate

The architecture comparison is complete when these decisions are accepted:

- World Map is a layer above District View.
- hidden logical partition is allowed.
- visible grid lines are not required.
- final grid dimensions remain undecided until world-scale design.
- current 13-chunk cross is not a hard World Map topology constraint.
- portfolio growth expands the revealed world.

## Recommended next step

**World Scale & Growth Model**

Before drawing the final World Map, determine:

- plausible near-term district growth
- how much empty capacity should surround the first four districts
- minimum useful reveal margin
- when camera framing should expand
- whether district footprints are usually one logical cell or variable-size

Only after that should the logical grid dimensions and world-map aspect ratio be selected.
