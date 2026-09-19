# Portfolio City Phase 3.9 - World Architecture Handoff

Updated: 2026-09-19
Branch: `phase3-9-world-scale-growth-model`
Draft PR: #100
Production migration: M6 CUTOVER GATE COMPLETE - HOLD FOR VISUAL APPROVAL (feature flag OFF)
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

### M5 COMPLETE - Visual Migration

Implemented as a reversible H2 structural visual layer behind the hard-disabled feature flag:
- 100 x 64 H2 logical world contract,
- four stable district anchors from the approved spatial blueprint,
- abstract mainland, southern inlet, highland, offshore-island, and frontier-cloud layers,
- F-A Inland / F-B Coastal / F-C Offshore frontier markers,
- keyboard-focusable World Map district targets,
- accepted building artwork remains isolated to District View and unchanged,
- no legacy terrain or accepted building assets removed or rewritten,
- no visitor-visible change while the feature flag is false.

This M5 slice deliberately uses CSS/DOM geography primitives rather than declaring any newly generated final-art asset production-approved.

Exact next checkpoint: **M6 Cutover Gate**. Compare old/new paths, verify rollback and production-like QA, and decide whether the hierarchy is ready to become the default. Do not remove the legacy path inside M6.

### M6 COMPLETE - Cutover Gate

Gate result: **HOLD FOR VISUAL APPROVAL**. Technical rollback/readiness checks pass, but the hierarchy is intentionally not enabled by default yet.

Verified:
- final pre-cutover / rollback baseline: `fa21e7fcf74b4598f5dd130a90ad8e016171af3e`,
- feature flag remains false,
- legacy cityMapViewport path remains present,
- new hierarchy shell remains hidden and aria-hidden while disabled,
- 14 unique canonical projects / 4 canonical districts / exactly one district membership each,
- canonical routes remain sourced from projects.json rather than duplicated into the controller,
- runtime / data contract / Phase 3.8 storybook checks pass,
- Headless Edge smoke passes at 1440x900, 820x900, and 390x844,
- no document-level horizontal overflow at those widths,
- no non-favicon SEVERE browser-console errors,
- legacy path is retained for at least one additional checkpoint.

Why HOLD instead of cutover:
- M5 geography is explicitly structural CSS/DOM study geometry, not approved final illustrated world art.
- Enabling it now would make a wireframe-quality H2 world visitor-visible before visual approval.
- Therefore M6 does not flip the feature flag and does not remove legacy runtime.

Exact next checkpoint: **M6.1 Visual Approval / Production Art Gate**. Review or create the actual H2 illustrated world presentation while keeping the current rollback baseline intact. Only after visual approval should a separate explicit cutover authorization flip the default hierarchy.

Do not flip the feature flag, merge, or deploy without explicit user approval.

### M6.1 DECISION LOCK - Master Grid

User-approved world-growth contract:
- Master Grid = **16 x 12 (192 cells)**,
- **1 cell = 1 district**,
- the grid is internal and visitor-invisible,
- undeveloped cells may remain the majority of the Master World,
- visitors see only the Published World / clickable vicinity rather than the full grid,
- a new district publishes one cell; projects added to an existing district remain inside its District View,
- camera framing must derive from published cells and frontier context, not the full 16 x 12 bounds,
- the earlier H2 100 x 64 coordinates are now composition-study evidence, not the canonical logical world coordinate system.

This decision is locked before further production-art work. No feature-flag flip, merge, or deployment is authorized by this decision alone.

## Safety / workflow

- Do not commit directly to main.
- Keep PR #100 Draft during prototype work.
- Do not merge or deploy without explicit user approval.
- Do not use metered GitHub Actions.
- Use local validation and `[skip ci]`.
- User approval to proceed means the immediate next checkpoint only.


### CP-D1 COMPLETE - Published Cluster / District Flow

The 16 x 12 Master Grid has now been translated into a stable launch-cluster topology.

Working district homes:
- Observatory Hill: H05
- Archive Street: G06
- Workshop Alley: I06
- Waterside Play: H07

Central Commons remains non-address connective geography rather than consuming a district cell.

Three expansion-front families remain open:
- F-A Inland / west-northwest
- F-B Coastal / south-southeast
- F-C Offshore / east

Future District 5 and District 6 should open on different fronts where their actual semantics allow it. Candidate frontier cells are reserves only; no future district identity is preassigned.

The visible world must not expose the 16 x 12 grid. Geography, roads, coastline, clouds, and district focal points may cross or offset within logical cell boundaries.

Detailed blueprint: `docs/phase3-9-master-grid-district-flow.md`

Exact next checkpoint: **CP-D2 Published Cluster Composition Test**. Produce a non-final visitor-view blockout that hides the grid, tests irregular H2-derived geography over the four stable homes, demonstrates F-A/F-B/F-C reveal directions, and compares desktop/mobile W0 camera framing. Do not create final production art or flip the feature flag.


### CP-D2 COMPLETE - Published Cluster Composition Test

A separate non-final visitor-view blockout now tests the locked 16 x 12 address topology without exposing grid cells.

Evidence:
- `prototype/phase3-9-composition-test/index.html`
- `prototype/phase3-9-composition-test/composition.css`
- `docs/phase3-9-published-cluster-composition-test.md`

Result: PASS.
- W0 homes remain H05 / G06 / I06 / H07.
- asymmetric mainland and southern inlet break the four-quadrant reading,
- Observatory retains a highland relationship,
- Waterside now reads against actual water,
- Archive / Workshop remain land-connected,
- Central Commons is subordinate seam geography,
- F-A Inland / F-B Coastal / F-C Offshore remain distinct,
- desktop shows cluster + frontier context,
- mobile intentionally crops at readable district scale for short-pan navigation,
- the 16 x 12 grid remains invisible in visitor view.

The blockout is reference evidence only, not production-approved final art.

Exact next checkpoint: **CP-D3 Geography Translation Blueprint**. Convert the accepted composition logic into a production-art specification covering land/water/highland silhouettes, route hierarchy, district focal envelopes, frontier/cloud behavior, responsive camera framing, and explicit visual anti-patterns. Do not generate/install final production art or flip the feature flag during CP-D3.


### CP-D3 COMPLETE - Geography Translation Blueprint

The accepted CP-D2 composition logic is now translated into an art-production specification.

Document:
- `docs/phase3-9-geography-translation-blueprint.md`

Locked guidance now covers:
- offset focal envelopes for H05 Observatory / G06 Archive / I06 Workshop / H07 Waterside,
- one irregular connected mainland,
- southern inlet explaining Waterside,
- northern highland gradient supporting Observatory,
- partial east/offshore geography for F-C,
- scenic route hierarchy that deliberately avoids grid-aligned cross roads,
- subordinate irregular Central Commons seam space,
- organic multi-depth frontier/cloud reveal,
- separate desktop/tablet/mobile W0 framing behavior,
- separable art-layer contract,
- explicit anti-pattern rejection list,
- acceptance gate for the first illustrated candidate.

CP-D3 result: **READY FOR ART BLOCKOUT**.

Exact next checkpoint: **CP-D4 World Art Blockout**. Create the first large-world visual candidate from the translation blueprint. Treat it as review/reference art until explicit visual approval. Do not flip the hierarchy feature flag, merge, deploy, or remove the legacy runtime during CP-D4.


### CP-D4A COMPLETE - Exact Master World Coordinate Overlay

The first generated Master World concept is now separated from the canonical coordinate system.

Canonical planning surface:
- exact 16 x 12 grid,
- A-P west-to-east,
- 01-12 north-to-south,
- 192 district addresses,
- H05 Observatory / G06 Archive / I06 Workshop / H07 Waterside highlighted exactly.

A pixel-exact planning/debug overlay was produced as `portfolio_city_master_world_16x12_exact_overlay.png`. The generated geography beneath it remains provisional; the coordinate overlay is authoritative. The final visitor view will not show grid lines or cell ids.

Detailed record:
- `docs/phase3-9-exact-master-world-overlay.md`

Exact next checkpoint: **CP-D4B Master World Terrain Zoning**. Classify the 192 cells only at coarse terrain level while intentionally retaining large undetermined frontier areas. Do not assign speculative future district identities, flip the feature flag, merge, or deploy.


### CP-D4B COMPLETE - Master World Terrain Zoning

The exact 16 x 12 Master World now has a coarse, intentionally revisable terrain zoning model.

Document:
- `docs/phase3-9-master-world-terrain-zoning.md`

Zone vocabulary:
SEA / COAST / LOWLAND / FOREST / HIGHLAND / COLD / DRY / FRONTIER plus the four published home cells.

Confidence is intentionally uneven:
- W0 published core = high confidence,
- F-A/F-B/F-C near frontier = medium confidence,
- far world = low confidence,
- many cells remain FRONTIER and can be redesigned before publication.

This is a planning layer, not a promise that future districts inherit the current far-world biome.

CP-D4B result: **PASS**.

Exact next checkpoint: **CP-D4C Exact Zoning Overlay**. Keep the deterministic 16 x 12 coordinate geometry and render zoning as a debug/design layer, separate from clean visitor art.


### CP-D4C COMPLETE - Master Map / Visitor World Separation

The world architecture is now explicitly split into three responsibilities:

1. **Master Map** - exact 16 x 12 authoring/debug coordinates, publication state, terrain zoning, frontier metadata.
2. **Visitor World** - continuous illustrated geography with no visible grid.
3. **Runtime Interaction Overlay** - clickable district geometry, focus/labels, camera anchors, project interaction.

Document:
- `docs/phase3-9-master-visitor-separation.md`

Current canonical homes remain:
- H05 Observatory Hill
- G06 Archive Street
- I06 Workshop Alley
- H07 Waterside Play

Only PUBLISHED cells become district navigation targets. Far-world cells remain mutable before publication. Desktop/tablet/mobile share one logical world and one visitor-art geography, while camera framing may differ.

CP-D4C result: **PASS**.

Exact next checkpoint: **CP-D4D Master World Data Contract**. Create an isolated machine-readable baseline for all 192 cells, carrying cell address, coarse terrain zone, publication state, and current district binding where applicable. Do not wire it into production runtime yet.


### CP-D4D COMPLETE - Master World Data Contract

A machine-readable 16 x 12 baseline now exists at:
- `prototype/phase3-9-world-data/master-world.v1.json`
- `docs/phase3-9-master-world-data-contract.md`

The JSON contains all 192 unique cells from A01 through P12 with coarse terrain, publication state, confidence, and current district binding only for the four published homes.

W0 published bindings remain exactly:
- H05 -> observatory
- G06 -> archive
- I06 -> workshop
- H07 -> waterside

The data remains isolated under `prototype/`; production runtime does not import it.

CP-D4D result: **PASS**.

Exact next checkpoint: **CP-D4E Data Validation + Coordinate Projection**. Add deterministic validation for the 192-cell contract and define logical-cell to normalized Visitor World coordinate projection without exposing grid visuals. Keep production cutover disabled.


### CP-D4E COMPLETE - Data Validation + Coordinate Projection

Isolated deterministic world-data validation and logical-to-normalized projection are now defined.

Files:
- `prototype/phase3-9-world-data/validate-master-world.js`
- `prototype/phase3-9-world-data/world-projection.v1.json`
- `docs/phase3-9-world-coordinate-projection.md`

Validation covers 16 x 12 dimensions, all 192 A01-P12 addresses, exactly four W0 published cells, unique district bindings, home-cell consistency, and absence of district bindings on unpublished cells.

Projection uses one shared normalized Visitor World coordinate space (top-left origin, x/y in 0..1) with per-district within-cell offsets. Desktop/tablet/mobile share these coordinates and differ only in camera framing.

CP-D4E result: **PASS**.

Exact next checkpoint: **CP-D4F Projection Visual QA**. Render deterministic W0 anchors/focal envelopes over the exact Master World and verify the projected positions against intended highland/inland/eastern-mainland/waterside geography before production-art binding.


### CP-D4F COMPLETE - Projection Visual QA

The CP-D4E normalized anchors were rendered against the exact Master World zoning reference and visually audited.

Document:
- `docs/phase3-9-projection-visual-qa.md`

Verified W0 anchors:
- Observatory H05 -> (0.47875, 0.36500)
- Archive G06 -> (0.39500, 0.46500)
- Workshop I06 -> (0.54250, 0.45500)
- Waterside H07 -> (0.47750, 0.55333)

Result: **PASS**. The offsets preserve the intended highland / western mainland / eastern mainland / waterside relationships and break exact grid-center symmetry without changing stable district addresses.

Exact next checkpoint: **CP-D4G Visitor Crop + Camera Anchor Contract**. Define deterministic desktop/tablet/mobile W0 entry framing and pan bounds from published anchors plus frontier context. Keep final-art binding and production cutover disabled.


### CP-D4G COMPLETE - Visitor Crop + Camera Anchor Contract

W0 entry framing is now deterministic and machine-readable.

Files:
- `prototype/phase3-9-world-data/world-camera.v1.json`
- `docs/phase3-9-visitor-camera-contract.md`

Published projected envelope:
- x 0.39500 .. 0.54250
- y 0.36500 .. 0.55333

Entry cameras intentionally include frontier context but never the entire 16x12 world. Desktop/tablet/mobile share one world coordinate model. Mobile prioritizes readable districts and short pan rather than shrinking the full cluster.

CP-D4G result: **PASS**.

Exact next checkpoint: **CP-D4H World Reveal / Frontier Contract**. Define publication-driven reveal behavior for clean Visitor World art and cloud/frontier masks. Unpublished geography remains scenery, not disabled district UI. Keep production feature flag disabled.


### CP-D4H COMPLETE - World Reveal / Frontier Contract

Publication-driven local reveal is now defined.

Files:
- `prototype/phase3-9-world-data/world-reveal.v1.json`
- `docs/phase3-9-world-reveal-frontier-contract.md`

Key lock:
- no rectangular/game-like fog-of-war,
- clouds/frontier are scenery, never disabled district UI,
- only PUBLISHED cells receive district interaction,
- nearby unpublished terrain may be visible but remains non-interactive,
- publishing one cell reveals/refines only a local neighborhood and does not publish neighbors,
- reveal masks are organic and may cross cell boundaries,
- existing published anchors never move during expansion.

W0 expansion fronts F-A Inland, F-B Coastal, and F-C Offshore retain distinct reveal semantics.

CP-D4H result: **PASS**.

Exact next checkpoint: **CP-D4I World Asset Tiling / Expansion Strategy**. Define maintainable Visitor World art regions/tiles so future local district reveals can update a small area without replacing one monolithic world image. Keep production feature flag disabled.


### CP-D4I COMPLETE - Single Master Artwork / Deterministic Tile Slicing

User-approved asset strategy is now locked:

**Author one continuous Master World illustration -> slice deterministically into 16 x 12 -> serve 192 runtime terrain tiles.**

Document:
- `docs/phase3-9-master-artwork-tile-slicing.md`

Key rules:
- never author the 192 terrain cells independently,
- exact slicing preserves coastline/road/ridge/palette continuity,
- runtime tile IDs map directly to A01-P12,
- master source dimensions must be divisible by 16 x 12,
- terrain edits happen in the Master source first,
- hash comparison allows only changed tiles to be replaced after a revision,
- frontier/clouds, buildings, labels, hitboxes, and debug grid remain separate layers,
- runtime consumes optimized tiles, not the huge authoring source.

CP-D4I result: **PASS**.

Exact next checkpoint: **CP-D4J Tile Export Contract + Prototype Slicer**. Define the manifest and build an isolated deterministic slicer that validates dimensions, emits A01-P12, hashes outputs, and reports changed tiles. Do not bind to production runtime yet.


### CP-D4J COMPLETE - Tile Export Contract + Prototype Slicer

Implemented:
- `tools/world-tiles/slice-master-world.py`
- `tools/world-tiles/manifest-contract.v1.json`
- `tools/world-tiles/README.md`
- `docs/phase3-9-tile-export-prototype.md`

The authoring tool rejects invalid Master dimensions, slices exactly 16 x 12, emits A01-P12, hashes each runtime tile, writes a manifest, and can report changed tiles against a previous manifest.

Synthetic 1600 x 1200 geometry smoke test produced 192 cells at 100 x 100 with complete A01-P12 coverage and 192 unique output hashes.

CP-D4J result: **PASS**.

Exact next checkpoint: **CP-D4K Real Master Source Specification + Export Trial**. Select practical Master source resolution candidates divisible by 16 x 12, evaluate tile density/runtime weight, define source retention/versioning, then run the slicer on the first real Master World artwork when ready. Production remains untouched.


### CP-D4K COMPLETE - Real Master Source Specification + Export Trial

First production-art source baseline is locked:

**8192 x 6144 px -> 16 x 12 -> 192 source tiles @ 512 x 512 px**

Files:
- `docs/phase3-9-master-source-spec.md`
- `prototype/phase3-9-world-data/master-source.v1.json`

A real-size geometry trial verified exact 512 x 512 representative crops for H05, G06, I06, and H07. The giant authoring source will not be required as a runtime download; runtime uses optimized sliced tiles.

The architecture remains resolution-independent, so a later higher-resolution Master can be adopted if real-art QA demonstrates a need.

CP-D4K result: **PASS**.

Exact next checkpoint: **CP-D4L Master Artwork Production Blueprint**. Convert zoning, W0 geography, reveal/frontier rules, source dimensions, and layer separation into the final clean-terrain art brief before producing the real Master World artwork.
