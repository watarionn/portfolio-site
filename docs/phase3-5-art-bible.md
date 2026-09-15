# Portfolio City Phase 3.5 — Illustrated City Art Bible

Designed: 2026-09-14
Status: Checkpoint 3 quality master / revalidated after Phase 3.5-P2.5 style harmonization
Pilot district: Observatory Hill

## Purpose

This document is the visual production standard for the illustrated Portfolio City runtime assets. It translates the approved concept boards into rules that can be reused when new terrain chunks and project buildings are produced months or years apart.

Approved visual references:

- `02_PortfolioCity_成長する街_UIUX設計ボード_採用.png`
- `01_PortfolioCity_建物個性化コンセプト_採用.png`

These references are the visual north star. Production assets must preserve the expandable world architecture defined in `docs/phase3-5-illustrated-city-architecture.md`.

## 1. Overall visual target

The city should feel like a bright, handcrafted storybook town rather than a flat vector dashboard.

Required qualities:

- high-detail illustrated scenery with readable silhouettes
- cheerful daylight and clear atmospheric depth
- lush vegetation and civic props that make the city feel inhabited
- distinct project buildings that are identifiable even without text labels
- cohesive materials, lighting and camera angle across independently produced assets
- enough open ground around project parcels that buildings can be replaced or new parcels added later

Avoid photorealism, hard-edged UI-vector rendering, flat iconography, and excessive micro-detail that disappears at runtime scale.

## 2. Camera and projection

Use a consistent elevated three-quarter view.

- Viewpoint: elevated 3/4 town-map perspective, not true orthographic and not eye-level perspective.
- Horizon: effectively outside the crop for terrain chunks; distant hills may imply depth without introducing a literal horizon line.
- Vertical visibility: roofs and upper surfaces must be visible.
- Building front faces remain readable and large enough for recognisable entrances/windows.
- Camera direction must remain consistent across all chunks and building assets.

Project building illustrations use the same camera direction as the terrain below them.

## 3. Lighting

Canonical lighting is clear daytime.

- Key light: upper-left / left-front.
- Shadows fall softly toward lower-right.
- Light is warm-neutral, not sunset orange.
- Ambient skylight keeps shaded façades colourful instead of black.
- Specular accents may appear on glass, metal and water but must not dominate.

Do not change time of day per district. District identity comes from architecture, vegetation and props, not incompatible lighting.

## 4. Colour language

The city is colourful but controlled.

Global palette behaviour:

- vegetation: fresh medium greens with darker blue-green shadow masses
- sky / water accents: cyan to cobalt
- stone: warm cream, pale grey, muted sandstone
- roofs: district-dependent saturated accents, usually red, blue, teal or ochre
- paths: warm beige / light ochre, separated clearly from vegetation
- shadows: cool and moderately saturated, never neutral black

Keep local saturation high enough to feel illustrated, while reserving the strongest colours for landmarks, roofs, signs and project-building motifs.

## 5. Edge and rendering treatment

- Forms should have clean painted edges with slight hand-authored irregularity.
- Avoid uniform thick black outlines.
- Important building silhouettes may receive a subtle darker contour or value edge.
- Foliage is rendered as grouped masses with selective leaf detail, not individual-leaf noise.
- Textures should suggest stone, plaster, wood and metal without becoming photographic.
- Small runtime details must survive reduction to approximately 250–300 world-unit building width.

## 6. Scale rules

World geometry remains authoritative.

- Terrain chunk logical size: `1024 × 768 world units`.
- Recommended production master: `2048 × 1536 px` for a 2× source.
- Project building anchor: bottom-center ground-contact point.
- Typical current building width: `250–270 world units`.
- Landmark structures may exceed this, but interactive hit areas must remain isolated.
- Background scenery should remain smaller or lower-contrast than project buildings unless it is a district landmark.

## 7. Terrain chunk composition

Terrain chunks must remain extendable.

Each chunk may contain:

- landform and elevation
- primary roads and paths
- water and bridge approaches
- vegetation masses
- walls, lamps, benches and minor architecture
- district atmosphere

Terrain chunks must not contain named project buildings.

Keep major road/water connections away from arbitrary irregular positions on the edge. Use repeatable connector zones so later adjacent chunks can join cleanly.

Do not place unique landmarks directly across a chunk seam.

## 8. Project building rules

Each project gets one transparent illustrated building asset.

Required:

- recognisable silhouette before any label is shown
- one dominant project-specific motif
- transparent background
- tightly cropped canvas with safe edge padding
- bottom-center anchor aligned to the ground-contact point
- shadow treatment compatible with the terrain light direction
- no baked project title text unless the architecture naturally contains a tiny decorative sign that remains non-essential

The project must still be identifiable by shape and motif if all labels are hidden.

## 9. Observatory Hill pilot identity

Checkpoint 2 uses Observatory Hill because it contains exactly three current projects and has a strong visual vocabulary.

District language:

- elevated green hill / pale stone terraces
- open sky and distant mountain atmosphere
- telescope, observatory, celestial and mathematical motifs
- cobalt / sky-blue architectural accents
- pale stone retaining walls
- conifers and clipped shrubs, with less dense street clutter than lower districts

Pilot buildings:

### HoloScope

- tall observatory / data-observation tower
- large telescope or sensor silhouette
- cobalt roof / instrument accents
- reads vertically and feels like the district's technical lookout

### Sphere / 天球儀

- rounded planetarium / celestial globe structure
- dominant dome or globe motif
- blue and gold accents
- visibly distinct from HoloScope's telescope silhouette

### Prime Dot Art / 素数点画

- small mathematical gallery / atelier
- dot, constellation or plotted-pattern motif integrated into roof/signage/window design
- more intimate horizontal building mass than the two observatories

## 10. Pilot terrain composition

The pilot terrain should test one complete illustrated chunk without pretending the surrounding world is finished.

Recommended pilot chunk: north-centre world chunk around Observatory Hill.

The chunk should provide:

- elevated pale-stone terrace
- curving path network with three clear project parcels
- trees and shrub clusters framing but not covering building pads
- one overlook / retaining-wall edge
- small observatory-themed props such as star markers, telescope plinths or brass inlays
- clear edge connector zones for future adjacent chunks

Leave the three project parcels visually quieter than the surrounding scenery so independent building assets sit naturally on top.

## 11. Runtime export rules

Working masters may remain PNG or layered source files outside Git.

Runtime baseline:

- terrain: WebP, opaque where possible
- buildings: WebP with alpha
- use dimensions from layout data so image loading never moves world geometry
- avoid unnecessary transparent margins
- retain the current SVG fallback until the illustrated pilot passes interaction and loading tests

Initial byte-budget targets are provisional and will be measured from the pilot:

- one 2048 × 1536 terrain WebP: aim below 700 KB without obvious texture collapse
- one transparent project building WebP: aim below 250 KB

Quality takes priority during the pilot; budgets may be adjusted after direct comparison.

## 12. Acceptance test for the pilot

Checkpoint 2 pilot is successful only when:

- one illustrated terrain chunk reads as the approved Portfolio City world
- HoloScope, Sphere and Prime Dot Art read as three different buildings without labels
- the three assets align naturally to existing world placements
- image seams / edge connectors remain compatible with future expansion
- WebP exports retain enough detail at runtime scale
- project click, keyboard, visited and inspector behaviour remain DOM-driven
- legacy fallback can still be restored without touching project content data

The pilot is a production-style proof, not a concept painting. It must prove that the art direction and modular runtime architecture can coexist.

## 13. Checkpoint 3 quality-master lock

Observatory Hill passed the initial 2026-09-15 visual quality gate, was reopened after production review exposed a style mismatch, and passed revalidation after Phase 3.5-P2.5 harmonization. Its current terrain and three project-building runtime derivatives define the quality bar for subsequent districts.

Canonical decision record: `docs/phase3-5-observatory-quality-master.md`.

Later districts inherit the camera, lighting, edge treatment, material warmth, atmospheric depth, runtime silhouette clarity and detail restraint. New building art must also be judged directly beside already-approved district art at runtime size; standalone quality is not sufficient. They must not copy Observatory Hill's celestial architecture or blue/gold motifs merely for consistency.

Remaining-district production begins only after a separate explicit next-stage instruction.
