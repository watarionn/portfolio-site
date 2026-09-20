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
District pages use a field-guide / travel-journal composition.

The common page structure remains the same across all four districts, but each district gets a restrained identity treatment:
- observatory-hill: highland / night-observation accent
- archive-street: paper / archive / signboard accent
- workshop-alley: workshop / drafting-table accent
- waterside-play: canal / leisure / water accent

These accents must not change Master World geography or project routes.

## Responsive behavior
Desktop:
- district hero spans the page width
- project cards form a spacious 2-column or adaptive grid
- illustrated building assets receive generous vertical space

Tablet:
- same information hierarchy with tighter spacing

Mobile:
- one-column project cards
- navigation remains reachable without horizontal overflow
- project preview behaves as a contained dialog / sheet

## Checkpoints
P5-A District page foundation — DONE
- replaced the bare District View with semantic district-page structure
- added complete district identity block
- added named previous/world/next navigation
- added project cards using canonical project data
- browser QA confirms all 14 canonical projects across 4 districts at 1440 / 820 / exact 390 mobile widths

P5-B District visual identities
- common field-guide styling
- four district-specific accent systems
- illustrated/fallback asset treatment

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
- every district page explains where the visitor is
- every project is understandable before it is opened
- all 14 canonical projects remain reachable
- district-to-district navigation uses real district names
- World Map return restores the saved world camera
- Project Preview returns focus to the originating project card
- desktop, tablet, and mobile share the same content hierarchy
