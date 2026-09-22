# Phase 3.9 CP-D4H - World Reveal / Frontier Contract

Updated: 2026-09-20
Status: PASS / reveal architecture baseline

Machine-readable contract:
- `prototype/phase3-9-world-data/world-reveal.v1.json`

## Principle

Portfolio City does not use game-like rectangular fog-of-war.

Unpublished world space is atmospheric scenery. Clouds, haze, distant terrain, sea mist, ridges, and softened detail communicate that the world continues beyond the currently published districts.

A clouded area is not a disabled button.

## Reveal layers

Bottom to top:
1. Visitor World base geography.
2. Frontier atmosphere / veil.
3. Published district art and accepted building assets.
4. Runtime interaction overlay.

Debug grid and zoning are authoring-only and are not part of this public stack.

## State behavior

PUBLISHED:
- district may be visually clear,
- district may have interaction targets,
- home cell is stable.

NEAR_FRONTIER:
- partial terrain may be visible,
- no district target,
- atmospheric veil may be lighter.

UNPUBLISHED:
- coarse terrain may appear as distant scenery,
- no district target,
- details remain non-committal.

UNRESOLVED:
- strongest freedom,
- may be mostly obscured or compositionally simplified,
- no implied future district.

## Publication reveal transaction

When a new district is published:

1. choose and lock its home cell,
2. validate compatibility with neighboring published geography,
3. author/refine only the local Visitor World neighborhood,
4. open a primary clear region around the new focal area,
5. feather surrounding context into existing visible geography,
6. retain veil toward still-unpublished distance,
7. add district interaction geometry,
8. expand camera bounds only as much as needed,
9. QA old district anchors to ensure none moved.

Publishing one cell does not publish its neighbors.

## Reveal geometry

Reference radii in cell units:
- primary clear radius: ~0.72
- contextual reveal radius: ~1.55
- feather band: ~0.55

These are design guides, not circular masks that must be rendered literally. Final masks should be organic and may cross cell boundaries.

## W0 fronts

F-A Inland:
- reveal through roads/woodland/highland continuation,
- avoid a hard cloud wall immediately west/northwest.

F-B Coastal:
- reveal through shoreline/inlet/sea-mist continuation,
- water can remain visible farther than built detail.

F-C Offshore:
- reveal through channel/island silhouettes,
- distant islands may be scenery before they become districts.

## Anti-patterns

Do not:
- render checkerboard fog,
- show locked padlocks/question-mark district buttons,
- outline unpublished cells,
- imply all visible terrain is already a district,
- clear the entire Master World when one district is added,
- regenerate or relocate existing accepted districts just to fit a new reveal.

## Asset strategy

Prefer separable assets:
- clean world base,
- frontier/atmosphere overlays,
- local district overlays where needed,
- accepted building assets.

This allows local world expansion without repainting every previously published pixel.

## Result

CP-D4H: PASS.

Next checkpoint: CP-D4I World Asset Tiling / Expansion Strategy.
Define how the huge Visitor World is split into maintainable art regions/tiles so future local reveals do not require replacing one monolithic world image.
