# Phase 3.9 World Veil Pass — Rectangular backfill coverage plan

Updated: 2026-09-18  
Baseline audit: `docs/phase3-9-world-veil-visible-void-audit.md`

## Goal

Turn the existing 5 × 5 world canvas into a visually complete rectangle without changing the active 13-chunk terrain topology.

The 12 currently unpainted cells become **decorative outer-world backfill**, not active districts and not new runtime terrain chunks.

This plan does not approve final art or veil implementation. It defines coverage, continuity, replacement behavior, and visual hierarchy for the next prototype step.

## Structural rule

Add a separate world-fixed layer beneath active terrain:

`world background → outer-world backfill → active 13 terrain chunks → veil → details / projects`

The backfill layer uses the same world-coordinate grid as terrain but remains semantically separate from `layout.chunks`.

Consequences:

- `layout.chunks` remains 13 entries.
- project / district coordinates remain unchanged.
- world bounds remain `5120 × 3840`.
- no current road, clearing, reserve parcel, Growth Frontier, Expansion Corridor, or HoloCa geometry moves.
- a future real chunk can replace one backfill cell at the same coordinate without repainting the rest of the world.
## Coverage tiers

### Tier G — Growth Frontier cells

Eight cells are future district-extension addresses.

They receive the most readable backfill, but still stay below active terrain in detail density.

Target scenic density: roughly **45–55% of active terrain**.

Rules:

- preserve a broad open continuation zone at the frontier seam,
- allow a faint path / terrain continuation to disappear into mist,
- use removable-looking natural scenery,
- never add project-like architecture,
- never place an unbroken cliff, dense forest, wall, or shoreline across the growth socket.

### Tier C — outer-corner cells

Four cells are not current district-extension addresses.

Target scenic density: roughly **25–40% of active terrain**.

They may carry more negative space and stronger fog coverage. Their job is to make the world feel continuous, not explorable.
## North band

### `0:-1` — Observatory west Growth Frontier

Role: **open upland terrace fading westward**.

Use:

- dry olive / straw grass,
- low rounded hill contours,
- a few small rock groups,
- one faint footpath continuing from the Observatory reserve cap,
- sparse low shrubs near outer edges.

Keep the seam from `1:-1` visibly open for `GF-OBS-W`. Do not create a ridge wall across the east-west continuation.

### `2:-1` — Observatory east Growth Frontier

Role: **open upland slope fading eastward**.

Use the same terrain family as `0:-1`, but avoid exact mirroring. A slightly rockier outer edge is acceptable.

Keep `GF-OBS-E` open and make the continuation feel optional rather than like a finished district street.
### `-1:-1` — northwest outer corner

Role: **quiet highland haze**.

Use:

- broad soft hills,
- sparse tree silhouettes,
- exposed paper / grass breathing room,
- almost no path logic.

This cell should bridge Observatory upland colour into the Archive side without implying a fifth district.

### `3:-1` — northeast outer corner

Role: **quiet highland / stony haze**.

Use low hills, sparse brush, and a few distant stone shapes. It may be slightly drier than the northwest corner to echo the Workshop side.

Both north corner cells receive denser veil than the two Growth Frontier cells.
## West band

### `-1:0` — Archive north Growth Frontier

Role: **dry scholarly fringe climbing toward Observatory**.

Use:

- pale grass and compact earth,
- sparse hedge fragments or orchard-like shrubs,
- a faint vertical footpath from the Archive reserve apron,
- very small stone edging only where it does not close the route.

This is the fallback `GF-ARC-N`. The route must remain open from `-1:1`.

### `-1:2` — Archive south Growth Frontier

Role: **Archive fringe descending toward the Waterside climate**.

Use:

- warm parchment grass,
- low garden remnants,
- a clearer but still minor continuation path,
- increasing moisture / reeds only near the lower outer edge.

This is primary `GF-ARC-S`; keep a dry traversable corridor through the cell.
## East band

### `3:0` — Workshop north Growth Frontier

Role: **dry practical fringe rising northward**.

Use:

- tawny grass,
- sparse stone / compacted-earth patches,
- a faint service path,
- small removable-looking material piles only if they read as landscape texture, not a project site.

This is fallback `GF-WRK-N`. Do not introduce a building, yard wall, or hard barrier.

### `3:2` — Workshop south Growth Frontier

Role: **practical dry fringe transitioning toward wet ground**.

Use:

- compact earth and grass,
- scattered stones,
- a minor service track,
- subtle dampening / reeds near the southern edge.

This is primary `GF-WRK-S`; keep its north-south continuation clear.
## South band

### `0:3` — Waterside west Growth Frontier

Role: **low coastal meadow / peninsula continuation**.

Use:

- muted blue-green grass,
- warm sand / pale earth,
- shallow water only toward the far outer edge,
- sparse reeds,
- one dry route continuing from `1:3`.

The cell must remain mostly traversable land near `GF-WAT-W`. Do not flood the seam.

### `2:3` — Waterside east Growth Frontier

Role: **low coastal meadow with a slightly more open shoreline**.

Use the same family as `0:3`, with different shoreline rhythm and reed placement. Preserve `GF-WAT-E`.

Neither Waterside Growth Frontier cell should look like a finished harbour or attraction.
### `-1:3` — southwest outer corner

Role: **misty wet meadow / quiet shoreline**.

Use:

- broad wet grass,
- shallow water shapes,
- sparse reeds,
- high negative space.

No route needs to be emphasized.

### `3:3` — southeast outer corner

Role: **misty coastal lowland**.

Use a slightly stonier shoreline than the southwest corner, but keep detail subdued.

Both south corner cells should disappear into a stronger veil before they can compete with HoloCa or the three Waterside projects.
## Expansion Corridor protection

The four city-scale Expansion Corridor approaches remain in the active apron chunks, not the 12 backfill cells:

- north through `1:-1` toward `1:-2`
- west through `-1:1` toward `-2:1`
- east through `3:1` toward `4:1`
- south through `1:3` toward `1:4`

The veil may visually continue those roads / terrain transitions beyond the current world edge, but no backfill art may create a visual dead-end at those four approaches.

Preferred treatment at each approach:

- reduce terrain contrast toward the edge,
- allow the path or open ground to continue into cloud,
- avoid a terminal landmark,
- avoid a hard cliff or wall perpendicular to the route.

## Detail hierarchy

Active terrain remains the visual master.

Recommended relative hierarchy:

- active district terrain: 100%
- Growth Frontier backfill: 45–55%
- outer-corner backfill: 25–40%
- veil-visible detail after overlay: lower still

Backfill should contain fewer small objects, fewer sharp edges, lower local contrast, and larger quiet shapes than active terrain.
## Palette continuity

Do not create twelve unrelated miniature biomes.

Use four broad peripheral families tied to the existing city:

- **North / Observatory:** dry olive, straw, muted stone, soft highland green
- **West / Archive:** parchment gold, muted sage, warm earth
- **East / Workshop:** tawny ochre, warm gray stone, dry muted green
- **South / Waterside:** blue-green, warm sand, pale wetland olive

Corner cells blend adjacent families rather than introducing new colours.

The full outer world should still read as one storybook map painted on the same paper.

## Backfill geometry

Each decorative cell occupies exactly one existing chunk-sized world rectangle.

No overlap into active terrain is required for structural coverage. Seam softening should come from painted edge continuity and the veil, not from moving cell bounds.

Backfill cells should be individually addressable so a future district chunk can suppress exactly one cell.
## Prototype acceptance criteria

The next Backfill visual prototype should demonstrate at least these four representative cases before all 12 cells are produced:

1. `0:-1` — upland Growth Frontier
2. `-1:2` — Archive-to-Waterside transition Growth Frontier
3. `0:3` — coastal Growth Frontier
4. `3:-1` or `-1:-1` — quiet outer corner

Prototype PASS requires:

- no project-like building or district landmark,
- immediately lower detail than active terrain,
- believable colour / landform continuation at the shared seam,
- clear future-growth opening in Tier G cells,
- enough painted information beneath translucent fog that no flat blank canvas shows through,
- compatibility with a stronger veil without losing the active-city hierarchy.

## Plan gate

**Rectangular backfill coverage plan: COMPLETE**

Next step: **Backfill visual prototype**.
