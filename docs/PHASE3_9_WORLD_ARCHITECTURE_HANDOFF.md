# Portfolio City Phase 3.9 - World Architecture Handoff

Updated: 2026-09-19
Branch: `phase3-9-world-scale-growth-model`
Draft PR: #100
Production migration: M4 BUILDING PREVIEW + OPEN WORK COMPLETE (feature flag OFF)
Production deploy: NOT performed

## Current objective

Redesign Portfolio City around a large illustrated World Map:

World Map -> District View -> Building Preview -> canonical Work route.

The World Map is a continuous illustrated world with a hidden logical coordinate system. Current districts occupy a readable published cluster while clouded frontier geography implies a much larger world that can reveal locally as future districts are added.

## Decisions already adopted

- New projects normally enter an existing District View and do not expand World Map geography.
- Current districts should absorb at least two additional projects before expansion pressure alone creates a new district.
- Immediate capacity target is 22 projects across the existing four districts.
- The master world must support 7-9 districts comfortably and retain reserve for 10+ without relocating published district anchors.
- Initial camera shows the current published cluster plus nearby frontier, never the whole master world.
- Desktop and mobile share world coordinates but may use different entry framing.
- Mobile must keep districts readable and use short pan instead of shrinking the entire world to fit.
- Cloud/frontier is scenery, not fake disabled district UI.
- Central Commons is not forced to be a fifth district.
- Existing accepted project-building artwork remains reusable and must not be casually regenerated.
- Existing 14 canonical work routes remain canonical.

## Selected geography family

H2 Mainland + Archipelago Hybrid.

Core geography:
- one dominant connected mainland,
- asymmetric coastline,
- meaningful peninsula/coastal projection,
- nearby islands without isolating every current district,
- meaningful internal/coastal water,
- highland support for Observatory,
- future expansion possible over both land and water.

Expansion fronts:
- F-A Inland
- F-B Coastal
- F-C Offshore

## H2 normalized spatial blueprint

Study canvas: 100 x 64. This is a logical design coordinate system, not a final asset ratio.

Current stable district home anchors:
- Archive Street: (35, 33)
- Observatory Hill: (55, 20)
- Workshop Alley: (63, 34)
- Waterside Play: (49, 47)

Study envelopes:
- Archive: x27-43 / y26-40
- Observatory: x47-64 / y12-27
- Workshop: x55-72 / y27-42
- Waterside: x40-59 / y40-55

Central Commons study zone: x45-54 / y31-38.

Frontier corridors:
- F-A Inland: x18-30 / y20-34
- F-B Coastal: x58-75 / y43-55
- F-C Offshore: x73-90 / y31-48

Desktop initial camera study crop: x20-80 / y9-58.
This is a composition guide, not a hard-coded final crop.

## Interaction contract

Hierarchy:

World Map
-> select district
-> District View
-> select project building
-> Building Preview
-> Open Work
-> canonical Work route

Returning from District View to World Map restores the previously saved World Map camera rather than resetting entry framing.

District View includes previous / next district navigation and an explicit return-to-world control.

Working W0 district navigation sequence:
Archive -> Observatory -> Workshop -> Waterside -> Archive.

This sequence is still a wireframe default and can be revised after composition testing.

Desktop:
- pointer pan,
- keyboard-accessible district targets,
- limited camera range,
- optional zoom later.

Mobile:
- touch pan,
- no hover dependency,
- readable district scale,
- short travel among current districts.

Reduced-motion navigation is part of the contract.

## Isolated interaction prototype

Location:

`prototype/phase3-9-world-map/`

Files:
- `index.html`
- `prototype.css`
- `prototype.js`
- `README.md`

This prototype is intentionally isolated. It does not replace production Portfolio City runtime.

### CP1 COMPLETE - Skeleton Harness

Implemented:
- normalized H2 world plane,
- abstract mainland / bay / highland / offshore study masses,
- four current district hit regions at H2 anchors,
- F-A / F-B / F-C markers,
- noninteractive cloud/frontier scenery,
- keyboard-focusable district targets,
- debug overlay.

Commit: `b5d5c02`

### CP2 COMPLETE - Camera Interaction

Implemented:
- constrained pointer / touch pan,
- arrow-key pan when viewport is focused,
- camera center debug display,
- Snapshot / Restore / Reset debug controls,
- automatic camera snapshot on district selection,
- resize camera re-clamping,
- responsive 390px / 1440px render smoke generation during QA.

Commit: `c9ff501`

Production runtime files remain unchanged.

### CP3 COMPLETE - District Flow

Implemented:
- World Map district selection enters one of four placeholder District Views,
- current project counts remain Observatory 3 / Archive 4 / Workshop 4 / Waterside 3,
- all 14 placeholders map one-to-one to the existing canonical project ids/routes,
- previous / next navigation uses Archive -> Observatory -> Workshop -> Waterside -> Archive,
- explicit Return to World restores the camera snapshot captured before district entry,
- focus returns to the active district target,
- Building Preview remains deferred to CP4,
- production runtime remains untouched.

Commit: `dd54265`

### CP4 COMPLETE - Building Preview

Implemented:
- all 14 project-building placeholders are interactive controls,
- selecting a building opens P2 Building Preview,
- preview carries canonical project id, title, and route,
- Back to District, backdrop click, and Escape return to the same District View,
- focus returns to the building that opened the preview,
- Open Work is defined as an inert affordance that exposes the canonical route contract without navigating,
- production runtime remains untouched.

Commit: `ee97ab1`

### CP5 COMPLETE - Interaction Prototype Closure / Migration Readiness Gate

Audit result: READY FOR MIGRATION PLANNING, with production migration still not started.

Closure work:
- added modal Tab focus containment discovered during CP5 accessibility audit,
- verified pointer/touch camera path, keyboard arrow pan, Escape/back paths, focus restoration, and reduced-motion contract,
- verified all 4 districts and all 14 canonical project id/title/route mappings,
- responsive desktop/mobile smoke checks completed against the isolated prototype,
- Open Work remains inert and canonical routes remain unchanged,
- production runtime remains untouched.

Commit: `55acec1`

## QA state at handoff

Passed through CP5:

- `node --check prototype/phase3-9-world-map/prototype.js`
- `git diff --check`
- `node tools/check_portfolio_city_runtime.mjs`
- `python tools/check_portfolio_city_contract.py`
- `python tools/check_portfolio_city_phase38_storybook_details.py`
- CP2 camera interaction/isolation contract
- CP3 district-flow structure checked against the 4-district / 14-project canonical data contract
- CP4 preview contract keeps all canonical routes inert inside the isolated prototype
- CP5 modal focus containment and responsive interaction smoke audit

Existing runtime contract remains:
- 13 chunks
- 4 districts
- 14 world placements
- negative origin
- navigation / keyboard / visited state

No production deployment has been performed for Phase 3.9.

## Relevant design documents

Read these in order when resuming:

1. `docs/phase3-9-world-scale-growth-model.md`
2. `docs/phase3-9-world-topology-candidate-study.md`
3. `docs/phase3-9-hybrid-world-composition-blueprint.md`
4. `docs/phase3-9-world-geography-skeleton-study.md`
5. `docs/phase3-9-h2-spatial-blueprint.md`
6. `docs/phase3-9-world-map-interaction-camera-wireframe.md`
7. `docs/phase3-9-interaction-prototype-plan.md`
8. this handoff

The previous Phase 3.9 runtime locks remain documented in `docs/PHASE3_9_HANDOFF.md`; treat them as constraints of the current production runtime, not as a requirement to preserve the old 13-chunk topology in the new architecture.

## Exact next step

**Production Migration Plan**

Translate the now-closed isolated interaction contract into a production-safe implementation plan before touching the live Portfolio City runtime.

The plan must define:
1. production state hierarchy and file/module boundaries,
2. reuse path for accepted district/building artwork,
3. canonical route integration for Open Work,
4. camera/state/focus migration strategy,
5. staged QA and rollback gates.

Production Migration Plan completed in `docs/phase3-9-production-migration-plan.md`.

Plan status: READY FOR REVIEW. Production runtime remains untouched.

Exact next checkpoint: **M1 Production Shell**. Add the new state shell behind a disabled feature flag with no visitor-visible production change.

### M1 COMPLETE - Production Shell

Implemented behind a hard-disabled feature flag:
- inert World / District / Preview semantic containers in production city.html,
- shell controller loaded before city.js with defer,
- isolated world-hierarchy-shell.js state controller,
- explicit world/district/preview level state,
- active district/project, camera snapshot, and return-focus state slots,
- no integration with current city.js behavior,
- no visitor-visible change while the flag is false.

Exact next checkpoint: **M2 World Interaction**. Port the CP5 World camera and district-entry interaction behind the same disabled feature flag.

### M2 COMPLETE - World Interaction

Implemented behind the same hard-disabled feature flag:
- camera set/pan/clamp state contract,
- camera snapshot and restore,
- district entry snapshots World camera and switches state to District,
- Return to World restores saved camera,
- pointer/touch pan binding helper,
- viewport arrow-key pan binding helper,
- all handlers are inert while the feature flag is false,
- no current city.js integration and no visitor-visible change.

Exact next checkpoint: **M3 District View**. Render the four canonical districts and 14 project-building entries inside the disabled hierarchy shell while reusing accepted artwork/fallback contracts.

### M3 COMPLETE - District View

Implemented behind the same hard-disabled feature flag:
- canonical projects.json / districts.json / map-layout.json loading path,
- four District Views driven from canonical district metadata,
- 14 project-building controls driven from canonical project records,
- illustrated asset reuse from existing map-layout placements,
- explicit fallback marker for projects without accepted illustrated assets,
- Archive -> Observatory -> Workshop -> Waterside district cycle,
- previous / next / Return to World controls,
- no duplicated project titles or routes in the new controller,
- no visitor-visible change while the feature flag is false.

Exact next checkpoint: **M4 Building Preview + Open Work**. Port the CP5 preview modal contract and resolve Open Work directly from canonical projects.json routes.

### M4 COMPLETE - Building Preview + Open Work

Implemented behind the same hard-disabled feature flag:
- project-building selection opens a modal Building Preview,
- preview content resolves directly from canonical projects.json,
- Open Work href uses the selected project's canonical route unchanged,
- Back to District and Escape close Preview,
- Tab / Shift+Tab focus containment,
- focus restoration to the originating project building,
- preview dialog semantics and labelled title,
- no route reconstruction or duplicated route table,
- no visitor-visible change while the feature flag is false.

Exact next checkpoint: **M5 Visual Migration**. Introduce the approved H2 geography/frontier visual structure in reversible slices while keeping accepted buildings stable.

Do not start M5 without the next explicit user approval.

## Safety / workflow

- Do not commit directly to main.
- Keep PR #100 Draft during prototype work.
- Do not merge or deploy without explicit user approval.
- Do not use metered GitHub Actions.
- Use local validation and `[skip ci]`.
- User approval to proceed means the immediate next checkpoint only.
