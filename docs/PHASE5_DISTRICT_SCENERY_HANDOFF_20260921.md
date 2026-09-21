# Phase 5 District Scenery Handoff — 2026-09-21

Status: Archive Street and Workshop Alley backgrounds APPROVED

## Repository state
- Repo: watarionn/portfolio-site
- Branch: phase5-district-pages
- Draft PR: #105 "Phase 5: complete district pages"
- Do not merge PR #105 yet. Phase 5 scenery work is still in progress.
- Phase 4 remains the production baseline.

## Approved district backgrounds
### Archive Street
- Approved source image from this conversation: 本と石畳の街並み.png
- Persistent Library path: /Portfolio City/Phase5_DistrictScenery/Accepted/archive-street-background-approved.png
- Library file id: libfile_0cd654ebdc9c8191862f49210528686c
- Backing file id: file_0000000022148206b54ba3b61253676a
- Composition: continuous street frontage on both sides, central cobblestone route, archive/book/reference motifs.
### Workshop Alley
- Approved source image from this conversation: 中世クラフト街の路地裏.png
- Persistent Library path: /Portfolio City/Phase5_DistrictScenery/Accepted/workshop-alley-background-approved.png
- Library file id: libfile_8dc93e91bfa88191ab3a6d18dd955fae
- Backing file id: file_0000000085808209b7345af3cd1638e7
- Composition: compact craft alley, small shared work area, branching lanes, workshops and tools.

These PNG files are approved art masters. They are not yet runtime WebP assets in the repository.

## Non-negotiable art direction
- Professor Layton series-inspired background-art feel is an absolute requirement.
- Prefer simplified shapes, hand-painted/storybook atmosphere, and readable silhouettes.
- Do not drift into hyper-detailed fantasy concept art, photorealism, or glossy cinematic rendering.
- Distant areas should be softer and simpler than foreground areas.
- Environmental detail must support the scene, not compete with interactive project buildings.
- Keep the same visual family across all four districts.

## Layering rule
- Background image contains district environment only.
- Clickable project buildings remain separate transparent assets.
- Never bake the four/three clickable project buildings into the approved district background.
- Background props may include non-project facades, trees, lamps, signs, benches, tools, water, paths, etc.
## Current scene architecture
District View target:
1. background-only district illustration
2. independent transparent project-building images
3. percentage-based accessible hotspots
4. project popup / dossier
5. minimal previous / world / next navigation

Reference files:
- docs/PHASE5_DISTRICT_SCENERY_PRODUCTION_SPEC.md
- portfolio-city/data/district-scenes.schema.v1.json
- portfolio-city/data/district-scenes.draft.json
- docs/PHASE5_DISTRICT_PAGES_DESIGN.md

The draft scene contract validates against all 14 projects.

## Asset inventory at handoff
- Final district backgrounds approved: 2 / 4
  - Archive Street: APPROVED
  - Workshop Alley: APPROVED
  - Waterside Play: TODO
  - Observatory Hill final 16:9 background: TODO
- Existing transparent project-building art in repo: 6 / 14
- Missing runtime building art: SHISHA, all Workshop Alley buildings, all Waterside Play buildings.

## Next chat resume point
Resume with Waterside Play background production.
Waterside Play direction:
- Professor Layton-inspired simplified storybook background
- visible water is mandatory
- promenade / curved walking route
- one small bridge
- low planting, benches, terrace/open space
- keep enough clean area for aquarium, holoca, and word-generator as separate building layers
- avoid over-detailing

After Waterside Play:
1. approve Waterside Play background
2. make final 16:9 Observatory Hill background
3. import approved background masters into runtime asset paths and export 2048x1152 WebP
4. produce missing transparent building art
5. implement scene assembly and hotspot popup behavior
6. run 1440 / 820 / exact 390 QA

## Important continuity
- Master World anchors and terrain topology must not move.
- Public old/new world switching remains retired.
- World -> district -> building popup -> project is the intended navigation hierarchy.
- On mobile, project popup becomes a bottom sheet.
- Keep PR #105 Draft until scene art and interactive district flow are complete.
