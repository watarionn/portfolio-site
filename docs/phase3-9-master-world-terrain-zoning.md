# Phase 3.9 CP-D4B - Master World Terrain Zoning

Updated: 2026-09-19
Status: PASS / zoning baseline
Grid: 16 x 12 (A-P / 01-12)
Rule: zoning is coarse world planning, not final biome or district assignment.

## Zoning vocabulary

- SEA: open water; offshore district remains possible where later justified.
- COAST: shoreline / island / coastal transition.
- LOWLAND: flexible mainland terrain; safest generic future district substrate.
- FOREST: wooded mainland / reserve.
- HIGHLAND: ridge, hill, mountain-support terrain.
- COLD: cold/high-altitude far-world reserve.
- DRY: dry/rocky far-world reserve.
- FRONTIER: deliberately unresolved. Future geography may be redrawn before publication.
- PUBLISHED_*: current four district home cells; local semantics are locked.

The zoning map intentionally leaves many cells FRONTIER. A cell's zone is not a promise that a future district must use that theme.

## 16 x 12 zoning matrix

Columns A-P, rows north-to-south.

| Row | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | FRONTIER | SEA | SEA | SEA | FRONTIER | COLD | COLD | SEA | COLD | COLD | COLD | COLD | SEA | SEA | FRONTIER | FRONTIER |
| 02 | HIGHLAND | HIGHLAND | COAST | SEA | COAST | SEA | COAST | SEA | SEA | SEA | COLD | COLD | SEA | COAST | COAST | FRONTIER |
| 03 | FOREST | LOWLAND | LOWLAND | COAST | LOWLAND | COAST | SEA | SEA | COAST | LOWLAND | LOWLAND | COAST | SEA | SEA | COAST | FRONTIER |
| 04 | FOREST | FOREST | LOWLAND | LOWLAND | LOWLAND | HIGHLAND | HIGHLAND | HIGHLAND | LOWLAND | LOWLAND | FOREST | COAST | SEA | COAST | LOWLAND | FRONTIER |
| 05 | COAST | FOREST | LOWLAND | LOWLAND | FOREST | LOWLAND | HIGHLAND | PUBLISHED_OBSERVATORY | HIGHLAND | COAST | SEA | SEA | COAST | LOWLAND | DRY | FRONTIER |
| 06 | SEA | COAST | LOWLAND | LOWLAND | FOREST | LOWLAND | PUBLISHED_ARCHIVE | LOWLAND | PUBLISHED_WORKSHOP | COAST | SEA | COAST | LOWLAND | DRY | DRY | FRONTIER |
| 07 | COAST | DRY | DRY | LOWLAND | LOWLAND | COAST | LOWLAND | PUBLISHED_WATERSIDE | COAST | SEA | COAST | LOWLAND | DRY | DRY | DRY | FRONTIER |
| 08 | COAST | DRY | DRY | DRY | COAST | SEA | COAST | LOWLAND | COAST | SEA | COAST | HIGHLAND | COAST | SEA | FRONTIER | FRONTIER |
| 09 | SEA | COAST | SEA | COAST | SEA | COAST | LOWLAND | COAST | SEA | SEA | COAST | LOWLAND | SEA | SEA | FRONTIER | FRONTIER |
| 10 | FRONTIER | LOWLAND | LOWLAND | COAST | SEA | COAST | SEA | SEA | SEA | COAST | LOWLAND | HIGHLAND | HIGHLAND | COAST | FRONTIER | FRONTIER |
| 11 | FRONTIER | HIGHLAND | HIGHLAND | COAST | SEA | COAST | SEA | SEA | SEA | COAST | COAST | HIGHLAND | HIGHLAND | FRONTIER | FRONTIER | FRONTIER |
| 12 | FRONTIER | FRONTIER | COAST | SEA | SEA | FRONTIER | FRONTIER | SEA | SEA | FRONTIER | FRONTIER | FRONTIER | FRONTIER | FRONTIER | FRONTIER | FRONTIER |

## Confidence bands

### Band 1 - Published core / high confidence
H05, G06, I06, H07 and their immediate connective terrain.

These cells must preserve:
- Observatory highland relation,
- Archive inland/older mainland relation,
- Workshop eastern mainland relation,
- Waterside inlet/coastal relation.

### Band 2 - Near frontier / medium confidence
Approx. F04-J08.

Purpose:
- preserve F-A inland growth,
- preserve F-B coastal growth,
- preserve F-C offshore/channel growth,
- support short-pan reveal around W0.

These zones may change in detail but should keep the three expansion-front families viable.

### Band 3 - Far world / low confidence
Everything outside the near frontier.

Most far-world assignments are mood/composition hints only. FRONTIER cells are explicitly unresolved. Even non-FRONTIER far cells may be repainted before their first publication if continuity with already-published geography is maintained.

## Expansion front compatibility

F-A Inland:
- preferred substrate: LOWLAND / FOREST / HIGHLAND transitions west and northwest of core.
- must remain land-connected.

F-B Coastal:
- preferred substrate: LOWLAND / COAST / SEA transitions south and southeast.
- should retain an inlet/coast continuation.

F-C Offshore:
- preferred substrate: COAST / SEA east of core.
- island/channel evidence may remain partially veiled until needed.

## Change policy

Before a cell is published:
- terrain zoning may be revised,
- FRONTIER may become any terrain family,
- nearby coastlines/ridges may be reshaped.

After a cell is published:
- its district home address does not move,
- large terrain changes require compatibility review,
- neighboring unpublished cells remain flexible.

This prevents the 192-cell map from becoming a premature content contract.

## Result

CP-D4B: PASS.

The Master World now has a coarse terrain logic while retaining substantial unresolved space.

Next checkpoint: CP-D4C Exact Zoning Overlay.
Render the zoning matrix as a deterministic design/debug overlay on the exact 16x12 Master World. The overlay must use programmatic geometry, not generated grid positions. Keep a clean visitor-art concept separate from the debug map.
