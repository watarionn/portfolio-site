# Phase 3.9 - Production Art S6 / Waterside Play Brief

Updated: 2026-09-30

Status: **active production-art brief / human visual acceptance required**

## Goal

Turn the accepted Waterside Play visual material into the first complete production District scene under the Single-Scene architecture.

This is an art-production checkpoint, not a runtime cutover.

## Canonical visual sources

Accepted Waterside background:

- Google Drive file: `background-approved.png`
- Drive file ID: `1j3_NnnrXExcqu3wMU2AHMAk6EqPqMUVM`
- 1672 x 941
- 2,491,865 bytes
- GitHub historical SHA-256:
  `838797151c9c557af97ffb84e30940f1afee3e1603208a3ec9620d1bb2f95789`

Production Locked Aquarium:

- Google Drive file: `aquarium-s1-final-approved.png`
- Drive file ID: `1wb_47raKcnDRM1emyVN0gBT1dYpIxUvt`
- 1536 x 1024
- 1,969,382 bytes
- GitHub historical SHA-256:
  `228fbc8366d5cbdd9ef02a2a948bd5cb24cc9b5bf658f951a68d0eadef9ea1`

Locked Aquarium placement remains:

- anchor: bottom-center
- x: 19.9606%
- y: 57.1039%
- width: 25%
- rotation: 0 degrees

The accepted Aquarium pixels are immutable for this production-art pass. If an art-editing workflow changes them, the final candidate must restore the locked Aquarium source exactly before acceptance.

## District projects

Canonical Waterside projects:

1. Aquarium / 市立水族館
2. HoloCa / カードショップ
3. Word Generator / ゲームショップ

The finished scene must provide one readable architectural identity for each project.

No filler building is required merely to satisfy a slot count.

## Composition hierarchy

### 1. Aquarium

Role: dominant landmark / primary mass.

Keep the current left-side waterfront placement.

Do not resize, repaint, redesign, relocate, or regenerate the locked Aquarium in the accepted final candidate.

### 2. HoloCa card shop

Role: medium-scale secondary project building.

Preferred zone:

- right-side midground promenade / terrace
- approximately x = 68-86% of scene width
- approximately y = 38-63% of scene height

Character:

- angled three-quarter building, not front-facing card UI
- readable shop entrance
- compact roof silhouette
- muted blue-green / weathered red accent family
- one restrained card-related motif in architecture or hanging sign
- no essential generated text
- visually integrated into stone terrace / retaining-wall terrain

It must remain clearly clickable at browser scale without competing with Aquarium.

### 3. Word Generator game shop

Role: smaller deeper curiosity building.

Preferred zone:

- farther right / upper-right terrain
- approximately x = 77-91% of scene width
- approximately y = 24-47% of scene height

Character:

- smaller than HoloCa and Aquarium
- partly hidden by trees, wall or elevation
- warm ochre / muted brick / dusty green family
- one restrained tabletop-game motif
- silhouette must still remain registrable by hotspot
- no essential generated text

It should reward looking farther into the scene rather than read as a third equal card.

## Existing scene elements to preserve

Preserve the visual function of:

- central canal
- foreground water
- stone bridge
- distant town
- aqueduct
- right-side climbing terrain
- foreground promenade
- existing daylight and color grade
- water as the visual breathing space between project architecture

Do not fill open water or every empty paved area with buildings.

## Style standard

All work follows:

`docs/PORTFOLIO_STORYBOOK_CITY_STYLE_BIBLE.md`

Key Waterside interpretation:

- fictional European storybook town
- handcrafted illustrated architecture
- controlled irregularity
- warm muted stone
- aged teal / blue-green water accents
- selective detail
- softened distant scenery
- clear daytime
- exploratory paths
- coherent single-scene perspective and lighting

Do not target a named proprietary franchise style.

## Strong rejection conditions

Reject a candidate if it:

- alters the locked Aquarium design in the final accepted scene
- presents the three projects as equal front-facing cards
- places HoloCa / Game Shop as floating cutout assets
- blocks the central bridge or destroys the canal composition
- uses photorealistic / PBR materials
- adds essential generated text
- makes all three buildings similar in size or silhouette
- loses clickable silhouette readability
- overfills the right side until the district becomes visually dense
- changes the scene into night / sunset / incompatible lighting
- removes the quiet water / exploration character

## Candidate workflow

1. use accepted Waterside composite as the visual base;
2. add HoloCa and Word Generator architecture as integrated townscape;
3. preserve the broad background / canal composition;
4. restore the exact Production Locked Aquarium pixels if necessary;
5. review at full resolution;
6. review at actual desktop / tablet / mobile browser scale;
7. register semantic hotspots only after art acceptance;
8. store accepted high-resolution art in Google Drive;
9. store manifest / coordinates / automation in GitHub.

## Human Review Gate

Phase 6 artwork cannot become `PASS` only from automated checks.

A candidate must be visually accepted by the user before it becomes canonical production art.

The first candidate should therefore be treated as:

`CANDIDATE / NOT YET ACCEPTED`
