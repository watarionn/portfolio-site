# Phase 5 District Scenery Production Spec

Status: P5-B background production IN PROGRESS / Archive Street + Workshop Alley approved

## 1. Final district-page model

The finished District View is not a permanent project-card list.

Its primary interaction surface is a layered illustrated scene:

1. district background base
2. removable filler assets for unused buildable slots
3. independently positioned transparent project-building illustrations
4. accessible building hotspot buttons
5. project popup / dossier
6. minimal previous / world / next navigation

Each district is designed around six buildable slots before the final background is painted. A slot contains either its filler asset or its project-building asset, never both. Empty slots must not appear as exposed placeholder lots.

The background establishes fixed place geometry. The filler layer keeps unused capacity looking like a finished town. The project-building layer establishes projects. The UI layer must never be baked into the artwork.

## 2. Runtime asset layout

Target repository layout:

```
portfolio-city/assets/districts/
  observatory-hill/
    background.webp
    fillers/
    buildings/
      holoscope.webp
      sphere.webp
      prime-dot-art.webp
  archive-street/
    background.webp
    fillers/
    buildings/
      yorei.webp
      actress-finder.webp
      cheatsheet.webp
      shisha.webp
  workshop-alley/
    background.webp
    fillers/
    buildings/
      dqb2.webp
      madori.webp
      maze-maker.webp
      anagram.webp
  waterside-play/
    background.webp
    fillers/
    buildings/
      aquarium.webp
      holoca.webp
      word-generator.webp
```

Do not encode labels, project names, popup frames, hover marks, or clickable outlines into the background images.

## 3. Image specifications

### Background master
- composition ratio: 16:9
- source master: 3072 x 1728 recommended
- web runtime export: 2048 x 1152
- output: WebP, sRGB, no alpha required
- target quality: visually lossless at approximately q88-q92
- all important geometry must remain readable inside the central mobile-safe band

### Filler layer
- transparent background required
- one removable filler group per unused slot
- may use planting, fountain, kiosk, tiny house, small shop, tree group or similar ordinary city element
- silhouette must remain quieter/lower than the project building envelope for the same slot
- filler must not include fixed terrain that would disappear when the slot becomes a project

### Building layer
- transparent background required
- source: PNG or lossless working file
- runtime: alpha WebP
- recommended source canvas: 768 x 768 or larger where practical
- do not include a large painted ground patch around the building
- soft contact shadow may be separate CSS or a restrained part of the building asset
- preserve enough transparent padding that rooflines are not clipped

Existing repository status:
- Observatory Hill already has transparent building art for holoscope, sphere, and prime-dot-art.
- Archive Street has transparent building art for yorei, actress-finder, and cheatsheet.
- SHISHA, all four Workshop Alley buildings, and all three Waterside Play buildings do not currently have runtime art in the repository.

The existing `observatory_terrain.webp` is 768 x 506 and is treated as a legacy/reference asset, not the final 16:9 district background master.

## 4. Safe composition zones

All coordinates below are normalized percentages of the 16:9 scene canvas.

Desktop safe area:
- x: 5 to 95
- y: 6 to 94

Mobile critical-content band:
- x: 18 to 82
- y: 8 to 92

Important building centers should stay inside the mobile critical-content band whenever possible. Decorative environment may extend to the edges.

Buildings must not overlap enough that their expanded touch targets collide.

Latest composability rule:
- every district has exactly six designed slot envelopes and a maximum of six project buildings
- current-project-only placements in the sections below are historical starting points until that district receives its six-slot audit
- all six neutral masses must pass before a revised background is runtime-approved

Authoritative general rule:
- docs/PHASE5_COMPOSABLE_DISTRICT_BACKGROUND_SPEC.md

## 5. Observatory Hill

Scene idea: a quiet hilltop observation district with branching paths and an open skyline.

Background only:
- ascending hill terrain
- stone or compacted-earth paths
- lookout rail / small terrace
- low vegetation
- distant sky and horizon
- subtle observational props that are not project buildings

Do not paint the three project buildings into the background.

Initial building placement:
- prime-dot-art: center x 27, baseline y 65, visual width about 17%
- sphere: center x 50, baseline y 47, visual width about 18%
- holoscope: center x 72, baseline y 64, visual width about 18%

Depth:
- sphere is the landmark in the upper-middle distance
- prime-dot-art and holoscope flank the approach in the middle ground

Popup preference:
- prime-dot-art: right / upper-right
- sphere: below
- holoscope: left / upper-left

## 6. Archive Street

Scene idea: a perspective street of records, reference, signage, and collected information.

Background only:
- stone or paved central street receding toward the upper middle
- archive-like facades that are clearly environmental and not the four project buildings
- bulletin boards
- information signs
- paper/poster motifs
- narrow street furniture
- restrained window displays
- distant continuation of the street

Keep the central route visually open.

Initial building placement:
- yorei: center x 24, baseline y 75, visual width about 17%
- actress-finder: center x 74, baseline y 74, visual width about 17%
- cheatsheet: center x 35, baseline y 50, visual width about 15%
- shisha: center x 65, baseline y 50, visual width about 15%

Depth:
- yorei and actress-finder are front-left/front-right
- cheatsheet and shisha are rear-left/rear-right
- central perspective remains readable between the four buildings

Popup preference:
- left-side buildings open inward/right
- right-side buildings open inward/left

## 7. Workshop Alley

Scene idea: a compact craft alley around a shared work yard.

Background only:
- irregular workshop lane
- small central work yard
- workbenches
- crates
- stacked materials
- tools and drafting paraphernalia
- awnings / small roof extensions
- side alleys receding behind the work yard

The scene should feel busy without obscuring project-building silhouettes.

Initial building placement:
- dqb2: center x 25, baseline y 76, visual width about 18%
- madori: center x 74, baseline y 75, visual width about 18%
- maze-maker: center x 35, baseline y 49, visual width about 16%
- anagram: center x 64, baseline y 48, visual width about 16%

Depth:
- dqb2 and madori are foreground anchors
- maze-maker and anagram sit around the rear edge of the work yard
- the center stays partially open for a visible shared-making space

Popup preference:
- front-left: upper-right
- front-right: upper-left
- rear-left: lower-right
- rear-right: lower-left

## 8. Waterside Play

Scene idea: an open recreational waterside district connected by paths and a small bridge.

Background only:
- visible water channel or basin
- one small bridge
- promenade / curved walking route
- benches
- low planting
- terrace or open plaza
- calm water reflections
- distant continuation of the waterfront

Water must remain visible even on the 390px mobile crop.

Six-slot revision target:
- WP-01: x 22, baseline y 83, max width 20% -> aquarium
- WP-02: x 74, baseline y 80, max width 18% -> holoca
- WP-03: x 31, baseline y 61, max width 15% -> word-generator
- WP-04: x 77, baseline y 57, max width 14% -> filler / future project
- WP-05: x 20, baseline y 46, max width 12% -> filler / future project
- WP-06: x 69, baseline y 49, max width 12% -> filler / future project

Depth:
- WP-01 and WP-02 are foreground anchors
- WP-03 and WP-04 form an asymmetric middle tier on the two banks
- WP-05 and WP-06 are small rear parcels
- the central approach, bridge and mobile-visible water window are protected no-build space

Popup preference for current projects:
- aquarium: upper-right
- holoca: upper-left
- word-generator: inward/right or below after final mass QA

Authoritative plan:
- docs/PHASE5_WATERSIDE_PLAY_6_SLOT_PLAN.md

The previous rear-center word-generator placement is superseded for the background revision because it conflicts with the bridge/water sightline.

## 9. Hotspot data contract

Scene coordinates are data, not hardcoded CSS.

Draft runtime record:

```json
{
  "districtId": "archive-street",
  "background": "assets/districts/archive-street/background.webp",
  "buildings": [
    {
      "projectId": "yorei",
      "asset": "assets/districts/archive-street/buildings/yorei.webp",
      "x": 24,
      "y": 75,
      "width": 17,
      "anchor": "bottom-center",
      "hitbox": {
        "x": 16,
        "y": 48,
        "width": 18,
        "height": 30
      },
      "popupPreferred": "right"
    }
  ]
}
```

Coordinates are percentages.

Initial implementation may use rectangular hitboxes. Polygon hit areas are deferred unless QA proves rectangles create accidental overlap.

## 10. Interaction rules

Desktop / tablet:
- building art is visible at all times
- hovering or keyboard focus adds a restrained highlight
- project name may appear as a lightweight label on focus/hover
- click opens the project popup near the building, clamped to the visible scene

Mobile:
- tap opens a bottom sheet
- scenery remains visible behind the sheet
- sheet placement must account for the fixed Portfolio City navigation
- Escape / close returns focus to the originating building hotspot

The building asset itself is decorative. The accessible button/hotspot is the interactive semantic element.

## 11. Art-direction continuity

District backgrounds must feel like close-up locations inside the same illustrated world as the Master World.

Required:
- storybook / hand-painted map atmosphere
- moderate detail, not photorealistic
- slightly softened distant detail
- readable silhouettes
- warm aged-map material language
- environmental perspective consistent enough that separate building art can sit naturally in the scene

Avoid:
- photorealism
- modern generic dashboard visuals
- UI labels painted into scenery
- tiny decorative clutter competing with building silhouettes
- buildings baked into the background when they are meant to be clickable project objects

## 12. Asset inventory audit, 2026-09-20

Repository audit:
- existing transparent project-building art: 6 / 14
- existing final-format 16:9 district backgrounds: 0 / 4
- legacy Observatory terrain reference: present, but undersized and not 16:9

Google Drive explicit search:
- Portfolio City approved-design folders and Observatory Hill asset folders are present
- no dedicated Workshop Alley or Waterside Play runtime-asset folders were found in the current IllustratedCity folder
- searches for DQB2, MADORI, aquarium, and standalone SHISHA building images did not surface dedicated building assets

Therefore the next art-production gate is real, not merely an implementation task.

## 13. Production order

1. Waterside Play six-slot geometry lock
2. Waterside Play background revision
3. Waterside Play six-mass QA at 1440 / 820 / exact 390
4. Workshop Alley six-slot audit
5. Observatory Hill six-slot redesign
6. Archive Street six-slot salvage/redesign decision
7. missing filler and project-building illustrations
8. scene assembly prototype
9. hotspot tuning
10. popup integration
11. responsive QA

Approved art masters are preserved as visual references where explicitly allowed, but runtime approval now requires the six-slot compositing gate. Rejected images remain reference-prohibited.

## 14. P5-B-4 exit criteria

P5-B-4 is complete when:
- image sizes and formats are fixed
- three-layer separation (background base / filler / project building) is fixed
- six-slot district capacity is fixed
- asset paths are fixed
- all 14 project placement targets are documented
- background-only content is defined for all four districts
- hotspot coordinate contract is defined
- missing-art inventory is explicit
- the next task can begin with actual background illustration production without another architecture decision
