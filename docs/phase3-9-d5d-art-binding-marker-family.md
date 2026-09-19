# Phase 3.9 CP-D5D - Master Art Binding + District Marker Family

Updated: 2026-09-20
Status: PASS / implementation contract locked

## 1. Real Master Art binding

The locked world illustration remains the single authoring source.

Production path:

```
Master World 8192x6144
  -> tools/world-tiles/slice-master-world.py
  -> assets/world/v1/terrain/A01.webp ... P12.webp
  -> assets/world/v1/manifest.json
  -> runtime camera selects only visible tiles + one-tile preload margin
```

The browser never needs the 8192x6144 authoring source.

### Runtime tile stage

Use one absolute world surface with 16x12 tile positions. Each tile occupies exactly:
- width: 6.25% of world surface
- height: 8.333333% of world surface

No gaps, borders, per-tile filters, transforms, sharpening, or independent color treatment are permitted.

Tiles are decorative terrain and receive no district interaction semantics.

### Loading

At initial W0 entry:
1. resolve camera world rectangle,
2. expand by one logical tile as preload margin,
3. request intersecting terrain tiles,
4. retain recently visible tiles during short pan,
5. do not request all 192 merely because they exist.

A low-resolution whole-world placeholder may be added later only if visual QA demonstrates a loading flash.

## 2. Layer order

1. terrain tile stage
2. frontier / atmospheric veil
3. district landmark-marker stage
4. transient focus / hover treatment
5. interface chrome

The grid, cell IDs, debug zoning and authoring anchors never enter the public layer stack.

## 3. District marker family

The user-approved reference uses simple plus markers as spatial placeholders. Production replaces them with one coherent illustrated family.

All four markers share:
- small circular or softly irregular storybook medallion,
- dark ink-like outline,
- warm light interior,
- restrained shadow,
- 44-52 px visual footprint on desktop baseline,
- larger invisible hit target,
- no bright game-pin colors,
- no generic map-pin teardrop,
- no red plus.

Individual glyph semantics:
- Observatory: small dome + star/spark
- Archive: book/spine + tiny arch
- Workshop: crossed simple tool/gear-like workshop mark
- Waterside: wave + short pier/harbor stroke

These are navigation emblems, not substitutes for accepted building art.

## 4. Labels

Desktop:
- district name may sit adjacent/below marker at W0 entry,
- typography must remain secondary to terrain,
- labels may strengthen on hover/focus.

Mobile:
- preserve 44px+ touch target,
- labels may reposition to avoid collisions,
- never move the geographic anchor itself.

Cell addresses H05/G06/I06/H07 remain internal and are never visitor labels.

## 5. Interaction states

Idle:
- marker readable but quiet.

Hover/focus:
- slight lift/scale,
- clearer label,
- accessible focus ring outside artwork.

Selected:
- brief emphasis before camera transition.

District View:
- World marker layer no longer competes with building interaction.

Reduced motion:
- no camera flourish required; state transition remains immediate/readable.

## 6. Accessibility

- semantic `button` for each published district,
- district name is accessible label,
- decorative glyph hidden from accessibility tree,
- keyboard focus follows the same geographic targets,
- hit target may exceed visible marker,
- no interaction depends only on color.

## 7. Binary source policy

The final Master World is a binary authoring asset and must not be reconstructed from CSS or regenerated during runtime.

Before production binding:
- preserve the approved clean source at authoring quality,
- export tiles through the deterministic slicer,
- verify manifest and seams,
- bind the tile manifest in the isolated prototype first.

## 8. Acceptance

CP-D5D passes when:
- binary Master -> deterministic tile -> runtime contract is explicit,
- marker family is defined without changing district coordinates,
- labels/hit targets/accessibility are separated from terrain,
- production remains disabled until real binary art and seam QA are complete.

## Result

PASS.

Next checkpoint: **CP-D5E District Marker Prototype + Tile Stage Skeleton**.
Implement the marker family as CSS/SVG-like UI primitives in the isolated prototype and add a manifest-driven tile-stage interface that can accept real A01-P12 assets later. Do not fabricate the final Master binary and do not enable production.
