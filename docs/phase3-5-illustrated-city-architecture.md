# Portfolio City Phase 3.5 — Extensible Illustrated City Architecture

Designed: 2026-09-14
Baseline: `2361294695381f45e79f69cb38e31753ae30f9c3`
Status: pilot implemented; Observatory Hill quality master locked; Phase 3.6-P0 district connections closed 2026-09-15

> Sequence note (2026-09-15): after the illustrated Observatory Hill pilot, the project inserted Phase 3.5-P1, Phase 3.5-P2, Phase 3.5-P2.5 and a revalidated quality-master Checkpoint 3. Phase 3.6-P0 District Connection Design then defined and wireframe-validated the shared connection graph and chunk-seam contracts, and is now closed PASS. The next stage is Central Commons connector terrain design. The older "Checkpoint 3 - Four-district conversion" heading below is therefore a historical sequence label, not authorization to skip the connection workflow. See `docs/phase3-5-observatory-quality-master.md` and `docs/phase3-6-district-connection-design.md`.

## 1. Goal

Phase 3.5 replaces the current SVG-led visual presentation with a high-quality illustrated city while preserving the current Portfolio City interaction model and making future project growth inexpensive.

The city must be able to grow from the current 14 projects to a substantially larger inventory without repainting one monolithic background every time a project is added.

The core rule is:

> The world is modular. Terrain grows by chunks, project buildings are independent illustrated assets, and interaction is data-driven.

## 2. Non-goals

Phase 3.5 does not change project routes, project identity, visited-state semantics, MAP / WORKS / PROFILE / CONTACT navigation, or the existing production applications.

It also does not adopt one giant flattened city illustration as the runtime asset. A large concept painting may be used as an art-direction reference, but the production city must remain decomposable and extensible.

## 3. Canonical world model

Use one shared logical world for desktop, tablet, and mobile.

- Logical chunk size: `1024 × 768 world units`.
- Recommended rendered chunk asset: `2048 × 1536 px` at 2× density.
- Chunk coordinates are integer `(column, row)` pairs.
- Negative chunk coordinates are allowed, so the city may expand in any direction.
- World bounds are derived from registered chunks rather than hard-coded to a fixed rectangle.
- Runtime positioning uses world units, not source-image pixel coordinates.

Example:

```text
(-1,-1)  (0,-1)  (1,-1)
(-1, 0)  (0, 0)  (1, 0)
(-1, 1)  (0, 1)  (1, 1)
```

Only occupied / needed chunks require art assets. The registry may therefore be sparse.

## 4. Visual layer stack

The rendered map is assembled from independent layers, back to front:

1. `terrain chunks`
   - cliffs, land, water, broad roads, major bridges, sky-edge treatment
   - must not contain named project buildings
2. `district scenery`
   - observatory structures, archive arcades, workshop sheds, piers, gardens, retaining walls
   - reusable atmosphere, not tied to a single project
3. `ambient props`
   - trees, lamps, boats, signs, benches, market stalls, clouds, small decorative structures
4. `project buildings`
   - one transparent illustrated asset per project
   - the canonical clickable visual for each work
5. `interaction overlay`
   - hit areas, focus rings, selected / visited indicators
   - invisible unless needed for feedback
6. `UI overlay`
   - inspector, drag hint, navigation, accessibility text

This separation allows the city to become visually rich without coupling project inventory to the background painting.

## 5. Asset policy

### Production assets in Git

Only web-ready assets belong in the repository:

```text
portfolio-city/assets/illustrated/
  chunks/
    terrain_0_0.webp
    terrain_1_0.webp
  districts/
    observatory/
    archive/
    workshop/
    waterside/
  buildings/
    holoscope.webp
    sphere.webp
    ...
  props/
    tree_01.webp
    lamp_01.webp
    boat_01.webp
```

Use WebP as the required baseline runtime format. AVIF may be added later as an optional `<picture>` source after browser / deployment verification.

Transparent project-building assets should be exported tightly cropped around the illustration, with consistent padding and a bottom-center anchor.

### Art masters

Large layered masters, generation references, PSD/Krita files, and lossless working exports should not inflate the public Git repository. Store approved art masters in the Portfolio City reference area in Google Drive. Git contains only optimized runtime derivatives plus documentation identifying the approved source.

## 6. Separate content data from city layout

`portfolio-city/data/projects.json` remains the canonical project/content registry. Do not add pixel positions, art dimensions, camera rules, or chunk coordinates to it.

Introduce a separate file:

`portfolio-city/data/map-layout.json`

This keeps product content stable while allowing the illustrated city layout to evolve independently.

Proposed schema:

```json
{
  "schemaVersion": 1,
  "world": {
    "chunkWidth": 1024,
    "chunkHeight": 768
  },
  "chunks": [
    {
      "id": "0:0",
      "column": 0,
      "row": 0,
      "image": "assets/illustrated/chunks/terrain_0_0.webp"
    }
  ],
  "projectPlacements": [
    {
      "projectId": "holoscope",
      "x": 1420,
      "y": 410,
      "width": 230,
      "anchor": "bottom-center",
      "asset": "assets/illustrated/buildings/holoscope.webp",
      "z": 410,
      "hitbox": { "x": -92, "y": -178, "width": 184, "height": 178 }
    }
  ]
}
```

`projectId` is the join key. Every project that appears on the map must resolve to exactly one entry in `projects.json`.

## 7. Coordinate and depth rules

Project placement coordinates represent the building's ground contact point, using a bottom-center anchor. This makes resizing or replacing an illustration much safer than top-left positioning.

For world objects that visually overlap, default depth order should be derived from world `y` so objects lower on the screen naturally appear in front. The explicit `z` field is an escape hatch for bridges, elevated terrain, or intentional exceptions.

The initial renderer may use:

```text
computedZ = round(worldY)
```

with an optional explicit override.

## 8. District model

Districts are logical regions, not one-image-per-district containers.

A district may span multiple chunks, and one chunk may contain transition scenery between districts. Therefore chunk ownership must not be the source of truth for district membership.

Future `map-layout.json` may define district regions as simple world-space rectangles or polygons. Project membership continues to come from `projects.json`.

The four existing identities remain:

- Observatory Hill: elevated, astronomical, bright stone, sky-facing
- Archive Street: bookish, indexed, arcades, institutional / scholarly
- Workshop Alley: handmade, mechanical, warm industrial details
- Waterside Play: water, piers, boats, playful civic space

## 9. Camera model

Desktop, tablet, and mobile use the same world and same building coordinates. They must not maintain separate copies of the city.

Only the camera differs.

Proposed camera presets:

```json
{
  "desktop": { "zoom": 1.0, "startX": 1536, "startY": 720 },
  "tablet":  { "zoom": 0.72, "startX": 1536, "startY": 720 },
  "mobile":  { "zoom": 0.56, "startX": 1536, "startY": 620 }
}
```

The exact values are art-dependent and will be tuned during implementation.

Desktop keeps drag-to-pan. Tablet and mobile may allow touch pan once the illustrated world is larger than the viewport, but this should be introduced deliberately and tested against page scrolling.

## 10. Growth rules when projects are added

Adding a project follows this decision tree:

1. Add the project to `projects.json`.
2. Decide its district.
3. Check whether that district has a visually suitable vacant parcel.
4. If a parcel exists:
   - create one project-building illustration
   - add one `projectPlacements` record
   - no terrain repaint is required
5. If the district is full:
   - register one adjacent terrain chunk
   - create only that new chunk's terrain illustration
   - extend roads / scenery across the shared edge
   - place the new project there
6. Never repaint all existing chunks merely because one project was added.

This turns portfolio growth into city growth rather than a full-map rewrite.

## 11. Chunk seam rules

Every terrain chunk must obey an edge contract so newly generated / painted chunks can connect later.

For each chunk edge, record compatible connection points for:

- road exits
- water exits
- cliff / elevation edges
- bridge approaches
- vegetation density

Do not place irreplaceable landmarks directly across a chunk seam.

A future `chunkConnections` block may describe these anchors explicitly, but Phase 3.5 implementation may begin with a documented grid overlay and fixed road connector lanes.

## 12. Art-direction consistency

The illustrated assets must read as one city even when produced at different times.

Maintain an art bible covering:

- viewpoint / camera angle
- horizon and perspective
- light direction and time of day
- line / edge softness
- material palette
- saturation and atmospheric perspective
- building scale range
- vegetation style
- shadow direction and softness
- transparent-edge treatment

New buildings should be generated / painted against this art bible, not by independently prompting for a generic fantasy building.

## 13. Interaction contract

The beautiful artwork is presentation. Interaction remains semantic HTML / DOM.

Each project building must remain a real focusable button with:

- accessible project and building name
- keyboard navigation
- selected / visited state
- inspector opening behavior
- route handoff through the existing inspector / work directory

Do not make interaction depend on image-map coordinates embedded in the raster file.

## 14. Loading and performance

A growing illustrated map must not download the entire future city at startup.

Initial strategy:

- eagerly load chunks intersecting or immediately surrounding the starting camera
- lazy-load more distant chunks as the viewport approaches them
- lazy-load project building assets outside the near viewport when practical
- retain dimensions in data so late image loading does not alter world geometry

Performance targets for the first implementation checkpoint:

- no horizontal page overflow
- drag remains responsive on a normal desktop browser
- image decode does not block project interaction
- the initial visible city remains useful while distant assets load

Exact byte budgets should be set after the first illustrated chunk is produced and measured.

## 15. Proposed Phase 3.5 implementation sequence

### Checkpoint 1 — Data + renderer skeleton

- add `map-layout.json`
- add world-coordinate renderer
- preserve current SVG visuals as temporary fallback
- render chunks / placements from data
- no final illustration required yet

### Checkpoint 2 — Art bible + one pilot chunk

- define the visual production guide
- create one high-quality terrain chunk
- create 2–3 matching project buildings
- test seams, scale, WebP quality, loading cost, and interaction

### Checkpoint 3 — Four-district conversion

- convert the remaining initial terrain area
- produce all current 14 building illustrations
- replace SVG presentation while retaining interaction semantics

### Checkpoint 4 — Responsive camera + navigation

- tune 1440 / 820 / 390 views from the same world
- refine desktop drag
- decide and test touch-pan behavior
- add optional minimap only if the enlarged world needs orientation support

### Checkpoint 5 — Growth simulation

Before calling Phase 3.5 complete, simulate adding at least two hypothetical future projects:

- one into an existing vacant parcel
- one that requires a brand-new adjacent chunk

The architecture passes only if both additions can be represented without repainting the existing city.

### Checkpoint 6 — Production migration + closure

- production QA
- update handoff
- document runtime asset workflow
- retain SVG fallback assets until the illustrated release proves stable, then decide whether to archive them

## 16. Acceptance criteria

Phase 3.5 architecture is considered successfully implemented when:

- current 14 project routes remain unchanged
- project content and world layout are stored separately
- the city can expand by registering additional chunks
- each project building can be replaced independently
- desktop / tablet / mobile use one world coordinate system
- adding a project does not require repainting a monolithic background
- runtime remains keyboard-accessible
- current drag / inspector / visited behavior is preserved or explicitly improved
- a simulated new-chunk expansion is demonstrated before closure

## 17. Decision summary

Adopt a **modular illustrated game-map architecture**, not a single flattened illustration.

The visual north star remains the approved richly illustrated Portfolio City concept, while the implementation underneath becomes a sparse expandable world made from terrain chunks, reusable scenery, independent project-building illustrations, and a data-driven interaction layer.
