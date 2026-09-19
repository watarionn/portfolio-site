# Phase 3.9 - Interaction Prototype Plan

Updated: 2026-09-19
Status: isolated prototype plan; production runtime untouched

## Objective

Validate the new World Map interaction contract before final geography art or production migration.

The prototype answers only these questions:

1. Is the H2 published cluster readable at useful scale?
2. Does limited desktop pan feel like exploring a larger world without exposing empty reserve?
3. Can mobile reach all current districts with short pan rather than fit-to-world shrinkage?
4. Does World Map -> District View -> Building Preview -> Work intent feel understandable?
5. Can camera state be restored reliably on return?
6. Are keyboard and reduced-motion paths complete?

It does not judge final illustration quality.

## Isolation strategy

Build the prototype as a development-only static harness under:

`prototype/phase3-9-world-map/`

Planned files:

- `index.html`
- `prototype.css`
- `prototype.js`
- `README.md`

No production HTML, CSS, JavaScript, route, or deployment entrypoint is modified during the isolated prototype.

The harness may reuse existing accepted building assets by relative reference if convenient, but placeholders are preferred where asset coupling would distract from interaction testing.

## Prototype world model

Use the normalized H2 100 x 64 canvas from `phase3-9-h2-spatial-blueprint.md`.

District anchors:
- Archive: (35, 33)
- Observatory: (55, 20)
- Workshop: (63, 34)
- Waterside: (49, 47)

Use simple labeled regions / shapes for geography. Do not draw final coastline or terrain.

Represent:
- mainland,
- inlet / bay,
- highland belt,
- offshore reserve,
- F-A inland frontier,
- F-B coastal frontier,
- F-C offshore frontier,
- R2 cloud/frontier belt.

## Prototype states

### P0 World Map

Required:
- normalized map plane,
- four district hit regions,
- limited pan,
- current camera-state display in debug mode,
- frontier scenery that is visibly noninteractive.

Optional for first pass:
- wheel / trackpad zoom.

Do not make zoom a blocker. A fixed useful zoom plus pan is enough to validate the first contract.

### P1 District View

Selecting a district swaps to a simple district scene.

Each scene shows placeholder project buildings matching current counts:
- Observatory 3,
- Archive 4,
- Workshop 4,
- Waterside 3.

Each placeholder maps to a canonical existing work id / route.

Controls:
- previous district,
- next district,
- return to World Map.

### P2 Building Preview

Selecting a building opens a compact modal/popover-like preview containing:
- work name,
- one-line placeholder identity,
- Open Work intent button,
- close action.

During isolated testing, Open Work may display the canonical target route instead of navigating away. This prevents the prototype from coupling to production navigation before the interaction contract passes.

## Camera model

Store:
- centerX,
- centerY,
- zoom,
- lastDistrictId.

Fresh entry computes initial state from current published bounds plus frontier margin.

World -> District transition snapshots the World camera.

District -> World restores that snapshot.

Do not derive the camera from full Master World extent.

## Desktop input

Minimum prototype support:
- pointer drag to pan,
- click district to enter,
- Tab to focus districts and controls,
- Enter / Space to activate,
- Escape closes Building Preview,
- visible focus state.

Pan constraints stop before deep R3 reserve becomes an empty navigable zone.

## Mobile input

Minimum prototype support:
- touch/pointer pan,
- tap district to enter,
- tap building to preview,
- explicit World return control.

Test widths:
- 390px primary phone contract,
- 820px intermediate / tablet contract,
- 1440px desktop contract.

At 390px, do not require all four districts onscreen simultaneously.

## Reduced motion

Use a prototype-level media query for `prefers-reduced-motion: reduce`.

Normal mode may use a short transform/fade transition.

Reduced mode uses an immediate or short opacity state change. Focus must land at the same semantic destination in both modes.

## Debug overlay

Development harness may show:
- current state P0/P1/P2,
- camera center,
- zoom,
- selected district,
- saved camera state,
- viewport width,
- current reveal/frontier labels.

Debug information is prototype-only and never part of production design.

## Test scenarios

### T1 Desktop entry

At 1440px, all four districts are recognizable and at least two frontier types are hinted. Master World edges are not visible.

### T2 Desktop pan

Drag toward each allowed edge. Camera stops within the published-plus-frontier envelope and never reveals a meaningless empty reserve.

### T3 Keyboard

Starting from the World Map, reach and activate all four districts without a pointer. In District View, reach buildings and all navigation controls. Preview can be opened and closed.

### T4 Camera restoration

Pan away from initial center, enter any district, return to World. Camera center and zoom match the saved state within implementation rounding tolerance.

### T5 Mobile entry

At 390px, current districts remain visually useful. All four are reachable with short pan. The map is not globally shrunk to fit the Master World.

### T6 Mobile district flow

Tap district -> tap building -> Preview -> close -> return to World. No hover-only information is required.

### T7 Reduced motion

Repeat district entry and return with reduced motion enabled. Navigation remains complete and focus does not disappear.

### T8 Frontier semantics

Attempt interaction around F-A/F-B/F-C cloud glimpses. No unpublished district target is exposed.

## Pass criteria

Prototype passes only when:

- 4/4 current districts reachable on desktop,
- 4/4 current districts reachable at 390px,
- 14/14 work placeholders reachable through District Views,
- camera restoration passes for all four districts,
- keyboard route reaches all district and building targets,
- reduced-motion route is complete,
- no R2/R3 scenery is focusable as unpublished content,
- no horizontal page overflow is introduced by the harness,
- production runtime files remain unchanged.

## Implementation checkpoints

### CP1 Skeleton harness

Create isolated files, normalized map plane, four district regions, and debug overlay.

### CP2 Camera interaction

Add constrained desktop/mobile pan and camera save/restore.

### CP3 District flow

Add four District Views, 14 building placeholders, previous/next district controls, and World return.

### CP4 Preview and accessibility

Add Building Preview, keyboard behavior, focus management, and reduced-motion handling.

### CP5 Responsive QA

Run 390 / 820 / 1440 interaction checks and record findings.

### CP6 Prototype decision

Choose one of:
- PASS: interaction contract is ready for visual-world production planning,
- REVISE: update blueprint/wireframe and repeat only affected checkpoints,
- REJECT: architecture interaction needs a larger rethink.

## Safety boundary

This prototype must not:
- replace the production World Map,
- alter canonical work routes,
- regenerate accepted project-building art,
- lock final world-map geography,
- trigger production deployment,
- require GitHub Actions.

Use local validation and `[skip ci]` commits.

## Gate

Interaction Prototype Plan: **READY FOR CP1**

Next immediate step: implement **CP1 Skeleton harness** only. CP1 approval does not imply approval for CP2 or production migration.
