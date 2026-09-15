# Portfolio City Phase 3.6-R2 — Negative-Origin Runtime Registration Design

Date: 2026-09-16
Status: **DESIGN COMPLETE CANDIDATE / NOT RUNTIME IMPLEMENTED**
Branch: `phase3-6-r2-negative-origin-runtime-design`

## Purpose

The approved 13-chunk footprint introduces `column=-1` and `row=-1`. The current renderer assumes a zero-origin world when it converts a chunk render region to CSS percentages, so a negative world coordinate would become a negative `left` or `top` value.

R2 defines a backward-compatible coordinate normalization contract before any runtime asset registration occurs.

## Current renderer risk

`portfolio-city/city.js` currently calculates illustrated chunk CSS positions with formulas equivalent to:

```text
left = region.x / world.width
 top = region.y / world.height
```

That works for the current `minX=0`, `minY=0` layout, but it is not sufficient for the future 13-chunk world because the structural bounds include `x=-1024` and `y=-768`.

No runtime code is changed in this PR. The purpose of this document is to lock the replacement contract first.

## Future world bounds

The 13-chunk structural footprint uses:

```text
minX = -1024
minY = -768
maxX =  4096
maxY =  3072
width =  5120
height = 3840
```

The chunk size remains exactly `1024 × 768` world units.

This creates a convenient conceptual 5 × 5 normalization grid. A full chunk occupies exactly `20% × 20%` of the future world canvas.

## Backward-compatible resolver

The implementation should introduce one authoritative bounds resolver.

Conceptually:

```js
function resolveWorldBounds(world) {
  const minX = Number.isFinite(world.minX) ? world.minX : 0;
  const minY = Number.isFinite(world.minY) ? world.minY : 0;
  return {
    minX,
    minY,
    width: world.width,
    height: world.height,
    maxX: minX + world.width,
    maxY: minY + world.height
  };
}
```

The zero defaults are mandatory. They preserve the existing 3200 × 2304 map without requiring a migration in the helper implementation commit.

## Normalization formulas

World coordinates remain absolute world coordinates. Only rendering conversion changes.

```text
xPercent = (x - minX) / worldWidth × 100
yPercent = (y - minY) / worldHeight × 100
widthPercent = rectWidth / worldWidth × 100
heightPercent = rectHeight / worldHeight × 100
```

Do not rewrite existing project positions, gate positions, district regions or camera presets into shifted coordinates. The origin offset belongs in the renderer, not in the authored content.

## 13-chunk simulation

The future chunks normalize as follows:

| Chunk | World rect origin | CSS left/top | CSS width/height |
|---|---:|---:|---:|
| `1:-1` | `(1024,-768)` | `40%, 0%` | `20%, 20%` |
| `0:0` | `(0,0)` | `20%, 20%` | `20%, 20%` |
| `1:0` | `(1024,0)` | `40%, 20%` | `20%, 20%` |
| `2:0` | `(2048,0)` | `60%, 20%` | `20%, 20%` |
| `-1:1` | `(-1024,768)` | `0%, 40%` | `20%, 20%` |
| `0:1` | `(0,768)` | `20%, 40%` | `20%, 20%` |
| `1:1` | `(1024,768)` | `40%, 40%` | `20%, 20%` |
| `2:1` | `(2048,768)` | `60%, 40%` | `20%, 20%` |
| `3:1` | `(3072,768)` | `80%, 40%` | `20%, 20%` |
| `0:2` | `(0,1536)` | `20%, 60%` | `20%, 20%` |
| `1:2` | `(1024,1536)` | `40%, 60%` | `20%, 20%` |
| `2:2` | `(2048,1536)` | `60%, 60%` | `20%, 20%` |
| `1:3` | `(1024,2304)` | `40%, 80%` | `20%, 20%` |

The negative-coordinate chunks therefore land at ordinary non-negative CSS positions once the world origin is subtracted.

## Existing project placement rule

All 14 project world coordinates stay exactly as they are now. For example:

- HoloScope `(1600,360)` becomes `51.25%, 29.375%`
- HoloCa `(1600,1820)` becomes `51.25%, 67.39583%`
- Word Generator `(2440,1880)` becomes `67.65625%, 68.95833%`

The machine-readable JSON contains all 14 normalized samples so future implementation tests can compare against fixed expected values.

## District and camera rule

District regions also remain in absolute world coordinates. They must use the same bounds helper when converted to visual placement.

Camera preset `startX/startY` values remain authored world coordinates. Their future normalized centres are recorded in the JSON, but the camera API should continue to accept world coordinates.

The current desktop map centering behavior does not yet consume these presets for negative-origin placement, so camera integration is a separate implementation concern from basic chunk normalization.

## Runtime map data shape

When the runtime registration gate is eventually approved, `map-layout.json` should extend `world` with explicit origin fields:

```json
{
  "world": {
    "chunkWidth": 1024,
    "chunkHeight": 768,
    "minX": -1024,
    "minY": -768,
    "width": 5120,
    "height": 3840
  }
}
```

`maxX/maxY` do not need to be stored because they are derived. Storing only `minX/minY/width/height` prevents conflicting bound definitions.

## Renderer implementation contract

The future implementation should use a small shared geometry layer rather than repeating arithmetic inline.

Required responsibilities:

1. resolve world bounds with zero-origin fallback;
2. convert points from absolute world coordinates to percentages;
3. convert rectangles from absolute world coordinates to percentages;
4. use the rectangle helper for every illustrated chunk;
5. expose `worldMinX` and `worldMinY` on `#cityMap` for QA diagnostics;
6. preserve exact world coordinates in data attributes for projects and districts;
7. reject non-finite or inconsistent bounds during validation.

The existing current chunk logic must no longer contain raw `region.x / world.width` or `region.y / world.height` calculations after implementation.

## Runtime registration sequence

Runtime rollout must remain staged:

1. implement only the origin-aware helper layer and tests;
2. prove the existing 9-chunk layout is visually and numerically unchanged;
3. test a synthetic negative-origin fixture with all 13 chunk coordinates;
4. add the 13 terrain WebP files;
5. update `map-layout.json` to the future bounds and 13 exact chunk records;
6. verify all 14 project placements and district regions;
7. run desktop/tablet/mobile browser QA at 1440 / 820 / 390 widths;
8. confirm no horizontal overflow, no missing terrain and no console errors;
9. deploy only after explicit approval.

This order intentionally separates renderer correctness from terrain registration. If the renderer helper fails, no production map data has changed yet.

## Mandatory implementation QA

The implementation gate cannot pass unless all of the following are true:

- current zero-origin percentages remain numerically identical;
- all 13 future chunks are inside `0..100%` bounds;
- every future chunk is exactly `20% × 20%`;
- `column=-1` maps to `left=0%` rather than a negative value;
- `row=-1` maps to `top=0%` rather than a negative value;
- all 14 project authored coordinates are unchanged;
- current HoloScope / Sphere / Prime building assets remain independent of terrain;
- current interaction, visited state, inspector and panning behavior continue to work;
- runtime tests are expanded rather than weakened;
- no production deployment occurs until the later registration PR is explicitly approved.

## This PR boundary

R2 is design-only.

It does **not** modify:

- `portfolio-city/city.js`
- `portfolio-city/city.css`
- `portfolio-city/data/map-layout.json`
- production terrain assets
- the live site

The next gate is **Negative-Origin Renderer Implementation & Compatibility QA**.
