# Phase 3.9 - World Reveal / Cloud Prototype S3

Updated: 2026-09-30

Status: **PASS / technical reveal architecture accepted / no production cutover**

## Goal

Turn Portfolio City publication state into atmosphere instead of visible UI locking or tile-shaped fog-of-war.

S3 proves that the Single-Image World can keep:

- publication semantics in data
- geography in one continuous image
- interaction in semantic hotspots
- reveal / concealment in an independent atmosphere layer

without rendering the logical 16 x 12 grid to visitors.

## Canonical inputs

Publication semantics remain canonical in:

`prototype/phase3-9-world-data/world-reveal.v1.json`

Current W0 published cells remain exactly:

- H05 - Observatory Hill
- G06 - Archive Street
- I06 - Workshop Alley
- H07 - Waterside Play

S3 atmosphere geometry is isolated in:

`prototype/phase3-9-world-reveal-s3/reveal-geometry.s3.json`

The S1 camera / hotspot coordinate contract is reused unchanged.

## State presentation

S3 maps the four canonical state meanings to independent atmosphere:

**PUBLISHED**

- geography is clear
- district hotspot exists
- district remains interactive

**NEAR_FRONTIER**

- lighter frontier haze
- terrain may remain visible
- no new interaction is implied

**UNPUBLISHED**

- broader World veil softens geography
- geography may still be visible
- no disabled district UI is rendered

**UNRESOLVED**

- broad stronger cloud banks sit at distant / uncertain edges
- the visitor sees atmosphere rather than a disabled rectangle

## No grid-shaped fog

The S3 DOM contains:

- one World image
- zero terrain tile nodes
- zero logical-cell UI nodes
- four district hotspots
- five broad unresolved cloud banks

Every authored unresolved bank spans more than one 512 x 512 logical cell and is explicitly marked as cross-cell geometry.

The reveal layer is:

- `aria-hidden="true"`
- `pointer-events: none`
- absent from keyboard focus order

Publication data therefore cannot accidentally become interaction-blocking scenery.

## Organic reveal profiles

Two atmosphere profiles are included.

### Current W0

The current four-district cluster is cleared by one continuous organic authored mask.

The mask is not generated from four cell rectangles.

### J05 reveal preview

J05 already belongs to canonical W0 frontier data.

S3 provides a hypothetical J05 reveal preview that locally extends the organic clearing toward that area.

This preview deliberately changes **atmosphere only**.

It does not:

- publish J05
- change `world-reveal.v1.json`
- add a district
- add a hotspot
- move an existing district
- move the camera
- change the World image
- change the four published hotspot polygons

This proves the intended future transaction:

```text
existing world
+ local atmosphere reshape
= world appears to open
```

rather than:

```text
insert a new visible tile
```

## Static validation

Executed against the exact S3 branch worktree:

```text
node --check prototype/phase3-9-world-reveal-s3/reveal.js
node --check tools/check_portfolio_city_world_reveal_s3.mjs
node tools/check_portfolio_city_world_reveal_s3.mjs
git diff --check origin/rinka/portfolio-city-single-image-s2..HEAD
```

Result:

```text
Portfolio City World Reveal Prototype S3 contract passed:
canonical publication data / organic cross-cell atmosphere /
atmosphere-only J05 preview / 4 published hotspots
```

## Browser QA

Microsoft Edge was driven through the DevTools Protocol with exact CSS viewport emulation.

### Fresh entry

| Viewport | Breakpoint | Entry camera | Horizontal overflow | World images | Tiles | Hotspots |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 1440 | desktop | (0.4750, 0.4650) | none | 1 | 0 | 4 |
| 820 | tablet | (0.4750, 0.4700) | none | 1 | 0 | 4 |
| 390 | mobile | (0.4700, 0.4600) | none | 1 | 0 | 4 |

All three widths pass.

### Reveal invariants

Switching Current W0 -> J05 preview -> Current W0 keeps all of the following unchanged:

- camera
- World image source
- World image dimensions
- four hotspot polygons
- published count = 4

The preview profile is therefore presentation-only.

### Locality of the reveal

Screenshot pixel differences were measured between Current W0 and J05 preview.

| Viewport | Changed pixels | Difference centroid |
| --- | ---: | --- |
| 1440 | 19.74% | (0.825, 0.339) |
| 820 | 18.20% | (0.843, 0.327) |
| 390 | 3.52% | (0.903, 0.168) |

The changed region stays on the east / northeast side of the visible World, matching the intended J05 reveal direction.

The mobile viewport sees less of that frontier, so its changed fraction is naturally smaller.

## Interaction QA

Desktop pointer pan:

```text
entry         (0.4750, 0.4650)
panned        (0.5073, 0.4506)
after reveal  (0.5073, 0.4506)
```

Changing atmosphere does not reset the camera.

Mobile touch pan:

```text
before (0.4700, 0.4600)
after  (0.4415, 0.4793)
```

The first automated S3 touch probe used a point low inside the map. Because S3 adds controls above the map, that coordinate fell below the visible 390px browser viewport and the synthetic touch was ignored.

The final probe uses a visible, non-hotspot location and passes. This was a QA-coordinate issue, not an S3 interaction defect.

Keyboard district selection and return-focus restoration also pass.

## Visual review

The technical atmosphere achieves the intended architecture:

- the four current districts remain visually readable
- the outer World softens continuously
- fog does not expose the 16 x 12 planning grid
- broad banks cross logical cell boundaries
- J05 preview looks like local atmosphere clearing rather than a tile appearing
- the base geography remains continuous underneath

The exact cloud shapes, texture, opacity and decorative treatment are **technical proof art only**.

S3 does not approve final production cloud artwork.

## S3 decision

**World Reveal / Cloud Prototype S3: PASS.**

Adopt the following architectural rule for subsequent work:

> Publication state controls independent atmosphere geometry. It does not split, disable, or tile the visible World.

Keep the logical grid as authoring metadata.

Keep only published districts interactive.

Future district publication may locally reshape the reveal mask while existing district coordinates remain fixed.

## Production boundary

S3 does not:

- switch production runtime
- publish J05
- add a fifth district
- generate final cloud artwork
- delete the tile rollback runtime
- change the S2 responsive image decision
- modify production routes

## Next checkpoint

**Phase 4 - District Single-Scene formalization**

Apply the same "finished illustration + semantic hotspot layer" architecture to a production-quality District View.

Waterside Play remains the preferred first candidate.

Machine-readable evidence:

`docs/phase3-9-world-reveal-s3-results.json`
