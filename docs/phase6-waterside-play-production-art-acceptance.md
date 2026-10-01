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

## Production verification and closure

Verified on production 2026-09-30.

- Production root: `/cf278796.cloudfree.jp/public_html/portfolio-city`
- Deployment mode: non-destructive FTPS delta upload; exactly six Waterside files were written and no remote paths were deleted.
- `world-hierarchy-shell.js`, `city.css`, and `data/district-scenes/waterside-play.json` matched the prepared release sizes when fetched back over public HTTPS.
- Runtime WebP derivatives matched their source SHA-256 values after public HTTPS fetch:
  - 1536x1024: `7fa97e444a448238a1fa032ad9c42056ad6945a4fa5ae8db94282004fb4c9dd5`
  - 1152x768: `7d86d29e00299b5a8b5754b881c71df2974cedf970d66665c54430459f54036a`
  - 768x512: `de7988aec3be2002bd2d570939205bd2cbffbd478631dd4ede66747a91fb8c8d`
- `city.html` returned HTTP 200 after deployment.
- Browser QA passed at 1440x1200 and 390x844 for the world map, Waterside entry panel, and final district scene.
- The final district scene preserved its composition without horizontal overflow or clipping at the mobile viewport.
- Semantic DOM QA exposed exactly three active project hotspots: 市立水族館, カードショップ, ゲームショップ. Each is an accessible link with an `aria-label`.
- WP-04..WP-06 remained reserved and did not appear as interactive controls.

Status: **CLOSED / production verified**.

The next Phase 6 production-art target may proceed using the same Single-Scene + semantic hotspot contract.


## Mobile production-art extension — 2026-10-01

The mobile district view now uses a separately composed 3:4 master rather than cropping the desktop 4:3 scene.

Accepted mobile master:
- Google Drive ID: `15O1lzu9UuvvaCDVL-4FDxIVjNquqePr8`
- filename: `waterside-play-mobile-production-art-accepted-20261001.png`
- dimensions: 1086x1448
- SHA-256: `06c78669630f9cb718d34436eb1d5dbc821a4979e782c8e85c69daa31047ec40`
- role: mobile-only visual source; the accepted desktop master remains unchanged.

Runtime derivative:
- `waterside-play-mobile-1086x1448-q86.webp`
- 285,688 bytes
- SHA-256: `2a1d66c0d603ffaf31699f4b1c6039247a7c70a1986aca9d1ff926d5b37bd02c`

Runtime contract:
- `max-width: 680px` selects the 3:4 mobile artwork.
- desktop/tablet retain the existing 4:3 derivatives.
- mobile semantic geometry uses the mobile master's 1086x1448 source coordinate space.
- WP-01..WP-03 are interactive; WP-04..WP-06 have reserved mobile geometry but remain non-interactive.
- artwork and semantic SVG have explicit paint order: artwork z-index 1, hotspots z-index 2.

Production QA:
- public mobile WebP fetched successfully with the expected dimensions.
- 390x844-class browser QA selected the 1086x1448 mobile source.
- exactly three mobile active hotspots were exposed.
- WP-01, WP-02, and WP-03 each opened their corresponding inline project note.
- no horizontal overflow was present.
- desktop QA continued to select `waterside-play-1536x1024-q86.webp`.

Status: **Mobile District View S1 PASS / production verified**.
