# Phase 3.9 - District Single-Scene Formalization S4

Updated: 2026-09-30

Status: **PASS / Waterside Aquarium Single-Scene architecture accepted / no production cutover**

## Goal

Apply the same architectural rule proven by the World work to District Views:

```text
finished district illustration
+ semantic project hotspots
+ canonical project metadata / navigation
```

S4 uses Waterside Play because it already had accepted production-quality visual material and one Production Locked project building.

No new artwork was generated.

## Recovered accepted source lock

The accepted Waterside Aquarium workflow survives in GitHub history at:

`fa398ce5db39cdcce242b0fa7bb9881c99d5f02a`

Locked source files:

- `portfolio-city/assets/districts/waterside-play/background-approved.png`
- `portfolio-city/assets/districts/waterside-play/aquarium-s1-final.png`

Source hashes:

```text
background
838797151c9c557af97ffb84e30940f1afee3e1603208a3ec9620d1bb2f95789

Aquarium
228fbc8366d6e5cbdd9ef02a2a948bd5cb24cc9b5bf658f951a68d0eadef9ea1
```

The recovered Production Lock fixes:

- scene coordinate system: 1672 x 941
- anchor: bottom-center
- x: 19.9606%
- y: 57.1039%
- width: 25%
- rotation: 0 degrees

S4 does not modify those facts.

## Deterministic flattening

Reusable builder:

`tools/build_waterside_s4_single_scene.py`

The builder:

1. reads both locked files directly from the immutable Git commit;
2. validates both SHA-256 values;
3. validates source dimensions;
4. applies the locked Aquarium placement;
5. alpha-composites Aquarium into the accepted background;
6. exports one lossless WebP;
7. derives the semantic hotspot from the resized Aquarium alpha bounds;
8. writes a machine-readable scene manifest.

No image generation, inpainting, scene regeneration or manual placement estimation is used.

## Output

Runtime proof asset:

`prototype/phase3-9-district-single-scene-s4/assets/waterside-s4-aquarium-scene.webp`

Properties:

- dimensions: 1672 x 941
- format: lossless WebP
- bytes: 1,925,540
- SHA-256:
  `79c1593cfa31decf5074a830829a7e8b5ddea5853a03327ed5db9fea3920053c`

The browser sees exactly **one image**.

There is no separate Aquarium image in the S4 runtime.

## Placement evidence

The locked fractional placement rasterizes to:

```text
left   125
top    258
width  418
height 279
```

The resized Aquarium visible-alpha bounds are:

```text
[180, 259, 501, 537]
```

The semantic hotspot adds 12 px padding:

```text
[168, 247, 513, 549]
```

The hotspot therefore covers the visible Aquarium while remaining closely bound to the building.

## Semantic project layer

S4 loads project content from the current canonical:

`portfolio-city/data/projects.json`

The hotspot binds:

- project id: `aquarium`
- title: 水族館
- building: 市立水族館
- district: `waterside-play`
- type: `PHP / MySQL / Search`
- canonical route: `/AQUARIUM/aquarium.php`

The pixels contain the Aquarium appearance.

The SVG contains only the Aquarium meaning and interaction.

## Why S4 formalizes Aquarium only

Current canonical Waterside projects are:

- Aquarium
- HoloCa
- Word Generator

Only Aquarium has a recovered Production Lock in the accepted workflow used for this formalization.

S4 deliberately does **not** invent or promote HoloCa / Word Generator building artwork merely to fill the scene.

Those projects remain canonical metadata and future art work.

This keeps Phase 4 from silently approving unverified visual assets.

## Static validation

Executed against the exact S4 branch:

```text
python -m py_compile tools/build_waterside_s4_single_scene.py
node --check prototype/phase3-9-district-single-scene-s4/prototype.js
node --check tools/check_portfolio_city_district_single_scene_s4.mjs
node tools/check_portfolio_city_district_single_scene_s4.mjs
git diff --check origin/phase5-district-pages..HEAD
```

Result:

```text
Portfolio City Waterside S4 contract passed:
one lossless scene image / locked Aquarium pixels /
one semantic hotspot / canonical project metadata + route
```

## Browser QA

Microsoft Edge was driven through the DevTools Protocol.

### Responsive scene / hotspot alignment

| Viewport | Browser images | Hotspots | Hotspot width | Projection error | Aquarium initially visible | Internal scene scroll | Document overflow |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| 1440 | 1 | 1 | 230.7 px | 0.004 px | yes | no | none |
| 820 | 1 | 1 | 158.6 px | 0.011 px | yes | no | none |
| 390 | 1 | 1 | 140.3 px | 0.000 px | yes | yes | none |

On mobile the district scene remains 680 px wide instead of shrinking the artwork until the project becomes tiny.

The page itself never receives horizontal overflow. Only the district viewport may scroll horizontally.

Aquarium is inside the initial mobile crop.

## Project preview QA

Keyboard path:

```text
focus Aquarium hotspot
-> Enter
-> project preview opens
-> title receives focus
-> canonical metadata is displayed
-> canonical route is /AQUARIUM/aquarium.php
-> Escape
-> preview closes
-> focus returns to Aquarium hotspot
```

PASS.

The same preview remains functional after mobile internal scene scrolling.

## Reduced motion

Under:

`prefers-reduced-motion: reduce`

the hotspot transition duration becomes:

`0s`

PASS.

## Visual review

The flattened result reads as a single illustrated Waterside scene.

Observed:

- Aquarium perspective remains coherent with the accepted background;
- lighting and color remain those of the accepted sources;
- no browser cutout edge exists because Aquarium is part of the scene pixels;
- semantic highlighting aligns to the Aquarium building;
- the interaction layer does not require an independent building image.

This is exactly the District-side version of the Single-Image architectural principle.

## S4 decision

**District Single-Scene formalization: PASS.**

The accepted architecture is:

> finished district pixels carry appearance; semantic SVG hotspots carry project identity and interaction.

Aquarium proves the structure with production-quality accepted visual material.

## Production boundary

S4 does not:

- replace the production District runtime;
- approve HoloCa or Word Generator building art;
- add fake filler buildings;
- change canonical project routes;
- modify the accepted Aquarium geometry;
- delete the old layered District runtime;
- deploy this isolated prototype.

## Next checkpoint

**Phase 5 - Production automation**

Generalize the asset work now repeated across World and District proofs:

- source validation
- responsive derivatives
- scene manifest generation
- hotspot validation
- QA summaries
- deployment-package preparation

Machine-readable evidence:

`docs/phase3-9-district-single-scene-s4-results.json`
