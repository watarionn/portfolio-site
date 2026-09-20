# Phase 4.0 Production Closure

Status: CLOSED / production verified

## Release
- PR #103 "Phase 4.0: Master World UI composition" merged to main.
- Merge commit: e208b1a4dbaff4b14f2478cc50a3dd85854af210.
- Production workflow run: 35484971960, run number 21.
- Attempt 1 passed validation but the FTPS mirror step hit max-retries and failed.
- Failed jobs were rerun without code changes.
- Attempt 2 completed successfully.
- The successful deploy job completed the FTPS transfer, temporary credential cleanup, published-page verification, root 404 verification, and CHARACTER retirement verification.

## Production target
https://cf278796.cloudfree.jp/portfolio-city/city.html

## Production browser verification
QA executed after the successful Phase 4 files were visible in production.

Targets:
- desktop: 1440x1000 browser window
- tablet: 820x900 browser window
- mobile: exact 390x844 Chrome mobile emulation

Verified at all three targets:
- one worldHierarchyShell
- zero legacy cityMap elements
- one world-map-frame
- one world-h2-viewport
- PORTFOLIO CITY / WORLD MAP heading
- 192 Master World tile elements
- four district markers
- data-terrain-bound=true
- no horizontal document overflow
- no application console errors
- keyboard camera pan changes x from 0 to -36px
- district click opens the district card while level remains world
- district card stays inside the world viewport
- Escape closes the card and restores focus to the originating marker
- 地区を見る enters District View
- project selection opens Project Preview
- Escape returns Project Preview to District View
- 世界地図へ戻る restores World View
- saved world camera is restored at x=-36px

## Production evidence
- docs/phase4-production-1440.png
- docs/phase4-production-820.png
- docs/phase4-production-390.png

## Accepted Phase 4 behavior
The Master World is now the single MAP surface. The retired city-map presentation and public world39 presentation switch are not part of the production UI.

The MAP heading is intentionally compact so the map is the main visual subject. The world viewport is presented inside the responsive frame treatment. District markers open an orientation card before entering the district. On mobile, the district card uses the visible world viewport to avoid overlap with the fixed bottom navigation.

Master World terrain coordinates, 192-tile topology, district anchor cells, camera pan, and camera restoration remain unchanged.

## Closure decision
Phase 4.0 World UI Composition is accepted as production-complete.

Further work should start from this production baseline as visual polish, district-content refinement, or a new explicitly named phase. Reopen Phase 4.0 only for a confirmed production regression.
