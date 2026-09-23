# EXPLORE Forest Phase 2-E — Area B Implementation Closure

Date: 2026-09-24
Branch: `geo-area-b-implementation`

## Locked artwork

- Desktop: `apps/geo/public/assets/forest/area-b-desktop.png`
  - PNG 1585 x 992
  - 1,104,264 bytes
  - SHA-256 `1b80d0a2ca0318423e9b9a93f6337328d5f5308c26c98ecc412ca2354add6c4e`
- Mobile: `apps/geo/public/assets/forest/area-b-mobile.png`
  - PNG 941 x 1672
  - 1,089,227 bytes
  - SHA-256 `bdb1dc8d027288658d1d1470bc036955a0ac33a75b4412e2c27f84b6d9fb128e`

Artwork remains separate from HTML/CSS labels and quiz UI.

## Presentation lock

Desktop uses canonical `forest.json` coordinates.

Mobile presentation coordinates:
- 十八成浜 31,20
- 及位 63,29
- 特牛 27,39
- 馬主来 72,48
- 京終 25,59
- 飯給 70,68
- 仙鳳趾 42,79

Exits remain A left, D right, C bottom.

## Static composite QA

Generated against the locked desktop/mobile artwork with the seven labels, notebook, three exits, and expanded quiz panels.

Risk-target expanded panels:
- 馬主来: desktop PASS / mobile PASS
- 京終: desktop PASS / mobile PASS
- 飯給: desktop PASS / mobile PASS
- 仙鳳趾: desktop PASS / mobile PASS

For all eight expanded-panel checks:
- canvas containment: PASS
- exit overlap: none
- notebook overlap: none
- other sign overlap: none

QA evidence is generated locally as `qa-area-b-*-static.png` and is intentionally not part of runtime assets.

## Browser QA environment note

The isolated Area B HTTP server returns the Explore page with HTTP 200. Chrome/Selenium navigation in the current QA environment intermittently remains at `data:,` or clears the CDP page URL before DOM inspection. This is isolated as a QA-environment issue and is not treated as an Area B runtime defect. Static geometry/composite QA therefore provides the Phase 2-E layout closure evidence.

## Closure

Area B Full Layout Lock remains valid. Runtime wiring, desktop/mobile artwork, mobile presentation coordinates, and static overlap QA are complete. Next phase after review is Area C.
