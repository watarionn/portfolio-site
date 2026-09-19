# Phase 3.9 CP-D4A - Exact Master World Coordinate Overlay

Updated: 2026-09-19
Status: exact-coordinate design pass complete
Scope: convert the generated Master World concept into an exact 16 x 12 planning surface

## Why this pass exists

Generative map art is composition evidence, not a trustworthy coordinate system. The Master World therefore has two layers:

1. Art / geography concept
2. Exact logical 16 x 12 coordinate overlay

The logical overlay is canonical. Art may be repainted beneath it without moving published district addresses.

## Canonical coordinate system

- Columns: A-P, west to east
- Rows: 01-12, north to south
- Total: 192 cells
- One cell = one district home address
- Grid is design/debug-only and never visitor-visible

Current published homes:
- H05 Observatory Hill
- G06 Archive Street
- I06 Workshop Alley
- H07 Waterside Play

## Overlay artifact

A pixel-exact 16 x 12 overlay was generated over the first Master World art concept.

Artifact name:
`portfolio_city_master_world_16x12_exact_overlay.png`

The overlay:
- divides the map field into exactly 16 equal columns and 12 equal rows,
- prints every cell address,
- highlights H05 / G06 / I06 / H07 explicitly,
- exists for planning/debug only.

## Important interpretation

The underlying generated terrain does not become canonical merely because the grid is exact.

At this checkpoint:
- coordinates are authoritative,
- current district addresses are authoritative,
- terrain under each cell is still provisional,
- future district cells are unassigned,
- the final visitor map will remove all grid lines and cell labels.

This prevents generated art from accidentally redefining the architecture.

## Next checkpoint

CP-D4B - Master World Terrain Zoning.

Classify all 192 cells at a coarse level without assigning future district identities. Use only broad terrain/zoning categories such as:
- open sea,
- island/coast,
- mainland lowland,
- forest,
- highland/mountain,
- cold/high latitude,
- dry/arid,
- frontier/undetermined.

The purpose is not to fill every cell with content. It is to make the Master World expandable while preserving large undetermined regions.

Do not generate final district art, assign speculative future projects, flip the production feature flag, merge, or deploy.
