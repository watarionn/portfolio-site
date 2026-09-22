# Phase 3.9 Production Migration Plan

Status: PLAN READY FOR REVIEW
Production runtime: UNCHANGED
Source prototype: CP5 closed interaction contract

## Migration principle

Do not replace the accepted Portfolio City in one jump. Introduce the World Map hierarchy as a staged shell around existing canonical data and accepted art. Each stage remains reversible until its gate passes.

Production hierarchy:
World Map -> District View -> Building Preview -> canonical Work route.

projects.json remains canonical for project id, district membership, title, summary, and route. districts.json remains canonical for district metadata. Existing accepted building artwork is reused rather than regenerated.

## Proposed module boundaries

Keep the current entry files stable while extracting behavior behind small modules:
- portfolio-city/index.html: semantic World, District, Preview containers and accessible controls.
- portfolio-city/city.js: bootstrap, data loading, compatibility bridge, top-level state orchestration.
- portfolio-city/world-map.js: camera, pan constraints, district entry, snapshot/restore.
- portfolio-city/district-view.js: district rendering, previous/next navigation, accepted building placement.
- portfolio-city/building-preview.js: modal preview, focus containment/restoration, Escape/backdrop/back, Open Work.
- portfolio-city/city.css: shared shell and responsive interaction styles.
- portfolio-city/district-art.css: accepted district/building art styling only.
- portfolio-city/data/world-map.json: future H2 geometry/reveal metadata, separate from project content.

Do not duplicate project routes or titles into world-map geometry data.

## Accepted artwork reuse

Existing assets under assets/illustrated/ and current building SVG fallbacks remain authoritative during migration.

Migration order:
1. wire existing project assets into District View,
2. preserve fallbacks for placements without illustrated WebP art,
3. migrate geography independently from building artwork,
4. do not regenerate accepted buildings merely to fit the new hierarchy.

## State contract

Use one explicit application state:
- level: world | district | preview
- activeDistrictId
- activeProjectId
- worldCamera: x / y / zoom
- savedWorldCamera
- returnFocusId

World -> District snapshots camera and district focus.
District -> Preview records the originating building.
Preview -> District restores originating building focus.
District -> World restores saved camera and district focus.
Preview -> Open Work uses the selected project's canonical route from projects.json.

Browser history is not required for the first migration slice.

## Camera migration

Do not copy CP5 prototype coordinates directly into production. The H2 normalized plane is the interaction contract, while current map-layout.json is legacy production geography.

Use a geometry adapter:
1. retain current production camera as rollback baseline,
2. add H2 world geometry behind a feature flag,
3. validate desktop and mobile initial crops,
4. switch only after visual QA,
5. remove legacy geometry in a later cleanup checkpoint.

Pointer/touch pan, arrow-key pan, clamp behavior, snapshot/restore, and resize re-clamp must match CP5 semantics.

## Open Work integration

Building Preview resolves the selected project from canonical projects.json. Production Open Work uses that record's route unchanged. Routes are never reconstructed from project ids. Existing work pages therefore require no migration.

Validate all 14 route strings before enabling navigation.

## Staged implementation gates

### M1 Production shell
Add World / District / Preview containers and state controller behind a disabled feature flag. No visible production change.
Gate: current UI and runtime contracts remain unchanged with flag off.

### M2 World interaction
Port camera/pan/district-entry behavior without replacing accepted art.
Gate: 1440, 820, 390; pointer/touch/keyboard; no horizontal document overflow.

### M3 District View
Render four districts from canonical data and reuse accepted building artwork/fallbacks.
Gate: 4 districts, 14 projects, canonical membership, district cycle, camera/focus return.

### M4 Building Preview + Open Work
Port CP5 modal behavior and enable canonical route navigation.
Gate: Escape/backdrop/back, Tab containment, focus restoration, all 14 canonical routes.

### M5 Visual migration
Introduce approved H2 geography/frontier art in slices while keeping buildings stable.
Gate: district readability, scale consistency, no accepted-building regressions, responsive visual QA.

### M6 Cutover gate
Enable the hierarchy by default only after old/new comparison and rollback verification.
Gate: runtime/contract/storybook checks, browser smoke, route smoke, accessibility smoke, production-like staging QA.

Legacy code removal happens after cutover, never inside M6.

## Rollback strategy

Until M6:
- old production map remains intact,
- new hierarchy is feature-flagged,
- data schemas stay backward-compatible,
- accepted art paths remain unchanged.

Rollback is a flag/config reversal rather than a destructive code revert. At M6, record the final pre-cutover commit SHA and retain the legacy path for one additional checkpoint.

## QA matrix

Required widths: 1440, 820, 390.

Required interactions: pointer drag, touch drag, keyboard arrow pan, district keyboard activation, Preview Tab/Shift+Tab, Escape, Back to District, Return to World, Open Work.

Required data assertions: 4 districts, 14 current projects, canonical 3/4/4/3 membership, unchanged routes, unique project ids, exactly one district per project.

Required regression checks: current runtime contract, project/district/chunk contract, Phase 3.8 storybook detail contract, no document-level horizontal overflow, no console errors, reduced-motion path.

## First implementation checkpoint

Next checkpoint after plan approval: M1 Production Shell.

M1 may add production files and inert containers behind a disabled feature flag, but must not change the visitor-visible production experience. No merge or deployment is included without separate approval.
