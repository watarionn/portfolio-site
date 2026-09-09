# Stage 9 MADORI page audit

Status: audit complete, implementation not started

## Goal

Turn MADORI from a capable full-screen editor that happens to be linked from the portfolio into a portfolio project page that immediately communicates the work, preserves the editor, and explains the engineering behind it.

## Current strengths

The current project already has a substantial editing engine and should be evolved rather than rewritten.

- 2D canvas editor with pan and zoom
- room templates and furniture templates
- user-defined room/furniture types
- drag positioning
- eight-direction resize handles
- wall draw and wall erase tools
- optional grid snapping
- selected-object inspection and deletion
- PNG export
- JSON save/load including custom templates
- responsive mobile bottom drawer
- Three.js 3D reconstruction
- 3D camera rotation, zoom and pan
- floor/ceiling display options
- wall height, camera distance, elevation and ambient-light controls
- 3D PNG export
- seeded example layout so the page is not initially empty

## Main problem

The product is stronger than its presentation.

The first screen is almost entirely an application workspace. A first-time portfolio visitor sees controls and a floor plan, but receives little explanation of:

- what problem the tool solves
- what the author implemented
- which interactions are available
- why the 2D/3D relationship is technically interesting
- what engineering decisions are worth inspecting

The project currently behaves like a deployed utility, not like a portfolio case study.

## High-priority findings

### P0: the page cannot currently contain a case study

`body` is fixed to `100svh` with `overflow: hidden`. The editor owns the entire viewport. This prevents a normal document flow with a project introduction above the workspace and engineering notes below it.

Recommended change:

- restore normal page scrolling
- place the editor inside a dedicated workspace section with a bounded desktop height
- keep an immersive/full-screen option for users who want the original editor experience

### P0: the project has no strong portfolio introduction

The top bar only exposes Home / 2D / 3D. The page needs an editorial project header before the workspace.

Recommended header content:

- project number / category
- title: 間取図メーカー
- one-sentence value proposition
- compact technology list: Canvas / JavaScript / Three.js / JSON
- CTA: エディタを試す
- secondary CTA: 3D表示を見る
- short note explaining that the same data model drives both 2D editing and 3D reconstruction

### P0: interaction affordances are discoverable only after experimentation

The initial example layout is useful, but the page does not explain that rooms and furniture can be dragged, resized and persisted.

Recommended onboarding:

- a compact first-run guide inside the workspace
- four short actions: select, move/resize, add, switch to 3D
- make the guide dismissible and non-blocking
- add explicit Reset demo / Fit view actions

### P1: important editor controls are visually too small

The desktop sidebar uses many labels around 0.58rem to 0.70rem. This keeps the panel compact, but makes a dense tool look more difficult than it is.

Recommended change:

- raise control text and button labels to a more readable range
- strengthen grouping hierarchy instead of relying on tiny typography
- distinguish Add, Edit, View and Save groups more clearly

### P1: mobile works, but the workspace hierarchy is not ideal

The responsive bottom drawer is a good foundation. However, an 80svh drawer plus the floating `＋ 追加` action makes the editor feel dominated by the panel once opened.

Recommended change:

- keep the bottom-sheet model
- provide compact category tabs or accordion groups inside the sheet
- keep only contextually important controls visible
- preserve more canvas height while editing

### P1: tab semantics are incomplete

The 2D / 3D controls use `role="tab"` and `aria-selected`, but they are `div` elements and do not currently implement keyboard tab behavior.

Recommended change:

- use real buttons for tabs
- add ArrowLeft / ArrowRight keyboard behavior when treated as a tablist
- connect `aria-controls`, `aria-selected` and focus state consistently

### P1: core canvas operations are pointer-first only

The canvas editor itself is not keyboard-operable. Full keyboard parity for a freeform canvas is a larger project, but the surrounding controls should still be accessible.

Recommended minimum:

- keyboard-operable tool switching
- keyboard-operable tabs
- visible focus states for all controls
- deletion via keyboard when an object is selected
- escape to clear selection / close mobile drawer
- concise accessible instructions near the canvas

### P1: 3D auxiliary light initialization contains a code defect

The expression used to create the secondary directional light sets the position on one instance, then adds a different newly-created light to the scene through the `&&` expression.

Recommended fix:

```js
const fillLight = new THREE.DirectionalLight(0xffe8c0, 0.3);
fillLight.position.set(-200, 200, -200);
scene3.add(fillLight);
```

This is a small isolated correction and can be included with the page redesign.

## Secondary findings

- JSON export creates an object URL but does not revoke it. Low severity, easy cleanup.
- dimensions are displayed as `px`, which exposes implementation units rather than user-facing spatial units. Consider calling them grid units or introducing an optional unit scale later.
- no Undo / Redo exists. This is one of the most valuable future editor improvements, but it should not block the first portfolio redesign.
- no explicit Clear layout action exists.
- no Fit to content / Recenter action exists even though pan and zoom are supported.
- Three.js r128 is loaded from a CDN. Avoid an opportunistic dependency upgrade during the first redesign; isolate that as a later compatibility task.
- the seeded demo is useful and should be retained.

## Refero research takeaways

The research pass focused on real web-app editing, dashboard and workspace patterns rather than generic portfolio styling.

Patterns to adopt:

- separate product explanation from the interactive workspace
- let the workspace remain visually dominant once the visitor reaches it
- use a persistent or well-defined tool surface rather than floating many unrelated controls
- reduce control density through grouping and progressive disclosure
- make empty/demo states teach the primary action
- pair a strong product preview with concise explanatory copy

Patterns to avoid:

- turning the editor into a decorative mockup
- wrapping every control in card UI
- hiding the actual working tool behind a marketing landing page
- adding motion that delays entering the editor

The existing paper/mincho/vermilion/cobalt visual language should remain, but the composition should follow the newer Stage 9 editorial homepage: stronger whitespace, hairline rules, larger type and clearer hierarchy.

## Proposed page architecture

1. Portfolio breadcrumb / back to project index
2. Project hero
3. Short project facts and technical thesis
4. Interactive workspace
5. How to use it
6. Core capabilities
7. Architecture / data flow
8. Implementation highlights
9. Limitations and next improvements
10. Related projects / back to portfolio

The most important architectural sentence for the page should be:

> A single editable floor-plan data model drives both the 2D canvas editor and the Three.js 3D reconstruction.

## Implementation slices

### Slice A: portfolio framing

- normal document scroll
- project hero
- workspace wrapper
- portfolio navigation
- case-study sections below the editor
- preserve all existing editor behavior

### Slice B: editor usability

- readable control sizing
- workspace onboarding
- Reset demo
- Clear layout
- Fit view / recenter
- improved mobile bottom sheet grouping
- keyboard-correct 2D/3D tabs

### Slice C: technical cleanup

- fix secondary directional light
- revoke generated object URLs
- small accessibility/state cleanup
- add regression checks for existing save/load and 2D/3D switching

### Slice D: later editor evolution

Not required for the first redesign:

- Undo / Redo
- real-world unit scale
- richer wall/opening model
- keyboard manipulation of canvas objects
- Three.js dependency modernization

## Decision

Proceed with Slice A first.

The editor implementation is already strong enough to feature. The first redesign should therefore avoid changing its underlying interaction model and instead create a portfolio-quality shell around the working application. After that foundation is visually verified on desktop and mobile, Slice B can improve the editor itself.

## Slice A implementation status

Implemented on the Stage 9 MADORI branch:

- editorial project hero and project metadata
- scrollable overview before the live editor
- live workspace framed as the central artifact
- feature ledger covering 2D, 3D, save/restore, and PNG output
- architecture section documenting the shared state model
- three-step usage guide and related-work navigation
- responsive framing that keeps the existing mobile editor drawer inside the workspace rather than attaching it to the whole page
- reduced-motion handling for the new page-level transitions

Verification completed against the branch implementation:

- desktop visual review at 1440px
- mobile viewport review at 390px with no horizontal overflow
- existing room-add flow still updates selection state
- 2D -> 3D -> 2D switching still works
- Three.js canvas initializes at non-zero size on mobile

Slice B remains intentionally separate so editor usability changes can be reviewed independently from the portfolio framing.

## Slice B implementation status

Implemented on the same Stage 9 MADORI branch:

- first-run three-step workspace guide with dismiss persistence
- `全体表示` automatic fit-to-content control
- destructive `デモに戻す` and `空にする` actions with confirmation
- deterministic demo restoration for room/furniture templates and seeded layout
- mobile control grouping into `追加 / 編集 / 保存`
- keyboard-correct 2D / 3D tab buttons with Arrow, Home, and End handling
- responsive placement for the new utility controls and guide

Regression verification:

- seeded state restores to 6 rooms and 4 furniture items
- clear layout produces 0 rooms, 0 furniture items, and 0 walls
- fit view recalculates pan/zoom from current content bounds
- ArrowRight switches focus and view from 2D to 3D; ArrowLeft returns to 2D
- Three.js still initializes at non-zero canvas size
- mobile control grouping hides inactive groups correctly
- 390px viewport remains free of horizontal overflow

Slice C remains separate for technical and accessibility cleanup, including the secondary DirectionalLight initialization defect identified during the audit.

## Slice C implementation status

Implemented on the same Stage 9 MADORI branch:

- fixed the secondary Three.js DirectionalLight so the configured light instance is the one added to the scene
- revoke the temporary Blob URL after JSON export
- validate loaded JSON structure before mutating editor state
- keep the current layout intact when invalid JSON is rejected
- add polite live status announcements for save, load, reset, clear, and PNG export actions
- synchronize `aria-pressed` for 2D tools and mobile control groups
- synchronize `aria-expanded` for the mobile drawer and custom-type forms
- make the mobile drawer handle keyboard-operable
- connect 3D control labels with their form inputs and label the 3D canvas
- add `tools/check_madori_contract.py` and run it from the normal public validation workflow

Runtime regression verification:

- JSON Blob URL creation/revocation: 1 / 1, same URL
- valid JSON restores editor state; invalid JSON is rejected without replacing the last valid state
- demo reset still returns 6 rooms / 4 furniture / 0 walls
- ArrowRight and ArrowLeft still switch 2D / 3D with focus transfer
- directional lights render at `(300, 400, 200)` and `(-200, 200, -200)`
- mobile accessibility state remains synchronized with the visible drawer/form/tool state
