# Phase 3.9 CP-D4C - Master Map / Visitor World Separation

Updated: 2026-09-19
Status: PASS / architecture lock candidate
Depends on: CP-D4B terrain zoning

## Purpose

Separate exact world-management data from visitor-facing illustrated geography.

The 16x12 Master Grid is a deterministic authoring/debug system.
The Visitor World is a continuous illustrated surface.
They share district addresses, but they are not the same visual artifact.

## Layer A - Master Map (authoring/debug only)

Responsibilities:
- canonical 16x12 coordinate system,
- one stable district home per cell,
- publication state,
- coarse terrain zone,
- expansion-front metadata,
- confidence / mutability state,
- optional authoring notes.

Never shown to normal visitors:
- grid lines,
- cell IDs,
- terrain-zone abbreviations,
- future district placeholders,
- unpublished cell hitboxes,
- debug front labels.

Canonical current homes:
- H05 Observatory Hill
- G06 Archive Street
- I06 Workshop Alley
- H07 Waterside Play

## Layer B - Visitor World (public presentation)

Responsibilities:
- continuous illustrated land/water/highland surface,
- published district focal areas,
- scenic connective routes,
- accepted building art,
- cloud/frontier veil,
- camera framing and pan,
- interaction affordances only for published content.

Visitor World must not render the Master Grid.

A district home address is translated to a visual focal envelope inside/around that logical cell. The focal point may be offset so the composition does not reveal the grid.

## Layer C - Runtime interaction overlay

Runtime UI sits above Visitor World and below/around building previews.

Responsibilities:
- district clickable regions,
- keyboard/focus targets,
- labels when needed,
- current publication state,
- camera destinations,
- building/project interaction.

Hit areas are derived from data and authored geometry. They are not baked into the background illustration.

## Canonical data shape

Recommended conceptual record:

```json
{
  "world": {
    "columns": 16,
    "rows": 12,
    "coordinateVersion": 1
  },
  "cells": {
    "H05": {
      "state": "published",
      "districtId": "observatory",
      "terrain": "highland",
      "confidence": "locked",
      "front": null
    }
  },
  "districts": {
    "observatory": {
      "homeCell": "H05",
      "visualOffset": {"x": 0.16, "y": -0.12},
      "cameraAnchor": {"x": 0.56, "y": 0.30}
    }
  }
}
```

Exact runtime field names can change during implementation. The semantic separation is locked.

## Publication states

Allowed authoring states:
- PUBLISHED: visitor-visible district exists.
- NEAR_FRONTIER: geography may be hinted/revealed, no district interaction.
- UNPUBLISHED: no visitor-facing district.
- UNRESOLVED: far-world geography intentionally mutable.

Only PUBLISHED cells create district navigation targets.

## Art/data relationship

The world illustration may cross any cell boundary.

Data determines:
- which district exists,
- where its stable logical home is,
- whether it is interactive,
- camera/navigation semantics.

Art determines:
- exact coastline,
- ridge shape,
- vegetation,
- scenic roads,
- atmospheric veil,
- non-interactive environmental details.

Neither layer should silently overwrite the other's responsibility.

## Expansion transaction

Publishing a new district should be treated as a small transaction:

1. choose an unpublished home cell compatible with current geography,
2. lock its district ID + home cell,
3. refine local terrain if needed,
4. reveal only the required visitor-art neighborhood,
5. add interaction geometry and camera anchor,
6. add district/project data,
7. QA desktop/mobile adjacency and navigation,
8. publish without moving existing district homes.

A project added to an existing district skips world-cell publication.

## Asset policy

Keep separate artifacts for:
- clean Visitor World background,
- optional frontier/cloud overlay,
- accepted project/building assets,
- exact debug grid overlay,
- terrain zoning/debug visualization.

Do not permanently flatten debug information into visitor art.

## Responsive policy

Desktop/tablet/mobile use the same logical world and visitor artwork.

They may differ in:
- initial camera center,
- zoom,
- label density,
- cloud crop,
- pan allowance.

They must not use different district coordinates or separate mobile geography.

## Debug-mode contract

A future internal/debug mode may toggle:
- 16x12 grid,
- cell IDs,
- zoning,
- publication states,
- focal envelopes,
- camera anchors.

Default public runtime keeps all debug layers off.

## Acceptance audit

PASS if:
- exact 16x12 coordinates remain deterministic,
- Visitor World contains no required grid visuals,
- current four district addresses are unchanged,
- future cells can be revised before publication,
- hitboxes/labels are not baked into art,
- mobile and desktop share one world coordinate model,
- publishing a district never requires moving an existing district.

## Result

CP-D4C: PASS.

The Master Grid is now formally an internal world-management layer, while the Visitor World is a separate continuous presentation layer.

Next checkpoint: CP-D4D Master World Data Contract.
Create a machine-readable 16x12 world-data baseline for all 192 cells, including current publication state and coarse terrain zoning. Keep it isolated from production runtime until migration review.
