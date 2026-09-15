# Portfolio City Phase 3.6-R0 — Whole-City Structural Blueprint Approval

Date: 2026-09-15
Status: **APPROVED STRUCTURAL BLUEPRINT / COORDINATE PLAN REVIEW READY**
Parent decision: `docs/phase3-6-r0-whole-city-blueprint-reset.md`

## Approved master

The approved structural blueprint master is stored outside the public repository in Google Drive:

- `Portfolio City_採用設計画像_20260913/02_IllustratedCity/01_DistrictConnections/phase3-6-r0_whole-city-structural-blueprint_APPROVED.png`
- Drive file id: `1TDl14KLSRTI40gKmi1QpV6WKQNi9H0RA`

The public repository must not duplicate the large source image. Git records the decision and production contract; Drive holds the approved art master.

## What the approved image locks

The blueprint is approved as the city-scale structural direction, not as final runtime terrain.

It locks these principles:

- Central Commons remains a quiet shared connector rather than a fifth district.
- Observatory Hill, Archive Street, Workshop Alley and Waterside Play read as four distinct but connected district envelopes.
- Each existing district visibly retains future-ready internal project capacity.
- Every district keeps an unfinished outward edge that can become a Growth Frontier.
- City-scale corridors remain open beyond the initial four districts so a fifth or later district can be attached without repainting the whole city.
- Growth capacity is deliberately visible in the composition instead of being hidden behind a fully finished city silhouette.

## Four-level growth hierarchy

Future blueprint and terrain work must keep four growth levels visually and structurally distinct:

1. **Current project parcel** — occupied by an existing project building.
2. **Reserve parcel** — immediately usable future project capacity inside the existing district.
3. **District Growth Frontier** — an unfinished district edge that can extend the same district into additional chunks.
4. **New District Expansion Corridor** — a city-scale route beyond the current district envelope for adding an entirely new district.

A future project must not force district expansion while a suitable reserve parcel remains available. Filling reserve parcels must not remove the district Growth Frontier. District growth must not consume every corridor reserved for future new districts.

## Mandatory visual-direction rule

All later terrain and whole-city art derived from this blueprint must stay close to the established Professor Layton-series-inspired visual target in overall drawing character and colour mood:

- simplified hand-painted / hand-drawn storybook forms
- restrained, slightly muted warm colour palette
- readable large shapes before small decoration
- clean but human-feeling contours rather than vector-hard edges
- selective texture and detail rather than exhaustive object-by-object rendering
- no dense decorative micro-detail merely to make an image look elaborate
- avoid noisy AI-like over-description, repeated tiny props, meaningless surface marks or excessively intricate foliage/building ornament

The quality gate is the impression at runtime scale. A simpler coherent image is preferred over a more detailed image that looks synthetic or separately generated.

## Central Commons rule

Central Commons must remain visually subordinate to project districts and buildings. It is a traffic and transition core, not a showcase attraction.

Do not introduce a monumental centrepiece, oversized fountain, tower, unique building or other landmark that competes with project architecture.

## Extension-edge rule

Each district must preserve at least one clearly usable unfinished edge where road, grade and scenery can continue naturally into a future chunk. Attractive cliffs, water, walls or landmarks must not seal a district on every side.

The blueprint's outward openings are therefore production infrastructure, not decorative arrows to be removed casually during later terrain painting.

## What remains intentionally unlocked

This approval does not yet lock:

- exact final district polygon boundaries
- final terrain chunk / render-region slicing
- final shoreline and cliff silhouettes
- exact bridge placement beyond network continuity requirements
- final replacement Observatory terrain
- final Central Commons terrain
- Archive, Workshop or Waterside final terrain
- remaining eleven project-building illustrations

Those decisions follow from the approved structural blueprint and the coordinate growth review.

## R0 state after approval

The structural blueprint direction is adopted. The current `observatory_terrain.webp` remains withdrawn as final geography but retained as a rendering-quality reference. HoloScope, Sphere and Prime Dot Art remain approved building assets.

The approved image has now also been converted into a machine-checkable coordinate growth plan; final runtime layout is still intentionally unchanged.

## Coordinate Growth Layout follow-up

The machine-checkable planning contract is:

- `docs/phase3-6-r0-growth-layout.json`
- `docs/phase3-6-r0-growth-layout.md`

The coordinate plan:

- preserves all fourteen current project coordinates
- adds four Reserve Apron chunks
- adds two future-ready reserve parcels per current district
- defines eight district Growth Frontier sockets
- keeps four separate outward new-district Expansion Corridors
- gives the redesigned initial city a 13-chunk structural footprint while preserving lazy-load architecture

The precise coordinate QA diagram is stored in Google Drive as:

- `Portfolio City_採用設計画像_20260913/02_IllustratedCity/01_DistrictConnections/phase3-6-r0_growth-layout_coordinate-review.png`
- Drive file id: `1XH_KD4f6ZSZxeRQoG1VYL-O5nN9yMjCv`

This diagram is a review/QA artifact rather than a replacement for the approved art-direction blueprint.

Latest-head machine validation confirms:

- all 14 baseline project placements match runtime `map-layout.json`
- all 8 reserve parcel envelopes fit fully inside their designated Reserve Apron chunks
- every current district has exactly 2 reserve parcels
- district-growth sockets remain distinct from new-district expansion sockets
- Simulations A–D remain structurally possible without moving current projects
- public repository boundary validation passes
- Portfolio City runtime contract remains `14 works / 4 districts / 9 runtime chunks`
- `portfolio-city/data/map-layout.json` remains byte-identical at Git blob level to `main`

The next design gate after approval of this coordinate plan is terrain slicing / render-region planning. No district terrain is authorized before that gate.
