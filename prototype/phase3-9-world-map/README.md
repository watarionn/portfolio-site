# Phase 3.9 Interaction Prototype

Development-only interaction prototype for Portfolio City.

## Scope

CP1 established the normalized H2 world plane and four current district hit regions.

CP2 added constrained pointer/touch/keyboard camera interaction plus camera snapshot / restore.

CP3 added the first complete World Map -> District View -> World Map flow.

CP4 adds Building Preview as a third prototype state while keeping production routing disabled.

CP3 includes:
- four placeholder District Views,
- current project counts of Observatory 3 / Archive 4 / Workshop 4 / Waterside 3,
- 14 project-building placeholders mapped one-to-one to the canonical project ids and routes,
- authored district sequence Archive -> Observatory -> Workshop -> Waterside -> Archive,
- previous / next district navigation,
- explicit Return to World,
- restoration of the camera snapshot captured immediately before district entry,
- keyboard focus return to the district that was active.

CP4 includes:
- selecting any of the 14 project-building placeholders,
- a modal Building Preview carrying canonical project id, title, and route,
- Back to District, backdrop click, and Escape close paths,
- focus restoration to the selected building,
- an Open Work affordance that exposes the canonical route contract without navigating.

Still not included:
- opening canonical Work routes from the prototype,
- production runtime migration,
- final illustrated geography or district art.

## Run

Open `index.html` directly in a browser or serve this directory with any local static server.

This directory is isolated from the production runtime.


## CP5 closure

CP5 audits the complete isolated interaction contract before production migration planning.

Closure requirements:
- desktop pointer pan and mobile touch pan share the constrained camera path,
- keyboard arrow pan remains available from the World Map viewport,
- all four districts and all 14 canonical project contracts remain reachable,
- Building Preview closes by Back to District, backdrop click, or Escape,
- modal Tab focus is contained inside Building Preview,
- closing a preview restores focus to the originating building,
- Return to World restores the pre-entry camera snapshot and district focus,
- reduced-motion media handling remains present,
- Open Work remains inert until production migration.
