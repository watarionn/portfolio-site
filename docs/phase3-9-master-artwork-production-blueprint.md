# Phase 3.9 CP-D4L - Master Artwork Production Blueprint

Updated: 2026-09-20
Status: PASS / READY FOR MASTER ART PRODUCTION

## Production target

Create one clean **8192 x 6144 px** Visitor World terrain master.

The master is a continuous illustrated world, authored without visible grid logic, then deterministically sliced into 16 x 12 / 192 runtime tiles at 512 x 512 each.

## Visual north star

A warm hand-illustrated puzzle-adventure atlas:
- readable large landforms,
- restrained detail at world scale,
- irregular coastlines and terrain transitions,
- soft atmospheric depth,
- storybook European/fantasy-town sensibility,
- no photorealism,
- no hyper-detailed satellite-map texture,
- no game-board/checkerboard appearance.

The artwork should feel authored as one world, not assembled cell-by-cell.

## Composition hierarchy

### Level 1 - Master silhouette
Read correctly at thumbnail size:
- dominant connected mainland,
- asymmetric coast,
- southern inlet / waterside articulation,
- eastern offshore/channel opportunity,
- northern/north-central highland support,
- large undeveloped world continuing beyond W0.

### Level 2 - Macro terrain families
Guide distant variety without overcommitting future districts:
- cold/highland north,
- greener western/northwestern mainland,
- temperate central mainland,
- dry/rockier far-east and south-east hints,
- island/channel systems,
- southern and eastern mountain/highland accents,
- substantial sea and coast transitions.

### Level 3 - W0 published cluster
Current four district homes remain a small local cluster:
- H05 Observatory Hill: elevated/highland relation.
- G06 Archive Street: older inland/mainland relation.
- I06 Workshop Alley: eastern mainland relation.
- H07 Waterside Play: inlet/coastal relation.

Do not paint final project buildings into terrain master.

### Level 4 - Frontier
F-A Inland, F-B Coastal, F-C Offshore must remain visually plausible growth directions.

## W0 geography requirements

Around F04-J08:
- mainland remains connected,
- Observatory rises naturally above/behind the cluster,
- Archive and Workshop remain land-connected,
- Waterside touches a real inlet/coastal system,
- Central Commons reads only as connective seam-space,
- roads/tracks/paths may suggest connectivity but must not become rigid grid lines,
- eastern water leaves room for island/offshore expansion.

## Central Commons

Central Commons is not a fifth district and must not become the visual center of the entire world.

Terrain master may provide:
- irregular open ground,
- path convergence,
- subtle green/seam space.

Do not bake:
- giant fountain,
- monumental plaza,
- label,
- oversized landmark.

## Roads and paths

World-scale paths should:
- curve with terrain,
- cross logical cell boundaries freely,
- support district connectivity,
- fade or soften into frontier,
- avoid perfect four-way symmetry.

Major routes may be slightly clearer near W0; remote routes should remain suggestive.

## Water

Water is structural:
- coastline should feel hand-drawn and asymmetric,
- southern inlet supports Waterside,
- east supports offshore/channel expansion,
- distant islands can exist as scenery without implying published districts,
- avoid turning every district into its own island.

## Highlands

Use elevation to support composition:
- strongest relevant highland near/north of Observatory,
- distant ridges may frame world edges,
- avoid one giant central mountain dominating W0,
- ridge systems can cross cell boundaries.

## Detail density

W0:
- highest terrain readability,
- enough local structure to host accepted building assets later.

Near frontier:
- medium detail,
- readable land/water/ridge continuation,
- fewer committed landmarks.

Far world:
- broad terrain masses,
- lower detail,
- atmospheric softness,
- preserve repaint freedom.

## Layer separation

Terrain Master MUST NOT contain:
- 16 x 12 grid,
- A01-P12 labels,
- zoning/debug colors,
- district UI labels,
- hitboxes,
- publication locks/question marks,
- final frontier/cloud reveal state,
- accepted project/building assets.

Separate later layers:
1. terrain master / sliced terrain,
2. frontier atmosphere,
3. accepted district/building assets,
4. runtime interaction/UI.

## Edge behavior

The 8192 x 6144 canvas is the Master World planning surface, but visitor framing should suggest continuation.

Use:
- landforms/sea exiting frame,
- atmospheric fade,
- cloud/haze possibilities,
- cropped ridges/coasts.

Avoid a decorative border that makes the world feel like a completed tabletop map.

## Palette / rendering direction

- warm parchment/storybook environmental harmony without literal paper-map UI,
- muted natural terrain colors,
- atmospheric blue/grey distance,
- controlled contrast around W0,
- no neon biome coding,
- no visible per-cell palette shifts.

## Production sequence

Pass 1: Master silhouette
- land / sea only.
- verify W0 and expansion-front topology.

Pass 2: Macro elevation + biome masses
- highlands, forests, dry/cold hints.
- no small landmarks.

Pass 3: W0 local geography
- inlet, slopes, local paths, Commons seam.

Pass 4: Frontier transitions
- soften detail outward and preserve three growth fronts.

Pass 5: Illustration polish
- coherent linework, texture, atmospheric depth.

Pass 6: Clean-source audit
- verify forbidden baked elements are absent.

Pass 7: 16x12 deterministic export
- run CP-D4J slicer and manifest.

## Art acceptance gates

A. Thumbnail silhouette gate
- world reads as one coherent large geography.

B. W0 topology gate
- four current district relationships are preserved.

C. Huge-world gate
- W0 clearly occupies only a small fraction of the world.

D. Future-flexibility gate
- far world does not look fully populated or permanently committed.

E. Seam/export gate
- source dimensions remain exactly 8192 x 6144 and slice cleanly to 512 x 512.

## Result

CP-D4L: PASS / READY FOR MASTER ART PRODUCTION.

Next checkpoint: **CP-D5A Master Silhouette Blockout**.
Produce the first clean 8192x6144-compatible world terrain concept focused only on land/sea silhouette and W0 topology. Do not add project buildings, labels, grid, or final cloud layer.
