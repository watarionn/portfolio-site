# Phase 3.9 CP-D4D - Master World Data Contract

Updated: 2026-09-19
Status: PASS / isolated data baseline

Machine-readable baseline:
- `prototype/phase3-9-world-data/master-world.v1.json`

## Contract

The file contains exactly 192 addressable cells (A01-P12).

Each cell carries:
- `terrain`: coarse zoning only,
- `state`: PUBLISHED / NEAR_FRONTIER / UNPUBLISHED / UNRESOLVED,
- `confidence`: LOCKED / MEDIUM / LOW,
- current district binding only when published.

Current bindings:
- H05 -> observatory
- G06 -> archive
- I06 -> workshop
- H07 -> waterside

The data file is intentionally isolated under `prototype/`. Production runtime must not import it during CP-D4D.

## Invariants

1. Grid is 16 x 12 and contains 192 unique addresses.
2. Every address from A01 through P12 exists exactly once.
3. Exactly four cells are PUBLISHED at W0.
4. Published district IDs are unique.
5. Each published district's `homeCell` agrees with its cell binding.
6. Unpublished/unresolved cells contain no district binding.
7. Terrain zoning remains coarse and does not preassign future district identity.
8. Visitor-facing grid visibility remains false.

## State meaning

PUBLISHED:
A current district exists and may become a navigation target.

NEAR_FRONTIER:
No district exists. Geography is close enough to W0 that its broad continuity matters.

UNPUBLISHED:
No district exists. Coarse terrain is a planning hint.

UNRESOLVED:
No district exists and even coarse geography is deliberately flexible.

## Migration rule

The v1 file becomes production-eligible only after a later migration checkpoint validates:
- schema,
- all 192 addresses,
- current canonical district membership,
- runtime camera mapping,
- interaction hit areas,
- rollback behavior.

Until then it is design/prototype data only.

## Result

CP-D4D: PASS.

Next checkpoint: CP-D4E Data Validation + Coordinate Projection.
Add deterministic validation and define how a logical cell/address maps into normalized visitor-world coordinates without making the grid visible.
