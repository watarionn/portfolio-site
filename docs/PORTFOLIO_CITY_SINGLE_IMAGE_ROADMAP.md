# Portfolio City Single-Image Migration Roadmap

Updated: 2026-09-30  
Status: Active roadmap / implementation sequence  
Scope: Portfolio City World Map + District View architecture

## 0. Purpose

Portfolio City is moving toward one common presentation principle:

> **Finished illustration + semantic interaction layer**

The World Map and District Views should look like continuous illustrated places. Runtime interaction should be defined separately from the visible pixels.

This roadmap replaces the assumption that the current tile-based World runtime and independently composited district-building assets must be completed simply because those approaches already exist.

Existing work remains historical evidence and rollback material until explicit retirement.

---

## 1. Source-of-truth and execution policy

Portfolio City follows the cross-project external-first rule.

### Canonical locations

**GitHub**
- code
- specifications
- design documents
- schemas
- manifests
- automation
- reusable tooling
- runtime metadata

**Google Drive**
- accepted artwork
- source images
- Master World authoring images
- large visual working assets
- visual references
- high-resolution masters

**Production hosting**
- only assets required by the public site

**Local PC**
- temporary processing
- browser QA
- local-only execution
- hardware-dependent work

Local files are not canonical merely because they are convenient.

### Tool priority

1. GitHub / Google Drive direct connector or API
2. existing project automation
3. new reusable automation
4. RDC only when local execution is genuinely required

Repeated RDC operations are a signal to create a reusable Production Asset.

---

## 2. Architectural direction

### World Map

Target:

```text
Single continuous World image
+ bounded camera viewport
+ atmospheric cloud / frontier layer
+ semantic SVG district hotspots
+ district labels / focus UI
```

### District View

Target:

```text
Single finished district scene
+ semantic SVG project-building hotspots
+ project preview / navigation UI
```

The logical grid and project metadata remain data structures. They do not need to dictate how visible artwork is split.

---

# Phase 0 - Canonical-state cleanup

## Goal

Make the new direction understandable and reproducible before additional art production.

## Work

- keep existing tile and layered-building documents as historical records
- add the Single-Image roadmap and runtime design to GitHub
- add the new Portfolio Storybook City Style Bible to GitHub
- treat Google Drive as canonical for accepted visual masters
- classify current local experimental files as:
  - discardable temporary QA
  - reusable prototype evidence
  - candidate Production Asset
- avoid promoting local-only files into canonical project state
- identify old documents whose implementation assumptions are superseded, without rewriting history

## Exit criteria

- a future contributor can understand why the architecture changed
- canonical documents exist in GitHub
- canonical visual sources are identifiable in Google Drive
- no important decision exists only in a local worktree

---

# Phase 1 - World Single-Image Prototype S1

**Status: PASS / 2026-09-30**  
Evidence: `docs/phase3-9-world-single-image-s1.md`

## Goal

Prove the viewing architecture using artwork already owned.

Do **not** generate a replacement World merely to test runtime architecture.

## Build

```text
existing Master World
+ single browser image
+ camera viewport
+ 4 district hotspots
+ cloud / veil prototype
+ pan
+ district selection
```

Current district homes remain fixed:

- Observatory Hill: H05
- Archive Street: G06
- Workshop Alley: I06
- Waterside Play: H07

## Required behavior

- initial view shows current published cluster, not entire world
- responsive framing shares one world coordinate system
- desktop pointer pan
- mobile touch pan
- keyboard-accessible district targets
- district selection works independently from image slicing
- return path can restore saved World camera

## Exit criteria

S1 is a functional isolated prototype with no production cutover.

---

# Phase 2 - Single-Image vs Tile measurement

## Goal

Choose architecture from evidence rather than intuition.

## Compare

Current tile runtime vs Single-Image prototype.

Measure:

- transferred bytes
- image request count
- image decode time
- interaction-ready time
- decoded bitmap memory
- DOM complexity
- pan smoothness
- viewport resize behavior
- mobile behavior

Test at minimum:

- 1440px desktop
- 820px tablet
- 390px mobile

## Responsive image candidates

Initial candidates:

- 4096 x 3072
- 3072 x 2304
- 2048 x 1536

The 8192 x 6144 authoring Master is not automatically a runtime download.

## Decision rule

If one-image delivery is too heavy, reduce the runtime derivative first.

If the future world eventually exceeds practical one-image delivery limits, internal delivery may become hybrid while preserving the **single continuous world interaction model**.

The visitor experience must not become tile-shaped merely because asset delivery is tiled internally.

---

# Phase 3 - World Reveal / Cloud prototype

## Goal

Turn publication state into atmosphere rather than UI locking.

## Existing states

- PUBLISHED
- NEAR_FRONTIER
- UNPUBLISHED
- UNRESOLVED

## Presentation

Clouds / haze / sea mist / distant ridges are independent from the World base image.

Cloud geometry must:

- cross logical cell boundaries
- avoid checkerboard fog
- avoid rectangular reveal edges
- keep unpublished geography atmospheric rather than disabled
- allow future districts to appear by locally clearing or reshaping the veil

## New-district reveal concept

```text
lock home cell
-> refine local Master World
-> export updated runtime derivative
-> update hotspot
-> update reveal mask
-> expand camera bounds only if needed
```

The visitor should perceive "the world opened up", not "a new tile appeared".

---

# Phase 4 - District Single-Scene formalization

## Goal

Apply the same architectural principle to District Views.

The Waterside and Observatory prototypes established that a finished scene can remain one image while buildings stay individually interactive through semantic hotspots.

## Target structure

```text
district-scene.webp
district-hotspots.json / svg
district metadata
project preview UI
```

## Principle

Buildings are separated **semantically**, not necessarily visually.

A project building does not need to exist as an independent browser image merely to be clickable.

## Benefits

- perspective cannot drift between background and building
- lighting cannot drift between separately generated layers
- color treatment remains coherent
- no visible cutout edge
- hover / focus can use outline or clipped same-image effects
- composition can be authored as an actual townscape

## Exit criteria

At least one production-quality district scene passes:

- visual review
- hotspot alignment
- desktop/mobile QA
- keyboard access
- project preview
- canonical work navigation

Waterside Play is the preferred first art-quality candidate.

---

# Phase 5 - Production automation

## Goal

Remove repeated manual asset handling.

Create reusable GitHub-hosted tooling, for example:

```text
tools/
  portfolio_asset_pipeline.py
```

Possible responsibilities:

- fetch or accept canonical Drive asset input
- verify dimensions / format
- generate WebP derivatives
- generate AVIF derivatives where useful
- estimate decoded memory
- validate file size
- build/update runtime manifest
- verify source/runtime dimensions
- prepare deployment package
- generate QA summary

A separate hotspot helper may support:

- canvas size registration
- polygon drawing/import
- project/district ID binding
- JSON/SVG export
- coordinate validation

## Rule

If the same RDC sequence is likely to occur again, prefer converting it into automation.

RDC may still execute a local script when browser/GPU/local filesystem access is necessary. It should not become the workflow itself.

---

# Phase 6 - Production art

## Goal

Replace technical proof art with accepted final scenes.

Recommended order:

1. Waterside Play
2. Archive Street
3. Workshop Alley
4. Observatory Hill
5. Master World refinement

Reason:

Waterside already has strong canonical visual material, known project placement, and a successful Single-Scene technical prototype.

## Art standard

All new production imagery follows:

`docs/PORTFOLIO_STORYBOOK_CITY_STYLE_BIBLE.md`

Do not use a proprietary franchise style name as a generation target.

Use the project's own visual grammar.

---

# Phase 7 - Production integration and cutover

## Goal

Adopt the new runtime only after visual and technical evidence exists.

## Migration

```text
Old World tile runtime
    -> Single-Image World runtime

Old layered District runtime
    -> Single-Scene District runtime
```

## Gate

Before cutover, verify:

- World -> District navigation
- District -> project preview
- project -> canonical Work route
- Return to World camera restoration
- desktop pan
- mobile pan
- keyboard navigation
- focus restoration
- reduced motion
- responsive image selection
- no document overflow
- no hotspot drift
- acceptable memory and decode behavior

Keep old runtime available through the cutover checkpoint.

Do not delete rollback assets in the cutover commit.

---

# Work that should pause now

Until the Single-Image decision is closed, do not invest heavily in:

- producing the remaining Waterside filler buildings for the old six-slot layering workflow
- aligning six independently generated buildings to one background
- polishing all 192 runtime tiles solely because they exist
- creating cloud behavior tied to tile boundaries
- generating a new Master World merely to prove the viewer architecture
- rebuilding accepted artwork before the runtime question is settled

These tasks may become obsolete if the new architecture is adopted.

---

# Common architecture after adoption

The desired mental model is:

```text
WORLD
finished world illustration
+ semantic district layer
+ camera
+ atmosphere

        ↓

DISTRICT
finished district illustration
+ semantic project layer

        ↓

PROJECT
preview
+ canonical Work route
```

This is simpler than maintaining different visual architectures for World and District levels.

---

# Decision philosophy

The central shift is:

> **Do not split visible art merely because interaction needs semantic separation.**

Use pixels for appearance.

Use data/SVG for meaning.

Use the camera for framing.

Use atmosphere for world reveal.

Use canonical project metadata for navigation.

---

# Next checkpoint

**World Single-Image Prototype S1 PASS -> Phase 2 Single-Image vs Tile measurement**

S1 proved the viewing architecture against the existing real Master World. Continue with measured comparison before any production cutover or new World art production.
