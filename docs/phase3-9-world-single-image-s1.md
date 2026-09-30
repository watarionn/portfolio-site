# Phase 3.9 - World Single-Image Prototype S1

Updated: 2026-09-30  
Status: **PASS / isolated prototype / no production cutover**  
Branch checkpoint: `rinka/portfolio-city-single-image-s1`

## Objective

Prove the World Map viewing architecture against the existing real Master World without generating replacement art and without changing the production runtime.

S1 validates:

```text
existing 8192 x 6144 Master World
+ one browser image
+ bounded camera viewport
+ independent atmosphere
+ source-coordinate SVG district hotspots
+ desktop/mobile pan
+ keyboard district selection
+ saved camera restoration
```

## Implementation

Isolated harness:

- `prototype/phase3-9-world-single-image-s1/index.html`
- `prototype/phase3-9-world-single-image-s1/prototype.css`
- `prototype/phase3-9-world-single-image-s1/prototype.js`
- `prototype/phase3-9-world-single-image-s1/world-single-scene.s1.json`
- `prototype/phase3-9-world-single-image-s1/README.md`

Static contract checker:

- `tools/check_portfolio_city_single_image_s1.mjs`

The prototype binds the existing canonical image:

- `portfolio-city/assets/world/v1/master/portfolio-city-master-world-v1.jpg`
- geometry: 8192 x 6144
- browser presentation: exactly one World image
- tile presentation nodes: zero

The existing 192-tile runtime and isolated tile prototype remain untouched for rollback and S2 comparison.

## Coordinate contract

District homes are unchanged:

- Observatory Hill: H05
- Archive Street: G06
- Workshop Alley: I06
- Waterside Play: H07

Hotspot geometry uses the authoring-source coordinate plane:

`viewBox="0 0 8192 6144"`

Responsive layout never changes geography.

District label offsets are semantic UI placement only. They do not alter district anchors, home cells, or hotspot geometry.

## Static validation

Executed against the exact branch worktree:

```text
node --check prototype/phase3-9-world-single-image-s1/prototype.js
node tools/check_portfolio_city_single_image_s1.mjs
git diff --check 6eb08796e6299f68a0fa4027dbe18f6aa8354de6..HEAD
```

Result:

```text
Portfolio City World Single-Image Prototype S1 contract passed:
1 image / 4 hotspots / camera + pan + restore / isolated runtime
```

No production HTML/CSS/JS/runtime file is modified by S1.

## Browser QA

Microsoft Edge headless was driven through the browser DevTools Protocol with exact CSS viewport emulation.

This avoids the OS/window-manager minimum-width behavior that makes a nominal `--window-size=390` wider than 390 CSS px.

### Fresh entry

| Viewport | Breakpoint | Entry camera | Horizontal overflow | Labels | World images | Tile nodes | Hotspots |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
| 1440 x 1000 | desktop | (0.4750, 0.4650) | none | inside / no collision | 1 | 0 | 4 |
| 820 x 900 | tablet | (0.4750, 0.4700) | none | inside / no collision | 1 | 0 | 4 |
| 390 x 844 | mobile | (0.4700, 0.4600) | none | inside / no collision | 1 | 0 | 4 |

The browser reported the source image as exactly `8192 x 6144` at every viewport.

### Interaction

All four districts pass keyboard activation and return-focus restoration:

- observatory: PASS
- archive: PASS
- workshop: PASS
- waterside: PASS

Desktop pointer pan:

```text
entry    (0.4750, 0.4650)
panned   (0.5145, 0.4435)
returned (0.5145, 0.4435)
```

The panned World camera is restored exactly after entering and returning from a district selection.

Mobile touch pan:

```text
before (0.4700, 0.4600)
after  (0.4363, 0.4842)
```

Reduced motion:

```text
prefers-reduced-motion: reduce -> matched
camera transition duration -> 0s
```

Browser QA overall result: **PASS**.

## Visual review

The final 1440 / 820 / 390 fresh-entry captures show:

- one continuous illustrated geography
- readable current published cluster
- no visible grid or tile seam
- independent organic frontier haze
- all four district labels readable
- no label clipping or collision
- mobile keeps useful district scale instead of shrinking to whole-world fit

The atmosphere in S1 is technical proof art only. It is not final cloud/frontier production art.

## Scope boundary

S1 does not authorize:

- production runtime cutover
- deletion of 192 tiles
- deletion of the logical 16 x 12 grid
- new Master World generation
- final responsive derivative dimensions
- final cloud art
- final performance verdict

The raw 8192 x 6144 Master is acceptable for architecture proof but is not the intended public runtime payload.

## Decision

**World Single-Image Prototype S1: PASS.**

The architecture is functional enough to proceed to measured comparison rather than additional speculative implementation.

## Next checkpoint

**Phase 2 - Single-Image vs Tile measurement**

Measure the current tile runtime against responsive Single-Image candidates at:

- 1440 desktop
- 820 tablet
- 390 mobile

Record at minimum:

- transferred bytes
- image request count
- decode behavior
- interaction-ready time
- decoded bitmap memory estimate
- DOM complexity
- pan smoothness
- resize behavior
- mobile behavior

Do not cut over production during S2.
