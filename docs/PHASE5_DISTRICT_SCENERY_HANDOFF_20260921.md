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


## Update — composability review

The scenery approval state and runtime compositing state are now tracked separately.

- Archive Street: approved art master preserved; runtime compositing HOLD after terrain/parcel review.
- Workshop Alley: approved art master preserved; next parcel/compositing audit candidate.
- Waterside Play: approved art master preserved; selected as the first neutral-mass composability prototype.
- Observatory Hill: old approved master preserved as historical/reference art; final runtime background requires redesign around genuine terraced buildable parcels.

New authoritative composability rules:
- docs/PHASE5_COMPOSABLE_DISTRICT_BACKGROUND_SPEC.md
- a background must pass both scenery quality and compositing quality
- future expansion capacity is part of approval
- rejected images remain reference-prohibited

Next resume point:
1. neutral-mass test on Waterside Play
2. lock real parcel/perspective coordinates if PASS
3. otherwise revise only the background geometry before project-building production


## Waterside Play neutral-mass audit v1/v2

The approved Waterside Play art master was tested with neutral project-building masses before any new building art was produced.

Result:
- holoca: strong foreground-right land parcel
- aquarium: usable foreground-left land parcel with minor planter/path cleanup
- word-generator: plausible smaller rear-left parcel, but existing benches/lamps should be cleared or shifted
- future expansion: no clean fourth parcel in the current composition without occupying the main foreground approach or weakening the visible water corridor

Verdict: **SCENERY PASS / COMPOSITING REVISE**.

The approved master remains preserved and may be used only as the approved source/reference for the revision. It is not yet the final runtime background.

Revision target:
- preserve the waterside identity, bridge, open water and Professor Layton-inspired storybook style
- keep the central foreground-to-water route visually open
- preserve the strong right circular plaza
- formalize one left foreground parcel and one smaller rear-left parcel
- create at least one additional genuine buildable parcel away from the primary circulation line
- keep water visible inside the mobile critical band

## Update — six-slot district architecture, 2026-09-22

Latest adopted rule supersedes the earlier "current projects plus at least one future parcel" target.

Each district now has:
- maximum six project-building slots
- all six slots designed before final background painting
- no exposed placeholder lots
- unused slots covered by removable filler assets
- three visual layers: background base / filler assets / project building assets
- filler -> project replacement without repainting the background base

Waterside Play is the first district using this rule.

Authoritative Waterside plan:
- docs/PHASE5_WATERSIDE_PLAY_6_SLOT_PLAN.md

Approved visual reference allowed for the revision:
- /Portfolio City/Phase5_DistrictScenery/Accepted/waterside-play-background-approved.png
- rejected Waterside images remain reference-prohibited

Waterside slot assignment:
- WP-01 foreground-left -> aquarium
- WP-02 foreground-right -> holoca
- WP-03 middle-left -> word-generator
- WP-04 middle-right -> filler / future project
- WP-05 rear-left -> filler / future project
- WP-06 rear-right -> filler / future project

The central foreground approach, bridge and mobile-visible water window are protected no-build space.

Next resume point:
1. revise the Waterside Play background geometry around the six locked slot envelopes
2. place neutral masses in all six slots
3. run 1440 / 820 / exact 390 composability review
4. only after PASS, lock runtime slot data and produce transparent building/filler art

PR #105 must remain Draft and unmerged.

## Update — six-slot capacity architecture (2026-09-22)

Latest adopted direction:
- maximum six project buildings per district
- design six buildable slots from the beginning
- do not expose obvious empty lots
- unused slots are occupied by independent filler assets
- adding a project replaces one filler with one project-building asset
- district art layers are background base / filler assets / project-building assets
- design the six-slot town geometry before painting the final background

Waterside Play is the first prototype.

Authoritative plan:
- docs/PHASE5_WATERSIDE_PLAY_SIX_SLOT_PLAN.md

Current Waterside assignment:
- WP-S1: aquarium
- WP-S2: holoca
- WP-S5: word-generator
- WP-S3 / WP-S4 / WP-S6: filler until future projects arrive

Next resume point:
1. produce the Waterside Play six-slot blockout / neutral-mass test
2. verify 1440 / 820 / exact 390 composition
3. only then paint the revised final background base

PR #105 must remain Draft and must not be merged yet.
Rejected images remain prohibited references.


## Update — Waterside Play six-slot background adopted (2026-09-22)

Waterside Play six-slot background:
- visual approval: APPROVED
- background geometry neutral-mass audit v2: PASS
- central water / bridge remain permanent non-slot identity space
- left bank slots: WP-S1 foreground, WP-S3 middle, WP-S5 rear
- right bank slots: WP-S2 foreground, WP-S4 middle, WP-S6 rear

Final anchors:
- WP-S1 aquarium: x 24, y 83, width 20
- WP-S2 holoca: x 77, y 83, width 18
- WP-S3 filler/future: x 19, y 65, width 15
- WP-S4 filler/future: x 81, y 64, width 15
- WP-S5 word-generator: x 28, y 52, width 13
- WP-S6 filler/future: x 78, y 52, width 13

Adopted master:
- /Portfolio City/Phase5_DistrictScenery/Accepted/waterside-play-background-six-slot-approved.png
- Library file id: libfile_7664216e2cb08191baba45bbd70bedc4
- Backing file id at adoption: file_00000000a56c820cbf8aea096b6a6b79

The earlier Waterside Play approved master is historical only for runtime design.

Next production gate:
1. design / produce filler assets for WP-S3, WP-S4, WP-S6
2. produce the three Waterside Play project-building assets
3. run combined six-slot compositing + hotspot QA
4. only after that move to runtime WebP import

PR #105 remains Draft and must not be merged.
Rejected images remain prohibited references.

## Update — Waterside Play six-slot background APPROVED (2026-09-22)

- The six-slot Waterside Play background has been explicitly approved by the user.
- Canonical Google Drive file: `Portfolio City_採用設計画像_20260913/02_IllustratedCity/04_Phase5_DistrictScenery/03_WatersidePlay/background-approved.png`
- Drive file id: `1j3_NnnrXExcqu3wMU2AHMAk6EqPqMUVM`
- The previous approved background is preserved as `background-approved-20260921-legacy.png` and is historical only.
- Slot assignment remains:
  - S1 Aquarium
  - S2 Holoca
  - S3 filler candidate
  - S4 filler candidate
  - S5 Word Generator
  - S6 filler candidate
- Tuned placement baseline:
  - S1 x24 y83
  - S2 x77 y83
  - S3 x19 y65
  - S4 x81 y64
  - S5 x26 y51
  - S6 x78 y52
- Aquarium / Holoca / Word Generator v1: placement/silhouette acceptable, art style rejected for excessive vector-like appearance.
- Aquarium / Holoca / Word Generator v2: produced as hand-drawn/paper-texture candidates, not yet approved.
- The generated concept-board / district-overview images created during single-building attempts are rejected and must not be used as references.

Next resume point:
1. composite Aquarium / Holoca / Word Generator v2 onto the canonical approved background
2. compare with the candidate fillers at S3 / S4 / S6
3. run desktop/tablet/exact-390 visual review
4. only explicitly approved assets may move into accepted/runtime state

PR #105 remains Draft and must not be merged yet.
