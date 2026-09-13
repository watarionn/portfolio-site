# Phase 3.3 — Living City Map

## Goal

Phase 3.3 returns to the original Portfolio City concept: the MAP should read as one place to explore, not four rectangular groups of project cards.

Checkpoint 1 changes the desktop composition only. The Phase 3.2 mobile layout remains intact while the desktop map becomes a single continuous city canvas.

## Checkpoint 1 scope

- preserve all 14 project IDs, routes, district assignments, visited state, keyboard behavior, WORKS, PROFILE, and CONTACT
- preserve the Phase 3.2 mobile map at widths up to 980 px
- on desktop, place the four districts as geographic zones within one continuous canvas
- keep Observatory Hill north, Archive Street west, Workshop Alley east, and Waterside Play south
- keep the existing roads, plaza, bridge, landmarks, and environmental props, but visually connect them into the same city surface
- convert project buildings from boxed cards into floating map landmarks with dark title plaques

## Acceptance

- desktop 1440 px renders one continuous city canvas with four geographic zones and fourteen selectable buildings
- desktop project buildings are no longer rendered as rectangular cards
- roads and water visually cross district boundaries
- the right-side project inspector remains functional and all 14 existing routes remain unchanged
- mobile 390 px retains the readable stacked Phase 3.2 map and MAP / WORKS switch
- visited, selected, district progress, and district completion states continue to work
- no horizontal overflow or browser page errors
- contract, runtime, production build, JavaScript syntax, and diff checks remain green

Checkpoint 1 deliberately does not add illustrated raster assets, characters, project intro pages, or a new navigation model. Those can follow after the continuous desktop composition proves stable.

## Checkpoint 1 acceptance

- desktop 1440 px renders all four districts as absolute regions on one continuous map canvas
- all 14 buildings render without bounding-box overlap
- Observatory Hill, Archive Street, Workshop Alley, and Waterside Play retain their geographic north / west / east / south relationship
- the central roads, plaza, bridge, and water layer visually continue across district boundaries
- all three Waterside Play buildings remain fully inside the city map bounds
- keyboard focus still advances through buildings and updates the inspector
- mobile 390 px keeps the Phase 3.2 stacked district layout and two-button MAP / WORKS switch
- desktop and mobile remain free of horizontal overflow and browser page errors
- contract, runtime, production build, JavaScript syntax, and diff checks remain green
