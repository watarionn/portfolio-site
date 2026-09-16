# Phase 3.6-R6 Image Generation Lessons

Updated: 2026-09-16

This document records the image-generation failures, corrections and reusable rules from the R6 terrain scale recalibration work. The goal is to prevent future chats from repeating the same failed generations.

## Core rule

Treat **geometry authority** and **art generation** as separate layers. The AI image must never be allowed to redefine locked world geometry. Road centerlines, road widths, project clearings, protected zones and seam contracts come from project data / masks. Generated art supplies the visual language only.

## Failure 1: infographic / poster drift

When the prompt contained ideas such as Before/After, comparison, explanation, changes, scale notes or process steps, the model generated a presentation poster instead of terrain.

Typical symptoms:

- headings and captions
- arrows
- explanatory boxes
- embedded building examples
- comparison panels

Reusable correction: terrain prompts must describe only the scene to be painted. Never mention comparison, documentation, QA, workflow or labels in the image prompt. Explicitly require no text, letters, numbers, signs, legends, captions or UI.

## Failure 2: buildings embedded into terrain

Mentioning HoloScope or other buildings too literally encouraged the model to paint the buildings into the background. That is invalid because Portfolio City renders buildings as independent runtime assets.

Reusable correction: describe building locations as `empty clearing`, `open meadow`, `reserved pad` or `quiet forecourt`. Do not ask the generator to paint HoloScope, Sphere, Prime Dot Art or any other project building into terrain.

## Failure 3: over-detail / AI-like texture

Adding many small trees, rocks, fence posts, flowers, tiny paths and cliff strokes created attractive but obviously synthetic over-detail.

Reusable correction: use **less detail than instinctively expected**. Prefer:

- large vegetation masses instead of many individual trees
- broad quiet grass planes
- a few large rock / cliff shapes rather than repeated stones
- restrained ink lines
- weak, broad watercolor variation

Do not fill every empty area. Empty space is part of the intended visual hierarchy.

## Failure 4: formal-garden symmetry

A centered HoloScope anchor repeatedly caused circular plazas, roundabouts, formal gardens and mirror symmetry.
Reusable correction: explicitly require:

- no roundabout
- no formal garden
- no perfect symmetry
- slightly unequal vegetation masses left and right
- irregular but controlled clearing edges
- believable open growth directions

## Failure 5: geometry drift

Free generation changed road paths, branch points, coastline positions and project clearings even when the broad composition looked attractive. This happened repeatedly in earlier North and South experiments.

Reusable correction: never treat a generated image as geometry authority. Lock roads / masks / protected areas first. If the generator cannot follow exact geometry, generate a road-neutral art base and composite the authoritative road layer separately.

## Failure 6: beautifying the wrong scale

The previous terrain could be made prettier while still remaining visually too zoomed out. The real problem was the physical drawing scale of roads, vegetation and landform units relative to project buildings.

Reusable correction: calibrate against HoloScope `270 world` first. Target main roads around `160 world` and branch roads around `120 world` where defined by the R6 contract. Project clearings must be large enough to visually support the authored building footprint.

## Visual reference statuses

### REJECTED_REFERENCE
`a_detailed_illustrated_fantasy_map_style_infograp.png`

Reject as terrain because it became a comparison infographic with text, buildings and too much detail. It may be consulted only for the idea that roads / forecourts should be larger relative to buildings.

### DIRECTION_REFERENCE
`水彩風の自然公園地図.png`
`手描き水彩の静かな庭園地図.png`

Useful for larger road width, larger vegetation masses and closer background scale. These are visual references only, not geometry authority.

### HISTORICAL_NORTH_CANDIDATE
`水彩風ファンタジー草原の分岐路.png`

This was the strongest North candidate before final harmonization. It proved that larger road/clearing scale solved the zoomed-out feeling, but it is no longer the final runtime authority.

## Preferred art language

Original whimsical European puzzle-adventure storybook terrain, Professor Layton-inspired without copying characters, logos or proprietary designs. Warm ivory paper, muted sage / olive, dusty teal, ochre / warm stone, restrained mauve accents when needed. Hand-painted watercolor with thin soft ink. Low micro-detail and broad readable masses. No text, buildings, characters, labels, UI or decorative map legends.

## Next-generation checklist

Before accepting any new terrain candidate, verify: locked road geometry, clearing positions, scale against HoloScope, low detail density, no symmetry drift, no embedded architecture, no text, and compatibility with 13-chunk slicing.

## Final R6 closure lessons

The final accepted terrain was not a single free-generation output. North, Middle and South were harmonized into geometry-controlled working masters and only then sliced into the locked 13-chunk topology.

Final master authorities:

- `north_r6_HARMONIZED_WORKING_MASTER.png`
- `middle_r6_HARMONIZED_WORKING_MASTER.png`
- `south_r6_HARMONIZED_WORKING_MASTER.png`

The final WebP q90 package passed all 14 seam contracts and 390 / 820 / 1440 browser QA.

This establishes the reusable sequence for later city art:

1. lock geometry before image generation;
2. generate broad art language rather than exact topology;
3. harmonize the generated result against authoritative geometry;
4. approve masters before slicing;
5. verify seams after WebP export;
6. verify building/background scale again in the real browser.

Browser QA must measure authored layout geometry, not transient hover/selected transforms. Interaction effects may enlarge or translate a selected building without changing its world-coordinate placement.
