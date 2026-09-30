# Phase 3.9 - World Single-Image Runtime Design

Updated: 2026-09-30  
Status: DESIGN COMPLETE / prototype-ready  
Scope: Portfolio City World Map runtime

## Decision

Adopt **Single Master World + Camera Viewport + Semantic Overlay** as the primary candidate for the next World Map runtime architecture.

The authoring Master World remains one continuous illustrated world.

The visitor runtime should no longer require the 192-tile presentation model as its default rendering strategy if the Single-Image prototype passes visual and performance gates.

Target stack:

1. single continuous World image
2. camera / viewport
3. atmospheric cloud / frontier veil
4. semantic district hotspot overlay
5. optional labels / focus / transition UI

The internal 16 x 12 logical grid remains authoritative for planning and publication state, but invisible to visitors.

This document defines a reversible migration candidate. It does not by itself authorize production cutover, merge, deployment, or tile removal.

---

## Why change the runtime

The current tile architecture solved large-source handling and deterministic placement, but it introduces costs that may no longer be necessary for the current world scale:

- 192 runtime image assets
- tile manifest and loading logic
- seam / registration QA
- more runtime bookkeeping
- more complicated whole-world visual effects
- reveal logic that can inherit tile boundaries
- a stronger implementation-grid feeling than the intended continuous illustrated-world feeling

The Single-Image model moves complexity away from image assembly and toward a simpler camera model.

The visitor should feel that they are looking at one illustrated world through a movable window, not at a mosaic of cells.

---

## Non-goals

This migration does not:

- remove the 16 x 12 Master Grid
- move existing district home cells
- change canonical project routes
- change the World -> District -> Building Preview -> Work hierarchy
- force the entire 8192 x 6144 authoring source into the browser
- bake clouds permanently into the world art
- expose unpublished cells as disabled UI
- require infinite or map-app-style zoom

---

## Authoring source

Canonical authoring baseline remains:

- Master World: 8192 x 6144 px
- aspect ratio: 4:3
- logical grid: 16 x 12
- logical cell size at source resolution: 512 x 512 px
- visitor-visible grid: none

Existing canonical district homes remain:

- Observatory Hill: H05
- Archive Street: G06
- Workshop Alley: I06
- Waterside Play: H07

The 8192 x 6144 image is an authoring master, not automatically a public runtime download.

Accepted high-resolution visual masters remain in Google Drive according to project asset policy.

---

## Runtime image derivatives

Produce responsive single-image derivatives from the authoring master.

Initial candidates:

- large desktop: 4096 x 3072
- standard desktop/tablet: 3072 x 2304
- mobile: 2048 x 1536

Preferred delivery formats:

1. AVIF when visual QA and browser support are acceptable
2. WebP fallback
3. no raw authoring PNG as the default public asset

Exact dimensions and quality are performance-gate values, not permanent locks.

---

## Runtime architecture

Reference structure:

```html
<div class="world-viewport">
  <div class="world-camera">
    <picture class="world-base">
      <!-- responsive world derivative -->
    </picture>

    <div class="world-atmosphere" aria-hidden="true"></div>
    <svg class="world-hotspots" viewBox="0 0 8192 6144"></svg>
    <div class="world-ui"></div>
  </div>
</div>
```

Responsibilities:

- `world-viewport`: clipping window and interaction surface
- `world-camera`: translated/scaled world plane
- `world-base`: one continuous visitor-world image
- `world-atmosphere`: cloud / haze / frontier softness
- `world-hotspots`: district meaning and navigation geometry
- `world-ui`: labels and non-geographic UI

Project-building interaction remains inside District View.

---

## Core principle: pixels and meaning are separate

The World image contains geography and visible landmarks as a finished illustration.

Interaction is not encoded by splitting the image.

- pixels answer: **what does the world look like?**
- hotspot data answers: **what does this place mean?**
- camera data answers: **what part may the visitor see?**
- reveal data answers: **how clearly may this area be shown?**

This mirrors the District Single-Scene direction.

A district may be visually baked into the World image while remaining independently interactive.

---

## Hotspot coordinate contract

Use authoring-master coordinates as the stable interaction coordinate system.

SVG viewBox:

```text
0 0 8192 6144
```

Each published district owns:

- districtId
- homeCell
- anchorX
- anchorY
- hotspot polygon / path
- camera focus point
- label anchor
- publication state

Conceptual example:

```json
{
  "districtId": "waterside-play",
  "homeCell": "H07",
  "hotspot": [[...], [...]],
  "focus": { "x": 4014, "y": 3470 },
  "published": true
}
```

CSS pixels never become the source of truth.

The same semantic geometry scales with the image across breakpoints.

---

## Camera model

Reuse the existing normalized camera contract.

Entry remains intentionally cropped.

Baseline centers remain approximately:

- desktop: (0.475, 0.465)
- tablet: (0.475, 0.470)
- mobile: (0.470, 0.460)

The initial viewport must not fit the entire 16 x 12 Master World.

Camera state:

- centerX
- centerY
- zoom
- pan bounds
- breakpoint framing policy
- optional last-selected district
- restorable snapshot

Responsive behavior changes framing, never geography.

---

## Zoom policy

Zoom is deliberately limited.

Recommended states:

- entry zoom: current published cluster readable
- district-focus zoom: one district plus neighboring context
- overview zoom: optional, but not default whole-world fit

Avoid deep arbitrary map-app zoom.

This is an illustrated portfolio world, not a GIS viewer.

District selection may perform a gentle focus transition before entering District View, but navigation must not depend on animation completion.

Reduced-motion mode may snap instead of animate.

---

## Pan policy

Desktop:

- pointer drag within constrained bounds
- keyboard arrow pan
- no infinite world movement

Mobile:

- touch pan
- short travel around the published cluster
- readable district scale over whole-world fit

Return from District View restores the saved World camera.

Camera bounds may expand when new districts publish.

Existing district coordinates do not move merely to recenter the world.

---

## Clouds and frontier veil

Clouds remain presentation art, not publication data.

Preferred implementation is independent from the World base image.

Possible mechanisms:

- transparent WebP / AVIF cloud sheets
- SVG organic masks
- CSS masks / gradients
- lightweight cloud sprites where motion is justified

Cloud geometry should be organic and cross logical cell boundaries.

State behavior:

**PUBLISHED**
- focal geography clear
- district interactive

**NEAR_FRONTIER**
- partial terrain visible
- lighter atmospheric veil
- no district interaction unless published

**UNPUBLISHED**
- coarse geography may remain visible
- stronger atmospheric softness
- no implied active district

**UNRESOLVED**
- strongest veil
- simplified / non-committal geography

Never render rectangular per-cell fog.

---

## New-district reveal transaction

Publishing a district should become:

1. lock its logical home cell
2. refine the local Master World neighborhood if required
3. update the authoring master
4. export new responsive runtime derivatives
5. update semantic hotspot data
6. update atmospheric reveal mask
7. expand camera bounds only as needed
8. QA old district anchors against the unchanged world coordinate plane
9. ship the new derivatives atomically

The visitor sees the world becoming clearer, not a new tile being inserted.

The authoring workflow may still use internal crops/layers.

Public runtime structure does not need to mirror authoring structure.

---

## Loading and performance

"One image" does not mean "ship the raw 8192 x 6144 master."

Use:

- responsive `picture` / `srcset`
- AVIF/WebP compression
- correct intrinsic dimensions
- deferred nonessential atmosphere
- no hidden duplicate copy of the full world image
- no full-resolution hover clone

Measure separately:

- network transfer size
- decoded bitmap memory
- image decode time
- paint/composite cost

Approximate decoded RGBA memory:

- 4096 x 3072: ~48 MiB
- 3072 x 2304: ~27 MiB
- 2048 x 1536: ~12 MiB

Responsive derivatives are therefore mandatory.

---

## Image loading sequence

Recommended:

1. HTML/CSS shell
2. breakpoint-appropriate World image
3. semantic hotspot data
4. essential frontier veil
5. nonessential atmospheric decoration

Do not block district interaction on decorative cloud animation.

While the image is decoding:

- preserve layout space
- use a quiet paper/sky placeholder if needed
- avoid dashboard-like skeleton cards over the map

Hotspot geometry must not shift when the image finishes decoding.

---

## Accessibility

Every published district hotspot must be keyboard reachable.

Each target needs:

- district name
- visible focus treatment
- deterministic focus order
- no hover dependency

Decorative World imagery and clouds are not separate focus targets.

Reduced-motion support remains part of the contract.

---

## Hover / focus treatment

Preferred:

- subtle SVG outline
- local translucent wash
- label reveal
- lightweight same-image clipped highlight only if performance remains acceptable

Avoid:

- separately generated district overlay art solely for hover
- duplicate full-world bitmap per state
- strong glow effects that turn the map into a dashboard

Interaction should reveal meaning without overwhelming the illustration.

---

## Labels

District labels are UI, not authoritative baked text.

Benefits:

- responsive placement
- accessibility
- localization
- collision avoidance
- focus/hover-driven visibility

The World art may contain decorative signage, but navigation labels belong to semantic UI.

---

## Runtime data

Proposed structure:

```text
portfolio-city/
  assets/world/v2/
    world-4096.avif
    world-4096.webp
    world-3072.avif
    world-3072.webp
    world-2048.avif
    world-2048.webp
    clouds.webp
  data/
    world-single-scene.json
  world-viewer.js
  world-viewer.css
```

Authoring-only high-resolution assets remain outside the public runtime bundle.

`world-single-scene.json` should reference semantic/camera data, not duplicate canonical project routes.

---

## Proposed schema

Minimum shape:

```json
{
  "schemaVersion": 1,
  "source": { "width": 8192, "height": 6144 },
  "entryCamera": {
    "desktop": {},
    "tablet": {},
    "mobile": {}
  },
  "districts": [],
  "reveal": {},
  "assets": {}
}
```

Do not encode CSS pixels.

Use:

- exact 8192 x 6144 source coordinates for hotspot geometry
- normalized 0..1 coordinates for portable camera state

---

## What happens to the 192 tiles

Do not delete them during migration.

They remain:

- rollback assets
- QA evidence
- historical implementation evidence
- possible future delivery fallback
- optional authoring/debug derivatives

The first Single-Image implementation must be reversible.

"Retire tiles" means retiring the visitor runtime dependency, not removing the 16 x 12 logical coordinate model.

---

## Migration plan

### S1 - Isolated prototype

Build a World viewer using the existing Master World.

Required:

- one image
- existing camera anchors
- four district hotspots
- desktop/mobile pan
- cloud overlay
- district selection

No production cutover.

### S2 - Performance comparison

Compare against the current tile runtime.

Measure:

- transferred bytes
- request count
- decode time
- interaction readiness
- memory
- pan smoothness
- mobile behavior

### S3 - Visual interaction QA

Verify:

- 1440 desktop
- 820 tablet
- 390 mobile
- no horizontal document overflow
- hotspot alignment
- no cloud/grid artifacts
- readable district cluster
- camera restore
- keyboard/focus behavior
- reduced motion

### S4 - Production candidate behind reversible gate

Wire the Single-Image viewer without deleting the tile runtime.

### S5 - Cutover decision

Cut over only after:

- visual approval
- acceptable performance
- no functional regression
- verified rollback

Do not delete tile assets inside the cutover commit.

---

## Performance acceptance gate

Single-Image is accepted only if the real implementation is operationally competitive with the tile runtime.

Desired outcomes:

- far fewer image requests
- simpler DOM/runtime structure
- simpler reveal effects
- no seam risk
- no unacceptable mobile memory spike
- no long blank decode period
- smooth short-pan interaction

If 4096 is too costly, use a smaller responsive derivative before falling back to tiled delivery.

If a future World genuinely outgrows practical single-image delivery, internal rendering may become hybrid while preserving the **single continuous world interaction model**.

---

## Art-direction consequences

The World can be authored as one composition first.

This improves:

- road continuity
- river/coast continuity
- atmospheric perspective
- lighting consistency
- color rhythm
- large-form composition
- cloud staging
- reveal staging

Visual production follows:

`docs/PORTFOLIO_STORYBOOK_CITY_STYLE_BIBLE.md`

The Master World is a painting with coordinates, not a grid visualization.

---

## Anti-patterns

Do not:

- ship the raw 8192 x 6144 master blindly
- recreate 192 DOM nodes merely because the logical grid has 192 cells
- crop districts into independent visual layers without a real requirement
- bake publication clouds permanently into the World base
- align cloud edges with logical cells
- fit the entire world on mobile
- make every visible landmark clickable
- duplicate route tables in World data
- let responsive layout alter geography
- regenerate accepted geography merely to change hotspot geometry
- delete rollback assets before cutover evidence exists

---

## Decision summary

Candidate visitor architecture:

```text
Master World authoring source
-> responsive single-image visitor derivative
-> bounded camera viewport
-> independent atmospheric veil
-> semantic SVG district hotspots
-> District View
```

Logical architecture remains:

```text
16 x 12 invisible Master Grid
+ publication / reveal state
+ stable district coordinates
```

The runtime no longer needs to expose the implementation grid through its asset-delivery model.

---

## Prototype acceptance criteria

S1 / S2 are considered successful when:

1. the real Master World renders as one browser image
2. desktop/mobile entry cameras preserve intended published-cluster framing
3. all four current districts align correctly
4. all four current districts are keyboard reachable
5. cloud/frontier treatment obscures unpublished distance without rectangular artifacts
6. district interaction works independently from image slicing
7. World camera can restore after District return
8. 1440 / 820 / 390 layouts remain usable
9. actual transfer/decode/memory metrics are recorded
10. no production rollback path is removed

---

## Next checkpoint

**World Single-Image Prototype S1**

Use the existing real Master World and existing canonical district coordinates.

Do not generate a replacement World merely to test the viewing architecture.

Do not remove current tiled assets.

Do not change district home cells.
