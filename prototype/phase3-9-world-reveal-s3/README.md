# World Reveal Prototype S3

Status: isolated prototype / no production cutover

S3 proves that Portfolio City publication state can be presented as atmosphere without turning the logical 16 x 12 grid into visible fog-of-war UI.

## Inputs

- S1 camera and district contract:
  - `../phase3-9-world-single-image-s1/world-single-scene.s1.json`
- canonical publication/reveal semantics:
  - `../phase3-9-world-data/world-reveal.v1.json`
- S3 authored atmosphere geometry:
  - `reveal-geometry.s3.json`

## Rendering model

```text
single continuous World image
+ one organic unpublished veil
+ broad frontier haze
+ broad unresolved cloud banks
+ four published semantic hotspots
```

The atmosphere SVG is `aria-hidden` and `pointer-events: none`.

No logical cell is rendered as a rectangle, disabled control, or fog tile.

## Reveal preview

The **Preview J05 reveal** control is deliberately hypothetical.

J05 is already present in canonical W0 frontier data. The preview only reshapes the organic clear mask toward that area.

It does not:

- change canonical publication data
- add a district
- add a hotspot
- move the camera
- change the base image
- publish neighboring cells

This models the future transaction where a new district locally clears atmosphere instead of inserting a visible tile.

## Validation

From repository root:

`node tools/check_portfolio_city_world_reveal_s3.mjs`

Browser QA targets:

- 1440 desktop
- 820 tablet
- 390 mobile
- pointer/touch pan
- keyboard district selection
- Current W0 / J05 preview switch
- image/hotspot/camera invariance across reveal switch
- no horizontal document overflow
- atmosphere does not intercept pointer interaction

The artwork in this prototype is technical atmosphere proof, not final production cloud art.
