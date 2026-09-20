# Phase 4.0 World UI Composition Design

Status: DESIGN STARTED

## Goal
Turn the Phase 3.9 Master World from a technically active map into the single visual centerpiece of the Portfolio City map screen.

The new world map is the only map surface. The legacy city-map and the world39 rollback switch are not part of the target UI.

## 1. Map panel heading
The map heading becomes a compact orientation strip instead of a large editorial header.

Target desktop height: approximately 56-64px.
Target mobile height: approximately 44-52px.

Recommended content:
- Eyebrow: PORTFOLIO CITY / WORLD MAP
- Main label: 世界地図
- Short helper: 地区を選んで探索

The current long explanatory paragraph is removed from the map header. The large map legend is also removed from the primary top area; any status legend should become a secondary map control only if it is still needed later.

## 2. Framed world viewport
Wrap world-h2-viewport in a dedicated world-map-frame.

Visual structure:
1. outer frame: dark warm wood / aged bronze impression
2. inner bevel: thin highlight and shadow pair
3. matte edge: muted parchment strip
4. map glass: world-h2-viewport itself

The frame must feel like a displayed travel map rather than a generic browser card. Initial implementation should be CSS-only so the visual weight can be tuned without creating asset dependencies.

Interaction rules:
- drag, touch pan, keyboard pan remain attached to world-h2-viewport
- all overflow stays clipped inside the inner frame
- frame decoration must use pointer-events:none
- the frame must not change Master World coordinates or district anchors

## 3. District selection card
Clicking a district does not immediately replace the world map.

Instead, the first click opens a district selection card over the map while preserving the world camera underneath.

Desktop behavior:
- card appears near the selected district when space allows
- if it would overflow, it is clamped inside the viewport
- map remains visible behind the card

Mobile behavior:
- card becomes a bottom sheet attached to the lower edge of the framed viewport
- sheet can be dismissed without losing the current map camera

Initial card content:
- district name
- district role / short one-line description
- number of projects in the district
- one compact atmosphere or theme line
- primary action: 地区を見る
- secondary action: 閉じる

The card is an orientation step, not the final project preview.

## 4. Interaction hierarchy
Target flow:

WORLD MAP
  -> click district
  -> DISTRICT CARD over world
  -> click 地区を見る
  -> DISTRICT VIEW
  -> click project
  -> PROJECT PREVIEW

Closing the district card returns to the unchanged world state. Returning from District View restores the saved world camera.

## 5. State model change
Current behavior enters setLevel(district) directly from a world-h2-district click.

Target behavior introduces an intermediate district-card state without changing the main world level.

Recommended state additions:
- activeDistrictId
- districtCardOpen
- districtCardReturnFocusId

enterDistrict remains the explicit transition used by the 地区を見る action. A district marker click should only select the district and render the card.

## 6. Legacy retirement
The target production architecture has no user-facing map switch.

Remove or retire:
- legacy city-map from the MAP panel
- city-map viewport / inspector when no longer needed by other views
- ?world39=0 presentation switch
- feature-gated dual-map presentation logic

Keep rollback capability through source control and deployment history, not through a permanent public URL toggle.

## 7. Accessibility
- district markers remain native buttons
- district card receives an accessible name from the district title
- Escape closes the district card before any deeper navigation action
- focus returns to the district marker that opened the card
- mobile bottom sheet must remain keyboard reachable
- reduced-motion users receive no decorative frame animation

## 8. Responsive rules
Desktop >= 981px:
- compact heading above frame
- framed viewport dominates the page width
- district card floats near the selected anchor

Tablet 681-980px:
- frame remains full width
- district card prefers lower-right / lower-left placement based on anchor

Mobile <= 680px:
- compact heading becomes one-row or two-row strip
- frame corners and bevel are thinner
- district card becomes bottom sheet
- world-h2-map may remain wider than the viewport for exploration

## 9. Implementation checkpoints
P4-A: Single-map architecture. DONE. Duplicate legacy map presentation and the public world39 switch are removed from the active MAP UI.
P4-B: Compact MAP heading. DONE. The MAP heading is now a 56px desktop/tablet orientation strip and approximately 46px on the mobile QA viewport, with the world map promoted as the visual focus.
P4-C: Framed viewport. DONE. world-h2-viewport is mounted inside a responsive wood / brass / parchment-style world-map-frame with non-interactive decorative layers.
P4-D: District card prototype. DONE. District marker clicks now keep the world level visible and open a clamped selection card with district summary, project count, landmark, enter action, and close action.
P4-E: Mobile bottom sheet + keyboard/focus behavior. DONE. Mobile uses a viewport-attached bottom sheet; focus enters the primary action, Tab/Shift+Tab cycle within the card, Escape closes it, and focus returns to the originating district marker.
P4-F: Browser QA at 1440, 820, and 390 widths, then production review. DONE. Full world -> district card -> district -> project preview -> district -> world navigation passed at all three targets, including exact 390x844 mobile emulation.

## Acceptance criteria for the design phase
- only one map is visible on the MAP screen
- the heading no longer competes visually with the world map
- world-h2-viewport reads visually as a framed map exhibit
- district selection is understandable before entering a district
- desktop and mobile use the same information hierarchy
- Master World coordinates, terrain tiles, and district anchor cells remain unchanged

## 10. P4-F final QA and production review

Browser QA targets:
- 1440x1000 desktop
- 820x900 tablet
- exact 390x844 mobile emulation, devicePixelRatio 1

Verified at every target:
- one world hierarchy shell, one world-map-frame, one world-h2-viewport
- zero legacy cityMap elements
- 192 Master World tiles and four district markers
- data-terrain-bound=true
- no horizontal document overflow
- keyboard camera pan changes x from 0 to -36px
- district marker opens the card while state remains world
- Escape closes the card and restores focus to the marker
- 地区を見る enters District View
- project selection opens Project Preview
- Escape returns Preview to District View
- 世界地図へ戻る restores World View and the saved -36px camera
- browser console has no application errors

The exact 390x844 emulation also verifies the bottom sheet remains inside the visible world viewport. During P4-F a mobile overlap with the fixed bottom navigation was found and corrected by anchoring the sheet to the calculated visible viewport top rather than the physical world viewport bottom.

Production review on 2026-09-20:
- current production city.html returns HTTP 200
- production Master World manifest returns HTTP 200
- production does not yet contain the Phase 4 WORLD MAP heading
- production still contains the pre-Phase-4 legacy cityMap markup
- therefore the Phase 4 branch has not been deployed unintentionally

Phase 4.0 is a release candidate in PR #103. Production should change only after the PR is explicitly merged and the normal deployment workflow succeeds.
