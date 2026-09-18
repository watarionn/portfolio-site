# Phase 3.9 Interaction Prototype

Development-only interaction prototype for Portfolio City.

## Scope

CP1 established the normalized H2 world plane and four current district hit regions.

CP2 added constrained pointer/touch/keyboard camera interaction plus camera snapshot / restore.

CP3 adds the first complete World Map -> District View -> World Map flow while keeping Building Preview and production routing out of scope.

CP3 includes:
- four placeholder District Views,
- current project counts of Observatory 3 / Archive 4 / Workshop 4 / Waterside 3,
- 14 project-building placeholders mapped one-to-one to the canonical project ids and routes,
- authored district sequence Archive -> Observatory -> Workshop -> Waterside -> Archive,
- previous / next district navigation,
- explicit Return to World,
- restoration of the camera snapshot captured immediately before district entry,
- keyboard focus return to the district that was active.

Still not included:
- Building Preview,
- opening canonical Work routes from the prototype,
- production runtime migration,
- final illustrated geography or district art.

## Run

Open `index.html` directly in a browser or serve this directory with any local static server.

This directory is isolated from the production runtime.
