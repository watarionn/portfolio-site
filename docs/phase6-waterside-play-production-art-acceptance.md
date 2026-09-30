# Phase 6 - Waterside Play Production Art Acceptance

Updated: 2026-09-30
Status: ACCEPTED / production handoff

## Decision

The user accepted the latest Waterside Play production-art candidate as the canonical visual direction for Phase 6.

Existing district and building artwork is not a visual constraint. Earlier assets remain reference / rollback evidence only. New district art may replace them whenever the new scene better satisfies the active Style Bible.

## Visual contract

Follow `docs/PORTFOLIO_STORYBOOK_CITY_STYLE_BIBLE.md`.

The accepted scene is a single continuous waterside townscape. Interaction remains semantic and must not require visually separated building layers.

No baked navigation labels, slot numbers, or hotspot UI are authoritative parts of the illustration.

## Six-slot district contract

Waterside Play reserves six clickable building slots from the beginning.

| Slot | State | Project | Building role |
| --- | --- | --- | --- |
| WP-01 | active | aquarium | Municipal aquarium / central landmark |
| WP-02 | active | holoca | Waterfront card shop |
| WP-03 | active | word-generator | Game shop |
| WP-04 | reserved | - | Future project building |
| WP-05 | reserved | - | Future project building |
| WP-06 | reserved | - | Future project building |

Reserved buildings are part of the finished illustration but remain non-interactive until a project is assigned. Publishing a future project should normally require semantic activation, not repainting the district.

## Composition contract

- WP-01 is the dominant central landmark.
- WP-02 and WP-03 occupy readable lower / waterside positions.
- WP-04, WP-05, and WP-06 remain distinct architectural silhouettes at secondary elevations/depths.
- All six buildings must remain registerable as stable semantic hotspots.
- Roads, stairs, bridges, water, and occlusion should make the district feel explorable rather than card-like.
- Background architecture may exist beyond the six slots and must not accidentally read as an active project target.

## Canonical storage

Accepted high-resolution art belongs in Google Drive under:

`Portfolio City / IllustratedCity_採用設計画像_20260921 / 02_IllustratedCity / 05_Phase6_ProductionArt`

Folder created 2026-09-30.

GitHub remains canonical for this acceptance record, slot semantics, hotspot geometry, runtime manifests, and production automation.

## Next implementation checkpoint

1. place the accepted master in the Phase 6 Drive folder
2. register exact source dimensions / source identity
3. define six hotspot polygons in source coordinates
4. activate WP-01..03 against canonical project IDs
5. keep WP-04..06 reserved and non-interactive
6. run the Phase 5 asset pipeline to create runtime derivatives and QA evidence
7. integrate the resulting Single-Scene district behind the reversible production gate

## Accepted master identity

- Drive file ID: `1hABwB5mAHumsUMjQnw6WgOTnj831A5xJ`
- Filename: `waterside-play-production-art-accepted-20260930.png`
- MIME: `image/png`
- Drive parent: `05_Phase6_ProductionArt`
- Source: accepted ChatGPT-generated Phase 6 production candidate, user-approved 2026-09-30

This Drive object is the canonical accepted high-resolution Waterside Play art for the next hotspot / derivative stage.
