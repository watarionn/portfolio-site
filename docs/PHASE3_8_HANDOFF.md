# Phase 3.8 Storybook Town Detail Pass Handoff

## Status
- Base: Phase 3.7 merged main `ee7be16944ac92b2630e9cb1836963f9e55072e0`.
- Working branch: `phase3-8-storybook-town-details`.
- Current step: P1.1 environmental detail overlay.
- World geometry, 13 terrain chunks, 14 project placements, road widths, clearings, shoreline, and HoloCa geometry remain unchanged.

## P1.1 implementation
- Added `portfolio-city/data/environment-details.json` as the editable detail registry.
- Added 28 decorative items, exactly 7 per district.
- Allowed detail types: stone wall, hedge, flowerbed, lamp, bench.
- Details render in a separate `world-details` layer between terrain and projects.
- The layer has `pointer-events: none`; building selection and map dragging remain authoritative.
- Building anchors receive a subtle ground shadow only; authored x/y/width are unchanged.

## Visual direction
- Whimsical European puzzle-adventure storybook town atmosphere.
- Avoid mirrored/formal garden layouts.
- Prefer small asymmetric clusters and quiet negative space.
- Details should read as part of the watercolor terrain, not as UI stickers.
- North: quiet observatory garden.
- Archive: older stonework and calm planting.
- Workshop: slightly busier, practical street texture.
- Waterside: promenade / garden edge character.

## P1 iteration history
- Initial 36-item pass was rejected internally because hedge forms read as green oval stamps.
- P1.1 reduced density to 28 items, broke left/right symmetry, removed the solid hedge base, lowered opacity, and used multiply blending.
- Browser QA at 390 / 820 / 1440 passes with 28/28 details, 14/14 projects, 13/13 terrain chunks, horizontal overflow 0, severe browser errors 0, and desktop drag PASS.

## Release rule
Do not merge or deploy without explicit user approval. Use `[skip ci]` for commits where applicable to avoid metered GitHub Actions work.

## P2 district identity pass
- North Crown / Observatory Hill: quiet observation-garden character with a restrained star marker.
- Archive Street: old-town / scholarly atmosphere with a small book cart.
- Workshop Alley: craft-street character with crate stack and barrel accents.
- Waterside Play: promenade character with reeds and a small waterside bollard.
- Density remains 28 details total, 7 per district; P2 replaces generic props rather than adding more clutter.
- District signature props are covered by the Phase 3.8 checker so later edits cannot silently erase each district's identity.

## P2 visual QA
- 390 / 820 / 1440 browser QA: PASS.
- 28/28 detail nodes rendered; 14/14 projects and 13/13 terrain chunks remain present.
- horizontal overflow: 0; desktop drag remains functional.
- Specialized props remain visually subordinate to buildings and terrain.
- The rejected 36-item P1 draft remains rejected; do not restore the denser oval-hedge arrangement.

## P3 building forecourt grounding
- Added a non-interactive `building-forecourt` element behind each of the 14 project buildings.
- Forecourts do not change project x/y/width or the authored clearings.
- Observatory Hill uses muted moss/stone tones; Archive Street uses warmer old-stone tones.
- Workshop Alley uses restrained earth/wood tones; Waterside Play uses cooler sage/waterside tones.
- The treatment is intentionally low-opacity so it reads as grounding, not as a new colored platform.
- 390 / 820 / 1440 browser QA remains PASS with 28 details, 14 projects, 13 terrain chunks, and zero horizontal overflow.
