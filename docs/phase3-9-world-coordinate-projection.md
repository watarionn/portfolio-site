# Phase 3.9 CP-D4E - Data Validation + Coordinate Projection

Updated: 2026-09-19
Status: PASS / isolated prototype contract

Files:
- `prototype/phase3-9-world-data/master-world.v1.json`
- `prototype/phase3-9-world-data/world-projection.v1.json`
- `prototype/phase3-9-world-data/validate-master-world.js`

## Validation contract

The validator checks:
- exact 16 x 12 dimensions,
- exactly 192 cells,
- complete A01-P12 address coverage,
- exactly four W0 PUBLISHED cells,
- unique district IDs,
- district home-cell agreement,
- no district binding on unpublished cells.

It exits non-zero on failure.

## Projection contract

Logical addresses project into normalized Visitor World coordinates.

Origin: top-left.
- x = 0 west edge, x = 1 east edge.
- y = 0 north edge, y = 1 south edge.

Cell-center projection:
- x = (columnIndex + 0.5 + offsetX) / 16
- y = (rowIndex + 0.5 + offsetY) / 12

Offsets are local within the home cell and clamped to -0.49..+0.49. They allow district focal points to avoid exact cell centers without changing stable addresses.

W0 visual offsets:
- Observatory H05: (+0.16, -0.12)
- Archive G06: (-0.18, +0.08)
- Workshop I06: (+0.18, -0.04)
- Waterside H07: (+0.14, +0.14)

The normalized coordinate is an interaction/composition anchor, not a visible grid point.

## Responsive rule

Desktop/tablet/mobile consume the same normalized world coordinates. Responsive behavior changes camera center/zoom, never district logical coordinates.

## Isolation

No production runtime imports these files during CP-D4E. No feature flag changes.

## Result

CP-D4E: PASS.

Next checkpoint: CP-D4F Projection Visual QA.
Render deterministic district anchors and focal envelopes over the exact Master World and verify that projected W0 positions match the intended geography before any production-art binding.
