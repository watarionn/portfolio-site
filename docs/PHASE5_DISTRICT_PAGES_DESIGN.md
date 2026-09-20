# Phase 5 District Pages

Status: IMPLEMENTATION STARTED

## Goal
Complete the four district pages that sit between the Master World and individual project pages.

The district page should feel like entering a neighborhood, not like opening a generic list. It must preserve the Portfolio City travel-map language established in Phase 4 while making the 14 projects easy to understand and enter.

## District page information hierarchy
1. District identity
   - English district label
   - Japanese district name
   - district role
   - short district description
   - landmark
   - project count

2. District project field
   - illustrated building asset when available
   - building name
   - project title
   - project type
   - short summary
   - clear project-preview affordance

3. District navigation
   - previous district with real district name
   - return to World Map
   - next district with real district name

4. Project preview
   - stays inside Portfolio City
   - gives enough context before opening the project
   - supports Escape / keyboard focus return

## Visual direction
The Phase 5 target is an illustrated district scene, not a permanent project-card directory.

Each District View is composed from:
- a background-only district landscape illustration
- independent transparent project-building illustrations
- accessible hotspot buttons aligned to those buildings
- a project popup / dossier opened from a building
- minimal district navigation

The background establishes the neighborhood. The building layer remains interactive and independently positionable.

District identities:
- observatory-hill: hilltop observation landscape
- archive-street: receding archive / information street
- workshop-alley: shared work yard and craft alley
- waterside-play: promenade, water channel, bridge, and leisure space

These scene treatments must not change Master World geography or project routes.

Detailed production contract:
- docs/PHASE5_DISTRICT_SCENERY_PRODUCTION_SPEC.md
- portfolio-city/data/district-scenes.schema.v1.json
- portfolio-city/data/district-scenes.draft.json

## Responsive behavior
Desktop:
- show the full 16:9 district scene
- building hotspots align to the independent building layer
- popup opens near the selected building and clamps to the visible scene

Tablet:
- preserve the same scene composition with tighter margins
- hotspot geometry remains percentage-based

Mobile:
- use the center-safe crop of the same district scene
- important building centers remain inside the mobile critical-content band
- tapping a building opens a bottom sheet rather than a floating popup
- district navigation remains reachable without horizontal overflow

## Checkpoints
P5-A District page foundation — DONE
- replaced the bare District View with semantic district-page structure
- added complete district identity block
- added named previous/world/next navigation
- added project cards using canonical project data
- browser QA confirms all 14 canonical projects across 4 districts at 1440 / 820 / exact 390 mobile widths

P5-B District scenery and visual identities — IN PROGRESS
- P5-B-1 scene architecture: adopted background + independent buildings + hotspots + popup
- P5-B-2 background composition direction: defined for all four districts
- P5-B-3 rough building placement: defined in normalized scene coordinates
- P5-B-4 production specification: DONE
- next gate: produce the actual background illustrations, starting with Archive Street

P5-C Project-card completion
- verify all 14 projects
- summaries/types/building labels
- hover/focus/visited affordances as appropriate

P5-D Project preview completion
- redesign the current bare preview into a proper project dossier
- preserve routes
- Escape/focus-return behavior

P5-E Responsive and accessibility closure
- 1440 / 820 / exact 390 QA
- keyboard navigation
- no horizontal overflow
- reduced-motion behavior

P5-F Production release review

## Acceptance criteria
- every district reads visually as a place before any popup is opened
- the district scene is the primary project-selection surface
- backgrounds contain environment but do not bake in clickable project buildings
- all 14 canonical projects remain reachable through building hotspots
- every hotspot opens a project popup before leaving Portfolio City
- district-to-district navigation uses real district names
- World Map return restores the saved world camera
- closing a popup returns focus to its originating building hotspot
- desktop, tablet, and mobile preserve the same scene and project hierarchy
