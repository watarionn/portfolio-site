# Phase 3.9 CP-D4F - Projection Visual QA

Updated: 2026-09-19
Status: PASS / projection geometry verified

## Deterministic W0 anchors

Using the CP-D4E normalized projection formula and locked within-cell offsets:

- Observatory / H05 -> x 0.47875, y 0.36500
- Archive / G06 -> x 0.39500, y 0.46500
- Workshop / I06 -> x 0.54250, y 0.45500
- Waterside / H07 -> x 0.47750, y 0.55333

Rounded debug display may show three decimals.

## Visual audit

PASS:
- Observatory anchor remains north of the cluster and inside its highland-support region.
- Archive anchor is biased west within G06 and remains on mainland/lowland context.
- Workshop anchor is biased east within I06 and remains on eastern mainland context.
- Waterside anchor is biased south-east within H07 and remains compatible with the inlet/coastal transition.
- The four anchors do not form exact cell-center symmetry.
- Focal envelopes remain local and do not require moving any stable home address.
- Projection does not require visitor-visible grid lines.

## Evidence policy

The visual QA overlay is a generated debug artifact, not production art. Its purpose is to compare exact normalized anchors against the Master World zoning/terrain reference.

## Result

CP-D4F: PASS.

Next checkpoint: CP-D4G Visitor Crop + Camera Anchor Contract.
Define deterministic W0 desktop/tablet/mobile entry camera centers, zoom/crop policy, and pan bounds from the published anchor envelope plus frontier context. Do not bind final production art or enable the hierarchy feature flag yet.
